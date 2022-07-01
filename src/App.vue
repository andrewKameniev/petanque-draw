<template>
  <div class="container ">
		<h1 class="title is-1 text-center">Petanque - swiss system <sup>Version Beta 1</sup></h1>
		<div class="columns">
			<div class="column">
				<div class="tabs">
					<ul>
                        <li v-for="(tab, index) in tabs" :key="index"  
                           @click="activeTab = tab"
                            :class="{'is-active': tab === activeTab}">
                                <a href="#">{{tab}}</a>
                        </li>
					</ul>
				</div>
				<div class="content tabs-content" v-if="activeTab === 'Teams'">
					<AddTeam :showRating="useRating" @add-team="addTeam" @change-draw-style="changeDrawStyle" v-if="!games.length"/>
					<h2 v-if="teams.length">Current list</h2>
					<table id="table-list" class="table" v-if="teams.length">
                        <tr v-for="team in teams" :key="team.title">
                            <td>{{team.title}}
                               <div class="is-size-7" v-if="team.players && team.players.length > 1">
                                   (<span class="has-text-dark" v-for="(player, index) in team.players" :key="index">{{player.name}}
                                       {{player.surname}}<span v-if="index < team.players.length - 1">, </span></span>)
                                </div>
                            </td>
                            <td class="td-100" v-if="useRating">{{team.rating}}</td>
                            <td class="td-50" v-if="!games.length">
                                <span class="delete" @click="removeTeam(team.title)"></span>
                            </td>
                        </tr>
					</table>
					<div v-else class="mb-5 mt-5">
                        Please, add team
					</div>
					<div class="field is-grouped">	
                        <div class="control" v-if="teams.length">
                            <button class="button is-danger" @click="removeTournament">Remove tournament</button>
                        </div>
                        <div class="control" v-if="canSaveTournament || tournamentIsFinished">
                            <button class="button is-success" @click="showSaveTournament = true">Save tournament</button>
                        </div>
                    </div>
				</div>
                <Games v-if="activeTab === 'Games'" :gamesList="games" :teamsList="rankingTeams" 
                    :activeRound="activeRound" :roundIsActive="roundIsActive" :teamsCount="teams.length - 1" :useRating="useRating"
                    :playOff="isPlayOff"
                    @start-round="roundIsActive = true" @end-round="roundIsActive = false"
                    @draw-round="addRoundToGames" @show-message="showMessage" @finishTournament="tournamentIsFinished = true; activeTab = 'Ranking'"/>
                <Results v-if="activeTab === 'Results'" :results="games"/>
                <div class="content tabs-content" v-if="activeTab === 'Ranking'">
                    <Ranking  :gamesList="games"
                              :showIfUseRating="useRating" :isPlayOff="isPlayOff" :rankingTeams="rankingTeams" :activeRound="activeRound"/>
                    <div class="mt-5" v-if="!isPlayOff && teams.length > 1">
                        <h2 class="h2">Go to play-off?</h2>
                        <div class="is-flex is-align-items-center">Choose number of teams
                            <div class="select ml-3">
                                <select v-model="teamToPlayOff">
                                    <option v-if="rankingTeams.length >= 2">2</option>
                                    <option v-if="rankingTeams.length >= 4">4</option>
                                    <option v-if="rankingTeams.length >= 8">8</option>
                                    <option v-if="rankingTeams.length >= 16">16</option>
                                    <option v-if="rankingTeams.length >= 32">32</option>
                                    <option v-if="rankingTeams.length >= 64">64</option>
                                </select>
                            </div>
                            <button @click="startPlayOff" class="button is-success ml-3">Go!</button>
                        </div>
                    </div>
                </div>

			</div>
			<div class="column is-one-third">
				<img src="./assets/img/bg.jpg" alt="Petanque in Alps" class="image">
			</div>
		</div>
        <div class="menu-button button is-info" @click="menuOpen = !menuOpen">Menu</div>
      <SaveTournament v-if="showSaveTournament" :tournamentsNames="savedTournamentsList" :tournaments="savedTournaments"
                      @save-tournament="saveTournament" @close-modal="showSaveTournament = false"/>
    <Message v-if="message.show" :type="message.type" :title="message.title" :text="message.text" @closemessage="message.show = false"/>
      <Menu :active="menuOpen" :tournaments="savedTournamentsList"
            @closeMenu="menuOpen = false" @openSavedTournament="openSavedTournament"/>
      <SavedTournamentModal v-if="showSavedTournament" :tournament="savedTournaments[savedTournamentsActive]"
                            @close-modal="closeTournamentModal" @remove-tournament="removeSavedTournament"/>
	</div>
</template>

<script>
import AddTeam from './components/AddTeam.vue';
import Message from './components/Message.vue';
import Games from './components/Games.vue';
import Results from './components/Results.vue';
import Ranking from './components/Ranking.vue';
import SaveTournament from './components/SaveTournament';
import Menu from './components/Menu';
import SavedTournamentModal from './components/SavedTournamentModal';

export default {
    name: 'App',
    data(){
        return {
            tabs: ['Teams', 'Games', 'Results', 'Ranking'],
            activeTab: "Teams",
            teams: localStorage.getItem('teams') ? JSON.parse(localStorage.getItem('teams')) : [],
            games: localStorage.getItem('games') ? JSON.parse(localStorage.getItem('games')) : [],
            roundIsActive: false,
            useRating: localStorage.getItem('useRating') || true,
            isPlayOff: localStorage.getItem('playOff') ? JSON.parse(localStorage.getItem('playOff')) : false,
            teamToPlayOff: null,
            message: {
                show: false,
                type: 'success',
                title: 'Message',
                text: '',
            },
            showSaveTournament: false,
            menuOpen: false,
            showSavedTournament: false,
            savedTournaments: localStorage.getItem('tournamentsList') ?  JSON.parse(localStorage.getItem('tournamentsList')) : [],
            savedTournamentsActive: null,
            playoff: localStorage.getItem('playOffBracket') ? JSON.parse(localStorage.getItem('playOffBracket')).stages : null,
            tournamentIsFinished: false
        }
    },
    methods: {
        saveTournament(tournament){
            this.savedTournaments.push(tournament);
            this.showSaveTournament = false;
            localStorage.setItem('tournamentsList', JSON.stringify(this.savedTournaments))
        },
        removeSavedTournament(name){
            this.closeTournamentModal();
            this.savedTournaments = this.savedTournaments.filter(item => item.name !== name)

        },
        openSavedTournament(index){
            this.savedTournamentsActive = index;
            this.openTournamentModal();
        },
        startPlayOff(){
            const playOffList = this.rankingTeams.slice(0, this.teamToPlayOff);
            let playOffScheme = [];
            let stageValue = playOffList.length/2;
            for(let i = 0; i < playOffList.length/2; i++){
                let game = {};
                if(i % 2 === 0){
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
                        team_1: playOffList[playOffList.length/2 - i].title,
                        team_1_place: playOffList.length/2 + 1 - i,
                        team_1_score: null,
                        team_2: playOffList[playOffList.length/2 - 1 + i].title,
                        team_2_place: playOffList.length/2 + i,
                        team_2_score: null,
                    };
                }

                playOffScheme.push(game)
            }

            this.isPlayOff = playOffScheme;
            localStorage.setItem('playOff', JSON.stringify(this.isPlayOff))
            this.activeTab = 'Games'
        },
        shuffleArray(array) {
          let currentIndex = array.length,  randomIndex;
          while (currentIndex != 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
              array[randomIndex], array[currentIndex]];
          }
          return array;
        },
        changeDrawStyle(value){
            this.useRating = value;
        },
        addRoundToGames(round){
            this.games.push(this.shuffleArray(round));
            console.log(this.games);
        },
        showMessage(title, text, type = 'success'){
            this.message = {
                show: true,
                type: type,
                title: title,
                text: text,
            }
        },
        sortTeams(teamsToSort){
            this.countBuhgolts(teamsToSort, 'buhgolts');
            this.countBuhgolts(teamsToSort, 'smallBuhgolts');
            const teamRanking = teamsToSort.sort((a, b) => b.wins - a.wins || b.buhgolts - a.buhgolts || b.smallBuhgolts - a.smallBuhgolts || (b.pointsPlus - b.pointsMinus) - (a.pointsPlus - a.pointsMinus) || b.rating - a.rating);
            localStorage.setItem('teams', JSON.stringify(teamRanking));
            return teamRanking
        },
        countBuhgolts(whereCount, whatBuhgolts){
            const whatCount = whatBuhgolts === 'buhgolts' ? 'wins' : 'buhgolts';
            whereCount.forEach(team => {
                let currentTeamBuhgolts = 0;
                if(team.opponents.length){
                    team.opponents.forEach(opponent => {
                        const opponentIndex = whereCount.findIndex(team => team.title === opponent);
                        if(opponentIndex !== -1){
                            currentTeamBuhgolts += whereCount[opponentIndex][whatCount];
                        }
                    })
                }
                team[whatBuhgolts] = currentTeamBuhgolts;
            });
            return whereCount;
        },
        addTeam(title, rating, players = false){
            if(title !== ''){
                let teamExists = false;
                this.teams.forEach(team => {
                    if(team.title === title){
                        teamExists = true;
                    }
                    
                });
                if(!teamExists){
                   const team = {
                    title: title,
                    rating: rating,
                    players: players,
                    wins: 0,
                    buhgolts: 0,
                    smallBuhgolts: 0,
                    pointsPlus: 0,
                    pointsMinus: 0,
                    opponents: [],
                }
                this.teams.push(team);
                localStorage.setItem('teams', JSON.stringify(this.teams));
               } else {
                   this.showMessage('Error', 'Such team already registered! Change team title, please', 'error');
               }
           } else {
               this.showMessage('Error', 'Enter fields to add team', 'error');
           }
            
        },
        removeTeam(titleToRemove){
            this.teams = this.teams.filter(team => team.title !== titleToRemove);
        },
        removeTournament(){
            this.teams = [];
            this.games = [];
            this.isPlayOff = null;
            this.useRating = true;
            localStorage.removeItem('playOffStage');
            localStorage.removeItem('playOffBracket');
        },
        openTournamentModal(){
            this.showSavedTournament = true;
            document.querySelector('html').classList.add('is-clipped');
        },
        closeTournamentModal(){
            this.showSavedTournament = false;
            document.querySelector('html').classList.remove('is-clipped');
        }
    },
    computed: {
        canSaveTournament(){
            return this.games && this.games.length > 0 || this.playoff && this.playoff[this.playoff.length - 1].teams[0].team_1_score !== null
        },
        rankingTeams(){
            return this.sortTeams(this.teams);
        },
        activeRound(){
            return this.games.length ? this.roundIsActive ? this.games.length : this.games.length + 1 : 1;
        },
        savedTournamentsList(){
            if(this.savedTournaments.length > 0){
                let tournamentsTitles = []
                this.savedTournaments.forEach(item => {
                    tournamentsTitles.push(item.name)
                })
                return tournamentsTitles
            } else return false
        }
    },
    watch: {
        teams() {
             if(this.teams.length){
                localStorage.setItem('teams', JSON.stringify(this.teams))
            } else {
                localStorage.removeItem('teams')
            }
        },
        games() {
            if(this.games.length){
                localStorage.setItem('games', JSON.stringify(this.games))
            } else {
                localStorage.removeItem('games')
            }
        },
        useRating() {
            localStorage.setItem('useRating', this.useRating)
        },
        isPlayOff() {
            localStorage.setItem('playOff', JSON.stringify(this.isPlayOff))
        },
        savedTournaments() {
            localStorage.setItem('tournamentsList', JSON.stringify(this.savedTournaments))
        }
    },
    components: {
        SavedTournamentModal,
        Menu,
        SaveTournament,
        AddTeam,
        Message,
        Games,
        Results,
        Ranking
    }
}
    
</script>


<style src="./assets/css/bulma.min.css"></style>
<style src="./assets/css/style.css"></style>
<style>
    .menu-button {
        position: fixed;
        left: 0;
        top: 0;
        padding: 10px;
        border-radius: 0 0 5px 0;
    }
</style>
