<template>
    <div>
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
                            <div class="has-text-right mobile-stat-container-header">
                                <button @click="archiveOpen = true" class="button is-info">{{ $t('stat.archive') }}</button>
                            </div>
                            <label class="label" for="gameName">{{ $t('stat.enterName') }}</label>
                            <div class="field control">
                                <input v-model="gameName" class="input" type="text" id="gameName" placeholder="Game name">
                            </div>
                            <div v-if="gameTags.length > 0" class="mb-2 is-size-7">
                                Теги гри: <strong v-for="(tag, index) in gameTags" :key="index">{{tag}}<span v-if="index !== gameTags.length - 1">, </span></strong>
                            </div>
                            <div v-if="tags" class="mb-2">
                                <div class="label">Add tag: </div>
                                <div class="tags">
                                    <button class="cursor-pointer tag is-white is-rounded" v-for="(tag, key) in tags" :key="key"
                                            @click="addTagToGame(tag)" :class="{'is-hidden': gameTags.includes(tag)}">
                                      {{tag}}
                                    </button>
                                </div>
                            </div>
                            <div class="mb-3" v-if="showTags">
                                <StatTags :tags="tags" @addtag="addTag" @removetag="removeTag"/>
                            </div>
                            <div class="mb-3">
                                <button class="button is-info is-small" @click="showTags = !showTags">{{showTags ? 'Hide' : 'Show'}} tags</button>
                            </div>
                            <div class="columns">
                                <div class="column is-half">
                                    <label class="label">{{ $t('stat.format') }}</label>
                                    <div class="field">
                                        <label class="radio" v-for="item in gameTypes" :key="item.id">
                                            <input type="radio" name="gameType" :id="item.id" :value="item.value" v-model="gameType" @change="changePlayers">
                                            {{ item.label }}
                                        </label>
                                    </div>
                                    <label class="label">{{ $t('stat.mode') }}</label>
                                    <div class="field">
                                        <label class="radio">
                                            <input type="radio" name="statMode" id="statModeClassic" :value="false" v-model="statMode">
                                            {{ $t('stat.classic') }}
                                        </label>
                                        <label class="radio">
                                            <input type="radio" name="statMode" id="statModeFast" :value="true" v-model="statMode">
                                            {{ $t('stat.fast') }}
                                        </label>
                                    </div>
                                </div>
                                <div class="column is-half">
                                    <label class="label">{{ $t('stat.system') }}</label>
                                    <div class="field">
                                        <label class="radio">
                                            <input type="radio" name="statSystem" id="statSystemSimple" value="simple" v-model="statSystem">
                                            {{ $t('stat.simple') }}
                                        </label>
                                        <label class="radio">
                                            <input type="radio" name="statSystem" id="statSystemFrench" value="french" v-model="statSystem">
                                            {{ $t('stat.french') }}
                                        </label>
                                    </div>
                                    <label class="label">{{ $t('stat.scenario') }}</label>
                                    <div class="field">
                                        <label class="radio">
                                            <input type="radio" name="statScenario" id="statScenarioNegative" :value="false" v-model="statScenario">
                                            {{ $t('stat.negative') }}
                                        </label>
                                        <label class="radio">
                                            <input type="radio" name="statScenario" id="statScenarioPositive" :value="true" v-model="statScenario">
                                            {{ $t('stat.positive') }}
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="field">
                                <label class="checkbox">
                                    <input type="checkbox" id="distanceFirst" v-model="asCouch"/>
                                    {{ $t('stat.asCouch') }}
                                </label>
                            </div>
                            <div class="columns mb-3" v-if="team1.players?.length">
                                <div class="column is-half">
                                    <div class="label">{{ $t('stat.team') }} 1</div>
                                    <div class="field control" v-for="(player, index) in team1.players" :key="index">
                                        <input v-model="player.name" class="input" type="text" id="team1player1" :placeholder="'Player '+ Number(index + 1)  + ' name'">
                                    </div>
                                </div>
                                <div class="column is-half">
                                    <div class="label">{{ $t('stat.team') }} 2</div>
                                    <div class="field control" v-for="(player, index) in team2.players" :key="index">
                                        <input v-model="player.name" class="input" type="text" id="team1player1" :placeholder="'Player '+ Number(index + 1)  + ' name'">
                                    </div>
                                </div>
                            </div>
                            <button @click="currentMan = 0" class="button is-success">{{ $t('stat.start') }}</button>
                        </div>
                        <div v-else-if="showResults" class="mobile-stat-container">
                            <div class="mobile-stat-container-header">
                                <button @click="startNewGame" class="button is-info">{{ $t('stat.newGame') }}</button>
                            </div>
                            <h2 class="my-3 is-size-4">{{ gameName }}</h2>
                            <div class="columns is-desktop">
                                <div class="column is-half-desktop">
                                    <StatResult label="Team 1" :team="team1" :system="statSystem"/>
                                </div>
                                <div class="column is-half-desktop">
                                    <StatResult label="Team 2" :team="team2" :system="statSystem"/>
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
                                        <button @click="startNewGame" class="button is-danger">{{ $t('stat.newGame') }}</button>
                                    </div>
                                    <div class="control">
                                        <button @click="finishGame" class="button is-info">
                                            <Loader v-if="isSaving"/>
                                            <span :class="{'opacity-0': isSaving}">{{ $t('stat.finishGame') }}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="is-flex is-justify-content-space-between">
                                <div>{{ $t('stat.man') }} <strong>{{ currentMan + 1 }}</strong>/{{manCount}}</div>
                                <div>
                                    <strong>{{ $t('stat.score') }}</strong>
                                    {{currentScore.team1}} : {{currentScore.team2}}
                                </div>
                            </div>
                            <hr>
                            <div>
                                <div>What distance?</div>
                                <div class="field">
                                    <label class="radio" v-for="dist in throwDistances" :key="dist">
                                        <input type="radio" name="manDistance" :id="'manDistance' + dist" :value="dist" v-model="manDistance">
                                        {{dist === 11 ? '>10m' : '~' + dist + 'm'}}
                                    </label>
                                </div>
                            </div>
                            <hr>
                            <Teaminfo :team="team1" :current-man="currentMan" :iterator="1" :system="statSystem" :isCouch="asCouch"
                                      @update-score="updateTeamScore" @removethrow="removeThrow" @addthrow="addThrow"
                                      @x2throw="doubleThrowResult" @next="currentMan++"
                                      @updatethrow="updateThrow" @changePlayer="changePlayerInTeam"
                            />
                            <hr>
                            <Teaminfo :team="team2" :current-man="currentMan" :iterator="2" :system="statSystem" :isCouch="asCouch"
                                      @update-score="updateTeamScore" @removethrow="removeThrow" @addthrow="addThrow"
                                      @x2throw="doubleThrowResult" @next="currentMan++"
                                      @updatethrow="updateThrow" @changePlayer="changePlayerInTeam"
                            />
                            <div class="is-flex is-justify-content-space-between mt-3">
                                <button class="button is-info" @click="currentMan--" v-if="currentMan >= 1">{{ $t('stat.prev') }}</button>
                                <button class="button is-danger" v-if="currentMan !== 0" @click="removeMan">{{ $t('stat.removeMan') }}</button>
                                <button class="button is-success" @click="currentMan++">{{ $t('stat.next') }}</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="is-size-3 p-3 has-text-centered">
                    {{ $t('stat.onlyLogin') }}
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
import {get, getDatabase, ref, set} from "firebase/database";
import {mapMutations, mapState} from "vuex";
import StatsArchive from "@/components/stats/StatsArchive.vue";
import StatResult from "@/components/stats/StatResult.vue";
import {gameTypes, throwDistances} from "@/helpers-stat.js"
import Message from "@/components/Message.vue";
import Loader from "@/components/Loader.vue";
import StatTags from "@/components/stats/StatTags.vue";
export default {
    name: 'Stats',
    components: {StatTags, Loader, Message, StatResult, StatsArchive, Teaminfo, Menu, Navbar, /*Footer*/},
    data() {
        return {
            isSaving: false,
            tagsLoading: false,
            showTags: false,
            tags: null,
            gameTags: [],
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
            throwDistances,
            manDistance: null,
        }
    },
    mounted() {
        this.getLocalData();
        this.getTags()
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
        throwInfo() {
            return {
                isMade: this.statMode,
                type: 'p',
                success: this.statScenario,
                french: 'D',
                distance: this.manDistance
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
        ...mapMutations(['showMessage']),
        getTags() {
            const db = getDatabase();
            const statsRef = ref(db, `${this.user.uid}/stats/tags`);

            this.tagsLoading = true;

            get(statsRef)
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
                        title: 'Error',
                        text: 'Failed to load tags. Please try again later.',
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
            currentPlayer.stat = Array(currentPlayer.onChanged).fill(null);
            currentPlayer.onChanged = this.currentMan;
            this['team' + teamIndex].players[playerIndex].wasChanged = this.currentMan;
            for (let i = 0; i < this.currentMan; i++) {
                this['team' + teamIndex].players[this['team' + teamIndex].players.length - 1].stat.unshift([]);
            }
        },
        addTagToGame(tag) {
            this.gameTags.push(tag)
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
            const db = getDatabase();
            this.isSaving = true;
            set(ref(db, `${this.user.uid}/stats/${statResult.date}`), statResult).then(() => {
                this.showMessage({title: 'Awesome!', text: 'Statistics saved to db'});
                localStorage.removeItem('statGame');
                this.isSaving = false;
            }).catch((error) => {
                console.error('Error save:', error);
                this.showMessage({title: 'error', text: error, type: 'error'});
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
    min-height: calc(100vh - 96px);
}

@media screen and (max-width: 500px) {
    .stat-container {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding-bottom: 15vh;
        min-height: calc(100vh - 60px);
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

.throw-result.-carro {
    background: dodgerblue;
}
</style>
