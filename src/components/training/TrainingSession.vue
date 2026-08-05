<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="tsession">
    <div class="tsession__header">
      <button class="tsession__back" @click="$emit('back')">
        <ChevronLeft :size="18" />
      </button>
      <div class="tsession__info">
        <h3 class="tsession__name">{{ session.name }}</h3>
        <div class="tsession__meta">
          <span class="tsession__badge" :class="'tsession__badge--' + session.status">
            {{ statusLabel }}
          </span>
          <span class="tsession__progress-text">{{ progress.completed }}/{{ progress.total }}</span>
        </div>
      </div>
      <button v-if="!isEditing" class="tsession__edit-btn" @click="isEditing = true">
        <Pencil :size="14" />
      </button>
    </div>

    <!-- Edit mode -->
    <div v-if="isEditing" class="tsession__edit">
      <div class="tsession__field">
        <label class="tsession__label">{{ $t('training.sessionName') }}</label>
        <input v-model="session.name" class="tsession__input" type="text" />
      </div>
      <div class="tsession__field">
        <label class="tsession__label">{{ $t('training.changeDate') }}</label>
        <input :value="dateInputValue" @change="updateDate($event.target.value)" class="tsession__input" type="date" />
      </div>
      <div class="tsession__edit-actions">
        <button class="button btn-primary-outline btn-sm" @click="isEditing = false">
          {{ $t('common.done') }}
        </button>
        <button v-if="session.status === 'completed'" class="button btn-primary btn-sm" @click="reopenSession">
          <RotateCcw :size="14" />
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
        <div class="tsession__progress-bar">
          <div class="tsession__progress-fill" :style="{ width: progress.percent + '%' }"></div>
        </div>
      </div>
    </div>

    <TirScoreLegend />

    <!-- Compact all-on-one-page layout: all ateliers, all distances, <= 3 attempts -->
    <template v-if="isCompactLayout">
      <div v-for="exIdx in session.config.exercises" :key="exIdx" class="tsession__compact-card">
        <div class="tsession__compact-card-header">
          <span class="tir-pview__atelier-card-num">{{ exIdx + 1 }}</span>
          <span class="tir-pview__atelier-card-name">{{ atelierNames[exIdx] }}</span>
          <span class="tir-pview__atelier-card-score">{{ getExerciseScore(exIdx) }}/{{ exerciseMaxScore }}</span>
        </div>
        <div class="tsession__compact-grid">
          <div class="tsession__compact-grid-header">
            <span class="tsession__compact-grid-label"></span>
            <span v-for="distance in session.config.distances" :key="distance" class="tsession__compact-grid-dist"
              >{{ distance }}m</span
            >
          </div>
          <div v-for="opt in resultOptions" :key="opt.key" class="tsession__compact-grid-row">
            <span class="tsession__compact-grid-label" :class="`tsession__score-row-label--${opt.key}`">{{
              opt.key[0].toUpperCase()
            }}</span>
            <span v-for="distance in session.config.distances" :key="distance" class="tsession__compact-grid-cell">
              <TirScoreCircle
                v-for="attemptNum in session.config.attempts"
                :key="attemptNum"
                class="tir-pview__circle tir-pview__circle--sm"
                :class="`tir-pview__circle--${opt.key}`"
                size="small"
                :result="opt.key"
                :active="getAttemptScore(exIdx, distance, attemptNum) === opt.key"
                :interactive="session.status !== 'completed'"
                :aria-label="`${atelierNames[exIdx]}, ${distance}m, ${$t(`tir.${opt.key}`)}, ${attemptNum}`"
                @select="setScore(exIdx, distance, attemptNum, opt.key)"
              />
            </span>
          </div>
        </div>
      </div>
      <div class="tsession__nav">
        <button
          v-if="session.status !== 'completed'"
          class="tir-pview__nav-btn tsession__fill-zeros"
          @click="fillAllZerosAll"
        >
          <CircleOff :size="14" />
          {{ $t('training.fillZeros') }}
        </button>
        <div class="tsession__nav-spacer"></div>
        <button
          v-if="session.status !== 'completed'"
          class="tir-pview__nav-btn tir-pview__nav-btn--primary"
          @click="completeSession"
        >
          <CheckIcon :size="16" />
          {{ $t('training.complete') }}
        </button>
      </div>
    </template>

    <!-- Standard per-exercise layout -->
    <template v-else>
      <!-- Exercise tabs -->
      <div v-if="session.config.exercises.length > 1" class="tir-pview__tabs">
        <button
          v-for="exIdx in session.config.exercises"
          :key="exIdx"
          class="tir-pview__tab"
          :class="{
            'tir-pview__tab--active': activeExercise === exIdx,
            'tir-pview__tab--complete': isExerciseComplete(exIdx),
          }"
          @click="activeExercise = exIdx"
        >
          {{ exIdx + 1 }}
        </button>
      </div>

      <!-- Active exercise scoring -->
      <div class="tir-pview__atelier-card">
        <div class="tir-pview__atelier-card-header">
          <span class="tir-pview__atelier-card-num">{{ activeExercise + 1 }}</span>
          <span class="tir-pview__atelier-card-name">{{ atelierNames[activeExercise] }}</span>
          <span class="tir-pview__atelier-card-score"
            >{{ getExerciseScore(activeExercise) }}/{{ exerciseMaxScore }}</span
          >
        </div>

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
          <div v-for="attemptNum in session.config.attempts" :key="attemptNum" class="tsession__vertical-row">
            <span class="tsession__vertical-num">{{ attemptNum }}</span>
            <TirScoreCircle
              v-for="opt in resultOptions"
              :key="opt.key"
              class="tir-pview__circle"
              :class="`tir-pview__circle--${opt.key}`"
              :result="opt.key"
              :active="getAttemptScore(activeExercise, session.config.distances[0], attemptNum) === opt.key"
              :interactive="session.status !== 'completed'"
              :aria-label="`${atelierNames[activeExercise]}, ${session.config.distances[0]}m, ${$t(`tir.${opt.key}`)}, ${attemptNum}`"
              @select="setScore(activeExercise, session.config.distances[0], attemptNum, opt.key)"
            />
          </div>
        </div>

        <!-- Default grid: rows = score types, columns = attempts -->
        <div v-else v-for="distance in session.config.distances" :key="distance" class="tsession__distance-block">
          <div class="tsession__distance-label">{{ distance }}m</div>
          <div class="tsession__circles-table">
            <div v-for="opt in resultOptions" :key="opt.key" class="tsession__score-row">
              <span class="tsession__score-row-label" :class="`tsession__score-row-label--${opt.key}`">{{
                $t(`tir.${opt.key}`)
              }}</span>
              <div class="tsession__score-row-circles">
                <TirScoreCircle
                  v-for="attemptNum in session.config.attempts"
                  :key="attemptNum"
                  class="tir-pview__circle"
                  :class="`tir-pview__circle--${opt.key}`"
                  :result="opt.key"
                  :active="getAttemptScore(activeExercise, distance, attemptNum) === opt.key"
                  :interactive="session.status !== 'completed'"
                  :aria-label="`${atelierNames[activeExercise]}, ${distance}m, ${$t(`tir.${opt.key}`)}, ${attemptNum}`"
                  @select="setScore(activeExercise, distance, attemptNum, opt.key)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation and actions -->
      <div class="tsession__nav">
        <button
          v-if="session.config.exercises.length > 1 && activeExercise > session.config.exercises[0]"
          class="tir-pview__nav-btn"
          @click="prevExercise"
        >
          <ChevronLeft :size="16" />
          {{ $t('tir.prevAtelier') }}
        </button>
        <button
          v-if="session.status !== 'completed'"
          class="tir-pview__nav-btn tsession__fill-zeros"
          @click="fillAllZeros"
        >
          <CircleOff :size="14" />
          {{ $t('training.fillZeros') }}
        </button>
        <div class="tsession__nav-spacer"></div>
        <button
          v-if="
            session.config.exercises.length > 1 &&
            activeExercise < session.config.exercises[session.config.exercises.length - 1]
          "
          class="tir-pview__nav-btn"
          @click="nextExercise"
        >
          {{ $t('tir.nextAtelier') }}
          <ChevronRight :size="16" />
        </button>
        <button
          v-if="session.status !== 'completed'"
          class="tir-pview__nav-btn tir-pview__nav-btn--primary"
          @click="completeSession"
        >
          <CheckIcon :size="16" />
          {{ $t('training.complete') }}
        </button>
      </div>
    </template>
  </div>
</template>

<script>
/* eslint-disable vue/no-mutating-props */
import { ChevronLeft, ChevronRight, Pencil, Check as CheckIcon, RotateCcw, CircleOff } from 'lucide-vue-next';
import { SCORING, ATELIER_KEYS, RESULT_OPTIONS } from '@/services/tir';
import { TRAINING_STATUS, getSessionProgress } from '@/services/training';
import TirScoreCircle from '@/components/ui/TirScoreCircle.vue';
import TirScoreLegend from '@/components/ui/TirScoreLegend.vue';

export default {
  name: 'TrainingSession',
  components: {
    ChevronLeft,
    ChevronRight,
    Pencil,
    CheckIcon,
    RotateCcw,
    CircleOff,
    TirScoreCircle,
    TirScoreLegend,
  },
  props: {
    session: { type: Object, required: true },
  },
  emits: ['back', 'update'],
  data() {
    return {
      activeExercise: this.session.config.exercises[0],
      isEditing: false,
      resultOptions: RESULT_OPTIONS,
    };
  },
  computed: {
    isCompactLayout() {
      return (
        this.session.config.exercises.length > 1 &&
        this.session.config.distances.length > 1 &&
        this.session.config.attempts <= 3
      );
    },
    isVerticalLayout() {
      return this.session.config.distances.length === 1 && this.session.config.exercises.length === 1;
    },
    atelierNames() {
      return ATELIER_KEYS.map((key) => this.$t(`tir.${key}`));
    },
    progress() {
      return getSessionProgress(this.session);
    },
    totalScore() {
      if (!this.session.attempts || !this.session.attempts.length) return 0;
      return this.session.attempts.reduce((sum, a) => sum + (SCORING[a.score] ?? 0), 0);
    },
    maxScore() {
      return this.progress.total * SCORING.carreau;
    },
    exerciseMaxScore() {
      return this.session.config.distances.length * this.session.config.attempts * SCORING.carreau;
    },
    statusLabel() {
      const labels = {
        [TRAINING_STATUS.DRAFT]: this.$t('training.statusDraft'),
        [TRAINING_STATUS.IN_PROGRESS]: this.$t('training.statusInProgress'),
        [TRAINING_STATUS.COMPLETED]: this.$t('training.statusCompleted'),
      };
      return labels[this.session.status] || this.session.status;
    },
    dateInputValue() {
      const d = new Date(this.session.createdAt);
      return d.toISOString().split('T')[0];
    },
  },
  methods: {
    getAttemptScore(exerciseIndex, distance, attemptNum) {
      const attempt = (this.session.attempts || []).find(
        (a) => a.exerciseIndex === exerciseIndex && a.distance === distance && a.attemptNumber === attemptNum,
      );
      return attempt ? attempt.score : null;
    },
    getExerciseScore(exerciseIndex) {
      return (this.session.attempts || [])
        .filter((a) => a.exerciseIndex === exerciseIndex)
        .reduce((sum, a) => sum + (SCORING[a.score] ?? 0), 0);
    },
    isExerciseComplete(exerciseIndex) {
      const expected = this.session.config.distances.length * this.session.config.attempts;
      const completed = (this.session.attempts || []).filter((a) => a.exerciseIndex === exerciseIndex).length;
      return completed >= expected;
    },
    setScore(exerciseIndex, distance, attemptNum, score) {
      if (this.session.status === 'completed') return;

      if (!this.session.attempts) this.session.attempts = [];

      if (this.session.status === 'draft') {
        this.session.status = TRAINING_STATUS.IN_PROGRESS;
      }

      const existingIdx = this.session.attempts.findIndex(
        (a) => a.exerciseIndex === exerciseIndex && a.distance === distance && a.attemptNumber === attemptNum,
      );

      if (existingIdx !== -1) {
        if (this.session.attempts[existingIdx].score === score) {
          this.session.attempts.splice(existingIdx, 1);
        } else {
          this.session.attempts[existingIdx].score = score;
        }
      } else {
        this.session.attempts.push({ exerciseIndex, distance, attemptNumber: attemptNum, score });
      }

      this.$emit('update');
    },
    completeSession() {
      this.session.status = TRAINING_STATUS.COMPLETED;
      this.session.completedAt = Date.now();
      this.$emit('update');
    },
    reopenSession() {
      this.session.status = TRAINING_STATUS.IN_PROGRESS;
      this.session.completedAt = null;
      this.isEditing = false;
      this.$emit('update');
    },
    updateDate(value) {
      if (value) {
        this.session.createdAt = new Date(value).getTime();
        this.$emit('update');
      }
    },
    fillAllZeros() {
      if (!this.session.attempts) this.session.attempts = [];
      if (this.session.status === 'draft') {
        this.session.status = TRAINING_STATUS.IN_PROGRESS;
      }
      for (const distance of this.session.config.distances) {
        for (let attemptNum = 1; attemptNum <= this.session.config.attempts; attemptNum++) {
          const existing = this.session.attempts.find(
            (a) => a.exerciseIndex === this.activeExercise && a.distance === distance && a.attemptNumber === attemptNum,
          );
          if (!existing) {
            this.session.attempts.push({
              exerciseIndex: this.activeExercise,
              distance,
              attemptNumber: attemptNum,
              score: 'manque',
            });
          }
        }
      }
      this.$emit('update');
    },
    fillAllZerosAll() {
      if (!this.session.attempts) this.session.attempts = [];
      if (this.session.status === 'draft') {
        this.session.status = TRAINING_STATUS.IN_PROGRESS;
      }
      for (const exIdx of this.session.config.exercises) {
        for (const distance of this.session.config.distances) {
          for (let attemptNum = 1; attemptNum <= this.session.config.attempts; attemptNum++) {
            const existing = this.session.attempts.find(
              (a) => a.exerciseIndex === exIdx && a.distance === distance && a.attemptNumber === attemptNum,
            );
            if (!existing) {
              this.session.attempts.push({
                exerciseIndex: exIdx,
                distance,
                attemptNumber: attemptNum,
                score: 'manque',
              });
            }
          }
        }
      }
      this.$emit('update');
    },
    prevExercise() {
      const idx = this.session.config.exercises.indexOf(this.activeExercise);
      if (idx > 0) this.activeExercise = this.session.config.exercises[idx - 1];
    },
    nextExercise() {
      const idx = this.session.config.exercises.indexOf(this.activeExercise);
      if (idx < this.session.config.exercises.length - 1) this.activeExercise = this.session.config.exercises[idx + 1];
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
  color: var(--color-text-muted);
}

.tsession__badge--in_progress {
  background: rgb(245 166 35 / 15%);
  color: var(--tir-touche);
}

.tsession__badge--completed {
  background: rgb(76 175 80 / 15%);
  color: var(--tir-carreau);
}

.tsession__progress-text {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.tsession__edit-btn {
  padding: 6px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text-muted);
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
  color: var(--color-text-muted);
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

.tsession__input:focus {
  outline: none;
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
  color: var(--tir-carreau);
}

.tsession__score-max {
  font-size: 0.85rem;
  color: var(--color-text-muted);
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

.tir-pview__tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.tir-pview__tab {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  background: var(--color-surface);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  color: var(--color-text);
  transition: all 0.2s;
}

.tir-pview__tab--active {
  background: var(--tir-touche);
  border-color: var(--tir-touche);
  color: var(--color-btn-text);
}

.tir-pview__tab--complete:not(.tir-pview__tab--active) {
  border-color: var(--tir-carreau);
  color: var(--tir-carreau);
}

.tir-pview__atelier-card {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
  background: var(--color-surface);
}

.tir-pview__atelier-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.tir-pview__atelier-card-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--tir-touche);
  color: var(--color-btn-text);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tir-pview__atelier-card-name {
  font-weight: 700;
  font-size: 14px;
  flex: 1;
}

.tir-pview__atelier-card-score {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
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
}

.tsession__score-row-label--carreau {
  color: var(--tir-carreau);
}

.tsession__score-row-label--reussi {
  color: var(--tir-reussi);
}

.tsession__score-row-label--touche {
  color: var(--tir-touche);
}

.tsession__score-row-label--manque {
  color: var(--tir-manque);
}

.tsession__score-row-circles {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tir-pview__nav-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.tir-pview__nav-btn:hover {
  border-color: var(--color-primary);
}

.tir-pview__nav-btn--primary {
  background: var(--tir-carreau);
  border-color: var(--tir-carreau);
  color: var(--color-btn-text);
}

.tsession__fill-zeros {
  font-size: 12px;
  padding: 6px 10px;
  color: var(--tir-manque);
  border-color: var(--tir-manque);
}

.tsession__fill-zeros:hover {
  background: var(--tir-manque);
  color: var(--color-btn-text);
  border-color: var(--tir-manque);
}

/* Compact all-on-one-page layout */

.tsession__compact-card {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
  background: var(--color-surface);
}

.tsession__compact-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

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
  color: var(--color-text-muted);
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
  color: var(--color-text-muted);
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
  color: var(--color-text-muted);
}
</style>
