<script>
import {mapMutations, mapState} from "vuex";
import {getDatabase, ref, get, remove} from "firebase/database";
import StatResult from "@/components/stats/StatResult.vue";
export default {
    name: "StatsArchive",
    components: {StatResult},
    data() {
        return {
            statsList: null
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
                this.statsList = null; // Reset the data in case of error
                this.showMessage({
                    title: 'Error',
                    text: 'Failed to load statistics. Please try again later.',
                    type: 'error',
                });
            })
            .finally(() => {
                this.isLoading = false; // Hide the loading indicator
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
        getDate(time) {
            const d = new Date(time);
            return `(${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()})`
        },
        getTeamStat(team) {
            let teamStat = [];
            team.players.forEach(() => {
                teamStat.push({
                    points: {
                        positive: 0,
                        negative: 0
                    },
                    tirs: {
                        positive: 0,
                        negative: 0
                    },
                    serie: []
                })
            })

            if (team.players[0].stat?.length) {
                team.players.forEach((player, index) => {
                    player.stat.forEach(man => {
                        if (man !== null) {
                            man.forEach(item => {
                                if (item.type === 'p') {
                                    if (item.success) {
                                        teamStat[index].points.positive += 1;
                                    } else {
                                        teamStat[index].points.negative += 1;
                                    }
                                } else {
                                    if (item.success) {
                                        teamStat[index].tirs.positive += 1;
                                    } else {
                                        teamStat[index].tirs.negative += 1;
                                    }
                                }
                                teamStat[index].serie.push(item);
                            })
                        }
                    })
                    teamStat[index].all = {
                        positive: teamStat[index].points.positive + teamStat[index].tirs.positive,
                        negative: teamStat[index].points.negative + teamStat[index].tirs.negative
                    }
                })
            }

            return teamStat
        }
    }
}
</script>

<template>
    <div>
        <button class="button is-info" @click="$emit('close')">Back</button>
        <div v-if="statsList" class="mt-3">
            <div v-for="item in statsList" :key="item.date">
                <div class="p-2 mb-2 is-flex is-justify-content-space-between" style="cursor: pointer" @click="item.isOpen = !item.isOpen">
                    <span>
                        {{ item.name }}
                        <span>{{getDate(item.date)}}</span>
                    </span>
                    <span class="delete" @click.stop="removeGame(item.date)"></span>
                </div>
                <div class="columns" v-if="item.isOpen">
                    <div class="column is-half-desktop">
                        <div class="label">Team 1</div>
                        <StatResult :team="item.team1" :system="item.system"/>
                    </div>
                    <div class="column is-half-desktop">
                        <div class="label">Team 2</div>
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