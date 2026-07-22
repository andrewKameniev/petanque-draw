<template>
  <div class="public-slug">
    <div v-if="isLoading" class="public-slug__loader">
      <div class="public-slug__spinner"></div>
    </div>

    <div v-else-if="notFound" class="public-slug__card">
      <h2>{{ $t('common.routeNotFound') }}</h2>
    </div>

    <div v-else-if="!routeData.ref" class="public-slug__card">
      <h1 class="public-slug__title">{{ routeData.title }}</h1>
      <p class="public-slug__message">{{ $t('common.tournamentComingSoon') }}</p>
    </div>
  </div>
</template>

<script>
import { customRoutesService } from '@/services/db';

export default {
  name: 'PublicSlug',
  data() {
    return {
      isLoading: true,
      notFound: false,
      routeData: null,
    };
  },
  async mounted() {
    const slug = this.$route.params.slug;
    try {
      const snapshot = await customRoutesService.get(slug);
      if (!snapshot.exists()) {
        this.notFound = true;
      } else {
        this.routeData = snapshot.val();
        if (this.routeData.ref) {
          this.$router.replace({ path: '/tournament', query: { ref: this.routeData.ref } });
          return;
        }
      }
    } catch {
      this.notFound = true;
    }
    this.isLoading = false;
  },
};
</script>

<style scoped>
.public-slug {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg);
  padding: 20px;
}

.public-slug__card {
  text-align: center;
  background: var(--color-surface);
  border-radius: 12px;
  padding: 48px 32px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 2px 12px rgb(0 0 0 / 8%);
}

.public-slug__title {
  color: var(--color-text);
  font-size: 1.5rem;
  margin: 0 0 12px;
}

.public-slug__message {
  color: var(--color-text-secondary);
  font-size: 1rem;
  margin: 0;
}

.public-slug__loader {
  display: flex;
  align-items: center;
  justify-content: center;
}

.public-slug__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
