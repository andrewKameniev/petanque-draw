<template>
  <div v-if="isLoading" class="gooey">
    <span class="dot"></span>
    <div class="dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
  <div v-else class="wrapper" :class="{ 'wrapper--tir': activeTournamentView?.system === 'tir' }">
    <div v-if="tournament" class="container">
      <div class="is-flex is-justify-content-space-between is-align-items-center">
        <router-link class="navbar-item" to="/">
          <img src="../assets/img/logo.webp" alt="logo" />
        </router-link>
        <div class="is-flex is-align-items-center" style="gap: 4px">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
      <div class="text-center is-size-3 tournament-title-wrapper">
        <strong>{{ tournament.name }}</strong>
      </div>
      <div
        v-if="!showCurrentRound"
        class="tournament-info-card mt-3 mb-3"
        :class="{ 'tournament-info-card--with-switcher': tournament.tournamentB || tournament.groupB }"
      >
        <GroupSwitcher
          v-if="tournament.tournamentB || tournament.groupB"
          :model-value="publicActiveGroup"
          :full-labels="true"
          class="tournament-info-card__switcher"
          @update:model-value="publicActiveGroup = $event"
        />
        <span class="badge badge-corner" :class="badgeClass">
          {{ badgeLabel }}
        </span>
        <div v-if="tournamentMessageLines.length" class="tournament-info-message">
          <span class="has-text-grey-dark">{{ $t('remote.organizerMessage') }}: </span>
          <span class="has-text-weight-semibold" v-for="(line, i) in tournamentMessageLines" :key="i"
            >{{ line }}<br v-if="i < tournamentMessageLines.length - 1"
          /></span>
        </div>
        <div class="tournament-info-row">
          <span class="has-text-grey-dark">{{ $t('teams.system') }}:</span>
          <span class="has-text-weight-semibold">{{ systemDescription }}</span>
        </div>
        <div class="tournament-info-row" v-if="activeTournamentView?.teams">
          <span class="has-text-grey-dark"
            >{{ activeTournamentView.system === 'tir' ? $t('tir.participants') : $t('common.teamsCount') }}:</span
          >
          <span class="has-text-weight-semibold">{{
            activeTournamentView.system === 'tir'
              ? (activeTournamentView.tirParticipants || activeTournamentView.teams).length
              : activeTournamentView.teams.length
          }}</span>
        </div>
        <div class="tournament-info-row" v-if="groupTotalRoundsDisplay">
          <span class="has-text-grey-dark">{{ $t('common.totalRounds') }}:</span>
          <span class="has-text-weight-semibold">{{ groupTotalRoundsDisplay }}</span>
        </div>
        <div class="tournament-info-row" v-if="tournamentExtrasLine">
          <span class="has-text-grey-dark">{{ $t('common.timeLimit') }}:</span>
          <span class="has-text-weight-semibold">{{ tournamentExtrasLine }}</span>
        </div>
        <div class="tournament-info-row" v-if="activeTournamentView?.cadrage">
          <span class="has-text-grey-dark">{{ $t('games.cadrage') }}:</span>
          <span class="has-text-weight-semibold">{{ cadrageRange }}</span>
        </div>
        <div class="tournament-info-row" v-if="activeTournamentView?.playOff">
          <span class="has-text-grey-dark">{{ $t('games.playOff') }}:</span>
          <span class="has-text-weight-semibold">{{ playOffTeamsCount }} {{ $t('common.teamsLabel') }}</span>
        </div>
        <div v-if="activeTournamentView?.playOff" class="btn-bracket-group">
          <button class="button is-small btn-bracket" @click="$refs.playOff && ($refs.playOff.showBracket = true)">
            <GitFork :size="14" style="transform: rotate(90deg); margin-right: 0.3rem" />
            {{ $t('games.showBracket') }}
          </button>
        </div>
      </div>
      <div v-if="isFinished && winnerTeam" class="winner-card">
        <div class="winner-card__trophy">
          <TrophyIcon :size="36" />
        </div>
        <div class="winner-card__title">{{ $t('tir.tournamentWinner') }}</div>
        <div class="winner-card__team-name">{{ winnerTeam.title }}</div>
        <div v-if="winnerTeam.players && winnerTeam.players.length" class="winner-card__players">
          <div v-for="(player, pIdx) in winnerTeam.players" :key="pIdx" class="winner-card__player">
            <img v-if="player.avatar_url" :src="player.avatar_url" class="winner-card__avatar" alt="" />
            <div v-else class="winner-card__avatar winner-card__avatar--placeholder">
              <Users :size="16" />
            </div>
            <div class="winner-card__player-info">
              <span class="winner-card__player-name">{{ player.surname }} {{ player.name }}</span>
              <span v-if="player.club" class="winner-card__player-club">{{ player.club }}</span>
            </div>
          </div>
        </div>
      </div>
      <TeamPlayoff v-if="activeTournamentView?.teamPlayoff" :read-only="true" />
      <PlayOff
        v-else-if="activeTournamentView?.playOff && activeTournamentView.system !== 'tir'"
        ref="playOff"
        :active-tournament="activeTournamentView"
        :is-public-view="true"
        :hide-header="true"
        @openResults="activeTab = 'ranking'"
        class="playoff-public-wrapper"
      />
      <div v-else-if="activeTournamentView?.cadrage" class="cadrage-public-section">
        <h3 class="cadrage-public-section__title">{{ $t('games.cadrage') }}</h3>
        <RoundTimer
          v-if="showPublicTimer"
          :timer-started-at="activeTournamentView.roundTimer.timerStartedAt"
          :timer-ends-at="activeTournamentView.roundTimer.timerEndsAt"
          :timer-status="activeTournamentView.roundTimer.timerStatus"
          :cochonettes-enabled="!!activeTournamentView.preferences.cochonettesEnabled"
          :cochonettes="activeTournamentView.preferences.cochonettes || 1"
          :read-only="true"
          class="mb-3"
        />
        <div class="match-list">
          <div
            class="match-item"
            :class="{
              'match-item--in-progress': game.status === 'in_progress',
              'match-item--finished': game.status === 'finished',
              'match-item--upcoming': !game.status || game.status === 'not_started',
            }"
            v-for="(game, index) in activeTournamentView.cadrage"
            :key="'cadrage-' + index"
          >
            <span
              class="match-lane-left"
              :class="{
                'match-lane-left--active': game.status === 'in_progress',
                'match-lane-left--finished': game.status === 'finished',
              }"
              >{{ index + (activeTournamentView.preferences?.fieldsStart || 1) }}</span
            >
            <span
              class="match-team match-team-right"
              :class="{
                'match-team--winner':
                  game.status === 'finished' && Number(game.team_1_score) > Number(game.team_2_score),
              }"
              >{{ game.team_1 }}</span
            >
            <span class="match-vs">
              <template v-if="game.status === 'in_progress' || game.status === 'finished'">
                <span class="match-score">{{ game.team_1_score ?? 0 }} : {{ game.team_2_score ?? 0 }}</span>
              </template>
              <template v-else>
                <span class="match-score match-score--pending">-- : --</span>
              </template>
            </span>
            <span
              class="match-team"
              :class="{
                'match-team--winner':
                  game.status === 'finished' && Number(game.team_2_score) > Number(game.team_1_score),
              }"
              >{{ game.team_2 }}</span
            >
            <div
              v-if="
                activeTournamentView.preferences.cochonettesEnabled && game.score_history && game.score_history.length
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
      </div>
      <div v-if="showCurrentRound" class="current-round-card mt-3 mb-3">
        <div class="tournament-info-card tournament-info-card--inline">
          <GroupSwitcher
            v-if="tournament.tournamentB || tournament.groupB"
            :model-value="publicActiveGroup"
            :full-labels="true"
            @update:model-value="publicActiveGroup = $event"
          />
          <span class="badge badge-corner" :class="badgeClass">
            {{ badgeLabel }}
          </span>
          <div v-if="tournamentMessageLines.length" class="tournament-info-message">
            <span class="has-text-grey-dark">{{ $t('remote.organizerMessage') }}: </span>
            <span class="has-text-weight-semibold" v-for="(line, i) in tournamentMessageLines" :key="i"
              >{{ line }}<br v-if="i < tournamentMessageLines.length - 1"
            /></span>
          </div>
          <div class="tournament-info-row">
            <span class="has-text-grey-dark">{{ $t('teams.system') }}:</span>
            <span class="has-text-weight-semibold">{{ systemDescription }}</span>
          </div>
          <div class="tournament-info-row" v-if="activeTournamentView?.teams">
            <span class="has-text-grey-dark"
              >{{ activeTournamentView.system === 'tir' ? $t('tir.participants') : $t('common.teamsCount') }}:</span
            >
            <span class="has-text-weight-semibold">{{
              activeTournamentView.system === 'tir'
                ? (activeTournamentView.tirParticipants || activeTournamentView.teams).length
                : activeTournamentView.teams.length
            }}</span>
          </div>
          <div class="tournament-info-row" v-if="groupTotalRoundsDisplay">
            <span class="has-text-grey-dark">{{ $t('common.totalRounds') }}:</span>
            <span class="has-text-weight-semibold">{{ groupTotalRoundsDisplay }}</span>
          </div>
          <div class="tournament-info-row" v-if="tournamentExtrasLine">
            <span class="has-text-grey-dark">{{ $t('common.timeLimit') }}:</span>
            <span class="has-text-weight-semibold">{{ tournamentExtrasLine }}</span>
          </div>
        </div>
        <div class="round-header">
          <span
            >{{ $t('common.round') }} {{ activeRound
            }}<template v-if="groupTotalRoundsDisplay">/{{ groupTotalRoundsDisplay }}</template></span
          >
          <TeamSearch :teams="teamNames" :team-club-map="teamClubMap" v-model="highlightedTeam" />
        </div>
        <div v-if="highlightedTeam" class="search-filter-chip" @click="highlightedTeam = null">
          <span>{{ highlightedTeam }}</span>
          <X :size="14" />
        </div>
        <RoundTimer
          v-if="showPublicTimer"
          :timer-started-at="activeTournamentView.roundTimer.timerStartedAt"
          :timer-ends-at="activeTournamentView.roundTimer.timerEndsAt"
          :timer-status="activeTournamentView.roundTimer.timerStatus"
          :cochonettes-enabled="!!activeTournamentView.preferences.cochonettesEnabled"
          :cochonettes="activeTournamentView.preferences.cochonettes || 1"
          :read-only="true"
          class="mb-3"
        />
        <div class="match-list">
          <template v-if="activeTournamentView?.groups && activeTournamentView.groups.length > 1">
            <div v-for="(group, gIdx) in groupedCurrentGames" :key="gIdx" class="match-group">
              <h4 class="match-group__title">{{ $t('common.group') }} {{ groupLabels[gIdx] }}</h4>
              <div
                class="match-item"
                :class="{
                  'match-item--highlighted': isTeamHighlighted(game),
                  'match-item--in-progress': game.status === 'in_progress',
                  'match-item--finished': game.status === 'finished',
                  'match-item--upcoming': !game.status || game.status === 'not_started',
                }"
                v-for="(game, index) in group"
                :key="index"
              >
                <span
                  class="match-lane-left"
                  :class="{
                    'match-lane-left--active': game.status === 'in_progress',
                    'match-lane-left--finished': game.status === 'finished',
                  }"
                  >{{ game._laneIndex + activeTournamentView.preferences.fieldsStart }}</span
                >
                <span
                  class="match-team match-team-right"
                  :class="{
                    'match-team--highlighted': isTeamNameHighlighted(game.team_1),
                    'match-team--winner': game.status === 'finished' && game.winner === game.team_1,
                  }"
                  >{{ game.team_1 }}</span
                >
                <span class="match-vs">
                  <template v-if="game.status === 'in_progress' || game.status === 'finished'">
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
                    'match-team--winner': game.status === 'finished' && game.winner === game.team_2,
                  }"
                  >{{ game.team_2 }}</span
                >
                <span
                  v-if="getGameStreams(game, game._laneIndex).length"
                  class="match-status-badge match-status-badge--live"
                >
                  <a
                    v-for="(streamUrl, si) in getGameStreams(game, game._laneIndex)"
                    :key="si"
                    :href="streamUrl"
                    target="_blank"
                    rel="noopener"
                    class="match-live-link"
                    :class="getStreamIconClass(streamUrl)"
                  >
                    <span v-if="si === 0 && game.status === 'in_progress'" class="match-live-dot"></span>
                    <component :is="getStreamIcon(streamUrl)" :size="16" />
                  </a>
                  <span class="match-live-label">{{
                    game.status === 'in_progress' ? $t('games.live') : $t('games.stream')
                  }}</span>
                </span>
                <span v-else-if="game.status === 'in_progress'" class="match-status-badge match-status-badge--progress">
                  <span class="match-progress-dot"></span>{{ $t('teamPlayoff.matchInProgress') }}
                </span>
                <span v-else-if="game.status === 'finished'" class="match-status-badge match-status-badge--finished">{{
                  $t('teamPlayoff.matchFinished')
                }}</span>
                <div
                  v-if="
                    activeTournamentView.preferences.cochonettesEnabled &&
                    game.score_history &&
                    game.score_history.length
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
          </template>
          <div
            v-else
            class="match-item"
            :class="{
              'match-item--highlighted': isTeamHighlighted(game),
              'match-item--in-progress': game.status === 'in_progress',
              'match-item--finished': game.status === 'finished',
              'match-item--upcoming': !game.status || game.status === 'not_started',
            }"
            v-for="(game, index) in activeTournamentView.games[activeRound - 1]"
            :key="index"
          >
            <span
              class="match-lane-left"
              :class="{
                'match-lane-left--active': game.status === 'in_progress',
                'match-lane-left--finished': game.status === 'finished',
              }"
              >{{ index + activeTournamentView.preferences.fieldsStart }}</span
            >
            <span
              class="match-team match-team-right"
              :class="{
                'match-team--highlighted': isTeamNameHighlighted(game.team_1),
                'match-team--winner': game.status === 'finished' && game.winner === game.team_1,
              }"
              >{{ game.team_1 }}</span
            >
            <span class="match-vs">
              <template v-if="game.status === 'in_progress' || game.status === 'finished'">
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
                'match-team--winner': game.status === 'finished' && game.winner === game.team_2,
              }"
              >{{ game.team_2 }}</span
            >
            <span v-if="getGameStreams(game, index).length" class="match-status-badge match-status-badge--live">
              <a
                v-for="(streamUrl, si) in getGameStreams(game, index)"
                :key="si"
                :href="streamUrl"
                target="_blank"
                rel="noopener"
                class="match-live-link"
                :class="getStreamIconClass(streamUrl)"
              >
                <span v-if="si === 0 && game.status === 'in_progress'" class="match-live-dot"></span>
                <component :is="getStreamIcon(streamUrl)" :size="16" />
              </a>
              <span class="match-live-label">{{
                game.status === 'in_progress' ? $t('games.live') : $t('games.stream')
              }}</span>
            </span>
            <span v-else-if="game.status === 'in_progress'" class="match-status-badge match-status-badge--progress">
              <span class="match-progress-dot"></span>{{ $t('teamPlayoff.matchInProgress') }}
            </span>
            <span v-else-if="game.status === 'finished'" class="match-status-badge match-status-badge--finished">{{
              $t('teamPlayoff.matchFinished')
            }}</span>
            <div
              v-if="
                activeTournamentView.preferences.cochonettesEnabled && game.score_history && game.score_history.length
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
      </div>
      <!-- TIR: single view, no tabs -->
      <TirPublicView v-if="activeTournamentView?.system === 'tir'" :tournament="activeTournamentView" class="mt-3" />

      <!-- Other systems: tabs -->
      <template v-else>
        <div class="tournament-nav">
          <button
            v-for="(tab, index) in tabs"
            :key="index"
            class="tournament-nav__btn"
            :class="[`tournament-nav__btn--${tab.id}`, { 'tournament-nav__btn--active': tab.id === activeTab }]"
            @click="activeTab = tab.id"
          >
            <component :is="tab.icon" :size="18" />
            <span>{{ tab.label }}</span>
          </button>
        </div>
        <div class="tabs-content-area">
          <div v-if="activeTab === 'teams'">
            <TeamsList
              :previewTournament="activeTournamentView"
              :activeRound="activeRound"
              :highlightedTeam="highlightedTeam"
              :teamClubMap="teamClubMap"
            />
          </div>
          <Results
            v-if="activeTab === 'results'"
            :previewTournament="activeTournamentView"
            :highlightedTeam="highlightedTeam"
            :teamClubMap="teamClubMap"
            :cardView="true"
          />
          <div v-if="activeTab === 'ranking'">
            <Ranking
              :tournament="activeTournamentView"
              :rankingTeams="rankingTeams"
              :activeRound="activeRound"
              :highlightedTeam="highlightedTeam"
              :teamClubMap="teamClubMap"
              :read-only="true"
            />
          </div>
        </div>
      </template>
    </div>
    <div v-else class="p-5">
      <h2 class="is-size-3 text-center">{{ $t('messages.tournamentNotActive') }}</h2>
      <div class="text-center mt-5"><img v-if="girlImage" :src="girlImage" alt="In the petanque land" /><br /></div>
    </div>
    <Footer />
  </div>
</template>

<script>
import Ranking from '@/components/partials/Ranking';
import Results from '@/components/partials/Results';
import TeamsList from '@/components/partials/TeamsList';
import { tournamentService } from '@/services/db';
import {
  getTeamsRanking,
  getTournamentRanking,
  pluralizeRounds,
  formatSwissDescription,
  tournamentNames,
} from '@/helpers';
import { getGameStreams, getStreamPlatform, getStreamIconComponent, getStreamIconClass } from '@/services/streams';
import { Twitch, Facebook, Instagram, Video } from 'lucide-vue-next';
import YoutubeIcon from '@/components/icons/YoutubeIcon.vue';
import PlayOff from '@/components/partials/PlayOff.vue';
import TeamPlayoff from '@/components/partials/TeamPlayoff.vue';
import LanguageSwitcher from '@/components/partials/LanguageSwitcher.vue';
import ThemeSwitcher from '@/components/partials/ThemeSwitcher.vue';
import Footer from '@/components/partials/Footer.vue';
import { GitFork, X } from 'lucide-vue-next';
import TeamSearch from '@/components/partials/TeamSearch.vue';
import TirPublicView from '@/components/tir/TirPublicView.vue';
import RoundTimer from '@/components/partials/RoundTimer.vue';
import GroupSwitcher from '@/components/partials/GroupSwitcher.vue';
import { Users, List, Trophy as TrophyIcon } from 'lucide-vue-next';
export default {
  name: 'Public',
  components: {
    Footer,
    LanguageSwitcher,
    ThemeSwitcher,
    PlayOff,
    TeamPlayoff,
    TeamsList,
    Results,
    Ranking,
    GitFork,
    X,
    TeamSearch,
    TirPublicView,
    RoundTimer,
    GroupSwitcher,
    Users,
    List,
    TrophyIcon,
    YoutubeIcon,
    Twitch,
    Facebook,
    Instagram,
    Video,
  },
  data() {
    return {
      isLoading: false,
      tournament: null,
      activeTab: 'ranking',
      notificationsEnabled: false,
      highlightedTeam: null,
      girlImage: null,
      publicActiveGroup: 'A',
    };
  },
  mounted() {
    this._unsubscribers = [];
    this.getInfo();
    this._onResume = () => {
      this._unsubscribeAll();
      this.getInfo();
    };
    this._onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        this._onResume();
      }
    };
    document.addEventListener('visibilitychange', this._onVisibilityChange);
    window.addEventListener('online', this._onResume);
  },
  beforeUnmount() {
    this._unsubscribeAll();
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
    window.removeEventListener('online', this._onResume);
    document.documentElement.removeAttribute('data-color-schema');
  },
  watch: {
    isLoading(val) {
      if (!val && !this.tournament) {
        import('@/assets/img/girl.avif').then((m) => {
          this.girlImage = m.default;
        });
      }
    },
    tabs(newTabs) {
      if (!newTabs.find((t) => t.id === this.activeTab)) {
        this.activeTab = newTabs[0]?.id || 'teams';
      }
    },
    colorSchema: {
      handler(val) {
        if (val) {
          document.documentElement.setAttribute('data-color-schema', val);
        } else {
          document.documentElement.removeAttribute('data-color-schema');
        }
      },
      immediate: true,
    },
  },
  computed: {
    tabs() {
      const t = this.activeTournamentView;
      const isPlayoffOnly = t?.system === 'playoff' || (t?.playOff && !t?.games?.length);
      const list = [{ id: 'teams', label: this.$t('teams.teams'), icon: 'Users' }];
      if (!isPlayoffOnly) {
        list.push({ id: 'ranking', label: this.$t('teams.ranking'), icon: 'TrophyIcon' });
      }
      list.push({ id: 'results', label: this.$t('teams.results'), icon: 'List' });
      return list;
    },
    showCurrentRound() {
      const t = this.activeTournamentView;
      return t?.games && t.roundIsActive && !t.tournamentIsFinished && !t.cadrage && !t.playOff && t.system !== 'tir';
    },
    activeRound() {
      const t = this.activeTournamentView;
      return t?.games?.length ? (t.roundIsActive ? t.games.length : t.games.length + 1) : 1;
    },
    activeTournamentView() {
      if (this.publicActiveGroup === 'B') {
        if (this.tournament?.main) {
          return this.tournament.tournamentB || this.tournament.main;
        }
        if (this.tournament?.groupB) {
          return {
            ...this.tournament,
            teams: this.tournament.groupB.teams,
            games: this.tournament.groupB.games,
            playOff: this.tournament.groupB.playOff,
            playOffBracket: this.tournament.groupB.playOffBracket,
            playOffStage: this.tournament.groupB.playOffStage,
            cadrage: this.tournament.groupB.cadrage,
            roundIsActive: this.tournament.groupB.roundIsActive,
            tournamentIsFinished: this.tournament.groupB.tournamentIsFinished,
            eliminationRound: this.tournament.groupB.eliminationRound,
          };
        }
      }
      if (this.tournament?.main) {
        return this.tournament.main;
      }
      return this.tournament;
    },
    rankingTeams() {
      return getTeamsRanking(this.activeTournamentView, this.activeRound);
    },
    groupLabels() {
      return tournamentNames;
    },
    groupedCurrentGames() {
      const t = this.activeTournamentView;
      const games = t?.games?.[this.activeRound - 1] || [];
      const grouped = {};
      games.forEach((game, idx) => {
        const g = game.group ?? 0;
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push({ ...game, _laneIndex: idx });
      });
      return Object.keys(grouped)
        .sort((a, b) => a - b)
        .map((k) => grouped[k]);
    },
    winnerTeam() {
      const t = this.activeTournamentView;
      if (!this.isFinished || !t?.teams) return null;
      if (t.system === 'tir') {
        const playoff = t.tirPlayoff;
        if (playoff?.final?.score1 != null && playoff?.final?.score2 != null) {
          const winnerName =
            playoff.final.score1 > playoff.final.score2 ? playoff.final.player1 : playoff.final.player2;
          if (winnerName) {
            const participants = t.tirParticipants || [];
            const winner = participants.find((p) => p.name === winnerName);
            if (winner) return { title: winner.name, players: [winner] };
          }
        }
        return null;
      }
      if (t.playOffBracket) {
        const tournamentRanking = getTournamentRanking(t, this.rankingTeams);
        if (tournamentRanking?.length && tournamentRanking[0].title) {
          return t.teams.find((team) => team.title === tournamentRanking[0].title) || null;
        }
        return null;
      }
      const ranking = this.rankingTeams;
      if (!ranking || !ranking.length) return null;
      const topTitle = Array.isArray(ranking[0]) ? ranking[0][0]?.title : ranking[0]?.title;
      if (!topTitle) return null;
      return t.teams.find((team) => team.title === topTitle) || null;
    },
    userId() {
      if (this.$route.query.ref) {
        return this.parseRef().userId;
      }
      return this.$route.query.user;
    },
    tournamentId() {
      if (this.$route.query.ref) {
        return this.parseRef().tournamentId;
      }
      return this.$route.query.tournament;
    },
    colorSchema() {
      return this.activeTournamentView?.preferences?.colorSchema || '';
    },
    tournamentMessageLines() {
      if (!this.tournament?.tournamentMessage) return [];
      return this.tournament.tournamentMessage.split('\n').filter((l) => l.trim());
    },
    isFinished() {
      return !!this.activeTournamentView?.tournamentIsFinished;
    },
    isStarted() {
      const t = this.activeTournamentView;
      if (t?.tournamentIsStarted || t?.roundIsActive || t?.tirStarted) return true;
      if (t?.games?.length) {
        return t.games.some((round) => round.some((g) => g.status && g.status !== 'not_started'));
      }
      return false;
    },
    groupTotalRoundsDisplay() {
      const t = this.activeTournamentView;
      const perCircle = t?.preferences?.groupTotalRounds;
      if (!perCircle) return null;
      const circles = t.roundRobinCircle || 1;
      return perCircle * circles;
    },
    badgeClass() {
      if (this.isFinished) return 'badge-finished';
      if (!this.isStarted) return 'badge-not-started';
      return 'badge-active';
    },
    badgeLabel() {
      if (this.isFinished) return this.$t('common.finished');
      if (!this.isStarted) return this.$t('common.notStarted');
      const t = this.activeTournamentView;
      if (t?.system === 'tir') {
        return this.tirPhaseLabel;
      }
      if (t?.playOff || t?.playOffBracket) return this.$t('games.playOff');
      if (t?.cadrage) return this.$t('games.cadrage');
      const round = t?.games?.length || 0;
      if (round) return `${this.$t('common.round')} ${round}`;
      return this.$t('common.active');
    },
    tirPhaseLabel() {
      const t = this.activeTournamentView;
      if (!t) return this.$t('common.active');
      if (t.tirPlayoff) {
        const playoff = t.tirPlayoff;
        if (playoff.final?.score1 != null) return this.$t('games.final');
        const sfRound = playoff.rounds?.find((r) => r.matches.length === 2);
        if (sfRound?.matches.some((m) => m.score1 != null)) return this.$t('tir.semifinal');
        if (playoff.rounds?.[0]?.matches.some((m) => m.score1 != null)) return this.$t('tir.quarterfinal');
        return this.$t('games.playOff');
      }
      const round = t.tirRound || 1;
      return this.$t('tir.round') + ' ' + round;
    },
    systemDescription() {
      const t = this.activeTournamentView;
      if (t?.system === 'tir') {
        let desc = this.$t('teams.tir');
        if (t.tirConfig?.rounds === 2) {
          desc += ', ' + this.$t('tir.twoRoundsShort');
        }
        const qualifiedCount = t.tirPlayoff?.size || (t.tirConfig?.rounds === 2 ? 8 : null);
        if (qualifiedCount) {
          desc += ', ' + qualifiedCount + ' → ' + this.$t('games.playOff').toLowerCase();
        }
        return desc;
      }
      if (!t?.system) {
        return this.$t('teams.swiss');
      }
      if (t.system !== 'swiss') {
        return this.$t('teams.' + t.system);
      }
      return formatSwissDescription(t, this.$i18n.locale, {
        swiss: this.$t('ranking.swiss'),
        playOff: this.$t('games.playOff').toLowerCase(),
        poulesBarrage: this.$t('games.poulesBarrage').toLowerCase(),
        systemLabel: this.$t('teams.' + t.system),
      });
    },
    cadrageRange() {
      const t = this.activeTournamentView;
      if (!t?.cadrage?.length) return '';
      const from = (t.playOff?.length || 0) + 1;
      const to = from + t.cadrage.length * 2 - 1;
      return `${from}-${to} ${this.$t('common.places')}`;
    },
    playOffTeamsCount() {
      const t = this.activeTournamentView;
      if (!t?.playOff?.length) return 0;
      return t.playOff.length * 2;
    },
    isInPlayoff() {
      const t = this.activeTournamentView;
      return !!t?.playOff || !!t?.cadrage;
    },
    tournamentExtrasLine() {
      const t = this.activeTournamentView;
      const prefs = t?.preferences;
      if (!prefs?.timeLimitEnabled) return '';
      const parts = [];
      const time =
        prefs.playOffEnabled && this.isInPlayoff ? prefs.playoffTimeLimit || prefs.timeLimit : prefs.timeLimit;
      if (prefs.noTimeLimitFinale && prefs.playOffEnabled && this.isInPlayoff && this.isFinale) {
        parts.push(this.$t('modals.noTimeLimitFinale'));
      } else {
        parts.push(`${time} ${this.$t('modals.min')}`);
      }
      if (prefs.cochonettesEnabled && prefs.cochonettes) {
        parts.push(
          `+ ${prefs.cochonettes} ${prefs.cochonettes === 1 ? this.$t('common.cochonette') : this.$t('common.cochonettes')}`,
        );
      }
      return parts.join(' ');
    },
    isFinale() {
      const t = this.activeTournamentView;
      const po = t?.playOff;
      if (!po?.length) return false;
      return po[po.length - 1].teams?.length === 1;
    },
    showPublicTimer() {
      const t = this.activeTournamentView;
      const rt = t?.roundTimer;
      return rt && (rt.timerStatus === 'running' || rt.timerStatus === 'ended');
    },
    teamNames() {
      const t = this.activeTournamentView;
      if (!t?.teams) return [];
      return t.teams.map((team) => team.title);
    },
    teamClubMap() {
      const t = this.activeTournamentView;
      if (!t?.teams) return {};
      const map = {};
      t.teams.forEach((team) => {
        if (team.players?.length && team.players[0].club) {
          map[team.title] = team.players[0].club;
        }
      });
      return map;
    },
  },
  methods: {
    getGameStreams(game, index) {
      return getGameStreams(game, this.activeTournamentView, index);
    },
    getStreamPlatform,
    getStreamIcon: getStreamIconComponent,
    getStreamIconClass,
    isTeamNameHighlighted(teamName) {
      if (!this.highlightedTeam) return false;
      if (this.highlightedTeam === teamName) return true;
      return this.teamClubMap[teamName] === this.highlightedTeam;
    },
    isTeamHighlighted(game) {
      if (!this.highlightedTeam) return false;
      return this.isTeamNameHighlighted(game.team_1) || this.isTeamNameHighlighted(game.team_2);
    },
    parseRef() {
      const refParam = this.$route.query.ref;
      if (refParam.includes('.')) {
        const [userId, tournamentBase36] = refParam.split('.');
        return { userId, tournamentId: parseInt(tournamentBase36, 36).toString() };
      }
      const decoded = atob(refParam);
      const [userId, tournamentId] = decoded.split(':');
      return { userId, tournamentId };
    },
    pluralizeRounds(n) {
      return pluralizeRounds(n, this.$i18n.locale);
    },
    async getInfo() {
      this.isLoading = true;
      if (this.$route.query) {
        try {
          const snapshot = await tournamentService.getOne(this.userId, this.tournamentId);
          if (snapshot.exists()) {
            this.tournament = snapshot.val();
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
        this.isLoading = false;
        this._subscribeDynamic();
      } else {
        const id = this.$route.params.id;
        fetch(`https://portal.petanque.org.ua/tournament/team_export/${id}?format=json`)
          .then((response) => {
            if (response.ok) {
              return response.json();
            }
            throw new Error('Error ' + response.status);
          })
          .then((tournamentInfo) => {
            this.tournament = tournamentInfo.tournament.meta ? JSON.parse(tournamentInfo.tournament.meta) : null;
            this.isLoading = false;
          })
          .catch(() => {
            this.isLoading = false;
          });
      }
    },
    _subscribeDynamic() {
      const isNew = !!this.tournament?.main;

      if (isNew) {
        const wrapperPaths = ['activeGroup', 'tournamentMessage'];
        for (const path of wrapperPaths) {
          const unsub = tournamentService.subscribePath(this.userId, this.tournamentId, path, (snapshot) => {
            if (!this.tournament) return;
            this.tournament[path] = snapshot.val();
          });
          this._unsubscribers.push(unsub);
        }
        const dataFields = [
          'games',
          'roundIsActive',
          'roundTimer',
          'playOff',
          'playOffBracket',
          'playOffStage',
          'cadrage',
          'barrage',
          'tournamentIsFinished',
          'tournamentIsStarted',
          'tirPlayoff',
          'tirRound',
          'tirStarted',
          'teams',
          'preferences',
          'streamPresets',
          'groups',
          'system',
        ];
        for (const field of dataFields) {
          const unsub = tournamentService.subscribePath(this.userId, this.tournamentId, `main/${field}`, (snapshot) => {
            if (!this.tournament?.main) return;
            this.tournament.main[field] = snapshot.val();
          });
          this._unsubscribers.push(unsub);
        }
        {
          const unsub = tournamentService.subscribePath(this.userId, this.tournamentId, 'tournamentB', (snapshot) => {
            if (!this.tournament) return;
            this.tournament.tournamentB = snapshot.val();
          });
          this._unsubscribers.push(unsub);
        }
        for (const field of dataFields) {
          const unsub = tournamentService.subscribePath(
            this.userId,
            this.tournamentId,
            `tournamentB/${field}`,
            (snapshot) => {
              if (!this.tournament?.tournamentB) return;
              this.tournament.tournamentB[field] = snapshot.val();
            },
          );
          this._unsubscribers.push(unsub);
        }
      } else {
        const paths = [
          'games',
          'roundIsActive',
          'roundTimer',
          'playOff',
          'playOffBracket',
          'playOffStage',
          'cadrage',
          'barrage',
          'tournamentIsFinished',
          'tournamentIsStarted',
          'tournamentMessage',
          'tirPlayoff',
          'tirRound',
          'tirStarted',
          'teams',
          'preferences',
          'streamPresets',
          'groups',
          'system',
          'activeGroup',
          'groupB',
        ];
        for (const path of paths) {
          const unsub = tournamentService.subscribePath(this.userId, this.tournamentId, path, (snapshot) => {
            if (!this.tournament) return;
            this.tournament[path] = snapshot.val();
          });
          this._unsubscribers.push(unsub);
        }
      }
    },
    _unsubscribeAll() {
      if (this._unsubscribers) {
        this._unsubscribers.forEach((fn) => fn());
        this._unsubscribers = [];
      }
    },
  },
};
</script>
<style>
.gooey {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 142px;
  height: 40px;
  margin: -20px 0 0 -71px;
}

.gooey .dot {
  position: absolute;
  width: 16px;
  height: 16px;
  top: 12px;
  left: 15px;
  background: var(--color-primary);
  border-radius: 50%;
  transform: translateX(0);
  animation: dot 2.8s infinite;
}

.gooey .dots {
  transform: translateX(0);
  margin-top: 12px;
  margin-left: 31px;
  animation: dots 2.8s infinite;
}

.gooey .dots span {
  display: block;
  float: left;
  width: 16px;
  height: 16px;
  margin-left: 16px;
  background: var(--color-primary);
  border-radius: 50%;
}
@keyframes dot {
  50% {
    transform: translateX(96px);
  }
}

@keyframes dots {
  50% {
    transform: translateX(-31px);
  }
}

.tournament-title-wrapper {
  position: relative;
  font-size: 1.5rem !important;
}

.search-filter-chip {
  display: flex;
  align-items: center;
  width: fit-content;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  margin: -0.25rem auto 0.5rem;
  transition: opacity 0.15s;
}

.search-filter-chip:hover {
  opacity: 0.85;
}

.tournament-info-card {
  position: relative;
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  padding-right: 7rem;
  background: var(--color-surface);
}

.tournament-info-card--with-switcher {
  padding-top: 0;
}

.tournament-info-card--with-switcher .badge-corner {
  top: 3.25rem;
}

.tournament-info-card__switcher {
  margin-left: -1.25rem;
  margin-right: -7rem;
  width: calc(100% + 8.25rem);
  border-radius: 6px 6px 0 0;
  margin-bottom: 0.75rem;
}

.tournament-info-card--inline {
  border: none;
  border-radius: 0;
  border-bottom: 1px solid var(--color-border);
  padding: 0.75rem 1rem;
  padding-right: 6rem;
  margin-bottom: 0.5rem;
}

@media screen and (max-width: 352px) {
  .tournament-info-card:not(.tournament-info-card--with-switcher) {
    padding-right: 1.25rem;
    padding-top: 2.5rem;
  }
}

.badge-corner {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
}

.btn-bracket-group {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 0.25rem;
}

.btn-bracket {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
}

.btn-bracket:hover {
  color: var(--color-white);
}

@media screen and (max-width: 768px) {
  .btn-bracket {
    font-size: 1rem;
  }
}

.tournament-info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.2rem 0;
}

.tournament-info-message {
  margin-bottom: 0.4rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--color-public-separator);
  margin-right: 6rem;
}

.badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
}

.badge-active {
  background: var(--color-primary);
  color: var(--color-white);
}

.badge-finished {
  background: var(--color-grey);
  color: var(--color-white);
}

.badge-not-started {
  background: var(--color-warning-border);
  color: var(--color-white);
}

.btn-purple-outline {
  background: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
}

.btn-purple-outline:hover {
  background: var(--color-primary);
  color: var(--color-white);
}

.button.is-purple {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.wrapper .navbar-item:hover {
  background: transparent;
}

.tournament-nav {
  display: flex;
  background: var(--color-surface, var(--color-white));
  border: 1px solid var(--color-border);
  border-radius: 12px 12px 0 0;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: -1px;
}

.tournament-nav__btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 6px;
  border: none;
  background: none;
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.tournament-nav__btn--active {
  font-weight: 700;
}

.tournament-nav__btn--teams.tournament-nav__btn--active {
  color: var(--tir-delete);
}

.tournament-nav__btn--games.tournament-nav__btn--active {
  color: var(--color-primary);
}

.tournament-nav__btn--results.tournament-nav__btn--active {
  color: var(--tir-carreau);
}

.tournament-nav__btn--ranking.tournament-nav__btn--active {
  color: var(--tir-touche);
}

.wrapper {
  position: relative;
  background: var(--color-body-bg);
}

.wrapper::before {
  content: '';
  position: fixed;
  inset: 0;
  background: url('@/assets/img/bg-petanque.avif') repeat;
  background-size: 800px;
  opacity: 0.5;
  z-index: 0;
  pointer-events: none;
}

[data-theme='dark'] .wrapper::before {
  display: none;
}

.wrapper--tir {
  background: var(--color-body-bg);
}

.wrapper--tir::before {
  display: none;
}

.wrapper--tir .tournament-info-card {
  margin-left: 10px;
  margin-right: 10px;
}

.wrapper > * {
  position: relative;
  z-index: 1;
}

.wrapper .container {
  max-width: 800px !important;
  margin: 0 auto;
  padding: 0 1rem;
  padding-bottom: 2rem;
}

@media screen and (min-width: 1024px) {
  .wrapper .container {
    padding-bottom: 3rem;
  }
}

@media screen and (min-width: 1408px) {
  .wrapper .container {
    max-width: 1100px !important;
  }
}

.wrapper :deep(.navbar) {
  z-index: 10;
}

.playoff-public-wrapper .play-off-stage-wrapper {
  padding: 0;
}

.playoff-public-wrapper h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.playoff-public-wrapper h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-public-text-muted);
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.playoff-public-wrapper .game-row.compact {
  background: var(--color-white);
  border-radius: 8px;
  padding: 0.6rem 1rem;
  margin-bottom: 0.4rem;
  box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
  gap: 0.75rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.playoff-public-wrapper .game-row.compact .score-block {
  flex: 0 0 auto;
  min-width: 60px;
  padding: 0 0.5rem;
}

@media screen and (max-width: 768px) {
  .wrapper .container.playoff-public-wrapper {
    padding: 0 0 8px;
  }
}

.match-lane-left {
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-muted);
  background: var(--color-match-lane-bg);
  border: 1px solid var(--color-match-lane-border);
  line-height: 1;
}

.match-lane-left--active {
  top: 8px;
  transform: none;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.match-lane-left--finished {
  top: 8px;
  transform: none;
  color: var(--color-match-winner);
  border-color: var(--color-match-winner);
}

.cadrage-public-section {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.cadrage-public-section__title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
  text-align: center;
}

.current-round-card {
  background: var(--color-surface, var(--color-white));
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  min-width: 280px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

@media screen and (max-width: 768px) {
  .current-round-card {
    width: auto;
    padding: 1rem;
  }
}

.round-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.75rem;
  position: relative;
}

.round-header :deep(.team-search) {
  position: absolute;
  right: 0;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.match-group {
  margin-bottom: 0.5rem;
}

.match-group__title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 1rem 0 0.4rem;
}

.match-group:first-child .match-group__title {
  margin-top: 0;
}

.match-item {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 12px 14px 12px 42px;
  border-radius: 14px;
  background: var(--color-surface, var(--color-white));
  border: 1px solid var(--color-border);
  transition:
    background 0.15s,
    border-color 0.15s;
  margin-bottom: 8px;
}

[data-theme='dark'] .match-item--finished,
[data-theme='dark'] .match-item--in-progress,
[data-theme='dark'] .match-item--upcoming {
  background: var(--color-surface) !important;
}

.match-item:hover {
  border-color: var(--color-match-border-hover);
}

.match-item--in-progress {
  border-color: var(--color-match-border-active);
  background: url('@/assets/img/card-bg-active.png') center/cover no-repeat !important;
}

.match-item--finished {
  border-color: var(--color-match-border-finished);
  background: url('@/assets/img/card-bg-finished.png') center/cover no-repeat !important;
}

.match-item--upcoming {
  border-color: var(--color-match-border-upcoming);
  background: url('@/assets/img/card-bg-upcoming.png') center/cover no-repeat !important;
}

.match-team {
  min-width: 0;
  font-weight: 600;
  font-size: 13px;
  color: var(--color-text);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow-wrap: break-word;
  transition: color 0.15s;
}

.match-team--highlighted {
  color: var(--color-primary);
}

.match-item--highlighted {
  background: var(--color-primary-bg) !important;
}

.match-team-right {
  text-align: right;
}

.match-vs {
  text-align: center;
}

.match-lane {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-surface-alt, var(--color-primary-bg));
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 700;
}

.match-score {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
}

.match-score--pending {
  color: var(--color-match-score-pending);
  font-weight: 400;
}

.match-team--winner {
  color: var(--color-match-winner) !important;
  font-weight: 700;
}

.match-status-badge {
  grid-column: 1 / -1;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 0;
}

.match-status-badge--progress {
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.match-progress-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: live-pulse 1.5s ease-in-out infinite;
}

.match-status-badge--finished {
  color: var(--tir-winner-text);
}

.match-status-badge--live {
  color: var(--color-stream-youtube);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
}

.match-live-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-stream-youtube);
  text-decoration: none;
  font-weight: 600;
}

.match-live-link.stream-icon--twitch {
  color: var(--color-stream-twitch);
}

.match-live-link.stream-icon--facebook {
  color: var(--color-stream-facebook);
}

.match-live-link.stream-icon--instagram {
  color: var(--color-stream-instagram);
}

.match-live-link:hover {
  opacity: 0.8;
}

.match-live-label {
  font-weight: 600;
  margin-left: 2px;
}

.match-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-stream-youtube);
  animation: live-pulse 1.5s ease-in-out infinite;
}

@keyframes live-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
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
  color: var(--color-btn-text);
  font-size: 9px;
  font-weight: 700;
}

.score-history__score {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.tabs-content-area {
  background: var(--color-surface, var(--color-white));
  border: 1px solid var(--color-border);
  border-radius: 0 0 12px 12px;
  padding: 16px;
  padding-bottom: 24px;
  min-height: 200px;
  overflow-x: auto;
}

.tabs-content-area:has(.ranking-tooltip) {
  overflow: visible;
}

.tabs-content-area :deep(table) {
  margin: 0 auto;
}

.winner-card {
  background: linear-gradient(
    135deg,
    var(--color-winner-bg-start) 0%,
    var(--color-winner-bg-mid) 50%,
    var(--color-winner-bg-start) 100%
  );
  border: 2px solid var(--color-winner-border);
  border-radius: 16px;
  padding: 28px 24px;
  margin: 12px 0;
  text-align: center;
  position: relative;
  overflow: hidden;
  animation: winner-glow 3s ease-in-out infinite;
}

.winner-card::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200vmax;
  height: 200vmax;
  margin-top: -100vmax;
  margin-left: -100vmax;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    rgb(245 200 66 / 15%) 10%,
    transparent 20%,
    rgb(245 200 66 / 20%) 30%,
    transparent 40%,
    rgb(245 200 66 / 10%) 60%,
    transparent 70%
  );
  animation: winner-shimmer 12s linear infinite;
}

.winner-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 14px;
  padding: 2px;
  background: linear-gradient(135deg, rgb(245 200 66 / 60%), transparent 40%, transparent 60%, rgb(245 200 66 / 60%));
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  /* stylelint-disable-next-line property-no-vendor-prefix */
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: winner-border-shift 3s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes winner-glow {
  0%,
  100% {
    box-shadow:
      0 4px 20px rgb(245 200 66 / 20%),
      inset 0 0 30px rgb(245 200 66 / 5%);
  }

  50% {
    box-shadow:
      0 6px 35px rgb(245 200 66 / 40%),
      inset 0 0 50px rgb(245 200 66 / 8%);
  }
}

@keyframes winner-shimmer {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes winner-border-shift {
  from {
    opacity: 0.5;
  }

  to {
    opacity: 1;
  }
}

.winner-card__trophy {
  color: var(--color-winner-gold);
  margin-bottom: 8px;
  position: relative;
  filter: drop-shadow(0 0 8px rgb(245 200 66 / 40%));
}

.winner-card__title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  background: linear-gradient(
    90deg,
    var(--color-winner-gold-dark),
    var(--color-winner-gold-light),
    var(--color-winner-gold-dark)
  );
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 6px;
  position: relative;
}

.winner-card__team-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-winner-text);
  margin-bottom: 18px;
  position: relative;
  text-shadow: 0 0 20px rgb(245 200 66 / 20%);
}

.winner-card__players {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  position: relative;
}

.winner-card__player {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, rgb(245 200 66 / 8%), rgb(245 200 66 / 3%));
  border: 1px solid rgb(245 200 66 / 20%);
  border-radius: 12px;
  padding: 10px 16px;
  min-width: 180px;
  backdrop-filter: blur(4px);
}

.winner-card__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid rgb(245 200 66 / 30%);
}

.winner-card__avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(245 200 66 / 10%);
  color: var(--color-winner-gold);
}

.winner-card__player-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.winner-card__player-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-winner-player-name);
}

.winner-card__player-club {
  font-size: 12px;
  color: rgb(245 200 66 / 70%);
}
</style>
