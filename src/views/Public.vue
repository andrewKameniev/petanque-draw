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
                <router-link class="navbar-item" to="/">
                    <picture>
                        <source srcset="../assets/img/logo.webp" type="image/webp">
                        <source srcset="../assets/img/logo.png" type="image/jpeg">
                        <img src="../assets/img/logo.png" alt="logo">
                    </picture>
                </router-link>
                <LanguageSwitcher/>
            </div>
            <div class="text-center is-size-3">
                <strong>{{ tournament.name }}</strong>
            </div>
            <div class="tournament-info-card mt-3 mb-3">
                <span class="badge badge-corner" :class="isFinished ? 'badge-finished' : 'badge-active'">
                    {{ isFinished ? $t('common.finished') : $t('common.active') }}
                </span>
                <div class="tournament-info-row" v-if="tournamentMessageLines.length">
                    <span class="has-text-grey-dark">{{ $t('teams.system') }}:</span>
                    <span class="has-text-weight-semibold">{{ tournamentMessageLines[0] }}</span>
                </div>
                <div class="tournament-info-row" v-if="tournamentMessageLines.length > 1">
                    <span class="has-text-grey-dark">{{ $t('common.timeLimit') }}:</span>
                    <span class="has-text-weight-semibold">{{ tournamentMessageLines[1] }}</span>
                </div>
                <div class="tournament-info-row" v-for="(line, i) in tournamentMessageLines.slice(2)" :key="i">
                    <span class="has-text-weight-semibold">{{ line }}</span>
                </div>
                <div class="tournament-info-row" v-if="!tournamentMessageLines.length">
                    <span class="has-text-grey-dark">{{ $t('teams.system') }}:</span>
                    <span class="has-text-weight-semibold">{{ systemDescription }}</span>
                </div>
                <div class="tournament-info-row" v-if="tournament.teams">
                    <span class="has-text-grey-dark">{{ $t('common.teamsCount') }}:</span>
                    <span class="has-text-weight-semibold">{{ tournament.teams.length }}</span>
                </div>
                <div class="tournament-info-row" v-if="tournament.cadrage">
                    <span class="has-text-grey-dark">{{ $t('games.cadrage') }}:</span>
                    <span class="has-text-weight-semibold">{{ cadrageRange }}</span>
                </div>
                <div class="tournament-info-row" v-if="tournament.playOff">
                    <span class="has-text-grey-dark">{{ $t('games.playOff') }}:</span>
                    <span class="has-text-weight-semibold">{{ playOffTeamsCount }} {{ $t('common.teamsLabel') }}</span>
                </div>
                <div v-if="tournament.playOff" class="btn-bracket-group">
                    <button class="button is-small btn-bracket" @click="$refs.playOff && ($refs.playOff.showBracket = true)">{{ $t('games.showBracket') }}</button>
                </div>
            </div>
            <PlayOff v-if="tournament.playOff" ref="playOff" :active-tournament="tournament" :is-public-view="true" @openResults="activeTab = 'ranking'"/>
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
            <div v-if="activeTab === 'results'" class="content tabs-content">
                <div v-if="tournament.games?.length || tournament.cadrage?.length" class="round-tabs mb-4">
                    <button v-for="(round, index) in tournament.games" :key="index"
                            class="button is-small mr-1 mb-1"
                            :class="{'is-purple': selectedRound === index}"
                            @click="selectedRound = index">
                        R{{ index + 1 }}
                    </button>
                    <button v-if="tournament.cadrage?.length" class="button is-small mr-1 mb-1"
                            :class="{'is-purple': selectedRound === 'cadrage'}"
                            @click="selectedRound = 'cadrage'">
                        {{ $t('games.cadrage') }}
                    </button>
                    <button class="button is-small mr-1 mb-1"
                            :class="{'is-purple': selectedRound === -1}"
                            @click="selectedRound = -1">
                        {{ $t('results.all') }}
                    </button>
                </div>
                <div class="table-container" v-if="tournament.games?.length || tournament.cadrage?.length">
                    <table class="table is-striped is-fullwidth">
                        <tbody>
                            <template v-for="(round, index) in tournament.games" :key="index">
                                <template v-if="selectedRound === -1 || selectedRound === index">
                                    <tr v-for="(game, i) in round" :key="i">
                                        <td class="is-narrow"><small class="has-text-grey">R{{ index + 1 }}</small></td>
                                        <td class="has-text-right" :class="{'has-text-weight-bold': game.team_1_score > game.team_2_score}">{{ game.team_1 }}</td>
                                        <td class="has-text-centered is-narrow">
                                            <strong>{{ game.team_1_score }} : {{ game.team_2_score }}</strong>
                                        </td>
                                        <td :class="{'has-text-weight-bold': game.team_2_score > game.team_1_score}">{{ game.team_2 }}</td>
                                    </tr>
                                </template>
                            </template>
                            <template v-if="tournament.cadrage?.length && (selectedRound === -1 || selectedRound === 'cadrage')">
                                <tr v-for="(game, i) in tournament.cadrage" :key="'c' + i">
                                    <td class="is-narrow"><small class="has-text-grey">{{ $t('games.cadrage') }}</small></td>
                                    <td class="has-text-right" :class="{'has-text-weight-bold': game.team_1_score > game.team_2_score}">{{ game.team_1 }}</td>
                                    <td class="has-text-centered is-narrow">
                                        <strong>{{ game.team_1_score }} : {{ game.team_2_score }}</strong>
                                    </td>
                                    <td :class="{'has-text-weight-bold': game.team_2_score > game.team_1_score}">{{ game.team_2 }}</td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>
                <div v-else class="mb-5 mt-5">{{ $t('games.noGames') }}</div>
            </div>
            <div class="content tabs-content" v-if="activeTab === 'ranking'">
                <div class="round-tabs ranking-subtabs mb-4" v-if="tournament.system === 'swiss' && isFinished">
                    <button class="button is-small mr-1 mb-1"
                            :class="{'is-purple': rankingSubtab === 'result'}"
                            @click="rankingSubtab = 'result'">
                        {{ $t('ranking.tournamentResult') }}
                    </button>
                    <button class="button is-small mr-1 mb-1"
                            :class="{'is-purple': rankingSubtab === 'swiss'}"
                            @click="rankingSubtab = 'swiss'">
                        {{ $t('ranking.swissTable') }}
                    </button>
                </div>
                <Ranking :tournament="tournament"
                         :rankingTeams="rankingTeams" :activeRound="tournament.activeRound"
                         :showOnlyResult="isFinished && rankingSubtab === 'result'"
                         :showOnlySwiss="isFinished && rankingSubtab === 'swiss'"/>
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

import Ranking from "@/components/partials/Ranking";
import TeamsList from "@/components/partials/TeamsList";
import {ref, onValue} from "firebase/database";
import {database, initializeMessaging} from "@/firebase";
import {getTeamsRanking} from "@/helpers";
import PlayOff from "@/components/partials/PlayOff.vue";
import LanguageSwitcher from "@/components/partials/LanguageSwitcher.vue";
import Footer from "@/components/partials/Footer.vue";
import Cadrage from "@/components/partials/Cadrage.vue";

export default {
    name: 'Public',
    components: {Cadrage, Footer, LanguageSwitcher, PlayOff, TeamsList, Ranking},
    data() {
        return {
            isLoading: false,
            tournament: null,
            activeTab: "ranking",
            rankingSubtab: "result",
            selectedRound: -2,
            notificationsEnabled: false,
        }
    },
    mounted() {
        this.getInfo();
    },
    beforeUnmount() {
        if (this._unsubscribe) {
            this._unsubscribe();
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
        },
        tournamentMessageLines() {
            if (!this.tournament?.tournamentMessage) return [];
            return this.tournament.tournamentMessage.split('\n').filter(l => l.trim());
        },
        isFinished() {
            if (this.tournament?.tournamentIsFinished) return true;
            if (this.tournament?.date) {
                return new Date(this.tournament.date) < new Date(new Date().toDateString());
            }
            return false;
        },
        systemDescription() {
            if (this.tournament.system !== 'swiss' || !this.tournament.games?.length) {
                return this.$t('teams.' + this.tournament.system);
            }
            const n = this.tournament.games.length;
            let desc = n + ' ' + this.pluralizeRounds(n) + ' ' + this.$t('ranking.swiss');
            if (this.tournament.playOff) {
                desc += ' + ' + this.$t('games.playOff').toLowerCase();
            }
            return desc;
        },
        cadrageRange() {
            if (!this.tournament?.cadrage?.length) return '';
            const from = (this.tournament.playOff?.length || 0) + 1;
            const to = from + this.tournament.cadrage.length * 2 - 1;
            return `${from}-${to} ${this.$t('common.places')}`;
        },
        playOffTeamsCount() {
            if (!this.tournament?.playOff?.length) return 0;
            return this.tournament.playOff.length * 2;
        }
    },
    methods: {
        pluralizeRounds(n) {
            if (this.$i18n.locale === 'ua') {
                const mod10 = n % 10;
                const mod100 = n % 100;
                if (mod10 === 1 && mod100 !== 11) return 'коло';
                if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'кола';
                return 'кіл';
            }
            return n === 1 ? 'round' : 'rounds';
        },
        async getInfo() {
            this.isLoading = true;
            if (this.$route.query) {
                const dbRef = ref(database, `${this.userId}/tournaments/${this.tournamentId}`);
                this._unsubscribe = onValue(dbRef, (snapshot) => {
                    if (snapshot.exists()) {
                        this.tournament = snapshot.val();
                        if (this.tournament.games?.length) {
                            this.selectedRound = this.tournament.games.length - 1;
                        }
                    }
                    this.isLoading = false;
                }, (error) => {
                    console.error('Error fetching data:', error);
                    this.isLoading = false;
                });
            } else {
                const id = this.$route.params.id;
                fetch(`https://portal.petanque.org.ua/tournament/team_export/${id}?format=json`).then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error("Error " + response.status);
                }).then(tournamentInfo => {
                    this.tournament = tournamentInfo.tournament.meta ? JSON.parse(tournamentInfo.tournament.meta) : null;
                    this.isLoading = false;
                }).catch(() => {
                    this.isLoading = false;
                });
            }
        },
    }
}
</script>
<style>
.gooey {
    position: fixed;
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
    background: var(--color-primary);
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
    background: var(--color-primary);
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

.tournament-info-card {
    position: relative;
    border: 2px solid var(--color-primary);
    border-radius: 8px;
    padding: 1rem 1.25rem;
}

.badge-corner {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
}

.btn-bracket-group {
    position: absolute;
    bottom: 0.75rem;
    right: 0.75rem;
    display: flex;
    gap: 0.25rem;
}

.btn-bracket {
    background: var(--color-primary);
    color: var(--color-white);
    border: none;
}

.btn-bracket:hover {
    color: var(--color-white);
}

@media screen and (max-width: 768px) {
    .btn-bracket {
        font-size: 1rem;
    }
}

.tournament-info-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.2rem 0;
}

.tournament-info-message {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #eee;
    white-space: pre-wrap;
    color: #4a4a4a;
}

.badge {
    display: inline-block;
    padding: 0.3rem 0.8rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
}

.badge-active {
    background: var(--color-primary);
    color: var(--color-white);
}

.badge-finished {
    background: var(--color-grey);
    color: var(--color-white);
}

.btn-purple-outline {
    background: transparent;
    border: 2px solid var(--color-primary);
    color: var(--color-primary);
}

.btn-purple-outline:hover {
    background: var(--color-primary);
    color: var(--color-white);
}

.button.is-purple {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-white);
}

.wrapper .navbar-item:hover {
    background: transparent;
}

.wrapper .tabs a {
    border-bottom-color: transparent;
    transition: border-bottom-color 0.3s ease, color 0.3s ease;
}

.wrapper .tabs a:hover {
    border-bottom-color: transparent;
    color: var(--color-primary);
}

.wrapper .tabs li.is-active a {
    border-bottom: 3px solid var(--color-primary);
    color: var(--color-primary);
}

@media screen and (max-width: 768px) {
    .ranking-subtabs {
        display: flex;
    }

    .ranking-subtabs .button {
        flex: 1;
        margin-right: 0.25rem;
    }

    .ranking-subtabs .button:last-child {
        margin-right: 0;
    }
}

.wrapper {
    position: relative;
    background: #f4f4f4;
}

.wrapper::before {
    content: "";
    position: fixed;
    inset: 0;
    background: url("@/assets/img/bg-petanque.avif") repeat;
    background-size: 800px;
    opacity: 0.5;
    z-index: 0;
    pointer-events: none;
}

.wrapper > * {
    position: relative;
    z-index: 1;
}
</style>