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
          <RoundTimer
            v-if="isPublicView && showTimerSection && hasVisibleTimer"
            :timer-started-at="tournament.roundTimer.timerStartedAt"
            :timer-ends-at="tournament.roundTimer.timerEndsAt"
            :timer-status="tournament.roundTimer.timerStatus"
            :remaining-ms="tournament.roundTimer.remainingMs || 0"
            :cochonettes-enabled="!!tournament.preferences.cochonettesEnabledPlayoff"
            :cochonettes="tournament.preferences.cochonettes || 1"
            :read-only="true"
            class="mb-3"
          />
          <div v-else-if="!isPublicView && showTimerSection" class="round-timer-section">
            <RoundTimer
              v-if="hasVisibleTimer"
              :timer-started-at="tournament.roundTimer.timerStartedAt"
              :timer-ends-at="tournament.roundTimer.timerEndsAt"
              :timer-status="tournament.roundTimer.timerStatus"
              :remaining-ms="tournament.roundTimer.remainingMs || 0"
              :cochonettes-enabled="!!tournament.preferences.cochonettesEnabledPlayoff"
              :cochonettes="tournament.preferences.cochonettes || 1"
              @timer-ended="onTimerEnded"
              @restart="onTimerRestart"
              @pause="pauseRoundTimer"
              @resume="resumeRoundTimer"
              @reset="clearRoundTimer"
            />
            <button v-else class="start-timer-btn" @click="startRoundTimer">
              <Timer :size="16" />
              {{ $t('timer.startTimer') }}
            </button>
          </div>
          <PlayoffMatchPanel
            :tournament="tournament"
            :stages="singlePanelStages"
            :title="isPublicView ? $t('games.playOff') : $t('doubleElimination.playNow')"
            :score-error="scoreError"
            :show-save="!isPublicView && isOwnerOrAdmin"
            :public-view="!!isPublicView"
            :highlighted-team="highlightedTeam || ''"
            :team-club-map="teamClubMap"
            @save="saveResults"
            @swap-lane="onPanelSwapLane"
            @finish="onPanelFinish"
            @update="onPanelUpdate"
          >
            <template #actions>
              <div class="playoff-search-wrapper">
                <button
                  class="playoff-search-btn"
                  :class="{ 'playoff-search-btn--active': highlightedTeam }"
                  :aria-pressed="!!highlightedTeam"
                  @click="showSearch = !showSearch"
                >
                  <Search :size="14" />
                  <UserRound :size="14" />
                </button>
                <div v-if="showSearch" class="playoff-search-popover">
                  <input
                    ref="searchInput"
                    v-model="searchQuery"
                    class="playoff-search-input"
                    :placeholder="$t('teams.searchTeam')"
                    @keydown.escape="showSearch = false"
                    @keydown.enter="applySearch"
                  />
                  <ul v-if="filteredClubs.length" class="playoff-search-list playoff-search-clubs">
                    <li
                      v-for="club in filteredClubs"
                      :key="'club-' + club"
                      class="playoff-search-item playoff-search-item--club"
                      :class="{ 'playoff-search-item--active': highlightedTeam === club }"
                      @click="selectTeam(club)"
                    >
                      <Building2 class="playoff-search-item__icon" :size="14" />
                      {{ club }}
                    </li>
                  </ul>
                  <ul class="playoff-search-list">
                    <li
                      v-for="team in filteredTeams"
                      :key="team"
                      class="playoff-search-item"
                      :class="{ 'playoff-search-item--active': isTeamHighlighted(team) }"
                      @click="selectTeam(team)"
                    >
                      {{ team }}
                    </li>
                    <li v-if="!filteredTeams.length && !filteredClubs.length" class="playoff-search-empty">
                      {{ $t('teams.noResults') }}
                    </li>
                  </ul>
                </div>
              </div>
            </template>
          </PlayoffMatchPanel>
        </template>
      </div>
      <Bracket v-if="showBracket" :bracket="playOffBracket" @close-modal="showBracket = false" />
    </template>
  </div>
</template>
<script>
import Bracket from './Bracket';
import DoubleElimination from './DoubleElimination.vue';
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { isScoreError, shuffleArray, updateScoreHistory } from '@/helpers';
import { assignPlayoffLanes } from '@/services/results';
import { Search, UserRound, Building2, Timer } from 'lucide-vue-next';
import RoundTimer from '@/components/partials/RoundTimer.vue';
import FinishedBanner from '@/components/partials/FinishedBanner.vue';
import PlayoffHeader from '@/components/partials/PlayoffHeader.vue';
import PlayoffMatchPanel from '@/components/partials/PlayoffMatchPanel.vue';

export default {
  name: 'PlayOff',
  props: ['activeTournament', 'isPublicView', 'hideHeader', 'matchesOnly'],
  emits: ['openResults'],
  components: {
    DoubleElimination,
    Bracket,
    Search,
    UserRound,
    Building2,
    Timer,
    FinishedBanner,
    RoundTimer,
    PlayoffHeader,
    PlayoffMatchPanel,
  },
  data() {
    return {
      scoreError: false,
      showBracket: false,
      showSearch: false,
      searchQuery: '',
      highlightedTeam: null,
    };
  },
  watch: {
    showSearch(val) {
      if (val) {
        this.$nextTick(() => this.$refs.searchInput?.focus());
        document.addEventListener('click', this._onClickOutside);
      } else {
        document.removeEventListener('click', this._onClickOutside);
      }
    },
  },
  beforeUnmount() {
    document.removeEventListener('click', this._onClickOutside);
  },
  created() {
    this._onClickOutside = (e) => {
      const wrapper = this.$el?.querySelector('.playoff-search-wrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        this.showSearch = false;
      }
    };
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
    allClubs() {
      const clubs = new Set();
      Object.values(this.teamClubMap).forEach((c) => {
        if (c) clubs.add(c);
      });
      return [...clubs].sort();
    },
    filteredClubs() {
      if (!this.searchQuery.trim()) return this.allClubs;
      const q = this.searchQuery.toLowerCase();
      return this.allClubs.filter((c) => c.toLowerCase().includes(q));
    },
    filteredTeams() {
      if (!this.searchQuery.trim()) return this.allParticipants;
      const q = this.searchQuery.toLowerCase();
      return this.allParticipants.filter(
        (t) => t.toLowerCase().includes(q) || (this.teamClubMap[t] && this.teamClubMap[t].toLowerCase().includes(q)),
      );
    },
    showTimerSection() {
      if (!this.tournament.preferences?.timeLimitEnabled) return false;
      if (this.playOffStageCurrent === 1 && this.tournament.preferences.noTimeLimitFinale) return false;
      return true;
    },
    hasVisibleTimer() {
      return ['running', 'ended', 'paused'].includes(this.tournament.roundTimer?.timerStatus);
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
              laneNumber: 1,
              isThird: true,
            },
          ],
        });
      }
      return stages;
    },
  },
  methods: {
    shuffleArray,
    selectTeam(team) {
      this.highlightedTeam = this.highlightedTeam === team ? null : team;
      this.showSearch = false;
      this.searchQuery = '';
    },
    applySearch() {
      if (this.searchQuery.trim()) {
        this.highlightedTeam = this.searchQuery.trim();
        this.showSearch = false;
      }
    },
    teamMatchesQuery(team, q) {
      if (!team) return false;
      return (
        team.toLowerCase().includes(q) || (this.teamClubMap[team] && this.teamClubMap[team].toLowerCase().includes(q))
      );
    },
    isTeamHighlighted(team) {
      if (!this.highlightedTeam) return false;
      return this.teamMatchesQuery(team, this.highlightedTeam.toLowerCase());
    },
    isGameHighlighted(game) {
      if (!this.highlightedTeam) return false;
      const q = this.highlightedTeam.toLowerCase();
      return this.teamMatchesQuery(game.team_1, q) || this.teamMatchesQuery(game.team_2, q);
    },
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
      assignPlayoffLanes(brackets.stages);

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
.playoff-search-wrapper {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
}

.playoff-search-btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  width: 40px;
  height: 24px;
  justify-content: center;
  border: none;
  border-radius: 12px;
  background: var(--color-text-muted, #9ca3af);
  color: white;
  cursor: pointer;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
  appearance: none;
}

.playoff-search-btn svg {
  flex: 0 0 14px;
  width: 14px;
  height: 14px;
}

.playoff-search-btn:hover {
  background: var(--color-text-muted, #6b7280);
}

.playoff-search-btn:focus,
.playoff-search-btn:focus-visible,
.playoff-search-btn:active {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
  background: var(--color-text-muted, #6b7280);
}

.playoff-search-btn--active {
  background: var(--color-primary);
}

.playoff-search-popover {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  width: 260px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
  z-index: 100;
  padding: 0.5rem;
}

.playoff-search-input {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  background: var(--color-surface, #fff);
  color: var(--color-text, #1a1a1a);
}

.playoff-search-input:focus {
  border-color: var(--color-primary);
}

.playoff-search-list {
  list-style: none;
  margin: 0.4rem 0 0;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
}

.playoff-search-item {
  padding: 0.35rem 0.6rem;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.1s;
}

.playoff-search-item:hover {
  background: var(--color-surface-hover, #f3f4f6);
}

.playoff-search-item--active {
  background: var(--color-primary);
  color: white;
}

.playoff-search-clubs {
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  padding-bottom: 0.4rem;
  margin-bottom: 0.2rem;
}

.playoff-search-item--club {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 500;
}

.playoff-search-item__icon {
  flex: 0 0 14px;
  width: 14px;
  height: 14px;
}

.playoff-search-empty {
  padding: 0.5rem 0.6rem;
  font-size: 1rem;
  color: var(--color-text-muted, #9ca3af);
}

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

@media screen and (max-width: 768px) {
  .play-off-stage-wrapper {
    display: contents;
    padding-right: 0;
    padding-left: 0;
  }
}
</style>
