<script>
import StatCheckbox from "@/components/stats/StatCheckbox.vue";
import {getDatabase, set, ref} from "firebase/database";
import {mapMutations, mapState} from "vuex";

export default {
    name: "TrainingItem",
    components: {StatCheckbox},
    props: ['data', 'exid'],
    data() {
        return {
            currentDistance: 0,
            trainingData: {},
            fastMode: false,
            exNotSaved: false
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
            const localData = JSON.parse(localStorage.getItem('trainingData'));
            if (localData && localData[this.exid]) {
                if (localData[this.exid].date) {
                    this.exNotSaved = true;
                } else {
                    this.trainingData = localData[this.exid]
                }
            } else {
                if (this.data.distanceFirst) {
                    for (let i = 0; i <= this.data.length - 1; i++) {
                        this.trainingData[i] = [];
                        this.data.distances.forEach(dist => {
                            this.trainingData[i].push({
                                dist,
                                isMade: false,
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

            if (this.exNotSaved) {
                let data = JSON.parse(localStorage.getItem('trainingData'));
                exResult = data[this.exid]
            } else {
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
            }

            if (navigator.onLine) {
                if (Object.values(exResult.distances).every(array => Array.isArray(array) && array.every(value => value !== null))) {
                    set(ref(db, `${this.user.uid}/training/${this.exid}/${exResult.date}`), exResult).then(() => {
                        this.showMessage({
                            title: 'Awesome!',
                            text: 'Exercise result saved the database!',
                        });
                        this.$emit('end');
                        this.removeLocalData()
                    }).catch((error) => {
                        console.error('Error save:', error);
                        this.showMessage({title: 'error', text: 'Failed to save data. ' + error, type: 'error'});
                    });
                } else {
                    this.showMessage({title: 'No all results', text: 'Some attempts not written', type: 'error'});
                }
            } else {
                console.log(exResult);
                let data = JSON.parse(localStorage.getItem('trainingData'));
                data[this.exid] = exResult;
                localStorage.setItem('trainingData', JSON.stringify(data))
                this.showMessage({title: 'You are offline', text: 'Your training saved in browser. Save it when you will be online', type: 'error'});
            }
        },
        saveLocalData() {
            let data = JSON.parse(localStorage.getItem('trainingData'));
            if (!data) {
                data = {}
            }
            data[this.exid] = this.trainingData;
            localStorage.setItem('trainingData', JSON.stringify(data))
        },
        removeLocalData() {
            this.exNotSaved = false;
            const localData = JSON.parse(localStorage.getItem('trainingData'));
            delete localData[this.exid];
            localStorage.setItem('trainingData', JSON.stringify(localData));
        },
        nextAttempt() {
            this.currentDistance++;
            this.saveLocalData();
        }
    }
}
</script>

<template>
    <div class="mobile-stat-container">
        <div class="mobile-stat-container-header is-flex is-justify-content-space-between">
            <button @click="$emit('end')" class="button is-info">{{ $t('stat.back') }}</button>
            <button v-if="!data.value" @click="fastMode = !fastMode" class="button is-warning">Fast mode {{fastMode ? 'On' : 'Off'}}</button>
            <button v-if="!exNotSaved" @click="finishTraining" class="button is-info">{{ $t('training.finishTraining') }}</button>
        </div>
        <div v-if="exNotSaved">
            <p class="mt-5 is-size-4">Your training is not saved to database.</p>
            <div class="field is-grouped buttons">
                <div class="control">
                    <button @click="finishTraining" class="button is-success">{{ $t('common.save') }}</button>
                </div>
                <div class="control">
                    <button @click="removeLocalData" class="button is-danger">{{ $t('common.remove') }}</button>
                </div>
            </div>
        </div>
        <div v-else-if="trainingData">
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
                            <div v-if="!data.value">
                                <StatCheckbox v-if="fastMode || item.isMade" :checked-value="item.value" @changeval="setResult($event, item.dist)"/>
                                <div v-else class="gost-throw" @click="item.isMade = true"></div>
                            </div>
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
                <button @click="nextAttempt()" class="ml-auto button is-success" v-if="currentDistance < (data.distanceFirst ? data.length - 1 : data.distances.length - 1)">
                    {{$t('stat.next')}} {{ data.distanceFirst ? $t('training.attempt') : $t('training.distance')}}
                </button>
            </div>
        </div>

    </div>
</template>

<style scoped>
.gost-throw {
    width: 32px;
    height: 32px;
    border: solid 1px;
    border-radius: 7px;
    cursor: pointer;
}

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