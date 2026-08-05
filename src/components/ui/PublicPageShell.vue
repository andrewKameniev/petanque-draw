<template>
  <div
    class="public-page-shell"
    :class="[{ 'public-page-shell--plain': !textured }, containerSize ? `public-page-shell--${containerSize}` : null]"
  >
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'PublicPageShell',
  props: {
    textured: { type: Boolean, default: true },
    containerSize: {
      type: String,
      default: '',
      validator: (value) => ['', 'compact', 'responsive'].includes(value),
    },
  },
};
</script>

<style>
.public-page-shell {
  position: relative;
  min-height: 100vh;
  background: var(--color-body-bg);
}

.public-page-shell::before {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  content: '';
  background: url('@/assets/img/bg-petanque.avif') repeat;
  background-size: 800px;
  opacity: 0.5;
}

.public-page-shell--plain::before,
[data-theme='dark'] .public-page-shell::before {
  display: none;
}

.public-page-shell > * {
  position: relative;
  z-index: 1;
}

.public-page-shell--compact > .container,
.public-page-shell--responsive > .container {
  max-width: 800px !important;
  padding: 0 1rem 2rem;
  margin: 0 auto;
}

@media screen and (min-width: 1024px) {
  .public-page-shell--responsive > .container {
    padding-bottom: 3rem;
  }
}

@media screen and (min-width: 1408px) {
  .public-page-shell--responsive > .container {
    max-width: 1100px !important;
  }
}
</style>
