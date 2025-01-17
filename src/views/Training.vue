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
                                    <span v-if="addExerciseOpen">{{ $t('training.toList') }}</span>
                                    <span v-else>{{ $t('training.addEx') }}</span>
                                </button>
                            </div>
                        </div>
                        <TrainingAdd v-if="addExerciseOpen" @add="addExToList"/>
                        <TrainingItem v-else-if="exerciseInProcess" :data="exercise" :exid="exerciseInProcess" @end="exerciseInProcess = false"/>
                        <TrainingResult v-else-if="resultsOpen" :exid="resultsOpen" :exdata="exercisesList[resultsOpen]" @back="resultsOpen = false"/>
                        <div v-else>
                            <div v-if="exercisesList">
                                <div class="is-size-4 mb-5">{{ $t('training.exList') }}</div>
                                <div v-for="(item, key) in exercisesList" :key="key" class="exercise-item is-rounded mb-3 p-3">
                                    <div>
                                        <div class="mb-2">
                                            <span class="is-size-5">{{item.name}}</span>
                                            <span class="is-size-7"> ({{item.distances.length}} {{ $t('training.distances') }}, {{ $t('training.serieLength') }} - {{item.length}})</span>
                                        </div>
                                        <div class="is-flex is-align-items-center">
                                            <div class="field is-grouped">
                                                <div class="control">
                                                    <button class="button is-success" @click="start(key)">{{ $t('training.startTraining') }}</button>
                                                </div>
                                                <div class="control">
                                                    <button class="button is-info" @click="viewResults(key)">{{ $t('training.viewResults') }}</button>
                                                </div>
                                            </div>
                                            <button class="ml-auto delete" @click.stop="removeExercise(key)"></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-else>
                                {{ $t('training.addExToBegin') }}
                            </div>

                        </div>
                    </div>
                </div>
                <div v-else class="is-size-3 p-3 has-text-centered">
                    {{ $t('training.asLogin') }}
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
import {get, getDatabase, ref, remove} from "firebase/database";
import {mapMutations, mapState} from "vuex";
import Message from "@/components/Message.vue";
import TrainingItem from "@/components/training/TrainingItem.vue";
import TrainingResult from "@/components/training/TrainingResult.vue";
import TrainingAdd from "@/components/training/TrainingAdd.vue";
export default {
    name: 'Training',
    components: {TrainingAdd, TrainingResult, TrainingItem, Message, Menu, Navbar, /*Footer*/},
    data() {
        return {
            resultsOpen: false,
            addExerciseOpen: false,
            menuOpen: false,
            showResults: false,
            exerciseInProcess: false,
            exercisesList: {},
            exercise: null
        }
    },
    mounted() {
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

    methods: {
        ...mapMutations(['showMessage']),
        start(id) {
            this.exerciseInProcess = id;
            this.exercise = this.exercisesList[id]
        },
        viewResults(id) {
            this.resultsOpen = id;
        },
        addExToList(date, ex) {
            this.addExerciseOpen = false;
            this.exercisesList[date] = ex;
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
