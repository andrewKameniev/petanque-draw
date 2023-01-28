import Login from "@/views/Login";
import Page from "@/components/Page";
import {createWebHashHistory} from "vue-router";

export default {
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
        }
    ]
}