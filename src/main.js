import { createApp } from 'vue'
import App from './App.vue'
import {store} from "./store";
import './registerServiceWorker'
import {createRouter, createWebHashHistory} from 'vue-router';
import Page from "./components/Page";
import Login from "./views/Login";
import Admin from "@/views/Admin";
import Public from "@/views/Public";
import { getMessaging } from "firebase/messaging";

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
            path: '/login',
            name: 'login',
            component: Login
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
app.config.globalProperties.$messaging = getMessaging;


app.use(store).use(router).mount('#app');

