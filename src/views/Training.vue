<template>
    <div class="wrapper">
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
                                <button v-if="!exerciseInProcess && !resultsOpen" @click="addExerciseOpen = !addExerciseOpen" class="button btn-primary">
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
                                                    <button class="button btn-primary" @click="start(key)">{{ $t('training.startTraining') }}</button>
                                                </div>
                                                <div class="control">
                                                    <button class="button btn-primary-outline" @click="viewResults(key)">{{ $t('training.viewResults') }}</button>
                                                </div>
                                            </div>
                                            <button class="ml-auto delete" @click.stop="confirmRemoveId = key"></button>
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
                    <div class="mt-5">
                        <router-link to="/" class="btn-login-primary btn-login-primary--large">
                            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                            </svg>
                            {{ $t('common.loginUser') }}
                        </router-link>
                    </div>
                </div>
            </div>
            <Message v-if="message.show"/>
            <ConfirmRemoveModal :title="$t('messages.removeExercise')" @remove="removeExercise(confirmRemoveId)" @close="confirmRemoveId = null" v-if="confirmRemoveId"/>
        </div>
        <Footer/>
    </div>
</template>

<script>

import Footer from "@/components/partials/Footer.vue";
import Navbar from "@/components/Navbar.vue";
import Menu from "@/components/Menu.vue";
import {trainingService} from "@/services/db";
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import Message from "@/components/Message.vue";
import TrainingItem from "@/components/training/TrainingItem.vue";
import TrainingResult from "@/components/training/TrainingResult.vue";
import TrainingAdd from "@/components/training/TrainingAdd.vue";
import ConfirmRemoveModal from "@/components/ConfirmRemoveModal.vue";
export default {
    name: 'Training',
    components: {ConfirmRemoveModal, TrainingAdd, TrainingResult, TrainingItem, Message, Menu, Navbar, Footer},
    data() {
        return {
            resultsOpen: false,
            addExerciseOpen: false,
            menuOpen: false,
            showResults: false,
            exerciseInProcess: false,
            exercisesList: {},
            exercise: null,
            confirmRemoveId: null
        }
    },
    mounted() {
        this.isLoading = true;

        trainingService.getAll(this.user.uid)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    this.exercisesList = snapshot.val();
                } else {
                    this.statsList = null;
                    this.showMessage({
                        title: this.$t('messages.info'),
                        text: this.$t('messages.noExercisesFound'),
                    });
                }
            })
            .catch((error) => {
                console.error('Error loading statistics:', error);
                this.exercisesList = null;
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
        ...mapState(useMainStore, ['user', 'message']),
    },

    methods: {
        ...mapActions(useMainStore, ['showMessage']),
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
            trainingService.remove(this.user.uid, id)
                .then(() => {
                    delete this.exercisesList[id];
                    this.showMessage({
                        title: this.$t('messages.awesome'),
                        text: this.$t('messages.exerciseRemoved'),
                    });
                })
                .catch((error) => {
                    console.error('Error deleting data:', error);
                    this.showMessage({
                        title: this.$t('messages.error'),
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
    background: var(--color-surface-semi);
    border-radius: 0.5rem;
    border: 2px solid var(--color-primary);
    cursor: pointer;
}

.btn-primary {
    background: var(--color-primary) !important;
    border-color: var(--color-primary) !important;
    color: var(--color-white) !important;
}

.btn-primary:hover {
    opacity: 0.9;
}

.btn-primary-outline {
    background: transparent !important;
    border: 2px solid var(--color-primary) !important;
    color: var(--color-primary) !important;
}

.btn-primary-outline:hover {
    background: var(--color-primary) !important;
    color: var(--color-white) !important;
}

</style>
