<template>
    <div class="tir-module">
        <div class="tir-nav">
            <button class="tir-nav__btn tir-nav__btn--participants" :class="{'tir-nav__btn--active': view === 'participants'}" @click="view = 'participants'">
                <Users :size="18"/>
                <span>{{ $t('tir.participants') }}</span>
            </button>
            <button class="tir-nav__btn tir-nav__btn--scoring" :class="{'tir-nav__btn--active': view === 'scoring'}" @click="view = 'scoring'">
                <Grid3x3 :size="18"/>
                <span>{{ $t('tir.scoring') }}</span>
            </button>
            <button class="tir-nav__btn tir-nav__btn--table" :class="{'tir-nav__btn--active': view === 'table'}" @click="view = 'table'">
                <TableProperties :size="18"/>
                <span>{{ $t('tir.table') }}</span>
            </button>
            <button v-if="tournament.tirPlayoff" class="tir-nav__btn tir-nav__btn--playoff" :class="{'tir-nav__btn--active': view === 'playoff'}" @click="view = 'playoff'">
                <Trophy :size="18"/>
                <span>{{ $t('games.playOff') }}</span>
            </button>
        </div>

        <!-- Participants list -->
        <div v-if="view === 'participants'" class="tir-participants">
            <div class="tir-participants__header" v-if="!tournament.tirStarted">
                <button class="tir-participants__add" @click="showAddParticipant = true">
                    <Plus :size="18"/>
                </button>
            </div>
            <TirParticipantsList
                :tournament="tournament"
                :readOnly="!!tournament.tirPlayoff"
                @update="onScoreUpdate"/>

            <!-- Tiebreaker needed (participants view) -->
            <div v-if="isRound1Complete && isTwoRoundSystem && currentRound === 1 && !tournament.tirPlayoff && (hasPendingTiebreaker || isTiebreakerInProgress)" class="tir-tiebreaker">
                <div class="tir-tiebreaker__header">
                    <h4 class="tir-tiebreaker__title">{{ $t('tir.tiebreaker') }} {{ tiebreakerCount + (isTiebreakerInProgress ? 0 : 1) }}</h4>
                    <p class="tir-tiebreaker__desc">{{ $t('tir.tiebreakerDesc') }}</p>
                </div>
                <template v-if="!isTiebreakerInProgress">
                    <div class="tir-tiebreaker__actions">
                        <button class="tir-table__playoff-btn" @click="startTiebreaker">
                            {{ $t('tir.startTiebreaker') }}
                        </button>
                    </div>
                </template>
                <template v-else-if="isTiebreakerRoundComplete">
                    <div class="tir-tiebreaker__actions">
                        <button class="tir-table__playoff-btn" @click="finishTiebreaker">
                            {{ $t('tir.finishTiebreaker') }}
                        </button>
                    </div>
                </template>
                <template v-else>
                    <p class="tir-tiebreaker__desc">{{ $t('tir.tiebreakerInProgress') }}</p>
                </template>
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
            <div v-if="isTwoRoundSystem && scoringRoundTabs.length > 1 && !activeParticipant && activeAtelier === null" class="tir-scoring__round-switcher">
                <button v-for="tab in scoringRoundTabs" :key="tab.key"
                    class="tir-scoring__round-btn"
                    :class="{'tir-scoring__round-btn--active': activeScoringRound === tab.key}"
                    @click="scoringRound = tab.key">
                    {{ tab.label }}
                </button>
            </div>
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
                    :distances="activeScoringDistances"
                    :scoresKey="activeScoresKey"
                    :readOnly="!!tournament.tirPlayoff"
                    @back="onParticipantViewBack"
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
                    :distances="activeScoringDistances"
                    :scoresKey="activeScoresKey"
                    :readOnly="!!tournament.tirPlayoff"
                    @back="activeAtelier = null"
                    @update="onScoreUpdate"
                    @finish="finishAtelier"/>
            </template>

            <!-- Tiebreaker needed (scoring view) -->
            <div v-if="isRound1Complete && isTwoRoundSystem && currentRound === 1 && !tournament.tirPlayoff && !activeParticipant && activeAtelier === null && (hasPendingTiebreaker || isTiebreakerInProgress)" class="tir-tiebreaker">
                <div class="tir-tiebreaker__header">
                    <h4 class="tir-tiebreaker__title">{{ $t('tir.tiebreaker') }} {{ tiebreakerCount + (isTiebreakerInProgress ? 0 : 1) }}</h4>
                    <p class="tir-tiebreaker__desc">{{ $t('tir.tiebreakerDesc') }}</p>
                </div>
                <template v-if="!isTiebreakerInProgress">
                    <div class="tir-tiebreaker__actions">
                        <button class="tir-table__playoff-btn" @click="startTiebreaker">
                            {{ $t('tir.startTiebreaker') }}
                        </button>
                    </div>
                </template>
                <template v-else-if="isTiebreakerRoundComplete">
                    <div class="tir-tiebreaker__actions">
                        <button class="tir-table__playoff-btn" @click="finishTiebreaker">
                            {{ $t('tir.finishTiebreaker') }}
                        </button>
                    </div>
                </template>
                <template v-else>
                    <p class="tir-tiebreaker__desc">{{ $t('tir.tiebreakerInProgress') }}</p>
                </template>
            </div>

            <!-- 2-round: transition to R2 (bottom of scoring) -->
            <div v-if="canTransitionToRound2 && !tournament.tirPlayoff && !activeParticipant && activeAtelier === null" class="tir-table__actions">
                <p class="tir-table__hint">{{ $t('tir.round2Hint') }}</p>
                <div class="tir-table__actions-row">
                    <button class="tir-table__playoff-btn" @click="startRound2">
                        {{ $t('tir.startRound2') }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Results table -->
        <div v-if="view === 'table'" class="tir-table">
            <div v-if="tirParticipants.length" class="tir-table__scroll">
                <table class="tir-table__content">
                    <thead>
                        <tr v-if="isTwoRoundSystem">
                            <th class="tir-table__sticky-col">#</th>
                            <th class="tir-table__sticky-col tir-table__sticky-col--name">{{ $t('tir.participant') }}</th>
                            <th>{{ $t('tir.round1Score') }}</th>
                            <th v-for="i in tiebreakerCount" :key="'exh'+i">EX{{ i }}</th>
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
                        <tr v-for="(row, index) in tableRows" :key="row.id" :class="row.rowClass">
                            <td class="tir-table__sticky-col">{{ index + 1 }}</td>
                            <td class="tir-table__sticky-col tir-table__sticky-col--name tir-table__clickable" @click="openParticipantFromTable(row.id)">{{ row.name }}</td>
                            <td :class="{'tir-table__muted': row.r1 === '—'}">{{ row.r1 }}</td>
                            <td v-for="i in tiebreakerCount" :key="'ex'+i">{{ getTiebreakerScoreForTable(row.id, i) }}</td>
                            <td v-if="currentRound >= 2" :class="{'tir-table__muted': row.r2 === '—'}">{{ row.r2 }}</td>
                            <td v-if="currentRound >= 2" :class="{'tir-table__muted': row.combined === '—'}"><strong>{{ row.combined }}</strong></td>
                            <td v-if="playoffHasQf">{{ row.qf }}</td>
                            <td v-if="playoffHasSf">{{ row.sf }}</td>
                            <td v-if="playoffHasFinal">{{ row.final }}</td>
                            <td>{{ getPlaceWithTiebreaker(row) }}</td>
                        </tr>
                    </tbody>
                    <tbody v-else>
                        <tr v-for="(participant, index) in rankedParticipants" :key="participant.id" :class="{'tir-table__row--qualified': canStartPlayoff && index < qualifyCount}">
                            <td>{{ index + 1 }}</td>
                            <td class="tir-table__clickable" @click="openParticipantFromTable(participant.id)">{{ participant.name }}</td>
                            <td><strong>{{ getParticipantTotal(participant) }}</strong> / {{ maxTotalScore }}</td>
                            <td>{{ getThrowsCompleted(participant) }} / {{ totalThrows }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-else class="tir-table__empty">{{ $t('tir.noParticipants') }}</div>

            <!-- Tiebreaker needed (table view) -->
            <div v-if="isRound1Complete && isTwoRoundSystem && currentRound === 1 && !tournament.tirPlayoff && (hasPendingTiebreaker || isTiebreakerInProgress)" class="tir-tiebreaker">
                <div class="tir-tiebreaker__header">
                    <h4 class="tir-tiebreaker__title">{{ $t('tir.tiebreaker') }} {{ tiebreakerCount + (isTiebreakerInProgress ? 0 : 1) }}</h4>
                    <p class="tir-tiebreaker__desc">{{ $t('tir.tiebreakerDesc') }}</p>
                </div>
                <template v-if="!isTiebreakerInProgress">
                    <div class="tir-tiebreaker__actions">
                        <button class="tir-table__playoff-btn" @click="startTiebreaker">
                            {{ $t('tir.startTiebreaker') }}
                        </button>
                    </div>
                </template>
                <template v-else-if="isTiebreakerRoundComplete">
                    <div class="tir-tiebreaker__actions">
                        <button class="tir-table__playoff-btn" @click="finishTiebreaker">
                            {{ $t('tir.finishTiebreaker') }}
                        </button>
                    </div>
                </template>
                <template v-else>
                    <p class="tir-tiebreaker__desc">{{ $t('tir.tiebreakerInProgress') }}</p>
                </template>
            </div>

            <!-- 2-round: transition to R2 -->
            <div v-if="canTransitionToRound2 && !tournament.tirPlayoff" class="tir-table__actions">
                <p class="tir-table__hint">{{ $t('tir.round2Hint') }}</p>
                <div class="tir-table__actions-row">
                    <button class="tir-table__playoff-btn" @click="startRound2">
                        {{ $t('tir.startRound2') }}
                    </button>
                </div>
            </div>

            <!-- Return to R1 to fix scores -->
            <div v-if="currentRound >= 2 && !tournament.tirPlayoff" class="tir-table__actions">
                <div class="tir-table__actions-row">
                    <button class="tir-table__return-btn" @click="returnToRound1">
                        {{ $t('tir.returnToRound1') }}
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

            <!-- Export -->
            <div v-if="tirParticipants.length && tournament.tirStarted" class="tir-table__export">
                <button class="tir-table__export-btn" @click="exportResults('csv')">
                    <Download :size="14"/>
                    CSV
                </button>
                <button class="tir-table__export-btn" @click="exportResults('json')">
                    <Download :size="14"/>
                    JSON
                </button>
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
                    <div v-for="(match, mIdx) in round.matches" :key="mIdx" class="tir-playoff__match" :class="{'tir-playoff__match--complete': isAdminMatchComplete(match), 'tir-playoff__match--in-progress': !isAdminMatchComplete(match) && match.player1 && match.player2 && (match.score1 != null || match.score2 != null), 'tir-playoff__match--pending': !match.player1 || !match.player2}" @click="openPlayoffMatch(match, round.title)">
                        <div class="tir-playoff__match-top">
                            <span class="tir-playoff__match-num" @click.stop="editLane(rIdx, mIdx, match)">{{ getMatchLane(rIdx, mIdx, match) }}</span>
                            <span v-if="isAdminMatchComplete(match)" class="tir-playoff__match-status tir-playoff__match-status--complete">{{ $t('tir.matchCompleted') }}</span>
                            <span v-else-if="match.player1 && match.player2 && (match.score1 != null || match.score2 != null)" class="tir-playoff__match-status tir-playoff__match-status--progress">{{ $t('tir.matchInProgress') }}</span>
                            <Pencil :size="14" v-if="match.player1 && match.player2" class="tir-playoff__match-edit"/>
                        </div>
                        <div class="tir-playoff__match-row">
                            <span class="tir-playoff__player-name" :class="{'tir-playoff__player-name--winner': match.winner === match.player1}">
                                <Trophy v-if="match.winner === match.player1" :size="12" class="tir-playoff__winner-icon"/>
                                {{ match.player1 || '—' }}
                            </span>
                            <span class="tir-playoff__score" :class="{'tir-playoff__score--winner': match.winner === match.player1}">{{ match.score1 !== null ? match.score1 : '—' }}</span>
                            <span class="tir-playoff__vs">vs</span>
                            <span class="tir-playoff__score" :class="{'tir-playoff__score--winner': match.winner === match.player2}">{{ match.score2 !== null ? match.score2 : '—' }}</span>
                            <span class="tir-playoff__player-name tir-playoff__player-name--right" :class="{'tir-playoff__player-name--winner': match.winner === match.player2}">
                                {{ match.player2 || '—' }}
                                <Trophy v-if="match.winner === match.player2" :size="12" class="tir-playoff__winner-icon"/>
                            </span>
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
import TirParticipantsList from "./TirParticipantsList.vue";
import TirAtelierView from "./TirAtelierView.vue";
import TirPlayoffMatch from "./TirPlayoffMatch.vue";
import {Users, Grid3x3, TableProperties, Plus, CheckCircle, AlertCircle, Circle, Trophy, Pencil, Download} from "lucide-vue-next";

import {SCORING, ATELIER_KEYS, DISTANCES_FULL, DISTANCES_JUNIOR, getScoreTotal, buildTableRows, detectTiebreakersNeeded, getTiebreakerKey, isTiebreakerComplete, rankWithTiebreakers} from '@/services/tir';

export default {
    name: 'TirModule',
    components: {Modal, TirParticipantView, TirParticipantsList, TirAtelierView, TirPlayoffMatch, Users, Grid3x3, TableProperties, Plus, CheckCircle, AlertCircle, Circle, Trophy, Pencil, Download},
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
            swapTarget: null,
            scoringRound: null
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
            return this.tournament.tirConfig || {junior: false, rounds: 1};
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
        scoringRoundTabs() {
            const tabs = [{key: 'r1', label: 'R1'}];
            for (let i = 1; i <= this.tiebreakerCount; i++) {
                tabs.push({key: `ex${i}`, label: `EX${i}`});
            }
            if (this.currentRound >= 2) tabs.push({key: 'r2', label: 'R2'});
            return tabs;
        },
        activeScoringRound() {
            if (this.scoringRound !== null) return this.scoringRound;
            if (this.currentRound >= 2) return 'r2';
            if (this.tiebreakerCount > 0) return `ex${this.tiebreakerCount}`;
            return 'r1';
        },
        activeScoresKey() {
            const round = this.activeScoringRound;
            if (typeof round === 'string' && round.startsWith('ex')) {
                const num = parseInt(round.replace('ex', ''));
                return getTiebreakerKey(num);
            }
            return round === 'r2' ? 'scores2' : 'scores';
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
        activeScoringDistances() {
            const round = this.activeScoringRound;
            if (typeof round === 'string' && round.startsWith('ex')) return [7];
            return this.tirDistances;
        },
        totalThrows() {
            return 5 * this.activeScoringDistances.length;
        },
        maxAtelierScore() {
            return this.activeScoringDistances.length * SCORING.carreau;
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
            if (this.activeScoringRound === 'r2') return this.round2Participants;
            const round = this.activeScoringRound;
            if (typeof round === 'string' && round.startsWith('ex')) {
                const tbKey = this.activeScoresKey;
                return this.tirParticipants.filter(p => p[tbKey] && Object.keys(p[tbKey]).length > 0);
            }
            return this.tirParticipants;
        },
        activeScoringParticipantsAlphabetic() {
            return [...this.activeScoringParticipants].sort((a, b) => a.name.localeCompare(b.name));
        },
        scoringListParticipants() {
            const list = this.activeScoringParticipants;
            const total = this.totalThrows;
            return [...list].sort((a, b) => {
                const aThrows = this.getThrowsCompleted(a);
                const bThrows = this.getThrowsCompleted(b);
                const aComplete = aThrows >= total;
                const bComplete = bThrows >= total;
                const aInProgress = aThrows > 0 && !aComplete;
                const bInProgress = bThrows > 0 && !bComplete;

                if (aInProgress && !bInProgress) return -1;
                if (!aInProgress && bInProgress) return 1;
                if (aInProgress && bInProgress) return bThrows - aThrows || this.getParticipantTotal(b) - this.getParticipantTotal(a);

                if (aComplete && !bComplete) return -1;
                if (!aComplete && bComplete) return 1;
                if (aComplete && bComplete) return this.getParticipantTotal(b) - this.getParticipantTotal(a) || this.getCarreauCount(b) - this.getCarreauCount(a);

                return a.name.localeCompare(b.name);
            });
        },
        rankedParticipants() {
            return [...this.tirParticipants].sort((a, b) => this.getParticipantTotal(b) - this.getParticipantTotal(a) || this.getCarreauCount(b) - this.getCarreauCount(a));
        },
        r1RankedParticipants() {
            return rankWithTiebreakers(this.tirParticipants, 'scores', this.tiebreakerCount);
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
        r1TotalThrows() {
            return 5 * this.tirDistances.length;
        },
        isRound1Complete() {
            const target = this.r1TotalThrows;
            return this.tirParticipants.every(p => {
                if (!p.scores) return false;
                let count = 0;
                Object.values(p.scores).forEach(atelier => {
                    if (atelier && typeof atelier === 'object') count += Object.keys(atelier).length;
                });
                return count >= target;
            });
        },
        tiebreakerCount() {
            return this.tournament.tirTiebreakerCount || 0;
        },
        tiebreakerState() {
            if (!this.isTwoRoundSystem || !this.isRound1Complete) return null;
            return detectTiebreakersNeeded(this.tirParticipants, this.tiebreakerCount);
        },
        hasPendingTiebreaker() {
            if (!this.tiebreakerState) return false;
            return this.tiebreakerState.top4Ties.length > 0 || this.tiebreakerState.r2Ties.length > 0;
        },
        activeTiebreakerParticipants() {
            if (!this.tiebreakerState) return [];
            const ids = new Set();
            this.tiebreakerState.top4Ties.forEach(p => ids.add(p.id));
            this.tiebreakerState.r2Ties.forEach(p => ids.add(p.id));
            return this.tirParticipants.filter(p => ids.has(p.id));
        },
        activeTiebreakerKey() {
            return getTiebreakerKey(this.tiebreakerCount + 1);
        },
        isTiebreakerInProgress() {
            return !!(this.tournament.tirTiebreakerActive);
        },
        isTiebreakerRoundComplete() {
            if (!this.isTiebreakerInProgress) return false;
            const tbKey = getTiebreakerKey(this.tiebreakerCount);
            const ids = this.tournament.tirTiebreakerParticipantIds || [];
            return ids.every(id => {
                const p = this.tirParticipants.find(pp => pp.id === id);
                return p && isTiebreakerComplete(p, tbKey);
            });
        },
        tiebreakerDisplayParticipants() {
            const ids = this.tournament.tirTiebreakerParticipantIds || [];
            return this.tirParticipants.filter(p => ids.includes(p.id));
        },
        canTransitionToRound2() {
            if (!this.isTwoRoundSystem || this.currentRound !== 1 || !this.isRound1Complete) return false;
            if (this.isTiebreakerInProgress) return false;
            if (this.hasPendingTiebreaker) return false;
            return true;
        },
        canStartPlayoff() {
            if (this.isTwoRoundSystem) {
                if (this.currentRound < 2) return false;
                return this.round2Participants.every(p => this.isParticipantCompleteForKey(p, 'scores2'));
            }
            const completedCount = this.tirParticipants.filter(p => this.isParticipantCompleteForKey(p, 'scores')).length;
            return completedCount >= 2;
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
        qualifyOptions() {
            const completedCount = this.tirParticipants.filter(p => this.isParticipantCompleteForKey(p, 'scores')).length;
            const opts = [];
            for (let i = 2; i <= Math.min(completedCount, 64); i *= 2) {
                opts.push(i);
            }
            return opts;
        },
        tableRows() {
            if (!this.isTwoRoundSystem) return [];
            return buildTableRows({
                participants: this.tirParticipants,
                directIds: this.directQualifiers.map(p => p.id),
                r2Ids: this.round2ParticipantIds,
                r2CandidateIds: this.r1RankedParticipants.slice(4, 16).map(p => p.id),
                playoff: this.tournament.tirPlayoff,
                currentRound: this.currentRound,
                isTwoRoundSystem: this.isTwoRoundSystem,
                hasPlayoffScores: this.playoffHasQf || this.playoffHasSf || this.playoffHasFinal,
                tiebreakerCount: this.tiebreakerCount,
                labels: {
                    direct: this.$t('tir.directQualifier'),
                    r2Qualifier: this.$t('tir.round2Qualifier'),
                    goToR2: this.$t('tir.goToRound2'),
                    eliminated: this.$t('tir.eliminated')
                }
            });
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
            return count >= this.r1TotalThrows;
        },
        startTiebreaker() {
            const participants = this.activeTiebreakerParticipants;
            if (!participants.length) return;
            const tbKey = this.activeTiebreakerKey;
            participants.forEach(p => {
                if (!p[tbKey]) p[tbKey] = {};
            });
            this.tournament.tirTiebreakerActive = true;
            this.tournament.tirTiebreakerParticipantIds = participants.map(p => p.id);
            this.tournament.tirTiebreakerCount = (this.tiebreakerCount || 0) + 1;
            this.scoringRound = `ex${this.tournament.tirTiebreakerCount}`;
            this.syncToFirebase();
        },
        finishTiebreaker() {
            this.tournament.tirTiebreakerActive = false;
            this.tournament.tirTiebreakerParticipantIds = null;
            this.syncToFirebase();
        },
        getPlaceWithTiebreaker(row) {
            if (row.place) return row.place;
            if (!this.tiebreakerState) return '';
            const allTied = [...this.tiebreakerState.top4Ties, ...this.tiebreakerState.r2Ties];
            if (allTied.some(p => p.id === row.id)) {
                return `EX${this.tiebreakerCount + (this.isTiebreakerInProgress ? 0 : 1)}`;
            }
            return '';
        },
        getTiebreakerScore(participant) {
            const tbKey = getTiebreakerKey(this.tiebreakerCount);
            const scores = participant[tbKey];
            if (!scores) return 0;
            let total = 0;
            Object.values(scores).forEach(atelier => {
                if (atelier && typeof atelier === 'object') {
                    Object.values(atelier).forEach(val => { total += SCORING[val] || 0; });
                }
            });
            return total;
        },
        getTiebreakerScoreForTable(participantId, round) {
            const p = this.tirParticipants.find(pp => pp.id === participantId);
            if (!p) return '';
            const tbKey = getTiebreakerKey(round);
            if (!p[tbKey]) return '';
            return getScoreTotal(p, tbKey);
        },
        isTiebreakerParticipantComplete(participant) {
            const tbKey = getTiebreakerKey(this.tiebreakerCount);
            return isTiebreakerComplete(participant, tbKey);
        },
        onParticipantViewBack() {
            this.activeParticipant = null;
        },
        startRound2() {
            const ranked = rankWithTiebreakers(this.tirParticipants, 'scores', this.tiebreakerCount);
            const r2Qualifiers = ranked.slice(4, 16);
            this.tournament.tirR2Participants = r2Qualifiers.map(p => p.id);
            r2Qualifiers.forEach(p => {
                if (!p.scores2) p.scores2 = {};
            });
            this.tournament.tirRound = 2;
            this.syncToFirebase();
        },
        returnToRound1() {
            this.tournament.tirRound = 1;
            this.tournament.tirR2Participants = null;
            this.scoringRound = 'r1';
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
            const distCount = this.activeScoringDistances.length;
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
        openParticipantFromTable(id) {
            const participant = this.tirParticipants.find(p => p.id === id);
            if (!participant) return;
            this.activeParticipant = participant;
            this.view = 'scoring';
            this.scoringMode = 'participant';
        },
        isAdminMatchComplete(match) {
            return !!match.complete || !!match.winner;
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
        getMatchLane(rIdx, mIdx, match) {
            if (match.lane) return match.lane;
            const displayRound = this.playoffDisplayRounds[rIdx];
            if (displayRound?.isFinal) return 1;
            if (displayRound?.title === this.$t('tir.thirdPlaceMatch')) return 2;
            return mIdx + 1;
        },
        editLane(rIdx, mIdx, match) {
            const current = this.getMatchLane(rIdx, mIdx, match);
            const value = window.prompt(this.$t('games.lane'), current);
            if (value === null) return;
            const num = parseInt(value);
            if (!isNaN(num) && num > 0 && num !== current) {
                const bracket = this.getLaneBracket(rIdx);
                const conflict = bracket.find((m, i) => m !== match && this.getMatchLaneInBracket(rIdx, i, m) === num);
                if (conflict) {
                    conflict.lane = current;
                }
                match.lane = num;
                this.syncToFirebase();
            }
        },
        getMatchLaneInBracket(rIdx, mIdx, match) {
            if (match.lane) return match.lane;
            const playoff = this.tournament.tirPlayoff;
            if (match === playoff?.final) return 1;
            if (match === playoff?.thirdPlace) return 2;
            return mIdx + 1;
        },
        getLaneBracket(rIdx) {
            const playoff = this.tournament.tirPlayoff;
            const displayRound = this.playoffDisplayRounds[rIdx];
            if (!displayRound || !playoff) return [];
            if (displayRound.isFinal || displayRound.title === this.$t('tir.thirdPlaceMatch')) {
                const matches = [];
                if (playoff.thirdPlace) matches.push(playoff.thirdPlace);
                if (playoff.final) matches.push(playoff.final);
                return matches;
            }
            return displayRound.matches;
        },
        getPlayoffRoundTitle(roundIdx, matchCount, playoffSize) {
            if (playoffSize === 2) return this.$t('games.final');
            if (matchCount === 2) return this.$t('tir.semifinal');
            if (matchCount === 4) return this.$t('tir.quarterfinal');
            if (matchCount === 8) return this.$t('tir.eighthFinal');
            if (matchCount === 16) return this.$t('tir.sixteenthFinal');
            return this.$t('tir.round') + ' ' + (roundIdx + 1);
        },
        exportResults(format) {
            const data = this.buildExportData();
            if (format === 'json') {
                this.downloadFile(JSON.stringify(data, null, 2), `${this.tournament.name}_tir.json`, 'application/json');
            } else {
                this.downloadFile(this.buildCsv(data), `${this.tournament.name}_tir.csv`, 'text/csv');
            }
        },
        buildExportData() {
            const participants = this.tirParticipants;
            const distances = this.tirDistances;
            const ateliers = ATELIER_KEYS;
            const playoff = this.tournament.tirPlayoff;

            const playerRows = participants.map(p => {
                const row = {name: p.name, city: p.city || ''};
                row.r1_score = this.getScoreTotal(p, 'scores');
                row.r1_details = this.getAtelierDetails(p, 'scores', ateliers, distances);
                if (this.isTwoRoundSystem && this.currentRound >= 2) {
                    row.r2_score = this.getScoreTotal(p, 'scores2');
                    row.r2_details = this.getAtelierDetails(p, 'scores2', ateliers, distances);
                    row.combined = row.r1_score + row.r2_score;
                }
                return row;
            }).sort((a, b) => (b.combined || b.r1_score) - (a.combined || a.r1_score));

            const result = {tournament: this.tournament.name, participants: playerRows};

            if (playoff) {
                result.playoff = {};
                if (playoff.rounds) {
                    playoff.rounds.forEach(round => {
                        const key = round.matches.length >= 4 ? 'quarterfinal' : round.matches.length === 2 ? 'semifinal' : 'final';
                        result.playoff[key] = round.matches.map(m => ({
                            player1: m.player1, score1: m.score1,
                            player2: m.player2, score2: m.score2,
                            winner: m.winner || null
                        }));
                    });
                }
                if (playoff.thirdPlace) {
                    result.playoff.thirdPlace = {
                        player1: playoff.thirdPlace.player1, score1: playoff.thirdPlace.score1,
                        player2: playoff.thirdPlace.player2, score2: playoff.thirdPlace.score2,
                        winner: playoff.thirdPlace.winner || null
                    };
                }
                if (playoff.final) {
                    result.playoff.final = {
                        player1: playoff.final.player1, score1: playoff.final.score1,
                        player2: playoff.final.player2, score2: playoff.final.score2,
                        winner: playoff.final.winner || null
                    };
                }
            }
            return result;
        },
        getAtelierDetails(participant, scoresKey, ateliers, distances) {
            const details = {};
            ateliers.forEach((key, idx) => {
                const scores = participant[scoresKey]?.[idx];
                if (scores) {
                    details[key] = {};
                    distances.forEach(d => {
                        if (scores[d]) details[key][d + 'm'] = SCORING[scores[d]] ?? 0;
                    });
                }
            });
            return details;
        },
        buildCsv(data) {
            const lines = [];
            const hasR2 = data.participants.some(p => p.r2_score !== undefined);

            let header = 'Name,City,R1';
            if (hasR2) header += ',R2,Combined';
            data.participants[0]?.r1_details && ATELIER_KEYS.forEach((k, i) => {
                this.tirDistances.forEach(d => { header += `,R1_A${i + 1}_${d}m`; });
            });
            if (hasR2) {
                ATELIER_KEYS.forEach((k, i) => {
                    this.tirDistances.forEach(d => { header += `,R2_A${i + 1}_${d}m`; });
                });
            }
            lines.push(header);

            data.participants.forEach(p => {
                let line = `"${p.name}","${p.city}",${p.r1_score}`;
                if (hasR2) line += `,${p.r2_score || 0},${p.combined || p.r1_score}`;
                ATELIER_KEYS.forEach(k => {
                    this.tirDistances.forEach(d => {
                        line += `,${p.r1_details?.[k]?.[d + 'm'] || ''}`;
                    });
                });
                if (hasR2) {
                    ATELIER_KEYS.forEach(k => {
                        this.tirDistances.forEach(d => {
                            line += `,${p.r2_details?.[k]?.[d + 'm'] || ''}`;
                        });
                    });
                }
                lines.push(line);
            });

            if (data.playoff) {
                lines.push('');
                lines.push('Playoff');
                Object.entries(data.playoff).forEach(([round, matches]) => {
                    lines.push(round);
                    const matchList = Array.isArray(matches) ? matches : [matches];
                    matchList.forEach(m => {
                        lines.push(`"${m.player1 || ''}",${m.score1 ?? ''},"${m.player2 || ''}",${m.score2 ?? ''},"${m.winner || ''}"`);
                    });
                });
            }
            return lines.join('\n');
        },
        downloadFile(content, filename, mimeType) {
            const blob = new window.Blob([content], {type: mimeType});
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
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

.tir-nav__btn--scoring.tir-nav__btn--active {
    color: var(--color-primary);
}

.tir-nav__btn--table.tir-nav__btn--active {
    color: var(--tir-carreau);
}

.tir-nav__btn--playoff.tir-nav__btn--active {
    color: var(--tir-touche);
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
    background: var(--tir-touche);
    color: var(--color-btn-text);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.tir-participants__search {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    margin-bottom: 12px;
    font-size: 14px;
    background: var(--color-surface);
    color: var(--color-text);
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
    background: var(--color-surface);
    border: 1px solid var(--color-border);
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
    color: var(--color-text-muted);
    text-align: center;
    cursor: pointer;
    border-right: 1px solid var(--color-border);
    transition: background 0.15s;
    align-self: stretch;
    display: flex;
    align-items: center;
    justify-content: center;
}

.tir-participant-card__lane:hover {
    background: var(--color-surface-alt);
    color: var(--tir-touche);
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
    color: var(--color-text);
}

.tir-participant-card__city {
    font-size: 12px;
    color: var(--color-text-muted);
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
    background: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
}

.tir-participant-card__progress-fill {
    height: 100%;
    background: var(--tir-touche);
    border-radius: 2px;
    transition: width 0.3s;
}

.tir-participant-card__progress-text {
    font-size: 11px;
    color: var(--color-text-muted);
    white-space: nowrap;
}

.tir-participant-card__progress-pct {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted);
}

.tir-participant-card__score {
    text-align: right;
}

.tir-participant-card__score-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text);
}

.tir-participant-card__score-max {
    font-size: 13px;
    color: var(--color-text-muted);
}

/* Scoring */
.tir-scoring__round-switcher {
    display: flex;
    gap: 4px;
    margin-bottom: 10px;
}

.tir-scoring__round-btn {
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

.tir-scoring__round-btn--active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-btn-text);
}

.tir-scoring__mode-toggle {
    display: flex;
    background: var(--color-surface-alt);
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
    color: var(--color-text-muted);
    transition: all 0.2s;
}

.tir-scoring__mode-btn--active {
    background: var(--tir-touche);
    color: var(--color-btn-text);
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
    background: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 6px;
}

.tir-scoring__progress-fill {
    height: 100%;
    background: var(--tir-touche);
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
    color: var(--color-text-muted);
}

.tir-scoring__progress-pct {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted);
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
    color: var(--color-text);
    line-height: 1;
}

.tir-scoring__score-max {
    font-size: 13px;
    font-weight: 400;
    color: var(--color-text-muted);
}

.tir-scoring__participant-status {
    color: var(--color-grey);
}

.tir-scoring__participant-status--complete {
    color: var(--tir-carreau);
}

.tir-scoring__participant-status--partial {
    color: var(--tir-touche);
}

.tir-scoring__atelier-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
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
    background: var(--tir-touche);
    color: var(--color-btn-text);
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
    color: var(--color-text-muted);
}

.tir-scoring__atelier-progress {
    font-size: 13px;
    color: var(--color-text-muted);
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
}

.tir-table__row--qualified td {
    background: var(--color-highlight);
}

.tir-table__row--direct td {
    background: var(--tir-row-direct-bg);
}

.tir-table__row--r2 td {
    background: var(--tir-row-r2-bg);
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

td.tir-table__muted {
    color: var(--color-text-muted);
    font-weight: 400;
}

.tir-table__clickable {
    cursor: pointer;
    font-weight: 500;
    color: var(--color-text);
}

.tir-table__clickable:hover {
    text-decoration: underline;
}

.tir-table__content tr th.tir-table__sticky-col,
.tir-table__content tr td.tir-table__sticky-col {
    background-color: var(--color-surface);
    background-image: none;
}

.tir-table__content tr.tir-table__row--direct td.tir-table__sticky-col {
    background-color: var(--color-surface);
    background-image: linear-gradient(var(--tir-row-direct-bg), var(--tir-row-direct-bg));
}

.tir-table__content tr.tir-table__row--r2 td.tir-table__sticky-col {
    background-color: var(--color-surface);
    background-image: linear-gradient(var(--tir-row-r2-bg), var(--tir-row-r2-bg));
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

.tir-table__hint {
    font-size: 13px;
    color: var(--color-text-muted);
    margin-bottom: 10px;
}

.tir-table__empty {
    text-align: center;
    padding: 40px;
    color: var(--color-text-muted);
}

.tir-table__actions {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
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
    color: var(--color-text);
}

.tir-table__playoff-select {
    padding: 6px 10px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 14px;
    background: var(--color-surface);
    color: var(--color-text);
}

.tir-table__actions-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.tir-table__actions-or {
    font-size: 13px;
    color: var(--color-text-muted);
}

.tir-table__playoff-btn {
    padding: 10px 20px;
    background: var(--tir-touche);
    color: var(--color-btn-text);
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
    background: var(--color-text-muted);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    color: var(--color-btn-text);
}

.tir-table__return-btn {
    padding: 8px 16px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: none;
    font-weight: 500;
    font-size: 13px;
    cursor: pointer;
    color: var(--color-text-muted);
}

.tir-table__export {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border);
}

.tir-table__export-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
    cursor: pointer;
    transition: background 0.15s;
}

.tir-table__export-btn:hover {
    background: var(--color-surface-alt);
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
    color: var(--color-btn-text);
}

.tir-score-badge--carreau {
    background: var(--tir-carreau);
}

.tir-score-badge--reussi {
    background: var(--tir-reussi);
}

.tir-score-badge--touche {
    background: var(--tir-touche);
}

.tir-score-badge--manque {
    background: var(--tir-manque);
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
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-size: 14px;
    background: var(--color-surface);
    color: var(--color-text);
}

.tir-add-form__btn {
    padding: 12px;
    background: var(--tir-touche);
    color: var(--color-btn-text);
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
    margin-bottom: 0;
}

.tir-playoff__round--final {
    border-color: var(--tir-touche);
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

.tir-playoff__match:last-child {
    margin-bottom: 0;
}

.tir-playoff__match:hover {
    background: var(--color-surface-hover);
    border-color: var(--tir-touche);
}

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

.tir-playoff__match--pending {
    opacity: 0.5;
    cursor: default;
}

.tir-playoff__match--pending:hover {
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
    cursor: pointer;
    transition: background 0.15s;
}

.tir-playoff__match-num:hover {
    background: var(--color-primary-bg);
    color: var(--color-primary);
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

.tir-playoff__match-edit {
    margin-left: auto;
    color: var(--color-text-muted);
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

.tir-playoff__advance-btn {
    width: 100%;
    padding: 12px;
    background: var(--tir-touche);
    color: var(--color-btn-text);
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
}

/* Tiebreaker */
.tir-tiebreaker {
    margin-top: 16px;
    padding: 16px;
    border: 2px solid var(--color-warning);
    border-radius: 12px;
    background: rgba(245, 166, 35, 0.06);
}

.tir-tiebreaker__header {
    margin-bottom: 12px;
}

.tir-tiebreaker__title {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text);
}

.tir-tiebreaker__desc {
    font-size: 13px;
    color: var(--color-text-muted);
    margin: 0;
}

.tir-tiebreaker__ties {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
}

.tir-tiebreaker__group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
}

.tir-tiebreaker__group-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
}

.tir-tiebreaker__tied-name {
    font-size: 13px;
    padding: 2px 8px;
    background: var(--color-surface-alt);
    border-radius: 4px;
    color: var(--color-text);
}

.tir-tiebreaker__list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
}

.tir-tiebreaker__participant {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
}

.tir-tiebreaker__participant:hover {
    background: var(--color-surface-hover);
}

.tir-tiebreaker__participant-name {
    flex: 1;
    font-weight: 500;
    font-size: 14px;
}

.tir-tiebreaker__participant-score {
    font-size: 13px;
    color: var(--color-text-muted);
}

.tir-tiebreaker__participant-status {
    color: var(--color-grey);
}

.tir-tiebreaker__icon--complete {
    color: var(--color-success);
}

.tir-tiebreaker__actions {
    margin-top: 12px;
}
</style>
