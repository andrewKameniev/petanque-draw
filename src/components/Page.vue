<template>
    <Navbar @open-menu="menuOpen = !menuOpen"/>
    <div class="container ">
        <div class="columns">
            <div class="column">
                <Tournament v-if="tournament"/>
            </div>
            <div class="column is-one-third is-hidden-touch">
                <img src="@/assets/img/bg.jpg" alt="Petanque in Alps" class="image">
            </div>
        </div>
        <hr>
        <button class="button is-info" @click="addTournament">Add new tournament</button>
        <Message v-if="message.show"/>
        <Menu :active="menuOpen"
              @closeMenu="menuOpen = false"
              @openSavedTournament="openSavedTournament" @open-help="menuOpen = false; helpOpen = true"/>
        <SavedTournamentModal v-if="showSavedTournament" :tournament="savedTournaments[savedTournamentsActive]"
                              @close-modal="closeTournamentModal"/>
        <Help v-if="helpOpen" @close-modal="helpOpen = false"/>
    </div>
</template>

<script>
import Message from './Message.vue';
import Menu from './Menu';
import SavedTournamentModal from './partials/SavedTournamentModal';
import Tournament from "./Tournament";
import {mapState, mapMutations} from 'vuex'
import Navbar from "./Navbar";
import Help from "./Help";

export default {
    name: 'Page',
    props: ['isAdmin'],
    data() {
        return {
            showSaveTournament: false,
            menuOpen: false,
            showSavedTournament: false,
            helpOpen: false,
            savedTournamentsActive: false
        }
    },
    mounted() {
        this.setActiveTournament(0)
    },
    methods: {
        ...mapMutations(['setActiveTournament', 'addTournament']),
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
    },
    computed: {
        ...mapState(['message', 'tournaments', 'currentTournamentIndex', 'savedTournaments']),
        tournament() {
            return this.tournaments[this.currentTournamentIndex]
        },
        canSaveTournament() {
            return this.games && this.games.length > 0 || this.playoff && this.playoff[this.playoff.length - 1].teams[0].team_1_score !== null
        },
    },
    components: {
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
