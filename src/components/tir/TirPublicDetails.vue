<template>
    <div class="tir-details">
        <h3 class="tir-details__title">{{ $t('results.title') }}</h3>
        <div v-if="rankedParticipants.length" class="tir-details__list">
            <div v-for="(participant, pIdx) in rankedParticipants" :key="participant.id || pIdx" class="tir-details__card">
                <div class="tir-details__card-header" @click="toggleExpand(pIdx)">
                    <span class="tir-details__rank">{{ pIdx + 1 }}</span>
                    <span class="tir-details__name">{{ participant.name }}</span>
                    <span class="tir-details__score"><strong>{{ getTotal(participant) }}</strong> / {{ maxTotal }}</span>
                    <ChevronDown :size="16" class="tir-details__chevron" :class="{'tir-details__chevron--open': expanded === pIdx}"/>
                </div>
                <div v-if="expanded === pIdx" class="tir-details__body">
                    <div v-for="(atelier, aIdx) in atelierNames" :key="aIdx" class="tir-details__atelier">
                        <div class="tir-details__atelier-header">
                            <span class="tir-details__atelier-name">{{ aIdx + 1 }}. {{ atelier }}</span>
                            <span class="tir-details__atelier-score">{{ getAtelierTotal(participant, aIdx) }} / {{ maxAtelierScore }}</span>
                        </div>
                        <div class="tir-details__grid">
                            <div class="tir-details__grid-header">
                                <div class="tir-details__grid-corner"></div>
                                <div class="tir-details__grid-th tir-details__grid-th--carreau">{{ $t('tir.carreau') }}</div>
                                <div class="tir-details__grid-th tir-details__grid-th--reussi">{{ $t('tir.reussi') }}</div>
                                <div class="tir-details__grid-th tir-details__grid-th--touche">{{ $t('tir.touche') }}</div>
                                <div class="tir-details__grid-th tir-details__grid-th--manque">{{ $t('tir.manque') }}</div>
                            </div>
                            <div v-for="distance in distances" :key="distance" class="tir-details__grid-row">
                                <div class="tir-details__grid-distance">{{ distance }}m</div>
                                <div class="tir-details__grid-cell" :class="{'tir-details__grid-cell--carreau': getScore(participant, aIdx, distance) === 'carreau'}">
                                    <Check v-if="getScore(participant, aIdx, distance) === 'carreau'" :size="14"/>
                                </div>
                                <div class="tir-details__grid-cell" :class="{'tir-details__grid-cell--reussi': getScore(participant, aIdx, distance) === 'reussi'}">
                                    <Check v-if="getScore(participant, aIdx, distance) === 'reussi'" :size="14"/>
                                </div>
                                <div class="tir-details__grid-cell" :class="{'tir-details__grid-cell--touche': getScore(participant, aIdx, distance) === 'touche'}">
                                    <Check v-if="getScore(participant, aIdx, distance) === 'touche'" :size="14"/>
                                </div>
                                <div class="tir-details__grid-cell" :class="{'tir-details__grid-cell--manque': getScore(participant, aIdx, distance) === 'manque'}">
                                    <Check v-if="getScore(participant, aIdx, distance) === 'manque'" :size="14"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="tir-details__empty">{{ $t('tir.noParticipants') }}</div>
    </div>
</template>

<script>
import {ChevronDown, Check} from "lucide-vue-next";

const SCORING = {carreau: 5, reussi: 3, touche: 1, manque: 0};
const ATELIER_KEYS = ['atelier1', 'atelier2', 'atelier3', 'atelier4', 'atelier5'];

export default {
    name: 'TirPublicDetails',
    components: {ChevronDown, Check},
    props: {
        tournament: {type: Object, required: true}
    },
    data() {
        return {expanded: null}
    },
    computed: {
        isJunior() {
            return !!this.tournament.tirConfig?.junior;
        },
        distances() {
            return this.isJunior ? [6, 7, 8] : [6, 7, 8, 9];
        },
        maxAtelierScore() {
            return this.distances.length * SCORING.carreau;
        },
        maxTotal() {
            return 5 * this.maxAtelierScore;
        },
        atelierNames() {
            return ATELIER_KEYS.map(k => this.$t(`tir.${k}`));
        },
        participants() {
            return this.tournament.tirParticipants || [];
        },
        rankedParticipants() {
            return [...this.participants].sort((a, b) => this.getTotal(b) - this.getTotal(a));
        }
    },
    methods: {
        toggleExpand(idx) {
            this.expanded = this.expanded === idx ? null : idx;
        },
        getTotal(participant) {
            if (!participant.scores) return 0;
            let total = 0;
            Object.values(participant.scores).forEach(atelier => {
                Object.values(atelier).forEach(val => { total += SCORING[val] || 0; });
            });
            return total;
        },
        getAtelierTotal(participant, atelierIdx) {
            const scores = participant.scores?.[atelierIdx];
            if (!scores) return 0;
            return Object.values(scores).reduce((sum, val) => sum + (SCORING[val] || 0), 0);
        },
        getScore(participant, atelierIdx, distance) {
            return participant.scores?.[atelierIdx]?.[distance] || null;
        }
    }
}
</script>

<style scoped>
.tir-details {
    background: var(--card-bg, #fff);
    border-radius: 12px;
    padding: 1.25rem;
    border: 1px solid var(--color-border, #e0e0e0);
}

.tir-details__title {
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 1rem;
}

.tir-details__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.tir-details__card {
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 8px;
    overflow: hidden;
}

.tir-details__card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    cursor: pointer;
    transition: background 0.15s;
}

.tir-details__card-header:hover {
    background: var(--bg-secondary, #f9f9f9);
}

.tir-details__rank {
    font-weight: 700;
    min-width: 20px;
    color: var(--text-secondary, #666);
}

.tir-details__name {
    flex: 1;
    font-weight: 500;
}

.tir-details__score {
    font-size: 0.9rem;
    color: var(--text-secondary, #666);
}

.tir-details__chevron {
    transition: transform 0.2s;
    color: var(--text-secondary, #999);
}

.tir-details__chevron--open {
    transform: rotate(180deg);
}

.tir-details__body {
    padding: 0 14px 14px;
    border-top: 1px solid var(--color-border, #f0f0f0);
}

.tir-details__atelier {
    margin-top: 12px;
}

.tir-details__atelier-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.tir-details__atelier-name {
    font-weight: 600;
    font-size: 0.85rem;
}

.tir-details__atelier-score {
    font-size: 0.8rem;
    color: var(--text-secondary, #666);
}

.tir-details__grid {
    margin-bottom: 4px;
}

.tir-details__grid-header {
    display: flex;
    gap: 3px;
    margin-bottom: 3px;
}

.tir-details__grid-corner {
    width: 32px;
}

.tir-details__grid-th {
    flex: 1;
    text-align: center;
    font-size: 10px;
    font-weight: 700;
    padding: 2px;
}

.tir-details__grid-th--carreau { color: #4caf50; }
.tir-details__grid-th--reussi { color: #2196F3; }
.tir-details__grid-th--touche { color: #f5a623; }
.tir-details__grid-th--manque { color: #9e9e9e; }

.tir-details__grid-row {
    display: flex;
    gap: 3px;
    margin-bottom: 3px;
}

.tir-details__grid-distance {
    width: 32px;
    display: flex;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
}

.tir-details__grid-cell {
    flex: 1;
    height: 28px;
    border: 1.5px solid var(--color-border, #e0e0e0);
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.tir-details__grid-cell--carreau { background: #4caf50; border-color: #4caf50; color: #fff; }
.tir-details__grid-cell--reussi { background: #2196F3; border-color: #2196F3; color: #fff; }
.tir-details__grid-cell--touche { background: #f5a623; border-color: #f5a623; color: #fff; }
.tir-details__grid-cell--manque { background: #9e9e9e; border-color: #9e9e9e; color: #fff; }

.tir-details__empty {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary, #888);
}
</style>
