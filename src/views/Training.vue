<template>
    <div>
        <Navbar @open-menu="menuOpen = !menuOpen"/>
        <div class="container">
            <Menu :active="menuOpen"
                  @closeMenu="menuOpen = false"
            />
            <div class="stat-container">
                <div v-if="user" class="mobile-stat-container">
                    <div class="mobile-stat-container">
                        <div class="has-text-right mobile-stat-container-header">
                            <div class="is-flex is-justify-content-space-between mb-3">
                                <button v-if="!exerciseInProcess && !resultsOpen" @click="addExerciseOpen = !addExerciseOpen" class="button is-info">
                                    <span v-if="addExerciseOpen">To list</span>
                                    <span v-else>Add exercise</span>
                                </button>
                            </div>
                        </div>
                        <div v-if="addExerciseOpen">
                            <div class="field">
                                <label class="label" for="gameName">Enter training exercise name</label>
                                <div class="control">
                                    <input v-model="exercise.name" class="input" type="text" id="exerciseName" placeholder="Exercise name">
                                </div>
                            </div>
                            <div class="field">
                                <label class="label">Distances</label>
                                <div class="control is-flex" style="gap: 1em; flex-wrap: wrap">
                                    <label class="checkbox" v-for="item in distances" :key="item">
                                        <input type="checkbox" :checked="exercise.distances.includes(item)"
                                               @change="updateCheckboxValues('distances', item, $event.target.checked)"/>
                                        {{ item }}m
                                    </label>
                                </div>
                            </div>
                            <div class="field">
                                <label class="label">Serie quantity</label>
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
                                <label class="label">Throw value</label>
                                <div class="field">
                                    <label class="radio">
                                        <input type="radio" name="statMode" id="statModeClassic" :value="false" v-model="exercise.value">
                                        Logical
                                    </label>
                                    <label class="radio">
                                        <input type="radio" name="statMode" id="statModeFast" :value="true" v-model="exercise.value">
                                        Points
                                    </label>
                                </div>
                            </div>
                            <div class="field" v-if="exercise.value">
                                <label class="label">What points will be available?</label>
                                <div class="control is-flex" style="gap: 1em; flex-wrap: wrap">
                                    <label class="checkbox" v-for="item in possiblePoints" :key="item">
                                        <input type="checkbox" :checked="exercise.points.includes(item)"
                                               @change="updateCheckboxValues('points', item, $event.target.checked)"/>
                                        {{ item }}m
                                    </label>
                                </div>
                            </div>
                            <div class="field" v-if="!exercise.value">
                                <label class="label">Exercise scenario</label>
                                <div class="field">
                                    <label class="radio">
                                        <input type="radio" name="statScenario" id="statScenarioNegative" :value="false" v-model="exercise.scenario">
                                        Negative
                                    </label>
                                    <label class="radio">
                                        <input type="radio" name="statScenario" id="statScenarioPositive" :value="true" v-model="exercise.scenario">
                                        Positive
                                    </label>
                                </div>
                            </div>
                            <div class="field">
                                <label class="checkbox">
                                    <input type="checkbox" id="distanceFirst" v-model="exercise.distanceFirst"/>
                                    Distance first
                                </label>
                            </div>
                            <button @click="saveExercise" class="button is-success">Add</button>
                        </div>
                        <TrainingItem v-else-if="exerciseInProcess" :data="exercise" :exid="exerciseInProcess" @end="exerciseInProcess = false"/>
                        <TrainingResult v-else-if="resultsOpen" :exid="resultsOpen" :exdata="exercisesList[resultsOpen]" @back="resultsOpen = false"/>
                        <div v-else>
                            <div v-if="exercisesList">
                                <div class="is-size-4">Exercises list</div>
                                <div v-for="(item, key) in exercisesList" :key="key" class="exercise-item is-rounded mb-3 p-3">
                                    <div>
                                        <div class="mb-2">
                                            <span class="is-size-5">{{item.name}}</span>
                                            <span class="is-size-7"> ({{item.distances.length}} distances, serie length - {{item.length}})</span>
                                        </div>
                                        <div class="is-flex is-align-items-center">
                                            <div class="field is-grouped">
                                                <div class="control">
                                                    <button class="button is-success" @click="start(key)">Start training</button>
                                                </div>
                                                <div class="control">
                                                    <button class="button is-info" @click="viewResults(key)">View results</button>
                                                </div>
                                            </div>
                                            <button class="ml-auto delete" @click.stop="removeExercise(key)"></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-else>
                                Add exercise to begin trainings
                            </div>

                        </div>
                    </div>
                </div>
                <div v-else class="is-size-3 p-3 has-text-centered">
                    You can count trainings statistic only as login user
                </div>
            </div>
            <Message v-if="message.show"/>
<!--            <Footer/>-->
        </div>
    </div>
</template>

<script>

// import Footer from "@/components/partials/Footer.vue";
import Navbar from "@/components/Navbar.vue";
import Menu from "@/components/Menu.vue";
import {get, getDatabase, ref, remove, set} from "firebase/database";
import {mapMutations, mapState} from "vuex";
import Message from "@/components/Message.vue";
import TrainingItem from "@/components/training/TrainingItem.vue";
import TrainingResult from "@/components/training/TrainingResult.vue";
export default {
    name: 'Training',
    components: {TrainingResult, TrainingItem, Message, Menu, Navbar, /*Footer*/},
    data() {
        return {
            resultsOpen: false,
            addExerciseOpen: false,
            menuOpen: false,
            showResults: false,
            exerciseInProcess: false,
            exercise: {
                value: false,
                scenario: false,
                name: '',
                length: 10,
                distances: [6,7,8,9],
                points: [0,3,5],
                distanceFirst: false
            },
            distances: [4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10,10.5,11,11.5,12],
            possiblePoints: [0,1,2,3,4,5,6,7,8,9,10],
            exercisesList: {}
        }
    },
    mounted() {
        // this.getLocalData();
        const db = getDatabase();
        const statsRef = ref(db, `${this.user.uid}/training/list`);

        this.isLoading = true;

        get(statsRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    this.exercisesList = snapshot.val();
                    this.showMessage({
                        title: 'Awesome!',
                        text: 'Exercises successfully loaded from the database!',
                    });
                } else {
                    this.statsList = null; // Handle case where data doesn't exist
                    this.showMessage({
                        title: 'Info',
                        text: 'No exercises found for you',
                    });
                }
            })
            .catch((error) => {
                console.error('Error loading statistics:', error);
                this.exercisesList = null;
                this.showMessage({
                    title: 'Error',
                    text: 'Failed to load data. Please try again later.',
                    type: 'error',
                });
            })
            .finally(() => {
                this.isLoading = false;
            });
    },
    computed: {
        ...mapState(['user', 'message']),
    },
    watch: {

    },
    methods: {
        ...mapMutations(['showMessage']),
        start(id) {
            this.exerciseInProcess = id;
            this.exercise = this.exercisesList[id]
        },
        viewResults(id) {
            this.resultsOpen = id;
        },
        saveLocalData() {
            const data = {
                type: this.gameType,
                system: this.statSystem,
                name: this.gameName,
                scenario: this.statScenario,
                mode: this.statMode,
                team1: {...this.team1},
                team2: {...this.team2}
            }
            localStorage.setItem('statGame', JSON.stringify(data))
        },
        getLocalData(){
            if (localStorage.getItem('statGame')) {
                const gameData = JSON.parse(localStorage.getItem('statGame'));
                this.gameType = gameData.type;
                this.statMode = gameData.mode;
                this.statScenario = gameData.scenario;
                this.statSystem = gameData.system;
                this.gameName = gameData.name;
                this.team1 = {...gameData.team1};
                this.team2 = {...gameData.team2};
                this.currentMan = this.manCount - 1;
            } else {
                this.changePlayers();
            }
        },
        saveExercise() {
            const exerciseId = Date.now();
            const db = getDatabase();
            set(ref(db, `${this.user.uid}/training/list/${exerciseId}`), this.exercise).then(() => {
                this.showMessage({title: 'Awesome!', text: 'Exercise saved to db'});
                this.addExerciseOpen = false;
                this.exercisesList[exerciseId] = this.exercise;
            }).catch((error) => {
                console.error('Error save:', error);
                this.showMessage({title: 'error', text: error, type: 'error'});
            });
        },
        removeExercise(id) {
            const db = getDatabase();
            const statsRef = ref(db, `${this.user.uid}/training/list/${id}`);

            remove(statsRef)
                .then(() => {
                    delete this.exercisesList[id];
                    this.showMessage({
                        title: 'Awesome!',
                        text: 'Exercise successfully removed the database!',
                    });
                })
                .catch((error) => {
                    console.error('Error deleting data:', error);
                    this.showMessage({
                        title: 'Error',
                        text: error,
                        type: 'error',
                    });
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
    },
}
</script>

<style>

.exercise-item {
    background: rgba(255,255,255,0.5);
    border-radius: 0.5rem;
    cursor: pointer;
}

</style>
