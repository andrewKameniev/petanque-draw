<template>
    <div class="content tabs-content">
        <div v-if="tournament.games?.length || hasPlayOffResults">
            <div v-if="(isForProtocol && !onlyPlayOff) || !isForProtocol">
                <div v-if="!isForProtocol && (tournament.games?.length || tournament.cadrage?.length || hasPlayOffResults)" class="round-tabs-row mb-4">
                    <div class="round-tabs">
                        <button v-for="(round, index) in tournament.games" :key="index"
                                class="button is-small mr-1 mb-1"
                                :class="{'is-purple': selectedRound === index}"
                                @click="selectedRound = index">
                            R{{ index + 1 }}
                        </button>
                        <button v-if="tournament.cadrage?.length" class="button is-small mr-1 mb-1"
                                :class="{'is-purple': selectedRound === 'cadrage'}"
                                @click="selectedRound = 'cadrage'">
                            {{ $t('games.cadrage') }}
                        </button>
                        <button v-if="hasPlayOffResults && !onlyQualifying" class="button is-small mr-1 mb-1"
                                :class="{'is-purple': selectedRound === 'playoff'}"
                                @click="selectedRound = 'playoff'">
                            {{ $t('games.playOff') }}
                        </button>
                        <button class="button is-small mr-1 mb-1"
                                :class="{'is-purple': selectedRound === -1}"
                                @click="selectedRound = -1">
                            {{ $t('results.all') }}
                        </button>
                    </div>
                    <button v-if="hasPlayOffResults && !isForProtocol" class="button is-small btn-purple-outline mb-1" @click="showBracket = true">
                        <GitFork :size="16" :stroke-width="2" style="transform: rotate(90deg); margin-right: 0.3rem; min-width: 16px;"/>
                        <span class="is-hidden-mobile">{{ $t('games.showBracket') }}</span>
                    </button>
                </div>
                <div class="table-container" v-if="selectedRound !== 'playoff'">
                    <table class="table" :class="{'is-striped': !isForProtocol, 'is-bordered': isForProtocol, 'is-fullwidth': !isForProtocol}">
                        <tbody>
                            <template v-for="(round, index) in tournament.games" :key="index">
                                <template v-if="isForProtocol || selectedRound === -1 || selectedRound === index">
                                    <tr v-for="(game, i) in round" :key="i">
                                        <td v-if="selectedRound === -1 || isForProtocol" class="is-narrow round-group-cell">
                                            <small class="round-badge">R{{index + 1}}</small>
                                            <small v-if="hasGroupsColumn" class="group-label">{{ groupsNames[game.group] }}</small>
                                        </td>
                                        <td v-if="hasGroupsColumn" class="group-cell-desktop"><small>{{ $t('common.group') }}</small> {{ groupsNames[game.group] }}</td>
                                        <td class="has-text-right" :class="{'has-text-weight-bold': !isForProtocol && game.team_1_score > game.team_2_score}">{{ isForProtocol ? teamTitles[game.team_1] : game.team_1}}</td>
                                        <td class="has-text-centered is-narrow">
                                            <strong v-if="game.team_1_score != null">{{ game.team_1_score }} : {{ game.team_2_score }}</strong>
                                            <span v-else class="score-empty">-- : --</span>
                                        </td>
                                        <td :class="{'has-text-weight-bold': !isForProtocol && game.team_2_score > game.team_1_score}">{{isForProtocol ? teamTitles[game.team_2] : game.team_2}}</td>
                                    </tr>
                                </template>
                            </template>
                        </tbody>
                    </table>
                </div>
                <div v-if="hasPlayOffResults && !onlyQualifying && (isForProtocol || selectedRound === -1 || selectedRound === 'playoff')" class="playoff-section">
                    <template v-for="(stage, index) in tournament.playOffBracket.stages" :key="'po'+index">
                        <template v-if="stage.teams[0].team_1_score && stage.stageLabel !== 'cadrage'">
                            <div class="playoff-stage-label">
                                {{stage.stageLabel === 1 ? $t('games.final') : '1/' + stage.stageLabel + ' ' + $t('games.ofFinal')}}
                            </div>
                            <div v-for="(game, i) in stage.teams" :key="'s'+index+'g'+i" class="playoff-game">
                                <span class="playoff-team playoff-team-right" :class="{'has-text-weight-bold': !isForProtocol && Number(game.team_1_score) > Number(game.team_2_score)}">{{ isForProtocol ? teamTitles[game.team_1] : game.team_1}}</span>
                                <span class="playoff-score"><strong>{{ game.team_1_score != null ? game.team_1_score : '--' }} : {{ game.team_2_score != null ? game.team_2_score : '--' }}</strong></span>
                                <span class="playoff-team" :class="{'has-text-weight-bold': !isForProtocol && Number(game.team_2_score) > Number(game.team_1_score)}">{{ isForProtocol ? teamTitles[game.team_2] : game.team_2}}</span>
                            </div>
                        </template>
                    </template>
                    <template v-if="tournament.playOffBracket.thirdPlace && Object.keys(tournament.playOffBracket.thirdPlace).length !== 0">
                        <div class="playoff-stage-label">{{$t('games.thirdPlace')}}</div>
                        <div class="playoff-game">
                            <span class="playoff-team playoff-team-right" :class="{'has-text-weight-bold': !isForProtocol && Number(tournament.playOffBracket.thirdPlace.team_1_score) > Number(tournament.playOffBracket.thirdPlace.team_2_score)}">{{isForProtocol ? teamTitles[tournament.playOffBracket.thirdPlace.team_1] : tournament.playOffBracket.thirdPlace.team_1}}</span>
                            <span class="playoff-score"><strong>{{ tournament.playOffBracket.thirdPlace.team_1_score != null ? tournament.playOffBracket.thirdPlace.team_1_score : '--' }} : {{ tournament.playOffBracket.thirdPlace.team_2_score != null ? tournament.playOffBracket.thirdPlace.team_2_score : '--' }}</strong></span>
                            <span class="playoff-team" :class="{'has-text-weight-bold': !isForProtocol && Number(tournament.playOffBracket.thirdPlace.team_2_score) > Number(tournament.playOffBracket.thirdPlace.team_1_score)}">{{isForProtocol ? teamTitles[tournament.playOffBracket.thirdPlace.team_2] : tournament.playOffBracket.thirdPlace.team_2}}</span>
                        </div>
                    </template>
                </div>
            </div>
            <div v-if="tournament.cadrage && (isForProtocol || selectedRound === -1 || selectedRound === 'cadrage') && selectedRound !== 'playoff'">
                <div class="mb-5">
                    <h3 class="has-text-centered">{{$t('games.cadrage')}}</h3>
                    <div class="table-container">
                        <table class="table" :class="{'is-striped': !isForProtocol, 'is-bordered': isForProtocol}">
                            <tbody>
                                <tr v-for="(game, index) in tournament.cadrage" :key="index">
                                    <td class="has-text-right" :class="{'has-text-weight-bold': !isForProtocol && game.team_1_score > game.team_2_score}">{{ isForProtocol ? teamTitles[game.team_1] : game.team_1}}</td>
                                        <td class="has-text-centered is-narrow">
                                            <strong v-if="game.team_1_score != null">{{ game.team_1_score }} : {{ game.team_2_score }}</strong>
                                            <span v-else class="score-empty">-- : --</span>
                                        </td>
                                    <td :class="{'has-text-weight-bold': !isForProtocol && game.team_2_score > game.team_1_score}">{{ isForProtocol ? teamTitles[game.team_2] : game.team_2}}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="mb-5 mt-5">
            {{ $t('games.noGames') }}
        </div>
        <Bracket v-if="showBracket" :bracket="tournament.playOffBracket" @close-modal="showBracket = false"/>
    </div>
</template>


<script>
import {mapState} from "pinia";
import {useMainStore} from "@/stores/main";
import {tournamentNames} from "@/helpers";
import Bracket from "@/components/partials/Bracket";
import {GitFork} from "lucide-vue-next";

export default {
    name: 'Results',
    components: {Bracket, GitFork},
    props: ['previewTournament', 'isForProtocol', 'onlyQualifying', 'onlyPlayOff', 'teamTitles'],
    data() {
        return {
            selectedRound: -1,
            showBracket: false,
        }
    },
    created() {
        const t = this.previewTournament || this.currentTournament;
        if (this.hasPlayOffResults) {
            this.selectedRound = 'playoff';
        } else if (t?.cadrage?.length) {
            this.selectedRound = 'cadrage';
        } else if (t?.games?.length) {
            this.selectedRound = t.games.length - 1;
        }
    },
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament']),
        tournament() {
            return this.previewTournament || this.currentTournament
        },
        hasPlayOffResults() {
            const bracket = this.tournament?.playOffBracket;
            if (!bracket?.stages?.length) return false;
            return bracket.stages.some(stage => stage.stageLabel !== 'cadrage' && stage.teams?.some(g => g.team_1_score != null));
        },
        groupsNames() {
            return tournamentNames
        },
        hasGroupsColumn() {
            return this.tournament.system === 'groups' && this.tournament?.groups?.length > 1
        },
        colCount() {
            return this.hasGroupsColumn ? 5 : 4
        }
    }
}
</script>

<style scoped>
.round-tabs-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
}

.playoff-section {
    max-width: 100%;
    margin: 1.5rem 0 0;
}

.playoff-stage-label {
    font-size: 1.2rem;
    font-weight: 700;
    text-align: center;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
}

.playoff-stage-label:first-child {
    margin-top: 0;
}

.playoff-game {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: var(--color-surface-hover);
    border-radius: 6px;
    margin-bottom: 0.4rem;
}

.playoff-team {
    flex: 1 1 0;
}

.playoff-team-right {
    text-align: right;
}

.playoff-score {
    flex: 0 0 auto;
    text-align: center;
    min-width: 70px;
    padding: 0 0.75rem;
}

.round-group-cell {
    vertical-align: middle;
}

.round-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    padding: 2px 6px;
    font-size: 0.7rem;
    font-weight: 600;
    border-radius: 4px;
    background: var(--color-surface-hover);
    color: var(--color-text-muted);
}

.group-label {
    display: none;
}

@media screen and (max-width: 768px) {
    .round-group-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1.2;
    }

    .group-label {
        display: block;
    }

    .group-cell-desktop {
        display: none;
    }
}

.score-empty {
    color: var(--color-text-muted);
    font-weight: 400;
}

.btn-purple-outline {
    background: transparent;
    border: 2px solid var(--color-primary);
    color: var(--color-primary);
}

.btn-purple-outline:hover {
    background: var(--color-primary);
    color: var(--color-btn-text);
}

.btn-bracket {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

</style>
