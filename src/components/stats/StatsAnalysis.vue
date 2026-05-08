<script>
import {mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import VueSelect from "vue3-select-component";
import "vue3-select-component/dist/styles.css";
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import {calculatePlayerStat, getDate} from "@/helpers-stat";
import VueApexCharts from 'vue3-apexcharts';
import {gameTypes, throwDistances} from "@/helpers-stat.js"

export default {
    name: "StatsAnalysis",
    components: {VueSelect, VueDatePicker, apexchart: VueApexCharts},
    props: ['stats', 'tags'],
    data() {
        return {
            date: null,
            gameTypes,
            throwDistances,
            onlyImportant: false,
            filterGamesTag: [],
            filterGamesType: null,
            filterThrowDistance: null,
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
            const getThrowTotal = (key) => {
                const positive = this.playerStatList.reduce((acc, game) => acc + game.stat[key].positive, 0);
                const total = this.playerStatList.reduce((acc, game) => acc + game.stat[key].negative + game.stat[key].positive, 0);
                return {
                    positive,
                    total
                }
            }

            return {
                points: `${getThrowTotal('points').positive}/${getThrowTotal('points').total}`,
                tirs: `${getThrowTotal('tirs').positive}/${getThrowTotal('tirs').total}`,
                allPercent: (((getThrowTotal('points').positive + getThrowTotal('tirs').positive) / (getThrowTotal('points').total + getThrowTotal('tirs').total)) * 100).toFixed(1) + '%' || '0',
                pointsPercent: isNaN(getThrowTotal('points').positive / getThrowTotal('points').total) ? '-' : (getThrowTotal('points').positive / getThrowTotal('points').total * 100).toFixed(1) + '%' || '0',
                tirsPercent: isNaN(getThrowTotal('tirs').positive / getThrowTotal('tirs').total) ? '-' : (getThrowTotal('tirs').positive / getThrowTotal('tirs').total * 100).toFixed(1) + '%' || '0',
            };
        },
        playersList() {
            let list = [];
            let playerCounts = {};

            const countPlayer = (player) => {
                playerCounts[player.name] = (playerCounts[player.name] || 0) + 1;
            };

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
                        list.push({ label: player.name.trim(), value: player.name.trim() });
                    }
                });
                this.stats[key].team2.players.forEach(player => {
                    if (playerCounts[player.name] > 1) {
                        list.push({ label: player.name.trim(), value: player.name.trim() });
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
        ...mapActions(useMainStore, ['showMessage']),
        showPlayerStat() {
            this.showSinusoids = false;
            this.playerStatList = [];
            this.chartData[0].data = [];
            this.chartData[1].data = [];
            this.chartOptions.xaxis.categories = [];

            let timeFrom = this.date ? this.date[0].getTime() : null;
            let timeTo = this.date && this.date[1] ? this.date[1].getTime() : Date.now();

            Object.entries(this.stats).forEach(([key, game]) => {
                if ((timeFrom && key < timeFrom) || (timeTo && key > timeTo)) return;

                if (this.filterGamesType && this.filterGamesType !== game.team1.players.length) return;

                if (this.filterGamesTag.length) {
                    const hasMatchingTag = game.tags?.some(tag => this.filterGamesTag.includes(tag.trim()));
                    if (!hasMatchingTag) return;
                }

                const checkAndAddStat = (team) => {
                    const player = team.players.find(player => player?.name.trim() === this.player.trim());
                    if (player) {
                        this.playerStatList.push({
                            date: key,
                            stat: calculatePlayerStat(player.stat, 'simple', this.filterThrowDistance, this.onlyImportant)
                        });
                    }
                };

                checkAndAddStat(game.team1);
                checkAndAddStat(game.team2);
            });
            this.playerStatList.forEach(game => {
                const { pointsPercent, tirsPercent } = game.stat;
                if (pointsPercent && tirsPercent) {
                    this.chartOptions.xaxis.categories.push(getDate(+game.date));
                    this.chartData[0].data.push(pointsPercent !== '-' ? pointsPercent : null);
                    this.chartData[1].data.push(tirsPercent !== '-' ? tirsPercent : null);
                }
            });
            if (this.chartOptions.xaxis.categories.length > 1) {
                this.showSinusoids = true;
            }
        },
        clearGameType() {
            this.filterGamesType = null;
            this.showPlayerStat();
        },
        clearFilterDistance() {
            this.filterThrowDistance = null;
            this.showPlayerStat();
        },
        toggleTagFilter(tag) {
            if (this.filterGamesTag.includes(tag)) {
                this.filterGamesTag = this.filterGamesTag.filter(item => item !== tag)
            } else {
                this.filterGamesTag.push(tag);
            }
            this.showPlayerStat()
        }
    }
}
</script>

<template>
    <div>
        <div class="columns is-desktop mb-1">
            <div class="column is-half-desktop">
                <label for="" class="label">{{ $t('stat.findPlayer') }}</label>
                <VueSelect v-model="player" :options="playersList" @option-selected="showPlayerStat"/>
            </div>
            <div class="column is-half-desktop" v-if="player">
                <label for="" class="label">{{ $t('stat.choosePeriod') }}</label>
                <VueDatePicker v-model="date" range multi-calendars @update:model-value="showPlayerStat"/>
            </div>
        </div>
        <div v-if="player">
            <div class="field is-flex is-justify-content-space-between">
                <form action="">
                    <label for="" class="label">{{ $t('stat.chooseOnly') }}</label>
                    <label class="radio" v-for="item in gameTypes" :key="item.id">
                        <input type="radio" name="gameType" :id="item.id" :value="item.value" v-model="filterGamesType" @change="showPlayerStat">
                        {{ item.label }}
                    </label>
                    <button class="button is-small ml-2" type="reset" v-if="filterGamesType" @click="clearGameType">{{ $t('stat.clear') }}</button>
                </form>
                <div>
                    <label for="filterImportant" class="checkbox is-flex is-align-content-center">{{ $t('stat.important') }}
                        <input type="checkbox" class="ml-2 " id="filterImportant" v-model="onlyImportant" @change="showPlayerStat">
                    </label>
                </div>
            </div>
            <div class="field">
                <form action="">
                    <label for="" class="label">{{ $t('stat.chooseOnly') }}</label>
                    <div class="is-flex is-align-items-center is-flex-wrap-wrap">
                        <label class="radio" v-for="(tag, key) in tags" :key="key">
                            <input type="checkbox" :name="'gameTag' + key" :id="'tag' + key"
                                   :checked="filterGamesTag.includes(tag)" @change="toggleTagFilter(tag)">
                            {{ tag }}
                        </label>
                        <button class="button is-small ml-2" type="reset" v-if="filterGamesTag" @click=" filterGamesTag = []; showPlayerStat();">{{ $t('stat.clear') }}</button>
                    </div>
                </form>
            </div>
            <div class="field">
                <form action="">
                    <label for="" class="label">{{ $t('stat.chooseOnly') }}</label>
                    <label class="radio" v-for="dist in throwDistances" :key="dist">
                        <input type="radio" name="gameType" :id="'dist' + dist" :value="dist" v-model="filterThrowDistance" @change="showPlayerStat">
                        {{dist === 11 ? '>10m' : '~' + dist + 'm'}}
                    </label>
                    <button class="button is-small ml-2" type="reset" v-if="filterThrowDistance" @click="clearFilterDistance">{{ $t('stat.clear') }}</button>
                </form>
            </div>
        </div>
        <div v-if="player && playerStatList.length">
            <div class="is-size-4 has-text-weight-bold">{{player}} ({{playerStatList.length}} {{ $t('stat.games') }})</div>
            <p>{{ $t('stat.all') }}: {{allPeriodStat.allPercent}}</p>
            <p>{{ $t('stat.points') }}: {{allPeriodStat.pointsPercent}}, ({{allPeriodStat.points}})</p>
            <p>{{ $t('stat.tirs') }}: {{allPeriodStat.tirsPercent}}, ({{allPeriodStat.tirs}})</p>
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
            {{ $t('stat.noStat') }}
        </div>
        <hr>
    </div>
</template>

<style>
    .vue-select .control {
        min-height: 38px;
    }
</style>