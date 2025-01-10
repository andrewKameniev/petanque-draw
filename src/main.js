import { createApp } from 'vue'
import App from './App.vue'
import {store} from "./store";
// import './registerServiceWorker'
import { createI18n } from 'vue-i18n'
import {createRouter, createWebHashHistory} from 'vue-router';
import Page from "./components/Page";
import Login from "./views/Login";
import Admin from "@/views/Admin";
import Public from "@/views/Public";
import LoginUser from "@/views/LoginUser";
import languages from "@/languages";
import Help from "@/components/Help.vue";
import Stats from "@/views/Stats.vue";
import Training from "@/views/Training.vue";

const app = createApp(App);
const router = createRouter({
    history: createWebHashHistory(),
    mode: 'hash',
    routes: [
        {
            path: '/',
            name: 'public',
            component: Page
        },
        {
            path: '/show',
            name: 'view',
            component: Public
        },
        {
            path: '/login',
            name: 'login',
            component: Login
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
        },
        {
            path: '/admin',
            name: 'admin',
            component: Admin,
            beforeEnter: (to, from, next) =>{
                if (store.state.isAdmin){
                    next()
                } else{
                    next({name: 'public'})
                }
            }
        }
    ]
})
const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'ua',
    messages: languages
})

app.use(store).use(router).use(i18n).mount('#app');

