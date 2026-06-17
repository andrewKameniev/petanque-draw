<template>
  <div class="text-center is-size-3 tournament-name-row" data-testid="tournament-name-row">
    <button
      class="pin-btn"
      :class="{ 'pin-btn--active': isPinned }"
      @click.stop="togglePin"
      :title="isPinned ? $t('common.unpin') : $t('common.pin')"
    >
      <IconPin :size="22" :fill="isPinned ? 'currentColor' : 'none'" />
    </button>
    <template v-if="editing">
      <div class="inline-name-edit-wrapper">
        <div class="inline-name-edit">
          <input
            ref="nameInput"
            class="inline-name-input"
            :class="{ 'inline-name-input--error': nameError }"
            v-model="editValue"
            @keyup.enter="saveName"
            @keyup.escape="cancelEdit"
            @input="nameError = false"
          />
          <button class="inline-name-btn inline-name-btn--save" @click="saveName" :title="$t('common.change')">
            <Check :size="18" />
          </button>
          <button class="inline-name-btn inline-name-btn--cancel" @click="cancelEdit" :title="$t('common.cancel')">
            <X :size="18" />
          </button>
        </div>
        <span v-if="nameError" class="inline-name-error">{{ $t('modals.tournamentNameRequired') }}</span>
      </div>
    </template>
    <template v-else>
      <strong class="pointer" @click="startEdit"> {{ name }}</strong>
    </template>
    <span v-if="tournamentStarted" class="is-size-5 is-capitalized">({{ system }})</span>
    <span v-if="isTest" class="test-badge">Test</span>
  </div>
</template>

<script>
import { IconPin } from '@/components/icons';
import { Check, X } from 'lucide-vue-next';

export default {
  name: 'TournamentHeader',
  components: { IconPin, Check, X },
  emits: ['update:name', 'pin', 'unpin'],
  props: {
    name: { type: String, required: true },
    system: { type: String, default: '' },
    tournamentStarted: { type: Boolean, default: false },
    isTest: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
  },
  data() {
    return {
      editing: false,
      editValue: '',
      nameError: false,
    };
  },
  methods: {
    startEdit() {
      this.editValue = this.name;
      this.editing = true;
      this.$nextTick(() => {
        this.$refs.nameInput?.focus();
        this.$refs.nameInput?.select();
      });
    },
    saveName() {
      if (this.editValue.trim()) {
        this.$emit('update:name', this.editValue.trim());
        this.editing = false;
        this.nameError = false;
      } else {
        this.nameError = true;
      }
    },
    cancelEdit() {
      this.editing = false;
    },
    togglePin() {
      this.$emit(this.isPinned ? 'unpin' : 'pin');
    },
  },
};
</script>

<style scoped>
.tournament-name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
}

.inline-name-edit {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.inline-name-input {
  font-size: 1.5rem;
  font-weight: 700;
  border: none;
  border-bottom: 2px solid var(--color-primary);
  background: transparent;
  outline: none;
  padding: 0.1rem 0.5rem;
  text-align: center;
  min-width: 0;
  max-width: calc(100vw - 200px);
  width: auto;
  field-sizing: content;
}

.inline-name-input:focus {
  border-bottom-color: var(--color-primary);
}

.inline-name-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.1s;
}

.inline-name-btn:active {
  transform: scale(0.9);
}

.inline-name-btn--save {
  background: var(--color-primary);
  color: var(--color-btn-text);
}

.inline-name-btn--save:hover {
  background: var(--color-primary-light);
}

.inline-name-btn--cancel {
  background: var(--color-tab-inactive-bg);
  color: var(--color-tab-inactive-text);
}

.inline-name-btn--cancel:hover {
  background: var(--color-tab-inactive-hover);
}

.inline-name-edit-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.inline-name-input--error {
  border-bottom-color: var(--color-error);
}

.inline-name-error {
  font-size: 1rem;
  color: var(--color-error);
  margin-top: 0.25rem;
}

.pin-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-grey);
  padding: 0.2rem;
  border-radius: 4px;
  transition:
    color 0.2s,
    transform 0.2s;
}

.pin-btn:hover {
  color: var(--color-primary);
  transform: scale(1.1);
}

.pin-btn--active {
  color: var(--color-primary);
}

.test-badge {
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-radius: 4px;
  background: var(--color-warning, #f59e0b);
  color: var(--color-btn-text, #fff);
}
</style>
