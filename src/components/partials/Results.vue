<template>
    <div class="content tabs-content">
        <div v-if="tournament.games?.length || tournament.playOffBracket">
            <div v-if="(isForProtocol && !onlyPlayOff) || !isForProtocol">
                <h3 v-if="tournament.games?.length && !isForProtocol" class="has-text-centered">
                    {{ $t('results.title') }}
                </h3>
                <div class="table-container">
                    <table v-if="tournament.games?.length" class="table mb-5"
                           :class="{'is-striped': !isForProtocol, 'is-bordered': isForProtocol}">
                        <tbody>
                            <template v-for="(round, index) in tournament.games" :key="index">
                                <tr v-for="(game, i) in round" :key="i">
                                    <td>R{{index + 1}}</td>
                                    <td v-if="tournament.system === 'groups' && tournament?.groups.length > 1"><small>{{ $t('common.group') }}</small> {{ groupsNames[game.group] }}</td>
                                    <td>{{ isForProtocol ? teamTitles[game.team_1] : game.team_1}}</td>
                                    <td align="center">{{game.team_1_score}}</td>
                                    <td align="center">{{game.team_2_score}}</td>
                                    <td>{{isForProtocol ? teamTitles[game.team_2] : game.team_2}}</td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>
            </div>
            <div v-if="tournament.playOffBracket && !onlyQualifying">
                <div v-for="(stage, index) in tournament.playOffBracket.stages" :key="index" class="mb-5">
                    <div v-if="stage.teams[0].team_1_score">
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
            No games, yet
        </div>
    </div>
</template>


<script>
import {mapState} from "vuex";
import {tournamentNames} from "@/helpers";

export default {
    name: 'Results',
    props: ['previewTournament', 'isForProtocol', 'onlyQualifying', 'onlyPlayOff', 'teamTitles'],
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex']),
        tournament() {
            return this.previewTournament || this.tournaments[this.currentTournamentIndex]
        },
        groupsNames() {
            return tournamentNames
        }
    }
}
</script>