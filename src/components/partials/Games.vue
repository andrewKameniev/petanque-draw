<template>
    <div class="content tabs-content">
        <PlayOff v-if="tournament.playOff" @openResults = "$emit('openResults')"/>
        <div v-else>
            <div class="field is-grouped" v-if="!tournament.playOff && !tournament.roundIsActive && tournament.games.length < teamsCount">
                <div class="control">
                    <button class="button is-info" @click="drawRound">
                        {{ activeRound === 1 ? 'First' : `Draw ${activeRound}` }} Round
                    </button>
                </div>
            </div>
            <div v-if="tournament.games.length && tournament.roundIsActive">
              <button class="button is-info is-hidden-tablet" @click="compactView = !compactView">Show <span v-if="!compactView">&nbsp;Compact&nbsp;</span> <span v-if="compactView">&nbsp;Full&nbsp;</span> View</button>
                <h2 class="text-center">Round {{ activeRound }}</h2>
                <div class="games-list">
                    <div class="game-row" :class="{compact: compactView}" v-for="(game, index) in tournament.games[activeRound - 1]" :key="index">
                    <span class="text-right team-block">
                        <label :for="'team_' + index">{{ game.team_1 }}</label>
                    </span>
                        <span class="text-center score-block">
                        <input :id="'team_' + index" v-model="game.team_1_score" class="input -small" type="number" min="0" max="13"
                               :disabled="game.team_2 === 'Technical'" @keyup.enter="saveResults" v-if="!compactView">
                        <span class="lane-block is-size-7">
                            Lane <span class="is-size-5 has-text-weight-bold">{{ index + 1 }}</span>
                        </span>
                        <input :id="'opponent_' + index" v-model="game.team_2_score" class="input -small" type="number" min="0" max="13"
                               :disabled="game.team_2 === 'Technical'" @keyup.enter="saveResults" v-if="!compactView">
                    </span>
                        <span class="team-block">
                        <label :for="'opponent_' + index">{{ game.team_2 }}</label>
                    </span>
                    </div>
                    <div v-if="scoreError" class="has-text-centered has-text-danger mb-5">Something wrong in games results</div>
                </div>
                <div class="text-center mt-3">
                    <button class="button is-success" @click="saveResults" :disabled=saveDisabled>Save results</button>
                </div>
                <div class="has-text-danger mt-3" v-if="saveDisabled">There was an unexpectable error, sorry for that, you
                    can
                    write developer about it (contact in footer), but this will not help you in this situation:))
                </div>
            </div>
            <div v-else-if="tournament.games.length === 0">No games, yet</div>
            <div v-else-if="tournament.games.length >= teamsCount">Rounds quantity can't be more than teams</div>
            <div v-else class="mb-5 mt-5">
                Please, click on button to draw <b>{{ activeRound === 1 ? 'first' : activeRound }}</b> round
            </div>
        </div>
    </div>
</template>

<script>

import PlayOff from './PlayOff';
import {mapMutations, mapState} from "vuex";
export default {
    name: 'Games',
    components: {PlayOff},
    props: ['teamsList', 'activeRound'],
    emits: ['draw-round'],
    data() {
        return {
            saveDisabled: false,
            scoreError: false,
            compactView: false
        }
    },
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex']),
        tournament() {
            return this.tournaments[this.currentTournamentIndex]
        },
        teamsCount() {
            return this.tournament.teams.length - 1
        },
    },
    methods: {
        ...mapMutations(['startRound', 'endRound', 'addRoundToGames', 'showMessage']),
        getRandomWithOneExclusion(lengthOfArray, indexToExclude = null) { // для определения рандомного соперника, если жеребим не по рейтингу
            let rand = null;
            while (rand === null || rand === indexToExclude) {
                rand = Math.round(Math.random() * (lengthOfArray - 1));
            }
            return rand;
        },
        generateCompetitors(teamList, reverse = false) { //функция для распределения пар
            let teamIndex, opponentIndex;
            if (this.activeRound === 1 && !this.tournament.useRating) {
                teamIndex = this.getRandomWithOneExclusion(teamList.length);
                opponentIndex = this.getRandomWithOneExclusion(teamList.length, teamIndex);
                return {teamIndex, opponentIndex};
            } else {
                teamIndex = reverse ? teamList.length - 1 : 0; //  команда для которой выбираем соперника (первая или последняя в списке в зависимости от флага). reverse - флаг, с какой стороны списка подбирать соперников
                const defaultOpponentIndex = this.activeRound === 1 ? teamList.length / 2 : 1; // команда-соперник по умолчанию - вторая в списке. Если первый тур, то вторая во второй группе
                let opponentIndex = reverse ? teamList.length - 2 : defaultOpponentIndex; // даем соперника. В зависимости от флага - второй в списке или предпоследний
                while (teamList[teamIndex].opponents.includes(teamList[opponentIndex].title)) { // проверяем, играли ли эти команды друг с другом (у каждой формируеится массив с соперниками)
                    reverse ? opponentIndex-- : opponentIndex++; // если играли, то подбираем соперника следующего по списку в зависимости от флага

                    if (!teamList[opponentIndex]) { // если не удалось подобрать соперника, так и говорим
                        opponentIndex = -1;
                        return {teamIndex, opponentIndex};
                    }
                }
                return {teamIndex, opponentIndex}; // отдали пару
            }

        },
        drawRound() {
            this.startRound();
            let round = []; // массив куда будем сохранять пары соперников
            let teamsToDraw = JSON.parse(JSON.stringify(this.tournament.teams)); //список команд, которые надо пожеребить
            let expandListIteration = 0; // количество итераций, когда приходится увеличивать кол-во команд (понятно будет дальше)
            let stopExpandIndex = teamsToDraw.length / 2 - 1; // максимально возможное число, когда можно увеличивать список команд
            let teamsDrawed = []; //массив с уже пожеребенными командами
            let competitors; // пара которая получается в результате вызова generateCompetitors()
            let game; // объект с соперниками
            const isTechnical = teamsToDraw.length % 2 !== 0; // это только в случае нечетного кол-ва команд, сейчас не важно

            if (isTechnical) { //if has to be technical team
              const technicalTeamIndex = this.tournament.useRating || this.activeRound !== 1 ? teamsToDraw.length - 1 : this.getRandomWithOneExclusion(teamsToDraw.length);
              let technicalTeam = this.tournament.useRating ? teamsToDraw[technicalTeamIndex] : teamsToDraw[technicalTeamIndex];  // это только в случае нечетного кол-ва команд, сейчас не важно
                if (technicalTeam.opponents.includes('Technical')) {
                    for (let i = 2; i < teamsToDraw.length; i++) {
                        technicalTeam = teamsToDraw[teamsToDraw.length - i];
                        if (!technicalTeam.opponents.includes('Technical')) {
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
                teamsToDraw.splice(technicalTeamIndex, 1);
            }
            while (teamsToDraw.length > 0) { // вся магия здесь
                competitors = this.generateCompetitors(teamsToDraw, expandListIteration > 0); // определили пару команд
                while (competitors.opponentIndex === -1 && expandListIteration < stopExpandIndex) { // вот здесь самая большая проблема, по сути единственная. Если мы не смогли найти подходящего соперника (т.е. команды уже играли друг с другом), то я =>
                    expandListIteration++;
                    round.splice(round.length - 1, 1); // => убираю предыдущую пожеребенную пару
                    teamsToDraw.unshift(teamsDrawed[teamsDrawed.length - 1]); // => добавляю в список, который надо пожеребить две предыдущие команды
                    teamsToDraw.unshift(teamsDrawed[teamsDrawed.length - 2]);
                    teamsDrawed.splice(teamsDrawed.length - 2, 2); // => убираю предыдущую пожеребенную пару с массива пожеребенных
                    competitors = this.generateCompetitors(teamsToDraw, true); // => ищу соперников начиная не с верха списка, а снизу
                }
                if (expandListIteration === stopExpandIndex && competitors.opponentIndex === -1) { // если пробежали сверху вниз и снизу вверх и не нашли пару
                    this.saveDisabled = true
                    this.showMessage({title: 'Can\'t draw this round', text: 'Sorry, shit happens', type: 'error'});
                    return
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

                if (game) {
                    round.push(game) // записали в раунд
                } else {
                    console.log("Game is empty");
                }
            } // когда в массиве пожеребенных не осталось команд, заканчиваем цикл
            this.addRoundToGames(this.shuffleArray(round)); // записали в игры
        },
        saveResults() {
            this.scoreError = false;

            const resultsError = (game) => game.team_1_score === game.team_2_score || (game.team_1_score === null || game.team_1_score < 0 || game.team_1_score > 13) || (game.team_2_score === null || game.team_2_score < 0 || game.team_2_score > 13)
            if(this.tournament.games[this.activeRound - 1].some(game => resultsError(game))){
                this.scoreError = true;
                return false
            }

            this.tournament.games[this.activeRound - 1].forEach(game => {
                const firstTeamIndex = this.tournament.teams.findIndex(item => item.title === game.team_1);
                if (firstTeamIndex != -1) {
                    this.tournament.teams[firstTeamIndex].opponents.push(game.team_2);
                    this.tournament.teams[firstTeamIndex].pointsPlus += game.team_1_score;
                    this.tournament.teams[firstTeamIndex].pointsMinus += game.team_2_score;
                }
                const secondTeamIndex = this.tournament.teams.findIndex(item => item.title === game.team_2);
                if (secondTeamIndex != -1) {
                    this.tournament.teams[secondTeamIndex].opponents.push(game.team_1);
                    this.tournament.teams[secondTeamIndex].pointsPlus += game.team_2_score;
                    this.tournament.teams[secondTeamIndex].pointsMinus += game.team_1_score;
                }
                if (game.team_1_score > game.team_2_score) {
                    if (firstTeamIndex != -1) {
                        this.tournament.teams[firstTeamIndex].wins++
                    }
                } else if (!secondTeamIndex != -1 && game.team_2 !== "Technical") {
                    this.tournament.teams[secondTeamIndex].wins++
                }
            })

            this.endRound();
            this.showMessage({title: 'Success', text: 'Your results saved'})
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
    },
}
</script>