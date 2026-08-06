<template>
  <div class="tir-scoring">
    <TirRoundTabs
      v-if="isTwoRoundSystem && scoringRoundTabs.length > 1 && !activeParticipant && activeAtelier === null"
      :model-value="activeScoringRound"
      :tabs="scoringRoundTabs"
      :label="$t('tir.round')"
      @update:model-value="$emit('select-round', $event)"
    />

    <div class="tir-scoring__mode-toggle">
      <button
        type="button"
        class="tir-scoring__mode-btn"
        :class="{ 'tir-scoring__mode-btn--active': scoringMode === 'participant' }"
        :aria-pressed="scoringMode === 'participant'"
        @click="$emit('select-mode', 'participant')"
      >
        {{ $t('tir.byParticipant') }}
      </button>
      <button
        type="button"
        class="tir-scoring__mode-btn"
        :class="{ 'tir-scoring__mode-btn--active': scoringMode === 'atelier' }"
        :aria-pressed="scoringMode === 'atelier'"
        @click="$emit('select-mode', 'atelier')"
      >
        {{ $t('tir.byAtelier') }}
      </button>
    </div>

    <template v-if="scoringMode === 'participant'">
      <div v-if="!activeParticipant" class="tir-scoring__select">
        <button
          v-for="(participant, index) in scoringListParticipants"
          :key="participant.id"
          type="button"
          class="tir-scoring__participant-row"
          @click="$emit('select-participant', participant)"
        >
          <span class="tir-scoring__participant-rank">{{ index + 1 }}</span>
          <div class="tir-scoring__participant-info">
            <div class="tir-scoring__participant-name">{{ participant.name }}</div>
            <div class="tir-scoring__progress-bar">
              <div class="tir-scoring__progress-fill" :style="{ width: getProgressPercent(participant) + '%' }"></div>
            </div>
            <div class="tir-scoring__progress-meta">
              <span class="tir-scoring__progress-text">
                {{ getThrowCount(participant) }} / {{ totalThrows }} {{ $t('tir.throws') }}
              </span>
              <span class="tir-scoring__progress-pct">{{ getProgressPercent(participant) }}%</span>
            </div>
          </div>
          <div class="tir-scoring__participant-right">
            <span class="tir-scoring__participant-score">
              <strong>{{ getScoreTotal(participant) }}</strong>
              <span class="tir-scoring__score-max">/{{ maxTotalScore }}</span>
            </span>
            <span class="tir-scoring__participant-status" :class="getStatusClass(participant)">
              <CheckCircle v-if="isComplete(participant)" :size="16" aria-hidden="true" />
              <AlertCircle v-else-if="getThrowCount(participant) > 0" :size="16" aria-hidden="true" />
              <Circle v-else :size="16" aria-hidden="true" />
            </span>
          </div>
        </button>
      </div>
      <TirParticipantView
        v-else
        :participant="activeParticipant"
        :ateliers="ateliers"
        :distances="distances"
        :scores-key="scoresKey"
        :read-only="readOnly"
        @back="$emit('participant-back')"
        @update="$emit('score-update', $event)"
        @next="$emit('next-participant')"
      />
    </template>

    <template v-if="scoringMode === 'atelier'">
      <div v-if="activeAtelier === null" class="tir-scoring__ateliers">
        <button
          v-for="(atelier, index) in ateliers"
          :key="index"
          type="button"
          class="tir-scoring__atelier-card"
          @click="$emit('select-atelier', index)"
        >
          <div class="tir-scoring__atelier-num">{{ index + 1 }}</div>
          <div class="tir-scoring__atelier-info">
            <div class="tir-scoring__atelier-name">{{ atelier.name }}</div>
            <div class="tir-scoring__atelier-desc">{{ atelier.description }}</div>
          </div>
          <div class="tir-scoring__atelier-progress">
            {{ getAtelierCompletedCount(index) }}/{{ scoringParticipants.length }}
          </div>
        </button>
      </div>
      <TirAtelierView
        v-else
        :atelier-index="activeAtelier"
        :atelier="ateliers[activeAtelier]"
        :participants="alphabeticParticipants"
        :distances="distances"
        :scores-key="scoresKey"
        :read-only="readOnly"
        @back="$emit('select-atelier', null)"
        @update="$emit('score-update', $event)"
        @finish="$emit('finish-atelier')"
      />
    </template>

    <div v-if="showTiebreaker" class="tir-tiebreaker">
      <div class="tir-tiebreaker__header">
        <h4 class="tir-tiebreaker__title">{{ $t('tir.tiebreaker') }} {{ tiebreakerDisplayNumber }}</h4>
        <p class="tir-tiebreaker__desc">{{ $t('tir.tiebreakerDesc') }}</p>
      </div>
      <div v-if="!isTiebreakerInProgress" class="tir-tiebreaker__actions">
        <button type="button" class="tir-table__playoff-btn" @click="$emit('start-tiebreaker')">
          {{ $t('tir.startTiebreaker') }}
        </button>
      </div>
      <div v-else-if="isTiebreakerRoundComplete" class="tir-tiebreaker__actions">
        <button type="button" class="tir-table__playoff-btn" @click="$emit('finish-tiebreaker')">
          {{ $t('tir.finishTiebreaker') }}
        </button>
      </div>
      <p v-else class="tir-tiebreaker__desc">{{ $t('tir.tiebreakerInProgress') }}</p>
    </div>

    <div v-if="showRoundTwoTransition" class="tir-table__actions">
      <p class="tir-table__hint">{{ $t('tir.round2Hint') }}</p>
      <div class="tir-table__actions-row">
        <button type="button" class="tir-table__playoff-btn" @click="$emit('start-round-two')">
          {{ $t('tir.startRound2') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { CheckCircle, AlertCircle, Circle } from 'lucide-vue-next';
import TirParticipantView from './TirParticipantView.vue';
import TirAtelierView from './TirAtelierView.vue';
import TirRoundTabs from '@/components/ui/TirRoundTabs.vue';
import { getScoreTotal, getThrowCount, isParticipantComplete, isAtelierComplete } from '@/services/tir';

export default {
  name: 'TirScoringWorkspace',
  components: { CheckCircle, AlertCircle, Circle, TirParticipantView, TirAtelierView, TirRoundTabs },
  props: {
    isTwoRoundSystem: { type: Boolean, required: true },
    scoringRoundTabs: { type: Array, required: true },
    activeScoringRound: { type: [String, Number], required: true },
    scoringMode: { type: String, required: true },
    activeParticipant: { type: Object, default: null },
    activeAtelier: { type: Number, default: null },
    scoringListParticipants: { type: Array, required: true },
    scoringParticipants: { type: Array, required: true },
    alphabeticParticipants: { type: Array, required: true },
    ateliers: { type: Array, required: true },
    distances: { type: Array, required: true },
    scoresKey: { type: String, required: true },
    totalThrows: { type: Number, required: true },
    maxTotalScore: { type: Number, required: true },
    readOnly: { type: Boolean, default: false },
    showTiebreaker: { type: Boolean, default: false },
    tiebreakerDisplayNumber: { type: Number, default: 1 },
    isTiebreakerInProgress: { type: Boolean, default: false },
    isTiebreakerRoundComplete: { type: Boolean, default: false },
    showRoundTwoTransition: { type: Boolean, default: false },
  },
  emits: [
    'select-round',
    'select-mode',
    'select-participant',
    'participant-back',
    'score-update',
    'next-participant',
    'select-atelier',
    'finish-atelier',
    'start-tiebreaker',
    'finish-tiebreaker',
    'start-round-two',
  ],
  methods: {
    getScoreTotal(participant) {
      return getScoreTotal(participant, this.scoresKey);
    },
    getThrowCount(participant) {
      return getThrowCount(participant, this.scoresKey);
    },
    getProgressPercent(participant) {
      return Math.round((this.getThrowCount(participant) / this.totalThrows) * 100);
    },
    isComplete(participant) {
      return isParticipantComplete(participant, this.scoresKey, this.totalThrows);
    },
    getStatusClass(participant) {
      if (this.isComplete(participant)) return 'tir-scoring__participant-status--complete';
      if (this.getThrowCount(participant) > 0) return 'tir-scoring__participant-status--partial';
      return '';
    },
    getAtelierCompletedCount(atelierIndex) {
      return this.scoringParticipants.filter((participant) =>
        isAtelierComplete(participant, this.scoresKey, atelierIndex, this.distances.length),
      ).length;
    },
  },
};
</script>

<style scoped>
.tir-scoring__mode-toggle {
  display: flex;
  background: var(--color-surface-alt);
  border-radius: 8px;
  padding: 3px;
  margin-bottom: 16px;
}

.tir-scoring__mode-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: var(--color-text);
  transition: all 0.2s;
}

.tir-scoring__mode-btn--active {
  background: var(--tir-touche);
  color: var(--grey-1200);
  box-shadow: 0 1px 3px var(--color-dropdown-shadow);
}

.tir-scoring__select,
.tir-scoring__ateliers {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tir-scoring__participant-row,
.tir-scoring__atelier-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  color: inherit;
  font: inherit;
  text-align: left;
}

.tir-scoring__mode-btn:focus-visible,
.tir-scoring__participant-row:focus-visible,
.tir-scoring__atelier-card:focus-visible,
.tir-table__playoff-btn:focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}

.tir-scoring__participant-row:hover {
  background: var(--color-surface-hover);
}

.tir-scoring__participant-rank {
  font-weight: 600;
  min-width: 20px;
  color: var(--color-text-muted);
}

.tir-scoring__participant-info,
.tir-scoring__atelier-info {
  flex: 1;
  min-width: 0;
}

.tir-scoring__participant-name {
  font-weight: 600;
  font-size: 15px;
}

.tir-scoring__atelier-name {
  font-weight: 600;
  font-size: 14px;
}

.tir-scoring__progress-bar {
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 6px;
}

.tir-scoring__progress-fill {
  height: 100%;
  background: var(--tir-touche);
  border-radius: 2px;
  transition: width 0.3s;
}

.tir-scoring__progress-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 3px;
}

.tir-scoring__progress-text,
.tir-scoring__progress-pct {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.tir-scoring__progress-pct {
  font-weight: 600;
}

.tir-scoring__atelier-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.tir-scoring__atelier-progress {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.tir-scoring__participant-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.tir-scoring__participant-score {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
}

.tir-scoring__score-max {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-secondary);
}

.tir-scoring__participant-status {
  color: var(--color-grey);
}

.tir-scoring__participant-status--complete {
  color: var(--tir-carreau);
}

.tir-scoring__participant-status--partial {
  color: var(--tir-touche);
}

.tir-scoring__atelier-card {
  gap: 12px;
  padding: 14px;
  border-radius: 10px;
}

.tir-scoring__atelier-card:hover {
  box-shadow: 0 2px 8px var(--color-card-shadow);
}

.tir-scoring__atelier-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--tir-touche);
  color: var(--grey-1200);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.tir-tiebreaker {
  margin-top: 16px;
  padding: 16px;
  border: 2px solid var(--color-warning);
  border-radius: 12px;
  background: var(--color-warning-bg);
}

.tir-tiebreaker__header {
  margin-bottom: 12px;
}

.tir-tiebreaker__title {
  margin: 0 0 4px;
  font-size: 16px;
}

.tir-tiebreaker__desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
}

.tir-table__hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 10px;
}

.tir-tiebreaker__actions {
  margin-top: 12px;
}

.tir-table__actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.tir-table__actions-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tir-table__playoff-btn {
  padding: 10px 20px;
  background: var(--tir-touche);
  color: var(--grey-1200);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

@media (prefers-reduced-motion: reduce) {
  .tir-scoring__progress-fill {
    transition: none;
  }
}
</style>
