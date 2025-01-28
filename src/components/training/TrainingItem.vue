<script>
import StatCheckbox from "@/components/stats/StatCheckbox.vue";
import {getDatabase, set, ref} from "firebase/database";
import {mapMutations, mapState} from "vuex";

export default {
    name: "TrainingItem",
    components: {StatCheckbox},
    props: ['data', 'exid'],
    data() {
        return{
            currentDistance: 0,
            trainingData: {}
        }
    },
    mounted() {
        this.setTrainingData();
    },
    computed: {
        ...mapState(['user']),
        currentDistanceLabel() {
            return this.data.distances[this.currentDistance]
        }
    },
    methods: {
        ...mapMutations(['showMessage']),
        setTrainingData() {
            if (this.data.distanceFirst) {
                for (let i = 0; i <= this.data.length - 1; i++) {
                    this.trainingData[i] = [];
                    this.data.distances.forEach(dist => {
                        this.trainingData[i].push({
                            dist,
                            value: this.data.value ? null : this.data.scenario
                        })
                    })
                }
            } else {
                this.data.distances.forEach(dist => {
                    this.trainingData[dist] = [];
                    for (let i = 0; i <= this.data.length - 1; i++) {
                        this.trainingData[dist].push(this.data.value ? null : this.data.scenario)
                    }
                })
            }
        },
        setResult(val, key) {
            if (this.data.distanceFirst) {
                this.trainingData[this.currentDistance][this.trainingData[this.currentDistance].findIndex(item => item.dist == key)].value = val;
            } else {
                this.trainingData[this.currentDistanceLabel][key] = val;
            }
        },
        finishTraining() {
            const db = getDatabase();
            let exResult = {};
            exResult.date = Date.now();
            if (this.data.distanceFirst) {
                let revertedData = {};
                this.data.distances.forEach(dist => {
                    revertedData[dist] = [];
                    for (let i = 0; i <= this.data.length - 1; i++) {
                        revertedData[dist].push(this.trainingData[i][this.trainingData[i].findIndex(item => item.dist == dist)].value)
                    }
                })
                exResult.distances = revertedData;
            } else {
                exResult.distances = this.trainingData
            }

            if (Object.values(exResult.distances).every(array => Array.isArray(array) && array.every(value => value !== null))) {
                set(ref(db, `${this.user.uid}/training/${this.exid}/${exResult.date}`), exResult).then(() => {
                    this.showMessage({
                        title: 'Awesome!',
                        text: 'Exercise result saved the database!',
                    });
                    this.$emit('end')
                }).catch((error) => {
                    console.error('Error save:', error);
                    this.showMessage({title: 'error', text: 'Failed to save data. ' + error, type: 'error'});
                });
            } else {
                this.showMessage({title: 'No all results', text: 'Some attempts not written', type: 'error'});
            }


        }
    }
}
</script>

<template>
    <div v-if="trainingData" class="mobile-stat-container">
        <div class="mobile-stat-container-header is-flex is-justify-content-space-between">
            <button @click="$emit('end')" class="button is-info">{{ $t('stat.back') }}</button>
            <button @click="finishTraining" class="button is-info">{{ $t('training.finishTraining') }}</button>
        </div>
        <div class="is-size-3 my-3">
            {{data.name}}
        </div>
        <div class="has-text-right-mobile is-size-4 mb-3">
            <span v-if="data.complex">{{data.seriesNames[currentDistance]}}</span>
            <span v-else>
                {{data.distanceFirst ? currentDistance + 1 + ' ' + $t('training.attempt') : currentDistanceLabel + ' ' + $t('training.meters')}}
            </span>
        </div>
        <div>
            <div v-if="data.distanceFirst" class="training-item-container">
                <div v-for="(item, key) in trainingData[currentDistance]" :key="key" class="training-item">
                    <div class="is-size-4 training-item-cell">{{String(item.dist).includes('-') ? item.dist.replace('-', '.') + 'm' : item.dist + 'm'}}</div>
                    <div class="training-item-cell">
                        <StatCheckbox v-if="!data.value" :checked-value="item.value" @changeval="setResult($event, item.dist)"/>
                        <div class="control" v-else>
                            <div class="select">
                                <select v-model.number="item.value">
                                    <template v-for="(item) in data.points" :key="item">
                                        <option>{{item}}</option>
                                    </template>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="training-item-container">
                <div v-for="(item, key) in trainingData[currentDistanceLabel]" :key="key" class="training-item">
                    <div class="is-size-4 training-item-cell">{{key + 1}}</div>
                    <div class="training-item-cell">
                        <StatCheckbox v-if="!data.value" :checked-value="item" @changeval="setResult($event, key)"/>
                        <div class="control" v-else>
                            <div class="select">
                                <select v-model.number="trainingData[currentDistanceLabel][key]">
                                    <template v-for="(item) in data.points" :key="item">
                                        <option>{{item}}</option>
                                    </template>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
        <div class="is-flex">
            <button @click="currentDistance--" class="button is-info" v-if="currentDistance > 0">
                {{$t('stat.prev')}} {{ data.distanceFirst ? $t('training.attempt') : $t('training.distance')}}
            </button>
            <button @click="currentDistance++" class="ml-auto button is-success" v-if="currentDistance < (data.distanceFirst ? data.length - 1 : data.distances.length - 1)">
                {{$t('stat.next')}} {{ data.distanceFirst ? $t('training.attempt') : $t('training.distance')}}
            </button>
        </div>
    </div>
</template>

<style scoped>
.training-item {
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
    background: rgba(255,255,255,0.2);
    border-radius: 0.25rem;
}

.training-item-cell + .training-item-cell {
    border-top: 0;
}
.training-item-cell {
    border: solid 1px #fff;
    padding: 0.5rem;
}

.training-item-container {
    display: flex;
    flex-wrap: wrap;
    text-align: center;
    margin-bottom: 1rem;
}

@media screen and (max-width: 575px){
    .training-item-container {
        flex-direction: column;
        align-items: flex-end;
    }

    .training-item {
        flex-direction: row;
        padding: 0.2rem;
    }

    .training-item-cell {
        flex: 1;
        width: 5rem;
        display: flex;
        justify-content: center;
    }
}
</style>