<template>
  <div class="participant-games" @click.stop>
    <div class="participant-games__header">
      <div class="participant-games__title-row">
        <span class="participant-games__title">{{ teamTitle }}</span>
        <button class="participant-games__close" @click="$emit('close')">
          <X :size="18" />
        </button>
      </div>
      <div class="participant-games__summary">
        <span class="participant-games__stat participant-games__stat--wins">
          <Trophy :size="14" />{{ totalWins }}W
        </span>
        <span class="participant-games__stat participant-games__stat--losses">
          <Minus :size="14" />{{ totalLosses }}L
        </span>
        <span class="participant-games__stat participant-games__stat--points">
          {{ totalPointsPlus }}:{{ totalPointsMinus }}
        </span>
      </div>
    </div>

    <div v-if="!gamesByStage.length" class="participant-games__empty">
      {{ $t('games.noGames') }}
    </div>

    <div v-for="stage in gamesByStage" :key="stage.key" class="participant-games__stage">
      <div class="participant-games__stage-header">
        <span class="participant-games__stage-badge" :class="'participant-games__stage-badge--' + stage.type">
          {{ stage.label }}
        </span>
      </div>
      <div class="participant-games__matches">
        <div
          v-for="(match, mIdx) in stage.matches"
          :key="mIdx"
          class="participant-games__match"
          :class="{
            'participant-games__match--win': match.won,
            'participant-games__match--loss': match.lost,
            'participant-games__match--pending': match.pending,
            'participant-games__match--clickable': hasMultiplePlayers(match.opponent),
          }"
          @click="hasMultiplePlayers(match.opponent) && toggleMatchPlayers(`${stage.key}-${mIdx}`)"
        >
          <span class="participant-games__match-num">{{ match.order }}</span>
          <span class="participant-games__match-opponent">
            <span class="participant-games__match-vs">vs</span>
            {{ match.opponent }}
          </span>
          <span class="participant-games__match-score" v-if="!match.pending">
            <span :class="{ 'participant-games__score--bold': match.won }">{{ match.myScore }}</span>
            <span class="participant-games__score-sep">:</span>
            <span :class="{ 'participant-games__score--bold': match.lost }">{{ match.opponentScore }}</span>
          </span>
          <span v-else class="participant-games__match-score participant-games__match-score--pending"> — : — </span>
          <span v-if="match.won" class="participant-games__match-result participant-games__match-result--win">W</span>
          <span v-else-if="match.lost" class="participant-games__match-result participant-games__match-result--loss"
            >L</span
          >
          <button
            v-if="hasMultiplePlayers(match.opponent)"
            class="participant-games__match-players-btn"
            :class="{ 'participant-games__match-players-btn--active': expandedMatch === `${stage.key}-${mIdx}` }"
            @click.stop="toggleMatchPlayers(`${stage.key}-${mIdx}`)"
          >
            <UsersRound :size="14" />
          </button>
          <router-link
            v-if="!match.pending"
            class="participant-games__match-stats-btn"
            :to="getStatsLink(match, stage.label)"
            @click.stop
          >
            <BarChart3 :size="14" />
          </router-link>
          <div v-if="expandedMatch === `${stage.key}-${mIdx}`" class="participant-games__match-rosters">
            <PlayerChip
              v-for="(player, pIdx) in getTeamPlayers(match.opponent)"
              :key="pIdx"
              :player="player"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { X, Trophy, Minus, UsersRound, BarChart3 } from 'lucide-vue-next';
import { mapState } from 'pinia';
import { useMainStore } from '@/stores/main';
import PlayerChip from '@/components/partials/PlayerChip.vue';

export default {
  name: 'ParticipantGames',
  components: { X, Trophy, Minus, UsersRound, BarChart3, PlayerChip },
  props: {
    teamTitle: { type: String, required: true },
    tournament: { type: Object, required: true },
  },
  emits: ['close'],
  data() {
    return {
      expandedMatch: null,
    };
  },
  computed: {
    ...mapState(useMainStore, ['currentTournament']),
    tournamentName() {
      return this.currentTournament?.name || this.tournament.name || '';
    },
    gamesByStage() {
      const stages = [];
      let orderCounter = 1;

      if (this.tournament.games?.length) {
        const { roundsMap, barrageGames } = this.collectRoundGames();
        for (const [roundIdx, matches] of roundsMap) {
          if (matches.length) {
            stages.push({
              key: `round-${roundIdx}`,
              type: 'group',
              label: `${this.getGroupStageLabel()} — ${this.$t('common.round')} ${roundIdx + 1}`,
              matches: matches.map((g) => ({ ...g, order: orderCounter++ })),
            });
          }
        }
        if (barrageGames.length) {
          stages.push({
            key: 'barrage',
            type: 'cadrage',
            label: this.$t('games.poulesBarrage'),
            matches: barrageGames.map((g) => ({ ...g, order: orderCounter++ })),
          });
        }
      }

      if (this.tournament.cadrage?.length) {
        const cadrageGames = this.collectCadrageGames();
        if (cadrageGames.length) {
          stages.push({
            key: 'cadrage',
            type: 'cadrage',
            label: this.$t('games.cadrage'),
            matches: cadrageGames.map((g) => ({ ...g, order: orderCounter++ })),
          });
        }
      }

      if (this.tournament.playOffBracket) {
        const playoffStages = this.collectBracketPlayoffByRound();
        for (const ps of playoffStages) {
          stages.push({
            key: `playoff-${ps.stageLabel}`,
            type: 'playoff',
            label: ps.label,
            matches: ps.matches.map((g) => ({ ...g, order: orderCounter++ })),
          });
        }
      }

      if (this.tournament.teamPlayoff) {
        const teamPlayoffStages = this.collectTeamPlayoffByRound();
        for (const ps of teamPlayoffStages) {
          stages.push({
            key: `teamPlayoff-${ps.stageLabel}`,
            type: 'playoff',
            label: ps.label,
            matches: ps.matches.map((g) => ({ ...g, order: orderCounter++ })),
          });
        }
      }

      return stages;
    },
    allMatches() {
      return this.gamesByStage.flatMap((s) => s.matches);
    },
    totalWins() {
      return this.allMatches.filter((m) => m.won).length;
    },
    totalLosses() {
      return this.allMatches.filter((m) => m.lost).length;
    },
    totalPointsPlus() {
      return this.allMatches.reduce((sum, m) => sum + (m.myScore || 0), 0);
    },
    totalPointsMinus() {
      return this.allMatches.reduce((sum, m) => sum + (m.opponentScore || 0), 0);
    },
  },
  methods: {
    collectRoundGames() {
      const roundsMap = new Map();
      const barrageGames = [];
      const games = this.tournament.games || [];
      const barrageStartIndex = this.tournament.barrage?.startIndex ?? games.length;

      for (let rIdx = 0; rIdx < games.length; rIdx++) {
        const round = games[rIdx];
        if (!round || !Array.isArray(round)) continue;
        for (const game of round) {
          if (!game) continue;
          const match = this.extractMatch(game);
          if (match) {
            if (rIdx >= barrageStartIndex) {
              barrageGames.push(match);
            } else {
              if (!roundsMap.has(rIdx)) roundsMap.set(rIdx, []);
              roundsMap.get(rIdx).push(match);
            }
          }
        }
      }

      if (this.tournament.groupSchedule) {
        const schedule = this.tournament.groupSchedule;
        for (let rIdx = 0; rIdx < schedule.length; rIdx++) {
          if (rIdx < games.length) continue;
          const round = schedule[rIdx];
          if (!round || !Array.isArray(round)) continue;
          for (const game of round) {
            if (!game) continue;
            const match = this.extractMatch(game);
            if (match) {
              if (!roundsMap.has(rIdx)) roundsMap.set(rIdx, []);
              roundsMap.get(rIdx).push(match);
            }
          }
        }
      }

      return { roundsMap, barrageGames };
    },
    collectCadrageGames() {
      const results = [];
      const cadrage = this.tournament.cadrage || [];
      for (const game of cadrage) {
        if (!game) continue;
        const match = this.extractMatch(game);
        if (match) results.push(match);
      }
      return results;
    },
    collectBracketPlayoffByRound() {
      const bracket = this.tournament.playOffBracket;
      if (!bracket?.stages) return [];
      const stageGroups = [];
      for (const stage of bracket.stages) {
        if (!stage.teams) continue;
        const matches = [];
        for (const game of stage.teams) {
          const match = this.extractMatch(game);
          if (match) matches.push(match);
        }
        if (matches.length) {
          stageGroups.push({
            stageLabel: stage.stageLabel,
            label: this.getPlayoffStageLabel(stage.stageLabel),
            matches,
          });
        }
      }
      if (bracket.thirdPlace) {
        const match = this.extractMatch(bracket.thirdPlace);
        if (match) {
          stageGroups.push({
            stageLabel: '3rd',
            label: this.$t('games.thirdPlace'),
            matches: [match],
          });
        }
      }
      return stageGroups;
    },
    collectTeamPlayoffByRound() {
      const tp = this.tournament.teamPlayoff;
      if (!tp) return [];
      const stageGroups = [];
      const rounds = tp.rounds || [];
      for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
        const matches = [];
        for (const match of rounds[rIdx].matches || []) {
          const extracted = this.extractTeamPlayoffMatch(match);
          if (extracted) matches.push(extracted);
        }
        if (matches.length) {
          const size = tp.size;
          const roundSize = size / Math.pow(2, rIdx);
          stageGroups.push({
            stageLabel: `round-${rIdx}`,
            label: this.getPlayoffStageLabel(roundSize / 2),
            matches,
          });
        }
      }
      if (tp.final) {
        const extracted = this.extractTeamPlayoffMatch(tp.final);
        if (extracted) {
          stageGroups.push({
            stageLabel: 'final',
            label: this.$t('games.final'),
            matches: [extracted],
          });
        }
      }
      if (tp.thirdPlace) {
        const extracted = this.extractTeamPlayoffMatch(tp.thirdPlace);
        if (extracted) {
          stageGroups.push({
            stageLabel: '3rd',
            label: this.$t('games.thirdPlace'),
            matches: [extracted],
          });
        }
      }
      return stageGroups;
    },
    extractMatch(game) {
      if (!game) return null;
      const isTeam1 = game.team_1 === this.teamTitle;
      const isTeam2 = game.team_2 === this.teamTitle;
      if (!isTeam1 && !isTeam2) return null;

      const opponent = isTeam1 ? game.team_2 : game.team_1;
      const hasScores =
        game.team_1_score != null && game.team_1_score !== '' && game.team_2_score != null && game.team_2_score !== '';
      const myScore = isTeam1 ? Number(game.team_1_score) : Number(game.team_2_score);
      const opponentScore = isTeam1 ? Number(game.team_2_score) : Number(game.team_1_score);

      return {
        opponent: opponent || '—',
        myScore: hasScores ? myScore : null,
        opponentScore: hasScores ? opponentScore : null,
        won: hasScores && myScore > opponentScore,
        lost: hasScores && opponentScore > myScore,
        pending: !hasScores,
      };
    },
    extractTeamPlayoffMatch(match) {
      if (!match) return null;
      const isTeam1 = match.team1 === this.teamTitle;
      const isTeam2 = match.team2 === this.teamTitle;
      if (!isTeam1 && !isTeam2) return null;

      const opponent = isTeam1 ? match.team2 : match.team1;
      const hasScores =
        match.team1Score != null && match.team1Score !== '' && match.team2Score != null && match.team2Score !== '';
      const myScore = isTeam1 ? Number(match.team1Score) : Number(match.team2Score);
      const opponentScore = isTeam1 ? Number(match.team2Score) : Number(match.team1Score);

      return {
        opponent: opponent || '—',
        myScore: hasScores ? myScore : null,
        opponentScore: hasScores ? opponentScore : null,
        won: hasScores && myScore > opponentScore,
        lost: hasScores && opponentScore > myScore,
        pending: !hasScores,
      };
    },
    getGroupStageLabel() {
      const sys = this.tournament.system;
      if (sys === 'swiss') return this.$t('teams.swiss');
      if (sys === 'groups') return this.$t('teams.groups');
      if (sys === 'poules') return this.$t('teams.poules');
      if (sys === 'supermele') return this.$t('teams.supermele');
      return this.$t('common.round');
    },
    getPlayoffStageLabel(stageLabel) {
      if (stageLabel === 'cadrage') return this.$t('games.cadrage');
      if (stageLabel === 1) return this.$t('games.final');
      if (stageLabel === 2) return `1/2 ${this.$t('games.ofFinal')}`;
      if (stageLabel === 4) return `1/4 ${this.$t('games.ofFinal')}`;
      if (stageLabel === 8) return `1/8 ${this.$t('games.ofFinal')}`;
      if (stageLabel === 16) return `1/16 ${this.$t('games.ofFinal')}`;
      return `1/${stageLabel} ${this.$t('games.ofFinal')}`;
    },
    toggleMatchPlayers(matchKey) {
      this.expandedMatch = this.expandedMatch === matchKey ? null : matchKey;
    },
    hasMultiplePlayers(teamTitle) {
      const team = this.tournament.teams?.find((t) => t.title === teamTitle);
      return team?.players?.length > 1;
    },
    getTeamPlayers(teamTitle) {
      const team = this.tournament.teams?.find((t) => t.title === teamTitle);
      return team?.players || [];
    },
    getStatsLink(match, stageLabel) {
      const myPlayers = this.getTeamPlayers(this.teamTitle);
      const oppPlayers = this.getTeamPlayers(match.opponent);
      const gameType = Math.min(Math.max(myPlayers.length, oppPlayers.length, 1), 3);
      const formatPlayer = (p) => `${p.name} ${p.surname || ''}`.trim();
      const t1 = myPlayers.map(formatPlayer).join(',');
      const t2 = oppPlayers.map(formatPlayer).join(',');
      const name = `${this.tournamentName} — ${stageLabel}`.trim();
      return {
        path: '/stats',
        query: { prefill: '1', name, type: String(gameType), t1, t2 },
      };
    },
  },
};
</script>

<style scoped>
.participant-games {
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #eee);
  border-radius: 12px;
  padding: 1rem;
  margin-top: 0.5rem;
  overflow: hidden;
}

.participant-games__header {
  margin-bottom: 0.75rem;
}

.participant-games__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.participant-games__title {
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.participant-games__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.participant-games__close:hover {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error, #ef4444);
}

.participant-games__summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.4rem;
}

.participant-games__stat {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
}

.participant-games__stat--wins {
  color: #16a34a;
  background: rgb(22 163 74 / 10%);
}

.participant-games__stat--losses {
  color: #dc2626;
  background: rgb(220 38 38 / 10%);
}

.participant-games__stat--points {
  color: var(--color-text-secondary, #555);
  background: var(--color-bg-input, #f5f5f5);
}

.participant-games__empty {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  padding: 1rem 0;
}

.participant-games__stage {
  margin-top: 0.75rem;
}

.participant-games__stage-header {
  margin-bottom: 0.4rem;
}

.participant-games__stage-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
}

.participant-games__stage-badge--group {
  color: var(--color-primary, #7c3aed);
  background: rgb(124 58 237 / 10%);
}

.participant-games__stage-badge--cadrage {
  color: #d97706;
  background: rgb(217 119 6 / 10%);
}

.participant-games__stage-badge--playoff {
  color: #0891b2;
  background: rgb(8 145 178 / 10%);
}

.participant-games__matches {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.participant-games__match {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: background 0.1s;
}

.participant-games__match--win {
  background: rgb(22 163 74 / 5%);
  border-color: rgb(22 163 74 / 15%);
}

.participant-games__match--loss {
  background: rgb(220 38 38 / 4%);
  border-color: rgb(220 38 38 / 12%);
}

.participant-games__match--pending {
  background: var(--color-bg-input, #fafafa);
  border-color: var(--color-border, #eee);
}

.participant-games__match--clickable {
  cursor: pointer;
}

.participant-games__match-num {
  min-width: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted, #999);
  text-align: center;
}

.participant-games__match-opponent {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
  color: var(--color-text);
}

.participant-games__match-vs {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  margin-right: 0.3rem;
}

.participant-games__match-score {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-secondary, #555);
  white-space: nowrap;
}

.participant-games__match-score--pending {
  color: var(--color-text-muted, #aaa);
}

.participant-games__score--bold {
  font-weight: 700;
}

.participant-games__score-sep {
  margin: 0 0.1rem;
  color: var(--color-text-muted);
}

.participant-games__match-result {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}

.participant-games__match-result--win {
  background: rgb(22 163 74 / 15%);
  color: #16a34a;
}

.participant-games__match-result--loss {
  background: rgb(220 38 38 / 12%);
  color: #dc2626;
}

.participant-games__match-players-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--color-text-muted, #999);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}

.participant-games__match-players-btn:hover,
.participant-games__match-players-btn--active {
  background: var(--color-primary-bg, rgb(124 58 237 / 10%));
  color: var(--color-primary, #7c3aed);
}

.participant-games__match-stats-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: var(--color-info, #4a90d9);
  flex-shrink: 0;
  transition: all 0.15s;
  text-decoration: none;
}

.participant-games__match-stats-btn:hover {
  background: rgb(74 144 217 / 10%);
  color: var(--color-info, #3b7dd8);
}

.participant-games__match-rosters {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  padding: 0.3rem 0;
  margin-top: 0.2rem;
}

@media (max-width: 480px) {
  .participant-games {
    padding: 0.75rem;
    border-radius: 10px;
  }

  .participant-games__match {
    gap: 0.35rem;
    padding: 0.4rem 0.5rem;
  }

  .participant-games__match-opponent {
    font-size: 0.82rem;
  }

  .participant-games__match-score {
    font-size: 0.88rem;
  }
}
</style>
