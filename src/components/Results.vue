<template>
    <div class="content tabs-content">
        <table v-if="results.length" class="table">
            <template v-for="(round, index) in results" :key="index">
                <tr v-for="(game, i) in round" :key="i">
                    <td>R{{index + 1}}</td>
                    <td>{{game.team_1}}</td>
                    <td>{{game.team_1_score}}</td>
                    <td>{{game.team_2_score}}</td>
                    <td>{{game.team_2}}</td>
                </tr>
            </template>
        </table>
        <div v-else class="mb-5 mt-5">
            No games, yet
        </div>
    </div>
</template>


<script>
export default {
    name: 'Ranking',
    props: ['results']
}
</script>