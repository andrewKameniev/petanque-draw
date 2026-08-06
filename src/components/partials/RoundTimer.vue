<template>
  <div class="round-timer" :class="{ 'round-timer--ended': isEnded, 'round-timer--paused': isPaused }">
    <p v-if="!hasValidTimerData" class="round-timer__error" role="alert">
      {{ $t('timer.invalidData') }}
    </p>
    <template v-else>
      <div class="round-timer__display">
        <template v-if="readOnly">
          <Timer :size="18" class="round-timer__icon" aria-hidden="true" />
          <span
            class="round-timer__text"
            :class="{ 'round-timer__text--ended': isEnded, 'round-timer__text--paused': isPaused }"
          >
            {{ displayText }}
          </span>
        </template>
        <button
          v-else
          type="button"
          class="round-timer__restart-toggle"
          :aria-label="restartToggleLabel"
          :aria-expanded="showRestart"
          :aria-controls="showRestart ? restartPanelId : undefined"
          @click="toggleRestart"
        >
          <Timer :size="18" class="round-timer__icon" aria-hidden="true" />
          <span
            class="round-timer__text"
            :class="{ 'round-timer__text--ended': isEnded, 'round-timer__text--paused': isPaused }"
          >
            {{ showRestart ? $t('common.cancel') : displayText }}
          </span>
        </button>
        <div v-if="!readOnly && !showRestart && (isRunning || isPaused)" class="round-timer__actions">
          <button
            type="button"
            class="round-timer__action-btn"
            @click="onPauseResume"
            :title="isPaused ? $t('timer.resume') : $t('timer.pause')"
            :aria-label="isPaused ? $t('timer.resume') : $t('timer.pause')"
          >
            <Play v-if="isPaused" :size="20" aria-hidden="true" />
            <Pause v-else :size="20" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="round-timer__action-btn round-timer__action-btn--reset"
            @click="onReset"
            :title="$t('timer.reset')"
            :aria-label="$t('timer.reset')"
          >
            <TimerReset :size="20" aria-hidden="true" />
          </button>
        </div>
        <form
          v-if="!readOnly && showRestart"
          :id="restartPanelId"
          class="round-timer__restart"
          @submit.prevent="restart(customMinutes)"
        >
          <button
            v-for="opt in restartOptions"
            :key="opt"
            type="button"
            class="round-timer__restart-btn"
            :aria-label="`${$t('timer.restart')}: ${opt} ${$t('timer.min')}`"
            @click="restart(opt)"
          >
            {{ opt }} {{ $t('timer.min') }}
          </button>
          <label class="round-timer__visually-hidden" :for="customMinutesId">
            {{ $t('timer.restartMinutes') }}
          </label>
          <input
            :id="customMinutesId"
            ref="customMinutes"
            class="round-timer__restart-input"
            type="number"
            min="1"
            step="1"
            v-model.number="customMinutes"
            :placeholder="$t('timer.min')"
            :aria-invalid="customMinutesInvalid || undefined"
            :aria-describedby="customMinutesInvalid ? customMinutesErrorId : undefined"
            @keydown.enter.prevent="restart(customMinutes)"
          />
          <button
            type="button"
            class="round-timer__restart-btn round-timer__restart-btn--go"
            :aria-label="$t('timer.startCustom')"
            :disabled="!hasValidCustomMinutes"
            @click="restart(customMinutes)"
          >
            <Play :size="18" aria-hidden="true" />
          </button>
          <span v-if="customMinutesInvalid" :id="customMinutesErrorId" class="round-timer__restart-error">
            {{ $t('timer.invalidMinutes') }}
          </span>
        </form>
      </div>
      <div v-if="isEnded && cochonettesMessage && !showRestart" class="round-timer__cochonettes">
        {{ cochonettesMessage }}
      </div>
    </template>
  </div>
</template>

<script>
import { useId } from 'vue';
import { Timer, Pause, Play, TimerReset } from 'lucide-vue-next';

const TIMER_STATUSES = ['not_started', 'running', 'paused', 'ended'];

export default {
  name: 'RoundTimer',
  components: { Timer, Pause, Play, TimerReset },
  setup() {
    const instanceId = useId().replaceAll(':', '');
    return {
      restartPanelId: `round-timer-restart-${instanceId}`,
      customMinutesId: `round-timer-minutes-${instanceId}`,
      customMinutesErrorId: `round-timer-minutes-error-${instanceId}`,
    };
  },
  props: {
    timerStartedAt: { type: String, default: null },
    timerEndsAt: { type: String, default: null },
    timerStatus: {
      type: String,
      default: 'not_started',
      validator: (value) => TIMER_STATUSES.includes(value),
    },
    remainingMs: { type: Number, default: 0 },
    cochonettesEnabled: { type: Boolean, default: false },
    cochonettes: { type: Number, default: 1 },
    readOnly: { type: Boolean, default: false },
  },
  emits: ['timer-ended', 'restart', 'pause', 'resume', 'reset'],
  data() {
    return {
      now: Date.now(),
      interval: null,
      showRestart: false,
      restartOptions: [5, 10, 15, 30, 60],
      customMinutes: null,
      hasEmittedEnded: false,
    };
  },
  computed: {
    isEnded() {
      if (this.timerStatus === 'ended') return true;
      if (this.timerStatus === 'running' && this.timerEndsAtMs !== null) {
        return this.now >= this.timerEndsAtMs;
      }
      return false;
    },
    isPaused() {
      return this.timerStatus === 'paused';
    },
    isRunning() {
      return this.timerStatus === 'running' && !this.isEnded;
    },
    timeLeftMs() {
      if (this.isPaused) return Math.max(0, this.remainingMs || 0);
      if (this.timerEndsAtMs === null || this.isEnded) return 0;
      return Math.max(0, this.timerEndsAtMs - this.now);
    },
    formattedTime() {
      const totalSeconds = Math.ceil(this.timeLeftMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
    cochonettesMessage() {
      if (!this.cochonettesEnabled || !this.cochonettes) return '';
      const noun = this.cochonettes === 1 ? this.$t('timer.lastCochonette') : this.$t('timer.lastCochonettes');
      return `${this.$t('timer.playLastCochonette')} ${this.cochonettes} ${noun}`;
    },
    timerEndsAtMs() {
      if (!this.timerEndsAt) return null;
      const value = new Date(this.timerEndsAt).getTime();
      return Number.isFinite(value) ? value : null;
    },
    hasValidTimerData() {
      if (!TIMER_STATUSES.includes(this.timerStatus)) return false;
      if (this.timerStatus === 'running') return this.timerEndsAtMs !== null;
      if (this.timerStatus === 'paused') return Number.isFinite(this.remainingMs) && this.remainingMs >= 0;
      return true;
    },
    displayText() {
      return this.isEnded ? this.$t('timer.timeLimitEnded') : this.formattedTime;
    },
    restartToggleLabel() {
      if (this.showRestart) return this.$t('common.cancel');
      return `${this.$t('timer.restart')}: ${this.displayText}`;
    },
    hasValidCustomMinutes() {
      return Number.isInteger(this.customMinutes) && this.customMinutes >= 1;
    },
    customMinutesInvalid() {
      return this.customMinutes !== null && this.customMinutes !== '' && !this.hasValidCustomMinutes;
    },
  },
  watch: {
    timerStatus(val) {
      if (val === 'running' && this.hasValidTimerData && !this.isEnded) {
        this.startTick();
        this.showRestart = false;
      } else if (val === 'paused' || val === 'ended' || val === 'not_started') {
        this.stopTick();
      }
    },
    isEnded(val) {
      if (val) {
        this.stopTick();
        if (!this.hasEmittedEnded) {
          this.hasEmittedEnded = true;
          if (!this.readOnly) this.$emit('timer-ended');
        }
      } else {
        this.hasEmittedEnded = false;
      }
    },
    timerEndsAt() {
      if (this.timerStatus === 'running' && this.hasValidTimerData && !this.isEnded) this.startTick();
      else this.stopTick();
    },
  },
  mounted() {
    if (this.timerStatus === 'running' && this.hasValidTimerData && !this.isEnded) {
      this.startTick();
    }
  },
  beforeUnmount() {
    this.stopTick();
  },
  methods: {
    startTick() {
      this.stopTick();
      this.now = Date.now();
      this.interval = setInterval(() => {
        this.now = Date.now();
      }, 1000);
    },
    stopTick() {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    },
    toggleRestart() {
      this.showRestart = !this.showRestart;
      if (!this.showRestart) this.customMinutes = null;
    },
    restart(minutes) {
      const normalizedMinutes = Number(minutes);
      if (!Number.isInteger(normalizedMinutes) || normalizedMinutes < 1) return;
      this.showRestart = false;
      this.customMinutes = null;
      this.$emit('restart', normalizedMinutes);
    },
    onPauseResume() {
      if (this.isPaused) {
        this.$emit('resume');
      } else {
        this.$emit('pause');
      }
    },
    onReset() {
      this.$emit('reset');
    },
  },
};
</script>

<style scoped>
.round-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary);
}

.round-timer--ended {
  background: var(--color-danger-bg, #fff5f5);
  border-color: var(--color-danger-light);
}

.round-timer--paused {
  background: var(--color-warning-bg, #fffbeb);
  border-color: var(--color-warning, #f59e0b);
}

.round-timer__display {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.round-timer__restart-toggle {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  min-height: 36px;
  padding: 0.25rem 0.4rem;
  color: var(--color-text);
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
}

.round-timer__icon {
  color: var(--color-primary);
}

.round-timer--ended .round-timer__icon {
  color: var(--color-danger-light);
}

.round-timer--paused .round-timer__icon {
  color: var(--color-warning, #f59e0b);
}

.round-timer__text {
  font-size: 1.25rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
}

.round-timer__text--ended {
  font-size: 1rem;
}

.round-timer__text--paused {
  color: var(--color-warning-text);
}

.round-timer__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 0.5rem;
}

.round-timer__action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  color: var(--color-btn-text);
  cursor: pointer;
  background: var(--color-btn-dark);
  transition: opacity 0.15s;
}

.round-timer__action-btn:hover {
  opacity: 0.8;
}

.round-timer__action-btn--reset {
  background: var(--color-btn-dark);
}

.round-timer__cochonettes {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}

.round-timer__restart {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.round-timer__restart-btn {
  padding: 8px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-btn-text);
  background: var(--color-btn-dark);
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.round-timer__restart-btn:hover {
  opacity: 0.85;
}

.round-timer__restart-btn--go {
  padding: 8px 10px;
}

.round-timer__restart-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.round-timer__restart-input {
  width: 55px;
  padding: 8px 6px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  text-align: center;
  background: var(--color-surface, #fff);
  color: var(--color-text);
}

.round-timer__restart-toggle:focus-visible,
.round-timer__action-btn:focus-visible,
.round-timer__restart-btn:focus-visible,
.round-timer__restart-input:focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}

.round-timer__restart-error,
.round-timer__error {
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
}

.round-timer__restart-error {
  flex-basis: 100%;
}

.round-timer__visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .round-timer__action-btn {
    transition: none;
  }
}
</style>
