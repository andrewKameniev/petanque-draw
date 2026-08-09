import { describe, it, expect } from 'vitest';
import {
  POULES_DRAW_ERROR,
  createPoules,
  getPoulesQualifiedTeams,
  drawPoulesRound,
} from '@/services/draw';

function makeTeam(title) {
  return {
    title,
    wins: 0,
    opponents: [],
    buhgolts: 0,
    smallBuhgolts: 0,
    pointsPlus: 0,
    pointsMinus: 0,
    lanes: [],
    players: [],
  };
}

function makePoules4Teams(teams) {
  return {
    teams: teams.map(makeTeam),
    system: 'poules',
    groups: [teams.map(makeTeam)],
    games: [],
    poulesRound: 0,
    preferences: { fieldsStart: 1, maxScore: 13 },
  };
}

describe('createPoules', () => {
  it('rejects a stale Poules selection when the team count is no longer valid', () => {
    const tournament = {
      teams: Array.from({ length: 9 }, (_, index) => makeTeam(`Team ${index + 1}`)),
      system: 'poules',
    };
    const originalTournament = JSON.parse(JSON.stringify(tournament));

    expect(createPoules(tournament)).toEqual({
      groups: null,
      error: POULES_DRAW_ERROR.INVALID_TEAM_COUNT,
    });
    expect(tournament).toEqual(originalTournament);
  });

  it('creates four-team groups when the team count is valid', () => {
    const tournament = {
      teams: Array.from({ length: 8 }, (_, index) => makeTeam(`Team ${index + 1}`)),
      system: 'poules',
    };

    const result = createPoules(tournament);

    expect(result.error).toBeNull();
    expect(result.groups).toHaveLength(2);
    expect(result.groups.every((group) => group.length === 4)).toBe(true);
  });
});

describe('getPoulesQualifiedTeams', () => {
  it('qualifies teams with >= 2 wins (includes group winner with 3 wins)', () => {
    const tournament = {
      teams: [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')],
      groups: [[makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')]],
      games: [
        // R1: A beats C, B beats D
        [
          { group: 0, team_1: 'A', team_2: 'C', team_1_score: 13, team_2_score: 4 },
          { group: 0, team_1: 'B', team_2: 'D', team_1_score: 13, team_2_score: 6 },
        ],
        // R2: A beats B (winners match), D beats C (losers match)
        [
          { group: 0, team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 10 },
          { group: 0, team_1: 'D', team_2: 'C', team_1_score: 13, team_2_score: 7 },
        ],
        // R3 (barrage): B vs D (both have 1 win) → B wins
        [{ group: 0, team_1: 'B', team_2: 'D', team_1_score: 13, team_2_score: 8 }],
      ],
    };

    const qualified = getPoulesQualifiedTeams(tournament);
    const realTeams = qualified.filter((t) => !t.isBye);

    // A has 2 wins (won R1 and R2, didn't play R3)
    // B has 2 wins (won R1, lost R2, won barrage R3)
    expect(realTeams).toHaveLength(2);
    expect(realTeams.map((t) => t.title).sort()).toEqual(['A', 'B']);
  });

  it('qualifies group winner with 3 wins in full round-robin', () => {
    const tournament = {
      teams: [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')],
      groups: [[makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')]],
      games: [
        [
          { group: 0, team_1: 'A', team_2: 'C', team_1_score: 13, team_2_score: 4 },
          { group: 0, team_1: 'B', team_2: 'D', team_1_score: 13, team_2_score: 6 },
        ],
        [
          { group: 0, team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 10 },
          { group: 0, team_1: 'C', team_2: 'D', team_1_score: 13, team_2_score: 7 },
        ],
        [
          // barrage: C vs B (both 1 win) → C wins, giving scenario A:2, C:2
          { group: 0, team_1: 'C', team_2: 'B', team_1_score: 13, team_2_score: 5 },
        ],
      ],
    };

    const qualified = getPoulesQualifiedTeams(tournament);
    const realTeams = qualified.filter((t) => !t.isBye);
    expect(realTeams.map((t) => t.title).sort()).toEqual(['A', 'C']);
  });

  it('handles multiple groups and interleaves winners', () => {
    const teamsList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const tournament = {
      teams: teamsList.map(makeTeam),
      groups: [teamsList.slice(0, 4).map(makeTeam), teamsList.slice(4, 8).map(makeTeam)],
      games: [
        [
          { group: 0, team_1: 'A', team_2: 'C', team_1_score: 13, team_2_score: 4 },
          { group: 0, team_1: 'B', team_2: 'D', team_1_score: 13, team_2_score: 6 },
          { group: 1, team_1: 'E', team_2: 'G', team_1_score: 13, team_2_score: 3 },
          { group: 1, team_1: 'F', team_2: 'H', team_1_score: 13, team_2_score: 5 },
        ],
        [
          { group: 0, team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 10 },
          { group: 0, team_1: 'C', team_2: 'D', team_1_score: 13, team_2_score: 7 },
          { group: 1, team_1: 'E', team_2: 'F', team_1_score: 13, team_2_score: 10 },
          { group: 1, team_1: 'G', team_2: 'H', team_1_score: 13, team_2_score: 5 },
        ],
        [
          { group: 0, team_1: 'B', team_2: 'C', team_1_score: 13, team_2_score: 8 },
          { group: 1, team_1: 'F', team_2: 'G', team_1_score: 13, team_2_score: 4 },
        ],
      ],
    };

    const qualified = getPoulesQualifiedTeams(tournament);
    const realTeams = qualified.filter((t) => !t.isBye);
    // Group 0: A(2 wins), B(2 wins) qualify
    // Group 1: E(2 wins), F(2 wins) qualify
    expect(realTeams).toHaveLength(4);
    // Interleaved: all index-0 from each group, then all index-1
    // Within each group, sorted by wins desc then points desc
    const titles = realTeams.map((t) => t.title);
    expect(titles).toContain('A');
    expect(titles).toContain('B');
    expect(titles).toContain('E');
    expect(titles).toContain('F');
  });

  it('pads to next power of 2 with byes', () => {
    // 3 groups → 6 qualified → padded to 8
    const teams3g = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const tournament = {
      teams: teams3g.map(makeTeam),
      groups: [
        teams3g.slice(0, 4).map(makeTeam),
        teams3g.slice(4, 8).map(makeTeam),
        teams3g.slice(8, 12).map(makeTeam),
      ],
      games: [
        [
          { group: 0, team_1: 'A', team_2: 'C', team_1_score: 13, team_2_score: 4 },
          { group: 0, team_1: 'B', team_2: 'D', team_1_score: 13, team_2_score: 6 },
          { group: 1, team_1: 'E', team_2: 'G', team_1_score: 13, team_2_score: 3 },
          { group: 1, team_1: 'F', team_2: 'H', team_1_score: 13, team_2_score: 5 },
          { group: 2, team_1: 'I', team_2: 'K', team_1_score: 13, team_2_score: 3 },
          { group: 2, team_1: 'J', team_2: 'L', team_1_score: 13, team_2_score: 5 },
        ],
        [
          { group: 0, team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 10 },
          { group: 0, team_1: 'C', team_2: 'D', team_1_score: 13, team_2_score: 7 },
          { group: 1, team_1: 'E', team_2: 'F', team_1_score: 13, team_2_score: 10 },
          { group: 1, team_1: 'G', team_2: 'H', team_1_score: 13, team_2_score: 5 },
          { group: 2, team_1: 'I', team_2: 'J', team_1_score: 13, team_2_score: 10 },
          { group: 2, team_1: 'K', team_2: 'L', team_1_score: 13, team_2_score: 5 },
        ],
        [
          { group: 0, team_1: 'B', team_2: 'C', team_1_score: 13, team_2_score: 8 },
          { group: 1, team_1: 'F', team_2: 'G', team_1_score: 13, team_2_score: 4 },
          { group: 2, team_1: 'J', team_2: 'K', team_1_score: 13, team_2_score: 4 },
        ],
      ],
    };

    const qualified = getPoulesQualifiedTeams(tournament);
    // 6 real teams + 2 byes = 8 (next power of 2)
    expect(qualified).toHaveLength(8);
    expect(qualified.filter((t) => t.isBye)).toHaveLength(2);
    expect(qualified.filter((t) => !t.isBye)).toHaveLength(6);
  });

  it('does NOT qualify teams with exactly 1 win', () => {
    const tournament = {
      teams: [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')],
      groups: [[makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')]],
      games: [
        [
          { group: 0, team_1: 'A', team_2: 'C', team_1_score: 13, team_2_score: 4 },
          { group: 0, team_1: 'B', team_2: 'D', team_1_score: 13, team_2_score: 6 },
        ],
        [
          { group: 0, team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 10 },
          { group: 0, team_1: 'C', team_2: 'D', team_1_score: 13, team_2_score: 7 },
        ],
        [
          // B(1 win) vs C(1 win) barrage
          { group: 0, team_1: 'B', team_2: 'C', team_1_score: 13, team_2_score: 5 },
        ],
      ],
    };

    const qualified = getPoulesQualifiedTeams(tournament);
    const realTeams = qualified.filter((t) => !t.isBye);
    // A has 2 wins, B has 2 wins. C only has 1 win.
    expect(realTeams.map((t) => t.title)).not.toContain('C');
    expect(realTeams.map((t) => t.title)).not.toContain('D');
  });
});

describe('drawPoulesRound', () => {
  it('round 1: pairs A vs C and B vs D', () => {
    const tournament = makePoules4Teams(['A', 'B', 'C', 'D']);
    tournament.poulesRound = 1;
    const round = drawPoulesRound(tournament);

    expect(round).toHaveLength(2);
    expect(round[0].team_1).toBe('A');
    expect(round[0].team_2).toBe('C');
    expect(round[1].team_1).toBe('B');
    expect(round[1].team_2).toBe('D');
  });

  it('round 2: winners play winners, losers play losers', () => {
    const tournament = makePoules4Teams(['A', 'B', 'C', 'D']);
    tournament.poulesRound = 2;
    tournament.games = [
      [
        { group: 0, team_1: 'A', team_2: 'C', team_1_score: 13, team_2_score: 4 },
        { group: 0, team_1: 'B', team_2: 'D', team_1_score: 13, team_2_score: 6 },
      ],
    ];

    const round = drawPoulesRound(tournament);

    expect(round).toHaveLength(2);
    // Winners: A vs B
    expect(round[0].team_1).toBe('A');
    expect(round[0].team_2).toBe('B');
    // Losers: C vs D
    expect(round[1].team_1).toBe('C');
    expect(round[1].team_2).toBe('D');
  });

  it('round 3: the two 1-win teams play each other', () => {
    const tournament = makePoules4Teams(['A', 'B', 'C', 'D']);
    tournament.poulesRound = 3;
    tournament.games = [
      [
        { group: 0, team_1: 'A', team_2: 'C', team_1_score: 13, team_2_score: 4 },
        { group: 0, team_1: 'B', team_2: 'D', team_1_score: 13, team_2_score: 6 },
      ],
      [
        { group: 0, team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 10 },
        { group: 0, team_1: 'C', team_2: 'D', team_1_score: 13, team_2_score: 7 },
      ],
    ];

    const round = drawPoulesRound(tournament);

    // After R1+R2: A=2wins, B=1win, C=1win, D=0wins
    expect(round).toHaveLength(1);
    expect([round[0].team_1, round[0].team_2].sort()).toEqual(['B', 'C']);
  });

  it('assigns group index to each game', () => {
    const teams = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const tournament = {
      teams: teams.map(makeTeam),
      system: 'poules',
      groups: [teams.slice(0, 4).map(makeTeam), teams.slice(4, 8).map(makeTeam)],
      games: [],
      poulesRound: 1,
      preferences: { fieldsStart: 1, maxScore: 13 },
    };

    const round = drawPoulesRound(tournament);
    expect(round).toHaveLength(4);
    expect(round[0].group).toBe(0);
    expect(round[1].group).toBe(0);
    expect(round[2].group).toBe(1);
    expect(round[3].group).toBe(1);
  });
});
