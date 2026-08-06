<template>
  <div class="tir-aview">
    <div class="tir-aview__header">
      <button type="button" class="tir-aview__back" :aria-label="$t('tir.back')" @click="$emit('back')">
        <ChevronLeft :size="20" aria-hidden="true" />
      </button>
      <div class="tir-aview__info">
        <h3 class="tir-aview__name">{{ $t('tir.atelier') }} {{ atelierIndex + 1 }}</h3>
        <div class="tir-aview__desc">{{ atelier.name }}</div>
      </div>
    </div>

    <TirScoreLegend variant="badge" />

    <!-- Participants list for this atelier -->
    <div class="tir-aview__list">
      <div v-for="(participant, index) in participants" :key="participant.id" class="tir-aview__row">
        <button
          type="button"
          class="tir-aview__row-header"
          :aria-expanded="expandedId === participant.id"
          :aria-controls="participantPanelId(participant, index)"
          @click="toggleExpand(participant.id)"
        >
          <div class="tir-aview__row-info">
            <span class="tir-aview__row-rank">{{ index + 1 }}</span>
            <span class="tir-aview__row-name">{{ participant.name }}</span>
            <span class="tir-aview__row-score"
              >{{ getAtelierScore(participant) }}/{{ maxAtelierScore }} {{ $t('ranking.points') }}</span
            >
            <span class="tir-aview__row-throws"
              >{{ getAtelierThrows(participant) }} / {{ distances.length }} {{ $t('tir.throws') }}</span
            >
          </div>
          <div class="tir-aview__row-status">
            <CheckCircle
              v-if="isComplete(participant)"
              :size="16"
              class="tir-aview__icon--complete"
              aria-hidden="true"
            />
            <AlertCircle
              v-else-if="getAtelierThrows(participant) > 0"
              :size="16"
              class="tir-aview__icon--partial"
              aria-hidden="true"
            />
            <Circle v-else :size="16" class="tir-aview__icon--empty" aria-hidden="true" />
          </div>
          <div class="tir-aview__row-expand">
            <ChevronDown
              :size="16"
              :class="{ 'tir-aview__chevron--open': expandedId === participant.id }"
              aria-hidden="true"
            />
          </div>
        </button>
        <!-- Inline scoring grid -->
        <div
          v-if="expandedId === participant.id"
          :id="participantPanelId(participant, index)"
          class="tir-aview__row-grid"
        >
          <TirScoreGrid
            compact
            :distances="distances"
            :scores="getAtelierScores(participant)"
            :read-only="readOnly"
            @select="setScore(participant, $event.distance, $event.result)"
          />
        </div>
      </div>
    </div>

    <!-- Finish button -->
    <button v-if="!readOnly" type="button" class="tir-aview__finish" @click="showFinishConfirm = true">
      {{ $t('tir.finishAtelier') }}
    </button>

    <!-- Confirm modal -->
    <Modal v-if="showFinishConfirm" @close-modal="showFinishConfirm = false">
      <div class="tir-aview__confirm">
        <h4 class="tir-aview__confirm-title">{{ $t('tir.finishAtelier') }}</h4>
        <p class="tir-aview__confirm-text">{{ $t('tir.finishAtelierConfirm') }}</p>
        <div class="tir-aview__confirm-actions">
          <button
            type="button"
            class="tir-aview__confirm-btn tir-aview__confirm-btn--cancel"
            @click="showFinishConfirm = false"
          >
            {{ $t('common.cancel') }}
          </button>
          <button type="button" class="tir-aview__confirm-btn tir-aview__confirm-btn--confirm" @click="confirmFinish">
            {{ $t('common.confirm') }}
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import { ChevronLeft, ChevronDown, CheckCircle, AlertCircle, Circle } from 'lucide-vue-next';
import Modal from '@/components/Modal';
import TirScoreGrid from '@/components/ui/TirScoreGrid.vue';
import TirScoreLegend from '@/components/ui/TirScoreLegend.vue';

import {
  SCORING,
  getAtelierScore,
  getAtelierThrowCount,
  isAtelierComplete,
  toggleParticipantScore,
  fillMissingAtelierScoresForParticipants,
} from '@/services/tir';

export default {
  name: 'TirAtelierView',
  components: { ChevronLeft, ChevronDown, CheckCircle, AlertCircle, Circle, Modal, TirScoreGrid, TirScoreLegend },
  props: {
    atelierIndex: { type: Number, required: true },
    atelier: { type: Object, required: true },
    participants: { type: Array, required: true },
    distances: { type: Array, required: true },
    scoresKey: { type: String, default: 'scores' },
    readOnly: { type: Boolean, default: false },
  },
  emits: ['back', 'update', 'finish'],
  data() {
    return {
      expandedId: null,
      showFinishConfirm: false,
    };
  },
  computed: {
    maxAtelierScore() {
      return this.distances.length * SCORING.carreau;
    },
    allComplete() {
      return this.participants.every((p) => this.isComplete(p));
    },
  },
  methods: {
    toggleExpand(id) {
      this.expandedId = this.expandedId === id ? null : id;
    },
    participantPanelId(participant, index) {
      const key = String(participant.id ?? index).replace(/[^a-zA-Z0-9_-]/g, '-');
      return `tir-atelier-participant-${key}`;
    },
    getAtelierScore(participant) {
      return getAtelierScore(participant, this.scoresKey, this.atelierIndex);
    },
    getAtelierThrows(participant) {
      return getAtelierThrowCount(participant, this.scoresKey, this.atelierIndex);
    },
    isComplete(participant) {
      return isAtelierComplete(participant, this.scoresKey, this.atelierIndex, this.distances.length);
    },
    getAtelierScores(participant) {
      return participant[this.scoresKey]?.[this.atelierIndex] || {};
    },
    setScore(participant, distance, type) {
      if (this.readOnly) return;
      const updatedParticipant = toggleParticipantScore(participant, this.scoresKey, this.atelierIndex, distance, type);
      this.$emit('update', updatedParticipant);
    },
    confirmFinish() {
      const updatedParticipants = fillMissingAtelierScoresForParticipants(
        this.participants,
        this.scoresKey,
        this.atelierIndex,
        this.distances,
      );
      this.showFinishConfirm = false;
      this.$emit('update', updatedParticipants);
      this.$emit('finish');
    },
  },
};
</script>

<style scoped>
.tir-aview__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.tir-aview__back {
  padding: 6px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text);
}

.tir-aview__back:focus-visible,
.tir-aview__row-header:focus-visible,
.tir-aview__finish:focus-visible,
.tir-aview__confirm-btn:focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}

.tir-aview__name {
  margin: 0;
  font-size: 18px;
}

.tir-aview__desc {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.tir-aview__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tir-aview__row {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tir-aview__row-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  cursor: pointer;
  border-radius: 6px;
  padding: 4px;
  margin: -4px;
  transition: background 0.15s;
  color: inherit;
  font: inherit;
  text-align: left;
  background: transparent;
  border: 0;
}

.tir-aview__row-header:hover {
  background: var(--color-surface-alt);
}

.tir-aview__row-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.tir-aview__row-rank {
  font-weight: 600;
  min-width: 20px;
  color: var(--color-text-secondary);
}

.tir-aview__row-name {
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tir-aview__row-score {
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.tir-aview__row-throws {
  font-size: 11px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.tir-aview__row-status {
  display: flex;
  align-items: center;
}

.tir-aview__icon--complete {
  color: var(--tir-carreau);
}

.tir-aview__icon--partial {
  color: var(--tir-touche);
}

.tir-aview__icon--empty {
  color: var(--color-text-muted);
}

.tir-aview__row-expand {
  padding: 4px;
  color: var(--color-text-muted);
}

.tir-aview__chevron--open {
  transform: rotate(180deg);
}

.tir-aview__row-grid {
  width: 100%;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border-light);
}

.tir-aview__finish {
  margin-top: 16px;
  width: 100%;
  padding: 14px;
  background: var(--tir-delete);
  color: var(--grey-1200);
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
}

.tir-aview__confirm-title {
  margin: 0 -1.25rem;
  padding: 0 1.25rem 12px;
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: 14px;
  font-size: 16px;
  font-weight: 500;
}

.tir-aview__confirm-text {
  font-size: 14px;
  color: var(--color-text);
  margin: 0 4px 16px;
}

.tir-aview__confirm-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.tir-aview__confirm-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
}

.tir-aview__confirm-btn--cancel {
  background: var(--color-surface-alt);
  color: var(--color-text);
}

.tir-aview__confirm-btn--confirm {
  background: var(--tir-delete);
  color: var(--grey-1200);
}
</style>
