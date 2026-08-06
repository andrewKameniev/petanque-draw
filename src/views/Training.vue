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
              <button type="button" class="button btn-primary-outline btn-sm mb-3" @click="cancelEditExercise">
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
                  type="button"
                  class="training-tab"
                  :class="{ 'training-tab--active': tab === 'sessions' }"
                  @click="tab = 'sessions'"
                >
                  {{ $t('training.tirSessions') }}
                </button>
                <button
                  type="button"
                  class="training-tab"
                  :class="{ 'training-tab--active': tab === 'exercises' }"
                  @click="tab = 'exercises'"
                >
                  {{ $t('training.exercises') }}
                </button>
              </div>

              <!-- Loading skeleton -->
              <div v-if="loading" class="training-skeleton">
                <div class="training-skeleton__row training-skeleton__row--short"></div>
                <div class="training-skeleton__card">
                  <div class="training-skeleton__line training-skeleton__line--title"></div>
                  <div class="training-skeleton__line training-skeleton__line--meta"></div>
                  <div class="training-skeleton__line training-skeleton__line--bar"></div>
                </div>
                <div class="training-skeleton__card">
                  <div class="training-skeleton__line training-skeleton__line--title"></div>
                  <div class="training-skeleton__line training-skeleton__line--meta"></div>
                  <div class="training-skeleton__line training-skeleton__line--bar"></div>
                </div>
                <div class="training-skeleton__card">
                  <div class="training-skeleton__line training-skeleton__line--title"></div>
                  <div class="training-skeleton__line training-skeleton__line--meta"></div>
                  <div class="training-skeleton__line training-skeleton__line--bar"></div>
                </div>
              </div>

              <!-- Tir Sessions Tab -->
              <div v-else-if="tab === 'sessions'">
                <div class="training-list-header">
                  <div v-if="sessionsList.length" class="training-list-actions">
                    <button type="button" class="button btn-primary-outline btn-sm" @click="view = 'stats'">
                      <BarChart3 :size="14" aria-hidden="true" />
                      {{ $t('training.statistics') }}
                    </button>
                    <button type="button" class="button btn-primary btn-sm" @click="view = 'create'">
                      <Plus :size="14" aria-hidden="true" />
                      {{ $t('training.newSession') }}
                    </button>
                  </div>
                </div>

                <div v-if="sessionsList.length" class="training-sessions">
                  <div v-for="session in sortedSessions" :key="session.id" class="session-card">
                    <button
                      type="button"
                      class="session-card__open"
                      :aria-label="`${session.name}: ${getStatusLabel(session.status)}`"
                      @click="openSession(session)"
                    ></button>
                    <div class="session-card__top">
                      <div class="session-card__info">
                        <div class="session-card__name">{{ session.name }}</div>
                        <div class="session-card__meta">
                          <span class="session-card__badge session-card__badge--type">{{
                            getTypeLabel(session.type)
                          }}</span>
                          <span class="session-card__badge" :class="'session-card__badge--' + session.status">
                            {{ getStatusLabel(session.status) }}
                          </span>
                        </div>
                      </div>
                      <div class="session-card__actions">
                        <button
                          v-if="session.status === 'completed'"
                          type="button"
                          class="session-card__rerun"
                          :aria-label="$t('training.rerun')"
                          :title="$t('training.rerun')"
                          @click.stop="rerunSession(session)"
                        >
                          <RotateCcw :size="14" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          class="session-card__delete"
                          :aria-label="$t('messages.removeSession')"
                          :title="$t('messages.removeSession')"
                          @click.stop="confirmDeleteId = session.id"
                        >
                          <Trash2 :size="14" aria-hidden="true" />
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
                          >{{ getProgress(session).completed }}/{{ getProgress(session).total }}</span
                        >
                      </div>
                    </div>
                    <div v-if="session.attempts && session.attempts.length" class="session-card__result">
                      {{ $t('training.score') }}: {{ getSessionScore(session) }}
                      {{ $t('ranking.points') }}
                    </div>
                  </div>
                </div>
                <div v-else class="training-empty">
                  <p>{{ $t('training.noSessions') }}</p>
                  <button type="button" class="button btn-primary btn-sm mt-3" @click="view = 'create'">
                    <Plus :size="14" aria-hidden="true" />
                    {{ $t('training.newSession') }}
                  </button>
                </div>
              </div>

              <!-- Exercises Tab (legacy) -->
              <div v-else-if="tab === 'exercises'">
                <div class="exercise-list-header">
                  <div class="exercise-list-title">{{ $t('training.exList') }}</div>
                  <button type="button" class="button btn-primary btn-sm" @click="view = 'add-exercise'">
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
                            >{{ item.distances.length }} {{ $t('training.distances') }}</span
                          >
                          <span class="exercise-item__badge">{{ $t('training.serieLength') }}: {{ item.length }}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        class="exercise-item__delete"
                        :aria-label="$t('messages.removeExercise')"
                        :title="$t('messages.removeExercise')"
                        @click.stop="confirmRemoveId = key"
                      >
                        <Trash2 :size="14" aria-hidden="true" />
                      </button>
                    </div>
                    <div class="exercise-item__actions">
                      <button type="button" class="button btn-primary btn-sm" @click="start(key)">
                        {{ $t('training.startTraining') }}
                      </button>
                      <button type="button" class="button btn-primary-outline btn-sm" @click="viewResults(key)">
                        {{ $t('training.viewResults') }}
                      </button>
                      <button
                        type="button"
                        class="button btn-primary-outline btn-sm"
                        :aria-label="$t('common.edit')"
                        :title="$t('common.edit')"
                        @click="editExercise(key, item)"
                      >
                        <Pencil :size="14" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else class="exercise-empty">
                  <p>{{ $t('training.addExToBegin') }}</p>
                  <button type="button" class="button btn-primary btn-sm mt-3" @click="view = 'add-exercise'">
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
      loading: true,
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
      this.loading = true;
      Promise.all([
        trainingService.getAll(this.user.uid).then((snapshot) => {
          if (snapshot.exists()) this.exercisesList = snapshot.val();
        }),
        trainingService.getSessions(this.user.uid).then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            this.sessionsList = Object.values(data).map((s) => ({
              ...s,
              attempts: s.attempts || [],
            }));
          }
        }),
      ]).finally(() => {
        this.loading = false;
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
    saveActiveSession(updatedSession = this.activeSession) {
      if (!updatedSession) return;
      this.activeSession = { ...updatedSession, updatedAt: Date.now() };
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
  padding: 1rem;
}

/* Loading skeleton */

.training-skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.training-skeleton__row--short {
  width: 40%;
  height: 32px;
  border-radius: 8px;
  background: var(--color-border-light);
  animation: skeleton-pulse 1.2s ease-in-out infinite;
}

.training-skeleton__card {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.training-skeleton__line {
  border-radius: 6px;
  background: var(--color-border-light);
  animation: skeleton-pulse 1.2s ease-in-out infinite;
}

.training-skeleton__line--title {
  width: 60%;
  height: 16px;
}

.training-skeleton__line--meta {
  width: 40%;
  height: 12px;
  animation-delay: 0.15s;
}

.training-skeleton__line--bar {
  width: 100%;
  height: 6px;
  animation-delay: 0.3s;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 0.4;
  }

  50% {
    opacity: 1;
  }
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
  position: relative;
  background: var(--color-surface);
  border-radius: 10px;
  border: 1px solid var(--color-border);
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: border-color 0.15s;
}

.session-card__open {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  padding: 0;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: inherit;
}

.session-card__open:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
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
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.session-card__badge--type {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.session-card__badge--draft {
  background: var(--color-border-light);
  color: var(--color-text-muted);
}

.session-card__badge--in_progress {
  background: var(--color-warning-bg);
  color: var(--tir-touche);
}

.session-card__badge--completed {
  background: var(--tir-winner-bg);
  color: var(--tir-carreau);
}

.session-card__actions {
  position: relative;
  z-index: 2;
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
  font-size: 0.85rem;
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
  font-size: 0.9rem;
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
  background: var(--color-primary-bg);
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
