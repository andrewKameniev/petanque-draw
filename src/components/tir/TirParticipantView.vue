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

        <!-- Legend -->
        <div class="tir-pview__legend">
            <span class="tir-pview__legend-item"><span class="tir-pview__legend-dot tir-pview__legend-dot--carreau"></span>{{ $t('tir.carreau') }} (5)</span>
            <span class="tir-pview__legend-item"><span class="tir-pview__legend-dot tir-pview__legend-dot--reussi"></span>{{ $t('tir.reussi') }} (3)</span>
            <span class="tir-pview__legend-item"><span class="tir-pview__legend-dot tir-pview__legend-dot--touche"></span>{{ $t('tir.touche') }} (1)</span>
            <span class="tir-pview__legend-item"><span class="tir-pview__legend-dot tir-pview__legend-dot--manque"></span>{{ $t('tir.manque') }} (0)</span>
        </div>

        <!-- All ateliers stacked (readOnly) -->
        <template v-if="readOnly">
            <div v-for="(atelier, aIdx) in ateliers" :key="aIdx" class="tir-pview__atelier-card">
                <div class="tir-pview__atelier-card-header">
                    <span class="tir-pview__atelier-card-num">{{ aIdx + 1 }}</span>
                    <span class="tir-pview__atelier-card-name">{{ atelier.name }}</span>
                    <span class="tir-pview__atelier-card-score">{{ getAtelierScore(aIdx) }}/{{ maxAtelierScore }}</span>
                </div>
                <div class="tir-pview__circles-grid">
                    <div v-for="distance in distances" :key="distance" class="tir-pview__circles-row">
                        <span class="tir-pview__circles-dist">{{ distance }}m</span>
                        <span v-for="opt in resultOptions" :key="opt.key"
                              class="tir-pview__circle"
                              :class="[`tir-pview__circle--${opt.key}`, {'tir-pview__circle--active': getScoreAt(aIdx, distance) === opt.key}]">
                        </span>
                    </div>
                </div>
            </div>
        </template>

        <!-- Atelier tabs (scoring mode) -->
        <template v-else>
            <div class="tir-pview__tabs">
                <button v-for="(atelier, index) in ateliers" :key="index"
                        class="tir-pview__tab"
                        :class="{'tir-pview__tab--active': activeAtelierIndex === index, 'tir-pview__tab--complete': isAtelierComplete(index)}"
                        @click="activeAtelierIndex = index">
                    {{ index + 1 }}
                </button>
            </div>

            <!-- Active atelier scoring -->
            <div class="tir-pview__atelier">
                <div class="tir-pview__atelier-header">
                    <h4>{{ currentAtelier.name }}</h4>
                    <div class="tir-pview__atelier-score">
                        <span class="tir-pview__atelier-score-val">{{ getAtelierScore(activeAtelierIndex) }}</span>
                        <span class="tir-pview__atelier-score-max">/ {{ maxAtelierScore }}</span>
                    </div>
                </div>

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

                <div v-if="lastSaved" class="tir-pview__saved">
                    <CheckCircle :size="14"/>
                    {{ lastSaved }}
                </div>
            </div>
        </template>

        <!-- Navigation (scoring mode only) -->
        <div v-if="!readOnly" class="tir-pview__nav">
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

import {SCORING} from '@/services/tir';

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
        resultOptions() {
            return [{key: 'carreau'}, {key: 'reussi'}, {key: 'touche'}, {key: 'manque'}];
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
        getScoreAt(atelierIdx, distance) {
            return this.participant[this.scoresKey]?.[atelierIdx]?.[distance] || null;
        },
        getDistanceValue(distance) {
            return this.participant[this.scoresKey]?.[this.activeAtelierIndex]?.[distance] || null;
        },
        /* eslint-disable vue/no-mutating-props */
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
        /* eslint-enable vue/no-mutating-props */
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
    color: var(--color-text);
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
    color: var(--tir-carreau);
}

.tir-pview__total-max {
    font-size: 14px;
    color: var(--color-text-muted);
}

.tir-pview__throws {
    font-size: 12px;
    color: var(--color-text-muted);
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
    border: 2px solid var(--color-border);
    background: var(--color-surface);
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    color: var(--color-text);
    transition: all 0.2s;
}

.tir-pview__tab--active {
    background: var(--tir-touche);
    border-color: var(--tir-touche);
    color: var(--color-btn-text);
}

.tir-pview__tab--complete:not(.tir-pview__tab--active) {
    border-color: var(--tir-carreau);
    color: var(--tir-carreau);
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
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.tir-pview__tab-label--active {
    color: var(--tir-touche);
    font-weight: 600;
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
    color: var(--tir-carreau);
}

.tir-pview__atelier-score-max {
    font-size: 13px;
    color: var(--color-text-muted);
}

.tir-pview__atelier-score-label {
    display: block;
    font-size: 11px;
    color: var(--color-text-muted);
}

.tir-pview__atelier-desc {
    font-size: 12px;
    color: var(--color-text-muted);
    margin-bottom: 8px;
}

/* Legend */
.tir-pview__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
    justify-content: center;
}

.tir-pview__legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-muted);
}

.tir-pview__legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.tir-pview__legend-dot--carreau { background: var(--tir-carreau); }
.tir-pview__legend-dot--reussi { background: var(--tir-reussi); }
.tir-pview__legend-dot--touche { background: var(--tir-touche); }
.tir-pview__legend-dot--manque { background: var(--tir-manque); }

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

.tir-pview__grid-th--carreau { color: var(--tir-carreau); }
.tir-pview__grid-th--reussi { color: var(--tir-reussi); }
.tir-pview__grid-th--touche { color: var(--tir-touche); }
.tir-pview__grid-th--manque { color: var(--tir-manque); }

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
    color: var(--color-text);
}

.tir-pview__grid-cell {
    flex: 1;
    height: 32px;
    border: 2px solid var(--color-border);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
}

.tir-pview__grid-cell:hover {
    border-color: var(--tir-touche);
}

.tir-pview__grid-cell--carreau {
    background: var(--tir-carreau);
    border-color: var(--tir-carreau);
    color: var(--color-btn-text);
}

.tir-pview__grid-cell--reussi {
    background: var(--tir-reussi);
    border-color: var(--tir-reussi);
    color: var(--color-btn-text);
}

.tir-pview__grid-cell--touche {
    background: var(--tir-touche);
    border-color: var(--tir-touche);
    color: var(--color-btn-text);
}

.tir-pview__grid-cell--manque {
    background: var(--tir-manque);
    border-color: var(--tir-manque);
    color: var(--color-btn-text);
}

/* Saved indicator */
.tir-pview__saved {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--tir-carreau);
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
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 13px;
    cursor: pointer;
}

.tir-pview__nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.tir-pview__nav-btn--primary {
    background: var(--tir-touche);
    border-color: var(--tir-touche);
    color: var(--color-btn-text);
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
    color: var(--color-btn-text);
}

.tir-score-badge--carreau {
    background: var(--tir-carreau);
}

.tir-score-badge--reussi {
    background: var(--tir-reussi);
}

.tir-score-badge--touche {
    background: var(--tir-touche);
}

.tir-score-badge--manque {
    background: var(--tir-manque);
}

/* Stacked ateliers (complete/readOnly) */
.tir-pview__atelier-card {
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 8px;
}

.tir-pview__atelier-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
}

.tir-pview__atelier-card-num {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--tir-touche);
    color: var(--color-btn-text);
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.tir-pview__atelier-card-name {
    font-weight: 700;
    font-size: 14px;
    flex: 1;
}

.tir-pview__atelier-card-score {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-muted);
}

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

.tir-pview__circle {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid var(--tir-circle-inactive);
    background: radial-gradient(circle, var(--tir-circle-inactive) 56%, var(--color-surface) 56%);
    opacity: 0.35;
    transition: all 0.15s;
}

.tir-pview__circle--active { opacity: 1; }
.tir-pview__circle--active.tir-pview__circle--carreau { border-color: var(--tir-carreau); background: radial-gradient(circle, var(--tir-carreau) 56%, var(--color-surface) 56%); }
.tir-pview__circle--active.tir-pview__circle--reussi { border-color: var(--tir-reussi); background: radial-gradient(circle, var(--tir-reussi) 56%, var(--color-surface) 56%); }
.tir-pview__circle--active.tir-pview__circle--touche { border-color: var(--tir-touche); background: radial-gradient(circle, var(--tir-touche) 56%, var(--color-surface) 56%); }
.tir-pview__circle--active.tir-pview__circle--manque { border-color: var(--tir-manque); background: radial-gradient(circle, var(--tir-manque) 56%, var(--color-surface) 56%); }

.tir-pview__circles-dist {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-muted);
    min-width: 24px;
}
</style>
