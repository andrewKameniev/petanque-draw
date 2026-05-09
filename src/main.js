import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import {createRouter, createWebHashHistory} from 'vue-router';
import Public from "@/views/Public.vue";
import Help from "@/components/Help.vue";
import Stats from "@/views/Stats.vue";
import Training from "@/views/Training.vue";
import Archived from "@/views/Archived.vue";
import Draw from "@/components/Draw.vue";
import i18n from "@/i18n";
import {useMainStore} from "@/stores/main";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";

const app = createApp(App);
const pinia = createPinia();
const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'public',
            component: Draw
        },
        {
            path: '/tournament',
            name: 'view',
            component: Public
        },
        {
            path: '/show',
            redirect: to => {
                const { user, tournament } = to.query;
                if (user && tournament) {
                    const ref = `${user}.${parseInt(tournament).toString(36)}`;
                    return { path: '/tournament', query: { ref } };
                }
                return '/';
            }
        },
        {
            path: '/login-user',
            redirect: '/'
        },
        {
            path: '/doc',
            name: 'Documentation',
            component: Help
        },
        {
            path: '/stats',
            name: 'Statistics',
            component: Stats,
            meta: { requiresAuth: true }
        },
        {
            path: '/training',
            name: 'Training',
            component: Training,
            meta: { requiresAuth: true }
        },
        {
            path: '/archived',
            name: 'Archived',
            component: Archived,
            meta: { requiresAuth: true }
        }
    ]
})

app.use(pinia).use(router).use(i18n);

const authReadyPromise = auth.authStateReady().then(async () => {
    const store = useMainStore();
    const user = auth.currentUser;
    store.loginUser(user || false);
    if (user) await store.getTournaments();
});

onAuthStateChanged(auth, async (user) => {
    const store = useMainStore();
    store.loginUser(user || false);
    if (user) await store.getTournaments();
});

router.beforeEach(async (to) => {
    if (to.meta.requiresAuth) {
        await authReadyPromise;
        const store = useMainStore();
        if (!store.user) return '/';
    }
});

authReadyPromise.then(() => app.mount('#app'));

