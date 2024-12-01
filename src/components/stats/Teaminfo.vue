<template>
    <div>
        <div class="mb-2 has-text-right is-flex is-justify-content-end is-align-items-center">
            Enter how many points team won
            <input type="number" class="input has-text-centered ml-2" style="width: 60px;"
                   :value="team.score[currentMan]"
                   @input="updateScore($event.target.value)">
        </div>
        <div class="player-info is-flex is-justify-content-space-between is-align-items-center mb-2" v-for="(player, index) in team.players" :key="index">
            <div>
                <div class="is-size-7">
                    {{teamStats[index].all.positive}}/{{teamStats[index].all.positive + teamStats[index].all.negative}} -
                    <strong>{{Math.round(teamStats[index].all.positive/(teamStats[index].all.positive + teamStats[index].all.negative) * 100)}}%</strong>
                    (p: {{teamStats[index].points.positive}}/{{teamStats[index].points.positive + teamStats[index].points.negative}}
                    <span v-if="teamStats[index].points.positive + teamStats[index].points.negative !== 0">
                                        - <strong>{{Math.round(teamStats[index].points.positive/(teamStats[index].points.positive + teamStats[index].points.negative) * 100)}}%</strong>
                                    </span>,
                    t: {{teamStats[index].tirs.positive}}/{{teamStats[index].tirs.positive + teamStats[index].tirs.negative}}
                    <span v-if="teamStats[index].tirs.positive + teamStats[index].tirs.negative !== 0">
                                        - <strong>{{Math.round(teamStats[index].tirs.positive/(teamStats[index].tirs.positive + teamStats[index].tirs.negative) * 100)}}%</strong>
                                    </span>)
                </div>
                <div class="player-name">{{ player.name }}</div>
                <div class="throw-result-container">
                                    <span class="throw-result" :class="{'-success': item.success}"
                                          v-for="(item, itemIndex) in teamStats[index].serie.slice(-12)"
                                          :key="itemIndex"></span>
                </div>
            </div>
            <div class="is-flex" style="gap: 10px">
                <ThrowResult v-for="(res, throwIndex) in team.players[index].stat[currentMan]"
                             @removethrow="$emit('removethrow', team, index, currentMan, throwIndex)"
                             :type="res.type" :result="res.success" :key="throwIndex"
                             :iterator="'throwTypeTeam' + iterator + index + throwIndex"
                             @updatetype="$emit('updatethrow', team, index, currentMan, throwIndex, 'type', $event)"
                             @updateresult="$emit('updatethrow', team, index, currentMan, throwIndex, 'success', $event)"
                />
            </div>
        </div>
    </div>
</template>

<script>
import ThrowResult from "@/components/stats/ThrowResult.vue";

export default {
    components: {ThrowResult},
    props: ["team", "teamStats", 'currentMan', 'iterator'],
    methods: {
        updateScore(value) {
            this.$emit("update-score", this.team, parseInt(value, 10) || 0, this.currentMan);
        },
    }
};
</script>
