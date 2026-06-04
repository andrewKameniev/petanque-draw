<template>
    <div class="tir-pview">
        <div class="tir-pview__header">
            <button class="tir-pview__back" @click="$emit('back')">
                <ChevronLeft :size="20"/>
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

        <!-- Atelier tabs -->
        <div class="tir-pview__tabs">
            <button v-for="(atelier, index) in ateliers" :key="index"
                    class="tir-pview__tab"
                    :class="{'tir-pview__tab--active': activeAtelierIndex === index, 'tir-pview__tab--complete': isAtelierComplete(index)}"
                    @click="activeAtelierIndex = index">
                {{ index + 1 }}
            </button>
        </div>
        <div class="tir-pview__tab-labels">
            <span v-for="(atelier, index) in ateliers" :key="index" class="tir-pview__tab-label" :class="{'tir-pview__tab-label--active': activeAtelierIndex === index}">
                {{ atelier.name.split(' ')[0] }}
            </span>
        </div>

        <!-- Active atelier scoring -->
        <div class="tir-pview__atelier">
            <div class="tir-pview__atelier-header">
                <h4>{{ currentAtelier.name }}</h4>
                <div class="tir-pview__atelier-score">
                    <span class="tir-pview__atelier-score-val">{{ getAtelierScore(activeAtelierIndex) }}</span>
                    <span class="tir-pview__atelier-score-max">/ {{ maxAtelierScore }}</span>
                    <span class="tir-pview__atelier-score-label">{{ $t('ranking.points') }}</span>
                </div>
            </div>

            <div class="tir-pview__atelier-desc">{{ currentAtelier.description }}</div>

            <!-- Scoring legend -->
            <div class="tir-pview__legend">
                <div class="tir-pview__legend-item">
                    <span class="tir-score-badge tir-score-badge--carreau">{{ scoring.carreau }}</span>
                    <span>{{ $t('tir.carreau') }}: {{ scoring.carreau }} p</span>
                </div>
                <div class="tir-pview__legend-item">
                    <span class="tir-score-badge tir-score-badge--reussi">{{ scoring.reussi }}</span>
                    <span>{{ $t('tir.reussi') }}: {{ scoring.reussi }} p</span>
                </div>
                <div class="tir-pview__legend-item">
                    <span class="tir-score-badge tir-score-badge--touche">{{ scoring.touche }}</span>
                    <span>{{ $t('tir.touche') }}: {{ scoring.touche }} p</span>
                </div>
                <div class="tir-pview__legend-item">
                    <span class="tir-score-badge tir-score-badge--manque">{{ scoring.manque }}</span>
                    <span>{{ $t('tir.manque') }}: {{ scoring.manque }} p</span>
                </div>
            </div>

            <!-- Scoring grid: columns = score types, rows = distances, one selection per row -->
            <div class="tir-pview__grid">
                <div class="tir-pview__grid-header">
                    <div class="tir-pview__grid-corner"></div>
                    <div class="tir-pview__grid-th tir-pview__grid-th--carreau">{{ $t('tir.carreau') }}</div>
                    <div class="tir-pview__grid-th tir-pview__grid-th--reussi">{{ $t('tir.reussi') }}</div>
                    <div class="tir-pview__grid-th tir-pview__grid-th--touche">{{ $t('tir.touche') }}</div>
                    <div class="tir-pview__grid-th tir-pview__grid-th--manque">{{ $t('tir.manque') }}</div>
                </div>
                <div v-for="distance in distances" :key="distance" class="tir-pview__grid-row">
                    <div class="tir-pview__grid-distance">{{ distance }}m</div>
                    <div class="tir-pview__grid-cell" :class="{'tir-pview__grid-cell--carreau': getDistanceValue(distance) === 'carreau'}" @click="setScore(distance, 'carreau')">
                        <CheckIcon v-if="getDistanceValue(distance) === 'carreau'" :size="14"/>
                    </div>
                    <div class="tir-pview__grid-cell" :class="{'tir-pview__grid-cell--reussi': getDistanceValue(distance) === 'reussi'}" @click="setScore(distance, 'reussi')">
                        <CheckIcon v-if="getDistanceValue(distance) === 'reussi'" :size="14"/>
                    </div>
                    <div class="tir-pview__grid-cell" :class="{'tir-pview__grid-cell--touche': getDistanceValue(distance) === 'touche'}" @click="setScore(distance, 'touche')">
                        <CheckIcon v-if="getDistanceValue(distance) === 'touche'" :size="14"/>
                    </div>
                    <div class="tir-pview__grid-cell" :class="{'tir-pview__grid-cell--manque': getDistanceValue(distance) === 'manque'}" @click="setScore(distance, 'manque')">
                        <CheckIcon v-if="getDistanceValue(distance) === 'manque'" :size="14"/>
                    </div>
                </div>
            </div>

            <!-- Saved indicator -->
            <div v-if="lastSaved" class="tir-pview__saved">
                <CheckCircle :size="14"/>
                {{ lastSaved }}
            </div>
        </div>

        <!-- Navigation -->
        <div class="tir-pview__nav">
            <button class="tir-pview__nav-btn" @click="prevAtelier" :disabled="activeAtelierIndex === 0">
                <ChevronLeft :size="16"/>
                {{ $t('tir.prevAtelier') }}
            </button>
            <button v-if="activeAtelierIndex < ateliers.length - 1" class="tir-pview__nav-btn" @click="nextAtelier">
                {{ $t('tir.nextAtelier') }}
                <ChevronRight :size="16"/>
            </button>
            <button v-else class="tir-pview__nav-btn tir-pview__nav-btn--primary" @click="$emit('next')">
                {{ $t('tir.nextParticipant') }}
                <ChevronRight :size="16"/>
            </button>
        </div>
    </div>
</template>

<script>
import {ChevronLeft, ChevronRight, CheckCircle, Check as CheckIcon} from "lucide-vue-next";

const SCORING = {carreau: 5, reussi: 3, touche: 1, manque: 0};

export default {
    name: 'TirParticipantView',
    components: {ChevronLeft, ChevronRight, CheckCircle, CheckIcon},
    props: {
        participant: {type: Object, required: true},
        ateliers: {type: Array, required: true},
        distances: {type: Array, required: true},
        scoresKey: {type: String, default: 'scores'},
        readOnly: {type: Boolean, default: false}
    },
    emits: ['back', 'update', 'next'],
    data() {
        return {
            activeAtelierIndex: 0,
            lastSaved: null
        }
    },
    created() {
        this.goToFirstIncomplete();
    },
    watch: {
        participant() {
            this.goToFirstIncomplete();
        }
    },
    computed: {
        scoring() {
            return SCORING;
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
        participantTotal() {
            let total = 0;
            if (!this.participant[this.scoresKey]) return 0;
            Object.values(this.participant[this.scoresKey]).forEach(atelier => {
                Object.values(atelier).forEach(val => {
                    total += this.scoring[val] || 0;
                });
            });
            return total;
        },
        throwsCompleted() {
            if (!this.participant[this.scoresKey]) return 0;
            let count = 0;
            Object.values(this.participant[this.scoresKey]).forEach(atelier => {
                count += Object.keys(atelier).length;
            });
            return count;
        }
    },
    methods: {
        goToFirstIncomplete() {
            const first = this.ateliers.findIndex((_, idx) => !this.isAtelierComplete(idx));
            this.activeAtelierIndex = first !== -1 ? first : 0;
        },
        getAtelierScore(atelierIndex) {
            const scores = this.participant[this.scoresKey]?.[atelierIndex];
            if (!scores) return 0;
            return Object.values(scores).reduce((sum, val) => sum + (this.scoring[val] || 0), 0);
        },
        isAtelierComplete(atelierIndex) {
            const scores = this.participant[this.scoresKey]?.[atelierIndex];
            if (!scores) return false;
            return Object.keys(scores).length >= this.distances.length;
        },
        getDistanceValue(distance) {
            return this.participant[this.scoresKey]?.[this.activeAtelierIndex]?.[distance] || null;
        },
        setScore(distance, type) {
            if (this.readOnly) return;
            if (!this.participant[this.scoresKey]) {
                this.participant[this.scoresKey] = {};
            }
            if (!this.participant[this.scoresKey][this.activeAtelierIndex]) {
                this.participant[this.scoresKey][this.activeAtelierIndex] = {};
            }
            const current = this.participant[this.scoresKey][this.activeAtelierIndex][distance];
            if (current === type) {
                delete this.participant[this.scoresKey][this.activeAtelierIndex][distance];
                this.lastSaved = null;
            } else {
                this.participant[this.scoresKey][this.activeAtelierIndex][distance] = type;
                const label = type.charAt(0).toUpperCase() + type.slice(1);
                this.lastSaved = `${this.$t('tir.saved')}: ${distance}m · ${label} · ${this.scoring[type]} ${this.$t('ranking.points')}`;
                if (this.isAtelierComplete(this.activeAtelierIndex)) {
                    setTimeout(() => {
                        if (this.activeAtelierIndex < this.ateliers.length - 1) {
                            this.activeAtelierIndex++;
                        } else if (this.throwsCompleted >= this.totalThrows) {
                            this.$emit('back');
                        }
                    }, 300);
                }
            }
            this.$emit('update');
        },
        prevAtelier() {
            if (this.activeAtelierIndex > 0) this.activeAtelierIndex--;
        },
        nextAtelier() {
            if (this.activeAtelierIndex < this.ateliers.length - 1) this.activeAtelierIndex++;
        }
    }
}
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
    color: var(--text-color, #333);
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
    color: #4caf50;
}

.tir-pview__total-max {
    font-size: 14px;
    color: var(--text-secondary, #888);
}

.tir-pview__throws {
    font-size: 12px;
    color: var(--text-secondary, #888);
}

/* Tabs */
.tir-pview__tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 4px;
}

.tir-pview__tab {
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

.tir-pview__tab--active {
    background: var(--primary-color, #f5a623);
    border-color: var(--primary-color, #f5a623);
    color: #fff;
}

.tir-pview__tab--complete:not(.tir-pview__tab--active) {
    border-color: #4caf50;
    color: #4caf50;
}

.tir-pview__tab-labels {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
}

.tir-pview__tab-label {
    width: 36px;
    text-align: center;
    font-size: 9px;
    color: var(--text-secondary, #aaa);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.tir-pview__tab-label--active {
    color: var(--primary-color, #f5a623);
    font-weight: 600;
}

/* Atelier */
.tir-pview__atelier {
    background: var(--card-bg, #fff);
    border: 1px solid var(--border-color, #e0e0e0);
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
    color: #4caf50;
}

.tir-pview__atelier-score-max {
    font-size: 13px;
    color: var(--text-secondary, #888);
}

.tir-pview__atelier-score-label {
    display: block;
    font-size: 11px;
    color: var(--text-secondary, #888);
}

.tir-pview__atelier-desc {
    font-size: 12px;
    color: var(--text-secondary, #888);
    margin-bottom: 8px;
}

/* Legend */
.tir-pview__legend {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 12px;
    margin-bottom: 12px;
    font-size: 12px;
}

.tir-pview__legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-secondary, #666);
}

/* Grid */
.tir-pview__grid {
    margin-bottom: 12px;
}

.tir-pview__grid-header {
    display: flex;
    gap: 3px;
    margin-bottom: 6px;
}

.tir-pview__grid-corner {
    width: 32px;
}

.tir-pview__grid-th {
    flex: 1;
    text-align: center;
    font-size: 10px;
    font-weight: 700;
    padding: 2px;
}

.tir-pview__grid-th--carreau { color: #4caf50; }
.tir-pview__grid-th--reussi { color: #2196F3; }
.tir-pview__grid-th--touche { color: #f5a623; }
.tir-pview__grid-th--manque { color: #9e9e9e; }

.tir-pview__grid-row {
    display: flex;
    gap: 3px;
    margin-bottom: 3px;
}

.tir-pview__grid-distance {
    width: 32px;
    display: flex;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-color, #333);
}

.tir-pview__grid-cell {
    flex: 1;
    height: 32px;
    border: 2px solid var(--border-color, #e0e0e0);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
}

.tir-pview__grid-cell:hover {
    border-color: var(--primary-color, #f5a623);
}

.tir-pview__grid-cell--carreau {
    background: #4caf50;
    border-color: #4caf50;
    color: #fff;
}

.tir-pview__grid-cell--reussi {
    background: #2196F3;
    border-color: #2196F3;
    color: #fff;
}

.tir-pview__grid-cell--touche {
    background: #f5a623;
    border-color: #f5a623;
    color: #fff;
}

.tir-pview__grid-cell--manque {
    background: #9e9e9e;
    border-color: #9e9e9e;
    color: #fff;
}

/* Saved indicator */
.tir-pview__saved {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #4caf50;
    margin-top: 8px;
}

/* Navigation */
.tir-pview__nav {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
}

.tir-pview__nav-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 10px 14px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    background: var(--bg-color, #fff);
    color: var(--text-color, #333);
    font-size: 13px;
    cursor: pointer;
}

.tir-pview__nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.tir-pview__nav-btn--primary {
    background: var(--primary-color, #f5a623);
    border-color: var(--primary-color, #f5a623);
    color: #fff;
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

.tir-score-badge--carreau {
    background: #4caf50;
}

.tir-score-badge--reussi {
    background: #2196F3;
}

.tir-score-badge--touche {
    background: #f5a623;
}

.tir-score-badge--manque {
    background: #9e9e9e;
}
</style>
