<template>
    <div>
        <div v-if="tournament.tournamentIsFinished" class="mb-5">
            <div class="is-flex is-justify-content-space-between is-align-content-center">
                <h2>Tournament Result</h2>
                <button class="button is-info" @click="copyResults">Copy results</button>
            </div>
            <div class="table-container">
                <table id="table-finish-ranking" class="table">
                    <thead>
                    <tr>
                        <th>Place</th>
                        <th>Team</th>
                        <th>Players</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(team, index) in showInSaved ? rankingTeams : tournamentRanking" :key="index">
                        <td>{{ team.place }}</td>
                        <td>{{ team.title }}</td>
                        <td>
                            <div class="is-size-7" v-if="showInSaved ? team.players && team.players.length : getTeamPlayers(team.title).length">
                                <span class="has-text-dark" v-for="(player, index) in showInSaved ? team.players : getTeamPlayers(team.title)"
                                      :key="index">
                                        {{ player.name }} {{ player.surname }}
                                    <span v-if="index < getTeamPlayers(team.title).length - 1">, </span>
                                  </span>
                            </div>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div v-if="tournament.games.length > 0">
            <h2 v-if="tournament.system !== 'groups'">Ranking
                <span v-if="activeRound">after {{ activeRound - 1 }} round{{
                        activeRound > 2 && activeRound !== 0 ? 's ' : ' '
                    }}</span>
                <span v-if="tournament.system === 'swiss'">swiss</span>
            </h2>
            <div v-if="tournament.system === 'swiss'">
                <div class="table-container">
                    <table id="table-ranking" class="table">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Team</th>
                            <th align="center">Wins</th>
                            <th align="center">Buh</th>
                            <th align="center">SBuh</th>
                            <th align="center">Points</th>
                            <th v-if="tournament.useRating" align="center">Rating</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="team in rankingTeams" :key="team.title">
                            <td><span class="team-count"></span></td>
                            <td>{{ team.title }}</td>
                            <td align="center">{{ team.wins }}</td>
                            <td align="center">{{ team.buhgolts }}</td>
                            <td align="center">{{ team.smallBuhgolts }}</td>
                            <td align="center">{{ team.pointsPlus }}:{{ team.pointsMinus }}</td>
                            <td v-if="tournament.useRating">{{ team.rating }}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div v-else-if="tournament.system === 'supermele'">
                <div class="table-container">
                    <table id="table-ranking" class="table">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th align="center">Wins</th>
                            <th align="center">Difference</th>
                            <th align="center">Points</th>
                            <th v-if="tournament.useRating" align="center">Rating</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="team in rankingTeams" :key="team.title">
                            <td><span class="team-count"></span></td>
                            <td>{{ team.title }}</td>
                            <td align="center">{{ team.wins }}</td>
                            <td align="center">{{team.pointsPlus - team.pointsMinus > 0 ? '+' : ''}}{{ team.pointsPlus - team.pointsMinus }}</td>
                            <td align="center">{{ team.pointsPlus }}:{{ team.pointsMinus }}</td>
                            <td v-if="tournament.useRating">{{ team.rating }}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div v-else-if="tournament.groups && tournament.games.length > 1">
                <div v-for="(group, index) in rankingTeams" :key="index">
                    <h4 v-if="tournament.groups && tournament.groups.length > 1">Group {{ groupsNames[index] }}</h4>
                    <div class="table-container mb-5">
                        <table class="table table is-striped">
                            <thead>
                            <tr>
                                <th>Place</th>
                                <th>Team</th>
                                <th v-for="(group, index) in group" :key="index" align="center">{{ index + 1 }}</th>
                                <th align="center">Wins</th>
                                <th align="center">Points</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr v-for="(team, index) in group" :key="index">
                                <td>{{ index + 1 }}</td>
                                <td>{{ team.title }}</td>
                                <td v-for="(opponent, indexOpponent) in group" :key="indexOpponent" align="center"
                                    class="no-wrap">
                                    {{ getGameResultInGroup(tournament.games, team.title, opponent.title) }}
                                </td>
                                <td align="center">{{ team.wins }}</td>
                                <td align="center">{{ team.pointsPlus }}:{{ team.pointsMinus }}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<script>
import {tournamentNames, getGameResultInGroup, getTournamentRanking, copyContent} from "@/helpers";

export default {
    name: 'Ranking',
    props: ['tournament', 'rankingTeams', 'activeRound', 'showInSaved'],
    emits: ['is-playoff'],
    data() {
        return {
            playOffBracket: localStorage.getItem('playOffBracket') ? JSON.parse(localStorage.getItem('playOffBracket')) : null
        }
    },
    methods: {
        getGameResultInGroup: getGameResultInGroup,
        copyResults() {
            let content = ''
            this.tournamentRanking.forEach(item => {
                content = content + '<span>' + item.place + '</span><p>' + item.title + '</p>'
            })
            copyContent(content)
        },
        getTeamPlayers(title) {
            return this.tournament.teams && this.tournament.teams.find(item => item.title === title).players ? this.tournament.teams.find(item => item.title === title).players : ''
        },
    },
    computed: {
        groupsNames() {
            return tournamentNames
        },
        tournamentRanking() {
            return getTournamentRanking(this.tournament, this.rankingTeams)
        },
    },
}
</script>