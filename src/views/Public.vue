<template>
  <PageLoader v-if="isLoading" />
  <PublicPageShell
    v-else
    class="wrapper"
    container-size="responsive"
    :textured="activeTournamentView?.system !== 'tir'"
    :class="[{ 'wrapper--tir': activeTournamentView?.system === 'tir' }]"
  >
    <div v-if="colorSchema" class="public-schema-header__nav">
      <router-link class="navbar-item" to="/">
        <img src="../assets/img/logo.webp" alt="logo" />
      </router-link>
      <LanguageSwitcher />
    </div>
    <div v-if="colorSchema" class="public-sponsors">
      <div class="public-sponsors__marquee">
        <img src="../assets/img/tv-sponsors.png" alt="" class="public-sponsors__img" />
        <img src="../assets/img/tv-sponsors.png" alt="" class="public-sponsors__img" />
        <img src="../assets/img/tv-sponsors.png" alt="" class="public-sponsors__img" />
        <img src="../assets/img/tv-sponsors.png" alt="" class="public-sponsors__img" />
      </div>
    </div>
    <div v-if="tournament" class="container">
      <div v-if="!colorSchema" class="is-flex is-justify-content-space-between is-align-items-center">
        <router-link class="navbar-item" to="/">
          <img src="../assets/img/logo.webp" alt="logo" />
        </router-link>
        <div class="is-flex is-align-items-center" style="gap: 4px">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
      <div class="text-center is-size-3 tournament-title-wrapper">
        <strong>{{ tournamentMetadata.name }}</strong>
      </div>
      <div class="tournament-info-card mt-3 mb-3" :class="{ 'tournament-info-card--with-switcher': hasTournamentB }">
        <GroupSwitcher
          v-if="hasTournamentB"
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
        <div class="tournament-info-row" v-if="activeTournamentView?.playOff || isDoubleElimination">
          <span class="has-text-grey-dark">{{ $t('games.playOff') }}:</span>
          <span class="has-text-weight-semibold">{{ playOffTeamsCount }} {{ $t('common.teamsLabel') }}</span>
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
      <div v-if="isFinished && runnerUpTeams.length === 2" class="podium-runners">
        <div class="podium-runner podium-runner--silver">
          <div class="podium-runner__header">
            <Medal :size="24" class="podium-runner__medal" />
            <span class="podium-runner__place">2</span>
          </div>
          <div class="podium-runner__team-name">{{ runnerUpTeams[0].title }}</div>
          <div v-if="runnerUpTeams[0].players && runnerUpTeams[0].players.length" class="podium-runner__players">
            <div v-for="(p, i) in runnerUpTeams[0].players" :key="i" class="podium-runner__player">
              <img v-if="p.avatar_url" :src="p.avatar_url" class="podium-runner__avatar" alt="" />
              <div v-else class="podium-runner__avatar podium-runner__avatar--placeholder">
                <Users :size="14" />
              </div>
              <div class="podium-runner__player-info">
                <span class="podium-runner__player-name">{{ p.surname }} {{ p.name }}</span>
                <span v-if="p.club" class="podium-runner__player-club">{{ p.club }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="podium-runner podium-runner--bronze">
          <div class="podium-runner__header">
            <Medal :size="24" class="podium-runner__medal" />
            <span class="podium-runner__place">3</span>
          </div>
          <div class="podium-runner__team-name">{{ runnerUpTeams[1].title }}</div>
          <div v-if="runnerUpTeams[1].players && runnerUpTeams[1].players.length" class="podium-runner__players">
            <div v-for="(p, i) in runnerUpTeams[1].players" :key="i" class="podium-runner__player">
              <img v-if="p.avatar_url" :src="p.avatar_url" class="podium-runner__avatar" alt="" />
              <div v-else class="podium-runner__avatar podium-runner__avatar--placeholder">
                <Users :size="14" />
              </div>
              <div class="podium-runner__player-info">
                <span class="podium-runner__player-name">{{ p.surname }} {{ p.name }}</span>
                <span v-if="p.club" class="podium-runner__player-club">{{ p.club }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- TIR: single view, no tabs -->
      <TirPublicView v-if="activeTournamentView?.system === 'tir'" :tournament="activeTournamentView" class="mt-3" />

      <!-- Other systems: tabs -->
      <template v-else>
        <TournamentNav v-model="activeTab" :tabs="tabs" />
        <div
          id="tournament-tabpanel"
          class="tabs-content-area"
          role="tabpanel"
          :aria-labelledby="`tab-${activeTab}`"
          :class="{
            'tabs-content-area--playoff':
              activeTab === 'round' && (activeTournamentView?.playOff || isDoubleElimination),
          }"
        >
          <div v-if="activeTab === 'round'">
            <TeamPlayoff v-if="activeTournamentView?.teamPlayoff" :read-only="true" />
            <PlayOff
              v-else-if="activeTournamentView?.playOff || isDoubleElimination"
              ref="playOff"
              :active-tournament="activeTournamentView"
              :is-public-view="true"
              :hide-header="true"
              :matches-only="isDoubleElimination"
              @openResults="activeTab = 'ranking'"
              class="playoff-public-wrapper"
            />
            <template v-else>
              <div class="round-header">
                <span v-if="activeTournamentView?.cadrage">{{ $t('games.cadrage') }}</span>
                <span v-else
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
                :remaining-ms="activeTournamentView.roundTimer.remainingMs || 0"
                :cochonettes-enabled="!!activeTournamentView.preferences.timeLimitEnabled"
                :cochonettes="activeTournamentView.preferences.cochonettes || 1"
                :read-only="true"
                class="mb-3"
              />
              <div v-if="activeTournamentView?.cadrage" class="match-list">
                <PublicGameCard
                  v-for="(game, index) in activeTournamentView.cadrage"
                  :key="'cadrage-' + index"
                  :game="game"
                  :lane-number="displayLane(game, index)"
                  :highlighted-team="highlightedTeam"
                  :team-club-map="teamClubMap"
                  :tournament="activeTournamentView"
                  :game-index="index"
                  :score-history-enabled="!!activeTournamentView.preferences?.cochonettesEnabled"
                  :team-name-formatter="formatTeamName"
                />
              </div>
              <div v-else class="match-list">
                <template v-if="activeTournamentView?.groups && activeTournamentView.groups.length > 1">
                  <div v-for="(group, gIdx) in groupedCurrentGames" :key="gIdx" class="match-group">
                    <h4 class="match-group__title">{{ $t('common.group') }} {{ groupLabels[gIdx] }}</h4>
                    <PublicGameCard
                      v-for="(game, index) in group"
                      :key="index"
                      :game="game"
                      :lane-number="game._lane"
                      :highlighted-team="highlightedTeam"
                      :team-club-map="teamClubMap"
                      :tournament="activeTournamentView"
                      :game-index="game._laneIndex"
                      :score-history-enabled="!!activeTournamentView.preferences?.cochonettesEnabled"
                      :team-name-formatter="formatTeamName"
                    />
                  </div>
                </template>
                <PublicGameCard
                  v-for="(game, index) in activeTournamentView.games[activeRound - 1]"
                  v-else
                  :key="index"
                  :game="game"
                  :lane-number="displayLane(game, index)"
                  :highlighted-team="highlightedTeam"
                  :team-club-map="teamClubMap"
                  :tournament="activeTournamentView"
                  :game-index="index"
                  :score-history-enabled="!!activeTournamentView.preferences?.cochonettesEnabled"
                  :team-name-formatter="formatTeamName"
                />
              </div>
            </template>
          </div>
          <DoubleElimination
            v-if="activeTab === 'bracket' && isDoubleElimination"
            :active-tournament="activeTournamentView"
            :is-public-view="true"
            :bracket-only="true"
            class="playoff-public-wrapper"
          />
          <Bracket
            v-else-if="activeTab === 'bracket' && hasPlayoffBracket"
            :bracket="activeTournamentView.playOffBracket"
            :embedded="true"
            class="playoff-public-wrapper"
          />
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
            :hide-bracket-button="hasPlayoffBracket"
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
  </PublicPageShell>
</template>

<script>
import Ranking from '@/components/partials/Ranking';
import Results from '@/components/partials/Results';
import TeamsList from '@/components/partials/TeamsList';
import { getTeamsRanking, getTournamentRanking, pluralizeRounds, tournamentNames } from '@/helpers';
import { getGameLaneNumber } from '@/services/lanes';
import {
  getActiveRound,
  getCadragePlaceRange,
  getPhaseLabel,
  getPlayoffParticipantCount,
  getSystemDescription,
  getTournamentBadge,
  getTournamentExtras,
  isFinale as computeIsFinale,
  isInPlayoff as computeIsInPlayoff,
  isTournamentFinished,
  isTournamentStarted,
  splitTournamentMessage,
} from '@/services/tournament-presentation';
import PlayOff from '@/components/partials/PlayOff.vue';
import DoubleElimination from '@/components/partials/DoubleElimination.vue';
import Bracket from '@/components/partials/Bracket.vue';
import TeamPlayoff from '@/components/partials/TeamPlayoff.vue';
import LanguageSwitcher from '@/components/partials/LanguageSwitcher.vue';
import ThemeSwitcher from '@/components/partials/ThemeSwitcher.vue';
import Footer from '@/components/partials/Footer.vue';
import { GitFork, X } from 'lucide-vue-next';
import TeamSearch from '@/components/partials/TeamSearch.vue';
import TirPublicView from '@/components/tir/TirPublicView.vue';
import RoundTimer from '@/components/partials/RoundTimer.vue';
import GroupSwitcher from '@/components/partials/GroupSwitcher.vue';
import PublicGameCard from '@/components/partials/PublicGameCard.vue';
import { Users, List, Trophy as TrophyIcon, PlayCircle, Medal } from 'lucide-vue-next';
import { getTournamentGroup, getTournamentMetadata, hasTournamentGroup } from '@/services/tournament-record';
import { createLiveTournamentSource } from '@/services/live-tournament';
import { resolveTournamentSource } from '@/services/tournament-ref';
import PageLoader from '@/components/ui/PageLoader.vue';
import PublicPageShell from '@/components/ui/PublicPageShell.vue';
import TournamentNav from '@/components/ui/TournamentNav.vue';
export default {
  name: 'Public',
  components: {
    PageLoader,
    PublicPageShell,
    TournamentNav,
    Footer,
    LanguageSwitcher,
    ThemeSwitcher,
    PlayOff,
    DoubleElimination,
    Bracket,
    TeamPlayoff,
    TeamsList,
    Results,
    Ranking,
    X,
    TeamSearch,
    TirPublicView,
    RoundTimer,
    GroupSwitcher,
    PublicGameCard,
    Users,
    TrophyIcon,
    Medal,
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
      liveStatus: 'idle',
      liveError: null,
    };
  },
  mounted() {
    this._liveTournamentSource = createLiveTournamentSource({
      profile: 'public',
      onState: ({ status, record, error }) => {
        this.liveStatus = status;
        this.liveError = error;
        this.isLoading = status === 'loading';
        this.tournament = record;
      },
    });
    this.getInfo();
  },
  beforeUnmount() {
    this._liveTournamentSource?.stop();
  },
  watch: {
    '$route.fullPath'() {
      this.getInfo();
    },
    isLoading(val) {
      if (!val && !this.tournament) {
        import('@/assets/img/girl.avif').then((m) => {
          this.girlImage = m.default;
        });
      }
    },
    tabs(newTabs, oldTabs) {
      const hasRound = newTabs.some((t) => t.id === 'round');
      const hadRound = oldTabs?.some((t) => t.id === 'round');
      if (hasRound && !hadRound) {
        this.activeTab = 'round';
      } else if (!newTabs.find((t) => t.id === this.activeTab)) {
        this.activeTab = newTabs[0]?.id || 'teams';
      }
    },
    showCurrentRound: {
      handler(val) {
        if (val) {
          this.activeTab = 'round';
        } else if (this.activeTab === 'round') {
          this.activeTab = 'ranking';
        }
      },
      immediate: true,
    },
  },
  computed: {
    tabs() {
      const t = this.activeTournamentView;
      const isPlayoffOnly = t?.system === 'playoff' || (t?.playOff && !t?.games?.length);
      const list = [];
      if (this.showCurrentRound) {
        let roundLabel;
        if (t?.playOff || t?.teamPlayoff) roundLabel = this.$t('games.playOff');
        else if (t?.cadrage) roundLabel = this.$t('games.cadrage');
        else roundLabel = `${this.$t('common.round')} ${this.activeRound}`;
        list.push({ id: 'round', label: roundLabel, icon: PlayCircle });
      }
      if (this.hasPlayoffBracket) {
        list.push({ id: 'bracket', label: this.$t('doubleElimination.bracketTab'), icon: GitFork });
      }
      list.push({ id: 'teams', label: this.$t('teams.teams'), icon: Users });
      if (!isPlayoffOnly) {
        list.push({ id: 'ranking', label: this.$t('teams.ranking'), icon: TrophyIcon });
      }
      list.push({ id: 'results', label: this.$t('teams.results'), icon: List });
      return list;
    },
    showCurrentRound() {
      const t = this.activeTournamentView;
      if (this.isDoubleElimination) return true;
      if (t?.cadrage && !t.tournamentIsFinished) return true;
      if ((t?.playOff || t?.teamPlayoff) && !t.tournamentIsFinished && t.system !== 'tir') return true;
      return t?.games && t.roundIsActive && !t.tournamentIsFinished && t.system !== 'tir';
    },
    isDoubleElimination() {
      return this.activeTournamentView?.playOffBracket?.format === 'double';
    },
    hasPlayoffBracket() {
      return !!this.activeTournamentView?.playOffBracket?.stages?.length;
    },
    activeRound() {
      return getActiveRound(this.activeTournamentView);
    },
    activeTournamentView() {
      return getTournamentGroup(this.tournament, this.publicActiveGroup);
    },
    tournamentMetadata() {
      return getTournamentMetadata(this.tournament);
    },
    hasTournamentB() {
      return hasTournamentGroup(this.tournament, 'B');
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
        grouped[g].push({
          ...game,
          _laneIndex: idx,
          _lane: getGameLaneNumber(game, t, idx),
        });
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
    runnerUpTeams() {
      const t = this.activeTournamentView;
      if (!this.isFinished || !t?.teams) return [];
      const tournamentRanking = getTournamentRanking(t, this.rankingTeams);
      if (!tournamentRanking || tournamentRanking.length < 3) return [];
      return tournamentRanking.slice(1, 3).map((entry) => {
        const team = t.teams.find((tm) => tm.title === entry.title);
        return {
          title: entry.title,
          players: team?.players || null,
          club: team?.players?.length === 1 ? team.players[0].club : null,
        };
      });
    },
    tournamentSource() {
      return resolveTournamentSource(this.$route);
    },
    userId() {
      return this.tournamentSource.type === 'firebase' ? this.tournamentSource.ownerUid : null;
    },
    tournamentId() {
      return this.tournamentSource.type === 'firebase' ? this.tournamentSource.tournamentId : null;
    },
    colorSchema() {
      return this.activeTournamentView?.preferences?.colorSchema || '';
    },
    tournamentMessageLines() {
      return splitTournamentMessage(this.tournamentMetadata.tournamentMessage);
    },
    isFinished() {
      return isTournamentFinished(this.activeTournamentView);
    },
    isStarted() {
      return isTournamentStarted(this.activeTournamentView);
    },
    groupTotalRoundsDisplay() {
      const t = this.activeTournamentView;
      const perCircle = t?.preferences?.groupTotalRounds;
      if (!perCircle) return null;
      const circles = t.roundRobinCircle || 1;
      return perCircle * circles;
    },
    badgeClass() {
      const badge = getTournamentBadge(this.activeTournamentView);
      return badge === 'finished' ? 'badge-finished' : badge === 'not-started' ? 'badge-not-started' : 'badge-active';
    },
    badgeLabel() {
      const phase = getPhaseLabel(this.activeTournamentView);
      if (phase === 'finished') return this.$t('common.finished');
      if (phase === 'not-started') return this.$t('common.notStarted');
      if (phase === 'playoff') return this.$t('games.playOff');
      if (phase === 'cadrage') return this.$t('games.cadrage');
      if (phase === 'final') return this.$t('games.final');
      if (phase === 'semifinal') return this.$t('tir.semifinal');
      if (phase === 'quarterfinal') return this.$t('tir.quarterfinal');
      if (phase.startsWith('tir-round-')) return this.$t('tir.round') + ' ' + phase.slice(10);
      if (phase.startsWith('round-')) return `${this.$t('common.round')} ${phase.slice(6)}`;
      return this.$t('common.active');
    },
    systemDescription() {
      return getSystemDescription(this.activeTournamentView, this.$i18n.locale, {
        swiss: this.$t('ranking.swiss'),
        playOff: this.$t('games.playOff').toLowerCase(),
        poulesBarrage: this.$t('games.poulesBarrage').toLowerCase(),
        systemLabel: this.$t('teams.' + (this.activeTournamentView?.system || 'swiss')),
        tir: this.$t('teams.tir'),
        twoRoundsShort: this.$t('tir.twoRoundsShort'),
        system_groups: this.$t('teams.groups'),
        system_poules: this.$t('teams.poules'),
        system_supermele: this.$t('teams.supermele'),
      });
    },
    cadrageRange() {
      const range = getCadragePlaceRange(this.activeTournamentView);
      if (!range) return '';
      return `${range.from}-${range.to} ${this.$t('common.places')}`;
    },
    playOffTeamsCount() {
      return getPlayoffParticipantCount(this.activeTournamentView);
    },
    isInPlayoff() {
      return computeIsInPlayoff(this.activeTournamentView);
    },
    tournamentExtrasLine() {
      const extras = getTournamentExtras(this.activeTournamentView);
      if (!extras.time) return '';
      const parts = [];
      if (extras.time === 'no-limit-finale') {
        parts.push(this.$t('modals.noTimeLimitFinale'));
      } else {
        parts.push(`${extras.time} ${this.$t('modals.min')}`);
      }
      if (extras.cochonettes) {
        parts.push(
          `+ ${extras.cochonettes} ${extras.cochonettes === 1 ? this.$t('common.cochonette') : this.$t('common.cochonettes')}`,
        );
      }
      return parts.join(' ');
    },
    isFinale() {
      return computeIsFinale(this.activeTournamentView);
    },
    showPublicTimer() {
      const t = this.activeTournamentView;
      const rt = t?.roundTimer;
      return rt && ['running', 'paused', 'ended'].includes(rt.timerStatus);
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
    displayLane(game, index) {
      return getGameLaneNumber(game, this.activeTournamentView, index);
    },
    formatTeamName(name) {
      if (!name) return '';
      const parts = name.trim().split(/\s+/);
      if (parts.length <= 1) return name;
      const surname = parts[0];
      if (surname.length >= 11) return surname;
      return name;
    },
    pluralizeRounds(n) {
      return pluralizeRounds(n, this.$i18n.locale);
    },
    getInfo() {
      return this._liveTournamentSource?.start(this.tournamentSource);
    },
  },
};
</script>
<style>
.public-schema-header__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 1rem;
  background: #fff;
  border-bottom: 1px solid white;
  position: relative;
  z-index: 201;
}

.public-sponsors {
  height: 60px;
  overflow: hidden;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 200;
}

.public-sponsors__marquee {
  display: flex;
  gap: 0;
  width: max-content;
  animation: public-sponsors-scroll 50s linear infinite;
}

.public-sponsors__marquee img {
  display: block;
  margin: 0 -1px;
}

.public-sponsors__img {
  height: 60px;
  width: auto;
  flex-shrink: 0;
}

@keyframes public-sponsors-scroll {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}

.tournament-title-wrapper {
  position: relative;
  font-size: 1.5rem !important;
  margin-top: 1rem;
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
  background: var(--color-surface, #fff);
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

.wrapper--tir {
  background: var(--color-body-bg);
}

.wrapper--tir .tournament-info-card {
  margin-left: 10px;
  margin-right: 10px;
}

.wrapper .navbar {
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

.round-header .team-search {
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

.tabs-content-area {
  background: var(--color-surface, #fff);
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

.tabs-content-area--playoff {
  overflow: visible;
}

.tabs-content-area table {
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

.podium-runners {
  display: flex;
  gap: 10px;
  margin: 0 0 12px;
}

.podium-runner {
  flex: 1;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.podium-runner--silver {
  background: linear-gradient(135deg, #2a2d35 0%, #3a3d45 50%, #2a2d35 100%);
  border: 2px solid #aaa;
  box-shadow:
    0 4px 20px rgb(192 192 192 / 20%),
    inset 0 0 30px rgb(192 192 192 / 5%);
}

.podium-runner--bronze {
  background: linear-gradient(135deg, #2d2520 0%, #3d3025 50%, #2d2520 100%);
  border: 2px solid #cd7f32;
  box-shadow:
    0 4px 20px rgb(205 127 50 / 20%),
    inset 0 0 30px rgb(205 127 50 / 5%);
}

.podium-runner__header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 6px;
}

.podium-runner--silver .podium-runner__medal {
  color: #c0c0c0;
  filter: drop-shadow(0 0 6px rgb(192 192 192 / 40%));
}

.podium-runner--bronze .podium-runner__medal {
  color: #cd7f32;
  filter: drop-shadow(0 0 6px rgb(205 127 50 / 40%));
}

.podium-runner__place {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.podium-runner--silver .podium-runner__place {
  color: #c0c0c0;
}

.podium-runner--bronze .podium-runner__place {
  color: #cd7f32;
}

.podium-runner__team-name {
  font-size: 18px;
  font-weight: 700;
  color: #f5f5f5;
  margin-bottom: 12px;
}

.podium-runner__players {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.podium-runner__player {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  padding: 8px 12px;
  min-width: 150px;
  backdrop-filter: blur(4px);
}

.podium-runner--silver .podium-runner__player {
  background: linear-gradient(135deg, rgb(192 192 192 / 10%), rgb(192 192 192 / 4%));
  border: 1px solid rgb(192 192 192 / 25%);
}

.podium-runner--bronze .podium-runner__player {
  background: linear-gradient(135deg, rgb(205 127 50 / 10%), rgb(205 127 50 / 4%));
  border: 1px solid rgb(205 127 50 / 25%);
}

.podium-runner__avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.podium-runner--silver .podium-runner__avatar {
  border: 2px solid rgb(192 192 192 / 40%);
}

.podium-runner--bronze .podium-runner__avatar {
  border: 2px solid rgb(205 127 50 / 40%);
}

.podium-runner__avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.podium-runner--silver .podium-runner__avatar--placeholder {
  background: rgb(192 192 192 / 12%);
  color: #c0c0c0;
}

.podium-runner--bronze .podium-runner__avatar--placeholder {
  background: rgb(205 127 50 / 12%);
  color: #cd7f32;
}

.podium-runner__player-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.podium-runner__player-name {
  font-weight: 600;
  font-size: 13px;
  color: #eee;
}

.podium-runner__player-club {
  font-size: 11px;
}

.podium-runner--silver .podium-runner__player-club {
  color: rgb(192 192 192 / 70%);
}

.podium-runner--bronze .podium-runner__player-club {
  color: rgb(205 127 50 / 70%);
}

@media screen and (max-width: 768px) {
  .podium-runners {
    flex-direction: column;
  }

  .podium-runner {
    padding: 16px;
  }

  .podium-runner__team-name {
    font-size: 16px;
    margin-bottom: 10px;
  }
}
</style>
