import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
// import './registerServiceWorker'
import {createRouter, createWebHashHistory} from 'vue-router';
import Public from "@/views/Public.vue";
import LoginUser from "@/views/LoginUser.vue";
import Help from "@/components/Help.vue";
import Stats from "@/views/Stats.vue";
import Training from "@/views/Training.vue";
import Draw from "@/components/Draw.vue";
import i18n from "@/i18n";

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
            path: '/show',
            name: 'view',
            component: Public
        },
        {
            path: '/login-user',
            name: 'loginUser',
            component: LoginUser
        },
        {
            path: '/doc',
            name: 'Documentation',
            component: Help
        },
        {
            path: '/stats',
            name: 'Statistics',
            component: Stats
        },
        {
            path: '/training',
            name: 'Training',
            component: Training
        }
    ]
})

app.use(pinia).use(router).use(i18n).mount('#app');

