import { describe, it, expect } from 'vitest';
import {
  computeGroupStats,
  rankByWinsAndDiff,
  rankPoulesGroups,
  rankBarrageGroups,
  rankRoundRobinGroups,
  rankSwissGroups,
} from '@/services/group-ranking';
import { rankGroupByRegulations, sortTeams } from '@/helpers';

function makeGame(t1, t2, s1, s2, opts = {}) {
  return { team_1: t1, team_2: t2, team_1_score: s1, team_2_score: s2, status: 'finished', ...opts };
}

function makeTeam(title) {
  return { title };
}

describe('computeGroupStats', () => {
  it('accumulates wins and points from finished games', () => {
    const group = [makeTeam('A'), makeTeam('B')];
    const games = [[makeGame('A', 'B', 13, 10)]];
    const result = computeGroupStats(group, games);
    expect(result[0]).toMatchObject({ title: 'A', wins: 1, pointsPlus: 13, pointsMinus: 10 });
    expect(result[1]).toMatchObject({ title: 'B', wins: 0, pointsPlus: 10, pointsMinus: 13 });
  });

  it('does not mutate the input group', () => {
    const group = [makeTeam('A'), makeTeam('B')];
    const games = [[makeGame('A', 'B', 13, 10)]];
    computeGroupStats(group, games);
    expect(group[0].wins).toBeUndefined();
    expect(group[1].pointsPlus).toBeUndefined();
  });

  it('converts string scores to numbers', () => {
    const group = [makeTeam('A'), makeTeam('B')];
    const games = [[makeGame('A', 'B', '9', '13')]];
    const result = computeGroupStats(group, games);
    expect(result[0]).toMatchObject({ wins: 0, pointsPlus: 9, pointsMinus: 13 });
    expect(result[1]).toMatchObject({ wins: 1, pointsPlus: 13, pointsMinus: 9 });
  });

  it('ignores games with null scores', () => {
    const group = [makeTeam('A'), makeTeam('B')];
    const games = [[makeGame('A', 'B', null, null)]];
    const result = computeGroupStats(group, games);
    expect(result[0]).toMatchObject({ wins: 0, pointsPlus: 0, pointsMinus: 0 });
  });

  it('ignores games with one null score', () => {
    const group = [makeTeam('A'), makeTeam('B')];
    const games = [[makeGame('A', 'B', 13, null)]];
    const result = computeGroupStats(group, games);
    expect(result[0]).toMatchObject({ wins: 0, pointsPlus: 0, pointsMinus: 0 });
  });

  it('ignores games between teams outside the group', () => {
    const group = [makeTeam('A'), makeTeam('B')];
    const games = [[makeGame('A', 'X', 13, 5), makeGame('A', 'B', 13, 10)]];
    const result = computeGroupStats(group, games);
    expect(result[0]).toMatchObject({ wins: 1, pointsPlus: 13, pointsMinus: 10 });
  });

  it('filters by group index when filterByGroup is provided', () => {
    const group = [makeTeam('A'), makeTeam('B')];
    const games = [[makeGame('A', 'B', 13, 10, { group: 0 }), makeGame('A', 'B', 5, 13, { group: 1 })]];
    const result = computeGroupStats(group, games, { filterByGroup: 0 });
    expect(result[0]).toMatchObject({ wins: 1, pointsPlus: 13, pointsMinus: 10 });
  });

  it('filters by status when includeStatuses is provided', () => {
    const group = [makeTeam('A'), makeTeam('B')];
    const games = [
      [makeGame('A', 'B', 13, 10, { status: 'finished' }), makeGame('A', 'B', 13, 5, { status: 'in_progress' })],
    ];
    const result = computeGroupStats(group, games, { includeStatuses: ['finished'] });
    expect(result[0]).toMatchObject({ wins: 1, pointsPlus: 13, pointsMinus: 10 });
  });

  it('includes all statuses when includeStatuses is null', () => {
    const group = [makeTeam('A'), makeTeam('B')];
    const games = [
      [makeGame('A', 'B', 13, 10, { status: 'finished' }), makeGame('A', 'B', 13, 5, { status: 'in_progress' })],
    ];
    const result = computeGroupStats(group, games, { includeStatuses: null });
    expect(result[0]).toMatchObject({ wins: 2, pointsPlus: 26, pointsMinus: 15 });
  });

  it('handles empty group', () => {
    const result = computeGroupStats([], [[makeGame('A', 'B', 13, 10)]]);
    expect(result).toEqual([]);
  });

  it('handles empty games', () => {
    const group = [makeTeam('A'), makeTeam('B')];
    const result = computeGroupStats(group, []);
    expect(result[0]).toMatchObject({ wins: 0, pointsPlus: 0, pointsMinus: 0 });
  });

  it('handles draws (equal scores)', () => {
    const group = [makeTeam('A'), makeTeam('B')];
    const games = [[makeGame('A', 'B', 10, 10)]];
    const result = computeGroupStats(group, games);
    expect(result[0]).toMatchObject({ wins: 0, pointsPlus: 10, pointsMinus: 10 });
    expect(result[1]).toMatchObject({ wins: 0, pointsPlus: 10, pointsMinus: 10 });
  });

  it('accumulates across multiple rounds', () => {
    const group = [makeTeam('A'), makeTeam('B')];
    const games = [[makeGame('A', 'B', 13, 10)], [makeGame('B', 'A', 13, 5)]];
    const result = computeGroupStats(group, games);
    expect(result[0]).toMatchObject({ wins: 1, pointsPlus: 18, pointsMinus: 23 });
    expect(result[1]).toMatchObject({ wins: 1, pointsPlus: 23, pointsMinus: 18 });
  });

  it('preserves extra properties on team objects', () => {
    const group = [{ title: 'A', rating: 1500, club: 'FC' }];
    const result = computeGroupStats(group, []);
    expect(result[0]).toMatchObject({ title: 'A', rating: 1500, club: 'FC', wins: 0 });
  });
});

describe('rankByWinsAndDiff', () => {
  it('sorts by wins descending', () => {
    const teams = [
      { title: 'A', wins: 1, pointsPlus: 10, pointsMinus: 10 },
      { title: 'B', wins: 3, pointsPlus: 30, pointsMinus: 10 },
      { title: 'C', wins: 2, pointsPlus: 20, pointsMinus: 15 },
    ];
    const result = rankByWinsAndDiff(teams);
    expect(result.map((t) => t.title)).toEqual(['B', 'C', 'A']);
  });

  it('breaks ties by point difference', () => {
    const teams = [
      { title: 'A', wins: 2, pointsPlus: 20, pointsMinus: 15 },
      { title: 'B', wins: 2, pointsPlus: 25, pointsMinus: 10 },
    ];
    const result = rankByWinsAndDiff(teams);
    expect(result[0].title).toBe('B');
  });

  it('does not mutate input', () => {
    const teams = [
      { title: 'A', wins: 1, pointsPlus: 10, pointsMinus: 5 },
      { title: 'B', wins: 2, pointsPlus: 20, pointsMinus: 10 },
    ];
    const original = [...teams];
    rankByWinsAndDiff(teams);
    expect(teams[0].title).toBe(original[0].title);
  });
});

describe('rankPoulesGroups', () => {
  it('returns empty for null groups', () => {
    expect(rankPoulesGroups({ groups: null, games: [] })).toEqual([]);
  });

  it('returns empty for null games', () => {
    expect(rankPoulesGroups({ groups: [[makeTeam('A')]], games: null })).toEqual([]);
  });

  it('computes stats and ranks each group', () => {
    const tournament = {
      groups: [[makeTeam('A'), makeTeam('B'), makeTeam('C')]],
      games: [
        [
          makeGame('A', 'B', 13, 10, { group: 0 }),
          makeGame('B', 'C', 13, 5, { group: 0 }),
          makeGame('A', 'C', 13, 7, { group: 0 }),
        ],
      ],
    };
    const result = rankPoulesGroups(tournament);
    expect(result[0].map((t) => t.title)).toEqual(['A', 'B', 'C']);
  });

  it('handles multiple groups independently', () => {
    const tournament = {
      groups: [
        [makeTeam('A'), makeTeam('B')],
        [makeTeam('C'), makeTeam('D')],
      ],
      games: [[makeGame('A', 'B', 5, 13, { group: 0 }), makeGame('C', 'D', 13, 5, { group: 1 })]],
    };
    const result = rankPoulesGroups(tournament);
    expect(result[0][0].title).toBe('B');
    expect(result[1][0].title).toBe('C');
  });

  it('does not mutate input tournament', () => {
    const group = [makeTeam('A'), makeTeam('B')];
    const tournament = {
      groups: [group],
      games: [[makeGame('A', 'B', 13, 10, { group: 0 })]],
    };
    rankPoulesGroups(tournament);
    expect(group[0].wins).toBeUndefined();
  });

  it('converts string scores to numbers (fixes legacy bug)', () => {
    const tournament = {
      groups: [[makeTeam('A'), makeTeam('B')]],
      games: [[makeGame('A', 'B', '9', '13', { group: 0 })]],
    };
    const result = rankPoulesGroups(tournament);
    expect(result[0][0].title).toBe('B');
    expect(result[0][0].pointsPlus).toBe(13);
  });
});

describe('rankBarrageGroups', () => {
  it('returns empty for missing barrage', () => {
    expect(rankBarrageGroups({ barrage: null, games: [] })).toEqual([]);
  });

  it('uses only games from startIndex onward', () => {
    const tournament = {
      barrage: {
        startIndex: 2,
        groups: [[makeTeam('A'), makeTeam('B')]],
      },
      games: [
        [makeGame('A', 'B', 13, 10, { group: 0 })],
        [makeGame('A', 'B', 13, 5, { group: 0 })],
        [makeGame('B', 'A', 13, 5, { group: 0 })],
      ],
    };
    const result = rankBarrageGroups(tournament);
    expect(result[0][0].title).toBe('B');
    expect(result[0][0].wins).toBe(1);
  });

  it('filters by group index', () => {
    const tournament = {
      barrage: {
        startIndex: 0,
        groups: [
          [makeTeam('A'), makeTeam('B')],
          [makeTeam('C'), makeTeam('D')],
        ],
      },
      games: [[makeGame('B', 'A', 13, 5, { group: 0 }), makeGame('C', 'D', 13, 10, { group: 1 })]],
    };
    const result = rankBarrageGroups(tournament);
    expect(result[0][0].title).toBe('B');
    expect(result[1][0].title).toBe('C');
  });

  it('does not mutate input', () => {
    const group = [makeTeam('A'), makeTeam('B')];
    const tournament = {
      barrage: { startIndex: 0, groups: [group] },
      games: [[makeGame('A', 'B', 13, 10, { group: 0 })]],
    };
    rankBarrageGroups(tournament);
    expect(group[0].wins).toBeUndefined();
  });
});

describe('rankRoundRobinGroups', () => {
  it('returns empty slices when no games', () => {
    const tournament = { groups: [[makeTeam('A'), makeTeam('B')]], games: [] };
    const result = rankRoundRobinGroups(tournament, rankGroupByRegulations);
    expect(result[0].map((t) => t.title)).toEqual(['A', 'B']);
  });

  it('only includes finished games', () => {
    const tournament = {
      groups: [[makeTeam('A'), makeTeam('B')]],
      games: [
        [makeGame('B', 'A', 13, 10, { status: 'finished' }), makeGame('A', 'B', 13, 5, { status: 'in_progress' })],
      ],
    };
    const result = rankRoundRobinGroups(tournament, rankGroupByRegulations);
    expect(result[0][0].title).toBe('B');
    expect(result[0][0].wins).toBe(1);
  });

  it('applies h2h tie-breaking via rankGroupByRegulations', () => {
    const tournament = {
      groups: [[makeTeam('A'), makeTeam('B'), makeTeam('C')]],
      games: [[makeGame('A', 'B', 13, 10), makeGame('B', 'C', 13, 7), makeGame('C', 'A', 13, 8)]],
    };
    const result = rankRoundRobinGroups(tournament, rankGroupByRegulations);
    // h2h diff: A=-2, B=+3, C=-1 → B first
    expect(result[0][0].title).toBe('B');
    expect(result[0][1].title).toBe('C');
    expect(result[0][2].title).toBe('A');
  });

  it('does not mutate input', () => {
    const group = [makeTeam('A'), makeTeam('B')];
    const tournament = { groups: [group], games: [[makeGame('A', 'B', 13, 10)]] };
    rankRoundRobinGroups(tournament, rankGroupByRegulations);
    expect(group[0].wins).toBeUndefined();
  });
});

describe('rankSwissGroups', () => {
  it('filters opponents to group members only', () => {
    const tournament = {
      teams: [
        { title: 'A', wins: 2, pointsPlus: 26, pointsMinus: 15, opponents: ['B', 'X'] },
        { title: 'B', wins: 1, pointsPlus: 13, pointsMinus: 10, opponents: ['A'] },
      ],
      groups: [[{ title: 'A' }, { title: 'B' }]],
    };
    const result = rankSwissGroups(tournament, sortTeams);
    expect(result[0][0].opponents).toEqual(['B']);
    expect(result[0][1].opponents).toEqual(['A']);
  });

  it('handles missing team in map gracefully', () => {
    const tournament = {
      teams: [{ title: 'A', wins: 1, pointsPlus: 13, pointsMinus: 10, opponents: [] }],
      groups: [[{ title: 'A' }, { title: 'MISSING' }]],
    };
    const result = rankSwissGroups(tournament, sortTeams);
    expect(result[0]).toHaveLength(2);
    const missing = result[0].find((t) => t.title === 'MISSING');
    expect(missing.wins).toBe(0);
  });
});

describe('computeGroupStats — odd/bye schedules', () => {
  it('handles odd group (5 teams) with bye games correctly', () => {
    const group = [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D'), makeTeam('E')];
    const games = [
      [
        makeGame('A', 'B', 13, 10),
        makeGame('C', 'D', 13, 7),
        // E has a bye — no game
      ],
      [
        makeGame('A', 'C', 10, 13),
        makeGame('B', 'E', 13, 8),
        // D has a bye
      ],
    ];
    const result = computeGroupStats(group, games);
    expect(result.find((t) => t.title === 'A')).toMatchObject({ wins: 1, pointsPlus: 23, pointsMinus: 23 });
    expect(result.find((t) => t.title === 'E')).toMatchObject({ wins: 0, pointsPlus: 8, pointsMinus: 13 });
    expect(result.find((t) => t.title === 'D')).toMatchObject({ wins: 0, pointsPlus: 7, pointsMinus: 13 });
  });

  it('bye teams still get zero stats when they never play', () => {
    const group = [makeTeam('A'), makeTeam('B'), makeTeam('C')];
    const games = [[makeGame('A', 'B', 13, 10)]];
    const result = computeGroupStats(group, games);
    expect(result.find((t) => t.title === 'C')).toMatchObject({ wins: 0, pointsPlus: 0, pointsMinus: 0 });
  });

  it('3-team round-robin ranks correctly through regulation', () => {
    const group = [makeTeam('A'), makeTeam('B'), makeTeam('C')];
    const games = [[makeGame('A', 'B', 13, 10)], [makeGame('B', 'C', 13, 7)], [makeGame('C', 'A', 13, 8)]];
    const result = rankRoundRobinGroups({ groups: [group], games }, rankGroupByRegulations);
    expect(result[0].every((t) => t.wins === 1)).toBe(true);
  });
});

describe('computeGroupStats — multi-circle aggregation', () => {
  it('accumulates stats across multiple circles (repeated rounds)', () => {
    const group = [makeTeam('A'), makeTeam('B')];
    const circle1 = [makeGame('A', 'B', 13, 10)];
    const circle2 = [makeGame('A', 'B', 8, 13)];
    const circle3 = [makeGame('B', 'A', 10, 13)];
    const games = [circle1, circle2, circle3];
    const result = computeGroupStats(group, games);
    expect(result.find((t) => t.title === 'A')).toMatchObject({ wins: 2, pointsPlus: 34, pointsMinus: 33 });
    expect(result.find((t) => t.title === 'B')).toMatchObject({ wins: 1, pointsPlus: 33, pointsMinus: 34 });
  });

  it('multi-circle 4-team group produces cumulative results', () => {
    const group = [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')];
    const circle1 = [makeGame('A', 'B', 13, 10), makeGame('C', 'D', 13, 7)];
    const circle2 = [makeGame('A', 'C', 10, 13), makeGame('B', 'D', 13, 5)];
    const circle3 = [makeGame('A', 'D', 13, 9), makeGame('B', 'C', 10, 13)];
    const circle1b = [makeGame('A', 'B', 10, 13), makeGame('C', 'D', 8, 13)];
    const circle2b = [makeGame('A', 'C', 13, 7), makeGame('B', 'D', 10, 13)];
    const circle3b = [makeGame('A', 'D', 13, 11), makeGame('B', 'C', 13, 10)];
    const games = [circle1, circle2, circle3, circle1b, circle2b, circle3b];
    const result = computeGroupStats(group, games);
    const totalWins = result.reduce((sum, t) => sum + t.wins, 0);
    expect(totalWins).toBe(12);
  });

  it('ranking reflects cumulative circles not just last circle', () => {
    const group = [makeTeam('A'), makeTeam('B'), makeTeam('C')];
    const games = [
      [makeGame('A', 'B', 13, 10), makeGame('A', 'C', 13, 7)],
      [makeGame('B', 'C', 13, 5)],
      [makeGame('A', 'B', 13, 10), makeGame('A', 'C', 13, 7)],
      [makeGame('B', 'C', 13, 5)],
    ];
    const result = rankRoundRobinGroups({ groups: [group], games }, rankGroupByRegulations);
    expect(result[0][0].title).toBe('A');
    expect(result[0][0].wins).toBe(4);
  });
});

describe('consistency: getTeamsRanking produces same results as direct selectors', () => {
  it('poules ranking matches rankPoulesGroups', async () => {
    const { getTeamsRanking } = await import('@/helpers');
    const tournament = {
      system: 'poules',
      teams: [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')],
      groups: [
        [makeTeam('A'), makeTeam('B')],
        [makeTeam('C'), makeTeam('D')],
      ],
      games: [
        [makeGame('A', 'B', 13, 10, { group: 0 }), makeGame('D', 'C', 13, 5, { group: 1 })],
        [makeGame('B', 'A', 13, 5, { group: 0 }), makeGame('C', 'D', 13, 10, { group: 1 })],
      ],
    };
    const fromHelper = getTeamsRanking(tournament, 3);
    const fromService = rankPoulesGroups(tournament);
    expect(fromHelper).toEqual(fromService);
  });

  it('barrage ranking matches rankBarrageGroups', async () => {
    const { getTeamsRanking } = await import('@/helpers');
    const tournament = {
      system: 'poules',
      teams: [makeTeam('A'), makeTeam('B')],
      barrage: { startIndex: 1, groups: [[makeTeam('A'), makeTeam('B')]] },
      games: [[makeGame('A', 'B', 13, 10, { group: 0 })], [makeGame('B', 'A', 13, 5, { group: 0 })]],
    };
    const fromHelper = getTeamsRanking(tournament, 2);
    const fromService = rankBarrageGroups(tournament);
    expect(fromHelper).toEqual(fromService);
  });

  it('round-robin ranking matches rankRoundRobinGroups', async () => {
    const { getTeamsRanking } = await import('@/helpers');
    const tournament = {
      system: 'groups',
      teams: [makeTeam('A'), makeTeam('B'), makeTeam('C')],
      groups: [[makeTeam('A'), makeTeam('B'), makeTeam('C')]],
      games: [[makeGame('A', 'B', 13, 10), makeGame('B', 'C', 13, 7), makeGame('C', 'A', 13, 8)]],
      groupSchedule: null,
    };
    const fromHelper = getTeamsRanking(tournament, 2);
    const fromService = rankRoundRobinGroups(tournament, rankGroupByRegulations);
    expect(fromHelper).toEqual(fromService);
  });
});
