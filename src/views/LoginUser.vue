<template>
    <div class="is-flex is-align-items-center is-justify-content-center login-container">
        <router-link to="/" class="button is-light back-link">
            {{ $t('login.back') }}
        </router-link>
        <div class="p-5 login-form">
            <h1 class="has-text-centered mb-2 is-size-3 is-bold">{{ registerShow ? $t('login.registerAccount') : $t('common.loginUser') }}</h1>
            <form action="post">
                <div class="field">
                    <label for="password" class="label">{{ $t('login.email') }}</label>
                    <input type="email" id="email" class="input" :class="{'is-danger': isEmailError}"
                           v-model="email" @keyup.enter.prevent="loginOrRegister">
                    <p v-if="isEmailError" class="help is-danger">{{ $t('login.emailError') }}</p>
                </div>
                <div class="field">
                    <label for="password" class="label">{{ $t('login.password') }}</label>
                    <input type="password" id="password" class="input" :class="{'is-danger': isPasswordError}" autocomplete="off"
                           v-model="password" @keyup.enter.prevent="loginOrRegister">
                    <p v-if="isPasswordError" class="help is-danger">{{ $t('login.passwordError') }}</p>
                </div>
                <div class="field text-center">
                    <button class="button is-info" @click.prevent="loginOrRegister">{{ registerShow ? $t('login.register') : $t('common.loginUser')}}</button>
                </div>
                <div class="has-text-centered" v-if="!registerShow">
                    <a href="#" @click.prevent="resetPassword">{{ $t('login.forgot') }}</a>
                </div>
                <div class="has-text-centered">
                    <a href="#" @click.prevent="registerShow = !registerShow">{{ registerShow ? $t('login.justLogin') : $t('login.newUser')}}</a>
                </div>
            </form>
        </div>
        <Message v-if="message.show"/>
    </div>
</template>

<script>

import {mapMutations, mapState} from "vuex";
import {auth} from "@/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail} from "firebase/auth";
import Message from "@/components/Message";

export default {
    name: 'Login',
    components: {Message},
    data() {
        return {
            email: '',
            password: '',
            isEmailError: false,
            isPasswordError: false,
            registerShow: false,
        }
    },
    computed: {
        ...mapState(['message']),
    },
    methods: {
        ...mapMutations(['loginAdmin', 'loginUser', 'showMessage']),
        async resetPassword() {
            try {
                this.resetErrors();
                await sendPasswordResetEmail(auth, this.email.trim());
                this.showMessage({title: 'Sent!', text: 'Check your email'});
            } catch (error) {
                this.showMessage({title: 'Error!', text: 'Something wrong', type: 'error' });
                this.handleFirebaseErrors(error.code);
            }
        },
        loginOrRegister() {
            this.resetErrors();
            if (this.registerShow) {
                createUserWithEmailAndPassword(auth, this.email.trim(), this.password.trim())
                    .then((data) => {
                        this.loginUser(data.user);
                        this.$router.push('/');
                    })
                    .catch(error => {
                        console.log(error.code);
                        this.handleFirebaseErrors(error.code);
                    });
            } else {
                signInWithEmailAndPassword(auth, this.email.trim(), this.password.trim())
                    .then((data) => {
                        this.loginUser(data.user);
                        this.$router.push('/');
                    })
                    .catch(error => {
                        console.log(error.code);
                        this.handleFirebaseErrors(error.code);
                    });
            }
        },
        resetErrors() {
            this.isEmailError = false;
            this.isPasswordError = false;
        },
        handleFirebaseErrors(error) {
            console.log(error);
            switch (error) {
                case 'auth/missing-email':
                    this.isEmailError = 'Missing email'
                    break
                case 'auth/invalid-email':
                    this.isEmailError = 'Invalid email'
                    break
                case 'auth/user-not-found':
                    this.isPasswordError = 'No account with that email was found'
                    break
                case 'auth/wrong-password':
                    this.isPasswordError = 'Incorrect password'
                    break
                default:
                    this.isPasswordError = 'Email or password was incorrect'
                    break
            }
        },
        login() {
            this.isError = false;
            if (this.password == 'petanque') {
                this.loginAdmin(true);
                localStorage.setItem("isAdmin", "true");
                this.$router.push('/admin');
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
    padding: 1em;
}
@media screen and (min-width: 501px) {
    .login-container {
        background-image: url("../assets/img/login-desktop.jpg");
    }
}
.login-form  {
    width: 500px;
    max-width: 100%;
    border-radius: 0.5rem;
    background-color: #fff;
    box-shadow: 0 0 30px 2px rgba(0,0,0,0.1);
}

.back-link {
    position: fixed;
    left: 1em;
    top: 1em;
}
</style>
