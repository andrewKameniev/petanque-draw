<template>
  <div class="tir-compare">
    <div class="tir-compare__header">
      <button class="tir-compare__back" @click="$emit('back')">
        <ChevronLeft :size="20" />
        <span>{{ $t('tir.backToBracket') }}</span>
      </button>
      <div class="tir-compare__round-label">{{ roundLabel }}</div>
    </div>

    <!-- Score cards -->
    <div class="tir-compare__scores">
      <div class="tir-compare__player-card" :class="{ 'tir-compare__player-card--winner': isPlayer1Winner }">
        <div class="tir-compare__player-name">{{ match.player1 }}</div>
        <div class="tir-compare__player-total">
          <span class="tir-compare__player-total-val">{{ getPlayerTotal(1) }}</span>
          <span class="tir-compare__player-total-max">/{{ maxTotalScore }}</span>
        </div>
      </div>
      <div class="tir-compare__vs">vs</div>
      <div class="tir-compare__player-card" :class="{ 'tir-compare__player-card--winner': isPlayer2Winner }">
        <div class="tir-compare__player-name">{{ match.player2 }}</div>
        <div class="tir-compare__player-total">
          <span class="tir-compare__player-total-val">{{ getPlayerTotal(2) }}</span>
          <span class="tir-compare__player-total-max">/{{ maxTotalScore }}</span>
        </div>
      </div>
    </div>

    <TirScoreLegend />

    <!-- Match result notice -->
    <div v-if="matchComplete" class="tir-compare__result">
      <Trophy :size="18" class="tir-compare__result-icon" />
      <span class="tir-compare__result-text">{{ winnerName }}</span>
    </div>

    <!-- Atelier comparison cards -->
    <div v-for="(atelier, aIdx) in ateliers" :key="aIdx" class="tir-compare__atelier">
      <div class="tir-compare__atelier-header">
        <span class="tir-compare__atelier-num">{{ aIdx + 1 }}</span>
        <span class="tir-compare__atelier-name">{{ atelier.name }}</span>
      </div>
      <div class="tir-compare__grid">
        <div v-for="distance in distances" :key="distance" class="tir-compare__row">
          <div class="tir-compare__circles tir-compare__circles--left">
            <TirScoreCircle
              v-for="opt in resultOptions"
              :key="opt.key"
              class="tir-compare__circle"
              :class="`tir-compare__circle--${opt.key}`"
              size="compact"
              :result="opt.key"
              :active="getScore(1, aIdx, distance) === opt.key"
            />
          </div>
          <div class="tir-compare__distance">{{ distance }}m</div>
          <div class="tir-compare__circles tir-compare__circles--right">
            <TirScoreCircle
              v-for="opt in resultOptions"
              :key="opt.key"
              class="tir-compare__circle"
              :class="`tir-compare__circle--${opt.key}`"
              size="compact"
              :result="opt.key"
              :active="getScore(2, aIdx, distance) === opt.key"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Final score summary -->
    <div class="tir-compare__summary" :class="{ 'tir-compare__summary--complete': matchComplete }">
      <div class="tir-compare__summary-side">
        <span class="tir-compare__summary-label">{{ $t('tir.totalScore') }}</span>
        <span class="tir-compare__summary-val">{{ getPlayerTotal(1) }}</span>
        <span class="tir-compare__summary-max">/{{ maxTotalScore }}</span>
      </div>
      <div class="tir-compare__summary-side">
        <span class="tir-compare__summary-label">{{ $t('tir.totalScore') }}</span>
        <span class="tir-compare__summary-val">{{ getPlayerTotal(2) }}</span>
        <span class="tir-compare__summary-max">/{{ maxTotalScore }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ChevronLeft, Trophy } from 'lucide-vue-next';
import TirScoreCircle from '@/components/ui/TirScoreCircle.vue';
import TirScoreLegend from '@/components/ui/TirScoreLegend.vue';

import {
  SCORING,
  RESULT_OPTIONS,
  getMatchScoreAt,
  getMatchPlayerScore,
  getMatchPlayerThrows,
  isMatchComplete,
  getMatchWinner,
} from '@/services/tir';

export default {
  name: 'TirPlayoffComparison',
  components: { ChevronLeft, Trophy, TirScoreCircle, TirScoreLegend },
  props: {
    match: { type: Object, required: true },
    ateliers: { type: Array, required: true },
    distances: { type: Array, required: true },
    roundLabel: { type: String, default: '' },
  },
  emits: ['back'],
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
      if (!this.bothComplete) return this.getPlayerTotal(1) > this.getPlayerTotal(2);
      if (this.isTied) return this.match.tieWinner === 1;
      return this.getPlayerTotal(1) > this.getPlayerTotal(2);
    },
    isPlayer2Winner() {
      if (!this.bothComplete) return this.getPlayerTotal(2) > this.getPlayerTotal(1);
      if (this.isTied) return this.match.tieWinner === 2;
      return this.getPlayerTotal(2) > this.getPlayerTotal(1);
    },
    matchComplete() {
      return isMatchComplete(this.match, this.totalThrows);
    },
    winnerName() {
      return getMatchWinner(this.match, this.totalThrows) || '';
    },
  },
  methods: {
    getScore(playerNum, atelierIdx, distance) {
      return getMatchScoreAt(this.match, playerNum, atelierIdx, distance);
    },
    getPlayerTotal(playerNum) {
      return getMatchPlayerScore(this.match, playerNum);
    },
    getPlayerThrows(playerNum) {
      return getMatchPlayerThrows(this.match, playerNum);
    },
  },
};
</script>

<style scoped>
.tir-compare {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

.tir-compare__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.tir-compare__back {
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

.tir-compare__round-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  margin-left: auto;
}

/* Score cards */

.tir-compare__scores {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.tir-compare__player-card {
  flex: 1 1 0;
  min-width: 0;
  padding: 14px 12px;
  border: 2px solid var(--color-border);
  border-radius: 12px;
  text-align: center;
  transition:
    border-color 0.2s,
    background 0.2s;
}

.tir-compare__player-card--winner {
  border-color: var(--tir-carreau);
  background: rgb(76 175 80 / 6%);
}

.tir-compare__player-name {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 6px;
  overflow-wrap: break-word;
  line-height: 1.3;
  color: var(--color-text);
}

.tir-compare__player-total {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
}

.tir-compare__player-total-val {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
}

.tir-compare__player-card--winner .tir-compare__player-total-val {
  color: var(--color-success);
}

.tir-compare__player-total-max {
  font-size: 14px;
  color: var(--color-text-muted);
  font-weight: 400;
}

.tir-compare__vs {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

/* Atelier cards */

.tir-compare__atelier {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
}

.tir-compare__atelier-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.tir-compare__atelier-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--tir-touche);
  color: var(--color-btn-text);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tir-compare__atelier-name {
  font-weight: 700;
  font-size: 15px;
  color: var(--color-text);
}

/* Comparison grid */

.tir-compare__grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tir-compare__row {
  display: flex;
  align-items: center;
  justify-content: space-evenly;
}

.tir-compare__circles {
  display: flex;
  gap: 10px;
}

.tir-compare__circles--left {
  justify-content: flex-end;
}

.tir-compare__circles--right {
  justify-content: flex-start;
}

.tir-compare__distance {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  min-width: 28px;
  text-align: center;
}

/* Final score summary */

.tir-compare__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  margin-top: 6px;
}

.tir-compare__result {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgb(76 175 80 / 8%);
  border: 1px solid rgb(76 175 80 / 30%);
  border-radius: 8px;
  margin-bottom: 12px;
}

.tir-compare__result-icon {
  color: var(--tir-touche);
}

.tir-compare__result-text {
  font-size: 14px;
  font-weight: 700;
  color: var(--tir-winner-text);
}

.tir-compare__summary--complete {
  background: rgb(76 175 80 / 8%);
  border-color: rgb(76 175 80 / 30%);
}

.tir-compare__summary-side {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.tir-compare__summary-label {
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.tir-compare__summary-val {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
}

.tir-compare__summary--complete .tir-compare__summary-val {
  color: var(--color-success);
}

.tir-compare__summary-max {
  font-size: 13px;
  color: var(--color-text-muted);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tir-compare__atelier {
    padding: 12px 6px;
    margin-left: -12px;
    margin-right: -12px;
    border-radius: 8px;
  }

  .tir-compare__circles {
    gap: 8px;
  }

  .tir-compare__circles--left {
    justify-content: center;
  }

  .tir-compare__circles--right {
    justify-content: center;
  }
}

@media (max-width: 380px) {
  .tir-compare__circle {
    width: 18px;
    height: 18px;
  }

  .tir-compare__circles {
    gap: 4px;
  }

  .tir-compare__player-total-val {
    font-size: 24px;
  }

  .tir-compare__legend {
    gap: 8px;
  }

  .tir-compare__legend-item {
    font-size: 11px;
  }
}
</style>
