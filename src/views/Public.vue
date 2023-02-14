<template>
    <div v-if="!notificationsEnabled" class="notification is-danger has-text-centered">
        Notification in your browser are disabled. If you want to know about tournament updates, please, enable notifications.
        <a href="https://support.humblebundle.com/hc/en-us/articles/360008513933-Enabling-and-Disabling-Browser-Notifications-in-Various-Browsers" target="_blank">How to do it?</a>
    </div>
    <div v-if="isLoading" class="has-text-centered is-size-3">
        <img src="@/assets/img/fun.jpg" alt="Loading..."><br>
        Page is loading...
    </div>
    <div v-else>
        <div v-if="tournament" class="container">
            <div class="text-center is-size-3">
                <strong> {{ tournament.name }}</strong> <span
                class="is-size-5 is-capitalized">({{ tournament.system }})</span>
            </div>
            <div v-if="tournament.tournamentMessage" class="notification is-info mt-3 mb-3 is-size-5">
                {{ tournament.tournamentMessage }}
            </div>
            <h2 class="is-size-3 text-center" v-if="tournament.roundIsActive">{{ activeRound }} round</h2>
            <div class="games-list">
                <div class="game-row compact"
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
                <Ranking :tournament="tournament"
                         :rankingTeams="tournament.ranking" :activeRound="tournament.activeRound"/>
            </div>
        </div>
        <div v-else class="p-5">
            <h2 class="is-size-3 text-center">Tournament is not active</h2>
            <div class="text-center mt-5">
                <img src="@/assets/img/girl.jpg" alt="In the petanque land"><br>
            </div>
        </div>
    </div>
</template>

<script>

import Results from "@/components/partials/Results";
import Ranking from "@/components/partials/Ranking";
import TeamsList from "@/components/partials/TeamsList";
import { getToken, onMessage } from "firebase/messaging";
import {ref, push, get, child, getDatabase} from "firebase/database";
import {database, messaging} from "@/firebase";


export default {
    name: 'Public',
    components: {TeamsList, Ranking, Results},
    data() {
        return {
            isLoading: false,
            tournament: null,
            tabs: ['Teams', 'Results', 'Ranking'],
            activeTab: "Teams",
            notificationsEnabled: false
        }
    },
    mounted() {
        this.getInfo();
        this.requestPermission();
        setTimeout(this.registerSw, 2000);
    },
    computed: {
        activeRound() {
            return this.tournament.games.length ? this.tournament.roundIsActive ? this.tournament.games.length : this.tournament.games.length + 1 : 1;
        }
    },
    methods: {
        async getInfo() {
            this.isLoading = true;
            const id = this.$route.params.id;
            let response = await fetch(`https://portal.petanque.org.ua/tournament/team_export/${id}?format=json`);

            if (response.ok) {
                let tournamentInfo = await response.json();
                this.tournament = tournamentInfo.tournament.meta ? JSON.parse(tournamentInfo.tournament.meta) : null;
                this.isLoading = false;

            } else {
                alert("Error" + response.status);
            }
        },
        showNotification(message) {
            navigator.serviceWorker.ready.then(function(registration) {
                registration.showNotification(message.data.title, {
                    body: message.data.body,
                        icon: 'https://i.imgur.com/S8zDbo4.png'
                });
            });
        },
        registerSw() {
            const self = this;
            navigator.serviceWorker.register('https://andrew-kamenev.github.io/petanque-swiss-vue/dist/firebase-messaging-sw.js', { scope: './' }).then(function(reg) {
                console.log('Registration succeeded. Scope is ' + reg.scope);
                const dbRef = ref(getDatabase());
                get(child(dbRef, `apikey`)).then((snapshot) => {
                    if (snapshot.exists()) {
                        console.log(snapshot.val());
                        getToken(messaging, {serviceWorkerRegistration: reg, vapidKey: snapshot.val()}).then((currentToken) => {
                            if (currentToken) {
                                console.log("token is " + currentToken);
                                push(ref(database, 'tokens'), {
                                    time: Date.now(),
                                    token: currentToken
                                });
                            } else {
                                console.log('No registration token available. Request permission to generate one.');
                            }
                        }).catch((err) => {
                            console.log('An error occurred while retrieving token. ', err);
                        });
                    } else {
                        console.log("No data available");
                    }
                }).catch((error) => {
                    console.error(error);
                });

                onMessage(messaging, (payload) => {
                    console.log(payload);
                    self.showNotification(payload)
                });
            }).catch(function(error) {
                console.log('Registration failed with ' + error);
            });
        },
        requestPermission() {
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    this.notificationsEnabled = true
                } else {
                    this.notificationsEnabled = false
                }
            })
        }
    }
}
</script>
