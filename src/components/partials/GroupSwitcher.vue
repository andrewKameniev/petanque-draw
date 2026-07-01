<template>
  <div class="group-switcher" :class="{ 'group-switcher--full': fullLabels }">
    <button
      class="group-switcher__btn"
      :class="{ 'group-switcher__btn--active': modelValue === 'A' }"
      @click="$emit('update:modelValue', 'A')"
    >
      <span v-if="fullLabels">{{ $t('ranking.mainTournament') }}</span>
      <span v-else>A</span>
    </button>
    <button
      class="group-switcher__btn"
      :class="{ 'group-switcher__btn--active': modelValue === 'B' }"
      @click="$emit('update:modelValue', 'B')"
    >
      <span v-if="fullLabels">{{ $t('ranking.tournamentB') }}</span>
      <span v-else>B</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'GroupSwitcher',
  props: {
    modelValue: { type: String, default: 'A' },
    fullLabels: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
};
</script>

<style scoped>
.group-switcher {
  display: inline-flex;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.group-switcher--full {
  display: flex;
  border-radius: 8px;
}

.group-switcher__btn {
  padding: 6px 16px;
  border: none;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.group-switcher--full .group-switcher__btn {
  flex: 1;
  padding: 0.5rem 1rem;
  font-size: 15px;
}

.group-switcher__btn--active {
  background: var(--color-primary);
  color: var(--color-white, #fff);
}
</style>
