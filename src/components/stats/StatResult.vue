<script>
export default {
    name: "StatResult",
    props: ['team', 'teamStats']
}
</script>

<template>
    <div class="player-info -result mb-2" v-for="(player, index) in team.players" :key="index">
        <div class="player-name is-size-4">{{ player.name }}</div>
        <div class="throw-result-container">
            Series:
            <div>
                All:
                <span class="throw-result" :class="{'-success': item.success}"
                      v-for="(item, itemIndex) in teamStats[index].serie"
                      :key="itemIndex"></span>
            </div>
            <div>
                Points:
                <span class="throw-result" :class="{'-success': item.success}"
                      v-for="(item, itemIndex) in teamStats[index].serie.filter((item) => item.type === 'p')"
                      :key="itemIndex"></span>
            </div>
            <div>
                Tirs:
                <span class="throw-result" :class="{'-success': item.success}"
                      v-for="(item, itemIndex) in teamStats[index].serie.filter((item) => item.type === 't')"
                      :key="itemIndex"></span>
            </div>
        </div>
        <div class="is-size-5">
            Total: {{teamStats[index].all.positive}}/{{teamStats[index].all.positive + teamStats[index].all.negative}} -
            <strong class="is-size-4">{{Math.round(teamStats[index].all.positive/(teamStats[index].all.positive + teamStats[index].all.negative) * 100)}}%</strong>
        </div>
        <div class="is-size-5">
            Points: {{teamStats[index].points.positive}}/{{teamStats[index].points.positive + teamStats[index].points.negative}}
            <span v-if="teamStats[index].points.positive + teamStats[index].points.negative !== 0">
                - <strong class="is-size-4">{{Math.round(teamStats[index].points.positive/(teamStats[index].points.positive + teamStats[index].points.negative) * 100)}}%</strong>
            </span>
        </div>
        <div class="is-size-5">
            Tirs: {{teamStats[index].tirs.positive}}/{{teamStats[index].tirs.positive + teamStats[index].tirs.negative}}
            <span v-if="teamStats[index].tirs.positive + teamStats[index].tirs.negative !== 0">
                - <strong class="is-size-4">{{Math.round(teamStats[index].tirs.positive/(teamStats[index].tirs.positive + teamStats[index].tirs.negative) * 100)}}%</strong>
            </span>
        </div>
    </div>
</template>

<style scoped>
    .player-info.-result {
        padding: 10px 16px;

        .throw-result-container {
            line-height: 1.4;
        }
        .throw-result {
            width: 10px;
            height: 10px;
        }
    }
</style>