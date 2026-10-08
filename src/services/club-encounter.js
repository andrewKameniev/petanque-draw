// Club match rules are independent of the tournament's pairing/ranking system.
export const CLUB_MIN_PLAYERS = 6;
export const CLUB_ROSTER_SIZES = Object.freeze([8, 9]);
export const CLUB_STATUS = Object.freeze({
  PLANNED: 'planned',
  ACTIVE: 'in_progress',
  COMPLETED: 'completed',
  NOT_PLAYED: 'not_played',
});
export const CLUB_PHASE = Object.freeze({ QUALIFICATION: 'qualification', PLAYOFF: 'playoff' });
export const CLUB_COMMAND = Object.freeze({ LINEUPS: 'lineups', START: 'start', SCORE: 'score', CONTINUE: 'continue' });
export const CLUB_STAGES = Object.freeze([
  Object.freeze({ id: 'singles', count: 6, size: 1, points: 2 }),
  Object.freeze({ id: 'doubles', count: 3, size: 2, points: 3 }),
  Object.freeze({ id: 'triples', count: 2, size: 3, points: 5 }),
]);
export const CLUB_ERROR = Object.freeze({
  ROSTER_SIZE: 'rosterSize',
  PLAYER: 'player',
  DUPLICATE: 'duplicate',
  CLUB: 'club',
  LINEUP: 'lineup',
  LOCKED: 'locked',
  PREVIOUS: 'previous',
  SCORE: 'score',
  MISSING: 'missing',
  ACCESS: 'access',
});
export const CLUB_WIN_POINTS = 16;
export const CLUB_TOTAL_POINTS = 31;
export const CLUB_GAME_SCORE = 13;
export const CLUB_ABSENCE = Object.freeze({ REST: 'rest', WALKOVER: 'walkover' });
export const CLUB_TECHNICAL_SCORE = Object.freeze({ technicalFirst: 21, technicalSecond: 10 });

export function clubAbsenceGame(game, kind = CLUB_ABSENCE.WALKOVER) {
  const rest = kind === CLUB_ABSENCE.REST;
  const firstPresent = !!game.team_1 && game.team_1 !== 'Technical';
  return {
    ...game,
    clubAbsence: kind,
    status: 'finished',
    winner: rest ? null : firstPresent ? game.team_1 : game.team_2,
    team_1_score: rest
      ? null
      : firstPresent
        ? CLUB_TECHNICAL_SCORE.technicalFirst
        : CLUB_TECHNICAL_SCORE.technicalSecond,
    team_2_score: rest
      ? null
      : firstPresent
        ? CLUB_TECHNICAL_SCORE.technicalSecond
        : CLUB_TECHNICAL_SCORE.technicalFirst,
  };
}

export function clubAbsenceHasError(game) {
  if (!Object.values(CLUB_ABSENCE).includes(game.clubAbsence)) return true;
  const expected = clubAbsenceGame(game, game.clubAbsence);
  return ['status', 'winner', 'team_1_score', 'team_2_score'].some(
    (field) => (expected[field] ?? null) !== (game[field] ?? null),
  );
}

export class ClubEncounterError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
function requireRule(condition, code) {
  if (!condition) throw new ClubEncounterError(code);
}
const clone = (value) => JSON.parse(JSON.stringify(value));
const id = (value) => String(value ?? '').trim();
export const isClubCompetition = (tournament) => CLUB_ROSTER_SIZES.includes(tournament?.preferences?.clubRosterSize);

export function validateClubRoster(club, rosterSize, otherClubs = []) {
  requireRule(
    CLUB_ROSTER_SIZES.includes(rosterSize) &&
      Array.isArray(club?.players) &&
      club.players.length >= CLUB_MIN_PLAYERS &&
      club.players.length <= rosterSize,
    CLUB_ERROR.ROSTER_SIZE,
  );
  requireRule(id(club.clubId) && typeof club.title === 'string' && id(club.title), CLUB_ERROR.CLUB);
  requireRule(
    !otherClubs.some((other) => id(other.clubId) === id(club.clubId) || id(other.title) === id(club.title)),
    CLUB_ERROR.CLUB,
  );
  const seen = new Set(otherClubs.flatMap((other) => (other.players || []).map((player) => id(player.id))));
  club.players.forEach((player) => {
    requireRule(
      id(player?.id) &&
        typeof player.name === 'string' &&
        id(player.name) &&
        typeof player.surname === 'string' &&
        id(player.surname),
      CLUB_ERROR.PLAYER,
    );
    requireRule(!seen.has(id(player.id)), CLUB_ERROR.DUPLICATE);
    seen.add(id(player.id));
    requireRule(id(player.club_id), CLUB_ERROR.CLUB);
  });
  const captain = club.players.find((player) => id(player.id) === id(club.captainId ?? club.players[0].id));
  requireRule(captain && id(captain.club_id) === id(club.clubId), CLUB_ERROR.CLUB);
  requireRule(!id(captain.club) || id(captain.club) === id(club.title), CLUB_ERROR.CLUB);
}

export function registerClub(tournament, club) {
  requireRule(isClubCompetition(tournament) && !tournament.games?.length && !tournament.playOff, CLUB_ERROR.LOCKED);
  validateClubRoster(club, tournament.preferences.clubRosterSize, tournament.teams || []);
  return [
    ...(tournament.teams || []),
    {
      ...clone(club),
      title: club.title.trim(),
      clubId: id(club.clubId),
      captainId: id(club.captainId ?? club.players[0].id),
      players: club.players.map((player) => ({
        ...clone(player),
        id: id(player.id),
        club_id: id(player.club_id),
        name: player.name.trim(),
        surname: player.surname.trim(),
      })),
      rating: Number.isFinite(club.rating) ? club.rating : 0,
      wins: 0,
      opponents: [],
      buhgolts: 0,
      smallBuhgolts: 0,
      pointsPlus: 0,
      pointsMinus: 0,
      lanes: [],
    },
  ];
}

export function validateClubLineup(club, stageIndex, positions) {
  const definition = CLUB_STAGES[stageIndex];
  requireRule(definition && Array.isArray(positions) && positions.length === definition.count, CLUB_ERROR.LINEUP);
  const seen = new Set();
  positions.forEach((position) => {
    requireRule(Array.isArray(position) && position.length === definition.size, CLUB_ERROR.LINEUP);
    position.forEach((playerId) => {
      const player = club.players.find((candidate) => id(candidate.id) === id(playerId));
      requireRule(player, CLUB_ERROR.PLAYER);
      requireRule(!seen.has(id(player.id)), CLUB_ERROR.DUPLICATE);
      seen.add(id(player.id));
    });
  });
}

export function createClubEncounter(clubs, rosterSize, phase = CLUB_PHASE.QUALIFICATION) {
  requireRule(clubs?.length === 2 && Object.values(CLUB_PHASE).includes(phase), CLUB_ERROR.MISSING);
  clubs.forEach((club, index) => validateClubRoster(club, rosterSize, clubs.slice(0, index)));
  return {
    phase,
    continuePlaying: false,
    status: CLUB_STATUS.PLANNED,
    winnerClubId: null,
    clubIds: clubs.map((club) => id(club.clubId)),
    points: [0, 0],
    audit: [],
    stages: CLUB_STAGES.map((stage) => ({
      id: stage.id,
      published: false,
      started: false,
      games: Array.from({ length: stage.count }, (_, index) => ({
        position: index + 1,
        players1: [],
        players2: [],
        score1: null,
        score2: null,
        status: CLUB_STATUS.PLANNED,
        winnerClubId: null,
        points1: 0,
        points2: 0,
      })),
    })),
  };
}

export const clubStageComplete = (stage) =>
  !!stage?.games?.length && stage.games.every((game) => game.status === CLUB_STATUS.COMPLETED);
export function clubStagePoints(stage) {
  return (stage?.games || []).reduce(
    (points, game) => [points[0] + (game.points1 || 0), points[1] + (game.points2 || 0)],
    [0, 0],
  );
}
export function validClubScore(score1, score2, complete = true) {
  const valid = [score1, score2].every(
    (score) => typeof score === 'number' && Number.isInteger(score) && score >= 0 && score <= CLUB_GAME_SCORE,
  );
  return valid && (!complete || (Math.max(score1, score2) === CLUB_GAME_SCORE && score1 !== score2));
}

function recalculate(encounter) {
  const points = [0, 0];
  let completeCount = 0;
  encounter.stages.forEach((stage, index) =>
    stage.games.forEach((game) => {
      game.points1 = 0;
      game.points2 = 0;
      game.winnerClubId = null;
      if (game.status !== CLUB_STATUS.COMPLETED) return;
      requireRule(validClubScore(game.score1, game.score2), CLUB_ERROR.SCORE);
      completeCount++;
      const side = game.score1 > game.score2 ? 0 : 1;
      game.winnerClubId = encounter.clubIds[side];
      game[side === 0 ? 'points1' : 'points2'] = CLUB_STAGES[index].points;
      points[side] += CLUB_STAGES[index].points;
    }),
  );
  const early =
    encounter.phase === CLUB_PHASE.PLAYOFF && !encounter.continuePlaying && Math.max(...points) >= CLUB_WIN_POINTS;
  const completed = completeCount === 11 || early;
  encounter.stages.forEach((stage) =>
    stage.games.forEach((game) => {
      if (early && game.status !== CLUB_STATUS.COMPLETED && game.status !== CLUB_STATUS.NOT_PLAYED) {
        game.resumeStatus = game.status;
        game.status = CLUB_STATUS.NOT_PLAYED;
      } else if (!early && game.status === CLUB_STATUS.NOT_PLAYED) {
        game.status = game.resumeStatus || CLUB_STATUS.PLANNED;
        delete game.resumeStatus;
      }
    }),
  );
  encounter.points = points;
  encounter.status = completed
    ? CLUB_STATUS.COMPLETED
    : encounter.stages.some((stage) => stage.started)
      ? CLUB_STATUS.ACTIVE
      : CLUB_STATUS.PLANNED;
  encounter.winnerClubId = completed ? encounter.clubIds[points[0] > points[1] ? 0 : 1] : null;
  return encounter;
}

export function applyClubEncounterCommand(source, clubs, command, { at, actorId } = {}) {
  const encounter = clone(source);
  const previous = clone(source);
  const { type, stageIndex, gameIndex } = command;
  requireRule(Object.values(CLUB_COMMAND).includes(type), CLUB_ERROR.MISSING);
  if (type === CLUB_COMMAND.CONTINUE) {
    requireRule(
      encounter.phase === CLUB_PHASE.PLAYOFF &&
        encounter.status === CLUB_STATUS.COMPLETED &&
        !encounter.stages.every(clubStageComplete),
      CLUB_ERROR.LOCKED,
    );
    encounter.continuePlaying = true;
  } else {
    const stage = encounter.stages[stageIndex];
    requireRule(stage, CLUB_ERROR.MISSING);
    const game = stage.games[gameIndex];
    const correction = type === CLUB_COMMAND.SCORE && game?.status === CLUB_STATUS.COMPLETED;
    requireRule(encounter.status !== CLUB_STATUS.COMPLETED || correction, CLUB_ERROR.LOCKED);
    requireRule(
      stageIndex === 0 || encounter.stages.slice(0, stageIndex).every(clubStageComplete),
      CLUB_ERROR.PREVIOUS,
    );
    if (type === CLUB_COMMAND.LINEUPS) {
      requireRule(!stage.started, CLUB_ERROR.LOCKED);
      [command.positions1, command.positions2].forEach((positions, index) =>
        validateClubLineup(clubs[index], stageIndex, positions),
      );
      stage.games.forEach((match, index) => {
        match.players1 = command.positions1[index].map(id);
        match.players2 = command.positions2[index].map(id);
      });
      stage.published = true;
    } else if (type === CLUB_COMMAND.START) {
      requireRule(stage.published && !stage.started, CLUB_ERROR.LOCKED);
      stage.started = true;
      stage.games.forEach((match) => {
        match.status = CLUB_STATUS.ACTIVE;
      });
    } else {
      requireRule(stage.started && game && game.status !== CLUB_STATUS.NOT_PLAYED, CLUB_ERROR.LOCKED);
      requireRule(!correction || command.complete === true, CLUB_ERROR.LOCKED);
      requireRule(validClubScore(command.score1, command.score2, command.complete), CLUB_ERROR.SCORE);
      game.score1 = command.score1;
      game.score2 = command.score2;
      game.status = command.complete ? CLUB_STATUS.COMPLETED : CLUB_STATUS.ACTIVE;
    }
  }
  recalculate(encounter);
  // Saving an identical result is a true no-op, including the audit trail.
  if (JSON.stringify(encounter) === JSON.stringify(previous)) return encounter;
  const entry = { type, at: at ?? null, actorId: actorId ?? null };
  if (stageIndex != null) entry.stageIndex = stageIndex;
  if (gameIndex != null) entry.gameIndex = gameIndex;
  if (type === CLUB_COMMAND.LINEUPS) {
    entry.before = previous.stages[stageIndex].games.map((game) => [game.players1 || [], game.players2 || []]);
    entry.after = encounter.stages[stageIndex].games.map((game) => [game.players1, game.players2]);
  } else if (type === CLUB_COMMAND.SCORE) {
    const old = previous.stages[stageIndex].games[gameIndex];
    entry.before = [old.score1 ?? null, old.score2 ?? null, old.status];
    entry.after = [command.score1, command.score2, encounter.stages[stageIndex].games[gameIndex].status];
  }
  encounter.audit = [...(encounter.audit || []), entry];
  return encounter;
}

export function clubGameWithResult(game, encounter) {
  const complete = encounter.status === CLUB_STATUS.COMPLETED;
  const firstWon = encounter.points[0] > encounter.points[1];
  return {
    ...clone(game),
    clubEncounter: encounter,
    team_1_score: complete ? encounter.points[0] : null,
    team_2_score: complete ? encounter.points[1] : null,
    status: complete ? 'finished' : encounter.status === CLUB_STATUS.ACTIVE ? 'in_progress' : 'not_started',
    winner: complete ? (firstWon ? game.team_1 : game.team_2) : null,
    loser: complete ? (firstWon ? game.team_2 : game.team_1) : null,
  };
}

export function clubGameHasError(game) {
  try {
    const result = recalculate(clone(game.clubEncounter));
    return (
      result.status !== CLUB_STATUS.COMPLETED ||
      result.points[0] !== game.team_1_score ||
      result.points[1] !== game.team_2_score
    );
  } catch {
    return true;
  }
}

export function getClubGameTarget(tournament, locator) {
  const { roundIndex, gameIndex, stageIndex, kind } = locator;
  if (kind === 'thirdPlace')
    return {
      game: tournament.playOffBracket?.thirdPlace,
      path: 'playOffBracket/thirdPlace',
      phase: CLUB_PHASE.PLAYOFF,
    };
  if (kind === 'playoff')
    return {
      game: tournament.playOffBracket?.stages?.[stageIndex]?.teams?.[gameIndex],
      path: `playOffBracket/stages/${stageIndex}/teams/${gameIndex}`,
      phase: CLUB_PHASE.PLAYOFF,
    };
  if (kind === 'cadrage')
    return { game: tournament.cadrage?.[gameIndex], path: `cadrage/${gameIndex}`, phase: CLUB_PHASE.PLAYOFF };
  requireRule(kind === 'round', CLUB_ERROR.MISSING);
  return {
    game: tournament.games?.[roundIndex]?.[gameIndex],
    path: `games/${roundIndex}/${gameIndex}`,
    phase: CLUB_PHASE.QUALIFICATION,
  };
}

export function canEditClubGame(tournament, locator) {
  if (!isClubCompetition(tournament)) return false;
  if (locator.kind === 'round') return !!tournament.games?.[locator.roundIndex]?.[locator.gameIndex];
  if (locator.kind === 'thirdPlace') return !!tournament.playOffBracket?.thirdPlace?.team_2;
  if (locator.kind === 'cadrage') return !tournament.playOffBracket && !!tournament.cadrage?.[locator.gameIndex];
  const stage = tournament.playOffBracket?.stages?.[locator.stageIndex];
  const currentStage = tournament.playOffStage ?? tournament.playOff?.[0]?.stage;
  return !!stage && (stage.stageLabel === currentStage || (tournament.tournamentIsFinished && stage.stageLabel === 1));
}

export function updateClubGame(tournament, locator, command, metadata) {
  requireRule(canEditClubGame(tournament, locator), CLUB_ERROR.LOCKED);
  const target = getClubGameTarget(tournament, locator);
  requireRule(target.game?.team_1 && target.game?.team_2 && target.game.team_2 !== 'Technical', CLUB_ERROR.MISSING);
  const clubs = [target.game.team_1, target.game.team_2].map((title) =>
    tournament.teams.find((club) => club.title === title),
  );
  const encounter =
    target.game.clubEncounter || createClubEncounter(clubs, tournament.preferences.clubRosterSize, target.phase);
  const next = applyClubEncounterCommand(encounter, clubs, command, metadata);
  // Historical qualification results can be corrected, but cannot reopen a played round.
  if (locator.kind === 'round' && (locator.roundIndex < tournament.games.length - 1 || !tournament.roundIsActive)) {
    requireRule(
      command.type === CLUB_COMMAND.SCORE && target.game.status === 'finished' && next.status === CLUB_STATUS.COMPLETED,
      CLUB_ERROR.LOCKED,
    );
  }
  return { ...target, game: clubGameWithResult(target.game, next) };
}
