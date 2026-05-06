<template>
    <div v-if="isLoading" class="gooey">
        <span class="dot"></span>
        <div class="dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    </div>
    <div v-else class="wrapper">
        <div v-if="tournament" class="container">
            <div class="is-flex is-justify-content-space-between">
                <a class="navbar-item" href="https://andrewkameniev.github.io/petanque-draw/dist/">
                    <picture>
                        <source srcset="../assets/img/logo.webp" type="image/webp">
                        <source srcset="../assets/img/logo.png" type="image/jpeg">
                        <img src="../assets/img/logo.png" alt="logo">
                    </picture>
                </a>
                <LanguageSwitcher/>
            </div>
            <div class="text-center is-size-3">
                <strong>{{ tournament.name }}</strong> <span
                class="is-size-5 is-capitalized">({{ tournament.system }})</span>
            </div>
            <div v-if="tournament.tournamentMessage" class="notification is-info mt-3 mb-3 is-size-5" style="white-space: pre-wrap;">
                {{ tournament.tournamentMessage }}
            </div>
            <PlayOff v-if="tournament.playOff" :active-tournament="tournament" :is-public-view="true" @openResults="activeTab = 'ranking'"/>
            <Cadrage v-else-if="tournament.isCadrage && tournament.cadrage?.length" :active-tournament="tournament" :is-public-view="true"/>
            <div v-if="tournament.games">
                <h2 class="is-size-3 text-center" v-if="tournament.roundIsActive">{{ activeRound }} {{ $t('common.round') }}</h2>
                <div class="games-list">
                    <div class="game-row compact"
                         v-for="(game, index) in tournament.games[activeRound - 1]" :key="index">
                        <span class="text-right team-block">
                            <label :for="'team_' + index">{{ game.team_1 }}</label>
                        </span>
                        <span class="text-center score-block">
                            <span class="lane-block is-size-7">
                                {{ $t('games.lane') }} <span class="is-size-5 has-text-weight-bold">{{ index + tournament.preferences.fieldsStart }}</span>
                            </span>
                        </span>
                        <span class="team-block">
                            <label :for="'opponent_' + index">{{ game.team_2 }}</label>
                        </span>
                    </div>
                </div>
            </div>
            <div class="tabs">
                <ul>
                    <li v-for="(tab, index) in tabs" :key="index"
                        :class="{'is-active': tab.id === activeTab}">
                        <a href="#" @click.prevent="activeTab = tab.id">{{ tab.label }}</a>
                    </li>
                </ul>
            </div>
            <div class="content tabs-content" v-if="activeTab === 'teams'">
                <TeamsList :previewTournament="tournament"/>
            </div>
            <Results v-if="activeTab === 'results'" :previewTournament="tournament"/>
            <div class="content tabs-content" v-if="activeTab === 'ranking'">
                <Ranking :tournament="tournament"
                         :rankingTeams="rankingTeams" :activeRound="tournament.activeRound"/>
            </div>
        </div>
        <div v-else class="p-5">
            <h2 class="is-size-3 text-center">{{ $t('messages.tournamentNotActive') }}</h2>
            <div class="text-center mt-5">
                <img src="@/assets/img/girl.jpg" alt="In the petanque land"><br>
            </div>
        </div>
        <Footer/>
    </div>
</template>

<script>

import Results from "@/components/partials/Results";
import Ranking from "@/components/partials/Ranking";
import TeamsList from "@/components/partials/TeamsList";
import { getToken, onMessage } from "firebase/messaging";
import {ref, push, get, child, getDatabase} from "firebase/database";
import {database, initializeMessaging} from "@/firebase";
import {getTeamsRanking} from "@/helpers";
import PlayOff from "@/components/partials/PlayOff.vue";
import LanguageSwitcher from "@/components/partials/LanguageSwitcher.vue";
import Footer from "@/components/partials/Footer.vue";
import Cadrage from "@/components/partials/Cadrage.vue";


export default {
    name: 'Public',
    components: {Cadrage, Footer, LanguageSwitcher, PlayOff, TeamsList, Ranking, Results},
    data() {
        return {
            isLoading: false,
            tournament: null,
            activeTab: "ranking",
            notificationsEnabled: false
        }
    },
    mounted() {
        this.getInfo();
        if (this.getCookieValue('petanqueDraw_token') !== this.tournamentId) {
            this.initMessaging();
        }
    },
    computed: {
        tabs() {
            return [
                {
                    id: 'teams',
                    label: this.$t('teams.teams')
                },
                {
                    id: 'results',
                    label: this.$t('teams.results')
                },
                {
                    id: 'ranking',
                    label: this.$t('teams.ranking')
                }
            ];
        },
        activeRound() {
            return this.tournament.games?.length ? this.tournament.roundIsActive ? this.tournament.games.length : this.tournament.games.length + 1 : 1;
        },
        rankingTeams() {
            return getTeamsRanking(this.tournament, this.activeRound)
        },
        userId() {
            return this.$route.query.user;
        },
        tournamentId() {
            return this.$route.query.tournament;
        }
    },
    methods: {
        getCookieValue(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        },
        async initMessaging() {
            this.messaging = await initializeMessaging();
            if (this.messaging) {
                this.requestPermission();
            } else {
                console.error("Messaging is not supported in this browser.");
            }
        },
        async getInfo() {
            this.isLoading = true;
            if (this.$route.query) {
                try {
                    const dbRef = ref(database, `${this.userId}/tournaments/${this.tournamentId}`);
                    const snapshot = await get(dbRef);
                    if (snapshot.exists()) {
                        this.tournament = snapshot.val();
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
                this.isLoading = false;
            } else {
                const id = this.$route.params.id;
                let response = await fetch(`https://portal.petanque.org.ua/tournament/team_export/${id}?format=json`);

                if (response.ok) {
                    let tournamentInfo = await response.json();
                    this.tournament = tournamentInfo.tournament.meta ? JSON.parse(tournamentInfo.tournament.meta) : null;
                    this.isLoading = false;

                } else {
                    alert("Error" + response.status);
                }
            }
        },
        showNotification(message) {
            const self = this;
            navigator.serviceWorker.ready.then(function(registration) {
                registration.showNotification(`${message.notification.title} ${self.$t('common.updated')}`, {
                    body: message.notification.body,
                    icon: 'https://i.imgur.com/S8zDbo4.png',
                    vibrate: [200, 100, 200, 100],
                    data: {url: message.notification.body},
                    actions: [{action: "open_url", title: "Open"}]
                });
            });
        },
        registerSw() {
            if (!('serviceWorker' in navigator)) {
                return;
            }

            const self = this;
            const domain = process.env.NODE_ENV === 'production' ? `${window.location.origin}/petanque-draw/dist` : `${window.location.origin}`;
            navigator.serviceWorker.register(`${domain}/firebase-messaging-sw.js`, { scope: './' }).then(function(reg) {
                const dbRef = ref(getDatabase());
                get(child(dbRef, `apikey`)).then((snapshot) => {
                    if (snapshot.exists()) {
                        getToken(self.messaging, {serviceWorkerRegistration: reg, vapidKey: snapshot.val()}).then((currentToken) => {
                            if (currentToken) {
                                push(ref(database, `tokens/${self.userId}/${self.tournamentId}`), currentToken);
                                document.cookie = `petanqueDraw_token=${self.tournamentId}; path=/; max-age=86400`;
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

                onMessage(self.messaging, (payload) => {
                    self.showNotification(payload)
                });
            }).catch(function(error) {
                console.log('Registration failed with ' + error);
            });
        },
        requestPermission() {
            if (!("Notification" in window)) {
                return
            }
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    this.notificationsEnabled = true;
                    this.registerSw();
                } else {
                    this.notificationsEnabled = false
                }
            })
        }
    }
}
</script>
<style>
.gooey {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 142px;
    height: 40px;
    margin: -20px 0 0 -71px;
}

.gooey .dot {
    position: absolute;
    width: 16px;
    height: 16px;
    top: 12px;
    left: 15px;
    background: #471aa0;
    border-radius: 50%;
    transform: translateX(0);
    animation: dot 2.8s infinite;
}

.gooey .dots {
    transform: translateX(0);
    margin-top: 12px;
    margin-left: 31px;
    animation: dots 2.8s infinite;
}

.gooey .dots span {
    display: block;
    float: left;
    width: 16px;
    height: 16px;
    margin-left: 16px;
    background: #471aa0;
    border-radius: 50%;
}
@keyframes dot {
    50% {
        transform: translateX(96px)
    }
}

@keyframes dots {
    50% {
        transform: translateX(-31px)
    }
}

</style>