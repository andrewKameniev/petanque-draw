<template>
    <div class="stacked-chart">
        <apexchart type="bar" height="320" :options="chartOptions" :series="series" />
    </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { SCORING } from '@/services/tir';

export default {
    name: 'TrainingStackedChart',
    components: { apexchart: defineAsyncComponent(() => import('vue3-apexcharts')) },
    props: {
        sessions: { type: Array, required: true },
        filters: { type: Object, default: () => ({}) },
    },
    computed: {
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
            return list.sort((a, b) => a.createdAt - b.createdAt);
        },
        chartData() {
            return this.filteredSessions.map((session) => {
                let attempts = session.attempts || [];
                if (this.filters.exerciseIndex !== null && this.filters.exerciseIndex !== undefined) {
                    attempts = attempts.filter((a) => a.exerciseIndex === this.filters.exerciseIndex);
                }
                if (this.filters.distance !== null && this.filters.distance !== undefined) {
                    attempts = attempts.filter((a) => a.distance === this.filters.distance);
                }
                const d = new Date(session.createdAt);
                const label = `${d.getDate()}/${d.getMonth() + 1}`;
                return {
                    label,
                    carreau: attempts.filter((a) => a.score === 'carreau').length,
                    reussi: attempts.filter((a) => a.score === 'reussi').length,
                    touche: attempts.filter((a) => a.score === 'touche').length,
                    manque: attempts.filter((a) => a.score === 'manque').length,
                    total: attempts.length,
                };
            });
        },
        series() {
            return [
                { name: `Carreau (${SCORING.carreau}pts)`, data: this.chartData.map((d) => d.carreau) },
                { name: `Réussi (${SCORING.reussi}pts)`, data: this.chartData.map((d) => d.reussi) },
                { name: `Touché (${SCORING.touche}pt)`, data: this.chartData.map((d) => d.touche) },
                { name: `Manqué (0pts)`, data: this.chartData.map((d) => d.manque) },
            ];
        },
        chartOptions() {
            return {
                chart: {
                    type: 'bar',
                    stacked: true,
                    toolbar: { show: false },
                    background: 'transparent',
                },
                plotOptions: {
                    bar: {
                        horizontal: false,
                        columnWidth: '60%',
                        borderRadius: 3,
                    },
                },
                colors: ['#4caf50', '#2196f3', '#f5a623', '#e74c3c'],
                xaxis: {
                    categories: this.chartData.map((d) => d.label),
                    labels: { style: { fontSize: '11px' } },
                },
                yaxis: {
                    title: { text: this.$t('training.attempts') },
                    labels: { style: { fontSize: '11px' } },
                },
                legend: {
                    position: 'top',
                    fontSize: '12px',
                },
                dataLabels: { enabled: false },
                tooltip: {
                    y: {
                        formatter: (val) => `${val} ${this.$t('training.attempts')}`,
                    },
                },
                grid: {
                    borderColor: 'var(--color-border-light, #eee)',
                },
                theme: { mode: 'light' },
            };
        },
    },
};
</script>

<style scoped>
.stacked-chart {
    border-radius: 10px;
    overflow: hidden;
}
</style>
