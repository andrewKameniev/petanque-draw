<template>
    <div class="tir-plist">
        <div v-if="isTwoRoundSystem && expanded === null && bracketTabs.length > 1" class="tir-plist__bracket-switcher">
            <button v-for="tab in bracketTabs" :key="tab.key"
                    class="tir-plist__bracket-btn"
                    :class="{'tir-plist__bracket-btn--active': activeBracket === tab.key}"
                    @click="activeBracket = tab.key">
                {{ tab.label }}
            </button>
        </div>
        <!-- Search -->
        <input v-if="expanded === null && rankedParticipants.length > 5" class="tir-plist__search" type="text" v-model="searchQuery" :placeholder="$t('teams.searchTeam')"/>
        <!-- Participant list -->
        <div v-if="expanded === null" class="tir-plist__select">
            <div v-for="(participant, index) in filteredParticipants" :key="participant.id || index" class="tir-plist__row" @click="selectParticipant(participant, index)">
                <span class="tir-plist__rank">{{ index + 1 }}</span>
                <div class="tir-plist__info">
                    <span class="tir-plist__name">{{ participant.name }}</span>
                    <span v-if="getClub(participant)" class="tir-plist__club">{{ getClub(participant) }}</span>
                    <div class="tir-plist__progress">
                        <div class="tir-plist__progress-segments">
                            <div v-for="i in 5" :key="i" class="tir-plist__progress-segment">
                                <div class="tir-plist__progress-fill" :class="{'tir-plist__progress-fill--complete': isComplete(participant)}" :style="{width: getAtelierPercent(participant, i - 1) + '%'}"></div>
                            </div>
                        </div>
                        <span class="tir-plist__progress-text">{{ getThrows(participant) }}/{{ totalThrows }}</span>
                    </div>
                </div>
                <span class="tir-plist__score"><strong>{{ getTotal(participant) }}</strong>/{{ maxTotal }}</span>
                <span class="tir-plist__status" :class="getStatusClass(participant)">
                    <CheckCircle v-if="isComplete(participant)" :size="16"/>
                    <AlertCircle v-else-if="getThrows(participant) > 0" :size="16"/>
                    <Circle v-else :size="16"/>
                </span>
            </div>
        </div>

        <!-- Expanded participant details -->
        <TirParticipantView v-else
            :participant="expandedParticipant"
            :ateliers="atelierObjects"
            :distances="activeDistances"
            :scoresKey="activeScoresKey"
            :readOnly="readOnly"
            @back="expanded = null"
            @update="$emit('update')"
            @next="goToNext"/>
    </div>
</template>

<script>
import {CheckCircle, AlertCircle, Circle} from "lucide-vue-next";
import TirParticipantView from "./TirParticipantView.vue";
import {SCORING, ATELIER_KEYS, findPlayoffMatchForParticipant, getMatchPlayerThrows} from '@/services/tir';

export default {
    name: 'TirParticipantsList',
    components: {CheckCircle, AlertCircle, Circle, TirParticipantView},
    props: {
        tournament: {type: Object, required: true},
        readOnly: {type: Boolean, default: false}
    },
    emits: ['select', 'update', 'back'],
    data() {
        return {
            expanded: null,
            activeBracket: 'r2',
            searchQuery: ''
        }
    },
    created() {
        if (!this.isTwoRoundSystem) {
            this.activeBracket = 'r1';
        } else if (this.tournament.tirPlayoff) {
            const tabs = this.bracketTabs;
            if (tabs.length) this.activeBracket = tabs[tabs.length - 1].key;
        } else if (this.currentRound === 2) {
            this.activeBracket = 'r2';
        } else if (this.tiebreakerCount > 0) {
            this.activeBracket = `ex${this.tiebreakerCount}`;
        } else {
            this.activeBracket = 'r1';
        }
    },
    computed: {
        isTwoRoundSystem() {
            return this.tournament.tirConfig?.rounds === 2;
        },
        tiebreakerCount() {
            return this.tournament.tirTiebreakerCount || 0;
        },
        currentRound() {
            return this.tournament.tirRound || 1;
        },
        isJunior() {
            return !!this.tournament.tirConfig?.junior;
        },
        distances() {
            return this.isJunior ? [6, 7, 8] : [6, 7, 8, 9];
        },
        activeDistances() {
            if (this.isTiebreakerTab) return [7];
            return this.distances;
        },
        totalThrows() {
            return 5 * this.activeDistances.length;
        },
        maxAtelierScore() {
            return this.activeDistances.length * SCORING.carreau;
        },
        maxTotal() {
            return 5 * this.maxAtelierScore;
        },
        atelierObjects() {
            return ATELIER_KEYS.map(key => ({
                name: this.$t(`tir.${key}`),
                description: this.$t(`tir.${key}Desc`)
            }));
        },
        displayRound() {
            if (this.activeBracket === 'r1') return 1;
            if (this.activeBracket === 'r2') return 2;
            return this.currentRound;
        },
        activeScoresKey() {
            if (this.activeBracket.startsWith('ex')) {
                const round = parseInt(this.activeBracket.replace('ex', ''));
                return `tiebreaker_${round}`;
            }
            return this.displayRound === 2 ? 'scores2' : 'scores';
        },
        bracketTabs() {
            const tabs = [];
            if (!this.isTwoRoundSystem) return tabs;
            tabs.push({key: 'r1', label: 'R1'});
            for (let i = 1; i <= this.tiebreakerCount; i++) {
                tabs.push({key: `ex${i}`, label: `EX${i}`});
            }
            if (this.currentRound >= 2) tabs.push({key: 'r2', label: 'R2'});
            if (this.tournament.tirPlayoff) {
                const playoff = this.tournament.tirPlayoff;
                if (playoff.rounds?.[0]?.matches?.some(m => m.score1 != null)) {
                    tabs.push({key: 'qf', label: '1/4'});
                }
                const sfRound = playoff.rounds?.find(r => r.matches.length === 2);
                if (sfRound?.matches.some(m => m.score1 != null)) {
                    tabs.push({key: 'sf', label: '1/2'});
                }
                const finalRound = playoff.rounds?.find(r => r.matches.length === 1);
                if (finalRound?.matches[0]?.score1 != null || playoff.final?.score1 != null) {
                    tabs.push({key: 'final', label: this.$t('games.final')});
                }
            }
            return tabs;
        },
        participants() {
            return this.tournament.tirParticipants || [];
        },
        isTiebreakerTab() {
            return this.activeBracket.startsWith('ex');
        },
        tiebreakerTabThrows() {
            return 5;
        },
        tiebreakerTabMaxScore() {
            return 5 * SCORING.carreau;
        },
        scoringParticipants() {
            if (this.tournament.tirPlayoff && ['qf', 'sf', 'final'].includes(this.activeBracket)) {
                return this.getPlayoffBracketParticipants();
            }
            if (this.isTiebreakerTab) {
                const tbKey = this.activeScoresKey;
                return this.participants.filter(p => p[tbKey] && Object.keys(p[tbKey]).length > 0);
            }
            if (this.displayRound === 2) {
                const r2Ids = this.tournament.tirR2Participants || [];
                return this.participants.filter(p => r2Ids.includes(p.id));
            }
            return this.participants;
        },
        rankedParticipants() {
            return [...this.scoringParticipants].sort((a, b) => {
                const aThrows = this.getThrows(a);
                const bThrows = this.getThrows(b);
                const aComplete = aThrows >= this.totalThrows;
                const bComplete = bThrows >= this.totalThrows;
                const aInProgress = aThrows > 0 && !aComplete;
                const bInProgress = bThrows > 0 && !bComplete;

                if (aInProgress && !bInProgress) return -1;
                if (!aInProgress && bInProgress) return 1;
                if (aInProgress && bInProgress) return bThrows - aThrows || this.getTotal(b) - this.getTotal(a);

                if (aComplete && !bComplete) return -1;
                if (!aComplete && bComplete) return 1;
                if (aComplete && bComplete) return this.getTotal(b) - this.getTotal(a) || this.getCarreauCount(b) - this.getCarreauCount(a);

                return a.name.localeCompare(b.name);
            });
        },
        filteredParticipants() {
            if (!this.searchQuery) return this.rankedParticipants;
            const q = this.searchQuery.toLowerCase();
            return this.rankedParticipants.filter(p => p.name.toLowerCase().includes(q) || (p.city && p.city.toLowerCase().includes(q)) || this.getClub(p).toLowerCase().includes(q));
        },
        expandedParticipant() {
            if (this.expanded === null) return null;
            return this.rankedParticipants[this.expanded];
        }
    },
    methods: {
        selectParticipant(participant, index) {
            this.expanded = index;
            this.$emit('select', participant);
        },
        expandById(id) {
            const index = this.rankedParticipants.findIndex(p => p.id === id);
            if (index !== -1) this.expanded = index;
        },
        goToNext() {
            if (this.expanded !== null && this.expanded < this.rankedParticipants.length - 1) {
                this.expanded++;
            }
        },
        getPlayoffBracketParticipants() {
            const playoff = this.tournament.tirPlayoff;
            if (!playoff?.rounds) return [];
            let matches = [];
            if (this.activeBracket === 'qf') {
                matches = playoff.rounds[0]?.matches || [];
            } else if (this.activeBracket === 'sf') {
                const sfRound = playoff.rounds.find(r => r.matches.length === 2);
                matches = sfRound?.matches || [];
            } else if (this.activeBracket === 'final') {
                const finalRound = playoff.rounds.find(r => r.matches.length === 1);
                matches = finalRound?.matches || (playoff.final ? [playoff.final] : []);
            }
            const names = new Set();
            matches.forEach(m => {
                if (m.player1) names.add(m.player1);
                if (m.player2) names.add(m.player2);
            });
            return this.participants.filter(p => names.has(p.name));
        },
        getPlayoffMatches() {
            const playoff = this.tournament.tirPlayoff;
            if (!playoff?.rounds) return [];
            if (this.activeBracket === 'qf') {
                return playoff.rounds[0]?.matches || [];
            } else if (this.activeBracket === 'sf') {
                const sfRound = playoff.rounds.find(r => r.matches.length === 2);
                return sfRound?.matches || [];
            } else if (this.activeBracket === 'final') {
                const finalRound = playoff.rounds.find(r => r.matches.length === 1);
                return finalRound?.matches || (playoff.final ? [playoff.final] : []);
            }
            return [];
        },
        getPlayoffBracketScore(participant) {
            const matches = this.getPlayoffMatches();
            for (const m of matches) {
                if (m.player1 === participant.name) return m.score1 || 0;
                if (m.player2 === participant.name) return m.score2 || 0;
            }
            return 0;
        },
        getTotal(participant) {
            if (['qf', 'sf', 'final'].includes(this.activeBracket)) {
                return this.getPlayoffBracketScore(participant);
            }
            const scores = participant[this.activeScoresKey];
            if (!scores) return 0;
            let total = 0;
            Object.values(scores).forEach(atelier => {
                Object.values(atelier).forEach(val => { total += SCORING[val] || 0; });
            });
            return total;
        },
        getCarreauCount(participant) {
            const scores = participant[this.activeScoresKey];
            if (!scores) return 0;
            let count = 0;
            Object.values(scores).forEach(atelier => {
                Object.values(atelier).forEach(val => { if (val === 'carreau') count++; });
            });
            return count;
        },
        getThrows(participant) {
            if (['qf', 'sf', 'final'].includes(this.activeBracket)) {
                const info = findPlayoffMatchForParticipant(participant.name, this.getPlayoffMatches());
                if (!info) return 0;
                return getMatchPlayerThrows(info.match, info.playerNum);
            }
            const scores = participant[this.activeScoresKey];
            if (!scores) return 0;
            let count = 0;
            Object.values(scores).forEach(atelier => { count += Object.keys(atelier).length; });
            return count;
        },
        isComplete(participant) {
            return this.getThrows(participant) >= this.totalThrows;
        },
        getProgressPercent(participant) {
            return Math.round((this.getThrows(participant) / this.totalThrows) * 100);
        },
        getAtelierPercent(participant, atelierIdx) {
            if (['qf', 'sf', 'final'].includes(this.activeBracket)) {
                const info = findPlayoffMatchForParticipant(participant.name, this.getPlayoffMatches());
                if (!info) return 0;
                const scores = info.match[info.scoresKey]?.[atelierIdx];
                if (!scores || typeof scores !== 'object') return 0;
                return Math.round((Object.keys(scores).length / this.activeDistances.length) * 100);
            }
            const scores = participant[this.activeScoresKey]?.[atelierIdx];
            if (!scores) return 0;
            return Math.round((Object.keys(scores).length / this.activeDistances.length) * 100);
        },
        getClub(participant) {
            const team = this.tournament.teams?.find(t => t.title === participant.name);
            if (!team?.players) return participant.city || '';
            const players = Object.values(team.players);
            return players[0]?.club || participant.city || '';
        },
        getStatusClass(participant) {
            if (this.isComplete(participant)) return 'tir-plist__status--complete';
            if (this.getThrows(participant) > 0) return 'tir-plist__status--partial';
            return '';
        }
    }
}
</script>

<style scoped>
.tir-plist__bracket-switcher {
    display: flex;
    gap: 4px;
    margin-bottom: 10px;
    flex-wrap: wrap;
}

.tir-plist__bracket-btn {
    padding: 4px 10px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: none;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.15s;
}

.tir-plist__bracket-btn--active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-btn-text);
}

.tir-plist__search {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 8px;
    outline: none;
    background: var(--color-bg-input);
    color: var(--color-text);
}

.tir-plist__search:focus {
    border-color: var(--color-primary);
}

.tir-plist__select {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.tir-plist__row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
}

.tir-plist__row:hover {
    background: var(--color-surface-hover);
}

.tir-plist__rank {
    font-weight: 600;
    min-width: 20px;
    color: var(--color-text-muted);
}

.tir-plist__info {
    flex: 1;
    min-width: 0;
}

.tir-plist__name {
    display: block;
    font-weight: 500;
    color: var(--color-text);
}

.tir-plist__club {
    display: block;
    font-size: 11px;
    color: var(--color-text-muted);
    font-weight: 400;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.tir-plist__progress {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
}

.tir-plist__progress-segments {
    flex: 1;
    display: flex;
    gap: 2px;
}

.tir-plist__progress-segment {
    flex: 1;
    height: 4px;
    background: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
}

.tir-plist__progress-fill {
    height: 100%;
    background: var(--color-warning);
    border-radius: 2px;
    transition: background 0.3s;
}

.tir-plist__progress-fill--complete {
    background: var(--color-success);
}

.tir-plist__progress-text {
    font-size: 11px;
    color: var(--color-text-muted);
    white-space: nowrap;
}

.tir-plist__score {
    font-size: 13px;
    color: var(--color-text-muted);
}

.tir-plist__score strong {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text);
}

.tir-plist__status { color: var(--color-grey); }
.tir-plist__status--complete { color: var(--color-success); }
.tir-plist__status--partial { color: var(--tir-touche); }
</style>
