<template>
  <div class="page-loader" role="status" aria-live="polite" :aria-label="label">
    <span class="page-loader__dot"></span>
    <span class="page-loader__dots" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
    </span>
    <span class="visually-hidden">{{ label }}</span>
  </div>
</template>

<script>
export default {
  name: 'PageLoader',
  props: {
    label: { type: String, default: 'Loading…' },
  },
};
</script>

<style scoped>
.page-loader {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 1000;
  width: 142px;
  height: 60px;
  margin: -20px 0 0 -71px;
}

.page-loader__dot {
  position: absolute;
  top: 12px;
  left: 15px;
  width: 16px;
  height: 16px;
  background: var(--color-primary);
  border-radius: 50%;
  transform: translateX(0);
  animation: page-loader-dot 2.8s infinite;
}

.page-loader__dots {
  display: block;
  margin-top: 12px;
  margin-left: 31px;
  transform: translateX(0);
  animation: page-loader-dots 2.8s infinite;
}

.page-loader__dots span {
  display: block;
  float: left;
  width: 16px;
  height: 16px;
  margin-left: 16px;
  background: var(--color-primary);
  border-radius: 50%;
}

.visually-hidden {
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

@keyframes page-loader-dot {
  50% {
    transform: translateX(96px);
  }
}

@keyframes page-loader-dots {
  50% {
    transform: translateX(-31px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-loader__dot,
  .page-loader__dots {
    animation-duration: 8s;
  }
}
</style>
