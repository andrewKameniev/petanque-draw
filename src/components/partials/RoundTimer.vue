<template>
  <div
    class="round-timer"
    :class="{ 'round-timer--ended': isEnded, 'round-timer--paused': isPaused, 'round-timer--clickable': !readOnly }"
    @click="onTimerClick"
  >
    <div class="round-timer__display">
      <Timer :size="18" class="round-timer__icon" />
      <span v-if="isEnded && !showRestart" class="round-timer__text round-timer__text--ended">
        {{ $t('timer.timeLimitEnded') }}
      </span>
      <span v-else-if="isPaused && !showRestart" class="round-timer__text round-timer__text--paused">
        {{ formattedTime }}
      </span>
      <span v-else-if="!showRestart" class="round-timer__text">
        {{ formattedTime }}
      </span>
      <div v-if="!readOnly && !showRestart && (isRunning || isPaused)" class="round-timer__actions">
        <button
          class="round-timer__action-btn"
          @click.stop="onPauseResume"
          :title="isPaused ? $t('timer.resume') : $t('timer.pause')"
        >
          <Play v-if="isPaused" :size="20" />
          <Pause v-else :size="20" />
        </button>
        <button
          class="round-timer__action-btn round-timer__action-btn--reset"
          @click.stop="onReset"
          :title="$t('timer.reset')"
        >
          <TimerReset :size="20" />
        </button>
      </div>
      <div v-if="showRestart" class="round-timer__restart">
        <button v-for="opt in restartOptions" :key="opt" class="round-timer__restart-btn" @click.stop="restart(opt)">
          {{ opt }}
        </button>
        <input
          ref="customMinutes"
          class="round-timer__restart-input"
          type="number"
          min="1"
          v-model.number="customMinutes"
          :placeholder="$t('timer.min')"
          @click.stop
          @keydown.enter.stop="restart(customMinutes)"
        />
        <button
          class="round-timer__restart-btn round-timer__restart-btn--go"
          @click.stop="restart(customMinutes)"
          :disabled="!customMinutes"
        >
          ▶
        </button>
      </div>
    </div>
    <div v-if="isEnded && cochonettesMessage && !showRestart" class="round-timer__cochonettes">
      {{ cochonettesMessage }}
    </div>
  </div>
</template>

<script>
import { Timer, Pause, Play, TimerReset } from 'lucide-vue-next';

export default {
  name: 'RoundTimer',
  components: { Timer, Pause, Play, TimerReset },
  props: {
    timerStartedAt: { type: String, default: null },
    timerEndsAt: { type: String, default: null },
    timerStatus: { type: String, default: 'not_started' },
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
    };
  },
  computed: {
    isEnded() {
      if (this.timerStatus === 'ended') return true;
      if (this.timerStatus === 'running' && this.timerEndsAt) {
        return this.now >= new Date(this.timerEndsAt).getTime();
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
      if (this.isPaused) return this.remainingMs || 0;
      if (!this.timerEndsAt || this.isEnded) return 0;
      return Math.max(0, new Date(this.timerEndsAt).getTime() - this.now);
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
  },
  watch: {
    timerStatus(val) {
      if (val === 'running') {
        this.startTick();
        this.showRestart = false;
      } else if (val === 'paused' || val === 'ended' || val === 'not_started') {
        this.stopTick();
      }
    },
    isEnded(val) {
      if (val) {
        this.$emit('timer-ended');
      }
    },
  },
  mounted() {
    if (this.timerStatus === 'running') {
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
    onTimerClick() {
      if (this.readOnly) return;
      this.showRestart = !this.showRestart;
    },
    restart(minutes) {
      if (!minutes || minutes < 1) return;
      this.showRestart = false;
      this.$emit('restart', minutes);
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

.round-timer--clickable {
  cursor: pointer;
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
  color: var(--color-primary);
}

.round-timer__text--ended {
  color: var(--color-danger-light);
  font-size: 1rem;
}

.round-timer__text--paused {
  color: var(--color-warning, #f59e0b);
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
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  transition: opacity 0.15s;
}

.round-timer__action-btn:hover {
  opacity: 0.8;
}

.round-timer__action-btn--reset {
  background: var(--color-muted, #6b7280);
}

.round-timer__cochonettes {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-danger-light);
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
  background: var(--color-primary);
  color: #fff;
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
  outline: none;
  background: var(--color-surface, #fff);
  color: var(--color-text);
}

.round-timer__restart-input:focus {
  box-shadow: 0 0 0 2px rgb(108 92 231 / 20%);
}
</style>
