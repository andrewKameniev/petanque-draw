<template>
    <div class="game-row" data-testid="game-row" :class="{
        compact: compactView,
        'has-background-danger': gameHasError(game, maxScore),
        'game-row--finished': effectiveStatus === 'finished',
        'game-row--in-progress': effectiveStatus === 'in_progress'
    }">
        <div class="text-right team-block" :class="{'has-text-weight-bold': game.team_1_score > game.team_2_score}">
            <label :for="'team_' + gameIndex">{{ game.team_1 }}</label>
        </div>
        <span class="text-center score-block">
            <input :id="'team_' + gameIndex" v-model="currentGame.team_1_score" class="input -small" type="number" min="0"
                   :disabled="isInputDisabled"
                   @input="onScoreInput('team_1_score')"
                   @focus="onFocus"
                   @blur="onBlur"
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
                   type="number" min="0"
                   :disabled="isInputDisabled"
                   @input="onScoreInput('team_2_score')"
                   @focus="onFocus"
                   @blur="onBlur"
                   v-if="!compactView">
        </span>
        <div class="team-block" :class="{'has-text-weight-bold': game.team_2_score > game.team_1_score}">
            <label :for="'opponent_' + gameIndex">{{ game.team_2 }}</label>
        </div>
        <span v-if="!compactView" class="game-row__action">
            <button v-if="canFinishGame" class="game-row__finish-btn" @click.stop="$emit('finish', gameIndex)">
                {{ $t('games.finish') }}
            </button>
        </span>
    </div>
</template>

<script>
import {gameHasError} from "@/helpers";
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";

export default {
    name: 'Game',
    props: ['activeTournament', 'gameIndex', 'game', 'activeRound', 'compactView', 'isPlayoff', 'isCadrage', 'isThird', 'laneNumber'],
    emits: ['save', 'swapLane', 'update', 'finish'],
    data() {
        return {
            swapMode: false,
            swapTarget: null,
        }
    },
    methods: {
        ...mapActions(useMainStore, ['updateGameScore', 'setActiveGameMatchPath']),
        gameHasError,
        onScoreInput(field) {
            this.clampScore(field);
            if (this.currentGame.status === 'not_started' || !this.currentGame.status) {
                this.currentGame.status = 'in_progress';
                this.currentGame.updated_at = new Date().toISOString();
            }
            this.$emit('update', this.gameIndex);
        },
        clampScore(field) {
            const val = Number(this.currentGame[field]);
            if (val < 0 || isNaN(val)) {
                this.currentGame[field] = null;
            } else if (this.maxScore) {
                const max = Number(this.maxScore);
                if (val > max) {
                    this.currentGame[field] = max;
                }
                const otherField = field === 'team_1_score' ? 'team_2_score' : 'team_1_score';
                const otherVal = Number(this.currentGame[otherField]);
                if (val >= max && otherVal >= max) {
                    this.currentGame[otherField] = max - 1;
                }
            }
        },
        onFocus() {
            if (!this.isPlayoff && !this.isCadrage && !this.isThird) {
                this.setActiveGameMatchPath(`${this.activeRound}/${this.gameIndex}`);
            }
        },
        onBlur() {
            if (!this.isPlayoff && !this.isCadrage && !this.isThird) {
                this.setActiveGameMatchPath(null);
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
        effectiveStatus() {
            return this.game.status || 'not_started';
        },
        isInputDisabled() {
            return this.game.team_2 === 'Technical' || this.effectiveStatus === 'finished';
        },
        canFinishGame() {
            if (this.effectiveStatus === 'finished') return false;
            if (this.isPlayoff || this.isCadrage || this.isThird) return false;
            const s1 = Number(this.game.team_1_score);
            const s2 = Number(this.game.team_2_score);
            if (this.game.team_1_score === null || this.game.team_1_score === '' ||
                this.game.team_2_score === null || this.game.team_2_score === '') return false;
            if (isNaN(s1) || isNaN(s2)) return false;
            return s1 !== s2 && (s1 > 0 || s2 > 0);
        },
        canSwapLane() {
            return !this.compactView && !this.isThird && this.game.team_2 !== 'Technical' && this.effectiveStatus !== 'finished';
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

<style scoped>
.game-row.has-background-danger {
    background: rgba(255, 56, 96, 0.12) !important;
}

.game-row__action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 70px;
    flex-shrink: 0;
    margin-right: 8px;
}

.game-row__finish-btn {
    padding: 4px 10px;
    font-size: 0.75rem;
    font-weight: 600;
    background: var(--color-primary);
    color: var(--color-btn-text, #fff);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: opacity 0.15s;
}

.game-row__finish-btn:hover {
    opacity: 0.85;
}
</style>
