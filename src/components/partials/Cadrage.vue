<script>
import Game from "@/components/partials/Game.vue";
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {getTeamsRanking, isScoreError} from "@/helpers";
import {Timer} from "lucide-vue-next";
import RoundTimer from "@/components/partials/RoundTimer.vue";

export default {
    name: "Cadrage",
    props: ['activeTournament', 'isPublicView'],
    emits: ['startPlayOff'],
    components: {Game, Timer, RoundTimer},
    data() {
        return {
            scoreError: false,
        }
    },
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament']),
        tournament() {
            return this.activeTournament || this.currentTournament
        },
        rankingTeams() {
            return getTeamsRanking(this.tournament)
        },
        showTimerSection() {
            if (this.isPublicView) return false;
            if (!this.tournament.preferences?.timeLimitEnabled) return false;
            return true;
        },
    },
    methods: {
        ...mapActions(useMainStore, ['saveCadrageScores', 'syncToFirebase', 'startRoundTimer', 'endRoundTimer', 'clearRoundTimer', 'restartRoundTimer']),
        onTimerEnded() {
            this.endRoundTimer();
        },
        onTimerRestart(minutes) {
            this.restartRoundTimer(minutes);
        },
        swapCadrageLane({ fromIndex, targetLane }) {
            const fieldsStart = this.tournament.preferences.fieldsStart;
            const targetIndex = targetLane - fieldsStart;
            const cadrage = this.tournament.cadrage;
            if (targetIndex < 0 || targetIndex >= cadrage.length || targetIndex === fromIndex) return;
            const temp = cadrage[fromIndex];
            cadrage[fromIndex] = cadrage[targetIndex];
            cadrage[targetIndex] = temp;
            this.syncToFirebase();
        },
        saveResults() {
            this.scoreError = false;
            if (this.tournament.cadrage.some(game => isScoreError(game, this.tournament.preferences.maxScore))) {
                this.scoreError = true;
                return;
            }
            this.tournament.cadrage.forEach(game => {
                game.team_1_score = Number(game.team_1_score);
                game.team_2_score = Number(game.team_2_score);
                game.status = 'finished';
                game.winner = game.team_1_score > game.team_2_score ? game.team_1 : game.team_2;
            });
            let teamsToPlayOff = this.rankingTeams.slice(0, this.tournament.preferences.playOffTeams / 2);
            this.tournament.cadrage.forEach(game => {
                if (game.team_1_score > game.team_2_score) {
                    teamsToPlayOff.push(this.rankingTeams.find(team => team.title === game.team_1))
                } else if (game.team_2_score > game.team_1_score) {
                    teamsToPlayOff.push(this.rankingTeams.find(team => team.title === game.team_2))
                }
            })
            teamsToPlayOff = teamsToPlayOff.sort((a,b) => (a.team_1_place || a.team_2_place) - (b.team_1_place || b.team_2_place));
            this.clearRoundTimer();
            this.saveCadrageScores();
            this.$emit('startPlayOff', teamsToPlayOff);
        },
    }
}
</script>

<template>
    <div>
        <h2 class="text-center" data-testid="cadrage-heading">{{ $t('games.cadrage') }}</h2>
        <div v-if="showTimerSection" class="round-timer-section">
            <RoundTimer v-if="tournament.roundTimer?.timerStatus === 'running' || tournament.roundTimer?.timerStatus === 'ended'"
                :timer-started-at="tournament.roundTimer.timerStartedAt"
                :timer-ends-at="tournament.roundTimer.timerEndsAt"
                :timer-status="tournament.roundTimer.timerStatus"
                :cochonettes-enabled="!!tournament.preferences.cochonettesEnabled"
                :cochonettes="tournament.preferences.cochonettes || 1"
                @timer-ended="onTimerEnded"
                @restart="onTimerRestart"/>
            <button v-else class="start-timer-btn" @click="startRoundTimer">
                <Timer :size="16"/>
                {{ $t('timer.startTimer') }}
            </button>
        </div>
        <Game v-for="(game, ind) in tournament.cadrage" :key="ind" :active-tournament="tournament" :compact-view="isPublicView"
              :game="game" :game-index="ind" :fields-start="tournament.preferences.fieldsStart" :is-cadrage="true"
              @save="saveResults" @swapLane="swapCadrageLane"/>
        <div v-if="scoreError" class="has-text-centered has-text-danger mb-5 mt-5">{{ $t('games.resultsError') }}</div>
        <div class="text-center mt-5" v-if="!activeTournament">
            <button class="button is-success" data-testid="btn-save-cadrage" @click="saveResults">{{ $t('games.saveResults') }}</button>
        </div>
    </div>
</template>

<style scoped>
.round-timer-section {
    display: flex;
    justify-content: center;
    margin-bottom: 0.75rem;
}

.start-timer-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    font-weight: 600;
    border: 1px solid var(--color-primary);
    border-radius: 8px;
    background: var(--color-primary-bg);
    color: var(--color-primary);
    cursor: pointer;
    transition: all 0.15s;
}

.start-timer-btn:hover {
    background: var(--color-primary);
    color: var(--color-btn-text);
}
</style>
