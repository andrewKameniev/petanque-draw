<template>
  <Modal @close-modal="$emit('cancel')">
    <div class="confirm-playoff" data-testid="playoff-confirm-modal">
      <h3 class="confirm-playoff__title">{{ $t('ranking.goPlayOff') }}</h3>

      <div v-if="!localWithBarrage" class="confirm-playoff__field">
        <label class="confirm-playoff__label">{{ $t('modals.playOffTeams') }}</label>
        <select class="confirm-playoff__select" data-testid="confirm-playoff-teams" v-model.number="localPlayOffTeams">
          <template v-for="value in teamToPlayOffValues" :key="value">
            <option :value="value" v-if="teamsCount >= value">{{ value }}</option>
          </template>
        </select>
      </div>

      <div v-if="isSwiss" class="confirm-playoff__field">
        <label class="confirm-playoff__checkbox">
          <input type="checkbox" v-model="localWithCadrage" data-testid="confirm-cadrage" />
          {{ $t('ranking.withCadrage') }}
        </label>
        <span class="confirm-playoff__hint">{{ $t('ranking.cadrageHint') }}</span>
        <span v-if="localWithCadrage && localPlayOffTeams" class="confirm-playoff__hint"
          >{{ localPlayOffTeams / 2 }} + {{ localPlayOffTeams }} {{ $t('teams.teams').toLowerCase() }}</span
        >
      </div>

      <div v-if="isSwiss" class="confirm-playoff__field">
        <label class="confirm-playoff__checkbox">
          <input type="checkbox" v-model="localWithBarrage" data-testid="confirm-barrage" />
          {{ $t('ranking.withBarrage') }}
        </label>
        <span class="confirm-playoff__hint">{{ $t('ranking.barrageHint') }}</span>
        <div v-if="localWithBarrage" class="mt-2">
          <label class="confirm-playoff__label">{{ $t('ranking.barrageTeams') }}</label>
          <select
            class="confirm-playoff__select"
            v-model.number="localBarrageTeams"
            data-testid="confirm-barrage-teams"
          >
            <template v-for="value in barrageTeamValues" :key="value">
              <option :value="value">{{ value }}</option>
            </template>
          </select>
          <span class="confirm-playoff__hint">{{ $t('ranking.barrageTeamsHint') }}</span>
          <span class="confirm-playoff__hint">{{ barrageToPlayoffCount }} {{ $t('ranking.barrageToPlayoff') }}</span>
        </div>
      </div>

      <div v-if="isSwiss && !isGroupB" class="confirm-playoff__field">
        <label class="confirm-playoff__checkbox">
          <input type="checkbox" v-model="localPlayB" data-testid="confirm-play-b" />
          {{ $t('ranking.alsoPlay') }} <strong>{{ $t('ranking.tournamentB') }}</strong>
        </label>
      </div>

      <div v-if="timeLimitEnabled" class="confirm-playoff__time-block">
        <div class="confirm-playoff__time-header">
          <Clock :size="16" />
          <span>{{ $t('modals.timeLimit') }}</span>
        </div>
        <div class="confirm-playoff__time-body">
          <div class="confirm-playoff__time-row">
            <label class="confirm-playoff__label">{{ $t('modals.timeLimitPlayoff') }}</label>
            <select class="confirm-playoff__select" v-model.number="localPlayoffTimeLimit" data-testid="confirm-playoff-time-limit">
              <option v-for="t in timeLimitOptions" :key="t" :value="t">{{ t }} {{ $t('modals.min') }}</option>
            </select>
          </div>
          <label class="confirm-playoff__checkbox">
            <input type="checkbox" v-model="localNoTimeLimitFinale" data-testid="confirm-no-timelimit-finale" />
            {{ $t('modals.noTimeLimitFinale') }}
          </label>
        </div>
      </div>

      <div class="confirm-playoff__actions">
        <button class="confirm-playoff__btn confirm-playoff__btn--cancel" @click="$emit('cancel')">
          {{ $t('common.cancel') }}
        </button>
        <button
          class="confirm-playoff__btn confirm-playoff__btn--confirm"
          data-testid="btn-confirm-playoff"
          @click="onConfirm"
        >
          {{ $t('ranking.go') }}
        </button>
      </div>
    </div>
  </Modal>
</template>

<script>
import Modal from '@/components/Modal';
import { Clock } from 'lucide-vue-next';

export default {
  name: 'PlayoffConfirmModal',
  components: { Modal, Clock },
  emits: ['confirm', 'cancel'],
  props: {
    isSwiss: { type: Boolean, default: false },
    isGroupB: { type: Boolean, default: false },
    teamsCount: { type: Number, required: true },
    playOffTeams: { type: Number, default: 4 },
    withCadrage: { type: Boolean, default: false },
    withBarrage: { type: Boolean, default: false },
    playB: { type: Boolean, default: false },
    barrageTeams: { type: Number, default: 8 },
    timeLimitEnabled: { type: Boolean, default: false },
    playoffTimeLimit: { type: Number, default: 30 },
    noTimeLimitFinale: { type: Boolean, default: false },
  },
  data() {
    return {
      localWithCadrage: this.withCadrage,
      localWithBarrage: this.withBarrage,
      localPlayB: this.playB,
      localPlayOffTeams: this.playOffTeams,
      localBarrageTeams: this.barrageTeams,
      localPlayoffTimeLimit: this.playoffTimeLimit,
      localNoTimeLimitFinale: this.noTimeLimitFinale,
    };
  },
  watch: {
    localWithCadrage(val) {
      if (val) this.localWithBarrage = false;
    },
    localWithBarrage(val) {
      if (val) this.localWithCadrage = false;
    },
  },
  computed: {
    teamToPlayOffValues() {
      const values = [];
      for (let i = 2; i <= this.teamsCount; i *= 2) {
        values.push(i);
      }
      if (this.localWithCadrage) {
        values.pop();
      }
      return values;
    },
    barrageTeamValues() {
      const values = [];
      for (let i = 4; i <= this.teamsCount; i *= 2) {
        values.push(i);
      }
      return values;
    },
    barrageToPlayoffCount() {
      const barrageTeams = this.localBarrageTeams || 8;
      const groups = barrageTeams / 4;
      const estimated = groups * 2;
      return Math.pow(2, Math.ceil(Math.log2(estimated)));
    },
    timeLimitOptions() {
      const options = [];
      for (let i = 20; i <= 120; i += 5) options.push(i);
      return options;
    },
  },
  methods: {
    onConfirm() {
      this.$emit('confirm', {
        withCadrage: this.localWithCadrage,
        withBarrage: this.localWithBarrage,
        playB: this.localPlayB,
        playOffTeams: this.localPlayOffTeams,
        barrageTeams: this.localBarrageTeams,
        playoffTimeLimit: this.localPlayoffTimeLimit,
        noTimeLimitFinale: this.localNoTimeLimitFinale,
      });
    },
  },
};
</script>

<style scoped>
.confirm-playoff {
  margin: -1.25rem;
  padding: 1.25rem;
}

.confirm-playoff__title {
  font-size: 1.1rem;
  font-weight: 700;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--color-border, #e0e0e0);
  margin-left: -1.25rem;
  margin-right: -1.25rem;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
}

.confirm-playoff__field {
  margin-bottom: 0.75rem;
}

.confirm-playoff__label {
  display: block;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.35rem;
  color: var(--color-text-secondary, #555);
}

.confirm-playoff__select {
  display: block;
  width: 100%;
  max-width: 120px;
  padding: 0.4rem 0.75rem;
  font-size: 1rem;
  border: 1px solid var(--color-border, #e0e0e0);
  border-radius: 6px;
  background: var(--color-bg-input, #fff);
}

.confirm-playoff__checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
}

.confirm-playoff__hint {
  display: block;
  font-size: 1rem;
  color: var(--color-text-muted, #888);
  margin-top: 0.25rem;
  margin-left: 1.5rem;
}

.confirm-playoff__time-block {
  margin-top: 1.25rem;
  border: 1px solid var(--color-border, #e0e0e0);
  border-radius: 8px;
  overflow: hidden;
}

.confirm-playoff__time-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-surface-hover, #f5f5f5);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-secondary, #555);
}

.confirm-playoff__time-body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.confirm-playoff__time-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.confirm-playoff__time-row .confirm-playoff__label {
  margin-bottom: 0;
}

.confirm-playoff__actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
  border-top: 1px solid var(--color-border, #e0e0e0);
  margin-left: -1.25rem;
  margin-right: -1.25rem;
  padding: 1rem 1.25rem 0;
}

.confirm-playoff__btn {
  padding: 0.5rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.15s;
}

.confirm-playoff__btn--cancel {
  background: transparent;
  border-color: var(--color-border, #e0e0e0);
  color: var(--color-text-secondary, #555);
}

.confirm-playoff__btn--cancel:hover {
  border-color: var(--color-text-muted);
  background: var(--color-surface-hover);
}

.confirm-playoff__btn--confirm {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.confirm-playoff__btn--confirm:hover {
  background: var(--color-primary-light, #5b21b6);
  border-color: var(--color-primary-light, #5b21b6);
}
</style>
