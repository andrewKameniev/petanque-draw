<template>
  <div v-if="enabled" class="round-timer-controls">
    <RoundTimer
      v-if="hasVisibleTimer"
      :timer-started-at="timer.timerStartedAt"
      :timer-ends-at="timer.timerEndsAt"
      :timer-status="timer.timerStatus"
      :remaining-ms="timer.remainingMs || 0"
      :cochonettes-enabled="cochonettesEnabled"
      :cochonettes="cochonettes"
      :read-only="readOnly"
      @timer-ended="$emit('timer-ended')"
      @restart="$emit('restart', $event)"
      @pause="$emit('pause')"
      @resume="$emit('resume')"
      @reset="$emit('reset')"
    />
    <button v-else-if="!readOnly && canStart" type="button" class="round-timer-controls__start" @click="$emit('start')">
      <Timer :size="16" aria-hidden="true" />
      {{ $t('timer.startTimer') }}
    </button>
    <p v-else-if="!hasKnownTimerStatus" class="round-timer-controls__error" role="alert">
      {{ $t('timer.invalidStatus') }}
    </p>
  </div>
</template>

<script>
import { Timer } from 'lucide-vue-next';
import RoundTimer from '@/components/partials/RoundTimer.vue';

export default {
  name: 'RoundTimerControls',
  components: { RoundTimer, Timer },
  props: {
    timer: { type: Object, default: () => ({}) },
    enabled: { type: Boolean, default: true },
    readOnly: { type: Boolean, default: false },
    cochonettesEnabled: { type: Boolean, default: false },
    cochonettes: { type: Number, default: 1 },
  },
  emits: ['start', 'timer-ended', 'restart', 'pause', 'resume', 'reset'],
  computed: {
    hasKnownTimerStatus() {
      return ['not_started', 'running', 'ended', 'paused'].includes(this.timer?.timerStatus || 'not_started');
    },
    hasVisibleTimer() {
      return ['running', 'ended', 'paused'].includes(this.timer?.timerStatus);
    },
    canStart() {
      return (this.timer?.timerStatus || 'not_started') === 'not_started';
    },
  },
};
</script>

<style scoped>
.round-timer-controls {
  display: flex;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.round-timer-controls__start {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-primary);
  cursor: pointer;
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  transition:
    color 0.15s,
    background 0.15s;
}

.round-timer-controls__start:hover {
  color: var(--color-btn-text);
  background: var(--color-primary);
}

.round-timer-controls__start:focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}

.round-timer-controls__error {
  color: var(--color-text);
  font-weight: 600;
}
</style>
