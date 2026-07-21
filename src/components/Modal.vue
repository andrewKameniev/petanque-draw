<template>
  <Teleport to="body">
    <div class="modal is-active">
      <div class="modal-background" @click.self="$emit('close-modal')"></div>
      <div class="modal-content">
        <div class="box">
          <button class="modal-close is-large" aria-label="close" @click="$emit('close-modal')"></button>
          <slot></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
export default {
  name: 'Modal',
  emits: ['close-modal'],
  mounted() {
    document.documentElement.classList.add('is-clipped');
  },
  beforeUnmount() {
    document.documentElement.classList.remove('is-clipped');
  },
};
</script>

<style scoped>
.modal {
  z-index: 10000;
}

.modal-content {
  width: 500px;
  max-width: calc(100vw - 20px);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

.box {
  position: relative;
}

.modal-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 1;
  background: var(--color-border, rgb(0 0 0 / 10%));
  border-radius: 50%;
}

.modal-close:hover {
  background: var(--color-text-muted, rgb(0 0 0 / 30%));
}
</style>
