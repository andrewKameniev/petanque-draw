<template>
  <div class="tir-module">
    <TournamentNav
      v-model="view"
      variant="tir"
      :tabs="navigationTabs"
      :label="$t('common.tournamentSections')"
      panel-id="tir-public-tabpanel"
      id-prefix="tir-public-tab"
      @change="changeView"
    />

    <div id="tir-public-tabpanel" role="tabpanel" :aria-labelledby="`tir-public-tab-${view}`">
      <!-- Participants view — scoring page style, read-only -->
      <div v-if="view === 'participants'">
        <TirParticipantsList ref="participantsList" :tournament="tournament" :readOnly="true" />
      </div>

      <!-- Table view — qualification ranking -->
      <div v-if="view === 'table'" class="tir-table">
        <div v-if="rankedParticipants.length" class="tir-table__scroll">
          <table class="tir-table__content">
            <thead>
              <tr v-if="isTwoRoundSystem">
                <th class="tir-table__sticky-col">#</th>
                <th class="tir-table__sticky-col tir-table__sticky-col--name">
                  {{ $t('tir.participant') }}
                </th>
                <th>{{ $t('tir.round1Score') }}</th>
                <th v-for="i in tiebreakerCount" :key="'exh' + i">EX{{ i }}</th>
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
              <tr v-for="(row, index) in publicTableRows" :key="row.id" :class="row.rowClass">
                <td class="tir-table__sticky-col">{{ index + 1 }}</td>
                <td class="tir-table__sticky-col tir-table__sticky-col--name">
                  <button type="button" class="tir-table__clickable" @click="openFromTable(row.id)">
                    <img
                      v-if="getParticipantAvatar(row.name)"
                      :src="getParticipantAvatar(row.name)"
                      class="tir-table__avatar"
                      alt=""
                    />
                    <span>{{ row.name }}</span>
                  </button>
                </td>
                <td :class="{ 'tir-table__muted': row.r1 === '—' }">{{ row.r1 }}</td>
                <td v-for="i in tiebreakerCount" :key="'ex' + i">
                  {{ getTiebreakerScoreForTable(row.id, i) }}
                </td>
                <td v-if="currentRound >= 2" :class="{ 'tir-table__muted': row.r2 === '—' }">
                  {{ row.r2 }}
                </td>
                <td v-if="currentRound >= 2" :class="{ 'tir-table__muted': row.combined === '—' }">
                  <strong>{{ row.combined }}</strong>
                </td>
                <td v-if="playoffHasQf">{{ row.qf }}</td>
                <td v-if="playoffHasSf">{{ row.sf }}</td>
                <td v-if="playoffHasFinal">{{ row.final }}</td>
                <td>{{ row.place }}</td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr
                v-for="(participant, index) in rankedParticipants"
                :key="participant.id || index"
                :class="{ 'tir-table__row--qualified': isQualified(participant) }"
              >
                <td>{{ index + 1 }}</td>
                <td class="tir-table__name-cell">
                  <img
                    v-if="getParticipantAvatar(participant.name)"
                    :src="getParticipantAvatar(participant.name)"
                    class="tir-table__avatar"
                    alt=""
                  />
                  <span>{{ participant.name }}</span>
                </td>
                <td>
                  <strong>{{ getTotal(participant) }}</strong> / {{ maxTotal }}
                </td>
                <td>{{ getThrows(participant) }} / {{ totalThrows }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="tir-table__empty">{{ $t('tir.noParticipants') }}</div>
      </div>

      <!-- Playoff view -->
      <div v-if="view === 'playoff' && tournament.tirPlayoff" class="tir-playoff">
        <!-- Match comparison detail -->
        <TirPlayoffComparison
          v-if="activePlayoffMatch"
          :match="activePlayoffMatch"
          :ateliers="atelierObjects"
          :distances="distances"
          :roundLabel="activePlayoffMatchLabel"
          @back="activePlayoffMatchKey = null"
        />

        <!-- Bracket view -->
        <template v-else>
          <div class="tir-playoff__timeline">
            <div
              v-for="(round, rIdx) in playoffDisplayRounds"
              :key="rIdx"
              class="tir-playoff__round"
              :class="{ 'tir-playoff__round--final': round.isFinal }"
            >
              <div class="tir-playoff__progress">
                <span
                  class="tir-playoff__progress-dot"
                  :class="{
                    'tir-playoff__progress-dot--complete':
                      !round.isPreview && round.matches.every((m) => isMatchComplete(m)),
                    'tir-playoff__progress-dot--final': round.isFinal,
                  }"
                ></span>
                <span v-if="rIdx < playoffDisplayRounds.length - 1" class="tir-playoff__progress-line"></span>
              </div>
              <div class="tir-playoff__round-content">
                <h4 class="tir-playoff__round-title">{{ round.title }}</h4>
                <button
                  v-for="(match, mIdx) in round.matches"
                  :key="mIdx"
                  type="button"
                  class="tir-playoff__match"
                  :class="{
                    'tir-playoff__match--complete': isMatchComplete(match),
                    'tir-playoff__match--in-progress':
                      !isMatchComplete(match) && !match.preview && (match.score1 != null || match.score2 != null),
                    'tir-playoff__match--pending': !match.player1 || !match.player2,
                    'tir-playoff__match--preview': match.preview,
                    'tir-playoff__match--final': round.isFinal,
                  }"
                  :disabled="match.preview"
                  @click="openPlayoffMatch(match, round.title, round.key, mIdx)"
                >
                  <span class="tir-playoff__match-top">
                    <span class="tir-playoff__match-num">{{
                      round.laneStart ? round.laneStart + mIdx : mIdx + 1
                    }}</span>
                    <span
                      v-if="isMatchComplete(match)"
                      class="tir-playoff__match-status tir-playoff__match-status--complete"
                      >{{ $t('tir.matchCompleted') }}</span
                    >
                    <span
                      v-else-if="!match.preview && (match.score1 != null || match.score2 != null)"
                      class="tir-playoff__match-status tir-playoff__match-status--progress"
                      >{{ $t('tir.matchInProgress') }}</span
                    >
                  </span>
                  <span class="tir-playoff__match-row">
                    <span
                      class="tir-playoff__player-name"
                      :class="{
                        'tir-playoff__player-name--winner': getMatchWinner(match) === match.player1,
                      }"
                    >
                      <Trophy
                        v-if="getMatchWinner(match) === match.player1"
                        :size="12"
                        class="tir-playoff__winner-icon"
                      />
                      <span v-html="formatName(match.preview ? match.previewLabel1 : match.player1)"></span>
                    </span>
                    <span
                      class="tir-playoff__score"
                      :class="{
                        'tir-playoff__score--winner': getMatchWinner(match) === match.player1,
                      }"
                      >{{ match.score1 !== null ? match.score1 : '—' }}</span
                    >
                    <span class="tir-playoff__vs">vs</span>
                    <span
                      class="tir-playoff__score"
                      :class="{
                        'tir-playoff__score--winner': getMatchWinner(match) === match.player2,
                      }"
                      >{{ match.score2 !== null ? match.score2 : '—' }}</span
                    >
                    <span
                      class="tir-playoff__player-name tir-playoff__player-name--right"
                      :class="{
                        'tir-playoff__player-name--winner': getMatchWinner(match) === match.player2,
                      }"
                    >
                      <span v-html="formatName(match.preview ? match.previewLabel2 : match.player2)"></span>
                      <Trophy
                        v-if="getMatchWinner(match) === match.player2"
                        :size="12"
                        class="tir-playoff__winner-icon"
                      />
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- CTA to final table -->
          <button type="button" class="tir-playoff__cta" @click="goToTable">
            <TableProperties :size="18" />
            <span>{{ $t('tir.goToFinalTable') }}</span>
            <ChevronRight :size="18" />
          </button>
        </template>
      </div>

      <TirProtocol
        v-if="view === 'protocol'"
        :tournament="tournament"
        :tournament-meta="protocolTournamentMeta"
        :skip-gate="true"
        :hide-close="true"
      />
    </div>
  </div>
</template>

<script>
import { Users, TableProperties, Trophy, ChevronRight, FileText } from 'lucide-vue-next';
import TirPlayoffComparison from './TirPlayoffComparison.vue';
import TirParticipantsList from './TirParticipantsList.vue';
import TirProtocol from './TirProtocol.vue';
import TournamentNav from '@/components/ui/TournamentNav.vue';

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
  getTiebreakerKey,
  buildTableRows,
  rankWithTiebreakers,
  getR2QualifiersWithTies,
  getTirPlayoffDisplayRounds,
} from '@/services/tir';

export default {
  name: 'TirPublicView',
  components: {
    TableProperties,
    Trophy,
    ChevronRight,
    TirPlayoffComparison,
    TirParticipantsList,
    TirProtocol,
    TournamentNav,
  },
  props: {
    tournament: { type: Object, required: true },
    protocolAvailable: { type: Boolean, default: false },
    protocolTournamentMeta: { type: Object, default: null },
  },
  data() {
    return {
      view: 'participants',
      activePlayoffMatchKey: null,
      activePlayoffMatchLabel: '',
      activeBracket: 'r2',
    };
  },
  created() {
    if (!this.isTwoRoundSystem) {
      this.activeBracket = 'r1';
      if (this.tournament.tirPlayoff) this.view = 'playoff';
    } else if (this.tournament.tirPlayoff) {
      this.view = 'playoff';
      const tabs = this.bracketTabs;
      if (tabs.length) this.activeBracket = tabs[tabs.length - 1].key;
    } else if (this.currentRound === 2) {
      this.activeBracket = 'r2';
    } else {
      this.activeBracket = 'r1';
    }
  },
  watch: {
    'tournament.tirPlayoff'(val, oldVal) {
      if (val && !oldVal) this.view = 'playoff';
    },
  },
  computed: {
    navigationTabs() {
      const tabs = [
        { id: 'participants', label: this.$t('tir.participants'), icon: Users },
        { id: 'table', label: this.$t('tir.table'), icon: TableProperties },
      ];
      if (this.tournament.tirPlayoff) {
        tabs.push({ id: 'playoff', label: this.$t('games.playOff'), icon: Trophy });
      }
      if (this.protocolAvailable) {
        tabs.push({ id: 'protocol', label: this.$t('teams.protocol'), icon: FileText });
      }
      return tabs;
    },
    isTwoRoundSystem() {
      return this.tournament.tirConfig?.rounds === 2;
    },
    tiebreakerCount() {
      return this.tournament.tirTiebreakerCount || 0;
    },
    currentRound() {
      return this.tournament.tirRound || 1;
    },
    isJunior() {
      return !!this.tournament.tirConfig?.junior;
    },
    distances() {
      return this.isJunior ? DISTANCES_JUNIOR : DISTANCES_FULL;
    },
    totalThrows() {
      return 5 * this.distances.length;
    },
    maxAtelierScore() {
      return this.distances.length * SCORING.carreau;
    },
    maxTotal() {
      return 5 * this.maxAtelierScore;
    },
    atelierObjects() {
      return ATELIER_KEYS.map((key) => ({
        name: this.$t(`tir.${key}`),
        description: this.$t(`tir.${key}Desc`),
      }));
    },
    activePlayoffMatch() {
      if (!this.activePlayoffMatchKey) return null;
      const playoff = this.tournament.tirPlayoff;
      if (!playoff) return null;
      const [type, idx] = this.activePlayoffMatchKey.split(':');
      if (type === 'round') {
        const [rIdx, mIdx] = idx.split('-').map(Number);
        return playoff.rounds?.[rIdx]?.matches?.[mIdx] || null;
      }
      if (type === 'third') return playoff.thirdPlace || null;
      if (type === 'final') return playoff.final || null;
      return null;
    },
    displayRound() {
      if (this.tournament.tirPlayoff) {
        return this.activeBracket === 'r1' ? 1 : 2;
      }
      return this.currentRound;
    },
    activeScoresKey() {
      return this.displayRound === 2 ? 'scores2' : 'scores';
    },
    bracketTabs() {
      const tabs = [];
      if (!this.isTwoRoundSystem) return tabs;
      tabs.push({ key: 'r1', label: 'R1' });
      if (this.currentRound >= 2) tabs.push({ key: 'r2', label: 'R2' });
      if (this.tournament.tirPlayoff) {
        const playoff = this.tournament.tirPlayoff;
        if (playoff.rounds?.[0]?.matches?.some((m) => m.score1 != null)) {
          tabs.push({ key: 'qf', label: '1/4' });
        }
        const sfRound = playoff.rounds?.find((r) => r.matches.length === 2);
        if (sfRound?.matches.some((m) => m.score1 != null)) {
          tabs.push({ key: 'sf', label: '1/2' });
        }
        const finalRound = playoff.rounds?.find((r) => r.matches.length === 1);
        if (finalRound?.matches[0]?.score1 != null || playoff.final?.score1 != null) {
          tabs.push({ key: 'final', label: this.$t('games.final') });
        }
      }
      return tabs;
    },
    participants() {
      return this.tournament.tirParticipants || [];
    },
    scoringParticipants() {
      if (this.tournament.tirPlayoff && ['qf', 'sf', 'final'].includes(this.activeBracket)) {
        return this.getPlayoffBracketParticipants();
      }
      if (this.displayRound === 2) {
        const r2Ids = this.tournament.tirR2Participants || [];
        return this.participants.filter((p) => r2Ids.includes(p.id));
      }
      return this.participants;
    },
    rankedParticipants() {
      if (!['qf', 'sf', 'final'].includes(this.activeBracket)) {
        return rankParticipants(this.scoringParticipants, this.activeScoresKey);
      }
      return [...this.scoringParticipants].sort(
        (a, b) => this.getTotal(b) - this.getTotal(a) || this.getCarreauCount(b) - this.getCarreauCount(a),
      );
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
    qualifiedNames() {
      return this.tournament.tirPlayoff?.qualified || [];
    },
    playoffDisplayRounds() {
      return getTirPlayoffDisplayRounds(
        this.tournament.tirPlayoff,
        {
          final: this.$t('games.final'),
          thirdPlace: this.$t('tir.thirdPlaceMatch'),
          semifinal: this.$t('tir.semifinal'),
          quarterfinal: this.$t('tir.quarterfinal'),
          eighthFinal: this.$t('tir.eighthFinal'),
          sixteenthFinal: this.$t('tir.sixteenthFinal'),
          round: this.$t('tir.round'),
          pending: this.$t('tir.matchPending'),
        },
        { includePreviews: true },
      );
    },
    champion() {
      const playoff = this.tournament.tirPlayoff;
      if (!playoff || !this.tournament.tournamentIsFinished) return null;
      const finalMatch = playoff.final;
      if (!finalMatch) return null;
      return this.getMatchWinner(finalMatch);
    },
    r1RankedParticipants() {
      return rankWithTiebreakers(this.participants, 'scores', this.tiebreakerCount);
    },
    publicTableRows() {
      if (!this.isTwoRoundSystem) return [];
      const r2Ids = this.tournament.tirR2Participants || [];
      const tbCount = this.tournament.tirTiebreakerCount || 0;
      const r1Ranked = rankWithTiebreakers(this.participants, 'scores', tbCount);
      return buildTableRows({
        participants: this.participants,
        directIds: r1Ranked.slice(0, 4).map((p) => p.id),
        r2Ids,
        r2CandidateIds: getR2QualifiersWithTies(this.participants, tbCount).map((p) => p.id),
        playoff: this.tournament.tirPlayoff,
        currentRound: this.currentRound,
        isTwoRoundSystem: this.isTwoRoundSystem,
        hasPlayoffScores: this.playoffHasQf || this.playoffHasSf || this.playoffHasFinal,
        tiebreakerCount: tbCount,
        labels: {
          direct: this.$t('tir.directQualifier'),
          r2Qualifier: this.$t('tir.round2Qualifier'),
          goToR2: this.$t('tir.goToRound2'),
          eliminated: this.$t('tir.eliminated'),
        },
      });
    },
  },
  methods: {
    changeView(view) {
      if (view === 'participants') this.$refs.participantsList?.collapse?.();
    },
    getTiebreakerScoreForTable(participantId, round) {
      const p = this.participants.find((pp) => pp.id === participantId);
      if (!p) return '';
      const tbKey = getTiebreakerKey(round);
      if (!p[tbKey]) return '';
      return getScoreTotal(p, tbKey);
    },
    getPlayoffBracketParticipants() {
      const playoff = this.tournament.tirPlayoff;
      if (!playoff?.rounds) return [];
      let matches = [];
      if (this.activeBracket === 'qf') {
        matches = playoff.rounds[0]?.matches || [];
      } else if (this.activeBracket === 'sf') {
        const sfRound = playoff.rounds.find((r) => r.matches.length === 2);
        matches = sfRound?.matches || [];
      } else if (this.activeBracket === 'final') {
        const finalRound = playoff.rounds.find((r) => r.matches.length === 1);
        matches = finalRound?.matches || (playoff.final ? [playoff.final] : []);
      }
      const names = new Set();
      matches.forEach((m) => {
        if (m.player1) names.add(m.player1);
        if (m.player2) names.add(m.player2);
      });
      return this.participants.filter((p) => names.has(p.name));
    },
    getPlayoffBracketScore(participant) {
      const playoff = this.tournament.tirPlayoff;
      if (!playoff?.rounds) return 0;
      let matches = [];
      if (this.activeBracket === 'qf') {
        matches = playoff.rounds[0]?.matches || [];
      } else if (this.activeBracket === 'sf') {
        const sfRound = playoff.rounds.find((r) => r.matches.length === 2);
        matches = sfRound?.matches || [];
      } else if (this.activeBracket === 'final') {
        const finalRound = playoff.rounds.find((r) => r.matches.length === 1);
        matches = finalRound?.matches || (playoff.final ? [playoff.final] : []);
      }
      for (const m of matches) {
        if (m.player1 === participant.name) return m.score1 || 0;
        if (m.player2 === participant.name) return m.score2 || 0;
      }
      return 0;
    },
    openFromTable(id) {
      this.view = 'participants';
      this.$nextTick(() => this.$refs.participantsList?.expandById(id));
    },
    getTotal(participant) {
      if (['qf', 'sf', 'final'].includes(this.activeBracket)) {
        return this.getPlayoffBracketScore(participant);
      }
      return getScoreTotal(participant, this.activeScoresKey);
    },
    getCarreauCount(participant) {
      return getScoreCarreauCount(participant, this.activeScoresKey);
    },
    getThrows(participant) {
      return getThrowCount(participant, this.activeScoresKey);
    },
    isComplete(participant) {
      return isParticipantComplete(participant, this.activeScoresKey, this.totalThrows);
    },
    getParticipantAvatar(name) {
      if (!name || !this.tournament.teams) return null;
      for (const team of this.tournament.teams) {
        if (team.players) {
          const player = team.players.find(
            (p) =>
              `${p.surname || ''} ${p.name || ''}`.trim() === name ||
              `${p.name || ''} ${p.surname || ''}`.trim() === name,
          );
          if (player?.avatar_url) return player.avatar_url;
        }
        if (team.title === name && team.players?.[0]?.avatar_url) return team.players[0].avatar_url;
      }
      return null;
    },
    isQualified(participant) {
      return this.qualifiedNames.includes(participant.name);
    },
    isMatchComplete(match) {
      return !!match.complete || !!match.winner;
    },
    getMatchWinner(match) {
      return match.winner || null;
    },
    getMatchLoser(match) {
      const winner = this.getMatchWinner(match);
      if (!winner) return null;
      return winner === match.player1 ? match.player2 : match.player1;
    },
    formatName(name) {
      if (!name) return this.$t('tir.matchPending');
      const parts = name.split(' ');
      if (parts.length <= 1) return `<b>${name}</b>`;
      return `<b>${parts[0]}</b> ${parts.slice(1).join(' ')}`;
    },
    openPlayoffMatch(match, label, roundKey, mIdx) {
      if (!match.player1 || !match.player2) return;
      const [type, rIdx] = roundKey.split(':');
      if (type === 'round') {
        this.activePlayoffMatchKey = `round:${rIdx}-${mIdx}`;
      } else {
        this.activePlayoffMatchKey = type + ':0';
      }
      this.activePlayoffMatchLabel = label;
    },
    goToTable() {
      this.view = 'table';
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

/* Table */

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
  color: var(--color-text);
}

.tir-table__row--qualified td {
  background: var(--color-highlight);
}

.tir-table__row--direct td {
  background: var(--tir-row-direct-bg, rgb(76 175 80 / 8%));
}

.tir-table__row--r2 td {
  background: var(--tir-row-r2-bg, rgb(245 166 35 / 8%));
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

.tir-table__avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  vertical-align: middle;
  margin-right: 6px;
}

.tir-table__name-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tir-table__sticky-col--name {
  left: 32px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tir-table__content tr th.tir-table__sticky-col,
.tir-table__content tr td.tir-table__sticky-col {
  background-color: var(--color-surface);
  background-image: none;
}

.tir-table__content tr.tir-table__row--direct td.tir-table__sticky-col {
  background-color: var(--color-surface);
  background-image: linear-gradient(
    var(--tir-row-direct-bg, rgb(76 175 80 / 8%)),
    var(--tir-row-direct-bg, rgb(76 175 80 / 8%))
  );
}

.tir-table__content tr.tir-table__row--r2 td.tir-table__sticky-col {
  background-color: var(--color-surface);
  background-image: linear-gradient(
    var(--tir-row-r2-bg, rgb(245 166 35 / 8%)),
    var(--tir-row-r2-bg, rgb(245 166 35 / 8%))
  );
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

td.tir-table__muted {
  color: var(--color-text-muted);
  font-weight: 400;
}

.tir-table__clickable {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  font: inherit;
  font-weight: 500;
  color: var(--color-text);
  text-align: left;
}

.tir-table__clickable:hover {
  text-decoration: underline;
}

.tir-table__clickable:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.tir-table__empty {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
}

/* Playoff */

.tir-playoff {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tir-playoff__timeline {
  display: flex;
  flex-direction: column;
}

.tir-playoff__round {
  display: flex;
  gap: 14px;
}

.tir-playoff__progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;
  min-width: 20px;
}

.tir-playoff__progress-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
}

.tir-playoff__progress-dot--complete {
  border-color: var(--tir-winner);
  background: var(--tir-winner);
}

.tir-playoff__progress-dot--final {
  border-color: var(--tir-touche);
  background: var(--tir-touche);
}

.tir-playoff__progress-line {
  width: 2px;
  flex: 1;
  background: var(--color-border);
  margin: 4px 0;
}

.tir-playoff__round-content {
  flex: 1;
  min-width: 0;
  padding-bottom: 16px;
}

.tir-playoff__round-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.tir-playoff__match {
  display: block;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  margin-bottom: 8px;
  cursor: pointer;
  background: var(--color-surface);
  color: inherit;
  font: inherit;
  text-align: left;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.tir-playoff__match:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.tir-playoff__match:hover {
  background: var(--color-surface-hover);
  border-color: var(--tir-touche);
}

.tir-playoff__match:last-child {
  margin-bottom: 0;
}

.tir-playoff__match--complete {
  border-color: var(--tir-carreau);
  background: url('@/assets/img/card-bg-finished.webp') center/cover no-repeat !important;
  background-color: var(--color-surface) !important;
  border-width: 2px;
}

[data-theme='dark'] .tir-playoff__match--complete {
  background-blend-mode: soft-light;
}

.tir-playoff__match--complete .tir-playoff__match-num {
  background: var(--tir-carreau);
  color: var(--color-btn-text);
}

.tir-playoff__match--in-progress {
  border-color: var(--color-primary);
  background: url('@/assets/img/card-bg-active.webp') center/cover no-repeat !important;
  background-color: var(--color-surface) !important;
  border-width: 2px;
}

[data-theme='dark'] .tir-playoff__match--in-progress {
  background-blend-mode: soft-light;
}

.tir-playoff__match--in-progress .tir-playoff__match-num {
  background: var(--color-primary);
  color: var(--color-btn-text);
}

.tir-playoff__match--final {
  border-color: var(--tir-touche);
  border-width: 2px;
}

.tir-playoff__match--pending {
  opacity: 0.5;
  cursor: default;
  background: url('@/assets/img/card-bg-upcoming.webp') center/cover no-repeat !important;
  background-color: var(--color-surface) !important;
}

[data-theme='dark'] .tir-playoff__match--pending {
  background-blend-mode: soft-light;
}

.tir-playoff__match--pending:hover {
  border-color: var(--color-border);
}

.tir-playoff__match--preview {
  opacity: 0.55;
  cursor: default;
  border-style: dashed;
}

.tir-playoff__match--preview:hover {
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
}

.tir-playoff__match-status {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.tir-playoff__match-status--complete {
  color: var(--tir-winner-text);
  background: rgb(76 175 80 / 12%);
}

.tir-playoff__match-status--progress {
  color: var(--tir-in-progress);
  background: var(--tir-in-progress-bg);
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
  overflow-wrap: break-word;
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

/* Champion block */

.tir-playoff__champion {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
  border-radius: 16px;
  background: rgb(76 175 80 / 8%);
  border: 1px solid rgb(67 160 71 / 22%);
}

.tir-playoff__champion-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--tir-winner);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tir-playoff__champion-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tir-playoff__champion-label {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--tir-winner);
}

.tir-playoff__champion-name {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text);
}

/* CTA */

.tir-playoff__cta {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 0 18px;
  border: 1px solid rgb(67 160 71 / 45%);
  border-radius: 14px;
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
  width: 100%;
}

.tir-playoff__cta:hover {
  background: var(--color-surface-hover);
}

.tir-playoff__cta > :last-child {
  margin-left: auto;
  color: var(--tir-winner);
}

@media (max-width: 400px) {
  .tir-playoff__round {
    padding: 0 8px;
  }
}

@media (max-width: 450px) {
  .tir-playoff__match {
    padding: 10px;
  }

  .tir-playoff__match-row {
    gap: 4px;
  }

  .tir-playoff__player-name {
    font-size: 12px;
  }

  .tir-playoff__score {
    font-size: 16px;
    min-width: 22px;
  }

  .tir-playoff__vs {
    font-size: 11px;
    min-width: 18px;
  }

  .tir-playoff__winner-icon {
    width: 10px;
    height: 10px;
  }
}
</style>
