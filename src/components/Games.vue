<template>
    <div class="content tabs-content">
        <div class="field is-grouped">
            <div class="control">	
                <button class="button is-info" @click="drawRound" v-if="!roundIsActive && games.length < teamsCount">
                {{activeRound === 0 ? 'First' : `Draw ${activeRound}`}} Round</button>
            </div>
        </div>	
        <div v-if="games.length && roundIsActive">
           <h2 class="text-center">Round {{activeRound - 1}}</h2>
           <div class="games-list">
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
            </div>
            <div class="text-center">
                <button class="button is-success" @click="saveResults">Save results</button>
            </div>
        </div>
        <div v-else-if="games.length >= teamsCount">Rounds quantity can't be more than teams</div>
        <div v-else class="mb-5 mt-5">
           Please, click on button to draw <b>{{activeRound === 0 ? 'first' : activeRound }}</b> round
        </div>
    </div>
</template>


<script>
export default {
    name: 'Games',
    props: ['roundIsActive', 'activeRound', 'gamesList', 'teamsList', 'teamsCount', 'useRating'],
    emits: ['start-round', 'end-round', 'draw-round', 'update-teams', 'update-games', 'show-message'],
    data(){
        return {
            games: this.gamesList,
            teams: this.teamsList
        }
    },
    methods: {
        getRandomWithOneExclusion(lengthOfArray, indexToExclude = null){
          let rand = null;
            console.log(indexToExclude);
            while(rand === null || rand === indexToExclude){
               rand = Math.round(Math.random() * (lengthOfArray - 1));
               console.log(rand)
            }
          return rand;
        },
        generateCompetitors(teamList, reverse = false){ //функция для распределения пар
            let teamIndex, opponentIndex;
            if(this.activeRound === 0 && !this.useRating){
                teamIndex = this.getRandomWithOneExclusion(teamList.length);
                opponentIndex = this.getRandomWithOneExclusion(teamList.length, teamIndex);
                console.log(teamIndex, opponentIndex);
                return {teamIndex, opponentIndex};
            } else {
                teamIndex = reverse ? teamList.length - 1 : 0; //  команда для которой выбираем соперника (первая или последняя в списке в зависимости от флага). reverse - флаг, с какой стороны списка подбирать соперников
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
            }
            
        },
        drawRound(){
            this.$emit('start-round');
            let round = []; // массив куда будем сохранять пары соперников
            let teamsToDraw = this.teams; //список команд, которые надо пожеребить
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
                        technicalTeam = teamsToDraw[teamsToDraw.length - i];
                        if(!technicalTeam.opponents.includes('Technical')){
                            console.log(technicalTeam);
                            break;
                        }
                    }
                }
               game = {
                    team_1: technicalTeam.title,
                    team_1_score: 13,
                    team_2: 'Technical',
                    team_2_score: 7
                };
                round.push(game);
                teamsToDraw.splice(teamsToDraw.length   - 1, 1);
            }
            while(teamsToDraw.length > 0){ // вся магия здесь
                competitors = this.generateCompetitors(teamsToDraw, expandListIteration > 0); // определили пару команд
                while(competitors.opponentIndex === -1 && expandListIteration < stopExpandIndex){ // вот здесь самая большая проблема, по сути единственная. Если мы не смогли найти подходящего соперника (т.е. команды уже играли друг с другом), то я =>
                    expandListIteration++;
                    round.splice(round.length - 1, 1); // => убираю предыдущую пожеребенную пару
                    if(!teamsDrawed.length) { 
                        this.$emit('show-message', {title: 'Error', text : 'Sorry, shit happens', type: 'error'});
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
            
            this.$emit('draw-round', round); // записали в игры
        },
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
                        this.teams[firstTeamIndex].wins++
                     }
                } else if(!secondTeamIndex != -1 && game.team_2 !== "Technical"){
                    this.teams[secondTeamIndex].wins++
                }
            })
        
            localStorage.setItem('teams', JSON.stringify(this.teams));
            localStorage.setItem('games', JSON.stringify(this.games));
            this.$emit('end-round');
            this.$emit('show-message', 'Success', 'Your results saved');
        },
    },
}
</script>