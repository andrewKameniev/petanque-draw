<template>
    <div class="content tabs-content">
        <PlayOff v-if="tournament.playOff" @openResults="$emit('openResults')"/>
        <Cadrage v-else-if="tournament.cadrage && tournament.cadrage.length" @startPlayOff="$emit('startPlayOff', $event)"/>
        <div v-else>
            <div v-if="tournament.games?.length" class="draw-card">
                <p v-if="tournament.system === 'swiss' && tournament.teams?.length" class="draw-card__hint">
                    {{$t('games.playMaximum')}} <strong>{{ maxSwissRounds }}</strong> {{$t('ranking.rounds')}}
                </p>
                <div class="draw-card__links">
                    <a v-if="!tournament.playOff && !tournament.roundIsActive
                        && (tournament.games.length < teamsCount) && (tournament.system === 'swiss' ? (activeRound <= maxSwissRounds) : true)"
                       href="#" class="draw-card__link draw-card__link--draw" @click.prevent="drawRound">
                        {{ `${$t('games.draw')} ${activeRound}` }} {{ $t('common.round') }}
                    </a>
                    <template v-if="((tournament.games.length && !tournament.roundIsActive) || tournament.games.length > 1)
                        && !tournament.playOff && !tournament.roundIsActive
                        && (tournament.games.length < teamsCount) && (tournament.system === 'swiss' ? (activeRound <= maxSwissRounds) : true)">
                        <span class="draw-card__or">{{ $t('common.or') }}</span>
                    </template>
                    <a v-if="(tournament.games.length && !tournament.roundIsActive) || tournament.games.length > 1"
                       href="#" class="draw-card__link draw-card__link--restore" @click.prevent="restoreRoundGames">{{ $t('games.restoreRound') }}</a>
                </div>
            </div>
            <div v-if="tournament.games && tournament.games.length && tournament.roundIsActive">
                <h2 class="text-center">{{ $t('common.round') }} {{ activeRound }}</h2>
                <div class="games-toolbar">
                    <button class="games-toolbar__toggle is-hidden-tablet" @click="compactView = !compactView">
                        {{ compactView ? $t('games.full') : $t('games.compact') }} {{ $t('games.view') }}
                        <ChevronDown :size="16" class="games-toolbar__arrow" :class="{'games-toolbar__arrow--up': !compactView}"/>
                    </button>
                    <button v-if="allScoresFilled" class="games-toolbar__save" @click="saveResults" :disabled="saveDisabled">{{ $t('games.saveResults') }}</button>
                </div>
                <div class="games-list">
                    <Game v-for="(game, index) in tournament.games[activeRound - 1]" :key="index"
                          :game="game" :activeRound="activeRound - 1" :compactView="compactView" :game-index="index"
                          :team1-lanes="tournament.teams.find(team => team.title === game.team_1)?.lanes || null"
                          :team2-lanes="tournament.teams.find(team => team.title === game.team_2)?.lanes || null"
                          @save="saveResults"/>
                    <div v-if="scoreError" class="has-text-centered has-text-danger mb-5">{{ $t('games.resultsError') }}
                    </div>
                </div>
                <div class="has-text-danger mt-3" v-if="saveDisabled">{{ $t('games.drawError') }}</div>
            </div>
            <div v-else-if="tournament.games && tournament.games.length >= teamsCount">{{ $t('games.quantityError') }}</div>
        </div>
    </div>
</template>

<script>

import PlayOff from './PlayOff';
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {gameHasError, isScoreError, shuffleArray} from '@/helpers'
import {drawSwissRound, drawSupermeleRound, assignLanes, createGroups, saveResultsForRound} from '@/services/draw'
import Game from "@/components/partials/Game.vue";
import Cadrage from "@/components/partials/Cadrage.vue";
import {ChevronDown} from "lucide-vue-next";

export default {
    name: 'Games',
    components: {Cadrage, Game, PlayOff, ChevronDown},
    props: ['activeRound', 'teamsInGroup', 'rankingTeams'],
    data() {
        return {
            saveDisabled: false,
            scoreError: false,
            isRestoredRound: false,
            compactView: false
        }
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
            return Math.round(this.tournament.teams?.length / 2)
        },
        allScoresFilled() {
            const games = this.tournament.games?.[this.activeRound - 1];
            if (!games) return false;
            return games.every(g => g.team_1_score !== null && g.team_1_score !== '' && g.team_2_score !== null && g.team_2_score !== '');
        }
    },
    methods: {
        ...mapActions(useMainStore, ['startRound', 'endRound', 'addRoundToGames', 'restoreRound', 'showMessage', 'shuffleLanesStore']),
        gameHasError,
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
                this.isRestoredRound = false;
            }

            this.endRound();
            this.showMessage({title: this.$t('messages.success'), text: this.$t('messages.resultsSaved')})
        },
        restoreRoundGames(){
            this.isRestoredRound = true;
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
    gap: 0.6rem;
    background: #fff;
    border: 1px solid var(--color-border, #e5e7f0);
    border-radius: 10px;
    padding: 1.25rem 2rem;
    margin: 0 auto 1rem;
    max-width: 480px;
}

.draw-card__hint {
    font-size: 0.9rem;
    color: var(--color-text-muted, #888);
    margin: 0;
}

.draw-card__hint strong {
    color: var(--color-text-muted, #888);
}

.draw-card__links {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    flex-wrap: nowrap;
    white-space: nowrap;
}

.draw-card__link {
    font-size: 0.95rem;
    font-weight: 600;
    text-decoration: underline;
}

.draw-card__link--draw {
    color: #0EA5E9;
}

.draw-card__link--restore {
    color: #e07070;
}

.draw-card__or {
    font-size: 0.85rem;
    color: var(--color-text-muted, #888);
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
    background: var(--color-white, #fff);
    border: 1px solid var(--color-border, #e5e7f0);
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--color-text-secondary, #374151);
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

.games-toolbar__save {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.9rem;
    font-size: 0.8rem;
    font-weight: 500;
    border-radius: 6px;
    border: 1px solid #22c55e;
    background: #22c55e;
    color: #fff;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
}

.games-toolbar__save:hover {
    background: #16a34a;
    border-color: #16a34a;
}

.games-toolbar__save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>