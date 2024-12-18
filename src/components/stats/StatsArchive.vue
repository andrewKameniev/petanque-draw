<script>
import {mapMutations, mapState} from "vuex";
import {getDate} from "@/helpers-stat";
import {getDatabase, ref, get, remove} from "firebase/database";
import StatResult from "@/components/stats/StatResult.vue";
import StatsAnalysis from "@/components/stats/StatsAnalysis.vue";
export default {
    name: "StatsArchive",
    components: {StatsAnalysis, StatResult},
    data() {
        return {
            statsList: null,
            showStatAnalysis: false
        }
    },
    mounted() {
        const db = getDatabase();
        const statsRef = ref(db, `${this.user.uid}/stats/`);

        this.isLoading = true; // Assume `isLoading` is a data property

        get(statsRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    this.statsList = snapshot.val(); // Extract the data
                    Object.keys(this.statsList).forEach(key => {
                        this.statsList[key].isOpen = false
                    })
                    this.showMessage({
                        title: 'Awesome!',
                        text: 'Statistics successfully loaded from the database!',
                    });
                } else {
                    this.statsList = null; // Handle case where data doesn't exist
                    this.showMessage({
                        title: 'Info',
                        text: 'No statistics found for this user.',
                    });
                }
            })
            .catch((error) => {
                console.error('Error loading statistics:', error);
                this.statsList = null;
                this.showMessage({
                    title: 'Error',
                    text: 'Failed to load statistics. Please try again later.',
                    type: 'error',
                });
            })
            .finally(() => {
                this.isLoading = false;
            });
    },
    computed: {
        ...mapState(['user'])
    },
    methods: {
        ...mapMutations(['showMessage']),
        removeGame(id) {
            const db = getDatabase();
            const statsRef = ref(db, `${this.user.uid}/stats/${id}`);

            remove(statsRef)
                .then(() => {
                    delete this.statsList[id];
                    this.showMessage({
                        title: 'Awesome!',
                        text: 'Game successfully removed the database!',
                    });
                })
                .catch((error) => {
                    console.error('Error deleting data:', error);
                    this.showMessage({
                        title: 'Error',
                        text: error,
                        type: 'error',
                    });
                });
        },
        countTeamScore(scores) {
            if (!Array.isArray(scores)) {
                const tempArray = []
                Object.values(scores).forEach(value => tempArray.push(value))
                scores = tempArray;
            }
            return scores
                .filter(value => value !== undefined) // Remove undefined or missing values
                .reduce((acc, value) => acc + value, 0);
        },
        getDate
    }
}
</script>

<template>
    <div class="mobile-stat-container">
        <div class="is-flex is-justify-content-space-between mobile-stat-container-header">
            <button class="button is-info" @click="$emit('close')">Back</button>
            <button class="button is-info" @click="showStatAnalysis = !showStatAnalysis">{{ showStatAnalysis ? 'Hide' : 'Show'}} analysis</button>
        </div>
        <div v-if="statsList" class="mt-3">
            <StatsAnalysis v-if="showStatAnalysis" :stats="statsList"/>
            <div v-for="item in statsList" :key="item.date">
                <div class="player-info p-2 mb-2 is-flex is-align-items-center is-justify-content-space-between" style="cursor: pointer" @click="item.isOpen = !item.isOpen">
                    <span class="is-size-4">
                        {{ item.name }}
                        <span class="is-size-6">{{getDate(item.date)}}</span>
                    </span>
                    <span class="delete" @click.stop="removeGame(item.date)"></span>
                </div>
                <div class="columns" v-if="item.isOpen">
                    <div class="column is-half-desktop">
                        <div class="label">
                            Team 1 - <span class="has-text-danger is-size-4">{{ countTeamScore(item.team1.score) }}</span>
                        </div>
                        <StatResult :team="item.team1" :system="item.system"/>
                    </div>
                    <div class="column is-half-desktop">
                        <div class="label">
                            Team 2 - <span class="has-text-danger is-size-4">{{ countTeamScore(item.team2.score) }}</span>
                        </div>
                        <StatResult :team="item.team2" :system="item.system"/>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="mt-3">
            Nothing to show
        </div>
    </div>
</template>

<style scoped>

</style>