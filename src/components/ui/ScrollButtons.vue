<template>
  <div class="scroll-buttons">
    <button class="scroll-buttons__btn" @click="scrollToTop">
      <ChevronUp :size="20" />
    </button>
    <button class="scroll-buttons__btn" @click="scrollToBottom">
      <ChevronDown :size="20" />
    </button>
  </div>
</template>

<script>
import { ChevronUp, ChevronDown } from 'lucide-vue-next';

export default {
  name: 'ScrollButtons',
  components: { ChevronUp, ChevronDown },
  props: {
    containerSelector: { type: String, default: null },
  },
  methods: {
    getContainer() {
      return this.containerSelector ? document.querySelector(this.containerSelector) : null;
    },
    scrollToTop() {
      const el = this.getContainer();
      if (el) {
        el.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    scrollToBottom() {
      const el = this.getContainer();
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
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
  color: white;
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
</style>
