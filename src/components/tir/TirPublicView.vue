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
        <div v-if="view === 'participants'">
            <TirParticipantsList ref="participantsList" :tournament="tournament" :readOnly="true"/>
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
                            <td class="tir-table__sticky-col tir-table__sticky-col--name tir-table__clickable" @click="openFromTable(row.id)">{{ row.name }}</td>
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
                            <span class="tir-playoff__progress-dot" :class="{'tir-playoff__progress-dot--complete': !round.isPreview && round.matches.every(m => isMatchComplete(m)), 'tir-playoff__progress-dot--final': round.isFinal}"></span>
                            <span v-if="rIdx < playoffDisplayRounds.length - 1" class="tir-playoff__progress-line"></span>
                        </div>
                        <div class="tir-playoff__round-content">
                            <h4 class="tir-playoff__round-title">{{ round.title }}</h4>
                            <div v-for="(match, mIdx) in round.matches" :key="mIdx" class="tir-playoff__match" :class="{'tir-playoff__match--complete': isMatchComplete(match), 'tir-playoff__match--in-progress': !isMatchComplete(match) && !match.preview && (match.score1 != null || match.score2 != null), 'tir-playoff__match--pending': !match.player1 || !match.player2, 'tir-playoff__match--preview': match.preview, 'tir-playoff__match--final': round.isFinal}" @click="!match.preview && openPlayoffMatch(match, round.title, round.key, mIdx)">
                                <div class="tir-playoff__match-top">
                                    <span class="tir-playoff__match-num">{{ round.laneStart ? round.laneStart + mIdx : mIdx + 1 }}</span>
                                    <span v-if="isMatchComplete(match)" class="tir-playoff__match-status tir-playoff__match-status--complete">{{ $t('tir.matchCompleted') }}</span>
                                    <span v-else-if="!match.preview && (match.score1 != null || match.score2 != null)" class="tir-playoff__match-status tir-playoff__match-status--progress">{{ $t('tir.matchInProgress') }}</span>
                                </div>
                                <div class="tir-playoff__match-row">
                                    <span class="tir-playoff__player-name" :class="{'tir-playoff__player-name--winner': getMatchWinner(match) === match.player1}">
                                        <Trophy v-if="getMatchWinner(match) === match.player1" :size="12" class="tir-playoff__winner-icon"/>
                                        <span v-html="formatName(match.preview ? match.previewLabel1 : match.player1)"></span>
                                    </span>
                                    <span class="tir-playoff__score" :class="{'tir-playoff__score--winner': getMatchWinner(match) === match.player1}">{{ match.score1 !== null ? match.score1 : '—' }}</span>
                                    <span class="tir-playoff__vs">vs</span>
                                    <span class="tir-playoff__score" :class="{'tir-playoff__score--winner': getMatchWinner(match) === match.player2}">{{ match.score2 !== null ? match.score2 : '—' }}</span>
                                    <span class="tir-playoff__player-name tir-playoff__player-name--right" :class="{'tir-playoff__player-name--winner': getMatchWinner(match) === match.player2}">
                                        <span v-html="formatName(match.preview ? match.previewLabel2 : match.player2)"></span>
                                        <Trophy v-if="getMatchWinner(match) === match.player2" :size="12" class="tir-playoff__winner-icon"/>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Winner block -->
                <div v-if="champion" class="tir-playoff__champion">
                    <div class="tir-playoff__champion-icon">
                        <Trophy :size="28" color="#fff"/>
                    </div>
                    <div class="tir-playoff__champion-info">
                        <span class="tir-playoff__champion-label">{{ $t('tir.tournamentWinner') }}</span>
                        <span class="tir-playoff__champion-name">{{ champion }}</span>
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
import {Users, TableProperties, Trophy, ChevronRight} from "lucide-vue-next";
import TirPlayoffComparison from "./TirPlayoffComparison.vue";
import TirParticipantsList from "./TirParticipantsList.vue";

import {SCORING, ATELIER_KEYS, getScoreTotal, buildTableRows, rankWithTiebreakers} from '@/services/tir';

export default {
    name: 'TirPublicView',
    components: {Users, TableProperties, Trophy, ChevronRight, TirPlayoffComparison, TirParticipantsList},
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
            activeBracket: 'r2',
            searchQuery: ''
        }
    },
    created() {
        if (!this.isTwoRoundSystem) {
            this.activeBracket = 'r1';
            if (this.tournament.tirPlayoff) this.view = 'playoff';
        } else if (this.tournament.tirPlayoff) {
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
        resultOptions() {
            return [{key: 'carreau'}, {key: 'reussi'}, {key: 'touche'}, {key: 'manque'}];
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
        filteredParticipants() {
            if (!this.searchQuery) return this.rankedParticipants;
            const q = this.searchQuery.toLowerCase();
            return this.rankedParticipants.filter(p => p.name.toLowerCase().includes(q) || (p.city && p.city.toLowerCase().includes(q)));
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

            if (!playoff.thirdPlace && !playoff.final && rounds.length) {
                const lastRound = rounds[rounds.length - 1];
                const lastMatches = lastRound.matches;
                if (lastMatches.length >= 2) {
                    const nextMatchCount = Math.floor(lastMatches.length / 2);
                    const previewMatches = [];
                    for (let i = 0; i < lastMatches.length; i += 2) {
                        const m1 = lastMatches[i];
                        const m2 = lastMatches[i + 1];
                        const w1 = this.getMatchWinner(m1);
                        const w2 = m2 ? this.getMatchWinner(m2) : null;
                        const p1 = w1 || this.$t('tir.matchPending');
                        const p2 = w2 || this.$t('tir.matchPending');
                        previewMatches.push({player1: w1 || null, player2: w2 || null, score1: null, score2: null, preview: true, previewLabel1: p1, previewLabel2: p2});
                    }

                    if (lastMatches.length === 2) {
                        const loser1 = this.getMatchLoser(lastMatches[0]);
                        const loser2 = this.getMatchLoser(lastMatches[1]);
                        const l1 = loser1 || this.$t('tir.matchPending');
                        const l2 = loser2 || this.$t('tir.matchPending');
                        rounds.push({
                            title: this.$t('tir.thirdPlaceMatch'),
                            matches: [{player1: loser1 || null, player2: loser2 || null, score1: null, score2: null, preview: true, previewLabel1: l1, previewLabel2: l2}],
                            key: `preview-third:${rounds.length}`,
                            isFinal: false,
                            isPreview: true,
                            laneStart: 2
                        });
                    }

                    if (previewMatches.length > 0) {
                        const isFinal = nextMatchCount === 1;
                        rounds.push({
                            title: isFinal ? this.$t('games.final') : this.getRoundTitle(nextMatchCount, playoffSize),
                            matches: previewMatches,
                            key: `preview:${rounds.length}`,
                            isFinal,
                            isPreview: true,
                            laneStart: isFinal ? 1 : 1
                        });
                    }
                }
            }

            if (playoff.thirdPlace) {
                rounds.push({
                    title: this.$t('tir.thirdPlaceMatch'),
                    matches: [playoff.thirdPlace],
                    key: 'third:0',
                    isFinal: false,
                    laneStart: 2
                });
            }

            if (playoff.final) {
                rounds.push({
                    title: this.$t('games.final'),
                    matches: [playoff.final],
                    key: 'final:0',
                    isFinal: true,
                    laneStart: 1
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
                getScoreTotal(b, 'scores') - getScoreTotal(a, 'scores')
            );
        },
        publicTableRows() {
            if (!this.isTwoRoundSystem) return [];
            const r2Ids = this.tournament.tirR2Participants || [];
            const tbCount = this.tournament.tirTiebreakerCount || 0;
            const r1Ranked = rankWithTiebreakers(this.participants, 'scores', tbCount);
            return buildTableRows({
                participants: this.participants,
                directIds: r1Ranked.slice(0, 4).map(p => p.id),
                r2Ids,
                r2CandidateIds: r1Ranked.slice(4, 16).map(p => p.id),
                playoff: this.tournament.tirPlayoff,
                currentRound: this.currentRound,
                isTwoRoundSystem: this.isTwoRoundSystem,
                hasPlayoffScores: this.playoffHasQf || this.playoffHasSf || this.playoffHasFinal,
                tiebreakerCount: tbCount,
                labels: {
                    direct: this.$t('tir.directQualifier'),
                    r2Qualifier: this.$t('tir.round2Qualifier'),
                    goToR2: this.$t('tir.goToRound2'),
                    eliminated: this.$t('tir.eliminated')
                }
            });
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
        expandParticipantById(id) {
            const index = this.rankedParticipants.findIndex(p => p.id === id);
            if (index !== -1) this.expandParticipant(index);
        },
        openFromTable(id) {
            this.view = 'participants';
            this.$nextTick(() => this.$refs.participantsList?.expandById(id));
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
            return !!match.complete || !!match.winner;
        },
        getMatchWinner(match) {
            return match.winner || null;
        },
        getMatchLoser(match) {
            const winner = this.getMatchWinner(match);
            if (!winner) return null;
            return winner === match.player1 ? match.player2 : match.player1;
        },
        formatName(name) {
            if (!name) return this.$t('tir.matchPending');
            const parts = name.split(' ');
            if (parts.length <= 1) return `<b>${name}</b>`;
            return `<b>${parts[0]}</b> ${parts.slice(1).join(' ')}`;
        },
        getRoundTitle(matchCount, playoffSize) {
            if (playoffSize === 2) return this.$t('games.final');
            if (matchCount === 2) return this.$t('tir.semifinal');
            if (matchCount === 4) return this.$t('tir.quarterfinal');
            if (matchCount === 8) return this.$t('tir.eighthFinal');
            if (matchCount === 16) return this.$t('tir.sixteenthFinal');
            return this.$t('tir.round') + ' ' + matchCount;
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
    background: var(--color-surface);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid var(--color-border);
}

.tir-nav {
    display: flex;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
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
    color: var(--color-text-muted);
    font-size: 11px;
    cursor: pointer;
    transition: color 0.2s;
}

.tir-nav__btn--active {
    color: var(--tir-touche);
}

.tir-nav__btn--participants.tir-nav__btn--active {
    color: var(--tir-delete);
}

.tir-nav__btn--table.tir-nav__btn--active {
    color: var(--tir-carreau);
}

.tir-nav__btn--playoff.tir-nav__btn--active {
    color: var(--tir-touche);
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
    background: var(--color-primary);
    color: var(--color-btn-text);
    margin-right: 6px;
    border: none;
    cursor: pointer;
}

.tir-scoring__round-hint {
    font-size: 12px;
    color: var(--color-text-muted);
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
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: none;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.15s;
}

.tir-scoring__bracket-btn--active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-btn-text);
}

.tir-scoring__search {
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

.tir-scoring__search:focus {
    border-color: var(--color-primary);
}

.tir-scoring__participant-club {
    display: block;
    font-size: 11px;
    color: var(--color-text-muted);
    font-weight: 400;
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
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
}

.tir-scoring__participant-row:hover {
    background: var(--color-surface-hover);
}

.tir-scoring__participant-rank {
    font-weight: 600;
    min-width: 20px;
    color: var(--color-text-muted);
}

.tir-scoring__participant-name {
    flex: 1;
    font-weight: 500;
}

.tir-scoring__participant-score {
    font-size: 13px;
    color: var(--color-text-muted);
}

.tir-scoring__participant-status { color: var(--color-grey); }
.tir-scoring__participant-status--complete { color: var(--color-success); }
.tir-scoring__participant-status--partial { color: var(--tir-touche); }

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
    color: var(--color-text);
}

.tir-pview__info { flex: 1; }
.tir-pview__name { margin: 0; font-size: 18px; color: var(--color-text); }
.tir-pview__total { margin-top: 4px; }
.tir-pview__total-score { font-size: 24px; font-weight: 700; color: var(--color-success); }
.tir-pview__total-max { font-size: 14px; color: var(--color-text-muted); }
.tir-pview__throws { font-size: 12px; color: var(--color-text-muted); }

.tir-pview__tabs { display: flex; gap: 6px; margin-bottom: 12px; }

.tir-pview__tab {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid var(--color-border);
    background: var(--color-surface);
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    color: var(--color-text);
    transition: all 0.2s;
}

.tir-pview__tab--active {
    background: var(--tir-touche);
    border-color: var(--tir-touche);
    color: var(--color-btn-text);
}

.tir-pview__tab--complete:not(.tir-pview__tab--active) {
    border-color: var(--color-success);
    color: var(--color-success);
}

.tir-pview__atelier {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 14px;
}

.tir-pview__atelier-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2px;
}

.tir-pview__atelier-header h4 { margin: 0; font-size: 16px; color: var(--color-text); }
.tir-pview__atelier-score { text-align: right; }
.tir-pview__atelier-score-val { font-size: 20px; font-weight: 700; color: var(--color-success); }
.tir-pview__atelier-score-max { font-size: 13px; color: var(--color-text-muted); }

.tir-pview__grid { margin-top: 10px; }
.tir-pview__grid-header { display: flex; gap: 3px; margin-bottom: 6px; }
.tir-pview__grid-corner { width: 32px; }
.tir-pview__grid-th { flex: 1; text-align: center; font-size: 10px; font-weight: 700; padding: 2px; }
.tir-pview__grid-th--carreau { color: var(--tir-carreau); }
.tir-pview__grid-th--reussi { color: var(--tir-reussi); }
.tir-pview__grid-th--touche { color: var(--tir-touche); }
.tir-pview__grid-th--manque { color: var(--tir-manque); }

.tir-pview__grid-row { display: flex; gap: 3px; margin-bottom: 3px; }
.tir-pview__grid-distance { width: 32px; display: flex; align-items: center; font-size: 12px; font-weight: 600; color: var(--color-text); }

.tir-pview__grid-cell {
    flex: 1;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid var(--color-border);
    background: radial-gradient(circle, var(--color-border) 56%, var(--color-surface) 56%);
    opacity: 0.4;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
}

.tir-pview__grid-cell--carreau { opacity: 1; border-color: var(--tir-carreau); background: radial-gradient(circle, var(--tir-carreau) 56%, var(--color-surface) 56%); color: var(--color-btn-text); }
.tir-pview__grid-cell--reussi { opacity: 1; border-color: var(--tir-reussi); background: radial-gradient(circle, var(--tir-reussi) 56%, var(--color-surface) 56%); color: var(--color-btn-text); }
.tir-pview__grid-cell--touche { opacity: 1; border-color: var(--tir-touche); background: radial-gradient(circle, var(--tir-touche) 56%, var(--color-surface) 56%); color: var(--color-btn-text); }
.tir-pview__grid-cell--manque { opacity: 1; border-color: var(--tir-manque); background: radial-gradient(circle, var(--tir-manque) 56%, var(--color-surface) 56%); color: var(--color-btn-text); }

/* Stacked ateliers (detail view) */
.tir-pview__atelier-card {
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 8px;
}

.tir-pview__atelier-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
}

.tir-pview__atelier-card-num {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--tir-touche);
    color: var(--color-btn-text);
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.tir-pview__atelier-card-name {
    font-weight: 700;
    font-size: 14px;
    flex: 1;
}

.tir-pview__atelier-card-score {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-muted);
}

.tir-pview__circles-grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.tir-pview__circles-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.tir-pview__circles-dist {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-muted);
    min-width: 24px;
    order: -1;
}

.tir-pview__circle {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid var(--color-border);
    background: radial-gradient(circle, var(--color-border) 56%, var(--color-surface) 56%);
    opacity: 0.35;
}

.tir-pview__circle--active { opacity: 1; }
.tir-pview__circle--active.tir-pview__circle--carreau { border-color: var(--tir-carreau); background: radial-gradient(circle, var(--tir-carreau) 56%, var(--color-surface) 56%); }
.tir-pview__circle--active.tir-pview__circle--reussi { border-color: var(--tir-reussi); background: radial-gradient(circle, var(--tir-reussi) 56%, var(--color-surface) 56%); }
.tir-pview__circle--active.tir-pview__circle--touche { border-color: var(--tir-touche); background: radial-gradient(circle, var(--tir-touche) 56%, var(--color-surface) 56%); }
.tir-pview__circle--active.tir-pview__circle--manque { border-color: var(--tir-manque); background: radial-gradient(circle, var(--tir-manque) 56%, var(--color-surface) 56%); }

/* Table */
.tir-table__content {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.tir-table__content th {
    text-align: left;
    padding: 10px 8px;
    border-bottom: 2px solid var(--color-border);
    font-weight: 600;
    font-size: 12px;
    color: var(--color-text-muted);
    text-transform: uppercase;
}

.tir-table__content td {
    padding: 10px 8px;
    border-bottom: 1px solid var(--color-border-light);
    white-space: nowrap;
    color: var(--color-text);
}

.tir-table__row--qualified td {
    background: var(--color-highlight);
}

.tir-table__row--direct td {
    background: var(--tir-row-direct-bg, rgba(76, 175, 80, 0.08));
}

.tir-table__row--r2 td {
    background: var(--tir-row-r2-bg, rgba(245, 166, 35, 0.08));
}

.tir-table__row--eliminated td {
    color: var(--color-text-muted);
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
    background-color: var(--color-surface);
    background-image: none;
}

.tir-table__content tr.tir-table__row--direct td.tir-table__sticky-col {
    background-color: var(--color-surface);
    background-image: linear-gradient(var(--tir-row-direct-bg, rgba(76, 175, 80, 0.08)), var(--tir-row-direct-bg, rgba(76, 175, 80, 0.08)));
}

.tir-table__content tr.tir-table__row--r2 td.tir-table__sticky-col {
    background-color: var(--color-surface);
    background-image: linear-gradient(var(--tir-row-r2-bg, rgba(245, 166, 35, 0.08)), var(--tir-row-r2-bg, rgba(245, 166, 35, 0.08)));
}

.tir-table__content tr.tir-table__row--eliminated td.tir-table__sticky-col {
    background-color: var(--color-surface);
    background-image: none;
}

.place-gold td {
    background: var(--color-badge-gold-bg) !important;
}

.place-gold td:first-child {
    border-left: 3px solid var(--color-badge-gold-border);
}

.place-gold td.tir-table__sticky-col {
    background-color: var(--color-surface) !important;
    background-image: linear-gradient(var(--color-badge-gold-bg), var(--color-badge-gold-bg)) !important;
}

.place-silver td {
    background: var(--color-badge-silver-bg) !important;
}

.place-silver td:first-child {
    border-left: 3px solid var(--color-badge-silver-border);
}

.place-silver td.tir-table__sticky-col {
    background-color: var(--color-surface) !important;
    background-image: linear-gradient(var(--color-badge-silver-bg), var(--color-badge-silver-bg)) !important;
}

.place-bronze td {
    background: var(--color-badge-bronze-bg) !important;
}

.place-bronze td:first-child {
    border-left: 3px solid var(--color-badge-bronze-border);
}

.place-bronze td.tir-table__sticky-col {
    background-color: var(--color-surface) !important;
    background-image: linear-gradient(var(--color-badge-bronze-bg), var(--color-badge-bronze-bg)) !important;
}

.tir-table__clickable {
    cursor: pointer;
    font-weight: 500;
    color: var(--color-text);
}

.tir-table__clickable:hover {
    text-decoration: underline;
}

.tir-table__empty {
    text-align: center;
    padding: 40px;
    color: var(--color-text-muted);
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
    border: 2px solid var(--color-border);
    background: var(--color-surface);
    flex-shrink: 0;
}

.tir-playoff__progress-dot--complete {
    border-color: var(--tir-winner);
    background: var(--tir-winner);
}

.tir-playoff__progress-dot--final {
    border-color: var(--tir-touche);
    background: var(--tir-touche);
}

.tir-playoff__progress-line {
    width: 2px;
    flex: 1;
    background: var(--color-border);
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
    color: var(--color-text-muted);
    text-transform: uppercase;
}

.tir-playoff__match {
    padding: 12px 14px;
    border: 1px solid var(--color-border);
    border-radius: 14px;
    margin-bottom: 8px;
    cursor: pointer;
    background: var(--color-surface);
    transition: background 0.15s, border-color 0.15s;
}

.tir-playoff__match:hover {
    background: var(--color-surface-hover);
    border-color: var(--tir-touche);
}

.tir-playoff__match:last-child { margin-bottom: 0; }

.tir-playoff__match--complete {
    border-color: var(--tir-carreau);
    background: rgba(76, 175, 80, 0.06);
    border-width: 2px;
}

.tir-playoff__match--complete .tir-playoff__match-num {
    background: var(--tir-carreau);
    color: var(--color-btn-text);
}

.tir-playoff__match--in-progress {
    border-color: var(--color-primary);
    background: var(--color-primary-bg);
    border-width: 2px;
}

.tir-playoff__match--in-progress .tir-playoff__match-num {
    background: var(--color-primary);
    color: var(--color-btn-text);
}

.tir-playoff__match--final {
    border-color: var(--tir-touche);
    background: var(--color-surface);
}

.tir-playoff__match--pending {
    opacity: 0.5;
    cursor: default;
}

.tir-playoff__match--pending:hover {
    background: var(--color-surface);
    border-color: var(--color-border);
}

.tir-playoff__match--preview {
    opacity: 0.55;
    cursor: default;
    border-style: dashed;
}

.tir-playoff__match--preview:hover {
    background: var(--color-surface);
    border-color: var(--color-border);
}

.tir-playoff__match-top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.tir-playoff__match-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--color-surface-alt);
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-muted);
}

.tir-playoff__match-status {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
}

.tir-playoff__match-status--complete {
    color: var(--tir-winner-text);
    background: rgba(76, 175, 80, 0.12);
}

.tir-playoff__match-status--progress {
    color: var(--tir-in-progress);
    background: var(--tir-in-progress-bg);
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
    color: var(--color-text);
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    min-width: 0;
    word-break: break-word;
}


.tir-playoff__player-name--right {
    text-align: right;
}

.tir-playoff__player-name--winner {
    color: var(--tir-winner);
    font-weight: 700;
}

.tir-playoff__winner-icon {
    color: var(--tir-winner);
    width: 12px;
    height: 12px;
    vertical-align: -1px;
    flex-shrink: 0;
    display: inline-block;
    margin-left: 4px;
}

.tir-playoff__score {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text);
    min-width: 28px;
    text-align: center;
    flex-shrink: 0;
}

.tir-playoff__score--winner {
    color: var(--color-text);
}

.tir-playoff__vs {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-muted);
    min-width: 24px;
    text-align: center;
}

/* Champion block */
.tir-playoff__champion {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px;
    border-radius: 16px;
    background: rgba(76, 175, 80, 0.08);
    border: 1px solid rgba(67, 160, 71, 0.22);
}

.tir-playoff__champion-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--tir-winner);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.tir-playoff__champion-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.tir-playoff__champion-label {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--tir-winner);
}

.tir-playoff__champion-name {
    font-size: 22px;
    font-weight: 800;
    color: var(--color-text);
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
    background: var(--color-surface);
    color: var(--color-text);
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s;
    width: 100%;
}

.tir-playoff__cta:hover {
    background: var(--color-surface-hover);
}

.tir-playoff__cta > :last-child {
    margin-left: auto;
    color: var(--tir-winner);
}

@media (max-width: 400px) {
    .tir-playoff__round {
        padding: 0 8px;
    }
}

@media (max-width: 450px) {
    .tir-playoff__match {
        padding: 10px 10px;
    }

    .tir-playoff__match-row {
        gap: 4px;
    }

    .tir-playoff__player-name {
        font-size: 12px;
    }

    .tir-playoff__score {
        font-size: 16px;
        min-width: 22px;
    }

    .tir-playoff__vs {
        font-size: 11px;
        min-width: 18px;
    }

    .tir-playoff__winner-icon {
        width: 10px;
        height: 10px;
    }
}
</style>
