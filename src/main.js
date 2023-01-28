import { createApp } from 'vue'
import App from './App.vue'
import {store} from "./store";
import {createRouter, createWebHashHistory} from 'vue-router';
import Page from "./components/Page";
import Login from "./views/Login";
import Admin from "@/views/Admin";

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
            path: '/login',
            name: 'login',
            component: Login
        },
        {
            path: '/admin',
            name: 'admin',
            component: Admin
        }
    ]
})

app.use(store).use(router).mount('#app')