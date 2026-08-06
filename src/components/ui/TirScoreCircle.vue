<template>
  <component
    :is="interactive ? 'button' : 'span'"
    :type="interactive ? 'button' : undefined"
    class="tir-score-circle"
    :class="[
      `tir-score-circle--${result}`,
      `tir-score-circle--${resolvedSize}`,
      {
        'tir-score-circle--active': active,
      },
    ]"
    :disabled="interactive ? disabled : undefined"
    :role="!interactive && active ? 'img' : undefined"
    :aria-label="interactive || active ? resolvedAriaLabel : undefined"
    :aria-hidden="!interactive && !active ? 'true' : undefined"
    :aria-pressed="interactive ? active : undefined"
    @click="interactive && $emit('select', result)"
  >
    <Check v-if="active" class="tir-score-circle__cue" :size="cueSize" aria-hidden="true" />
  </component>
</template>

<script>
import { Check } from 'lucide-vue-next';

export default {
  name: 'TirScoreCircle',
  components: { Check },
  props: {
    result: {
      type: String,
      required: true,
      validator: (value) => ['carreau', 'reussi', 'touche', 'manque'].includes(value),
    },
    active: { type: Boolean, default: false },
    interactive: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    size: {
      type: String,
      default: 'default',
      validator: (value) => ['small', 'compact', 'default', 'large'].includes(value),
    },
    ariaLabel: { type: String, default: '' },
  },
  emits: ['select'],
  computed: {
    resolvedSize() {
      return this.size;
    },
    resolvedAriaLabel() {
      const suppliedLabel = this.ariaLabel.trim();
      return suppliedLabel || this.$t(`tir.${this.result}`);
    },
    cueSize() {
      return this.resolvedSize === 'large' ? 18 : 14;
    },
  },
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

button.tir-score-circle:focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}

.tir-score-circle__cue {
  color: var(--grey-1200);
  stroke-width: 3;
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
  width: 24px;
  height: 24px;
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

@media (prefers-reduced-motion: reduce) {
  .tir-score-circle {
    transition: none;
  }

  button.tir-score-circle:hover:not(:disabled),
  button.tir-score-circle:focus-visible {
    transform: none;
  }
}
</style>
