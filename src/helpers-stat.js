export function calculateCommonTeamStat(playersStat, system) {
    if (system === 'simple') {
        return {
            all: {
                positive: playersStat.reduce((acc, item) => acc + item.points.positive + item.tirs.positive, 0),
                negative: playersStat.reduce((acc, item) => acc + item.points.negative + item.tirs.negative, 0),
            },
            points: {
                positive: playersStat.reduce((acc, item) => acc + item.points.positive, 0),
                negative: playersStat.reduce((acc, item) => acc + item.points.negative, 0),
            },
            tirs: {
                positive: playersStat.reduce((acc, item) => acc + item.tirs.positive, 0),
                negative: playersStat.reduce((acc, item) => acc + item.tirs.negative, 0),
            },
        };
    } else {
        return {
            points: {
                volume: playersStat.reduce(
                    (acc, item) =>
                        acc + getFrenchStat(item.points.volume, item.serie.filter((item) => item.type === 'p').length),
                    0,
                ),
                intensity: playersStat.reduce(
                    (acc, item) =>
                        acc +
                        getFrenchStat(item.points.intensity, item.serie.filter((item) => item.type === 'p').length),
                    0,
                ),
            },
            tirs: {
                volume: playersStat.reduce(
                    (acc, item) =>
                        acc + getFrenchStat(item.tirs.volume, item.serie.filter((item) => item.type === 't').length),
                    0,
                ),
                intensity: playersStat.reduce(
                    (acc, item) =>
                        acc + getFrenchStat(item.tirs.intensity, item.serie.filter((item) => item.type === 't').length),
                    0,
                ),
            },
        };
    }
}
const frenchInfoStat = {
    A: {
        volume: 1.5,
        intensity: 1,
    },
    B: {
        volume: 1,
        intensity: 1,
    },
    C: {
        volume: 0.5,
        intensity: 1,
    },
    D: {
        volume: 0,
        intensity: 0.5,
    },
    E: {
        volume: -0.5,
        intensity: 0,
    },
    F: {
        volume: -1,
        intensity: 0,
    },
    G: {
        volume: -1.5,
        intensity: 0,
    },
    H: {
        volume: 2,
        intensity: 1,
    },
    I: {
        volume: -2,
        intensity: 0,
    },
};

export function calculatePlayerStat(gameScenario, system, filterDistance, onlyImportant) {
    let playerStat;
    if (system === 'simple') {
        playerStat = {
            points: {
                positive: 0,
                negative: 0,
            },
            tirs: {
                positive: 0,
                negative: 0,
            },
            serie: [],
        };
    } else {
        playerStat = {
            points: {
                volume: 0,
                intensity: 0,
            },
            tirs: {
                volume: 0,
                intensity: 0,
            },
            serie: [],
        };
    }

    if (gameScenario.length) {
        gameScenario.forEach((man) => {
            man.forEach((item) => {
                if (item.isMade) {
                    if (filterDistance && item.distance !== filterDistance) {
                        return;
                    }
                    if (onlyImportant && !item.important) {
                        return;
                    }
                    if (item.type === 'p') {
                        if (system === 'simple') {
                            if (item.success) {
                                playerStat.points.positive += 1;
                            } else {
                                playerStat.points.negative += 1;
                            }
                        } else {
                            playerStat.points.volume += frenchInfoStat[item.french].volume;
                            playerStat.points.intensity += frenchInfoStat[item.french].intensity;
                        }
                    } else {
                        if (system === 'simple') {
                            if (item.success) {
                                playerStat.tirs.positive += 1;
                            } else {
                                playerStat.tirs.negative += 1;
                            }
                        } else {
                            playerStat.tirs.volume += frenchInfoStat[item.french].volume;
                            if (item.french === 'E') {
                                playerStat.tirs.intensity += 0.5;
                            } else {
                                playerStat.tirs.intensity += frenchInfoStat[item.french].intensity;
                            }
                        }
                    }
                    playerStat.serie.push(item);
                }
            });
        });
        if (system === 'simple') {
            playerStat.allPercent =
                playerStat.points.positive + playerStat.points.negative > 0
                    ? Math.round(
                          ((playerStat.points.positive + playerStat.tirs.positive) /
                              (playerStat.points.positive +
                                  playerStat.tirs.positive +
                                  playerStat.points.negative +
                                  playerStat.tirs.negative)) *
                              100,
                      )
                    : '-';
            playerStat.pointsPercent = getStatPercentValue(playerStat.points.positive, playerStat.points.negative);
            playerStat.tirsPercent = getStatPercentValue(playerStat.tirs.positive, playerStat.tirs.negative);
        }
    }
    return playerStat;
}

function getStatPercentValue(pos, neg) {
    return pos + neg > 0 ? Math.round((pos / (pos + neg)) * 100) : '-';
}
export function calculateTeamPlayersStat(team, system) {
    let teamStat = [];
    team.players.forEach(() => {
        if (system === 'simple') {
            teamStat.push({
                points: {
                    positive: 0,
                    negative: 0,
                },
                tirs: {
                    positive: 0,
                    negative: 0,
                },
                x2: {
                    points: {
                        positive: 0,
                        negative: 0,
                    },
                    tirs: {
                        positive: 0,
                        negative: 0,
                    },
                },
                important: {
                    points: {
                        positive: 0,
                        negative: 0,
                    },
                    tirs: {
                        positive: 0,
                        negative: 0,
                    },
                },
                serie: [],
            });
        } else {
            teamStat.push({
                points: {
                    volume: 0,
                    intensity: 0,
                },
                tirs: {
                    volume: 0,
                    intensity: 0,
                },
                serie: [],
            });
        }
    });

    if (team.players[0].stat?.length) {
        team.players.forEach((player, index) => {
            const playerStat = Object.values(player.stat);

            playerStat?.forEach((man) => {
                if (man) {
                    man.forEach((item) => {
                        if (item.isMade) {
                            if (item.type === 'p') {
                                if (system === 'simple') {
                                    if (item.success) {
                                        teamStat[index].points.positive += 1;
                                        if (item.x2) {
                                            teamStat[index].x2.points.positive += 1;
                                        }
                                        if (item.important) {
                                            teamStat[index].important.points.positive += 1;
                                        }
                                    } else {
                                        teamStat[index].points.negative += 1;
                                        if (item.x2) {
                                            teamStat[index].x2.points.negative += 1;
                                        }
                                        if (item.important) {
                                            teamStat[index].important.points.negative += 1;
                                        }
                                    }
                                } else {
                                    teamStat[index].points.volume += frenchInfoStat[item.french].volume;
                                    teamStat[index].points.intensity += frenchInfoStat[item.french].intensity;
                                }
                            } else {
                                if (system === 'simple') {
                                    if (item.success) {
                                        teamStat[index].tirs.positive += 1;
                                        if (item.x2) {
                                            teamStat[index].x2.tirs.positive += 1;
                                        }
                                        if (item.important) {
                                            teamStat[index].important.tirs.positive += 1;
                                        }
                                    } else {
                                        teamStat[index].tirs.negative += 1;
                                        if (item.x2) {
                                            teamStat[index].x2.tirs.negative += 1;
                                        }
                                        if (item.important) {
                                            teamStat[index].important.tirs.negative += 1;
                                        }
                                    }
                                } else {
                                    teamStat[index].tirs.volume += frenchInfoStat[item.french].volume;
                                    if (item.french === 'E') {
                                        teamStat[index].tirs.intensity += 0.5;
                                    } else {
                                        teamStat[index].tirs.intensity += frenchInfoStat[item.french].intensity;
                                    }
                                }
                            }
                            teamStat[index].serie.push(item);
                        }
                    });
                }
            });
            if (system === 'simple') {
                teamStat[index].all = {
                    positive: teamStat[index].points.positive + teamStat[index].tirs.positive,
                    negative: teamStat[index].points.negative + teamStat[index].tirs.negative,
                };
            }
        });
    }

    return teamStat;
}

export function getFrenchStat(value, count) {
    return isNaN(Math.round((value / count) * 100)) ? 0 : Math.round((value / count) * 100);
}

export function getDate(time) {
    const d = new Date(time);
    return `(${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()})`;
}

export const gameTypes = [
    {
        id: 'tet',
        label: 'Tet-a-tet',
        value: 1,
    },
    {
        id: 'doublet',
        label: 'Doublet',
        value: 2,
    },
    {
        id: 'triplet',
        label: 'Triplet',
        value: 3,
    },
];

export const throwDistances = [6, 7, 8, 9, 10, 11];

export function validateScore(gameType, teamScores, manIndex, newScore) {
    const maxPerMan = gameType === 1 ? 3 : 6;
    let score = Math.max(0, Math.min(newScore || 0, maxPerMan));

    const prevTotal = teamScores.reduce((a, b, i) => a + (i === manIndex ? 0 : b), 0);
    score = Math.min(score, 13 - prevTotal);

    return score;
}

export function validateGameStart(gameName, players) {
    if (!gameName.trim()) return false;
    return players.every((p) => p.name && p.name.trim());
}

export function extractPlayers(stats) {
    if (!stats) return [];
    const names = new Set();

    Object.values(stats).forEach((game) => {
        if (game.team1?.players)
            game.team1.players.forEach((p) => {
                if (p?.name?.trim()) names.add(p.name.trim());
            });
        if (game.team2?.players)
            game.team2.players.forEach((p) => {
                if (p?.name?.trim()) names.add(p.name.trim());
            });
    });

    return [...names].sort();
}
