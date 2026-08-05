<template>
  <div
    class="match-item public-game-card"
    data-testid="public-game-card"
    :class="{
      'match-item--highlighted': isGameHighlighted,
      'match-item--in-progress': isInProgress,
      'match-item--finished': isFinished,
      'match-item--upcoming': isUpcoming,
    }"
  >
    <span
      class="match-lane-left"
      :class="{
        'match-lane-left--active': isInProgress,
        'match-lane-left--finished': isFinished,
      }"
      >{{ laneNumber }}</span
    >
    <span
      class="match-team match-team-right"
      :class="{
        'match-team--highlighted': isTeamOneHighlighted,
        'match-team--winner': winnerTeam === game.team_1,
      }"
      >{{ formattedTeamOne }}</span
    >
    <span class="match-vs">
      <span v-if="isInProgress || isFinished" class="match-score">
        {{ game.team_1_score ?? 0 }} : {{ game.team_2_score ?? 0 }}
      </span>
      <span v-else class="match-score match-score--pending">-- : --</span>
    </span>
    <span
      class="match-team"
      :class="{
        'match-team--highlighted': isTeamTwoHighlighted,
        'match-team--winner': winnerTeam === game.team_2,
      }"
      >{{ formattedTeamTwo }}</span
    >
    <span v-if="resolvedStreams.length" class="match-status-badge match-status-badge--live">
      <span v-if="isInProgress" class="match-live-dot"></span>
      <span class="match-live-label">{{ isInProgress ? $t('games.live') : $t('games.stream') }}</span>
      <a
        v-for="(streamUrl, streamIndex) in resolvedStreams"
        :key="streamUrl + streamIndex"
        :href="streamUrl"
        target="_blank"
        rel="noopener"
        class="match-live-link"
        :class="streamClass(streamUrl)"
      >
        <component :is="streamIconFor(streamUrl)" :size="16" />
      </a>
    </span>
    <span v-else-if="isInProgress" class="match-status-badge match-status-badge--progress">
      <span class="match-progress-dot"></span>{{ $t('teamPlayoff.matchInProgress') }}
    </span>
    <span v-else-if="isFinished" class="match-status-badge match-status-badge--finished">
      {{ $t('teamPlayoff.matchFinished') }}
    </span>
    <div v-if="scoreHistoryEnabled && game.score_history?.length" class="score-history">
      <span v-for="(entry, index) in game.score_history" :key="index" class="score-history__chip">
        <span class="score-history__num">{{ index + 1 }}</span>
        <span class="score-history__score">{{ entry.s1 }}-{{ entry.s2 }}</span>
      </span>
    </div>
  </div>
</template>

<script>
import { Twitch, Facebook, Instagram, Video } from 'lucide-vue-next';
import YoutubeIcon from '@/components/icons/YoutubeIcon.vue';
import { getGameStreams, getStreamIconClass, getStreamIconComponent } from '@/services/streams';

export default {
  name: 'PublicGameCard',
  components: { YoutubeIcon, Twitch, Facebook, Instagram, Video },
  props: {
    game: { type: Object, required: true },
    laneNumber: { type: [Number, String], default: '' },
    highlightedTeam: { type: String, default: '' },
    teamClubMap: { type: Object, default: () => ({}) },
    streamUrls: { type: Array, default: null },
    tournament: { type: Object, default: null },
    gameIndex: { type: Number, default: 0 },
    scoreHistoryEnabled: { type: Boolean, default: false },
    teamNameFormatter: { type: Function, default: (name) => name || '' },
    tournamentFinished: { type: Boolean, default: false },
  },
  computed: {
    effectiveStatus() {
      return this.game.status || 'not_started';
    },
    isFinished() {
      return this.tournamentFinished || this.effectiveStatus === 'finished';
    },
    isInProgress() {
      return !this.isFinished && this.effectiveStatus === 'in_progress';
    },
    isUpcoming() {
      return !this.isFinished && !this.isInProgress;
    },
    winnerTeam() {
      if (!this.isFinished) return null;

      // Newer records persist the winner. Legacy records fall back to numeric scores.
      if (this.game.winner === this.game.team_1 || this.game.winner === this.game.team_2) {
        return this.game.winner;
      }

      if (!this.hasScore(this.game.team_1_score) || !this.hasScore(this.game.team_2_score)) return null;
      const teamOneScore = Number(this.game.team_1_score);
      const teamTwoScore = Number(this.game.team_2_score);
      if (!Number.isFinite(teamOneScore) || !Number.isFinite(teamTwoScore) || teamOneScore === teamTwoScore) {
        return null;
      }
      return teamOneScore > teamTwoScore ? this.game.team_1 : this.game.team_2;
    },
    isTeamOneHighlighted() {
      return this.isTeamHighlighted(this.game.team_1);
    },
    isTeamTwoHighlighted() {
      return this.isTeamHighlighted(this.game.team_2);
    },
    isGameHighlighted() {
      return this.isTeamOneHighlighted || this.isTeamTwoHighlighted;
    },
    formattedTeamOne() {
      return this.teamNameFormatter(this.game.team_1);
    },
    formattedTeamTwo() {
      return this.teamNameFormatter(this.game.team_2);
    },
    resolvedStreams() {
      const streams =
        this.streamUrls || (this.tournament ? getGameStreams(this.game, this.tournament, this.gameIndex) : []);
      return [...new Set(streams.filter((url) => this.isSafeStreamUrl(url)))];
    },
  },
  methods: {
    streamIconFor: getStreamIconComponent,
    streamClass: getStreamIconClass,
    hasScore(score) {
      return score !== null && score !== undefined && score !== '';
    },
    isTeamHighlighted(teamName) {
      const query = String(this.highlightedTeam || '')
        .trim()
        .toLocaleLowerCase();
      if (!query) return false;
      const team = String(teamName || '').toLocaleLowerCase();
      const club = String(this.teamClubMap?.[teamName] || '').toLocaleLowerCase();
      return team.includes(query) || club.includes(query);
    },
    isSafeStreamUrl(url) {
      if (typeof url !== 'string') return false;
      try {
        const parsed = new globalThis.URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
  },
};
</script>
