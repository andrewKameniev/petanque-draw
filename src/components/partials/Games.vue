<template>
  <div class="content tabs-content">
    <TeamPlayoff v-if="tournament.teamPlayoff" :active-tournament="tournament" />
    <PlayOff v-else-if="tournament.playOff" :active-tournament="tournament" @openResults="$emit('openResults')" />
    <Cadrage
      v-else-if="tournament.cadrage && tournament.cadrage.length"
      :active-tournament="tournament"
      @startPlayOff="$emit('startPlayOff', $event)"
      @finish="onCadrageFinish"
    />
    <div v-else>
      <div
        v-if="
          isOwnerOrAdmin &&
          tournament.games?.length &&
          !tournament.tournamentIsStarted &&
          !tournament.roundIsActive &&
          tournament.games.length === 1 &&
          !hasAnyFinishedGame
        "
        class="draw-card"
      >
        <div class="draw-card__links">
          <a href="#" class="draw-card__link draw-card__link--start" @click.prevent="$emit('startFirstRound')">
            {{ $t('setup.startRound') }}
          </a>
          <span class="draw-card__or">{{ $t('common.or') }}</span>
          <a href="#" class="draw-card__link draw-card__link--redraw" @click.prevent="$emit('redraw')">
            {{ $t('setup.redraw') }}
          </a>
        </div>
      </div>
      <div v-else-if="isOwnerOrAdmin && tournament.games?.length && showDrawLinks" class="draw-card">
        <div class="draw-card__links">
          <a
            v-if="
              !tournament.playOff &&
              !tournament.roundIsActive &&
              tournament.games.length < teamsCount &&
              (tournament.system === 'swiss' ? activeRound <= maxSwissRounds : true)
            "
            href="#"
            class="draw-card__link draw-card__link--draw"
            data-testid="link-draw-next-round"
            @click.prevent="drawRound"
          >
            {{ `${$t('games.draw')} ${activeRound}` }} {{ $t('common.round') }}
          </a>
          <template
            v-if="
              tournament.games.length &&
              !tournament.roundIsActive &&
              !isRestoredRound &&
              !tournament.playOff &&
              tournament.games.length < teamsCount &&
              (tournament.system === 'swiss' ? activeRound <= maxSwissRounds : true)
            "
          >
            <span class="draw-card__or">{{ $t('common.or') }}</span>
          </template>
          <a
            v-if="tournament.games.length && !tournament.roundIsActive && !isRestoredRound && !tournament.playOff"
            href="#"
            class="draw-card__link draw-card__link--restore"
            data-testid="link-restore-round"
            @click.prevent="showRestoreConfirm = true"
            >{{ $t('games.restoreRound') }}</a
          >
        </div>
      </div>
      <div v-if="tournament.games && tournament.games.length && tournament.roundIsActive">
        <h2 class="text-center">
          <template v-if="tournament.barrage">{{ barrageRoundLabel }}</template>
          <template v-else-if="tournament.system === 'poules'">{{ poulesRoundLabel }}</template>
          <template v-else
            >{{ $t('common.round') }} {{ activeRound
            }}<template v-if="groupTotalRoundsDisplay">/{{ groupTotalRoundsDisplay }}</template></template
          >
        </h2>
        <div v-if="showTimerSection" class="round-timer-section">
          <RoundTimer
            v-if="tournament.roundTimer?.timerStatus === 'running' || tournament.roundTimer?.timerStatus === 'ended'"
            :timer-started-at="tournament.roundTimer.timerStartedAt"
            :timer-ends-at="tournament.roundTimer.timerEndsAt"
            :timer-status="tournament.roundTimer.timerStatus"
            :cochonettes-enabled="!!tournament.preferences.cochonettesEnabled"
            :cochonettes="tournament.preferences.cochonettes || 1"
            @timer-ended="onTimerEnded"
            @restart="onTimerRestart"
          />
          <button v-else-if="isOwnerOrAdmin" class="start-timer-btn" @click="startRoundTimer">
            <Timer :size="16" />
            {{ $t('timer.startTimer') }}
          </button>
        </div>
        <div class="games-toolbar">
          <button class="games-toolbar__toggle is-hidden-tablet" @click="compactView = !compactView">
            {{ compactView ? $t('games.full') : $t('games.compact') }} {{ $t('games.view') }}
            <ChevronDown
              :size="16"
              class="games-toolbar__arrow"
              :class="{ 'games-toolbar__arrow--up': !compactView }"
            />
          </button>
        </div>
        <div class="games-list" v-if="tournament.barrage">
          <div v-for="(group, gIdx) in poulesGroupedGames" :key="gIdx" class="poules-group">
            <h4 class="poules-group__title">{{ $t('common.group') }} {{ groupNames[gIdx] }}</h4>
            <Game
              v-for="(game, index) in group"
              :key="index"
              :game="game"
              :activeRound="activeRound - 1"
              :activeTournament="tournament"
              :compactView="compactView"
              :game-index="currentRoundGames.indexOf(game)"
              @update="onGameUpdate"
              @finish="onGameFinish"
              @swapLane="swapLane"
            />
          </div>
          <div v-if="scoreError" class="has-text-centered has-text-danger mb-5 mt-4">
            {{ $t('games.resultsError') }}
          </div>
        </div>
        <div class="games-list" v-else-if="tournament.system === 'poules'">
          <div v-for="(group, gIdx) in poulesGroupedGames" :key="gIdx" class="poules-group">
            <h4 class="poules-group__title">{{ $t('common.group') }} {{ groupNames[gIdx] }}</h4>
            <Game
              v-for="(game, index) in group"
              :key="index"
              :game="game"
              :activeRound="activeRound - 1"
              :activeTournament="tournament"
              :compactView="compactView"
              :game-index="currentRoundGames.indexOf(game)"
              @update="onGameUpdate"
              @finish="onGameFinish"
              @swapLane="swapLane"
            />
          </div>
          <div v-if="scoreError" class="has-text-centered has-text-danger mb-5 mt-4">
            {{ $t('games.resultsError') }}
          </div>
        </div>
        <div class="games-list" v-else-if="tournament.groups && tournament.groups.length > 1">
          <div v-for="(group, gIdx) in poulesGroupedGames" :key="gIdx" class="poules-group">
            <h4 class="poules-group__title">{{ $t('common.group') }} {{ groupNames[gIdx] }}</h4>
            <Game
              v-for="(game, index) in group"
              :key="index"
              :game="game"
              :activeRound="activeRound - 1"
              :activeTournament="tournament"
              :compactView="compactView"
              :game-index="currentRoundGames.indexOf(game)"
              @update="onGameUpdate"
              @finish="onGameFinish"
              @swapLane="swapLane"
            />
          </div>
          <div v-if="scoreError" class="has-text-centered has-text-danger mb-5 mt-4">
            {{ $t('games.resultsError') }}
          </div>
        </div>
        <div class="games-list" v-else>
          <Game
            v-for="(game, index) in tournament.games[activeRound - 1]"
            :key="index"
            :game="game"
            :activeRound="activeRound - 1"
            :activeTournament="tournament"
            :compactView="compactView"
            :game-index="index"
            @update="onGameUpdate"
            @finish="onGameFinish"
            @swapLane="swapLane"
          />
          <div v-if="scoreError" class="has-text-centered has-text-danger mb-5 mt-4">
            {{ $t('games.resultsError') }}
          </div>
        </div>
        <div class="has-text-danger mt-3" v-if="saveDisabled">{{ $t('games.drawError') }}</div>
        <div class="finish-round-section" v-if="tournament.roundIsActive && isOwnerOrAdmin">
          <button class="finish-round-btn" data-testid="btn-finish-round" @click="validateAndFinishRound">
            {{ $t('games.finishRound') }}
          </button>
          <a
            v-if="!tournament.playOff"
            href="#"
            class="restore-round-link"
            @click.prevent="showRestoreConfirm = true"
          >
            {{ $t('games.restoreRound') }}
          </a>
        </div>
      </div>
      <div v-else-if="tournament.tournamentIsFinished">
        <FinishedBanner @openResults="$emit('openResults')" />
      </div>
      <div
        v-else-if="tournament.games && tournament.games.length >= teamsCount && tournament.system === 'groups'"
        class="draw-card"
      >
        <div class="draw-card__links">
          <a
            href="#"
            class="draw-card__link draw-card__link--draw"
            data-testid="link-start-team-playoff"
            @click.prevent="startTeamPlayoff"
          >
            {{ $t('teamPlayoff.startPlayoff') }}
          </a>
          <template v-if="tournament.preferences?.groupFormat !== 'swiss'">
            <span class="draw-card__or">{{ $t('common.or') }}</span>
            <a
              href="#"
              class="draw-card__link draw-card__link--draw"
              data-testid="link-play-next-circle"
              @click.prevent="playNextCircle"
            >
              {{ $t('games.playNextCircle') }}
            </a>
          </template>
          <span class="draw-card__or">{{ $t('common.or') }}</span>
          <a
            href="#"
            class="draw-card__link draw-card__link--restore"
            data-testid="link-restore-round-circle"
            @click.prevent="showRestoreConfirm = true"
            >{{ $t('games.restoreRound') }}</a
          >
        </div>
        <div v-if="tournament.roundRobinCircle > 1" class="draw-card__circle-info">
          {{ $t('games.circlesPlayed') }}: {{ tournament.roundRobinCircle || 1 }}
        </div>
      </div>
      <div v-else-if="tournament.games && tournament.games.length >= teamsCount && tournament.system !== 'poules'">
        {{ $t('games.quantityError') }}
      </div>
    </div>
    <ConfirmRemoveModal
      v-if="showRestoreConfirm"
      :hint="$t('games.restoreRound')"
      :message="$t('games.restoreRoundConfirm')"
      :confirm-label="$t('games.restoreRound')"
      @confirm="restoreRoundGames()"
      @close="showRestoreConfirm = false"
    />
    <ConfirmRemoveModal
      v-if="showFinishConfirmIndex !== null"
      :hint="$t('teamPlayoff.finishMatch')"
      :confirm-label="$t('teamPlayoff.finishMatch')"
      @confirm="confirmFinishMatch()"
      @close="showFinishConfirmIndex = null"
    >
      <div v-if="finishConfirmGame" class="finish-match-preview">
        <div
          class="finish-match-preview__row"
          :class="{
            'finish-match-preview__row--winner': finishConfirmGame.team_1_score > finishConfirmGame.team_2_score,
          }"
        >
          <span class="finish-match-preview__name">{{ finishConfirmGame.team_1 }}</span>
          <span class="finish-match-preview__score">{{ finishConfirmGame.team_1_score }}</span>
        </div>
        <div
          class="finish-match-preview__row"
          :class="{
            'finish-match-preview__row--winner': finishConfirmGame.team_2_score > finishConfirmGame.team_1_score,
          }"
        >
          <span class="finish-match-preview__name">{{ finishConfirmGame.team_2 }}</span>
          <span class="finish-match-preview__score">{{ finishConfirmGame.team_2_score }}</span>
        </div>
      </div>
    </ConfirmRemoveModal>
  </div>
</template>

<script>
import PlayOff from './PlayOff';
import TeamPlayoff from './TeamPlayoff.vue';
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { gameHasError, shuffleArray, tournamentNames, updateScoreHistory } from '@/helpers';
import {
  drawSwissRound,
  drawSupermeleRound,
  drawGroupsRound,
  drawGroupsSwissRound,
  assignLanes,
  generateConstrainedGroups,
  saveResultsForRound,
  resetGroupsScheme,
  drawPoulesRound,
  getPoulesQualifiedTeams,
} from '@/services/draw';
import Game from '@/components/partials/Game.vue';
import Cadrage from '@/components/partials/Cadrage.vue';
import { ChevronDown, Timer } from 'lucide-vue-next';
import FinishedBanner from '@/components/partials/FinishedBanner.vue';
import ConfirmRemoveModal from '@/components/ConfirmRemoveModal.vue';
import RoundTimer from '@/components/partials/RoundTimer.vue';

export default {
  name: 'Games',
  components: {
    Cadrage,
    Game,
    PlayOff,
    TeamPlayoff,
    ChevronDown,
    Timer,
    ConfirmRemoveModal,
    FinishedBanner,
    RoundTimer,
  },
  props: ['activeRound', 'teamsInGroup', 'rankingTeams', 'activeTournament'],
  data() {
    return {
      saveDisabled: false,
      scoreError: false,
      isRestoredRound: false,
      compactView: false,
      showRestoreConfirm: false,
      showFinishConfirmIndex: null,
      finishConfirmSource: null,
      autoFinishAfterSave: false,
    };
  },
  mounted() {
    this._onTab = (e) => {
      if (e.key === 'Tab' && !!document.querySelector('#tab-games.is-active')) {
        const inputs = Array.from(document.querySelectorAll('.game-row input[type="number"]:not(:disabled)'));
        if (!inputs.length) return;
        const currentIndex = inputs.indexOf(e.target);
        e.preventDefault();
        const nextIndex =
          currentIndex === -1
            ? 0
            : e.shiftKey
              ? (currentIndex - 1 + inputs.length) % inputs.length
              : (currentIndex + 1) % inputs.length;
        inputs[nextIndex].focus();
        inputs[nextIndex].select();
      }
    };
    document.addEventListener('keydown', this._onTab);
    this.subscribeTournament();
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this._onTab);
    this.unsubscribeTournament();
  },
  computed: {
    ...mapState(useMainStore, [
      'tournaments',
      'currentTournamentIndex',
      'isAdmin',
      'currentTournament',
      'allScoresFilled',
      'isOwnerOrAdmin',
    ]),
    tournament() {
      return this.activeTournament || this.currentTournament;
    },
    groupTotalRoundsDisplay() {
      const perCircle = this.tournament?.preferences?.groupTotalRounds;
      if (!perCircle) return null;
      const circles = this.tournament.roundRobinCircle || 1;
      return perCircle * circles;
    },
    teamsCount() {
      if (this.tournament.system === 'swiss') return (this.tournament.teams?.length || 0) - 1;
      if (this.tournament.groups) {
        if (this.tournament.preferences?.groupFormat === 'swiss') {
          return this.tournament.preferences.groupSwissRounds || 3;
        }
        const perCircle = this.tournament.preferences?.groupTotalRounds;
        const circles = this.tournament.roundRobinCircle || 1;
        if (perCircle) {
          return perCircle * circles;
        }
        const roundsPerCircle =
          this.tournament.groups[0].length % 2 !== 0
            ? this.tournament.groups[0].length
            : this.tournament.groups[0].length - 1;
        return roundsPerCircle * circles;
      }
      return this.tournament.teams.length - 1;
    },
    maxSwissRounds() {
      return Math.ceil(Math.log2(this.tournament.teams?.length));
    },
    poulesRoundLabel() {
      const round = this.tournament.poulesRound || 1;
      if (round === 1) return this.$t('games.poulesRound1');
      if (round === 2) return this.$t('games.poulesRound2');
      return this.$t('games.poulesRound3');
    },
    barrageRoundLabel() {
      const round = this.tournament.barrage?.barrageRound || 1;
      return `B${round}`;
    },
    groupNames() {
      return tournamentNames;
    },
    currentRoundGames() {
      return this.tournament.games?.[this.activeRound - 1] || [];
    },
    poulesGroupedGames() {
      const games = this.currentRoundGames;
      const grouped = {};
      games.forEach((game) => {
        const g = game.group ?? 0;
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push(game);
      });
      return Object.keys(grouped)
        .sort((a, b) => a - b)
        .map((k) => grouped[k]);
    },
    showTimerSection() {
      if (!this.tournament.preferences?.timeLimitEnabled) return false;
      if (!this.tournament.roundIsActive) return false;
      const prefs = this.tournament.preferences;
      const isFinale =
        this.tournament.playOffStage === 1 ||
        (this.tournament.playOff?.length &&
          this.tournament.playOff[this.tournament.playOff.length - 1].teams?.length === 1);
      if (isFinale && prefs.noTimeLimitFinale) return false;
      return true;
    },
    showDrawLinks() {
      if (!this.tournament.games?.length) return false;
      if (this.tournament.tournamentIsFinished) return false;
      if (this.tournament.system === 'poules') return false;
      if (this.tournament.system === 'tir') return false;
      if (this.tournament.barrage) return false;
      if (
        this.tournament.system === 'groups' &&
        this.tournament.games.length >= this.teamsCount &&
        !this.tournament.roundIsActive
      )
        return false;
      const hasDrawLink =
        !this.tournament.playOff &&
        !this.tournament.roundIsActive &&
        this.tournament.games.length < this.teamsCount &&
        (this.tournament.system === 'swiss' ? this.activeRound <= this.maxSwissRounds : true);
      const hasRestoreLink =
        this.tournament.games.length &&
        !this.tournament.roundIsActive &&
        !this.isRestoredRound &&
        !this.tournament.playOff;
      return hasDrawLink || hasRestoreLink;
    },
    canRestoreRound() {
      return (
        !!(this.tournament.playOff || (this.tournament.cadrage && this.tournament.cadrage.length)) &&
        this.tournament.games?.length &&
        !this.isRestoredRound
      );
    },
    allGamesFinished() {
      const games = this.currentRoundGames;
      if (!games.length) return false;
      return games.every((g) => g.status === 'finished' || g.team_2 === 'Technical');
    },
    hasAnyFinishedGame() {
      return this.currentRoundGames.some((g) => g.status === 'finished' || g.status === 'in_progress');
    },
    finishConfirmGame() {
      if (this.showFinishConfirmIndex === null) return null;
      if (this.finishConfirmSource === 'cadrage') {
        return this.tournament.cadrage?.[this.showFinishConfirmIndex] || null;
      }
      return this.currentRoundGames[this.showFinishConfirmIndex] || null;
    },
  },
  methods: {
    ...mapActions(useMainStore, [
      'startRound',
      'endRound',
      'addRoundToGames',
      'restoreRound',
      'showMessage',
      'shuffleLanesStore',
      'swapLanesStore',
      'setPlayOffStage',
      'setPlayOffBracket',
      'setBarrage',
      'syncGameMatch',
      'syncCadrageMatch',
      'syncGames',
      'syncTeams',
      'syncGamesAndTeams',
      'syncTeamPlayoff',
      'syncPathNull',
      'startRoundTimer',
      'endRoundTimer',
      'clearRoundTimer',
      'restartRoundTimer',
      'subscribeTournament',
      'unsubscribeTournament',
      'finishTournament',
      'syncPoulesRound',
      'syncTournamentStarted',
      'removeTournamentB',
    ]),
    gameHasError,
    onTimerEnded() {
      this.endRoundTimer();
    },
    onTimerRestart(minutes) {
      this.restartRoundTimer(minutes);
    },
    onGameUpdate(gameIndex) {
      const game = this.tournament.games[this.activeRound - 1][gameIndex];
      updateScoreHistory(game);
      this.syncGameMatch(this.activeRound - 1, gameIndex, game);
    },
    onGameFinish(gameIndex) {
      this.finishConfirmSource = 'games';
      this.showFinishConfirmIndex = gameIndex;
    },
    onCadrageFinish(gameIndex) {
      this.finishConfirmSource = 'cadrage';
      this.showFinishConfirmIndex = gameIndex;
    },
    confirmFinishMatch() {
      const idx = this.showFinishConfirmIndex;
      const isCadrage = this.finishConfirmSource === 'cadrage';
      const game = isCadrage ? this.tournament.cadrage[idx] : this.tournament.games[this.activeRound - 1][idx];
      game.team_1_score = Number(game.team_1_score);
      game.team_2_score = Number(game.team_2_score);
      game.status = 'finished';
      game.winner = game.team_1_score > game.team_2_score ? game.team_1 : game.team_2;
      game.updated_at = new Date().toISOString();
      if (isCadrage) {
        this.syncCadrageMatch(idx, game);
      } else {
        this.syncGameMatch(this.activeRound - 1, idx, game);
      }
      this.showFinishConfirmIndex = null;
      this.finishConfirmSource = null;
      if (isCadrage) return;
      const allFinished = this.tournament.games[this.activeRound - 1].every((g) => g.status === 'finished');
      if (allFinished && this.tournament.roundTimer?.timerStatus === 'running') {
        this.endRoundTimer();
      }
    },
    validateAndFinishRound() {
      const games = this.currentRoundGames;
      for (const game of games) {
        if (game.team_2 === 'Technical') continue;
        const s1 = Number(game.team_1_score);
        const s2 = Number(game.team_2_score);
        if (
          game.team_1_score == null ||
          game.team_1_score === '' ||
          game.team_2_score == null ||
          game.team_2_score === ''
        ) {
          this.showMessage({
            title: this.$t('messages.error'),
            text: this.$t('games.finishAllGames'),
            type: 'error',
          });
          return;
        }
        if (isNaN(s1) || isNaN(s2) || s1 === s2) {
          this.showMessage({
            title: this.$t('messages.error'),
            text: this.$t('games.noDrawsAllowed'),
            type: 'error',
          });
          return;
        }
      }
      this.finishRound();
    },
    finishRound() {
      this.scoreError = false;
      this.tournament.tournamentIsStarted = true;
      this.tournament.games[this.activeRound - 1].forEach((game) => {
        game.team_1_score = Number(game.team_1_score);
        game.team_2_score = Number(game.team_2_score);
        game.status = 'finished';
        if (game.team_1_score > game.team_2_score) game.winner = game.team_1;
        else if (game.team_2_score > game.team_1_score) game.winner = game.team_2;
      });
      if (!this.tournament.barrage) {
        this.tournament.teams.forEach((team) => {
          team.wins = 0;
          team.opponents = [];
          team.buhgolts = 0;
          team.smallBuhgolts = 0;
          team.pointsMinus = 0;
          team.pointsPlus = 0;
        });
        for (let i = 0; i < this.tournament.games.length; i++) {
          this.saveResultsForRound(i);
        }
      }
      this.clearRoundTimer();
      this.endRound();
      this.syncGamesAndTeams();
      this.isRestoredRound = false;

      if (this.tournament.barrage && this.tournament.barrage.barrageRound < 3) {
        this.drawBarrageRound();
        this.showMessage({ title: this.$t('messages.success'), text: this.$t('messages.resultsSaved') });
        return;
      }
      if (this.tournament.barrage && this.tournament.barrage.barrageRound === 3) {
        const qualified = this.getBarrageQualifiedTeams();
        this.$emit('startPlayOff', qualified);
        this.showMessage({ title: this.$t('messages.success'), text: this.$t('messages.resultsSaved') });
        return;
      }
      if (this.tournament.system === 'poules' && this.tournament.poulesRound < 3) {
        this.drawRound();
        this.showMessage({ title: this.$t('messages.success'), text: this.$t('messages.resultsSaved') });
        return;
      }
      if (this.tournament.system === 'poules' && this.tournament.poulesRound === 3) {
        const qualified = getPoulesQualifiedTeams(this.tournament);
        this.$emit('startPlayOff', qualified);
        this.showMessage({ title: this.$t('messages.success'), text: this.$t('messages.resultsSaved') });
        return;
      }
      this.showMessage({ title: this.$t('messages.success'), text: this.$t('messages.resultsSaved') });
      if (this.autoFinishAfterSave) {
        this.autoFinishAfterSave = false;
        this.finishTournament();
      }
    },
    shuffleLanes() {
      const currentRound = this.tournament.games[this.tournament.games.length - 1];
      const reshuffled = assignLanes(shuffleArray([...currentRound]), this.tournament);
      this.shuffleLanesStore(reshuffled);
    },
    swapLane({ fromIndex, targetLane }) {
      const fieldsStart = this.tournament.preferences.fieldsStart;
      const targetIndex = targetLane - fieldsStart;
      const games = this.tournament.games[this.activeRound - 1];
      if (targetIndex < 0 || targetIndex >= games.length || targetIndex === fromIndex) return;
      this.swapLanesStore({ roundIndex: this.activeRound - 1, indexA: fromIndex, indexB: targetIndex });
    },
    drawRound() {
      if (this.tournament.teams.length < 5 && this.tournament.system === 'swiss') {
        this.showMessage({
          title: this.$t('games.chooseSystem'),
          text: this.$t('games.chooseSystemText'),
          type: 'error',
        });
        return;
      }
      let round = [];

      if (this.tournament.system === 'swiss' && !this.tournament.groups?.length) {
        const result = drawSwissRound(this.tournament, this.rankingTeams, this.activeRound);
        if (result.error) {
          this.saveDisabled = true;
          this.showMessage({
            title: this.$t('messages.cantDrawRound'),
            text: this.$t('messages.tooManyGames'),
            type: 'error',
          });
          return;
        }
        round = result.round;
      } else if (this.tournament.system === 'groups' || this.tournament.groups?.length) {
        if (this.activeRound === 1) {
          this.createGroups();
        }
        if (this.tournament.preferences?.groupFormat === 'swiss') {
          if (this.tournament.groups) {
            round = drawGroupsSwissRound(this.tournament, this.activeRound);
          }
        } else if (this.tournament.groupSchedule && this.tournament.groupSchedule[this.activeRound - 1]) {
          round = this.tournament.groupSchedule[this.activeRound - 1].map((g) => ({
            ...g,
            status: g.status || 'not_started',
          }));
          this.addRoundToGames(round);
          this.startRound();
          this.isRestoredRound = false;
          return;
        } else if (this.tournament.groups) {
          round = drawGroupsRound(this.tournament);
        }
      } else if (this.tournament.system === 'poules') {
        this.tournament.poulesRound = (this.tournament.poulesRound || 0) + 1;
        round = drawPoulesRound(this.tournament);
      } else if (this.tournament.system === 'supermele') {
        round = drawSupermeleRound(this.tournament, this.rankingTeams);
      }
      this.addRoundToGames(assignLanes(shuffleArray(round), this.tournament));
      this.startRound();
      this.isRestoredRound = false;
    },
    createGroups() {
      if (this.teamsInGroup < 3) {
        this.showMessage({
          title: this.$t('messages.cantDraw'),
          text: this.$t('messages.chooseCorrectTeams'),
          type: 'error',
        });
        return false;
      }
      const result = generateConstrainedGroups(this.tournament, this.teamsInGroup);
      this.tournament.groups = result.groups;
      this.tournament.groupsScheme = result.schemas;
      if (result.warning) {
        this.showMessage({
          title: this.$t('messages.warning'),
          text: this.$t('messages.constraintsNotSatisfied'),
          type: 'error',
        });
      }
    },
    saveResults() {
      this.finishRound();
    },
    clearPlayoffState(includeCadrage) {
      delete this.tournament.playOff;
      delete this.tournament.playOffBracket;
      delete this.tournament.playOffStage;
      this.syncPathNull('playOff');
      this.syncPathNull('playOffBracket');
      this.syncPathNull('playOffStage');
      if (includeCadrage) {
        delete this.tournament.cadrage;
        this.syncPathNull('cadrage');
      }
    },
    recalcTeamStats() {
      const isGroups = this.tournament.system === 'groups' || this.tournament.groups?.length;
      this.tournament.teams.forEach((team) => {
        team.opponents = isGroups ? ['placeholder'] : [];
        team.pointsPlus = 0;
        team.pointsMinus = 0;
        team.wins = 0;
      });
      const rounds = isGroups ? this.activeRound - 2 : this.tournament.games.length;
      for (let i = 0; i < rounds; i++) {
        this.saveResultsForRound(i);
      }
    },
    restoreRoundGames() {
      this.clearRoundTimer();
      this.isRestoredRound = true;

      if (this.tournament.playOff || this.tournament.cadrage?.length) {
        this.restorePlayoffStage();
        return;
      }
      if (this.tournament.roundIsActive) {
        this.restoreActiveRound();
      } else {
        this.startRound();
      }
    },
    restorePlayoffStage() {
      const bracket = this.tournament.playOffBracket;
      const currentStage = this.tournament.playOffStage ?? this.tournament.playOff?.[0]?.stage;
      const firstPlayoffStageLabel = bracket?.stages?.find((s) => s.stageLabel !== 'cadrage')?.stageLabel;

      if (bracket && currentStage && currentStage < firstPlayoffStageLabel) {
        const restoredBracket = JSON.parse(JSON.stringify(bracket));
        const currentIndex = restoredBracket.stages.findIndex((s) => s.stageLabel === currentStage);
        if (currentIndex !== -1) {
          restoredBracket.stages[currentIndex].teams.forEach((game) => {
            game.team_1 = null;
            game.team_2 = null;
            game.team_1_score = null;
            game.team_2_score = null;
          });
        }
        if (currentStage === 1 && restoredBracket.thirdPlace) {
          restoredBracket.thirdPlace = {};
        }
        this.setPlayOffBracket(restoredBracket);
        this.setPlayOffStage(currentStage * 2);
        return;
      }

      if (this.tournament.cadrage?.length) {
        this.clearPlayoffState(false);
        return;
      }

      this.clearPlayoffState(true);
      if (this.tournament.preferences?.playB) {
        this.removeTournamentB();
        this.tournament.preferences.playB = false;
      }
      if (this.tournament.system === 'poules') {
        this.tournament.poulesRound = 3;
        this.syncPoulesRound();
      }
      if (this.tournament.barrage) {
        this.tournament.barrage.barrageRound = 3;
        this.setBarrage(this.tournament.barrage);
      }
      this.startRound();
    },
    restoreActiveRound() {
      this.restoreRound();

      if (!this.tournament.games.length) {
        this.endRound();
        this.tournament.tournamentIsStarted = false;
        this.syncTournamentStarted(false);
        this.syncGamesAndTeams();
        return;
      }

      if (this.tournament.barrage) {
        const barrage = this.tournament.barrage;
        if (barrage.barrageRound > 1) {
          barrage.barrageRound--;
          this.setBarrage(barrage);
        } else {
          delete this.tournament.barrage;
          this.syncPathNull('barrage');
        }
      } else if (
        this.tournament.system === 'poules' ||
        this.tournament.system === 'groups' ||
        this.tournament.groups?.length
      ) {
        if (this.tournament.system === 'poules' && this.tournament.poulesRound > 1) {
          this.tournament.poulesRound--;
          this.syncPoulesRound();
        }
        this.recalcTeamStats();
        this.syncGamesAndTeams();
      }
    },
    startTeamPlayoff() {
      const teams = [...this.tournament.teams].sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.pointsPlus - b.pointsMinus !== a.pointsPlus - a.pointsMinus) {
          return b.pointsPlus - b.pointsMinus - (a.pointsPlus - a.pointsMinus);
        }
        return b.pointsPlus - a.pointsPlus;
      });

      const qualifyCount = this.tournament.preferences.playOffTeams || 8;
      const qualified = teams.slice(0, Math.min(qualifyCount, teams.length));
      const size = Math.pow(2, Math.ceil(Math.log2(qualified.length)));

      while (qualified.length < size) {
        qualified.push({ title: null, isBye: true });
      }

      const createMatch = (t1, t2) => ({
        team1: t1,
        team2: t2,
        team1Score: null,
        team2Score: null,
        status: 'not_started',
        winner: null,
        updatedAt: null,
        updatedBy: null,
      });

      if (size === 2) {
        this.tournament.teamPlayoff = {
          rounds: [],
          qualified: qualified.filter((t) => t.title).map((t) => t.title),
          size,
          thirdPlace: null,
          final: createMatch(qualified[0].title, qualified[1].title),
        };
      } else {
        const matches = [];
        for (let i = 0; i < size / 2; i++) {
          const t1 = qualified[i];
          const t2 = qualified[size - 1 - i];
          if (t1.isBye || t2.isBye) continue;
          matches.push(createMatch(t1.title, t2.title));
        }
        this.tournament.teamPlayoff = {
          rounds: [{ matches }],
          qualified: qualified.filter((t) => t.title).map((t) => t.title),
          size,
          thirdPlace: null,
          final: null,
        };
      }
      this.syncTeamPlayoff();
    },
    playNextCircle() {
      this.tournament.roundRobinCircle = (this.tournament.roundRobinCircle || 1) + 1;
      this.tournament.groupsScheme = resetGroupsScheme(this.tournament);
      const round = drawGroupsRound(this.tournament);
      this.addRoundToGames(assignLanes(shuffleArray(round), this.tournament));
      this.startRound();
    },
    drawBarrageRound() {
      const barrage = this.tournament.barrage;
      const nextRound = barrage.barrageRound + 1;
      const groups = barrage.groups;
      const round = [];

      // Get barrage games only (from startIndex onwards)
      const barrageGames = this.tournament.games.slice(barrage.startIndex);

      if (nextRound === 2) {
        // Round 2: winners play winners, losers play losers
        groups.forEach((group, groupIndex) => {
          const r1Games = barrageGames[0].filter((g) => g.group === groupIndex);
          const game1 = r1Games[0];
          const game2 = r1Games[1];

          const winner1 = game1.team_1_score > game1.team_2_score ? game1.team_1 : game1.team_2;
          const loser1 = game1.team_1_score > game1.team_2_score ? game1.team_2 : game1.team_1;
          const winner2 = game2.team_1_score > game2.team_2_score ? game2.team_1 : game2.team_2;
          const loser2 = game2.team_1_score > game2.team_2_score ? game2.team_2 : game2.team_1;

          round.push({
            group: groupIndex,
            team_1: winner1,
            team_1_score: null,
            team_2: winner2,
            team_2_score: null,
            status: 'not_started',
          });
          round.push({
            group: groupIndex,
            team_1: loser1,
            team_1_score: null,
            team_2: loser2,
            team_2_score: null,
            status: 'not_started',
          });
        });
      } else if (nextRound === 3) {
        groups.forEach((group, groupIndex) => {
          const teamWins = {};
          group.forEach((t) => {
            teamWins[t.title] = 0;
          });

          barrageGames.forEach((roundGames) => {
            roundGames
              .filter((g) => g.group === groupIndex)
              .forEach((game) => {
                if (game.team_1_score > game.team_2_score) {
                  teamWins[game.team_1]++;
                } else if (game.team_2_score > game.team_1_score) {
                  teamWins[game.team_2]++;
                }
              });
          });

          const oneWinTeams = Object.entries(teamWins)
            .filter(([, wins]) => wins === 1)
            .map(([title]) => title);

          if (oneWinTeams.length === 2) {
            round.push({
              group: groupIndex,
              team_1: oneWinTeams[0],
              team_1_score: null,
              team_2: oneWinTeams[1],
              team_2_score: null,
              status: 'not_started',
            });
          }
        });
      }

      barrage.barrageRound = nextRound;
      this.setBarrage(barrage);
      this.addRoundToGames(assignLanes(shuffleArray(round), this.tournament));
      this.startRound();
    },
    getBarrageQualifiedTeams() {
      const barrage = this.tournament.barrage;
      const groups = barrage.groups;
      const barrageGames = this.tournament.games.slice(barrage.startIndex);

      const groupQualified = [];
      groups.forEach((group, groupIndex) => {
        const teamWins = {};
        const teamPoints = {};
        group.forEach((t) => {
          teamWins[t.title] = 0;
          teamPoints[t.title] = 0;
        });

        barrageGames.forEach((roundGames) => {
          roundGames
            .filter((g) => g.group === groupIndex)
            .forEach((game) => {
              if (game.team_1_score > game.team_2_score) {
                teamWins[game.team_1]++;
              } else if (game.team_2_score > game.team_1_score) {
                teamWins[game.team_2]++;
              }
              teamPoints[game.team_1] = (teamPoints[game.team_1] || 0) + (game.team_1_score - game.team_2_score);
              teamPoints[game.team_2] = (teamPoints[game.team_2] || 0) + (game.team_2_score - game.team_1_score);
            });
        });

        const qualifiedFromGroup = Object.entries(teamWins)
          .filter(([, wins]) => wins >= 2)
          .sort((a, b) => b[1] - a[1] || (teamPoints[b[0]] || 0) - (teamPoints[a[0]] || 0))
          .map(([title]) => this.tournament.teams.find((t) => t.title === title));

        groupQualified.push(qualifiedFromGroup);
      });

      // Interleave: all group winners first, then all runners-up
      const qualified = [];
      const maxPerGroup = Math.max(...groupQualified.map((g) => g.length));
      for (let i = 0; i < maxPerGroup; i++) {
        groupQualified.forEach((group) => {
          if (group[i]) qualified.push(group[i]);
        });
      }

      // Pad to next power of 2 with bye placeholders for proper bracket generation
      const nextPow2 = Math.pow(2, Math.ceil(Math.log2(qualified.length)));
      while (qualified.length < nextPow2) {
        qualified.push({ title: null, isBye: true });
      }

      return qualified;
    },
    saveResultsForRound(round) {
      saveResultsForRound(this.tournament, round);
    },
  },
};
</script>

<style scoped>
.round-timer-section {
  display: flex;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.start-timer-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.15s;
}

.start-timer-btn:hover {
  background: var(--color-primary);
  color: var(--color-btn-text);
}

.draw-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.5rem 0 1rem;
  min-height: 240px;
}

.draw-card__links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: nowrap;
  white-space: nowrap;
}

@media screen and (max-width: 768px) {
  .draw-card__links {
    flex-direction: column;
    gap: 0.4rem;
  }
}

.draw-card__link {
  font-size: 1.15rem;
  font-weight: 600;
  text-decoration: underline;
}

.draw-card__link--draw {
  color: var(--color-info);
}

.draw-card__link--start {
  color: var(--tir-carreau, #4caf50);
}

.draw-card__link--redraw {
  color: var(--color-primary);
}

.draw-card__link--restore {
  color: var(--color-danger-light);
}

.draw-card__or {
  font-size: 1rem;
  color: var(--color-text-muted);
}

.draw-card__circle-info {
  font-size: 1rem;
  color: var(--color-text-muted);
}

.games-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.games-toolbar__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.5rem 0.9rem;
  transition: all 0.15s;
  white-space: nowrap;
}

.games-toolbar__toggle:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.games-toolbar__arrow {
  transition: transform 0.2s ease;
}

.games-toolbar__arrow--up {
  transform: rotate(180deg);
}

.poules-group {
  margin-bottom: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1rem;
}

.games-list > :deep(.game-row-wrapper:nth-child(odd) .game-row) {
  background: rgb(108 92 231 / 6%);
}

.poules-group :deep(.game-row) {
  background: transparent;
}

.poules-group :deep(.game-row-wrapper:nth-child(odd) .game-row) {
  background: rgb(108 92 231 / 6%);
}

.poules-group__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.finish-round-section {
  margin-top: 1rem;
  text-align: center;
}

.finish-round-btn {
  width: 100%;
  max-width: 400px;
  padding: 14px;
  background: var(--tir-touche, #ff9800);
  color: var(--color-btn-text, #fff);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.finish-round-btn:hover {
  opacity: 0.85;
}

.finish-round-hint {
  font-size: 13px;
  color: var(--color-text-muted);
}

.restore-round-link {
  display: block;
  margin-top: 12px;
  font-size: 13px;
  color: var(--color-text-muted);
  text-decoration: underline;
}

.finish-match-preview {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-radius: 8px;
  padding: 4px;
  margin: 0.25rem 0;
}

.finish-match-preview__row {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: var(--color-bg, #fff);
}

.finish-match-preview__row--winner {
  background: var(--color-success-bg, #dcfce7);
  font-weight: 700;
}

.finish-match-preview__name {
  flex: 1;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--color-text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.finish-match-preview__score {
  font-size: 1.5rem;
  font-weight: 700;
  min-width: 1.5rem;
  text-align: center;
  color: var(--color-text);
  margin-left: 0.75rem;
}

.finish-match-preview__row--winner .finish-match-preview__score {
  color: var(--color-success, #16a34a);
}
</style>
