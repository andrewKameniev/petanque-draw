import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { createRouter, createWebHashHistory } from 'vue-router';
const Public = () => import('@/views/Public.vue');
const PublicStats = () => import('@/views/PublicStats.vue');
const TvDashboard = () => import('@/views/TvDashboard.vue');
const Help = () => import('@/components/Help.vue');
const Docs = () => import('@/views/Docs.vue');
const Stats = () => import('@/views/Stats.vue');
const Training = () => import('@/views/Training.vue');
const Archived = () => import('@/views/Archived.vue');
const Draw = () => import('@/components/Draw.vue');
const PublicSlug = () => import('@/views/PublicSlug.vue');
const CustomRoutes = () => import('@/views/CustomRoutes.vue');
import i18n, { loadLocaleModule } from '@/i18n';
import { useMainStore } from '@/stores/main';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';

const app = createApp(App);
const pinia = createPinia();
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'public',
      component: Draw,
    },
    {
      path: '/tournament',
      name: 'view',
      component: Public,
    },
    {
      path: '/tv',
      name: 'tv',
      component: TvDashboard,
    },
    {
      path: '/show',
      redirect: (to) => {
        const { user, tournament } = to.query;
        if (user && tournament) {
          const ref = `${user}.${parseInt(tournament).toString(36)}`;
          return { path: '/tournament', query: { ref } };
        }
        return '/';
      },
    },
    {
      path: '/login-user',
      redirect: '/',
    },
    {
      path: '/doc',
      name: 'Documentation',
      component: Help,
    },
    {
      path: '/docs',
      name: 'Docs',
      component: Docs,
    },
    {
      path: '/stats',
      name: 'Statistics',
      component: Stats,
      meta: { requiresAuth: true },
    },
    {
      path: '/stats/share',
      name: 'PublicStats',
      component: PublicStats,
    },
    {
      path: '/training',
      name: 'Training',
      component: Training,
      meta: { requiresAuth: true },
    },
    {
      path: '/archived',
      name: 'Archived',
      component: Archived,
      meta: { requiresAuth: true },
    },
    {
      path: '/public/:slug',
      name: 'PublicSlug',
      component: PublicSlug,
    },
    {
      path: '/routes',
      name: 'CustomRoutes',
      component: CustomRoutes,
      meta: { requiresAuth: true },
    },
  ],
});

app.use(pinia).use(router).use(i18n);

const publicRoutes = ['/tournament', '/tv', '/stats/share', '/public'];
function isPublicRoute(path) {
  return publicRoutes.some((route) => path.startsWith(route));
}

const authReadyPromise = auth.authStateReady().then(async () => {
  const store = useMainStore();
  const user = auth.currentUser;
  store.loginUser(user || false);
  if (user && !isPublicRoute(router.currentRoute.value.path)) {
    await store.getTournaments();
  }
});

onAuthStateChanged(auth, async (user) => {
  const store = useMainStore();
  store.loginUser(user || false);
  if (user && !isPublicRoute(router.currentRoute.value.path)) {
    await store.getTournaments();
  }
});

const routeLocaleMap = {
  Statistics: ['stat'],
  PublicStats: ['stat'],
  Documentation: ['help'],
  Docs: ['docs'],
  Training: ['training', 'stat'],
};

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth || to.path === '/') {
    await authReadyPromise;
    const store = useMainStore();
    if (!store.user) {
      if (to.meta.requiresAuth) return '/';
    } else if (!Object.keys(store.tournaments).length) {
      await store.getTournaments();
    }
  }
  const modules = routeLocaleMap[to.name];
  if (modules) await Promise.all(modules.map((m) => loadLocaleModule(m)));
});

const zoomableRoutes = ['Statistics', 'PublicStats', 'Training'];
router.afterEach((to) => {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.content = zoomableRoutes.includes(to.name)
      ? 'width=device-width,initial-scale=1.0'
      : 'width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no';
  }
});

authReadyPromise.then(() => app.mount('#app'));
