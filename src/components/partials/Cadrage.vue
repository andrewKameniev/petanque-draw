<script>
import Game from '@/components/partials/Game.vue';
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { getTeamsRanking, isScoreError, updateScoreHistory } from '@/helpers';
import RoundTimerControls from '@/components/ui/RoundTimerControls.vue';

export default {
  name: 'Cadrage',
  props: ['activeTournament', 'isPublicView'],
  emits: ['startPlayOff', 'finish'],
  components: { Game, RoundTimerControls },
  data() {
    return {
      scoreError: false,
    };
  },
  computed: {
    ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament']),
    tournament() {
      return this.activeTournament || this.currentTournament;
    },
    rankingTeams() {
      return getTeamsRanking(this.tournament);
    },
    showTimerSection() {
      if (this.isPublicView) return false;
      if (!this.tournament.preferences?.timeLimitEnabled) return false;
      return true;
    },
  },
  methods: {
    ...mapActions(useMainStore, [
      'saveCadrageScores',
      'syncCadrageMatch',
      'syncCadrageFull',
      'startRoundTimer',
      'endRoundTimer',
      'clearRoundTimer',
      'restartRoundTimer',
      'pauseRoundTimer',
      'resumeRoundTimer',
    ]),
    onTimerEnded() {
      this.endRoundTimer();
    },
    onTimerRestart(minutes) {
      this.restartRoundTimer(minutes);
    },
    onGameUpdate(gameIndex) {
      const game = this.tournament.cadrage[gameIndex];
      updateScoreHistory(game);
      this.syncCadrageMatch(gameIndex, game);
    },
    swapCadrageLane({ fromIndex, targetLane }) {
      const fieldsStart = this.tournament.preferences.fieldsStart;
      const targetIndex = targetLane - fieldsStart;
      const cadrage = this.tournament.cadrage;
      if (targetIndex < 0 || targetIndex >= cadrage.length || targetIndex === fromIndex) return;
      const temp = cadrage[fromIndex];
      cadrage[fromIndex] = cadrage[targetIndex];
      cadrage[targetIndex] = temp;
      this.syncCadrageFull();
    },
    saveResults() {
      this.scoreError = false;
      const unfinished = this.tournament.cadrage.filter((game) => game.status !== 'finished');
      if (unfinished.some((game) => isScoreError(game, this.tournament.preferences.maxScore))) {
        this.scoreError = true;
        return;
      }
      this.tournament.cadrage.forEach((game) => {
        if (game.status === 'finished') return;
        game.team_1_score = Number(game.team_1_score);
        game.team_2_score = Number(game.team_2_score);
        game.status = 'finished';
        game.winner = game.team_1_score > game.team_2_score ? game.team_1 : game.team_2;
      });
      let teamsToPlayOff = this.rankingTeams.slice(0, this.tournament.preferences.playOffTeams / 2);
      this.tournament.cadrage.forEach((game) => {
        if (game.team_1_score > game.team_2_score) {
          teamsToPlayOff.push(this.rankingTeams.find((team) => team.title === game.team_1));
        } else if (game.team_2_score > game.team_1_score) {
          teamsToPlayOff.push(this.rankingTeams.find((team) => team.title === game.team_2));
        }
      });
      teamsToPlayOff = teamsToPlayOff.sort(
        (a, b) => (a.team_1_place || a.team_2_place) - (b.team_1_place || b.team_2_place),
      );
      this.clearRoundTimer();
      this.saveCadrageScores();
      this.$emit('startPlayOff', teamsToPlayOff);
    },
  },
};
</script>

<template>
  <div>
    <h2 class="text-center" data-testid="cadrage-heading">{{ $t('games.cadrage') }}</h2>
    <RoundTimerControls
      :enabled="showTimerSection"
      :timer="tournament.roundTimer"
      :cochonettes-enabled="!!tournament.preferences.cochonettesEnabled"
      :cochonettes="tournament.preferences.cochonettes || 1"
      @start="startRoundTimer"
      @timer-ended="onTimerEnded"
      @restart="onTimerRestart"
      @pause="pauseRoundTimer"
      @resume="resumeRoundTimer"
      @reset="clearRoundTimer"
    />
    <Game
      v-for="(game, ind) in tournament.cadrage"
      :key="ind"
      :active-tournament="tournament"
      :compact-view="isPublicView"
      :game="game"
      :game-index="ind"
      :fields-start="tournament.preferences.fieldsStart"
      :is-cadrage="true"
      @save="saveResults"
      @update="onGameUpdate"
      @finish="$emit('finish', $event)"
      @swapLane="swapCadrageLane"
    />
    <div v-if="scoreError" class="has-text-centered has-text-danger mb-5 mt-5">{{ $t('games.resultsError') }}</div>
    <div class="text-center mt-5" v-if="!isPublicView">
      <button class="button is-success" data-testid="btn-save-cadrage" @click="saveResults">
        {{ $t('games.saveResults') }}
      </button>
    </div>
  </div>
</template>
