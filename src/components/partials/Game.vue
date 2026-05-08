<template>
    <div class="game-row" :class="{compact: compactView, 'has-background-danger': gameHasError(game, maxScore)}">
        <div class="text-right team-block" :class="{'has-text-weight-bold is-underlined': game.team_1_score > game.team_2_score}">
            <label :for="'team_' + gameIndex">{{ game.team_1 }}</label>
            <div class="has-text-grey is-hidden-mobile"><sup v-for="(lane, index) in team1Lanes" :key="index">{{lane + 1}},</sup></div>
        </div>
        <span class="text-center score-block">
            <input :id="'team_' + gameIndex" v-model="currentGame.team_1_score" class="input -small" type="number"
                   :disabled="game.team_2 === 'Technical'"
                   @keyup.enter="$emit('save')"
                   v-if="!compactView">
            <span class="lane-block is-size-7">
                {{ $t('games.lane') }} <span class="is-size-5 has-text-weight-bold">{{ gameIndex + fieldsStart }}</span>
            </span>
            <input :id="'opponent_' + gameIndex" v-model="currentGame.team_2_score" class="input -small"
                   type="number" :disabled="game.team_2 === 'Technical'"
                   @keyup.enter="$emit('save')"
                   v-if="!compactView">
        </span>
        <div class="team-block" :class="{'has-text-weight-bold is-underlined': game.team_2_score > game.team_1_score}">
            <label :for="'opponent_' + gameIndex">{{ game.team_2 }}</label>
            <div class="has-text-grey is-hidden-mobile"><sup v-for="(lane, index) in team2Lanes" :key="index">{{lane + 1}},</sup></div>
        </div>
    </div>
</template>

<script>
import {gameHasError} from "@/helpers";
import {mapGetters, mapMutations} from "vuex";

export default {
    name: 'Game',
    props: ['activeTournament', 'gameIndex', 'game', 'activeRound', 'compactView', 'team1Lanes', 'team2Lanes', 'isPlayoff', 'isCadrage', 'isThird'],
    methods: {...mapMutations(['updateGameScore']), gameHasError},
    computed: {
        ...mapGetters(['currentTournament']),
        tournament() {
            return this.activeTournament || this.currentTournament
        },
        currentGame() {
            if (this.isThird) {
                return this.tournament.playOffBracket.thirdPlace
            }
            else if (this.isCadrage) {
                return this.tournament.cadrage[this.gameIndex]
            }
            else if (this.isPlayoff) {
                return this.tournament.playOffBracket.stages[this.activeRound].teams[this.gameIndex]
            } else {
                return this.tournament.games[this.activeRound][this.gameIndex]
            }
        },
        maxScore() {
            return this.tournament.preferences.maxScore
        },
        fieldsStart() {
            return this.tournament.preferences.fieldsStart
        },
    }
}
</script>
