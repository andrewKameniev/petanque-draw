<template>
  <div class="tournament-nav" role="tablist" :aria-label="label">
    <button
      v-for="(tab, index) in tabs"
      :id="`tab-${tab.id}`"
      :key="tab.id"
      ref="tabButtons"
      type="button"
      role="tab"
      class="tournament-nav__btn"
      :class="[`tournament-nav__btn--${tab.id}`, { 'tournament-nav__btn--active': tab.id === modelValue }]"
      :aria-controls="panelId"
      :aria-selected="tab.id === modelValue"
      :tabindex="tab.id === modelValue ? 0 : -1"
      @click="selectTab(tab)"
      @keydown="onKeydown($event, index)"
    >
      <component :is="tab.icon" v-if="tab.icon" :size="18" aria-hidden="true" />
      <span>{{ tab.label }}</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'TournamentNav',
  props: {
    tabs: { type: Array, required: true },
    modelValue: { type: String, required: true },
    label: { type: String, default: 'Tournament sections' },
    panelId: { type: String, default: 'tournament-tabpanel' },
  },
  emits: ['update:modelValue', 'change'],
  methods: {
    selectTab(tab) {
      if (!tab?.id) return;
      this.$emit('update:modelValue', tab.id);
      this.$emit('change', tab.id);
    },
    focusTab(id) {
      this.$nextTick(() => {
        const index = this.tabs.findIndex((tab) => tab.id === id);
        this.$refs.tabButtons?.[index]?.focus();
      });
    },
    onKeydown(event, index) {
      const lastIndex = this.tabs.length - 1;
      let nextIndex;
      if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1;
      else if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = lastIndex;
      else return;

      event.preventDefault();
      const tab = this.tabs[nextIndex];
      this.selectTab(tab);
      this.focusTab(tab.id);
    },
  },
};
</script>

<style scoped>
.tournament-nav {
  display: flex;
  padding: 6px 0;
  margin-bottom: -1px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  border-radius: 12px 12px 0 0;
}

.tournament-nav__btn {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  padding: 8px 6px;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  background: none;
  border: none;
  transition: color 0.2s;
}

.tournament-nav__btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
  border-radius: 8px;
}

.tournament-nav__btn--active {
  font-weight: 700;
}

.tournament-nav__btn--teams.tournament-nav__btn--active {
  color: var(--tir-delete, #e53935);
}

.tournament-nav__btn--games.tournament-nav__btn--active,
.tournament-nav__btn--round.tournament-nav__btn--active,
.tournament-nav__btn--bracket.tournament-nav__btn--active,
.tournament-nav__btn--protocol.tournament-nav__btn--active {
  color: var(--color-primary);
}

.tournament-nav__btn--results.tournament-nav__btn--active {
  color: var(--tir-carreau, #4caf50);
}

.tournament-nav__btn--ranking.tournament-nav__btn--active {
  color: var(--tir-touche, #ff9800);
}

.tournament-nav__btn--streams.tournament-nav__btn--active {
  color: #e53935;
}
</style>
