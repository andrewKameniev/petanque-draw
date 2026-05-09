<template>
    <h2 class="teams-heading">{{ $t('teams.currentList') }}</h2>
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
                <button class="team-remove-btn" @click="removeTeam(team.title)">
                    <X :size="16"/>
                </button>
            </td>
        </tr>
    </table>
</template>

<script>
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {tournamentNames} from "@/helpers";
import {X} from "lucide-vue-next";

export default {
    name: "TeamsList",
    components: {X},
    props: ['previewTournament', 'activeRound'],
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament']),
        tournament() {
            return this.previewTournament || this.currentTournament
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
        ...mapActions(useMainStore, ['removeTeam']),
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

<style scoped>
.teams-heading {
    margin-bottom: 0.75rem;
}

.team-remove-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--color-text-muted, #888);
    cursor: pointer;
    transition: all 0.15s;
}

.team-remove-btn:hover {
    background: var(--color-error-bg, #fef2f2);
    color: var(--color-error, #ef4444);
}

.table tr:last-child td {
    border-bottom: none;
}
</style>