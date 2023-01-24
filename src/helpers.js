const tournamentNames = ['A', 'B', 'C', 'D', 'E', 'F'];

function getGameResultInGroup(where, team1, team2, difference) {
    if (team1 === team2) {
        return '-'
    }
    let game;
    where.forEach(round => {
        round.forEach(gameInRound => {
            if (gameInRound.team_1 + gameInRound.team_2 === team1 + team2
                || gameInRound.team_2 + gameInRound.team_1 === team1 + team2) {
                game = gameInRound
            }
        })
    })
    if (game) {
        if (difference) {
            return team1 === game.team_1 ? (game.team_1_score - game.team_2_score) || 0
                : (game.team_2_score - game.team_1_score) || 0
        } else {
            return team1 === game.team_1 ? `${game.team_1_score || 0} : ${game.team_2_score || 0}`
                : `${game.team_2_score || 0} : ${game.team_1_score || 0}`
        }
    }
}

function getTournamentRanking(tournament, rankingTeams){
    let tournamentRanking = [];
    if(tournament.playOffBracket) {
        const playOffList = JSON.parse(JSON.stringify(tournament.playOffBracket.stages)).reverse();
        const thirdPlaceGame = JSON.parse(JSON.stringify(tournament.playOffBracket.thirdPlace));
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
                teamsInRanking.push(thirdPlace.title)
                const fourthPlace = {
                    place: '4',
                    title:thirdPlaceGame.team_1_score > thirdPlaceGame.team_2_score ? thirdPlaceGame.team_2 : thirdPlaceGame.team_1
                }
                tournamentRanking.push(fourthPlace)
                teamsInRanking.push(fourthPlace.title)
            } else {
                playOffList[i].teams.forEach(round => {
                    const teamTitle = teamsInRanking.includes(round.team_1) ? round.team_2 : round.team_1
                    const teamPlace = {
                        place: playOffList[i].stageLabel + 1 + '-' + playOffList[i].stageLabel * 2,
                        title: teamTitle,
                    }
                    tournamentRanking.push(teamPlace)
                    teamsInRanking.push(teamPlace.title)
                })
            }
        }

        if (tournament.games.length > 0){
            if(tournament.system === 'swiss' || (tournament.system === 'groups' && rankingTeams.length === 1)) {
                rankingTeams.slice(tournament.playOffBracket.stages[0].teamsCount, rankingTeams.length).forEach((team,index) =>{
                    const teamPlace = {
                        place: tournament.playOffBracket.stages[0].teamsCount + index + 1,
                        title: team.title,
                        players: team.players
                    }
                    tournamentRanking.push(teamPlace)
                })
            } else {
                const groupsCount = rankingTeams.length;
                const teamsCountPlayOff = tournament.playOffBracket.stages[0].teamsCount;
                let teamsGroupsAfterPlayOff = [];
                rankingTeams.forEach((group, index) => {
                    teamsGroupsAfterPlayOff[index] = group.slice(teamsCountPlayOff / groupsCount)
                });
                for (let i = 0; i < teamsGroupsAfterPlayOff[0].length; i++) {
                    teamsGroupsAfterPlayOff.forEach(group => {
                        const teamPlace = {
                            place: teamsCountPlayOff + i * 2 + 1 + '-' + (teamsCountPlayOff + i * 2 + 2),
                            title: group[i].title,
                        }
                        tournamentRanking.push(teamPlace);
                    });
                }
            }
        }
    } else {
        if(tournament.system === 'swiss' || (tournament.system === 'groups' && rankingTeams.length === 1)) {
            const rankingTeamsList = tournament.system === 'swiss' ? rankingTeams : rankingTeams[0];
            console.log(rankingTeamsList);
            rankingTeamsList.forEach((team,index) =>{
                const teamPlace = {
                    place: index + 1,
                    title: team.title,
                    players: team.players
                }
                tournamentRanking.push(teamPlace)
            })
        }
    }

    return tournamentRanking
}

export {tournamentNames, getGameResultInGroup, getTournamentRanking}