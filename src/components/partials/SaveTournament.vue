<template>
  <Modal @close-modal="$emit('close-modal')">
    <div class="save-tournament">
      <h3 class="save-tournament__title">{{ $t('modals.enterTournamentName') }}</h3>
      <input
        class="save-tournament__input"
        v-model="name"
        :class="{ 'save-tournament__input--error': hasError }"
        type="text"
        placeholder="Tournament name"
        @keyup.enter="saveTournament"
      />
      <div v-if="hasError" class="save-tournament__error">
        {{ $t('modals.alreadyHaveName') }}
      </div>
      <div class="save-tournament__actions">
        <button class="save-tournament__btn save-tournament__btn--cancel" @click="$emit('close-modal')">
          {{ $t('common.cancel') }}
        </button>
        <button class="save-tournament__btn save-tournament__btn--save" @click="saveTournament">
          {{ $t('common.save') }}
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
  name: 'SaveTournament',
  components: { Modal },
  props: ['rankingTeams'],
  emits: ['close-modal'],
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
    ...mapState(useMainStore, ['currentTournament']),
    tournament() {
      return this.currentTournament;
    },
  },
  methods: {
    ...mapActions(useMainStore, ['addToSaved', 'changeTournamentName']),
    saveTournament() {
      this.hasError = false;
      if (!this.name) {
        this.hasError = true;
      } else {
        if (this.name !== this.tournament.name) {
          this.changeTournamentName(this.name);
        }
        this.addToSaved(this.tournament);
        this.$emit('close-modal');
      }
    },
  },
};
</script>

<style scoped>
.save-tournament {
  padding-top: 0.5rem;
}

.save-tournament__title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 1rem;
  padding-right: 2rem;
}

.save-tournament__input {
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

.save-tournament__input:focus {
  border-color: var(--color-primary);
}

.save-tournament__input--error {
  border-color: var(--color-error);
}

.save-tournament__error {
  color: var(--color-error);
  font-size: 0.9rem;
  margin-top: 0.4rem;
}

.save-tournament__actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.save-tournament__btn {
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

.save-tournament__btn:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-text-muted);
}

.save-tournament__btn--save {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-btn-text);
}

.save-tournament__btn--save:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary-light);
}
</style>
