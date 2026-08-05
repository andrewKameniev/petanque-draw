/**
 * Pure group statistics accumulation and ranking pipeline.
 * All functions return new objects — inputs are never mutated.
 */

/**
 * Accumulate wins/points from games for a group of teams.
 * Returns a new array of team objects with stats populated.
 */
export function computeGroupStats(group, allRoundGames, { filterByGroup = null, includeStatuses = null } = {}) {
  const teamWins = {};
  const teamPointsPlus = {};
  const teamPointsMinus = {};
  const teamSet = new Set();

  group.forEach((t) => {
    teamWins[t.title] = 0;
    teamPointsPlus[t.title] = 0;
    teamPointsMinus[t.title] = 0;
    teamSet.add(t.title);
  });

  allRoundGames.forEach((roundGames) => {
    const games = filterByGroup !== null ? roundGames.filter((g) => g.group === filterByGroup) : roundGames;
    games.forEach((game) => {
      if (game.team_1_score == null || game.team_2_score == null) return;
      if (includeStatuses && !includeStatuses.includes(game.status)) return;
      const t1 = game.team_1;
      const t2 = game.team_2;
      if (!teamSet.has(t1) || !teamSet.has(t2)) return;
      const s1 = Number(game.team_1_score);
      const s2 = Number(game.team_2_score);
      teamPointsPlus[t1] += s1;
      teamPointsMinus[t1] += s2;
      teamPointsPlus[t2] += s2;
      teamPointsMinus[t2] += s1;
      if (s1 > s2) {
        teamWins[t1]++;
      } else if (s2 > s1) {
        teamWins[t2]++;
      }
    });
  });

  return group.map((team) => ({
    ...team,
    wins: teamWins[team.title] || 0,
    pointsPlus: teamPointsPlus[team.title] || 0,
    pointsMinus: teamPointsMinus[team.title] || 0,
  }));
}

const FINISHED_STATUSES = ['finished'];

/**
 * Rank teams by wins descending, then by point difference descending.
 * Used for poules, barrage, and simple group display.
 */
export function rankByWinsAndDiff(teams) {
  return teams.slice().sort((a, b) => b.wins - a.wins || b.pointsPlus - b.pointsMinus - (a.pointsPlus - a.pointsMinus));
}

/**
 * Compute ranked group stats for poules groups.
 * Filters games by group index, does NOT filter by status (poules include all scored games).
 */
export function rankPoulesGroups(tournament) {
  if (!tournament.groups || !tournament.games?.length) return [];
  return tournament.groups.map((group, groupIndex) => {
    const stats = computeGroupStats(group, tournament.games, { filterByGroup: groupIndex });
    return rankByWinsAndDiff(stats);
  });
}

/**
 * Compute ranked group stats for barrage groups.
 * Uses games from barrage.startIndex onward, filtered by group index.
 */
export function rankBarrageGroups(tournament) {
  if (!tournament.barrage?.groups || !tournament.games?.length) return [];
  const barrageGames = tournament.games.slice(tournament.barrage.startIndex);
  return tournament.barrage.groups.map((group, groupIndex) => {
    const stats = computeGroupStats(group, barrageGames, { filterByGroup: groupIndex });
    return rankByWinsAndDiff(stats);
  });
}

/**
 * Compute ranked group stats for round-robin groups.
 * Only includes finished games, applies regulation h2h tie-breaking.
 */
export function rankRoundRobinGroups(tournament, rankGroupByRegulations) {
  if (!tournament.groups) return [];
  if (!tournament.games?.length) return tournament.groups.map((g) => g.slice());
  return tournament.groups.map((group) => {
    const stats = computeGroupStats(group, tournament.games, { includeStatuses: FINISHED_STATUSES });
    return rankGroupByRegulations(stats, tournament.games);
  });
}

/**
 * Compute ranked group stats for swiss-format groups.
 * Filters opponents to only those within the same group, then applies Buchholz sorting.
 */
export function rankSwissGroups(tournament, sortTeams) {
  if (!tournament.groups) return [];
  const teamMap = new Map(tournament.teams.map((t) => [t.title, t]));
  return tournament.groups.map((group) => {
    const groupTitles = new Set(group.map((g) => g.title));
    const groupTeams = group.map((g) => {
      const fullTeam = teamMap.get(g.title);
      if (!fullTeam) return { ...g, opponents: [], wins: 0, pointsPlus: 0, pointsMinus: 0 };
      return {
        ...fullTeam,
        opponents: (fullTeam.opponents || []).filter((o) => groupTitles.has(o)),
      };
    });
    return sortTeams(groupTeams);
  });
}
