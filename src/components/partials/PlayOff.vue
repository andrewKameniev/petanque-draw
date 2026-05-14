<template>
    <div v-if="tournament" :class="{'container': !isPublicView || playOffStageCurrent !== 0, 'content': activeTournament && (!isPublicView || playOffStageCurrent !== 0)}">
        <div class="is-flex is-justify-content-space-between is-align-content-center" v-if="!hideHeader && (!isPublicView || playOffStageCurrent !== 0)">
            <h2 v-if="playOffStageCurrent !== 0">{{ $t('games.playOff') }}</h2>
            <button v-if="!isPublicView && playOffStageCurrent !== 0" class="button btn-purple-outline" @click="showBracket = true"><GitFork :size="16" style="transform: rotate(90deg); margin-right: 0.3rem;"/> {{ $t('games.showBracket') }}</button>
        </div>
        <div class="column play-off-stage-wrapper" data-testid="playoff-wrapper" v-if="playOffBracket">
            <FinishedBanner v-if="playOffStageCurrent === 0 && !isPublicView" @openResults="$emit('openResults')"/>
            <template v-else-if="playOffStageCurrent && playOffStageCurrent !== 0 && currentPlayOffBracketIndex >= 0 && playOffBracket.stages?.[currentPlayOffBracketIndex]">
                <h2 class="text-center" data-testid="playoff-stage-heading">{{playOffStageCurrent === 1 ? $t('games.final') : '1/' + playOffStageCurrent + ' ' + $t('games.ofFinal')}}</h2>
                <Game v-for="(game, ind) in playOffBracket.stages[currentPlayOffBracketIndex].teams" :key="ind"
                      :active-tournament="tournament"
                      :game="game" :game-index="ind" :is-playoff="true"
                      :lane-number="currentStageLaneOrder[ind]"
                      :active-round="currentPlayOffBracketIndex" :compact-view="isPublicView" @save="saveResults"/>
                <div v-if="playOffStageCurrent === 1 && tournament.playOff.length > 1">
                    <h3 class="text-center mt-5">{{ $t('games.thirdPlace') }}</h3>
                    <Game :game="playOffBracket.thirdPlace" :is-third="true"
                          :active-tournament="tournament" :compact-view="isPublicView" :game-index="1" @save="saveResults"/>
                </div>
                <div v-if="scoreError" class="has-text-centered has-text-danger mb-5 mt-5">{{ $t('games.resultsError') }}</div>
                <div class="text-center mt-5" v-if="!activeTournament">
                    <button class="button btn-save-results" data-testid="btn-save-playoff" @click="saveResults"><Save :size="16" class="mr-1"/> {{ $t('games.saveResults') }}</button>
                </div>
            </template>
        </div>
        <Bracket v-if="showBracket" :bracket="playOffBracket" @close-modal="showBracket = false"/>
    </div>
</template>

<script>
import Bracket from './Bracket';
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {isScoreError, shuffleArray} from "@/helpers";
import Game from "@/components/partials/Game.vue";
import {Save, GitFork} from "lucide-vue-next";
import FinishedBanner from "@/components/partials/FinishedBanner.vue";

export default {
    name: 'PlayOff',
    props: ['activeTournament', 'isPublicView', 'hideHeader'],
    emits: ['openResults'],
    components: {Game, Bracket, Save, GitFork, FinishedBanner},
    data(){
        return {
            scoreError: false,
            showBracket: false,
        }
    },
    mounted() {
        if(!this.tournament.playOffBracket && this.tournament.playOff?.length){
            this.getPlayOffBracket();
        }
    },
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament']),
        tournament() {
            return this.activeTournament || this.currentTournament
        },
        playOffStageCurrent() {
            if ('playOffStage' in this.tournament) return this.tournament.playOffStage
            return this.tournament.playOff?.[0]?.stage ?? null
        },
        playOffBracket() {
            return this.tournament.playOffBracket ? this.tournament.playOffBracket : null
        },
        stagesCount(){
            return Math.log(this.tournament.playOff.length * 2) / Math.log(2);
        },
        currentPlayOffBracketIndex(){
            if(this.tournament.playOffBracket?.stages){
                return this.tournament.playOffBracket.stages.findIndex(item => item.stageLabel === this.playOffStageCurrent)
            } else {
                return 0
            }
        },
        currentStageLaneOrder() {
            const stage = this.playOffBracket?.stages?.[this.currentPlayOffBracketIndex];
            if (stage?.laneOrder) {
                return stage.laneOrder;
            }
            return Array.from({length: stage?.teams?.length || 0}, (_, k) => k);
        }
    },
    methods: {
        shuffleArray,
        ...mapActions(useMainStore, ['finishTournament', 'setPlayOffBracket', 'setPlayOffStage']),
        saveResults() {
            this.scoreError = false;
            if(this.playOffBracket.stages[this.currentPlayOffBracketIndex].teams.some(game => isScoreError(game, this.tournament.preferences.maxScore))){
                this.scoreError = true;
                return false
            }
            if(this.playOffBracket.stages[this.currentPlayOffBracketIndex].teamsCount === 2){ //final
                this.setPlayOffStage(0)
                this.finishTournament();
            } else {
                let bracket = JSON.parse(JSON.stringify(this.playOffBracket));
                bracket.stages[this.currentPlayOffBracketIndex].teams.forEach((game, index) => {
                    if(index % 2 === 0){
                        bracket.stages[this.currentPlayOffBracketIndex + 1].teams[index / 2].team_1 = game.team_1_score > game.team_2_score ? game.team_1 : game.team_2
                        if(bracket.stages[this.currentPlayOffBracketIndex].teamsCount === 4){ //third place
                            if (!bracket.thirdPlace) {
                                bracket.thirdPlace = {}
                            }
                            bracket.thirdPlace.team_1 =  game.team_1_score < game.team_2_score ? game.team_1 : game.team_2
                        }
                    } else {
                        bracket.stages[this.currentPlayOffBracketIndex + 1].teams[(index - 1) / 2].team_2 = game.team_1_score > game.team_2_score ? game.team_1 : game.team_2
                        if(bracket.stages[this.currentPlayOffBracketIndex].teamsCount === 4){ //third place
                            if (!bracket.thirdPlace) {
                                bracket.thirdPlace = {}
                            }
                            bracket.thirdPlace.team_2 = game.team_1_score < game.team_2_score ? game.team_1 : game.team_2
                        }
                    }

                })
                this.setPlayOffBracket(bracket);
                this.setPlayOffStage(this.playOffStageCurrent / 2)
            }
        },
        getPlayOffBracket() {
            let brackets = {
                stages: [],
                thirdPlace: {}
            };
            for (let i = this.stagesCount; i > 0; i--){
                const teamsCount = Math.pow(2, i);
                const stageLabel = teamsCount/2;
                let teams = []
                if(i === this.stagesCount){
                    teams = this.tournament.playOff;
                } else {
                    for (let j = 1; j <= stageLabel; j++){
                        const game = {
                            id: i + 1,
                            stage: stageLabel,
                            team_1: null,
                            team_1_score: null,
                            team_2: null,
                            team_2_score: null,
                        };

                        teams.push(game)
                    }
                }
                const laneOrder = this.shuffleArray(Array.from({length: teams.length}, (_, k) => k));
                const stage = {
                    teamsCount: teamsCount,
                    stageLabel: stageLabel,
                    teams: teams,
                    laneOrder: laneOrder,
                }
                brackets.stages.push(stage)
            }
            if(this.tournament.cadrage){
                const seeding = this.getTournamentSeeding(this.tournament.cadrage.length);
                const sortedCadrage = this.tournament.cadrage.sort((a,b) => (a.team_2_place - b.team_2_place));
                let cadrageArray = [];
                seeding.forEach(seed => {
                    const game = sortedCadrage[seed - 1]
                    if(game){
                        cadrageArray.push(game)
                    }
                })
                const cadrageStage = {
                    teamsCount: this.tournament.cadrage.length * 2,
                    stageLabel: 'cadrage',
                    teams: cadrageArray,
                }
                brackets.stages.unshift(cadrageStage)
            }
            this.setPlayOffBracket(brackets);
        },
        getTournamentSeeding(n) {
            let seeding = [1];
            while (seeding.length < n) {
                let nextSeeding = [];
                let currentTotal = seeding.length * 2;
                for (let i = 0; i < seeding.length; i++) {
                    const team = seeding[i];
                    const partner = currentTotal + 1 - team;
                    if (i % 2 === 0) {
                        nextSeeding.push(team, partner);
                    } else {
                        nextSeeding.push(partner, team);
                    }
                }
                seeding = nextSeeding;
            }
            return seeding;
        }
    },
}
</script>

<style scoped>

.btn-save-results {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: var(--color-success);
    color: var(--color-btn-text);
    border: none;
    font-weight: 600;
    padding: 0.6rem 1.5rem;
    border-radius: 6px;
}

.btn-save-results:hover {
    background: var(--color-success-hover);
    color: var(--color-btn-text);
}

.btn-save-results:focus,
.btn-save-results.is-focused,
.btn-save-results:active {
    outline: none;
    box-shadow: 0 0 0 3px var(--color-primary-shadow) !important;
    border-color: transparent;
}
</style>