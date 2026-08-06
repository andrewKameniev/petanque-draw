<template>
  <div class="tir-pview">
    <div class="tir-pview__header">
      <button type="button" class="tir-pview__back" :aria-label="$t('tir.back')" @click="$emit('back')">
        <ChevronLeft :size="20" aria-hidden="true" />
      </button>
      <div class="tir-pview__info">
        <h3 class="tir-pview__name">{{ participant.name }}</h3>
        <div class="tir-pview__total">
          <span class="tir-pview__total-score">{{ participantTotal }}</span>
          <span class="tir-pview__total-max">/ {{ maxTotalScore }} {{ $t('ranking.points') }}</span>
        </div>
        <div class="tir-pview__throws">{{ throwsCompleted }} / {{ totalThrows }} {{ $t('tir.throws') }}</div>
      </div>
    </div>

    <TirScoreLegend />

    <!-- All ateliers stacked (readOnly) -->
    <template v-if="readOnly">
      <TirScoringCard
        v-for="(atelier, aIdx) in ateliers"
        :key="aIdx"
        :number="aIdx + 1"
        :name="atelier.name"
        :score="getAtelierScore(aIdx)"
        :max-score="maxAtelierScore"
      >
        <div class="tir-pview__circles-grid">
          <div v-for="distance in distances" :key="distance" class="tir-pview__circles-row">
            <span class="tir-pview__circles-dist">{{ distance }}m</span>
            <TirScoreCircle
              v-for="opt in resultOptions"
              :key="opt.key"
              :result="opt.key"
              :active="getScoreAt(aIdx, distance) === opt.key"
              :aria-label="`${atelier.name}, ${distance}m, ${$t(`tir.${opt.key}`)}`"
            />
          </div>
        </div>
      </TirScoringCard>
    </template>

    <!-- Atelier tabs (scoring mode) -->
    <template v-else>
      <TirAtelierTabs
        v-model="activeAtelierIndex"
        :items="atelierTabs"
        :label="$t('tir.atelier')"
        :complete-label="$t('training.statusCompleted')"
      />

      <!-- Active atelier scoring -->
      <div class="tir-pview__atelier">
        <div class="tir-pview__atelier-header">
          <h4>{{ currentAtelier.name }}</h4>
          <div class="tir-pview__atelier-score">
            <span class="tir-pview__atelier-score-val">{{ getAtelierScore(activeAtelierIndex) }}</span>
            <span class="tir-pview__atelier-score-max">/ {{ maxAtelierScore }}</span>
          </div>
        </div>

        <TirScoreGrid
          :distances="distances"
          :scores="activeAtelierScores"
          @select="setScore($event.distance, $event.result)"
        />

        <div v-if="lastSaved" class="tir-pview__saved" aria-live="polite">
          <CheckCircle :size="14" aria-hidden="true" />
          {{ lastSaved }}
        </div>
      </div>
    </template>

    <!-- Navigation (scoring mode only) -->
    <div v-if="!readOnly" class="tir-pview__nav">
      <TirScoringAction @click="prevAtelier" :disabled="activeAtelierIndex === 0">
        <ChevronLeft :size="16" aria-hidden="true" />
        {{ $t('tir.prevAtelier') }}
      </TirScoringAction>
      <TirScoringAction v-if="activeAtelierIndex < ateliers.length - 1" @click="nextAtelier">
        {{ $t('tir.nextAtelier') }}
        <ChevronRight :size="16" aria-hidden="true" />
      </TirScoringAction>
      <TirScoringAction v-else variant="primary" @click="$emit('next')">
        {{ $t('tir.nextParticipant') }}
        <ChevronRight :size="16" aria-hidden="true" />
      </TirScoringAction>
    </div>
  </div>
</template>

<script>
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-vue-next';
import TirAtelierTabs from '@/components/ui/TirAtelierTabs.vue';
import TirScoreCircle from '@/components/ui/TirScoreCircle.vue';
import TirScoreGrid from '@/components/ui/TirScoreGrid.vue';
import TirScoreLegend from '@/components/ui/TirScoreLegend.vue';
import TirScoringAction from '@/components/ui/TirScoringAction.vue';
import TirScoringCard from '@/components/ui/TirScoringCard.vue';

import {
  SCORING,
  RESULT_OPTIONS,
  getScoreTotal,
  getThrowCount,
  getAtelierScore,
  isAtelierComplete,
  toggleParticipantScore,
} from '@/services/tir';

export default {
  name: 'TirParticipantView',
  components: {
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    TirAtelierTabs,
    TirScoreCircle,
    TirScoreGrid,
    TirScoreLegend,
    TirScoringAction,
    TirScoringCard,
  },
  props: {
    participant: { type: Object, required: true },
    ateliers: { type: Array, required: true },
    distances: { type: Array, required: true },
    scoresKey: { type: String, default: 'scores' },
    readOnly: { type: Boolean, default: false },
  },
  emits: ['back', 'update', 'next'],
  data() {
    return {
      activeAtelierIndex: 0,
      lastSaved: null,
    };
  },
  created() {
    this.goToFirstIncomplete();
  },
  watch: {
    participant() {
      this.goToFirstIncomplete();
    },
  },
  computed: {
    scoring() {
      return SCORING;
    },
    resultOptions() {
      return RESULT_OPTIONS;
    },
    isAllComplete() {
      return this.throwsCompleted >= this.totalThrows;
    },
    totalThrows() {
      return 5 * this.distances.length;
    },
    maxAtelierScore() {
      return this.distances.length * SCORING.carreau;
    },
    maxTotalScore() {
      return 5 * this.maxAtelierScore;
    },
    currentAtelier() {
      return this.ateliers[this.activeAtelierIndex];
    },
    atelierTabs() {
      return this.ateliers.map((atelier, index) => ({
        id: index,
        label: index + 1,
        complete: this.isAtelierComplete(index),
        name: atelier.name,
      }));
    },
    activeAtelierScores() {
      return this.participant[this.scoresKey]?.[this.activeAtelierIndex] || {};
    },
    participantTotal() {
      return getScoreTotal(this.participant, this.scoresKey);
    },
    throwsCompleted() {
      return getThrowCount(this.participant, this.scoresKey);
    },
  },
  methods: {
    goToFirstIncomplete() {
      const first = this.ateliers.findIndex((_, idx) => !this.isAtelierComplete(idx));
      this.activeAtelierIndex = first !== -1 ? first : 0;
    },
    getAtelierScore(atelierIndex) {
      return getAtelierScore(this.participant, this.scoresKey, atelierIndex);
    },
    isAtelierComplete(atelierIndex) {
      return isAtelierComplete(this.participant, this.scoresKey, atelierIndex, this.distances.length);
    },
    getScoreAt(atelierIdx, distance) {
      return this.participant[this.scoresKey]?.[atelierIdx]?.[distance] || null;
    },
    setScore(distance, type) {
      if (this.readOnly) return;
      const current = this.participant[this.scoresKey]?.[this.activeAtelierIndex]?.[distance];
      const updatedParticipant = toggleParticipantScore(
        this.participant,
        this.scoresKey,
        this.activeAtelierIndex,
        distance,
        type,
      );
      if (current === type) {
        this.lastSaved = null;
      } else {
        const label = this.$t(`tir.${type}`);
        this.lastSaved = `${this.$t('tir.saved')}: ${distance}m · ${label} · ${this.scoring[type]} ${this.$t('ranking.points')}`;
        if (isAtelierComplete(updatedParticipant, this.scoresKey, this.activeAtelierIndex, this.distances.length)) {
          setTimeout(() => {
            if (this.activeAtelierIndex < this.ateliers.length - 1) {
              this.activeAtelierIndex++;
            } else if (getThrowCount(updatedParticipant, this.scoresKey) >= this.totalThrows) {
              this.$emit('back');
            }
          }, 300);
        }
      }
      this.$emit('update', updatedParticipant);
    },
    prevAtelier() {
      if (this.activeAtelierIndex > 0) this.activeAtelierIndex--;
    },
    nextAtelier() {
      if (this.activeAtelierIndex < this.ateliers.length - 1) this.activeAtelierIndex++;
    },
  },
};
</script>

<style scoped>
.tir-pview__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.tir-pview__back {
  padding: 6px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text);
}

.tir-pview__back:focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}

.tir-pview__info {
  flex: 1;
}

.tir-pview__name {
  margin: 0;
  font-size: 18px;
}

.tir-pview__total {
  margin-top: 4px;
}

.tir-pview__total-score {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
}

.tir-pview__total-max {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.tir-pview__throws {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* Atelier */

.tir-pview__atelier {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
}

.tir-pview__atelier-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2px;
}

.tir-pview__atelier-header h4 {
  margin: 0;
  font-size: 16px;
}

.tir-pview__atelier-score {
  text-align: right;
}

.tir-pview__atelier-score-val {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
}

.tir-pview__atelier-score-max {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.tir-pview__atelier-score-label {
  display: block;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.tir-pview__atelier-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

/* Saved indicator */

.tir-pview__saved {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text);
  margin-top: 8px;
}

/* Navigation */

.tir-pview__nav {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

/* Stacked ateliers (complete/readOnly) */

.tir-pview__circles-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.tir-pview__circles-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tir-pview__circles-dist {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  min-width: 24px;
}
</style>
