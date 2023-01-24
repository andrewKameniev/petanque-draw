<template>
    <h2>Current list</h2>
    <div v-if="tournament.system === 'groups' && (activeRound > 1 || tournament.roundIsActive)" class="mb-5">
        <div v-for="(group, index) in tournament.groups" :key="index">
            <h4 class="mt-5 text-center" v-if="tournament.groups.length > 1">Group {{ groupsNames[index] }}</h4>
            <table class="table">
                <tr v-for="(team, teamIndex) in group" :key="team.title">
                    <td style="width: 30px">{{teamIndex + 1}}.</td>
                    <td>{{ team.title }}
                        <div class="is-size-7" v-if="team.players && team.players.length > 1">
                            (<span class="has-text-dark" v-for="(player, index) in team.players"
                                   :key="index">{{ player.name }}
                                           {{ player.surname }}<span
                                v-if="index < team.players.length - 1">, </span></span>)
                        </div>
                    </td>
                    <td class="td-100" v-if="tournament.useRating">{{ team.rating }}</td>
                </tr>
            </table>
        </div>
    </div>
    <table v-else id="table-list" class="table">
        <tr v-for="team in tournament.teams" :key="team.title">
            <td>{{team.title}}
                <div class="is-size-7" v-if="team.players && team.players.length > 1">
                    (<span class="has-text-dark" v-for="(player, index) in team.players" :key="index">{{player.name}}
                                       {{player.surname}}<span v-if="index < team.players.length - 1">, </span></span>)
                </div>
            </td>
            <td class="td-100" v-if="tournament.useRating">{{team.rating}}</td>
            <td class="td-50" v-if="!tournament.games.length">
                <span class="delete" @click="removeTeam(team.title)"></span>
            </td>
        </tr>
    </table>
</template>

<script>
import {mapMutations, mapState} from "vuex";
import {tournamentNames} from "@/helpers";

export default {
    name: "TeamsList",
    props: ['activeRound'],
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex']),
        tournament() {
            return this.tournaments[this.currentTournamentIndex]
        },
        groupsNames() {
            return tournamentNames
        }
    },
    methods: {
        ...mapMutations(['removeTeam'])
    }
}
</script>