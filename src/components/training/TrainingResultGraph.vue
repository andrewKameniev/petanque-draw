<script>
import VueApexCharts from 'vue3-apexcharts';
export default {
    name: "TrainingResultGraph",
    props: ['graphData'],
    components: {apexchart: VueApexCharts},
    data() {
        return {
            chartData: [
                {
                    name: "Result",
                    data: this.graphData.results
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
                    categories: this.graphData.dates
                },
            }
        }
    }
}
</script>

<template>
    <apexchart
        type="line"
        height="350"
        :options="chartOptions"
        :series="chartData"
    />
</template>

<style scoped>

</style>