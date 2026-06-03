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
            <span class="lane-block is-size-7" :class="{'lane-block--clickable': canSwapLane}" @click="startSwap">
                <template v-if="swapMode">
                    <input ref="swapInput" class="swap-lane-input" type="number" min="1"
                           v-model.number="swapTarget"
                           @keydown.enter.stop="confirmSwap"
                           @keydown.escape="cancelSwap"
                           @blur="cancelSwap">
                </template>
                <template v-else>
                    {{ $t('games.lane') }} <span class="is-size-5 has-text-weight-bold">{{ displayLane }}</span>
                </template>
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
    emits: ['save', 'swapLane'],
    data() {
        return {
            swapMode: false,
            swapTarget: null,
        }
    },
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
        startSwap() {
            if (!this.canSwapLane) return;
            this.swapMode = true;
            this.swapTarget = this.displayLane;
            this.$nextTick(() => {
                this.$refs.swapInput?.focus();
                this.$refs.swapInput?.select();
            });
        },
        confirmSwap() {
            this._confirmed = true;
            if (this.swapTarget && this.swapTarget !== this.displayLane) {
                this.$emit('swapLane', { fromIndex: this.gameIndex, targetLane: this.swapTarget });
            }
            this.swapMode = false;
        },
        cancelSwap() {
            setTimeout(() => {
                if (!this._confirmed) this.swapMode = false;
                this._confirmed = false;
            }, 100);
        },
    },
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament']),
        tournament() {
            return this.activeTournament || this.currentTournament
        },
        canSwapLane() {
            return !this.compactView && !this.isThird && this.game.team_2 !== 'Technical';
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
