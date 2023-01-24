<template>
    <Modal @close-modal="$emit('close-modal')">
        <div class="content is-flex is-justify-content-space-between mb-3">
            <h2>{{ tournament.name }}</h2>
            <button class="button is-danger" @click="removeSavedTournament(tournament.name); $emit('close-modal')">Remove tournament</button>
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
                <Ranking :tournament="tournament"
                         :rankingTeams="tournament.ranking" showInSaved="true"/>
            </div>
        </div>
        <div class="card" v-if="tournament.games">
            <header class="card-header" @click="showSwissTable = false; showGames = !showGames">
                <p class="card-header-title">
                    Games
                </p>
                <button class="card-header-icon" aria-label="more options">
                  <span class="icon">
                      <i class="fas fa-angle-down" aria-hidden="true"></i>
                  </span>
                </button>
            </header>
            <div class="card-content" :class="{active: showGames}">
                <div class="table-container">
                    <table v-if="tournament.games" class="table is-striped mb-5">
                        <tbody>
                        <template v-for="(round, index) in tournament.games" :key="index">
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
                <div v-if="tournament.playOff">
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
    </Modal>
</template>

<script>
import Ranking from './Ranking';
import {mapMutations} from "vuex";
import Modal from "@/components/Modal";
export default {
    name: 'SavedTournamentModal',
    components: {Modal, Ranking},
    props: ['tournament'],
    emits: ['close-modal'],
    data() {
        return {
            showSwissTable: false,
            showGames: false
        }
    },
    methods: mapMutations(['removeSavedTournament'])
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