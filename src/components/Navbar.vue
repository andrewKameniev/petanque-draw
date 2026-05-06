<template>
    <nav class="navbar" role="navigation" aria-label="main navigation">
        <div class="navbar-brand">
            <a class="navbar-item" href="https://andrewkameniev.github.io/petanque-draw/">
                <picture>
                    <source srcset="../assets/img/logo.webp" type="image/webp">
                    <source srcset="../assets/img/logo.png" type="image/jpeg">
                    <img src="../assets/img/logo.png" alt="logo">
                </picture>
            </a>

            <a role="button" class="navbar-burger" @click="$emit('open-menu')" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
            </a>
        </div>

        <div id="navbarBasicExample" class="navbar-menu">
            <div class="navbar-start">
                <a class="navbar-item" @click="$emit('open-menu')">
                    {{ $t('common.menu') }}
                </a>

                <div class="navbar-item has-dropdown is-hoverable" v-if="user && Object.keys(tournaments).length > 1 && $route.name !== 'Statistics'"  >
                    <a class="navbar-link">
                        {{ $t('common.activeTournaments') }}
                    </a>

                    <div class="navbar-dropdown" v-if="Object.keys(tournaments).length > 1">
                        <a class="navbar-item" :class="{'is-active': item.id === currentTournamentIndex}"
                           v-for="item in tournaments" :key="item.id"
                           @click.prevent="setActiveTournament(item.id)">
                            {{ item.name }}
                        </a>
                    </div>
                </div>
            <LanguageSwitcher/>
            </div>
            <div class="navbar-end">
                <div class="navbar-item">
                    <div class="buttons">
                        <button v-if="user" class="button is-light" @click="signOutUser">{{ user.email }}</button>
                        <router-link v-else to="/login-user" class="button is-light">
                            {{ $t('common.loginUser') }}
                        </router-link>
                    </div>
                </div>
            </div>
        </div>
    </nav>
</template>

<script>
import {mapMutations, mapState} from "vuex";
import { signOut } from "firebase/auth";
import {auth} from "@/firebase";
import LanguageSwitcher from "@/components/partials/LanguageSwitcher.vue";

export default {
    name: "Navbar",
    components: {LanguageSwitcher},
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex', 'isAdmin', 'user']),
        tournament() {
            return this.tournaments[this.currentTournamentIndex]
        },
    },
    methods: {
        ...mapMutations(['setActiveTournament', 'loginUser']),
        signOutUser () {
            signOut(auth)
                .then(() => {
                    this.loginUser(false);
                    this.$router.push('/');
                })
                .catch((error) => {
                    console.error("Error during sign out:", error);
                });
        },
    }
}
</script>

<style scoped>

</style>