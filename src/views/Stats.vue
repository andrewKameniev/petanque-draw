<template>
    <div>
        <Navbar @open-menu="menuOpen = !menuOpen"/>
        <div class="container">
            <Menu :active="menuOpen"
                  @closeMenu="menuOpen = false"
            />
            <div class="stat-container">
                <StatsArchive v-if="archiveOpen" @close="archiveOpen = false"/>
                <div v-else>
                    <div v-if="currentMan === null">
                        <div class="has-text-right">
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
                    <div v-else-if="showResults">
                        <button @click="showResults = false" class="button is-info">New game</button>
                        <div class="columns">
                            <div class="column is-half-desktop">
                                <div class="label">Team 1</div>
                                <StatResult :team="team1" :team-stats="teamsStat.team1"/>
                            </div>
                            <div class="column is-half-desktop">
                                <div class="label">Team 2</div>
                                <StatResult :team="team2" :team-stats="teamsStat.team2"/>
                            </div>
                        </div>
                    </div>
                    <div v-else @touchstart="onTouchStart"
                         @touchmove="onTouchMove"
                         @touchend="onTouchEnd">
                        <div class="mb-3">
                            <button @click="finishGame" class="button is-info">Finish game</button>
                        </div>
                        <div class="is-flex is-justify-content-space-between">
                            <div>Man <strong>{{ currentMan + 1 }}</strong>/{{manCount}}</div>
                            <div>
                                <strong>Score</strong>
                                {{currentScore.team1}} : {{currentScore.team2}}
                            </div>
                        </div>
                        <hr>
                        <Teaminfo :team="team1" :team-stats="teamsStat.team1" :current-man="currentMan" :iterator="1"
                                  @update-score="updateTeamScore" @removethrow="removeThrow"
                                  @updatethrow="updateThrow"
                        />
                        <hr>
                        <Teaminfo :team="team2" :team-stats="teamsStat.team2" :current-man="currentMan" :iterator="2"
                                  @update-score="updateTeamScore" @removethrow="removeThrow"
                                  @updatethrow="updateThrow"
                        />
                        <div class="is-flex is-justify-content-space-between mt-3">
                            <button class="button is-info" @click="currentMan--" v-if="currentMan >= 0">Prev</button>
                            <button class="button is-danger" v-if="currentMan === manCount - 1" @click="removeMan">Remove man</button>
                            <button class="button is-success" @click="currentMan++">Next</button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer/>
        </div>
    </div>
</template>

<script>

import Footer from "@/components/partials/Footer.vue";
import Navbar from "@/components/Navbar.vue";
import Menu from "@/components/Menu.vue";
import Teaminfo from "@/components/stats/Teaminfo.vue";
import {getDatabase, ref, set} from "firebase/database";
import {mapMutations, mapState} from "vuex";
import StatsArchive from "@/components/stats/StatsArchive.vue";
import StatResult from "@/components/stats/StatResult.vue";
export default {
    name: 'Stats',
    components: {StatResult, StatsArchive, Teaminfo, Menu, Navbar, Footer},
    data() {
        return {
            archiveOpen: false,
            menuOpen: false,
            showResults: false,
            startX: 0,
            startY: 0,
            swipeDirection: null,
            gameTypes: [
                {
                    id: 'tet',
                    label: 'Tet-a-tet',
                    value: 1,
                },
                {
                    id: 'doublet',
                    label: 'Doublet',
                    value: 2,
                },
                {
                    id: 'triplet',
                    label: 'Triplet',
                    value: 3,
                },
            ],
            gameName: '',
            gameType: 1,
            statScenario: false,
            currentMan: null,
            team1: {
                score: []
            },
            team2: {
                score: []
            },
            throwInfo: {
                type: 'p',
                success: false
            }
        }
    },
    mounted() {
        this.changePlayers();
    },
    computed: {
        ...mapState(['user']),
        currentScore() {
            return {
                team1: this.team1.score.reduce((a, b) => a + b, 0),
                team2: this.team2.score.reduce((a, b) => a + b, 0)
            }
        },
        manCount() {
            return this.team1.players[0].stat.length
        },
        teamsStat() {
          return {
              team1: this.calculateTeamStat(this.team1),
              team2: this.calculateTeamStat(this.team2)
          }
        },
    },
    watch: {
        statScenario(newValue) {
            this.throwInfo.success = newValue;
        },
        currentMan() {
            if (this.currentScore.team1 < 13 || this.currentScore.team2 < 13) {
                this.nextMan()
            }
        }
    },
    methods: {
        ...mapMutations(['showMessage']),
        finishGame() {
            this.showResults = true;
            let statResult = {
                date: Date.now(),
                name: this.gameName,
                team1: this.team1,
                team2: this.team2
            }
            const db = getDatabase();
            set(ref(db, `${this.user.uid}/stats/${statResult.date}`), statResult).then(() => {
                this.showMessage({title: 'Awesome!', text: 'Statistics saved to db'});
            }).catch((error) => {
                console.error('Error save:', error);
                this.showMessage({title: 'error', text: error, type: 'error'});
            });
        },
        calculateTeamStat(team) {
            let teamStat = [];
            team.players.forEach(() => {
                teamStat.push({
                    points: {
                        positive: 0,
                        negative: 0
                    },
                    tirs: {
                        positive: 0,
                        negative: 0
                    },
                    serie: []
                })
            })

            if (team.players[0].stat?.length) {
                team.players.forEach((player, index) => {
                    player.stat.forEach(man => {
                        man.forEach(item => {
                            if (item.type === 'p') {
                                if (item.success) {
                                    teamStat[index].points.positive += 1;
                                } else {
                                    teamStat[index].points.negative += 1;
                                }
                            } else {
                                if (item.success) {
                                    teamStat[index].tirs.positive += 1;
                                } else {
                                    teamStat[index].tirs.negative += 1;
                                }
                            }
                            teamStat[index].serie.push(item);
                        })
                    })
                    teamStat[index].all = {
                        positive: teamStat[index].points.positive + teamStat[index].tirs.positive,
                        negative: teamStat[index].points.negative + teamStat[index].tirs.negative
                    }
                })
            }

            return teamStat
        },
        removeThrow(team, playerIndex, manIndex, throwIndex) {
            team.players[playerIndex].stat[manIndex].splice(throwIndex, 1)
        },
        updateThrow(team, playerIndex, manIndex, throwIndex, type, value) {
            team.players[playerIndex].stat[manIndex][throwIndex][type] = value
        },
        updateTeamScore(team, newScore, manIndex) {
            team.score[manIndex] = newScore;
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
                this.swipeDirection === 'right' ? this.currentMan-- : this.currentMan++
            } else {
                this.swipeDirection = deltaY > 0 ? "down" : "up";
            }
        },
        addPlayerStats(players) {
            players.forEach((player, index) => {
                if (index === 2) {
                    this.throwInfo.type = 't'
                } else {
                    this.throwInfo.type = 'p'
                }

                const statEntry = [
                    JSON.parse(JSON.stringify(this.throwInfo)),
                    JSON.parse(JSON.stringify(this.throwInfo)),
                ];

                if (this.gameType === 1 || this.gameType === 2) {
                    statEntry.push(JSON.parse(JSON.stringify(this.throwInfo)));
                }

                player.stat.push(statEntry);
            });
        },
        nextMan() {
            if (this.team1.players[0].stat.length <= this.currentMan) {
                this.addPlayerStats(this.team1.players);
                this.addPlayerStats(this.team2.players);
            }
        },
        changePlayers() {
            this.team1.players = [];
            this.team2.players = [];
            for (let i = 0; i < this.gameType; i++) {
                this.addPlayer();
            }
        },
        addPlayer() {
            const playerInfo = {
                name: '',
                stat: []
            }
            this.team1.players.push({ ...JSON.parse(JSON.stringify(playerInfo)) });
            this.team2.players.push({ ...JSON.parse(JSON.stringify(playerInfo)) });
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
        padding-bottom: 10vh;
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
