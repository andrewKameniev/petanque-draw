import { getEditableDoubleEliminationStages, getPublicDoubleEliminationMatches } from '@/services/playoff';

export function autoFillScores(tournament, activeRound) {
  const maxScore = tournament.preferences?.maxScore || 13;
  const fillGames = (games) => {
    games.forEach((game) => {
      if (game.team_2 === 'Technical') return;
      if (game.isBye) return;
      if (
        game.team_1_score != null &&
        game.team_2_score != null &&
        game.team_1_score !== '' &&
        game.team_2_score !== ''
      )
        return;
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
      if (!game.status || game.status === 'not_started') {
        game.status = 'in_progress';
      }
    });
  };

  const fillBracket = (bracket, stage) => {
    if (bracket.format === 'double') {
      getEditableDoubleEliminationStages(bracket).forEach((activeStage) => {
        fillGames(getPublicDoubleEliminationMatches(activeStage));
      });
      return;
    }

    const currentStageIndex = stage
      ? bracket.stages?.findIndex((s) => s.stageLabel === stage)
      : bracket.stages?.findIndex((s) =>
          s.teams?.some((g) => !g.isBye && (g.team_1_score == null || g.team_1_score === '')),
        );
    if (currentStageIndex >= 0) {
      fillGames(bracket.stages[currentStageIndex].teams);
    }
    if (
      bracket.thirdPlace &&
      bracket.thirdPlace.team_1 &&
      (bracket.thirdPlace.team_1_score == null || bracket.thirdPlace.team_1_score === '')
    ) {
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
  const tB = tournament.tournamentB || tournament.groupB;
  if (tB?.eliminationRound && !tB.eliminationRound.completed) {
    fillGames(tB.eliminationRound.games);
  }
  if (tournament.activeGroup === 'B' && tB?.playOff && tB.playOffBracket) {
    fillBracket(tB.playOffBracket, tB.playOffStage);
  }
  if (tournament.activeGroup === 'B' && tB?.roundIsActive && tB.games?.length) {
    fillGames(tB.games[tB.games.length - 1]);
  }
}
