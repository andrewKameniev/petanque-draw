<template>
    <div class="content tabs-content">
        <div v-if="tournament.games?.length || hasPlayOffResults">
            <div v-if="(isForProtocol && !onlyPlayOff) || !isForProtocol">
                <div v-if="!isForProtocol && (tournament.games?.length || tournament.cadrage?.length || hasPlayOffResults)" class="round-tabs-row mb-4">
                    <div class="round-tabs">
                        <button v-for="(round, index) in allDisplayRounds" :key="index"
                                class="button is-small mr-1 mb-1"
                                :class="{'is-purple': selectedRound === index, 'is-outlined': !isRoundPlayed(index)}"
                                @click="selectedRound = index">
                            {{ getRoundLabel(index) }}
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
                <div v-if="selectedRound !== 'playoff' && cardView" class="results-card-list">
                    <template v-for="(round, index) in allSortedRounds" :key="index">
                        <template v-if="selectedRound === -1 || selectedRound === index">
                            <div v-if="selectedRound === -1" class="results-card-round-label">{{ getRoundLabel(index) }}</div>
                            <div v-for="(game, i) in round" :key="i"
                                 class="match-item"
                                 :class="{
                                    'match-item--finished': game.status === 'finished',
                                    'match-item--in-progress': game.status === 'in_progress',
                                    'match-item--upcoming': !game.status || game.status === 'not_started',
                                    'match-item--highlighted': isGameHighlighted(game)
                                 }">
                                <span class="match-team match-team-right" :class="{
                                    'match-team--winner': game.team_1_score > game.team_2_score
                                }">{{ game.team_1 }}</span>
                                <span class="match-vs">
                                    <template v-if="game.status === 'finished' || game.status === 'in_progress'">
                                        <span class="match-score">{{ game.team_1_score ?? 0 }} : {{ game.team_2_score ?? 0 }}</span>
                                    </template>
                                    <template v-else>
                                        <span class="match-lane">vs</span>
                                    </template>
                                </span>
                                <span class="match-team" :class="{
                                    'match-team--winner': game.team_2_score > game.team_1_score
                                }">{{ game.team_2 }}</span>
                                <button v-if="canEditResults" class="edit-result-btn edit-result-btn--card" :title="$t('results.editResult')" @click="openEditModal(game)">
                                    <Pencil :size="14"/>
                                </button>
                                <div v-if="game.score_history && game.score_history.length" class="score-history">
                                    <span v-for="(entry, ei) in game.score_history" :key="ei" class="score-history__chip">
                                        <span class="score-history__num">{{ ei + 1 }}</span>
                                        <span class="score-history__score">{{ entry.s1 }}-{{ entry.s2 }}</span>
                                    </span>
                                </div>
                            </div>
                        </template>
                    </template>
                </div>
                <template v-else-if="selectedRound !== 'playoff' && isForProtocol">
                    <div v-for="(round, index) in allSortedRounds" :key="'pr'+index" class="pdf-page-break">
                    <h3 v-if="index === 0 && sectionTitle" class="text-center is-size-4 mb-2">{{ sectionTitle }}</h3>
                    <table class="table is-bordered round-chunk">
                        <thead>
                        <tr>
                            <th class="is-narrow">{{ getRoundLabel(index) }}</th>
                            <th class="has-text-right">Команда 1</th>
                            <th class="has-text-centered is-narrow">Рахунок</th>
                            <th>Команда 2</th>
                        </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(game, i) in round" :key="i">
                                <td class="is-narrow round-group-cell">
                                    <small class="round-badge">{{ getRoundLabel(index) }}</small>
                                </td>
                                <td class="has-text-right">{{ teamTitles[game.team_1] }}</td>
                                <td class="has-text-centered is-narrow">
                                    <strong v-if="game.team_1_score != null">{{ game.team_1_score }} : {{ game.team_2_score }}</strong>
                                    <span v-else class="score-empty">-- : --</span>
                                </td>
                                <td>{{ teamTitles[game.team_2] }}</td>
                            </tr>
                        </tbody>
                    </table>
                    </div>
                </template>
                <div class="table-container" v-else-if="selectedRound !== 'playoff'">
                    <table class="table" :class="{'is-striped': !isForProtocol, 'is-bordered': isForProtocol, 'is-fullwidth': !isForProtocol}">
                        <tbody>
                            <template v-for="(round, index) in allSortedRounds" :key="index">
                                <template v-if="selectedRound === -1 || selectedRound === index">
                                    <tr v-for="(game, i) in round" :key="i" :class="{'search-highlight': isGameHighlighted(game)}">
                                        <td v-if="selectedRound === -1" class="is-narrow round-group-cell">
                                            <small class="round-badge">{{ getRoundLabel(index) }}</small>
                                            <small v-if="hasGroupsColumn && game.group != null" class="group-label">{{ groupsNames[game.group] }}</small>
                                        </td>
                                        <td v-if="hasGroupsColumn" class="group-cell-desktop">
                                            <template v-if="game.group != null"><small>{{ $t('common.group') }}</small> {{ groupsNames[game.group] }}</template>
                                        </td>
                                        <td class="has-text-right" :class="{'has-text-weight-bold': game.team_1_score > game.team_2_score}">{{ game.team_1}}</td>
                                        <td class="has-text-centered is-narrow">
                                            <strong v-if="game.team_1_score != null">{{ game.team_1_score }} : {{ game.team_2_score }}</strong>
                                            <span v-else class="score-empty">-- : --</span>
                                        </td>
                                        <td :class="{'has-text-weight-bold': game.team_2_score > game.team_1_score}">{{ game.team_2}}</td>
                                        <td v-if="canEditResults" class="is-narrow edit-cell">
                                            <button class="edit-result-btn" :title="$t('results.editResult')" @click="openEditModal(game)">
                                                <Pencil :size="14"/>
                                            </button>
                                        </td>
                                    </tr>
                                </template>
                            </template>
                        </tbody>
                    </table>
                </div>
                <div v-if="hasPlayOffResults && !onlyQualifying && (isForProtocol || selectedRound === -1 || selectedRound === 'playoff')" :class="{'pdf-page-break': isForProtocol, 'playoff-section': true}">
                    <h3 v-if="isForProtocol && sectionTitle" class="text-center is-size-4 mb-2">{{ sectionTitle }}</h3>
                    <template v-for="(stage, index) in tournament.playOffBracket.stages" :key="'po'+index">
                        <template v-if="stageHasContent(stage) && stage.stageLabel !== 'cadrage'">
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
                                <tr v-for="(game, index) in tournament.cadrage" :key="index" :class="{'search-highlight': isGameHighlighted(game)}">
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
        <EditResultModal v-if="editingGame" :game="editingGame" @save="saveEditedResult" @close="editingGame = null"/>
    </div>
</template>


<script>
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {tournamentNames} from "@/helpers";
import {getDefaultSelectedRound, hasPlayOffResults as checkPlayOffResults, sortGamesByGroup} from "@/services/results";
import {saveResultsForRound} from "@/services/draw";
import {getDatabase, ref, update} from "firebase/database";
import Bracket from "@/components/partials/Bracket";
import EditResultModal from "@/components/partials/EditResultModal.vue";
import {GitFork, Pencil} from "lucide-vue-next";

export default {
    name: 'Results',
    components: {Bracket, EditResultModal, GitFork, Pencil},
    props: ['previewTournament', 'isForProtocol', 'onlyQualifying', 'onlyPlayOff', 'teamTitles', 'highlightedTeam', 'teamClubMap', 'cardView', 'sectionTitle'],
    data() {
        return {
            selectedRound: -1,
            showBracket: false,
            editingGame: null,
        }
    },
    created() {
        const t = this.previewTournament || this.currentTournament;
        this.selectedRound = getDefaultSelectedRound(t);
    },
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament', 'user']),
        canEditResults() {
            return !!this.user && !this.previewTournament && !this.isForProtocol && this.tournament.system === 'groups';
        },
        tournament() {
            return this.previewTournament || this.currentTournament
        },
        hasPlayOffResults() {
            return checkPlayOffResults(this.tournament);
        },
        groupsNames() {
            return tournamentNames
        },
        hasGroupsColumn() {
            if (this.tournament.barrage && this.tournament.barrage.groups?.length > 1) return true;
            if ((this.tournament.system === 'groups' || this.tournament.system === 'poules') && this.tournament?.groups?.length > 1) return true;
            return false;
        },
        sortedGames() {
            return sortGamesByGroup(this.tournament.games, this.hasGroupsColumn);
        },
        allDisplayRounds() {
            if (this.tournament.groupSchedule) {
                return this.tournament.groupSchedule;
            }
            return this.tournament.games || [];
        },
        allSortedRounds() {
            let rounds;
            if (this.tournament.groupSchedule) {
                const played = this.sortedGames || [];
                const scheduled = this.tournament.groupSchedule.slice(played.length);
                rounds = [...played, ...sortGamesByGroup(scheduled, this.hasGroupsColumn)];
            } else {
                rounds = this.sortedGames;
            }
            return (rounds || []).map(round => {
                const finished = round.filter(g => g.status === 'finished');
                const inProgress = round.filter(g => g.status === 'in_progress');
                const upcoming = round.filter(g => !g.status || g.status === 'not_started');
                return [...finished, ...inProgress, ...upcoming];
            });
        },
        colCount() {
            return this.hasGroupsColumn ? 5 : 4
        }
    },
    methods: {
        ...mapActions(useMainStore, ['showMessage']),
        stageHasContent(stage) {
            return stage.teams?.some(g => g.team_1 || g.team_2);
        },
        openEditModal(game) {
            if (!this.canEditResults) return;
            this.editingGame = game;
        },
        saveEditedResult({score1, score2}) {
            const game = this.editingGame;
            if (!game) return;

            let roundIndex = -1;
            let gameIndex = -1;
            for (let r = 0; r < this.tournament.games.length; r++) {
                const idx = this.tournament.games[r].findIndex(g =>
                    g.team_1 === game.team_1 && g.team_2 === game.team_2
                );
                if (idx !== -1) {
                    roundIndex = r;
                    gameIndex = idx;
                    break;
                }
            }

            if (roundIndex === -1) return;

            const actualGame = this.tournament.games[roundIndex][gameIndex];
            actualGame.team_1_score = score1;
            actualGame.team_2_score = score2;
            actualGame.winner = score1 > score2 ? actualGame.team_1 : actualGame.team_2;
            actualGame.status = 'finished';
            actualGame.updated_at = new Date().toISOString();

            this.recalculateStandings();
            this.persistToFirebase();
            this.editingGame = null;
            this.showMessage({title: this.$t('messages.success'), text: this.$t('results.resultUpdated')});
        },
        persistToFirebase() {
            const store = useMainStore();
            if (!store.user || !store.user.uid || !store.currentTournamentIndex) return;
            const db = getDatabase();
            const tournament = store.tournaments[store.currentTournamentIndex];
            const data = JSON.parse(JSON.stringify(tournament));
            const path = `${store.user.uid}/tournaments/${store.currentTournamentIndex}`;
            update(ref(db, `${store.user.uid}/tournaments/`), {
                [store.currentTournamentIndex]: data
            }).catch(error => {
                console.error('Error persisting edited result:', error);
            });
        },
        recalculateStandings() {
            this.tournament.teams.forEach(team => {
                team.wins = 0;
                team.opponents = [];
                team.pointsPlus = 0;
                team.pointsMinus = 0;
            });
            for (let i = 0; i < this.tournament.games.length; i++) {
                saveResultsForRound(this.tournament, i);
            }
        },
        getRoundLabel(index) {
            const barrage = this.tournament.barrage;
            if (barrage && index >= barrage.startIndex) {
                return `B${index - barrage.startIndex + 1}`;
            }
            return `R${index + 1}`;
        },
        isTeamHighlighted(name) {
            if (!this.highlightedTeam) return false;
            if (this.highlightedTeam === name) return true;
            return this.teamClubMap && this.teamClubMap[name] === this.highlightedTeam;
        },
        isGameHighlighted(game) {
            return this.isTeamHighlighted(game.team_1) || this.isTeamHighlighted(game.team_2);
        },
        isRoundPlayed(index) {
            if (index >= this.tournament.games.length) return false;
            const round = this.tournament.games[index];
            return round && round.some(g => g.team_1_score != null && g.team_2_score != null);
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
    font-size: 1rem;
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

.search-highlight td {
    background: var(--color-primary-bg) !important;
}

.search-highlight td:first-child {
    border-left: 3px solid var(--color-primary);
}

.results-card-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.results-card-round-label {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-text-muted);
    padding: 0.5rem 0 0.2rem;
    text-transform: uppercase;
}

.edit-cell {
    padding: 0 0.25rem;
}

.edit-result-btn {
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

.edit-result-btn:hover {
    background: var(--color-primary-bg);
    color: var(--color-primary);
}

.edit-result-btn--card {
    flex-shrink: 0;
    margin-left: auto;
}
</style>
