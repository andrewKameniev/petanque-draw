<template>
  <div
    class="round-timer"
    :class="{ 'round-timer--ended': isEnded, 'round-timer--clickable': !readOnly }"
    @click="onTimerClick"
  >
    <div class="round-timer__display">
      <Timer :size="18" class="round-timer__icon" />
      <span v-if="isEnded && !showRestart" class="round-timer__text round-timer__text--ended">
        {{ $t('timer.timeLimitEnded') }}
      </span>
      <span v-else-if="!showRestart" class="round-timer__text">
        {{ formattedTime }}
      </span>
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
import { Timer } from 'lucide-vue-next';

export default {
  name: 'RoundTimer',
  components: { Timer },
  props: {
    timerStartedAt: { type: String, default: null },
    timerEndsAt: { type: String, default: null },
    timerStatus: { type: String, default: 'not_started' },
    cochonettesEnabled: { type: Boolean, default: false },
    cochonettes: { type: Number, default: 1 },
    readOnly: { type: Boolean, default: false },
  },
  emits: ['timer-ended', 'restart'],
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
    remainingMs() {
      if (!this.timerEndsAt || this.isEnded) return 0;
      return Math.max(0, new Date(this.timerEndsAt).getTime() - this.now);
    },
    formattedTime() {
      const totalSeconds = Math.ceil(this.remainingMs / 1000);
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
      } else if (val === 'ended' || val === 'not_started') {
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

.round-timer__cochonettes {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-danger-light);
}

.round-timer__restart {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.round-timer__restart-btn {
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.round-timer__restart-btn:hover {
  opacity: 0.85;
}

.round-timer__restart-btn--go {
  padding: 4px 8px;
}

.round-timer__restart-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.round-timer__restart-input {
  width: 50px;
  padding: 4px 6px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid var(--color-primary);
  border-radius: 6px;
  text-align: center;
  outline: none;
  background: var(--color-surface, #fff);
  color: var(--color-text);
}

.round-timer__restart-input:focus {
  box-shadow: 0 0 0 2px rgb(108 92 231 / 20%);
}
</style>
