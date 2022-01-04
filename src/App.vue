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
					<AddTeam @addteam="addTeam" v-if="!games.length"/>
					<h2 v-if="teams.length">Current list</h2>
					<table class="table" v-if="teams.length">
                        <tr v-for="team in teams" :key="team.title">
                            <td>{{team.title}}</td>
                            <td class="td-100">{{team.rating}}</td>
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
				<div class="content tabs-content" v-if="activeTab === 'Games'">
					<div class="field is-grouped">
						<div class="control">	
							<button class="button is-info" @click="drawRound" v-if="!roundIsActive">
							{{activeRound === 0 ? 'First' : `Draw ${activeRound}`}} Round</button>
						</div>
					</div>	
					<div v-if="games.length && roundIsActive">
                       <h2 class="text-center">Round {{activeRound - 1}}</h2>
                        <div class="game-row" v-for="(game, index) in games[activeRound - 2]" :key="index">
                            <span class="text-right">
                                <label for="">{{game.team_1}}</label>
                            </span>
                            <span class="text-center lh-40 score-block">
                                <input v-model="game.team_1_score" class="input -small" type="number" :disabled = "game.team_2 === 'Technical'"> 
                                vs 
                                <input v-model="game.team_2_score" class="input -small" type="number" :disabled = "game.team_2 === 'Technical'">
                            </span>
                            <span>
                                <label for="">{{game.team_2}}</label>
                            </span>
                        </div>
                        <div class="text-center">
                            <button class="button is-success" @click="saveResults">Save results</button>
                        </div>
					</div>
					<div v-else class="mb-5 mt-5">
                       <p v-if="games.length >= teams.length - 1">Rounds quantity can't be more than teams</p>
                       <p v-else>Please, click on button to draw <b>{{activeRound === 0 ? 'first' : activeRound }}</b> round</p>
					</div>
				</div>
				
				<div class="content tabs-content" v-if="activeTab === 'Results'">	
					<table v-if="games.length" class="table">
                        <template v-for="(round, index) in games" :key="index">
                            <tr v-for="(game, i) in round" :key="i">
                                <td>R{{index + 1}}</td>
                                <td>{{game.team_1}}</td>
                                <td>{{game.team_1_score}}</td>
                                <td>{{game.team_2_score}}</td>
                                <td>{{game.team_2}}</td>
                            </tr>
                        </template>
					</table>
					<div v-else class="mb-5 mt-5">
                        No games, yet
					</div>
				</div>

				<div class="content tabs-content" v-if="activeTab === 'Ranking'">	
					<table class="table">
						<thead>	
                            <tr>
                                <th>#</th>
                                <th>Wins</th>
                                <th>Buh</th>
                                <th>Sm Buh</th>
                                <th>Points</th>
                                <th>Rating</th>
                            </tr>
                        </thead>
						<tbody>
                            <tr v-for="team in rankingTeams" :key="team.title">
                                <td>{{team.title}}</td>
                                <td>{{team.wins}}</td>
                                <td>{{team.buhgolts}}</td>
                                <td>{{team.smallBuhgolts}}</td>
                                <td>{{team.pointsPlus}}:{{team.pointsMinus}}</td>
                                <td>{{team.rating}}</td>
                            </tr>
						</tbody>
					</table>
				</div>
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

export default {
    name: 'App',
    data(){
        return {
            tabs: ['Teams', 'Games', 'Results', 'Ranking', 'Tournaments'],
            activeTab: "Teams",
            teams: localStorage.getItem('teams') ? JSON.parse(localStorage.getItem('teams')) : [],
            games: localStorage.getItem('games') ? JSON.parse(localStorage.getItem('games')) : [],
            roundIsActive: false,
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
        saveResults(){
            this.games[this.activeRound - 2].forEach(game => {
                const firstTeamIndex = this.teams.findIndex(item => item.title === game.team_1);
                if(firstTeamIndex != -1){
                    this.teams[firstTeamIndex].opponents.push(game.team_2);
                    this.teams[firstTeamIndex].pointsPlus += game.team_1_score;
                    this.teams[firstTeamIndex].pointsMinus += game.team_2_score;
                }
                const secondTeamIndex = this.teams.findIndex(item => item.title === game.team_2);
                if(secondTeamIndex != -1){
                    this.teams[secondTeamIndex].opponents.push(game.team_1);
                    this.teams[secondTeamIndex].pointsPlus += game.team_2_score;
                    this.teams[secondTeamIndex].pointsMinus += game.team_1_score;
                }
                if(game.team_1_score > game.team_2_score){
                     if(firstTeamIndex != -1){
                        console.log(this.teams[firstTeamIndex], firstTeamIndex);
                        this.teams[firstTeamIndex].wins++
                     }
                } else if(!secondTeamIndex != -1 && game.team_2 !== "Technical"){
                    this.teams[secondTeamIndex].wins++
                }
            })
            localStorage.setItem('teams', JSON.stringify(this.teams));
            localStorage.setItem('games', JSON.stringify(this.games));
            this.roundIsActive = false;
            this.showMessage('Success', 'Your results saved');
        },
        showMessage(title, text, type = 'success'){
            this.message = {
                show: true,
                type: type,
                title: title,
                text: text,
            }
        },
        generateCompetitors(teamList, reverse = false){ //функция для распределения пар
            const teamIndex = reverse ? teamList.length - 1 : 0; //  команда для которой выбираем соперника (первая или последняя в списке в зависимости от флага). reverse - флаг, с какой стороны списка подбирать соперников
            const defaultOpponentIndex = this.activeRound === 0 ? teamList.length/2 : 1; // команда-соперник по умолчанию - вторая в списке. Если первый тур, то вторая во второй группе
            let opponentIndex = reverse ? teamList.length - 2 : defaultOpponentIndex; // даем соперника. В зависимости от флага - второй в списке или предпоследний
            while(teamList[teamIndex].opponents.includes(teamList[opponentIndex].title)){ // проверяем, играли ли эти команды друг с другом (у каждой формируеится массив с соперниками)
                reverse ? opponentIndex-- : opponentIndex++; // если играли, то подбираем соперника следующего по списку в зависимости от флага
                
                if(!teamList[opponentIndex]){ // если не удалось подобрать соперника, так и говорим
                    opponentIndex = -1; 
                    return {teamIndex, opponentIndex};
                }
            }
            console.log(opponentIndex);
            return {teamIndex, opponentIndex}; // отдали пару
        },
        drawRound(){
            this.roundIsActive = true;
            let round = []; // массив куда будем сохранять пары соперников
            let teamsToDraw = [...this.rankingTeams]; //список команд, которые надо пожеребить
            let expandListIteration = 0; // количество итераций, когда приходится увеличивать кол-во команд (понятно будет дальше)
            let stopExpandIndex = teamsToDraw.length/2 - 1; // максимально возможное число, когда можно увеличивать список команд
            let teamsDrawed = []; //массив с уже пожеребенными командами
            let competitors; // пара которая получается в результате вызова generateCompetitors()
            let game; // объект с соперниками
            const isTechnical = teamsToDraw.length % 2 !== 0; // это только в случае нечетного кол-ва команд, сейчас не важно
            let technicalTeam = isTechnical ? teamsToDraw[teamsToDraw.length - 1] : null;  // это только в случае нечетного кол-ва команд, сейчас не важно
            if(isTechnical){ //if has to be technical team
                if(technicalTeam.opponents.includes('Technical')){
                    for(let i = 2; i < teamsToDraw.length; i++){
                        console.log(123);
                        technicalTeam = teamsToDraw[teamsToDraw.length - i];
                        if(!technicalTeam.opponents.includes('Technical')){
                            console.log(technicalTeam);
                            break;
                        }
                    }
                }
                
//                while(technicalTeam.opponents.includes('Technical')){
//                    let i = 2;
//                    console.log(i);
//                    technicalTeam = teamsToDraw[teamsToDraw.length - i];
//                    i++;
//                    console.log(technicalTeam);
//                    if (i > 5){
//                        return
//                    }
//                }
                console.log(technicalTeam);
               game = {
                    team_1: technicalTeam.title,
                    team_1_score: 13,
                    team_2: 'Technical',
                    team_2_score: 7
                };
                console.log(game);
                round.push(game);
                teamsToDraw.splice(teamsToDraw.length   - 1, 1);
            }
            while(teamsToDraw.length > 0){ // вся магия здесь
                competitors = this.generateCompetitors(teamsToDraw, expandListIteration > 0); // определили пару команд
                while(competitors.opponentIndex === -1 && expandListIteration < stopExpandIndex){ // вот здесь самая большая проблема, по сути единственная. Если мы не смогли найти подходящего соперника (т.е. команды уже играли друг с другом), то я =>
                    expandListIteration++;
                    round.splice(round.length - 1, 1); // => убираю предыдущую пожеребенную пару
                    if(!teamsDrawed.length) { 
                        this.showMessage('Error', 'Sorry, shit happens');
                        return
                    }
                    teamsToDraw.unshift(teamsDrawed[teamsDrawed.length - 1]); // => добавляю в список, который надо пожеребить две предыдущие команды
                    teamsToDraw.unshift(teamsDrawed[teamsDrawed.length - 2]);
                    teamsDrawed.splice(teamsDrawed.length - 2, 2); // => убираю предыдущую пожеребенную пару с массива пожеребенных
                    competitors = this.generateCompetitors(teamsToDraw, true); // => ищу соперников начиная не с верха списка, а снизу 
                }
                
                game = { // записали пару
                    team_1: teamsToDraw[competitors.teamIndex].title,
                    team_1_score: null,
                    team_2: teamsToDraw[Math.floor(competitors.opponentIndex)].title,
                    team_2_score: null
                }
                teamsDrawed.push(teamsToDraw[competitors.teamIndex], teamsToDraw[Math.floor(competitors.opponentIndex)]); // добавили пару в массив с пожеребенными командами
                let teamsToRemove = [teamsToDraw[competitors.teamIndex].title, teamsToDraw[Math.floor(competitors.opponentIndex)].title]; 
                teamsToDraw = teamsToDraw.filter(team => !teamsToRemove.includes(team.title)); // удалили пожеребенные команды из массива, который ужно было пожеребить
                
                if(game){
                    round.push(game) // записали в раунд
                } else {
                    console.log("Game is empty");
                }
            } // когда в массиве пожеребенных не осталось команд, заканчиваем цикл
            this.games.push(round);
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
        addTeam(title, rating){
            const team = {
                title: title,
                rating: rating,
                wins: 0,
                buhgolts: 0,
                smallBuhgolts: 0,
                pointsPlus: 0,
                pointsMinus: 0,
                opponents: [],
            }
            this.teams.push(team);
            localStorage.setItem('teams', JSON.stringify(this.teams));
        },
        removeTeam(titleToRemove){
            this.teams = this.teams.filter(team => team.title !== titleToRemove);
            localStorage.setItem('teams', JSON.stringify(this.teams));
        },
        removeTournament(){
            this.teams = [];
            localStorage.removeItem('teams');
            this.games = [];
            localStorage.removeItem('games');
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
             localStorage.setItem('teams', JSON.stringify(this.teams))
        }
    },
    components: {
        AddTeam,
        Message
    }
}
    
</script>


<style src="./assets/css/bulma.min.css"></style>
<style src="./assets/css/style.css"></style>
