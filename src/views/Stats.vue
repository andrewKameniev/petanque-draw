<template>
    <div>
        <Navbar @open-menu="menuOpen = !menuOpen"/>
        <div class="container">
            <Menu :active="menuOpen"
                  @closeMenu="menuOpen = false"
            />
            <div class="stat-container">
                <div v-if="user" class="mobile-stat-container">
                    <StatsArchive v-if="archiveOpen" @close="archiveOpen = false"/>
                    <div v-else class="mobile-stat-container">
                        <div v-if="currentMan === null" class="mobile-stat-container">
                            <div class="has-text-right mobile-stat-container-header">
                                <button @click="archiveOpen = true" class="button is-info">Archive</button>
                            </div>
                            <label class="label" for="gameName">Enter game name</label>
                            <div class="field control">
                                <input v-model="gameName" class="input" type="text" id="gameName" placeholder="Game name">
                            </div>
                            <div class="field">
                                <label class="radio" v-for="item in gameTypes" :key="item.id">
                                    <input type="radio" name="gameType" :id="item.id" :value="item.value" v-model="gameType" @change="changePlayers">
                                    {{ item.label }}
                                </label>
                            </div>
                            <label class="label">Mode</label>
                            <div class="field">
                                <label class="radio">
                                    <input type="radio" name="statMode" id="statModeClassic" :value="false" v-model="statMode">
                                    Classic
                                </label>
                                <label class="radio">
                                    <input type="radio" name="statMode" id="statModeFast" :value="true" v-model="statMode">
                                    Fast
                                </label>
                            </div>
                            <label class="label">System</label>
                            <div class="field">
                                <label class="radio">
                                    <input type="radio" name="statSystem" id="statSystemSimple" value="simple" v-model="statSystem">
                                    Simple
                                </label>
                                <label class="radio">
                                    <input type="radio" name="statSystem" id="statSystemFrench" value="french" v-model="statSystem">
                                    French (A, B, ...)
                                </label>
                            </div>
                            <label class="label">Scenario</label>
                            <div class="field">
                                <label class="radio">
                                    <input type="radio" name="statScenario" id="statScenarioNegative" :value="false" v-model="statScenario">
                                    Negative
                                </label>
                                <label class="radio">
                                    <input type="radio" name="statScenario" id="statScenarioPositive" :value="true" v-model="statScenario">
                                    Positive
                                </label>
                            </div>
                            <div class="columns mb-3" v-if="team1.players?.length">
                                <div class="column is-half">
                                    <div class="label">Team 1</div>
                                    <div class="field control" v-for="(player, index) in team1.players" :key="index">
                                        <input v-model="player.name" class="input" type="text" id="team1player1" :placeholder="'Player '+ Number(index + 1)  + ' name'">
                                    </div>
                                </div>
                                <div class="column is-half">
                                    <div class="label">Team 2</div>
                                    <div class="field control" v-for="(player, index) in team2.players" :key="index">
                                        <input v-model="player.name" class="input" type="text" id="team1player1" :placeholder="'Player '+ Number(index + 1)  + ' name'">
                                    </div>
                                </div>
                            </div>
                            <button @click="currentMan = 0" class="button is-success">Start</button>
                        </div>
                        <div v-else-if="showResults" class="mobile-stat-container">
                            <div class="mobile-stat-container-header">
                                <button @click="startNewGame" class="button is-info">New game</button>
                            </div>
                            <h2 class="my-3 is-size-4">{{ gameName }}</h2>
                            <div class="columns">
                                <div class="column is-half-desktop">
                                    <div class="label">Team 1</div>
                                    <StatResult :team="team1" :system="statSystem"/>
                                </div>
                                <div class="column is-half-desktop">
                                    <div class="label">Team 2</div>
                                    <StatResult :team="team2" :system="statSystem"/>
                                </div>
                            </div>
                        </div>
                        <div v-else @touchstart="onTouchStart"
                             @touchmove="onTouchMove"
                             @touchend="onTouchEnd"
                             class="mobile-stat-container"
                        >
                            <div class="mobile-stat-container-header">
                                <div class="is-flex is-justify-content-space-between mb-3">
                                    <div class="control">
                                        <button @click="startNewGame" class="button is-danger">New game</button>
                                    </div>
                                    <div class="control">
                                        <button @click="finishGame" class="button is-info">Finish game</button>
                                    </div>
                                </div>
                            </div>
                            <div class="is-flex is-justify-content-space-between">
                                <div>Man <strong>{{ currentMan + 1 }}</strong>/{{manCount}}</div>
                                <div>
                                    <strong>Score</strong>
                                    {{currentScore.team1}} : {{currentScore.team2}}
                                </div>
                            </div>
                            <hr>
                            <Teaminfo :team="team1" :current-man="currentMan" :iterator="1" :system="statSystem"
                                      @update-score="updateTeamScore" @removethrow="removeThrow" @addthrow="addThrow"
                                      @x2throw="doubleThrowResult"
                                      @updatethrow="updateThrow" @changePlayer="changePlayerInTeam"
                            />
                            <hr>
                            <Teaminfo :team="team2" :current-man="currentMan" :iterator="2" :system="statSystem"
                                      @update-score="updateTeamScore" @removethrow="removeThrow" @addthrow="addThrow"
                                      @x2throw="doubleThrowResult"
                                      @updatethrow="updateThrow" @changePlayer="changePlayerInTeam"
                            />
                            <div class="is-flex is-justify-content-space-between mt-3">
                                <button class="button is-info" @click="currentMan--" v-if="currentMan >= 1">Prev</button>
                                <button class="button is-danger" v-if="currentMan !== 0" @click="removeMan">Remove man</button>
                                <button class="button is-success" @click="currentMan++">Next</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="is-size-3 p-3 has-text-centered">
                    You can count statistic only as login user
                </div>
            </div>
            <Message v-if="message.show"/>
<!--            <Footer/>-->
        </div>
    </div>
</template>

<script>

// import Footer from "@/components/partials/Footer.vue";
import Navbar from "@/components/Navbar.vue";
import Menu from "@/components/Menu.vue";
import Teaminfo from "@/components/stats/Teaminfo.vue";
import {getDatabase, ref, set} from "firebase/database";
import {mapMutations, mapState} from "vuex";
import StatsArchive from "@/components/stats/StatsArchive.vue";
import StatResult from "@/components/stats/StatResult.vue";
import {gameTypes} from "@/helpers-stat.js"
import Message from "@/components/Message.vue";
export default {
    name: 'Stats',
    components: {Message, StatResult, StatsArchive, Teaminfo, Menu, Navbar, /*Footer*/},
    data() {
        return {
            archiveOpen: false,
            menuOpen: false,
            showResults: false,
            startX: 0,
            startY: 0,
            swipeDirection: null,
            gameName: '',
            gameType: 1,
            statScenario: false,
            statMode: false,
            statSystem: 'simple',
            currentMan: null,
            gameTypes,
            team1: {
                score: []
            },
            team2: {
                score: []
            },
            throwInfo: {
                isMade: false,
                type: 'p',
                success: false,
                french: 'D'
            },
        }
    },
    mounted() {
        this.getLocalData();
    },
    computed: {
        ...mapState(['user', 'message']),
        currentScore() {
            return {
                team1: this.team1.score.reduce((a, b) => a + b, 0),
                team2: this.team2.score.reduce((a, b) => a + b, 0)
            }
        },
        manCount() {
            return this.team1.players[0].stat.length
        },
    },
    watch: {
        statScenario(newValue) {
            this.throwInfo.success = newValue;
        },
        statMode(newValue) {
            this.throwInfo.isMade = newValue;
        },
        currentMan() {
            if (this.currentScore.team1 < 13 || this.currentScore.team2 < 13) {
                this.nextMan()
            }
        }
    },
    methods: {
        ...mapMutations(['showMessage']),
        saveLocalData() {
            const data = {
                type: this.gameType,
                system: this.statSystem,
                name: this.gameName,
                scenario: this.statScenario,
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
            currentPlayer.stat = Array(currentPlayer.onChanged).fill(null);
            currentPlayer.onChanged = this.currentMan;
            this['team' + teamIndex].players[playerIndex].wasChanged = this.currentMan;
            for (let i = 0; i < this.currentMan; i++) {
                this['team' + teamIndex].players[this['team' + teamIndex].players.length - 1].stat.unshift([]);
            }
        },
        finishGame() {
            this.showResults = true;
            let statResult = {
                date: Date.now(),
                system: this.statSystem,
                name: this.gameName,
                team1: this.team1,
                team2: this.team2
            }
            const db = getDatabase();
            set(ref(db, `${this.user.uid}/stats/${statResult.date}`), statResult).then(() => {
                this.showMessage({title: 'Awesome!', text: 'Statistics saved to db'});
                localStorage.removeItem('statGame');
            }).catch((error) => {
                console.error('Error save:', error);
                this.showMessage({title: 'error', text: error, type: 'error'});
            });
        },
        startNewGame() {
            this.showResults = false;
            this.currentMan = null;
            this.gameName = '';
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
        onTouchStart(event) {
            this.startX = event.touches[0].clientX;
            this.startY = event.touches[0].clientY;
        },
        onTouchMove(event) {
            event.preventDefault();
        },
        onTouchEnd(event) {
            const endX = event.changedTouches[0].clientX;
            const endY = event.changedTouches[0].clientY;

            const deltaX = endX - this.startX;
            const deltaY = endY - this.startY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                this.swipeDirection = deltaX > 0 ? "right" : "left";
                if (Math.abs(endX - this.startX) > 50) {
                    if (this.swipeDirection === 'right') {
                        if (this.currentMan > 0) {
                            this.currentMan--
                        }
                    } else {
                        this.currentMan++
                    }
                }
            } else {
                this.swipeDirection = deltaY > 0 ? "down" : "up";
            }
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

            player.stat.push(statEntry);
        },
        nextMan() {
            if (this.team1.players[0].stat.length <= this.currentMan) {
                this.addPlayersStats(this.team1.players);
                this.addPlayersStats(this.team2.players);
                this.saveLocalData();
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
    min-height: 100vh;
}

@media screen and (max-width: 500px) {
    .stat-container {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding-bottom: 15vh;
    }

    .mobile-stat-container {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .mobile-stat-container-header {
        margin-bottom: auto;
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
</style>
