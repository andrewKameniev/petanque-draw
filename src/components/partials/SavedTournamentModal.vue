<template>
    <Modal @close-modal="$emit('close-modal')">
        <div class="content is-flex is-justify-content-space-between mb-3" style="gap: 24px">
            <h2>{{ tournament.name }}</h2>
            <button class="button is-danger" @click="removeSavedTournament(tournament.id); $emit('close-modal')">{{ $t('teams.removeTournament') }}</button>
        </div>
        <div class="card" v-if="tournament.ranking">
            <header class="card-header" @click="showGames = false; showSwissTable = !showSwissTable">
                <p class="card-header-title">
                    {{ $t('modals.resultsInTable') }}
                </p>
                <button class="card-header-icon" aria-label="more options" :class="{active: showSwissTable}">
                  <span class="icon">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.66992 5.75293C1.31113 5.39414 1.31113 4.8129 1.66992 4.4541C2.02873 4.09551 2.61002 4.09537 2.96875 4.4541L7.11621 8.60156L11.2637 4.4541C11.6224 4.0954 12.2037 4.09543 12.5625 4.4541C12.9213 4.81288 12.9212 5.39413 12.5625 5.75293L7.11621 11.2002L1.66992 5.75293Z" fill="#0B1B48"/>
                    </svg>
                  </span>
                </button>
            </header>
            <div class="card-content" :class="{active: showSwissTable}">
                <Ranking :tournament="tournament"
                         :rankingTeams="sortTeams(tournament.teams)" showInSaved="true"/>
            </div>
        </div>
        <div class="card" v-if="tournament.games">
            <header class="card-header" @click="showSwissTable = false; showGames = !showGames">
                <p class="card-header-title">
                    {{ $t('common.games') }}
                </p>
                <button class="card-header-icon" aria-label="more options" :class="{active: showGames}">
                  <span class="icon">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.66992 5.75293C1.31113 5.39414 1.31113 4.8129 1.66992 4.4541C2.02873 4.09551 2.61002 4.09537 2.96875 4.4541L7.11621 8.60156L11.2637 4.4541C11.6224 4.0954 12.2037 4.09543 12.5625 4.4541C12.9213 4.81288 12.9212 5.39413 12.5625 5.75293L7.11621 11.2002L1.66992 5.75293Z" fill="#0B1B48"/>
                    </svg>
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
                        <h3 class="has-text-centered">{{stage.stageLabel === 1 ? $t('games.final') : '1/' + stage.stageLabel + ' ' + $t('games.ofFinal')}}</h3>
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
import {sortTeams} from "@/helpers";
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
    methods: {
      ...mapMutations(['removeSavedTournament']),
        sortTeams
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