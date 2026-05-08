<script>
import {trainingService} from "@/services/db";
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {getDate} from "@/helpers-stat";
import TrainingResultGraph from "@/components/training/TrainingResultGraph.vue";

export default {
    name: "TrainingResult",
    components: {TrainingResultGraph},
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
                    this.showMessage({
                        title: this.$t('messages.awesome'),
                        text: this.$t('messages.exercisesLoaded'),
                    });
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
    <div v-if="isLoading">Loading results...</div>
    <div v-else>
        <div class="mb-5">
            <button @click="$emit('back')" class="button is-info">{{$t('stat.back')}}</button>
        </div>
        <div v-if="results">
            <div v-if="exTotalResults">
                <div class="is-size-3 my-3">
                    {{exdata.name}}
                </div>
                <div v-if="exdata.value" class="is-size-6 mb-3">{{$t('training.exGradedText')}}</div>
                <div class="is-flex-tablet is-justify-content-space-between mb-3">
                    <div v-if="!exdata.value">
                        {{$t('stat.total')}}: <strong>{{exTotalResults.total}}</strong>/{{this.totalAllTimeLength}}
                        <span>-
                            (<strong>{{Math.round((exTotalResults.total / this.totalAllTimeLength) * 100)}}%</strong>)
                        </span>
                    </div>
                    <div v-else>
                        {{$t('training.average')}}: <strong>{{Math.round(exTotalResults.total / Object.keys(results).length) }}</strong>
                    </div>
                    <div v-if="!exdata.complex">
                        <span v-for="(dist, key) in exTotalResults.distances" :key="key" class="ml-5">
                            {{key}}m&nbsp;-&nbsp;{{dist}} <span v-if="!exdata.value">/ {{this.totalAllTimeLength / this.exdata.distances.length}}</span>
                            <span v-if="!exdata.value">-
                                (<strong>{{Math.round(dist / (this.totalAllTimeLength / this.exdata.distances.length) * 100)}}%</strong>)
                            </span>
                        </span>
                    </div>
                </div>
            </div>
            <hr>
            <TrainingResultGraph v-if="exGraphData" :graph-data="exGraphData"/>
            <div class="training-item-container">
                <div v-for="(item, key) in results" :key="key" class="exercise-item p-3 mb-3">
                    <div>{{getDate(item.date)}}</div>
                    <div class="is-flex-tablet is-justify-content-space-between">
                        <div>
                            {{$t('stat.total')}}:
                            <strong>{{getTotalResults(item.distances)}}</strong><span v-if="!exdata.value">/{{this.totalExLength}}</span>
                            <span v-if="!exdata.value">-
                                (<strong>{{Math.round((getTotalResults(item.distances) / this.totalExLength) * 100)}}%</strong>)
                            </span>
                        </div>
                        <div v-if="exdata.complex">
                            <span v-for="(item, key) in getStatComplex(item.distances)" :key="key" class="ml-5 is-block-mobile">
                                <span>{{item.name}}</span>
                                <strong> - {{item.result}}</strong>
                            </span>
                        </div>
                        <div v-else>
                            <span v-for="(dist, key) in item.distances" :key="key" class="ml-5">
                                {{key.replace('_', '.')}}m&nbsp;-&nbsp;{{dist.reduce((acc, item) => acc + +item, 0)}} <span v-if="!exdata.value">/ {{this.exdata.length}}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else>
            {{$t('training.noResults')}}
        </div>
    </div>
</template>

<style scoped>

</style>