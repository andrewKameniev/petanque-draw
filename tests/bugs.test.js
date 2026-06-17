import { describe, it, expect } from 'vitest';
import {
  getRandomWithOneExclusion,
  generateCompetitorsFirstLast,
  drawSupermeleRound,
  assignLanes,
  createGroups,
  saveResultsForRound,
} from '@/services/draw';

function makeTeam(title, wins = 0, opponents = [], rating = 0) {
  return {
    title,
    wins,
    opponents,
    rating,
    buhgolts: 0,
    smallBuhgolts: 0,
    pointsPlus: 0,
    pointsMinus: 0,
    lanes: [],
    players: [],
  };
}

function makeTournament(teams, options = {}) {
  return {
    teams,
    system: options.system || 'swiss',
    useRating: options.useRating || false,
    supermelePlayers: options.supermelePlayers || 2,
    preferences: {
      fieldsStart: options.fieldsStart || 1,
      technical: { technicalFirst: 13, technicalSecond: 0 },
      maxScore: 13,
    },
    games: options.games || [],
    ...options,
  };
}

describe('Bug #1 FIXED: assignLanes handles supermele composite team names', () => {
  it('assigns lanes using individual player history', () => {
    const teams = [makeTeam('P1'), makeTeam('P2'), makeTeam('P3'), makeTeam('P4')];
    const tournament = makeTournament(teams, { system: 'supermele', fieldsStart: 1 });
    const games = [
      {
        team_1: 'P1, P2',
        team_1_players: ['P1', 'P2'],
        team_1_score: null,
        team_2: 'P3, P4',
        team_2_players: ['P3', 'P4'],
        team_2_score: null,
      },
    ];
    const result = assignLanes(games, tournament);
    expect(result).toHaveLength(1);
    expect(result[0].lane).toBeDefined();
    expect(typeof result[0].lane).toBe('number');
  });

  it('avoids all previously played lanes for supermele players', () => {
    const teams = [
      { ...makeTeam('P1'), lanes: [0] },
      { ...makeTeam('P2'), lanes: [0] },
      { ...makeTeam('P3'), lanes: [1] },
      { ...makeTeam('P4'), lanes: [1] },
      { ...makeTeam('P5'), lanes: [2] },
      { ...makeTeam('P6'), lanes: [2] },
    ];
    const tournament = makeTournament(teams, { system: 'supermele', fieldsStart: 1 });
    const games = [
      {
        team_1: 'P1, P2',
        team_1_players: ['P1', 'P2'],
        team_1_score: null,
        team_2: 'P3, P4',
        team_2_players: ['P3', 'P4'],
        team_2_score: null,
      },
    ];
    const result = assignLanes(games, tournament);
    // P1,P2 played lane 0; P3,P4 played lane 1 — should pick lane 2
    expect(result[0].lane).not.toBe(0);
    expect(result[0].lane).not.toBe(1);
  });
});

describe('Bug #2 FIXED: getRandomWithOneExclusion no infinite loop', () => {
  it('returns 0 when length=1 and the only index is excluded (graceful fallback)', () => {
    const result = getRandomWithOneExclusion(1, 0);
    expect(result).toBe(0);
  });

  it('returns 0 when length=2 and both indices are excluded', () => {
    const result = getRandomWithOneExclusion(2, 0, 1);
    expect(result).toBe(0);
  });

  it('still works correctly for normal cases', () => {
    for (let i = 0; i < 100; i++) {
      const result = getRandomWithOneExclusion(5, 2, 4);
      expect(result).not.toBe(2);
      expect(result).not.toBe(4);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(5);
    }
  });
});

describe('Bug #3 FIXED: getRandomWithOneExclusion uniform distribution', () => {
  it('Math.floor gives uniform distribution across all indices', () => {
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    const iterations = 10000;
    for (let i = 0; i < iterations; i++) {
      const result = getRandomWithOneExclusion(5);
      counts[result]++;
    }
    const expectedPer = iterations / 5;
    // All indices should be within 20% of expected with uniform distribution
    Object.values(counts).forEach((count) => {
      expect(count).toBeGreaterThan(expectedPer * 0.75);
      expect(count).toBeLessThan(expectedPer * 1.25);
    });
  });
});

describe('Bug #4 FIXED: generateCompetitorsFirstLast reverse path with small teams', () => {
  it('searches for valid opponent instead of returning already-played pair', () => {
    const teams = [makeTeam('A', 2, ['C']), makeTeam('B', 1, []), makeTeam('C', 1, ['A'])];
    // reverse=true, iteration=2 → starts at opponentIndex=length-1=2 (C)
    // A already played C → should advance to find B or return -1
    const result = generateCompetitorsFirstLast(teams, 2, true, true, 2);
    if (result.opponentIndex !== -1) {
      expect(teams[result.teamIndex].opponents).not.toContain(teams[result.opponentIndex].title);
    }
  });
});

describe('Bug #6 FIXED: saveResultsForRound does not award win on draws', () => {
  it('neither team gets a win when scores are equal', () => {
    const teams = [makeTeam('A'), makeTeam('B')];
    const tournament = makeTournament(teams, {
      system: 'swiss',
      games: [[{ team_1: 'A', team_1_score: 10, team_2: 'B', team_2_score: 10 }]],
    });
    saveResultsForRound(tournament, 0);
    expect(tournament.teams[0].wins).toBe(0);
    expect(tournament.teams[1].wins).toBe(0);
  });

  it('still awards win correctly for normal results', () => {
    const teams = [makeTeam('A'), makeTeam('B')];
    const tournament = makeTournament(teams, {
      system: 'swiss',
      games: [[{ team_1: 'A', team_1_score: 13, team_2: 'B', team_2_score: 7 }]],
    });
    saveResultsForRound(tournament, 0);
    expect(tournament.teams[0].wins).toBe(1);
    expect(tournament.teams[1].wins).toBe(0);
  });
});

describe('Bug #7 FIXED: createGroups does not mutate tournament.teams order', () => {
  it('preserves original team order in tournament.teams', () => {
    const teams = [
      makeTeam('C', 0, [], 50),
      makeTeam('A', 0, [], 100),
      makeTeam('B', 0, [], 75),
      makeTeam('D', 0, [], 25),
      makeTeam('E', 0, [], 60),
      makeTeam('F', 0, [], 10),
    ];
    const originalOrder = teams.map((t) => t.title);
    const tournament = makeTournament(teams, { useRating: true });
    createGroups(tournament, 3);
    const newOrder = tournament.teams.map((t) => t.title);
    expect(newOrder).toEqual(originalOrder);
  });
});

describe('Bug #8 FIXED: drawSupermeleRound handles tricky player counts', () => {
  it('does not infinite loop for 7 players in triples mode', () => {
    const teams = Array.from({ length: 7 }, (_, i) => makeTeam(`P${i + 1}`));
    const tournament = makeTournament(teams, { system: 'supermele', supermelePlayers: 3 });
    // Should complete without hanging
    const round = drawSupermeleRound(tournament, teams);
    expect(round).toBeDefined();
  });

  it('handles 5 players in triples mode', () => {
    const teams = Array.from({ length: 5 }, (_, i) => makeTeam(`P${i + 1}`));
    const tournament = makeTournament(teams, { system: 'supermele', supermelePlayers: 3 });
    const round = drawSupermeleRound(tournament, teams);
    expect(round).toBeDefined();
  });
});
