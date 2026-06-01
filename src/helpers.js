const tournamentNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'I'];

function getGameResultInGroup(where, team1, team2, difference) {
    if (team1 === team2) {
        return '-'
    }
    const results = [];
    where.forEach(round => {
        round.forEach(gameInRound => {
            if (gameInRound.team_1 + gameInRound.team_2 === team1 + team2) {
                results.push({
                    score1: gameInRound.team_1_score || 0,
                    score2: gameInRound.team_2_score || 0
                });
            } else if (gameInRound.team_2 + gameInRound.team_1 === team1 + team2) {
                results.push({
                    score1: gameInRound.team_2_score || 0,
                    score2: gameInRound.team_1_score || 0
                });
            }
        })
    })
    if (results.length) {
        if (difference) {
            return results.reduce((sum, r) => sum + (r.score1 - r.score2), 0) || 0
        } else {
            return results.map(r => `${r.score1} : ${r.score2}`).join('\n')
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
            if(playOffList[i].stageLabel === 'cadrage') continue;
            if(playOffList[i].stageLabel === 1){
                const firstPlace = {
                    place: '1',
                    title: playOffList[i].teams[0].team_1_score > playOffList[i].teams[0].team_2_score ? playOffList[i].teams[0].team_1 : playOffList[i].teams[0].team_2,
                    players: tournament.teams.find(team => team.title === (playOffList[i].teams[0].team_1_score > playOffList[i].teams[0].team_2_score ? playOffList[i].teams[0].team_1 : playOffList[i].teams[0].team_2))?.players || []
                }
                tournamentRanking.push(firstPlace)
                teamsInRanking.push(firstPlace.title)
                const secondPlace = {
                    place: '2',
                    title: playOffList[i].teams[0].team_1_score > playOffList[i].teams[0].team_2_score ? playOffList[i].teams[0].team_2 : playOffList[i].teams[0].team_1,
                    players: tournament.teams.find(team => team.title === (playOffList[i].teams[0].team_1_score > playOffList[i].teams[0].team_2_score ? playOffList[i].teams[0].team_2 : playOffList[i].teams[0].team_1))?.players || []
                }
                tournamentRanking.push(secondPlace)
                teamsInRanking.push(secondPlace.title)
            } else if(playOffList[i].stageLabel === 2){
                if (thirdPlaceGame) {
                    const thirdPlace = {
                        place: thirdPlaceGame.team_1_score && thirdPlaceGame.team_2_score ? '3' : '3-4',
                        title: thirdPlaceGame.team_1_score && thirdPlaceGame.team_2_score ? thirdPlaceGame.team_1_score > thirdPlaceGame.team_2_score ? thirdPlaceGame.team_1 : thirdPlaceGame.team_2 : thirdPlaceGame.team_1,
                        players: tournament.teams.find(team => team.title === (thirdPlaceGame.team_1_score && thirdPlaceGame.team_2_score ? thirdPlaceGame.team_1_score > thirdPlaceGame.team_2_score ? thirdPlaceGame.team_1 : thirdPlaceGame.team_2 : thirdPlaceGame.team_1))?.players || []
                    }
                    tournamentRanking.push(thirdPlace)
                    teamsInRanking.push(thirdPlace.title)
                    const fourthPlace = {
                        place: thirdPlaceGame.team_1_score && thirdPlaceGame.team_2_score ? '4' : '3-4',
                        title: thirdPlaceGame.team_1_score && thirdPlaceGame.team_2_score ? thirdPlaceGame.team_1_score > thirdPlaceGame.team_2_score ? thirdPlaceGame.team_2 : thirdPlaceGame.team_1 : thirdPlaceGame.team_2,
                        players: tournament.teams.find(team => team.title === (thirdPlaceGame.team_1_score && thirdPlaceGame.team_2_score ? thirdPlaceGame.team_1_score > thirdPlaceGame.team_2_score ? thirdPlaceGame.team_2 : thirdPlaceGame.team_1 : thirdPlaceGame.team_2))?.players || []
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
                        players: tournament.teams.find(team => team.title === teamTitle)?.players || []
                    }
                    tournamentRanking.push(teamPlace)
                    teamsInRanking.push(teamPlace.title)
                })
            }
        }

        const cadrageStage = tournament.playOffBracket.stages.find(s => s.stageLabel === 'cadrage');
        if (cadrageStage) {
            const cadrageGamesPlayed = cadrageStage.teams.some(g => g.team_1_score != null);
            if (cadrageGamesPlayed) {
                const cadrageRangeStart = teamsInRanking.length + 1;
                const cadrageRangeEnd = cadrageRangeStart + cadrageStage.teams.length - 1;
                const cadragePlace = cadrageRangeStart + '-' + cadrageRangeEnd;
                cadrageStage.teams.forEach(game => {
                    const loser = game.team_1_score > game.team_2_score ? game.team_2 : game.team_1;
                    if (!teamsInRanking.includes(loser)) {
                        tournamentRanking.push({
                            place: cadragePlace,
                            title: loser,
                            players: tournament.teams.find(team => team.title === loser)?.players || []
                        });
                        teamsInRanking.push(loser);
                    }
                });
            }
        }

        if (tournament.games?.length > 0){
            if(tournament.system === 'swiss' || ((tournament.system === 'groups' || tournament.system === 'poules') && rankingTeams.length === 1)) {
                const remainingTeams = rankingTeams.filter(team => !teamsInRanking.includes(team.title));
                const rangeStart = teamsInRanking.length + 1;
                remainingTeams.forEach((team, index) => {
                    const teamPlace = {
                        place: rangeStart + index,
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
        if(tournament.system === 'swiss' || ((tournament.system === 'groups' || tournament.system === 'poules') && rankingTeams?.length === 1)) {
            const rankingTeamsList = tournament.system === 'swiss' ? rankingTeams : rankingTeams[0];
            rankingTeamsList.forEach((team,index) =>{
                const teamPlace = {
                    place: index + 1,
                    title: team.title,
                    players: team.players
                }
                tournamentRanking.push(teamPlace)
            })
        } else if ((tournament.system === 'groups' || tournament.system === 'poules') && rankingTeams?.length > 1) {
            const groupsCount = rankingTeams.length;
            const maxTeams = Math.max(...rankingTeams.map(g => g.length));
            for (let i = 0; i < maxTeams; i++) {
                rankingTeams.forEach(group => {
                    if (group[i]) {
                        const placeStart = i * groupsCount + 1;
                        const placeEnd = placeStart + groupsCount - 1;
                        tournamentRanking.push({
                            place: placeStart === placeEnd ? placeStart : `${placeStart}-${placeEnd}`,
                            title: group[i].title,
                            players: group[i].players
                        });
                    }
                });
            }
        }
    }

    return tournamentRanking
}

function sortTeams(teamsToSort) {
    countBuhgolts(teamsToSort, 'buhgolts');
    countBuhgolts(teamsToSort, 'smallBuhgolts');
    return teamsToSort.sort((a, b) => b.wins - a.wins || b.buhgolts - a.buhgolts || b.smallBuhgolts - a.smallBuhgolts ||
        (b.pointsPlus - b.pointsMinus) - (a.pointsPlus - a.pointsMinus) || b.pointsPlus - a.pointsPlus || b.rating - a.rating);
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
        if (tournament.system === 'poules' && tournament.groups && activeRound > 1) {
            let sortedGroups = [];
            tournament.groups.forEach(group => {
                group.forEach(team => {
                    const teamInfo = tournament.teams.find(item => item.title === team.title);
                    team.wins = teamInfo.wins;
                    team.opponents = teamInfo.opponents;
                    team.pointsPlus = teamInfo.pointsPlus;
                    team.pointsMinus = teamInfo.pointsMinus;
                });
                let groupRanking = group.slice().sort((a, b) => b.wins - a.wins || (b.pointsPlus - b.pointsMinus) - (a.pointsPlus - a.pointsMinus));
                sortedGroups.push(groupRanking);
            });
            return sortedGroups;
        } else if (tournament.system === 'groups' && activeRound > 1) {
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
function gameHasError(game, maxScore) {
    return (game.team_1_score && game.team_2_score) && game.team_1_score === game.team_2_score || (game.team_1_score < 0 || game.team_1_score > maxScore) || (game.team_2_score < 0 || game.team_2_score > maxScore)
}
function copyContent(data) {
    navigator.clipboard.writeText(data.trim())
}

function isScoreError (game, maxScore) {
    return game.team_1_score === game.team_2_score || (game.team_1_score === null || game.team_1_score < 0 || game.team_1_score > maxScore) || (game.team_2_score === null || game.team_2_score < 0 || game.team_2_score > maxScore)
}

const regions = {
    1: 'Київ',
    2: 'Харківська',
    3: 'Харківська',
    4: 'Закарпатська',
    6: 'Харківська',
    7: 'Львівська',
    8: 'Львівська',
    9: 'Івано-Франківська',
    10: 'Закарпатська',
    11: 'Львівська',
    12: 'Харківська',
    13: 'Закарпатська',
    14: 'Львівська',
    15: 'Закарпатська',
    16: 'Київська',
    17: 'Полтавська',
    18: 'Чернігівська',
    19: 'Київська',
    20: 'Закарпатська',
    21: 'Київська',
    22: 'Волинська',
    23: 'Закарпатська',
    24: 'Закарпатська',
    25: 'Волинська',
    26: 'Тернопільська',
    27: 'Харківська',
}

const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

export {tournamentNames, getGameResultInGroup, getTournamentRanking, getTeamsRanking, gameHasError, copyContent, regions, sortTeams, countBuhgolts, isScoreError, shuffleArray}