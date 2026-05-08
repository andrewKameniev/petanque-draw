<template>
    <div v-if="isLoading" class="gooey">
        <span class="dot"></span>
        <div class="dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    </div>
    <div v-else class="wrapper">
        <Navbar @open-menu="menuOpen = !menuOpen"/>
        <div class="container">
            <div class="columns">
                <div class="column" v-if="user">
                    <Tournament v-if="tournament"/>
                </div>
                <div v-else class="login-section">
                    <!-- Forgot password form -->
                    <div class="login-card" v-if="forgotShow">
                        <div class="login-card__logo">
                            <picture>
                                <source srcset="@/assets/img/logo.webp" type="image/webp">
                                <img src="@/assets/img/logo.png" alt="Petanque Draw">
                            </picture>
                        </div>
                        <h2 class="login-card__title">{{ $t('login.forgot') }}</h2>
                        <p class="login-card__subtitle">{{ $t('login.forgotHint') }}</p>
                        <form @submit.prevent="resetPassword">
                            <div class="login-field">
                                <input type="email" class="login-input" :class="{'login-input--error': isEmailError}"
                                       :placeholder="$t('login.emailPlaceholder')" v-model="email">
                                <p v-if="isEmailError" class="login-error">{{ isEmailError }}</p>
                            </div>
                            <button type="submit" class="login-btn">{{ $t('login.resetPassword') }}</button>
                        </form>
                        <div class="login-card__footer">
                            <a href="#" @click.prevent="forgotShow = false; resetErrors()" class="login-link">
                                ← {{ $t('login.backToLogin') }}
                            </a>
                        </div>
                    </div>

                    <!-- Login / Register form -->
                    <div class="login-card" v-else>
                        <div class="login-card__logo">
                            <picture>
                                <source srcset="@/assets/img/logo.webp" type="image/webp">
                                <img src="@/assets/img/logo.png" alt="Petanque Draw">
                            </picture>
                        </div>
                        <h2 class="login-card__title">
                            {{ registerShow ? $t('login.registerTitle') : $t('login.loginTitle') }}
                        </h2>
                        <form @submit.prevent="loginOrRegister">
                            <div class="login-field">
                                <input type="email" class="login-input" :class="{'login-input--error': isEmailError}"
                                       :placeholder="$t('login.emailPlaceholder')" v-model="email">
                                <p v-if="isEmailError" class="login-error">{{ isEmailError }}</p>
                            </div>
                            <div class="login-field">
                                <input type="password" class="login-input" :class="{'login-input--error': isPasswordError}"
                                       :placeholder="$t('login.passwordPlaceholder')" autocomplete="off" v-model="password">
                                <p v-if="isPasswordError" class="login-error">{{ isPasswordError }}</p>
                            </div>
                            <div class="login-field" v-if="registerShow">
                                <input type="password" class="login-input" :class="{'login-input--error': isConfirmError}"
                                       :placeholder="$t('login.confirmPlaceholder')" autocomplete="off" v-model="passwordConfirm">
                                <p v-if="isConfirmError" class="login-error">{{ isConfirmError }}</p>
                            </div>
                            <button type="submit" class="login-btn">
                                {{ registerShow ? $t('login.register') : $t('login.loginBtn') }}
                            </button>
                        </form>
                        <div class="login-card__forgot" v-if="!registerShow">
                            <a href="#" @click.prevent="forgotShow = true; resetErrors()" class="login-link login-link--subtle">
                                {{ $t('login.forgot') }}
                            </a>
                        </div>
                        <div class="login-card__footer">
                            <span class="login-card__footer-text">{{ registerShow ? $t('login.hasAccount') : $t('login.noAccount') }}</span>
                            <a href="#" @click.prevent="registerShow = !registerShow; resetErrors()" class="login-link login-link--bold">
                                {{ registerShow ? $t('login.loginBtn') : $t('login.register') }}
                            </a>
                        </div>
                    </div>
                </div>
                <div class="column is-one-third is-hidden-touch" v-if="user">
                    <img src="@/assets/img/bg.jpg" srcset="@/assets/img/bg.avif, @/assets/img/bg.jpg" alt="Petanque in Alps" class="image">
                </div>
            </div>
            <hr v-if="user">
            <button v-if="user" class="button is-info" @click="addTournament">{{ $t('common.addTournament') }}</button>
            <Message v-if="message.show"/>
            <Menu :active="menuOpen"
                  @closeMenu="menuOpen = false"
                  @openSavedTournament="openSavedTournament"/>
            <SavedTournamentModal v-if="showSavedTournament" :tournament="savedTournaments[savedTournamentsActive]"
                                  @close-modal="closeTournamentModal"/>
            <Help v-if="helpOpen" @close-modal="helpOpen = false"/>
        </div>
        <Footer/>
    </div>
</template>

<script>
import Message from './Message.vue';
import Menu from './Menu';
import SavedTournamentModal from './partials/SavedTournamentModal';
import Tournament from "./Tournament";
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main"
import Navbar from "./Navbar";
import Help from "./Help";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase";
import Footer from "@/components/partials/Footer.vue";

export default {
    name: 'Draw',
    data() {
        return {
            showSaveTournament: false,
            menuOpen: false,
            showSavedTournament: false,
            helpOpen: false,
            savedTournamentsActive: false,
            isLoading: false,
            email: '',
            password: '',
            passwordConfirm: '',
            isEmailError: false,
            isPasswordError: false,
            isConfirmError: false,
            registerShow: false,
            forgotShow: false,
        }
    },
    mounted() {
        this.isLoading = true
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.loginUser(user);
                this.getTournaments();
            } else {
                this.loginUser(false);
            }
            this.isLoading = false
        });
    },
    methods: {
        ...mapActions(useMainStore, ['setActiveTournament', 'addTournament', 'loginUser', 'getTournaments', 'showMessage']),
        openSavedTournament(index) {
            this.savedTournamentsActive = index;
            this.menuOpen = false;
            this.openTournamentModal();
        },
        openTournamentModal() {
            this.showSavedTournament = true;
            document.querySelector('html').classList.add('is-clipped');
        },
        closeTournamentModal() {
            this.showSavedTournament = false;
            document.querySelector('html').classList.remove('is-clipped');
        },
        async resetPassword() {
            try {
                this.resetErrors();
                await sendPasswordResetEmail(auth, this.email.trim());
                this.showMessage({title: this.$t('messages.sent'), text: this.$t('messages.checkEmail')});
            } catch (error) {
                this.showMessage({title: this.$t('messages.error'), text: this.$t('messages.somethingWrong'), type: 'error'});
                this.handleFirebaseErrors(error.code);
            }
        },
        loginOrRegister() {
            this.resetErrors();
            if (this.password.trim().length < 6) {
                this.isPasswordError = this.$t('messages.weakPassword');
                return;
            }
            if (this.registerShow) {
                if (this.password.trim() !== this.passwordConfirm.trim()) {
                    this.isConfirmError = this.$t('messages.passwordMismatch');
                    return;
                }
                createUserWithEmailAndPassword(auth, this.email.trim(), this.password.trim())
                    .then((data) => {
                        this.loginUser(data.user);
                        this.$store.dispatch('getTournaments');
                    })
                    .catch(error => {
                        this.handleFirebaseErrors(error.code);
                    });
            } else {
                signInWithEmailAndPassword(auth, this.email.trim(), this.password.trim())
                    .then((data) => {
                        this.loginUser(data.user);
                        this.$store.dispatch('getTournaments');
                    })
                    .catch(error => {
                        this.handleFirebaseErrors(error.code);
                    });
            }
        },
        resetErrors() {
            this.isEmailError = false;
            this.isPasswordError = false;
            this.isConfirmError = false;
        },
        handleFirebaseErrors(error) {
            switch (error) {
                case 'auth/missing-email':
                    this.isEmailError = this.$t('messages.missingEmail')
                    break
                case 'auth/invalid-email':
                    this.isEmailError = this.$t('messages.invalidEmail')
                    break
                case 'auth/user-not-found':
                    this.isPasswordError = this.$t('messages.noAccount')
                    break
                case 'auth/wrong-password':
                    this.isPasswordError = this.$t('messages.incorrectPassword')
                    break
                case 'auth/weak-password':
                    this.isPasswordError = this.$t('messages.weakPassword')
                    break
                default:
                    this.isPasswordError = this.$t('messages.incorrectPassword')
                    break
            }
        },
    },
    computed: {
        ...mapState(useMainStore, ['message', 'tournaments', 'currentTournamentIndex', 'savedTournaments', 'user', 'currentTournament']),
        tournament() {
            return this.currentTournament
        },
    },
    components: {
        Footer,
        Help,
        Navbar,
        Tournament,
        SavedTournamentModal,
        Menu,
        Message,
    }
}

</script>


<style>
.menu-button {
    position: fixed;
    left: 0;
    top: 0;
    padding: 10px;
    border-radius: 0 0 5px 0;
}
</style>
