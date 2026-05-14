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
import {X} from "lucide-vue-next";

export default {
    name: "StatsAnalysis",
    components: {VueSelect, VueDatePicker, apexchart: VueApexCharts, X},
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
                    id: 'vuechart-example',
                    background: '#fff'
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

            const pct = (pos, total) => total === 0 ? '-' : (pos / total * 100).toFixed(1) + '%';
            const pts = getThrowTotal('points');
            const trs = getThrowTotal('tirs');

            return {
                points: `${pts.positive}/${pts.total}`,
                tirs: `${trs.positive}/${trs.total}`,
                allPercent: pct(pts.positive + trs.positive, pts.total + trs.total),
                pointsPercent: pct(pts.positive, pts.total),
                tirsPercent: pct(trs.positive, trs.total),
            };
        },
        themedChartOptions() {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            return {
                ...this.chartOptions,
                chart: {
                    ...this.chartOptions.chart,
                    background: 'transparent',
                    toolbar: { show: false },
                },
                theme: { mode: isDark ? 'dark' : 'light' },
                colors: ['var(--color-stat-green)', 'var(--color-stat-blue)'],
                grid: {
                    borderColor: isDark ? '#2f3543' : '#e5e7f0',
                },
                stroke: { curve: 'smooth', width: 2 },
            };
        },
        playersList() {
            if (!this.stats) return [];
            const names = new Set();

            Object.values(this.stats).forEach(game => {
                game.team1.players.forEach(p => { if (p?.name?.trim()) names.add(p.name.trim()); });
                game.team2.players.forEach(p => { if (p?.name?.trim()) names.add(p.name.trim()); });
            });

            return [...names].sort().map(name => ({ label: name, value: name }));
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
    <div class="analysis">
        <div class="analysis__search">
            <div class="analysis__search-row">
                <div class="analysis__field analysis__field--player">
                    <label class="analysis__label">{{ $t('stat.findPlayer') }}</label>
                    <VueSelect v-model="player" :options="playersList" :placeholder="$t('stat.findPlayer')" @option-selected="showPlayerStat"/>
                </div>
                <div class="analysis__field analysis__field--date" v-if="player">
                    <label class="analysis__label">{{ $t('stat.choosePeriod') }}</label>
                    <VueDatePicker v-model="date" range multi-calendars @update:model-value="showPlayerStat"/>
                </div>
            </div>
        </div>

        <div v-if="player" class="analysis__filters">
            <div class="analysis__filter-section">
                <span class="analysis__filter-label">{{ $t('stat.format') }}</span>
                <div class="analysis__filter-pills">
                    <button v-for="item in gameTypes" :key="item.id"
                            class="analysis__pill"
                            :class="{'analysis__pill--active': filterGamesType === item.value}"
                            @click="filterGamesType = item.value; showPlayerStat()">
                        {{ item.label }}
                    </button>
                    <button class="analysis__pill-clear" v-if="filterGamesType" @click="clearGameType">
                        <X :size="12"/> {{ $t('stat.clear') }}
                    </button>
                </div>
            </div>

            <div class="analysis__filter-section" v-if="tags && Object.keys(tags).length">
                <span class="analysis__filter-label">{{ $t('stat.gameTags') }}</span>
                <div class="analysis__filter-pills">
                    <button v-for="(tag, key) in tags" :key="key"
                            class="analysis__pill"
                            :class="{'analysis__pill--active': filterGamesTag.includes(tag)}"
                            @click="toggleTagFilter(tag)">
                        {{ tag }}
                    </button>
                    <button class="analysis__pill-clear" v-if="filterGamesTag.length" @click="filterGamesTag = []; showPlayerStat();">
                        <X :size="12"/> {{ $t('stat.clear') }}
                    </button>
                </div>
            </div>

            <div class="analysis__filter-section">
                <span class="analysis__filter-label">{{ $t('stat.whatDistance') }}</span>
                <div class="analysis__filter-pills">
                    <button v-for="dist in throwDistances" :key="dist"
                            class="analysis__pill"
                            :class="{'analysis__pill--active': filterThrowDistance === dist}"
                            @click="filterThrowDistance = dist; showPlayerStat()">
                        {{ dist === 11 ? '>10m' : '~' + dist + 'm' }}
                    </button>
                    <button class="analysis__pill-clear" v-if="filterThrowDistance" @click="clearFilterDistance">
                        <X :size="12"/> {{ $t('stat.clear') }}
                    </button>
                </div>
            </div>

            <div class="analysis__filter-section analysis__filter-section--toggle">
                <label class="analysis__toggle">
                    <input type="checkbox" v-model="onlyImportant" @change="showPlayerStat">
                    <span class="analysis__toggle-label">{{ $t('stat.important') }}</span>
                </label>
            </div>
        </div>

        <div v-if="player && playerStatList.length" class="analysis__results">
            <div class="analysis__player-header">
                <span class="analysis__player-name">{{ player }}</span>
                <span class="analysis__player-games">{{ playerStatList.length }} {{ $t('stat.games') }}</span>
            </div>

            <div class="analysis__stat-cards">
                <div class="analysis__stat-card">
                    <span class="analysis__stat-label">{{ $t('stat.all') }}</span>
                    <span class="analysis__stat-value">{{ allPeriodStat.allPercent }}</span>
                </div>
                <div class="analysis__stat-card analysis__stat-card--points">
                    <span class="analysis__stat-label">{{ $t('stat.points') }}</span>
                    <span class="analysis__stat-value">{{ allPeriodStat.pointsPercent }}</span>
                    <span class="analysis__stat-detail">{{ allPeriodStat.points }}</span>
                </div>
                <div class="analysis__stat-card analysis__stat-card--tirs">
                    <span class="analysis__stat-label">{{ $t('stat.tirs') }}</span>
                    <span class="analysis__stat-value">{{ allPeriodStat.tirsPercent }}</span>
                    <span class="analysis__stat-detail">{{ allPeriodStat.tirs }}</span>
                </div>
            </div>

            <div v-if="showSinusoids" class="analysis__chart">
                <apexchart
                    type="line"
                    height="300"
                    :options="themedChartOptions"
                    :series="chartData"
                />
            </div>
        </div>

        <div v-else-if="player" class="analysis__empty">
            {{ $t('stat.noStat') }}
        </div>
    </div>
</template>

<style scoped>
.analysis {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.analysis__search {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 1rem;
}

.analysis__search-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

@media screen and (max-width: 768px) {
    .analysis__search-row {
        grid-template-columns: 1fr;
    }
}

.analysis__field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.analysis__label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.analysis__filters {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.analysis__filter-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.analysis__filter-section--toggle {
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border-light);
}

.analysis__filter-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-muted);
    min-width: 70px;
}

.analysis__filter-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
}

.analysis__pill {
    padding: 0.3rem 0.7rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.15s;
}

.analysis__pill:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-bg);
    color: var(--color-primary);
}

.analysis__pill--active {
    background: var(--color-primary);
    color: var(--color-btn-text);
    border-color: var(--color-primary);
}

.analysis__pill--active:hover {
    background: var(--color-primary-light);
    color: var(--color-btn-text);
}

.analysis__pill-clear {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.3rem 0.6rem;
    border-radius: 20px;
    font-size: 0.75rem;
    border: none;
    background: var(--color-error-bg);
    color: var(--color-error);
    cursor: pointer;
}

.analysis__toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
}

.analysis__toggle input {
    accent-color: var(--color-primary);
    width: 16px;
    height: 16px;
}

.analysis__toggle-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text);
}

.analysis__results {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.analysis__player-header {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
}

.analysis__player-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text);
}

.analysis__player-games {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.analysis__stat-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
}

@media screen and (max-width: 768px) {
    .analysis__stat-cards {
        grid-template-columns: 1fr;
    }
}

.analysis__stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.analysis__stat-card--points {
    border-left: 3px solid var(--color-stat-green);
}

.analysis__stat-card--tirs {
    border-left: 3px solid var(--color-stat-blue);
}

.analysis__stat-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.analysis__stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text);
}

.analysis__stat-detail {
    font-size: 0.8rem;
    color: var(--color-text-muted);
}

.analysis__chart {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 1rem;
    overflow: hidden;
}

.analysis__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    font-size: 0.95rem;
    color: var(--color-text-muted);
}

/* Vue Select overrides */
.analysis :deep(.vue-select) {
    --vs-border: 1px solid var(--color-border);
    --vs-border-radius: 8px;
    --vs-background-color: var(--color-bg-input);
    --vs-font-size: 0.85rem;
    --vs-text-color: var(--color-text);
    --vs-placeholder-color: var(--color-text-muted);
    --vs-outline-width: 2px;
    --vs-outline-color: var(--color-primary);
    --vs-menu-border: 1px solid var(--color-border);
    --vs-menu-background-color: var(--color-white);
    --vs-menu-box-shadow: 0 8px 24px var(--color-dropdown-shadow);
    --vs-option-focused-background-color: var(--color-primary-bg);
    --vs-option-focused-text-color: var(--color-primary);
    --vs-option-selected-background-color: var(--color-primary);
    --vs-option-selected-text-color: var(--color-btn-text);
    --vs-indicator-icon-color: var(--color-text-muted);
}

/* DatePicker overrides */
.analysis :deep(.dp__input) {
    border-radius: 8px;
    border: 1px solid var(--color-border);
    background: var(--color-bg-input);
    font-size: 0.85rem;
    height: 38px;
}

.analysis :deep(.dp__input:focus),
.analysis :deep(.dp__input:hover) {
    border-color: var(--color-primary);
}

.analysis :deep(.dp__input:focus) {
    box-shadow: 0 0 0 3px var(--color-primary-shadow);
    outline: none;
}
</style>