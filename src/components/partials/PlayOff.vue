<template>
  <div
    v-if="tournament"
    :class="{
      container: !isPublicView || playOffStageCurrent !== 0,
      content: activeTournament && (!isPublicView || playOffStageCurrent !== 0),
    }"
    style="padding-top: 0; margin-top: 0"
  >
    <DoubleElimination
      v-if="playOffBracket?.format === 'double'"
      :active-tournament="tournament"
      :is-public-view="!!isPublicView"
      :hide-header="!!hideHeader"
      :matches-only="!!matchesOnly"
    />
    <template v-else>
      <PlayoffHeader
        v-if="!hideHeader && playOffStageCurrent !== 0"
        :title="$t('games.playOff')"
        :badge="singleParticipantCount + ' ' + $t('common.teamsLabel')"
        :show-bracket-button="!isPublicView"
        @show-bracket="showBracket = true"
      />
      <div v-if="playOffBracket" class="column play-off-stage-wrapper" data-testid="playoff-wrapper">
        <FinishedBanner v-if="playOffStageCurrent === 0 && !isPublicView" @openResults="$emit('openResults')" />
        <template
          v-else-if="
            playOffStageCurrent &&
            playOffStageCurrent !== 0 &&
            currentPlayOffBracketIndex >= 0 &&
            playOffBracket.stages?.[currentPlayOffBracketIndex]
          "
        >
          <RoundTimerControls
            :enabled="showTimerSection"
            :timer="tournament.roundTimer"
            :cochonettes-enabled="!!tournament.preferences.cochonettesEnabledPlayoff"
            :cochonettes="tournament.preferences.cochonettes ?? 1"
            :read-only="!!isPublicView"
            @start="startRoundTimer"
            @timer-ended="onTimerEnded"
            @restart="onTimerRestart"
            @pause="pauseRoundTimer"
            @resume="resumeRoundTimer"
            @reset="clearRoundTimer"
          />
          <PlayoffMatchPanel
            :tournament="tournament"
            :stages="singlePanelStages"
            :title="isPublicView ? $t('games.playOff') : $t('doubleElimination.playNow')"
            :score-error="scoreError && clubRoundReady"
            :show-save="!isPublicView && isOwnerOrAdmin && clubRoundReady"
            :save-label="
              tournament.preferences?.clubRosterSize
                ? $t(playOffStageCurrent === 1 ? 'club.finishPlayoff' : 'club.advancePlayoff')
                : ''
            "
            :public-view="!!isPublicView"
            :highlighted-team="highlightedTeam || ''"
            :team-club-map="teamClubMap"
            @save="saveResults"
            @swap-lane="onPanelSwapLane"
            @finish="onPanelFinish"
            @update="onPanelUpdate"
          >
            <template #actions>
              <div v-if="showCourtFinder || (!isPublicView && isOwnerOrAdmin)" class="playoff-panel-actions">
                <button
                  v-if="!isPublicView && isOwnerOrAdmin"
                  type="button"
                  class="playoff-shuffle-btn"
                  data-testid="btn-shuffle-lanes"
                  :disabled="currentRoundHasStarted"
                  :aria-label="$t('games.shuffleLanes')"
                  :title="$t('games.shuffleLanes')"
                  @click="shuffleCurrentLanes"
                >
                  <Shuffle :size="15" />
                  <span>{{ $t('games.shuffleLanes') }}</span>
                </button>
                <TeamSearch
                  v-if="showCourtFinder"
                  v-model="highlightedTeam"
                  :teams="allParticipants"
                  :tournament-teams="tournament.teams || []"
                  :team-club-map="teamClubMap"
                />
              </div>
            </template>
          </PlayoffMatchPanel>
          <p
            v-if="!isPublicView && tournament.preferences?.clubRosterSize && !clubRoundReady"
            class="club-playoff-hint"
          >
            {{ $t('club.completeEncountersFirst') }}
          </p>
        </template>
      </div>
      <Bracket v-if="showBracket" :bracket="playOffBracket" @close-modal="showBracket = false" />
    </template>
  </div>
</template>
<script>
import { defineAsyncComponent } from 'vue';
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { isScoreError, shuffleArray, updateScoreHistory } from '@/helpers';
import { assignPlayoffLanes, getShuffledPlayoffLaneOffsets } from '@/services/results';
import { Shuffle } from 'lucide-vue-next';
import RoundTimerControls from '@/components/ui/RoundTimerControls.vue';
import FinishedBanner from '@/components/partials/FinishedBanner.vue';
import PlayoffHeader from '@/components/partials/PlayoffHeader.vue';
import PlayoffMatchPanel from '@/components/partials/PlayoffMatchPanel.vue';
import TeamSearch from '@/components/partials/TeamSearch.vue';

const Bracket = defineAsyncComponent(() => import('./Bracket.vue'));
const DoubleElimination = defineAsyncComponent(() => import('./DoubleElimination.vue'));

export default {
  name: 'PlayOff',
  props: ['activeTournament', 'isPublicView', 'hideHeader', 'matchesOnly'],
  emits: ['openResults'],
  components: {
    DoubleElimination,
    Bracket,
    Shuffle,
    FinishedBanner,
    RoundTimerControls,
    PlayoffHeader,
    PlayoffMatchPanel,
    TeamSearch,
  },
  data() {
    return {
      scoreError: false,
      showBracket: false,
      highlightedTeam: null,
    };
  },
  watch: {
    clubRoundReady() {
      this.scoreError = false;
    },
    showCourtFinder(visible) {
      if (!visible) this.highlightedTeam = null;
    },
  },
  mounted() {
    if (!this.isPublicView && !this.tournament.playOffBracket && this.tournament.playOff?.length) {
      this.getPlayOffBracket();
    }
  },
  computed: {
    ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament', 'isOwnerOrAdmin']),
    tournament() {
      return this.activeTournament || this.currentTournament;
    },
    playOffStageCurrent() {
      if (this.tournament.playOffStage != null) return this.tournament.playOffStage;
      return this.tournament.playOff?.[0]?.stage ?? null;
    },
    showCourtFinder() {
      return this.playOffStageCurrent === 'cadrage' || this.playOffStageCurrent > 2;
    },
    playOffBracket() {
      return this.tournament.playOffBracket ? this.tournament.playOffBracket : null;
    },
    stagesCount() {
      return Math.round(Math.log(this.tournament.playOff.length * 2) / Math.log(2));
    },
    currentPlayOffBracketIndex() {
      if (this.tournament.playOffBracket?.stages) {
        return this.tournament.playOffBracket.stages.findIndex((item) => item.stageLabel === this.playOffStageCurrent);
      } else {
        return 0;
      }
    },
    currentStageLaneOrder() {
      const stage = this.playOffBracket?.stages?.[this.currentPlayOffBracketIndex];
      if (stage?.laneOrder) {
        return stage.laneOrder;
      }
      return Array.from({ length: stage?.teams?.length || 0 }, (_, k) => k);
    },
    teamClubMap() {
      const map = {};
      this.tournament.teams?.forEach((t) => {
        const club = t.players?.[0]?.club;
        if (club) map[t.title] = club;
      });
      return map;
    },
    allParticipants() {
      const teams = new Set();
      this.playOffBracket?.stages?.forEach((stage) => {
        stage.teams?.forEach((game) => {
          if (game.team_1) teams.add(game.team_1);
          if (game.team_2) teams.add(game.team_2);
        });
      });
      return [...teams].sort();
    },
    showTimerSection() {
      if (!this.tournament.preferences?.timeLimitEnabled) return false;
      if (this.playOffStageCurrent === 1 && this.tournament.preferences.noTimeLimitFinale) return false;
      return true;
    },
    singleParticipantCount() {
      const firstStage = this.playOffBracket?.stages?.[0];
      return firstStage?.teamsCount || firstStage?.teams?.length * 2 || this.tournament.playOff?.length * 2 || 0;
    },
    currentStageTitle() {
      return this.playOffStageCurrent === 1
        ? this.$t('games.final')
        : `1/${this.playOffStageCurrent} ${this.$t('games.ofFinal')}`;
    },
    singlePanelStages() {
      const stage = this.playOffBracket?.stages?.[this.currentPlayOffBracketIndex];
      if (!stage) return [];
      const stages = [
        {
          id: `single-${this.currentPlayOffBracketIndex}`,
          label: this.currentStageTitle,
          stageIndex: this.currentPlayOffBracketIndex,
          matches: stage.teams.map((game, gameIndex) => ({
            game,
            gameIndex,
            laneNumber: this.currentStageLaneOrder[gameIndex] ?? gameIndex,
          })),
        },
      ];
      if (
        this.playOffStageCurrent === 1 &&
        this.tournament.playOff.length > 1 &&
        this.playOffBracket.thirdPlace &&
        (this.playOffBracket.thirdPlace.team_1 || this.playOffBracket.thirdPlace.team_2)
      ) {
        stages.push({
          id: 'single-third-place',
          label: this.$t('games.thirdPlace'),
          stageIndex: this.currentPlayOffBracketIndex,
          matches: [
            {
              game: this.playOffBracket.thirdPlace,
              gameIndex: 1,
              laneNumber: this.playOffBracket.thirdPlaceLane ?? 1,
              isThird: true,
            },
          ],
        });
      }
      return stages;
    },
    currentRoundHasStarted() {
      return this.singlePanelStages.some((stage) =>
        stage.matches.some(
          ({ game }) =>
            game.status === 'finished' ||
            game.status === 'in_progress' ||
            game.team_1_score != null ||
            game.team_2_score != null,
        ),
      );
    },
    clubRoundReady() {
      if (!this.tournament.preferences?.clubRosterSize) return true;
      const stage = this.playOffBracket?.stages?.[this.currentPlayOffBracketIndex];
      if (!stage) return false;
      const matches = (stage.teams || []).filter((game) => !game.isBye);
      const third = this.playOffBracket.thirdPlace;
      if (stage.teamsCount === 2 && third?.team_1 && third?.team_2) matches.push(third);
      return (
        matches.length > 0 &&
        matches.every(
          (game) =>
            (game.clubEncounter || game.clubAbsence) &&
            game.status === 'finished' &&
            !isScoreError(game, this.tournament.preferences.maxScore),
        )
      );
    },
  },
  methods: {
    shuffleArray,
    onThirdPlaceUpdate() {
      const game = this.playOffBracket.thirdPlace;
      if (game) {
        updateScoreHistory(game);
        this.syncBracketMatch('thirdPlace', game);
      }
    },
    onThirdPlaceFinish() {
      const game = this.playOffBracket.thirdPlace;
      if (game) {
        game.status = 'finished';
        game.winner = Number(game.team_1_score) > Number(game.team_2_score) ? game.team_1 : game.team_2;
        this.syncBracketMatch('thirdPlace', game);
      }
    },
    onPlayoffGameUpdate(gameIndex) {
      const game = this.playOffBracket.stages[this.currentPlayOffBracketIndex].teams[gameIndex];
      if (game) {
        updateScoreHistory(game);
        this.syncBracketMatch(`stages/${this.currentPlayOffBracketIndex}/teams/${gameIndex}`, game);
      }
    },
    onGameFinish(gameIndex) {
      const game = this.playOffBracket.stages[this.currentPlayOffBracketIndex].teams[gameIndex];
      if (game) {
        game.status = 'finished';
        game.winner = Number(game.team_1_score) > Number(game.team_2_score) ? game.team_1 : game.team_2;
        this.syncBracketMatch(`stages/${this.currentPlayOffBracketIndex}/teams/${gameIndex}`, game);
      }
    },
    onPanelUpdate({ entry, gameIndex }) {
      if (entry.isThird) this.onThirdPlaceUpdate();
      else this.onPlayoffGameUpdate(gameIndex);
    },
    onPanelFinish({ entry, gameIndex }) {
      if (entry.isThird) this.onThirdPlaceFinish();
      else this.onGameFinish(gameIndex);
    },
    onPanelSwapLane({ entry, payload }) {
      if (!entry.isThird) this.swapPlayoffLane(payload);
    },
    ...mapActions(useMainStore, [
      'finishTournament',
      'setPlayOffBracket',
      'setPlayOffStage',
      'syncBracketMatch',
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
    shuffleCurrentLanes() {
      if (this.currentRoundHasStarted) return;
      const bracket = JSON.parse(JSON.stringify(this.playOffBracket));
      const stage = bracket.stages[this.currentPlayOffBracketIndex];
      if (!stage) return;

      const hasThirdPlace = this.singlePanelStages.some((panelStage) =>
        panelStage.matches.some((entry) => entry.isThird),
      );
      if (hasThirdPlace) {
        const gameCount = stage.teams.filter((game) => !game.isBye).length;
        const lanes = getShuffledPlayoffLaneOffsets(this.tournament, gameCount + 1);
        let laneIndex = 0;
        stage.laneOrder = stage.teams.map((game) => (game.isBye ? null : lanes[laneIndex++]));
        bracket.thirdPlaceLane = lanes[laneIndex];
      } else {
        assignPlayoffLanes([stage], this.tournament);
      }
      this.setPlayOffBracket(bracket);
    },
    swapPlayoffLane({ fromIndex, targetLane }) {
      const fieldsStart = this.tournament.preferences.fieldsStart;
      const laneOrder = [...this.currentStageLaneOrder];
      const fromLane = laneOrder[fromIndex];
      const targetLaneInternal = targetLane - fieldsStart;
      const targetIndex = laneOrder.indexOf(targetLaneInternal);
      if (targetIndex === -1 || targetIndex === fromIndex) return;
      laneOrder[fromIndex] = laneOrder[targetIndex];
      laneOrder[targetIndex] = fromLane;
      const bracket = JSON.parse(JSON.stringify(this.playOffBracket));
      bracket.stages[this.currentPlayOffBracketIndex].laneOrder = laneOrder;
      this.setPlayOffBracket(bracket);
    },
    saveResults() {
      this.scoreError = false;
      const realGames = this.playOffBracket.stages[this.currentPlayOffBracketIndex].teams.filter((game) => !game.isBye);
      if (this.tournament.preferences.clubRosterSize && !this.clubRoundReady) {
        this.scoreError = true;
        return false;
      }
      const unfinished = realGames.filter((game) => game.status !== 'finished');
      if (unfinished.some((game) => isScoreError(game, this.tournament.preferences.maxScore))) {
        this.scoreError = true;
        return false;
      }
      realGames.forEach((game) => {
        game.team_1_score = Number(game.team_1_score);
        game.team_2_score = Number(game.team_2_score);
        if (game.status === 'finished') return;
        game.status = 'finished';
        if (!game.winner) {
          game.winner = game.team_1_score > game.team_2_score ? game.team_1 : game.team_2;
        }
      });
      this.clearRoundTimer();
      if (this.playOffBracket.stages[this.currentPlayOffBracketIndex].teamsCount === 2) {
        //final
        this.setPlayOffBracket(JSON.parse(JSON.stringify(this.playOffBracket)));
        this.setPlayOffStage(0);
        this.finishTournament();
      } else {
        let bracket = JSON.parse(JSON.stringify(this.playOffBracket));
        bracket.stages[this.currentPlayOffBracketIndex].teams.forEach((game, index) => {
          if (game.isBye) return;
          if (index % 2 === 0) {
            bracket.stages[this.currentPlayOffBracketIndex + 1].teams[index / 2].team_1 =
              game.team_1_score > game.team_2_score ? game.team_1 : game.team_2;
            if (bracket.stages[this.currentPlayOffBracketIndex].teamsCount === 4) {
              //third place
              if (!bracket.thirdPlace) {
                bracket.thirdPlace = {};
              }
              bracket.thirdPlace.team_1 = game.team_1_score < game.team_2_score ? game.team_1 : game.team_2;
            }
          } else {
            bracket.stages[this.currentPlayOffBracketIndex + 1].teams[(index - 1) / 2].team_2 =
              game.team_1_score > game.team_2_score ? game.team_1 : game.team_2;
            if (bracket.stages[this.currentPlayOffBracketIndex].teamsCount === 4) {
              //third place
              if (!bracket.thirdPlace) {
                bracket.thirdPlace = {};
              }
              bracket.thirdPlace.team_2 = game.team_1_score < game.team_2_score ? game.team_1 : game.team_2;
            }
          }
        });
        const nextStage = bracket.stages[this.currentPlayOffBracketIndex + 1];
        if (bracket.stages[this.currentPlayOffBracketIndex].teamsCount === 4) {
          const gameCount = nextStage.teams.filter((game) => !game.isBye).length;
          const lanes = getShuffledPlayoffLaneOffsets(this.tournament, gameCount + 1);
          let laneIndex = 0;
          nextStage.laneOrder = nextStage.teams.map((game) => (game.isBye ? null : lanes[laneIndex++]));
          bracket.thirdPlaceLane = lanes[laneIndex];
        } else {
          assignPlayoffLanes([nextStage], this.tournament);
        }
        this.setPlayOffBracket(bracket);
        this.setPlayOffStage(this.playOffStageCurrent / 2);
      }
    },
    getPlayOffBracket() {
      let brackets = {
        stages: [],
        thirdPlace: {},
      };
      for (let i = this.stagesCount; i > 0; i--) {
        const teamsCount = Math.pow(2, i);
        const stageLabel = teamsCount / 2;
        let teams = [];
        if (i === this.stagesCount) {
          teams = this.tournament.playOff;
        } else {
          for (let j = 1; j <= stageLabel; j++) {
            const game = {
              id: i + 1,
              stage: stageLabel,
              team_1: null,
              team_1_score: null,
              team_2: null,
              team_2_score: null,
            };

            teams.push(game);
          }
        }
        const stage = {
          teamsCount: teamsCount,
          stageLabel: stageLabel,
          teams: teams,
        };
        brackets.stages.push(stage);
      }

      // Auto-advance bye games: move real team to next stage
      if (brackets.stages.length > 1) {
        const firstStage = brackets.stages[0];
        firstStage.teams.forEach((game, index) => {
          if (game.isBye) {
            const realTeam = game.team_1 || game.team_2;
            const nextStageIndex = 1;
            const nextGameIndex = Math.floor(index / 2);
            const nextGame = brackets.stages[nextStageIndex].teams[nextGameIndex];
            if (nextGame) {
              if (index % 2 === 0) {
                nextGame.team_1 = realTeam;
              } else {
                nextGame.team_2 = realTeam;
              }
            }
          }
        });
      }

      // Assign sequential lane numbers skipping bye games
      assignPlayoffLanes(brackets.stages, this.tournament);

      if (this.tournament.cadrage) {
        const seeding = this.getTournamentSeeding(this.tournament.cadrage.length);
        const sortedCadrage = this.tournament.cadrage.sort((a, b) => a.team_2_place - b.team_2_place);
        let cadrageArray = [];
        seeding.forEach((seed) => {
          const game = sortedCadrage[seed - 1];
          if (game) {
            cadrageArray.push(game);
          }
        });
        const cadrageStage = {
          teamsCount: this.tournament.cadrage.length * 2,
          stageLabel: 'cadrage',
          teams: cadrageArray,
        };
        brackets.stages.unshift(cadrageStage);
      }
      this.setPlayOffBracket(brackets);
    },
    getTournamentSeeding(n) {
      let seeding = [1];
      while (seeding.length < n) {
        let nextSeeding = [];
        let currentTotal = seeding.length * 2;
        for (let i = 0; i < seeding.length; i++) {
          const team = seeding[i];
          const partner = currentTotal + 1 - team;
          if (i % 2 === 0) {
            nextSeeding.push(team, partner);
          } else {
            nextSeeding.push(partner, team);
          }
        }
        seeding = nextSeeding;
      }
      return seeding;
    },
  },
};
</script>

<style scoped>
.club-playoff-hint {
  margin: 0.75rem 0;
  color: var(--color-text-muted);
  text-align: center;
}

.playoff-panel-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
  max-width: 100%;
  margin-inline-start: auto;
}

.playoff-shuffle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 28px;
  padding: 0.25rem 0.55rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.playoff-shuffle-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.playoff-shuffle-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media screen and (max-width: 768px) {
  .playoff-shuffle-btn span {
    display: none;
  }

  .play-off-stage-wrapper {
    display: contents;
    padding-right: 0;
    padding-left: 0;
  }
}
</style>
