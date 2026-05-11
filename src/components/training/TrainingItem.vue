<script>
import StatCheckbox from "@/components/stats/StatCheckbox.vue";
import {trainingService} from "@/services/db";
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import Loader from "@/components/Loader.vue";

export default {
    name: "TrainingItem",
    components: {Loader, StatCheckbox},
    props: ['data', 'exid'],
    data() {
        return {
            currentDistance: 0,
            trainingData: {},
            fastMode: false,
            exNotSaved: false,
            isSaving: false
        }
    },
    mounted() {
        this.setTrainingData();
    },
    computed: {
        ...mapState(useMainStore, ['user']),
        currentDistanceLabel() {
            return this.data.distances[this.currentDistance]
        }
    },
    methods: {
        ...mapActions(useMainStore, ['showMessage']),
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
                            this.trainingData[dist].push({isMade: false, value: this.data.value ? null : this.data.scenario})
                        }
                    })
                }
            }
        },
        setResult(val, key) {
            if (this.data.distanceFirst) {
                this.trainingData[this.currentDistance][this.trainingData[this.currentDistance].findIndex(item => item.dist == key)].value = val;
            } else {
                this.trainingData[this.currentDistanceLabel][key].value = val;
            }
        },
        finishTraining() {
            if (!this.fastMode && !this.data.value && Object.values(this.trainingData).some(item => item.some(value => value.isMade === false))) {
                this.showMessage({title: this.$t('messages.notAllResults'), text: this.$t('messages.someAttemptsNotWritten'), type: 'error'});
                return
            }
            let exResult = {};

            let localData = JSON.parse(localStorage.getItem('trainingData')) || {};
            localData[this.exid] = exResult;
            localStorage.setItem('trainingData', JSON.stringify(localData));
            if (Object.keys(this.trainingData).some(key => key.includes('.'))) {
                const newTrainingData = {};

                Object.keys(this.trainingData).forEach(key => {
                    const newKey = key.includes('.') ? key.replace(/\./g, '_') : key;
                    newTrainingData[newKey] = this.trainingData[key];
                });

                this.trainingData = newTrainingData;
            }

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
                    if (!this.data.value) {
                        let optimizedData = {};
                        Object.keys(this.trainingData).forEach(key =>{
                            optimizedData[key] = this.trainingData[key].map(item => item.value);
                        })
                        exResult.distances = optimizedData
                    } else {
                        exResult.distances = this.trainingData
                    }
                }
            }
            if (navigator.onLine) {
                if (Object.values(exResult.distances).every(array => Array.isArray(array) && array.every(value => value !== null))) {
                    this.isSaving = true;
                    trainingService.saveTrainingResult(this.user.uid, this.exid, exResult.date, exResult).then(() => {
                        this.showMessage({
                            title: this.$t('messages.awesome'),
                            text: this.$t('messages.exerciseSaved'),
                        });
                        this.$emit('end');
                        this.removeLocalData();
                        this.isSaving = false;
                    }).catch((error) => {
                        console.error('Error save:', error);
                        this.showMessage({title: this.$t('messages.error'), text: this.$t('messages.failedSaveData'), type: 'error'});
                    });
                } else {
                    this.showMessage({title: this.$t('messages.notAllResults'), text: this.$t('messages.someAttemptsNotWritten'), type: 'error'});
                }
            } else {
                this.showMessage({title: this.$t('messages.youAreOffline'), text: this.$t('messages.trainingSavedBrowser'), type: 'error'});
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
            <button v-if="!exNotSaved" @click="finishTraining" class="button is-info" :disabled="isSaving">
                <Loader v-if="isSaving"/><span :class="{'opacity-0': isSaving}">{{ $t('training.finishTraining') }}</span>
            </button>
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
                <span v-if="data.complex">
                    {{data.seriesNames[currentDistance]}}
                    <span v-if="!data.distanceFirst">({{currentDistanceLabel + ' ' + $t('training.meters')}})</span>
                </span>
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
                            <div v-if="!data.value">
                                <StatCheckbox v-if="fastMode || item.isMade" :checked-value="item.value" @changeval="setResult($event, key)"/>
                                <div v-else class="gost-throw" @click="item.isMade = true"></div>
                            </div>
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
                    {{ data.distanceFirst ? $t('training.prevAttempt') : $t('training.prevDistance') }}
                </button>
                <button @click="nextAttempt()" class="ml-auto button is-success" v-if="currentDistance < (data.distanceFirst ? data.length - 1 : data.distances.length - 1)">
                    {{ data.distanceFirst ? $t('training.nextAttempt') : $t('training.nextDistance') }}
                </button>
            </div>
        </div>

    </div>
</template>

<style scoped>
.gost-throw {
    width: 32px;
    height: 32px;
    border: solid 1px var(--color-border-medium);
    border-radius: 7px;
    cursor: pointer;
}

.training-item {
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
    background: var(--color-surface-semi);
    border-radius: 0.25rem;
}

.training-item-cell + .training-item-cell {
    border-top: 0;
}
.training-item-cell {
    border: solid 1px var(--color-border-medium);
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