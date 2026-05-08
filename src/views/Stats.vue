<template>
    <div class="wrapper">
        <Navbar @open-menu="menuOpen = !menuOpen"/>
        <div class="container">
            <Menu :active="menuOpen"
                  @closeMenu="menuOpen = false"
            />
            <div class="stat-container">
                <div v-if="user" class="mobile-stat-container">
                    <StatsArchive v-if="archiveOpen" @close="archiveOpen = false" :tags="tags"/>
                    <div v-else class="mobile-stat-container">
                        <div v-if="currentMan === null" class="mobile-stat-container">
                            <StatsSetup
                                :tags="tags"
                                :team1="team1"
                                :team2="team2"
                                :initialGameType="gameType"
                                :initialStatMode="statMode"
                                :initialStatScenario="statScenario"
                                :initialStatSystem="statSystem"
                                :initialAsCouch="asCouch"
                                :initialGameName="gameName"
                                :initialGameTags="gameTags"
                                @start="onSetupStart"
                                @openArchive="archiveOpen = true"
                                @changeType="onChangeType"
                                @addTag="addTag"
                                @removeTag="removeTag"
                            />
                        </div>
                        <div v-else-if="showResults" class="mobile-stat-container">
                            <div class="mobile-stat-container-header">
                                <button @click="startNewGame" class="button is-info">{{ $t('stat.newGame') }}</button>
                            </div>
                            <h2 class="my-3 is-size-4">{{ gameName }}</h2>
                            <div class="columns is-desktop">
                                <div class="column is-half-desktop">
                                    <StatResult :label="$t('stat.team1Label')" :team="team1" :system="statSystem"/>
                                </div>
                                <div class="column is-half-desktop">
                                    <StatResult :label="$t('stat.team2Label')" :team="team2" :system="statSystem"/>
                                </div>
                            </div>
                        </div>
                        <StatsTracking v-else
                            :team1="team1"
                            :team2="team2"
                            :currentMan="currentMan"
                            :currentScore="currentScore"
                            :manCount="manCount"
                            :statSystem="statSystem"
                            :asCouch="asCouch"
                            :isSaving="isSaving"
                            @newGame="startNewGame"
                            @finishGame="finishGame"
                            @updateScore="updateTeamScore"
                            @removeThrow="removeThrow"
                            @addThrow="addThrow"
                            @x2Throw="doubleThrowResult"
                            @updateThrow="updateThrow"
                            @changePlayer="changePlayerInTeam"
                            @next="currentMan++"
                            @prev="currentMan--"
                            @removeMan="removeMan"
                            @distanceChange="onDistanceChange"
                        />
                    </div>
                </div>
                <div v-else class="is-size-3 p-3 has-text-centered">
                    {{ $t('stat.onlyLogin') }}
                    <div class="mt-5">
                        <router-link to="/" class="btn-login-primary btn-login-primary--large">
                            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                            </svg>
                            {{ $t('common.loginUser') }}
                        </router-link>
                    </div>
                </div>
            </div>
            <Message v-if="message.show"/>
        </div>
        <Footer/>
    </div>
</template>

<script>

import Footer from "@/components/partials/Footer.vue";
import Navbar from "@/components/Navbar.vue";
import Menu from "@/components/Menu.vue";
import {statsService} from "@/services/db";
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import StatsArchive from "@/components/stats/StatsArchive.vue";
import StatResult from "@/components/stats/StatResult.vue";
import StatsSetup from "@/components/stats/StatsSetup.vue";
import StatsTracking from "@/components/stats/StatsTracking.vue";
import {gameTypes} from "@/helpers-stat.js"
import Message from "@/components/Message.vue";
import Loader from "@/components/Loader.vue";
export default {
    name: 'Stats',
    components: {Loader, Message, StatResult, StatsArchive, StatsSetup, StatsTracking, Menu, Navbar, Footer},
    data() {
        return {
            isSaving: false,
            tagsLoading: false,
            tags: null,
            gameTags: [],
            archiveOpen: false,
            menuOpen: false,
            showResults: false,
            gameName: '',
            gameType: 1,
            statScenario: false,
            statMode: false,
            asCouch: false,
            statSystem: 'simple',
            currentMan: null,
            gameTypes,
            team1: {
                score: []
            },
            team2: {
                score: []
            },
            manDistance: null,
        }
    },
    mounted() {
        this.getLocalData();
        this.getTags();
    },
    computed: {
        ...mapState(useMainStore, ['user', 'message']),
        currentScore() {
            return {
                team1: this.team1.score.reduce((a, b) => a + b, 0),
                team2: this.team2.score.reduce((a, b) => a + b, 0)
            }
        },
        manCount() {
            return this.team1.players[0].stat.length
        },
        throwInfo() {
            return {
                isMade: this.statMode,
                type: 'p',
                success: this.statScenario,
                french: 'D',
                distance: this.manDistance,
                important: this.currentScore.team1 > 9 && this.currentScore.team2 > 9,
            }
        },
    },
    watch: {
        currentMan() {
            if (this.currentMan !== null && (this.currentScore.team1 < 13 || this.currentScore.team2 < 13)) {
                this.nextMan()
            }
        },
        manDistance(newValue) {
            this.team1.players.forEach(player => player.stat[this.currentMan].forEach(item => {
                item.distance = newValue
            }));
            this.team2.players.forEach(player => player.stat[this.currentMan].forEach(item => {
                item.distance = newValue
            }))
        }
    },
    methods: {
        ...mapActions(useMainStore, ['showMessage']),
        getTags() {
            this.tagsLoading = true;

            statsService.getTags(this.user.uid)
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        this.tags = snapshot.val();
                    } else {
                        this.tags = null;
                    }
                })
                .catch((error) => {
                    console.error('Error loading statistics:', error);
                    this.tags = null;
                    this.showMessage({
                        title: this.$t('messages.error'),
                        text: this.$t('messages.failedLoadTags'),
                        type: 'error',
                    });
                })
                .finally(() => {
                    this.tagsLoading = false;
                });
        },
        saveLocalData() {
            const data = {
                type: this.gameType,
                system: this.statSystem,
                name: this.gameName,
                scenario: this.statScenario,
                asCouch: this.asCouch,
                mode: this.statMode,
                team1: {...this.team1},
                team2: {...this.team2}
            }
            localStorage.setItem('statGame', JSON.stringify(data))
        },
        getLocalData(){
            if (localStorage.getItem('statGame')) {
                const gameData = JSON.parse(localStorage.getItem('statGame'));
                this.gameType = gameData.type;
                this.statMode = gameData.mode;
                this.statScenario = gameData.scenario;
                this.statSystem = gameData.system;
                this.gameName = gameData.name;
                this.team1 = {...gameData.team1};
                this.team2 = {...gameData.team2};
                this.currentMan = this.manCount - 1;
            } else {
                this.changePlayers();
            }
        },
        changePlayerInTeam(teamIndex, playerIndex, playerName) {
            this.addPlayer(this['team' + teamIndex], playerName);
            const currentPlayer = this['team' + teamIndex].players[this['team' + teamIndex].players.length - 1];
            this.addPlayerStats(currentPlayer);
            currentPlayer.isChanged = this.currentMan;
            currentPlayer.stat = Array(currentPlayer.isChanged + 1).fill([]);
            this['team' + teamIndex].players[playerIndex].wasChanged = this.currentMan;
        },
        onSetupStart({ gameName, gameType, statMode, statScenario, statSystem, asCouch, gameTags }) {
            this.gameName = gameName;
            this.gameType = gameType;
            this.statMode = statMode;
            this.statScenario = statScenario;
            this.statSystem = statSystem;
            this.asCouch = asCouch;
            this.gameTags = gameTags;
            this.currentMan = 0;
        },
        onChangeType(gameType) {
            this.gameType = gameType;
            this.changePlayers();
        },
        onDistanceChange(newValue) {
            this.manDistance = newValue;
        },
        addTag(id, name) {
            this.tags[id] = name;
        },
        removeTag(id) {
            delete this.tags[id]
        },
        finishGame() {
            this.showResults = true;
            let statResult = {
                date: Date.now(),
                system: this.statSystem,
                tags: this.gameTags,
                name: this.gameName,
                team1: this.team1,
                team2: this.team2
            }
            this.isSaving = true;
            statsService.save(this.user.uid, statResult.date, statResult).then(() => {
                this.showMessage({title: this.$t('messages.awesome'), text: this.$t('messages.statsSaved')});
                localStorage.removeItem('statGame');
                this.isSaving = false;
            }).catch((error) => {
                console.error('Error save:', error);
                this.showMessage({title: this.$t('messages.error'), text: error, type: 'error'});
            });
        },
        startNewGame() {
            this.showResults = false;
            this.currentMan = null;
            this.gameName = '';
            this.gameTags = [];
            this.team1 = {
                score: []
            };
            this.team2 = {
                score: []
            };
            this.changePlayers();
        },
        removeThrow(team, playerIndex, manIndex, throwIndex) {
            team.players[playerIndex].stat[manIndex].splice(throwIndex, 1)
        },
        addThrow(team, playerIndex, manIndex, throwIndex) {
            team.players[playerIndex].stat[manIndex][throwIndex].isMade = true
        },
        doubleThrowResult(team, playerIndex, manIndex, throwIndex, res) {
            team.players[playerIndex].stat[manIndex][throwIndex].x2 = res
        },
        updateThrow(team, playerIndex, manIndex, throwIndex, type, value) {
            team.players[playerIndex].stat[manIndex][throwIndex][type] = value
        },
        updateTeamScore(team, newScore, manIndex) {
            team.score[manIndex] = newScore || 0;
        },
        removeMan() {
            this.team1.players.forEach(player => {
                player.stat.splice(this.currentMan, 1);
            });
            this.team2.players.forEach(player => {
                player.stat.splice(this.currentMan, 1);
            });
            this.currentMan--
        },
        addPlayersStats(players) {
            players.forEach((player, index) => {
                if (index === 2) {
                    this.throwInfo.type = 't'
                } else {
                    this.throwInfo.type = 'p'
                }

                this.addPlayerStats(player);
            });
        },
        addPlayerStats(player) {
            const statEntry = [
                JSON.parse(JSON.stringify(this.throwInfo)),
                JSON.parse(JSON.stringify(this.throwInfo)),
            ];

            if (this.gameType === 1 || this.gameType === 2) {
                statEntry.push(JSON.parse(JSON.stringify(this.throwInfo)));
            }
            if (!player.wasChanged) {
                player.stat.push(statEntry);
            }
        },
        nextMan() {
            if (this.team1.players[0].stat.length <= this.currentMan) {
                this.addPlayersStats(this.team1.players);
                this.addPlayersStats(this.team2.players);
                if(this.currentMan) {
                    this.saveLocalData();
                } else {
                    localStorage.removeItem('statGame');
                }
            }
        },
        changePlayers() {
            this.team1.players = [];
            this.team2.players = [];
            for (let i = 0; i < this.gameType; i++) {
                this.addPlayer(this.team1);
                this.addPlayer(this.team2);
            }
        },
        addPlayer(team, name = '') {
            const playerInfo = {
                name: name,
                stat: []
            }
            team.players.push({ ...JSON.parse(JSON.stringify(playerInfo)) });
        }
    },
}
</script>

<style>
.stat-container {
    flex: 1;
}

@media screen and (max-width: 500px) {
    .stat-container {
        display: flex;
        flex-direction: column;
    }

    .mobile-stat-container {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
}

.player-info {
    background: #ffffff8a;
    padding: 5px;
    border-radius: 5px;
}
.throw-result-container {
    line-height: 0;
}
.throw-result {
    display: inline-block;
    margin-right: 3px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: red;
}

.throw-result.-success {
    background: green;
}

.throw-result.-carro {
    background: dodgerblue;
}
</style>
