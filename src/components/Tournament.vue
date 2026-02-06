<template>
    <div>
        <div class="box" v-if="user">
            <h2 class="is-size-5 mb-3">{{ $t('remote.remoteAvailabilities') }}:</h2>
            <div class="buttons">
                <button class="button is-light" @click="showQrCode = true">{{ $t('remote.showLinks') }}</button>
                <button class="button is-warning" @click="showTypeMessage = !showTypeMessage">
                    <span v-if="!showTypeMessage">{{ $t('remote.writeMessage') }}</span><span v-else>{{ $t('remote.hideMessage') }} </span>
                </button>
            </div>
            <progress class="progress is-small is-info" max="100" v-if="loadingOnServer">15%</progress>
            <div class="field" v-if="showTypeMessage">
                <textarea name="info" id="" cols="30" rows="5" v-model="tournament.tournamentMessage" class="textarea"></textarea>
            </div>
            <QrCode v-if="showQrCode" @close-modal="showQrCode = false"/>
        </div>
        <div class="text-center is-size-3">
            <strong class="pointer" @click="changeNameModal = true"> {{ tournament.name }}</strong>
            <span class="is-size-5 is-capitalized">({{tournament.system}})</span>
        </div>
        <div v-if="!tournament.games?.length && !tournament.playOff">
            <div class="field" v-if="tournament.teams?.length > 2">
                <label class="label" for="">{{ $t('teams.system') }}</label>
                <div class="control">
                    <label class="radio" v-if="tournament.teams?.length > 4">
                        <input type="radio" name="system" id="swiss" value="swiss" v-model="tournament.system">
                        {{ $t('teams.swiss') }}
                    </label>
                    <label class="radio">
                        <input type="radio" name="system" id="groups" value="groups" v-model="tournament.system">
                        {{ $t('teams.groups') }}
                    </label>
                    <label class="radio">
                        <input type="radio" name="system" id="supermele" value="supermele" v-model="tournament.system">
                        {{ $t('teams.supermele') }}
                    </label>
                </div>
            </div>
            <div class="field" v-if="tournament.system === 'groups'">
                <label class="label">{{ $t('teams.teamsInGroup') }}</label>
                <div class="control">
                    <div class="select">
                        <select v-model.number="teamsInGroup">
                            <template v-for="(team, index) in tournament.teams" :key="index">
                                <option v-if="index > 1">{{index + 1}}</option>
                            </template>
                        </select>
                    </div>
                </div>
            </div>
            <div class="field" v-if="tournament.system === 'supermele'">
                <label class="label">{{ $t('teams.playersInTeam') }}</label>
                <div class="control">
                    <div class="select">
                        <select v-model.number="tournament.supermelePlayers">
                            <option value="2" selected="selected">2</option>
                            <option value="3">3</option>
                        </select>
                    </div>
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
            <AddTeam v-if="tournament.system === 'supermele' || (!tournament.games?.length && !tournament.playOff)"
                     :import-hidden="tournament.system === 'supermele' && (tournament.games && tournament.games.length > 0)"/>
            <TeamsList v-if="tournament.teams && tournament.teams.length" :activeRound="activeRound"/>
            <div v-else class="mb-5 mt-5">
                {{ $t('common.please') }} {{ $t('teams.addTeamMessage') }}
            </div>
            <div class="control" v-if="!tournament.tournamentIsFinished">
                <button class="button is-success" @click="saveTournamentData">{{ $t('teams.saveTournamentData') }}</button>
            </div>
        </div>
        <Games v-if="activeTab === 'games'"
               :rankingTeams="rankingTeams"
               :activeRound="activeRound" :teams-in-group="teamsInGroup"
               @openResults="activeTab = 'ranking'" @sendMessage="sendNotifications"/>
        <Results v-if="activeTab === 'results'"/>
        <div class="content tabs-content" v-if="activeTab === 'ranking'">
            <Ranking :tournament="tournament" :rankingTeams="rankingTeams" :activeRound="activeRound"/>
            <div v-if="!tournament.playOff && tournament.teams?.length > 1">
                <div class="mt-5">
                    <h2 class="h2">{{ $t('ranking.goPlayOff') }}</h2>
                    <div class="is-flex is-align-items-center">{{ $t('ranking.chooseNumberTeams') }}
                        <div class="select ml-3">
                            <select v-model.number="teamToPlayOff">
                                <option v-if="tournament.teams.length >= 2">2</option>
                                <option v-if="tournament.teams.length >= 4">4</option>
                                <option v-if="tournament.teams.length >= 8">8</option>
                                <option v-if="tournament.teams.length >= 16">16</option>
                                <option v-if="tournament.teams.length >= 32">32</option>
                                <option v-if="tournament.teams.length >= 64">64</option>
                            </select>
                        </div>
                        <button @click="startPlayOff" class="button is-success ml-3">{{ $t('ranking.go') }}</button>
                    </div>
                </div>
                <div class="mt-5" v-if="tournament.system === 'swiss'">
                    <label class="checkbox">
                        <input type="checkbox" v-model="playB">
                        {{ $t('ranking.alsoPlay') }} <strong>{{ $t('ranking.tournamentB') }}</strong>?
                    </label>
                </div>
            </div>
        </div>
        <hr>
        <div class="field is-grouped buttons">
            <div class="control">
                <button class="button is-danger" @click="showProtocol = false; removeConfirmId = 1">{{ $t('teams.removeTournament') }}</button>
            </div>
            <div class="control">
                <button class="button is-info" @click="showPreferences = true">{{ $t('teams.preferences') }}</button>
            </div>
            <div class="control" v-if="!tournament.teams?.length">
                <button class="button is-info" @click="restoreTeamsFromLocalStorage">{{ $t('teams.restoreTeams') }}</button>
            </div>
            <div class="control" v-if="canSaveTournament || tournament.tournamentIsFinished">
                <button class="button is-success" @click="showSaveTournament = true">{{ $t('teams.saveTournament') }}</button>
            </div>
            <div class="control" v-if="!tournament.roundIsActive && !tournament.tournamentIsFinished && activeRound === 1 && activeTab !== 'games'">
                <button class="button is-info" @click="activeTab = 'games'">{{ $t('teams.startTournament') }}</button>
            </div>
            <div class="control" v-if="!tournament.tournamentIsFinished && tournament.games?.length > 1 && !tournament.playOff?.length">
                <button class="button is-info" @click="finishTournament">{{ $t('teams.finishTournament') }}</button>
            </div>
            <div class="control" v-if="tournament.portalIdTournament && tournament.tournamentIsFinished && tournament.teams?.length">
                <button class="button is-info" @click="showProtocol = !showProtocol">{{ showProtocol ?  $t('common.hide') : $t('common.show')}}
                    {{ $t('teams.protocol') }}
                </button>
            </div>
        </div>
        <SaveTournament v-if="showSaveTournament" :ranking-teams="rankingTeams"
                        @close-modal="showSaveTournament = false"/>
        <ConfirmRemoveModal v-if="removeConfirmId" :title="$t('modals.sureRemove') + ' ' + tournament.name + '?'" @close="removeConfirmId = null" @remove="removeTournament"/>
        <ChangeTournamentName v-if="changeNameModal" @close-modal="changeNameModal = false"/>
        <Preferences v-if="showPreferences" @close-modal="showPreferences = false"/>
        <Protocol v-if="showProtocol && tournament.portalIdTournament && tournament.tournamentIsFinished" @close="showProtocol = false" :tournament="tournament" :rankingTeams="rankingTeams"/>
    </div>
</template>

<script>
import AddTeam from './partials/AddTeam.vue';
import Games from './partials/Games.vue';
import Results from './partials/Results.vue';
import Ranking from './partials/Ranking.vue';
import TeamsList from "./partials/TeamsList";
import SaveTournament from "./partials/SaveTournament";
import {mapMutations, mapState} from "vuex";
import ConfirmRemoveModal from "@/components/ConfirmRemoveModal";
import ChangeTournamentName from "@/components/partials/ChangeTournamentName";
import {getTeamsRanking, sendCloudMessage} from "@/helpers";
import QrCode from "@/components/partials/QrCode";
import Preferences from "@/components/partials/Preferences";
import Protocol from "@/components/partials/Protocol";
import {get, ref} from "firebase/database";
import {database} from "@/firebase";

export default {
    name: 'Tournament',
    data() {
        return {
            activeTab: "teams",
            showSaveTournament: false,
            teamToPlayOff: null,
            removeConfirmId: null,
            changeNameModal: false,
            playB: false,
            teamsInGroup: null,
            showQrCode: false,
            showTypeMessage: false,
            loadingOnServer: false,
            showPreferences: false,
            showProtocol: false
        }
    },
    created() {
        this.teamsInGroup = this.tournament.groups ? this.tournament.groups.length : 4
    },
    methods: {
        ...mapMutations(['startRound', 'removeTournament', 'setPlayOff', 'addBTournament', 'finishTournament', 'showMessage', 'addTeamToStore', 'saveTournamentData']),
        async sendNotifications() {
            console.log(444);
            const dbRef = ref(database, `tokens/${this.user.uid}/${this.tournament.id}`);
            const snapshot = await get(dbRef);
            console.log(this.user.uid,this.tournament.id,snapshot);
            if (snapshot.exists()) {
                console.log(34);
                const userTokens = Object.values(snapshot.val());
                console.log(userTokens);
                const message = {
                    title: `${this.tournament.name}`,
                    body: `${window.location.origin}/petanque-draw/dist/#/show/?user=${this.user.uid}&tournament=${this.tournament.id}`,
                }
                console.log(message);
                sendCloudMessage(userTokens, message)
            }
        },
        startPlayOff() {
            let playOffList;
            if(this.tournament.system === 'swiss') {
                playOffList = this.rankingTeams.slice(0, this.teamToPlayOff)
            } else {
                if(this.tournament.groups.length > 1) {
                    playOffList = [];
                    for (let i = 0; i < this.teamToPlayOff / this.tournament.groups.length; i++) {
                        this.rankingTeams.forEach(group => playOffList.push(group[i]));
                    }
                } else {
                    playOffList = this.rankingTeams[0].slice(0, this.teamToPlayOff)
                }
            }
            let playOffScheme = [];
            let stageValue = playOffList.length / 2;
            for (let i = 0; i < playOffList.length / 2; i++) {
                let game = {};
                if (i % 2 === 0) {
                    game = {
                        id: i + 1,
                        stage: stageValue,
                        team_1: playOffList[i].title,
                        team_1_place: i + 1,
                        team_1_score: null,
                        team_2: playOffList[playOffList.length - 1 - i].title,
                        team_2_place: playOffList.length - i,
                        team_2_score: null,
                    };
                } else {
                    game = {
                        id: i + 1,
                        stage: stageValue,
                        team_1: playOffList[playOffList.length / 2 - i].title,
                        team_1_place: playOffList.length / 2 + 1 - i,
                        team_1_score: null,
                        team_2: playOffList[playOffList.length / 2 - 1 + i].title,
                        team_2_place: playOffList.length / 2 + i,
                        team_2_score: null,
                    };
                }

                playOffScheme.push(game)
            }
            if (stageValue === 8) {
              [playOffScheme[2], playOffScheme[4]] = [playOffScheme[4], playOffScheme[2]];
              [playOffScheme[3], playOffScheme[5]] = [playOffScheme[5], playOffScheme[3]];
            }
            if (stageValue === 16) {
                const newOrder = [0, 1, 8, 9, 13, 12, 5, 4, 15, 14, 7, 6, 2, 3, 10, 11];
                playOffScheme = newOrder.map(index => playOffScheme[index]);
            }
            if (stageValue === 32) {
                const newOrder = [0, 1, 16, 17, 8, 9, 24, 25, 29, 28, 13, 12, 21, 20, 5, 4, 31, 30, 15, 14, 23, 22, 7, 6, 2, 3, 18, 19, 10, 11, 26, 27];
                playOffScheme = newOrder.map(index => playOffScheme[index]);
            }

            this.setPlayOff(playOffScheme);

            this.activeTab = 'games';

            if (this.playB) {
                const tournamentBTeams = this.rankingTeams.slice(this.teamToPlayOff, this.rankingTeams.length)
                    .map(team => ({ ...team }));
                tournamentBTeams.forEach(team => {
                    team.wins = 0;
                    team.buhgolts = 0;
                    team.smallBuhgolts = 0;
                    team.pointsPlus = 0;
                    team.pointsMinus = 0;
                    team.opponents = ['placeholder'];
                })
                this.addBTournament(tournamentBTeams);
            }
        },
        restoreTeamsFromLocalStorage() {
            const teams = JSON.parse(localStorage.getItem('petanqueDrawTeamsRestore'));
            teams.forEach(item => {
                this.addTeamToStore(item)
            })
        }
    },
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex', 'isAdmin', 'user']),
        tabs() {
            return [
                {
                    id: 'teams',
                    label: this.$t('teams.teams')
                },
                {
                    id: 'games',
                    label: this.$t('teams.games')
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
        tournament() {
            return this.tournaments[this.currentTournamentIndex]
        },
        canSaveTournament() {
            return this.tournament.tournamentIsFinished && this.tournament.games?.length > 1
                || this.tournament.playoff && this.tournament.playoff[this.tournament.playoff.length - 1].teams[0].team_1_score !== null
        },
        rankingTeams() {
            return getTeamsRanking(this.tournament, this.activeRound)
        },
        activeRound() {
            return this.tournament.games && this.tournament.games.length ?
                this.tournament.roundIsActive ? this.tournament.games.length : this.tournament.games.length + 1
                : 1;
        },
    },
    components: {
        Protocol,
        Preferences,
        QrCode,
        ChangeTournamentName,
        ConfirmRemoveModal,
        TeamsList,
        AddTeam,
        Games,
        Results,
        Ranking,
        SaveTournament
    }
}

</script>

