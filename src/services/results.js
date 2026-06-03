/**
 * Determines the default selected round tab in the Results view.
 * Priority: playoff > cadrage > last round.
 */
export function getDefaultSelectedRound(tournament) {
    if (hasPlayOffResults(tournament)) {
        return 'playoff';
    } else if (tournament?.cadrage?.length) {
        return 'cadrage';
    } else if (tournament?.games?.length) {
        return tournament.games.length - 1;
    }
    return -1;
}

/**
 * Checks if a tournament has scored playoff results (excluding cadrage stage).
 */
export function hasPlayOffResults(tournament) {
    const bracket = tournament?.playOffBracket;
    if (!bracket?.stages?.length) return false;
    return bracket.stages.some(stage =>
        stage.stageLabel !== 'cadrage' && stage.teams?.some(g => g.team_1_score != null)
    );
}

/**
 * Returns games sorted by group index within each round.
 * If no groups, returns the original games array unchanged.
 */
export function sortGamesByGroup(games, hasGroups) {
    if (!hasGroups || !games) return games;
    return games.map(round =>
        [...round].sort((a, b) => (a.group ?? 0) - (b.group ?? 0))
    );
}

/**
 * Returns the number of qualified teams per group for poules (barrage) system.
 * A team qualifies if it has >= minWins (2 for full 3-round robin, 1 otherwise).
 */
export function getPoulesQualifiedPerGroup(rankingTeams, totalRounds) {
    if (!rankingTeams?.length) return [];
    const minWins = totalRounds >= 3 ? 2 : 1;
    return rankingTeams.map(group =>
        group.filter(team => team.wins >= minWins).length
    );
}

/**
 * Returns the number of playoff-qualifying teams per group for standard groups system.
 */
export function getPlayOffTeamsPerGroup(tournament) {
    if (!tournament.playOff || !tournament.groups?.length) return 0;
    return Math.ceil((tournament.preferences?.playOffTeams || 0) / tournament.groups.length);
}

/**
 * Returns the number of teams to highlight as qualified in a specific group.
 * For poules: based on actual wins. For groups: based on playOffTeams preference.
 */
export function getQualifiedCountForGroup(tournament, rankingTeams, gIndex) {
    if (tournament.system === 'poules') {
        const totalRounds = tournament.games?.length || 0;
        const perGroup = getPoulesQualifiedPerGroup(rankingTeams, totalRounds);
        return perGroup[gIndex] || 0;
    }
    return getPlayOffTeamsPerGroup(tournament);
}

/**
 * Computes group rankings for poules from actual game data.
 * This avoids relying on the accumulated team.wins counter.
 */
export function computePoulesGroupRankings(tournament) {
    if (!tournament.groups || !tournament.games?.length) return [];

    return tournament.groups.map((group, groupIndex) => {
        const teamWins = {};
        const teamPointsPlus = {};
        const teamPointsMinus = {};
        group.forEach(t => {
            teamWins[t.title] = 0;
            teamPointsPlus[t.title] = 0;
            teamPointsMinus[t.title] = 0;
        });

        tournament.games.forEach(roundGames => {
            roundGames.filter(g => g.group === groupIndex).forEach(game => {
                if (game.team_1_score != null && game.team_2_score != null) {
                    teamPointsPlus[game.team_1] = (teamPointsPlus[game.team_1] || 0) + game.team_1_score;
                    teamPointsMinus[game.team_1] = (teamPointsMinus[game.team_1] || 0) + game.team_2_score;
                    teamPointsPlus[game.team_2] = (teamPointsPlus[game.team_2] || 0) + game.team_2_score;
                    teamPointsMinus[game.team_2] = (teamPointsMinus[game.team_2] || 0) + game.team_1_score;
                    if (game.team_1_score > game.team_2_score) {
                        teamWins[game.team_1]++;
                    } else if (game.team_2_score > game.team_1_score) {
                        teamWins[game.team_2]++;
                    }
                }
            });
        });

        const ranked = group.map(team => ({
            ...team,
            wins: teamWins[team.title] || 0,
            pointsPlus: teamPointsPlus[team.title] || 0,
            pointsMinus: teamPointsMinus[team.title] || 0,
        }));

        return ranked.sort((a, b) =>
            b.wins - a.wins || (b.pointsPlus - b.pointsMinus) - (a.pointsPlus - a.pointsMinus)
        );
    });
}

/**
 * Assigns sequential lane numbers to playoff bracket stages, skipping bye games.
 */
export function assignPlayoffLanes(stages) {
    stages.forEach(stage => {
        const laneOrder = [];
        let lane = 0;
        stage.teams.forEach(game => {
            if (game.isBye) {
                laneOrder.push(null);
            } else {
                laneOrder.push(lane++);
            }
        });
        stage.laneOrder = laneOrder;
    });
    return stages;
}
