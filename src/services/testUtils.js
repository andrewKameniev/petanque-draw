export function autoFillScores(tournament, activeRound) {
    const maxScore = tournament.preferences?.maxScore || 13;
    const fillGames = (games) => {
        games.forEach(game => {
            if (game.team_2 === 'Technical') return;
            if (game.isBye) return;
            if (game.team_1_score != null && game.team_2_score != null &&
                game.team_1_score !== '' && game.team_2_score !== '') return;
            let s1, s2;
            if (Math.random() < 0.5) {
                s1 = maxScore;
                s2 = Math.floor(Math.random() * maxScore);
            } else {
                s2 = maxScore;
                s1 = Math.floor(Math.random() * maxScore);
            }
            game.team_1_score = s1;
            game.team_2_score = s2;
        });
    };

    const fillBracket = (bracket, stage) => {
        const currentStageIndex = stage
            ? bracket.stages?.findIndex(s => s.stageLabel === stage)
            : bracket.stages?.findIndex(s => s.teams?.some(g => !g.isBye && (g.team_1_score == null || g.team_1_score === '')));
        if (currentStageIndex >= 0) {
            fillGames(bracket.stages[currentStageIndex].teams);
        }
        if (bracket.thirdPlace && bracket.thirdPlace.team_1 && (bracket.thirdPlace.team_1_score == null || bracket.thirdPlace.team_1_score === '')) {
            fillGames([bracket.thirdPlace]);
        }
    };

    if (tournament.cadrage?.length && !tournament.playOff?.length) {
        fillGames(tournament.cadrage);
    }
    if (tournament.playOff?.length && tournament.playOffBracket) {
        fillBracket(tournament.playOffBracket, tournament.playOffStage);
    }
    if (tournament.roundIsActive && tournament.games?.length) {
        fillGames(tournament.games[activeRound - 1]);
    }
    if (tournament.groupB?.eliminationRound && !tournament.groupB.eliminationRound.completed) {
        fillGames(tournament.groupB.eliminationRound.games);
    }
    if (tournament.activeGroup === 'B' && tournament.groupB?.playOff && tournament.groupB.playOffBracket) {
        fillBracket(tournament.groupB.playOffBracket, tournament.groupB.playOffStage);
    }
    if (tournament.activeGroup === 'B' && tournament.groupB?.roundIsActive && tournament.groupB.games?.length) {
        fillGames(tournament.groupB.games[tournament.groupB.games.length - 1]);
    }
}
