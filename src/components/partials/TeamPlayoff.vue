<template>
  <div class="team-playoff" v-if="tournament.teamPlayoff">
    <TeamPlayoffMatch
      v-if="activeMatch"
      :match="activeMatch"
      :max-score="tournament.preferences.maxScore"
      :round-label="activeMatchLabel"
      @back="closeMatch"
      @update="onMatchScoreChange"
      @finish="finishMatch"
    />

    <template v-else>
      <div
        v-for="(round, rIdx) in displayRounds"
        :key="rIdx"
        class="team-playoff__round"
        :class="{ 'team-playoff__round--final': round.isFinal }"
      >
        <h4 class="team-playoff__round-title">{{ round.title }}</h4>
        <div
          v-for="(match, mIdx) in round.matches"
          :key="mIdx"
          class="team-playoff__match"
          :class="{
            'team-playoff__match--complete': match.status === 'finished',
            'team-playoff__match--in-progress': match.status === 'in_progress',
            'team-playoff__match--pending': !match.team1 || !match.team2,
          }"
          @click="openMatch(match, round.title, round.path, mIdx)"
        >
          <div class="team-playoff__match-top">
            <span class="team-playoff__match-num">{{ mIdx + 1 }}</span>
            <span
              v-if="match.status === 'finished'"
              class="team-playoff__match-status team-playoff__match-status--complete"
              >{{ $t('teamPlayoff.matchFinished') }}</span
            >
            <span
              v-else-if="match.status === 'in_progress'"
              class="team-playoff__match-status team-playoff__match-status--progress"
              >{{ $t('teamPlayoff.matchInProgress') }}</span
            >
            <Pencil :size="14" v-if="match.team1 && match.team2" class="team-playoff__match-edit" />
          </div>
          <div class="team-playoff__match-row">
            <span
              class="team-playoff__team-name"
              :class="{ 'team-playoff__team-name--winner': match.winner === match.team1 }"
            >
              <Trophy v-if="match.winner === match.team1" :size="12" class="team-playoff__winner-icon" />
              {{ match.team1 || '—' }}
            </span>
            <span
              class="team-playoff__score"
              :class="{ 'team-playoff__score--winner': match.winner === match.team1 }"
              >{{ match.team1Score !== null ? match.team1Score : '—' }}</span
            >
            <span class="team-playoff__vs">vs</span>
            <span
              class="team-playoff__score"
              :class="{ 'team-playoff__score--winner': match.winner === match.team2 }"
              >{{ match.team2Score !== null ? match.team2Score : '—' }}</span
            >
            <span
              class="team-playoff__team-name team-playoff__team-name--right"
              :class="{ 'team-playoff__team-name--winner': match.winner === match.team2 }"
            >
              {{ match.team2 || '—' }}
              <Trophy v-if="match.winner === match.team2" :size="12" class="team-playoff__winner-icon" />
            </span>
          </div>
        </div>
      </div>

      <template v-if="!readOnly">
        <div v-if="canFinishRound" class="team-playoff__actions">
          <button class="team-playoff__advance-btn" @click="finishRound">
            {{ $t('teamPlayoff.finishRound') }}
          </button>
        </div>
        <div v-else-if="hasActiveRound && !allCurrentRoundFinished" class="team-playoff__hint">
          {{ $t('teamPlayoff.finishAllMatches') }}
        </div>

        <button
          v-if="canFinishTournament"
          class="team-playoff__advance-btn team-playoff__advance-btn--finish"
          @click="finishPlayoffTournament"
        >
          {{ $t('teams.finishTournament') }}
        </button>
      </template>
    </template>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { Trophy, Pencil } from 'lucide-vue-next';
import TeamPlayoffMatch from './TeamPlayoffMatch.vue';

export default {
  name: 'TeamPlayoff',
  components: { TeamPlayoffMatch, Trophy, Pencil },
  props: {
    readOnly: { type: Boolean, default: false },
  },
  data() {
    return {
      activeMatch: null,
      activeMatchLabel: '',
      activeMatchPath: null,
    };
  },
  mounted() {
    this.subscribeTournament();
  },
  beforeUnmount() {
    this.unsubscribeTournament();
  },
  computed: {
    ...mapState(useMainStore, ['currentTournament']),
    tournament() {
      return this.currentTournament;
    },
    playoff() {
      return this.tournament?.teamPlayoff;
    },
    displayRounds() {
      if (!this.playoff) return [];
      const rounds = [];

      if (this.playoff.rounds) {
        this.playoff.rounds.forEach((round, rIdx) => {
          rounds.push({
            title: this.getRoundTitle(rIdx, round.matches.length),
            matches: round.matches,
            path: `rounds/${rIdx}`,
            isFinal: false,
          });
        });
      }

      if (this.playoff.thirdPlace) {
        rounds.push({
          title: this.$t('games.thirdPlace'),
          matches: [this.playoff.thirdPlace],
          path: 'thirdPlace',
          isFinal: false,
        });
      }

      if (this.playoff.final) {
        rounds.push({
          title: this.$t('games.final'),
          matches: [this.playoff.final],
          path: 'final',
          isFinal: true,
        });
      }

      return rounds;
    },
    currentRound() {
      if (!this.playoff?.rounds?.length) return null;
      return this.playoff.rounds[this.playoff.rounds.length - 1];
    },
    hasActiveRound() {
      return !!this.currentRound;
    },
    allCurrentRoundFinished() {
      if (!this.currentRound) return false;
      return this.currentRound.matches.every((m) => m.status === 'finished');
    },
    canFinishRound() {
      if (!this.currentRound) return false;
      if (this.playoff.final) return false;
      return this.allCurrentRoundFinished;
    },
    canFinishTournament() {
      if (!this.playoff) return false;
      if (this.tournament.tournamentIsFinished) return false;
      const finalDone = this.playoff.final && this.playoff.final.status === 'finished';
      const thirdDone = !this.playoff.thirdPlace || this.playoff.thirdPlace.status === 'finished';
      return finalDone && thirdDone;
    },
  },
  methods: {
    ...mapActions(useMainStore, [
      'syncTeamPlayoffMatch',
      'setActiveTeamPlayoffMatchPath',
      'finishTournament',
      'subscribeTournament',
      'unsubscribeTournament',
    ]),
    createMatch(team1, team2) {
      return {
        team1,
        team2,
        team1Score: null,
        team2Score: null,
        status: 'not_started',
        winner: null,
        updatedAt: null,
        updatedBy: null,
      };
    },
    getRoundTitle(roundIndex, matchCount) {
      const totalRounds = this.playoff.rounds.length;
      if (matchCount >= 16) return '1/32 ' + this.$t('games.ofFinal');
      if (matchCount >= 8) return '1/16 ' + this.$t('games.ofFinal');
      if (matchCount >= 4) return '1/8 ' + this.$t('games.ofFinal');
      if (matchCount >= 2 && roundIndex < totalRounds - 1) return '1/4 ' + this.$t('games.ofFinal');
      if (matchCount >= 2) return this.$t('teamPlayoff.semifinal');
      return this.$t('teamPlayoff.round') + ' ' + (roundIndex + 1);
    },
    openMatch(match, label, roundPath, matchIndex) {
      if (this.readOnly) return;
      if (!match.team1 || !match.team2) return;
      if (match.status === 'finished') return;
      this.activeMatch = match;
      this.activeMatchLabel = label;
      if (roundPath === 'final') {
        this.activeMatchPath = 'final';
      } else if (roundPath === 'thirdPlace') {
        this.activeMatchPath = 'thirdPlace';
      } else {
        this.activeMatchPath = `${roundPath}/matches/${matchIndex}`;
      }
      this.setActiveTeamPlayoffMatchPath(this.activeMatchPath);
    },
    closeMatch() {
      this.setActiveTeamPlayoffMatchPath(null);
      this.activeMatch = null;
      this.activeMatchLabel = '';
      this.activeMatchPath = null;
    },
    onMatchScoreChange() {
      if (this.activeMatchPath && this.activeMatch) {
        this.syncTeamPlayoffMatch(this.activeMatchPath, this.activeMatch);
      }
    },
    finishMatch() {
      if (!this.activeMatch) return;
      const match = this.activeMatch;
      const s1 = Number(match.team1Score);
      const s2 = Number(match.team2Score);
      if (isNaN(s1) || isNaN(s2) || s1 === s2) return;
      match.status = 'finished';
      match.winner = s1 > s2 ? match.team1 : match.team2;
      match.updatedAt = new Date().toISOString();
      this.onMatchScoreChange();
      this.closeMatch();
    },
    finishRound() {
      if (!this.canFinishRound) return;
      const lastRound = this.playoff.rounds[this.playoff.rounds.length - 1];
      const winners = lastRound.matches.map((m) => m.winner);

      if (winners.length === 2) {
        this.playoff.final = this.createMatch(winners[0], winners[1]);
        if (this.playoff.size >= 4) {
          const losers = lastRound.matches.map((m) => (m.team1 === m.winner ? m.team2 : m.team1));
          this.playoff.thirdPlace = this.createMatch(losers[0], losers[1]);
        }
      } else if (winners.length > 2) {
        const nextMatches = [];
        for (let i = 0; i < winners.length; i += 2) {
          nextMatches.push(this.createMatch(winners[i], winners[i + 1]));
        }
        this.playoff.rounds.push({ matches: nextMatches });
      }
      this.syncTeamPlayoffMatch(null, null);
    },
    finishPlayoffTournament() {
      this.finishTournament();
    },
  },
};
</script>

<style scoped>
.team-playoff {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.team-playoff__round {
  margin-bottom: 0;
}

.team-playoff__round--final {
  border-color: var(--tir-touche, #ff9800);
}

.team-playoff__round-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.team-playoff__match {
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  margin-bottom: 8px;
  cursor: pointer;
  background: var(--color-surface);
  transition:
    background 0.15s,
    border-color 0.15s;
}

.team-playoff__match:last-child {
  margin-bottom: 0;
}

.team-playoff__match:hover {
  background: var(--color-surface-hover);
  border-color: var(--tir-touche, #ff9800);
}

.team-playoff__match--complete {
  border-color: var(--tir-carreau, #4caf50);
  background: rgb(76 175 80 / 6%);
  border-width: 2px;
  cursor: default;
}

.team-playoff__match--complete:hover {
  background: rgb(76 175 80 / 6%);
  border-color: var(--tir-carreau, #4caf50);
}

.team-playoff__match--in-progress {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  border-width: 2px;
}

.team-playoff__match--pending {
  opacity: 0.5;
  cursor: default;
}

.team-playoff__match--pending:hover {
  background: var(--color-surface);
  border-color: var(--color-border);
}

.team-playoff__match-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.team-playoff__match-num {
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

.team-playoff__match--complete .team-playoff__match-num {
  background: var(--tir-carreau, #4caf50);
  color: var(--color-btn-text, #fff);
}

.team-playoff__match--in-progress .team-playoff__match-num {
  background: var(--color-primary);
  color: var(--color-btn-text, #fff);
}

.team-playoff__match-status {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.team-playoff__match-status--complete {
  color: var(--tir-winner-text, #2e7d32);
  background: rgb(76 175 80 / 12%);
}

.team-playoff__match-status--progress {
  color: var(--tir-in-progress, #1976d2);
  background: var(--tir-in-progress-bg, rgb(25 118 210 / 8%));
}

.team-playoff__match-edit {
  margin-left: auto;
  color: var(--color-text-muted);
}

.team-playoff__match-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.team-playoff__team-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-width: 0;
  word-break: break-word;
}

.team-playoff__team-name--right {
  text-align: right;
}

.team-playoff__team-name--winner {
  color: var(--tir-winner, #2e7d32);
  font-weight: 700;
}

.team-playoff__winner-icon {
  color: var(--tir-winner, #2e7d32);
  width: 12px;
  height: 12px;
  vertical-align: -1px;
  flex-shrink: 0;
  display: inline-block;
  margin-left: 4px;
}

.team-playoff__score {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  min-width: 28px;
  text-align: center;
  flex-shrink: 0;
}

.team-playoff__score--winner {
  color: var(--color-text);
}

.team-playoff__vs {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  min-width: 24px;
  text-align: center;
}

.team-playoff__actions {
  margin-top: 8px;
}

.team-playoff__advance-btn {
  width: 100%;
  padding: 12px;
  background: var(--tir-touche, #ff9800);
  color: var(--color-btn-text, #fff);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.team-playoff__advance-btn--finish {
  margin-top: 16px;
  background: var(--tir-carreau, #4caf50);
}

.team-playoff__hint {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
  text-align: center;
}
</style>
