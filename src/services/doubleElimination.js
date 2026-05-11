import {buildPlayOffScheme} from './playoff';

function createEmptyGame(stage, id = 1) {
    return {
        id,
        stage,
        team_1: null,
        team_1_score: null,
        team_2: null,
        team_2_score: null,
    };
}

export function buildDoubleEliminationBracket(wbTeams, lbTeams = []) {
    const wbCount = wbTeams.length;
    const wbRounds = Math.log2(wbCount);

    const winnerStages = buildWinnerStages(wbTeams, wbRounds);
    const loserStages = buildLoserStages(wbRounds, lbTeams);
    const grandFinal = createEmptyGame('grandFinal');

    return {
        type: 'double',
        winnerStages,
        loserStages,
        grandFinal,
        currentSide: 'winner',
        currentStageIndex: 0,
    };
}

function buildWinnerStages(wbTeams, wbRounds) {
    const stages = [];
    const playOffScheme = buildPlayOffScheme(wbTeams, false);

    stages.push({
        teamsCount: wbTeams.length,
        stageLabel: wbTeams.length / 2,
        round: 1,
        teams: playOffScheme,
    });

    for (let r = 2; r <= wbRounds; r++) {
        const gamesInRound = wbTeams.length / Math.pow(2, r);
        const teams = [];
        for (let i = 0; i < gamesInRound; i++) {
            teams.push(createEmptyGame(gamesInRound, i + 1));
        }
        stages.push({
            teamsCount: gamesInRound * 2,
            stageLabel: gamesInRound,
            round: r,
            teams,
        });
    }

    return stages;
}

function buildLoserStages(wbRounds, lbTeams) {
    const stages = [];
    const lbRounds = (wbRounds - 1) * 2 + 1;

    for (let r = 1; r <= lbRounds; r++) {
        const gamesInRound = getLoserRoundGames(r, wbRounds, lbTeams.length);
        const isDropDown = r % 2 === 1;
        const teams = [];

        if (r === 1 && lbTeams.length > 0) {
            for (let i = 0; i < lbTeams.length / 2; i++) {
                teams.push({
                    id: i + 1,
                    stage: `L${r}`,
                    team_1: lbTeams[i]?.title || null,
                    team_1_score: null,
                    team_2: lbTeams[lbTeams.length - 1 - i]?.title || null,
                    team_2_score: null,
                });
            }
        } else {
            for (let i = 0; i < gamesInRound; i++) {
                teams.push(createEmptyGame(`L${r}`, i + 1));
            }
        }

        stages.push({
            teamsCount: gamesInRound * 2,
            stageLabel: `L${r}`,
            round: r,
            isDropDown,
            teams,
        });
    }

    return stages;
}

function getLoserRoundGames(round, wbRounds, lbInitialTeams) {
    const wbFirstRoundGames = Math.pow(2, wbRounds - 1);

    if (round === 1) {
        if (lbInitialTeams > 0) {
            return lbInitialTeams / 2;
        }
        return wbFirstRoundGames / 2;
    }

    let games = wbFirstRoundGames / 2;
    for (let r = 2; r <= round; r++) {
        if (r % 2 === 0) {
            // internal round: same number of games (halving from previous + drop-downs was done in odd round)
        } else {
            games = games / 2;
        }
    }
    return Math.max(1, games);
}

export function progressDoubleElimWinner(bracket, stageIndex) {
    const currentStage = bracket.winnerStages[stageIndex];
    const isWbFinal = stageIndex === bracket.winnerStages.length - 1;

    if (isWbFinal) {
        const game = currentStage.teams[0];
        const winner = game.team_1_score > game.team_2_score ? game.team_1 : game.team_2;
        const loser = game.team_1_score > game.team_2_score ? game.team_2 : game.team_1;

        bracket.grandFinal.team_1 = winner;

        const lastLbStage = bracket.loserStages[bracket.loserStages.length - 1];
        lastLbStage.teams[0].team_1 = loser;

        bracket.currentSide = 'loser';
        bracket.currentStageIndex = findNextLoserStage(bracket);
    } else {
        const nextWbStage = bracket.winnerStages[stageIndex + 1];
        const lbDropStageIndex = getDropDownStageIndex(stageIndex, bracket);

        currentStage.teams.forEach((game, index) => {
            const winner = game.team_1_score > game.team_2_score ? game.team_1 : game.team_2;
            const loser = game.team_1_score > game.team_2_score ? game.team_2 : game.team_1;

            if (index % 2 === 0) {
                nextWbStage.teams[Math.floor(index / 2)].team_1 = winner;
            } else {
                nextWbStage.teams[Math.floor(index / 2)].team_2 = winner;
            }

            if (lbDropStageIndex !== null) {
                placeLoserInLB(bracket, lbDropStageIndex, loser, index);
            }
        });

        bracket.currentStageIndex = stageIndex + 1;
        const nextLbReady = isLoserStageReady(bracket, findNextLoserStage(bracket));
        if (nextLbReady) {
            bracket.currentSide = 'loser';
            bracket.currentStageIndex = findNextLoserStage(bracket);
        }
    }

    return bracket;
}

export function progressDoubleElimLoser(bracket, stageIndex) {
    const currentStage = bracket.loserStages[stageIndex];
    const isLbFinal = stageIndex === bracket.loserStages.length - 1;

    if (isLbFinal) {
        const game = currentStage.teams[0];
        const winner = game.team_1_score > game.team_2_score ? game.team_1 : game.team_2;
        bracket.grandFinal.team_2 = winner;
        bracket.currentSide = 'grandFinal';
        bracket.currentStageIndex = 0;
    } else {
        const nextStage = bracket.loserStages[stageIndex + 1];
        currentStage.teams.forEach((game, index) => {
            const winner = game.team_1_score > game.team_2_score ? game.team_1 : game.team_2;

            if (nextStage.isDropDown) {
                nextStage.teams[index].team_2 = winner;
            } else {
                if (index % 2 === 0) {
                    nextStage.teams[Math.floor(index / 2)].team_1 = winner;
                } else {
                    nextStage.teams[Math.floor(index / 2)].team_2 = winner;
                }
            }
        });

        const nextIndex = stageIndex + 1;
        if (isLoserStageReady(bracket, nextIndex)) {
            bracket.currentStageIndex = nextIndex;
        } else {
            bracket.currentSide = 'winner';
            bracket.currentStageIndex = findNextWinnerStage(bracket);
        }
    }

    return bracket;
}

export function progressGrandFinal(bracket) {
    bracket.currentSide = 'finished';
    return bracket;
}

function getDropDownStageIndex(wbStageIndex, bracket) {
    const dropIndex = wbStageIndex * 2;
    if (dropIndex < bracket.loserStages.length) {
        return dropIndex;
    }
    return null;
}

function placeLoserInLB(bracket, lbStageIndex, loserName, gameIndex) {
    const lbStage = bracket.loserStages[lbStageIndex];
    if (!lbStage) return;

    if (lbStage.isDropDown) {
        const slotIndex = gameIndex < lbStage.teams.length ? gameIndex : lbStage.teams.length - 1;
        if (!lbStage.teams[slotIndex].team_1) {
            lbStage.teams[slotIndex].team_1 = loserName;
        } else {
            lbStage.teams[slotIndex].team_2 = loserName;
        }
    } else {
        for (let i = 0; i < lbStage.teams.length; i++) {
            if (!lbStage.teams[i].team_1) {
                lbStage.teams[i].team_1 = loserName;
                return;
            }
            if (!lbStage.teams[i].team_2) {
                lbStage.teams[i].team_2 = loserName;
                return;
            }
        }
    }
}

function findNextLoserStage(bracket) {
    for (let i = 0; i < bracket.loserStages.length; i++) {
        const stage = bracket.loserStages[i];
        const hasResults = stage.teams.some(g => g.team_1_score !== null);
        const isReady = stage.teams.every(g => g.team_1 && g.team_2);
        if (!hasResults && isReady) return i;
    }
    return 0;
}

function findNextWinnerStage(bracket) {
    for (let i = 0; i < bracket.winnerStages.length; i++) {
        const stage = bracket.winnerStages[i];
        const hasResults = stage.teams.some(g => g.team_1_score !== null);
        const isReady = stage.teams.every(g => g.team_1 && g.team_2);
        if (!hasResults && isReady) return i;
    }
    return bracket.winnerStages.length - 1;
}

function isLoserStageReady(bracket, stageIndex) {
    if (stageIndex >= bracket.loserStages.length) return false;
    const stage = bracket.loserStages[stageIndex];
    return stage.teams.every(g => g.team_1 && g.team_2);
}
