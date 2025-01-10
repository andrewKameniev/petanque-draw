<template>
    <div class="menu-wrapper" :class="{active: active}" @click.self="$emit('closeMenu')">
        <aside class="menu">
            <div class="has-text-right">
                <a href="#" class="delete is-large" @click.prevent="$emit('closeMenu')"></a>
            </div>
            <LanguageSwitcher class="is-hidden-desktop"/>
            <p class="menu-label is-hidden-desktop" v-if="Object.keys(tournaments).length > 1 && $route.name !== 'Statistics'">
                {{ $t('common.activeTournaments') }}
            </p>
            <div class="navbar-item has-dropdown is-hoverable is-hidden-desktop" v-if="Object.keys(tournaments).length > 1 && $route.name !== 'Statistics'">
                <a class="navbar-link">
                    {{ $t('common.choose') }}
                </a>
                <div class="navbar-dropdown" v-if="Object.keys(tournaments).length > 1">
                    <a class="navbar-item" :class="{'is-active': index === currentTournamentIndex}"
                       v-for="(item, index) in tournaments" :key="index"
                       @click.prevent="chooseTournament(index)">
                        {{item.name || 'Tournament ' + tournamentNames[index]}}
                    </a>
                </div>
            </div>
            <div v-if="$route.name !== 'Statistics'">
                <p class="menu-label" v-if="Object.keys(savedTournaments).length">
                    {{ $t('common.saved') }}
                </p>
                <ul class="menu-list">
                    <li v-for="(item, index) in savedTournaments" :key="index">
                        <a href="#" @click.prevent="$emit('openSavedTournament', index)">{{ item.name }}</a>
                    </li>
                </ul>
            </div>
            <p class="menu-label">
                {{ $t('common.info') }}
            </p>
            <ul class="menu-list">
                <li><a href="https://en.wikipedia.org/wiki/Swiss-system_tournament" target="_blank">{{ $t('common.swissSystem') }}</a></li>
                <li><router-link to="doc">{{ $t('common.howUse') }}</router-link></li>
            </ul>
            <p class="menu-label">
                {{ $t('common.useful') }}
            </p>
            <ul class="menu-list">
                <li><a href="http://portal.petanque.org.ua/" target="_blank">{{ $t('common.portal') }}</a></li>
                <li><router-link to="/">Draw</router-link></li>
                <li><router-link to="stats">Stats</router-link></li>
                <li><router-link to="training">Training</router-link></li>
            </ul>
            <p class="menu-label is-invisible-desktop">
                {{ $t('common.adminSection') }}
            </p>
            <div class="is-invisible-desktop">
                <div class="mb-3">
                    <button v-if="isAdmin" class="button is-light" @click="logout">{{ $t('common.logoutAdmin') }}</button>
                    <router-link v-else to="/login" class="button is-light">
                        {{ $t('common.loginAdmin') }}
                    </router-link>
                    </div>
                <div>
                    <button v-if="user" class="button is-light" @click="signOutUser">{{ $t('common.logoutUser') }}</button>
                    <router-link v-else to="/login-user" class="button is-light">
                        {{ $t('common.loginUser') }}
                    </router-link>
                </div>
            </div>
        </aside>
    </div>
</template>

<script>
import {mapMutations, mapState} from "vuex";
import {tournamentNames} from "../helpers";
import {signOut} from "firebase/auth";
import {auth} from "@/firebase";
import LanguageSwitcher from "@/components/partials/LanguageSwitcher.vue";

export default {
    name: 'Menu',
    components: {LanguageSwitcher},
    data() {
        return {
            tournamentNames
        }
    },
    props: ['active'],
    computed: mapState(['tournaments', 'currentTournamentIndex', 'savedTournaments', 'isAdmin', 'user']),
    methods: {
        ...mapMutations(['setActiveTournament', 'loginAdmin']),
        chooseTournament(index) {
            this.setActiveTournament(index);
            this.$emit('closeMenu')

        },
        logout() {
            this.loginAdmin(false);
            this.$router.push('/')
        },
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
    },
}
</script>


<style scoped>
    .menu {
        position: absolute;
        left: 0;
        top: 0;
        background: #fff;
        width: 300px;
        max-width: 90%;
        height: 100vh;
        overflow: auto;
        padding: 20px;
        transition: all 0.3s;
        transform: translateX(-100%);
        box-shadow: 0 0 10px 0 rgba(0,0,0,0.3);
    }
    .menu-wrapper {
        position: fixed;
        z-index: 100;
        opacity: 0;
        visibility: hidden;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        transition: all 0.3s;
    }
    .menu-wrapper.active {
        background: rgba(0,0,0,0.4);
        opacity: 1;
        visibility: visible;
    }
    .active .menu {
        transform: none;
    }
</style>