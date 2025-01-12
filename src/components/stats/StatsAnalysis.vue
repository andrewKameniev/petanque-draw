<script>
import {mapMutations} from "vuex";
import VueSelect from "vue3-select-component";
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import {calculatePlayerStat, getDate} from "@/helpers-stat";
import VueApexCharts from 'vue3-apexcharts';
import {gameTypes} from "@/helpers-stat.js"

export default {
    name: "StatsAnalysis",
    components: {VueSelect, VueDatePicker, apexchart: VueApexCharts},
    props: ['stats'],
    data() {
        return {
            date: null,
            gameTypes,
            filterGamesType: null,
            player: '',
            playerStatList: [],
            showSinusoids: false,
            chartData: [
                {
                    name: "Points",
                    data: []
                },
                {
                    name: "Tirs",
                    data: []
                }
            ],
            chartOptions: {
                chart: {
                    id: 'vuechart-example'
                },
                dropShadow: {
                    enabled: true,
                    color: '#000',
                    top: 18,
                    left: 7,
                    blur: 10,
                    opacity: 0.5
                },
                stroke: {
                    curve: 'smooth'
                },
                xaxis: {
                    categories: []
                },
            }
        }
    },
    computed: {
        allPeriodStat() {
            const calculateAverage = (key) => {
                const validGames = this.playerStatList.filter(game => game.stat[key] !== '-');
                const total = validGames.reduce((acc, game) => acc + game.stat[key], 0);
                return validGames.length > 0 ? (total / validGames.length).toFixed(1) : 0; // Avoid division by zero
            };

            return {
                all: calculateAverage('all'),
                points: calculateAverage('points'),
                tirs: calculateAverage('tirs'),
            };
        },
        playersList() {
            let list = [];
            let playerCounts = {}; // Object to track occurrences of each player

            const countPlayer = (player) => {
                playerCounts[player.name] = (playerCounts[player.name] || 0) + 1;
            };

            // First pass: Count occurrences of each player
            Object.keys(this.stats).forEach(key => {
                this.stats[key].team1.players.forEach(player => {
                    countPlayer(player);
                });
                this.stats[key].team2.players.forEach(player => {
                    countPlayer(player);
                });
            });

            // Second pass: Add players who appear more than once
            Object.keys(this.stats).forEach(key => {
                this.stats[key].team1.players.forEach(player => {
                    if (playerCounts[player.name] > 1) {
                        list.push({ label: player.name, value: player.name });
                    }
                });
                this.stats[key].team2.players.forEach(player => {
                    if (playerCounts[player.name] > 1) {
                        list.push({ label: player.name, value: player.name });
                    }
                });
            });

            // Remove duplicates from the list
            list = list.filter((item, index, self) =>
                index === self.findIndex(t => t.label === item.label && t.value === item.value)
            );

            return list;
        }
    },
    methods: {
        ...mapMutations(['showMessage']),
        showPlayerStat() {
            this.showSinusoids = false;
            this.playerStatList = [];
            this.chartData[0].data = [];
            this.chartData[1].data = [];
            this.chartOptions.xaxis.categories = [];

            let timeFrom = this.date ? this.date[0].getTime() : null;
            let timeTo = this.date ? this.date[1].getTime() : null;

            Object.entries(this.stats).forEach(([key, game]) => {
                if ((timeFrom && key < timeFrom) || (timeTo && key > timeTo)) return;

                if (this.filterGamesType && this.filterGamesType !== game.team1.players.length) return;

                const checkAndAddStat = (team) => {
                    const player = team.players.find(player => player?.name.trim() === this.player.trim());
                    if (player) {
                        this.playerStatList.push({
                            date: key,
                            stat: calculatePlayerStat(player.stat, 'simple')
                        });
                    }
                };

                checkAndAddStat(game.team1);
                checkAndAddStat(game.team2);
            });

            this.playerStatList.forEach(game => {
                const { points, tirs } = game.stat;
                this.chartOptions.xaxis.categories.push(getDate(+game.date));
                this.chartData[0].data.push(points !== '-' ? points : null);
                this.chartData[1].data.push(tirs !== '-' ? tirs : null);
            });
            if (this.chartOptions.xaxis.categories.length > 1) {
                this.showSinusoids = true;
            }
        },
        clearGameType() {
            this.filterGamesType = null;
            this.showPlayerStat();
        }
    }
}
</script>

<template>
    <div>
        <div class="columns mb-1">
            <div class="column is-half-desktop">
                <label for="" class="label">Find Player</label>
                <VueSelect v-model="player" :options="playersList" @option-selected="showPlayerStat"/>
            </div>
            <div class="column is-half-desktop" v-if="player">
                <label for="" class="label">Choose period</label>
                <VueDatePicker v-model="date" range multi-calendars @update:model-value="showPlayerStat"/>
            </div>
        </div>
        <div class="field" v-if="player">
            <form action="">
                <label for="" class="label">Choose only</label>
                <label class="radio" v-for="item in gameTypes" :key="item.id">
                    <input type="radio" name="gameType" :id="item.id" :value="item.value" v-model="filterGamesType" @change="showPlayerStat">
                    {{ item.label }}
                </label>
                <button class="button is-small ml-2" type="reset" v-if="filterGamesType" @click="clearGameType">Clear</button>
            </form>
        </div>
        <div v-if="player && playerStatList.length">
            <div class="is-size-4 has-text-weight-bold">{{player}} ({{playerStatList.length}} games)</div>
            <p>All: {{allPeriodStat.all}}%</p>
            <p>Points: {{allPeriodStat.points}}%</p>
            <p>Tirs: {{allPeriodStat.tirs}}%</p>
            <div v-if="showSinusoids" class="has-background-white p-3 mt-3">
                <apexchart
                    type="line"
                    height="350"
                    :options="chartOptions"
                    :series="chartData"
                />
            </div>
        </div>
        <div v-else>
            No statistics with your filters
        </div>
        <hr>
    </div>
</template>

<style>
    .vue-select .control {
        min-height: 38px;
    }
</style>