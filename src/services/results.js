import { getAvailableLaneNumbers } from '@/services/lanes';

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
  return bracket.stages.some(
    (stage) => stage.stageLabel !== 'cadrage' && stage.teams?.some((g) => g.team_1 || g.team_2),
  );
}

/**
 * Returns games sorted by group index within each round.
 * If no groups, returns the original games array unchanged.
 */
export function sortGamesByGroup(games, hasGroups) {
  if (!hasGroups || !games) return games;
  return games.map((round) => [...round].sort((a, b) => (a.group ?? 0) - (b.group ?? 0)));
}

/**
 * Returns the number of qualified teams per group for poules (barrage) system.
 * A team qualifies if it has >= minWins (2 for full 3-round robin, 1 otherwise).
 */
export function getPoulesQualifiedPerGroup(rankingTeams, totalRounds) {
  if (!rankingTeams?.length) return [];
  const minWins = totalRounds >= 3 ? 2 : 1;
  return rankingTeams.map((group) => group.filter((team) => team.wins >= minWins).length);
}

/**
 * Returns the number of playoff-qualifying teams per group for standard groups system.
 */
export function getPlayOffTeamsPerGroup(tournament) {
  if ((!tournament.playOff && !tournament.preferences?.playOffEnabled) || !tournament.groups?.length) return 0;
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
export { rankPoulesGroups as computePoulesGroupRankings } from '@/services/group-ranking';

/**
 * Assigns shuffled lane numbers to playoff bracket stages, skipping bye games.
 * Lanes are randomized so that seeding position doesn't dictate the terrain.
 */
export function getShuffledPlayoffLaneOffsets(tournament, count) {
  const fieldsStart = Math.max(Number(tournament?.preferences?.fieldsStart) || 1, 1);
  const availableLanes = getAvailableLaneNumbers(tournament, count);
  const laneNumbers = [...availableLanes];

  // Invalid legacy configurations should still render every match. The playoff
  // confirmation modal prevents new configurations from reaching this branch.
  for (let lane = fieldsStart; laneNumbers.length < count; lane++) {
    if (!laneNumbers.includes(lane)) laneNumbers.push(lane);
  }

  for (let i = laneNumbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [laneNumbers[i], laneNumbers[j]] = [laneNumbers[j], laneNumbers[i]];
  }

  return laneNumbers.slice(0, count).map((lane) => lane - fieldsStart);
}

export function assignPlayoffLanes(stages, tournament, options = {}) {
  const { shared = false, playableOnly = false } = options;
  const isAssignable = (game) =>
    !game.isBye && game.status !== 'skipped' && (!playableOnly || (Boolean(game.team_1) && Boolean(game.team_2)));
  const assign = (targetStages, lanes) => {
    let laneIndex = 0;
    targetStages.forEach((stage) => {
      stage.laneOrder = stage.teams.map((game) => (isAssignable(game) ? lanes[laneIndex++] : null));
    });
  };

  if (shared) {
    const gameCount = stages.reduce((count, stage) => count + stage.teams.filter(isAssignable).length, 0);
    assign(stages, getShuffledPlayoffLaneOffsets(tournament, gameCount));
    return stages;
  }

  stages.forEach((stage) => {
    const gameCount = stage.teams.filter(isAssignable).length;
    assign([stage], getShuffledPlayoffLaneOffsets(tournament, gameCount));
  });
  return stages;
}
