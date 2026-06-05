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
                        <div class="tir-plist__progress-bar">
                            <div class="tir-plist__progress-fill" :class="{'tir-plist__progress-fill--complete': isComplete(participant)}" :style="{width: getProgressPercent(participant) + '%'}"></div>
                        </div>
                        <span class="tir-plist__progress-text">{{ getThrows(participant) }}/{{ totalThrows }}</span>
                    </div>
                </div>
                <span class="tir-plist__score">{{ getTotal(participant) }}/{{ maxTotal }}</span>
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
            :distances="distances"
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
import {SCORING, ATELIER_KEYS} from '@/services/tir';

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
        } else {
            this.activeBracket = 'r1';
        }
    },
    computed: {
        isTwoRoundSystem() {
            return this.tournament.tirConfig?.rounds === 2;
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
        totalThrows() {
            return 5 * this.distances.length;
        },
        maxAtelierScore() {
            return this.distances.length * SCORING.carreau;
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
            if (this.tournament.tirPlayoff) {
                return this.activeBracket === 'r1' ? 1 : 2;
            }
            return this.currentRound;
        },
        activeScoresKey() {
            return this.displayRound === 2 ? 'scores2' : 'scores';
        },
        bracketTabs() {
            const tabs = [];
            if (!this.isTwoRoundSystem) return tabs;
            tabs.push({key: 'r1', label: 'R1'});
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
        scoringParticipants() {
            if (this.tournament.tirPlayoff && ['qf', 'sf', 'final'].includes(this.activeBracket)) {
                return this.getPlayoffBracketParticipants();
            }
            if (this.displayRound === 2) {
                const r2Ids = this.tournament.tirR2Participants || [];
                return this.participants.filter(p => r2Ids.includes(p.id));
            }
            return this.participants;
        },
        rankedParticipants() {
            return [...this.scoringParticipants].sort((a, b) => this.getTotal(b) - this.getTotal(a) || this.getCarreauCount(b) - this.getCarreauCount(a));
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
        getPlayoffBracketScore(participant) {
            const playoff = this.tournament.tirPlayoff;
            if (!playoff?.rounds) return 0;
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

.tir-plist__progress-bar {
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
    transition: width 0.3s, background 0.3s;
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
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-muted);
}

.tir-plist__status { color: var(--color-grey); }
.tir-plist__status--complete { color: var(--color-success); }
.tir-plist__status--partial { color: var(--tir-touche); }
</style>
