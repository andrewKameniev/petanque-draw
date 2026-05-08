<template>
    <div class="content tabs-content">
        <div v-if="tournament.games?.length || tournament.playOffBracket">
            <div v-if="(isForProtocol && !onlyPlayOff) || !isForProtocol">
                <div v-if="!isForProtocol && (tournament.games?.length || tournament.cadrage?.length)" class="round-tabs mb-4">
                    <button v-for="(round, index) in tournament.games" :key="index"
                            class="button is-small mr-1 mb-1"
                            :class="{'is-purple': selectedRound === index}"
                            @click="selectedRound = index">
                        R{{ index + 1 }}
                    </button>
                    <button v-if="tournament.cadrage?.length" class="button is-small mr-1 mb-1"
                            :class="{'is-purple': selectedRound === 'cadrage'}"
                            @click="selectedRound = 'cadrage'">
                        {{ $t('games.cadrage') }}
                    </button>
                    <button class="button is-small mr-1 mb-1"
                            :class="{'is-purple': selectedRound === -1}"
                            @click="selectedRound = -1">
                        {{ $t('results.all') }}
                    </button>
                </div>
                <div class="table-container">
                    <table v-if="tournament.games?.length" class="table mb-5"
                           :class="{'is-striped': !isForProtocol, 'is-bordered': isForProtocol, 'is-fullwidth': !isForProtocol}">
                        <tbody>
                            <template v-for="(round, index) in tournament.games" :key="index">
                                <template v-if="isForProtocol || selectedRound === -1 || selectedRound === index">
                                    <tr v-for="(game, i) in round" :key="i">
                                        <td class="is-narrow"><small class="has-text-grey">R{{index + 1}}</small></td>
                                        <td v-if="tournament.system === 'groups' && tournament?.groups.length > 1"><small>{{ $t('common.group') }}</small> {{ groupsNames[game.group] }}</td>
                                        <td class="has-text-right" :class="{'has-text-weight-bold': !isForProtocol && game.team_1_score > game.team_2_score}">{{ isForProtocol ? teamTitles[game.team_1] : game.team_1}}</td>
                                        <td class="has-text-centered is-narrow">
                                            <strong>{{ game.team_1_score != null ? game.team_1_score : '--' }} : {{ game.team_2_score != null ? game.team_2_score : '--' }}</strong>
                                        </td>
                                        <td :class="{'has-text-weight-bold': !isForProtocol && game.team_2_score > game.team_1_score}">{{isForProtocol ? teamTitles[game.team_2] : game.team_2}}</td>
                                    </tr>
                                </template>
                            </template>
                        </tbody>
                    </table>
                </div>
            </div>
            <div v-if="tournament.cadrage && (isForProtocol || selectedRound === -1 || selectedRound === 'cadrage')">
                <div class="mb-5">
                    <h3 class="has-text-centered">{{$t('games.cadrage')}}</h3>
                    <div class="table-container">
                        <table class="table" :class="{'is-striped': !isForProtocol, 'is-bordered': isForProtocol}">
                            <tbody>
                                <tr v-for="(game, index) in tournament.cadrage" :key="index">
                                    <td class="has-text-right" :class="{'has-text-weight-bold': !isForProtocol && game.team_1_score > game.team_2_score}">{{ isForProtocol ? teamTitles[game.team_1] : game.team_1}}</td>
                                    <td class="has-text-centered is-narrow">
                                        <strong>{{ game.team_1_score != null ? game.team_1_score : '--' }} : {{ game.team_2_score != null ? game.team_2_score : '--' }}</strong>
                                    </td>
                                    <td :class="{'has-text-weight-bold': !isForProtocol && game.team_2_score > game.team_1_score}">{{ isForProtocol ? teamTitles[game.team_2] : game.team_2}}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div v-if="tournament.playOffBracket && !onlyQualifying">
                <div v-for="(stage, index) in tournament.playOffBracket.stages" :key="index" class="mb-5">
                    <div v-if="stage.teams[0].team_1_score && stage.stageLabel !== 'cadrage'">
                        <h3 class="has-text-centered">{{stage.stageLabel === 1 ? $t('games.final') : '1/' + stage.stageLabel + ' ' + $t('games.ofFinal')}}</h3>
                        <div class="table-container">
                            <table class="table" :class="{'is-striped': !isForProtocol, 'is-bordered': isForProtocol}">
                                <tbody>
                                    <tr v-for="(game, i) in stage.teams" :key="i">
                                        <td>{{ isForProtocol ? teamTitles[game.team_1] : game.team_1}}</td>
                                        <td align="center">{{game.team_1_score}}</td>
                                        <td align="center">{{game.team_2_score}}</td>
                                        <td>{{ isForProtocol ? teamTitles[game.team_2] : game.team_2}}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div v-if="tournament.playOffBracket.thirdPlace && Object.keys(tournament.playOffBracket.thirdPlace).length !== 0">
                    <h4 class="has-text-centered">{{$t('games.thirdPlace')}}</h4>
                    <div class="table-container">
                        <table class="table" :class="{'is-striped': !isForProtocol, 'is-bordered': isForProtocol}">
                            <tbody>
                            <tr>
                                <td>{{isForProtocol ? teamTitles[tournament.playOffBracket.thirdPlace.team_1] : tournament.playOffBracket.thirdPlace.team_1}}</td>
                                <td align="center">{{tournament.playOffBracket.thirdPlace.team_1_score}}</td>
                                <td align="center">{{tournament.playOffBracket.thirdPlace.team_2_score}}</td>
                                <td>{{isForProtocol ? teamTitles[tournament.playOffBracket.thirdPlace.team_2] : tournament.playOffBracket.thirdPlace.team_2}}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="mb-5 mt-5">
            {{ $t('games.noGames') }}
        </div>
    </div>
</template>


<script>
import {mapState} from "pinia";
import {useMainStore} from "@/stores/main";
import {tournamentNames} from "@/helpers";

export default {
    name: 'Results',
    props: ['previewTournament', 'isForProtocol', 'onlyQualifying', 'onlyPlayOff', 'teamTitles'],
    data() {
        return {
            selectedRound: -1
        }
    },
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament']),
        tournament() {
            return this.previewTournament || this.currentTournament
        },
        groupsNames() {
            return tournamentNames
        }
    }
}
</script>