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
                        <div v-if="addExerciseOpen">
                            <button @click="addExerciseOpen = false" class="button btn-primary-outline btn-sm mb-3">{{ $t('training.toList') }}</button>
                            <TrainingAdd @add="addExToList"/>
                        </div>
                        <TrainingItem v-else-if="exerciseInProcess" :data="exercise" :exid="exerciseInProcess" @end="exerciseInProcess = false"/>
                        <TrainingResult v-else-if="resultsOpen" :exid="resultsOpen" :exdata="exercisesList[resultsOpen]" @back="resultsOpen = false"/>
                        <div v-else>
                            <div v-if="exercisesList">
                                <div class="exercise-list-header">
                                    <div class="exercise-list-title">{{ $t('training.exList') }}</div>
                                    <button @click="addExerciseOpen = true" class="button btn-primary btn-sm">{{ $t('training.addEx') }}</button>
                                </div>
                                <div v-for="(item, key) in exercisesList" :key="key" class="exercise-item">
                                    <div class="exercise-item__top">
                                        <div>
                                            <div class="exercise-item__name">{{item.name}}</div>
                                            <div class="exercise-item__meta">
                                                <span class="exercise-item__badge">{{item.distances.length}} {{ $t('training.distances') }}</span>
                                                <span class="exercise-item__badge">{{ $t('training.serieLength') }}: {{item.length}}</span>
                                            </div>
                                        </div>
                                        <button class="exercise-item__delete" @click.stop="confirmRemoveId = key">
                                            <Trash2 :size="14"/>
                                        </button>
                                    </div>
                                    <div class="exercise-item__actions">
                                        <button class="button btn-primary btn-sm" @click="start(key)">{{ $t('training.startTraining') }}</button>
                                        <button class="button btn-primary-outline btn-sm" @click="viewResults(key)">{{ $t('training.viewResults') }}</button>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="exercise-empty">
                                <p>{{ $t('training.addExToBegin') }}</p>
                                <button @click="addExerciseOpen = true" class="button btn-primary btn-sm mt-3">{{ $t('training.addEx') }}</button>
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
import {Trash2} from "lucide-vue-next";
export default {
    name: 'Training',
    components: {ConfirmRemoveModal, TrainingAdd, TrainingResult, TrainingItem, Message, Menu, Navbar, Footer, Trash2},
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

.exercise-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
}

.exercise-list-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
}

.exercise-item {
    background: var(--color-surface);
    border-radius: 10px;
    border: 1px solid var(--color-border);
    padding: 0.75rem 1rem;
    margin-bottom: 0.6rem;
    transition: border-color 0.15s;
}

.exercise-item:hover {
    border-color: var(--color-primary);
}

.exercise-item__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
}

.exercise-item__name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    line-height: 1.3;
}

.exercise-item__meta {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-top: 0.3rem;
}

.exercise-item__badge {
    font-size: 0.7rem;
    font-weight: 500;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    background: var(--color-primary-bg, rgba(124, 58, 237, 0.1));
    color: var(--color-primary);
}

.exercise-item__delete {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 0.3rem;
    border-radius: 6px;
    transition: color 0.15s;
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.exercise-item__delete:hover {
    color: var(--color-error);
}

.exercise-item__actions {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.6rem;
}

.btn-primary {
    background: var(--color-primary) !important;
    border-color: var(--color-primary) !important;
    color: var(--color-white) !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
    transition: opacity 0.15s !important;
}

.btn-primary:hover {
    opacity: 0.85;
}

.btn-primary-outline {
    background: transparent !important;
    border: 1.5px solid var(--color-primary) !important;
    color: var(--color-primary) !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
    transition: all 0.15s !important;
}

.btn-primary-outline:hover {
    background: var(--color-primary) !important;
    color: var(--color-white) !important;
}

.btn-sm {
    font-size: 0.85rem !important;
    padding: 0.4rem 0.75rem !important;
}

</style>
