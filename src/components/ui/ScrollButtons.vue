<template>
  <div class="scroll-buttons">
    <button type="button" class="scroll-buttons__btn" :aria-label="topLabel" :title="topLabel" @click="scrollToTop">
      <ChevronUp :size="20" aria-hidden="true" :focusable="false" />
    </button>
    <button
      type="button"
      class="scroll-buttons__btn"
      :aria-label="bottomLabel"
      :title="bottomLabel"
      @click="scrollToBottom"
    >
      <ChevronDown :size="20" aria-hidden="true" :focusable="false" />
    </button>
  </div>
</template>

<script>
import { ChevronUp, ChevronDown } from 'lucide-vue-next';

const TARGETS = ['window', 'container'];
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export default {
  name: 'ScrollButtons',
  components: { ChevronUp, ChevronDown },
  props: {
    target: { type: String, required: true, validator: (value) => TARGETS.includes(value) },
    containerSelector: { type: String, default: null },
    topLabel: { type: String, required: true, validator: isNonEmptyString },
    bottomLabel: { type: String, required: true, validator: isNonEmptyString },
  },
  methods: {
    getBehavior() {
      return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    },
    getTarget() {
      // Keep selector-only callers working long enough for an explicit migration,
      // but never infer window scrolling when no target is configured.
      const target = this.target || (this.containerSelector ? 'container' : null);
      if (target === 'window') return { type: 'window', element: window };
      if (target !== 'container') {
        console.warn('[ScrollButtons] An explicit target is required.');
        return null;
      }
      if (!isNonEmptyString(this.containerSelector)) {
        console.warn('[ScrollButtons] Container mode requires a non-empty containerSelector.');
        return null;
      }

      let element;
      try {
        element = document.querySelector(this.containerSelector);
      } catch {
        console.warn(`[ScrollButtons] Invalid container selector: ${this.containerSelector}`);
        return null;
      }
      if (!element) {
        console.warn(`[ScrollButtons] Container not found: ${this.containerSelector}`);
        return null;
      }
      return { type: 'container', element };
    },
    getDocumentHeight() {
      return Math.max(document.documentElement?.scrollHeight || 0, document.body?.scrollHeight || 0);
    },
    scrollToTop() {
      const target = this.getTarget();
      if (!target) return;
      target.element.scrollTo({ top: 0, behavior: this.getBehavior() });
    },
    scrollToBottom() {
      const target = this.getTarget();
      if (!target) return;
      const top = target.type === 'window' ? this.getDocumentHeight() : target.element.scrollHeight;
      target.element.scrollTo({ top, behavior: this.getBehavior() });
    },
  },
};
</script>

<style scoped>
.scroll-buttons {
  position: fixed;
  bottom: 4.5rem;
  right: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 50;
}

.scroll-buttons__btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-btn-text);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px var(--color-primary-shadow);
  transition: transform 0.2s;
}

.scroll-buttons__btn:hover {
  transform: scale(1.1);
}

.scroll-buttons__btn:focus-visible {
  outline: 2px solid var(--color-surface);
  outline-offset: 0;
  box-shadow:
    0 0 0 4px var(--color-primary-light),
    0 2px 12px var(--color-primary-shadow);
}

@media (prefers-reduced-motion: reduce) {
  .scroll-buttons__btn {
    transition: none;
  }

  .scroll-buttons__btn:hover {
    transform: none;
  }
}
</style>
