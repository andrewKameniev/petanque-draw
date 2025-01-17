<script>
import {calculateCommonTeamStat, calculateTeamPlayersStat, getFrenchStat} from "@/helpers-stat";

export default {
    name: "StatResult",
    props: ['team', 'system', 'label'],
    computed: {
        teamStats() {
            return calculateTeamPlayersStat(this.team, this.system)
        },
        commonStat() {
            return calculateCommonTeamStat(this.teamStats, this.system)
        },
        boulesOnMan() {
            const infoEveryMan = [];
            this.team.players.forEach(player => {
                player.stat.forEach((man, index) => {
                    if (man) {
                        infoEveryMan[index] = (infoEveryMan[index] || 0) + man.reduce((acc, item) => acc + Number(item.success), 0)
                    }
                })
            })
            return infoEveryMan
        },
        filledScores() {
            let fillScoresArray = [];
            for (let i = 0; i < this.boulesOnMan.length; i++) {
                fillScoresArray.push(this.team.score ? this.team.score[i] || 0 : 0)
            }
            return fillScoresArray
        }
    },
    methods: {
        getFrenchStat,
        countTeamScore(scores) {
            if (scores) {
                if (!Array.isArray(scores)) {
                    const tempArray = []
                    Object.values(scores).forEach(value => tempArray.push(value))
                    scores = tempArray;
                }

                return scores
                    .filter(value => value !== undefined)
                    .reduce((acc, value) => acc + value, 0);
            } else {
                return '0'
            }
        },
    }
}
</script>

<template>
    <div>
        <div class="label">
            {{ label }} - <span class="has-text-danger is-size-4">{{ countTeamScore(team.score) }}</span>
        </div>
        <div class="mb-3" v-if="team.players.length > 1">
            <div class="is-size-4">Common team statistics:</div>
            <div v-if="system === 'simple'">
                <div class="is-size-5">
                    {{ $t('stat.total') }}: {{commonStat.all.positive}}/{{commonStat.all.positive + commonStat.all.negative}} -
                    <strong class="is-size-4">{{Math.round(commonStat.all.positive/(commonStat.all.positive + commonStat.all.negative) * 100)}}%</strong>
                </div>
                <div class="is-size-5">
                    {{ $t('stat.points') }}: {{commonStat.points.positive}}/{{commonStat.points.positive + commonStat.points.negative}}
                    <strong class="is-size-4" v-if="commonStat.points.positive + commonStat.points.negative !== 0">- {{Math.round(commonStat.points.positive/(commonStat.points.positive + commonStat.points.negative) * 100)}}%</strong>
                </div>
                <div class="is-size-5">
                    {{ $t('stat.tirs') }}: {{commonStat.tirs.positive}}/{{commonStat.tirs.positive + commonStat.tirs.negative}}
                    <strong class="is-size-4" v-if="commonStat.tirs.positive + commonStat.tirs.negative !== 0">- {{Math.round(commonStat.tirs.positive/(commonStat.tirs.positive + commonStat.tirs.negative) * 100)}}%</strong>
                </div>
            </div>
            <div v-else>
                <div>
                    <strong>{{ $t('stat.points') }}:</strong> vol. - {{ Math.round(commonStat.points.volume / team.players.length) }}%, int. - {{ Math.round(commonStat.points.intensity / team.players.length) }}%, eff. {{ Math.round(((commonStat.points.volume + commonStat.points.intensity) / 2) / team.players.length) }}%,
                </div>
                <div>
                    <strong>{{ $t('stat.tirs') }}:</strong> vol. - {{ Math.round(commonStat.tirs.volume / team.players.length) }}%, int. - {{ Math.round(commonStat.tirs.intensity / team.players.length) }}%, eff. {{ Math.round(((commonStat.tirs.volume + commonStat.tirs.intensity) / 2) / team.players.length) }}%
                </div>
            </div>
        </div>
        <div class="mt-3 is-size-5">{{ $t('stat.everyManRes') }}:</div>
        <div class="mb-3">
            <div class="table-container">
                <table class="table has-text-centered">
                    <thead>
                    <tr>
                        <td></td>
                        <td v-for="(item, index) in boulesOnMan" :key="index" class="is-size-7">{{index + 1}}</td>
                        <td class="is-size-7">Av</td>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td class="is-size-7">Res. <br> boules</td>
                        <td v-for="(item, index) in boulesOnMan" :key="index">{{ item }}</td>
                        <td>{{ (boulesOnMan.reduce((acc, item) => acc + item, 0) / boulesOnMan.length).toFixed(1) }}</td>
                    </tr>
                    <tr>
                        <td class="is-size-7">Win <br> boules</td>
                        <td v-for="(score, index) in filledScores" :key="index">{{ score || 0 }}</td>
                        <td>{{ (filledScores.reduce((acc, item) => acc + item, 0)) }}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="player-info -result mb-2" v-for="(player, index) in team.players" :key="index">
            <div class="player-name is-size-4">{{ player.name }}</div>
            <div v-if="system === 'simple'">
                <div class="throw-result-container">
                    {{ $t('stat.series') }}:
                    <div>
                        {{ $t('stat.all') }}:
                        <span class="throw-result" :class="{'-success': item.success}"
                              v-for="(item, itemIndex) in teamStats[index].serie"
                              :key="itemIndex"></span>
                    </div>
                    <div>
                        {{ $t('stat.points') }}:
                        <span class="throw-result" :class="{'-success': item.success}"
                              v-for="(item, itemIndex) in teamStats[index].serie.filter((item) => item.type === 'p')"
                              :key="itemIndex"></span>
                    </div>
                    <div>
                        {{ $t('stat.tirs') }}:
                        <span class="throw-result" :class="{'-success': item.success}"
                              v-for="(item, itemIndex) in teamStats[index].serie.filter((item) => item.type === 't')"
                              :key="itemIndex"></span>
                    </div>
                </div>
                <div class="is-size-5">
                    {{ $t('stat.total') }}: {{teamStats[index].all.positive}}/{{teamStats[index].all.positive + teamStats[index].all.negative}} -
                    <strong class="is-size-4">{{Math.round(teamStats[index].all.positive/(teamStats[index].all.positive + teamStats[index].all.negative) * 100)}}%</strong>
                </div>
                <div class="is-size-5">
                    {{ $t('stat.points') }}: {{teamStats[index].points.positive}}/{{teamStats[index].points.positive + teamStats[index].points.negative}}
                    <span v-if="teamStats[index].points.positive + teamStats[index].points.negative !== 0">
                    - <strong class="is-size-4">{{Math.round(teamStats[index].points.positive/(teamStats[index].points.positive + teamStats[index].points.negative) * 100)}}%</strong>
                </span>
                    <span v-if="teamStats[index].x2?.points.positive">({{ teamStats[index].x2.points.positive }} made two)</span>
                    <span v-if="teamStats[index].x2?.points.negative">({{ teamStats[index].x2.points.negative }} made bad)</span>
                </div>
                <div class="is-size-5">
                    {{ $t('stat.tirs') }}: {{teamStats[index].tirs.positive}}/{{teamStats[index].tirs.positive + teamStats[index].tirs.negative}}
                <span v-if="teamStats[index].tirs.positive + teamStats[index].tirs.negative !== 0">
                - <strong class="is-size-4">{{Math.round(teamStats[index].tirs.positive/(teamStats[index].tirs.positive + teamStats[index].tirs.negative) * 100)}}%</strong>
                </span>
                <span v-if="teamStats[index].x2?.tirs.positive">({{ teamStats[index].x2.tirs.positive }} carro)</span>
                <span v-if="teamStats[index].x2?.tirs.negative">({{ teamStats[index].x2.tirs.negative }} tir own)</span>
            </div>
            </div>
            <div v-else>
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