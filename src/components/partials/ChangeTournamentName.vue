<template>
  <Modal @close-modal="$emit('close-modal')">
    <div class="rename-tournament">
      <h3 class="rename-tournament__title">{{ $t('modals.enterTournamentName') }}</h3>
      <input
        class="rename-tournament__input"
        v-model="name"
        :class="{ 'rename-tournament__input--error': hasError }"
        type="text"
        :placeholder="$t('common.tournamentName')"
        @keyup.enter="changeCurrentTournamentName"
      />
      <div class="rename-tournament__actions">
        <button class="rename-tournament__btn rename-tournament__btn--cancel" @click="$emit('close-modal')">
          {{ $t('common.cancel') }}
        </button>
        <button class="rename-tournament__btn rename-tournament__btn--save" @click="changeCurrentTournamentName">
          {{ $t('common.change') }}
        </button>
      </div>
    </div>
  </Modal>
</template>

<script>
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import Modal from '@/components/Modal';

export default {
  name: 'ChangeTournamentName',
  components: { Modal },
  data() {
    return {
      name: '',
      hasError: false,
    };
  },
  created() {
    this.name = this.tournament.name;
  },
  computed: {
    ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament']),
    tournament() {
      return this.currentTournament;
    },
  },
  methods: {
    ...mapActions(useMainStore, ['changeTournamentName']),
    changeCurrentTournamentName() {
      this.hasError = false;
      if (this.name !== '') {
        this.changeTournamentName(this.name);
        this.$emit('close-modal');
      } else {
        this.hasError = true;
      }
    },
  },
};
</script>

<style scoped>
.rename-tournament {
  padding-top: 0.5rem;
}

.rename-tournament__title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 1rem;
  padding-right: 2rem;
}

.rename-tournament__input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  font-size: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-input);
  color: var(--color-text);
  outline: none;
  transition: border-color 0.2s;
}

.rename-tournament__input:focus {
  border-color: var(--color-primary);
}

.rename-tournament__input--error {
  border-color: var(--color-error);
}

.rename-tournament__actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.rename-tournament__btn {
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.rename-tournament__btn:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-text-muted);
}

.rename-tournament__btn--save {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-btn-text);
}

.rename-tournament__btn--save:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary-light);
}
</style>
