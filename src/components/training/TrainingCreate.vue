<template>
  <div class="tcreate">
    <div class="tcreate__nav">
      <button class="tcreate__back" @click="$emit('back')">
        <ChevronLeft :size="18" />
        {{ $t('stat.back') }}
      </button>
    </div>

    <!-- Step 1: Choose preset -->
    <div v-if="step === 1" class="tcreate__step">
      <h3 class="tcreate__title">{{ $t('training.selectPreset') }}</h3>
      <div class="tcreate__presets">
        <div
          v-for="preset in presets"
          :key="preset.type"
          class="tcreate__preset"
          :class="{ 'tcreate__preset--active': selectedType === preset.type }"
          @click="selectPreset(preset.type)"
        >
          <div class="tcreate__preset-name">{{ preset.name }}</div>
          <div class="tcreate__preset-desc">{{ preset.description }}</div>
        </div>
      </div>
    </div>

    <!-- Step 2: Configure -->
    <div v-else-if="step === 2" class="tcreate__step">
      <h3 class="tcreate__title">{{ $t('training.configure') }}</h3>

      <div class="tcreate__field">
        <label class="tcreate__label">{{ $t('training.sessionName') }}</label>
        <input
          v-model="config.name"
          class="tcreate__input"
          type="text"
          :placeholder="$t('training.sessionNamePlaceholder')"
        />
      </div>

      <div class="tcreate__field">
        <label class="tcreate__label">{{ $t('training.selectExercises') }}</label>
        <div class="tcreate__checks">
          <label v-for="(ex, idx) in atelierNames" :key="idx" class="tcreate__check">
            <input type="checkbox" :value="idx" v-model="config.exercises" :disabled="selectedType === 'tir_full'" />
            <span>{{ idx + 1 }}. {{ ex }}</span>
          </label>
        </div>
      </div>

      <div class="tcreate__field">
        <label class="tcreate__label">{{ $t('training.selectDistances') }}</label>
        <div class="tcreate__checks">
          <label v-for="d in availableDistances" :key="d" class="tcreate__check">
            <input type="checkbox" :value="d" v-model="config.distances" :disabled="selectedType === 'tir_full'" />
            <span>{{ d }}m</span>
          </label>
        </div>
      </div>

      <div class="tcreate__field">
        <label class="tcreate__label">{{ $t('training.attemptsPerDistance') }}</label>
        <div class="select">
          <select v-model.number="config.attempts">
            <option v-for="n in 50" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
      </div>

      <div class="tcreate__summary">
        <div class="tcreate__summary-title">{{ $t('training.summary') }}</div>
        <div class="tcreate__summary-row">
          <span>{{ $t('training.totalAttempts') }}:</span>
          <strong>{{ totalAttempts }}</strong>
        </div>
        <div class="tcreate__summary-row">
          <span>{{ $t('training.maxScore') }}:</span>
          <strong>{{ maxScore }} {{ $t('ranking.points') }}</strong>
        </div>
      </div>

      <div class="tcreate__actions">
        <button class="button btn-primary-outline btn-sm" @click="step = 1">{{ $t('stat.back') }}</button>
        <button class="button btn-primary btn-sm" @click="createSession" :disabled="!isValid">
          {{ $t('training.startSession') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ChevronLeft } from 'lucide-vue-next';
import { TRAINING_TYPE, PRESET_CONFIGS, createSession } from '@/services/training';
import { ATELIER_KEYS, DISTANCES_FULL, SCORING } from '@/services/tir';

export default {
  name: 'TrainingCreate',
  components: { ChevronLeft },
  emits: ['back', 'created'],
  data() {
    return {
      step: 1,
      selectedType: null,
      availableDistances: [...DISTANCES_FULL],
      config: {
        name: '',
        exercises: [],
        distances: [],
        attempts: 1,
      },
    };
  },
  computed: {
    presets() {
      return [
        {
          type: TRAINING_TYPE.TIR_FULL,
          name: this.$t('training.presetFull'),
          description: this.$t('training.presetFullDesc'),
        },
        {
          type: TRAINING_TYPE.TIR_SINGLE_EXERCISE,
          name: this.$t('training.presetSingleEx'),
          description: this.$t('training.presetSingleExDesc'),
        },
        {
          type: TRAINING_TYPE.TIR_SINGLE_DISTANCE,
          name: this.$t('training.presetSingleDist'),
          description: this.$t('training.presetSingleDistDesc'),
        },
        {
          type: TRAINING_TYPE.TIR_CUSTOM,
          name: this.$t('training.presetCustom'),
          description: this.$t('training.presetCustomDesc'),
        },
      ];
    },
    atelierNames() {
      return ATELIER_KEYS.map((key) => this.$t(`tir.${key}`));
    },
    totalAttempts() {
      return this.config.exercises.length * this.config.distances.length * this.config.attempts;
    },
    maxScore() {
      return this.totalAttempts * SCORING.carreau;
    },
    isValid() {
      return this.config.exercises.length > 0 && this.config.distances.length > 0 && this.config.attempts > 0;
    },
  },
  methods: {
    selectPreset(type) {
      this.selectedType = type;
      const preset = PRESET_CONFIGS[type];
      this.config.exercises = [...preset.exercises];
      this.config.distances = [...preset.distances];
      this.config.attempts = preset.attempts;
      this.step = 2;
    },
    createSession() {
      if (!this.isValid) return;
      const name = this.config.name || this.getDefaultName();
      const session = createSession(this.selectedType, this.config, name);
      this.$emit('created', session);
    },
    getDefaultName() {
      const exerciseNames = this.config.exercises.map((idx) => this.atelierNames[idx]);
      const exercisePart =
        exerciseNames.length === ATELIER_KEYS.length ? this.$t('training.allExercises') : exerciseNames.join(', ');
      const distPart =
        this.config.distances.length === DISTANCES_FULL.length
          ? this.$t('training.allDistances')
          : this.config.distances.map((d) => `${d}m`).join(', ');
      return `${exercisePart}. ${distPart}.`;
    },
  },
};
</script>

<style scoped>
.tcreate__nav {
  margin-bottom: 1.25rem;
}

.tcreate__back {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  border: 1.5px solid var(--color-primary);
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.15s;
}

.tcreate__back:hover {
  background: var(--color-primary);
  color: var(--color-white);
}

.tcreate__title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 1rem;
}

.tcreate__presets {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.tcreate__preset {
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.15s;
}

.tcreate__preset:hover {
  border-color: var(--color-primary);
}

.tcreate__preset--active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg, rgb(124 58 237 / 5%));
}

.tcreate__preset-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.tcreate__preset-desc {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.tcreate__field {
  margin-bottom: 1rem;
}

.tcreate__label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.4rem;
}

.tcreate__input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--color-surface);
  color: var(--color-text);
}

.tcreate__input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.tcreate__checks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tcreate__check {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: var(--color-text);
  cursor: pointer;
}

.tcreate__check input:disabled + span {
  opacity: 0.5;
}

.tcreate__summary {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.tcreate__summary-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 0.4rem;
}

.tcreate__summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--color-text);
  padding: 0.15rem 0;
}

.tcreate__actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
</style>
