<template>
  <button
    type="button"
    class="tir-scoring-action"
    :class="[`tir-scoring-action--${variant}`, { 'tir-scoring-action--compact': compact }]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot></slot>
  </button>
</template>

<script>
export default {
  name: 'TirScoringAction',
  props: {
    variant: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'primary', 'success', 'danger'].includes(value),
    },
    compact: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ['click'],
};
</script>

<style scoped>
.tir-scoring-action {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition:
    color 0.15s,
    background 0.15s,
    border-color 0.15s;
}

.tir-scoring-action:hover:not(:disabled),
.tir-scoring-action:focus-visible {
  border-color: var(--color-primary);
}

.tir-scoring-action:focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}

.tir-scoring-action--primary {
  color: var(--grey-1200);
  background: var(--tir-touche);
  border-color: var(--tir-touche);
}

.tir-scoring-action--success {
  color: var(--grey-1200);
  background: var(--tir-carreau);
  border-color: var(--tir-carreau);
}

.tir-scoring-action--danger {
  color: var(--color-text);
  border-color: var(--tir-manque);
}

.tir-scoring-action--danger:hover:not(:disabled),
.tir-scoring-action--danger:focus-visible {
  color: var(--grey-1200);
  background: var(--tir-manque);
  border-color: var(--tir-manque);
}

.tir-scoring-action--compact {
  padding: 6px 10px;
  font-size: 12px;
}

.tir-scoring-action:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
</style>
