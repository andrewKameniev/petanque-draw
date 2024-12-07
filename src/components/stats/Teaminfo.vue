<template>
    <div>
        <div class="mb-2 has-text-right is-flex is-justify-content-end is-align-items-center">
            Enter how many points team won
            <input type="number" class="input has-text-centered ml-2" style="width: 60px;"
                   :value="team.score[currentMan]"
                   @input="updateScore($event.target.value)">
        </div>
        <div v-for="(player, index) in team.players" :key="index">
            <div class="player-info mb-2 is-flex is-justify-content-space-between is-align-items-center" v-if="(!player.isChanged && !player.wasChanged) || player.isChanged >= currentMan || player.wasChanged > currentMan">
                <div class="is-relative player-info-content">
                    <button v-if="!changePlayerName" class="button is-danger change-player-btn" @click="showChangePlayerModal(index)">Change player</button>
                    <div class="is-size-7" v-if="system === 'simple'">
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
                    <div v-else class="is-size-7">
                        <div v-if="teamStats[index].serie.filter(item => item.type === 'p').length">
                            <strong>Point</strong>: vol: {{ getFrenchStat(teamStats[index].points.volume, teamStats[index].serie.filter(item => item.type === 'p').length) }}%,
                            int: {{ getFrenchStat(teamStats[index].points.intensity, teamStats[index].serie.filter(item => item.type === 'p').length) }}%,
                            eff: {{ (getFrenchStat(teamStats[index].points.volume, teamStats[index].serie.filter(item => item.type === 'p').length)
                            + getFrenchStat(teamStats[index].points.intensity, teamStats[index].serie.filter(item => item.type === 'p').length)) / 2 }}%
                        </div>
                        <div v-if="teamStats[index].serie.filter(item => item.type === 't').length">
                            <strong>Tir</strong>: vol: {{ getFrenchStat(teamStats[index].tirs.volume, teamStats[index].serie.filter(item => item.type === 't').length) }}%,
                            int: {{ getFrenchStat(teamStats[index].tirs.intensity, teamStats[index].serie.filter(item => item.type === 't').length) }}%,
                            eff: {{ (getFrenchStat(teamStats[index].tirs.volume, teamStats[index].serie.filter(item => item.type === 't').length)
                            + getFrenchStat(teamStats[index].tirs.intensity, teamStats[index].serie.filter(item => item.type === 't').length)) / 2 }}%
                        </div>
                    </div>
                    <div class="player-name">{{ player.name }}</div>
                    <div class="throw-result-container" v-if="system === 'simple'">
                        <span class="throw-result" :class="{'-success': item.success}"
                              v-for="(item, itemIndex) in teamStats[index].serie.slice(-12)"
                              :key="itemIndex"></span>
                    </div>
                </div>
                <div class="is-flex is-align-items-center" style="gap: 10px">
                    <ThrowResult v-for="(res, throwIndex) in team.players[index].stat[currentMan]"
                                 :info="res" :key="throwIndex" :system="system"
                                 :iterator="'throwTypeTeam' + iterator + index + throwIndex"
                                 @remove="$emit('removethrow', team, index, currentMan, throwIndex)"
                                 @add="$emit('addthrow', team, index, currentMan, throwIndex)"
                                 @super="$emit('x2throw', team, index, currentMan, throwIndex, $event)"
                                 @updatetype="$emit('updatethrow', team, index, currentMan, throwIndex, 'type', $event)"
                                 @updateresult="$emit('updatethrow', team, index, currentMan, throwIndex, 'success', $event)"
                                 @updateresultfrench="$emit('updatethrow', team, index, currentMan, throwIndex, 'french', $event)"
                    />
                </div>
            </div>
        </div>
        <Modal v-if="changePlayerModalOpen">
            <label for="changePlayerName">Enter player name</label>
            <div class="field control">
                <input type="text" id="changePlayerName" class="input" v-model="changePlayerName"/>
            </div>
            <div class="field">
                <button class="button is-info"
                        @click="changePlayerModalOpen = false; $emit('changePlayer', iterator, changePlayerIndex, changePlayerName)">
                    Change Player
                </button>
            </div>
        </Modal>
    </div>
</template>

<script>
import ThrowResult from "@/components/stats/ThrowResult.vue";
import Modal from "@/components/Modal.vue";

export default {
    components: {Modal, ThrowResult},
    props: ['team', 'teamStats', 'currentMan', 'iterator', 'showThrow', 'system'],
    data() {
        return {
            changePlayerModalOpen: false,
            changePlayerName: '',
            changePlayerIndex: null
        }
    },
    methods: {
        getFrenchStat(value, count) {
            return Math.round(value / count * 100)
        },
        showChangePlayerModal(index) {
            this.changePlayerModalOpen = true;
            this.changePlayerIndex = index;
        },
        updateScore(value) {
            this.$emit("update-score", this.team, parseInt(value, 10) || 0, this.currentMan);
        },
    }
};
</script>

<style scoped>
.player-info-content:hover .change-player-btn {
    display: inline-block;
}
.change-player-btn {
    display: none;
    position: absolute;
    top: 50%;
    left: 10px;
    transform: translateY(-50%);
}
</style>
