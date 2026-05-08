<template>
    <div class="content tabs-content">
        <PlayOff v-if="tournament.playOff" @openResults="$emit('openResults')"/>
        <Cadrage v-else-if="tournament.cadrage && tournament.cadrage.length" @startPlayOff="$emit('startPlayOff', $event)"/>
        <div v-else>
            <div v-if="tournament.system === 'swiss' && tournament.teams?.length" class="mb-2 has-text-danger">
                {{$t('games.playMaximum')}} <strong class="has-text-danger">{{ maxSwissRounds }}</strong> {{$t('ranking.rounds')}}
            </div>
            <div class="field is-grouped">
                <div class="control" v-if="tournament.games && ((tournament.games.length && !tournament.roundIsActive) || tournament.games.length > 1)">
                    <button class="button is-danger" @click="restoreRoundGames">
                        {{ $t('games.restoreRound') }}
                    </button>
                </div>
                <div class="control" v-if="!tournament.playOff && !tournament.roundIsActive
                && (tournament.games ? tournament.games.length < teamsCount : true) && (tournament.system === 'swiss' ? (activeRound <= maxSwissRounds || !tournament.games && tournament.teams?.length && activeRound <= maxSwissRounds) : true)">
                    <button class="button is-info" @click="drawRound">
                        {{ activeRound === 1 ? `${$t('games.first')}` : `${$t('games.draw')} ${activeRound}` }} {{ $t('common.round') }}
                    </button>
                </div>
            </div>
            <div v-if="tournament.games && tournament.games.length && tournament.roundIsActive">
                <button class="button is-info is-hidden-tablet" @click="compactView = !compactView">{{ $t('games.show') }}<span
                    v-if="!compactView">&nbsp;{{ $t('games.compact') }}&nbsp;</span> <span v-if="compactView">&nbsp;{{ $t('games.full') }}&nbsp;</span> {{ $t('games.view') }}
                </button>
                <h2 class="text-center">{{ $t('common.round') }} {{ activeRound }}</h2>
                <div class="games-list">
                    <Game v-for="(game, index) in tournament.games[activeRound - 1]" :key="index"
                          :game="game" :activeRound="activeRound - 1" :compactView="compactView" :game-index="index"
                          :team1-lanes="tournament.teams.find(team => team.title === game.team_1).lanes"
                          :team2-lanes="tournament.teams.find(team => team.title === game.team_2)?.lanes || null"
                          @save="saveResults"/>
                    <div v-if="scoreError" class="has-text-centered has-text-danger mb-5">{{ $t('games.resultsError') }}
                    </div>
                </div>
                <div class="text-center mt-3">
                    <button class="button is-success" @click="saveResults" :disabled=saveDisabled>{{ $t('games.saveResults') }}</button>
                </div>
                <div class="has-text-danger mt-3" v-if="saveDisabled">{{ $t('games.drawError') }}</div>
            </div>
            <div v-else-if="(tournament.games && tournament.games.length === 0) || !tournament.teams" >{{ $t('games.noGames') }}</div>
            <div v-else-if="tournament.games && tournament.games.length >= teamsCount">{{ $t('games.quantityError') }}</div>
            <div v-else-if="tournament.teams?.length && activeRound < maxSwissRounds" class="mb-5 mt-5">
                {{ $t('games.clickToDraw') }} <b>{{ activeRound === 1 ?  $t('games.first') : activeRound }}</b> {{ $t('common.round') }}
            </div>
        </div>
    </div>
</template>

<script>

import PlayOff from './PlayOff';
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {gameHasError, isScoreError, shuffleArray} from '@/helpers'
import {drawSwissRound, drawSupermeleRound, assignLanes, createGroups, saveResultsForRound} from '@/services/draw'
import Game from "@/components/partials/Game.vue";
import Cadrage from "@/components/partials/Cadrage.vue";

export default {
    name: 'Games',
    components: {Cadrage, Game, PlayOff},
    props: ['activeRound', 'teamsInGroup', 'rankingTeams'],
    data() {
        return {
            saveDisabled: false,
            scoreError: false,
            isRestoredRound: false,
            compactView: false
        }
    },
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'isAdmin', 'currentTournament']),
        tournament() {
            return this.currentTournament
        },
        teamsCount() {
            return this.tournament.system === 'swiss' ? this.tournament.teams.length - 1 :
                this.tournament.groups ? this.tournament.groups[0].length % 2 !== 0 ? this.tournament.groups[0].length :
                    this.tournament.groups[0].length - 1 : this.tournament.teams.length - 1;
        },
        maxSwissRounds() {
            return Math.round(this.tournament.teams?.length / 2)
        }
    },
    methods: {
        ...mapActions(useMainStore, ['startRound', 'endRound', 'addRoundToGames', 'restoreRound', 'showMessage', 'shuffleLanesStore']),
        gameHasError,
        shuffleLanes() {
            const currentRound = this.tournament.games[this.tournament.games.length - 1];
            const reshuffled = assignLanes(shuffleArray([...currentRound]), this.tournament);
            this.shuffleLanesStore(reshuffled);
        },
        drawRound() {
            if (this.tournament.teams.length < 5 && this.tournament.system === 'swiss') {
                this.showMessage({title: this.$t('games.chooseSystem'), text: this.$t('games.chooseSystemText'), type: 'error'});
                return;
            }
            let round = [];

            if (this.tournament.system === 'swiss') {
                const result = drawSwissRound(this.tournament, this.rankingTeams, this.activeRound);
                if (result.error) {
                    this.saveDisabled = true;
                    this.showMessage({title: this.$t('messages.cantDrawRound'), text: this.$t('messages.tooManyGames'), type: 'error'});
                    return;
                }
                round = result.round;
            } else if (this.tournament.system === 'groups') {
                if (this.activeRound === 1) {
                    this.createGroups();
                }
                if (this.tournament.groups) {
                    let game;
                    this.tournament.groups.forEach((group, index) => {
                        const isTechnical = group.length % 2 !== 0;
                        if (this.tournament.games?.length > (isTechnical ? group.length : group.length - 1)) {
                            return;
                        }
                        for (let i = 0; i < this.tournament.groupsScheme[index].top.length; i++) {
                            if (!isTechnical || isTechnical
                                && (this.tournament.groupsScheme[index].top[i] !== group.length && this.tournament.groupsScheme[index].bottom[i] !== group.length)) {
                                game = {
                                    group: index,
                                    team_1: group[this.tournament.groupsScheme[index].top[i]].title,
                                    team_1_score: null,
                                    team_2: group[this.tournament.groupsScheme[index].bottom[i]].title,
                                    team_2_score: null
                                };
                                round.push(game);
                            }
                        }
                        this.tournament.groupsScheme[index].bottom.push(this.tournament.groupsScheme[index].top[this.tournament.groupsScheme[index].top.length - 1]);
                        this.tournament.groupsScheme[index].top.unshift(this.tournament.groupsScheme[index].bottom[0]);
                        this.tournament.groupsScheme[index].top.splice(this.tournament.groupsScheme[index].top.length - 1, 1);
                        this.tournament.groupsScheme[index].top.splice(1, 1);
                        this.tournament.groupsScheme[index].top.unshift(0);
                        this.tournament.groupsScheme[index].bottom.splice(0, 1);
                    });
                }
            } else if (this.tournament.system === 'supermele') {
                round = drawSupermeleRound(this.tournament, this.rankingTeams);
            }
            this.addRoundToGames(assignLanes(shuffleArray(round), this.tournament));
            this.startRound();
        },
        createGroups() {
            if (this.teamsInGroup < 3) {
                this.showMessage({title: this.$t('messages.cantDraw'), text: this.$t('messages.chooseCorrectTeams'), type: 'error'});
                return false;
            }
            const {groups, schemas} = createGroups(this.tournament, this.teamsInGroup);
            this.tournament.groups = groups;
            this.tournament.groupsScheme = schemas;
        },
        saveResults() {
            this.scoreError = false;

            if (this.tournament.games[this.activeRound - 1].some(game => isScoreError(game, this.tournament.preferences.maxScore))) {
                this.scoreError = true;
                return false
            }

            this.saveResultsForRound(this.activeRound - 1);

            if (this.isRestoredRound) {
                this.tournament.teams.forEach(team => {
                    team.wins = 0;
                    team.opponents = [];
                    team.buhgolts = 0;
                    team.smallBuhgolts = 0;
                    team.pointsMinus = 0;
                    team.pointsPlus = 0;
                })
                for (let i = 0; i < this.tournament.games.length; i++) {
                    this.saveResultsForRound(i);
                }
                this.isRestoredRound = false;
            }

            this.endRound();
            this.showMessage({title: this.$t('messages.success'), text: this.$t('messages.resultsSaved')})
        },
        restoreRoundGames(){
            this.isRestoredRound = true;
            if (this.tournament.roundIsActive) {
                this.restoreRound();
                if (this.tournament.system === 'groups') {
                    this.tournament.teams.forEach(team => {
                        team.opponents = ['placeholder'];
                        team.pointsPlus = 0;
                        team.pointsMinus = 0;
                        team.wins = 0;
                    })
                    for (let i = 0; i < this.activeRound - 2; i++) {
                        this.saveResultsForRound(i);
                    }
                }
            } else {
                this.startRound();
            }
        },
        saveResultsForRound(round) {
            saveResultsForRound(this.tournament, round);
        },
    },
}
</script>