<script>
import {defineAsyncComponent} from 'vue';
export default {
    name: "TrainingResultGraph",
    props: ['graphData'],
    components: {apexchart: defineAsyncComponent(() => import('vue3-apexcharts'))},
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
                    categories: this.graphData.dates
                },
            }
        }
    }
}
</script>

<template>
    <div style="border-radius: 8px; overflow: hidden">
        <apexchart
            type="line"
            height="350"
            :options="chartOptions"
            :series="chartData"
        />
    </div>
</template>

<style scoped>

</style>