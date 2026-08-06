<template>
  <div class="tournament-nav" :class="`tournament-nav--${variant}`" role="tablist" :aria-label="label">
    <button
      v-for="(tab, index) in tabs"
      :id="tabId(tab.id)"
      :key="tab.id"
      ref="tabButtons"
      type="button"
      role="tab"
      class="tournament-nav__btn"
      :class="[`tournament-nav__btn--${tab.id}`, { 'tournament-nav__btn--active': tab.id === selectedTabId }]"
      :aria-controls="panelId"
      :aria-selected="tab.id === selectedTabId"
      :tabindex="tab.id === selectedTabId ? 0 : -1"
      @click="selectTab(tab)"
      @keydown="onKeydown($event, index)"
    >
      <component :is="tab.icon" v-if="tab.icon" :size="18" aria-hidden="true" :focusable="false" />
      <span>{{ tab.label }}</span>
    </button>
  </div>
</template>

<script>
const TAB_VARIANTS = ['default', 'tir'];

function hasValidTabs(tabs) {
  if (!Array.isArray(tabs) || tabs.length === 0) return false;

  const ids = new Set();
  return tabs.every((tab) => {
    if (!tab || typeof tab.id !== 'string' || !tab.id.trim()) return false;
    if (typeof tab.label !== 'string' || !tab.label.trim() || ids.has(tab.id)) return false;
    ids.add(tab.id);
    return true;
  });
}

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export default {
  name: 'TournamentNav',
  props: {
    tabs: { type: Array, required: true, validator: hasValidTabs },
    modelValue: { type: String, required: true },
    label: { type: String, required: true, validator: isNonEmptyString },
    panelId: { type: String, required: true, validator: isNonEmptyString },
    idPrefix: { type: String, required: true, validator: isNonEmptyString },
    variant: {
      type: String,
      default: 'default',
      validator: (value) => TAB_VARIANTS.includes(value),
    },
  },
  emits: {
    'update:modelValue': isNonEmptyString,
    change: isNonEmptyString,
  },
  data() {
    return {
      lastSelectionCorrection: null,
    };
  },
  computed: {
    selectedTabId() {
      if (this.tabs.some((tab) => tab.id === this.modelValue)) return this.modelValue;
      return this.tabs[0]?.id || null;
    },
  },
  watch: {
    modelValue: {
      immediate: true,
      handler() {
        this.reconcileSelection();
      },
    },
    tabs: {
      deep: true,
      handler() {
        this.reconcileSelection();
      },
    },
  },
  methods: {
    tabId(id) {
      return `${this.idPrefix}-${id}`;
    },
    selectTab(tab) {
      if (!tab?.id || !this.tabs.some((candidate) => candidate.id === tab.id)) return;
      this.$emit('update:modelValue', tab.id);
      this.$emit('change', tab.id);
    },
    reconcileSelection() {
      if (this.tabs.some((tab) => tab.id === this.modelValue)) {
        this.lastSelectionCorrection = null;
        return;
      }

      const fallbackId = this.tabs[0]?.id;
      if (!fallbackId) return;
      const correction = `${this.modelValue}\u0000${fallbackId}\u0000${this.tabs.map((tab) => tab.id).join('\u0000')}`;
      if (correction === this.lastSelectionCorrection) return;
      this.lastSelectionCorrection = correction;
      this.$emit('update:modelValue', fallbackId);
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
  background: var(--color-surface);
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
  color: var(--color-text-secondary);
  cursor: pointer;
  background: none;
  border: none;
  transition: color 0.2s;
}

.tournament-nav__btn:focus-visible {
  outline: 2px solid var(--color-primary-light);
  outline-offset: -2px;
}

.tournament-nav__btn--active {
  font-weight: 700;
  color: var(--color-primary-light);
}

.tournament-nav--tir {
  margin-bottom: 16px;
  border-radius: 10px;
}

.tournament-nav--tir .tournament-nav__btn {
  padding: 6px;
}
</style>
