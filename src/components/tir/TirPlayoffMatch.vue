<template>
  <div class="tir-pmatch">
    <div class="tir-pmatch__header">
      <button type="button" class="tir-pmatch__back" @click="$emit('back')">
        <ChevronLeft :size="20" aria-hidden="true" />
        <span>{{ $t('tir.backToBracket') }}</span>
      </button>
      <div class="tir-pmatch__round-label">{{ roundLabel }}</div>
    </div>

    <!-- Match overview -->
    <div class="tir-pmatch__overview">
      <div class="tir-pmatch__player-card" :class="{ 'tir-pmatch__player-card--winner': isPlayer1Winner }">
        <div class="tir-pmatch__player-name">{{ match.player1 }}</div>
        <div class="tir-pmatch__player-score">
          {{ getPlayerTotal(1) }}<span>/{{ maxTotalScore }}</span>
        </div>
      </div>
      <div class="tir-pmatch__vs">{{ $t('tir.versus') }}</div>
      <div class="tir-pmatch__player-card" :class="{ 'tir-pmatch__player-card--winner': isPlayer2Winner }">
        <div class="tir-pmatch__player-name">{{ match.player2 }}</div>
        <div class="tir-pmatch__player-score">
          {{ getPlayerTotal(2) }}<span>/{{ maxTotalScore }}</span>
        </div>
      </div>
    </div>

    <!-- Status -->
    <div v-if="!isTied" class="tir-pmatch__status" :class="statusClass">
      {{ statusText }}
    </div>

    <!-- Tie breaker -->
    <div v-if="isTied && bothComplete && !readOnly" class="tir-pmatch__tie">
      <p>{{ $t('tir.matchTied') }}</p>
      <div class="tir-pmatch__tie-buttons">
        <button
          type="button"
          class="tir-pmatch__tie-btn"
          :class="{ 'tir-pmatch__tie-btn--selected': match.tieWinner === 1 }"
          :aria-pressed="match.tieWinner === 1"
          @click="selectTieWinner(1)"
        >
          {{ match.player1 }}
        </button>
        <button
          type="button"
          class="tir-pmatch__tie-btn"
          :class="{ 'tir-pmatch__tie-btn--selected': match.tieWinner === 2 }"
          :aria-pressed="match.tieWinner === 2"
          @click="selectTieWinner(2)"
        >
          {{ match.player2 }}
        </button>
      </div>
    </div>

    <TirScoreLegend />

    <!-- All ateliers with circles -->
    <div v-for="(atelier, aIdx) in ateliers" :key="aIdx" class="tir-pmatch__atelier">
      <div class="tir-pmatch__atelier-header">
        <span class="tir-pmatch__atelier-num">{{ aIdx + 1 }}</span>
        <span class="tir-pmatch__atelier-name">{{ atelier.name }}</span>
      </div>
      <div class="tir-pmatch__circles-grid">
        <div v-for="distance in distances" :key="distance" class="tir-pmatch__circles-row">
          <div class="tir-pmatch__circles tir-pmatch__circles--left">
            <TirScoreCircle
              v-for="opt in resultOptions"
              :key="opt.key"
              class="tir-pmatch__circle"
              :class="`tir-pmatch__circle--${opt.key}`"
              size="large"
              :result="opt.key"
              :active="getScore(1, aIdx, distance) === opt.key"
              :interactive="!readOnly"
              :disabled="readOnly"
              :aria-label="`${match.player1}, ${distance}m, ${$t(`tir.${opt.key}`)}`"
              @select="setScore(1, aIdx, distance, opt.key)"
            />
          </div>
          <div class="tir-pmatch__distance">{{ distance }}m</div>
          <div class="tir-pmatch__circles tir-pmatch__circles--right">
            <TirScoreCircle
              v-for="opt in resultOptions"
              :key="opt.key"
              class="tir-pmatch__circle"
              :class="`tir-pmatch__circle--${opt.key}`"
              size="large"
              :result="opt.key"
              :active="getScore(2, aIdx, distance) === opt.key"
              :interactive="!readOnly"
              :disabled="readOnly"
              :aria-label="`${match.player2}, ${distance}m, ${$t(`tir.${opt.key}`)}`"
              @select="setScore(2, aIdx, distance, opt.key)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Final score summary -->
    <div class="tir-pmatch__summary">
      <div class="tir-pmatch__summary-side">
        <span>{{ $t('tir.totalScore') }}</span>
        <strong>{{ getPlayerTotal(1) }}</strong
        ><span class="tir-pmatch__summary-max">/{{ maxTotalScore }}</span>
      </div>
      <div class="tir-pmatch__summary-side">
        <span>{{ $t('tir.totalScore') }}</span>
        <strong>{{ getPlayerTotal(2) }}</strong
        ><span class="tir-pmatch__summary-max">/{{ maxTotalScore }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ChevronLeft } from 'lucide-vue-next';
import TirScoreCircle from '@/components/ui/TirScoreCircle.vue';
import TirScoreLegend from '@/components/ui/TirScoreLegend.vue';

import {
  SCORING,
  RESULT_OPTIONS,
  getMatchScoreAt,
  getMatchAtelierScore,
  getMatchPlayerScore,
  getMatchPlayerThrows,
  isMatchAtelierComplete,
  isMatchComplete,
  toggleTirMatchScore,
  selectTirMatchTieWinner,
} from '@/services/tir';

export default {
  name: 'TirPlayoffMatch',
  components: { ChevronLeft, TirScoreCircle, TirScoreLegend },
  props: {
    match: { type: Object, required: true },
    ateliers: { type: Array, required: true },
    distances: { type: Array, required: true },
    roundLabel: { type: String, default: '' },
    readOnly: { type: Boolean, default: false },
  },
  emits: ['back', 'update'],
  computed: {
    resultOptions() {
      return RESULT_OPTIONS;
    },
    maxAtelierScore() {
      return this.distances.length * SCORING.carreau;
    },
    maxTotalScore() {
      return 5 * this.maxAtelierScore;
    },
    totalThrows() {
      return 5 * this.distances.length;
    },
    isPlayer1Complete() {
      return this.getPlayerThrows(1) >= this.totalThrows;
    },
    isPlayer2Complete() {
      return this.getPlayerThrows(2) >= this.totalThrows;
    },
    bothComplete() {
      return this.isPlayer1Complete && this.isPlayer2Complete;
    },
    isTied() {
      return this.bothComplete && this.getPlayerTotal(1) === this.getPlayerTotal(2);
    },
    isPlayer1Winner() {
      if (!this.bothComplete) return false;
      if (this.isTied) return this.match.tieWinner === 1;
      return this.getPlayerTotal(1) > this.getPlayerTotal(2);
    },
    isPlayer2Winner() {
      if (!this.bothComplete) return false;
      if (this.isTied) return this.match.tieWinner === 2;
      return this.getPlayerTotal(2) > this.getPlayerTotal(1);
    },
    matchComplete() {
      return isMatchComplete(this.match, this.totalThrows);
    },
    statusText() {
      if (this.matchComplete) return this.$t('tir.matchCompleted');
      if (this.isTied) return this.$t('tir.matchTied');
      if (this.getPlayerThrows(1) > 0 || this.getPlayerThrows(2) > 0) return this.$t('tir.matchInProgress');
      return this.$t('tir.matchPending');
    },
    statusClass() {
      if (this.matchComplete) return 'tir-pmatch__status--complete';
      if (this.isTied) return 'tir-pmatch__status--tied';
      if (this.getPlayerThrows(1) > 0 || this.getPlayerThrows(2) > 0) return 'tir-pmatch__status--progress';
      return '';
    },
  },
  methods: {
    getScore(playerNum, atelierIdx, distance) {
      return getMatchScoreAt(this.match, playerNum, atelierIdx, distance);
    },
    setScore(playerNum, atelierIdx, distance, type) {
      if (this.readOnly) return;
      const updatedMatch = toggleTirMatchScore(this.match, playerNum, atelierIdx, distance, type, this.totalThrows);
      this.$emit('update', updatedMatch);
      if (updatedMatch.complete) {
        setTimeout(() => {
          this.$emit('back');
        }, 500);
      }
    },
    getAtelierTotal(playerNum, atelierIdx) {
      return getMatchAtelierScore(this.match, playerNum, atelierIdx);
    },
    getPlayerTotal(playerNum) {
      return getMatchPlayerScore(this.match, playerNum);
    },
    getPlayerThrows(playerNum) {
      return getMatchPlayerThrows(this.match, playerNum);
    },
    isAtelierComplete(playerNum, atelierIdx) {
      return isMatchAtelierComplete(this.match, playerNum, atelierIdx, this.distances.length);
    },
    selectTieWinner(playerNum) {
      const updatedMatch = selectTirMatchTieWinner(this.match, playerNum, this.totalThrows);
      this.$emit('update', updatedMatch);
      setTimeout(() => {
        this.$emit('back');
      }, 500);
    },
  },
};
</script>

<style scoped>
.tir-pmatch__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.tir-pmatch__back {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text);
  font-size: 13px;
}

.tir-pmatch__back:focus-visible,
.tir-pmatch__tie-btn:focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}

.tir-pmatch__round-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  margin-left: auto;
}

.tir-pmatch__overview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.tir-pmatch__player-card {
  flex: 1 1 0;
  min-width: 0;
  padding: 12px;
  border: 2px solid var(--color-border);
  border-radius: 10px;
  text-align: center;
  transition: border-color 0.2s;
}

.tir-pmatch__player-card--winner {
  border-color: var(--tir-carreau);
  background: var(--tir-winner-bg);
}

.tir-pmatch__player-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tir-pmatch__player-score {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
}

.tir-pmatch__player-score span {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 400;
}

.tir-pmatch__vs {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.tir-pmatch__status {
  text-align: center;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 14px;
  background: var(--color-surface-alt);
  color: var(--color-text-secondary);
}

.tir-pmatch__status--progress {
  background: var(--tir-progress-bg);
  color: var(--tir-progress-text);
}

.tir-pmatch__status--complete {
  background: var(--tir-winner-bg);
  color: var(--tir-winner-text);
}

.tir-pmatch__status--tied {
  background: var(--tir-tied-bg);
  color: var(--tir-tied-text);
}

.tir-pmatch__tie {
  text-align: center;
  margin-bottom: 14px;
  padding: 12px;
  border: 2px solid var(--tir-tied-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.tir-pmatch__tie p {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--tir-tied-text);
}

.tir-pmatch__tie-buttons {
  display: flex;
  gap: 8px;
}

.tir-pmatch__tie-btn {
  flex: 1;
  padding: 10px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}

.tir-pmatch__tie-btn--selected {
  border-color: var(--tir-carreau);
  background: var(--tir-winner-bg);
  color: var(--tir-winner-text);
}

/* Atelier cards */

.tir-pmatch__atelier {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
}

.tir-pmatch__atelier-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.tir-pmatch__atelier-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--tir-touche);
  color: var(--grey-1200);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tir-pmatch__atelier-name {
  font-weight: 700;
  font-size: 15px;
}

/* Circle grid */

.tir-pmatch__circles-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tir-pmatch__circles-row {
  display: flex;
  align-items: center;
  justify-content: space-evenly;
}

.tir-pmatch__circles {
  display: flex;
  gap: 8px;
}

.tir-pmatch__circles--left {
  justify-content: center;
}

.tir-pmatch__circles--right {
  justify-content: center;
}

.tir-pmatch__distance {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  min-width: 30px;
  text-align: center;
}

/* Summary */

.tir-pmatch__summary {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--color-surface-alt);
}

.tir-pmatch__summary-side {
  font-size: 13px;
  color: var(--color-text);
}

.tir-pmatch__summary-side strong {
  font-size: 18px;
}

.tir-pmatch__summary-max {
  font-size: 12px;
  color: var(--color-text-secondary);
}

@media (max-width: 450px) {
  .tir-pmatch__circle {
    width: 26px;
    height: 26px;
  }

  .tir-pmatch__circles {
    gap: 4px;
  }

  .tir-pmatch__distance {
    font-size: 11px;
    min-width: 24px;
  }

  .tir-pmatch__atelier {
    padding: 10px 6px;
  }
}
</style>
