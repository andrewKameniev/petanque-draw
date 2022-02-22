<template>
    <div>
        <div v-if="isPlayOff && tournamentIsFinished" class="mb-5">
            <div class="is-flex is-justify-content-space-between is-align-content-center">
                <h2>Tournament Result</h2>
                <button class="button is-info" @click="copyResults">Copy results</button>
            </div>
            <div class="table-container">
                <table id="table-finish-ranking" class="table">
                    <thead>
                        <tr>
                            <th>Place</th>
                            <th>Team</th>
                            <th>Players</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(team, index) in tournamentRanking" :key="index">
                            <td>{{ team.place }}</td>
                            <td>{{ team.title}}</td>
                            <td>
                                <div class="is-size-7">
                                    (<span class="has-text-dark" v-for="(player, index) in getTeamPlayers(team.title)" :key="index">
                                    {{player.name}} {{player.surname}}<span v-if="index < getTeamPlayers(team.title).length - 1">, </span>
                                      </span>)
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div v-if="gamesList.length > 0">
            <h2>Ranking after <span v-if="activeRound">{{activeRound - 1}} round{{activeRound > 1 && activeRound !== 0 ? 's' : '' }}</span> swiss</h2>
            <div class="table-container">
                <table id="table-ranking" class="table">
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Team</th>
                        <th>Wins</th>
                        <th>Buh</th>
                        <th>SBuh</th>
                        <th>Points</th>
                        <th v-if="showIfUseRating">Rating</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="team in rankingTeams" :key="team.title">
                        <td><span class="team-count"></span></td>
                        <td>{{team.title}}</td>
                        <td align="center">{{team.wins}}</td>
                        <td align="center">{{team.buhgolts}}</td>
                        <td align="center">{{team.smallBuhgolts}}</td>
                        <td align="center">{{team.pointsPlus}}:{{team.pointsMinus}}</td>
                        <td v-if="showIfUseRating">{{team.rating}}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>


<script>
export default {
    name: 'Ranking',
    props: ['showIfUseRating', 'isPlayOff', 'rankingTeams', 'activeRound', 'gamesList'],
    emits: ['is-playoff'],
    data(){
        return {
            playOffBracket: localStorage.getItem('playOffBracket') ?  JSON.parse(localStorage.getItem('playOffBracket')) : null
        }
    },
    methods: {
        copyResults() {
            const el = document.createElement('div')
            let content = ''
            this.tournamentRanking.forEach(item => {
                content = content + '<span>' + item.place + '</span><p>' + item.title + '</p>'
            })
            el.innerHTML = content.trim()
            document.body.appendChild(el)
            const range = new Range()
            range.selectNode(el)
            const select = window.getSelection()
            select.removeAllRanges()
            select.addRange(range)
            document.execCommand('copy')
            el.remove()
        },
        getTeamPlayers(title){
            return this.rankingTeams.find(item => item.title === title).players
        }
    },
    computed: {
        tournamentIsFinished(){
            return localStorage.getItem('playOffStage') ? JSON.parse(localStorage.getItem('playOffStage')) === 0 : false
        },
        tournamentRanking(){
            let tournamentRanking = [];
            const playOffList = JSON.parse(JSON.stringify(this.playOffBracket.stages)).reverse();
            const thirdPlaceGame = JSON.parse(JSON.stringify(this.playOffBracket.thirdPlace));
            let teamsInRanking = [];
            for (let i = 0; i < playOffList.length; i++){
                if(playOffList[i].stageLabel === 1){
                    const firstPlace = {
                        place: '1',
                        title: playOffList[i].teams[0].team_1_score > playOffList[i].teams[0].team_2_score ? playOffList[i].teams[0].team_1 : playOffList[i].teams[0].team_2
                    }
                    tournamentRanking.push(firstPlace)
                    teamsInRanking.push(firstPlace.title)
                    const secondPlace = {
                        place: '2',
                        title: playOffList[i].teams[0].team_1_score > playOffList[i].teams[0].team_2_score ? playOffList[i].teams[0].team_2 : playOffList[i].teams[0].team_1
                    }
                    tournamentRanking.push(secondPlace)
                    teamsInRanking.push(secondPlace.title)
                } else if(playOffList[i].stageLabel === 2){
                    const thirdPlace = {
                        place: '3',
                        title: thirdPlaceGame.team_1_score > thirdPlaceGame.team_2_score ? thirdPlaceGame.team_1 : thirdPlaceGame.team_2
                    }
                    tournamentRanking.push(thirdPlace)
                    console.log(tournamentRanking);
                    teamsInRanking.push(thirdPlace.title)
                    const fourthPlace = {
                        place: '4',
                        title:thirdPlaceGame.team_1_score > thirdPlaceGame.team_2_score ? thirdPlaceGame.team_2 : thirdPlaceGame.team_1
                    }
                    tournamentRanking.push(fourthPlace)
                    console.log(tournamentRanking);
                    teamsInRanking.push(fourthPlace.title)
                } else {
                    playOffList[i].teams.forEach(round => {
                        const teamTitle = teamsInRanking.includes(round.team_1) ? round.team_2 : round.team_1
                        const teamPlace = {
                            place: playOffList[i].stageLabel + 1 + '-' + playOffList[i].stageLabel * 2,
                            title: teamTitle
                        }
                        tournamentRanking.push(teamPlace)
                        teamsInRanking.push(teamPlace.title)
                    })

                    if (this.gamesList.length > 0){
                        this.rankingTeams.slice(this.playOffBracket.stages[0].teamsCount, this.rankingTeams.length).forEach((team,index) =>{
                            const teamPlace = {
                                place: this.playOffBracket.stages[0].teamsCount + index + 1,
                                title: team.title
                            }
                            tournamentRanking.push(teamPlace)
                        })
                    }
                }
            }
            return tournamentRanking
        }
    },
}
</script>