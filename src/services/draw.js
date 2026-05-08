import {sortTeams} from '@/helpers';

export function getRandomWithOneExclusion(lengthOfArray, indexToExclude1 = null, indexToExclude2 = null) {
    let rand = null;
    while (rand === null || rand === indexToExclude1 || rand === indexToExclude2) {
        rand = Math.round(Math.random() * (lengthOfArray - 1));
    }
    return rand;
}

export function generateCompetitors(teamList, activeRound, useRating) {
    let teamIndex, opponentIndex;
    if (activeRound === 1 && !useRating) {
        teamIndex = getRandomWithOneExclusion(teamList.length);
        opponentIndex = getRandomWithOneExclusion(teamList.length, teamIndex);
        return {teamIndex, opponentIndex};
    } else {
        teamIndex = 0;
        const defaultOpponentIndex = activeRound === 1 ? teamList.length / 2 : 1;
        opponentIndex = defaultOpponentIndex;
        while (teamList[teamIndex].opponents.includes(teamList[opponentIndex].title)) {
            opponentIndex++;
            if (!teamList[opponentIndex]) {
                opponentIndex = -1;
                return {teamIndex, opponentIndex};
            }
        }
        return {teamIndex, opponentIndex};
    }
}

export function generateCompetitorsFirstLast(teamList, activeRound, useRating, reverse = false, iteration = 0) {
    let teamIndex, opponentIndex;
    if (activeRound === 1 && !useRating) {
        teamIndex = getRandomWithOneExclusion(teamList.length);
        opponentIndex = getRandomWithOneExclusion(teamList.length, teamIndex);
        return {teamIndex, opponentIndex};
    } else {
        let teamsWithSameWins, isOneTeamWithSameWins;
        if (reverse) {
            teamIndex = 0;
            opponentIndex = iteration % 2 === 0 ? teamList.length - 1 : teamIndex + 1;
        } else {
            teamsWithSameWins = teamList.filter(team => team.wins === teamList[0].wins);
            isOneTeamWithSameWins = teamsWithSameWins.length === 1;
            if (isOneTeamWithSameWins) {
                teamsWithSameWins.push(teamList[1]);
            }
            if (teamsWithSameWins.length % 2 !== 0) {
                teamsWithSameWins.splice(teamsWithSameWins.length - 1, 1);
            }
            teamIndex = 0;
            opponentIndex = activeRound === 1 ? teamList.length / 2 : teamsWithSameWins.length - 1;
        }
        if (reverse) {
            let condition;
            if (teamList.length === 4) {
                condition = teamList[iteration % 2 === 0 ? opponentIndex - 1 : opponentIndex + 1]?.opponents.includes(teamList[iteration % 2 === 0 ? opponentIndex - 2 : opponentIndex + 2]?.title);
            } else if (teamList.length > 4) {
                condition = (teamList[iteration % 2 === 0 ? opponentIndex - 1 : opponentIndex + 1]?.opponents.includes(teamList[iteration % 2 === 0 ? opponentIndex - 2 : opponentIndex + 2]?.title))
                    && (teamList[iteration % 2 === 0 ? opponentIndex - 2 : opponentIndex + 2]?.opponents.includes(teamList[iteration % 2 === 0 ? opponentIndex - 3 : opponentIndex + 3]?.title));
            }
            while (teamList[teamIndex].opponents.includes(teamList[opponentIndex]?.title) && condition) {
                opponentIndex = iteration ? iteration % 2 === 0 ? opponentIndex - 1 : opponentIndex + 1 : opponentIndex + 1;
                if (!teamList[opponentIndex]) {
                    opponentIndex = -1;
                    return {teamIndex, opponentIndex};
                }
            }
        } else {
            while (teamList[teamIndex].opponents.includes(teamList[opponentIndex]?.title)) {
                isOneTeamWithSameWins || teamsWithSameWins.length < 3 ? opponentIndex++ : opponentIndex--;
                if (!teamList[opponentIndex] || teamIndex === opponentIndex) {
                    opponentIndex = -1;
                    return {teamIndex, opponentIndex};
                }
            }
        }
        return {teamIndex, opponentIndex};
    }
}

export function drawSwissRound(tournament, rankingTeams, activeRound) {
    const round = [];
    let teamsToDraw = JSON.parse(JSON.stringify(rankingTeams));
    teamsToDraw = sortTeams(teamsToDraw);

    let expandListIteration = 0;
    const stopExpandIndex = Math.round(teamsToDraw.length / 2 - 1);
    let teamsDrawed = [];

    const isTechnical = teamsToDraw.length % 2 !== 0;

    if (isTechnical) {
        let technicalTeamIndex = tournament.useRating || activeRound !== 1 ? teamsToDraw.length - 1 : getRandomWithOneExclusion(teamsToDraw.length);
        let technicalTeam = teamsToDraw[technicalTeamIndex];
        if (technicalTeam.opponents.includes('Technical')) {
            for (let i = 2; i < teamsToDraw.length; i++) {
                technicalTeamIndex = teamsToDraw.length - i;
                technicalTeam = teamsToDraw[technicalTeamIndex];
                if (!technicalTeam.opponents.includes('Technical')) {
                    break;
                }
            }
        }
        round.push({
            team_1: technicalTeam.title,
            team_1_score: tournament.preferences.technical.technicalFirst,
            team_2: 'Technical',
            team_2_score: tournament.preferences.technical.technicalSecond
        });
        teamsToDraw.splice(technicalTeamIndex, 1);
    }

    while (teamsToDraw.length > 0) {
        let competitors = generateCompetitorsFirstLast(teamsToDraw, activeRound, tournament.useRating);
        while (competitors.opponentIndex === -1 && expandListIteration < stopExpandIndex) {
            expandListIteration++;
            if (teamsDrawed.length) {
                round.splice(-expandListIteration);
                for (let k = 1; k <= expandListIteration * 2; k++) {
                    teamsToDraw.unshift(teamsDrawed[teamsDrawed.length - k]);
                }
                teamsDrawed.splice(teamsDrawed.length - (expandListIteration * 2), expandListIteration * 2);
            }
            competitors = generateCompetitorsFirstLast(teamsToDraw, activeRound, tournament.useRating, true, expandListIteration);
        }
        if (expandListIteration === stopExpandIndex && competitors.opponentIndex === -1) {
            return {round: null, error: 'cantDraw'};
        }
        round.push({
            team_1: teamsToDraw[competitors.teamIndex].title,
            team_1_score: null,
            team_2: teamsToDraw[Math.floor(competitors.opponentIndex)].title,
            team_2_score: null
        });
        teamsDrawed.push(teamsToDraw[competitors.teamIndex], teamsToDraw[Math.floor(competitors.opponentIndex)]);
        const teamsToRemove = [teamsToDraw[competitors.teamIndex].title, teamsToDraw[Math.floor(competitors.opponentIndex)].title];
        teamsToDraw = teamsToDraw.filter(team => !teamsToRemove.includes(team.title));
    }

    return {round, error: null};
}

export function drawSupermeleRound(tournament, rankingTeams) {
    const round = [];
    const playersCount = tournament.teams.length;
    let gamesCount = Math.floor(playersCount / tournament.supermelePlayers);
    while (gamesCount % 2 !== 0) {
        gamesCount = tournament.supermelePlayers == 2 ? gamesCount - 1 : gamesCount + 1;
    }
    if (playersCount > gamesCount * 3) {
        gamesCount += 2;
    }

    let superMeleScheme = {
        doubles: tournament.supermelePlayers == 2 ? gamesCount : 0,
        triples: tournament.supermelePlayers == 3 ? gamesCount : 0
    };
    let sum = superMeleScheme.doubles * 2 + superMeleScheme.triples * 3;

    while (sum !== playersCount) {
        if (tournament.supermelePlayers == 2) {
            superMeleScheme.doubles--;
            superMeleScheme.triples++;
        } else {
            superMeleScheme.triples--;
            superMeleScheme.doubles++;
        }
        sum = superMeleScheme.doubles * 2 + superMeleScheme.triples * 3;
    }

    let teamsToDraw = JSON.parse(JSON.stringify(rankingTeams));
    let teamsForRound = [];

    for (let i = 1; i <= superMeleScheme.doubles; i++) {
        const player1 = getRandomWithOneExclusion(teamsToDraw.length);
        let player2 = getRandomWithOneExclusion(teamsToDraw.length, player1);
        let tryToFindOpponent = 0;
        while (tryToFindOpponent < 100 && teamsToDraw[player1].opponents.includes(teamsToDraw[player2].title)) {
            player2 = getRandomWithOneExclusion(teamsToDraw.length, player1);
            tryToFindOpponent++;
        }
        teamsForRound.push({
            title: teamsToDraw[player1].title + ', ' + teamsToDraw[player2].title,
            players: [teamsToDraw[player1].title, teamsToDraw[player2].title]
        });
        const teamsToRemove = [teamsToDraw[player1].title, teamsToDraw[player2].title];
        teamsToDraw = teamsToDraw.filter(team => !teamsToRemove.includes(team.title));
    }

    for (let j = 1; j <= superMeleScheme.triples; j++) {
        const player1 = getRandomWithOneExclusion(teamsToDraw.length);
        let player2 = getRandomWithOneExclusion(teamsToDraw.length, player1);
        let player3 = getRandomWithOneExclusion(teamsToDraw.length, player1, player2);
        let tryToFindOpponent = 1;
        while (tryToFindOpponent < 100 && teamsToDraw[player1].opponents.includes(teamsToDraw[player2].title)) {
            player2 = getRandomWithOneExclusion(teamsToDraw.length, player1);
            tryToFindOpponent++;
        }
        let tryToFindOpponent2 = 1;
        while (tryToFindOpponent2 < 100 && teamsToDraw[player1].opponents.includes(teamsToDraw[player3].title) && teamsToDraw[player2].opponents.includes(teamsToDraw[player3].title)) {
            player3 = getRandomWithOneExclusion(teamsToDraw.length, player1, player2);
            tryToFindOpponent2++;
        }
        teamsForRound.push({
            title: teamsToDraw[player1].title + ', ' + teamsToDraw[player2].title + ', ' + teamsToDraw[player3].title,
            players: [teamsToDraw[player1].title, teamsToDraw[player2].title, teamsToDraw[player3].title]
        });
        const teamsToRemove = [teamsToDraw[player1].title, teamsToDraw[player2].title, teamsToDraw[player3].title];
        teamsToDraw = teamsToDraw.filter(team => !teamsToRemove.includes(team.title));
    }

    for (let r = 0; r < gamesCount / 2; r++) {
        round.push({
            team_1: teamsForRound[0].title,
            team_1_players: teamsForRound[0].players,
            team_1_score: null,
            team_2: teamsForRound[1].title,
            team_2_players: teamsForRound[1].players,
            team_2_score: null
        });
        teamsForRound.splice(0, 2);
    }

    return round;
}

export function assignLanes(games, tournament) {
    let technicalGame = null;
    if (tournament.system === 'swiss' && tournament.teams.length % 2 !== 0) {
        const technicalGameIndex = games.findIndex(game => game.team_2 === 'Technical');
        if (technicalGameIndex !== -1) {
            technicalGame = games[technicalGameIndex];
            games = games.filter((_, i) => i !== technicalGameIndex);
        }
    }

    const teamsMatrix = {};
    const firstLane = tournament.preferences.fieldsStart - 1;
    const laneCount = Math.floor(tournament.teams.length / 2);

    tournament.teams.forEach(team => {
        teamsMatrix[team.title] = {};
        for (let i = firstLane; i < firstLane + laneCount; i++) {
            teamsMatrix[team.title][i] = 0;
        }
        if (team.lanes && team.lanes.length) {
            team.lanes.forEach(lane => {
                if (teamsMatrix[team.title][lane] !== undefined) {
                    teamsMatrix[team.title][lane]++;
                }
            });
        }
    });

    const scheduledMatches = [];
    let availableLanes = Array.from({length: laneCount}, (_, i) => i + firstLane);

    games.forEach((game) => {
        if (game.team_2 !== 'Technical') {
            let bestLane = null;
            let minWeight = Infinity;
            const team1Lanes = tournament.teams.find(t => t.title === game.team_1)?.lanes || [];
            const team2Lanes = tournament.teams.find(t => t.title === game.team_2)?.lanes || [];
            const team1LastLane = team1Lanes.length ? team1Lanes[team1Lanes.length - 1] : null;
            const team2LastLane = team2Lanes.length ? team2Lanes[team2Lanes.length - 1] : null;

            availableLanes.forEach(i => {
                const weight = teamsMatrix[game.team_1][i] + teamsMatrix[game.team_2][i];
                if (weight < minWeight && i !== team1LastLane && i !== team2LastLane) {
                    minWeight = weight;
                    bestLane = i;
                }
            });
            if (bestLane === null) {
                availableLanes.forEach(i => {
                    const weight = teamsMatrix[game.team_1][i] + teamsMatrix[game.team_2][i];
                    if (weight < minWeight) {
                        minWeight = weight;
                        bestLane = i;
                    }
                });
            }
            game.lane = bestLane;
            teamsMatrix[game.team_1][bestLane]++;
            teamsMatrix[game.team_2][bestLane]++;
            availableLanes = availableLanes.filter(lane => lane !== bestLane);
            scheduledMatches.push(game);
        }
    });

    if (technicalGame) {
        scheduledMatches.push(technicalGame);
    }
    return scheduledMatches.sort((a, b) => a.lane - b.lane);
}

export function createGroups(tournament, teamsInGroup) {
    const groupsQuantity = Math.round(tournament.teams.length / teamsInGroup);
    let groups = [];
    for (let i = 1; i <= groupsQuantity; i++) {
        groups.push([]);
    }
    let teamsToDraw = JSON.parse(JSON.stringify(tournament.teams.sort((a, b) => b.rating - a.rating)));

    if (tournament.useRating && groupsQuantity === 2 && teamsToDraw.length < 33) {
        const indexesScheme = {
            0: [1, 32, 16, 17, 9, 24, 8, 25, 5, 28, 12, 21, 13, 20, 4, 29],
            1: [3, 30, 14, 19, 11, 22, 6, 27, 7, 26, 10, 23, 15, 18, 2, 31]
        };
        Object.keys(indexesScheme).forEach(key => {
            indexesScheme[key].forEach(item => {
                const teamIndexInList = teamsToDraw[item - 1] ? tournament.teams.findIndex(team => team.title === teamsToDraw[item - 1].title) : -1;
                if (teamIndexInList !== -1) {
                    groups[key].push(tournament.teams[teamIndexInList]);
                }
            });
        });
    } else {
        while (teamsToDraw.length >= 1) {
            for (let j = 0; j < teamsToDraw.length; j++) {
                for (let i = 0; i < groupsQuantity; i++) {
                    const teamIndex = tournament.useRating ? 0 : getRandomWithOneExclusion(teamsToDraw.length);
                    if (teamIndex !== -1 && teamsToDraw.length >= 1) {
                        const teamIndexInList = tournament.teams.findIndex(team => team.title === teamsToDraw[teamIndex].title);
                        groups[i].push(tournament.teams[teamIndexInList]);
                        teamsToDraw.splice(teamIndex, 1);
                    }
                }
            }
        }
    }

    const schemas = [];
    groups.forEach(group => {
        group.sort((a, b) => b.rating - a.rating);
        let groupIndexes = [];
        group.forEach((_, index) => {
            groupIndexes.push(index);
        });
        if (group.length % 2 !== 0) {
            groupIndexes.push(group.length);
        }
        const scheme = {top: [], bottom: []};
        for (let i = 0; i < groupIndexes.length / 2; i++) {
            scheme.top.push(i);
        }
        for (let i = groupIndexes.length - 1; i >= groupIndexes.length / 2; i--) {
            scheme.bottom.push(i);
        }
        schemas.push(scheme);
    });

    return {groups, schemas};
}

export function saveResultsForRound(tournament, round) {
    if (tournament.games.length <= 2) {
        tournament.teams.forEach(team => {
            team.opponents = team.opponents.filter(item => item !== 'placeholder');
        });
    }
    if (tournament.system === 'supermele') {
        tournament.games[round].forEach(game => {
            game.team_1_players.forEach(player => {
                const playerIndex = tournament.teams.findIndex(item => item.title === player);
                if (playerIndex !== -1) {
                    const partners = game.team_1_players.filter(item => item !== player);
                    partners.forEach(item => tournament.teams[playerIndex].opponents.push(item));
                    tournament.teams[playerIndex].pointsPlus += game.team_1_score;
                    tournament.teams[playerIndex].pointsMinus += game.team_2_score;
                    if (game.team_1_score > game.team_2_score) {
                        tournament.teams[playerIndex].wins++;
                    }
                }
            });
            game.team_2_players.forEach(player => {
                const playerIndex = tournament.teams.findIndex(item => item.title === player);
                if (playerIndex !== -1) {
                    const partners = game.team_2_players.filter(item => item !== player);
                    partners.forEach(item => tournament.teams[playerIndex].opponents.push(item));
                    tournament.teams[playerIndex].pointsPlus += game.team_2_score;
                    tournament.teams[playerIndex].pointsMinus += game.team_1_score;
                    if (game.team_2_score > game.team_1_score) {
                        tournament.teams[playerIndex].wins++;
                    }
                }
            });
        });
    } else {
        tournament.games[round].forEach(game => {
            const firstTeamIndex = tournament.teams.findIndex(item => item.title === game.team_1);
            if (firstTeamIndex !== -1) {
                tournament.teams[firstTeamIndex].opponents.push(game.team_2);
                tournament.teams[firstTeamIndex].pointsPlus += game.team_1_score;
                tournament.teams[firstTeamIndex].pointsMinus += game.team_2_score;
            }
            const secondTeamIndex = tournament.teams.findIndex(item => item.title === game.team_2);
            if (secondTeamIndex !== -1) {
                tournament.teams[secondTeamIndex].opponents.push(game.team_1);
                tournament.teams[secondTeamIndex].pointsPlus += game.team_2_score;
                tournament.teams[secondTeamIndex].pointsMinus += game.team_1_score;
            }
            if (game.team_1_score > game.team_2_score) {
                if (firstTeamIndex !== -1) {
                    tournament.teams[firstTeamIndex].wins++;
                }
            } else if (secondTeamIndex !== -1 && game.team_2 !== "Technical") {
                tournament.teams[secondTeamIndex].wins++;
            }
        });
    }
}
