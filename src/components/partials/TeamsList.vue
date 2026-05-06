<template>
    <h2>{{ $t('teams.currentList') }}</h2>
    <div v-if="tournament.system === 'groups' && (activeRound > 1 || tournament.roundIsActive)" class="mb-5">
        <div v-for="(group, index) in tournament.groups" :key="index">
            <h4 class="mt-5 text-center" v-if="tournament.groups.length > 1">{{ $t('common.group') }} {{ groupsNames[index] }}</h4>
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
    <table v-else id="table-list" class="table is-fullwidth">
        <tr v-for="(team, teamIndex) in sortedTeams" :key="team.title">
            <td>{{team.title}}
                <div class="is-size-7 is-hidden-tablet" v-if="team.players && team.players.length > 1">
                    (<span class="has-text-dark" v-for="(player, index) in team.players" :key="index">{{player.name}}
                                       {{player.surname}}<span v-if="index < team.players.length - 1">, </span></span>)
                </div>
                <div class="is-size-7 has-text-grey is-hidden-tablet" v-if="getTeamClub(team)">{{ getTeamClub(team) }}</div>
            </td>
            <td class="is-hidden-mobile is-size-7" v-if="team.players && team.players.length > 1">
                <span class="has-text-dark" v-for="(player, index) in team.players" :key="index">{{player.name}}
                    {{player.surname}}<span v-if="index < team.players.length - 1">, </span></span>
            </td>
            <td class="is-hidden-mobile is-size-7" v-else></td>
            <td class="is-hidden-mobile is-size-7 has-text-grey" v-if="getTeamClub(team)">
                <span v-for="(line, i) in formatClub(getTeamClub(team))" :key="i">{{ line }}<br v-if="i === 0 && formatClub(getTeamClub(team)).length > 1"></span>
            </td>
            <td class="is-hidden-mobile" v-else></td>
            <td class="td-100" v-if="tournament.useRating">{{team.rating}}</td>
            <td class="td-50" v-if="!previewTournament && (tournament.system === 'supermele' || (!tournament.games?.length && !tournament.playOff))">
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
    props: ['previewTournament', 'activeRound'],
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex']),
        tournament() {
            return this.previewTournament || this.tournaments[this.currentTournamentIndex]
        },
        groupsNames() {
            return tournamentNames
        },
        sortedTeams() {
            if (!this.tournament?.teams) return [];
            if (this.previewTournament) {
                return [...this.tournament.teams].sort((a, b) => a.title.localeCompare(b.title));
            }
            return this.tournament.teams;
        }
    },
    methods: {
        ...mapMutations(['removeTeam']),
        getTeamClub(team) {
            if (team.players && team.players.length && team.players[0].club) {
                return team.players[0].club;
            }
            return null;
        },
        formatClub(club) {
            if (!club) return [];
            const match = club.match(/^(.+?)\s*([«"«].+[»"»])$/);
            if (match) {
                return [match[1], match[2]];
            }
            return [club];
        }
    }
}
</script>