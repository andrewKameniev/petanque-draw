const tournamentNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'I'];

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
        const thirdPlaceGame = tournament.playOffBracket.thirdPlace ? JSON.parse(JSON.stringify(tournament.playOffBracket.thirdPlace)) : undefined;
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
                if (thirdPlaceGame) {
                    const thirdPlace = {
                        place: thirdPlaceGame.team_1_score && thirdPlaceGame.team_2_score ? '3' : '3-4',
                        title: thirdPlaceGame.team_1_score && thirdPlaceGame.team_2_score ? thirdPlaceGame.team_1_score > thirdPlaceGame.team_2_score ? thirdPlaceGame.team_1 : thirdPlaceGame.team_2 : thirdPlaceGame.team_1
                    }
                    tournamentRanking.push(thirdPlace)
                    teamsInRanking.push(thirdPlace.title)
                    const fourthPlace = {
                        place: thirdPlaceGame.team_1_score && thirdPlaceGame.team_2_score ? '4' : '3-4',
                        title: thirdPlaceGame.team_1_score && thirdPlaceGame.team_2_score ? thirdPlaceGame.team_1_score > thirdPlaceGame.team_2_score ? thirdPlaceGame.team_2 : thirdPlaceGame.team_1 : thirdPlaceGame.team_2
                    }
                    tournamentRanking.push(fourthPlace)
                    teamsInRanking.push(fourthPlace.title)
                }
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

        if (tournament.games?.length > 0){
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
                        if(group[i]) {
                            const teamPlace = {
                                place: teamsCountPlayOff + i * groupsCount + 1 + '-' + (teamsCountPlayOff + i * groupsCount + groupsCount),
                                title: group[i].title,
                            }
                            tournamentRanking.push(teamPlace);
                        }
                    });
                }
            }
        }
    } else {
        if(tournament.system === 'swiss' || (tournament.system === 'groups' && rankingTeams?.length === 1)) {
            const rankingTeamsList = tournament.system === 'swiss' ? rankingTeams : rankingTeams[0];
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

function sortTeams(teamsToSort) {
    countBuhgolts(teamsToSort, 'buhgolts');
    countBuhgolts(teamsToSort, 'smallBuhgolts');
    return teamsToSort.sort((a, b) => b.wins - a.wins || b.buhgolts - a.buhgolts || b.smallBuhgolts - a.smallBuhgolts || (b.pointsPlus - b.pointsMinus) - (a.pointsPlus - a.pointsMinus) || b.rating - a.rating);
}

function countBuhgolts(whereCount, whatBuhgolts) {
    const whatCount = whatBuhgolts === 'buhgolts' ? 'wins' : 'buhgolts';
    whereCount.forEach(team => {
        let currentTeamBuhgolts = 0;
        if (team.opponents[0] !== 'placeholder' && team.opponents.length) {
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
}

function sortTeamsForSupermele(teamsToSort) {
    return teamsToSort.sort((a, b) => b.wins - a.wins || (b.pointsPlus - b.pointsMinus) - (a.pointsPlus - a.pointsMinus) || b.pointsPlus - a.pointsPlus || b.rating - a.rating);
}
function getTeamsRanking(tournament, activeRound) {
    if (tournament.teams) {
        if (tournament.system === 'groups' && activeRound > 1) {
            let sortedGroups = [];

            tournament.groups.forEach(group => {
                group.forEach(team => {
                    const teamInfo = tournament.teams.find(item => item.title === team.title);
                    team.wins = teamInfo.wins;
                    team.opponents = teamInfo.opponents;
                    team.pointsPlus = teamInfo.pointsPlus;
                    team.pointsMinus = teamInfo.pointsMinus;

                    let directPoints = 0;
                    let directWins = 0;
                    if (team.opponents) {
                        team.opponents.forEach(opponent => {
                            const opponentIndex = tournament.teams.findIndex(team => team.title === opponent);
                            if (opponentIndex !== -1 && team.wins === tournament.teams[opponentIndex].wins) {
                                if (getGameResultInGroup(tournament.games, team.title, tournament.teams[opponentIndex].title, true) > 0) {
                                    directWins++
                                }
                                directPoints += getGameResultInGroup(tournament.games, team.title, tournament.teams[opponentIndex].title, true)
                            }
                        })
                        team.directWins = directWins;
                        team.directPoints = directPoints;
                    }

                })
                let groupRanking = group.slice().sort((a, b) => b.wins - a.wins || b.directWins - a.directWins || b.directPoints - a.directPoints || (b.pointsPlus - b.pointsMinus) - (a.pointsPlus - a.pointsMinus))
                sortedGroups.push(groupRanking);
            });
            return sortedGroups;
        } else if (tournament.system === 'supermele') {
            return sortTeamsForSupermele(tournament.teams)
        } else if (tournament.system === 'swiss') {
            return sortTeams(tournament.teams);
        }
    } else {
        return []
    }
}
function gameHasError(game) {
    return (game.team_1_score && game.team_2_score) && game.team_1_score === game.team_2_score || (game.team_1_score < 0 || game.team_1_score > this.tournament.preferences.maxScore) || (game.team_2_score < 0 || game.team_2_score > this.tournament.preferences.maxScore)
}
function copyContent(data) {
    const el = document.createElement('div')
    el.innerHTML = data.trim()
    document.body.appendChild(el)
    const range = new Range()
    range.selectNode(el)
    const select = window.getSelection()
    select.removeAllRanges()
    select.addRange(range)
    document.execCommand('copy')
    el.remove()
}

const regions = {
    1: 'Київ',
    2: 'Харківська',
    3: 'Харківська',
    4: 'Закарпатська',
    6: 'Харківська',
    10: 'Закарпатська',
    11: 'Київська',
    13: 'Закарпатська',
    14: 'Львівська',
    16: 'Київська',
    17: 'Полтавська',
    19: 'Київська',
    20: 'Закарпатська',
}

export {tournamentNames, getGameResultInGroup, getTournamentRanking, getTeamsRanking, gameHasError, copyContent, regions}