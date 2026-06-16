<script>
import Game from "@/components/partials/Game.vue";
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {getTeamsRanking, isScoreError, updateScoreHistory} from "@/helpers";

export default {
    name: "Cadrage",
    props: ['activeTournament', 'isPublicView'],
    emits: ['startPlayOff'],
    components: {Game},
    data() {
        return {
            scoreError: false,
        }
    },
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament']),
        tournament() {
            return this.activeTournament || this.currentTournament
        },
        rankingTeams() {
            return getTeamsRanking(this.tournament)
        },
    },
    methods: {
        ...mapActions(useMainStore, ['saveCadrageScores', 'syncToFirebase', 'addGroupBTeams', 'initGroupB']),
        onGameUpdate(gameIndex) {
            const game = this.tournament.cadrage[gameIndex];
            if (this.tournament.preferences.cochonettesEnabled) updateScoreHistory(game);
            this.syncToFirebase();
        },
        onGameFinish(gameIndex) {
            const game = this.tournament.cadrage[gameIndex];
            if (game) {
                game.team_1_score = Number(game.team_1_score);
                game.team_2_score = Number(game.team_2_score);
                game.status = 'finished';
                game.winner = game.team_1_score > game.team_2_score ? game.team_1 : game.team_2;
                this.syncToFirebase();
            }
        },
        swapCadrageLane({ fromIndex, targetLane }) {
            const fieldsStart = this.tournament.preferences.fieldsStart;
            const targetIndex = targetLane - fieldsStart;
            const cadrage = this.tournament.cadrage;
            if (targetIndex < 0 || targetIndex >= cadrage.length || targetIndex === fromIndex) return;
            const temp = cadrage[fromIndex];
            cadrage[fromIndex] = cadrage[targetIndex];
            cadrage[targetIndex] = temp;
            this.syncToFirebase();
        },
        saveResults() {
            this.scoreError = false;
            if (this.tournament.cadrage.some(game => isScoreError(game, this.tournament.preferences.maxScore))) {
                this.scoreError = true;
                return;
            }
            this.tournament.cadrage.forEach(game => {
                game.team_1_score = Number(game.team_1_score);
                game.team_2_score = Number(game.team_2_score);
                game.status = 'finished';
                game.winner = game.team_1_score > game.team_2_score ? game.team_1 : game.team_2;
            });
            let teamsToPlayOff = this.rankingTeams.slice(0, this.tournament.preferences.playOffTeams / 2);
            const cadrageLosers = [];
            this.tournament.cadrage.forEach(game => {
                if (game.team_1_score > game.team_2_score) {
                    teamsToPlayOff.push(this.rankingTeams.find(team => team.title === game.team_1))
                    if (this.tournament.preferences.cadrageLosersToB) {
                        const loser = this.rankingTeams.find(team => team.title === game.team_2);
                        if (loser) cadrageLosers.push(loser);
                    }
                } else if (game.team_2_score > game.team_1_score) {
                    teamsToPlayOff.push(this.rankingTeams.find(team => team.title === game.team_2))
                    if (this.tournament.preferences.cadrageLosersToB) {
                        const loser = this.rankingTeams.find(team => team.title === game.team_1);
                        if (loser) cadrageLosers.push(loser);
                    }
                }
            })
            teamsToPlayOff = teamsToPlayOff.sort((a,b) => (a.team_1_place || a.team_2_place) - (b.team_1_place || b.team_2_place));
            this.saveCadrageScores();

            if (cadrageLosers.length) {
                if (this.tournament.groupB) {
                    this.addGroupBTeams(cadrageLosers);
                } else {
                    this.initGroupB(cadrageLosers);
                }
            }

            this.$emit('startPlayOff', teamsToPlayOff);
        },
    }
}
</script>

<template>
    <div>
        <h2 class="text-center" data-testid="cadrage-heading">{{ $t('games.cadrage') }}</h2>
        <Game v-for="(game, ind) in tournament.cadrage" :key="ind" :active-tournament="tournament" :compact-view="isPublicView"
              :game="game" :game-index="ind" :fields-start="tournament.preferences.fieldsStart" :is-cadrage="true"
              @save="saveResults" @swapLane="swapCadrageLane" @update="onGameUpdate" @finish="onGameFinish"/>
        <div v-if="scoreError" class="has-text-centered has-text-danger mb-5 mt-5">{{ $t('games.resultsError') }}</div>
        <div class="text-center mt-5" v-if="!activeTournament">
            <button class="button is-success" data-testid="btn-save-cadrage" @click="saveResults">{{ $t('games.saveResults') }}</button>
        </div>
    </div>
</template>

<style scoped>

</style>