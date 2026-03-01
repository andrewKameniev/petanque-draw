<script>
import Game from "@/components/partials/Game.vue";
import {mapState} from "vuex";
import {getTeamsRanking} from "@/helpers";

export default {
    name: "Cadrage",
    props: ['activeTournament', 'isPublicView'],
    components: {Game},
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex']),
        tournament() {
            return this.activeTournament || this.tournaments[this.currentTournamentIndex]
        },
        rankingTeams() {
            return getTeamsRanking(this.tournament)
        },
    },
    methods: {
        saveResults() {
            let teamsToPlayOff = this.rankingTeams.slice(0, this.tournament.preferences.playOffTeams / 2);
            this.tournament.cadrage.forEach(game => {
                if (game.team_1_score > game.team_2_score) {
                    teamsToPlayOff.push(this.rankingTeams.find(team => team.title === game.team_1))
                } else if (game.team_2_score > game.team_1_score) {
                    teamsToPlayOff.push(this.rankingTeams.find(team => team.title === game.team_2))
                }
            })
            teamsToPlayOff = teamsToPlayOff.sort((a,b) => (a.team_1_place || a.team_2_place) - (b.team_1_place || b.team_2_place));
            this.$emit('startPlayOff', teamsToPlayOff);
        },
    }
}
</script>

<template>
    <h2 class="text-center">{{ $t('games.cadrage') }}</h2>
    <Game v-for="(game, ind) in tournament.cadrage" :key="ind" :active-tournament="tournament" :compact-view="isPublicView"
          :game="game" :game-index="ind" :fields-start="tournament.preferences.fieldsStart" :is-cadrage="true"
          @save="saveResults"/>
    <div class="text-center mt-5" v-if="!activeTournament">
        <button class="button is-success" @click="saveResults">{{ $t('games.saveResults') }}</button>
    </div>
</template>

<style scoped>

</style>