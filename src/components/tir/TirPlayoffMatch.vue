<template>
    <div class="tir-pmatch">
        <div class="tir-pmatch__header">
            <button class="tir-pmatch__back" @click="$emit('back')">
                <ChevronLeft :size="20"/>
                <span>{{ $t('tir.backToBracket') }}</span>
            </button>
            <div class="tir-pmatch__round-label">{{ roundLabel }}</div>
        </div>

        <!-- Match overview -->
        <div class="tir-pmatch__overview">
            <div class="tir-pmatch__player-card" :class="{'tir-pmatch__player-card--winner': isPlayer1Winner}">
                <div class="tir-pmatch__player-name">{{ match.player1 }}</div>
                <div class="tir-pmatch__player-score">{{ getPlayerTotal(1) }}<span>/{{ maxTotalScore }}</span></div>
            </div>
            <div class="tir-pmatch__vs">vs</div>
            <div class="tir-pmatch__player-card" :class="{'tir-pmatch__player-card--winner': isPlayer2Winner}">
                <div class="tir-pmatch__player-name">{{ match.player2 }}</div>
                <div class="tir-pmatch__player-score">{{ getPlayerTotal(2) }}<span>/{{ maxTotalScore }}</span></div>
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
                <button class="tir-pmatch__tie-btn" :class="{'tir-pmatch__tie-btn--selected': match.tieWinner === 1}" @click="selectTieWinner(1)">
                    {{ match.player1 }}
                </button>
                <button class="tir-pmatch__tie-btn" :class="{'tir-pmatch__tie-btn--selected': match.tieWinner === 2}" @click="selectTieWinner(2)">
                    {{ match.player2 }}
                </button>
            </div>
        </div>

        <!-- Legend -->
        <div class="tir-pmatch__legend">
            <span class="tir-pmatch__legend-item"><span class="tir-pmatch__legend-dot tir-pmatch__legend-dot--carreau"></span>{{ $t('tir.carreau') }} (5)</span>
            <span class="tir-pmatch__legend-item"><span class="tir-pmatch__legend-dot tir-pmatch__legend-dot--reussi"></span>{{ $t('tir.reussi') }} (3)</span>
            <span class="tir-pmatch__legend-item"><span class="tir-pmatch__legend-dot tir-pmatch__legend-dot--touche"></span>{{ $t('tir.touche') }} (1)</span>
            <span class="tir-pmatch__legend-item"><span class="tir-pmatch__legend-dot tir-pmatch__legend-dot--manque"></span>{{ $t('tir.manque') }} (0)</span>
        </div>

        <!-- All ateliers with circles -->
        <div v-for="(atelier, aIdx) in ateliers" :key="aIdx" class="tir-pmatch__atelier">
            <div class="tir-pmatch__atelier-header">
                <span class="tir-pmatch__atelier-num">{{ aIdx + 1 }}</span>
                <span class="tir-pmatch__atelier-name">{{ atelier.name }}</span>
            </div>
            <div class="tir-pmatch__circles-grid">
                <div v-for="distance in distances" :key="distance" class="tir-pmatch__circles-row">
                    <div class="tir-pmatch__circles tir-pmatch__circles--left">
                        <span v-for="opt in resultOptions" :key="opt.key"
                              class="tir-pmatch__circle"
                              :class="[`tir-pmatch__circle--${opt.key}`, {'tir-pmatch__circle--active': getScore(1, aIdx, distance) === opt.key}]"
                              @click="!readOnly && setScore(1, aIdx, distance, opt.key)">
                        </span>
                    </div>
                    <div class="tir-pmatch__distance">{{ distance }}m</div>
                    <div class="tir-pmatch__circles tir-pmatch__circles--right">
                        <span v-for="opt in resultOptions" :key="opt.key"
                              class="tir-pmatch__circle"
                              :class="[`tir-pmatch__circle--${opt.key}`, {'tir-pmatch__circle--active': getScore(2, aIdx, distance) === opt.key}]"
                              @click="!readOnly && setScore(2, aIdx, distance, opt.key)">
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Final score summary -->
        <div class="tir-pmatch__summary">
            <div class="tir-pmatch__summary-side">
                <span>{{ $t('tir.totalScore') || 'Всього' }}</span>
                <strong>{{ getPlayerTotal(1) }}</strong><span class="tir-pmatch__summary-max">/{{ maxTotalScore }}</span>
            </div>
            <div class="tir-pmatch__summary-side">
                <span>{{ $t('tir.totalScore') || 'Всього' }}</span>
                <strong>{{ getPlayerTotal(2) }}</strong><span class="tir-pmatch__summary-max">/{{ maxTotalScore }}</span>
            </div>
        </div>
    </div>
</template>

<script>
import {ChevronLeft} from "lucide-vue-next";

import {SCORING} from '@/services/tir';

export default {
    name: 'TirPlayoffMatch',
    components: {ChevronLeft},
    props: {
        match: {type: Object, required: true},
        ateliers: {type: Array, required: true},
        distances: {type: Array, required: true},
        roundLabel: {type: String, default: ''},
        readOnly: {type: Boolean, default: false}
    },
    emits: ['back', 'update'],
    computed: {
        resultOptions() {
            return [
                {key: 'carreau', points: 5},
                {key: 'reussi', points: 3},
                {key: 'touche', points: 1},
                {key: 'manque', points: 0}
            ];
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
            if (!this.bothComplete) return false;
            if (this.isTied) return !!this.match.tieWinner;
            return true;
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
        }
    },
    methods: {
        /* eslint-disable vue/no-mutating-props */
        getScores(playerNum) {
            const key = playerNum === 1 ? 'scores1' : 'scores2';
            if (!this.match[key]) this.match[key] = {};
            return this.match[key];
        },
        getScore(playerNum, atelierIdx, distance) {
            return this.getScores(playerNum)?.[atelierIdx]?.[distance] || null;
        },
        setScore(playerNum, atelierIdx, distance, type) {
            const scores = this.getScores(playerNum);
            if (!scores[atelierIdx]) scores[atelierIdx] = {};
            const current = scores[atelierIdx][distance];
            if (current === type) {
                delete scores[atelierIdx][distance];
            } else {
                scores[atelierIdx][distance] = type;
            }
            this.updateMatchTotals();
            this.$emit('update');
            if (this.matchComplete) {
                setTimeout(() => { this.$emit('back'); }, 500);
            }
        },
        getAtelierTotal(playerNum, atelierIdx) {
            const scores = this.getScores(playerNum)?.[atelierIdx];
            if (!scores) return 0;
            return Object.values(scores).reduce((sum, val) => sum + (SCORING[val] || 0), 0);
        },
        getPlayerTotal(playerNum) {
            const scores = this.getScores(playerNum);
            if (!scores) return 0;
            let total = 0;
            Object.values(scores).forEach(atelier => {
                if (atelier && typeof atelier === 'object') {
                    Object.values(atelier).forEach(val => { total += SCORING[val] || 0; });
                }
            });
            return total;
        },
        getPlayerThrows(playerNum) {
            const scores = this.getScores(playerNum);
            if (!scores) return 0;
            let count = 0;
            Object.values(scores).forEach(atelier => {
                if (atelier && typeof atelier === 'object') {
                    count += Object.keys(atelier).length;
                }
            });
            return count;
        },
        isAtelierComplete(playerNum, atelierIdx) {
            const scores = this.getScores(playerNum)?.[atelierIdx];
            if (!scores) return false;
            return Object.keys(scores).length >= this.distances.length;
        },
        updateMatchTotals() {
            this.match.score1 = this.getPlayerTotal(1);
            this.match.score2 = this.getPlayerTotal(2);
            this.match.complete = this.matchComplete;
            if (this.matchComplete) {
                this.match.winner = this.isPlayer1Winner ? this.match.player1 : this.match.player2;
                this.match.loser = this.isPlayer1Winner ? this.match.player2 : this.match.player1;
            } else {
                this.match.winner = null;
                this.match.loser = null;
            }
        },
        selectTieWinner(playerNum) {
            this.match.tieWinner = playerNum;
            this.updateMatchTotals();
            this.$emit('update');
            setTimeout(() => { this.$emit('back'); }, 500);
        }
        /* eslint-enable vue/no-mutating-props */
    }
}
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

.tir-pmatch__round-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-muted);
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
    border-color: #4caf50;
    background: rgba(76, 175, 80, 0.05);
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
    color: var(--color-text-muted);
    font-weight: 400;
}

.tir-pmatch__vs {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-muted);
}

.tir-pmatch__status {
    text-align: center;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 14px;
    background: var(--color-surface-alt);
    color: var(--color-text-muted);
}

.tir-pmatch__status--progress { background: #fff3e0; color: #f57c00; }
.tir-pmatch__status--complete { background: #e8f5e9; color: #388e3c; }
.tir-pmatch__status--tied { background: #fce4ec; color: #c62828; }

.tir-pmatch__tie {
    text-align: center;
    margin-bottom: 14px;
    padding: 12px;
    border: 2px solid #ef5350;
    border-radius: 10px;
    background: #fff;
}

.tir-pmatch__tie p { margin: 0 0 10px; font-size: 13px; font-weight: 600; color: #c62828; }

.tir-pmatch__tie-buttons { display: flex; gap: 8px; }

.tir-pmatch__tie-btn {
    flex: 1;
    padding: 10px;
    border: 2px solid var(--color-border);
    border-radius: 8px;
    background: #fff;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
}

.tir-pmatch__tie-btn--selected {
    border-color: #4caf50;
    background: #e8f5e9;
    color: #2e7d32;
}

/* Legend */
.tir-pmatch__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
    justify-content: center;
}

.tir-pmatch__legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-muted);
}

.tir-pmatch__legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.tir-pmatch__legend-dot--carreau { background: #4CAF50; }
.tir-pmatch__legend-dot--reussi { background: #2196F3; }
.tir-pmatch__legend-dot--touche { background: #F5A623; }
.tir-pmatch__legend-dot--manque { background: #bdbdbd; }

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
    background: #F5A623;
    color: #fff;
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

.tir-pmatch__circles--left { justify-content: center; }
.tir-pmatch__circles--right { justify-content: center; }

.tir-pmatch__distance {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-muted);
    min-width: 30px;
    text-align: center;
}

.tir-pmatch__circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid #e0e0e0;
    background: radial-gradient(circle, #e0e0e0 56%, #fff 56%);
    opacity: 0.4;
    transition: all 0.15s;
    cursor: pointer;
}

.tir-pmatch__circle--active { opacity: 1; }

.tir-pmatch__circle--active.tir-pmatch__circle--carreau {
    border-color: #4CAF50;
    background: radial-gradient(circle, #4CAF50 56%, #fff 56%);
}

.tir-pmatch__circle--active.tir-pmatch__circle--reussi {
    border-color: #2196F3;
    background: radial-gradient(circle, #2196F3 56%, #fff 56%);
}

.tir-pmatch__circle--active.tir-pmatch__circle--touche {
    border-color: #F5A623;
    background: radial-gradient(circle, #F5A623 56%, #fff 56%);
}

.tir-pmatch__circle--active.tir-pmatch__circle--manque {
    border-color: #bdbdbd;
    background: radial-gradient(circle, #bdbdbd 56%, #fff 56%);
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
    color: var(--color-text-muted);
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
