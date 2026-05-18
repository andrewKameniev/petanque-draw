import { describe, it, expect } from 'vitest';
import { sortTeams, countBuhgolts, gameHasError, isScoreError, shuffleArray, getGameResultInGroup, getTeamsRanking, getTournamentRanking } from '@/helpers';

function makeTeam(title, wins = 0, opponents = [], pointsPlus = 0, pointsMinus = 0, rating = 0) {
    return { title, wins, opponents, pointsPlus, pointsMinus, rating, buhgolts: 0, smallBuhgolts: 0 };
}

describe('sortTeams', () => {
    it('sorts by wins descending', () => {
        const teams = [
            makeTeam('A', 1),
            makeTeam('B', 3),
            makeTeam('C', 2),
        ];
        const sorted = sortTeams(teams);
        expect(sorted[0].title).toBe('B');
        expect(sorted[1].title).toBe('C');
        expect(sorted[2].title).toBe('A');
    });

    it('breaks ties by buchholz', () => {
        const teams = [
            makeTeam('A', 2, ['B']),
            makeTeam('B', 1, ['A']),
            makeTeam('C', 2, ['B']),
        ];
        const sorted = sortTeams(teams);
        expect(sorted[0].wins).toBe(2);
        expect(sorted[1].wins).toBe(2);
        expect(sorted[2].wins).toBe(1);
    });

    it('breaks ties by point difference', () => {
        const teams = [
            makeTeam('A', 2, [], 10, 5),
            makeTeam('B', 2, [], 13, 3),
            makeTeam('C', 2, [], 8, 8),
        ];
        const sorted = sortTeams(teams);
        expect(sorted[0].title).toBe('B');
        expect(sorted[1].title).toBe('A');
        expect(sorted[2].title).toBe('C');
    });

    it('breaks ties by pointsPlus when difference is equal', () => {
        const teams = [
            makeTeam('A', 2, [], 10, 5),
            makeTeam('B', 2, [], 12, 7),
        ];
        const sorted = sortTeams(teams);
        expect(sorted[0].title).toBe('B');
        expect(sorted[1].title).toBe('A');
    });

    it('breaks ties by rating as last resort', () => {
        const teams = [
            makeTeam('A', 2, [], 10, 5, 100),
            makeTeam('B', 2, [], 10, 5, 200),
        ];
        const sorted = sortTeams(teams);
        expect(sorted[0].title).toBe('B');
        expect(sorted[1].title).toBe('A');
    });
});

describe('countBuhgolts', () => {
    it('calculates buchholz as sum of opponents wins', () => {
        const teams = [
            makeTeam('A', 3, ['B', 'C']),
            makeTeam('B', 2, ['A']),
            makeTeam('C', 1, ['A']),
        ];
        const result = countBuhgolts(teams, 'buhgolts');
        expect(result.find(t => t.title === 'A').buhgolts).toBe(3); // B(2) + C(1)
        expect(result.find(t => t.title === 'B').buhgolts).toBe(3); // A(3)
        expect(result.find(t => t.title === 'C').buhgolts).toBe(3); // A(3)
    });

    it('handles placeholder opponents', () => {
        const teams = [
            makeTeam('A', 2, ['placeholder']),
            makeTeam('B', 1, ['A']),
        ];
        const result = countBuhgolts(teams, 'buhgolts');
        expect(result.find(t => t.title === 'A').buhgolts).toBe(0);
    });

    it('calculates smallBuhgolts as sum of opponents buchholz', () => {
        const teams = [
            makeTeam('A', 3, ['B', 'C']),
            makeTeam('B', 2, ['A', 'C']),
            makeTeam('C', 1, ['A', 'B']),
        ];
        countBuhgolts(teams, 'buhgolts');
        countBuhgolts(teams, 'smallBuhgolts');
        expect(teams.find(t => t.title === 'A').smallBuhgolts).toBe(
            teams.find(t => t.title === 'B').buhgolts + teams.find(t => t.title === 'C').buhgolts
        );
    });
});

describe('gameHasError', () => {
    it('returns truthy for equal scores', () => {
        expect(gameHasError({ team_1_score: 5, team_2_score: 5 }, 13)).toBeTruthy();
    });

    it('returns truthy for negative scores', () => {
        expect(gameHasError({ team_1_score: -1, team_2_score: 5 }, 13)).toBeTruthy();
    });

    it('returns truthy for scores exceeding max', () => {
        expect(gameHasError({ team_1_score: 14, team_2_score: 5 }, 13)).toBeTruthy();
        expect(gameHasError({ team_1_score: 5, team_2_score: 14 }, 13)).toBeTruthy();
    });

    it('returns falsy for valid game', () => {
        expect(gameHasError({ team_1_score: 13, team_2_score: 5 }, 13)).toBeFalsy();
    });

    it('returns falsy when scores are null (game not played)', () => {
        expect(gameHasError({ team_1_score: null, team_2_score: null }, 13)).toBeFalsy();
    });
});

describe('isScoreError', () => {
    it('returns true for equal scores', () => {
        expect(isScoreError({ team_1_score: 5, team_2_score: 5 }, 13)).toBe(true);
    });

    it('returns true for null scores', () => {
        expect(isScoreError({ team_1_score: null, team_2_score: 5 }, 13)).toBe(true);
        expect(isScoreError({ team_1_score: 5, team_2_score: null }, 13)).toBe(true);
    });

    it('returns true for scores exceeding max', () => {
        expect(isScoreError({ team_1_score: 14, team_2_score: 5 }, 13)).toBe(true);
    });

    it('returns false for valid different scores', () => {
        expect(isScoreError({ team_1_score: 13, team_2_score: 7 }, 13)).toBe(false);
    });
});

describe('shuffleArray', () => {
    it('returns array of same length', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = shuffleArray([...arr]);
        expect(result).toHaveLength(5);
    });

    it('contains all original elements', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = shuffleArray([...arr]);
        expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
    });

    it('handles empty array', () => {
        expect(shuffleArray([])).toEqual([]);
    });

    it('handles single element', () => {
        expect(shuffleArray([42])).toEqual([42]);
    });
});

describe('getGameResultInGroup', () => {
    const games = [[
        { team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 7 },
        { team_1: 'C', team_2: 'D', team_1_score: 10, team_2_score: 8 },
    ]];

    it('returns dash for same team', () => {
        expect(getGameResultInGroup(games, 'A', 'A', false)).toBe('-');
    });

    it('returns score string for team_1 perspective', () => {
        expect(getGameResultInGroup(games, 'A', 'B', false)).toBe('13 : 7');
    });

    it('returns score string for team_2 perspective', () => {
        expect(getGameResultInGroup(games, 'B', 'A', false)).toBe('7 : 13');
    });

    it('returns point difference for team_1', () => {
        expect(getGameResultInGroup(games, 'A', 'B', true)).toBe(6);
    });

    it('returns negative point difference for team_2', () => {
        expect(getGameResultInGroup(games, 'B', 'A', true)).toBe(-6);
    });

    it('returns undefined for non-existent matchup', () => {
        expect(getGameResultInGroup(games, 'A', 'C', false)).toBeUndefined();
    });

    it('handles zero difference', () => {
        const tiedGames = [[{ team_1: 'X', team_2: 'Y', team_1_score: 10, team_2_score: 10 }]];
        expect(getGameResultInGroup(tiedGames, 'X', 'Y', true)).toBe(0);
    });

    it('shows each game separately across multiple circles', () => {
        const multiCircleGames = [
            [{ team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 7 }],
            [{ team_1: 'A', team_2: 'B', team_1_score: 9, team_2_score: 8 }],
        ];
        expect(getGameResultInGroup(multiCircleGames, 'A', 'B', false)).toBe('13 : 7\n9 : 8');
        expect(getGameResultInGroup(multiCircleGames, 'B', 'A', false)).toBe('7 : 13\n8 : 9');
        expect(getGameResultInGroup(multiCircleGames, 'A', 'B', true)).toBe(7);
        expect(getGameResultInGroup(multiCircleGames, 'B', 'A', true)).toBe(-7);
    });

    it('shows each game when team sides are swapped across circles', () => {
        const swappedGames = [
            [{ team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 7 }],
            [{ team_1: 'B', team_2: 'A', team_1_score: 10, team_2_score: 8 }],
        ];
        expect(getGameResultInGroup(swappedGames, 'A', 'B', false)).toBe('13 : 7\n8 : 10');
        expect(getGameResultInGroup(swappedGames, 'B', 'A', false)).toBe('7 : 13\n10 : 8');
    });
});

describe('getTeamsRanking', () => {
    it('returns sorted teams for swiss system', () => {
        const tournament = {
            system: 'swiss',
            teams: [
                makeTeam('A', 1, [], 10, 5),
                makeTeam('B', 2, [], 13, 3),
                makeTeam('C', 0, [], 5, 10),
            ]
        };
        const result = getTeamsRanking(tournament, 2);
        expect(result[0].title).toBe('B');
        expect(result[2].title).toBe('C');
    });

    it('returns sorted teams for supermele system', () => {
        const tournament = {
            system: 'supermele',
            teams: [
                makeTeam('P1', 1, [], 10, 5),
                makeTeam('P2', 3, [], 20, 8),
                makeTeam('P3', 2, [], 15, 7),
            ]
        };
        const result = getTeamsRanking(tournament, 2);
        expect(result[0].title).toBe('P2');
        expect(result[1].title).toBe('P3');
        expect(result[2].title).toBe('P1');
    });

    it('returns empty array when no teams', () => {
        const tournament = { system: 'swiss' };
        expect(getTeamsRanking(tournament, 1)).toEqual([]);
    });

    it('returns sorted groups for groups system after round 1', () => {
        const tournament = {
            system: 'groups',
            teams: [
                makeTeam('A', 2, ['B'], 13, 5),
                makeTeam('B', 0, ['A'], 5, 13),
                makeTeam('C', 1, ['D'], 10, 8),
                makeTeam('D', 1, ['C'], 8, 10),
            ],
            groups: [
                [{ title: 'A', wins: 0, opponents: [], pointsPlus: 0, pointsMinus: 0 },
                 { title: 'B', wins: 0, opponents: [], pointsPlus: 0, pointsMinus: 0 }],
                [{ title: 'C', wins: 0, opponents: [], pointsPlus: 0, pointsMinus: 0 },
                 { title: 'D', wins: 0, opponents: [], pointsPlus: 0, pointsMinus: 0 }],
            ],
            games: [[
                { team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 5 },
                { team_1: 'C', team_2: 'D', team_1_score: 10, team_2_score: 8 },
            ]]
        };
        const result = getTeamsRanking(tournament, 2);
        expect(result).toHaveLength(2);
        expect(result[0][0].title).toBe('A');
        expect(result[1][0].title).toBe('C');
    });
});

describe('getTournamentRanking', () => {
    it('returns ranking based on swiss standings (no playoff)', () => {
        const teams = [
            makeTeam('A', 3, ['B', 'C'], 30, 10),
            makeTeam('B', 2, ['A', 'C'], 20, 15),
            makeTeam('C', 1, ['A', 'B'], 10, 25),
        ];
        const tournament = { system: 'swiss', teams, games: [[]] };
        const rankingTeams = [teams[0], teams[1], teams[2]];
        const result = getTournamentRanking(tournament, rankingTeams);
        expect(result).toHaveLength(3);
        expect(result[0].place).toBe(1);
        expect(result[0].title).toBe('A');
        expect(result[2].place).toBe(3);
        expect(result[2].title).toBe('C');
    });

    it('returns empty array when no playoff and no games', () => {
        const tournament = { system: 'swiss', teams: [] };
        const result = getTournamentRanking(tournament, []);
        expect(result).toEqual([]);
    });

    it('returns playoff-based ranking with bracket', () => {
        const teams = [
            makeTeam('A', 3), makeTeam('B', 2), makeTeam('C', 1), makeTeam('D', 0),
        ];
        const tournament = {
            system: 'swiss',
            teams,
            games: [[]],
            playOffBracket: {
                stages: [
                    { stageLabel: 2, teamsCount: 4, teams: [{ team_1: 'A', team_2: 'C', team_1_score: 13, team_2_score: 5 }, { team_1: 'B', team_2: 'D', team_1_score: 13, team_2_score: 3 }] },
                    { stageLabel: 1, teamsCount: 4, teams: [{ team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 7 }] },
                ],
                thirdPlace: { team_1: 'C', team_2: 'D', team_1_score: 13, team_2_score: 8 }
            }
        };
        const rankingTeams = [teams[0], teams[1], teams[2], teams[3]];
        const result = getTournamentRanking(tournament, rankingTeams);
        expect(result[0].place).toBe('1');
        expect(result[0].title).toBe('A');
        expect(result[1].place).toBe('2');
        expect(result[1].title).toBe('B');
        expect(result[2].place).toBe('3');
        expect(result[2].title).toBe('C');
        expect(result[3].place).toBe('4');
        expect(result[3].title).toBe('D');
    });

    it('cadrage losers get shared range place, remaining teams get individual places', () => {
        const teams = [
            makeTeam('T1', 4), makeTeam('T2', 4), makeTeam('T3', 3), makeTeam('T4', 3),
            makeTeam('T5', 2), makeTeam('T6', 2), makeTeam('T7', 1), makeTeam('T8', 1),
            makeTeam('T9', 0), makeTeam('T10', 0),
        ];
        const tournament = {
            system: 'swiss',
            teams,
            games: [[]],
            playOffBracket: {
                stages: [
                    // cadrage: 4 teams (2 games), losers are T4 and T6
                    { stageLabel: 'cadrage', teamsCount: 4, teams: [
                        { team_1: 'T3', team_2: 'T4', team_1_score: 13, team_2_score: 5, team_1_place: 3, team_2_place: 4 },
                        { team_1: 'T5', team_2: 'T6', team_1_score: 13, team_2_score: 7, team_1_place: 5, team_2_place: 6 },
                    ]},
                    // 1/2 final: T1 vs T3, T2 vs T5
                    { stageLabel: 2, teamsCount: 4, teams: [
                        { team_1: 'T1', team_2: 'T3', team_1_score: 13, team_2_score: 5 },
                        { team_1: 'T2', team_2: 'T5', team_1_score: 13, team_2_score: 3 },
                    ]},
                    // final: T1 vs T2
                    { stageLabel: 1, teamsCount: 4, teams: [
                        { team_1: 'T1', team_2: 'T2', team_1_score: 13, team_2_score: 7 },
                    ]},
                ],
                thirdPlace: { team_1: 'T3', team_2: 'T5', team_1_score: 13, team_2_score: 8 }
            }
        };
        const rankingTeams = [teams[0], teams[1], teams[2], teams[3], teams[4], teams[5], teams[6], teams[7], teams[8], teams[9]];
        const result = getTournamentRanking(tournament, rankingTeams);

        // 1st-4th from playoff
        expect(result[0]).toMatchObject({ place: '1', title: 'T1' });
        expect(result[1]).toMatchObject({ place: '2', title: 'T2' });
        expect(result[2]).toMatchObject({ place: '3', title: 'T3' });
        expect(result[3]).toMatchObject({ place: '4', title: 'T5' });

        // Cadrage losers get shared range
        const cadrageLosers = result.filter(r => r.title === 'T4' || r.title === 'T6');
        expect(cadrageLosers).toHaveLength(2);
        expect(cadrageLosers[0].place).toBe('5-6');
        expect(cadrageLosers[1].place).toBe('5-6');

        // Remaining teams get individual sequential places
        const remaining = result.filter(r => ['T7', 'T8', 'T9', 'T10'].includes(r.title));
        expect(remaining).toHaveLength(4);
        expect(remaining[0].place).toBe(7);
        expect(remaining[1].place).toBe(8);
        expect(remaining[2].place).toBe(9);
        expect(remaining[3].place).toBe(10);
    });
});
