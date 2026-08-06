<template>
  <div class="tir-round-tabs" role="tablist" :aria-label="label">
    <button
      v-for="(tab, index) in tabs"
      :id="tabId(tab.key)"
      :key="tab.key"
      ref="tabButtons"
      type="button"
      role="tab"
      class="tir-round-tabs__tab"
      :class="{ 'tir-round-tabs__tab--active': tab.key === effectiveModelValue }"
      :aria-selected="tab.key === effectiveModelValue"
      :aria-controls="panelId || undefined"
      :tabindex="index === tabStopIndex ? 0 : -1"
      @click="select(tab.key)"
      @keydown="onKeydown($event, index)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script>
import { useId } from 'vue';

const hasValidTabs = (tabs) => {
  if (!Array.isArray(tabs) || tabs.length === 0) return false;
  const keys = tabs.map((tab) => tab?.key);
  const normalizedKeys = keys.map((key) => String(key).trim());
  return (
    keys.every((key) => key !== null && key !== undefined) &&
    normalizedKeys.every(Boolean) &&
    new Set(normalizedKeys).size === normalizedKeys.length
  );
};

export default {
  name: 'TirRoundTabs',
  setup() {
    return { generatedIdPrefix: `tir-round-${useId().replaceAll(':', '')}` };
  },
  props: {
    tabs: { type: Array, required: true, validator: hasValidTabs },
    modelValue: { type: [String, Number], required: true },
    label: { type: String, required: true, validator: (value) => Boolean(value.trim()) },
    idPrefix: { type: String, default: '', validator: (value) => !value || Boolean(value.trim()) },
    panelId: { type: String, default: '', validator: (value) => !value || Boolean(value.trim()) },
  },
  emits: ['update:modelValue'],
  computed: {
    effectiveModelValue() {
      return this.tabs.some((tab) => tab.key === this.modelValue) ? this.modelValue : this.tabs[0]?.key;
    },
    tabStopIndex() {
      const activeIndex = this.tabs.findIndex((tab) => tab.key === this.effectiveModelValue);
      return activeIndex >= 0 ? activeIndex : this.tabs.length ? 0 : -1;
    },
  },
  watch: {
    tabs: {
      deep: true,
      handler() {
        this.ensureValidSelection();
      },
    },
    modelValue() {
      this.ensureValidSelection();
    },
  },
  mounted() {
    this.ensureValidSelection();
  },
  methods: {
    tabId(key) {
      return `${this.idPrefix || this.generatedIdPrefix}-${key}`;
    },
    select(key) {
      this.$emit('update:modelValue', key);
    },
    focus(index) {
      this.$nextTick(() => this.$refs.tabButtons?.[index]?.focus());
    },
    onKeydown(event, index) {
      if (!this.tabs.length) return;
      const lastIndex = this.tabs.length - 1;
      let nextIndex;
      if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1;
      else if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = lastIndex;
      else return;

      event.preventDefault();
      this.select(this.tabs[nextIndex].key);
      this.focus(nextIndex);
    },
    ensureValidSelection() {
      if (this.tabs.length && !this.tabs.some((tab) => tab.key === this.modelValue)) {
        this.select(this.tabs[0].key);
      }
    },
  },
};
</script>

<style scoped>
.tir-round-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.tir-round-tabs__tab {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  transition:
    color 0.15s,
    background 0.15s,
    border-color 0.15s;
}

.tir-round-tabs__tab--active {
  color: var(--color-btn-text);
  background: var(--color-btn-dark);
  border-color: var(--color-btn-dark);
}

.tir-round-tabs__tab:focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}
</style>
