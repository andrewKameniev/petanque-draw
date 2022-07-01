<template>
    <div>
        <div class="is-flex is-justify-content-space-between is-align-content-center">
            <h2>PlayOff</h2>
            <button class="button is-info" @click="showBracket = true">Show play off bracket</button>
        </div>
        <div class="column play-off-stage-wrapper" v-if="playOffBracket">
            <div v-if="playOffStageCurrent === 0" class="has-text-centered is-size-4">
                Tournament has finished. <a href="#" @click.prevent="$emit('finishTournament')">See result</a>
            </div>
            <Fragment v-else>
                <h2 class="text-center">{{playOffStageCurrent === 1 ? 'Final' : '1/' + playOffStageCurrent + ' final'}}</h2>
                <div class="game-row" v-for="(game, ind) in playOffBracket.stages[currentPlayOffBracketIndex].teams" :key="ind">
                    <span class="text-right team-block">
                        <label :for="'team_' + ind">{{ game.team_1 }}</label>
                    </span>
                    <span class="text-center score-block">
                        <input :id="'team_' + ind" v-model="game.team_1_score" class="input -small"
                               type="number" min="0" max="13" @keyup.enter="saveResults">
                        <span class="lane-block is-size-7">
                            Lane <span class="is-size-5 has-text-weight-bold">{{ ind + 1 }}</span>
                        </span>
                        <input :id="'opponent_' + ind" v-model="game.team_2_score" class="input -small"
                               type="number" min="0" max="13" @keyup.enter="saveResults">
                    </span>
                    <span class="team-block">
                        <label :for="'opponent_' + ind">{{ game.team_2 }}</label>
                    </span>
                </div>
                <div v-if="playOffStageCurrent === 1 && playOffTeams.length > 1">
                    <h3 class="text-center">Game for 3d place</h3>
                    <div class="game-row">
                        <span class="text-right team-block">
                            <label :for="'team_1_3p'">{{ playOffBracket.thirdPlace.team_1 }}</label>
                        </span>
                        <span class="text-center score-block">
                            <input :id="'team_1_3p'" v-model="playOffBracket.thirdPlace.team_1_score" class="input -small"
                                   type="number" min="0" max="13" @keyup.enter="saveResults">
                            <span class="lane-block is-size-7">
                                Lane <span class="is-size-5 has-text-weight-bold">2</span>
                            </span>
                            <input :id="'opponent_3p'" v-model="playOffBracket.thirdPlace.team_2_score" class="input -small"
                                   type="number" min="0" max="13" @keyup.enter="saveResults">
                        </span>
                        <span class="team-block">
                            <label :for="'opponent_3p'">{{ playOffBracket.thirdPlace.team_2 }}</label>
                        </span>
                    </div>
                </div>
                <div v-if="scoreError" class="has-text-centered has-text-danger mb-5">Something wrong in games results</div>
                <div class="text-center">
                    <button class="button is-success" @click="saveResults">Save results</button>
                </div>
            </Fragment>
        </div>
        <Bracket v-if="showBracket" :bracket="playOffBracket" @close-modal="showBracket = false"/>
    </div>
</template>

<script>
import Bracket from './Bracket';
export default {
    name: 'PlayOff',
    props: ['playOffTeams'],
    emits: ['finishTournament'],
    components: {Bracket},
    data(){
        return {
            playOffStageCurrent: localStorage.getItem('playOffStage') ? +localStorage.getItem('playOffStage') : this.playOffTeams[0].stage,
            playOffBracket: localStorage.getItem('playOffBracket') ?  JSON.parse(localStorage.getItem('playOffBracket')) : null,
            scoreError: false,
            showBracket: false,
        }
    },
    mounted() {
        console.log(this.playOffTeams);
        if(!localStorage.getItem('playOffBracket')){
            this.getPlayOffBracket();
        }
    },
    methods: {
        saveResults() {
            this.scoreError = false;
            console.log(this.currentPlayOffBracketIndex);
            const resultsError = (game) => (game.team_1_score === null || game.team_1_score < 0 || game.team_1_score > 13) || (game.team_2_score === null || game.team_2_score < 0 || game.team_2_score > 13)
            if(this.playOffBracket.stages[this.currentPlayOffBracketIndex].teams.some(game => resultsError(game))){
                this.scoreError = true;
                return false
            }
            if(this.playOffBracket.stages[this.currentPlayOffBracketIndex].teamsCount === 2){ //final
                this.playOffStageCurrent = 0
                this.$emit('finishTournament');
            } else {
                this.playOffBracket.stages[this.currentPlayOffBracketIndex].teams.forEach((game, index) => {
                    if(index % 2 === 0){
                        this.playOffBracket.stages[this.currentPlayOffBracketIndex + 1].teams[index / 2].team_1 = game.team_1_score > game.team_2_score ? game.team_1 : game.team_2
                        if(this.playOffBracket.stages[this.currentPlayOffBracketIndex].teamsCount === 4){ //third place
                            this.playOffBracket.thirdPlace.team_1 =  game.team_1_score < game.team_2_score ? game.team_1 : game.team_2
                        }
                    } else {
                        this.playOffBracket.stages[this.currentPlayOffBracketIndex + 1].teams[(index - 1) / 2].team_2 = game.team_1_score > game.team_2_score ? game.team_1 : game.team_2
                        if(this.playOffBracket.stages[this.currentPlayOffBracketIndex].teamsCount === 4){ //third place
                            this.playOffBracket.thirdPlace.team_2 = game.team_1_score < game.team_2_score ? game.team_1 : game.team_2
                        }
                    }

                })

                this.playOffStageCurrent = this.playOffStageCurrent / 2;
            }
            localStorage.setItem('playOffBracket', JSON.stringify(this.playOffBracket))
        },
        getPlayOffBracket(){
            let brackets = {
                stages: [],
                thirdPlace: {}
            };
            for (let i = this.stagesCount; i > 0; i--){
                const teamsCount = Math.pow(2, i);
                const stageLabel = teamsCount/2;
                let teams = []
                if(i === this.stagesCount){
                    teams = this.playOffTeams;
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
                const stage = {
                    teamsCount: teamsCount,
                    stageLabel: stageLabel,
                    teams: teams,
                }
                brackets.stages.push(stage)
            }
            console.log(brackets);
            this.playOffBracket = brackets
        },
    },
    computed: {
        stagesCount(){
            return Math.log(this.playOffTeams.length * 2) / Math.log(2);
        },
        currentPlayOffBracketIndex(){
            if(this.playOffBracket){
                return this.playOffBracket.stages.findIndex(item => item.stageLabel === this.playOffStageCurrent)
            } else {
                return '0'
            }
        }
    },
    watch: {
        playOffStageCurrent() {
            localStorage.setItem('playOffStage', this.playOffStageCurrent)
        }
    }
}
</script>