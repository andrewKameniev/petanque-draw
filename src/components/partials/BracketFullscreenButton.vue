<template>
  <button type="button" class="bracket-fullscreen-button" @click="$emit('toggle')">
    <Minimize2 v-if="isFullscreen" :size="20" />
    <Maximize2 v-else :size="20" />
  </button>
</template>

<script>
import { Maximize2, Minimize2 } from 'lucide-vue-next';

export default {
  name: 'BracketFullscreenButton',
  components: { Maximize2, Minimize2 },
  props: {
    isFullscreen: { type: Boolean, default: false },
  },
  emits: ['toggle'],
};
</script>

<style scoped>
.bracket-fullscreen-button {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: 1px solid rgb(255 255 255 / 28%);
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-primary), #3d1b9a);
  box-shadow: 0 8px 22px rgb(74 31 169 / 28%);
  color: #fff;
  cursor: pointer;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
}

.bracket-fullscreen-button:hover,
.bracket-fullscreen-button:focus-visible {
  transform: translateY(-1px) scale(1.04);
  box-shadow: 0 11px 28px rgb(74 31 169 / 38%);
}
</style>
