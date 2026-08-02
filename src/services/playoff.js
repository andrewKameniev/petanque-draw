const BRACKET_ORDERS = {
  8: null,
  16: [0, 1, 8, 9, 13, 12, 5, 4, 15, 14, 7, 6, 2, 3, 10, 11],
  32: [
    0, 1, 16, 17, 8, 9, 24, 25, 29, 28, 13, 12, 21, 20, 5, 4, 31, 30, 15, 14, 23, 22, 7, 6, 2, 3, 18, 19, 10, 11, 26,
    27,
  ],
  64: [
    0, 1, 32, 33, 8, 9, 40, 41, 16, 17, 56, 57, 24, 25, 48, 49, 4, 5, 36, 37, 12, 13, 60, 61, 20, 21, 52, 53, 28, 29,
    44, 45, 2, 3, 34, 35, 10, 11, 42, 43, 18, 19, 58, 59, 26, 27, 50, 51, 6, 7, 38, 39, 14, 15, 62, 63, 22, 23, 54, 55,
    30, 31, 46, 47,
  ],
  128: [
    0, 1, 64, 65, 32, 33, 96, 97, 8, 9, 72, 73, 40, 41, 104, 105, 16, 17, 80, 81, 56, 57, 112, 113, 24, 25, 88, 89, 48,
    49, 120, 121, 4, 5, 68, 69, 36, 37, 100, 101, 12, 13, 76, 77, 60, 61, 108, 109, 20, 21, 84, 85, 52, 53, 116, 117,
    28, 29, 92, 93, 44, 45, 124, 125, 2, 3, 66, 67, 34, 35, 98, 99, 10, 11, 74, 75, 42, 43, 106, 107, 18, 19, 82, 83,
    58, 59, 114, 115, 26, 27, 90, 91, 50, 51, 122, 123, 6, 7, 70, 71, 38, 39, 102, 103, 14, 15, 78, 79, 62, 63, 110,
    111, 22, 23, 86, 87, 54, 55, 118, 119, 30, 31, 94, 95, 46, 47, 126, 127,
  ],
};

export function buildPlayOffScheme(playOffList, hasCadrage) {
  let playOffScheme = [];
  const stageValue = playOffList.length / 2;

  for (let i = 0; i < playOffList.length / 2; i++) {
    let game;
    if (i % 2 === 0) {
      const t1 = playOffList[i];
      const t2 = playOffList[playOffList.length - 1 - i];
      game = {
        id: i + 1,
        stage: stageValue,
        team_1: t1.title,
        team_1_place: t1.isBye ? '' : i + 1,
        team_1_score: null,
        team_2: t2.title,
        team_2_place: t2.isBye ? '' : hasCadrage ? '' : playOffList.length - i,
        team_2_score: null,
        isBye: !!(t1.isBye || t2.isBye),
      };
    } else {
      const t1 = playOffList[playOffList.length / 2 - i];
      const t2 = playOffList[playOffList.length / 2 - 1 + i];
      game = {
        id: i + 1,
        stage: stageValue,
        team_1: t1.title,
        team_1_place: t1.isBye ? '' : playOffList.length / 2 + 1 - i,
        team_1_score: null,
        team_2: t2.title,
        team_2_place: t2.isBye ? '' : hasCadrage ? '' : playOffList.length / 2 + i,
        team_2_score: null,
        isBye: !!(t1.isBye || t2.isBye),
      };
    }
    playOffScheme.push(game);
  }

  playOffScheme = reorderBracket(playOffScheme, stageValue);
  return playOffScheme;
}

export function reorderBracket(scheme, stageValue) {
  if (stageValue === 8) {
    [scheme[2], scheme[4]] = [scheme[4], scheme[2]];
    [scheme[3], scheme[5]] = [scheme[5], scheme[3]];
    return scheme;
  }
  const order = BRACKET_ORDERS[stageValue];
  if (order) {
    return order.map((index) => scheme[index]);
  }
  return scheme;
}

export function buildCadrageGames(playOffList, teamToPlayOff) {
  const cadrageGames = [];
  for (let i = 0; i < playOffList.length / 2; i++) {
    cadrageGames.push({
      id: i + 1,
      stage: 'cadrage',
      team_1: playOffList[i].title,
      team_1_place: teamToPlayOff / 2 + i + 1,
      team_1_score: null,
      team_2: playOffList[playOffList.length - 1 - i].title,
      team_2_place: playOffList.length + teamToPlayOff / 2 - i,
      team_2_score: null,
    });
  }
  return cadrageGames;
}

function nextPowerOfTwo(value) {
  return Math.pow(2, Math.ceil(Math.log2(Math.max(2, value))));
}

/**
 * Balanced seed positions (8 players: 1-8, 5-4, 3-6, 7-2). Byes therefore
 * go to the highest seeds and seeds 1/2 cannot meet before the upper final.
 */
export function getBracketSeedOrder(size) {
  let order = [1, 2];
  while (order.length < size) {
    const total = order.length * 2 + 1;
    order = order.flatMap((seed, index) => (index % 2 === 0 ? [seed, total - seed] : [total - seed, seed]));
  }
  return order;
}

function source(type, matchId) {
  return { type, matchId };
}

function createDoubleMatch(id, source1, source2) {
  return {
    id,
    source_1: source1,
    source_2: source2,
    team_1: null,
    team_1_score: null,
    team_2: null,
    team_2_score: null,
    status: 'not_started',
  };
}

function createDoubleStage(id, bracket, round, sequence, matches) {
  return {
    id,
    bracket,
    round,
    sequence,
    stageLabel: id,
    teamsCount: matches.length * 2,
    teams: matches,
    laneOrder: matches.map((_, index) => index),
  };
}

/**
 * Builds a dependency-driven double-elimination bracket for any participant
 * count. Non-power-of-two fields are padded with seeded byes. The lower bracket
 * crosses upper-round losers to the opposite side, preventing an immediate
 * rematch after a drop whenever the field contains at least four participants.
 */
export function buildDoubleEliminationBracket(participants) {
  const entrants = participants.filter((participant) => participant?.title && !participant.isBye);
  if (entrants.length < 2) throw new Error('Double elimination requires at least two participants');

  const size = nextPowerOfTwo(entrants.length);
  const upperRoundCount = Math.log2(size);
  const seedOrder = getBracketSeedOrder(size);
  const seededSlots = seedOrder.map((seed) => ({
    type: 'seed',
    seed,
    team: entrants[seed - 1]?.title || null,
  }));
  const stages = [];

  let previousUpper = [];
  for (let round = 1; round <= upperRoundCount; round++) {
    const matchCount = size / Math.pow(2, round);
    const matches = [];
    for (let index = 0; index < matchCount; index++) {
      const id = `U${round}M${index + 1}`;
      const first = round === 1 ? seededSlots[index * 2] : source('winner', previousUpper[index * 2].id);
      const second = round === 1 ? seededSlots[index * 2 + 1] : source('winner', previousUpper[index * 2 + 1].id);
      matches.push(createDoubleMatch(id, first, second));
    }
    stages.push(createDoubleStage(`upper-${round}`, 'upper', round, round === 1 ? 1 : (round - 1) * 2, matches));
    previousUpper = matches;
  }

  let previousLower = [];
  for (let pair = 1; pair < upperRoundCount; pair++) {
    const matchCount = size / Math.pow(2, pair + 1);
    const consolidationRound = pair * 2 - 1;
    const consolidation = [];
    for (let index = 0; index < matchCount; index++) {
      const id = `L${consolidationRound}M${index + 1}`;
      const first = pair === 1 ? source('loser', `U1M${index * 2 + 1}`) : source('winner', previousLower[index * 2].id);
      const second =
        pair === 1 ? source('loser', `U1M${index * 2 + 2}`) : source('winner', previousLower[index * 2 + 1].id);
      consolidation.push(createDoubleMatch(id, first, second));
    }
    stages.push(createDoubleStage(`lower-${consolidationRound}`, 'lower', consolidationRound, pair * 2, consolidation));

    const dropRound = consolidationRound + 1;
    const dropMatches = [];
    for (let index = 0; index < matchCount; index++) {
      const id = `L${dropRound}M${index + 1}`;
      const crossedUpperIndex = matchCount - index;
      dropMatches.push(
        createDoubleMatch(
          id,
          source('winner', consolidation[index].id),
          source('loser', `U${pair + 1}M${crossedUpperIndex}`),
        ),
      );
    }
    stages.push(createDoubleStage(`lower-${dropRound}`, 'lower', dropRound, pair * 2 + 1, dropMatches));
    previousLower = dropMatches;
  }

  const upperFinal = `U${upperRoundCount}M1`;
  const lowerFinal = previousLower[0]?.id || upperFinal;
  const grandFinalOne = createDoubleMatch(
    'GF1',
    source('winner', upperFinal),
    upperRoundCount === 1 ? source('loser', upperFinal) : source('winner', lowerFinal),
  );
  const grandSequence = Math.max(...stages.map((stage) => stage.sequence)) + 1;
  stages.push(createDoubleStage('grand-final-1', 'grand', 1, grandSequence, [grandFinalOne]));

  const bracket = {
    format: 'double',
    version: 1,
    size,
    participantCount: entrants.length,
    grandFinalMode: 'single',
    stages,
    champion: null,
    runnerUp: null,
    placements: {},
  };
  advanceDoubleEliminationBracket(bracket);
  return bracket;
}

function matchMap(bracket) {
  return new Map(bracket.stages.flatMap((stage) => stage.teams).map((match) => [match.id, match]));
}

function resolveSource(input, matches) {
  if (!input) return { ready: false, team: null };
  if (input.type === 'seed') return { ready: true, team: input.team || null };
  const dependency = matches.get(input.matchId);
  if (!dependency || dependency.status !== 'finished' || dependency.resultCommitted === false) {
    return { ready: false, team: null };
  }
  return { ready: true, team: input.type === 'winner' ? dependency.winner || null : dependency.loser || null };
}

function setResolvedTeam(match, field, value) {
  if (match[field] === value) return false;
  match[field] = value;
  return true;
}

function finishAutomaticBye(match, first, second) {
  if (!first.ready || !second.ready || !!first.team === !!second.team) return false;
  match.team_1 = first.team;
  match.team_2 = second.team;
  match.team_1_score = null;
  match.team_2_score = null;
  match.isBye = true;
  match.status = 'finished';
  match.resultCommitted = true;
  match.winner = first.team || second.team;
  match.loser = null;
  return true;
}

export function getDoubleEliminationPlacements(bracket) {
  const placements = {};
  if (bracket.champion) placements[bracket.champion] = 1;
  if (bracket.runnerUp) placements[bracket.runnerUp] = 2;

  let nextPlace = 3;
  const lowerStages = bracket.stages.filter((stage) => stage.bracket === 'lower').sort((a, b) => b.round - a.round);
  lowerStages.forEach((stage) => {
    const eliminated = stage.teams
      .filter((match) => match.resultCommitted !== false)
      .map((match) => match.loser)
      .filter((team) => team && !placements[team]);
    if (!eliminated.length) return;
    const label = eliminated.length === 1 ? nextPlace : `${nextPlace}-${nextPlace + eliminated.length - 1}`;
    eliminated.forEach((team) => {
      placements[team] = label;
    });
    nextPlace += eliminated.length;
  });
  return placements;
}

/** Resolve newly available entrants, automatic byes, and the champion. */
export function advanceDoubleEliminationBracket(bracket) {
  const matches = matchMap(bracket);
  let changed = true;
  let passes = 0;
  while (changed && passes < bracket.stages.length + 2) {
    changed = false;
    passes++;
    bracket.stages.forEach((stage) => {
      stage.teams.forEach((match) => {
        if (match.status === 'finished' || match.status === 'skipped') return;
        const first = resolveSource(match.source_1, matches);
        const second = resolveSource(match.source_2, matches);
        if (first.ready) changed = setResolvedTeam(match, 'team_1', first.team) || changed;
        if (second.ready) changed = setResolvedTeam(match, 'team_2', second.team) || changed;
        if (finishAutomaticBye(match, first, second)) changed = true;
      });
    });
  }

  const firstFinal = matches.get('GF1');
  if (firstFinal?.status === 'finished' && firstFinal.resultCommitted !== false) {
    bracket.champion = firstFinal.winner;
    bracket.runnerUp = firstFinal.loser;
  }
  bracket.placements = getDoubleEliminationPlacements(bracket);
  return bracket;
}

export function findDoubleEliminationMatch(bracket, matchId) {
  for (let stageIndex = 0; stageIndex < bracket.stages.length; stageIndex++) {
    const gameIndex = bracket.stages[stageIndex].teams.findIndex((match) => match.id === matchId);
    if (gameIndex !== -1) return { stageIndex, gameIndex, match: bracket.stages[stageIndex].teams[gameIndex] };
  }
  return null;
}

export function recordDoubleEliminationResult(bracket, matchId, team1Score, team2Score) {
  const found = findDoubleEliminationMatch(bracket, matchId);
  if (!found) throw new Error(`Unknown double-elimination match: ${matchId}`);
  stageDoubleEliminationResult(found.match, team1Score, team2Score);
  found.match.resultCommitted = true;
  return advanceDoubleEliminationBracket(bracket);
}

export function stageDoubleEliminationResult(match, team1Score, team2Score) {
  const first = Number(team1Score);
  const second = Number(team2Score);
  if (!match.team_1 || !match.team_2 || !Number.isFinite(first) || !Number.isFinite(second) || first === second) {
    throw new Error('A playable match requires two teams and a non-drawn score');
  }
  match.team_1_score = first;
  match.team_2_score = second;
  match.status = 'finished';
  match.isBye = false;
  match.resultCommitted = false;
  match.winner = first > second ? match.team_1 : match.team_2;
  match.loser = first > second ? match.team_2 : match.team_1;
  return match;
}

export function getNextDoubleEliminationStage(bracket) {
  return getReadyDoubleEliminationStages(bracket)[0] || null;
}

export function getReadyDoubleEliminationStages(bracket) {
  return bracket.stages
    .filter((stage) =>
      stage.teams.some(
        (match) => match.status !== 'finished' && match.status !== 'skipped' && match.team_1 && match.team_2,
      ),
    )
    .sort((a, b) => a.sequence - b.sequence);
}

export function getEditableDoubleEliminationStages(bracket) {
  const readyIds = new Set(getReadyDoubleEliminationStages(bracket).map((stage) => stage.id));
  return bracket.stages
    .filter((stage) => readyIds.has(stage.id) || stage.teams.some((match) => match.resultCommitted === false))
    .sort((a, b) => a.sequence - b.sequence);
}

export function getPublicDoubleEliminationMatches(stage) {
  return (stage?.teams || []).filter(
    (match) => match.team_1 && match.team_2 && !match.isBye && match.status !== 'skipped',
  );
}

export function getDoubleEliminationParticipantCount(tournament) {
  return tournament?.playOffBracket?.participantCount || tournament?.teams?.length || 0;
}
