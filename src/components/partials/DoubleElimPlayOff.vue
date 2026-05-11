<template>
    <div class="container content" v-if="bracket">
        <div class="is-flex is-justify-content-space-between is-align-content-center" v-if="!isPublicView && bracket.currentSide !== 'finished'">
            <h2>{{ $t('games.playOff') }} — {{ $t('ranking.doubleElimination') }}</h2>
            <button class="button btn-purple-outline" @click="showBracket = true">
                <GitFork :size="16" style="transform: rotate(90deg); margin-right: 0.3rem;"/>
                {{ $t('games.showBracket') }}
            </button>
        </div>

        <div class="column play-off-stage-wrapper" data-testid="double-elim-wrapper">
            <FinishedBanner v-if="bracket.currentSide === 'finished' && !isPublicView" @openResults="$emit('openResults')"/>

            <template v-else>
                <div class="de-tabs" v-if="bracket.currentSide !== 'grandFinal'">
                    <span class="de-tab" :class="{'de-tab--active': bracket.currentSide === 'winner'}">
                        {{ $t('ranking.winnerBracket') }}
                    </span>
                    <span class="de-tab" :class="{'de-tab--active': bracket.currentSide === 'loser'}">
                        {{ $t('ranking.loserBracket') }}
                    </span>
                </div>

                <template v-if="bracket.currentSide === 'winner'">
                    <h3 class="text-center" data-testid="de-stage-heading">
                        {{ $t('ranking.winnerBracket') }} — {{ stageHeading(currentWbStage) }}
                    </h3>
                    <Game v-for="(game, ind) in currentWbStage.teams" :key="'wb'+ind"
                          :active-tournament="tournament"
                          :game="game" :game-index="ind" :is-playoff="true"
                          :active-round="0" :compact-view="isPublicView" @save="saveResults"/>
                </template>

                <template v-else-if="bracket.currentSide === 'loser'">
                    <h3 class="text-center" data-testid="de-stage-heading">
                        {{ $t('ranking.loserBracket') }} — {{ $t('ranking.round') }} {{ currentLbStage.round }}
                    </h3>
                    <Game v-for="(game, ind) in currentLbStage.teams" :key="'lb'+ind"
                          :active-tournament="tournament"
                          :game="game" :game-index="ind" :is-playoff="true"
                          :active-round="0" :compact-view="isPublicView" @save="saveResults"/>
                </template>

                <template v-else-if="bracket.currentSide === 'grandFinal'">
                    <h3 class="text-center" data-testid="de-stage-heading">
                        {{ $t('ranking.grandFinal') }}
                    </h3>
                    <Game :game="bracket.grandFinal" :game-index="0" :is-playoff="true"
                          :active-tournament="tournament"
                          :active-round="0" :compact-view="isPublicView" @save="saveResults"/>
                </template>

                <div v-if="scoreError" class="has-text-centered has-text-danger mb-5 mt-5">{{ $t('games.resultsError') }}</div>
                <div class="text-center mt-5" v-if="!activeTournament">
                    <button class="button btn-save-results" data-testid="btn-save-double-elim" @click="saveResults">
                        <Save :size="16" class="mr-1"/> {{ $t('games.saveResults') }}
                    </button>
                </div>
            </template>
        </div>

        <DoubleBracket v-if="showBracket" :bracket="bracket" @close-modal="showBracket = false"/>
    </div>
</template>

<script>
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {isScoreError} from "@/helpers";
import {progressDoubleElimWinner, progressDoubleElimLoser, progressGrandFinal} from "@/services/doubleElimination";
import Game from "@/components/partials/Game.vue";
import DoubleBracket from "@/components/partials/DoubleBracket.vue";
import {Save, GitFork} from "lucide-vue-next";
import FinishedBanner from "@/components/partials/FinishedBanner.vue";

export default {
    name: 'DoubleElimPlayOff',
    props: ['activeTournament', 'isPublicView'],
    emits: ['openResults'],
    components: {Game, DoubleBracket, Save, GitFork, FinishedBanner},
    data() {
        return {
            scoreError: false,
            showBracket: false,
        }
    },
    computed: {
        ...mapState(useMainStore, ['currentTournament']),
        tournament() {
            return this.activeTournament || this.currentTournament;
        },
        bracket() {
            return this.tournament?.playOffBracket?.type === 'double' ? this.tournament.playOffBracket : null;
        },
        currentWbStage() {
            if (!this.bracket || this.bracket.currentSide !== 'winner') return null;
            return this.bracket.winnerStages[this.bracket.currentStageIndex];
        },
        currentLbStage() {
            if (!this.bracket || this.bracket.currentSide !== 'loser') return null;
            return this.bracket.loserStages[this.bracket.currentStageIndex];
        },
    },
    methods: {
        ...mapActions(useMainStore, ['setPlayOffBracket', 'setPlayOffStage', 'finishTournament']),
        stageHeading(stage) {
            if (!stage) return '';
            if (stage.teams.length === 1) return this.$t('games.final');
            return '1/' + stage.stageLabel + ' ' + this.$t('games.ofFinal');
        },
        saveResults() {
            this.scoreError = false;
            const maxScore = this.tournament.preferences.maxScore;

            let currentGames;
            if (this.bracket.currentSide === 'winner') {
                currentGames = this.currentWbStage.teams;
            } else if (this.bracket.currentSide === 'loser') {
                currentGames = this.currentLbStage.teams;
            } else if (this.bracket.currentSide === 'grandFinal') {
                currentGames = [this.bracket.grandFinal];
            } else {
                return;
            }

            if (currentGames.some(game => isScoreError(game, maxScore))) {
                this.scoreError = true;
                return;
            }

            let updated = JSON.parse(JSON.stringify(this.bracket));

            if (updated.currentSide === 'winner') {
                updated = progressDoubleElimWinner(updated, updated.currentStageIndex);
            } else if (updated.currentSide === 'loser') {
                updated = progressDoubleElimLoser(updated, updated.currentStageIndex);
            } else if (updated.currentSide === 'grandFinal') {
                updated = progressGrandFinal(updated);
                this.setPlayOffBracket(updated);
                this.setPlayOffStage(0);
                this.finishTournament();
                return;
            }

            this.setPlayOffBracket(updated);
        },
    },
}
</script>

<style scoped>
.de-tabs {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 1rem;
}

.de-tab {
    padding: 0.4rem 1rem;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 600;
    background: #f0f0f0;
    color: #666;
}

.de-tab--active {
    background: #7c3aed;
    color: #fff;
}

.btn-save-results {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: #10B981;
    color: #fff;
    border: none;
    font-weight: 600;
    padding: 0.6rem 1.5rem;
    border-radius: 6px;
}

.btn-save-results:hover {
    background: #059669;
    color: #fff;
}

.btn-save-results:focus,
.btn-save-results.is-focused,
.btn-save-results:active {
    outline: none;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.4) !important;
    border-color: transparent;
}
</style>
