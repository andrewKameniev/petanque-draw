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
        'tir-atelier-tabs__tab--active': item.id === effectiveModelValue,
        'tir-atelier-tabs__tab--complete': item.complete,
      }"
      :aria-selected="item.id === effectiveModelValue"
      :aria-controls="panelId || undefined"
      :tabindex="index === tabStopIndex ? 0 : -1"
      @click="select(item.id)"
      @keydown="onKeydown($event, index)"
    >
      <span>{{ item.label }}</span>
      <Check
        v-if="item.complete"
        :size="12"
        :stroke-width="3"
        class="tir-atelier-tabs__complete-icon"
        aria-hidden="true"
      />
      <span v-if="item.complete" class="tir-atelier-tabs__visually-hidden">, {{ completeLabel }}</span>
    </button>
  </div>
</template>

<script>
import { useId } from 'vue';
import { Check } from 'lucide-vue-next';

const hasValidItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) return false;
  const ids = items.map((item) => item?.id);
  const normalizedIds = ids.map((id) => String(id).trim());
  return (
    ids.every((id) => id !== null && id !== undefined) &&
    normalizedIds.every(Boolean) &&
    new Set(normalizedIds).size === normalizedIds.length
  );
};

export default {
  name: 'TirAtelierTabs',
  components: { Check },
  setup() {
    return { generatedIdPrefix: `tir-atelier-${useId().replaceAll(':', '')}` };
  },
  props: {
    items: { type: Array, required: true, validator: hasValidItems },
    modelValue: { type: [Number, String], required: true },
    label: { type: String, required: true, validator: (value) => Boolean(value.trim()) },
    completeLabel: { type: String, required: true, validator: (value) => Boolean(value.trim()) },
    idPrefix: { type: String, default: '', validator: (value) => !value || Boolean(value.trim()) },
    panelId: { type: String, default: '', validator: (value) => !value || Boolean(value.trim()) },
  },
  emits: ['update:modelValue'],
  computed: {
    effectiveModelValue() {
      return this.items.some((item) => item.id === this.modelValue) ? this.modelValue : this.items[0]?.id;
    },
    tabStopIndex() {
      const activeIndex = this.items.findIndex((item) => item.id === this.effectiveModelValue);
      return activeIndex >= 0 ? activeIndex : this.items.length ? 0 : -1;
    },
  },
  watch: {
    items: {
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
    tabId(id) {
      return `${this.idPrefix || this.generatedIdPrefix}-${id}`;
    },
    select(id) {
      this.$emit('update:modelValue', id);
    },
    focus(index) {
      this.$nextTick(() => this.$refs.tabButtons?.[index]?.focus());
    },
    onKeydown(event, index) {
      if (!this.items.length) return;
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
    ensureValidSelection() {
      if (this.items.length && !this.items.some((item) => item.id === this.modelValue)) {
        this.select(this.items[0].id);
      }
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
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  color: var(--color-text);
  background: var(--color-surface-alt);
  border-color: var(--tir-touche);
}

.tir-atelier-tabs__tab--complete:not(.tir-atelier-tabs__tab--active) {
  color: var(--color-text);
  border-color: var(--tir-carreau);
}

.tir-atelier-tabs__complete-icon {
  position: absolute;
  right: -2px;
  bottom: -1px;
  padding: 1px;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid currentcolor;
  border-radius: 50%;
}

.tir-atelier-tabs__visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.tir-atelier-tabs__tab:focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .tir-atelier-tabs__tab {
    transition: none;
  }
}
</style>
