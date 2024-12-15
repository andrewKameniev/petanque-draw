<script>
import {mapMutations} from "vuex";
import VueSelect from "vue3-select-component";
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'

export default {
    name: "StatsAnalysis",
    components: {VueSelect, VueDatePicker},
    props: ['stats'],
    data() {
        return {
            date: null,
            player: '',
            playerStat: []
        }
    },
    computed: {
        playersList() {
            let list = [];
            const setPlayerData = (key, player) => {
                const playerData =  {
                    label: player.name,
                    value: player.name,
                    date: key
                }
                list.push(playerData)
            }

            Object.keys(this.stats).forEach(key => {
                this.stats[key].team1.players.forEach(player => {
                    setPlayerData(key, player)
                });
                this.stats[key].team2.players.forEach(player => {
                    setPlayerData(key, player)
                })
            })
            return list
        }
    },
    mounted() {

    },
    methods: {
        ...mapMutations(['showMessage']),
        showPlayerStat() {
            this.playerStat = [];
            Object.keys(this.stats).forEach(key => {

                if (this.stats[key].team1.players.find(player => player.name === this.player)) {
                    const game = {
                        date: key,
                        mode: this.stats[key].team1.players.length,
                        stat: this.stats[key].team1.players.find(player => player.name === this.player).stat
                    }
                    this.playerStat.push(game)
                }
                if (this.stats[key].team2.players.find(player => player.name === this.player)) {
                    const game = {
                        date: key,
                        mode: this.stats[key].team2.players.length,
                        stat: this.stats[key].team2.players.find(player => player.name === this.player).stat
                    }
                    this.playerStat.push(game)
                }
            })
        }
    }
}
</script>

<template>
    <div>
        <div class="columns mb-1">
            <div class="column is-half-desktop">
                <label for="" class="label">Find Player</label>
                <VueSelect v-model="player" :options="playersList"/>
            </div>
            <div class="column is-half-desktop">
                <label for="" class="label">Choose period</label>
                <VueDatePicker v-model="date" range multi-calendars />
            </div>
        </div>
        <div class="mb-3">
            <button class="button is-info" @click="showPlayerStat">Show player statistics</button>
        </div>
        <div v-if="playerStat.length">
            <h3>{{player}}</h3>
            <div v-for="(item, index) in playerStat" :key="index">
                {{ item.date }}<br>
                {{ item.mode }}
            </div>
        </div>
        <hr>
    </div>
</template>

<style>
    .vue-select .control {
        min-height: 38px;
    }
</style>