<template>
    <div class="content tabs-content">
        <PlayOff v-if="tournament.playOff" @openResults="$emit('openResults')"/>
        <div v-else>
            <div class="field is-grouped">
                <div class="control" v-if="!tournament.playOff && !tournament.roundIsActive && tournament.games.length < teamsCount">
                    <button class="button is-info" @click="drawRound">
                        {{ activeRound === 1 ? 'First' : `Draw ${activeRound}` }} Round
                    </button>
                </div>
            </div>
            <div v-if="tournament.games.length && tournament.roundIsActive">
                <button class="button is-info is-hidden-tablet" @click="compactView = !compactView">Show <span
                    v-if="!compactView">&nbsp;Compact&nbsp;</span> <span v-if="compactView">&nbsp;Full&nbsp;</span> View
                </button>
                <h2 class="text-center">Round {{ activeRound }}</h2>
                <div class="games-list">
                    <div class="game-row" :class="{compact: compactView}"
                         v-for="(game, index) in tournament.games[activeRound - 1]" :key="index">
                        <span class="text-right team-block">
                            <label :for="'team_' + index">{{ game.team_1 }}</label>
                        </span>
                        <span class="text-center score-block">
                            <input :id="'team_' + index" v-model="game.team_1_score" class="input -small" type="number"
                                   min="0" max="13"
                                   :disabled="game.team_2 === 'Technical'" @keyup.enter="saveResults"
                                   v-if="!compactView">
                            <span class="lane-block is-size-7">
                                Lane <span class="is-size-5 has-text-weight-bold">{{ index + 1 }}</span>
                            </span>
                            <input :id="'opponent_' + index" v-model="game.team_2_score" class="input -small"
                                   type="number" min="0" max="13"
                                   :disabled="game.team_2 === 'Technical'" @keyup.enter="saveResults"
                                   v-if="!compactView">
                        </span>
                        <span class="team-block">
                            <label :for="'opponent_' + index">{{ game.team_2 }}</label>
                        </span>
                    </div>
                    <div v-if="scoreError" class="has-text-centered has-text-danger mb-5">Something wrong in games
                        results
                    </div>
                </div>
                <div class="text-center mt-3">
                    <button class="button is-success" @click="saveResults" :disabled=saveDisabled>Save results</button>
                </div>
                <div class="text-center mt-3" v-if="tournament.system === 'swiss' && tournament.games.length > 1 && tournament.roundIsActive">
                    <button class="button is-danger" @click="restoreRoundGames">
                        Restore previous round
                    </button>
                </div>
                <div class="has-text-danger mt-3" v-if="saveDisabled">There was an unexpectable error, sorry for that,
                    you can write developer about it (contact in footer), but this will not help you in this situation:))
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
    props: ['activeRound', 'teamsInGroup'],
    data() {
        return {
            saveDisabled: false,
            scoreError: false,
            compactView: false
        }
    },
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex', 'isAdmin']),
        tournament() {
            return this.tournaments[this.currentTournamentIndex]
        },
        teamsCount() {
            return this.tournament.system === 'swiss' ? this.tournament.teams.length - 1 :
                this.tournament.groups ? this.tournament.groups[0].length % 2 !== 0 ? this.tournament.groups[0].length :
                    this.tournament.groups[0].length - 1 : this.tournament.teams.length - 1;
        },
    },
    methods: {
        ...mapMutations(['startRound', 'endRound', 'addRoundToGames', 'restoreRound', 'showMessage']),
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
            let teamsToDraw = JSON.parse(JSON.stringify(this.tournament.teams)); //список команд, которые надо пожеребить
            let round = []; // массив куда будем сохранять пары соперников
            let game; // объект с соперниками

            if (this.tournament.system === 'swiss') {
                let expandListIteration = 0; // количество итераций, когда приходится увеличивать кол-во команд (понятно будет дальше)
                let stopExpandIndex = Math.round(teamsToDraw.length / 2 - 1); // максимально возможное число, когда можно увеличивать список команд
                let teamsDrawed = []; //массив с уже пожеребенными командами
                let competitors; // пара которая получается в результате вызова generateCompetitors()

                const isTechnical = teamsToDraw.length % 2 !== 0; // это только в случае нечетного кол-ва команд, сейчас не важно

                if (isTechnical) { //if has to be technical team
                    let technicalTeamIndex = this.tournament.useRating || this.activeRound !== 1 ? teamsToDraw.length - 1 : this.getRandomWithOneExclusion(teamsToDraw.length);
                    let technicalTeam = teamsToDraw[technicalTeamIndex];  // это только в случае нечетного кол-ва команд, сейчас не важно
                    if (technicalTeam.opponents.includes('Technical')) {
                        for (let i = 2; i < teamsToDraw.length; i++) {
                            technicalTeamIndex = teamsToDraw.length - i
                            technicalTeam = teamsToDraw[technicalTeamIndex];
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
                        this.showMessage({title: 'Can\'t draw this round', text: 'Too mush games for swiss with this number of teams. Sorry, shit happens', type: 'error'});
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
                this.startRound();

            } else if (this.tournament.system === 'groups') {
                if (this.activeRound === 1) {
                    this.createGroups();
                }
                if(this.tournament.groups) {
                    this.tournament.groups.forEach((group, index) => {
                        const isTechnical = group.length % 2 !== 0;
                        if (this.tournament.games.length < (isTechnical ? group.length : group.length - 1)) {
                            for (let i = 0; i < this.tournament.groupsScheme[index].top.length; i++) {
                                if(!isTechnical || isTechnical
                                    && (this.tournament.groupsScheme[index].top[i] !== group.length && this.tournament.groupsScheme[index].bottom[i] !== group.length)) {
                                    game = {
                                        group: index,
                                        team_1: group[this.tournament.groupsScheme[index].top[i]].title,
                                        team_1_score: null,
                                        team_2: group[this.tournament.groupsScheme[index].bottom[i]].title,
                                        team_2_score: null
                                    }
                                    round.push(game);
                                }
                            }

                            this.tournament.groupsScheme[index].bottom.push(this.tournament.groupsScheme[index].top[this.tournament.groupsScheme[index].top.length - 1])
                            this.tournament.groupsScheme[index].top.unshift(this.tournament.groupsScheme[index].bottom[0]);
                            this.tournament.groupsScheme[index].top.splice(this.tournament.groupsScheme[index].top.length - 1, 1);
                            this.tournament.groupsScheme[index].top.splice(1, 1);
                            this.tournament.groupsScheme[index].top.unshift(0);
                            this.tournament.groupsScheme[index].bottom.splice(0, 1)
                        }
                    });

                    this.addRoundToGames(this.shuffleArray(round)); // записали в игры
                    this.startRound();
                }
            }
        },
        createGroups() {
            if(this.teamsInGroup < 3) {
                this.showMessage({title: 'Can\'t draw', text: `Choose correct number of teams in group`, type: 'error'});
                return false;
            }
            const groupsQuantity = Math.round(this.tournament.teams.length / this.teamsInGroup);
            let groups = [];
            for (let i = 1; i <= groupsQuantity; i++) {
                groups.push([]);
            }
            let teamsToDraw = JSON.parse(JSON.stringify(this.tournament.teams.sort((a, b) => b.rating - a.rating)));

            if (this.tournament.useRating && groupsQuantity === 2 && teamsToDraw.length < 33) {
                const indexesScheme = {
                    0: [1,32,16,17,9,24,8,25,5,28,12,21,13,20,4,29],
                    1: [3,30,14,19,11,22,6,27,7,26,10,23,15,18,2,31]
                };
                Object.keys(indexesScheme).forEach(key => {
                    indexesScheme[key].forEach(item => {
                        const teamIndexInList = teamsToDraw[item - 1] ? this.tournament.teams.findIndex(team => team.title === teamsToDraw[item - 1].title) : -1;
                        if(teamIndexInList !== -1) {
                            groups[key].push(this.tournament.teams[teamIndexInList])
                        }
                    })
                })
                /*let groupQueue = 0;
                let firstIteration = true;
                let drawIteration = 1;
                while (teamsToDraw.length >= 1) {
                    let teamIndexes = [0, teamsToDraw.length - 1];
                    if (firstIteration && this.tournament.teams.length % 2 !== 0) {
                        teamIndexes.push(teamsToDraw.length - 2);
                    }
                    teamIndexes.forEach(teamIndex => {
                        if (teamIndex !== -1 && teamsToDraw.length >= 1) {
                            const teamIndexInList = this.tournament.teams.findIndex(team => team.title === teamsToDraw[teamIndex].title)
                            groups[groupQueue].push(this.tournament.teams[teamIndexInList])
                            delete teamsToDraw[teamIndex];
                        }
                    });
                    teamsToDraw = teamsToDraw.filter(el => el != null);

                    if (drawIteration === 2) {
                        drawIteration--
                        groupQueue = groupQueue === 1 ? 0 : 1;
                    } else {
                        drawIteration++
                    }
                    if (firstIteration) {
                        drawIteration = 1;
                        groupQueue = 1;
                    }
                    firstIteration = false;
                    if(this.teamsInGroup % 2 !== 0 && this.tournament.teams.length % 2 === 0 && teamsToDraw.length === 2 && groupsQuantity === 2) {
                        const teamIndexBeforeLast = this.tournament.teams.findIndex(team => team.title === teamsToDraw[1].title);
                        groups[0].push(this.tournament.teams[teamIndexBeforeLast]);
                        const teamIndexLast = this.tournament.teams.findIndex(team => team.title === teamsToDraw[0].title);
                        groups[1].push(this.tournament.teams[teamIndexLast]);
                        teamsToDraw.splice(0, 2)
                    }
                }*/
            } else {
                while (teamsToDraw.length >= 1) {
                    for (let j = 0; j < teamsToDraw.length; j++) {
                        for (let i = 0; i < groupsQuantity; i++) {
                            const teamIndex = this.tournament.useRating ? 0 : this.getRandomWithOneExclusion(teamsToDraw.length);
                            if (teamIndex !== -1 && teamsToDraw.length >= 1) {
                                const teamIndexInList = this.tournament.teams.findIndex(team => team.title === teamsToDraw[teamIndex].title)
                                groups[i].push(this.tournament.teams[teamIndexInList])
                                teamsToDraw.splice(teamIndex, 1);
                            }
                        }
                    }
                }
            }

            this.tournament.groups = groups;

            let schemas = [];

            this.tournament.groups.forEach(group => {
                group.sort((a, b) => b.rating - a.rating);

                let groupIndexes = [];
                group.forEach((item, index) => {
                    groupIndexes.push(index)
                });

                if(group.length % 2 !== 0) {
                    groupIndexes.push(group.length);
                }

                let scheme = {
                    top: [],
                    bottom: []
                }

                for (let i = 0; i < groupIndexes.length / 2; i++) {
                    scheme.top.push(i)
                }

                for (let i = groupIndexes.length - 1; i >= groupIndexes.length / 2; i--) {
                    scheme.bottom.push(i)
                }

                schemas.push(scheme)
            });

            this.tournament.groupsScheme = schemas;

        },
        saveResults() {
            this.scoreError = false;

            const resultsError = (game) => game.team_1_score === game.team_2_score || (game.team_1_score === null || game.team_1_score < 0 || game.team_1_score > 13) || (game.team_2_score === null || game.team_2_score < 0 || game.team_2_score > 13)
            if (this.tournament.games[this.activeRound - 1].some(game => resultsError(game))) {
                this.scoreError = true;
                return false
            }

            this.saveResultsForRound(this.activeRound - 1);
            this.endRound();
            this.showMessage({title: 'Success', text: 'Your results saved'})
        },
        restoreRoundGames(){
            this.restoreRound();
            this.tournament.teams.forEach(team => {
                team.opponents = [];
                team.pointsPlus = 0;
                team.pointsMinus = 0;
                team.wins = 0;
            })
            for (let i = 0; i < this.activeRound - 2; i++) {
                this.saveResultsForRound(i);
            }
        },
        saveResultsForRound(round) {
            this.tournament.games[round].forEach(game => {
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
        },
        shuffleArray(array) {
            let currentIndex = array.length, randomIndex;
            while (currentIndex != 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                [array[currentIndex], array[randomIndex]] = [
                    array[randomIndex], array[currentIndex]];
            }
            if (this.tournament.system === 'swiss' && this.tournament.teams.length % 2 !== 0) {
                const technicalGameIndex = array.findIndex(game => game.team_2 === 'Technical');
                const technicalGame = array[technicalGameIndex];
                array.splice(technicalGameIndex, 1);
                array.push(technicalGame)
            }
            return array;
        }
    },
}
</script>