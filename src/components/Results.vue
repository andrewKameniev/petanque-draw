<template>
    <div class="content tabs-content">
        <div v-if="results.length || playOffBracket">
            <h3 v-if="results.length" class="has-text-centered">Swiss rounds</h3>
            <div class="table-container">
                <table v-if="results.length" class="table is-striped mb-5">
                    <tbody>
                        <template v-for="(round, index) in results" :key="index">
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
            <div v-if="playOffBracket">
                <div v-for="(stage, index) in playOffBracket.stages" :key="index" class="mb-5">
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
                <div v-if="playOffBracket.thirdPlace && Object.keys(playOffBracket.thirdPlace).length !== 0">
                    <h4 class="has-text-centered">Game for 3d Place</h4>
                    <div class="table-container">
                        <table class="table is-striped">
                            <tbody>
                            <tr>
                                <td>{{playOffBracket.thirdPlace.team_1}}</td>
                                <td>{{playOffBracket.thirdPlace.team_1_score}}</td>
                                <td>{{playOffBracket.thirdPlace.team_2_score}}</td>
                                <td>{{playOffBracket.thirdPlace.team_2}}</td>
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
export default {
    name: 'Results',
    props: ['results'],
    data(){
        return {
            playOffBracket: localStorage.getItem('playOffBracket') ?  JSON.parse(localStorage.getItem('playOffBracket')) : null,
        }
    },
}
</script>