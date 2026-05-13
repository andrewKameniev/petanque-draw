<template>
    <div class="content tabs-content">
        <DoubleElimPlayOff v-if="tournament.playOff && tournament.playOffBracket?.type === 'double'" @openResults="$emit('openResults')"/>
        <PlayOff v-else-if="tournament.playOff" @openResults="$emit('openResults')"/>
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
                <h2 class="text-center">{{ $t('common.round') }} {{ activeRound }}</h2>
                <div class="games-toolbar">
                    <button class="games-toolbar__toggle is-hidden-tablet" @click="compactView = !compactView">
                        {{ compactView ? $t('games.full') : $t('games.compact') }} {{ $t('games.view') }}
                        <ChevronDown :size="16" class="games-toolbar__arrow" :class="{'games-toolbar__arrow--up': !compactView}"/>
                    </button>
                </div>
                <div class="games-list">
                    <Game v-for="(game, index) in tournament.games[activeRound - 1]" :key="index"
                          :game="game" :activeRound="activeRound - 1" :compactView="compactView" :game-index="index"
                          :team1-lanes="tournament.teams.find(team => team.title === game.team_1)?.lanes || null"
                          :team2-lanes="tournament.teams.find(team => team.title === game.team_2)?.lanes || null"
                          @save="saveResults"/>
                    <div v-if="scoreError" class="has-text-centered has-text-danger mb-5 mt-4">{{ $t('games.resultsError') }}
                    </div>
                </div>
                <div class="has-text-danger mt-3" v-if="saveDisabled">{{ $t('games.drawError') }}</div>
            </div>
            <div v-else-if="tournament.tournamentIsFinished">
                <FinishedBanner @openResults="$emit('openResults')"/>
            </div>
            <div v-else-if="tournament.games && tournament.games.length >= teamsCount">{{ $t('games.quantityError') }}</div>
        </div>
        <Modal v-if="showRestoreConfirm" @close-modal="showRestoreConfirm = false">
            <div class="confirm-remove">
                <div class="confirm-remove__header">
                    <div class="confirm-remove__header-left">
                        <span class="confirm-remove__icon">
                            <AlertTriangle :size="16"/>
                        </span>
                        <span class="confirm-remove__header-hint">{{ $t('games.restoreRound') }}</span>
                    </div>
                    <button class="confirm-remove__close" @click="showRestoreConfirm = false">
                        <X :size="18"/>
                    </button>
                </div>
                <div class="confirm-remove__body">
                    <p class="confirm-remove__question">{{ $t('games.restoreRoundConfirm') }}</p>
                </div>
                <div class="confirm-remove__footer">
                    <button class="confirm-remove__btn confirm-remove__btn--cancel" @click="showRestoreConfirm = false">{{ $t('common.cancel') }}</button>
                    <button class="confirm-remove__btn confirm-remove__btn--danger" @click="showRestoreConfirm = false; restoreRoundGames()">{{ $t('games.restoreRound') }}</button>
                </div>
            </div>
        </Modal>
    </div>
</template>

<script>

import PlayOff from './PlayOff';
import DoubleElimPlayOff from './DoubleElimPlayOff.vue';
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {gameHasError, isScoreError, shuffleArray} from '@/helpers'
import {drawSwissRound, drawSupermeleRound, assignLanes, createGroups, saveResultsForRound} from '@/services/draw'
import Game from "@/components/partials/Game.vue";
import Cadrage from "@/components/partials/Cadrage.vue";
import {ChevronDown, AlertTriangle, X} from "lucide-vue-next";
import FinishedBanner from "@/components/partials/FinishedBanner.vue";
import Modal from "@/components/Modal.vue";

export default {
    name: 'Games',
    components: {Cadrage, Game, PlayOff, DoubleElimPlayOff, ChevronDown, AlertTriangle, X, Modal, FinishedBanner},
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
            return Math.ceil(Math.log2(this.tournament.teams?.length))
        },
        allScoresFilled() {
            const games = this.tournament.games?.[this.activeRound - 1];
            if (!games) return false;
            return games.every(g => g.team_1_score !== null && g.team_1_score !== '' && g.team_2_score !== null && g.team_2_score !== '');
        },
        showDrawLinks() {
            if (!this.tournament.games?.length) return false;
            if (this.tournament.tournamentIsFinished) return false;
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
            const btn = document.querySelector('[data-testid="btn-save-results"], [data-testid="btn-save-cadrage"], [data-testid="btn-save-playoff"], [data-testid="btn-save-double-elim"]');
            console.warn('123', btn);
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
            this.showMessage({title: this.$t('messages.success'), text: this.$t('messages.resultsSaved')})
        },
        restoreRoundGames(){
            this.isRestoredRound = true;
            if (this.tournament.playOff || this.tournament.cadrage?.length) {
                const bracket = this.tournament.playOffBracket;

                if (bracket?.type === 'double') {
                    delete this.tournament.playOff;
                    delete this.tournament.playOffBracket;
                    delete this.tournament.playOffStage;
                    this.startRound();
                    return;
                }

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
                this.startRound();
                return;
            }
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
    font-size: 0.95rem;
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
    font-size: 0.8rem;
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

.confirm-remove {
    display: flex;
    flex-direction: column;
}

.confirm-remove__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.75rem;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border);
}

.confirm-remove__header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.confirm-remove__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-error-bg);
    color: var(--color-error);
}

.confirm-remove__header-hint {
    font-size: 0.82rem;
    font-weight: 500;
}

.confirm-remove__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
}

.confirm-remove__close:hover {
    background: var(--color-surface-hover);
    color: var(--color-text);
}

.confirm-remove__body {
    padding: 0.5rem 0 1.25rem;
}

.confirm-remove__question {
    font-size: 0.9rem;
    color: var(--color-text);
    line-height: 1.5;
}

.confirm-remove__footer {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}

.confirm-remove__btn {
    padding: 0.5rem 1.25rem;
    font-size: 0.8rem;
    font-weight: 500;
    border-radius: 6px;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.15s;
}

.confirm-remove__btn--cancel {
    background: transparent;
    border-color: var(--color-border);
    color: var(--color-text-secondary);
}

.confirm-remove__btn--cancel:hover {
    border-color: var(--color-text-muted);
    background: var(--color-surface-hover);
}

.confirm-remove__btn--danger {
    background: var(--color-error);
    border-color: var(--color-error);
    color: var(--color-btn-text);
}

.confirm-remove__btn--danger:hover {
    background: var(--color-error-hover);
    border-color: var(--color-error-hover);
}


</style>