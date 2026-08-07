<template>
  <article class="club-match" :class="{ 'club-match--finished': game.status === 'finished' }">
    <button type="button" class="club-match__summary" @click="expanded = !expanded">
      <span class="club-match__lane">{{ $t('games.lane') }} {{ displayLane }}</span>
      <span class="club-match__team club-match__team--left" :class="{ 'club-match__team--winner': teamOneWins }">
        {{ game.team_1 }}
      </span>
      <span class="club-match__score">
        <strong>{{ displayScore(game.team_1_score) }} : {{ displayScore(game.team_2_score) }}</strong>
        <small>
          {{ $t('clubCup.gamesProgress', { completed: summary.completed_games, total: summary.total_games }) }}
        </small>
      </span>
      <span class="club-match__team" :class="{ 'club-match__team--winner': teamTwoWins }">
        {{ game.team_2 }}
      </span>
      <ChevronDown :size="19" class="club-match__chevron" :class="{ 'club-match__chevron--open': expanded }" />
    </button>

    <div v-if="expanded" class="club-match__body">
      <p class="club-match__format-note">{{ $t('clubCup.matchFormatHint') }}</p>

      <section v-for="phase in phases" :key="phase.key" class="club-phase">
        <header class="club-phase__header">
          <strong>{{ phaseTitle(phase.key) }}</strong>
          <span>{{ $t('clubCup.phasePoints', { points: phase.weight, count: phase.count }) }}</span>
        </header>

        <div class="club-phase__teams" aria-hidden="true">
          <span>{{ game.team_1 }}</span>
          <span>{{ $t('clubCup.score') }}</span>
          <span>{{ game.team_2 }}</span>
        </div>

        <div
          v-for="discipline in phaseGames(phase.key)"
          :key="discipline.id"
          class="club-discipline"
          :class="{
            'club-discipline--finished': discipline.status === 'finished',
            'club-discipline--invalid': disciplineHasError(discipline),
          }"
        >
          <div class="club-discipline__label">
            <CheckCircle2 v-if="discipline.status === 'finished'" :size="16" />
            <span>{{ disciplineTitle(discipline) }}</span>
            <small>{{ discipline.weight }} {{ $t('clubCup.pointsShort') }}</small>
          </div>

          <div v-if="hasRoster(teamOne)" class="club-discipline__players club-discipline__players--left">
            <select
              v-for="slot in discipline.playersPerTeam"
              :key="`${discipline.id}-team-1-${slot}`"
              v-model="discipline.team_1_players[slot - 1]"
              :disabled="readOnly"
              @change="onChange"
            >
              <option value="">{{ $t('clubCup.selectPlayer') }}</option>
              <option
                v-for="player in rosterOptions(teamOne)"
                :key="player.key"
                :value="player.key"
                :disabled="isPlayerUsed(phase.key, 'team_1', player.key, discipline.id, slot - 1)"
              >
                {{ player.label }}
              </option>
            </select>
          </div>
          <div v-else class="club-discipline__players club-discipline__players--empty">—</div>

          <div class="club-discipline__score">
            <input
              v-model.number="discipline.team_1_score"
              type="number"
              min="0"
              max="13"
              inputmode="numeric"
              :aria-label="`${game.team_1} ${disciplineTitle(discipline)}`"
              :disabled="readOnly"
              @input="onChange"
            />
            <span>:</span>
            <input
              v-model.number="discipline.team_2_score"
              type="number"
              min="0"
              max="13"
              inputmode="numeric"
              :aria-label="`${game.team_2} ${disciplineTitle(discipline)}`"
              :disabled="readOnly"
              @input="onChange"
            />
          </div>

          <div v-if="hasRoster(teamTwo)" class="club-discipline__players">
            <select
              v-for="slot in discipline.playersPerTeam"
              :key="`${discipline.id}-team-2-${slot}`"
              v-model="discipline.team_2_players[slot - 1]"
              :disabled="readOnly"
              @change="onChange"
            >
              <option value="">{{ $t('clubCup.selectPlayer') }}</option>
              <option
                v-for="player in rosterOptions(teamTwo)"
                :key="player.key"
                :value="player.key"
                :disabled="isPlayerUsed(phase.key, 'team_2', player.key, discipline.id, slot - 1)"
              >
                {{ player.label }}
              </option>
            </select>
          </div>
          <div v-else class="club-discipline__players club-discipline__players--empty">—</div>
        </div>
      </section>

      <div v-if="hasLineupConflicts" class="club-match__warning">
        {{ $t('clubCup.duplicatePlayerWarning') }}
      </div>

      <footer class="club-match__totals">
        <div>
          <strong>{{ game.team_1 }}</strong>
          <span>{{ summary.team_1_game_points }} {{ $t('clubCup.gamePoints') }}</span>
          <small>{{ summary.team_1_games_won }} {{ $t('clubCup.gamesWon') }}</small>
        </div>
        <span class="club-match__total-score">
          {{ summary.team_1_game_points }} : {{ summary.team_2_game_points }}
        </span>
        <div>
          <strong>{{ game.team_2 }}</strong>
          <span>{{ summary.team_2_game_points }} {{ $t('clubCup.gamePoints') }}</span>
          <small>{{ summary.team_2_games_won }} {{ $t('clubCup.gamesWon') }}</small>
        </div>
      </footer>
    </div>
  </article>
</template>

<script>
import { CheckCircle2, ChevronDown } from 'lucide-vue-next';
import { getGameLaneNumber } from '@/services/lanes';
import {
  CLUB_PHASES,
  getClubLineupConflicts,
  getClubMatchSummary,
  getClubPhaseGames,
  isValidClubGameScore,
  syncClubMatch,
} from '@/services/club-tournament';

export default {
  name: 'ClubMatch',
  components: { CheckCircle2, ChevronDown },
  props: {
    game: { type: Object, required: true },
    tournament: { type: Object, required: true },
    gameIndex: { type: Number, default: 0 },
    laneNumber: { type: [Number, String], default: null },
    readOnly: { type: Boolean, default: false },
  },
  emits: ['update'],
  data() {
    return {
      expanded: !this.readOnly,
      phases: CLUB_PHASES,
    };
  },
  computed: {
    teamOne() {
      return this.tournament.teams?.find((team) => team.title === this.game.team_1) || null;
    },
    teamTwo() {
      return this.tournament.teams?.find((team) => team.title === this.game.team_2) || null;
    },
    summary() {
      return this.game.clubMatch?.summary || getClubMatchSummary(this.game);
    },
    displayLane() {
      if (this.laneNumber !== null && this.laneNumber !== undefined) return this.laneNumber;
      return getGameLaneNumber(this.game, this.tournament, this.gameIndex);
    },
    teamOneWins() {
      return this.game.status === 'finished' && this.summary.team_1_game_points > this.summary.team_2_game_points;
    },
    teamTwoWins() {
      return this.game.status === 'finished' && this.summary.team_2_game_points > this.summary.team_1_game_points;
    },
    hasLineupConflicts() {
      return (
        getClubLineupConflicts(this.game, 'team_1').length > 0 || getClubLineupConflicts(this.game, 'team_2').length > 0
      );
    },
  },
  methods: {
    phaseGames(phaseKey) {
      return getClubPhaseGames(this.game, phaseKey);
    },
    phaseTitle(phaseKey) {
      return this.$t(`clubCup.${phaseKey}`);
    },
    disciplineTitle(discipline) {
      if (discipline.variant === 'women') return this.$t('clubCup.womenSingles');
      if (discipline.variant === 'mixed') {
        return discipline.phase === 'doubles' ? this.$t('clubCup.mixedDoubles') : this.$t('clubCup.mixedTriples');
      }
      return this.$t(`clubCup.${discipline.phase}Number`, { number: discipline.number });
    },
    displayScore(score) {
      return score === null || score === undefined || score === '' ? '–' : score;
    },
    disciplineHasError(discipline) {
      const hasAnyScore =
        (discipline.team_1_score !== null && discipline.team_1_score !== '') ||
        (discipline.team_2_score !== null && discipline.team_2_score !== '');
      return hasAnyScore && !isValidClubGameScore(discipline);
    },
    hasRoster(team) {
      return Array.isArray(team?.players) && team.players.length > 0;
    },
    rosterOptions(team) {
      return (team?.players || []).map((player, index) => ({
        key: String(player?.id ?? `${player?.surname || ''}|${player?.name || ''}|${index}`),
        label: [player?.surname, player?.name, player?.second_name].filter(Boolean).join(' ').trim(),
      }));
    },
    isPlayerUsed(phaseKey, side, playerKey, currentDisciplineId, currentSlot) {
      if (!playerKey) return false;
      const field = side === 'team_2' ? 'team_2_players' : 'team_1_players';
      return this.phaseGames(phaseKey).some((discipline) =>
        (discipline[field] || []).some(
          (selected, slotIndex) =>
            String(selected) === String(playerKey) &&
            !(discipline.id === currentDisciplineId && slotIndex === currentSlot),
        ),
      );
    },
    onChange() {
      if (this.readOnly) return;
      syncClubMatch(this.game);
      this.$emit('update', this.gameIndex);
    },
  },
};
</script>

<style scoped>
.club-match {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  box-shadow: 0 2px 8px rgb(0 0 0 / 4%);
}

.club-match--finished {
  border-color: rgb(46 204 113 / 40%);
}

.club-match__summary {
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  border: 0;
  background: transparent;
  color: var(--color-text);
  padding: 0.85rem 1rem;
  cursor: pointer;
  text-align: left;
}

.club-match__lane {
  padding: 0.2rem 0.45rem;
  border-radius: 6px;
  background: var(--color-primary);
  color: var(--color-btn-text);
  font-size: 0.72rem;
  font-weight: 700;
}

.club-match__team {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}

.club-match__team--left {
  text-align: right;
}

.club-match__team--winner {
  color: var(--color-success, #208e4e);
  font-weight: 800;
}

.club-match__score {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 92px;
}

.club-match__score strong {
  font-size: 1.2rem;
}

.club-match__score small {
  color: var(--color-text-muted);
  font-size: 0.68rem;
  white-space: nowrap;
}

.club-match__chevron {
  transition: transform 0.2s;
}

.club-match__chevron--open {
  transform: rotate(180deg);
}

.club-match__body {
  border-top: 1px solid var(--color-border);
  padding: 0.9rem;
}

.club-match__format-note {
  margin: 0 0 0.85rem;
  color: var(--color-text-secondary);
  font-size: 0.82rem;
}

.club-phase + .club-phase {
  margin-top: 0.9rem;
}

.club-phase__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.45rem 0.6rem;
  border-radius: 7px 7px 0 0;
  background: var(--color-surface-hover);
}

.club-phase__header span {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.club-phase__teams {
  display: grid;
  grid-template-columns: 1fr 110px 1fr;
  gap: 0.75rem;
  padding: 0.35rem 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  text-align: center;
}

.club-phase__teams span:first-child {
  text-align: right;
}

.club-phase__teams span:last-child {
  text-align: left;
}

.club-discipline {
  display: grid;
  grid-template-columns: minmax(120px, 0.7fr) minmax(160px, 1fr) 110px minmax(160px, 1fr);
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.6rem;
  border-top: 1px solid var(--color-border);
}

.club-discipline--invalid {
  background: rgb(229 57 53 / 6%);
}

.club-discipline--finished .club-discipline__label svg {
  color: var(--color-success, #208e4e);
}

.club-discipline__label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.84rem;
}

.club-discipline__label small {
  margin-left: auto;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.club-discipline__players {
  display: grid;
  gap: 0.3rem;
}

.club-discipline__players--left select {
  text-align: right;
}

.club-discipline__players select {
  min-width: 0;
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-input);
  color: var(--color-text);
  padding: 0.35rem 0.45rem;
  font-size: 0.78rem;
}

.club-discipline__players--empty {
  color: var(--color-text-muted);
  text-align: center;
}

.club-discipline__score {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.3rem;
}

.club-discipline__score input {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-input);
  color: var(--color-text);
  padding: 0.4rem 0.25rem;
  text-align: center;
  font-weight: 700;
}

.club-discipline__score input:disabled,
.club-discipline__players select:disabled {
  opacity: 0.78;
}

.club-match__warning {
  margin-top: 0.8rem;
  padding: 0.55rem 0.7rem;
  border-radius: 7px;
  background: rgb(245 158 11 / 12%);
  color: var(--color-warning-dark, #9a6400);
  font-size: 0.82rem;
}

.club-match__totals {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: var(--color-surface-hover);
}

.club-match__totals > div {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.club-match__totals > div:first-child {
  text-align: right;
}

.club-match__totals span,
.club-match__totals small {
  color: var(--color-text-secondary);
}

.club-match__total-score {
  color: var(--color-text) !important;
  font-size: 1.35rem;
  font-weight: 800;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .club-discipline {
    grid-template-columns: 1fr 92px 1fr;
  }

  .club-discipline__label {
    grid-column: 1 / -1;
  }

  .club-phase__teams {
    grid-template-columns: 1fr 92px 1fr;
  }
}

@media (max-width: 600px) {
  .club-match__summary {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.45rem;
  }

  .club-match__lane {
    grid-row: 1 / 3;
  }

  .club-match__team {
    text-align: center;
  }

  .club-match__score {
    grid-column: 2;
    grid-row: 2;
  }

  .club-match__chevron {
    grid-column: 3;
    grid-row: 1 / 3;
  }

  .club-phase__teams {
    display: none;
  }

  .club-discipline {
    grid-template-columns: 1fr 82px 1fr;
    gap: 0.4rem;
    padding: 0.6rem 0.35rem;
  }

  .club-discipline__players select {
    font-size: 0.7rem;
    padding-inline: 0.2rem;
  }

  .club-match__body {
    padding: 0.65rem 0.45rem;
  }

  .club-match__totals {
    gap: 0.5rem;
    font-size: 0.75rem;
  }
}
</style>
