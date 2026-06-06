import { describe, it, expect } from 'vitest';
import { getTeamsRanking, gameHasError, isScoreError } from '@/helpers';
import { drawGroupsRound, generateConstrainedGroups, assignLanes } from '@/services/draw';

function makeTeam(title, club = null) {
    return {
        title,
        wins: 0,
        opponents: [],
        rating: 0,
        buhgolts: 0,
        smallBuhgolts: 0,
        pointsPlus: 0,
        pointsMinus: 0,
        lanes: [],
        players: club ? [{ club }] : []
    };
}

function makeGame(team1, team2, score1, score2, status = 'finished') {
    return {
        team_1: team1,
        team_2: team2,
        team_1_score: score1,
        team_2_score: score2,
        status,
        ...(status === 'finished' && score1 > score2 ? { winner: team1 } : {}),
        ...(status === 'finished' && score2 > score1 ? { winner: team2 } : {}),
    };
}

function makeTournament(teams, games = [], options = {}) {
    const t = {
        teams,
        system: 'groups',
        useRating: false,
        roundRobinCircle: 1,
        preferences: {
            fieldsStart: 1,
            technical: { technicalFirst: 13, technicalSecond: 0 },
            maxScore: 13
        },
        games,
        groups: [teams],
        groupSchedule: options.groupSchedule || null,
        ...options,
    };
    return t;
}

describe('gameHasError', () => {
    it('detects draw scores as error', () => {
        expect(gameHasError({ team_1_score: 7, team_2_score: 7 }, 13)).toBe(true);
    });

    it('detects score exceeding max as error', () => {
        expect(gameHasError({ team_1_score: 14, team_2_score: 5 }, 13)).toBe(true);
        expect(gameHasError({ team_1_score: 5, team_2_score: 14 }, 13)).toBe(true);
    });

    it('detects negative score as error', () => {
        expect(gameHasError({ team_1_score: -1, team_2_score: 5 }, 13)).toBe(true);
    });

    it('returns false for valid scores', () => {
        expect(gameHasError({ team_1_score: 13, team_2_score: 5 }, 13)).toBe(false);
        expect(gameHasError({ team_1_score: 8, team_2_score: 13 }, 13)).toBe(false);
    });

    it('returns false when scores are empty', () => {
        expect(gameHasError({ team_1_score: null, team_2_score: null }, 13)).toBe(false);
    });
});

describe('isScoreError', () => {
    it('detects draw as error', () => {
        expect(isScoreError({ team_1_score: 10, team_2_score: 10 }, 13)).toBe(true);
    });

    it('detects null scores as error', () => {
        expect(isScoreError({ team_1_score: null, team_2_score: 5 }, 13)).toBe(true);
        expect(isScoreError({ team_1_score: 5, team_2_score: null }, 13)).toBe(true);
    });

    it('detects over-max as error', () => {
        expect(isScoreError({ team_1_score: 15, team_2_score: 5 }, 13)).toBe(true);
    });

    it('returns false for valid non-draw scores', () => {
        expect(isScoreError({ team_1_score: 13, team_2_score: 7 }, 13)).toBe(false);
    });
});

describe('getTeamsRanking for groups', () => {
    it('computes wins and points from finished games', () => {
        const teams = [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')];
        const games = [
            [
                makeGame('A', 'B', 13, 5, 'finished'),
                makeGame('C', 'D', 13, 8, 'finished'),
            ]
        ];
        const tournament = makeTournament(teams, games, { groupSchedule: [] });
        const ranking = getTeamsRanking(tournament, 2);

        const teamA = ranking[0].find(t => t.title === 'A');
        const teamB = ranking[0].find(t => t.title === 'B');
        const teamC = ranking[0].find(t => t.title === 'C');

        expect(teamA.wins).toBe(1);
        expect(teamA.pointsPlus).toBe(13);
        expect(teamA.pointsMinus).toBe(5);
        expect(teamB.wins).toBe(0);
        expect(teamB.pointsPlus).toBe(5);
        expect(teamB.pointsMinus).toBe(13);
        expect(teamC.wins).toBe(1);
    });

    it('ignores in_progress games in ranking', () => {
        const teams = [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')];
        const games = [
            [
                makeGame('A', 'B', 13, 5, 'finished'),
                makeGame('C', 'D', 7, 3, 'in_progress'),
            ]
        ];
        const tournament = makeTournament(teams, games, { groupSchedule: [] });
        const ranking = getTeamsRanking(tournament, 2);

        const teamA = ranking[0].find(t => t.title === 'A');
        const teamC = ranking[0].find(t => t.title === 'C');

        expect(teamA.wins).toBe(1);
        expect(teamC.wins).toBe(0);
        expect(teamC.pointsPlus).toBe(0);
    });

    it('ignores not_started games in ranking', () => {
        const teams = [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')];
        const games = [
            [
                makeGame('A', 'B', 13, 5, 'finished'),
                makeGame('C', 'D', null, null, 'not_started'),
            ]
        ];
        const tournament = makeTournament(teams, games, { groupSchedule: [] });
        const ranking = getTeamsRanking(tournament, 2);

        const teamC = ranking[0].find(t => t.title === 'C');
        expect(teamC.wins).toBe(0);
        expect(teamC.pointsPlus).toBe(0);
    });

    it('counts legacy games without status field (both scores present)', () => {
        const teams = [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')];
        const games = [
            [
                { team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 5 },
                { team_1: 'C', team_2: 'D', team_1_score: 10, team_2_score: 13 },
            ]
        ];
        const tournament = makeTournament(teams, games, { groupSchedule: [] });
        const ranking = getTeamsRanking(tournament, 2);

        const teamA = ranking[0].find(t => t.title === 'A');
        const teamD = ranking[0].find(t => t.title === 'D');

        expect(teamA.wins).toBe(1);
        expect(teamD.wins).toBe(1);
        expect(teamD.pointsPlus).toBe(13);
    });

    it('sorts by wins then point difference', () => {
        const teams = [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')];
        const games = [
            [
                makeGame('A', 'B', 13, 5, 'finished'),
                makeGame('C', 'D', 13, 12, 'finished'),
            ],
            [
                makeGame('A', 'D', 13, 7, 'finished'),
                makeGame('B', 'C', 13, 5, 'finished'),
            ]
        ];
        const tournament = makeTournament(teams, games, { groupSchedule: [] });
        const ranking = getTeamsRanking(tournament, 3);

        // A has 2 wins, should be first
        expect(ranking[0][0].title).toBe('A');
        expect(ranking[0][0].wins).toBe(2);
        // B and C have 1 win each, sorted by point diff
        expect(ranking[0][1].wins).toBe(1);
        expect(ranking[0][2].wins).toBe(1);
        const second = ranking[0][1];
        const third = ranking[0][2];
        expect(second.pointsPlus - second.pointsMinus).toBeGreaterThanOrEqual(
            third.pointsPlus - third.pointsMinus
        );
    });

    it('handles multiple rounds correctly', () => {
        const teams = [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')];
        const games = [
            [
                makeGame('A', 'B', 13, 5, 'finished'),
                makeGame('C', 'D', 13, 8, 'finished'),
            ],
            [
                makeGame('A', 'C', 13, 7, 'finished'),
                makeGame('B', 'D', 10, 13, 'finished'),
            ],
            [
                makeGame('A', 'D', 13, 3, 'finished'),
                makeGame('B', 'C', 11, 13, 'finished'),
            ]
        ];
        const tournament = makeTournament(teams, games, { groupSchedule: [] });
        const ranking = getTeamsRanking(tournament, 4);

        const teamA = ranking[0].find(t => t.title === 'A');
        expect(teamA.wins).toBe(3);
        expect(teamA.pointsPlus).toBe(39);
        expect(teamA.pointsMinus).toBe(15);
    });

    it('handles technical wins (team_2 = Technical)', () => {
        const teams = [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('Technical')];
        const games = [
            [
                makeGame('A', 'B', 13, 5, 'finished'),
                makeGame('C', 'Technical', 13, 0, 'finished'),
            ]
        ];
        const tournament = makeTournament(teams, games, { groupSchedule: [] });
        const ranking = getTeamsRanking(tournament, 2);

        const teamC = ranking[0].find(t => t.title === 'C');
        expect(teamC.wins).toBe(1);
        expect(teamC.pointsPlus).toBe(13);
    });
});

describe('drawGroupsRound', () => {
    it('generates correct number of games for group', () => {
        const teams = [];
        for (let i = 0; i < 6; i++) {
            teams.push(makeTeam(`Team ${i}`));
        }
        const tournament = makeTournament(teams, []);
        const result = generateConstrainedGroups(tournament, 6);
        tournament.groups = result.groups;
        tournament.groupsScheme = result.schemas;

        const round = drawGroupsRound(tournament);
        expect(round).toHaveLength(3);
    });

    it('each team plays exactly once per round', () => {
        const teams = [];
        for (let i = 0; i < 8; i++) {
            teams.push(makeTeam(`Team ${i}`));
        }
        const tournament = makeTournament(teams, []);
        const result = generateConstrainedGroups(tournament, 8);
        tournament.groups = result.groups;
        tournament.groupsScheme = result.schemas;

        const round = drawGroupsRound(tournament);
        const teamsInRound = new Set();
        round.forEach(game => {
            expect(teamsInRound.has(game.team_1)).toBe(false);
            expect(teamsInRound.has(game.team_2)).toBe(false);
            teamsInRound.add(game.team_1);
            teamsInRound.add(game.team_2);
        });
        expect(teamsInRound.size).toBe(8);
    });

    it('generates games with not_started status', () => {
        const teams = [];
        for (let i = 0; i < 6; i++) {
            teams.push(makeTeam(`Team ${i}`));
        }
        const tournament = makeTournament(teams, []);
        const result = generateConstrainedGroups(tournament, 6);
        tournament.groups = result.groups;
        tournament.groupsScheme = result.schemas;

        const round = drawGroupsRound(tournament);
        round.forEach(game => {
            expect(game.status).toBe('not_started');
        });
    });
});

describe('assignLanes', () => {
    it('assigns sequential lane numbers to games', () => {
        const games = [
            makeGame('A', 'B', null, null, 'not_started'),
            makeGame('C', 'D', null, null, 'not_started'),
            makeGame('E', 'F', null, null, 'not_started'),
        ];
        const tournament = {
            teams: [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D'), makeTeam('E'), makeTeam('F')],
            preferences: { fieldsStart: 1 },
            games: [],
        };
        const result = assignLanes(games, tournament);
        expect(result).toHaveLength(3);
    });
});

describe('generateConstrainedGroups', () => {
    it('same-club teams meet in earliest rounds', () => {
        const teams = [
            makeTeam('X1', 'ClubX'),
            makeTeam('X2', 'ClubX'),
            makeTeam('A', null),
            makeTeam('B', null),
            makeTeam('C', null),
            makeTeam('D', null),
        ];
        const tournament = makeTournament(teams, []);
        const result = generateConstrainedGroups(tournament, 6);

        expect(result.groups).toHaveLength(1);
        expect(result.groups[0]).toHaveLength(6);

        tournament.groups = result.groups;
        tournament.groupsScheme = result.schemas;

        const rounds = [];
        for (let r = 0; r < 5; r++) {
            rounds.push(drawGroupsRound(tournament));
        }

        let meetRound = -1;
        rounds.forEach((round, rIdx) => {
            round.forEach(game => {
                if ((game.team_1 === 'X1' && game.team_2 === 'X2') ||
                    (game.team_1 === 'X2' && game.team_2 === 'X1')) {
                    meetRound = rIdx;
                }
            });
        });

        expect(meetRound).toBeGreaterThanOrEqual(0);
        expect(meetRound).toBeLessThanOrEqual(2);
    });

    it('handles odd number of teams', () => {
        const teams = [];
        for (let i = 0; i < 5; i++) {
            teams.push(makeTeam(`Team ${i}`));
        }
        const tournament = makeTournament(teams, []);
        const result = generateConstrainedGroups(tournament, 5);

        // Odd teams: either adds Technical placeholder or keeps as-is
        expect(result.groups[0].length).toBeGreaterThanOrEqual(5);
    });

    it('multi-group falls back to createGroups', () => {
        const teams = [];
        for (let i = 0; i < 12; i++) {
            teams.push(makeTeam(`Team ${i}`));
        }
        const tournament = makeTournament(teams, []);
        const result = generateConstrainedGroups(tournament, 6);

        expect(result.groups).toHaveLength(2);
        expect(result.groups[0]).toHaveLength(6);
        expect(result.groups[1]).toHaveLength(6);
    });
});

describe('game status lifecycle', () => {
    it('new games start with not_started status', () => {
        const game = makeGame('A', 'B', null, null, 'not_started');
        expect(game.status).toBe('not_started');
        expect(game.team_1_score).toBeNull();
    });

    it('finished game has winner set', () => {
        const game = makeGame('A', 'B', 13, 5, 'finished');
        expect(game.status).toBe('finished');
        expect(game.winner).toBe('A');
    });

    it('finished game with team2 winning', () => {
        const game = makeGame('A', 'B', 5, 13, 'finished');
        expect(game.winner).toBe('B');
    });

    it('in_progress game has no winner', () => {
        const game = makeGame('A', 'B', 7, 3, 'in_progress');
        expect(game.status).toBe('in_progress');
        expect(game.winner).toBeUndefined();
    });
});
