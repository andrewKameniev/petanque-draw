<template>
    <div class="content tabs-content">
        <PlayOff v-if="tournament.playOff" @openResults="$emit('openResults')"/>
        <Cadrage v-else-if="tournament.cadrage && tournament.cadrage.length" @startPlayOff="$emit('startPlayOff', $event)"/>
        <div v-else>
            <div v-if="tournament.games?.length && showDrawLinks" class="draw-card">
                <div class="draw-card__links">
                    <a v-if="!tournament.playOff && !tournament.roundIsActive
                        && (tournament.games.length < teamsCount) && (tournament.system === 'swiss' ? (activeRound <= maxSwissRounds) : true)"
                       href="#" class="draw-card__link draw-card__link--draw" data-testid="link-draw-next-round" @click.prevent="drawRound">
                        {{ `${$t('games.draw')} ${activeRound}` }} {{ $t('common.round') }}
                    </a>
                    <template v-if="tournament.games.length && !tournament.roundIsActive && !isRestoredRound
                        && !tournament.playOff
                        && (tournament.games.length < teamsCount) && (tournament.system === 'swiss' ? (activeRound <= maxSwissRounds) : true)">
                        <span class="draw-card__or">{{ $t('common.or') }}</span>
                    </template>
                    <a v-if="tournament.games.length && !tournament.roundIsActive && !isRestoredRound && !tournament.playOff"
                       href="#" class="draw-card__link draw-card__link--restore" data-testid="link-restore-round" @click.prevent="showRestoreConfirm = true">{{ $t('games.restoreRound') }}</a>
                </div>
            </div>
            <div v-if="tournament.games && tournament.games.length && tournament.roundIsActive">
                <h2 class="text-center">
                    <template v-if="tournament.system === 'poules'">{{ poulesRoundLabel }}</template>
                    <template v-else>{{ $t('common.round') }} {{ activeRound }}</template>
                </h2>
                <div class="games-toolbar">
                    <button class="games-toolbar__toggle is-hidden-tablet" @click="compactView = !compactView">
                        {{ compactView ? $t('games.full') : $t('games.compact') }} {{ $t('games.view') }}
                        <ChevronDown :size="16" class="games-toolbar__arrow" :class="{'games-toolbar__arrow--up': !compactView}"/>
                    </button>
                </div>
                <div class="games-list" v-if="tournament.system === 'poules'">
                    <div v-for="(group, gIdx) in poulesGroupedGames" :key="gIdx" class="poules-group">
                        <h4 class="poules-group__title">Poule {{ groupNames[gIdx] }}</h4>
                        <Game v-for="(game, index) in group" :key="index"
                              :game="game" :activeRound="activeRound - 1" :compactView="compactView" :game-index="currentRoundGames.indexOf(game)"
                              :team1-lanes="teamsByTitle[game.team_1]?.lanes || null"
                              :team2-lanes="teamsByTitle[game.team_2]?.lanes || null"
                              @save="saveResults"/>
                    </div>
                    <div v-if="scoreError" class="has-text-centered has-text-danger mb-5 mt-4">{{ $t('games.resultsError') }}
                    </div>
                </div>
                <div class="games-list" v-else>
                    <Game v-for="(game, index) in tournament.games[activeRound - 1]" :key="index"
                          :game="game" :activeRound="activeRound - 1" :compactView="compactView" :game-index="index"
                          :team1-lanes="teamsByTitle[game.team_1]?.lanes || null"
                          :team2-lanes="teamsByTitle[game.team_2]?.lanes || null"
                          @save="saveResults"/>
                    <div v-if="scoreError" class="has-text-centered has-text-danger mb-5 mt-4">{{ $t('games.resultsError') }}
                    </div>
                </div>
                <div class="has-text-danger mt-3" v-if="saveDisabled">{{ $t('games.drawError') }}</div>
            </div>
            <div v-else-if="tournament.tournamentIsFinished">
                <FinishedBanner @openResults="$emit('openResults')"/>
            </div>
            <div v-else-if="tournament.games && tournament.games.length >= teamsCount && tournament.system === 'groups'" class="draw-card">
                <div class="draw-card__links">
                    <a href="#" class="draw-card__link draw-card__link--draw" data-testid="link-play-next-circle" @click.prevent="playNextCircle">
                        {{ $t('games.playNextCircle') }}
                    </a>
                    <span class="draw-card__or">{{ $t('common.or') }}</span>
                    <a href="#" class="draw-card__link draw-card__link--restore" data-testid="link-restore-round-circle" @click.prevent="showRestoreConfirm = true">{{ $t('games.restoreRound') }}</a>
                </div>
                <div v-if="tournament.roundRobinCircle > 1" class="draw-card__circle-info">
                    {{ $t('games.circlesPlayed') }}: {{ tournament.roundRobinCircle || 1 }}
                </div>
            </div>
            <div v-else-if="tournament.games && tournament.games.length >= teamsCount && tournament.system !== 'poules'">{{ $t('games.quantityError') }}</div>
        </div>
        <ConfirmRemoveModal v-if="showRestoreConfirm"
            :hint="$t('games.restoreRound')"
            :message="$t('games.restoreRoundConfirm')"
            :confirm-label="$t('games.restoreRound')"
            @confirm="restoreRoundGames()"
            @close="showRestoreConfirm = false"/>
    </div>
</template>

<script>

import PlayOff from './PlayOff';
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {gameHasError, isScoreError, shuffleArray, tournamentNames} from '@/helpers'
import {drawSwissRound, drawSupermeleRound, drawGroupsRound, assignLanes, createGroups, saveResultsForRound, resetGroupsScheme, drawPoulesRound, getPoulesQualifiedTeams} from '@/services/draw'
import Game from "@/components/partials/Game.vue";
import Cadrage from "@/components/partials/Cadrage.vue";
import {ChevronDown} from "lucide-vue-next";
import FinishedBanner from "@/components/partials/FinishedBanner.vue";
import ConfirmRemoveModal from "@/components/ConfirmRemoveModal.vue";

export default {
    name: 'Games',
    components: {Cadrage, Game, PlayOff, ChevronDown, ConfirmRemoveModal, FinishedBanner},
    props: ['activeRound', 'teamsInGroup', 'rankingTeams'],
    data() {
        return {
            saveDisabled: false,
            scoreError: false,
            isRestoredRound: false,
            compactView: false,
            showRestoreConfirm: false
        }
    },
    mounted() {
        this._onEnter = (e) => {
            if (e.key === 'Enter' && !!document.querySelector('#tab-games.is-active')) {
                e.preventDefault();
                this.handleGlobalSave();
            }
        };
        this._onTab = (e) => {
            if (e.key === 'Tab' && !!document.querySelector('#tab-games.is-active')) {
                const inputs = Array.from(document.querySelectorAll('.game-row input[type="number"]'));
                if (!inputs.length) return;
                const currentIndex = inputs.indexOf(e.target);
                e.preventDefault();
                const nextIndex = currentIndex === -1 ? 0 : e.shiftKey ? (currentIndex - 1 + inputs.length) % inputs.length : (currentIndex + 1) % inputs.length;
                inputs[nextIndex].focus();
                inputs[nextIndex].select();
            }
        };
        document.addEventListener('keydown', this._onEnter);
        document.addEventListener('keydown', this._onTab);
    },
    beforeUnmount() {
        document.removeEventListener('keydown', this._onEnter);
        document.removeEventListener('keydown', this._onTab);
    },
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'isAdmin', 'currentTournament', 'allScoresFilled']),
        tournament() {
            return this.currentTournament
        },
        teamsCount() {
            if (this.tournament.system === 'swiss') return this.tournament.teams.length - 1;
            if (this.tournament.groups) {
                const roundsPerCircle = this.tournament.groups[0].length % 2 !== 0
                    ? this.tournament.groups[0].length
                    : this.tournament.groups[0].length - 1;
                const circles = this.tournament.roundRobinCircle || 1;
                return roundsPerCircle * circles;
            }
            return this.tournament.teams.length - 1;
        },
        maxSwissRounds() {
            return Math.ceil(Math.log2(this.tournament.teams?.length))
        },
        teamsByTitle() {
            const map = {};
            this.tournament.teams?.forEach(t => { map[t.title] = t; });
            return map;
        },
        poulesRoundLabel() {
            const round = this.tournament.poulesRound || 1;
            if (round === 1) return this.$t('games.poulesRound1');
            if (round === 2) return this.$t('games.poulesRound2');
            return this.$t('games.poulesRound3');
        },
        groupNames() {
            return tournamentNames;
        },
        currentRoundGames() {
            return this.tournament.games?.[this.activeRound - 1] || [];
        },
        poulesGroupedGames() {
            const games = this.currentRoundGames;
            const grouped = {};
            games.forEach(game => {
                const g = game.group ?? 0;
                if (!grouped[g]) grouped[g] = [];
                grouped[g].push(game);
            });
            return Object.keys(grouped).sort((a, b) => a - b).map(k => grouped[k]);
        },
        showDrawLinks() {
            if (!this.tournament.games?.length) return false;
            if (this.tournament.tournamentIsFinished) return false;
            if (this.tournament.system === 'poules') return false;
            if (this.tournament.system === 'groups' && this.tournament.games.length >= this.teamsCount && !this.tournament.roundIsActive) return false;
            const hasDrawLink = !this.tournament.playOff && !this.tournament.roundIsActive
                && (this.tournament.games.length < this.teamsCount)
                && (this.tournament.system === 'swiss' ? (this.activeRound <= this.maxSwissRounds) : true);
            const hasRestoreLink = this.tournament.games.length && !this.tournament.roundIsActive && !this.isRestoredRound;
            return hasDrawLink || hasRestoreLink;
        },
        canRestoreRound() {
            return !!(this.tournament.playOff || (this.tournament.cadrage && this.tournament.cadrage.length))
                && this.tournament.games?.length && !this.isRestoredRound;
        }
    },
    methods: {
        ...mapActions(useMainStore, ['startRound', 'endRound', 'addRoundToGames', 'restoreRound', 'showMessage', 'shuffleLanesStore', 'setPlayOffStage', 'setPlayOffBracket', 'syncToFirebase']),
        gameHasError,
        handleGlobalSave() {
            const btn = document.querySelector('[data-testid="btn-save-results"], [data-testid="btn-save-cadrage"], [data-testid="btn-save-playoff"]');
            if (btn) btn.click();
        },
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
                    round = drawGroupsRound(this.tournament);
                }
            } else if (this.tournament.system === 'poules') {
                this.tournament.poulesRound = (this.tournament.poulesRound || 0) + 1;
                round = drawPoulesRound(this.tournament);
            } else if (this.tournament.system === 'supermele') {
                round = drawSupermeleRound(this.tournament, this.rankingTeams);
            }
            this.addRoundToGames(assignLanes(shuffleArray(round), this.tournament));
            this.startRound();
            this.isRestoredRound = false;
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

            this.tournament.games[this.activeRound - 1].forEach(game => {
                game.team_1_score = Number(game.team_1_score);
                game.team_2_score = Number(game.team_2_score);
            });

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
            }

            this.endRound();

            if (this.tournament.system === 'poules' && this.tournament.poulesRound < 3) {
                this.drawRound();
                this.showMessage({title: this.$t('messages.success'), text: this.$t('messages.resultsSaved')});
                return;
            }

            if (this.tournament.system === 'poules' && this.tournament.poulesRound === 3) {
                const qualified = getPoulesQualifiedTeams(this.tournament);
                this.$emit('startPlayOff', qualified);
                this.showMessage({title: this.$t('messages.success'), text: this.$t('messages.resultsSaved')});
                return;
            }

            this.showMessage({title: this.$t('messages.success'), text: this.$t('messages.resultsSaved')})
        },
        restoreRoundGames(){
            this.isRestoredRound = true;
            if (this.tournament.playOff || this.tournament.cadrage?.length) {
                const bracket = this.tournament.playOffBracket;
                const currentStage = this.tournament.playOffStage ?? this.tournament.playOff?.[0]?.stage;
                const firstPlayoffStageLabel = bracket?.stages?.find(s => s.stageLabel !== 'cadrage')?.stageLabel;

                if (bracket && currentStage && currentStage < firstPlayoffStageLabel) {
                    const previousStage = currentStage * 2;
                    const restoredBracket = JSON.parse(JSON.stringify(bracket));
                    const currentIndex = restoredBracket.stages.findIndex(s => s.stageLabel === currentStage);
                    if (currentIndex !== -1) {
                        restoredBracket.stages[currentIndex].teams.forEach(game => {
                            game.team_1 = null;
                            game.team_2 = null;
                            game.team_1_score = null;
                            game.team_2_score = null;
                        });
                    }
                    if (currentStage === 1 && restoredBracket.thirdPlace) {
                        restoredBracket.thirdPlace = {};
                    }
                    this.setPlayOffBracket(restoredBracket);
                    this.setPlayOffStage(previousStage);
                    return;
                }

                if (this.tournament.cadrage?.length) {
                    delete this.tournament.playOff;
                    delete this.tournament.playOffBracket;
                    delete this.tournament.playOffStage;
                    this.syncToFirebase();
                    return;
                }
                delete this.tournament.playOff;
                delete this.tournament.playOffBracket;
                delete this.tournament.playOffStage;
                delete this.tournament.cadrage;
                if (this.tournament.system === 'poules') {
                    this.tournament.poulesRound = 3;
                }
                this.startRound();
                return;
            }
            if (this.tournament.roundIsActive) {
                this.restoreRound();
                if (this.tournament.system === 'poules') {
                    if (this.tournament.poulesRound > 1) {
                        this.tournament.poulesRound--;
                    }
                    this.tournament.teams.forEach(team => {
                        team.opponents = [];
                        team.pointsPlus = 0;
                        team.pointsMinus = 0;
                        team.wins = 0;
                    });
                    for (let i = 0; i < this.tournament.games.length; i++) {
                        this.saveResultsForRound(i);
                    }
                } else if (this.tournament.system === 'groups') {
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
        playNextCircle() {
            this.tournament.roundRobinCircle = (this.tournament.roundRobinCircle || 1) + 1;
            this.tournament.groupsScheme = resetGroupsScheme(this.tournament);
            const round = drawGroupsRound(this.tournament);
            this.addRoundToGames(assignLanes(shuffleArray(round), this.tournament));
            this.startRound();
        },
        saveResultsForRound(round) {
            saveResultsForRound(this.tournament, round);
        },
    },
}
</script>

<style scoped>
.draw-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 0.5rem 0 1rem;
    min-height: 240px;
}

.draw-card__links {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: nowrap;
    white-space: nowrap;
}

@media screen and (max-width: 768px) {
    .draw-card__links {
        flex-direction: column;
        gap: 0.4rem;
    }
}

.draw-card__link {
    font-size: 1.15rem;
    font-weight: 600;
    text-decoration: underline;
}

.draw-card__link--draw {
    color: var(--color-info);
}

.draw-card__link--restore {
    color: var(--color-danger-light);
}

.draw-card__or {
    font-size: 1rem;
    color: var(--color-text-muted);
}

.draw-card__circle-info {
    font-size: 1rem;
    color: var(--color-text-muted);
}

.games-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
}

.games-toolbar__toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: 0.5rem 0.9rem;
    transition: all 0.15s;
    white-space: nowrap;
}

.games-toolbar__toggle:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.games-toolbar__arrow {
    transition: transform 0.2s ease;
}

.games-toolbar__arrow--up {
    transform: rotate(180deg);
}

.poules-group {
    margin-bottom: 1.5rem;
}

.poules-group__title {
    text-align: center;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: 0.5rem;
}

</style>