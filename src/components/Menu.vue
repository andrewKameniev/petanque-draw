<template>
    <div class="menu-wrapper" :class="{active: active}" @click.self="$emit('closeMenu')">
        <aside class="menu">
            <div class="has-text-right">
                <a href="#" class="delete is-large" @click.prevent="$emit('closeMenu')"></a>
            </div>
            <p class="menu-label is-hidden-desktop" v-if="tournaments.length > 1">
                Active tournaments
            </p>
            <div class="navbar-item has-dropdown is-hoverable is-hidden-desktop" v-if="tournaments.length > 1">
                <a class="navbar-link">
                    Choose
                </a>
                <div class="navbar-dropdown" v-if="tournaments.length > 1">
                    <a class="navbar-item" :class="{'is-active': index === currentTournamentIndex}"
                       v-for="(item, index) in tournaments" :key="index"
                       @click.prevent="chooseTournament(index)">
                        {{item.name || 'Tournament ' + tournamentNames[index]}}
                    </a>
                </div>
            </div>
            <p class="menu-label" v-if="savedTournaments.length">
                Saved tournaments
            </p>
            <ul class="menu-list">
                <li v-for="(item, index) in savedTournaments" :key="index">
                    <a href="#" @click.prevent="$emit('openSavedTournament', index)">{{ item.name }}</a>
                </li>
            </ul>
            <p class="menu-label">
                Info
            </p>
            <ul class="menu-list">
                <li><a href="https://en.wikipedia.org/wiki/Swiss-system_tournament" target="_blank">Swiss system</a></li>
                <li><a href="#" @click.prevent="$emit('openHelp')">How to use (in progress)?</a></li>
            </ul>
            <p class="menu-label">
                Useful Links
            </p>
            <ul class="menu-list">
                <li><a href="http://portal.petanque.org.ua/" target="_blank">Portal</a></li>
            </ul>
            <p class="menu-label">
                Admin section
            </p>
            <div>
                <button v-if="isAdmin" class="button is-light" @click="logout">Logout</button>
                <router-link v-else to="/login" class="button is-light">
                    Log in
                </router-link>
            </div>
        </aside>
    </div>
</template>

<script>
import {mapMutations, mapState} from "vuex";
import {tournamentNames} from "../helpers";

export default {
    name: 'Menu',
    data() {
        return {
            tournamentNames
        }
    },
    props: ['active'],
    computed: mapState(['tournaments', 'currentTournamentIndex', 'savedTournaments', 'isAdmin']),
    methods: {
        ...mapMutations(['setActiveTournament', 'loginAdmin']),
        chooseTournament(index) {
            this.setActiveTournament(index);
            this.$emit('closeMenu')

        },
        logout() {
            this.loginAdmin(false);
            this.$router.push('/')
        }
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