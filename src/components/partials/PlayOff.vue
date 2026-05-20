<template>
    <div v-if="tournament" :class="{'container': !isPublicView || playOffStageCurrent !== 0, 'content': activeTournament && (!isPublicView || playOffStageCurrent !== 0)}" style="padding-top: 0; margin-top: 0;">
        <div class="is-flex is-justify-content-space-between is-align-items-center mb-2" v-if="!hideHeader && (!isPublicView || playOffStageCurrent !== 0)">
            <h2 v-if="playOffStageCurrent !== 0" style="margin: 0;">{{ $t('games.playOff') }}</h2>
            <button v-if="!isPublicView && playOffStageCurrent !== 0" class="button btn-purple-outline" @click="showBracket = true"><GitFork :size="16" style="transform: rotate(90deg); margin-right: 0.3rem;"/> {{ $t('games.showBracket') }}</button>
        </div>
        <div class="column play-off-stage-wrapper" data-testid="playoff-wrapper" v-if="playOffBracket">
            <FinishedBanner v-if="playOffStageCurrent === 0 && !isPublicView" @openResults="$emit('openResults')"/>
            <template v-else-if="playOffStageCurrent && playOffStageCurrent !== 0 && currentPlayOffBracketIndex >= 0 && playOffBracket.stages?.[currentPlayOffBracketIndex]">
                <div class="playoff-stage-header">
                    <h2 class="text-center playoff-stage-title" data-testid="playoff-stage-heading">{{playOffStageCurrent === 1 ? $t('games.final') : '1/' + playOffStageCurrent + ' ' + $t('games.ofFinal')}}</h2>
                    <div class="playoff-search-wrapper">
                        <button class="playoff-search-btn" @click="showSearch = !showSearch" :class="{'playoff-search-btn--active': highlightedTeam}">
                            <Search :size="16"/>
                            <UserRound :size="16"/>
                        </button>
                        <div v-if="showSearch" class="playoff-search-popover">
                            <input ref="searchInput" v-model="searchQuery" class="playoff-search-input" :placeholder="$t('teams.searchTeam')" @keydown.escape="showSearch = false" @keydown.enter="applySearch"/>
                            <ul v-if="filteredClubs.length" class="playoff-search-list playoff-search-clubs">
                                <li v-for="club in filteredClubs" :key="'club-'+club"
                                    class="playoff-search-item playoff-search-item--club"
                                    :class="{'playoff-search-item--active': highlightedTeam === club}"
                                    @click="selectTeam(club)">
                                    <Building2 :size="12"/>
                                    {{ club }}
                                </li>
                            </ul>
                            <ul class="playoff-search-list">
                                <li v-for="team in filteredTeams" :key="team"
                                    class="playoff-search-item"
                                    :class="{'playoff-search-item--active': isTeamHighlighted(team)}"
                                    @click="selectTeam(team)">
                                    {{ team }}
                                </li>
                                <li v-if="!filteredTeams.length && !filteredClubs.length" class="playoff-search-empty">{{ $t('teams.noResults') }}</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <Game v-for="(game, ind) in playOffBracket.stages[currentPlayOffBracketIndex].teams" :key="ind"
                      :active-tournament="tournament"
                      :game="game" :game-index="ind" :is-playoff="true"
                      :lane-number="currentStageLaneOrder[ind]"
                      :class="{'game--highlighted': isGameHighlighted(game)}"
                      :active-round="currentPlayOffBracketIndex" :compact-view="isPublicView" @save="saveResults"/>
                <div v-if="playOffStageCurrent === 1 && tournament.playOff.length > 1">
                    <h3 class="text-center mt-5">{{ $t('games.thirdPlace') }}</h3>
                    <Game :game="playOffBracket.thirdPlace" :is-third="true"
                          :active-tournament="tournament" :compact-view="isPublicView" :game-index="1" @save="saveResults"/>
                </div>
                <div v-if="scoreError" class="has-text-centered has-text-danger mb-5 mt-5">{{ $t('games.resultsError') }}</div>
                <div class="text-center mt-5" v-if="!activeTournament">
                    <button class="button btn-save-results" data-testid="btn-save-playoff" @click="saveResults"><Save :size="16" class="mr-1"/> {{ $t('games.saveResults') }}</button>
                </div>
            </template>
        </div>
        <Bracket v-if="showBracket" :bracket="playOffBracket" @close-modal="showBracket = false"/>
    </div>
</template>

<script>
import Bracket from './Bracket';
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {isScoreError, shuffleArray} from "@/helpers";
import Game from "@/components/partials/Game.vue";
import {Save, GitFork, Search, UserRound, Building2} from "lucide-vue-next";
import FinishedBanner from "@/components/partials/FinishedBanner.vue";

export default {
    name: 'PlayOff',
    props: ['activeTournament', 'isPublicView', 'hideHeader'],
    emits: ['openResults'],
    components: {Game, Bracket, Save, GitFork, Search, UserRound, Building2, FinishedBanner},
    data(){
        return {
            scoreError: false,
            showBracket: false,
            showSearch: false,
            searchQuery: '',
            highlightedTeam: null,
        }
    },
    watch: {
        showSearch(val) {
            if (val) {
                this.$nextTick(() => this.$refs.searchInput?.focus());
                document.addEventListener('click', this._onClickOutside);
            } else {
                document.removeEventListener('click', this._onClickOutside);
            }
        }
    },
    beforeUnmount() {
        document.removeEventListener('click', this._onClickOutside);
    },
    created() {
        this._onClickOutside = (e) => {
            const wrapper = this.$el?.querySelector('.playoff-search-wrapper');
            if (wrapper && !wrapper.contains(e.target)) {
                this.showSearch = false;
            }
        };
    },
    mounted() {
        if(!this.tournament.playOffBracket && this.tournament.playOff?.length){
            this.getPlayOffBracket();
        }
    },
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament']),
        tournament() {
            return this.activeTournament || this.currentTournament
        },
        playOffStageCurrent() {
            if ('playOffStage' in this.tournament) return this.tournament.playOffStage
            return this.tournament.playOff?.[0]?.stage ?? null
        },
        playOffBracket() {
            return this.tournament.playOffBracket ? this.tournament.playOffBracket : null
        },
        stagesCount(){
            return Math.log(this.tournament.playOff.length * 2) / Math.log(2);
        },
        currentPlayOffBracketIndex(){
            if(this.tournament.playOffBracket?.stages){
                return this.tournament.playOffBracket.stages.findIndex(item => item.stageLabel === this.playOffStageCurrent)
            } else {
                return 0
            }
        },
        currentStageLaneOrder() {
            const stage = this.playOffBracket?.stages?.[this.currentPlayOffBracketIndex];
            if (stage?.laneOrder) {
                return stage.laneOrder;
            }
            return Array.from({length: stage?.teams?.length || 0}, (_, k) => k);
        },
        teamClubMap() {
            const map = {};
            this.tournament.teams?.forEach(t => {
                const club = t.players?.[0]?.club;
                if (club) map[t.title] = club;
            });
            return map;
        },
        allParticipants() {
            const teams = new Set();
            this.playOffBracket?.stages?.forEach(stage => {
                stage.teams?.forEach(game => {
                    if (game.team_1) teams.add(game.team_1);
                    if (game.team_2) teams.add(game.team_2);
                });
            });
            return [...teams].sort();
        },
        allClubs() {
            const clubs = new Set();
            Object.values(this.teamClubMap).forEach(c => { if (c) clubs.add(c); });
            return [...clubs].sort();
        },
        filteredClubs() {
            if (!this.searchQuery.trim()) return this.allClubs;
            const q = this.searchQuery.toLowerCase();
            return this.allClubs.filter(c => c.toLowerCase().includes(q));
        },
        filteredTeams() {
            if (!this.searchQuery.trim()) return this.allParticipants;
            const q = this.searchQuery.toLowerCase();
            return this.allParticipants.filter(t =>
                t.toLowerCase().includes(q) ||
                (this.teamClubMap[t] && this.teamClubMap[t].toLowerCase().includes(q))
            );
        }
    },
    methods: {
        shuffleArray,
        selectTeam(team) {
            this.highlightedTeam = this.highlightedTeam === team ? null : team;
            this.showSearch = false;
            this.searchQuery = '';
        },
        applySearch() {
            if (this.searchQuery.trim()) {
                this.highlightedTeam = this.searchQuery.trim();
                this.showSearch = false;
            }
        },
        teamMatchesQuery(team, q) {
            if (!team) return false;
            return team.toLowerCase().includes(q) ||
                   (this.teamClubMap[team] && this.teamClubMap[team].toLowerCase().includes(q));
        },
        isTeamHighlighted(team) {
            if (!this.highlightedTeam) return false;
            return this.teamMatchesQuery(team, this.highlightedTeam.toLowerCase());
        },
        isGameHighlighted(game) {
            if (!this.highlightedTeam) return false;
            const q = this.highlightedTeam.toLowerCase();
            return this.teamMatchesQuery(game.team_1, q) || this.teamMatchesQuery(game.team_2, q);
        },
        ...mapActions(useMainStore, ['finishTournament', 'setPlayOffBracket', 'setPlayOffStage']),
        saveResults() {
            this.scoreError = false;
            if(this.playOffBracket.stages[this.currentPlayOffBracketIndex].teams.some(game => isScoreError(game, this.tournament.preferences.maxScore))){
                this.scoreError = true;
                return false
            }
            if(this.playOffBracket.stages[this.currentPlayOffBracketIndex].teamsCount === 2){ //final
                this.setPlayOffStage(0)
                this.finishTournament();
            } else {
                let bracket = JSON.parse(JSON.stringify(this.playOffBracket));
                bracket.stages[this.currentPlayOffBracketIndex].teams.forEach((game, index) => {
                    if(index % 2 === 0){
                        bracket.stages[this.currentPlayOffBracketIndex + 1].teams[index / 2].team_1 = game.team_1_score > game.team_2_score ? game.team_1 : game.team_2
                        if(bracket.stages[this.currentPlayOffBracketIndex].teamsCount === 4){ //third place
                            if (!bracket.thirdPlace) {
                                bracket.thirdPlace = {}
                            }
                            bracket.thirdPlace.team_1 =  game.team_1_score < game.team_2_score ? game.team_1 : game.team_2
                        }
                    } else {
                        bracket.stages[this.currentPlayOffBracketIndex + 1].teams[(index - 1) / 2].team_2 = game.team_1_score > game.team_2_score ? game.team_1 : game.team_2
                        if(bracket.stages[this.currentPlayOffBracketIndex].teamsCount === 4){ //third place
                            if (!bracket.thirdPlace) {
                                bracket.thirdPlace = {}
                            }
                            bracket.thirdPlace.team_2 = game.team_1_score < game.team_2_score ? game.team_1 : game.team_2
                        }
                    }

                })
                this.setPlayOffBracket(bracket);
                this.setPlayOffStage(this.playOffStageCurrent / 2)
            }
        },
        getPlayOffBracket() {
            let brackets = {
                stages: [],
                thirdPlace: {}
            };
            for (let i = this.stagesCount; i > 0; i--){
                const teamsCount = Math.pow(2, i);
                const stageLabel = teamsCount/2;
                let teams = []
                if(i === this.stagesCount){
                    teams = this.tournament.playOff;
                } else {
                    for (let j = 1; j <= stageLabel; j++){
                        const game = {
                            id: i + 1,
                            stage: stageLabel,
                            team_1: null,
                            team_1_score: null,
                            team_2: null,
                            team_2_score: null,
                        };

                        teams.push(game)
                    }
                }
                const laneOrder = this.shuffleArray(Array.from({length: teams.length}, (_, k) => k));
                const stage = {
                    teamsCount: teamsCount,
                    stageLabel: stageLabel,
                    teams: teams,
                    laneOrder: laneOrder,
                }
                brackets.stages.push(stage)
            }
            if(this.tournament.cadrage){
                const seeding = this.getTournamentSeeding(this.tournament.cadrage.length);
                const sortedCadrage = this.tournament.cadrage.sort((a,b) => (a.team_2_place - b.team_2_place));
                let cadrageArray = [];
                seeding.forEach(seed => {
                    const game = sortedCadrage[seed - 1]
                    if(game){
                        cadrageArray.push(game)
                    }
                })
                const cadrageStage = {
                    teamsCount: this.tournament.cadrage.length * 2,
                    stageLabel: 'cadrage',
                    teams: cadrageArray,
                }
                brackets.stages.unshift(cadrageStage)
            }
            this.setPlayOffBracket(brackets);
        },
        getTournamentSeeding(n) {
            let seeding = [1];
            while (seeding.length < n) {
                let nextSeeding = [];
                let currentTotal = seeding.length * 2;
                for (let i = 0; i < seeding.length; i++) {
                    const team = seeding[i];
                    const partner = currentTotal + 1 - team;
                    if (i % 2 === 0) {
                        nextSeeding.push(team, partner);
                    } else {
                        nextSeeding.push(partner, team);
                    }
                }
                seeding = nextSeeding;
            }
            return seeding;
        }
    },
}
</script>

<style scoped>

.btn-save-results {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: var(--color-success);
    color: var(--color-btn-text);
    border: none;
    font-weight: 600;
    padding: 0.6rem 1.5rem;
    border-radius: 6px;
}

.btn-save-results:hover {
    background: var(--color-success-hover);
    color: var(--color-btn-text);
}

.btn-save-results:focus,
.btn-save-results.is-focused,
.btn-save-results:active {
    outline: none;
    box-shadow: 0 0 0 3px var(--color-primary-shadow) !important;
    border-color: transparent;
}

.playoff-stage-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
}

.playoff-search-wrapper {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
}

.playoff-stage-title {
    margin: 0 !important;
}

.playoff-search-btn {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    width: 40px;
    height: 24px;
    justify-content: center;
    border: none;
    border-radius: 12px;
    background: var(--color-text-muted, #9ca3af);
    color: white;
    cursor: pointer;
    transition: background 0.15s;
    -webkit-tap-highlight-color: transparent;
    -webkit-appearance: none;
    appearance: none;
}

.playoff-search-btn svg {
    width: 12px;
    height: 12px;
}

.playoff-search-btn:hover {
    background: var(--color-text-muted, #6b7280);
}

.playoff-search-btn:focus,
.playoff-search-btn:focus-visible,
.playoff-search-btn:active {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
    background: var(--color-text-muted, #6b7280);
}

.playoff-search-btn--active {
    background: var(--color-text-muted, #6b7280);
}

.playoff-search-popover {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    width: 260px;
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    z-index: 100;
    padding: 0.5rem;
}

.playoff-search-input {
    width: 100%;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 6px;
    font-size: 1rem;
    outline: none;
    background: var(--color-surface, #fff);
    color: var(--color-text, #1a1a1a);
}

.playoff-search-input:focus {
    border-color: var(--color-primary);
}

.playoff-search-list {
    list-style: none;
    margin: 0.4rem 0 0;
    padding: 0;
    max-height: 200px;
    overflow-y: auto;
}

.playoff-search-item {
    padding: 0.35rem 0.6rem;
    font-size: 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.1s;
}

.playoff-search-item:hover {
    background: var(--color-surface-hover, #f3f4f6);
}

.playoff-search-item--active {
    background: var(--color-primary);
    color: white;
}

.playoff-search-clubs {
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    padding-bottom: 0.4rem;
    margin-bottom: 0.2rem;
}

.playoff-search-item--club {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 500;
}

.playoff-search-empty {
    padding: 0.5rem 0.6rem;
    font-size: 1rem;
    color: var(--color-text-muted, #9ca3af);
}

.game--highlighted {
    outline: 2px solid var(--color-primary);
    border-radius: 8px;
    box-shadow: 0 0 0 4px var(--color-primary-shadow, rgba(124, 58, 237, 0.15));
}
</style>