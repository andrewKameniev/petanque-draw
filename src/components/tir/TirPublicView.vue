<template>
    <div class="tir-module">
        <!-- Navigation tabs — same as admin -->
        <div class="tir-nav">
            <button class="tir-nav__btn" :class="{'tir-nav__btn--active': view === 'participants'}" @click="view = 'participants'; expanded = null">
                <Users :size="18"/>
                <span>{{ $t('tir.participants') }}</span>
            </button>
            <button class="tir-nav__btn" :class="{'tir-nav__btn--active': view === 'table'}" @click="view = 'table'">
                <TableProperties :size="18"/>
                <span>{{ $t('tir.table') }}</span>
            </button>
            <button v-if="tournament.tirPlayoff" class="tir-nav__btn" :class="{'tir-nav__btn--active': view === 'playoff'}" @click="view = 'playoff'">
                <Trophy :size="18"/>
                <span>{{ $t('games.playOff') }}</span>
            </button>
        </div>

        <!-- Participants view — scoring page style, read-only -->
        <div v-if="view === 'participants'" class="tir-scoring">
            <!-- Participant list -->
            <div v-if="expanded === null" class="tir-scoring__select">
                <div v-for="(participant, index) in rankedParticipants" :key="participant.id || index" class="tir-scoring__participant-row" @click="expandParticipant(index)">
                    <span class="tir-scoring__participant-rank">{{ index + 1 }}</span>
                    <span class="tir-scoring__participant-name">{{ participant.name }}</span>
                    <span class="tir-scoring__participant-score">{{ getTotal(participant) }}/{{ maxTotal }}</span>
                    <span class="tir-scoring__participant-status" :class="getStatusClass(participant)">
                        <CheckCircle v-if="isComplete(participant)" :size="16"/>
                        <AlertCircle v-else-if="getThrows(participant) > 0" :size="16"/>
                        <Circle v-else :size="16"/>
                    </span>
                </div>
            </div>

            <!-- Expanded participant details (read-only scoring view) -->
            <div v-else class="tir-pview">
                <div class="tir-pview__header">
                    <button class="tir-pview__back" @click="expanded = null">
                        <ChevronLeft :size="20"/>
                    </button>
                    <div class="tir-pview__info">
                        <h3 class="tir-pview__name">{{ expandedParticipant.name }}</h3>
                        <div class="tir-pview__total">
                            <span class="tir-pview__total-score">{{ getTotal(expandedParticipant) }}</span>
                            <span class="tir-pview__total-max">/ {{ maxTotal }} {{ $t('ranking.points') }}</span>
                        </div>
                        <div class="tir-pview__throws">{{ getThrows(expandedParticipant) }} / {{ totalThrows }} {{ $t('tir.throws') }}</div>
                    </div>
                </div>

                <div class="tir-pview__tabs">
                    <button v-for="(atelier, aIdx) in atelierNames" :key="aIdx"
                            class="tir-pview__tab"
                            :class="{'tir-pview__tab--active': activeAtelier === aIdx, 'tir-pview__tab--complete': isAtelierComplete(expandedParticipant, aIdx)}"
                            @click="activeAtelier = aIdx">
                        {{ aIdx + 1 }}
                    </button>
                </div>

                <div class="tir-pview__atelier">
                    <div class="tir-pview__atelier-header">
                        <h4>{{ atelierNames[activeAtelier] }}</h4>
                        <div class="tir-pview__atelier-score">
                            <span class="tir-pview__atelier-score-val">{{ getAtelierTotal(expandedParticipant, activeAtelier) }}</span>
                            <span class="tir-pview__atelier-score-max">/ {{ maxAtelierScore }}</span>
                        </div>
                    </div>

                    <div class="tir-pview__grid">
                        <div class="tir-pview__grid-header">
                            <div class="tir-pview__grid-corner"></div>
                            <div class="tir-pview__grid-th tir-pview__grid-th--carreau">{{ $t('tir.carreau') }}</div>
                            <div class="tir-pview__grid-th tir-pview__grid-th--reussi">{{ $t('tir.reussi') }}</div>
                            <div class="tir-pview__grid-th tir-pview__grid-th--touche">{{ $t('tir.touche') }}</div>
                            <div class="tir-pview__grid-th tir-pview__grid-th--manque">{{ $t('tir.manque') }}</div>
                        </div>
                        <div v-for="distance in distances" :key="distance" class="tir-pview__grid-row">
                            <div class="tir-pview__grid-distance">{{ distance }}m</div>
                            <div class="tir-pview__grid-cell" :class="{'tir-pview__grid-cell--carreau': getScore(expandedParticipant, activeAtelier, distance) === 'carreau'}">
                                <Check v-if="getScore(expandedParticipant, activeAtelier, distance) === 'carreau'" :size="14"/>
                            </div>
                            <div class="tir-pview__grid-cell" :class="{'tir-pview__grid-cell--reussi': getScore(expandedParticipant, activeAtelier, distance) === 'reussi'}">
                                <Check v-if="getScore(expandedParticipant, activeAtelier, distance) === 'reussi'" :size="14"/>
                            </div>
                            <div class="tir-pview__grid-cell" :class="{'tir-pview__grid-cell--touche': getScore(expandedParticipant, activeAtelier, distance) === 'touche'}">
                                <Check v-if="getScore(expandedParticipant, activeAtelier, distance) === 'touche'" :size="14"/>
                            </div>
                            <div class="tir-pview__grid-cell" :class="{'tir-pview__grid-cell--manque': getScore(expandedParticipant, activeAtelier, distance) === 'manque'}">
                                <Check v-if="getScore(expandedParticipant, activeAtelier, distance) === 'manque'" :size="14"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Table view — qualification ranking -->
        <div v-if="view === 'table'" class="tir-table">
            <table v-if="rankedParticipants.length" class="tir-table__content">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>{{ $t('tir.participant') }}</th>
                        <th>{{ $t('ranking.points') }}</th>
                        <th>{{ $t('tir.throws') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(participant, index) in rankedParticipants" :key="participant.id || index" :class="{'tir-table__row--qualified': isQualified(participant)}">
                        <td>{{ index + 1 }}</td>
                        <td>{{ participant.name }}</td>
                        <td><strong>{{ getTotal(participant) }}</strong> / {{ maxTotal }}</td>
                        <td>{{ getThrows(participant) }} / {{ totalThrows }}</td>
                    </tr>
                </tbody>
            </table>
            <div v-else class="tir-table__empty">{{ $t('tir.noParticipants') }}</div>
        </div>

        <!-- Playoff view -->
        <div v-if="view === 'playoff' && tournament.tirPlayoff" class="tir-playoff">
            <div v-for="(round, rIdx) in playoffDisplayRounds" :key="rIdx" class="tir-playoff__round" :class="{'tir-playoff__round--final': round.isFinal}">
                <h4 class="tir-playoff__round-title">{{ round.title }}</h4>
                <div v-for="(match, mIdx) in round.matches" :key="mIdx" class="tir-playoff__match" :class="{'tir-playoff__match--complete': isMatchComplete(match), 'tir-playoff__match--pending': !match.player1 || !match.player2}">
                    <span v-if="round.matches.length > 1" class="tir-playoff__lane">{{ mIdx + 1 }}</span>
                    <div class="tir-playoff__player" :class="{'tir-playoff__player--winner': getMatchWinner(match) === match.player1}">
                        <span class="tir-playoff__player-name">{{ match.player1 || '—' }}</span>
                        <span class="tir-playoff__player-score" v-if="match.score1 !== null">{{ match.score1 }}</span>
                    </div>
                    <div class="tir-playoff__vs">vs</div>
                    <div class="tir-playoff__player" :class="{'tir-playoff__player--winner': getMatchWinner(match) === match.player2}">
                        <span class="tir-playoff__player-name">{{ match.player2 || '—' }}</span>
                        <span class="tir-playoff__player-score" v-if="match.score2 !== null">{{ match.score2 }}</span>
                    </div>
                </div>
            </div>

            <!-- Final places -->
            <div v-if="finalPlaces.length" class="tir-playoff__places">
                <div v-for="(place, idx) in finalPlaces" :key="idx" class="tir-playoff__place">
                    <span class="tir-playoff__place-pos">{{ place.pos }}</span>
                    <span class="tir-playoff__place-name">{{ place.name }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {Users, TableProperties, Trophy, CheckCircle, AlertCircle, Circle, ChevronLeft, Check} from "lucide-vue-next";

const SCORING = {carreau: 5, reussi: 3, touche: 1, manque: 0};
const ATELIER_KEYS = ['atelier1', 'atelier2', 'atelier3', 'atelier4', 'atelier5'];

export default {
    name: 'TirPublicView',
    components: {Users, TableProperties, Trophy, CheckCircle, AlertCircle, Circle, ChevronLeft, Check},
    props: {
        tournament: {type: Object, required: true}
    },
    data() {
        return {
            view: 'participants',
            expanded: null,
            activeAtelier: 0
        }
    },
    watch: {
        'tournament.tirPlayoff': {
            immediate: true,
            handler(val) {
                if (val && this.view === 'participants') this.view = 'playoff';
            }
        }
    },
    computed: {
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
        atelierNames() {
            return ATELIER_KEYS.map(k => this.$t(`tir.${k}`));
        },
        participants() {
            return this.tournament.tirParticipants || [];
        },
        rankedParticipants() {
            return [...this.participants].sort((a, b) => this.getTotal(b) - this.getTotal(a) || this.getCarreauCount(b) - this.getCarreauCount(a));
        },
        expandedParticipant() {
            if (this.expanded === null) return null;
            return this.rankedParticipants[this.expanded];
        },
        qualifiedNames() {
            return this.tournament.tirPlayoff?.qualified || [];
        },
        playoffDisplayRounds() {
            const playoff = this.tournament.tirPlayoff;
            if (!playoff) return [];
            const rounds = [];
            const firstRoundMatches = playoff.rounds?.[0]?.matches?.length || 0;
            const playoffSize = playoff.size || (firstRoundMatches > 0 ? firstRoundMatches * 2 : 2);

            if (playoff.rounds && playoff.rounds.length) {
                playoff.rounds.forEach((round, rIdx) => {
                    rounds.push({
                        title: this.getRoundTitle(round.matches.length, playoffSize),
                        matches: round.matches,
                        isFinal: false
                    });
                });
            }

            if (playoff.thirdPlace) {
                rounds.push({
                    title: this.$t('tir.thirdPlaceMatch'),
                    matches: [playoff.thirdPlace],
                    isFinal: false
                });
            }

            if (playoff.final) {
                rounds.push({
                    title: this.$t('games.final'),
                    matches: [playoff.final],
                    isFinal: true
                });
            }

            return rounds;
        },
        finalPlaces() {
            const playoff = this.tournament.tirPlayoff;
            if (!playoff || !this.tournament.tournamentIsFinished) return [];
            const places = [];
            const finalMatch = playoff.final;
            if (finalMatch) {
                const winner = this.getMatchWinner(finalMatch);
                const loser = winner === finalMatch.player1 ? finalMatch.player2 : finalMatch.player1;
                if (winner) {
                    places.push({pos: '1', name: winner});
                    places.push({pos: '2', name: loser});
                }
            }
            const thirdMatch = playoff.thirdPlace;
            if (thirdMatch) {
                const winner = this.getMatchWinner(thirdMatch);
                const loser = winner === thirdMatch.player1 ? thirdMatch.player2 : thirdMatch.player1;
                if (winner) {
                    places.push({pos: '3', name: winner});
                    places.push({pos: '4', name: loser});
                }
            }
            return places;
        }
    },
    methods: {
        expandParticipant(index) {
            this.expanded = index;
            this.activeAtelier = 0;
        },
        getTotal(participant) {
            if (!participant.scores) return 0;
            let total = 0;
            Object.values(participant.scores).forEach(atelier => {
                Object.values(atelier).forEach(val => { total += SCORING[val] || 0; });
            });
            return total;
        },
        getCarreauCount(participant) {
            if (!participant.scores) return 0;
            let count = 0;
            Object.values(participant.scores).forEach(atelier => {
                Object.values(atelier).forEach(val => { if (val === 'carreau') count++; });
            });
            return count;
        },
        getThrows(participant) {
            if (!participant.scores) return 0;
            let count = 0;
            Object.values(participant.scores).forEach(atelier => { count += Object.keys(atelier).length; });
            return count;
        },
        isComplete(participant) {
            return this.getThrows(participant) >= this.totalThrows;
        },
        getStatusClass(participant) {
            if (this.isComplete(participant)) return 'tir-scoring__participant-status--complete';
            if (this.getThrows(participant) > 0) return 'tir-scoring__participant-status--partial';
            return '';
        },
        getAtelierTotal(participant, atelierIdx) {
            const scores = participant.scores?.[atelierIdx];
            if (!scores) return 0;
            return Object.values(scores).reduce((sum, val) => sum + (SCORING[val] || 0), 0);
        },
        isAtelierComplete(participant, atelierIdx) {
            const scores = participant.scores?.[atelierIdx];
            if (!scores) return false;
            return Object.keys(scores).length >= this.distances.length;
        },
        getScore(participant, atelierIdx, distance) {
            return participant.scores?.[atelierIdx]?.[distance] || null;
        },
        isQualified(participant) {
            return this.qualifiedNames.includes(participant.name);
        },
        isMatchComplete(match) {
            if (match.complete) return true;
            return match.score1 !== null && match.score2 !== null && match.score1 !== match.score2;
        },
        getMatchWinner(match) {
            if (match.winner) return match.winner;
            if (match.score1 !== null && match.score2 !== null && match.score1 !== match.score2) {
                return match.score1 > match.score2 ? match.player1 : match.player2;
            }
            return null;
        },
        getRoundTitle(matchCount, playoffSize) {
            if (playoffSize === 2) return this.$t('games.final');
            if (matchCount === 2) return this.$t('tir.semifinal');
            if (matchCount === 4) return this.$t('tir.quarterfinal');
            if (matchCount === 8) return this.$t('tir.eighthFinal');
            if (matchCount === 16) return this.$t('tir.sixteenthFinal');
            return this.$t('tir.round') + ' ' + matchCount;
        }
    }
}
</script>

<style scoped>
.tir-module {
    background: var(--card-bg, #fff);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid var(--color-border, #e0e0e0);
}

.tir-nav {
    display: flex;
    background: var(--bg-color, #fff);
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 10px;
    padding: 6px 0;
    margin-bottom: 16px;
}

.tir-nav__btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 6px;
    border: none;
    background: none;
    color: var(--text-secondary, #666);
    font-size: 11px;
    cursor: pointer;
    transition: color 0.2s;
}

.tir-nav__btn--active {
    color: var(--primary-color, #f5a623);
}

/* Scoring list */
.tir-scoring__select {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.tir-scoring__participant-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: var(--card-bg, #fff);
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
}

.tir-scoring__participant-row:hover {
    background: var(--bg-secondary, #f9f9f9);
}

.tir-scoring__participant-rank {
    font-weight: 600;
    min-width: 20px;
    color: var(--text-secondary, #666);
}

.tir-scoring__participant-name {
    flex: 1;
    font-weight: 500;
}

.tir-scoring__participant-score {
    font-size: 13px;
    color: var(--text-secondary, #666);
}

.tir-scoring__participant-status { color: var(--text-secondary, #ccc); }
.tir-scoring__participant-status--complete { color: #4caf50; }
.tir-scoring__participant-status--partial { color: #f5a623; }

/* Participant detail view */
.tir-pview__header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
}

.tir-pview__back {
    padding: 6px;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--text-color, #333);
}

.tir-pview__info { flex: 1; }
.tir-pview__name { margin: 0; font-size: 18px; }
.tir-pview__total { margin-top: 4px; }
.tir-pview__total-score { font-size: 24px; font-weight: 700; color: #4caf50; }
.tir-pview__total-max { font-size: 14px; color: var(--text-secondary, #888); }
.tir-pview__throws { font-size: 12px; color: var(--text-secondary, #888); }

.tir-pview__tabs { display: flex; gap: 6px; margin-bottom: 12px; }

.tir-pview__tab {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid var(--color-border, #e0e0e0);
    background: var(--bg-color, #fff);
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    color: var(--text-color, #333);
    transition: all 0.2s;
}

.tir-pview__tab--active {
    background: var(--primary-color, #f5a623);
    border-color: var(--primary-color, #f5a623);
    color: #fff;
}

.tir-pview__tab--complete:not(.tir-pview__tab--active) {
    border-color: #4caf50;
    color: #4caf50;
}

.tir-pview__atelier {
    background: var(--card-bg, #fff);
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 12px;
    padding: 14px;
}

.tir-pview__atelier-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2px;
}

.tir-pview__atelier-header h4 { margin: 0; font-size: 16px; }
.tir-pview__atelier-score { text-align: right; }
.tir-pview__atelier-score-val { font-size: 20px; font-weight: 700; color: #4caf50; }
.tir-pview__atelier-score-max { font-size: 13px; color: var(--text-secondary, #888); }

.tir-pview__grid { margin-top: 10px; }
.tir-pview__grid-header { display: flex; gap: 3px; margin-bottom: 6px; }
.tir-pview__grid-corner { width: 32px; }
.tir-pview__grid-th { flex: 1; text-align: center; font-size: 10px; font-weight: 700; padding: 2px; }
.tir-pview__grid-th--carreau { color: #4caf50; }
.tir-pview__grid-th--reussi { color: #2196F3; }
.tir-pview__grid-th--touche { color: #f5a623; }
.tir-pview__grid-th--manque { color: #9e9e9e; }

.tir-pview__grid-row { display: flex; gap: 3px; margin-bottom: 3px; }
.tir-pview__grid-distance { width: 32px; display: flex; align-items: center; font-size: 12px; font-weight: 600; color: var(--text-color, #333); }

.tir-pview__grid-cell {
    flex: 1;
    height: 32px;
    border: 2px solid var(--color-border, #e0e0e0);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.tir-pview__grid-cell--carreau { background: #4caf50; border-color: #4caf50; color: #fff; }
.tir-pview__grid-cell--reussi { background: #2196F3; border-color: #2196F3; color: #fff; }
.tir-pview__grid-cell--touche { background: #f5a623; border-color: #f5a623; color: #fff; }
.tir-pview__grid-cell--manque { background: #9e9e9e; border-color: #9e9e9e; color: #fff; }

/* Table */
.tir-table__content {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.tir-table__content th {
    text-align: left;
    padding: 10px 8px;
    border-bottom: 2px solid var(--color-border, #e0e0e0);
    font-weight: 600;
    font-size: 12px;
    color: var(--text-secondary, #666);
    text-transform: uppercase;
}

.tir-table__content td {
    padding: 10px 8px;
    border-bottom: 1px solid var(--color-border, #f0f0f0);
    white-space: nowrap;
}

.tir-table__row--qualified {
    background: rgba(76, 175, 80, 0.05);
}

.tir-table__row--qualified td:first-child {
    font-weight: 700;
    color: #4caf50;
}

.tir-table__empty {
    text-align: center;
    padding: 40px;
    color: var(--text-secondary, #888);
}

/* Playoff */
.tir-playoff {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.tir-playoff__round {
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 10px;
    padding: 14px;
}

.tir-playoff__round--final {
    border-color: var(--primary-color, #f5a623);
    background: rgba(245, 166, 35, 0.03);
}

.tir-playoff__round-title {
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-secondary, #666);
    text-transform: uppercase;
}

.tir-playoff__match {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid var(--color-border, #f0f0f0);
    border-radius: 8px;
    margin-bottom: 6px;
}

.tir-playoff__match:last-child { margin-bottom: 0; }

.tir-playoff__match--complete {
    background: rgba(76, 175, 80, 0.04);
    border-color: rgba(76, 175, 80, 0.3);
}

.tir-playoff__match--pending { opacity: 0.5; }

.tir-playoff__lane {
    min-width: 20px;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-secondary, #999);
    text-align: center;
}

.tir-playoff__player {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}

.tir-playoff__player--winner .tir-playoff__player-name {
    font-weight: 700;
    color: #4caf50;
}

.tir-playoff__player-name {
    flex: 1;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.tir-playoff__player-score {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-color, #333);
    min-width: 24px;
    text-align: right;
}

.tir-playoff__vs {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary, #999);
    min-width: 20px;
    text-align: center;
}

.tir-playoff__places {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.tir-playoff__place {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: var(--bg-secondary, #f9f9f9);
    border-radius: 8px;
}

.tir-playoff__place-pos {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--primary-color, #f5a623);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 12px;
}

.tir-playoff__place-name {
    font-weight: 600;
    font-size: 1rem;
}
</style>
