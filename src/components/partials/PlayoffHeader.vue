<template>
  <header class="playoff-header">
    <div class="playoff-header__copy">
      <h2 class="playoff-header__title">{{ title }}</h2>
      <p v-if="subtitle" class="playoff-header__subtitle">{{ subtitle }}</p>
    </div>
    <span v-if="badge" class="playoff-header__badge">{{ badge }}</span>
    <button
      v-if="showBracketButton"
      type="button"
      class="button playoff-header__bracket-btn"
      @click="$emit('show-bracket')"
    >
      <GitFork :size="16" /> {{ $t('games.showBracket') }}
    </button>
  </header>
</template>

<script>
import { GitFork } from 'lucide-vue-next';

export default {
  name: 'PlayoffHeader',
  components: { GitFork },
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    badge: { type: String, default: '' },
    showBracketButton: { type: Boolean, default: false },
  },
  emits: ['show-bracket'],
};
</script>

<style scoped>
.playoff-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.playoff-header__copy {
  min-width: 0;
}

.playoff-header__title {
  margin: 0;
  color: var(--color-text);
  font-size: 1.45rem;
  font-weight: 800;
}

.playoff-header__subtitle {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
}

.playoff-header__badge {
  flex: 0 0 auto;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 700;
}

.playoff-header__bracket-btn {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.6rem;
  border: 2px solid var(--color-primary) !important;
  background: var(--color-surface) !important;
  color: var(--color-primary) !important;
  font-weight: 700;
  box-shadow: none !important;
}

.playoff-header__bracket-btn:hover,
.playoff-header__bracket-btn:focus,
.playoff-header__bracket-btn:focus-visible,
.playoff-header__bracket-btn:active {
  border-color: var(--color-primary-hover) !important;
  background: var(--color-primary-bg) !important;
  color: var(--color-primary-hover) !important;
  box-shadow: 0 0 0 3px var(--color-primary-shadow) !important;
}

@media screen and (max-width: 768px) {
  .playoff-header {
    flex-wrap: wrap;
  }

  .playoff-header__copy {
    flex: 1 1 calc(100% - 7rem);
  }

  .playoff-header__bracket-btn {
    flex-basis: 100%;
    justify-content: center;
  }
}
</style>
