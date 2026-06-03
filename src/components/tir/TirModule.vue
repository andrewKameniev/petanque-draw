<template>
    <div class="tir-module">
        <div class="tir-nav">
            <button class="tir-nav__btn" :class="{'tir-nav__btn--active': view === 'participants'}" @click="view = 'participants'">
                <Users :size="18"/>
                <span>{{ $t('tir.participants') }}</span>
            </button>
            <button class="tir-nav__btn" :class="{'tir-nav__btn--active': view === 'scoring'}" @click="view = 'scoring'">
                <Grid3x3 :size="18"/>
                <span>{{ $t('tir.scoring') }}</span>
            </button>
            <button class="tir-nav__btn" :class="{'tir-nav__btn--active': view === 'table'}" @click="view = 'table'">
                <TableProperties :size="18"/>
                <span>{{ $t('tir.table') }}</span>
            </button>
            <button v-if="tournament.tirPlayoff" class="tir-nav__btn" :class="{'tir-nav__btn--active': view === 'playoff'}" @click="view = 'playoff'">
                <Trophy :size="18"/>
                <span>{{ $t('games.playOff') }}</span>
            </button>
            <span v-if="isTwoRoundSystem" class="tir-nav__round-badge">R{{ currentRound }}</span>
        </div>

        <!-- Participants list -->
        <div v-if="view === 'participants'" class="tir-participants">
            <div class="tir-participants__header" v-if="!tournament.tirStarted">
                <button class="tir-participants__add" @click="showAddParticipant = true">
                    <Plus :size="18"/>
                </button>
            </div>
            <input v-if="tirParticipants.length > 3" class="tir-participants__search" type="text" v-model="searchQuery" :placeholder="$t('teams.searchTeam')"/>

            <div class="tir-participants__list">
                <div v-for="(participant, index) in filteredParticipants" :key="participant.id" class="tir-participant-card">
                    <div class="tir-participant-card__lane" @click.stop="startLaneSwap(participant)">{{ getParticipantLane(participant) }}</div>
                    <div class="tir-participant-card__body" @click="openParticipantScoring(participant)">
                        <div class="tir-participant-card__info">
                            <div class="tir-participant-card__name">{{ participant.name }}</div>
                            <div class="tir-participant-card__city" v-if="participant.city">{{ participant.city }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lane swap modal -->
            <Modal v-if="swapParticipant" @close-modal="swapParticipant = null">
                <h4 class="tir-add-form__title">{{ $t('games.lane') }} {{ getParticipantLane(swapParticipant) }} — {{ swapParticipant.name }}</h4>
                <div class="tir-add-form">
                    <input class="tir-add-form__input" type="number" min="1" :max="tirParticipants.length" v-model.number="swapTarget" :placeholder="$t('games.lane')" @keyup.enter="confirmLaneSwap"/>
                    <button class="tir-add-form__btn" @click="confirmLaneSwap" :disabled="!swapTarget">
                        {{ $t('games.shuffleLanes') }}
                    </button>
                </div>
            </Modal>

            <!-- Add participant modal -->
            <Modal v-if="showAddParticipant" @close-modal="showAddParticipant = false">
                <h4 class="tir-add-form__title">{{ $t('tir.addParticipant') }}</h4>
                <div class="tir-add-form">
                    <input class="tir-add-form__input" v-model="newParticipant.name" :placeholder="$t('tir.participantName')" @keyup.enter="addParticipant"/>
                    <input class="tir-add-form__input" v-model="newParticipant.city" :placeholder="$t('tir.city')"/>
                    <button class="tir-add-form__btn" @click="addParticipant" :disabled="!newParticipant.name.trim()">
                        {{ $t('teams.addTeam') }}
                    </button>
                </div>
            </Modal>
        </div>

        <!-- Scoring view (per participant or per atelier) -->
        <div v-if="view === 'scoring'" class="tir-scoring">
            <div class="tir-scoring__mode-toggle">
                <button class="tir-scoring__mode-btn" :class="{'tir-scoring__mode-btn--active': scoringMode === 'participant'}" @click="scoringMode = 'participant'">
                    {{ $t('tir.byParticipant') }}
                </button>
                <button class="tir-scoring__mode-btn" :class="{'tir-scoring__mode-btn--active': scoringMode === 'atelier'}" @click="scoringMode = 'atelier'">
                    {{ $t('tir.byAtelier') }}
                </button>
            </div>

            <!-- By participant mode -->
            <template v-if="scoringMode === 'participant'">
                <div v-if="!activeParticipant" class="tir-scoring__select">
                    <div v-for="(participant, index) in scoringListParticipants" :key="participant.id" class="tir-scoring__participant-row" @click="activeParticipant = participant">
                        <span class="tir-scoring__participant-rank">{{ index + 1 }}</span>
                        <div class="tir-scoring__participant-info">
                            <div class="tir-scoring__participant-name">{{ participant.name }}</div>
                            <div class="tir-scoring__progress-bar">
                                <div class="tir-scoring__progress-fill" :style="{width: getProgressPercent(participant) + '%'}"></div>
                            </div>
                            <div class="tir-scoring__progress-meta">
                                <span class="tir-scoring__progress-text">{{ getThrowsCompleted(participant) }} / {{ totalThrows }} {{ $t('tir.throws') }}</span>
                                <span class="tir-scoring__progress-pct">{{ getProgressPercent(participant) }}%</span>
                            </div>
                        </div>
                        <div class="tir-scoring__participant-right">
                            <span class="tir-scoring__participant-score"><strong>{{ getParticipantTotal(participant) }}</strong><span class="tir-scoring__score-max">/{{ maxTotalScore }}</span></span>
                            <span class="tir-scoring__participant-status" :class="getStatusClass(participant)">
                                <CheckCircle v-if="isParticipantComplete(participant)" :size="16"/>
                                <AlertCircle v-else-if="getThrowsCompleted(participant) > 0" :size="16"/>
                                <Circle v-else :size="16"/>
                            </span>
                        </div>
                    </div>
                </div>
                <TirParticipantView v-else
                    :participant="activeParticipant"
                    :ateliers="tirAteliers"
                    :distances="tirDistances"
                    :scoresKey="activeScoresKey"
                    @back="activeParticipant = null"
                    @update="onScoreUpdate"
                    @next="goToNextParticipant"/>
            </template>

            <!-- By atelier mode -->
            <template v-if="scoringMode === 'atelier'">
                <div v-if="activeAtelier === null" class="tir-scoring__ateliers">
                    <div v-for="(atelier, index) in tirAteliers" :key="index" class="tir-scoring__atelier-card" @click="activeAtelier = index">
                        <div class="tir-scoring__atelier-num">{{ index + 1 }}</div>
                        <div class="tir-scoring__atelier-info">
                            <div class="tir-scoring__atelier-name">{{ atelier.name }}</div>
                            <div class="tir-scoring__atelier-desc">{{ atelier.description }}</div>
                        </div>
                        <div class="tir-scoring__atelier-progress">{{ getAtelierCompletedCount(index) }}/{{ activeScoringParticipants.length }}</div>
                    </div>
                </div>
                <TirAtelierView v-else
                    :atelierIndex="activeAtelier"
                    :atelier="tirAteliers[activeAtelier]"
                    :participants="activeScoringParticipantsAlphabetic"
                    :distances="tirDistances"
                    :scoresKey="activeScoresKey"
                    @back="activeAtelier = null"
                    @update="onScoreUpdate"
                    @finish="finishAtelier"/>
            </template>
        </div>

        <!-- Results table -->
        <div v-if="view === 'table'" class="tir-table">
            <div class="tir-table__header">
                <h3>{{ $t('tir.resultsTable') }}</h3>
            </div>
            <div v-if="tirParticipants.length" class="tir-table__scroll">
                <table class="tir-table__content">
                    <thead>
                        <tr v-if="isTwoRoundSystem">
                            <th class="tir-table__sticky-col">#</th>
                            <th class="tir-table__sticky-col tir-table__sticky-col--name">{{ $t('tir.participant') }}</th>
                            <th>{{ $t('tir.round1Score') }}</th>
                            <th v-if="currentRound >= 2">{{ $t('tir.round2Score') }}</th>
                            <th v-if="currentRound >= 2">{{ $t('tir.combinedScore') }}</th>
                            <th v-if="tournament.tirPlayoff">{{ $t('tir.quarterfinal') }}</th>
                            <th v-if="tournament.tirPlayoff">{{ $t('tir.semifinal') }}</th>
                            <th v-if="tournament.tirPlayoff">{{ $t('games.final') }}</th>
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
                        <tr v-for="(row, index) in tableRows" :key="row.id" :class="row.rowClass">
                            <td class="tir-table__sticky-col">{{ index + 1 }}</td>
                            <td class="tir-table__sticky-col tir-table__sticky-col--name">{{ row.name }}</td>
                            <td>{{ row.r1 }}</td>
                            <td v-if="currentRound >= 2">{{ row.r2 }}</td>
                            <td v-if="currentRound >= 2"><strong>{{ row.combined }}</strong></td>
                            <td v-if="tournament.tirPlayoff">{{ row.qf }}</td>
                            <td v-if="tournament.tirPlayoff">{{ row.sf }}</td>
                            <td v-if="tournament.tirPlayoff">{{ row.final }}</td>
                            <td>{{ row.place }}</td>
                        </tr>
                    </tbody>
                    <tbody v-else>
                        <tr v-for="(participant, index) in rankedParticipants" :key="participant.id" :class="{'tir-table__row--qualified': canStartPlayoff && index < qualifyCount}">
                            <td>{{ index + 1 }}</td>
                            <td>{{ participant.name }}</td>
                            <td><strong>{{ getParticipantTotal(participant) }}</strong> / {{ maxTotalScore }}</td>
                            <td>{{ getThrowsCompleted(participant) }} / {{ totalThrows }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-else class="tir-table__empty">{{ $t('tir.noParticipants') }}</div>

            <!-- 2-round: transition to R2 -->
            <div v-if="canTransitionToRound2 && !tournament.tirPlayoff" class="tir-table__actions">
                <p class="tir-table__hint">{{ $t('tir.round2Hint') }}</p>
                <div class="tir-table__actions-row">
                    <button class="tir-table__playoff-btn" @click="startRound2">
                        {{ $t('tir.startRound2') }}
                    </button>
                </div>
            </div>

            <!-- Start playoff or finish -->
            <div v-else-if="canStartPlayoff && !tournament.tournamentIsFinished && !tournament.tirPlayoff" class="tir-table__actions">
                <div v-if="!isTwoRoundSystem" class="tir-table__playoff-row">
                    <span class="tir-table__playoff-label">{{ $t('tir.qualifiedForPlayoff') }}:</span>
                    <select class="tir-table__playoff-select" v-model.number="qualifyCount">
                        <option v-for="v in qualifyOptions" :key="v" :value="v">{{ v }}</option>
                    </select>
                </div>
                <div class="tir-table__actions-row">
                    <button class="tir-table__playoff-btn" @click="startTirPlayoff">
                        {{ $t('tir.startPlayoff') }}
                    </button>
                    <span class="tir-table__actions-or">{{ $t('common.or') }}</span>
                    <button class="tir-table__finish-btn" @click="$emit('finish')">
                        {{ $t('teams.finishTournament') }}
                    </button>
                </div>
            </div>
            <div v-else-if="!tournament.tournamentIsFinished && !tournament.tirPlayoff && tirParticipants.length && !canTransitionToRound2" class="tir-table__actions">
                <div class="tir-table__actions-row">
                    <button class="tir-table__finish-btn" @click="$emit('finish')">
                        {{ $t('teams.finishTournament') }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Playoff view -->
        <div v-if="view === 'playoff' && tournament.tirPlayoff" class="tir-playoff">
            <!-- Match scoring mode -->
            <TirPlayoffMatch v-if="activePlayoffMatch"
                :match="activePlayoffMatch"
                :ateliers="tirAteliers"
                :distances="tirDistances"
                :roundLabel="activePlayoffMatchLabel"
                @back="closePlayoffMatch"
                @update="onPlayoffScoreChange"/>

            <!-- Bracket view -->
            <template v-else>
                <div v-for="(round, rIdx) in playoffDisplayRounds" :key="rIdx" class="tir-playoff__round" :class="{'tir-playoff__round--final': round.isFinal}">
                    <h4 class="tir-playoff__round-title">{{ round.title }}</h4>
                    <div v-for="(match, mIdx) in round.matches" :key="mIdx" class="tir-playoff__match" :class="{'tir-playoff__match--complete': match.complete || (match.score1 != null && match.score2 != null && match.score1 !== match.score2), 'tir-playoff__match--pending': !match.player1 || !match.player2}" @click="openPlayoffMatch(match, round.title)">
                        <span v-if="round.matches.length > 1" class="tir-playoff__lane">{{ mIdx + 1 }}</span>
                        <div class="tir-playoff__player" :class="{'tir-playoff__player--winner': match.winner === match.player1}">
                            <span class="tir-playoff__player-name">{{ match.player1 || '—' }}</span>
                            <span class="tir-playoff__player-score" v-if="match.score1 !== null">{{ match.score1 }}</span>
                        </div>
                        <div class="tir-playoff__vs">vs</div>
                        <div class="tir-playoff__player" :class="{'tir-playoff__player--winner': match.winner === match.player2}">
                            <span class="tir-playoff__player-name">{{ match.player2 || '—' }}</span>
                            <span class="tir-playoff__player-score" v-if="match.score2 !== null">{{ match.score2 }}</span>
                        </div>
                        <div class="tir-playoff__match-action">
                            <Pencil :size="14" v-if="match.player1 && match.player2"/>
                        </div>
                    </div>
                </div>

                <!-- Finish tournament button -->
                <button v-if="canFinishPlayoff" class="tir-playoff__advance-btn" @click="finishPlayoffTournament">
                    {{ $t('teams.finishTournament') }}
                </button>
            </template>
        </div>
    </div>
</template>

<script>
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import Modal from "@/components/Modal";
import TirParticipantView from "./TirParticipantView.vue";
import TirAtelierView from "./TirAtelierView.vue";
import TirPlayoffMatch from "./TirPlayoffMatch.vue";
import {Users, Grid3x3, TableProperties, Plus, CheckCircle, AlertCircle, Circle, Trophy, Pencil} from "lucide-vue-next";

const ATELIER_KEYS = ['atelier1', 'atelier2', 'atelier3', 'atelier4', 'atelier5'];

const SCORING = {
    carreau: 5,
    reussi: 3,
    touche: 1,
    manque: 0
};

const DISTANCES_FULL = [6, 7, 8, 9];
const DISTANCES_JUNIOR = [6, 7, 8];

export default {
    name: 'TirModule',
    components: {Modal, TirParticipantView, TirAtelierView, TirPlayoffMatch, Users, Grid3x3, TableProperties, Plus, CheckCircle, AlertCircle, Circle, Trophy, Pencil},
    emits: ['finish'],
    data() {
        return {
            view: 'scoring',
            scoringMode: 'participant',
            activeParticipant: null,
            activeAtelier: null,
            searchQuery: '',
            showAddParticipant: false,
            newParticipant: {name: '', city: ''},
            qualifyCount: 4,
            activePlayoffMatch: null,
            activePlayoffMatchLabel: '',
            swapParticipant: null,
            swapTarget: null
        }
    },
    created() {
        if (this.currentTournament?.tirPlayoff) {
            this.view = 'playoff';
        }
    },
    watch: {
        qualifyOptions(opts) {
            if (opts.length && !opts.includes(this.qualifyCount)) {
                this.qualifyCount = opts[opts.length - 1];
            }
        }
    },
    computed: {
        ...mapState(useMainStore, ['currentTournament']),
        tournament() {
            return this.currentTournament;
        },
        tirConfig() {
            if (!this.tournament.tirConfig) {
                this.tournament.tirConfig = {junior: false, rounds: 1};
            }
            return this.tournament.tirConfig;
        },
        isTwoRoundSystem() {
            return this.tirConfig.rounds === 2;
        },
        currentRound() {
            return this.tournament.tirRound || 1;
        },
        isRound2() {
            return this.currentRound === 2;
        },
        activeScoresKey() {
            return this.isRound2 ? 'scores2' : 'scores';
        },
        tirParticipants() {
            return this.tournament.tirParticipants || [];
        },
        tirAteliers() {
            return ATELIER_KEYS.map(key => ({
                name: this.$t(`tir.${key}`),
                description: this.$t(`tir.${key}Desc`)
            }));
        },
        tirDistances() {
            return this.tirConfig.junior ? DISTANCES_JUNIOR : DISTANCES_FULL;
        },
        totalThrows() {
            return 5 * this.tirDistances.length;
        },
        maxAtelierScore() {
            return this.tirDistances.length * SCORING.carreau;
        },
        maxTotalScore() {
            return 5 * this.maxAtelierScore;
        },
        round2ParticipantIds() {
            return this.tournament.tirR2Participants || [];
        },
        round2Participants() {
            if (!this.isTwoRoundSystem) return [];
            return this.tirParticipants.filter(p => this.round2ParticipantIds.includes(p.id));
        },
        activeScoringParticipants() {
            if (this.isRound2) return this.round2Participants;
            return this.tirParticipants;
        },
        activeScoringParticipantsAlphabetic() {
            return [...this.activeScoringParticipants].sort((a, b) => a.name.localeCompare(b.name));
        },
        scoringListParticipants() {
            const list = this.activeScoringParticipants;
            return [...list].sort((a, b) =>
                this.getParticipantTotal(b) - this.getParticipantTotal(a) ||
                this.getCarreauCount(b) - this.getCarreauCount(a)
            );
        },
        rankedParticipants() {
            return [...this.tirParticipants].sort((a, b) => this.getParticipantTotal(b) - this.getParticipantTotal(a) || this.getCarreauCount(b) - this.getCarreauCount(a));
        },
        r1RankedParticipants() {
            return [...this.tirParticipants].sort((a, b) =>
                this.getScoreTotal(b, 'scores') - this.getScoreTotal(a, 'scores') ||
                this.getScoreCarreauCount(b, 'scores') - this.getScoreCarreauCount(a, 'scores')
            );
        },
        directQualifiers() {
            if (!this.isTwoRoundSystem) return [];
            return this.r1RankedParticipants.slice(0, 4);
        },
        alphabeticParticipants() {
            return [...this.tirParticipants].sort((a, b) => a.name.localeCompare(b.name));
        },
        laneSortedParticipants() {
            return [...this.tirParticipants].sort((a, b) => this.getParticipantLane(a) - this.getParticipantLane(b));
        },
        filteredParticipants() {
            const list = this.laneSortedParticipants;
            if (!this.searchQuery) return list;
            const q = this.searchQuery.toLowerCase();
            return list.filter(p => p.name.toLowerCase().includes(q) || (p.city && p.city.toLowerCase().includes(q)));
        },
        isRound1Complete() {
            return this.tirParticipants.every(p => this.isParticipantCompleteForKey(p, 'scores'));
        },
        canTransitionToRound2() {
            return this.isTwoRoundSystem && this.currentRound === 1 && this.isRound1Complete;
        },
        canStartPlayoff() {
            if (this.isTwoRoundSystem) {
                if (this.currentRound < 2) return false;
                return this.round2Participants.every(p => this.isParticipantCompleteForKey(p, 'scores2'));
            }
            const completedCount = this.tirParticipants.filter(p => this.isParticipantComplete(p)).length;
            return completedCount >= 2;
        },
        qualifyOptions() {
            const completedCount = this.tirParticipants.filter(p => this.isParticipantComplete(p)).length;
            const opts = [];
            for (let i = 2; i <= Math.min(completedCount, 64); i *= 2) {
                opts.push(i);
            }
            return opts;
        },
        tableRows() {
            if (!this.isTwoRoundSystem) return [];
            const playoff = this.tournament.tirPlayoff;
            const directIds = this.directQualifiers.map(p => p.id);
            const r2Ids = this.round2ParticipantIds;

            const allPlayers = this.r1RankedParticipants.map(p => {
                const isDirect = directIds.includes(p.id);
                const isR2 = r2Ids.includes(p.id);
                const r1Score = this.getScoreTotal(p, 'scores');
                const r2Score = isR2 ? this.getScoreTotal(p, 'scores2') : null;
                const combined = isR2 ? r1Score + r2Score : r1Score;

                let place = '';
                let rowClass = '';
                if (isDirect) {
                    rowClass = 'tir-table__row--direct';
                    place = this.$t('tir.directQualifier');
                } else if (isR2) {
                    rowClass = 'tir-table__row--r2';
                } else {
                    rowClass = 'tir-table__row--eliminated';
                    place = this.$t('tir.eliminated');
                }

                const matchScores = this.getPlayoffMatchScores(p.name, playoff);

                return {
                    id: p.id,
                    name: p.name,
                    r1: `${r1Score}/${this.maxTotalScore}`,
                    r2: isDirect ? '—' : (r2Score !== null ? `${r2Score}/${this.maxTotalScore}` : ''),
                    combined: isR2 ? `${combined}/${this.maxTotalScore * 2}` : (isDirect ? `${r1Score}/${this.maxTotalScore}` : ''),
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
        },
        playoffDisplayRounds() {
            const playoff = this.tournament.tirPlayoff;
            if (!playoff) return [];
            const rounds = [];
            const playoffSize = playoff.size || 2;

            if (playoff.rounds && playoff.rounds.length) {
                playoff.rounds.forEach((round, rIdx) => {
                    rounds.push({
                        title: this.getPlayoffRoundTitle(rIdx, round.matches.length, playoffSize),
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
        canFinishPlayoff() {
            const playoff = this.tournament.tirPlayoff;
            if (!playoff) return false;
            if (this.tournament.tournamentIsFinished) return false;
            if (!playoff.final || !playoff.final.complete) return false;
            if (playoff.thirdPlace && !playoff.thirdPlace.complete) return false;
            return true;
        }
    },
    methods: {
        ...mapActions(useMainStore, ['syncToFirebase', 'showMessage']),
        getScoreTotal(participant, key) {
            if (!participant[key]) return 0;
            let total = 0;
            Object.values(participant[key]).forEach(atelier => {
                if (atelier && typeof atelier === 'object') {
                    Object.values(atelier).forEach(val => { total += SCORING[val] || 0; });
                }
            });
            return total;
        },
        getScoreCarreauCount(participant, key) {
            if (!participant[key]) return 0;
            let count = 0;
            Object.values(participant[key]).forEach(atelier => {
                if (atelier && typeof atelier === 'object') {
                    Object.values(atelier).forEach(val => { if (val === 'carreau') count++; });
                }
            });
            return count;
        },
        getCombinedTotal(participant) {
            return this.getScoreTotal(participant, 'scores') + this.getScoreTotal(participant, 'scores2');
        },
        isParticipantCompleteForKey(participant, key) {
            if (!participant[key]) return false;
            let count = 0;
            Object.values(participant[key]).forEach(atelier => {
                if (atelier && typeof atelier === 'object') {
                    count += Object.keys(atelier).length;
                }
            });
            return count >= this.totalThrows;
        },
        getPlayoffMatchScores(playerName, playoff) {
            const result = {qf: '', sf: '', final: ''};
            if (!playoff) return result;
            if (playoff.rounds) {
                playoff.rounds.forEach(round => {
                    round.matches.forEach(m => {
                        if (m.player1 === playerName || m.player2 === playerName) {
                            const score = m.player1 === playerName ? m.score1 : m.score2;
                            if (score !== null) {
                                if (round.matches.length >= 4) result.qf = `${score}/${this.maxTotalScore}`;
                                else if (round.matches.length === 2) result.sf = `${score}/${this.maxTotalScore}`;
                            }
                        }
                    });
                });
            }
            if (playoff.final && (playoff.final.player1 === playerName || playoff.final.player2 === playerName)) {
                const score = playoff.final.player1 === playerName ? playoff.final.score1 : playoff.final.score2;
                if (score !== null) result.final = `${score}/${this.maxTotalScore}`;
            }
            if (playoff.thirdPlace && (playoff.thirdPlace.player1 === playerName || playoff.thirdPlace.player2 === playerName)) {
                const score = playoff.thirdPlace.player1 === playerName ? playoff.thirdPlace.score1 : playoff.thirdPlace.score2;
                if (score !== null) result.final = `${score}/${this.maxTotalScore}`;
            }
            return result;
        },
        startRound2() {
            const r1Ranked = this.r1RankedParticipants;
            const r2Qualifiers = r1Ranked.slice(4, 16);
            this.tournament.tirR2Participants = r2Qualifiers.map(p => p.id);
            r2Qualifiers.forEach(p => {
                if (!p.scores2) p.scores2 = {};
            });
            this.tournament.tirRound = 2;
            this.syncToFirebase();
        },
        addParticipant() {
            if (!this.newParticipant.name.trim()) return;
            if (!this.tournament.tirParticipants) {
                this.tournament.tirParticipants = [];
            }
            const exists = this.tirParticipants.find(p => p.name.toLowerCase() === this.newParticipant.name.trim().toLowerCase());
            if (exists) {
                this.showMessage({title: this.$t('messages.error'), text: this.$t('messages.teamExists'), type: 'error'});
                return;
            }
            this.tournament.tirParticipants.push({
                id: Date.now(),
                name: this.newParticipant.name.trim(),
                city: this.newParticipant.city.trim(),
                scores: {},
                lane: this.tirParticipants.length + 1
            });
            this.newParticipant = {name: '', city: ''};
            this.showAddParticipant = false;
            this.syncToFirebase();
        },
        getParticipantLane(participant) {
            if (participant.lane) return participant.lane;
            const idx = this.tirParticipants.indexOf(participant);
            return idx + 1;
        },
        startLaneSwap(participant) {
            this.swapParticipant = participant;
            this.swapTarget = null;
        },
        confirmLaneSwap() {
            if (!this.swapTarget || !this.swapParticipant) return;
            const targetLane = this.swapTarget;
            const sourceLane = this.getParticipantLane(this.swapParticipant);
            if (targetLane === sourceLane) { this.swapParticipant = null; return; }
            const targetParticipant = this.tirParticipants.find(p => this.getParticipantLane(p) === targetLane);
            this.swapParticipant.lane = targetLane;
            if (targetParticipant) {
                targetParticipant.lane = sourceLane;
            }
            this.swapParticipant = null;
            this.syncToFirebase();
        },
        openParticipantScoring(participant) {
            this.activeParticipant = participant;
            this.view = 'scoring';
            this.scoringMode = 'participant';
        },
        getParticipantTotal(participant) {
            return this.getScoreTotal(participant, this.activeScoresKey);
        },
        getCarreauCount(participant) {
            return this.getScoreCarreauCount(participant, this.activeScoresKey);
        },
        getThrowsCompleted(participant) {
            const key = this.activeScoresKey;
            if (!participant[key]) return 0;
            let count = 0;
            Object.values(participant[key]).forEach(atelier => {
                if (atelier && typeof atelier === 'object') {
                    count += Object.keys(atelier).length;
                }
            });
            return count;
        },
        getProgressPercent(participant) {
            return Math.round((this.getThrowsCompleted(participant) / this.totalThrows) * 100);
        },
        isParticipantComplete(participant) {
            return this.getThrowsCompleted(participant) >= this.totalThrows;
        },
        getStatusClass(participant) {
            if (this.isParticipantComplete(participant)) return 'tir-scoring__participant-status--complete';
            if (this.getThrowsCompleted(participant) > 0) return 'tir-scoring__participant-status--partial';
            return '';
        },
        getScoreValue(type) {
            return SCORING[type] || 0;
        },
        getAtelierCompletedCount(atelierIndex) {
            const distCount = this.tirDistances.length;
            const key = this.activeScoresKey;
            return this.activeScoringParticipants.filter(p => {
                const atelierScores = p[key]?.[atelierIndex];
                if (!atelierScores) return false;
                return Object.keys(atelierScores).length >= distCount;
            }).length;
        },
        onScoreUpdate() {
            this.syncToFirebase();
        },
        goToNextParticipant() {
            const list = this.scoringListParticipants;
            const currentIndex = list.findIndex(p => p.id === this.activeParticipant.id);
            const nextIndex = (currentIndex + 1) % list.length;
            this.activeParticipant = list[nextIndex];
        },
        finishAtelier() {
            this.activeAtelier = null;
            this.syncToFirebase();
        },
        generateSeededBracket(n) {
            if (n === 2) return [[0, 1]];
            if (n === 4) return [[0, 3], [1, 2]];
            if (n === 8) return [[0, 7], [3, 4], [1, 6], [2, 5]];
            return this.buildSeededPairs(n);
        },
        buildSeededPairs(n) {
            if (n === 2) return [[0, 1]];
            const half = this.buildSeededPairs(n / 2);
            const pairs = [];
            for (const [a, b] of half) {
                pairs.push([a, n - 1 - a]);
                pairs.push([b, n - 1 - b]);
            }
            return pairs;
        },
        createMatch(player1, player2) {
            return {
                player1,
                player2,
                scores1: {},
                scores2: {},
                score1: null,
                score2: null,
                complete: false,
                winner: null,
                loser: null,
                tieWinner: null
            };
        },
        startTirPlayoff() {
            let qualified;
            if (this.isTwoRoundSystem) {
                const direct = this.directQualifiers;
                const r2Ranked = [...this.round2Participants].sort((a, b) =>
                    this.getCombinedTotal(b) - this.getCombinedTotal(a) ||
                    (this.getScoreCarreauCount(b, 'scores') + this.getScoreCarreauCount(b, 'scores2')) -
                    (this.getScoreCarreauCount(a, 'scores') + this.getScoreCarreauCount(a, 'scores2'))
                );
                const fromR2 = r2Ranked.slice(0, 4);
                qualified = [...direct, ...fromR2];
                this.qualifyCount = 8;
            } else {
                qualified = this.rankedParticipants.slice(0, this.qualifyCount);
            }
            const size = qualified.length;

            if (size === 2) {
                this.tournament.tirPlayoff = {
                    rounds: [],
                    qualified: qualified.map(p => p.name),
                    size,
                    thirdPlace: null,
                    final: this.createMatch(qualified[0].name, qualified[1].name)
                };
            } else {
                const pairs = this.generateSeededBracket(size);
                const matches = pairs.map(([a, b]) => this.createMatch(qualified[a].name, qualified[b].name));
                this.tournament.tirPlayoff = {
                    rounds: [{matches}],
                    qualified: qualified.map(p => p.name),
                    size,
                    thirdPlace: null,
                    final: null
                };
            }
            this.syncToFirebase();
            this.view = 'playoff';
        },
        openPlayoffMatch(match, label) {
            if (!match.player1 || !match.player2) return;
            this.activePlayoffMatch = match;
            this.activePlayoffMatchLabel = label;
        },
        closePlayoffMatch() {
            this.advanceIfReady();
            this.activePlayoffMatch = null;
            this.activePlayoffMatchLabel = '';
        },
        onPlayoffScoreChange() {
            this.syncToFirebase();
        },
        advanceIfReady() {
            const playoff = this.tournament.tirPlayoff;
            if (!playoff) return;
            if (!playoff.rounds || !playoff.rounds.length) return;
            if (playoff.final) return;

            const lastRound = playoff.rounds[playoff.rounds.length - 1];
            const allComplete = lastRound.matches.every(m => m.complete);
            if (!allComplete) return;

            const winners = lastRound.matches.map(m => m.winner);
            const losers = lastRound.matches.map(m => m.loser);

            if (winners.length === 2) {
                playoff.final = this.createMatch(winners[0], winners[1]);
                if (playoff.size >= 4) {
                    playoff.thirdPlace = this.createMatch(losers[0], losers[1]);
                }
            } else if (winners.length > 2) {
                const nextMatches = [];
                for (let i = 0; i < winners.length; i += 2) {
                    nextMatches.push(this.createMatch(winners[i], winners[i + 1]));
                }
                playoff.rounds.push({matches: nextMatches});
            }
            this.syncToFirebase();
        },
        finishPlayoffTournament() {
            this.tournament.tournamentIsFinished = true;
            this.syncToFirebase();
        },
        getPlayoffRoundTitle(roundIdx, matchCount, playoffSize) {
            if (playoffSize === 2) return this.$t('games.final');
            if (matchCount === 2) return this.$t('tir.semifinal');
            if (matchCount === 4) return this.$t('tir.quarterfinal');
            if (matchCount === 8) return this.$t('tir.eighthFinal');
            if (matchCount === 16) return this.$t('tir.sixteenthFinal');
            return this.$t('tir.round') + ' ' + (roundIdx + 1);
        }
    }
}
</script>

<style scoped>
.tir-module {
    background: var(--card-bg, #fff);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid var(--border-color, #e0e0e0);
}

.tir-nav {
    display: flex;
    background: var(--bg-color, #fff);
    border: 1px solid var(--border-color, #e0e0e0);
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

.tir-nav__round-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 700;
    border-radius: 6px;
    background: var(--primary-color, #f5a623);
    color: #fff;
    align-self: center;
    margin-right: 6px;
}

/* Participants */
.tir-participants__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.tir-participants__header h3 {
    margin: 0;
    font-size: 18px;
}

.tir-participants__add {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: var(--primary-color, #f5a623);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.tir-participants__search {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    margin-bottom: 12px;
    font-size: 14px;
    background: var(--bg-color, #fff);
    color: var(--text-color, #333);
}

.tir-participants__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.tir-participant-card {
    display: flex;
    align-items: center;
    gap: 0;
    background: var(--card-bg, #fff);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 10px;
    transition: box-shadow 0.2s;
    overflow: hidden;
}

.tir-participant-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tir-participant-card__lane {
    min-width: 36px;
    padding: 12px 8px;
    font-weight: 700;
    font-size: 14px;
    color: var(--text-secondary, #666);
    text-align: center;
    cursor: pointer;
    border-right: 1px solid var(--border-color, #e0e0e0);
    transition: background 0.15s;
    align-self: stretch;
    display: flex;
    align-items: center;
    justify-content: center;
}

.tir-participant-card__lane:hover {
    background: var(--bg-secondary, #f5f5f5);
    color: var(--primary-color, #f5a623);
}

.tir-participant-card__body {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    cursor: pointer;
    min-width: 0;
}

.tir-participant-card__info {
    flex: 1;
    min-width: 0;
}

.tir-participant-card__name {
    font-weight: 600;
    font-size: 15px;
    color: var(--text-color, #333);
}

.tir-participant-card__city {
    font-size: 12px;
    color: var(--text-secondary, #888);
}

.tir-participant-card__progress {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
}

.tir-participant-card__progress-bar {
    flex: 1;
    height: 4px;
    background: var(--border-color, #e0e0e0);
    border-radius: 2px;
    overflow: hidden;
}

.tir-participant-card__progress-fill {
    height: 100%;
    background: var(--primary-color, #f5a623);
    border-radius: 2px;
    transition: width 0.3s;
}

.tir-participant-card__progress-text {
    font-size: 11px;
    color: var(--text-secondary, #888);
    white-space: nowrap;
}

.tir-participant-card__progress-pct {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary, #888);
}

.tir-participant-card__score {
    text-align: right;
}

.tir-participant-card__score-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-color, #333);
}

.tir-participant-card__score-max {
    font-size: 13px;
    color: var(--text-secondary, #888);
}

/* Scoring */
.tir-scoring__mode-toggle {
    display: flex;
    background: var(--bg-secondary, #f5f5f5);
    border-radius: 8px;
    padding: 3px;
    margin-bottom: 16px;
}

.tir-scoring__mode-btn {
    flex: 1;
    padding: 8px 12px;
    border: none;
    background: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    color: var(--text-secondary, #666);
    transition: all 0.2s;
}

.tir-scoring__mode-btn--active {
    background: var(--primary-color, #f5a623);
    color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tir-scoring__select,
.tir-scoring__ateliers {
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
    border: 1px solid var(--border-color, #e0e0e0);
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

.tir-scoring__participant-info {
    flex: 1;
    min-width: 0;
}

.tir-scoring__participant-name {
    font-weight: 600;
    font-size: 15px;
}

.tir-scoring__progress-bar {
    height: 4px;
    background: var(--border-color, #e0e0e0);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 6px;
}

.tir-scoring__progress-fill {
    height: 100%;
    background: var(--primary-color, #f5a623);
    border-radius: 2px;
    transition: width 0.3s;
}

.tir-scoring__progress-meta {
    display: flex;
    justify-content: space-between;
    margin-top: 3px;
}

.tir-scoring__progress-text {
    font-size: 11px;
    color: var(--text-secondary, #888);
}

.tir-scoring__progress-pct {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary, #888);
}

.tir-scoring__participant-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 4px;
}

.tir-scoring__participant-score {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-color, #333);
    line-height: 1;
}

.tir-scoring__score-max {
    font-size: 13px;
    font-weight: 400;
    color: var(--text-secondary, #888);
}

.tir-scoring__participant-status {
    color: var(--text-secondary, #ccc);
}

.tir-scoring__participant-status--complete {
    color: #4caf50;
}

.tir-scoring__participant-status--partial {
    color: #f5a623;
}

.tir-scoring__atelier-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: var(--card-bg, #fff);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 10px;
    cursor: pointer;
}

.tir-scoring__atelier-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tir-scoring__atelier-num {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--primary-color, #f5a623);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
}

.tir-scoring__atelier-info {
    flex: 1;
}

.tir-scoring__atelier-name {
    font-weight: 600;
    font-size: 14px;
}

.tir-scoring__atelier-desc {
    font-size: 12px;
    color: var(--text-secondary, #888);
}

.tir-scoring__atelier-progress {
    font-size: 13px;
    color: var(--text-secondary, #666);
    font-weight: 500;
}

/* Table */
.tir-table__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.tir-table__header h3 {
    margin: 0;
}

.tir-table__content {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.tir-table__content th {
    text-align: left;
    padding: 10px 8px;
    border-bottom: 2px solid var(--border-color, #e0e0e0);
    font-weight: 600;
    font-size: 12px;
    color: var(--text-secondary, #666);
    text-transform: uppercase;
}

.tir-table__content td {
    padding: 10px 8px;
    border-bottom: 1px solid var(--border-color, #f0f0f0);
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
    background: var(--card-bg, #fff);
    z-index: 1;
}

.tir-table__sticky-col--name {
    left: 32px;
}

.tir-table__hint {
    font-size: 13px;
    color: var(--text-secondary, #666);
    margin-bottom: 10px;
}

.tir-table__empty {
    text-align: center;
    padding: 40px;
    color: var(--text-secondary, #888);
}

.tir-table__actions {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color, #e0e0e0);
}

.tir-table__playoff-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
}

.tir-table__playoff-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color, #333);
}

.tir-table__playoff-select {
    padding: 6px 10px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 6px;
    font-size: 14px;
    background: var(--bg-color, #fff);
    color: var(--text-color, #333);
}

.tir-table__actions-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.tir-table__actions-or {
    font-size: 13px;
    color: var(--text-secondary, #888);
}

.tir-table__playoff-btn {
    padding: 10px 20px;
    background: var(--primary-color, #f5a623);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
}

.tir-table__finish-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: var(--text-secondary, #888);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    color: #fff;
}

/* Score badges */
.tir-score-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
}

.tir-score-badge--carreau {
    background: #4caf50;
}

.tir-score-badge--reussi {
    background: #2196F3;
}

.tir-score-badge--touche {
    background: #f5a623;
}

.tir-score-badge--manque {
    background: #9e9e9e;
}

/* Add form */
.tir-add-form__title {
    margin: 0 0 12px;
    font-size: 16px;
}

.tir-add-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.tir-add-form__input {
    padding: 10px 14px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    font-size: 14px;
    background: var(--bg-color, #fff);
    color: var(--text-color, #333);
}

.tir-add-form__btn {
    padding: 12px;
    background: var(--primary-color, #f5a623);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}

.tir-add-form__btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Playoff */
.tir-playoff {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.tir-playoff__round {
    border: 1px solid var(--border-color, #e0e0e0);
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
    border: 1px solid var(--border-color, #f0f0f0);
    border-radius: 8px;
    margin-bottom: 6px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
}

.tir-playoff__match:last-child {
    margin-bottom: 0;
}

.tir-playoff__match:hover {
    background: var(--bg-secondary, #f9f9f9);
    border-color: var(--primary-color, #f5a623);
}

.tir-playoff__match--complete {
    background: rgba(76, 175, 80, 0.04);
    border-color: rgba(76, 175, 80, 0.3);
}

.tir-playoff__match--pending {
    opacity: 0.5;
    cursor: default;
}

.tir-playoff__match--pending:hover {
    background: transparent;
    border-color: var(--border-color, #f0f0f0);
}

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

.tir-playoff__match-action {
    color: var(--text-secondary, #aaa);
    display: flex;
    align-items: center;
}

.tir-playoff__advance-btn {
    width: 100%;
    padding: 12px;
    background: var(--primary-color, #f5a623);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
}
</style>
