<template>
  <div v-if="isLoading" class="gooey">
    <span class="dot"></span>
    <div class="dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
  <div v-else class="wrapper">
    <div v-if="statData" class="container">
      <div class="is-flex is-justify-content-space-between is-align-items-center">
        <router-link class="navbar-item" to="/">
          <img src="../assets/img/logo.webp" alt="logo" />
        </router-link>
        <div class="is-flex is-align-items-center" style="gap: 4px;">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>

      <div class="public-stats">
        <h2 class="public-stats__title">{{ statData.name }}</h2>
        <div class="public-stats__meta">
          <span class="public-stats__date">{{ formatDate(statData.date) }}</span>
          <span class="public-stats__system">{{
            statData.system === 'simple' ? $t('stat.simple') : $t('stat.french')
          }}</span>
        </div>
        <div class="public-stats__score">
          {{ countTeamScore(statData.team1.score) }} : {{ countTeamScore(statData.team2.score) }}
        </div>
        <div class="public-stats__grid">
          <StatResult :label="$t('stat.team1Label')" :team="statData.team1" :system="statData.system" />
          <StatResult :label="$t('stat.team2Label')" :team="statData.team2" :system="statData.system" />
        </div>
      </div>
    </div>
    <div v-else class="container">
      <div class="is-flex is-justify-content-space-between is-align-items-center">
        <router-link class="navbar-item" to="/">
          <img src="../assets/img/logo.webp" alt="logo" />
        </router-link>
      </div>
      <div class="public-stats__empty">
        <h2>{{ $t('messages.tournamentNotActive') }}</h2>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script>
import StatResult from '@/components/stats/StatResult.vue';
import { statsService } from '@/services/db';
import LanguageSwitcher from '@/components/partials/LanguageSwitcher.vue';
import ThemeSwitcher from '@/components/partials/ThemeSwitcher.vue';
import Footer from '@/components/partials/Footer.vue';

export default {
  name: 'PublicStats',
  components: { Footer, LanguageSwitcher, ThemeSwitcher, StatResult },
  data() {
    return {
      isLoading: false,
      statData: null,
    };
  },
  mounted() {
    this.loadStat();
  },
  methods: {
    parseRef() {
      const refParam = this.$route.query.ref;
      if (!refParam || !refParam.includes('.')) return null;
      const parts = refParam.split('.');
      if (parts.length < 2) return null;
      return { userId: parts[0], statId: parts.slice(1).join('.') };
    },
    async loadStat() {
      const parsed = this.parseRef();
      if (!parsed) return;
      this.isLoading = true;
      try {
        const snapshot = await statsService.get(parsed.userId, parsed.statId);
        if (snapshot.exists()) {
          this.statData = snapshot.val();
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        this.isLoading = false;
      }
    },
    countTeamScore(scores) {
      if (!scores) return 0;
      const arr = Array.isArray(scores) ? scores : Object.values(scores);
      return arr.filter((v) => v !== undefined).reduce((a, b) => a + b, 0);
    },
    formatDate(timestamp) {
      if (!timestamp) return '';
      const d = new Date(timestamp);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    },
  },
};
</script>

<style scoped>
.wrapper {
  position: relative;
  background: var(--color-body-bg);
  min-height: 100vh;
}

.wrapper::before {
  content: '';
  position: fixed;
  inset: 0;
  background: url('@/assets/img/bg-petanque.avif') repeat;
  background-size: 800px;
  opacity: 0.5;
  z-index: 0;
  pointer-events: none;
}

[data-theme='dark'] .wrapper::before {
  display: none;
}

.wrapper > * {
  position: relative;
  z-index: 1;
}

.wrapper .container {
  max-width: 800px !important;
  margin: 0 auto;
  padding: 0 1rem;
  padding-bottom: 2rem;
}

.wrapper .navbar-item:hover {
  background: transparent;
}

.public-stats {
  margin-top: 1rem;
}

.public-stats__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  text-align: center;
}

.public-stats__meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  margin-bottom: 0.75rem;
}

.public-stats__date {
  font-size: 1rem;
  color: var(--color-text-muted);
}

.public-stats__system {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.public-stats__score {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.public-stats__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media screen and (max-width: 768px) {
  .public-stats__grid {
    grid-template-columns: 1fr;
  }
}

.public-stats__empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}
</style>
