<template>
  <div class="tir-atelier-tabs" role="tablist" :aria-label="label">
    <button
      v-for="(item, index) in items"
      :id="tabId(item.id)"
      :key="item.id"
      ref="tabButtons"
      type="button"
      role="tab"
      class="tir-atelier-tabs__tab"
      :class="{
        'tir-atelier-tabs__tab--active': item.id === modelValue,
        'tir-atelier-tabs__tab--complete': item.complete,
      }"
      :aria-selected="item.id === modelValue"
      :tabindex="item.id === modelValue ? 0 : -1"
      @click="select(item.id)"
      @keydown="onKeydown($event, index)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'TirAtelierTabs',
  props: {
    items: { type: Array, required: true },
    modelValue: { type: [Number, String], required: true },
    label: { type: String, default: 'Scoring ateliers' },
    idPrefix: { type: String, default: 'tir-atelier' },
  },
  emits: ['update:modelValue'],
  methods: {
    tabId(id) {
      return `${this.idPrefix}-${id}`;
    },
    select(id) {
      this.$emit('update:modelValue', id);
    },
    focus(index) {
      this.$nextTick(() => this.$refs.tabButtons?.[index]?.focus());
    },
    onKeydown(event, index) {
      const lastIndex = this.items.length - 1;
      let nextIndex;
      if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1;
      else if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = lastIndex;
      else return;

      event.preventDefault();
      this.select(this.items[nextIndex].id);
      this.focus(nextIndex);
    },
  },
};
</script>

<style scoped>
.tir-atelier-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.tir-atelier-tabs__tab {
  width: 36px;
  height: 36px;
  padding: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  cursor: pointer;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: 50%;
  transition:
    color 0.2s,
    background 0.2s,
    border-color 0.2s;
}

.tir-atelier-tabs__tab--active {
  color: var(--color-btn-text);
  background: var(--tir-touche);
  border-color: var(--tir-touche);
}

.tir-atelier-tabs__tab--complete:not(.tir-atelier-tabs__tab--active) {
  color: var(--tir-carreau);
  border-color: var(--tir-carreau);
}

.tir-atelier-tabs__tab:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
