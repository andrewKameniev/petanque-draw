<template>
    <div class="modal is-active">
        <div class="modal-background" @click.self="$emit('close-modal')"></div>
        <div class="modal-content">
            <div class="content box">
                <div class="is-flex is-justify-content-space-between mb-3">
                    <h2>{{ tournament.name }}</h2>
                    <button class="button is-danger" @click="removeTournament(tournament.name)">Remove tournament</button>
                </div>
                <div class="card" v-if="tournament.ranking">
                    <header class="card-header" @click="showGames = false; showSwissTable = !showSwissTable">
                        <p class="card-header-title">
                            Results in tables
                        </p>
                        <button class="card-header-icon" aria-label="more options">
                          <span class="icon">
                            <i class="fas fa-angle-down" aria-hidden="true"></i>
                          </span>
                        </button>
                    </header>
                    <div class="card-content" :class="{active: showSwissTable}">
                        <Ranking :gamesList="tournament.swiss"
                                  :showIfUseRating="true" :isPlayOff="tournament.playOff" :rankingTeams="tournament.ranking" :activeRound="false"/>
                    </div>
                </div>
                <div class="card" v-if="tournament.swiss">
                    <header class="card-header" @click="showSwissTable = false; showGames = !showGames">
                        <p class="card-header-title">
                            Games
                        </p>
                        <button class="card-header-icon" aria-label="more options">
                          <span class="icon">

                          </span>
                        </button>
                    </header>
                    <div class="card-content" :class="{active: showGames}">
                        <div class="table-container">
                            <table v-if="tournament.swiss" class="table is-striped mb-5">
                                <tbody>
                                <template v-for="(round, index) in tournament.swiss" :key="index">
                                    <tr v-for="(game, i) in round" :key="i">
                                        <td>R{{index + 1}}</td>
                                        <td>{{game.team_1}}</td>
                                        <td>{{game.team_1_score}}</td>
                                        <td>{{game.team_2_score}}</td>
                                        <td>{{game.team_2}}</td>
                                    </tr>
                                </template>
                                </tbody>
                            </table>
                        </div>
                        <div v-for="(stage, index) in tournament.playOff.stages" :key="index" class="mb-5">
                            <h3 class="has-text-centered">{{stage.stageLabel === 1 ? 'Final' : '1/' + stage.stageLabel + ' final'}}</h3>
                            <div class="table-container">
                                <table class="table is-striped">
                                    <tbody>
                                        <tr v-for="(game, i) in stage.teams" :key="i">
                                            <td>{{game.team_1}}</td>
                                            <td>{{game.team_1_score}}</td>
                                            <td>{{game.team_2_score}}</td>
                                            <td>{{game.team_2}}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <button class="modal-close is-large" aria-label="close" @click="$emit('close-modal')"></button>
    </div>
</template>

<script>
import Ranking from './Ranking';
export default {
    name: 'SavedTournamentModal',
    components: {Ranking},
    props: ['tournament'],
    emits: ['close-modal', 'remove-tournament'],
    data() {
        return {
            showSwissTable: false,
            showGames: false
        }
    },
    methods: {
        removeTournament(name) {
            this.$emit('remove-tournament', name)
        }
    }
}
</script>

<style scoped>
    .card-content {
        max-height: 0;
        overflow: hidden;
        box-sizing: border-box;
        padding-top: 0;
        padding-bottom: 0;
        transition: all 0.3s linear;
    }
    .card-content.active {
        max-height: none;
        padding-top: 24px;
        padding-bottom: 24px;
    }
    .card-header-title {
        margin-bottom: 0 !important;
    }
    .card-header {
        cursor: pointer;
    }
</style>