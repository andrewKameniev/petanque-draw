<template>
    <div class="game-row" data-testid="game-row" :class="{compact: compactView, 'has-background-danger': gameHasError(game, maxScore)}">
        <div class="text-right team-block" :class="{'has-text-weight-bold': game.team_1_score > game.team_2_score}">
            <label :for="'team_' + gameIndex">{{ game.team_1 }}</label>
            <div v-if="team1Lanes && team1Lanes.length" class="lanes-played is-hidden-mobile">{{ $t('games.lanesPlayed') }}: {{ team1Lanes.map(l => l + 1).join(', ') }}</div>
        </div>
        <span class="text-center score-block">
            <input :id="'team_' + gameIndex" v-model="currentGame.team_1_score" class="input -small" type="number" min="0"
                   :disabled="game.team_2 === 'Technical'"
                   @input="clampScore('team_1_score')"
                   v-if="!compactView">
            <span class="lane-block is-size-7">
                {{ $t('games.lane') }} <span class="is-size-5 has-text-weight-bold">{{ displayLane }}</span>
            </span>
            <input :id="'opponent_' + gameIndex" v-model="currentGame.team_2_score" class="input -small"
                   type="number" min="0" :disabled="game.team_2 === 'Technical'"
                   @input="clampScore('team_2_score')"
                   v-if="!compactView">
        </span>
        <div class="team-block" :class="{'has-text-weight-bold': game.team_2_score > game.team_1_score}">
            <label :for="'opponent_' + gameIndex">{{ game.team_2 }}</label>
            <div v-if="team2Lanes && team2Lanes.length" class="lanes-played is-hidden-mobile">{{ $t('games.lanesPlayed') }}: {{ team2Lanes.map(l => l + 1).join(', ') }}</div>
        </div>
    </div>
</template>

<script>
import {gameHasError} from "@/helpers";
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";

export default {
    name: 'Game',
    props: ['activeTournament', 'gameIndex', 'game', 'activeRound', 'compactView', 'team1Lanes', 'team2Lanes', 'isPlayoff', 'isCadrage', 'isThird', 'laneNumber'],
    methods: {
        ...mapActions(useMainStore, ['updateGameScore']),
        gameHasError,
        clampScore(field) {
            const val = Number(this.currentGame[field]);
            if (val < 0 || isNaN(val)) {
                this.currentGame[field] = null;
            } else if (this.maxScore && val > Number(this.maxScore)) {
                this.currentGame[field] = Number(this.maxScore);
            }
        },
    },
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament']),
        tournament() {
            return this.activeTournament || this.currentTournament
        },
        currentGame() {
            if (this.isThird) {
                return this.tournament.playOffBracket?.thirdPlace || this.game
            }
            else if (this.isCadrage) {
                return this.tournament.cadrage?.[this.gameIndex] || this.game
            }
            else if (this.isPlayoff) {
                if (this.tournament.playOffBracket?.type === 'double') {
                    return this.game;
                }
                return this.tournament.playOffBracket?.stages?.[this.activeRound]?.teams?.[this.gameIndex] || this.game
            } else {
                return this.tournament.games?.[this.activeRound]?.[this.gameIndex] || this.game
            }
        },
        displayLane() {
            if (this.laneNumber != null) {
                return this.laneNumber + this.fieldsStart;
            }
            return this.gameIndex + this.fieldsStart;
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
