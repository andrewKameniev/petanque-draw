<template>
  <div class="container ">
		<h1 class="title is-1 text-center">Petanque - swiss system <sup>Version Alpha</sup></h1>
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
                               <div class="is-size-7" v-if="team.players.length > 1">(
                                    <span class="has-text-dark" v-for="(player, index) in team.players" :key="index">{{player.name}} 
                                       {{player.surname}}<span v-if="index < team.players.length - 1">, </span>
                                    </span>
                                    )
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
                        <div class="control">
                            <button class="button is-danger" @click="removeTournament">Remove tournament</button>
                        </div>
                        <div class="control">
                            <button class="button is-success" @click="saveTournament">Save tournament</button>
                        </div>
                    </div>
				</div>
                <Games v-if="activeTab === 'Games'" :gamesList="games" :teamsList="rankingTeams" 
                    :activeRound="activeRound" :roundIsActive="roundIsActive" :teamsCount="teams.length - 1" :useRating="useRating"
                    @start-round="roundIsActive = true" @end-round="roundIsActive = false"
                    @draw-round="addRoundToGames"
                    @update-games="updateGames" @update-teams="updateTeams"
                    @show-message="showMessage"/>
                <Results v-if="activeTab === 'Results'" :results="games"/>
				<Ranking v-if="activeTab === 'Ranking'" :showIfUseRating="useRating" :isPlayOff="isPlayOff" :rankingTeams="rankingTeams" :activeRound="activeRound"/>
			</div>
			<div class="column is-one-third">
				<img src="./assets/img/bg.jpg" alt="Petanque in Alps" class="image">
			</div>

		</div>
    <Message v-if="message.show" :type="message.type" :title="message.title" :text="message.text" @closemessage="message.show = false"/>
	</div>
</template>

<script>
import AddTeam from './components/AddTeam.vue';
import Message from './components/Message.vue';
import Games from './components/Games.vue';
import Results from './components/Results.vue';
import Ranking from './components/Ranking.vue';

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
            isPlayOff: false,
            message: {
                show: false,
                type: 'success',
                title: 'Message',
                text: '',
            }
        }
    },
    mounted(){
        
    },
    methods: {
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
                console.log(teamExists);
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
            this.isPlayOff = false,
            this.useRating = true
        },
        runPlayOff(){
            
        }
    },
    computed: {
        rankingTeams(){
            return this.sortTeams(this.teams);
        },
        activeRound(){
            return this.games.length ? this.games.length + 1 : 0;
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
            localStorage.setItem('isPlayOff', this.isPlayOff)
        }
    },
    components: {
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
