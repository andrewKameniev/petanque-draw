<template>
    <nav class="navbar" role="navigation" aria-label="main navigation">
        <div class="navbar-brand">
            <a class="navbar-item" href="/">
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
                    Menu
                </a>

                <div class="navbar-item has-dropdown is-hoverable" v-if="tournaments.length > 1">
                    <a class="navbar-link">
                        Active tournaments
                    </a>

                    <div class="navbar-dropdown" v-if="tournaments.length > 1">
                        <a class="navbar-item" :class="{'is-active': index === currentTournamentIndex}" v-for="(item, index) in tournaments" :key="index"
                           @click.prevent="setActiveTournament(index)">
                            {{ item.name }}
                        </a>
                    </div>
                </div>
            </div>
            <div class="navbar-end">
                <div class="navbar-item">
                    <div class="buttons">
                        <router-link to="/login" class="button is-light">
                            Log in
                        </router-link>
                    </div>
                </div>
            </div>
        </div>
    </nav>
</template>

<script>
import {mapMutations, mapState} from "vuex";

export default {
    name: "Navbar",
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex']),
        tournament() {
            return this.tournaments[this.currentTournamentIndex]
        },
    },
    methods: {
        ...mapMutations(['setActiveTournament']),
    }
}
</script>

<style scoped>

</style>