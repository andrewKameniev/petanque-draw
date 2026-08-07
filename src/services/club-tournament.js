export const CLUB_SYSTEM = 'club';
export const CLUB_MATCH_TOTAL_POINTS = 31;
export const CLUB_MATCH_POINTS_FOR_WIN = 3;
export const CLUB_ROSTER_MIN = 6;
export const CLUB_ROSTER_MAX = 10;

export const CLUB_PHASES = [
  {
    key: 'singles',
    count: 6,
    weight: 2,
    playersPerTeam: 1,
    variants: ['open', 'open', 'open', 'open', 'open', 'women'],
  },
  {
    key: 'doubles',
    count: 3,
    weight: 3,
    playersPerTeam: 2,
    variants: ['open', 'open', 'mixed'],
  },
  {
    key: 'triples',
    count: 2,
    weight: 5,
    playersPerTeam: 3,
    variants: ['open', 'mixed'],
  },
];

function hasScore(value) {
  return value !== null && value !== undefined && value !== '';
}

function toNumericScore(value) {
  if (!hasScore(value)) return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

export function isValidClubGameScore(game) {
  const scoreOne = toNumericScore(game?.team_1_score);
  const scoreTwo = toNumericScore(game?.team_2_score);
  return (
    scoreOne !== null &&
    scoreTwo !== null &&
    Number.isInteger(scoreOne) &&
    Number.isInteger(scoreTwo) &&
    scoreOne >= 0 &&
    scoreOne <= 13 &&
    scoreTwo >= 0 &&
    scoreTwo <= 13 &&
    scoreOne !== scoreTwo
  );
}

function createPlayerSlots(count) {
  return Array.from({ length: count }, () => '');
}

export function createClubDisciplineGames() {
  return CLUB_PHASES.flatMap((phase) =>
    Array.from({ length: phase.count }, (_, index) => ({
      id: `${phase.key}-${index + 1}`,
      phase: phase.key,
      number: index + 1,
      variant: phase.variants[index],
      weight: phase.weight,
      playersPerTeam: phase.playersPerTeam,
      team_1_players: createPlayerSlots(phase.playersPerTeam),
      team_2_players: createPlayerSlots(phase.playersPerTeam),
      team_1_score: null,
      team_2_score: null,
      status: 'not_started',
    })),
  );
}

export function createClubMatch(game) {
  return {
    ...game,
    team_1_score: null,
    team_2_score: null,
    status: 'not_started',
    clubMatch: {
      version: 1,
      disciplines: createClubDisciplineGames(),
      summary: {
        team_1_game_points: 0,
        team_2_game_points: 0,
        team_1_games_won: 0,
        team_2_games_won: 0,
        completed_games: 0,
        total_games: 11,
      },
    },
  };
}

export function createClubRound(round = []) {
  return round.map((game) => (game.clubMatch ? syncClubMatch(game) : createClubMatch(game)));
}

export function getClubPhaseGames(game, phaseKey) {
  return (game?.clubMatch?.disciplines || []).filter((discipline) => discipline.phase === phaseKey);
}

export function getClubMatchSummary(game) {
  const disciplines = game?.clubMatch?.disciplines || [];
  const summary = {
    team_1_game_points: 0,
    team_2_game_points: 0,
    team_1_games_won: 0,
    team_2_games_won: 0,
    completed_games: 0,
    total_games: disciplines.length,
  };

  disciplines.forEach((discipline) => {
    if (!isValidClubGameScore(discipline)) return;
    const scoreOne = Number(discipline.team_1_score);
    const scoreTwo = Number(discipline.team_2_score);
    summary.completed_games++;
    if (scoreOne > scoreTwo) {
      summary.team_1_game_points += discipline.weight;
      summary.team_1_games_won++;
    } else {
      summary.team_2_game_points += discipline.weight;
      summary.team_2_games_won++;
    }
  });

  return summary;
}

function disciplineHasActivity(discipline) {
  return (
    hasScore(discipline.team_1_score) ||
    hasScore(discipline.team_2_score) ||
    discipline.team_1_players?.some(Boolean) ||
    discipline.team_2_players?.some(Boolean)
  );
}

export function syncClubMatch(game) {
  if (!game?.clubMatch?.disciplines) return game;

  game.clubMatch.disciplines.forEach((discipline) => {
    if (isValidClubGameScore(discipline)) {
      discipline.team_1_score = Number(discipline.team_1_score);
      discipline.team_2_score = Number(discipline.team_2_score);
      discipline.status = 'finished';
      discipline.winner = discipline.team_1_score > discipline.team_2_score ? game.team_1 : game.team_2;
    } else {
      discipline.status = disciplineHasActivity(discipline) ? 'in_progress' : 'not_started';
      delete discipline.winner;
    }
  });

  const summary = getClubMatchSummary(game);
  game.clubMatch.summary = summary;
  const hasActivity = game.clubMatch.disciplines.some(disciplineHasActivity);
  const isComplete = summary.total_games === 11 && summary.completed_games === summary.total_games;

  game.team_1_score = hasActivity ? summary.team_1_game_points : null;
  game.team_2_score = hasActivity ? summary.team_2_game_points : null;
  game.status = isComplete ? 'finished' : hasActivity ? 'in_progress' : 'not_started';

  if (isComplete) {
    game.winner = summary.team_1_game_points > summary.team_2_game_points ? game.team_1 : game.team_2;
  } else {
    delete game.winner;
  }

  return game;
}

export function isClubMatchComplete(game) {
  const summary = getClubMatchSummary(game);
  return summary.total_games === 11 && summary.completed_games === summary.total_games;
}

export function getClubMatchScoreErrors(game) {
  return (game?.clubMatch?.disciplines || [])
    .filter((discipline) => !isValidClubGameScore(discipline))
    .map((discipline) => discipline.id);
}

export function getClubLineupConflicts(game, side) {
  const playerField = side === 'team_2' ? 'team_2_players' : 'team_1_players';
  const conflicts = [];

  CLUB_PHASES.forEach((phase) => {
    const seen = new Set();
    getClubPhaseGames(game, phase.key).forEach((discipline) => {
      (discipline[playerField] || []).filter(Boolean).forEach((playerKey) => {
        if (seen.has(playerKey)) conflicts.push({ phase: phase.key, playerKey });
        seen.add(playerKey);
      });
    });
  });

  return conflicts;
}

export function getClubRosterStatus(team) {
  const count = Array.isArray(team?.players) ? team.players.length : 0;
  return {
    count,
    valid: count >= CLUB_ROSTER_MIN && count <= CLUB_ROSTER_MAX,
    tooSmall: count < CLUB_ROSTER_MIN,
    tooLarge: count > CLUB_ROSTER_MAX,
  };
}

function createClubStats(team) {
  return {
    ...team,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    matchPoints: 0,
    pointsPlus: 0,
    pointsMinus: 0,
    gamesWon: 0,
    gamesLost: 0,
  };
}

function addMatchToStats(stats, game) {
  const summary = game.clubMatch?.summary || getClubMatchSummary(game);
  const teamOne = stats.get(game.team_1);
  const teamTwo = stats.get(game.team_2);
  if (!teamOne || !teamTwo) return;

  teamOne.gamesPlayed++;
  teamTwo.gamesPlayed++;
  teamOne.pointsPlus += summary.team_1_game_points;
  teamOne.pointsMinus += summary.team_2_game_points;
  teamTwo.pointsPlus += summary.team_2_game_points;
  teamTwo.pointsMinus += summary.team_1_game_points;
  teamOne.gamesWon += summary.team_1_games_won;
  teamOne.gamesLost += summary.team_2_games_won;
  teamTwo.gamesWon += summary.team_2_games_won;
  teamTwo.gamesLost += summary.team_1_games_won;

  if (summary.team_1_game_points > summary.team_2_game_points) {
    teamOne.wins++;
    teamOne.matchPoints += CLUB_MATCH_POINTS_FOR_WIN;
    teamTwo.losses++;
  } else {
    teamTwo.wins++;
    teamTwo.matchPoints += CLUB_MATCH_POINTS_FOR_WIN;
    teamOne.losses++;
  }
}

function getFinishedClubMatches(tournament) {
  return (tournament?.games || [])
    .flat()
    .filter((game) => game?.clubMatch && game.status === 'finished' && isClubMatchComplete(game));
}

function rankTiedClubTeams(cluster, matches) {
  if (cluster.length <= 1) return cluster;
  const names = new Set(cluster.map((team) => team.title));
  const miniStats = new Map(cluster.map((team) => [team.title, createClubStats(team)]));
  matches
    .filter((game) => names.has(game.team_1) && names.has(game.team_2))
    .forEach((game) => addMatchToStats(miniStats, game));

  return cluster.slice().sort((teamOne, teamTwo) => {
    const miniOne = miniStats.get(teamOne.title);
    const miniTwo = miniStats.get(teamTwo.title);
    return (
      miniTwo.matchPoints - miniOne.matchPoints ||
      miniTwo.pointsPlus - miniTwo.pointsMinus - (miniOne.pointsPlus - miniOne.pointsMinus) ||
      miniTwo.pointsPlus - miniOne.pointsPlus ||
      teamTwo.pointsPlus - teamTwo.pointsMinus - (teamOne.pointsPlus - teamOne.pointsMinus) ||
      teamTwo.pointsPlus - teamOne.pointsPlus ||
      teamTwo.gamesWon - teamOne.gamesWon ||
      teamOne.title.localeCompare(teamTwo.title)
    );
  });
}

function rankClubGroup(group, matches) {
  const stats = new Map(group.map((team) => [team.title, createClubStats(team)]));
  const groupNames = new Set(group.map((team) => team.title));
  matches
    .filter((game) => groupNames.has(game.team_1) && groupNames.has(game.team_2))
    .forEach((game) => addMatchToStats(stats, game));

  const byMatchPoints = [...stats.values()].sort((a, b) => b.matchPoints - a.matchPoints);
  const ranked = [];
  for (let index = 0; index < byMatchPoints.length;) {
    const matchPoints = byMatchPoints[index].matchPoints;
    const cluster = [];
    while (index < byMatchPoints.length && byMatchPoints[index].matchPoints === matchPoints) {
      cluster.push(byMatchPoints[index]);
      index++;
    }
    ranked.push(...rankTiedClubTeams(cluster, matches));
  }
  return ranked;
}

export function rankClubTournament(tournament) {
  const groups = tournament?.groups?.length ? tournament.groups : [tournament?.teams || []];
  const matches = getFinishedClubMatches(tournament);
  return groups.map((group) => rankClubGroup(group, matches));
}

export function autoFillClubMatch(game, random = Math.random) {
  if (!game?.clubMatch?.disciplines) return game;
  game.clubMatch.disciplines.forEach((discipline) => {
    const teamOneWins = random() >= 0.5;
    const losingScore = Math.floor(random() * 13);
    discipline.team_1_score = teamOneWins ? 13 : losingScore;
    discipline.team_2_score = teamOneWins ? losingScore : 13;
  });
  return syncClubMatch(game);
}

export function autoFillClubRound(round = [], random = Math.random) {
  round.forEach((game) => autoFillClubMatch(game, random));
  return round;
}
