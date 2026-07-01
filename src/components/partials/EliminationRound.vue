<template>
  <div class="elimination-round">
    <h3 class="elimination-round__title">{{ $t('ranking.eliminationRound') }}</h3>

    <div v-if="!eliminationRound" class="elimination-round__setup">
      <p class="elimination-round__hint">{{ $t('ranking.eliminationHint') }}</p>
      <div class="elimination-round__config">
        <label class="elimination-round__label">{{ $t('ranking.targetBracketSize') }}</label>
        <div class="select">
          <select v-model.number="targetSize">
            <option v-for="size in bracketSizes" :key="size" :value="size">{{ size }}</option>
          </select>
        </div>
      </div>
      <p v-if="eliminationTeams.length" class="elimination-round__preview">
        {{ $t('ranking.teamsToEliminate') }}: {{ eliminationTeams.map((t) => t.title).join(', ') }}
      </p>
      <button class="elimination-round__btn" :disabled="eliminationTeams.length < 2" @click="startElimination">
        {{ $t('ranking.startElimination') }}
      </button>
    </div>

    <div v-else class="elimination-round__games">
      <div v-for="(game, index) in eliminationRound.games" :key="index" class="elimination-round__game">
        <div class="elimination-round__team">{{ game.team_1 }}</div>
        <div class="elimination-round__scores">
          <input
            type="number"
            min="0"
            class="elimination-round__score"
            v-model.number="game.team_1_score"
            @input="onScoreChange"
          />
          <span>:</span>
          <input
            type="number"
            min="0"
            class="elimination-round__score"
            v-model.number="game.team_2_score"
            @input="onScoreChange"
          />
        </div>
        <div class="elimination-round__team">{{ game.team_2 }}</div>
      </div>
      <button
        v-if="allScoresFilled && !eliminationRound.completed"
        class="elimination-round__btn elimination-round__btn--complete"
        @click="completeElimination"
      >
        {{ $t('common.confirm') }}
      </button>
      <div v-if="eliminationRound.completed" class="elimination-round__completed">
        <Check :size="16" /> {{ $t('ranking.eliminationRound') }} — {{ $t('common.done') }}
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { Check } from 'lucide-vue-next';

export default {
  name: 'EliminationRound',
  components: { Check },
  props: {
    teams: { type: Array, required: true },
    eliminationRound: { type: Object, default: null },
  },
  emits: ['completed'],
  data() {
    return {
      targetSize: this.getDefaultTargetSize(),
    };
  },
  computed: {
    bracketSizes() {
      const sizes = [];
      const teamCount = this.teams?.length || 0;
      for (let i = 2; i < teamCount; i *= 2) {
        sizes.push(i);
      }
      return sizes;
    },
    eliminationTeams() {
      if (!this.teams?.length) return [];
      const safeCount = this.targetSize - this.eliminationPairCount;
      if (safeCount < 0) return [];
      return this.teams.slice(safeCount);
    },
    eliminationPairCount() {
      const teamCount = this.teams?.length || 0;
      return teamCount - this.targetSize;
    },
    allScoresFilled() {
      if (!this.eliminationRound?.games) return false;
      return this.eliminationRound.games.every(
        (g) => g.team_1_score !== null && g.team_1_score !== '' && g.team_2_score !== null && g.team_2_score !== '',
      );
    },
  },
  methods: {
    ...mapActions(useMainStore, ['setTournamentBEliminationRound', 'completeTournamentBElimination', 'syncToFirebase']),
    getDefaultTargetSize() {
      const teamCount = this.teams?.length || 0;
      let size = 2;
      while (size * 2 <= teamCount) size *= 2;
      if (size === teamCount) size = size / 2;
      return size;
    },
    startElimination() {
      const pool = this.eliminationTeams;
      if (pool.length < 2) return;
      const games = [];
      const half = Math.floor(pool.length / 2);
      for (let i = 0; i < half; i++) {
        games.push({
          team_1: pool[i].title,
          team_2: pool[pool.length - 1 - i].title,
          team_1_score: null,
          team_2_score: null,
        });
      }
      this.setTournamentBEliminationRound({
        games,
        qualifiedFrom: this.targetSize - this.eliminationPairCount,
        bracketSize: this.targetSize,
        completed: false,
      });
    },
    completeElimination() {
      this.completeTournamentBElimination();
      this.$emit('completed');
    },
    onScoreChange() {
      this.syncToFirebase();
    },
  },
};
</script>

<style scoped>
.elimination-round {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
}

.elimination-round__title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.elimination-round__hint {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
}

.elimination-round__config {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.elimination-round__label {
  font-size: 0.875rem;
  font-weight: 500;
}

.elimination-round__preview {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.75rem;
  font-style: italic;
}

.elimination-round__btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  background: var(--color-primary);
  color: var(--color-btn-text, #fff);
  cursor: pointer;
  transition: all 0.15s;
}

.elimination-round__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.elimination-round__btn:hover:not(:disabled) {
  background: var(--color-primary-light);
}

.elimination-round__btn--complete {
  margin-top: 1rem;
}

.elimination-round__games {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.elimination-round__game {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.elimination-round__game:last-of-type {
  border-bottom: none;
}

.elimination-round__team {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
}

.elimination-round__team:last-child {
  text-align: right;
}

.elimination-round__scores {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.elimination-round__score {
  width: 3rem;
  padding: 0.35rem;
  text-align: center;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.875rem;
}

.elimination-round__completed {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--tir-winner-text, var(--color-success));
  font-weight: 600;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}
</style>
