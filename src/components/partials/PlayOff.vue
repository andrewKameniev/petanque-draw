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
      <div
        class="is-flex is-justify-content-space-between is-align-items-center mb-2"
        v-if="!hideHeader && (!isPublicView || playOffStageCurrent !== 0)"
      >
        <h2 v-if="playOffStageCurrent !== 0" style="margin: 0">{{ $t('games.playOff') }}</h2>
        <button
          v-if="!isPublicView && playOffStageCurrent !== 0"
          class="button btn-purple-outline"
          @click="showBracket = true"
        >
          <GitFork :size="16" style="transform: rotate(90deg); margin-right: 0.3rem" />
          {{ $t('games.showBracket') }}
        </button>
      </div>
      <div class="column play-off-stage-wrapper" data-testid="playoff-wrapper" v-if="playOffBracket">
        <FinishedBanner v-if="playOffStageCurrent === 0 && !isPublicView" @openResults="$emit('openResults')" />
        <template
          v-else-if="
            playOffStageCurrent &&
            playOffStageCurrent !== 0 &&
            currentPlayOffBracketIndex >= 0 &&
            playOffBracket.stages?.[currentPlayOffBracketIndex]
          "
        >
          <div class="playoff-stage-header">
            <h2 class="text-center playoff-stage-title" data-testid="playoff-stage-heading">
              {{
                playOffStageCurrent === 1 ? $t('games.final') : '1/' + playOffStageCurrent + ' ' + $t('games.ofFinal')
              }}
            </h2>
            <div class="playoff-search-wrapper">
              <button
                class="playoff-search-btn"
                @click="showSearch = !showSearch"
                :class="{ 'playoff-search-btn--active': highlightedTeam }"
              >
                <Search :size="16" />
                <UserRound :size="16" />
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
                    <Building2 :size="12" />
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
          </div>
          <template v-if="isPublicView">
            <RoundTimer
              v-if="
                showTimerSection &&
                (tournament.roundTimer?.timerStatus === 'running' ||
                  tournament.roundTimer?.timerStatus === 'ended' ||
                  tournament.roundTimer?.timerStatus === 'paused')
              "
              :timer-started-at="tournament.roundTimer.timerStartedAt"
              :timer-ends-at="tournament.roundTimer.timerEndsAt"
              :timer-status="tournament.roundTimer.timerStatus"
              :remaining-ms="tournament.roundTimer.remainingMs || 0"
              :cochonettes-enabled="!!tournament.preferences.cochonettesEnabledPlayoff"
              :cochonettes="tournament.preferences.cochonettes || 1"
              :read-only="true"
              class="mb-3"
            />
            <div class="match-list">
              <div
                class="match-item"
                v-for="(game, ind) in playOffBracket.stages[currentPlayOffBracketIndex].teams"
                :key="ind"
                v-show="!game.isBye"
                :class="{
                  'match-item--highlighted': isGameHighlighted(game),
                  'match-item--in-progress': !tournament.tournamentIsFinished && game.status === 'in_progress',
                  'match-item--finished': tournament.tournamentIsFinished || game.status === 'finished',
                  'match-item--upcoming':
                    !tournament.tournamentIsFinished && (!game.status || game.status === 'not_started'),
                }"
              >
                <span
                  class="match-lane-left"
                  :class="{
                    'match-lane-left--active': !tournament.tournamentIsFinished && game.status === 'in_progress',
                    'match-lane-left--finished': tournament.tournamentIsFinished || game.status === 'finished',
                  }"
                  >{{ (currentStageLaneOrder[ind] ?? ind) + tournament.preferences.fieldsStart }}</span
                >
                <span
                  class="match-team match-team-right"
                  :class="{
                    'match-team--highlighted': isTeamNameHighlighted(game.team_1),
                    'match-team--winner':
                      (tournament.tournamentIsFinished || game.status === 'finished') &&
                      Number(game.team_1_score) > Number(game.team_2_score),
                  }"
                  >{{ game.team_1 }}</span
                >
                <span class="match-vs">
                  <template
                    v-if="
                      tournament.tournamentIsFinished || game.status === 'in_progress' || game.status === 'finished'
                    "
                  >
                    <span class="match-score">{{ game.team_1_score ?? 0 }} : {{ game.team_2_score ?? 0 }}</span>
                  </template>
                  <template v-else>
                    <span class="match-score match-score--pending">-- : --</span>
                  </template>
                </span>
                <span
                  class="match-team"
                  :class="{
                    'match-team--highlighted': isTeamNameHighlighted(game.team_2),
                    'match-team--winner':
                      (tournament.tournamentIsFinished || game.status === 'finished') &&
                      Number(game.team_2_score) > Number(game.team_1_score),
                  }"
                  >{{ game.team_2 }}</span
                >
                <span v-if="getGameStreams(game, ind).length" class="match-status-badge match-status-badge--live">
                  <span v-if="game.status === 'in_progress'" class="match-live-dot"></span>
                  <span class="match-live-label">{{
                    game.status === 'in_progress' ? $t('games.live') : $t('games.stream')
                  }}</span>
                  <a
                    v-for="(streamUrl, si) in getGameStreams(game, ind)"
                    :key="si"
                    :href="streamUrl"
                    target="_blank"
                    rel="noopener"
                    class="match-live-link"
                    :class="getStreamIconClass(streamUrl)"
                  >
                    <component :is="getStreamIcon(streamUrl)" :size="16" />
                  </a>
                </span>
                <span v-else-if="game.status === 'in_progress'" class="match-status-badge match-status-badge--progress">
                  <span class="match-progress-dot"></span>{{ $t('teamPlayoff.matchInProgress') }}
                </span>
                <span v-else-if="game.status === 'finished'" class="match-status-badge match-status-badge--finished">{{
                  $t('teamPlayoff.matchFinished')
                }}</span>
                <div
                  v-if="
                    tournament.preferences.cochonettesEnabledPlayoff && game.score_history && game.score_history.length
                  "
                  class="score-history"
                >
                  <span v-for="(entry, i) in game.score_history" :key="i" class="score-history__chip">
                    <span class="score-history__num">{{ i + 1 }}</span>
                    <span class="score-history__score">{{ entry.s1 }}-{{ entry.s2 }}</span>
                  </span>
                </div>
              </div>
            </div>
            <div
              v-if="
                playOffStageCurrent === 1 &&
                tournament.playOff.length > 1 &&
                playOffBracket.thirdPlace &&
                (playOffBracket.thirdPlace.team_1 || playOffBracket.thirdPlace.team_2)
              "
            >
              <h3 class="text-center mt-5">{{ $t('games.thirdPlace') }}</h3>
              <div class="match-list">
                <div
                  class="match-item"
                  :class="{
                    'match-item--in-progress':
                      !tournament.tournamentIsFinished && playOffBracket.thirdPlace.status === 'in_progress',
                    'match-item--finished':
                      tournament.tournamentIsFinished || playOffBracket.thirdPlace.status === 'finished',
                    'match-item--upcoming':
                      !tournament.tournamentIsFinished &&
                      (!playOffBracket.thirdPlace.status || playOffBracket.thirdPlace.status === 'not_started'),
                  }"
                >
                  <span
                    class="match-lane-left"
                    :class="{
                      'match-lane-left--active':
                        !tournament.tournamentIsFinished && playOffBracket.thirdPlace.status === 'in_progress',
                      'match-lane-left--finished':
                        tournament.tournamentIsFinished || playOffBracket.thirdPlace.status === 'finished',
                    }"
                    >{{ 1 + tournament.preferences.fieldsStart }}</span
                  >
                  <span
                    class="match-team match-team-right"
                    :class="{
                      'match-team--winner':
                        playOffBracket.thirdPlace.status === 'finished' &&
                        Number(playOffBracket.thirdPlace.team_1_score) > Number(playOffBracket.thirdPlace.team_2_score),
                    }"
                    >{{ playOffBracket.thirdPlace.team_1 }}</span
                  >
                  <span class="match-vs">
                    <template
                      v-if="
                        playOffBracket.thirdPlace.status === 'in_progress' ||
                        playOffBracket.thirdPlace.status === 'finished'
                      "
                    >
                      <span class="match-score"
                        >{{ playOffBracket.thirdPlace.team_1_score ?? 0 }} :
                        {{ playOffBracket.thirdPlace.team_2_score ?? 0 }}</span
                      >
                    </template>
                    <template v-else>
                      <span class="match-score match-score--pending">-- : --</span>
                    </template>
                  </span>
                  <span
                    class="match-team"
                    :class="{
                      'match-team--winner':
                        playOffBracket.thirdPlace.status === 'finished' &&
                        Number(playOffBracket.thirdPlace.team_2_score) > Number(playOffBracket.thirdPlace.team_1_score),
                    }"
                    >{{ playOffBracket.thirdPlace.team_2 }}</span
                  >
                  <span
                    v-if="getGameStreams(playOffBracket.thirdPlace, 1).length"
                    class="match-status-badge match-status-badge--live"
                  >
                    <span v-if="playOffBracket.thirdPlace.status === 'in_progress'" class="match-live-dot"></span>
                    <span class="match-live-label">{{
                      playOffBracket.thirdPlace.status === 'in_progress' ? $t('games.live') : $t('games.stream')
                    }}</span>
                    <a
                      v-for="(streamUrl, si) in getGameStreams(playOffBracket.thirdPlace, 1)"
                      :key="si"
                      :href="streamUrl"
                      target="_blank"
                      rel="noopener"
                      class="match-live-link"
                      :class="getStreamIconClass(streamUrl)"
                    >
                      <component :is="getStreamIcon(streamUrl)" :size="16" />
                    </a>
                  </span>
                  <span
                    v-else-if="playOffBracket.thirdPlace.status === 'in_progress'"
                    class="match-status-badge match-status-badge--progress"
                  >
                    <span class="match-progress-dot"></span>{{ $t('teamPlayoff.matchInProgress') }}
                  </span>
                  <span
                    v-else-if="playOffBracket.thirdPlace.status === 'finished'"
                    class="match-status-badge match-status-badge--finished"
                    >{{ $t('teamPlayoff.matchFinished') }}</span
                  >
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <div v-if="showTimerSection" class="round-timer-section">
              <RoundTimer
                v-if="
                  tournament.roundTimer?.timerStatus === 'running' ||
                  tournament.roundTimer?.timerStatus === 'ended' ||
                  tournament.roundTimer?.timerStatus === 'paused'
                "
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
            <Game
              v-for="(game, ind) in playOffBracket.stages[currentPlayOffBracketIndex].teams"
              :key="ind"
              v-show="!game.isBye"
              :active-tournament="tournament"
              :game="game"
              :game-index="ind"
              :is-playoff="true"
              :lane-number="currentStageLaneOrder[ind]"
              :class="{ 'game--highlighted': isGameHighlighted(game) }"
              :active-round="currentPlayOffBracketIndex"
              :compact-view="false"
              @save="saveResults"
              @swapLane="swapPlayoffLane"
              @finish="onGameFinish"
              @update="onPlayoffGameUpdate"
            />
            <div
              v-if="
                playOffStageCurrent === 1 &&
                tournament.playOff.length > 1 &&
                playOffBracket.thirdPlace &&
                (playOffBracket.thirdPlace.team_1 || playOffBracket.thirdPlace.team_2)
              "
            >
              <h3 class="text-center mt-5">{{ $t('games.thirdPlace') }}</h3>
              <Game
                :game="playOffBracket.thirdPlace"
                :is-third="true"
                :active-tournament="tournament"
                :compact-view="false"
                :game-index="1"
                @save="saveResults"
                @update="onThirdPlaceUpdate"
                @finish="onThirdPlaceFinish"
              />
            </div>
          </template>
          <div v-if="scoreError" class="has-text-centered has-text-danger mb-5 mt-5">
            {{ $t('games.resultsError') }}
          </div>
          <div class="text-center mt-5" v-if="!isPublicView && isOwnerOrAdmin">
            <button class="button btn-save-results" data-testid="btn-save-playoff" @click="saveResults">
              <Save :size="16" class="mr-1" /> {{ $t('games.saveResults') }}
            </button>
          </div>
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
import Game from '@/components/partials/Game.vue';
import {
  Save,
  GitFork,
  Search,
  UserRound,
  Building2,
  Timer,
  Twitch,
  Facebook,
  Instagram,
  Video,
} from 'lucide-vue-next';
import RoundTimer from '@/components/partials/RoundTimer.vue';
import YoutubeIcon from '@/components/icons/YoutubeIcon.vue';
import FinishedBanner from '@/components/partials/FinishedBanner.vue';
import { getGameStreams, getStreamPlatform, getStreamIconComponent, getStreamIconClass } from '@/services/streams';

export default {
  name: 'PlayOff',
  props: ['activeTournament', 'isPublicView', 'hideHeader', 'matchesOnly'],
  emits: ['openResults'],
  components: {
    DoubleElimination,
    Game,
    Bracket,
    Save,
    GitFork,
    Search,
    UserRound,
    Building2,
    Timer,
    FinishedBanner,
    RoundTimer,
    YoutubeIcon,
    Twitch,
    Facebook,
    Instagram,
    Video,
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
  },
  methods: {
    shuffleArray,
    getGameStreams(game, index) {
      return getGameStreams(game, this.tournament, index);
    },
    getStreamPlatform,
    getStreamIcon: getStreamIconComponent,
    getStreamIconClass,
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
    isTeamNameHighlighted(teamName) {
      if (!this.highlightedTeam) return false;
      return this.teamMatchesQuery(teamName, this.highlightedTeam.toLowerCase());
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
.btn-save-results {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--color-success);
  color: var(--color-btn-text);
  border: none;
  font-weight: 600;
  padding: 0.6rem 1.5rem;
  border-radius: 6px;
}

.btn-save-results:hover {
  background: var(--color-success-hover);
  color: var(--color-btn-text);
}

.btn-save-results:focus,
.btn-save-results.is-focused,
.btn-save-results:active {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-primary-shadow) !important;
  border-color: transparent;
}

.playoff-stage-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.playoff-search-wrapper {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
}

.playoff-stage-title {
  margin: 0 !important;
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
  width: 12px;
  height: 12px;
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
  background: var(--color-text-muted, #6b7280);
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

.playoff-search-empty {
  padding: 0.5rem 0.6rem;
  font-size: 1rem;
  color: var(--color-text-muted, #9ca3af);
}

.game--highlighted {
  outline: 2px solid var(--color-primary);
  border-radius: 8px;
  box-shadow: 0 0 0 4px var(--color-primary-shadow, rgb(124 58 237 / 15%));
}

.score-history {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
  padding-top: 6px;
}

.score-history__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px 2px 4px;
  border-radius: 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.score-history__num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
}

.score-history__score {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
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
</style>
