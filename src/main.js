import { createApp } from 'vue'
import App from './App.vue'
import {store} from "./store";
import {createRouter, createWebHashHistory} from 'vue-router';
import Public from "@/views/Public.vue";
import Help from "@/components/Help.vue";
import Stats from "@/views/Stats.vue";
import Training from "@/views/Training.vue";
import Draw from "@/components/Draw.vue";
import i18n from "@/i18n";

const app = createApp(App);
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
        }
    ]
})

router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !store.state.user) {
        next('/');
    } else {
        next();
    }
});

app.use(store).use(router).use(i18n).mount('#app');

