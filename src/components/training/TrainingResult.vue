<script>
import {trainingService} from "@/services/db";
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {getDate} from "@/helpers-stat";
import TrainingResultGraph from "@/components/training/TrainingResultGraph.vue";
import {ChevronLeft} from "lucide-vue-next";

export default {
    name: "TrainingResult",
    components: {TrainingResultGraph, ChevronLeft},
    props: ['exid', 'exdata'],
    data() {
        return{
            results: null,
            isLoading: false,
        }
    },
    mounted() {
        this.isLoading = true;

        trainingService.getResults(this.user.uid, this.exid)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    this.results = snapshot.val();
                } else {
                    this.results = null;
                    this.showMessage({
                        title: this.$t('messages.info'),
                        text: this.$t('messages.noExercisesFound'),
                    });
                }
            })
            .catch((error) => {
                console.error('Error loading statistics:', error);
                this.results = null;
                this.showMessage({
                    title: this.$t('messages.error'),
                    text: this.$t('messages.failedLoadData'),
                    type: 'error',
                });
            })
            .finally(() => {
                this.isLoading = false;
            });
    },
    computed: {
        ...mapState(useMainStore, ['user']),
        totalExLength() {
            return this.exdata.length * this.exdata.distances.length
        },
        totalAllTimeLength() {
            if (!this.results) {
                return 0
            }
            return this.totalExLength * Object.keys(this.results).length
        },
        exTotalResults() {
            if (this.results) {
                let totalAllTime = {
                    total: 0,
                    distances: {}
                }
                Object.values(this.exdata.distances).forEach(key => {
                    totalAllTime.distances[key] = 0
                })
                Object.values(this.results).forEach(res => {
                    Object.keys(res.distances).forEach(key => {
                        totalAllTime.distances[key.replace('_', '.')] += res.distances[key].reduce((acc, item) => acc + +item, 0);
                    })
                })
                totalAllTime.total = Object.values(totalAllTime.distances).reduce((acc, item) => acc + item, 0);
                return totalAllTime
            } else {
                return null
            }
        },
        exGraphData() {
            let graphData = {
                results: [],
                dates: []
            };
            Object.values(this.results).forEach(res => {
                graphData.results.push(this.getTotalResults(res.distances))
                graphData.dates.push(getDate(+res.date))
            })
            return graphData
        }
    },
    methods: {
        ...mapActions(useMainStore, ['showMessage']),
        getDate,
        getTotalResults(data) {
            let total = 0;

            Object.values(data).forEach(dist => {
                total += dist.reduce((acc, item) => acc + +item, 0);
            })
            return total
        },
        getStatComplex(ex) {
            const result = [];
            for (let i = 0; i < this.exdata.seriesNames.length; i++) {
                result.push({
                    name: this.exdata.seriesNames[i],
                    result: Object.values(ex).reduce((acc, item) => acc + item[i], 0)
                });
            }

            return result
        }
    }
}
</script>

<template>
    <div v-if="isLoading" class="result-loading">Loading results...</div>
    <div v-else class="result-view">
        <div class="result-view__nav">
            <button @click="$emit('back')" class="result-view__back">
                <ChevronLeft :size="18"/>
                {{$t('stat.back')}}
            </button>
        </div>
        <div v-if="results">
            <div v-if="exTotalResults" class="result-view__summary">
                <div class="result-view__title">{{exdata.name}}</div>
                <div v-if="exdata.value" class="result-view__subtitle">{{$t('training.exGradedText')}}</div>
                <div class="result-view__stats">
                    <div class="result-view__stat-main" v-if="!exdata.value">
                        <span class="result-view__stat-label">{{$t('stat.total')}}</span>
                        <span class="result-view__stat-value">{{exTotalResults.total}}/{{this.totalAllTimeLength}}</span>
                        <span class="result-view__stat-percent">{{Math.round((exTotalResults.total / this.totalAllTimeLength) * 100)}}%</span>
                    </div>
                    <div class="result-view__stat-main" v-else>
                        <span class="result-view__stat-label">{{$t('training.average')}}</span>
                        <span class="result-view__stat-value">{{Math.round(exTotalResults.total / Object.keys(results).length) }}</span>
                    </div>
                    <div v-if="!exdata.complex" class="result-view__distances">
                        <div v-for="(dist, key) in exTotalResults.distances" :key="key" class="result-view__dist-item">
                            <span class="result-view__dist-label">{{key}}m</span>
                            <span class="result-view__dist-value">{{dist}}<span v-if="!exdata.value"> / {{this.totalAllTimeLength / this.exdata.distances.length}}</span></span>
                            <span v-if="!exdata.value" class="result-view__dist-percent">{{Math.round(dist / (this.totalAllTimeLength / this.exdata.distances.length) * 100)}}%</span>
                        </div>
                    </div>
                </div>
            </div>
            <TrainingResultGraph v-if="exGraphData" :graph-data="exGraphData"/>
            <div class="result-view__history">
                <div v-for="(item, key) in results" :key="key" class="result-view__history-item">
                    <div class="result-view__history-date">{{getDate(item.date)}}</div>
                    <div class="result-view__history-body">
                        <div class="result-view__history-total">
                            {{$t('stat.total')}}:
                            <strong>{{getTotalResults(item.distances)}}</strong><span v-if="!exdata.value">/{{this.totalExLength}}</span>
                            <span v-if="!exdata.value" class="result-view__dist-percent">
                                {{Math.round((getTotalResults(item.distances) / this.totalExLength) * 100)}}%
                            </span>
                        </div>
                        <div v-if="exdata.complex" class="result-view__history-details">
                            <span v-for="(item, key) in getStatComplex(item.distances)" :key="key" class="result-view__history-detail">
                                <span>{{item.name}}</span>
                                <strong> - {{item.result}}</strong>
                            </span>
                        </div>
                        <div v-else class="result-view__history-details">
                            <span v-for="(dist, key) in item.distances" :key="key" class="result-view__history-detail">
                                {{key.replace('_', '.')}}m - {{dist.reduce((acc, item) => acc + +item, 0)}}<span v-if="!exdata.value"> / {{this.exdata.length}}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="result-view__empty">
            {{$t('training.noResults')}}
        </div>
    </div>
</template>

<style scoped>
.result-view__nav {
    margin-bottom: 1.5rem;
}

.result-view__back {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    border: 1.5px solid var(--color-primary);
    background: transparent;
    color: var(--color-primary);
    cursor: pointer;
    transition: all 0.15s;
}

.result-view__back:hover {
    background: var(--color-primary);
    color: var(--color-white);
}

.result-view__summary {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
}

.result-view__title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 0.25rem;
}

.result-view__subtitle {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    margin-bottom: 0.75rem;
}

.result-view__stats {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.25rem;
    margin-top: 0.75rem;
}

.result-view__stat-main {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
}

.result-view__stat-label {
    font-size: 0.9rem;
    color: var(--color-text-muted);
}

.result-view__stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text);
}

.result-view__stat-percent {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-primary);
}

.result-view__distances {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.result-view__dist-item {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
    padding: 0.3rem 0.75rem;
    background: var(--color-primary-bg, rgba(124, 58, 237, 0.08));
    border-radius: 8px;
}

.result-view__dist-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-primary);
}

.result-view__dist-value {
    font-size: 0.9rem;
    color: var(--color-text);
}

.result-view__dist-percent {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-primary);
}

.result-view__history {
    margin-top: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.result-view__history-item {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 1rem 1.25rem;
    transition: border-color 0.2s;
}

.result-view__history-item:hover {
    border-color: var(--color-primary);
}

.result-view__history-date {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--color-text-muted);
    margin-bottom: 0.4rem;
}

.result-view__history-body {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}

.result-view__history-total {
    font-size: 1rem;
    color: var(--color-text);
}

.result-view__history-details {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.result-view__history-detail {
    font-size: 0.9rem;
    color: var(--color-text-muted);
}

.result-view__empty {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-muted);
    font-size: 1.1rem;
}
</style>