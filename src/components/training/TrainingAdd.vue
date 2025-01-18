<template>
    <div>
        <div class="field">
            <label class="label" for="gameName">{{ $t('training.enterExName') }}</label>
            <div class="control">
                <input v-model="exercise.name" class="input" type="text" id="exerciseName" placeholder="Exercise name">
            </div>
        </div>
        <div class="field">
            <label class="label">{{ $t('training.distances') }}</label>
            <div class="control is-flex" style="gap: 1em; flex-wrap: wrap">
                <label class="checkbox" v-for="item in distances" :key="item">
                    <input type="checkbox" :checked="exercise.distances.includes(item)"
                           @change="updateCheckboxValues('distances', item, $event.target.checked)"/>
                    {{ item.includes('-') ? item.replace('-', '.') : item }}m
                </label>
            </div>
        </div>
        <div class="field">
            <label class="label">{{ $t('training.serieQuantity') }}</label>
            <div class="control">
                <div class="select">
                    <select v-model.number="exercise.length">
                        <template v-for="(item) in 20" :key="item">
                            <option>{{item}}</option>
                        </template>
                    </select>
                </div>
            </div>
        </div>
        <div class="field">
            <label class="checkbox">
                <input type="checkbox" id="distanceFirst" v-model="exercise.complex"/>
                {{ $t('training.nameSerie') }}
            </label>
        </div>
        <div class="field" v-if="exercise.complex">
            <div class="field" v-for="item in exercise.length" :key="item">
                <input type="text" class="input" :id="'serieName' + item" v-model="exercise.seriesNames[item - 1]" :placeholder="'Enter name for ' + item + ' serie'"/>
            </div>
        </div>
        <div class="field">
            <label class="label">{{ $t('training.throwValue') }}</label>
            <div class="field">
                <label class="radio">
                    <input type="radio" name="statMode" id="statModeClassic" :value="false" v-model="exercise.value">
                    {{ $t('training.logical') }}
                </label>
                <label class="radio">
                    <input type="radio" name="statMode" id="statModeFast" :value="true" v-model="exercise.value">
                    {{ $t('training.points') }}
                </label>
            </div>
        </div>
        <div class="field" v-if="exercise.value">
            <label class="label">What points will be available?</label>
            <div class="control is-flex" style="gap: 1em; flex-wrap: wrap">
                <label class="checkbox" v-for="item in possiblePoints" :key="item">
                    <input type="checkbox" :checked="exercise.points.includes(item)"
                           @change="updateCheckboxValues('points', item, $event.target.checked)"/>
                    {{ item }}
                </label>
            </div>
        </div>
        <div class="field" v-if="!exercise.value">
            <label class="label">{{ $t('training.exScenario') }}</label>
            <div class="field">
                <label class="radio">
                    <input type="radio" name="statScenario" id="statScenarioNegative" :value="false" v-model="exercise.scenario">
                    {{ $t('stat.negative') }}
                </label>
                <label class="radio">
                    <input type="radio" name="statScenario" id="statScenarioPositive" :value="true" v-model="exercise.scenario">
                    {{ $t('stat.positive') }}
                </label>
            </div>
        </div>
        <div class="field">
            <label class="checkbox">
                <input type="checkbox" id="distanceFirst" v-model="exercise.distanceFirst"/>
                {{ $t('training.distFirst') }}
            </label>
        </div>
        <button @click="saveExercise" class="button is-success">{{ $t('stat.add') }}</button>
    </div>
</template>
<script>
import {getDatabase, ref, set} from "firebase/database";
import {mapMutations, mapState} from "vuex";
export default {
    name: 'TrainingAdd',
    data() {
        return {
            exercise: {
                complex: false,
                value: false,
                scenario: false,
                name: '',
                length: 10,
                distances: ['6','7','8','9'],
                points: [0,3,5],
                distanceFirst: false
            },
            distances: ['4','4-5','5','5-5','6','6-5','7','7-5','8','8-5','9','9-5','10','10-5','11','11-5','12'],
            possiblePoints: [-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10],
        }
    },
    computed: {
        ...mapState(['user']),
    },
    watch: {
        'exercise.complex'(newValue) {
            if (newValue) {
                this.exercise.seriesNames = []
            } else {
                delete this.exercise.seriesNames
            }
        }
    },
    methods: {
        ...mapMutations(['showMessage']),
        saveExercise() {
            const exerciseId = Date.now();
            const db = getDatabase();
            set(ref(db, `${this.user.uid}/training/list/${exerciseId}`), this.exercise).then(() => {
                this.showMessage({title: 'Awesome!', text: 'Exercise saved to db'});
                this.$emit('add', exerciseId, this.exercise);
            }).catch((error) => {
                console.error('Error save:', error);
                this.showMessage({title: 'error', text: error, type: 'error'});
            });
        },
        updateCheckboxValues(property, item, isChecked) {
            if (isChecked) {
                if (!this.exercise[property].includes(item)) {
                    this.exercise[property].push(item);
                }
            } else {
                this.exercise[property] = this.exercise[property].filter(distance => distance !== item);
            }
        }
    }
}
</script>