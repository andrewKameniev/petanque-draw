<template>
    <div @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" class="tracking">
        <div class="tracking__header">
            <div class="tracking__header-left">
                <button class="tracking__btn tracking__btn--ghost" @click="$emit('minimize')">
                    <ChevronsDown :size="16"/>
                </button>
                <button class="tracking__btn tracking__btn--primary-outline" @click="$emit('newGame')">
                    <Plus :size="14"/> {{ $t('stat.newGame') }}
                </button>
            </div>
            <div class="tracking__header-right">
                <button class="tracking__btn tracking__btn--primary" @click="$emit('finishGame')">
                    <Loader v-if="isSaving" class="tracking__spinner"/>
                    <template v-else>
                        <Check :size="14"/> {{ $t('stat.finishGame') }}
                    </template>
                </button>
            </div>
        </div>

        <div class="tracking__status">
            <div class="tracking__status-item">
                <span class="tracking__status-label">{{ $t('stat.man') }}</span>
                <span class="tracking__status-value">{{ currentMan + 1 }}<span class="tracking__status-dim">/{{ manCount }}</span></span>
            </div>
            <div class="tracking__status-item" v-if="gameName">
                <span class="tracking__status-label">{{ gameName }}</span>
            </div>
            <div class="tracking__status-item">
                <span class="tracking__status-label">{{ $t('stat.score') }}</span>
                <span class="tracking__status-value">{{ currentScore.team1 }} : {{ currentScore.team2 }}</span>
            </div>
        </div>

        <div class="tracking__distance">
            <span class="tracking__distance-label">{{ $t('stat.whatDistance') }}</span>
            <div class="tracking__pills">
                <button v-for="dist in throwDistances" :key="dist"
                        class="tracking__pill"
                        :class="{'tracking__pill--active': localManDistance === dist}"
                        @click="localManDistance = dist">
                    {{ dist === 11 ? '>10m' : '~' + dist + 'm' }}
                </button>
            </div>
        </div>

        <div class="tracking__teams">
            <Teaminfo :team="team1" :current-man="currentMan" :iterator="1" :system="statSystem" :isCouch="asCouch"
                      @update-score="onUpdateScore" @removethrow="onRemoveThrow" @addthrow="onAddThrow"
                      @x2throw="onX2Throw" @next="$emit('next')"
                      @updatethrow="onUpdateThrow" @changePlayer="onChangePlayer"/>
            <Teaminfo :team="team2" :current-man="currentMan" :iterator="2" :system="statSystem" :isCouch="asCouch"
                      @update-score="onUpdateScore" @removethrow="onRemoveThrow" @addthrow="onAddThrow"
                      @x2throw="onX2Throw" @next="$emit('next')"
                      @updatethrow="onUpdateThrow" @changePlayer="onChangePlayer"/>
        </div>

        <div class="tracking__nav">
            <button class="tracking__btn tracking__btn--secondary" @click="$emit('prev')" v-if="currentMan >= 1">
                <ChevronLeft :size="16"/> {{ $t('stat.prev') }}
            </button>
            <button class="tracking__btn tracking__btn--danger-outline" v-if="currentMan !== 0" @click="$emit('removeMan')">
                <Trash2 :size="14"/> {{ $t('stat.removeMan') }}
            </button>
            <button class="tracking__btn tracking__btn--success" @click="$emit('next')">
                {{ $t('stat.next') }} <ChevronRight :size="16"/>
            </button>
        </div>
    </div>
</template>

<script>
import Teaminfo from "@/components/stats/Teaminfo.vue";
import Loader from "@/components/Loader.vue";
import {throwDistances} from "@/helpers-stat.js";
import {ChevronsDown, Plus, Check, ChevronLeft, ChevronRight, Trash2} from "lucide-vue-next";

export default {
    name: 'StatsTracking',
    components: {Teaminfo, Loader, ChevronsDown, Plus, Check, ChevronLeft, ChevronRight, Trash2},
    props: ['team1', 'team2', 'currentMan', 'currentScore', 'manCount', 'statSystem', 'asCouch', 'isSaving', 'gameName'],
    emits: ['newGame', 'finishGame', 'updateScore', 'removeThrow', 'addThrow', 'x2Throw', 'updateThrow', 'changePlayer', 'next', 'prev', 'removeMan', 'distanceChange', 'minimize'],
    data() {
        return {
            throwDistances,
            startX: 0,
            startY: 0,
            swipeDirection: null,
            localManDistance: null,
        }
    },
    watch: {
        localManDistance(newValue) {
            this.$emit('distanceChange', newValue);
        }
    },
    methods: {
        onUpdateScore(team, score, manIndex) {
            this.$emit('updateScore', team, score, manIndex);
        },
        onRemoveThrow(team, playerIndex, manIndex, throwIndex) {
            this.$emit('removeThrow', team, playerIndex, manIndex, throwIndex);
        },
        onAddThrow(team, playerIndex, manIndex, throwIndex) {
            this.$emit('addThrow', team, playerIndex, manIndex, throwIndex);
        },
        onX2Throw(team, playerIndex, manIndex, throwIndex, value) {
            this.$emit('x2Throw', team, playerIndex, manIndex, throwIndex, value);
        },
        onUpdateThrow(team, playerIndex, manIndex, throwIndex, type, value) {
            this.$emit('updateThrow', team, playerIndex, manIndex, throwIndex, type, value);
        },
        onChangePlayer(iterator, playerIndex, playerName) {
            this.$emit('changePlayer', iterator, playerIndex, playerName);
        },
        onTouchStart(event) {
            this.startX = event.touches[0].clientX;
            this.startY = event.touches[0].clientY;
        },
        onTouchMove(event) {
            event.preventDefault();
        },
        onTouchEnd(event) {
            const endX = event.changedTouches[0].clientX;
            const endY = event.changedTouches[0].clientY;
            const deltaX = endX - this.startX;
            const deltaY = endY - this.startY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                this.swipeDirection = deltaX > 0 ? "right" : "left";
                if (Math.abs(endX - this.startX) > 50) {
                    if (this.swipeDirection === 'right') {
                        if (this.currentMan > 0) {
                            this.$emit('prev');
                        }
                    } else {
                        this.$emit('next');
                    }
                }
            } else {
                this.swipeDirection = deltaY > 0 ? "down" : "up";
            }
        },
    }
}
</script>

<style scoped>
.tracking {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
}

.tracking__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}

.tracking__header-left,
.tracking__header-right {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.tracking__status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
}

.tracking__status-item {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
}

.tracking__status-label {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--color-text-muted);
}

.tracking__status-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text);
}

.tracking__status-dim {
    font-size: 0.85rem;
    font-weight: 400;
    color: var(--color-text-muted);
}

.tracking__distance {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.tracking__distance-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-muted);
}

.tracking__pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
}

.tracking__pill {
    padding: 0.3rem 0.65rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.15s;
}

.tracking__pill:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-bg);
    color: var(--color-primary);
}

.tracking__pill--active {
    background: var(--color-primary);
    color: var(--color-btn-text);
    border-color: var(--color-primary);
}

.tracking__pill--active:hover {
    background: var(--color-primary-light);
    color: var(--color-btn-text);
}

.tracking__teams {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
}

.tracking__nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}

/* Buttons */
.tracking__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.5rem 0.9rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
    outline: none;
}

.tracking__btn:focus-visible {
    box-shadow: 0 0 0 3px var(--color-primary-shadow);
}

.tracking__btn--success:focus-visible {
    box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.3);
}

.tracking__btn--primary {
    background: var(--color-primary);
    color: var(--color-btn-text);
}

.tracking__btn--primary:hover {
    background: var(--color-primary-light);
}

.tracking__btn--secondary {
    background: var(--color-border);
    color: var(--color-text);
    border: 1px solid #ccc;
}

.tracking__btn--secondary:hover {
    background: var(--color-border-medium);
}

.tracking__btn--success {
    background: var(--color-success);
    color: var(--color-btn-text);
}

.tracking__btn--success:hover {
    background: var(--color-success-hover);
}

.tracking__btn--primary-outline {
    background: var(--color-primary);
    color: var(--color-btn-text);
}

.tracking__btn--primary-outline:hover {
    background: var(--color-primary-light);
}

.tracking__btn--danger-outline {
    background: transparent;
    color: var(--color-error);
    border: 1px solid var(--color-error);
}

.tracking__btn--danger-outline:hover {
    background: var(--color-error-bg);
}

.tracking__btn--ghost {
    background: var(--color-surface);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
    padding: 0.5rem;
}

.tracking__btn--ghost:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
    background: var(--color-primary-bg);
}

.tracking__spinner {
    width: 16px;
    height: 16px;
}
</style>
