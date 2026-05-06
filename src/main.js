import { createApp } from 'vue'
import App from './App.vue'
import {store} from "./store";
// import './registerServiceWorker'
import {createRouter, createWebHashHistory} from 'vue-router';
import Public from "@/views/Public";
import LoginUser from "@/views/LoginUser";
import Help from "@/components/Help.vue";
import Stats from "@/views/Stats.vue";
import Training from "@/views/Training.vue";
import Draw from "@/components/Draw.vue";
import i18n from "@/i18n";

const app = createApp(App);
const router = createRouter({
    history: createWebHashHistory(),
    mode: 'hash',
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

app.use(store).use(router).use(i18n).mount('#app');

