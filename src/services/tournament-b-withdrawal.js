const DEFAULT_TECHNICAL_SCORE = Object.freeze({ winner: 13, loser: 7 });

function technicalScore(preferences) {
  return {
    winner: preferences?.technical?.technicalFirst ?? DEFAULT_TECHNICAL_SCORE.winner,
    loser: preferences?.technical?.technicalSecond ?? DEFAULT_TECHNICAL_SCORE.loser,
  };
}

export function planTournamentBWithdrawal(tournament, teamTitle) {
  const teamIndex = tournament?.teams?.findIndex((team) => team.title === teamTitle) ?? -1;
  if (teamIndex < 0 || tournament.teams[teamIndex].withdrawn) {
    return {
      changed: false,
      technicalLossApplied: false,
      teams: tournament?.teams || [],
      games: tournament?.games || [],
    };
  }

  const teams = tournament.teams.map((team, index) =>
    index === teamIndex ? { ...team, withdrawn: true } : { ...team },
  );
  const games = (tournament.games || []).map((round) => round.map((game) => ({ ...game })));
  let technicalLossApplied = false;

  if (tournament.roundIsActive && games.length) {
    const currentRound = games[games.length - 1];
    const game = currentRound.find((item) => item.team_1 === teamTitle || item.team_2 === teamTitle);
    if (game) {
      const score = technicalScore(tournament.preferences);
      const withdrawnIsFirst = game.team_1 === teamTitle;
      game.team_1_score = withdrawnIsFirst ? score.loser : score.winner;
      game.team_2_score = withdrawnIsFirst ? score.winner : score.loser;
      game.status = 'finished';
      game.winner = withdrawnIsFirst ? game.team_2 : game.team_1;
      technicalLossApplied = true;
    }
  }

  return { changed: true, technicalLossApplied, teams, games };
}
