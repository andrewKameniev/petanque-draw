<template>
    <div class="round-timer" :class="{'round-timer--ended': isEnded}">
        <div class="round-timer__display">
            <Timer :size="18" class="round-timer__icon"/>
            <span v-if="isEnded" class="round-timer__text round-timer__text--ended">
                {{ $t('timer.timeLimitEnded') }}
            </span>
            <span v-else class="round-timer__text">
                {{ formattedTime }}
            </span>
        </div>
        <div v-if="isEnded && cochonettesMessage" class="round-timer__cochonettes">
            {{ cochonettesMessage }}
        </div>
    </div>
</template>

<script>
import {Timer} from "lucide-vue-next";

export default {
    name: 'RoundTimer',
    components: {Timer},
    props: {
        timerStartedAt: {type: String, default: null},
        timerEndsAt: {type: String, default: null},
        timerStatus: {type: String, default: 'not_started'},
        cochonettesEnabled: {type: Boolean, default: false},
        cochonettes: {type: Number, default: 1}
    },
    data() {
        return {
            now: Date.now(),
            interval: null
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
        }
    },
    watch: {
        timerStatus(val) {
            if (val === 'running') {
                this.startTick();
            } else if (val === 'ended' || val === 'not_started') {
                this.stopTick();
            }
        },
        isEnded(val) {
            if (val) {
                this.$emit('timer-ended');
            }
        }
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
        }
    }
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
</style>
