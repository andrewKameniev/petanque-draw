<template>
  <div class="tir-score-grid" :class="{ 'tir-score-grid--compact': compact }">
    <div class="tir-score-grid__header" aria-hidden="true">
      <div class="tir-score-grid__corner"></div>
      <div
        v-for="option in options"
        :key="option.key"
        class="tir-score-grid__heading"
        :class="`tir-score-grid__heading--${option.key}`"
      >
        {{ $t(`tir.${option.key}`) }}
      </div>
    </div>
    <div v-for="distance in distances" :key="distance" class="tir-score-grid__row">
      <div class="tir-score-grid__distance">{{ distance }}m</div>
      <button
        v-for="option in options"
        :key="option.key"
        type="button"
        class="tir-score-grid__cell"
        :class="{ [`tir-score-grid__cell--${option.key}`]: valueAt(distance) === option.key }"
        :aria-label="`${distance}m, ${$t(`tir.${option.key}`)}`"
        :aria-pressed="valueAt(distance) === option.key"
        :disabled="readOnly"
        @click="$emit('select', { distance, result: option.key })"
      >
        <Check v-if="valueAt(distance) === option.key" :size="14" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script>
import { Check } from 'lucide-vue-next';
import { RESULT_OPTIONS } from '@/services/tir';

export default {
  name: 'TirScoreGrid',
  components: { Check },
  props: {
    distances: { type: Array, required: true },
    scores: { type: Object, default: () => ({}) },
    options: { type: Array, default: () => RESULT_OPTIONS },
    readOnly: { type: Boolean, default: false },
    compact: { type: Boolean, default: false },
  },
  emits: ['select'],
  methods: {
    valueAt(distance) {
      return this.scores?.[distance] || null;
    },
  },
};
</script>

<style scoped>
.tir-score-grid {
  margin-bottom: 12px;
}

.tir-score-grid--compact {
  margin-bottom: 0;
}

.tir-score-grid__header,
.tir-score-grid__row {
  display: flex;
  gap: 3px;
}

.tir-score-grid__header {
  margin-bottom: 6px;
}

.tir-score-grid--compact .tir-score-grid__header {
  margin-bottom: 4px;
}

.tir-score-grid__row {
  margin-bottom: 3px;
}

.tir-score-grid__corner,
.tir-score-grid__distance {
  width: 32px;
  flex-shrink: 0;
}

.tir-score-grid__heading,
.tir-score-grid__cell {
  flex: 1;
}

.tir-score-grid__heading {
  padding: 2px;
  font-size: 10px;
  font-weight: 700;
  text-align: center;
}

.tir-score-grid__heading--carreau {
  color: var(--tir-carreau);
}

.tir-score-grid__heading--reussi {
  color: var(--tir-reussi);
}

.tir-score-grid__heading--touche {
  color: var(--tir-touche);
}

.tir-score-grid__heading--manque {
  color: var(--tir-manque);
}

.tir-score-grid__distance {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.tir-score-grid__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0;
  color: var(--color-text);
  cursor: pointer;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: 6px;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.tir-score-grid__cell:hover:not(:disabled),
.tir-score-grid__cell:focus-visible {
  border-color: var(--tir-touche);
}

.tir-score-grid__cell--carreau {
  color: var(--color-btn-text);
  background: var(--tir-carreau);
  border-color: var(--tir-carreau);
}

.tir-score-grid__cell--reussi {
  color: var(--color-btn-text);
  background: var(--tir-reussi);
  border-color: var(--tir-reussi);
}

.tir-score-grid__cell--touche {
  color: var(--color-btn-text);
  background: var(--tir-touche);
  border-color: var(--tir-touche);
}

.tir-score-grid__cell--manque {
  color: var(--color-btn-text);
  background: var(--tir-manque);
  border-color: var(--tir-manque);
}

.tir-score-grid__cell:disabled {
  cursor: default;
}
</style>
