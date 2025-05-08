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
                <div v-else class="is-flex is-align-items-center is-size-3 p-3 has-text-centered">
                    {{ $t('common.onlyLoginMessage') }}
                </div>
                <div class="column is-one-third is-hidden-touch">
                    <img src="@/assets/img/bg.jpg" alt="Petanque in Alps" class="image">
                </div>
            </div>
            <hr>
            <button v-if="user" class="button is-info" @click="addTournament">{{ $t('common.addTournament') }}</button>
            <Message v-if="message.show"/>
            <Menu :active="menuOpen"
                  @closeMenu="menuOpen = false"
                  @openSavedTournament="openSavedTournament" @open-help="menuOpen = false; helpOpen = true"/>
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
import {mapState, mapMutations} from 'vuex'
import Navbar from "./Navbar";
import Help from "./Help";
import { onAuthStateChanged } from "firebase/auth";
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
            isLoading: false
        }
    },
    mounted() {
        this.isLoading = true
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.loginUser(user);
                this.$store.dispatch('getTournaments');
            } else {
                this.loginUser(false);
            }
            this.isLoading = false
        });
    },
    methods: {
        ...mapMutations(['setActiveTournament', 'addTournament', 'loginUser']),
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
        ...mapState(['message', 'tournaments', 'currentTournamentIndex', 'savedTournaments', 'user']),
        tournament() {
            return this.tournaments[this.currentTournamentIndex]
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
