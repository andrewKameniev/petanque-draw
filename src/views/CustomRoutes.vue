<template>
  <div class="wrapper">
    <Navbar @open-menu="menuOpen = !menuOpen" />
    <Menu :active="menuOpen" @closeMenu="menuOpen = false" />
    <div class="container custom-routes">
      <h1 class="custom-routes__heading">{{ $t('common.customRoutes') }}</h1>

      <!-- Create form -->
      <div class="custom-routes__form">
        <div class="custom-routes__field">
          <label class="custom-routes__label">{{ $t('common.slugLabel') }}</label>
          <input
            v-model="newSlug"
            class="custom-routes__input"
            :placeholder="$t('common.slugPlaceholder')"
            @input="newSlug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '')"
          />
          <span v-if="newSlug && !slugValid" class="custom-routes__error">
            {{ $t('common.slugInvalid') }}
          </span>
        </div>
        <div class="custom-routes__field">
          <label class="custom-routes__label">{{ $t('common.routeTitle') }}</label>
          <input v-model="newTitle" class="custom-routes__input" :placeholder="$t('common.routeTitlePlaceholder')" />
        </div>
        <button class="button custom-routes__btn" :disabled="!canCreate" @click="createRoute">
          <Plus :size="18" />
          {{ $t('common.createRoute') }}
        </button>
      </div>

      <!-- Routes list -->
      <div v-if="isLoading" class="custom-routes__loading">
        <div class="custom-routes__spinner"></div>
      </div>

      <div v-else-if="routes.length === 0" class="custom-routes__empty">{{ $t('common.customRoutes') }} — 0</div>

      <div v-else class="custom-routes__list">
        <div v-for="route in routes" :key="route.slug" class="custom-routes__item">
          <div class="custom-routes__item-qr" @click="expandedQr = expandedQr === route.slug ? null : route.slug">
            <QrcodeVue :value="getFullUrl(route.slug)" :size="expandedQr === route.slug ? 280 : 120" level="H" />
          </div>

          <div class="custom-routes__item-body">
            <div class="custom-routes__item-header">
              <span class="custom-routes__item-title">{{ route.title }}</span>
              <code class="custom-routes__item-slug">/public/{{ route.slug }}</code>
            </div>

            <div class="custom-routes__item-link">
              <div class="select is-fullwidth">
                <select :value="route.ref || ''" @change="linkTournament(route.slug, $event.target.value)">
                  <option value="">{{ $t('common.selectTournament') }}</option>
                  <option v-for="t in tournamentOptions" :key="t.id" :value="t.ref">
                    {{ t.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="custom-routes__item-actions">
              <button class="custom-routes__action" @click="copyUrl(route.slug)" :title="$t('common.copyUrl')">
                <Copy :size="16" />
                <span>{{ $t('common.copyUrl') }}</span>
              </button>
              <button
                class="custom-routes__action custom-routes__action--danger"
                @click="deleteRoute(route.slug)"
                :title="$t('common.deleteRoute')"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue';
import Menu from '@/components/Menu.vue';
import QrcodeVue from 'qrcode.vue';
import { mapState } from 'pinia';
import { useMainStore } from '@/stores/main';
import { customRoutesService } from '@/services/db';
import { isValidSlug, copyContent } from '@/helpers';
import { Plus, Copy, Trash2 } from 'lucide-vue-next';

export default {
  name: 'CustomRoutes',
  components: { Navbar, Menu, QrcodeVue, Plus, Copy, Trash2 },
  data() {
    return {
      menuOpen: false,
      isLoading: true,
      routes: [],
      newSlug: '',
      expandedQr: null,
      newTitle: '',
    };
  },
  computed: {
    ...mapState(useMainStore, ['user', 'userTournamentMap', 'tournaments']),
    slugValid() {
      return isValidSlug(this.newSlug);
    },
    canCreate() {
      return this.slugValid && this.newTitle.trim().length > 0;
    },
    tournamentOptions() {
      if (!this.userTournamentMap) return [];
      return Object.entries(this.userTournamentMap)
        .filter(([id, entry]) => entry.role === 'owner' && entry.status !== 'archived' && this.tournaments[id])
        .map(([id]) => ({
          id,
          name: this.tournaments[id].name || this.userTournamentMap[id].name,
          ref: `${this.user.uid}.${parseInt(id).toString(36)}`,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  },
  async mounted() {
    await this.loadRoutes();
  },
  methods: {
    async loadRoutes() {
      this.isLoading = true;
      try {
        const snapshot = await customRoutesService.getAll();
        if (snapshot.exists()) {
          const all = snapshot.val();
          this.routes = Object.entries(all)
            .filter(([, data]) => data.createdBy === this.user.uid)
            .map(([slug, data]) => ({ slug, ...data }))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        } else {
          this.routes = [];
        }
      } catch {
        this.routes = [];
      }
      this.isLoading = false;
    },
    async createRoute() {
      if (!this.canCreate) return;
      const slug = this.newSlug.trim();
      const existing = await customRoutesService.get(slug);
      if (existing.exists()) {
        const store = useMainStore();
        store.showMessage({ title: this.$t('messages.error'), text: this.$t('common.slugTaken'), type: 'error' });
        return;
      }
      await customRoutesService.create(slug, {
        ref: null,
        title: this.newTitle.trim(),
        createdBy: this.user.uid,
        createdAt: Date.now(),
      });
      this.newSlug = '';
      this.newTitle = '';
      const store = useMainStore();
      store.showMessage({ title: this.$t('messages.success'), text: this.$t('common.routeCreated'), type: 'success' });
      await this.loadRoutes();
    },
    async linkTournament(slug, ref) {
      await customRoutesService.update(slug, { ref: ref || null });
      await this.loadRoutes();
    },
    async deleteRoute(slug) {
      if (!window.confirm(this.$t('common.deleteRouteConfirm'))) return;
      await customRoutesService.remove(slug);
      const store = useMainStore();
      store.showMessage({ title: this.$t('messages.success'), text: this.$t('common.routeDeleted'), type: 'success' });
      await this.loadRoutes();
    },
    getFullUrl(slug) {
      const domain = import.meta.env.PROD ? '/petanque-draw/#/' : '/#/';
      return `${window.location.origin}${domain}public/${slug}`;
    },
    copyUrl(slug) {
      copyContent(this.getFullUrl(slug));
      const store = useMainStore();
      store.showMessage({ title: this.$t('messages.success'), text: this.$t('common.urlCopied'), type: 'success' });
    },
  },
};
</script>

<style scoped>
.custom-routes {
  padding: 20px;
  max-width: 700px;
  margin: 0 auto;
}

.custom-routes__heading {
  color: var(--color-text);
  font-size: 1.4rem;
  margin: 0 0 24px;
}

.custom-routes__form {
  background: var(--color-surface);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.custom-routes__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.custom-routes__label {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
}

.custom-routes__input {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.95rem;
}

.custom-routes__input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.custom-routes__error {
  color: var(--color-danger);
  font-size: 0.8rem;
}

.custom-routes__btn {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.custom-routes__loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.custom-routes__spinner {
  width: 32px;
  height: 32px;
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

.custom-routes__empty {
  color: var(--color-text-secondary);
  text-align: center;
  padding: 40px;
}

.custom-routes__list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.custom-routes__item {
  background: var(--color-surface);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.custom-routes__item-qr {
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 8px;
  padding: 8px;
  background: #fff;
  transition: transform 0.2s;
}

.custom-routes__item-qr:hover {
  transform: scale(1.05);
}

.custom-routes__item-body {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.custom-routes__item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.custom-routes__item-title {
  color: var(--color-text);
  font-weight: 600;
  font-size: 1.05rem;
}

.custom-routes__item-slug {
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  background: var(--color-bg);
  padding: 2px 8px;
  border-radius: 4px;
  word-break: break-all;
}

.custom-routes__item-link {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-routes__item-link .select,
.custom-routes__item-link select {
  max-width: 100%;
}

.custom-routes__item-link .select:not(.is-multiple, .is-loading)::after {
  border-color: var(--color-text-secondary);
}

.custom-routes__item-link .select:not(.is-multiple, .is-loading):hover::after {
  border-color: var(--color-primary);
}

.custom-routes__item-actions {
  display: flex;
  gap: 8px;
}

.custom-routes__action {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 6px 10px;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;
}

.custom-routes__action:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.custom-routes__action--danger:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
}

@media (max-width: 500px) {
  .custom-routes__item {
    flex-direction: column;
    align-items: center;
  }
}
</style>
