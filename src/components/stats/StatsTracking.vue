<template>
  <div @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" class="tracking">
    <div class="tracking__header">
      <div class="tracking__header-left">
        <button class="tracking__btn tracking__btn--ghost" @click="$emit('minimize')">
          <ChevronsDown :size="16" />
        </button>
        <button class="tracking__btn tracking__btn--primary-outline" @click="$emit('newGame')">
          <Plus :size="14" /> {{ $t('stat.newGame') }}
        </button>
      </div>
      <div class="tracking__header-right">
        <button class="tracking__btn tracking__btn--primary" @click="$emit('finishGame')">
          <Loader v-if="isSaving" class="tracking__spinner" />
          <template v-else> <Check :size="14" /> {{ $t('stat.finishGame') }} </template>
        </button>
      </div>
    </div>

    <div class="tracking__status">
      <div v-if="gameName" class="tracking__status-context">
        <span class="tracking__status-icon" aria-hidden="true">
          <Trophy :size="17" :stroke-width="2" />
        </span>
        <span class="tracking__status-name" :title="gameName">{{ gameName }}</span>
      </div>
      <div class="tracking__status-metrics" aria-live="polite">
        <div class="tracking__status-item">
          <span class="tracking__status-label">{{ $t('stat.man') }}</span>
          <span class="tracking__status-value tracking__status-value--round">
            {{ currentMan + 1 }}<span class="tracking__status-dim">/{{ manCount }}</span>
          </span>
        </div>
        <div class="tracking__status-divider" aria-hidden="true"></div>
        <div class="tracking__status-item tracking__status-item--score">
          <span class="tracking__status-label">{{ $t('stat.score') }}</span>
          <span class="tracking__status-value tracking__status-value--score">
            {{ currentScore.team1 }}<span class="tracking__status-colon">:</span>{{ currentScore.team2 }}
          </span>
        </div>
      </div>
    </div>

    <div class="tracking__distance">
      <span class="tracking__distance-label">{{ $t('stat.whatDistance') }}</span>
      <div class="tracking__pills">
        <button
          v-for="dist in throwDistances"
          :key="dist"
          class="tracking__pill"
          :class="{ 'tracking__pill--active': localManDistance === dist }"
          @click="localManDistance = dist"
        >
          {{ dist === 11 ? '>10m' : '~' + dist + 'm' }}
        </button>
      </div>
    </div>

    <div class="tracking__teams">
      <Teaminfo
        :team="team1"
        :current-man="currentMan"
        :iterator="1"
        :system="statSystem"
        :isCouch="asCouch"
        :gameType="gameType"
        @update-score="onUpdateScore"
        @removethrow="onRemoveThrow"
        @addthrow="onAddThrow"
        @x2throw="onX2Throw"
        @next="$emit('next')"
        @updatethrow="onUpdateThrow"
        @changePlayer="onChangePlayer"
        @replacePlayer="onReplacePlayer"
      />
      <Teaminfo
        :team="team2"
        :current-man="currentMan"
        :iterator="2"
        :system="statSystem"
        :isCouch="asCouch"
        :gameType="gameType"
        @update-score="onUpdateScore"
        @removethrow="onRemoveThrow"
        @addthrow="onAddThrow"
        @x2throw="onX2Throw"
        @next="$emit('next')"
        @updatethrow="onUpdateThrow"
        @changePlayer="onChangePlayer"
        @replacePlayer="onReplacePlayer"
      />
    </div>

    <div class="tracking__nav">
      <button class="tracking__btn tracking__btn--secondary" @click="$emit('prev')" v-if="currentMan >= 1">
        <ChevronLeft :size="16" /> {{ $t('stat.prev') }}
      </button>
      <button class="tracking__btn tracking__btn--danger-outline" v-if="currentMan !== 0" @click="$emit('removeMan')">
        <Trash2 :size="14" /> {{ $t('stat.removeMan') }}
      </button>
      <button class="tracking__btn tracking__btn--success" @click="$emit('next')">
        {{ $t('stat.next') }} <ChevronRight :size="16" />
      </button>
    </div>
  </div>
</template>

<script>
import Teaminfo from '@/components/stats/Teaminfo.vue';
import Loader from '@/components/Loader.vue';
import { throwDistances } from '@/helpers-stat.js';
import { ChevronsDown, Plus, Check, ChevronLeft, ChevronRight, Trash2, Trophy } from 'lucide-vue-next';

export default {
  name: 'StatsTracking',
  components: { Teaminfo, Loader, ChevronsDown, Plus, Check, ChevronLeft, ChevronRight, Trash2, Trophy },
  props: [
    'team1',
    'team2',
    'currentMan',
    'currentScore',
    'manCount',
    'statSystem',
    'asCouch',
    'isSaving',
    'gameName',
    'gameType',
  ],
  emits: [
    'newGame',
    'finishGame',
    'updateScore',
    'removeThrow',
    'addThrow',
    'x2Throw',
    'updateThrow',
    'changePlayer',
    'replacePlayer',
    'next',
    'prev',
    'removeMan',
    'distanceChange',
    'minimize',
  ],
  data() {
    return {
      throwDistances,
      startX: 0,
      startY: 0,
      swipeDirection: null,
      isHorizontalSwipe: false,
      localManDistance: null,
    };
  },
  watch: {
    localManDistance(newValue) {
      this.$emit('distanceChange', newValue);
    },
    currentMan() {
      const activePlayer = this.team1.players?.find((p) => !p.wasChanged);
      const throws = activePlayer?.stat?.[this.currentMan];
      this.localManDistance = throws?.[0]?.distance || null;
    },
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
    onReplacePlayer(iterator, playerIndex, playerName, portalPlayerId = null) {
      this.$emit('replacePlayer', iterator, playerIndex, playerName, portalPlayerId);
    },
    onTouchStart(event) {
      this.startX = event.touches[0].clientX;
      this.startY = event.touches[0].clientY;
      this.isHorizontalSwipe = false;
    },
    onTouchMove(event) {
      if (event.touches.length > 1) {
        this.isHorizontalSwipe = false;
        return;
      }
      const deltaX = Math.abs(event.touches[0].clientX - this.startX);
      const deltaY = Math.abs(event.touches[0].clientY - this.startY);
      if (deltaX > 10 && deltaX > deltaY) {
        this.isHorizontalSwipe = true;
        event.preventDefault();
      }
    },
    onTouchEnd(event) {
      if (!this.isHorizontalSwipe) return;
      this.isHorizontalSwipe = false;

      const endX = event.changedTouches[0].clientX;
      const deltaX = endX - this.startX;

      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          if (this.currentMan > 0) {
            this.$emit('prev');
          }
        } else {
          this.$emit('next');
        }
      }
    },
  },
};
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
  padding: 0 0.75rem;
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
  gap: 1rem;
  position: relative;
  overflow: hidden;
  padding: 0.9rem 1rem;
  margin: 0 0.75rem;
  background: linear-gradient(135deg, var(--color-surface) 55%, var(--color-primary-bg));
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 8px 24px var(--color-card-shadow);
}

.tracking__status::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--color-primary);
}

.tracking__status-context {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  flex: 1;
}

.tracking__status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex: 0 0 2rem;
  color: var(--color-primary);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-bg-hover);
  border-radius: 10px;
}

.tracking__status-name {
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tracking__status-metrics {
  display: grid;
  grid-template-columns: minmax(5.5rem, 1fr) 1px minmax(6.5rem, 1fr);
  align-items: stretch;
  gap: 0.85rem;
  min-width: 15rem;
  padding: 0.55rem 0.75rem;
  background: var(--color-surface-semi);
  border: 1px solid var(--color-border-light);
  border-radius: 11px;
}

.tracking__status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
}

.tracking__status-item--score {
  min-width: 0;
}

.tracking__status-divider {
  width: 1px;
  background: var(--color-border);
}

.tracking__status-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.tracking__status-value {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
  color: var(--color-text);
  white-space: nowrap;
}

.tracking__status-value--round {
  color: var(--color-primary);
}

.tracking__status-value--score {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 1.45rem;
  font-variant-numeric: tabular-nums;
}

.tracking__status-colon {
  color: var(--color-text-muted);
  font-weight: 500;
}

.tracking__status-dim {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

@media (max-width: 700px) {
  .tracking__status {
    flex-direction: column;
    align-items: stretch;
    gap: 0.8rem;
    padding: 0.85rem 0.9rem 0.9rem;
  }

  .tracking__status-context {
    padding: 0 0.1rem;
  }

  .tracking__status-name {
    white-space: normal;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .tracking__status-metrics {
    min-width: 0;
    width: 100%;
  }
}

@media (max-width: 370px) {
  .tracking__status-metrics {
    grid-template-columns: minmax(4.5rem, 1fr) 1px minmax(5.5rem, 1fr);
    gap: 0.55rem;
    padding-inline: 0.6rem;
  }

  .tracking__status-item {
    gap: 0.35rem;
  }
}

.tracking__distance {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0 0.75rem;
}

.tracking__distance-label {
  font-size: 1rem;
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
  font-size: 1rem;
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

@media (max-width: 500px) {
  .tracking__nav {
    padding-inline: 0.75rem;
  }
}

/* Buttons */

.tracking__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  font-size: 1rem;
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
  box-shadow: 0 0 0 3px rgb(72 187 120 / 30%);
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
  white-space: nowrap;
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
