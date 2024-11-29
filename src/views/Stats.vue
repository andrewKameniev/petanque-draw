<template>
    <div class="container">
        <div class="stat-container">
            <div v-if="currentMan === null">
                <div>Enter game name</div>
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
                        <div class="mb-1">Team 1</div>
                        <div class="field control" v-for="(player, index) in team1.players" :key="index">
                            <input v-model="player.name" class="input" type="text" id="team1player1" :placeholder="'Player '+ Number(index + 1)  + ' name'">
                        </div>
                    </div>
                    <div class="column is-half">
                        <div class="mb-1">Team 2</div>
                        <div class="field control" v-for="(player, index) in team2.players" :key="index">
                            <input v-model="player.name" class="input" type="text" id="team1player1" :placeholder="'Player '+ Number(index + 1)  + ' name'">
                        </div>
                    </div>
                </div>
                <button @click="currentMan = 0" class="button is-success">Start</button>
            </div>
            <div v-else @touchstart="onTouchStart"
                 @touchmove="onTouchMove"
                 @touchend="onTouchEnd">
                <div>Man <strong>{{ currentMan + 1 }}</strong>/{{manCount}}</div>
                <div class="player-info is-flex is-justify-content-space-between mb-2" v-for="(player, index) in team1.players" :key="index">
                    <div>
                        <div class="is-size-7">
                            {{team1Stats[index].all.positive}}/{{team1Stats[index].all.positive + team1Stats[index].all.negative}} -
                            <strong>{{Math.round(team1Stats[index].all.positive/(team1Stats[index].all.positive + team1Stats[index].all.negative) * 100)}}%</strong>
                            (p: {{team1Stats[index].points.positive}}/{{team1Stats[index].points.positive + team1Stats[index].points.negative}} -
                            <strong>{{Math.round(team1Stats[index].points.positive/(team1Stats[index].points.positive + team1Stats[index].points.negative) * 100)}}%</strong>,
                            t: {{team1Stats[index].tirs.positive}}/{{team1Stats[index].tirs.positive + team1Stats[index].tirs.negative}} -
                            <strong>{{Math.round(team1Stats[index].tirs.positive/(team1Stats[index].tirs.positive + team1Stats[index].tirs.negative) * 100)}}%</strong>)
                        </div>
                        <div class="player-name">{{ player.name }}</div>
                        <div class="throw-result-container">
                            <span class="throw-result" :class="{'-success': item === 1}"
                                  v-for="(item, itemIndex) in team1Stats[index].serie.slice(-12)"
                                  :key="itemIndex"></span>
                        </div>
                    </div>
                    <div class="is-flex" style="gap: 10px">
                        <ThrowResult v-for="(res, throwIndex) in team1.players[index].stat[currentMan]"
                                     @removethrow="team1.players[index].stat[currentMan].splice(throwIndex, 1)"
                                     v-model:type="res.type" v-model:result="res.success" :key="throwIndex" :iterator="'throwTypeTeam1' + index + throwIndex"/>
                    </div>
                </div>
                <hr>
                <div class="player-info is-flex is-justify-content-space-between" v-for="(player, index) in team2.players" :key="index">
                    <div class="player-info">
                        <div class="is-size-7">
                            {{team2Stats[index].all.positive}}/{{team2Stats[index].all.positive + team2Stats[index].all.negative}} -
                            <strong>{{Math.round(team2Stats[index].all.positive/(team2Stats[index].all.positive + team2Stats[index].all.negative) * 100)}}%</strong>
                            (p: {{team2Stats[index].points.positive}}/{{team2Stats[index].points.positive + team2Stats[index].points.negative}} -
                            <strong>{{Math.round(team2Stats[index].points.positive/(team2Stats[index].points.positive + team2Stats[index].points.negative) * 100)}}%</strong>,
                            t: {{team2Stats[index].tirs.positive}}/{{team2Stats[index].tirs.positive + team2Stats[index].tirs.negative}} -
                            <strong>{{Math.round(team2Stats[index].tirs.positive/(team2Stats[index].tirs.positive + team2Stats[index].tirs.negative) * 100)}}%</strong>)
                        </div>
                        <div class="player-name">{{ player.name }}</div>
                        <div class="throw-result-container">
                            <span class="throw-result" :class="{'-success': item === 1}"
                                  v-for="(item, itemIndex) in team2Stats[index].serie.slice(-12)"
                                  :key="itemIndex"></span>
                        </div>
                    </div>
                    <div class="is-flex" style="gap: 10px">
                        <ThrowResult v-for="(res, throwIndex) in team2.players[index].stat[currentMan]"
                                     @removethrow="team2.players[index].stat[currentMan].splice(throwIndex, 1)"
                                     v-model:type="res.type" v-model:result="res.success" :key="throwIndex" :iterator="'throwTypeTeam2' + index + throwIndex"/>
                    </div>
                </div>
                <div class="is-flex is-justify-content-space-between mt-3">
                    <button class="button is-info" @click="currentMan--" v-if="currentMan >= 0">Prev</button>
                    <button class="button is-danger" v-if="currentMan === manCount - 1" @click="removeMan">Remove man</button>
                    <button class="button is-success" @click="currentMan++">Next</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

import ThrowResult from "@/components/stats/ThrowResult.vue";

export default {
    name: 'Stats',
    components: {ThrowResult},
    data() {
        return {
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
            team1: {},
            team2: {},
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
        manCount() {
            return this.team1.players[0].stat.length
        },
        team1Stats() {
            let teamStat = [];
            this.team1.players.forEach(() => {
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

            if (this.team1.players[0].stat?.length) {
                this.team1.players.forEach((player, index) => {
                    player.stat.forEach(man => {
                        man.forEach(item => {
                            if (item.type === 'p') {
                                if (item.success) {
                                    teamStat[index].points.positive += 1;
                                    teamStat[index].serie.push(1);
                                } else {
                                    teamStat[index].points.negative += 1;
                                    teamStat[index].serie.push(0);
                                }
                            } else {
                                if (item.success) {
                                    teamStat[index].tirs.positive += 1;
                                    teamStat[index].serie.push(1);
                                } else {
                                    teamStat[index].tirs.negative += 1;
                                    teamStat[index].serie.push(0);
                                }
                            }
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
        team2Stats() {
            let teamStat = [];
            this.team2.players.forEach(() => {
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

            if (this.team2.players[0].stat?.length) {
                this.team2.players.forEach((player, index) => {
                    player.stat.forEach(man => {
                        man.forEach(item => {
                            if (item.type === 'p') {
                                if (item.success) {
                                    teamStat[index].points.positive += 1;
                                    teamStat[index].serie.push(1);
                                } else {
                                    teamStat[index].points.negative += 1;
                                    teamStat[index].serie.push(0);
                                }
                            } else {
                                if (item.success) {
                                    teamStat[index].tirs.positive += 1;
                                    teamStat[index].serie.push(1);
                                } else {
                                    teamStat[index].tirs.negative += 1;
                                    teamStat[index].serie.push(0);
                                }
                            }
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
    },
    watch: {
        statScenario(newValue) {
            this.throwInfo.success = newValue;
        },
        currentMan() {
            this.nextMan()
        }
    },
    methods: {
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
                // Horizontal swipe
                this.swipeDirection = deltaX > 0 ? "right" : "left";
                this.swipeDirection === 'right' ? this.currentMan-- : this.currentMan++
            } else {
                // Vertical swipe
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
    background: #e3e3e34a;
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
