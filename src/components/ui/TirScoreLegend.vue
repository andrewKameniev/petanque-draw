<template>
  <div class="tir-score-legend" :class="`tir-score-legend--${variant}`">
    <span v-for="option in options" :key="option.key" class="tir-score-legend__item">
      <span
        class="tir-score-legend__marker"
        :class="[`tir-score-legend__marker--${variant}`, `tir-score-legend__marker--${option.key}`]"
        aria-hidden="true"
      >
        <template v-if="variant === 'badge'">{{ option.points }}</template>
      </span>
      <span>
        {{ $t(`tir.${option.key}`)
        }}<template v-if="variant === 'badge'">: {{ option.points }} {{ $t('ranking.points') }}</template
        ><template v-else> ({{ option.points }})</template>
      </span>
    </span>
  </div>
</template>

<script>
import { RESULT_OPTIONS } from '@/services/tir';

export default {
  name: 'TirScoreLegend',
  props: {
    options: { type: Array, default: () => RESULT_OPTIONS },
    variant: {
      type: String,
      default: 'dot',
      validator: (value) => ['dot', 'badge'].includes(value),
    },
  },
};
</script>

<style scoped>
.tir-score-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 16px;
}

.tir-score-legend--dot {
  gap: 12px;
}

.tir-score-legend--badge {
  gap: 8px 12px;
}

.tir-score-legend__item {
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: var(--color-text);
}

.tir-score-legend__marker {
  flex-shrink: 0;
}

.tir-score-legend__marker--dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.tir-score-legend__marker--badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 11px;
  font-weight: 700;
  color: var(--grey-1200);
  border-radius: 50%;
}

.tir-score-legend__marker--carreau {
  background: var(--tir-carreau);
}

.tir-score-legend__marker--reussi {
  background: var(--tir-reussi);
}

.tir-score-legend__marker--touche {
  background: var(--tir-touche);
}

.tir-score-legend__marker--manque {
  background: var(--tir-manque);
}
</style>
