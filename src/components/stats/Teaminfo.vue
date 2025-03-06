<template>
    <div>
        <div class="team-info is-flex mb-2">
            <div v-if="isCouch">
                <div v-if="system === 'simple'">
                    <div v-if="commonTeamStat && commonTeamStat.all.positive + commonTeamStat.all.negative > 0">
                        {{ $t('stat.total') }}: {{commonTeamStat.all.positive}}/{{commonTeamStat.all.positive + commonTeamStat.all.negative}} -
                        <strong class="is-size-6">{{Math.round(commonTeamStat.all.positive/(commonTeamStat.all.positive + commonTeamStat.all.negative) * 100)}}%</strong>,
                        {{ $t('stat.points') }}: {{commonTeamStat.points.positive}}/{{commonTeamStat.points.positive + commonTeamStat.points.negative}}
                        <strong class="is-size-6" v-if="commonTeamStat.points.positive + commonTeamStat.points.negative !== 0">- {{Math.round(commonTeamStat.points.positive/(commonTeamStat.points.positive + commonTeamStat.points.negative) * 100)}}%</strong>,
                        {{ $t('stat.tirs') }}: {{commonTeamStat.tirs.positive}}/{{commonTeamStat.tirs.positive + commonTeamStat.tirs.negative}}
                        <strong class="is-size-6" v-if="commonTeamStat.tirs.positive + commonTeamStat.tirs.negative !== 0">- {{Math.round(commonTeamStat.tirs.positive/(commonTeamStat.tirs.positive + commonTeamStat.tirs.negative) * 100)}}%</strong>
                    </div>
                </div>
                <div v-else>
                    <div>
                        <strong>{{ $t('stat.points') }}:</strong> vol. - {{ commonTeamStat.points.volume / team.players.length }}%, int. - {{ commonTeamStat.points.intensity / team.players.length }}%, eff. {{ ((commonTeamStat.points.volume + commonTeamStat.points.intensity) / 2) / team.players.length }}%,
                    </div>
                    <div>
                        <strong>{{ $t('stat.tirs') }}:</strong> vol. - {{ commonTeamStat.tirs.volume / team.players.length}}%, int. - {{ commonTeamStat.tirs.intensity / team.players.length }}%, eff. {{ ((commonTeamStat.tirs.volume + commonTeamStat.tirs.intensity) / 2) / team.players.length }}%
                    </div>
                </div>
            </div>
            <div class="has-text-right is-flex is-align-items-center is-justify-content-end ml-auto">
                {{ $t('stat.howManyPoints') }}
                <input type="number" class="input has-text-centered ml-2" style="width: 60px; font-size: 16px"
                       :value="team.score[currentMan]" @keyup.enter="$emit('next')"
                       @input="updateScore($event.target.value)">
            </div>
        </div>
        <div v-for="(player, index) in team.players" :key="index">
            <div class="player-info mb-2 is-flex is-justify-content-space-between is-align-items-center" v-if="(!player.isChanged && !player.wasChanged) || player.isChanged >= currentMan || player.wasChanged > currentMan">
                <div class="is-relative player-info-content">
                    <button v-if="!changePlayerName" class="button is-danger change-player-btn" @click="showChangePlayerModal(index)">{{ $t('stat.changePlayer') }}</button>
                    <div v-if="isCouch">
                        <div class="is-size-7" v-if="system === 'simple' && teamsStat[index].all.positive + teamsStat[index].all.negative > 0">
                            {{teamsStat[index].all.positive}}/{{teamsStat[index].all.positive + teamsStat[index].all.negative}} -
                            <strong>{{Math.round(teamsStat[index].all.positive/(teamsStat[index].all.positive + teamsStat[index].all.negative) * 100)}}%</strong>
                            (p: {{teamsStat[index].points.positive}}/{{teamsStat[index].points.positive + teamsStat[index].points.negative}}
                            <span v-if="teamsStat[index].points.positive + teamsStat[index].points.negative !== 0">
                                                - <strong>{{Math.round(teamsStat[index].points.positive/(teamsStat[index].points.positive + teamsStat[index].points.negative) * 100)}}%</strong>
                                            </span>,
                            t: {{teamsStat[index].tirs.positive}}/{{teamsStat[index].tirs.positive + teamsStat[index].tirs.negative}}
                            <span v-if="teamsStat[index].tirs.positive + teamsStat[index].tirs.negative !== 0">
                                                - <strong>{{Math.round(teamsStat[index].tirs.positive/(teamsStat[index].tirs.positive + teamsStat[index].tirs.negative) * 100)}}%</strong>
                                            </span>)
                        </div>
                        <div v-else class="is-size-7">
                            <div v-if="teamsStat[index].serie.filter(item => item.type === 'p').length">
                                <strong>Point</strong>: vol: {{ getFrenchStat(teamsStat[index].points.volume, teamsStat[index].serie.filter(item => item.type === 'p').length) }}%,
                                int: {{ getFrenchStat(teamsStat[index].points.intensity, teamsStat[index].serie.filter(item => item.type === 'p').length) }}%,
                                eff: {{ (getFrenchStat(teamsStat[index].points.volume, teamsStat[index].serie.filter(item => item.type === 'p').length)
                                + getFrenchStat(teamsStat[index].points.intensity, teamsStat[index].serie.filter(item => item.type === 'p').length)) / 2 }}%
                            </div>
                            <div v-if="teamsStat[index].serie.filter(item => item.type === 't').length">
                                <strong>Tir</strong>: vol: {{ getFrenchStat(teamsStat[index].tirs.volume, teamsStat[index].serie.filter(item => item.type === 't').length) }}%,
                                int: {{ getFrenchStat(teamsStat[index].tirs.intensity, teamsStat[index].serie.filter(item => item.type === 't').length) }}%,
                                eff: {{ (getFrenchStat(teamsStat[index].tirs.volume, teamsStat[index].serie.filter(item => item.type === 't').length)
                                + getFrenchStat(teamsStat[index].tirs.intensity, teamsStat[index].serie.filter(item => item.type === 't').length)) / 2 }}%
                            </div>
                        </div>
                    </div>
                    <div class="player-name">{{ player.name }}</div>
                    <div class="throw-result-container" v-if="system === 'simple' && isCouch">
                        <span class="throw-result" :class="{'-success': item.success, '-carro': item.x2 && item.type === 't' && item.success}"
                              v-for="(item, itemIndex) in teamsStat[index].serie.slice(-12)"
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
                                 @updatedistance="$emit('updatethrow', team, index, currentMan, throwIndex, 'distance', $event)"
                    />
                </div>
            </div>
        </div>
        <Modal v-if="changePlayerModalOpen">
            <label for="changePlayerName">{{$t('stat.enterPlayerName')}}</label>
            <div class="field control">
                <input type="text" id="changePlayerName" class="input" v-model="changePlayerName"/>
            </div>
            <div class="field">
                <button class="button is-info"
                        @click="changePlayerModalOpen = false; $emit('changePlayer', iterator, changePlayerIndex, changePlayerName)">
                    {{ $t('stat.changePlayer') }}
                </button>
            </div>
        </Modal>
    </div>
</template>

<script>
import ThrowResult from "@/components/stats/ThrowResult.vue";
import Modal from "@/components/Modal.vue";
import {calculateCommonTeamStat, calculateTeamPlayersStat, getFrenchStat} from "@/helpers-stat";

export default {
    components: {Modal, ThrowResult},
    props: ['team', 'currentMan', 'iterator', 'showThrow', 'system', 'isCouch'],
    data() {
        return {
            changePlayerModalOpen: false,
            changePlayerName: '',
            changePlayerIndex: null
        }
    },
    computed: {
        teamsStat() {
            return calculateTeamPlayersStat(this.team, this.system)
        },
        commonTeamStat() {
            return calculateCommonTeamStat(this.teamsStat, this.system);
        },
    },
    methods: {
        getFrenchStat,
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
@media screen and (min-width: 768px) {
    .team-info {
        align-items: center;
    }
}
@media screen and (max-width: 767px){
    .team-info {
        flex-direction: column-reverse;
    }
}
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
