import { describe, it, expect } from 'vitest';
import {
    getDefaultSelectedRound,
    hasPlayOffResults,
    sortGamesByGroup,
    getPoulesQualifiedPerGroup,
    getPlayOffTeamsPerGroup,
    getQualifiedCountForGroup,
    computePoulesGroupRankings,
    assignPlayoffLanes,
} from '@/services/results';

describe('getDefaultSelectedRound', () => {
    it('selects playoff when playoff results exist', () => {
        const tournament = {
            games: [[], [], []],
            cadrage: [{ team_1: 'A', team_2: 'B' }],
            playOffBracket: {
                stages: [
                    {
                        stageLabel: 1,
                        teams: [{ team_1: 'X', team_2: 'Y', team_1_score: 13, team_2_score: 5 }],
                    },
                ],
            },
        };
        expect(getDefaultSelectedRound(tournament)).toBe('playoff');
    });

    it('selects cadrage when cadrage exists but no playoff results', () => {
        const tournament = {
            games: [[], []],
            cadrage: [{ team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 5 }],
            playOffBracket: null,
        };
        expect(getDefaultSelectedRound(tournament)).toBe('cadrage');
    });

    it('selects last round for swiss with 3 rounds', () => {
        const tournament = {
            games: [[{}], [{}], [{}]],
            roundIsActive: false,
        };
        expect(getDefaultSelectedRound(tournament)).toBe(2);
    });

    it('selects last round for poules even when roundIsActive', () => {
        const tournament = {
            system: 'poules',
            games: [[{}], [{}], [{}]],
            roundIsActive: true,
        };
        expect(getDefaultSelectedRound(tournament)).toBe(2);
    });

    it('selects last round for swiss with active round (no going back)', () => {
        const tournament = {
            system: 'swiss',
            games: [[{}], [{}], [{}]],
            roundIsActive: true,
        };
        expect(getDefaultSelectedRound(tournament)).toBe(2);
    });

    it('selects R1 when only one round exists', () => {
        const tournament = {
            games: [[{}]],
            roundIsActive: true,
        };
        expect(getDefaultSelectedRound(tournament)).toBe(0);
    });

    it('returns -1 (All) when no games exist', () => {
        expect(getDefaultSelectedRound({ games: [] })).toBe(-1);
        expect(getDefaultSelectedRound({})).toBe(-1);
        expect(getDefaultSelectedRound(null)).toBe(-1);
    });

    it('ignores cadrage-labelled stages for playoff detection', () => {
        const tournament = {
            games: [[], []],
            playOffBracket: {
                stages: [
                    {
                        stageLabel: 'cadrage',
                        teams: [{ team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 5 }],
                    },
                ],
            },
        };
        expect(getDefaultSelectedRound(tournament)).toBe(1);
    });

    it('cadrage has priority over last round', () => {
        const tournament = {
            games: [[{}], [{}]],
            cadrage: [{ team_1: 'A', team_2: 'B' }],
        };
        expect(getDefaultSelectedRound(tournament)).toBe('cadrage');
    });
});

describe('hasPlayOffResults', () => {
    it('returns false for null/undefined bracket', () => {
        expect(hasPlayOffResults({})).toBe(false);
        expect(hasPlayOffResults({ playOffBracket: null })).toBe(false);
        expect(hasPlayOffResults({ playOffBracket: { stages: [] } })).toBe(false);
    });

    it('returns false when only cadrage stage has teams', () => {
        expect(
            hasPlayOffResults({
                playOffBracket: {
                    stages: [{ stageLabel: 'cadrage', teams: [{ team_1: 'A', team_2: 'B' }] }],
                },
            }),
        ).toBe(false);
    });

    it('returns true when a non-cadrage stage has teams assigned', () => {
        expect(
            hasPlayOffResults({
                playOffBracket: {
                    stages: [
                        { stageLabel: 'cadrage', teams: [{ team_1: 'A', team_2: 'B' }] },
                        { stageLabel: 4, teams: [{ team_1: 'C', team_2: 'D' }] },
                    ],
                },
            }),
        ).toBe(true);
    });

    it('returns false when non-cadrage stages have no teams assigned', () => {
        expect(
            hasPlayOffResults({
                playOffBracket: {
                    stages: [{ stageLabel: 4, teams: [{ team_1: '', team_2: '' }] }],
                },
            }),
        ).toBe(false);
    });
});

describe('sortGamesByGroup', () => {
    it('returns original games when hasGroups is false', () => {
        const games = [[{ group: 1 }, { group: 0 }]];
        expect(sortGamesByGroup(games, false)).toBe(games);
    });

    it('returns null/undefined as-is', () => {
        expect(sortGamesByGroup(null, true)).toBe(null);
        expect(sortGamesByGroup(undefined, true)).toBe(undefined);
    });

    it('sorts games by group within each round', () => {
        const games = [
            [
                { team_1: 'D', group: 2 },
                { team_1: 'A', group: 0 },
                { team_1: 'C', group: 1 },
                { team_1: 'B', group: 0 },
            ],
        ];
        const sorted = sortGamesByGroup(games, true);
        expect(sorted[0].map((g) => g.group)).toEqual([0, 0, 1, 2]);
    });

    it('handles games without group property (defaults to 0)', () => {
        const games = [[{ team_1: 'A' }, { team_1: 'B', group: 1 }]];
        const sorted = sortGamesByGroup(games, true);
        expect(sorted[0][0].team_1).toBe('A');
        expect(sorted[0][1].group).toBe(1);
    });

    it('does not mutate original array', () => {
        const games = [[{ group: 1 }, { group: 0 }]];
        sortGamesByGroup(games, true);
        expect(games[0][0].group).toBe(1);
    });
});

describe('getPoulesQualifiedPerGroup', () => {
    it('returns empty array for null/empty input', () => {
        expect(getPoulesQualifiedPerGroup(null, 3)).toEqual([]);
        expect(getPoulesQualifiedPerGroup([], 3)).toEqual([]);
    });

    it('counts teams with >= 2 wins after 3 rounds', () => {
        const rankings = [
            [{ wins: 3 }, { wins: 2 }, { wins: 1 }, { wins: 0 }],
            [{ wins: 2 }, { wins: 2 }, { wins: 1 }, { wins: 1 }],
        ];
        expect(getPoulesQualifiedPerGroup(rankings, 3)).toEqual([2, 2]);
    });

    it('uses >= 1 win threshold for fewer than 3 rounds', () => {
        const rankings = [[{ wins: 1 }, { wins: 1 }, { wins: 0 }, { wins: 0 }]];
        expect(getPoulesQualifiedPerGroup(rankings, 2)).toEqual([2]);
    });

    it('handles group where all teams qualify', () => {
        const rankings = [[{ wins: 3 }, { wins: 2 }, { wins: 2 }, { wins: 2 }]];
        expect(getPoulesQualifiedPerGroup(rankings, 3)).toEqual([4]);
    });

    it('handles group where no teams qualify', () => {
        const rankings = [[{ wins: 1 }, { wins: 1 }, { wins: 1 }, { wins: 0 }]];
        expect(getPoulesQualifiedPerGroup(rankings, 3)).toEqual([0]);
    });
});

describe('getPlayOffTeamsPerGroup', () => {
    it('returns 0 when no playOff', () => {
        expect(getPlayOffTeamsPerGroup({ playOff: null, groups: [[], []] })).toBe(0);
    });

    it('returns 0 when no groups', () => {
        expect(getPlayOffTeamsPerGroup({ playOff: [{}], groups: null })).toBe(0);
    });

    it('calculates correctly', () => {
        expect(
            getPlayOffTeamsPerGroup({
                playOff: [{}],
                groups: [[], [], [], []],
                preferences: { playOffTeams: 8 },
            }),
        ).toBe(2);
    });

    it('rounds up for uneven division', () => {
        expect(
            getPlayOffTeamsPerGroup({
                playOff: [{}],
                groups: [[], [], []],
                preferences: { playOffTeams: 8 },
            }),
        ).toBe(3);
    });
});

describe('getQualifiedCountForGroup', () => {
    it('uses poules logic for poules system', () => {
        const tournament = {
            system: 'poules',
            games: [[{}], [{}], [{}]],
            groups: [[], []],
        };
        const rankingTeams = [
            [{ wins: 3 }, { wins: 2 }, { wins: 1 }, { wins: 0 }],
            [{ wins: 2 }, { wins: 2 }, { wins: 1 }, { wins: 1 }],
        ];
        expect(getQualifiedCountForGroup(tournament, rankingTeams, 0)).toBe(2);
        expect(getQualifiedCountForGroup(tournament, rankingTeams, 1)).toBe(2);
    });

    it('uses playOffTeamsPerGroup for groups system', () => {
        const tournament = {
            system: 'groups',
            playOff: [{}],
            groups: [[], [], [], []],
            preferences: { playOffTeams: 8 },
        };
        expect(getQualifiedCountForGroup(tournament, [], 0)).toBe(2);
    });
});

describe('computePoulesGroupRankings', () => {
    it('returns empty array when no groups', () => {
        expect(computePoulesGroupRankings({ groups: null, games: [] })).toEqual([]);
        expect(computePoulesGroupRankings({ groups: [], games: null })).toEqual([]);
    });

    it('correctly computes wins and points from game data', () => {
        const tournament = {
            groups: [[{ title: 'A' }, { title: 'B' }, { title: 'C' }, { title: 'D' }]],
            games: [
                // R1: A vs C (A wins 13:4), B vs D (B wins 13:6)
                [
                    { group: 0, team_1: 'A', team_2: 'C', team_1_score: 13, team_2_score: 4 },
                    { group: 0, team_1: 'B', team_2: 'D', team_1_score: 13, team_2_score: 6 },
                ],
                // R2: A vs B (B wins 13:6), C vs D (C wins 13:7)
                [
                    { group: 0, team_1: 'A', team_2: 'B', team_1_score: 6, team_2_score: 13 },
                    { group: 0, team_1: 'C', team_2: 'D', team_1_score: 13, team_2_score: 7 },
                ],
                // R3 (barrage): A vs C (A wins 13:1)
                [{ group: 0, team_1: 'A', team_2: 'C', team_1_score: 13, team_2_score: 1 }],
            ],
        };

        const rankings = computePoulesGroupRankings(tournament);
        expect(rankings).toHaveLength(1);

        const group = rankings[0];
        const teamA = group.find((t) => t.title === 'A');
        const teamB = group.find((t) => t.title === 'B');
        const teamC = group.find((t) => t.title === 'C');
        const teamD = group.find((t) => t.title === 'D');

        expect(teamA.wins).toBe(2);
        expect(teamB.wins).toBe(2);
        expect(teamC.wins).toBe(1);
        expect(teamD.wins).toBe(0);
    });

    it('does NOT count 3 wins for a team that only won twice', () => {
        // Reproduces the bug from the screenshot: team has 6:13 (loss), 13:4 (win), 13:1 (win) = 2 wins
        const tournament = {
            groups: [[{ title: 'МУЩИНКА' }, { title: 'КЕЙБАЛО' }, { title: 'BACE' }, { title: 'РОЖОК' }]],
            games: [
                [
                    { group: 0, team_1: 'МУЩИНКА', team_2: 'BACE', team_1_score: 13, team_2_score: 4 },
                    { group: 0, team_1: 'КЕЙБАЛО', team_2: 'РОЖОК', team_1_score: 13, team_2_score: 1 },
                ],
                [
                    { group: 0, team_1: 'МУЩИНКА', team_2: 'КЕЙБАЛО', team_1_score: 6, team_2_score: 13 },
                    { group: 0, team_1: 'BACE', team_2: 'РОЖОК', team_1_score: 13, team_2_score: 7 },
                ],
                [
                    { group: 0, team_1: 'МУЩИНКА', team_2: 'РОЖОК', team_1_score: 13, team_2_score: 1 },
                    { group: 0, team_1: 'КЕЙБАЛО', team_2: 'BACE', team_1_score: 13, team_2_score: 10 },
                ],
            ],
        };

        const rankings = computePoulesGroupRankings(tournament);
        const mushchynka = rankings[0].find((t) => t.title === 'МУЩИНКА');
        expect(mushchynka.wins).toBe(2);
        expect(mushchynka.pointsPlus).toBe(32);
        expect(mushchynka.pointsMinus).toBe(18);
    });

    it('sorts by wins first, then point difference', () => {
        const tournament = {
            groups: [[{ title: 'A' }, { title: 'B' }, { title: 'C' }]],
            games: [
                [
                    { group: 0, team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 12 },
                    { group: 0, team_1: 'A', team_2: 'C', team_1_score: 13, team_2_score: 0 },
                    { group: 0, team_1: 'B', team_2: 'C', team_1_score: 13, team_2_score: 5 },
                ],
            ],
        };

        const rankings = computePoulesGroupRankings(tournament);
        // A: 2 wins, B: 1 win, C: 0 wins
        expect(rankings[0][0].title).toBe('A');
        expect(rankings[0][1].title).toBe('B');
        expect(rankings[0][2].title).toBe('C');
    });

    it('handles multiple groups independently', () => {
        const tournament = {
            groups: [
                [{ title: 'A' }, { title: 'B' }],
                [{ title: 'C' }, { title: 'D' }],
            ],
            games: [
                [
                    { group: 0, team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 5 },
                    { group: 1, team_1: 'C', team_2: 'D', team_1_score: 5, team_2_score: 13 },
                ],
            ],
        };

        const rankings = computePoulesGroupRankings(tournament);
        expect(rankings[0][0].title).toBe('A');
        expect(rankings[1][0].title).toBe('D');
    });

    it('ignores games with null scores (not yet played)', () => {
        const tournament = {
            groups: [[{ title: 'A' }, { title: 'B' }]],
            games: [[{ group: 0, team_1: 'A', team_2: 'B', team_1_score: null, team_2_score: null }]],
        };

        const rankings = computePoulesGroupRankings(tournament);
        expect(rankings[0][0].wins).toBe(0);
        expect(rankings[0][0].pointsPlus).toBe(0);
    });
});

describe('assignPlayoffLanes', () => {
    it('assigns sequential lanes to non-bye games', () => {
        const stages = [
            {
                teams: [
                    { team_1: 'A', team_2: 'B' },
                    { team_1: 'C', isBye: true },
                    { team_1: 'D', team_2: 'E' },
                    { team_1: 'F', isBye: true },
                    { team_1: 'G', team_2: 'H' },
                ],
            },
        ];

        assignPlayoffLanes(stages);
        expect(stages[0].laneOrder).toEqual([0, null, 1, null, 2]);
    });

    it('handles stage with no byes', () => {
        const stages = [
            {
                teams: [
                    { team_1: 'A', team_2: 'B' },
                    { team_1: 'C', team_2: 'D' },
                    { team_1: 'E', team_2: 'F' },
                ],
            },
        ];

        assignPlayoffLanes(stages);
        expect(stages[0].laneOrder).toEqual([0, 1, 2]);
    });

    it('handles stage with all byes', () => {
        const stages = [
            {
                teams: [{ isBye: true }, { isBye: true }],
            },
        ];

        assignPlayoffLanes(stages);
        expect(stages[0].laneOrder).toEqual([null, null]);
    });

    it('processes multiple stages independently', () => {
        const stages = [
            { teams: [{ isBye: true }, { team_1: 'A', team_2: 'B' }] },
            {
                teams: [
                    { team_1: 'C', team_2: 'D' },
                    { team_1: 'E', team_2: 'F' },
                ],
            },
        ];

        assignPlayoffLanes(stages);
        expect(stages[0].laneOrder).toEqual([null, 0]);
        expect(stages[1].laneOrder).toEqual([0, 1]);
    });

    it('returns the stages array', () => {
        const stages = [{ teams: [{ team_1: 'A', team_2: 'B' }] }];
        const result = assignPlayoffLanes(stages);
        expect(result).toBe(stages);
    });
});
