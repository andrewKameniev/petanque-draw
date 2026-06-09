<template>
    <div class="tstats">
        <div class="tstats__nav">
            <button class="tstats__back" @click="$emit('back')">
                <ChevronLeft :size="18" />
                {{ $t('stat.back') }}
            </button>
        </div>

        <div class="tstats__title-row">
            <h3 class="tstats__title">{{ $t('training.statistics') }}</h3>
            <div class="tstats__view-toggle">
                <button
                    class="tstats__view-btn"
                    :class="{ 'tstats__view-btn--active': chartView === 'summary' }"
                    @click="chartView = 'summary'"
                >
                    <LayoutList :size="16" />
                </button>
                <button
                    class="tstats__view-btn"
                    :class="{ 'tstats__view-btn--active': chartView === 'stacked' }"
                    @click="chartView = 'stacked'"
                >
                    <BarChart3 :size="16" />
                </button>
            </div>
        </div>

        <!-- Filters -->
        <div class="tstats__filters">
            <div class="tstats__filter">
                <label class="tstats__filter-label">{{ $t('training.filterExercise') }}</label>
                <select v-model="filters.exerciseIndex" class="tstats__select">
                    <option :value="null">{{ $t('training.allExercises') }}</option>
                    <option v-for="(name, idx) in atelierNames" :key="idx" :value="idx">
                        {{ idx + 1 }}. {{ name }}
                    </option>
                </select>
            </div>
            <div class="tstats__filter">
                <label class="tstats__filter-label">{{ $t('training.filterDistance') }}</label>
                <select v-model="filters.distance" class="tstats__select">
                    <option :value="null">{{ $t('training.allDistances') }}</option>
                    <option v-for="d in allDistances" :key="d" :value="d">{{ d }}m</option>
                </select>
            </div>
            <div class="tstats__filter">
                <label class="tstats__filter-label">{{ $t('training.filterDateFrom') }}</label>
                <input v-model="filters.dateFrom" type="date" class="tstats__date-input" />
            </div>
            <div class="tstats__filter">
                <label class="tstats__filter-label">{{ $t('training.filterDateTo') }}</label>
                <input v-model="filters.dateTo" type="date" class="tstats__date-input" />
            </div>
        </div>

        <!-- Overall stats -->
        <div v-if="stats && chartView === 'summary'" class="tstats__overview">
            <div class="tstats__stat-cards">
                <div class="tstats__card">
                    <div class="tstats__card-val">{{ stats.average }}</div>
                    <div class="tstats__card-label">{{ $t('training.avgScore') }}</div>
                </div>
                <div class="tstats__card">
                    <div class="tstats__card-val">{{ stats.best }}</div>
                    <div class="tstats__card-label">{{ $t('training.bestScore') }}</div>
                </div>
                <div class="tstats__card">
                    <div class="tstats__card-val">{{ stats.count }}</div>
                    <div class="tstats__card-label">{{ $t('training.totalAttempts') }}</div>
                </div>
                <div class="tstats__card">
                    <div class="tstats__card-val">{{ stats.sessionCount }}</div>
                    <div class="tstats__card-label">{{ $t('training.sessionsCount') }}</div>
                </div>
            </div>

            <!-- Score distribution -->
            <div class="tstats__distribution">
                <div class="tstats__dist-title">{{ $t('training.distribution') }}</div>
                <div class="tstats__dist-bars">
                    <div class="tstats__dist-row">
                        <span class="tstats__dist-label">
                            <span class="tstats__dot tstats__dot--carreau"></span>
                            {{ $t('tir.carreau') }}
                        </span>
                        <div class="tstats__dist-bar-wrap">
                            <div
                                class="tstats__dist-bar tstats__dist-bar--carreau"
                                :style="{ width: getPercent(stats.carreau) + '%' }"
                            ></div>
                        </div>
                        <span class="tstats__dist-count">{{ stats.carreau }} ({{ getPercent(stats.carreau) }}%)</span>
                    </div>
                    <div class="tstats__dist-row">
                        <span class="tstats__dist-label">
                            <span class="tstats__dot tstats__dot--reussi"></span>
                            {{ $t('tir.reussi') }}
                        </span>
                        <div class="tstats__dist-bar-wrap">
                            <div
                                class="tstats__dist-bar tstats__dist-bar--reussi"
                                :style="{ width: getPercent(stats.reussi) + '%' }"
                            ></div>
                        </div>
                        <span class="tstats__dist-count">{{ stats.reussi }} ({{ getPercent(stats.reussi) }}%)</span>
                    </div>
                    <div class="tstats__dist-row">
                        <span class="tstats__dist-label">
                            <span class="tstats__dot tstats__dot--touche"></span>
                            {{ $t('tir.touche') }}
                        </span>
                        <div class="tstats__dist-bar-wrap">
                            <div
                                class="tstats__dist-bar tstats__dist-bar--touche"
                                :style="{ width: getPercent(stats.touche) + '%' }"
                            ></div>
                        </div>
                        <span class="tstats__dist-count">{{ stats.touche }} ({{ getPercent(stats.touche) }}%)</span>
                    </div>
                    <div class="tstats__dist-row">
                        <span class="tstats__dist-label">
                            <span class="tstats__dot tstats__dot--manque"></span>
                            {{ $t('tir.manque') }}
                        </span>
                        <div class="tstats__dist-bar-wrap">
                            <div
                                class="tstats__dist-bar tstats__dist-bar--manque"
                                :style="{ width: getPercent(stats.manque) + '%' }"
                            ></div>
                        </div>
                        <span class="tstats__dist-count">{{ stats.manque }} ({{ getPercent(stats.manque) }}%)</span>
                    </div>
                </div>
            </div>

            <!-- Per-distance breakdown -->
            <div v-if="!filters.distance && distanceStats.length" class="tstats__breakdown">
                <div class="tstats__dist-title">{{ $t('training.byDistance') }}</div>
                <div class="tstats__breakdown-grid">
                    <div v-for="ds in distanceStats" :key="ds.distance" class="tstats__breakdown-card">
                        <div class="tstats__breakdown-dist">{{ ds.distance }}m</div>
                        <div class="tstats__breakdown-avg">{{ ds.average }}</div>
                        <div class="tstats__breakdown-label">{{ $t('training.avgScore') }}</div>
                        <div class="tstats__breakdown-count">{{ ds.count }} {{ $t('training.attempts') }}</div>
                    </div>
                </div>
            </div>

            <!-- Progress over time -->
            <div v-if="progressData.length > 1" class="tstats__progress">
                <div class="tstats__dist-title">{{ $t('training.progressOverTime') }}</div>
                <div class="tstats__chart">
                    <div v-for="(point, idx) in progressData" :key="idx" class="tstats__chart-bar-col">
                        <div class="tstats__chart-bar" :style="{ height: getBarHeight(point.average) + '%' }"></div>
                        <div class="tstats__chart-label">{{ point.date }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Stacked bar chart view -->
        <div v-if="chartView === 'stacked' && filteredSessions.length" class="tstats__stacked">
            <TrainingStackedChart :sessions="sessions" :filters="computedFilters" />
        </div>

        <div v-else-if="!stats" class="tstats__empty">
            {{ $t('training.noStatsData') }}
        </div>
    </div>
</template>

<script>
import { ChevronLeft, BarChart3, LayoutList } from 'lucide-vue-next';
import { ATELIER_KEYS, SCORING } from '@/services/tir';
import { getMultiSessionStats } from '@/services/training';
import TrainingStackedChart from '@/components/training/TrainingStackedChart.vue';

export default {
    name: 'TrainingStats',
    components: { ChevronLeft, BarChart3, LayoutList, TrainingStackedChart },
    props: {
        sessions: { type: Array, required: true },
    },
    emits: ['back'],
    data() {
        return {
            chartView: 'summary',
            filters: {
                exerciseIndex: null,
                distance: null,
                dateFrom: '',
                dateTo: '',
            },
        };
    },
    computed: {
        atelierNames() {
            return ATELIER_KEYS.map((key) => this.$t(`tir.${key}`));
        },
        allDistances() {
            const distances = new Set();
            this.sessions.forEach((s) => {
                if (s.config && s.config.distances) {
                    s.config.distances.forEach((d) => distances.add(d));
                }
            });
            return [...distances].sort((a, b) => a - b);
        },
        filteredSessions() {
            let list = this.sessions.filter((s) => s.attempts && s.attempts.length > 0);
            if (this.filters.dateFrom) {
                const from = new Date(this.filters.dateFrom).getTime();
                list = list.filter((s) => s.createdAt >= from);
            }
            if (this.filters.dateTo) {
                const to = new Date(this.filters.dateTo).getTime() + 86400000;
                list = list.filter((s) => s.createdAt <= to);
            }
            return list;
        },
        stats() {
            return getMultiSessionStats(this.filteredSessions, {
                exerciseIndex: this.filters.exerciseIndex ?? undefined,
                distance: this.filters.distance ?? undefined,
            });
        },
        distanceStats() {
            return this.allDistances
                .map((distance) => {
                    const ds = getMultiSessionStats(this.filteredSessions, {
                        exerciseIndex: this.filters.exerciseIndex ?? undefined,
                        distance,
                    });
                    return ds ? { distance, ...ds } : null;
                })
                .filter(Boolean);
        },
        computedFilters() {
            return {
                exerciseIndex: this.filters.exerciseIndex,
                distance: this.filters.distance,
                dateFrom: this.filters.dateFrom,
                dateTo: this.filters.dateTo,
            };
        },
        progressData() {
            return this.filteredSessions
                .sort((a, b) => a.createdAt - b.createdAt)
                .map((session) => {
                    let attempts = session.attempts || [];
                    if (this.filters.exerciseIndex !== null) {
                        attempts = attempts.filter((a) => a.exerciseIndex === this.filters.exerciseIndex);
                    }
                    if (this.filters.distance !== null) {
                        attempts = attempts.filter((a) => a.distance === this.filters.distance);
                    }
                    if (!attempts.length) return null;
                    const scores = attempts.map((a) => SCORING[a.score] ?? 0);
                    const average = +(scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(2);
                    const d = new Date(session.createdAt);
                    return {
                        average,
                        date: `${d.getDate()}/${d.getMonth() + 1}`,
                    };
                })
                .filter(Boolean);
        },
    },
    methods: {
        getPercent(count) {
            if (!this.stats || !this.stats.count) return 0;
            return Math.round((count / this.stats.count) * 100);
        },
        getBarHeight(average) {
            return Math.round((average / SCORING.carreau) * 100);
        },
    },
};
</script>

<style scoped>
.tstats__nav {
    margin-bottom: 1.25rem;
}

.tstats__back {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    border: 1.5px solid var(--color-primary);
    background: transparent;
    color: var(--color-primary);
    cursor: pointer;
    transition: all 0.15s;
}

.tstats__back:hover {
    background: var(--color-primary);
    color: var(--color-white);
}

.tstats__title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
}

.tstats__title {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 0;
}

.tstats__view-toggle {
    display: flex;
    gap: 0.25rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 2px;
}

.tstats__view-btn {
    padding: 0.35rem 0.5rem;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
}

.tstats__view-btn--active {
    background: var(--color-primary);
    color: var(--color-white, #fff);
}

.tstats__stacked {
    margin-bottom: 1.25rem;
}

.tstats__filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
}

.tstats__filter {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.tstats__filter-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
}

.tstats__select,
.tstats__date-input {
    padding: 0.4rem 0.6rem;
    border: 1.5px solid var(--color-border);
    border-radius: 8px;
    font-size: 0.8rem;
    background: var(--color-surface);
    color: var(--color-text);
}

.tstats__stat-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6rem;
    margin-bottom: 1.25rem;
}

.tstats__card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 0.75rem;
    text-align: center;
}

.tstats__card-val {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-primary);
}

.tstats__card-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin-top: 0.2rem;
}

.tstats__distribution {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1.25rem;
}

.tstats__dist-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 0.75rem;
}

.tstats__dist-bars {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.tstats__dist-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.tstats__dist-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8rem;
    color: var(--color-text);
    min-width: 80px;
}

.tstats__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.tstats__dot--carreau {
    background: var(--tir-carreau);
}
.tstats__dot--reussi {
    background: var(--tir-reussi);
}
.tstats__dot--touche {
    background: var(--tir-touche);
}
.tstats__dot--manque {
    background: var(--tir-manque);
}

.tstats__dist-bar-wrap {
    flex: 1;
    height: 8px;
    border-radius: 4px;
    background: var(--color-border-light);
    overflow: hidden;
}

.tstats__dist-bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s;
}

.tstats__dist-bar--carreau {
    background: var(--tir-carreau);
}
.tstats__dist-bar--reussi {
    background: var(--tir-reussi);
}
.tstats__dist-bar--touche {
    background: var(--tir-touche);
}
.tstats__dist-bar--manque {
    background: var(--tir-manque);
}

.tstats__dist-count {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    min-width: 70px;
    text-align: right;
}

.tstats__breakdown {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1.25rem;
}

.tstats__breakdown-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 0.5rem;
}

.tstats__breakdown-card {
    text-align: center;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 8px;
}

.tstats__breakdown-dist {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-primary);
}

.tstats__breakdown-avg {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-text);
    margin-top: 0.2rem;
}

.tstats__breakdown-label {
    font-size: 0.65rem;
    color: var(--color-text-muted);
}

.tstats__breakdown-count {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    margin-top: 0.15rem;
}

.tstats__progress {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 1rem;
}

.tstats__chart {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 120px;
    padding-top: 0.5rem;
}

.tstats__chart-bar-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    justify-content: flex-end;
}

.tstats__chart-bar {
    width: 100%;
    max-width: 24px;
    background: var(--color-primary);
    border-radius: 3px 3px 0 0;
    min-height: 2px;
    transition: height 0.3s;
}

.tstats__chart-label {
    font-size: 9px;
    color: var(--color-text-muted);
    margin-top: 4px;
    white-space: nowrap;
}

.tstats__empty {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-muted);
}
</style>
