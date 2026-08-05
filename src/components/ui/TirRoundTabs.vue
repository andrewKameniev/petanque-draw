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
      :class="{ 'tir-round-tabs__tab--active': tab.key === modelValue }"
      :aria-selected="tab.key === modelValue"
      :tabindex="tab.key === modelValue ? 0 : -1"
      @click="select(tab.key)"
      @keydown="onKeydown($event, index)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'TirRoundTabs',
  props: {
    tabs: { type: Array, required: true },
    modelValue: { type: [String, Number], required: true },
    label: { type: String, default: 'Scoring rounds' },
    idPrefix: { type: String, default: 'tir-round' },
  },
  emits: ['update:modelValue'],
  methods: {
    tabId(key) {
      return `${this.idPrefix}-${key}`;
    },
    select(key) {
      this.$emit('update:modelValue', key);
    },
    focus(index) {
      this.$nextTick(() => this.$refs.tabButtons?.[index]?.focus());
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
      this.select(this.tabs[nextIndex].key);
      this.focus(nextIndex);
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
  color: var(--color-text-muted);
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
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.tir-round-tabs__tab:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
