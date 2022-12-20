<template>
    <h2>Current list</h2>
    <table id="table-list" class="table">
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

export default {
    name: "TeamsList",
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex']),
        tournament() {
            return this.tournaments[this.currentTournamentIndex]
        },
    },
    methods: {
        ...mapMutations(['removeTeam'])
    }
}
</script>