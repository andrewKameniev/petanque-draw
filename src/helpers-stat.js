export function calculateCommonTeamStat (playersStat, system){
    if (system === 'simple') {
        return {
            all: {
                positive: playersStat.reduce((acc, item) => acc + item.points.positive + item.tirs.positive, 0),
                negative: playersStat.reduce((acc, item) => acc + item.points.negative + item.tirs.negative, 0)
            },
            points: {
                positive: playersStat.reduce((acc, item) => acc + item.points.positive, 0),
                negative: playersStat.reduce((acc, item) => acc + item.points.negative, 0)
            },
            tirs: {
                positive: playersStat.reduce((acc, item) => acc + item.tirs.positive, 0),
                negative: playersStat.reduce((acc, item) => acc + item.tirs.negative, 0)
            }
        }
    } else {
        return {
            points: {
                volume: playersStat.reduce((acc, item) => acc + getFrenchStat(item.points.volume, item.serie.filter(item => item.type === 'p').length), 0),
                intensity: playersStat.reduce((acc, item) => acc + getFrenchStat(item.points.intensity, item.serie.filter(item => item.type === 'p').length), 0)
            },
            tirs: {
                volume: playersStat.reduce((acc, item) => acc + getFrenchStat(item.tirs.volume, item.serie.filter(item => item.type === 't').length), 0),
                intensity: playersStat.reduce((acc, item) => acc + getFrenchStat(item.tirs.intensity, item.serie.filter(item => item.type === 't').length), 0)
            }

        }
    }

}
const frenchInfoStat= {
    A: {
        volume: 1.5,
        intensity: 1
    },
    B: {
        volume: 1,
        intensity: 1
    },
    C: {
        volume: 0.5,
        intensity: 1
    },
    D: {
        volume: 0,
        intensity: 0.5
    },
    E: {
        volume: -0.5,
        intensity: 0
    },
    F: {
        volume: -1,
        intensity: 0
    },
    G: {
        volume: -1.5,
        intensity: 0
    },
    H: {
        volume: 2,
        intensity: 1
    },
    I: {
        volume: -2,
        intensity: 0
    }
}

export function calculatePlayerStat(gameScenario, system) {
    let playerStat;

    if (system === 'simple') {
        playerStat = {
            points: {
                positive: 0,
                negative: 0
            },
            tirs: {
                positive: 0,
                negative: 0
            },
            x2: {
                points: {
                    positive: 0,
                    negative: 0
                },
                tirs: {
                    positive: 0,
                    negative: 0
                }
            },
            serie: []
        }
    } else {
        playerStat = {
            points: {
                volume: 0,
                intensity: 0
            },
            tirs: {
                volume: 0,
                intensity: 0
            },
            serie: []
        }
    }


    if (gameScenario.length) {
        gameScenario.forEach(man => {
            man.forEach(item => {
                if (item.isMade){
                    if (item.type === 'p') {
                        if (system === 'simple') {
                            if (item.success) {
                                playerStat.points.positive += 1;
                                if (item.x2) {
                                    playerStat.x2.points.positive += 1;
                                }
                            } else {
                                playerStat.points.negative += 1;
                                if (item.x2) {
                                    playerStat.x2.points.negative += 1;
                                }
                            }
                        } else {
                            playerStat.points.volume += frenchInfoStat[item.french].volume;
                            playerStat.points.intensity += frenchInfoStat[item.french].intensity
                        }
                    } else {
                        if (system === 'simple') {
                            if (item.success) {
                                playerStat.tirs.positive += 1;
                                if (item.x2) {
                                    playerStat.x2.tirs.positive += 1;
                                }
                            } else {
                                playerStat.tirs.negative += 1;
                                if (item.x2) {
                                    playerStat.x2.tirs.negative += 1;
                                }
                            }
                        } else {
                            playerStat.tirs.volume += frenchInfoStat[item.french].volume;
                            if (item.french === 'E') {
                                playerStat.tirs.intensity += 0.5
                            } else {
                                playerStat.tirs.intensity += frenchInfoStat[item.french].intensity
                            }
                        }
                    }
                    playerStat.serie.push(item);
                }
            })
        })
        if (system === 'simple') {
            playerStat.all = Math.round((playerStat.points.positive + playerStat.tirs.positive) / (playerStat.points.positive + playerStat.tirs.positive + playerStat.points.negative + playerStat.tirs.negative) * 100);
            playerStat.points = (playerStat.points.positive + playerStat.points.negative) > 0 ? Math.round(playerStat.points.positive / (playerStat.points.positive + playerStat.points.negative) * 100) : '-';
            playerStat.tirs = (playerStat.tirs.positive + playerStat.tirs.negative) > 0 ? Math.round(playerStat.tirs.positive / (playerStat.tirs.positive + playerStat.tirs.negative) * 100) : '-';
        }
    }

    return playerStat
}
export function calculateTeamPlayersStat(team, system) {
    let teamStat = [];
    team.players.forEach(() => {
        if (system === 'simple') {
            teamStat.push({
                points: {
                    positive: 0,
                    negative: 0
                },
                tirs: {
                    positive: 0,
                    negative: 0
                },
                x2: {
                    points: {
                        positive: 0,
                        negative: 0
                    },
                    tirs: {
                        positive: 0,
                        negative: 0
                    }
                },
                serie: []
            })
        } else {
            teamStat.push({
                points: {
                    volume: 0,
                    intensity: 0
                },
                tirs: {
                    volume: 0,
                    intensity: 0
                },
                serie: []
            })
        }
    })

    if (team.players[0].stat?.length) {
        team.players.forEach((player, index) => {
            player.stat?.forEach(man => {
                if (man) {
                    man.forEach(item => {
                        if (item.isMade){
                            if (item.type === 'p') {
                                if (system === 'simple') {
                                    if (item.success) {
                                        teamStat[index].points.positive += 1;
                                        if (item.x2) {
                                            teamStat[index].x2.points.positive += 1;
                                        }
                                    } else {
                                        teamStat[index].points.negative += 1;
                                        if (item.x2) {
                                            teamStat[index].x2.points.negative += 1;
                                        }
                                    }
                                } else {
                                    teamStat[index].points.volume += frenchInfoStat[item.french].volume;
                                    teamStat[index].points.intensity += frenchInfoStat[item.french].intensity
                                }
                            } else {
                                if (system === 'simple') {
                                    if (item.success) {
                                        teamStat[index].tirs.positive += 1;
                                        if (item.x2) {
                                            teamStat[index].x2.tirs.positive += 1;
                                        }
                                    } else {
                                        teamStat[index].tirs.negative += 1;
                                        if (item.x2) {
                                            teamStat[index].x2.tirs.negative += 1;
                                        }
                                    }
                                } else {
                                    teamStat[index].tirs.volume += frenchInfoStat[item.french].volume;
                                    if (item.french === 'E') {
                                        teamStat[index].tirs.intensity += 0.5
                                    } else {
                                        teamStat[index].tirs.intensity += frenchInfoStat[item.french].intensity
                                    }
                                }
                            }
                            teamStat[index].serie.push(item);
                        }
                    })
                }
            })
            if (system === 'simple') {
                teamStat[index].all = {
                    positive: teamStat[index].points.positive + teamStat[index].tirs.positive,
                    negative: teamStat[index].points.negative + teamStat[index].tirs.negative
                }
            }
        })
    }

    return teamStat
}

export function getFrenchStat(value, count) {
    return isNaN(Math.round(value / count * 100)) ? 0 : Math.round(value / count * 100)
}

export function getDate(time) {
    const d = new Date(time);
    return `(${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()})`
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
]