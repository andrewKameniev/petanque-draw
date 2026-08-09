<template>
  <div class="tir-module">
    <TournamentNav
      v-model="view"
      variant="tir"
      :tabs="navigationTabs"
      :label="$t('tir.scoring')"
      panel-id="tir-admin-tabpanel"
      id-prefix="tir-admin-tab"
    />

    <div id="tir-admin-tabpanel" role="tabpanel" :aria-labelledby="`tir-admin-tab-${view}`">
      <!-- Participants list -->
      <div v-if="view === 'participants'" class="tir-participants">
        <div class="tir-participants__header" v-if="!tournament.tirStarted">
          <button class="tir-participants__add" @click="showAddParticipant = true">
            <Plus :size="18" />
          </button>
        </div>
        <TirParticipantsList :tournament="tournament" :readOnly="!!tournament.tirPlayoff" @update="onScoreUpdate" />

        <!-- Tiebreaker needed (participants view) -->
        <div
          v-if="
            isRound1Complete &&
            isTwoRoundSystem &&
            currentRound === 1 &&
            !tournament.tirPlayoff &&
            (hasPendingTiebreaker || isTiebreakerInProgress)
          "
          class="tir-tiebreaker"
        >
          <div class="tir-tiebreaker__header">
            <h4 class="tir-tiebreaker__title">
              {{ $t('tir.tiebreaker') }} {{ tiebreakerCount + (isTiebreakerInProgress ? 0 : 1) }}
            </h4>
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
          <h4 class="tir-add-form__title">
            {{ $t('games.lane') }} {{ getParticipantLane(swapParticipant) }} — {{ swapParticipant.name }}
          </h4>
          <div class="tir-add-form">
            <input
              class="tir-add-form__input"
              type="number"
              min="1"
              :max="tirParticipants.length"
              v-model.number="swapTarget"
              :placeholder="$t('games.lane')"
              @keyup.enter="confirmLaneSwap"
            />
            <button class="tir-add-form__btn" @click="confirmLaneSwap" :disabled="!swapTarget">
              {{ $t('games.shuffleLanes') }}
            </button>
          </div>
        </Modal>

        <!-- Add participant modal -->
        <Modal v-if="showAddParticipant" @close-modal="showAddParticipant = false">
          <h4 class="tir-add-form__title">{{ $t('tir.addParticipant') }}</h4>
          <div class="tir-add-form">
            <input
              class="tir-add-form__input"
              v-model="newParticipant.name"
              :placeholder="$t('tir.participantName')"
              @keyup.enter="addParticipant"
            />
            <input class="tir-add-form__input" v-model="newParticipant.city" :placeholder="$t('tir.city')" />
            <button class="tir-add-form__btn" @click="addParticipant" :disabled="!newParticipant.name.trim()">
              {{ $t('teams.addTeam') }}
            </button>
          </div>
        </Modal>
      </div>

      <TirScoringWorkspace
        v-if="view === 'scoring'"
        :is-two-round-system="isTwoRoundSystem"
        :scoring-round-tabs="scoringRoundTabs"
        :active-scoring-round="activeScoringRound"
        :scoring-mode="scoringMode"
        :active-participant="activeParticipant"
        :active-atelier="activeAtelier"
        :scoring-list-participants="scoringListParticipants"
        :scoring-participants="activeScoringParticipants"
        :alphabetic-participants="activeScoringParticipantsAlphabetic"
        :ateliers="tirAteliers"
        :distances="activeScoringDistances"
        :scores-key="activeScoresKey"
        :total-throws="totalThrows"
        :max-total-score="maxTotalScore"
        :read-only="!!tournament.tirPlayoff"
        :show-tiebreaker="
          isRound1Complete &&
          isTwoRoundSystem &&
          currentRound === 1 &&
          !tournament.tirPlayoff &&
          !activeParticipant &&
          activeAtelier === null &&
          (hasPendingTiebreaker || isTiebreakerInProgress)
        "
        :tiebreaker-display-number="tiebreakerCount + (isTiebreakerInProgress ? 0 : 1)"
        :is-tiebreaker-in-progress="isTiebreakerInProgress"
        :is-tiebreaker-round-complete="isTiebreakerRoundComplete"
        :show-round-two-transition="
          canTransitionToRound2 && !tournament.tirPlayoff && !activeParticipant && activeAtelier === null
        "
        @select-round="scoringRound = $event"
        @select-mode="scoringMode = $event"
        @select-participant="activeParticipant = $event"
        @participant-back="onParticipantViewBack"
        @score-update="onScoreUpdate"
        @next-participant="goToNextParticipant"
        @select-atelier="activeAtelier = $event"
        @finish-atelier="finishAtelier"
        @start-tiebreaker="startTiebreaker"
        @finish-tiebreaker="finishTiebreaker"
        @start-round-two="startRound2"
      />

      <TirRoundTable
        v-if="view === 'table'"
        :participants="tirParticipants"
        :rows="roundTableRows"
        :ranked-participants="rankedParticipants"
        :is-two-round-system="isTwoRoundSystem"
        :tiebreaker-count="tiebreakerCount"
        :current-round="currentRound"
        :playoff-has-qf="playoffHasQf"
        :playoff-has-sf="playoffHasSf"
        :playoff-has-final="playoffHasFinal"
        :can-start-playoff="canStartPlayoff"
        :qualify-count="qualifyCount"
        :qualify-options="qualifyOptions"
        :max-total-score="maxTotalScore"
        :total-throws="totalThrows"
        :show-tiebreaker="
          isRound1Complete &&
          isTwoRoundSystem &&
          currentRound === 1 &&
          !tournament.tirPlayoff &&
          (hasPendingTiebreaker || isTiebreakerInProgress)
        "
        :tiebreaker-display-number="tiebreakerCount + (isTiebreakerInProgress ? 0 : 1)"
        :is-tiebreaker-in-progress="isTiebreakerInProgress"
        :is-tiebreaker-round-complete="isTiebreakerRoundComplete"
        :can-transition-to-round2="canTransitionToRound2"
        :has-playoff="!!tournament.tirPlayoff"
        :tournament-finished="!!tournament.tournamentIsFinished"
        :tournament-started="!!tournament.tirStarted"
        @open-participant="openParticipantFromTable"
        @start-tiebreaker="startTiebreaker"
        @finish-tiebreaker="finishTiebreaker"
        @start-round-two="startRound2"
        @return-to-round-one="returnToRound1"
        @update-qualify-count="qualifyCount = $event"
        @start-playoff="startTirPlayoff"
        @finish="$emit('finish')"
        @export="exportResults"
      />

      <TirPlayoffAdmin
        v-if="view === 'playoff' && tournament.tirPlayoff"
        :active-match="activePlayoffMatch"
        :active-match-label="activePlayoffMatchLabel"
        :ateliers="tirAteliers"
        :distances="tirDistances"
        :rounds="playoffAdminRounds"
        :can-finish="canFinishPlayoff"
        :tournament-finished="!!tournament.tournamentIsFinished"
        @close-match="closePlayoffMatch"
        @score-update="onPlayoffScoreChange"
        @open-match="openPlayoffMatch"
        @edit-lane="editLane"
        @finish="finishPlayoffTournament"
        @export="exportResults"
      />
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import Modal from '@/components/Modal';
import TirParticipantsList from './TirParticipantsList.vue';
import TirScoringWorkspace from './TirScoringWorkspace.vue';
import TirRoundTable from './TirRoundTable.vue';
import TirPlayoffAdmin from './TirPlayoffAdmin.vue';
import TournamentNav from '@/components/ui/TournamentNav.vue';
import { Users, Grid3x3, TableProperties, Plus, Trophy } from 'lucide-vue-next';

import {
  SCORING,
  ATELIER_KEYS,
  DISTANCES_FULL,
  DISTANCES_JUNIOR,
  getScoreTotal,
  getScoreCarreauCount,
  getThrowCount,
  isParticipantComplete,
  rankParticipants,
  rankByCombined,
  buildTableRows,
  buildPlayoffBracket,
  advancePlayoff,
  detectTiebreakersNeeded,
  getTiebreakerKey,
  isTiebreakerComplete,
  rankWithTiebreakers,
  getR2QualifiersWithTies,
  getTirPlayoffDisplayRounds,
} from '@/services/tir';
import { buildTirExportData, buildTirCsv, downloadTirFile } from '@/services/tir-export';

export default {
  name: 'TirModule',
  components: {
    Modal,
    TirParticipantsList,
    TirScoringWorkspace,
    TirRoundTable,
    TirPlayoffAdmin,
    TournamentNav,
    Plus,
  },
  emits: ['finish'],
  data() {
    return {
      view: 'scoring',
      scoringMode: 'participant',
      activeParticipant: null,
      activeAtelier: null,
      searchQuery: '',
      showAddParticipant: false,
      newParticipant: { name: '', city: '' },
      qualifyCount: 4,
      activePlayoffMatch: null,
      activePlayoffMatchLabel: '',
      activePlayoffMatchPath: null,
      swapParticipant: null,
      swapTarget: null,
      scoringRound: null,
    };
  },
  created() {
    const t = this.activeTournament || this.currentTournament;
    if (t?.tirPlayoff) {
      this.view = 'playoff';
    }
  },
  watch: {
    qualifyOptions(opts) {
      if (opts.length && !opts.includes(this.qualifyCount)) {
        this.qualifyCount = opts[opts.length - 1];
      }
    },
  },
  computed: {
    ...mapState(useMainStore, ['currentTournament', 'activeTournament']),
    tournament() {
      return this.activeTournament || this.currentTournament;
    },
    tournamentName() {
      return this.currentTournament?.name || this.tournament.name;
    },
    navigationTabs() {
      const tabs = [
        { id: 'participants', label: this.$t('tir.participants'), icon: Users },
        { id: 'scoring', label: this.$t('tir.scoring'), icon: Grid3x3 },
        { id: 'table', label: this.$t('tir.table'), icon: TableProperties },
      ];
      if (this.tournament.tirPlayoff) {
        tabs.push({ id: 'playoff', label: this.$t('games.playOff'), icon: Trophy });
      }
      return tabs;
    },
    tirConfig() {
      return this.tournament.tirConfig || { junior: false, rounds: 1 };
    },
    isTwoRoundSystem() {
      return this.tirConfig.rounds === 2;
    },
    currentRound() {
      return this.tournament.tirRound || 1;
    },
    scoringRoundTabs() {
      const tabs = [{ key: 'r1', label: 'R1' }];
      for (let i = 1; i <= this.tiebreakerCount; i++) {
        tabs.push({ key: `ex${i}`, label: `EX${i}` });
      }
      if (this.currentRound >= 2) tabs.push({ key: 'r2', label: 'R2' });
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
      return ATELIER_KEYS.map((key) => ({
        name: this.$t(`tir.${key}`),
        description: this.$t(`tir.${key}Desc`),
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
      return this.tirParticipants.filter((p) => this.round2ParticipantIds.includes(p.id));
    },
    activeScoringParticipants() {
      if (this.activeScoringRound === 'r2') return this.round2Participants;
      const round = this.activeScoringRound;
      if (typeof round === 'string' && round.startsWith('ex')) {
        const tbKey = this.activeScoresKey;
        return this.tirParticipants.filter((p) => p[tbKey]);
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
        if (aInProgress && bInProgress)
          return bThrows - aThrows || this.getParticipantTotal(b) - this.getParticipantTotal(a);

        if (aComplete && !bComplete) return -1;
        if (!aComplete && bComplete) return 1;
        if (aComplete && bComplete)
          return (
            this.getParticipantTotal(b) - this.getParticipantTotal(a) ||
            this.getCarreauCount(b) - this.getCarreauCount(a)
          );

        return a.name.localeCompare(b.name);
      });
    },
    rankedParticipants() {
      return rankParticipants(this.tirParticipants, this.activeScoresKey);
    },
    r1RankedParticipants() {
      return rankWithTiebreakers(this.tirParticipants, 'scores', this.tiebreakerCount);
    },
    directQualifiers() {
      if (!this.isTwoRoundSystem) return [];
      return this.r1RankedParticipants.slice(0, 4);
    },
    r1TotalThrows() {
      return 5 * this.tirDistances.length;
    },
    isRound1Complete() {
      return this.tirParticipants.every((participant) =>
        isParticipantComplete(participant, 'scores', this.r1TotalThrows),
      );
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
      this.tiebreakerState.top4Ties.forEach((p) => ids.add(p.id));
      this.tiebreakerState.r2Ties.forEach((p) => ids.add(p.id));
      return this.tirParticipants.filter((p) => ids.has(p.id));
    },
    activeTiebreakerKey() {
      return getTiebreakerKey(this.tiebreakerCount + 1);
    },
    isTiebreakerInProgress() {
      return !!this.tournament.tirTiebreakerActive;
    },
    isTiebreakerRoundComplete() {
      if (!this.isTiebreakerInProgress) return false;
      const tbKey = getTiebreakerKey(this.tiebreakerCount);
      const ids = this.tournament.tirTiebreakerParticipantIds || [];
      return ids.every((id) => {
        const p = this.tirParticipants.find((pp) => pp.id === id);
        return p && isTiebreakerComplete(p, tbKey);
      });
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
        return this.round2Participants.every((participant) =>
          isParticipantComplete(participant, 'scores2', this.r1TotalThrows),
        );
      }
      const completedCount = this.tirParticipants.filter((participant) =>
        isParticipantComplete(participant, 'scores', this.r1TotalThrows),
      ).length;
      return completedCount >= 2;
    },
    playoffHasQf() {
      const playoff = this.tournament.tirPlayoff;
      if (!playoff?.rounds?.[0]) return false;
      return playoff.rounds[0].matches.some((m) => m.score1 != null);
    },
    playoffHasSf() {
      const playoff = this.tournament.tirPlayoff;
      if (!playoff?.rounds) return false;
      const sfRound = playoff.rounds.find((r) => r.matches.length === 2);
      return sfRound?.matches.some((m) => m.score1 != null) || false;
    },
    playoffHasFinal() {
      const playoff = this.tournament.tirPlayoff;
      if (!playoff?.rounds) return false;
      const finalRound = playoff.rounds.find((r) => r.matches.length === 1);
      if (finalRound?.matches[0]?.score1 != null) return true;
      return playoff.final?.score1 != null || playoff.thirdPlace?.score1 != null || false;
    },
    qualifyOptions() {
      const completedCount = this.tirParticipants.filter((participant) =>
        isParticipantComplete(participant, 'scores', this.r1TotalThrows),
      ).length;
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
        directIds: this.directQualifiers.map((p) => p.id),
        r2Ids: this.round2ParticipantIds,
        r2CandidateIds: getR2QualifiersWithTies(this.tirParticipants, this.tiebreakerCount).map((p) => p.id),
        playoff: this.tournament.tirPlayoff,
        currentRound: this.currentRound,
        isTwoRoundSystem: this.isTwoRoundSystem,
        hasPlayoffScores: this.playoffHasQf || this.playoffHasSf || this.playoffHasFinal,
        tiebreakerCount: this.tiebreakerCount,
        labels: {
          direct: this.$t('tir.directQualifier'),
          r2Qualifier: this.$t('tir.round2Qualifier'),
          goToR2: this.$t('tir.goToRound2'),
          eliminated: this.$t('tir.eliminated'),
        },
      });
    },
    roundTableRows() {
      return this.tableRows.map((row) => ({
        ...row,
        tiebreakers: Array.from({ length: this.tiebreakerCount }, (_, index) =>
          this.getTiebreakerScoreForTable(row.id, index + 1),
        ),
        displayPlace: this.getPlaceWithTiebreaker(row),
      }));
    },
    playoffDisplayRounds() {
      return getTirPlayoffDisplayRounds(this.tournament.tirPlayoff, {
        final: this.$t('games.final'),
        thirdPlace: this.$t('tir.thirdPlaceMatch'),
        semifinal: this.$t('tir.semifinal'),
        quarterfinal: this.$t('tir.quarterfinal'),
        eighthFinal: this.$t('tir.eighthFinal'),
        sixteenthFinal: this.$t('tir.sixteenthFinal'),
        round: this.$t('tir.round'),
        pending: this.$t('tir.matchPending'),
      });
    },
    playoffAdminRounds() {
      return this.playoffDisplayRounds.map((round, roundIndex) => ({
        ...round,
        entries: round.matches.map((match, matchIndex) => ({
          match,
          lane: this.getMatchLane(roundIndex, matchIndex, match),
        })),
      }));
    },
    canFinishPlayoff() {
      const playoff = this.tournament.tirPlayoff;
      if (!playoff) return false;
      if (this.tournament.tournamentIsFinished) return false;
      if (!playoff.final || !playoff.final.complete) return false;
      if (playoff.thirdPlace && !playoff.thirdPlace.complete) return false;
      return true;
    },
  },
  mounted() {
    this.subscribeTournament();
  },
  beforeUnmount() {
    this.unsubscribeTournament();
  },
  methods: {
    ...mapActions(useMainStore, [
      'syncTirParticipants',
      'syncTirState',
      'syncTirPlayoff',
      'syncTirPlayoffMatch',
      'finishTournament',
      'setActivePlayoffMatchPath',
      'subscribeTournament',
      'unsubscribeTournament',
      'showMessage',
    ]),
    startTiebreaker() {
      const participants = this.activeTiebreakerParticipants;
      if (!participants.length) return;
      const tbKey = this.activeTiebreakerKey;
      participants.forEach((p) => {
        if (!p[tbKey]) p[tbKey] = {};
      });
      this.tournament.tirTiebreakerActive = true;
      this.tournament.tirTiebreakerParticipantIds = participants.map((p) => p.id);
      this.tournament.tirTiebreakerCount = (this.tiebreakerCount || 0) + 1;
      this.scoringRound = `ex${this.tournament.tirTiebreakerCount}`;
      this.syncTirParticipants();
      this.syncTirState();
    },
    finishTiebreaker() {
      this.tournament.tirTiebreakerActive = false;
      this.tournament.tirTiebreakerParticipantIds = null;
      this.syncTirState();
    },
    getPlaceWithTiebreaker(row) {
      if (row.place) return row.place;
      if (!this.tiebreakerState) return '';
      const allTied = [...this.tiebreakerState.top4Ties, ...this.tiebreakerState.r2Ties];
      if (allTied.some((p) => p.id === row.id)) {
        return `EX${this.tiebreakerCount + (this.isTiebreakerInProgress ? 0 : 1)}`;
      }
      return '';
    },
    getTiebreakerScore(participant) {
      const tbKey = getTiebreakerKey(this.tiebreakerCount);
      return getScoreTotal(participant, tbKey);
    },
    getTiebreakerScoreForTable(participantId, round) {
      const p = this.tirParticipants.find((pp) => pp.id === participantId);
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
      const r2Qualifiers = getR2QualifiersWithTies(this.tirParticipants, this.tiebreakerCount);
      this.tournament.tirR2Participants = r2Qualifiers.map((p) => p.id);
      r2Qualifiers.forEach((p) => {
        if (!p.scores2) p.scores2 = {};
      });
      this.tournament.tirRound = 2;
      this.syncTirParticipants();
      this.syncTirState();
    },
    returnToRound1() {
      this.tournament.tirRound = 1;
      this.tournament.tirR2Participants = null;
      this.scoringRound = 'r1';
      this.syncTirState();
    },
    addParticipant() {
      if (!this.newParticipant.name.trim()) return;
      if (!this.tournament.tirParticipants) {
        this.tournament.tirParticipants = [];
      }
      const exists = this.tirParticipants.find(
        (p) => p.name.toLowerCase() === this.newParticipant.name.trim().toLowerCase(),
      );
      if (exists) {
        this.showMessage({
          title: this.$t('messages.error'),
          text: this.$t('messages.teamExists'),
          type: 'error',
        });
        return;
      }
      this.tournament.tirParticipants.push({
        id: Date.now(),
        name: this.newParticipant.name.trim(),
        city: this.newParticipant.city.trim(),
        scores: {},
        lane: this.tirParticipants.length + 1,
      });
      this.newParticipant = { name: '', city: '' };
      this.showAddParticipant = false;
      this.syncTirParticipants();
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
      if (targetLane === sourceLane) {
        this.swapParticipant = null;
        return;
      }
      const targetParticipant = this.tirParticipants.find((p) => this.getParticipantLane(p) === targetLane);
      this.swapParticipant.lane = targetLane;
      if (targetParticipant) {
        targetParticipant.lane = sourceLane;
      }
      this.swapParticipant = null;
      this.syncTirParticipants();
    },
    openParticipantScoring(participant) {
      this.activeParticipant = participant;
      this.view = 'scoring';
      this.scoringMode = 'participant';
    },
    getParticipantTotal(participant) {
      return getScoreTotal(participant, this.activeScoresKey);
    },
    getCarreauCount(participant) {
      return getScoreCarreauCount(participant, this.activeScoresKey);
    },
    getThrowsCompleted(participant) {
      return getThrowCount(participant, this.activeScoresKey);
    },
    onScoreUpdate(updatedParticipants) {
      const updates = Array.isArray(updatedParticipants) ? updatedParticipants : [updatedParticipants];
      updates.filter(Boolean).forEach((updatedParticipant) => {
        const participant = this.tirParticipants.find((item) => item.id === updatedParticipant.id);
        if (!participant) return;
        Object.assign(participant, updatedParticipant);
        if (this.activeParticipant?.id === participant.id) this.activeParticipant = participant;
      });
      this.syncTirParticipants();
    },
    goToNextParticipant() {
      const list = this.scoringListParticipants;
      const currentIndex = list.findIndex((p) => p.id === this.activeParticipant.id);
      const nextIndex = (currentIndex + 1) % list.length;
      this.activeParticipant = list[nextIndex];
    },
    finishAtelier() {
      this.activeAtelier = null;
      this.syncTirParticipants();
    },
    startTirPlayoff() {
      let qualified;
      if (this.isTwoRoundSystem) {
        const direct = this.directQualifiers;
        const r2Ranked = rankByCombined(this.round2Participants);
        const fromR2 = r2Ranked.slice(0, 4);
        qualified = [...direct, ...fromR2];
        this.qualifyCount = 8;
      } else {
        qualified = this.rankedParticipants.slice(0, this.qualifyCount);
      }
      const size = qualified.length;
      this.tournament.tirPlayoff = buildPlayoffBracket(
        qualified.map((participant) => participant.name),
        size,
      );
      this.syncTirPlayoff();
      this.syncTirParticipants();
      this.view = 'playoff';
    },
    openParticipantFromTable(id) {
      const participant = this.tirParticipants.find((p) => p.id === id);
      if (!participant) return;
      this.activeParticipant = participant;
      this.view = 'scoring';
      this.scoringMode = 'participant';
    },
    openPlayoffMatch(match, label) {
      if (!match.player1 || !match.player2) return;
      this.activePlayoffMatch = match;
      this.activePlayoffMatchLabel = label;
      this.activePlayoffMatchPath = this._getMatchFirebasePath(match);
      this.setActivePlayoffMatchPath(this.activePlayoffMatchPath);
    },
    closePlayoffMatch() {
      this.setActivePlayoffMatchPath(null);
      this.advanceIfReady();
      this.activePlayoffMatch = null;
      this.activePlayoffMatchLabel = '';
      this.activePlayoffMatchPath = null;
    },
    _getMatchFirebasePath(match) {
      const playoff = this.tournament.tirPlayoff;
      if (!playoff) return null;
      if (match === playoff.final) return 'final';
      if (match === playoff.thirdPlace) return 'thirdPlace';
      if (playoff.rounds) {
        for (let rIdx = 0; rIdx < playoff.rounds.length; rIdx++) {
          const mIdx = playoff.rounds[rIdx].matches.indexOf(match);
          if (mIdx !== -1) return `rounds/${rIdx}/matches/${mIdx}`;
        }
      }
      return null;
    },
    onPlayoffScoreChange(updatedMatch) {
      if (updatedMatch && this.activePlayoffMatch) {
        Object.assign(this.activePlayoffMatch, updatedMatch);
      }
      if (this.activePlayoffMatchPath && this.activePlayoffMatch) {
        this.syncTirPlayoffMatch(this.activePlayoffMatchPath, this.activePlayoffMatch);
      } else {
        this.syncTirPlayoffMatch(null, null);
      }
    },
    advanceIfReady() {
      const playoff = this.tournament.tirPlayoff;
      if (advancePlayoff(playoff)) this.syncTirPlayoffMatch(null, null);
    },
    finishPlayoffTournament() {
      this.finishTournament();
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
        this.syncTirPlayoffMatch(null, null);
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
    exportResults(format) {
      const data = buildTirExportData({
        tournamentName: this.tournamentName,
        participants: this.tirParticipants,
        distances: this.tirDistances,
        isTwoRoundSystem: this.isTwoRoundSystem,
        currentRound: this.currentRound,
        playoff: this.tournament.tirPlayoff,
      });
      if (format === 'json') {
        downloadTirFile(JSON.stringify(data, null, 2), `${this.tournamentName}_tir.json`, 'application/json');
      } else {
        downloadTirFile(buildTirCsv(data, this.tirDistances), `${this.tournamentName}_tir.csv`, 'text/csv');
      }
    },
  },
};
</script>

<style scoped>
.tir-module {
  background: var(--color-surface);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--color-border);
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
</style>
