<template>
    <Modal @close-modal="$emit('close-modal')">
        <div class="is-size-4 mb-3">{{ $t('modals.enterTournamentName') }}</div>
        <div class="field">
            <div class="control">
                <input class="input" v-model="name" :class="{'is-danger': hasError}"
                       type="text" placeholder="Tournament name"
                       @keyup.enter="saveTournament">
            </div>
        </div>
        <div class="field has-text-danger" v-if="hasError">
            {{ $t('modals.alreadyHaveName') }}
        </div>
        <div class="buttons is-centered">
            <div class="control">
                <button class="button" @click="$emit('close-modal')">{{ $t('common.cancel') }}</button>
            </div>
            <div class="control">
                <button class="button is-success" @click="saveTournament">{{ $t('common.save') }}</button>
            </div>
        </div>
    </Modal>
</template>

<script>
import {mapGetters, mapMutations, mapState} from "vuex";
import Modal from "@/components/Modal";
import {getTournamentRanking} from "@/helpers";

export default {
    name: 'SaveTournament',
    components: {Modal},
    props: ['rankingTeams'],
    emits: ['close-modal'],
    data(){
        return {
            name: '',
            hasError: false
        }
    },
    created() {
        this.name = this.tournament.name
    },
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex', 'savedTournaments']),
        ...mapGetters({ tournament: 'currentTournament' }),
        tournamentsNames() {
            if (this.savedTournaments.length > 0) {
                let tournamentsTitles = []
                this.savedTournaments.forEach(item => {
                    tournamentsTitles.push(item.name)
                })
                return tournamentsTitles
            } else return false
        },
        tournamentRanking() {
            return getTournamentRanking(this.tournament, this.rankingTeams)
        },
    },
    methods: {
        ...mapMutations(['showMessage']),
        addToSaved(tournament) { this.$store.dispatch('addToSaved', tournament); },
        saveTournament(){
            this.hasError = false;
            if(!this.tournament.name || this.tournamentsNames && this.tournamentsNames.includes(this.name)){
                this.hasError = true
            } else {
                const currentTournament = {
                    id: this.tournament.id,
                    name: this.name,
                    system: this.tournament.system,
                    tournamentIsFinished: this.tournament.tournamentIsFinished,
                    games: this.tournament.games,
                    teams: this.tournament.teams,
                    playOff: this.tournament.playOffBracket ? this.tournament.playOffBracket : null,
                    ranking: this.tournamentRanking
                }
                this.addToSaved(currentTournament);
                this.$emit('close-modal');
            }
        }
    }
}
</script>