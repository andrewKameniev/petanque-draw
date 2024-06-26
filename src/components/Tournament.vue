<template>
    <div>
        <div class="box" v-if="isAdmin && tournament.portalIdTournament">
            <h2 class="is-size-5 mb-3">Remote availabilities:</h2>
            <div class="buttons">
                <button class="button is-info" @click="showInfoOnServer">Post tournament on server</button>
                <button class="button is-light" @click="showQrCode = true">Show tournament links</button>
                <button class="button is-warning" @click="showTypeMessage = !showTypeMessage">
                    <span v-if="!showTypeMessage">Write </span><span v-else>Hide </span>&nbsp;message
                </button>
                <button class="button is-danger" @click="removeNotificationsDb">
                    Clear notifications db
                </button>
            </div>
            <progress class="progress is-small is-info" max="100" v-if="loadingOnServer">15%</progress>
            <div class="field" v-if="showTypeMessage">
                <textarea name="info" id="" cols="30" rows="10" v-model="tournament.tournamentMessage" class="textarea"></textarea>
            </div>
            <QrCode v-if="showQrCode" @close-modal="showQrCode = false"/>
        </div>
        <div class="text-center is-size-3">
            <strong class="pointer" @click="changeNameModal = true"> {{ tournament.name }}</strong> <span class="is-size-5 is-capitalized">({{tournament.system}})</span>
        </div>
        <div v-if="!tournament.games.length">
            <div class="field">
                <label class="label" for="">System</label>
                <div class="control">
                    <label class="radio">
                        <input type="radio" name="system" id="swiss" value="swiss" v-model="tournament.system">
                        Swiss
                    </label>
                    <label class="radio">
                        <input type="radio" name="system" id="groups" value="groups" v-model="tournament.system">
                        Groups
                    </label>
                    <label class="radio">
                        <input type="radio" name="system" id="supermele" value="supermele" v-model="tournament.system">
                        SuperMele
                    </label>
                </div>
            </div>
            <div class="field" v-if="tournament.system === 'groups'">
                <label class="label">How many team in group?</label>
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
                <label class="label">How many players in a team?</label>
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
                    :class="{'is-active': tab === activeTab}">
                    <a href="#" @click.prevent="activeTab = tab">{{ tab }}</a>
                </li>
            </ul>
        </div>
        <div class="content tabs-content" v-if="activeTab === 'Teams'">
            <AddTeam v-if="tournament.system === 'supermele' || !tournament.games.length"
                     :import-hidden="tournament.system === 'supermele' && tournament.games.length > 0"/>
            <TeamsList v-if="tournament.teams.length" :activeRound="activeRound"/>
            <div v-else class="mb-5 mt-5">
                Please, add team
            </div>
            <div class="field is-grouped">
                <div class="control">
                    <button class="button is-danger" @click="removeConfirm = true">Remove tournament</button>
                </div>
                <div class="control">
                    <button class="button is-info" @click="showPreferences = true">Preferences</button>
                </div>
                <div class="control" v-if="canSaveTournament || tournament.tournamentIsFinished">
                    <button class="button is-success" @click="showSaveTournament = true">Save tournament</button>
                </div>
                <div class="control" v-if="!tournament.tournamentIsFinished && tournament.games.length > 1">
                    <button class="button is-info" @click="finishTournament">Finish tournament</button>
                </div>
            </div>
        </div>
        <Games v-if="activeTab === 'Games'"
               :rankingTeams="rankingTeams"
               :activeRound="activeRound" :teams-in-group="teamsInGroup"
               @openResults="activeTab = 'Ranking'"/>
        <Results v-if="activeTab === 'Results'"/>
        <div class="content tabs-content" v-if="activeTab === 'Ranking'">
            <Ranking :tournament="tournament" :rankingTeams="rankingTeams" :activeRound="activeRound"/>
            <div v-if="!tournament.playOff && tournament.teams.length > 1">
                <div class="mt-5">
                    <h2 class="h2">Go to play-off?</h2>
                    <div class="is-flex is-align-items-center">Choose number of teams
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
                        <button @click="startPlayOff" class="button is-success ml-3">Go!</button>
                    </div>
                </div>
                <div class="mt-5" v-if="tournament.system === 'swiss'">
                    <label class="checkbox">
                        <input type="checkbox" v-model="playB">
                        Also play <strong>Tournament B</strong>?
                    </label>
                </div>
            </div>
        </div>
        <SaveTournament v-if="showSaveTournament" :ranking-teams="rankingTeams"
                        @close-modal="showSaveTournament = false"/>
        <ConfirmRemoveModal v-if="removeConfirm" @close-modal="removeConfirm = false"/>
        <ChangeTournamentName v-if="changeNameModal" @close-modal="changeNameModal = false"/>
        <Preferences v-if="showPreferences" @close-modal="showPreferences = false"/>
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
import {getGameResultInGroup} from "@/helpers";
import QrCode from "@/components/partials/QrCode";
import {getDatabase, ref, child, get, set} from "firebase/database";
import {database} from "@/firebase";
import Preferences from "@/components/partials/Preferences";

export default {
    name: 'Tournament',
    data() {
        return {
            tabs: ['Teams', 'Games', 'Results', 'Ranking'],
            activeTab: "Teams",
            showSaveTournament: false,
            teamToPlayOff: null,
            removeConfirm: false,
            changeNameModal: false,
            playB: false,
            teamsInGroup: null,
            showQrCode: false,
            showTypeMessage: false,
            loadingOnServer: false,
            showPreferences: false
        }
    },
    created() {
        this.teamsInGroup = this.tournament.groups ? this.tournament.groups.length : 4
    },
    methods: {
        ...mapMutations(['startRound', 'removeTournament', 'setPlayOff', 'addBTournament', 'finishTournament', 'showMessage']),
        saveTournament(tournament) {
            this.savedTournaments.push(tournament);
            this.showSaveTournament = false;
            localStorage.setItem('tournamentsList', JSON.stringify(this.savedTournaments))
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
            this.setPlayOff(playOffScheme);

            this.activeTab = 'Games';

            if (this.playB) {
                const tournamentBTeams = this.rankingTeams.slice(this.teamToPlayOff, this.rankingTeams.length);
                tournamentBTeams.forEach(team => {
                    team.wins = 0;
                    team.buhgolts = 0;
                    team.smallBuhgolts = 0;
                    team.pointsPlus = 0;
                    team.pointsMinus = 0;
                    team.opponents = [];
                })
                this.addBTournament(tournamentBTeams);
            }
        },
        sortTeams(teamsToSort) {
            this.countBuhgolts(teamsToSort, 'buhgolts');
            this.countBuhgolts(teamsToSort, 'smallBuhgolts');
            const teamRanking = teamsToSort.sort((a, b) => b.wins - a.wins || b.buhgolts - a.buhgolts || b.smallBuhgolts - a.smallBuhgolts || (b.pointsPlus - b.pointsMinus) - (a.pointsPlus - a.pointsMinus) || b.rating - a.rating);
            return teamRanking
        },
        sortTeamsForSupermele(teamsToSort) {
            const teamRanking = teamsToSort.sort((a, b) => b.wins - a.wins || (b.pointsPlus - b.pointsMinus) - (a.pointsPlus - a.pointsMinus) || b.pointsPlus - a.pointsPlus || b.rating - a.rating);
            return teamRanking
        },
        countBuhgolts(whereCount, whatBuhgolts) {
            const whatCount = whatBuhgolts === 'buhgolts' ? 'wins' : 'buhgolts';
            whereCount.forEach(team => {
                let currentTeamBuhgolts = 0;
                if (team.opponents.length) {
                    team.opponents.forEach(opponent => {
                        const opponentIndex = whereCount.findIndex(team => team.title === opponent);
                        if (opponentIndex !== -1) {
                            currentTeamBuhgolts += whereCount[opponentIndex][whatCount];
                        }
                    })
                }
                team[whatBuhgolts] = currentTeamBuhgolts;
            });
            return whereCount;
        },
        showInfoOnServer() {
            const id = this.tournament.portalIdTournament;

            let infoToPost = JSON.parse(JSON.stringify(this.tournament));
            delete infoToPost.gamesCopy;
            infoToPost.ranking = this.rankingTeams;
            let formData = new URLSearchParams();
            formData.append('meta', JSON.stringify(infoToPost));

            try {
                this.loadingOnServer = true;
                fetch(`https://portal.petanque.org.ua/tournament/${id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: formData,
                }).then(() => {
                    this.loadingOnServer = false;
                    this.sendNotification();
                    this.showMessage({title: 'Success', text: 'Tournament is live!'});
                });
            } catch (error) {
                alert(error);
                this.showMessage({title: 'Error', type: 'error', text: error});
            }
        },
        sendNotification() {
            const dbRef = ref(getDatabase());
            let tokens = [];
            get(child(dbRef, `tokens`)).then((snapshot) => {
                if (snapshot.exists()) {
                    for (let key in snapshot.val()) {
                        tokens.push(snapshot.val()[key].token);
                    }
                    tokens = new Set([...tokens]);

                    const domain = process.env.NODE_ENV === 'production' ? '/petanque-draw/dist/#/' : '/#/';
                    const link = `${window.location.origin}${domain}tournaments/${this.tournament.portalIdTournament}`
                    tokens.forEach(token => {

                        const message = {
                            "to": token,
                            "data": {
                                "title": 'New draw info is available',
                                "body": 'Reload page to see updates',
                                "url": link,
                            },
                            "priority": "high"
                        };
                        fetch('https://fcm.googleapis.com/fcm/send', {
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'Authorization': 'key=AAAAtEgaync:APA91bExQUfnpTYo2CRT1fn_So0pOWriu9Ri6OIjkQXbRDh-VNABGESd-_F_twcl762zcDcn379nAtXnreFi8YPGQWyMXqYChzUOTwuE5hBM6ntWhOzneV_obn-4O3_MMfYmx4S3kxrQ'
                            },
                            body: JSON.stringify(message)
                        });
                    })


                } else {
                    console.log("No data available");
                }
            }).catch((error) => {
                console.error(error);
            });
        },
        removeNotificationsDb() {
            try {
                set(ref(database, 'tokens'), {}).then(() => {
                    this.showMessage({title: 'Awesome!', text: 'Notifications db was removed'});
                });
            } catch (error) {
                alert(error);
                this.showMessage({title: 'Error', type: 'error', text: error});
            }
        }
    },
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex', 'isAdmin']),
        tournament() {
            return this.tournaments[this.currentTournamentIndex]
        },
        canSaveTournament() {
            return this.tournament.tournamentIsFinished && this.tournament.games && this.tournament.games.length > 1
                || this.tournament.playoff && this.tournament.playoff[this.tournament.playoff.length - 1].teams[0].team_1_score !== null
        },
        rankingTeams() {
            if (this.tournament.system === 'groups' && this.activeRound > 1) {
                let sortedGroups = [];
                this.tournament.groups.forEach(group => {
                    group.forEach(team => {
                        // If was page reload copy necessary teams data to groups
                        const teamInfo = this.tournament.teams.find(item => item.title === team.title);
                        team.wins = teamInfo.wins;
                        team.opponents = teamInfo.opponents;
                        team.pointsPlus = teamInfo.pointsPlus;
                        team.pointsMinus = teamInfo.pointsMinus;

                        let directPoints = 0;
                        team.opponents.forEach(opponent => {
                            const opponentIndex = group.findIndex(team => team.title === opponent);
                            if (team.wins === group[opponentIndex].wins) {
                                directPoints += getGameResultInGroup(this.tournament.games, team.title, group[opponentIndex].title, true)
                            }
                        })
                        team.directPoints = directPoints
                    })
                    let groupRanking = group.slice().sort((a, b) => b.wins - a.wins || b.directPoints - a.directPoints || (b.pointsPlus - b.pointsMinus) - (a.pointsPlus - a.pointsMinus))
                    sortedGroups.push(groupRanking);
                });
                return sortedGroups;
            } else if (this.tournament.system === 'supermele') {
                return this.sortTeamsForSupermele(this.tournament.teams)
            } else {
                return this.sortTeams(this.tournament.teams);
            }
        },
        activeRound() {
            return this.tournament.games.length ? this.tournament.roundIsActive ? this.tournament.games.length : this.tournament.games.length + 1 : 1;
        },
    },
    components: {
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

