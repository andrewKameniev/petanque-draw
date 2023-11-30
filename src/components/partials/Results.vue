<template>
    <div class="content tabs-content">
        <div v-if="tournament.games.length || tournament.playOffBracket">
            <h3 v-if="tournament.games.length" class="has-text-centered">
                <span v-if="tournament.system ==='swiss'">Swiss</span>
                <span v-else-if="tournament.system ==='groups'">Group</span>
                <span v-else-if="tournament.system ==='supermele'">Supermele</span>
                rounds</h3>
            <div class="table-container">
                <table v-if="tournament.games.length" class="table is-striped mb-5">
                    <tbody>
                        <template v-for="(round, index) in tournament.games" :key="index">
                            <tr v-for="(game, i) in round" :key="i">
                                <td>R{{index + 1}}</td>
                                <td>{{game.team_1}}</td>
                                <td>{{game.team_1_score}}</td>
                                <td>{{game.team_2_score}}</td>
                                <td>{{game.team_2}}</td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
            <div v-if="tournament.playOffBracket">
                <div v-for="(stage, index) in tournament.playOffBracket.stages" :key="index" class="mb-5">
                    <h3 class="has-text-centered">{{stage.stageLabel === 1 ? 'Final' : '1/' + stage.stageLabel + ' final'}}</h3>
                    <div class="table-container">
                        <table class="table is-striped">
                            <tbody>
                                <tr v-for="(game, i) in stage.teams" :key="i">
                                    <td>{{game.team_1}}</td>
                                    <td>{{game.team_1_score}}</td>
                                    <td>{{game.team_2_score}}</td>
                                    <td>{{game.team_2}}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div v-if="tournament.playOffBracket.thirdPlace && Object.keys(tournament.playOffBracket.thirdPlace).length !== 0">
                    <h4 class="has-text-centered">Game for 3d Place</h4>
                    <div class="table-container">
                        <table class="table is-striped">
                            <tbody>
                            <tr>
                                <td>{{tournament.playOffBracket.thirdPlace.team_1}}</td>
                                <td>{{tournament.playOffBracket.thirdPlace.team_1_score}}</td>
                                <td>{{tournament.playOffBracket.thirdPlace.team_2_score}}</td>
                                <td>{{tournament.playOffBracket.thirdPlace.team_2}}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="mb-5 mt-5">
            No games, yet
        </div>
    </div>
</template>


<script>
import {mapState} from "vuex";

export default {
    name: 'Results',
    props: ['previewTournament'],
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex']),
        tournament() {
            return this.previewTournament || this.tournaments[this.currentTournamentIndex]
        },
    }
}
</script>