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
        <div class="tir-pmatch__status" :class="statusClass">
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

        <!-- Player tabs -->
        <div class="tir-pmatch__player-toggle">
            <button class="tir-pmatch__player-tab" :class="{'tir-pmatch__player-tab--active': activePlayer === 1}" @click="activePlayer = 1">
                {{ match.player1 }}
            </button>
            <button class="tir-pmatch__player-tab" :class="{'tir-pmatch__player-tab--active': activePlayer === 2}" @click="activePlayer = 2">
                {{ match.player2 }}
            </button>
        </div>

        <!-- Atelier tabs -->
        <div class="tir-pmatch__atelier-tabs">
            <button v-for="(atelier, index) in ateliers" :key="index"
                    class="tir-pmatch__atelier-tab"
                    :class="{'tir-pmatch__atelier-tab--active': activeAtelier === index, 'tir-pmatch__atelier-tab--complete': isAtelierComplete(activePlayer, index)}"
                    @click="activeAtelier = index">
                {{ index + 1 }}
            </button>
        </div>

        <!-- Scoring grid -->
        <div class="tir-pmatch__grid-wrap">
            <div class="tir-pmatch__grid-title">{{ ateliers[activeAtelier].name }}</div>
            <div class="tir-pmatch__legend">
                <span class="tir-score-badge tir-score-badge--carreau">5</span>
                <span class="tir-score-badge tir-score-badge--reussi">3</span>
                <span class="tir-score-badge tir-score-badge--touche">1</span>
                <span class="tir-score-badge tir-score-badge--manque">0</span>
            </div>
            <div class="tir-pmatch__grid">
                <div class="tir-pmatch__grid-header">
                    <div class="tir-pmatch__grid-corner"></div>
                    <div class="tir-pmatch__grid-th tir-pmatch__grid-th--carreau">{{ $t('tir.carreau') }}</div>
                    <div class="tir-pmatch__grid-th tir-pmatch__grid-th--reussi">{{ $t('tir.reussi') }}</div>
                    <div class="tir-pmatch__grid-th tir-pmatch__grid-th--touche">{{ $t('tir.touche') }}</div>
                    <div class="tir-pmatch__grid-th tir-pmatch__grid-th--manque">{{ $t('tir.manque') }}</div>
                </div>
                <div v-for="distance in distances" :key="distance" class="tir-pmatch__grid-row">
                    <div class="tir-pmatch__grid-distance">{{ distance }}m</div>
                    <div class="tir-pmatch__grid-cell" :class="{'tir-pmatch__grid-cell--carreau': getScore(activePlayer, activeAtelier, distance) === 'carreau', 'tir-pmatch__grid-cell--readonly': readOnly}" @click="!readOnly && setScore(activePlayer, activeAtelier, distance, 'carreau')">
                        <CheckIcon v-if="getScore(activePlayer, activeAtelier, distance) === 'carreau'" :size="14"/>
                    </div>
                    <div class="tir-pmatch__grid-cell" :class="{'tir-pmatch__grid-cell--reussi': getScore(activePlayer, activeAtelier, distance) === 'reussi', 'tir-pmatch__grid-cell--readonly': readOnly}" @click="!readOnly && setScore(activePlayer, activeAtelier, distance, 'reussi')">
                        <CheckIcon v-if="getScore(activePlayer, activeAtelier, distance) === 'reussi'" :size="14"/>
                    </div>
                    <div class="tir-pmatch__grid-cell" :class="{'tir-pmatch__grid-cell--touche': getScore(activePlayer, activeAtelier, distance) === 'touche', 'tir-pmatch__grid-cell--readonly': readOnly}" @click="!readOnly && setScore(activePlayer, activeAtelier, distance, 'touche')">
                        <CheckIcon v-if="getScore(activePlayer, activeAtelier, distance) === 'touche'" :size="14"/>
                    </div>
                    <div class="tir-pmatch__grid-cell" :class="{'tir-pmatch__grid-cell--manque': getScore(activePlayer, activeAtelier, distance) === 'manque', 'tir-pmatch__grid-cell--readonly': readOnly}" @click="!readOnly && setScore(activePlayer, activeAtelier, distance, 'manque')">
                        <CheckIcon v-if="getScore(activePlayer, activeAtelier, distance) === 'manque'" :size="14"/>
                    </div>
                </div>
            </div>
            <div class="tir-pmatch__atelier-total">
                {{ $t('tir.atelier') }} {{ activeAtelier + 1 }}: {{ getAtelierTotal(activePlayer, activeAtelier) }} / {{ maxAtelierScore }}
            </div>
        </div>

        <!-- Navigation between ateliers -->
        <div class="tir-pmatch__nav">
            <button class="tir-pmatch__nav-btn" @click="prevAtelier" :disabled="activeAtelier === 0">
                <ChevronLeft :size="16"/>
            </button>
            <span class="tir-pmatch__nav-label">{{ activeAtelier + 1 }} / 5</span>
            <button class="tir-pmatch__nav-btn" @click="nextAtelier" :disabled="activeAtelier === 4">
                <ChevronRight :size="16"/>
            </button>
        </div>
    </div>
</template>

<script>
import {ChevronLeft, ChevronRight, Check as CheckIcon} from "lucide-vue-next";

const SCORING = {carreau: 5, reussi: 3, touche: 1, manque: 0};

export default {
    name: 'TirPlayoffMatch',
    components: {ChevronLeft, ChevronRight, CheckIcon},
    props: {
        match: {type: Object, required: true},
        ateliers: {type: Array, required: true},
        distances: {type: Array, required: true},
        roundLabel: {type: String, default: ''},
        readOnly: {type: Boolean, default: false}
    },
    emits: ['back', 'update'],
    data() {
        return {
            activePlayer: 1,
            activeAtelier: 0
        }
    },
    created() {
        this.goToFirstIncomplete();
    },
    watch: {
        match: {
            deep: true,
            handler() {
                if (!this.readOnly) return;
                if (this.isAtelierComplete(this.activePlayer, this.activeAtelier)) {
                    this.advanceToNext();
                }
            }
        }
    },
    computed: {
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
                if (this.isAtelierComplete(playerNum, atelierIdx)) {
                    setTimeout(() => {
                        if (atelierIdx < 4) {
                            this.activeAtelier = atelierIdx + 1;
                        } else {
                            this.advanceAfterLastAtelier(playerNum);
                        }
                    }, 300);
                }
            }
            this.updateMatchTotals();
            this.$emit('update');
            if (this.matchComplete) {
                setTimeout(() => { this.$emit('back'); }, 500);
            }
        },
        advanceAfterLastAtelier(completedPlayerNum) {
            const otherPlayer = completedPlayerNum === 1 ? 2 : 1;
            const otherThrows = this.getPlayerThrows(otherPlayer);
            if (otherThrows < this.totalThrows) {
                this.activePlayer = otherPlayer;
                this.activeAtelier = this.getFirstIncompleteAtelier(otherPlayer);
            }
        },
        getFirstIncompleteAtelier(playerNum) {
            for (let i = 0; i < 5; i++) {
                if (!this.isAtelierComplete(playerNum, i)) return i;
            }
            return 0;
        },
        goToFirstIncomplete() {
            const p1Throws = this.getPlayerThrows(1);
            const p2Throws = this.getPlayerThrows(2);
            if (p1Throws < this.totalThrows) {
                this.activePlayer = 1;
                this.activeAtelier = this.getFirstIncompleteAtelier(1);
            } else if (p2Throws < this.totalThrows) {
                this.activePlayer = 2;
                this.activeAtelier = this.getFirstIncompleteAtelier(2);
            }
        },
        advanceToNext() {
            if (this.getPlayerThrows(this.activePlayer) < this.totalThrows) {
                this.activeAtelier = this.getFirstIncompleteAtelier(this.activePlayer);
            } else {
                const otherPlayer = this.activePlayer === 1 ? 2 : 1;
                if (this.getPlayerThrows(otherPlayer) < this.totalThrows) {
                    this.activePlayer = otherPlayer;
                    this.activeAtelier = this.getFirstIncompleteAtelier(otherPlayer);
                }
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
        },
        prevAtelier() {
            if (this.activeAtelier > 0) this.activeAtelier--;
        },
        nextAtelier() {
            if (this.activeAtelier < 4) this.activeAtelier++;
        }
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
    color: var(--text-color, #333);
    font-size: 13px;
}

.tir-pmatch__round-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary, #888);
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
    flex: 1;
    padding: 12px;
    border: 2px solid var(--border-color, #e0e0e0);
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
    color: var(--text-color, #333);
}

.tir-pmatch__player-score span {
    font-size: 13px;
    color: var(--text-secondary, #888);
    font-weight: 400;
}

.tir-pmatch__vs {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary, #999);
}

.tir-pmatch__status {
    text-align: center;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 14px;
    background: var(--bg-secondary, #f5f5f5);
    color: var(--text-secondary, #888);
}

.tir-pmatch__status--progress {
    background: #fff3e0;
    color: #f57c00;
}

.tir-pmatch__status--complete {
    background: #e8f5e9;
    color: #388e3c;
}

.tir-pmatch__status--tied {
    background: #fce4ec;
    color: #c62828;
}

.tir-pmatch__tie {
    text-align: center;
    margin-bottom: 14px;
    padding: 12px;
    border: 2px solid #ef5350;
    border-radius: 10px;
    background: #fff;
}

.tir-pmatch__tie p {
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 600;
    color: #c62828;
}

.tir-pmatch__tie-buttons {
    display: flex;
    gap: 8px;
}

.tir-pmatch__tie-btn {
    flex: 1;
    padding: 10px;
    border: 2px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    background: #fff;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
}

.tir-pmatch__tie-btn--selected {
    border-color: #4caf50;
    background: #e8f5e9;
    color: #2e7d32;
}

.tir-pmatch__player-toggle {
    display: flex;
    background: var(--bg-secondary, #f5f5f5);
    border-radius: 8px;
    padding: 3px;
    margin-bottom: 12px;
}

.tir-pmatch__player-tab {
    flex: 1;
    padding: 10px 12px;
    border: none;
    background: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    color: var(--text-secondary, #666);
    transition: all 0.2s;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.tir-pmatch__player-tab--active {
    background: var(--primary-color, #f5a623);
    color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tir-pmatch__atelier-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
}

.tir-pmatch__atelier-tab {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid var(--border-color, #e0e0e0);
    background: var(--bg-color, #fff);
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    color: var(--text-color, #333);
    transition: all 0.2s;
}

.tir-pmatch__atelier-tab--active {
    background: var(--primary-color, #f5a623);
    border-color: var(--primary-color, #f5a623);
    color: #fff;
}

.tir-pmatch__atelier-tab--complete:not(.tir-pmatch__atelier-tab--active) {
    border-color: #4caf50;
    color: #4caf50;
}

.tir-pmatch__grid-wrap {
    background: var(--card-bg, #fff);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 12px;
}

.tir-pmatch__grid-title {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 8px;
}

.tir-pmatch__legend {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
}

.tir-pmatch__grid-header {
    display: flex;
    gap: 3px;
    margin-bottom: 6px;
}

.tir-pmatch__grid-corner {
    width: 32px;
}

.tir-pmatch__grid-th {
    flex: 1;
    text-align: center;
    font-size: 10px;
    font-weight: 700;
    padding: 2px;
}

.tir-pmatch__grid-th--carreau { color: #4caf50; }
.tir-pmatch__grid-th--reussi { color: #2196F3; }
.tir-pmatch__grid-th--touche { color: #f5a623; }
.tir-pmatch__grid-th--manque { color: #9e9e9e; }

.tir-pmatch__grid-row {
    display: flex;
    gap: 3px;
    margin-bottom: 3px;
}

.tir-pmatch__grid-distance {
    width: 32px;
    display: flex;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-color, #333);
}

.tir-pmatch__grid-cell {
    flex: 1;
    height: 36px;
    border: 2px solid var(--border-color, #e0e0e0);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
}

.tir-pmatch__grid-cell:hover {
    border-color: var(--primary-color, #f5a623);
}

.tir-pmatch__grid-cell--carreau { background: #4caf50; border-color: #4caf50; color: #fff; }
.tir-pmatch__grid-cell--reussi { background: #2196F3; border-color: #2196F3; color: #fff; }
.tir-pmatch__grid-cell--touche { background: #f5a623; border-color: #f5a623; color: #fff; }
.tir-pmatch__grid-cell--manque { background: #9e9e9e; border-color: #9e9e9e; color: #fff; }
.tir-pmatch__grid-cell--readonly { cursor: default; }
.tir-pmatch__grid-cell--readonly:hover { border-color: var(--border-color, #e0e0e0); }

.tir-pmatch__atelier-total {
    text-align: right;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary, #666);
    margin-top: 8px;
}

.tir-pmatch__nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
}

.tir-pmatch__nav-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid var(--border-color, #e0e0e0);
    background: var(--bg-color, #fff);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-color, #333);
}

.tir-pmatch__nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.tir-pmatch__nav-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary, #666);
}

/* Score badges */
.tir-score-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
}

.tir-score-badge--carreau { background: #4caf50; }
.tir-score-badge--reussi { background: #2196F3; }
.tir-score-badge--touche { background: #f5a623; }
.tir-score-badge--manque { background: #9e9e9e; }
</style>
