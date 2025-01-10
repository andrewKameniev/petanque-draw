<script>
import {get, getDatabase, ref} from "firebase/database";
import {mapMutations, mapState} from "vuex";
import {getDate} from "@/helpers-stat";

export default {
    name: "TrainingResult",
    props: ['exid', 'exdata'],
    data() {
        return{
            results: null,
            isLoading: false,
        }
    },
    mounted() {
        const db = getDatabase();

        const statsRef = ref(db, `${this.user.uid}/training/${this.exid}`);

        this.isLoading = true;

        get(statsRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    this.results = snapshot.val();
                    this.showMessage({
                        title: 'Awesome!',
                        text: 'Results loaded from the database!',
                    });
                } else {
                    this.results = null; // Handle case where data doesn't exist
                    this.showMessage({
                        title: 'Info',
                        text: 'No results found for you',
                    });
                }
            })
            .catch((error) => {
                console.error('Error loading statistics:', error);
                this.results = null;
                this.showMessage({
                    title: 'Error',
                    text: 'Failed to load data. Please try again later.',
                    type: 'error',
                });
            })
            .finally(() => {
                this.isLoading = false;
            });
    },
    computed: {
        ...mapState(['user']),
        totalExLength() {
            return this.exdata.length * this.exdata.distances.length
        },
        totalAllTimeLength() {
            if (!this.results) {
                return 0
            }
            return this.totalExLength * Object.keys(this.results).length
        },
        exTotalResults() {
            if (this.results) {
                let totalAllTime = {
                    total: 0,
                    distances: {}
                }
                Object.values(this.exdata.distances).forEach(key => {
                    totalAllTime.distances[key] = 0
                })
                Object.values(this.results).forEach(res => {
                    Object.keys(res.distances).forEach(key => {
                        totalAllTime.distances[key] += res.distances[key].reduce((acc, item) => acc + +item, 0);
                    })
                })
                totalAllTime.total = Object.values(totalAllTime.distances).reduce((acc, item) => acc + item, 0);
                return totalAllTime
            } else {
                return null
            }
        }
    },
    methods: {
        ...mapMutations(['showMessage']),
        getDate,
        getTotalResults(data) {
            let total = 0;

            Object.values(data).forEach(dist => {
                total += dist.reduce((acc, item) => acc + +item, 0);
            })
            return total
        }
    }
}
</script>

<template>
    <div v-if="isLoading">Loading results...</div>
    <div v-else>
        <div class="mb-5">
            <button @click="$emit('back')" class="button is-info">Back</button>
        </div>
        <div v-if="results">
            <div v-if="exTotalResults" class="is-flex-tablet is-justify-content-space-between mb-3">
                <div>
                    Total: {{exTotalResults.total}}/{{this.totalAllTimeLength}} -
                    (<strong>{{Math.round((exTotalResults.total / this.totalAllTimeLength) * 100)}}%</strong>)
                </div>
                <div>
                    <span v-for="(dist, key) in exTotalResults.distances" :key="key" class="ml-5">
                        {{key}}m - {{dist}} / {{this.totalAllTimeLength / this.exdata.distances.length}}
                        (<strong>{{Math.round(dist / (this.totalAllTimeLength / this.exdata.distances.length) * 100)}}%</strong>)
                    </span>
                </div>
            </div>
            <hr>
            <div class="training-item-container">
                <div v-for="(item, key) in results" :key="key" class="exercise-item p-3 mb-3">
                    <div>{{getDate(item.date)}}</div>
                    <div class="is-flex-tablet is-justify-content-space-between">
                        <div>
                            Total: {{getTotalResults(item.distances)}}/{{this.totalExLength}} -
                            (<strong>{{Math.round((getTotalResults(item.distances) / this.totalExLength) * 100)}}%</strong>)
                        </div>
                        <div>
                            <span v-for="(dist, key) in item.distances" :key="key" class="ml-5">
                                {{key}}m - {{dist.reduce((acc, item) => acc + +item, 0)}} / {{this.exdata.length}}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else>
            No results
        </div>
    </div>
</template>

<style scoped>

</style>