<template>
  <div class="tsession">
    <div class="tsession__header">
      <button type="button" class="tsession__back" :aria-label="$t('tir.back')" @click="$emit('back')">
        <ChevronLeft :size="18" aria-hidden="true" />
      </button>
      <div class="tsession__info">
        <h3 class="tsession__name">{{ localSession.name }}</h3>
        <div class="tsession__meta">
          <span class="tsession__badge" :class="'tsession__badge--' + localSession.status">
            {{ statusLabel }}
          </span>
          <span class="tsession__progress-text">{{ progress.completed }}/{{ progress.total }}</span>
        </div>
      </div>
      <button
        v-if="!isEditing"
        type="button"
        class="tsession__edit-btn"
        :aria-label="$t('tir.editTrainingSession')"
        @click="isEditing = true"
      >
        <Pencil :size="14" aria-hidden="true" />
      </button>
    </div>

    <!-- Edit mode -->
    <div v-if="isEditing" class="tsession__edit">
      <div class="tsession__field">
        <label class="tsession__label" for="training-session-name">{{ $t('training.sessionName') }}</label>
        <input id="training-session-name" v-model="localSession.name" class="tsession__input" type="text" />
      </div>
      <div class="tsession__field">
        <label class="tsession__label" for="training-session-date">{{ $t('training.changeDate') }}</label>
        <input
          id="training-session-date"
          :value="dateInputValue"
          @change="updateDate($event.target.value)"
          class="tsession__input"
          type="date"
        />
      </div>
      <div class="tsession__edit-actions">
        <button type="button" class="button btn-primary-outline btn-sm" @click="finishEditing">
          {{ $t('common.done') }}
        </button>
        <button
          v-if="localSession.status === 'completed'"
          type="button"
          class="button btn-primary btn-sm"
          @click="reopenSession"
        >
          <RotateCcw :size="14" aria-hidden="true" />
          {{ $t('training.reopen') }}
        </button>
      </div>
    </div>

    <!-- Score summary bar -->
    <div class="tsession__score-bar">
      <div class="tsession__score-total">
        <span class="tsession__score-val">{{ totalScore }}</span>
        <span class="tsession__score-max">/ {{ maxScore }} {{ $t('ranking.points') }}</span>
      </div>
      <div class="tsession__progress-bar-wrap">
        <div
          class="tsession__progress-bar"
          role="progressbar"
          :aria-label="$t('tir.progress')"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="progress.percent"
        >
          <div class="tsession__progress-fill" :style="{ width: progress.percent + '%' }"></div>
        </div>
      </div>
    </div>

    <TirScoreLegend />

    <!-- Compact all-on-one-page layout: all ateliers, all distances, <= 3 attempts -->
    <template v-if="isCompactLayout">
      <TirScoringCard
        v-for="exIdx in localSession.config.exercises"
        :key="exIdx"
        compact
        :number="exIdx + 1"
        :name="atelierNames[exIdx]"
        :score="getExerciseScore(exIdx)"
        :max-score="exerciseMaxScore"
      >
        <div class="tsession__compact-grid">
          <div class="tsession__compact-grid-header">
            <span class="tsession__compact-grid-label"></span>
            <span v-for="distance in localSession.config.distances" :key="distance" class="tsession__compact-grid-dist"
              >{{ distance }}m</span
            >
          </div>
          <div v-for="opt in resultOptions" :key="opt.key" class="tsession__compact-grid-row">
            <span class="tsession__compact-grid-label" :class="`tsession__score-row-label--${opt.key}`">{{
              opt.key[0].toUpperCase()
            }}</span>
            <span v-for="distance in localSession.config.distances" :key="distance" class="tsession__compact-grid-cell">
              <TirScoreCircle
                v-for="attemptNum in localSession.config.attempts"
                :key="attemptNum"
                size="small"
                :result="opt.key"
                :active="getAttemptScore(exIdx, distance, attemptNum) === opt.key"
                :interactive="localSession.status !== 'completed'"
                :aria-label="`${atelierNames[exIdx]}, ${distance}m, ${$t(`tir.${opt.key}`)}, ${attemptNum}`"
                @select="setScore(exIdx, distance, attemptNum, opt.key)"
              />
            </span>
          </div>
        </div>
      </TirScoringCard>
      <div class="tsession__nav">
        <TirScoringAction v-if="localSession.status !== 'completed'" compact variant="danger" @click="fillAllZerosAll">
          <CircleOff :size="14" aria-hidden="true" />
          {{ $t('training.fillZeros') }}
        </TirScoringAction>
        <div class="tsession__nav-spacer"></div>
        <TirScoringAction v-if="localSession.status !== 'completed'" variant="success" @click="completeSession">
          <CheckIcon :size="16" aria-hidden="true" />
          {{ $t('training.complete') }}
        </TirScoringAction>
      </div>
    </template>

    <!-- Standard per-exercise layout -->
    <template v-else>
      <!-- Exercise tabs -->
      <TirAtelierTabs
        v-if="localSession.config.exercises.length > 1"
        v-model="activeExercise"
        :items="exerciseTabs"
        :label="$t('tir.atelier')"
        :complete-label="$t('training.statusCompleted')"
        id-prefix="training-atelier"
      />

      <!-- Active exercise scoring -->
      <TirScoringCard
        :number="activeExercise + 1"
        :name="atelierNames[activeExercise]"
        :score="getExerciseScore(activeExercise)"
        :max-score="exerciseMaxScore"
      >
        <!-- Vertical layout: 1 distance + 1 exercise -->
        <div v-if="isVerticalLayout" class="tsession__vertical">
          <div class="tsession__vertical-header">
            <span class="tsession__vertical-num-header">#</span>
            <span
              v-for="opt in resultOptions"
              :key="opt.key"
              class="tsession__vertical-col-header"
              :class="`tsession__score-row-label--${opt.key}`"
              >{{ opt.key[0].toUpperCase() }}</span
            >
          </div>
          <div v-for="attemptNum in localSession.config.attempts" :key="attemptNum" class="tsession__vertical-row">
            <span class="tsession__vertical-num">{{ attemptNum }}</span>
            <TirScoreCircle
              v-for="opt in resultOptions"
              :key="opt.key"
              :result="opt.key"
              :active="getAttemptScore(activeExercise, localSession.config.distances[0], attemptNum) === opt.key"
              :interactive="localSession.status !== 'completed'"
              :aria-label="`${atelierNames[activeExercise]}, ${localSession.config.distances[0]}m, ${$t(`tir.${opt.key}`)}, ${attemptNum}`"
              @select="setScore(activeExercise, localSession.config.distances[0], attemptNum, opt.key)"
            />
          </div>
        </div>

        <!-- Default grid: rows = score types, columns = attempts -->
        <div v-else v-for="distance in localSession.config.distances" :key="distance" class="tsession__distance-block">
          <div class="tsession__distance-label">{{ distance }}m</div>
          <div class="tsession__circles-table">
            <div v-for="opt in resultOptions" :key="opt.key" class="tsession__score-row">
              <span class="tsession__score-row-label" :class="`tsession__score-row-label--${opt.key}`">{{
                $t(`tir.${opt.key}`)
              }}</span>
              <div class="tsession__score-row-circles">
                <TirScoreCircle
                  v-for="attemptNum in localSession.config.attempts"
                  :key="attemptNum"
                  :result="opt.key"
                  :active="getAttemptScore(activeExercise, distance, attemptNum) === opt.key"
                  :interactive="localSession.status !== 'completed'"
                  :aria-label="`${atelierNames[activeExercise]}, ${distance}m, ${$t(`tir.${opt.key}`)}, ${attemptNum}`"
                  @select="setScore(activeExercise, distance, attemptNum, opt.key)"
                />
              </div>
            </div>
          </div>
        </div>
      </TirScoringCard>

      <!-- Navigation and actions -->
      <div class="tsession__nav">
        <TirScoringAction
          v-if="localSession.config.exercises.length > 1 && activeExercise > localSession.config.exercises[0]"
          @click="prevExercise"
        >
          <ChevronLeft :size="16" aria-hidden="true" />
          {{ $t('tir.prevAtelier') }}
        </TirScoringAction>
        <TirScoringAction v-if="localSession.status !== 'completed'" compact variant="danger" @click="fillAllZeros">
          <CircleOff :size="14" aria-hidden="true" />
          {{ $t('training.fillZeros') }}
        </TirScoringAction>
        <div class="tsession__nav-spacer"></div>
        <TirScoringAction
          v-if="
            localSession.config.exercises.length > 1 &&
            activeExercise < localSession.config.exercises[localSession.config.exercises.length - 1]
          "
          @click="nextExercise"
        >
          {{ $t('tir.nextAtelier') }}
          <ChevronRight :size="16" aria-hidden="true" />
        </TirScoringAction>
        <TirScoringAction v-if="localSession.status !== 'completed'" variant="success" @click="completeSession">
          <CheckIcon :size="16" aria-hidden="true" />
          {{ $t('training.complete') }}
        </TirScoringAction>
      </div>
    </template>
  </div>
</template>

<script>
import { ChevronLeft, ChevronRight, Pencil, Check as CheckIcon, RotateCcw, CircleOff } from 'lucide-vue-next';
import { SCORING, ATELIER_KEYS, RESULT_OPTIONS } from '@/services/tir';
import { TRAINING_STATUS, getSessionProgress } from '@/services/training';
import TirAtelierTabs from '@/components/ui/TirAtelierTabs.vue';
import TirScoreCircle from '@/components/ui/TirScoreCircle.vue';
import TirScoreLegend from '@/components/ui/TirScoreLegend.vue';
import TirScoringAction from '@/components/ui/TirScoringAction.vue';
import TirScoringCard from '@/components/ui/TirScoringCard.vue';

function cloneSession(session) {
  return {
    ...session,
    config: {
      ...session.config,
      exercises: [...(session.config?.exercises || [])],
      distances: [...(session.config?.distances || [])],
    },
    attempts: (session.attempts || []).map((attempt) => ({ ...attempt })),
  };
}

export default {
  name: 'TrainingSession',
  components: {
    ChevronLeft,
    ChevronRight,
    Pencil,
    CheckIcon,
    RotateCcw,
    CircleOff,
    TirAtelierTabs,
    TirScoreCircle,
    TirScoreLegend,
    TirScoringAction,
    TirScoringCard,
  },
  props: {
    session: { type: Object, required: true },
  },
  emits: {
    back: () => true,
    update: (session) => Boolean(session && typeof session === 'object'),
  },
  data() {
    const localSession = cloneSession(this.session);
    return {
      localSession,
      activeExercise: localSession.config.exercises[0],
      isEditing: false,
      resultOptions: RESULT_OPTIONS,
    };
  },
  watch: {
    session(value) {
      const localSession = cloneSession(value);
      this.localSession = localSession;
      if (!localSession.config.exercises.includes(this.activeExercise)) {
        this.activeExercise = localSession.config.exercises[0];
      }
    },
  },
  computed: {
    isCompactLayout() {
      return (
        this.localSession.config.exercises.length > 1 &&
        this.localSession.config.distances.length > 1 &&
        this.localSession.config.attempts <= 3
      );
    },
    isVerticalLayout() {
      return this.localSession.config.distances.length === 1 && this.localSession.config.exercises.length === 1;
    },
    atelierNames() {
      return ATELIER_KEYS.map((key) => this.$t(`tir.${key}`));
    },
    exerciseTabs() {
      return this.localSession.config.exercises.map((exercise) => ({
        id: exercise,
        label: exercise + 1,
        complete: this.isExerciseComplete(exercise),
      }));
    },
    progress() {
      return getSessionProgress(this.localSession);
    },
    totalScore() {
      if (!this.localSession.attempts.length) return 0;
      return this.localSession.attempts.reduce((sum, a) => sum + (SCORING[a.score] ?? 0), 0);
    },
    maxScore() {
      return this.progress.total * SCORING.carreau;
    },
    exerciseMaxScore() {
      return this.localSession.config.distances.length * this.localSession.config.attempts * SCORING.carreau;
    },
    statusLabel() {
      const labels = {
        [TRAINING_STATUS.DRAFT]: this.$t('training.statusDraft'),
        [TRAINING_STATUS.IN_PROGRESS]: this.$t('training.statusInProgress'),
        [TRAINING_STATUS.COMPLETED]: this.$t('training.statusCompleted'),
      };
      return labels[this.localSession.status] || this.localSession.status;
    },
    dateInputValue() {
      const d = new Date(this.localSession.createdAt);
      return d.toISOString().split('T')[0];
    },
  },
  methods: {
    getAttemptScore(exerciseIndex, distance, attemptNum) {
      const attempt = this.localSession.attempts.find(
        (a) => a.exerciseIndex === exerciseIndex && a.distance === distance && a.attemptNumber === attemptNum,
      );
      return attempt ? attempt.score : null;
    },
    getExerciseScore(exerciseIndex) {
      return this.localSession.attempts
        .filter((a) => a.exerciseIndex === exerciseIndex)
        .reduce((sum, a) => sum + (SCORING[a.score] ?? 0), 0);
    },
    isExerciseComplete(exerciseIndex) {
      const expected = this.localSession.config.distances.length * this.localSession.config.attempts;
      const completed = this.localSession.attempts.filter((a) => a.exerciseIndex === exerciseIndex).length;
      return completed >= expected;
    },
    setScore(exerciseIndex, distance, attemptNum, score) {
      if (this.localSession.status === 'completed') return;

      if (this.localSession.status === 'draft') {
        this.localSession.status = TRAINING_STATUS.IN_PROGRESS;
      }

      const existingIdx = this.localSession.attempts.findIndex(
        (a) => a.exerciseIndex === exerciseIndex && a.distance === distance && a.attemptNumber === attemptNum,
      );

      if (existingIdx !== -1) {
        if (this.localSession.attempts[existingIdx].score === score) {
          this.localSession.attempts.splice(existingIdx, 1);
        } else {
          this.localSession.attempts[existingIdx].score = score;
        }
      } else {
        this.localSession.attempts.push({ exerciseIndex, distance, attemptNumber: attemptNum, score });
      }

      this.emitUpdate();
    },
    completeSession() {
      this.localSession.status = TRAINING_STATUS.COMPLETED;
      this.localSession.completedAt = Date.now();
      this.emitUpdate();
    },
    reopenSession() {
      this.localSession.status = TRAINING_STATUS.IN_PROGRESS;
      this.localSession.completedAt = null;
      this.isEditing = false;
      this.emitUpdate();
    },
    updateDate(value) {
      if (value) {
        this.localSession.createdAt = new Date(value).getTime();
        this.emitUpdate();
      }
    },
    fillAllZeros() {
      if (this.localSession.status === 'draft') {
        this.localSession.status = TRAINING_STATUS.IN_PROGRESS;
      }
      for (const distance of this.localSession.config.distances) {
        for (let attemptNum = 1; attemptNum <= this.localSession.config.attempts; attemptNum++) {
          const existing = this.localSession.attempts.find(
            (a) => a.exerciseIndex === this.activeExercise && a.distance === distance && a.attemptNumber === attemptNum,
          );
          if (!existing) {
            this.localSession.attempts.push({
              exerciseIndex: this.activeExercise,
              distance,
              attemptNumber: attemptNum,
              score: 'manque',
            });
          }
        }
      }
      this.emitUpdate();
    },
    fillAllZerosAll() {
      if (this.localSession.status === 'draft') {
        this.localSession.status = TRAINING_STATUS.IN_PROGRESS;
      }
      for (const exIdx of this.localSession.config.exercises) {
        for (const distance of this.localSession.config.distances) {
          for (let attemptNum = 1; attemptNum <= this.localSession.config.attempts; attemptNum++) {
            const existing = this.localSession.attempts.find(
              (a) => a.exerciseIndex === exIdx && a.distance === distance && a.attemptNumber === attemptNum,
            );
            if (!existing) {
              this.localSession.attempts.push({
                exerciseIndex: exIdx,
                distance,
                attemptNumber: attemptNum,
                score: 'manque',
              });
            }
          }
        }
      }
      this.emitUpdate();
    },
    prevExercise() {
      const idx = this.localSession.config.exercises.indexOf(this.activeExercise);
      if (idx > 0) this.activeExercise = this.localSession.config.exercises[idx - 1];
    },
    nextExercise() {
      const idx = this.localSession.config.exercises.indexOf(this.activeExercise);
      if (idx < this.localSession.config.exercises.length - 1) {
        this.activeExercise = this.localSession.config.exercises[idx + 1];
      }
    },
    finishEditing() {
      this.isEditing = false;
      this.emitUpdate();
    },
    emitUpdate() {
      this.$emit('update', cloneSession(this.localSession));
    },
  },
};
</script>

<style scoped>
.tsession__header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 16px;
}

.tsession__back {
  padding: 6px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text);
}

.tsession__back:focus-visible,
.tsession__edit-btn:focus-visible,
.tsession__input:focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}

.tsession__info {
  flex: 1;
}

.tsession__name {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-text);
}

.tsession__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 4px;
}

.tsession__badge {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
}

.tsession__badge--draft {
  background: var(--color-border-light);
  color: var(--color-text-secondary);
}

.tsession__badge--in_progress {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.tsession__badge--completed {
  background: var(--tir-winner-bg);
  color: var(--tir-winner-text);
}

.tsession__progress-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.tsession__edit-btn {
  padding: 6px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.tsession__edit-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.tsession__edit {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.tsession__field {
  margin-bottom: 0.75rem;
}

.tsession__label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 0.3rem;
}

.tsession__input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--color-surface);
  color: var(--color-text);
}

.tsession__input:focus-visible {
  border-color: var(--color-primary);
}

.tsession__edit-actions {
  display: flex;
  gap: 0.5rem;
}

.tsession__score-bar {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  margin-bottom: 12px;
}

.tsession__score-total {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
}

.tsession__score-val {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.tsession__score-max {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.tsession__progress-bar-wrap {
  width: 100%;
}

.tsession__progress-bar {
  height: 4px;
  border-radius: 2px;
  background: var(--color-border);
  overflow: hidden;
}

.tsession__progress-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--color-primary);
  transition: width 0.3s;
}

.tsession__nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tsession__nav-spacer {
  flex: 1;
}

.tsession__distance-block {
  margin-bottom: 16px;
}

.tsession__distance-block:last-child {
  margin-bottom: 0;
}

.tsession__distance-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 6px;
}

.tsession__circles-table {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tsession__score-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tsession__score-row-label {
  font-size: 11px;
  font-weight: 600;
  min-width: 56px;
  flex-shrink: 0;
  padding-left: 3px;
  color: var(--color-text);
  border-left: 4px solid var(--tir-label-color);
}

.tsession__score-row-label--carreau {
  --tir-label-color: var(--tir-carreau);
}

.tsession__score-row-label--reussi {
  --tir-label-color: var(--tir-reussi);
}

.tsession__score-row-label--touche {
  --tir-label-color: var(--tir-touche);
}

.tsession__score-row-label--manque {
  --tir-label-color: var(--tir-manque);
}

.tsession__score-row-circles {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* Compact all-on-one-page layout */

.tsession__compact-grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.tsession__compact-grid-header {
  display: flex;
  align-items: center;
  gap: 2px;
  padding-bottom: 2px;
}

.tsession__compact-grid-dist {
  flex: 1;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.tsession__compact-grid-row {
  display: flex;
  align-items: center;
  gap: 2px;
}

.tsession__compact-grid-label {
  width: 20px;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.tsession__compact-grid-cell {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 2px;
}

/* Vertical layout for single distance + single exercise */

.tsession__vertical {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tsession__vertical-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 2px;
}

.tsession__vertical-num-header {
  width: 28px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.tsession__vertical-col-header {
  width: 28px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
}

.tsession__vertical-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tsession__vertical-num {
  width: 28px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

@media (prefers-reduced-motion: reduce) {
  .tsession__progress-fill {
    transition: none;
  }
}
</style>
