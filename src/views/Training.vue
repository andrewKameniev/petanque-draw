<template>
    <div class="wrapper">
        <Navbar @open-menu="menuOpen = !menuOpen" />
        <div class="container">
            <Menu :active="menuOpen" @closeMenu="menuOpen = false" />
            <div class="stat-container">
                <div v-if="user" class="mobile-stat-container">
                    <div class="mobile-stat-container training-content">
                        <!-- Create new session -->
                        <TrainingCreate v-if="view === 'create'" @back="view = 'list'" @created="onSessionCreated" />

                        <!-- Active session scoring -->
                        <TrainingSession
                            v-else-if="view === 'session'"
                            :session="activeSession"
                            @back="backToList"
                            @update="saveActiveSession"
                        />

                        <!-- Session statistics -->
                        <TrainingStats v-else-if="view === 'stats'" :sessions="sessionsList" @back="view = 'list'" />

                        <!-- Old exercise system -->
                        <div v-else-if="view === 'add-exercise' || view === 'edit-exercise'">
                            <button @click="cancelEditExercise" class="button btn-primary-outline btn-sm mb-3">
                                {{ $t('training.toList') }}
                            </button>
                            <TrainingAdd :edit-id="editExerciseId" :edit-data="editExerciseData" @add="addExToList" />
                        </div>
                        <TrainingItem
                            v-else-if="exerciseInProcess"
                            :data="exercise"
                            :exid="exerciseInProcess"
                            @end="exerciseInProcess = false"
                        />
                        <TrainingResult
                            v-else-if="resultsOpen"
                            :exid="resultsOpen"
                            :exdata="exercisesList[resultsOpen]"
                            @back="resultsOpen = false"
                        />

                        <!-- Main list view -->
                        <div v-else>
                            <!-- Tabs -->
                            <div class="training-tabs">
                                <button
                                    class="training-tab"
                                    :class="{ 'training-tab--active': tab === 'sessions' }"
                                    @click="tab = 'sessions'"
                                >
                                    {{ $t('training.tirSessions') }}
                                </button>
                                <button
                                    class="training-tab"
                                    :class="{ 'training-tab--active': tab === 'exercises' }"
                                    @click="tab = 'exercises'"
                                >
                                    {{ $t('training.exercises') }}
                                </button>
                            </div>

                            <!-- Tir Sessions Tab -->
                            <div v-if="tab === 'sessions'">
                                <div class="training-list-header">
                                    <div class="training-list-title">{{ $t('training.tirSessions') }}</div>
                                    <div v-if="sessionsList.length" class="training-list-actions">
                                        <button @click="view = 'stats'" class="button btn-primary-outline btn-sm">
                                            <BarChart3 :size="14" />
                                            {{ $t('training.statistics') }}
                                        </button>
                                        <button @click="view = 'create'" class="button btn-primary btn-sm">
                                            <Plus :size="14" />
                                            {{ $t('training.newSession') }}
                                        </button>
                                    </div>
                                </div>

                                <div v-if="sessionsList.length" class="training-sessions">
                                    <div
                                        v-for="session in sortedSessions"
                                        :key="session.id"
                                        class="session-card"
                                        @click="openSession(session)"
                                    >
                                        <div class="session-card__top">
                                            <div class="session-card__info">
                                                <div class="session-card__name">{{ session.name }}</div>
                                                <div class="session-card__meta">
                                                    <span class="session-card__badge session-card__badge--type">{{
                                                        getTypeLabel(session.type)
                                                    }}</span>
                                                    <span
                                                        class="session-card__badge"
                                                        :class="'session-card__badge--' + session.status"
                                                    >
                                                        {{ getStatusLabel(session.status) }}
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="session-card__actions">
                                                <button
                                                    v-if="session.status === 'completed'"
                                                    class="session-card__rerun"
                                                    @click.stop="rerunSession(session)"
                                                    :title="$t('training.rerun')"
                                                >
                                                    <RotateCcw :size="14" />
                                                </button>
                                                <button
                                                    class="session-card__delete"
                                                    @click.stop="confirmDeleteId = session.id"
                                                >
                                                    <Trash2 :size="14" />
                                                </button>
                                            </div>
                                        </div>
                                        <div class="session-card__bottom">
                                            <span class="session-card__date">{{ formatDate(session.createdAt) }}</span>
                                            <div class="session-card__progress">
                                                <div class="session-card__progress-bar">
                                                    <div
                                                        class="session-card__progress-fill"
                                                        :style="{ width: getProgress(session).percent + '%' }"
                                                    ></div>
                                                </div>
                                                <span class="session-card__progress-text"
                                                    >{{ getProgress(session).completed }}/{{
                                                        getProgress(session).total
                                                    }}</span
                                                >
                                            </div>
                                        </div>
                                        <div
                                            v-if="session.attempts && session.attempts.length"
                                            class="session-card__result"
                                        >
                                            {{ $t('training.score') }}: {{ getSessionScore(session) }}
                                            {{ $t('ranking.points') }}
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="training-empty">
                                    <p>{{ $t('training.noSessions') }}</p>
                                    <button @click="view = 'create'" class="button btn-primary btn-sm mt-3">
                                        <Plus :size="14" />
                                        {{ $t('training.newSession') }}
                                    </button>
                                </div>
                            </div>

                            <!-- Exercises Tab (legacy) -->
                            <div v-else-if="tab === 'exercises'">
                                <div class="exercise-list-header">
                                    <div class="exercise-list-title">{{ $t('training.exList') }}</div>
                                    <button @click="view = 'add-exercise'" class="button btn-primary btn-sm">
                                        {{ $t('training.addEx') }}
                                    </button>
                                </div>
                                <div v-if="exercisesList && Object.keys(exercisesList).length">
                                    <div v-for="(item, key) in exercisesList" :key="key" class="exercise-item">
                                        <div class="exercise-item__top">
                                            <div>
                                                <div class="exercise-item__name">{{ item.name }}</div>
                                                <div class="exercise-item__meta">
                                                    <span class="exercise-item__badge"
                                                        >{{ item.distances.length }}
                                                        {{ $t('training.distances') }}</span
                                                    >
                                                    <span class="exercise-item__badge"
                                                        >{{ $t('training.serieLength') }}: {{ item.length }}</span
                                                    >
                                                </div>
                                            </div>
                                            <button class="exercise-item__delete" @click.stop="confirmRemoveId = key">
                                                <Trash2 :size="14" />
                                            </button>
                                        </div>
                                        <div class="exercise-item__actions">
                                            <button class="button btn-primary btn-sm" @click="start(key)">
                                                {{ $t('training.startTraining') }}
                                            </button>
                                            <button class="button btn-primary-outline btn-sm" @click="viewResults(key)">
                                                {{ $t('training.viewResults') }}
                                            </button>
                                            <button
                                                class="button btn-primary-outline btn-sm"
                                                @click="editExercise(key, item)"
                                            >
                                                <Pencil :size="14" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="exercise-empty">
                                    <p>{{ $t('training.addExToBegin') }}</p>
                                    <button @click="view = 'add-exercise'" class="button btn-primary btn-sm mt-3">
                                        {{ $t('training.addEx') }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="is-size-3 p-3 has-text-centered">
                    {{ $t('training.asLogin') }}
                    <div class="mt-5">
                        <router-link to="/" class="btn-login-primary btn-login-primary--large">
                            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                            {{ $t('common.loginUser') }}
                        </router-link>
                    </div>
                </div>
            </div>
            <Message v-if="message.show" />
            <ConfirmRemoveModal
                :title="$t('messages.removeExercise')"
                @remove="removeExercise(confirmRemoveId)"
                @close="confirmRemoveId = null"
                v-if="confirmRemoveId"
            />
            <ConfirmRemoveModal
                :title="$t('messages.removeSession')"
                @remove="deleteSession(confirmDeleteId)"
                @close="confirmDeleteId = null"
                v-if="confirmDeleteId"
            />
        </div>
        <Footer />
    </div>
</template>

<script>
import Footer from '@/components/partials/Footer.vue';
import Navbar from '@/components/Navbar.vue';
import Menu from '@/components/Menu.vue';
import { trainingService } from '@/services/db';
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import Message from '@/components/Message.vue';
import TrainingItem from '@/components/training/TrainingItem.vue';
import TrainingResult from '@/components/training/TrainingResult.vue';
import TrainingAdd from '@/components/training/TrainingAdd.vue';
import TrainingCreate from '@/components/training/TrainingCreate.vue';
import TrainingSession from '@/components/training/TrainingSession.vue';
import TrainingStats from '@/components/training/TrainingStats.vue';
import ConfirmRemoveModal from '@/components/ConfirmRemoveModal.vue';
import { Trash2, Plus, BarChart3, Pencil, RotateCcw } from 'lucide-vue-next';
import { TRAINING_STATUS, TRAINING_TYPE, getSessionProgress, createSession } from '@/services/training';
import { SCORING } from '@/services/tir';

export default {
    name: 'Training',
    components: {
        ConfirmRemoveModal,
        TrainingAdd,
        TrainingResult,
        TrainingItem,
        TrainingCreate,
        TrainingSession,
        TrainingStats,
        Message,
        Menu,
        Navbar,
        Footer,
        Trash2,
        Plus,
        BarChart3,
        Pencil,
        RotateCcw,
    },
    data() {
        return {
            view: 'list',
            tab: 'sessions',
            resultsOpen: false,
            menuOpen: false,
            exerciseInProcess: false,
            exercisesList: {},
            exercise: null,
            confirmRemoveId: null,
            confirmDeleteId: null,
            sessionsList: [],
            activeSession: null,
            editExerciseId: null,
            editExerciseData: null,
        };
    },
    mounted() {
        this.loadData();
    },
    computed: {
        ...mapState(useMainStore, ['user', 'message']),
        sortedSessions() {
            return [...this.sessionsList].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
        },
    },
    methods: {
        ...mapActions(useMainStore, ['showMessage']),
        loadData() {
            trainingService.getAll(this.user.uid).then((snapshot) => {
                if (snapshot.exists()) this.exercisesList = snapshot.val();
            });
            trainingService.getSessions(this.user.uid).then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    this.sessionsList = Object.values(data).map((s) => ({
                        ...s,
                        attempts: s.attempts || [],
                    }));
                }
            });
        },
        start(id) {
            this.exerciseInProcess = id;
            this.exercise = this.exercisesList[id];
        },
        viewResults(id) {
            this.resultsOpen = id;
        },
        addExToList(id, ex) {
            this.exercisesList[id] = ex;
            this.editExerciseId = null;
            this.editExerciseData = null;
            this.view = 'list';
        },
        editExercise(key, item) {
            this.editExerciseId = key;
            this.editExerciseData = item;
            this.view = 'edit-exercise';
        },
        cancelEditExercise() {
            this.editExerciseId = null;
            this.editExerciseData = null;
            this.view = 'list';
        },
        removeExercise(id) {
            trainingService.remove(this.user.uid, id).then(() => {
                delete this.exercisesList[id];
                this.confirmRemoveId = null;
                this.showMessage({ title: this.$t('messages.awesome'), text: this.$t('messages.exerciseRemoved') });
            });
        },
        onSessionCreated(session) {
            this.sessionsList.push(session);
            this.activeSession = session;
            this.view = 'session';
            this.saveActiveSession();
        },
        openSession(session) {
            this.activeSession = session;
            this.view = 'session';
        },
        saveActiveSession() {
            if (!this.activeSession) return;
            this.activeSession.updatedAt = Date.now();
            trainingService.saveSession(this.user.uid, this.activeSession.id, this.activeSession);
            const idx = this.sessionsList.findIndex((s) => s.id === this.activeSession.id);
            if (idx !== -1) this.sessionsList[idx] = { ...this.activeSession };
        },
        deleteSession(id) {
            trainingService.removeSession(this.user.uid, id).then(() => {
                this.sessionsList = this.sessionsList.filter((s) => s.id !== id);
                this.confirmDeleteId = null;
                this.showMessage({ title: this.$t('messages.awesome'), text: this.$t('messages.sessionRemoved') });
            });
        },
        rerunSession(session) {
            const newSession = createSession(session.type, session.config, session.name);
            this.sessionsList.push(newSession);
            this.activeSession = newSession;
            this.view = 'session';
            this.saveActiveSession();
        },
        backToList() {
            this.activeSession = null;
            this.view = 'list';
        },
        getProgress(session) {
            return getSessionProgress(session);
        },
        getSessionScore(session) {
            if (!session.attempts || !session.attempts.length) return 0;
            return session.attempts.reduce((sum, a) => sum + (SCORING[a.score] ?? 0), 0);
        },
        getTypeLabel(type) {
            const labels = {
                [TRAINING_TYPE.TIR_FULL]: this.$t('training.presetFull'),
                [TRAINING_TYPE.TIR_SINGLE_EXERCISE]: this.$t('training.presetSingleEx'),
                [TRAINING_TYPE.TIR_SINGLE_DISTANCE]: this.$t('training.presetSingleDist'),
                [TRAINING_TYPE.TIR_CUSTOM]: this.$t('training.presetCustom'),
            };
            return labels[type] || type;
        },
        getStatusLabel(status) {
            const labels = {
                [TRAINING_STATUS.DRAFT]: this.$t('training.statusDraft'),
                [TRAINING_STATUS.IN_PROGRESS]: this.$t('training.statusInProgress'),
                [TRAINING_STATUS.COMPLETED]: this.$t('training.statusCompleted'),
            };
            return labels[status] || status;
        },
        formatDate(ts) {
            if (!ts) return '';
            const d = new Date(ts);
            return d.toLocaleDateString(undefined, {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        },
    },
};
</script>

<style>
.training-content {
    padding: 1rem 0.5rem;
}

.training-tabs {
    display: flex;
    gap: 0;
    margin-bottom: 1rem;
    border-bottom: 2px solid var(--color-border);
}

.training-tab {
    padding: 0.6rem 1rem;
    border: none;
    background: none;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: all 0.15s;
}

.training-tab--active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
}

.training-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.training-list-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text);
}

.training-list-actions {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
}

.training-empty {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-muted);
}

.training-sessions {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
}

.session-card {
    background: var(--color-surface);
    border-radius: 10px;
    border: 1px solid var(--color-border);
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: border-color 0.15s;
}

.session-card:hover {
    border-color: var(--color-primary);
}

.session-card__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
}

.session-card__info {
    flex: 1;
    min-width: 0;
}

.session-card__name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.session-card__meta {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-top: 0.3rem;
}

.session-card__badge {
    font-size: 0.7rem;
    font-weight: 500;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    background: var(--color-primary-bg, rgba(124, 58, 237, 0.1));
    color: var(--color-primary);
}

.session-card__badge--type {
    background: var(--color-primary-bg, rgba(124, 58, 237, 0.1));
    color: var(--color-primary);
}

.session-card__badge--draft {
    background: var(--color-border-light);
    color: var(--color-text-muted);
}

.session-card__badge--in_progress {
    background: rgba(245, 166, 35, 0.15);
    color: var(--tir-touche);
}

.session-card__badge--completed {
    background: rgba(76, 175, 80, 0.15);
    color: var(--tir-carreau);
}

.session-card__actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
}

.session-card__rerun,
.session-card__delete {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 0.3rem;
    border-radius: 6px;
    flex-shrink: 0;
    transition: color 0.15s;
}

.session-card__rerun:hover {
    color: var(--color-primary);
}

.session-card__delete:hover {
    color: var(--color-error);
}

.session-card__bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.5rem;
    gap: 0.5rem;
}

.session-card__date {
    font-size: 0.75rem;
    color: var(--color-text-muted);
}

.session-card__progress {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.session-card__progress-bar {
    width: 60px;
    height: 4px;
    border-radius: 2px;
    background: var(--color-border);
    overflow: hidden;
}

.session-card__progress-fill {
    height: 100%;
    border-radius: 2px;
    background: var(--color-primary);
    transition: width 0.3s;
}

.session-card__progress-text {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    font-weight: 500;
}

.session-card__result {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--tir-carreau);
    margin-top: 0.4rem;
}

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
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
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
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
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
