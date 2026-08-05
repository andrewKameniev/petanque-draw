<template>
  <section class="tir-scoring-card" :class="{ 'tir-scoring-card--compact': compact }">
    <header class="tir-scoring-card__header">
      <span class="tir-scoring-card__number">{{ number }}</span>
      <span class="tir-scoring-card__name">{{ name }}</span>
      <span v-if="score !== null" class="tir-scoring-card__score">{{ score }}/{{ maxScore }}</span>
    </header>
    <slot></slot>
  </section>
</template>

<script>
export default {
  name: 'TirScoringCard',
  props: {
    number: { type: [Number, String], required: true },
    name: { type: String, required: true },
    score: { type: [Number, String], default: null },
    maxScore: { type: [Number, String], default: '' },
    compact: { type: Boolean, default: false },
  },
};
</script>

<style scoped>
.tir-scoring-card {
  padding: 12px;
  margin-bottom: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.tir-scoring-card--compact {
  padding: 10px 12px;
  margin-bottom: 10px;
}

.tir-scoring-card__header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}

.tir-scoring-card--compact .tir-scoring-card__header {
  margin-bottom: 8px;
}

.tir-scoring-card__number {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-btn-text);
  background: var(--tir-touche);
  border-radius: 50%;
}

.tir-scoring-card__name {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
}

.tir-scoring-card__score {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
}
</style>
