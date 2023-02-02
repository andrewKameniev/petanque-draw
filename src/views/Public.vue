<template>
    <div v-if="!notificationsEnabled">
        Notification in your browser are disabled. If you want to know about tournament updates, please, enable notifications
    </div>
    <div v-if="tournament" class="container">
        <div class="text-center is-size-3">
            <strong> {{ tournament.name }}</strong> <span
            class="is-size-5 is-capitalized">({{ tournament.system }})</span>
        </div>
        <div>
            {{ tournament.message }}
        </div>
        <h2 class="is-size-3 text-center" v-if="tournament.roundIsActive">{{ activeRound }} round</h2>
        <div class="games-list">
            <div class="game-row"
                 v-for="(game, index) in tournament.games[activeRound - 1]" :key="index">
                        <span class="text-right team-block">
                            <label :for="'team_' + index">{{ game.team_1 }}</label>
                        </span>
                <span class="text-center score-block">

                            <span class="lane-block is-size-7">
                                Lane <span class="is-size-5 has-text-weight-bold">{{ index + 1 }}</span>
                            </span>
                        </span>
                <span class="team-block">
                            <label :for="'opponent_' + index">{{ game.team_2 }}</label>
                        </span>
            </div>
        </div>
        <div class="tabs">
            <ul>
                <li v-for="(tab, index) in tabs" :key="index"
                    :class="{'is-active': tab === activeTab}">
                    <a href="#" @click.prevent="activeTab = tab">{{ tab }}</a>
                </li>
            </ul>
        </div>
        <div class="content tabs-content" v-if="activeTab === 'Teams'">
            <TeamsList :previewTournament="tournament"/>
        </div>
        <Results v-if="activeTab === 'Results'" :previewTournament="tournament"/>
        <div class="content tabs-content" v-if="activeTab === 'Ranking'">
            <Ranking :tournament="tournament" :rankingTeams="tournament.ranking" :activeRound="tournament.activeRound"/>
        </div>
    </div>
    <div v-else class="p-5">
        <h2 class="is-size-3 text-center">Tournament is not active</h2>
    </div>
</template>

<script>

import Results from "@/components/partials/Results";
import Ranking from "@/components/partials/Ranking";
import TeamsList from "@/components/partials/TeamsList";

export default {
    name: 'Public',
    components: {TeamsList, Ranking, Results},
    data() {
        return {
            tournament: null,
            tabs: ['Teams', 'Results', 'Ranking'],
            activeTab: "Teams",
            notificationsEnabled: false
        }
    },
    mounted() {
        this.getInfo();

    },
    computed: {
        activeRound() {
            return this.tournament.games.length ? this.tournament.roundIsActive ? this.tournament.games.length : this.tournament.games.length + 1 : 1;
        }
    },
    methods: {
        async getInfo() {
            const id = this.$route.params.id;
            console.log(id);
            let response = await fetch(`http://portal.petanque.org.ua/tournament/team_export/${id}?format=json`);

            if (response.ok) {
                let tournamentInfo = await response.json();
                this.tournament = JSON.parse(tournamentInfo.tournament.meta);

            } else {
                alert("Error" + response.status);
            }
        },
        requestPermission() {
            console.log('Requesting permission...');
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                }
            })
        }
    }
}
</script>
