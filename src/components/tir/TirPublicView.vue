<template>
    <div class="tir-module">
        <!-- Navigation tabs — same as admin -->
        <div class="tir-nav">
            <button class="tir-nav__btn" :class="{'tir-nav__btn--active tir-nav__btn--participants': view === 'participants'}" @click="view = 'participants'; expanded = null">
                <Users :size="18"/>
                <span>{{ $t('tir.participants') }}</span>
            </button>
            <button class="tir-nav__btn" :class="{'tir-nav__btn--active tir-nav__btn--table': view === 'table'}" @click="view = 'table'">
                <TableProperties :size="18"/>
                <span>{{ $t('tir.table') }}</span>
            </button>
            <button v-if="tournament.tirPlayoff" class="tir-nav__btn" :class="{'tir-nav__btn--active tir-nav__btn--playoff': view === 'playoff'}" @click="view = 'playoff'">
                <Trophy :size="18"/>
                <span>{{ $t('games.playOff') }}</span>
            </button>
            <button v-if="isTwoRoundSystem && currentRound === 2 && !tournament.tirPlayoff" class="tir-nav__round-badge" @click="toggleViewingRound">R{{ displayRound }}</button>
            <span v-else-if="isTwoRoundSystem && !tournament.tirPlayoff" class="tir-nav__round-badge">R{{ currentRound }}</span>
        </div>

        <!-- Participants view — scoring page style, read-only -->
        <div v-if="view === 'participants'" class="tir-scoring">
            <div v-if="isTwoRoundSystem && expanded === null && bracketTabs.length > 1" class="tir-scoring__bracket-switcher">
                <button v-for="tab in bracketTabs" :key="tab.key"
                        class="tir-scoring__bracket-btn"
                        :class="{'tir-scoring__bracket-btn--active': activeBracket === tab.key}"
                        @click="activeBracket = tab.key">
                    {{ tab.label }}
                </button>
            </div>
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
            <div v-if="rankedParticipants.length" class="tir-table__scroll">
                <table class="tir-table__content">
                    <thead>
                        <tr v-if="isTwoRoundSystem">
                            <th class="tir-table__sticky-col">#</th>
                            <th class="tir-table__sticky-col tir-table__sticky-col--name">{{ $t('tir.participant') }}</th>
                            <th>{{ $t('tir.round1Score') }}</th>
                            <th v-if="currentRound >= 2">{{ $t('tir.round2Score') }}</th>
                            <th v-if="currentRound >= 2">{{ $t('tir.combinedScore') }}</th>
                            <th v-if="playoffHasQf">1/4</th>
                            <th v-if="playoffHasSf">1/2</th>
                            <th v-if="playoffHasFinal">{{ $t('games.final') }}</th>
                            <th>{{ $t('tir.place') }}</th>
                        </tr>
                        <tr v-else>
                            <th>#</th>
                            <th>{{ $t('tir.participant') }}</th>
                            <th>{{ $t('ranking.points') }}</th>
                            <th>{{ $t('tir.throws') }}</th>
                        </tr>
                    </thead>
                    <tbody v-if="isTwoRoundSystem">
                        <tr v-for="(row, index) in publicTableRows" :key="row.id" :class="row.rowClass">
                            <td class="tir-table__sticky-col">{{ index + 1 }}</td>
                            <td class="tir-table__sticky-col tir-table__sticky-col--name">{{ row.name }}</td>
                            <td>{{ row.r1 }}</td>
                            <td v-if="currentRound >= 2">{{ row.r2 }}</td>
                            <td v-if="currentRound >= 2"><strong>{{ row.combined }}</strong></td>
                            <td v-if="playoffHasQf">{{ row.qf }}</td>
                            <td v-if="playoffHasSf">{{ row.sf }}</td>
                            <td v-if="playoffHasFinal">{{ row.final }}</td>
                            <td>{{ row.place }}</td>
                        </tr>
                    </tbody>
                    <tbody v-else>
                        <tr v-for="(participant, index) in rankedParticipants" :key="participant.id || index" :class="{'tir-table__row--qualified': isQualified(participant)}">
                            <td>{{ index + 1 }}</td>
                            <td>{{ participant.name }}</td>
                            <td><strong>{{ getTotal(participant) }}</strong> / {{ maxTotal }}</td>
                            <td>{{ getThrows(participant) }} / {{ totalThrows }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-else class="tir-table__empty">{{ $t('tir.noParticipants') }}</div>
        </div>

        <!-- Playoff view -->
        <div v-if="view === 'playoff' && tournament.tirPlayoff" class="tir-playoff">
            <!-- Match comparison detail -->
            <TirPlayoffComparison v-if="activePlayoffMatch"
                :match="activePlayoffMatch"
                :ateliers="atelierObjects"
                :distances="distances"
                :roundLabel="activePlayoffMatchLabel"
                @back="activePlayoffMatchKey = null"/>

            <!-- Bracket view -->
            <template v-else>
                <div class="tir-playoff__timeline">
                    <div v-for="(round, rIdx) in playoffDisplayRounds" :key="rIdx" class="tir-playoff__round" :class="{'tir-playoff__round--final': round.isFinal}">
                        <div class="tir-playoff__progress">
                            <span class="tir-playoff__progress-dot" :class="{'tir-playoff__progress-dot--complete': round.matches.every(m => isMatchComplete(m)), 'tir-playoff__progress-dot--final': round.isFinal}"></span>
                            <span v-if="rIdx < playoffDisplayRounds.length - 1" class="tir-playoff__progress-line"></span>
                        </div>
                        <div class="tir-playoff__round-content">
                            <h4 class="tir-playoff__round-title">{{ round.title }}</h4>
                            <div v-for="(match, mIdx) in round.matches" :key="mIdx" class="tir-playoff__match" :class="{'tir-playoff__match--complete': isMatchComplete(match), 'tir-playoff__match--pending': !match.player1 || !match.player2, 'tir-playoff__match--final': round.isFinal}" @click="openPlayoffMatch(match, round.title, round.key, mIdx)">
                                <span class="tir-playoff__match-num">{{ round.laneStart ? round.laneStart + mIdx : mIdx + 1 }}</span>
                                <div class="tir-playoff__match-row">
                                    <span class="tir-playoff__player-name" :class="{'tir-playoff__player-name--winner': getMatchWinner(match) === match.player1}">{{ match.player1 || $t('tir.matchPending') }}</span>
                                    <span class="tir-playoff__score" :class="{'tir-playoff__score--winner': getMatchWinner(match) === match.player1}">{{ match.score1 !== null ? match.score1 : '—' }}</span>
                                    <span class="tir-playoff__vs">vs</span>
                                    <span class="tir-playoff__score" :class="{'tir-playoff__score--winner': getMatchWinner(match) === match.player2}">{{ match.score2 !== null ? match.score2 : '—' }}</span>
                                    <span class="tir-playoff__player-name tir-playoff__player-name--right" :class="{'tir-playoff__player-name--winner': getMatchWinner(match) === match.player2}">{{ match.player2 || $t('tir.matchPending') }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Winner block -->
                <div v-if="champion" class="tir-playoff__winner">
                    <div class="tir-playoff__winner-icon">
                        <Trophy :size="28" color="#fff"/>
                    </div>
                    <div class="tir-playoff__winner-info">
                        <span class="tir-playoff__winner-label">{{ $t('tir.tournamentWinner') }}</span>
                        <span class="tir-playoff__winner-name">{{ champion }}</span>
                    </div>
                </div>

                <!-- CTA to final table -->
                <button class="tir-playoff__cta" @click="goToTable">
                    <TableProperties :size="18"/>
                    <span>{{ $t('tir.goToFinalTable') }}</span>
                    <ChevronRight :size="18"/>
                </button>
            </template>
        </div>
    </div>
</template>

<script>
import {Users, TableProperties, Trophy, CheckCircle, AlertCircle, Circle, ChevronLeft, ChevronRight, Check} from "lucide-vue-next";
import TirPlayoffComparison from "./TirPlayoffComparison.vue";

const SCORING = {carreau: 5, reussi: 3, touche: 1, manque: 0};
const ATELIER_KEYS = ['atelier1', 'atelier2', 'atelier3', 'atelier4', 'atelier5'];

export default {
    name: 'TirPublicView',
    components: {Users, TableProperties, Trophy, CheckCircle, AlertCircle, Circle, ChevronLeft, ChevronRight, Check, TirPlayoffComparison},
    props: {
        tournament: {type: Object, required: true}
    },
    data() {
        return {
            view: 'participants',
            expanded: null,
            activeAtelier: 0,
            activePlayoffMatchKey: null,
            activePlayoffMatchLabel: '',
            viewingRound: null,
            activeBracket: 'r2'
        }
    },
    created() {
        if (this.tournament.tirPlayoff) {
            this.view = 'playoff';
            const tabs = this.bracketTabs;
            if (tabs.length) this.activeBracket = tabs[tabs.length - 1].key;
        } else if (this.currentRound === 2) {
            this.activeBracket = 'r2';
        } else {
            this.activeBracket = 'r1';
        }
    },
    watch: {
        'tournament.tirPlayoff'(val, oldVal) {
            if (val && !oldVal) this.view = 'playoff';
        },
        expandedParticipant: {
            deep: true,
            handler() {
                if (!this.expandedParticipant) return;
                if (this.isAtelierComplete(this.expandedParticipant, this.activeAtelier)) {
                    const next = ATELIER_KEYS.findIndex((_, idx) => idx > this.activeAtelier && !this.isAtelierComplete(this.expandedParticipant, idx));
                    if (next !== -1) this.activeAtelier = next;
                }
            }
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
        atelierNames() {
            return ATELIER_KEYS.map(k => this.$t(`tir.${k}`));
        },
        atelierObjects() {
            return ATELIER_KEYS.map(key => ({
                name: this.$t(`tir.${key}`),
                description: this.$t(`tir.${key}Desc`)
            }));
        },
        activePlayoffMatch() {
            if (!this.activePlayoffMatchKey) return null;
            const playoff = this.tournament.tirPlayoff;
            if (!playoff) return null;
            const [type, idx] = this.activePlayoffMatchKey.split(':');
            if (type === 'round') {
                const [rIdx, mIdx] = idx.split('-').map(Number);
                return playoff.rounds?.[rIdx]?.matches?.[mIdx] || null;
            }
            if (type === 'third') return playoff.thirdPlace || null;
            if (type === 'final') return playoff.final || null;
            return null;
        },
        displayRound() {
            if (this.tournament.tirPlayoff) {
                return this.activeBracket === 'r1' ? 1 : 2;
            }
            return this.viewingRound || this.currentRound;
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
        playoffHasQf() {
            const playoff = this.tournament.tirPlayoff;
            if (!playoff?.rounds?.[0]) return false;
            return playoff.rounds[0].matches.some(m => m.score1 != null);
        },
        playoffHasSf() {
            const playoff = this.tournament.tirPlayoff;
            if (!playoff?.rounds) return false;
            const sfRound = playoff.rounds.find(r => r.matches.length === 2);
            return sfRound?.matches.some(m => m.score1 != null) || false;
        },
        playoffHasFinal() {
            const playoff = this.tournament.tirPlayoff;
            if (!playoff?.rounds) return false;
            const finalRound = playoff.rounds.find(r => r.matches.length === 1);
            if (finalRound?.matches[0]?.score1 != null) return true;
            return playoff.final?.score1 != null || playoff.thirdPlace?.score1 != null || false;
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
                        key: `round:${rIdx}`,
                        isFinal: false
                    });
                });
            }

            let laneCounter = rounds.reduce((sum, r) => sum + r.matches.length, 0);

            if (playoff.thirdPlace) {
                laneCounter++;
                rounds.push({
                    title: this.$t('tir.thirdPlaceMatch'),
                    matches: [playoff.thirdPlace],
                    key: 'third:0',
                    isFinal: false,
                    laneStart: laneCounter
                });
            }

            if (playoff.final) {
                laneCounter++;
                rounds.push({
                    title: this.$t('games.final'),
                    matches: [playoff.final],
                    key: 'final:0',
                    isFinal: true,
                    laneStart: laneCounter
                });
            }

            return rounds;
        },
        champion() {
            const playoff = this.tournament.tirPlayoff;
            if (!playoff || !this.tournament.tournamentIsFinished) return null;
            const finalMatch = playoff.final;
            if (!finalMatch) return null;
            return this.getMatchWinner(finalMatch);
        },
        r1RankedParticipants() {
            return [...this.participants].sort((a, b) =>
                this.getTotal(a, 'scores') !== undefined ?
                    this.getScoreForKey(b, 'scores') - this.getScoreForKey(a, 'scores') :
                    this.getTotal(b) - this.getTotal(a)
            );
        },
        publicTableRows() {
            if (!this.isTwoRoundSystem) return [];
            const playoff = this.tournament.tirPlayoff;
            const r2Ids = this.tournament.tirR2Participants || [];
            const r1Ranked = [...this.participants].sort((a, b) =>
                this.getScoreForKey(b, 'scores') - this.getScoreForKey(a, 'scores')
            );
            const directIds = r1Ranked.slice(0, 4).map(p => p.id);
            const r2CandidateIds = r1Ranked.slice(4, 16).map(p => p.id);

            const allPlayers = r1Ranked.map(p => {
                const isDirect = directIds.includes(p.id);
                const isR2 = r2Ids.includes(p.id);
                const r1Score = this.getScoreForKey(p, 'scores');
                const r2Score = isR2 ? this.getScoreForKey(p, 'scores2') : null;
                const combined = isR2 ? r1Score + r2Score : r1Score;

                let place = '';
                let rowClass = '';
                if (isDirect) {
                    rowClass = 'tir-table__row--direct';
                    place = this.$t('tir.directQualifier');
                } else if (isR2) {
                    rowClass = 'tir-table__row--r2';
                } else if (this.isTwoRoundSystem && this.currentRound === 1 && r2CandidateIds.includes(p.id)) {
                    rowClass = 'tir-table__row--r2';
                    place = this.$t('tir.goToRound2');
                } else {
                    rowClass = 'tir-table__row--eliminated';
                    place = this.$t('tir.eliminated');
                }

                const matchScores = this.getPlayoffMatchScores(p.name, playoff);

                return {
                    id: p.id,
                    name: p.name,
                    r1: r1Score,
                    r2: isDirect ? '—' : (r2Score !== null ? r2Score : ''),
                    combined: isR2 ? combined : (isDirect ? r1Score : ''),
                    qf: matchScores.qf,
                    sf: matchScores.sf,
                    final: matchScores.final,
                    place,
                    rowClass,
                    combinedNum: combined
                };
            });

            if (this.currentRound >= 2 && r2Ids.length) {
                const directRows = allPlayers.filter(r => r.rowClass === 'tir-table__row--direct');
                const r2Rows = allPlayers.filter(r => r.rowClass === 'tir-table__row--r2')
                    .sort((a, b) => b.combinedNum - a.combinedNum);
                const eliminatedRows = allPlayers.filter(r => r.rowClass === 'tir-table__row--eliminated');
                return [...directRows, ...r2Rows, ...eliminatedRows];
            }
            return allPlayers;
        }
    },
    methods: {
        toggleViewingRound() {
            this.viewingRound = this.displayRound === 1 ? 2 : 1;
            this.expanded = null;
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
        expandParticipant(index) {
            this.expanded = index;
            const p = this.rankedParticipants[index];
            const firstIncomplete = ATELIER_KEYS.findIndex((_, idx) => !this.isAtelierComplete(p, idx));
            this.activeAtelier = firstIncomplete !== -1 ? firstIncomplete : 0;
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
        getStatusClass(participant) {
            if (this.isComplete(participant)) return 'tir-scoring__participant-status--complete';
            if (this.getThrows(participant) > 0) return 'tir-scoring__participant-status--partial';
            return '';
        },
        getAtelierTotal(participant, atelierIdx) {
            const scores = participant[this.activeScoresKey]?.[atelierIdx];
            if (!scores) return 0;
            return Object.values(scores).reduce((sum, val) => sum + (SCORING[val] || 0), 0);
        },
        isAtelierComplete(participant, atelierIdx) {
            const scores = participant[this.activeScoresKey]?.[atelierIdx];
            if (!scores) return false;
            return Object.keys(scores).length >= this.distances.length;
        },
        getScore(participant, atelierIdx, distance) {
            return participant[this.activeScoresKey]?.[atelierIdx]?.[distance] || null;
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
        },
        getScoreForKey(participant, key) {
            if (!participant[key]) return 0;
            let total = 0;
            Object.values(participant[key]).forEach(atelier => {
                if (atelier && typeof atelier === 'object') {
                    Object.values(atelier).forEach(val => { total += SCORING[val] || 0; });
                }
            });
            return total;
        },
        getPlayoffMatchScores(playerName, playoff) {
            const result = {qf: '', sf: '', final: ''};
            if (!playoff) return result;
            if (playoff.rounds) {
                playoff.rounds.forEach(round => {
                    round.matches.forEach(m => {
                        if (m.player1 === playerName || m.player2 === playerName) {
                            const score = m.player1 === playerName ? m.score1 : m.score2;
                            if (score != null) {
                                if (round.matches.length >= 4) result.qf = score;
                                else if (round.matches.length === 2) result.sf = score;
                                else if (round.matches.length === 1) result.final = score;
                            }
                        }
                    });
                });
            }
            if (playoff.final && (playoff.final.player1 === playerName || playoff.final.player2 === playerName)) {
                const score = playoff.final.player1 === playerName ? playoff.final.score1 : playoff.final.score2;
                if (score != null) result.final = score;
            }
            if (playoff.thirdPlace && (playoff.thirdPlace.player1 === playerName || playoff.thirdPlace.player2 === playerName)) {
                const score = playoff.thirdPlace.player1 === playerName ? playoff.thirdPlace.score1 : playoff.thirdPlace.score2;
                if (score != null) result.final = score;
            }
            return result;
        },
        openPlayoffMatch(match, label, roundKey, mIdx) {
            if (!match.player1 || !match.player2) return;
            const [type, rIdx] = roundKey.split(':');
            if (type === 'round') {
                this.activePlayoffMatchKey = `round:${rIdx}-${mIdx}`;
            } else {
                this.activePlayoffMatchKey = type + ':0';
            }
            this.activePlayoffMatchLabel = label;
        },
        goToTable() {
            this.view = 'table';
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

.tir-nav__btn--participants.tir-nav__btn--active {
    color: #be185d;
}

.tir-nav__btn--table.tir-nav__btn--active {
    color: #4CAF50;
}

.tir-nav__btn--playoff.tir-nav__btn--active {
    color: var(--primary-color, #f5a623);
}

.tir-nav__round-badge {
    position: relative;
    right: 0px;
    top: -4px;
    align-self: baseline;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3px 6px;
    font-size: 10px;
    font-weight: 700;
    border-radius: 5px;
    background: var(--color-primary, #471aa0);
    color: #fff;
    margin-right: 6px;
    border: none;
    cursor: pointer;
}

.tir-scoring__round-hint {
    font-size: 12px;
    color: var(--text-secondary, #888);
    text-align: left;
    margin: -8px 0 6px;
}

.tir-scoring__bracket-switcher {
    display: flex;
    gap: 4px;
    margin: -4px 0 10px;
    flex-wrap: wrap;
}

.tir-scoring__bracket-btn {
    padding: 4px 10px;
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 6px;
    background: none;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary, #666);
    cursor: pointer;
    transition: all 0.15s;
}

.tir-scoring__bracket-btn--active {
    background: var(--color-primary, #471aa0);
    border-color: var(--color-primary, #471aa0);
    color: #fff;
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
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid #e0e0e0;
    background: radial-gradient(circle, #e0e0e0 56%, #fff 56%);
    opacity: 0.4;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
}

.tir-pview__grid-cell--carreau { opacity: 1; border-color: #4CAF50; background: radial-gradient(circle, #4CAF50 56%, #fff 56%); color: #fff; }
.tir-pview__grid-cell--reussi { opacity: 1; border-color: #2196F3; background: radial-gradient(circle, #2196F3 56%, #fff 56%); color: #fff; }
.tir-pview__grid-cell--touche { opacity: 1; border-color: #F5A623; background: radial-gradient(circle, #F5A623 56%, #fff 56%); color: #fff; }
.tir-pview__grid-cell--manque { opacity: 1; border-color: #bdbdbd; background: radial-gradient(circle, #bdbdbd 56%, #fff 56%); color: #fff; }

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

.tir-table__row--qualified td {
    background: var(--color-highlight, rgba(16, 185, 129, 0.12));
}

.tir-table__row--direct td {
    background: rgba(76, 175, 80, 0.08);
}

.tir-table__row--r2 td {
    background: rgba(245, 166, 35, 0.08);
}

.tir-table__row--eliminated td {
    color: var(--text-secondary, #888);
}

.tir-table__scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.tir-table__sticky-col {
    position: sticky;
    left: 0;
    z-index: 2;
}

.tir-table__sticky-col--name {
    left: 32px;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.tir-table__content tr th.tir-table__sticky-col,
.tir-table__content tr td.tir-table__sticky-col {
    background: var(--card-bg, #fff);
}

.tir-table__row--direct td.tir-table__sticky-col {
    background: #f0faf1;
}

.tir-table__row--r2 td.tir-table__sticky-col {
    background: #fef9f0;
}

.tir-table__row--eliminated td.tir-table__sticky-col {
    background: var(--card-bg, #fff);
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

.tir-playoff__timeline {
    display: flex;
    flex-direction: column;
}

.tir-playoff__round {
    display: flex;
    gap: 14px;
}

.tir-playoff__progress {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 4px;
    min-width: 20px;
}

.tir-playoff__progress-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #d0d0d0;
    background: #fff;
    flex-shrink: 0;
}

.tir-playoff__progress-dot--complete {
    border-color: #43A047;
    background: #43A047;
}

.tir-playoff__progress-dot--final {
    border-color: #F5A623;
    background: #F5A623;
}

.tir-playoff__progress-line {
    width: 2px;
    flex: 1;
    background: #e0e0e0;
    margin: 4px 0;
}

.tir-playoff__round-content {
    flex: 1;
    min-width: 0;
    padding-bottom: 16px;
}

.tir-playoff__round-title {
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-secondary, #666);
    text-transform: uppercase;
}

.tir-playoff__match {
    padding: 12px 14px;
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 14px;
    margin-bottom: 8px;
    cursor: pointer;
    background: #fff;
    transition: background 0.15s, border-color 0.15s;
}

.tir-playoff__match:hover {
    background: var(--bg-secondary, #f9f9f9);
    border-color: var(--primary-color, #f5a623);
}

.tir-playoff__match:last-child { margin-bottom: 0; }

.tir-playoff__match--complete {
    border-color: rgba(67, 160, 71, 0.35);
    background: #FCFFFC;
}

.tir-playoff__match--final {
    border-color: #F5A623;
    background: #fff;
}

.tir-playoff__match--pending {
    opacity: 0.5;
    cursor: default;
}

.tir-playoff__match--pending:hover {
    background: #fff;
    border-color: var(--color-border, #e0e0e0);
}

.tir-playoff__match-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #f2f3f5;
    font-size: 11px;
    font-weight: 700;
    color: var(--text-secondary, #777);
    margin-bottom: 8px;
}

.tir-playoff__match-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto auto minmax(0, 1fr);
    align-items: center;
    gap: 8px;
}

.tir-playoff__player-name {
    font-size: 14px;
    font-weight: 500;
    color: #1F2233;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
}

.tir-playoff__player-name--right {
    text-align: right;
}

.tir-playoff__player-name--winner {
    color: #43A047;
    font-weight: 700;
}

.tir-playoff__score {
    font-size: 18px;
    font-weight: 700;
    color: #1F2233;
    min-width: 28px;
    text-align: center;
    flex-shrink: 0;
}

.tir-playoff__score--winner {
    color: #1F2233;
}

.tir-playoff__vs {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary, #999);
    min-width: 24px;
    text-align: center;
}

/* Winner block */
.tir-playoff__winner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px;
    border-radius: 16px;
    background: #EAF7EC;
    border: 1px solid rgba(67, 160, 71, 0.22);
}

.tir-playoff__winner-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #43A047;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.tir-playoff__winner-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.tir-playoff__winner-label {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    color: #43A047;
}

.tir-playoff__winner-name {
    font-size: 22px;
    font-weight: 800;
    color: #1F2233;
}

/* CTA */
.tir-playoff__cta {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 0 18px;
    border: 1px solid rgba(67, 160, 71, 0.45);
    border-radius: 14px;
    background: #fff;
    color: #1F2233;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s;
    width: 100%;
}

.tir-playoff__cta:hover {
    background: #f9fff9;
}

.tir-playoff__cta > :last-child {
    margin-left: auto;
    color: #43A047;
}
</style>
