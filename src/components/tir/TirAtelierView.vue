<template>
    <div class="tir-aview">
        <div class="tir-aview__header">
            <button class="tir-aview__back" @click="$emit('back')">
                <ChevronLeft :size="20"/>
            </button>
            <div class="tir-aview__info">
                <h3 class="tir-aview__name">{{ $t('tir.atelier') }} {{ atelierIndex + 1 }}</h3>
                <div class="tir-aview__desc">{{ atelier.name }}</div>
            </div>
        </div>

        <!-- Scoring legend -->
        <div class="tir-aview__legend">
            <span class="tir-score-badge tir-score-badge--carreau">{{ scoring.carreau }}</span>
            <span class="tir-aview__legend-label">{{ $t('tir.carreau') }}: {{ scoring.carreau }} p</span>
            <span class="tir-score-badge tir-score-badge--reussi">{{ scoring.reussi }}</span>
            <span class="tir-aview__legend-label">{{ $t('tir.reussi') }}: {{ scoring.reussi }} p</span>
            <span class="tir-score-badge tir-score-badge--touche">{{ scoring.touche }}</span>
            <span class="tir-aview__legend-label">{{ $t('tir.touche') }}: {{ scoring.touche }} p</span>
            <span class="tir-score-badge tir-score-badge--manque">{{ scoring.manque }}</span>
            <span class="tir-aview__legend-label">{{ $t('tir.manque') }}: {{ scoring.manque }} p</span>
        </div>

        <!-- Participants list for this atelier -->
        <div class="tir-aview__list">
            <div v-for="(participant, index) in participants" :key="participant.id" class="tir-aview__row">
                <div class="tir-aview__row-info">
                    <span class="tir-aview__row-rank">{{ index + 1 }}</span>
                    <span class="tir-aview__row-name">{{ participant.name }}</span>
                    <span class="tir-aview__row-score">{{ getAtelierScore(participant) }}/{{ maxAtelierScore }} {{ $t('ranking.points') }}</span>
                    <span class="tir-aview__row-throws">{{ getAtelierThrows(participant) }} / {{ distances.length }} {{ $t('tir.throws') }}</span>
                </div>
                <div class="tir-aview__row-status">
                    <CheckCircle v-if="isComplete(participant)" :size="16" class="tir-aview__icon--complete"/>
                    <AlertCircle v-else-if="getAtelierThrows(participant) > 0" :size="16" class="tir-aview__icon--partial"/>
                    <Circle v-else :size="16" class="tir-aview__icon--empty"/>
                </div>
                <button class="tir-aview__row-expand" @click="toggleExpand(participant.id)">
                    <ChevronDown :size="16" :class="{'tir-aview__chevron--open': expandedId === participant.id}"/>
                </button>
                <!-- Inline scoring grid -->
                <div v-if="expandedId === participant.id" class="tir-aview__row-grid">
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
                            <div class="tir-pview__grid-cell" :class="{'tir-pview__grid-cell--carreau': getDistanceValue(participant, distance) === 'carreau'}" @click="setScore(participant, distance, 'carreau')">
                                <CheckIcon v-if="getDistanceValue(participant, distance) === 'carreau'" :size="14"/>
                            </div>
                            <div class="tir-pview__grid-cell" :class="{'tir-pview__grid-cell--reussi': getDistanceValue(participant, distance) === 'reussi'}" @click="setScore(participant, distance, 'reussi')">
                                <CheckIcon v-if="getDistanceValue(participant, distance) === 'reussi'" :size="14"/>
                            </div>
                            <div class="tir-pview__grid-cell" :class="{'tir-pview__grid-cell--touche': getDistanceValue(participant, distance) === 'touche'}" @click="setScore(participant, distance, 'touche')">
                                <CheckIcon v-if="getDistanceValue(participant, distance) === 'touche'" :size="14"/>
                            </div>
                            <div class="tir-pview__grid-cell" :class="{'tir-pview__grid-cell--manque': getDistanceValue(participant, distance) === 'manque'}" @click="setScore(participant, distance, 'manque')">
                                <CheckIcon v-if="getDistanceValue(participant, distance) === 'manque'" :size="14"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Finish button -->
        <button v-if="!readOnly" class="tir-aview__finish" @click="showFinishConfirm = true">
            {{ $t('tir.finishAtelier') }}
        </button>

        <!-- Confirm modal -->
        <Modal v-if="showFinishConfirm" @close-modal="showFinishConfirm = false">
            <div class="tir-aview__confirm">
                <h4 class="tir-aview__confirm-title">{{ $t('tir.finishAtelier') }}</h4>
                <p class="tir-aview__confirm-text">{{ $t('tir.finishAtelierConfirm') }}</p>
                <div class="tir-aview__confirm-actions">
                    <button class="tir-aview__confirm-btn tir-aview__confirm-btn--cancel" @click="showFinishConfirm = false">{{ $t('common.cancel') }}</button>
                    <button class="tir-aview__confirm-btn tir-aview__confirm-btn--confirm" @click="confirmFinish">{{ $t('common.confirm') }}</button>
                </div>
            </div>
        </Modal>
    </div>
</template>

<script>
import {ChevronLeft, ChevronDown, CheckCircle, AlertCircle, Circle, Check as CheckIcon} from "lucide-vue-next";
import Modal from "@/components/Modal";

import {SCORING} from '@/services/tir';

export default {
    name: 'TirAtelierView',
    components: {ChevronLeft, ChevronDown, CheckCircle, AlertCircle, Circle, CheckIcon, Modal},
    props: {
        atelierIndex: {type: Number, required: true},
        atelier: {type: Object, required: true},
        participants: {type: Array, required: true},
        distances: {type: Array, required: true},
        scoresKey: {type: String, default: 'scores'},
        readOnly: {type: Boolean, default: false}
    },
    emits: ['back', 'update', 'finish'],
    data() {
        return {
            expandedId: null,
            showFinishConfirm: false
        }
    },
    computed: {
        scoring() {
            return SCORING;
        },
        maxAtelierScore() {
            return this.distances.length * SCORING.carreau;
        },
        allComplete() {
            return this.participants.every(p => this.isComplete(p));
        }
    },
    methods: {
        toggleExpand(id) {
            this.expandedId = this.expandedId === id ? null : id;
        },
        getAtelierScore(participant) {
            const scores = participant[this.scoresKey]?.[this.atelierIndex];
            if (!scores) return 0;
            return Object.values(scores).reduce((sum, val) => sum + (SCORING[val] || 0), 0);
        },
        getAtelierThrows(participant) {
            const scores = participant[this.scoresKey]?.[this.atelierIndex];
            if (!scores) return 0;
            return Object.keys(scores).length;
        },
        isComplete(participant) {
            return this.getAtelierThrows(participant) >= this.distances.length;
        },
        getDistanceValue(participant, distance) {
            return participant[this.scoresKey]?.[this.atelierIndex]?.[distance] || null;
        },
        setScore(participant, distance, type) {
            if (this.readOnly) return;
            if (!participant[this.scoresKey]) {
                participant[this.scoresKey] = {};
            }
            if (!participant[this.scoresKey][this.atelierIndex]) {
                participant[this.scoresKey][this.atelierIndex] = {};
            }
            const current = participant[this.scoresKey][this.atelierIndex][distance];
            if (current === type) {
                delete participant[this.scoresKey][this.atelierIndex][distance];
            } else {
                participant[this.scoresKey][this.atelierIndex][distance] = type;
            }
            this.$emit('update');
        },
        confirmFinish() {
            this.participants.forEach(p => {
                if (!p[this.scoresKey]) p[this.scoresKey] = {};
                if (!p[this.scoresKey][this.atelierIndex]) p[this.scoresKey][this.atelierIndex] = {};
                this.distances.forEach(distance => {
                    if (!p[this.scoresKey][this.atelierIndex][distance]) {
                        p[this.scoresKey][this.atelierIndex][distance] = 'manque';
                    }
                });
            });
            this.showFinishConfirm = false;
            this.$emit('update');
            this.$emit('finish');
        }
    }
}
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

.tir-aview__name {
    margin: 0;
    font-size: 18px;
}

.tir-aview__desc {
    font-size: 13px;
    color: var(--color-text-muted);
}

.tir-aview__legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-bottom: 16px;
    font-size: 12px;
}

.tir-aview__legend-label {
    margin-right: 8px;
    color: var(--color-text-muted);
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
    color: var(--color-text-muted);
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
    color: var(--color-text-muted);
    white-space: nowrap;
}

.tir-aview__row-throws {
    font-size: 11px;
    color: var(--color-text-muted);
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
    border: none;
    background: none;
    cursor: pointer;
    color: var(--color-text-muted);
    transition: transform 0.2s;
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
    background: #e53935;
    color: var(--color-btn-text);
    border: none;
    border-radius: 10px;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
}

.tir-aview__confirm-title {
    margin: 0 -1.25rem;
    padding: 0 1.25rem 12px;
    border-bottom: 1px solid #e8e8e8;
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
    background: #e53935;
    color: var(--color-btn-text);
}

/* Grid styles */
.tir-pview__grid { margin-bottom: 0; }
.tir-pview__grid-header { display: flex; gap: 3px; margin-bottom: 4px; }
.tir-pview__grid-corner { width: 32px; }
.tir-pview__grid-th { flex: 1; text-align: center; font-size: 10px; font-weight: 700; padding: 2px; }
.tir-pview__grid-th--carreau { color: var(--tir-carreau); }
.tir-pview__grid-th--reussi { color: var(--tir-reussi); }
.tir-pview__grid-th--touche { color: var(--tir-touche); }
.tir-pview__grid-th--manque { color: var(--tir-manque); }
.tir-pview__grid-row { display: flex; gap: 3px; margin-bottom: 3px; }
.tir-pview__grid-distance { width: 32px; display: flex; align-items: center; font-size: 12px; font-weight: 600; }
.tir-pview__grid-cell { flex: 1; height: 32px; border: 2px solid var(--color-border); border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
.tir-pview__grid-cell:hover { border-color: var(--tir-touche); }
.tir-pview__grid-cell--carreau { background: var(--tir-carreau); border-color: var(--tir-carreau); color: var(--color-btn-text); }
.tir-pview__grid-cell--reussi { background: var(--tir-reussi); border-color: var(--tir-reussi); color: var(--color-btn-text); }
.tir-pview__grid-cell--touche { background: var(--tir-touche); border-color: var(--tir-touche); color: var(--color-btn-text); }
.tir-pview__grid-cell--manque { background: var(--tir-manque); border-color: var(--tir-manque); color: var(--color-btn-text); }

/* Score badges */
.tir-score-badge { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; font-size: 11px; font-weight: 700; color: var(--color-btn-text); }
.tir-score-badge--carreau { background: var(--tir-carreau); }
.tir-score-badge--reussi { background: var(--tir-reussi); }
.tir-score-badge--touche { background: var(--tir-touche); }
.tir-score-badge--manque { background: var(--tir-manque); }
</style>
