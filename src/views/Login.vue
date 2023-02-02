<template>
    <div class="is-flex is-align-items-center is-justify-content-center login-container">
        <div class="p-5 login-form">
            <div class="field">
                <label for="password" class="label">Enter password</label>
                <input type="password" id="password" class="input" :class="{'is-danger': isError}" autocomplete="off"
                       v-model="password" @keyup.enter="login">
                <p v-if="isError" class="help is-danger">Password is not correct</p>
            </div>
            <div class="field text-center">
                <button class="button is-info" @click="login">Login as Admin</button>
            </div>
        </div>
    </div>
</template>

<script>

import {mapMutations} from "vuex";

export default {
    name: 'Login',
    data() {
        return {
            password: '',
            isError: false
        }
    },
    methods: {
        ...mapMutations(['loginAdmin']),
        login() {
            this.isError = false;
            if (this.password == '12345') {
                this.loginAdmin(true)
                this.$router.push('/admin')
            } else {
                this.isError = true
            }
        }
    },
}
</script>

<style>
.login-container {
    background: url("../assets/img/login-mobile.jpg") center/cover;
    min-height: 100vh;
}
@media screen and (min-width: 501px) {
    .login-container {
        background-image: url("../assets/img/login-desktop.jpg");
    }
}
.login-form  {
    border-radius: 0.5rem;
    background-color: #fff;
    box-shadow: 0 0 30px 2px rgba(0,0,0,0.1);
}
</style>
