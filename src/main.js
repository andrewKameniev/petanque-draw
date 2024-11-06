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

const app = createApp(App);
const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'public',
            component: Page
        },
        {
            path: '/tournaments/:id',
            name: 'view',
            component: Public
        },
        {
            path: '/show/',
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
    locale: 'ua',
    fallbackLocale: 'en',
    messages: languages
})

app.use(store).use(router).use(i18n).mount('#app');

