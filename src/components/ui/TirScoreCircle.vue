<template>
  <component
    :is="interactive ? 'button' : 'span'"
    :type="interactive ? 'button' : undefined"
    class="tir-score-circle"
    :class="[
      `tir-score-circle--${result}`,
      {
        'tir-score-circle--active': active,
        'tir-score-circle--small': small || size === 'small',
        'tir-score-circle--compact': size === 'compact',
        'tir-score-circle--large': size === 'large',
      },
    ]"
    :disabled="interactive ? disabled : undefined"
    :aria-label="interactive ? ariaLabel : undefined"
    :aria-pressed="interactive ? active : undefined"
    @click="interactive && $emit('select', result)"
  ></component>
</template>

<script>
export default {
  name: 'TirScoreCircle',
  props: {
    result: {
      type: String,
      required: true,
      validator: (value) => ['carreau', 'reussi', 'touche', 'manque'].includes(value),
    },
    active: { type: Boolean, default: false },
    interactive: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    small: { type: Boolean, default: false },
    size: {
      type: String,
      default: 'default',
      validator: (value) => ['small', 'compact', 'default', 'large'].includes(value),
    },
    ariaLabel: { type: String, default: '' },
  },
  emits: ['select'],
};
</script>

<style scoped>
.tir-score-circle {
  display: inline-block;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  padding: 0;
  cursor: default;
  background: radial-gradient(circle, var(--tir-circle-inactive) 56%, var(--color-surface) 56%);
  border: 2px solid var(--tir-circle-inactive);
  border-radius: 50%;
  opacity: 0.35;
  transition:
    opacity 0.15s,
    transform 0.15s;
}

button.tir-score-circle {
  cursor: pointer;
}

button.tir-score-circle:hover:not(:disabled),
button.tir-score-circle:focus-visible {
  opacity: 0.7;
  transform: scale(1.08);
}

.tir-score-circle--active {
  opacity: 1;
}

.tir-score-circle--active.tir-score-circle--carreau {
  background: radial-gradient(circle, var(--tir-carreau) 56%, var(--color-surface) 56%);
  border-color: var(--tir-carreau);
}

.tir-score-circle--active.tir-score-circle--reussi {
  background: radial-gradient(circle, var(--tir-reussi) 56%, var(--color-surface) 56%);
  border-color: var(--tir-reussi);
}

.tir-score-circle--active.tir-score-circle--touche {
  background: radial-gradient(circle, var(--tir-touche) 56%, var(--color-surface) 56%);
  border-color: var(--tir-touche);
}

.tir-score-circle--active.tir-score-circle--manque {
  background: radial-gradient(circle, var(--tir-manque) 56%, var(--color-surface) 56%);
  border-color: var(--tir-manque);
}

.tir-score-circle--small {
  width: 22px;
  height: 22px;
}

.tir-score-circle--compact {
  width: 24px;
  height: 24px;
}

.tir-score-circle--large {
  width: 36px;
  height: 36px;
}

.tir-score-circle:disabled {
  cursor: default;
}
</style>
