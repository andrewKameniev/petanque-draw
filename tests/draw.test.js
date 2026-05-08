import { describe, it, expect } from 'vitest';
import {
    getRandomWithOneExclusion,
    generateCompetitors,
    generateCompetitorsFirstLast,
    drawSwissRound,
    drawSupermeleRound,
    assignLanes,
    createGroups,
    saveResultsForRound
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
        players: []
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
            maxScore: 13
        },
        games: options.games || [],
        ...options
    };
}

describe('getRandomWithOneExclusion', () => {
    it('returns a number within range', () => {
        for (let i = 0; i < 100; i++) {
            const result = getRandomWithOneExclusion(10);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(10);
        }
    });

    it('never returns the excluded index', () => {
        for (let i = 0; i < 200; i++) {
            const result = getRandomWithOneExclusion(5, 2);
            expect(result).not.toBe(2);
        }
    });

    it('never returns either excluded index', () => {
        for (let i = 0; i < 200; i++) {
            const result = getRandomWithOneExclusion(5, 1, 3);
            expect(result).not.toBe(1);
            expect(result).not.toBe(3);
        }
    });

    it('works with length of 2 and one exclusion', () => {
        for (let i = 0; i < 50; i++) {
            const result = getRandomWithOneExclusion(2, 0);
            expect(result).toBe(1);
        }
    });
});

describe('generateCompetitors', () => {
    it('returns random indices for round 1 without rating', () => {
        const teams = [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')];
        const result = generateCompetitors(teams, 1, false);
        expect(result.teamIndex).toBeGreaterThanOrEqual(0);
        expect(result.opponentIndex).toBeGreaterThanOrEqual(0);
        expect(result.teamIndex).not.toBe(result.opponentIndex);
    });

    it('returns first team vs second for round > 1', () => {
        const teams = [
            makeTeam('A', 2),
            makeTeam('B', 1),
            makeTeam('C', 0),
            makeTeam('D', 0),
        ];
        const result = generateCompetitors(teams, 2, true);
        expect(result.teamIndex).toBe(0);
        expect(result.opponentIndex).toBe(1);
    });

    it('skips already-played opponents', () => {
        const teams = [
            makeTeam('A', 2, ['B']),
            makeTeam('B', 1),
            makeTeam('C', 0),
            makeTeam('D', 0),
        ];
        const result = generateCompetitors(teams, 2, true);
        expect(result.teamIndex).toBe(0);
        expect(result.opponentIndex).toBe(2);
    });

    it('returns -1 when no valid opponent found', () => {
        const teams = [
            makeTeam('A', 2, ['B', 'C']),
            makeTeam('B', 1),
            makeTeam('C', 0),
        ];
        const result = generateCompetitors(teams, 2, true);
        expect(result.opponentIndex).toBe(-1);
    });
});

describe('generateCompetitorsFirstLast', () => {
    it('returns random indices for round 1 without rating', () => {
        const teams = [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')];
        const result = generateCompetitorsFirstLast(teams, 1, false);
        expect(result.teamIndex).toBeGreaterThanOrEqual(0);
        expect(result.opponentIndex).toBeGreaterThanOrEqual(0);
        expect(result.teamIndex).not.toBe(result.opponentIndex);
    });

    it('pairs first with last among same-win teams', () => {
        const teams = [
            makeTeam('A', 2),
            makeTeam('B', 2),
            makeTeam('C', 2),
            makeTeam('D', 2),
        ];
        const result = generateCompetitorsFirstLast(teams, 2, true);
        expect(result.teamIndex).toBe(0);
        expect(result.opponentIndex).toBe(3);
    });

    it('returns -1 when all same-win opponents already played', () => {
        const teams = [
            makeTeam('A', 2, ['B', 'C', 'D']),
            makeTeam('B', 2),
            makeTeam('C', 2),
            makeTeam('D', 2),
        ];
        const result = generateCompetitorsFirstLast(teams, 2, true);
        expect(result.opponentIndex).toBe(-1);
    });
});

describe('drawSwissRound', () => {
    it('generates correct number of games for even team count', () => {
        const teams = [
            makeTeam('A', 0, [], 100),
            makeTeam('B', 0, [], 90),
            makeTeam('C', 0, [], 80),
            makeTeam('D', 0, [], 70),
            makeTeam('E', 0, [], 60),
            makeTeam('F', 0, [], 50),
        ];
        const tournament = makeTournament(teams, { useRating: true });
        const { round, error } = drawSwissRound(tournament, teams, 1);
        expect(error).toBeNull();
        expect(round).toHaveLength(3);
    });

    it('adds technical game for odd team count', () => {
        const teams = [
            makeTeam('A', 0, [], 100),
            makeTeam('B', 0, [], 90),
            makeTeam('C', 0, [], 80),
            makeTeam('D', 0, [], 70),
            makeTeam('E', 0, [], 60),
        ];
        const tournament = makeTournament(teams, { useRating: true });
        const { round, error } = drawSwissRound(tournament, teams, 1);
        expect(error).toBeNull();
        expect(round).toHaveLength(3);
        const technicalGame = round.find(g => g.team_2 === 'Technical');
        expect(technicalGame).toBeDefined();
        expect(technicalGame.team_1_score).toBe(13);
        expect(technicalGame.team_2_score).toBe(0);
    });

    it('no team plays the same opponent twice', () => {
        const teams = [
            makeTeam('A', 1, ['B'], 100),
            makeTeam('B', 1, ['A'], 90),
            makeTeam('C', 0, ['D'], 80),
            makeTeam('D', 0, ['C'], 70),
            makeTeam('E', 1, ['F'], 60),
            makeTeam('F', 0, ['E'], 50),
        ];
        const tournament = makeTournament(teams, { useRating: true });
        const { round, error } = drawSwissRound(tournament, teams, 2);
        expect(error).toBeNull();
        round.forEach(game => {
            if (game.team_2 !== 'Technical') {
                const team = teams.find(t => t.title === game.team_1);
                expect(team.opponents).not.toContain(game.team_2);
            }
        });
    });

    it('returns error when draw is impossible', () => {
        const teams = [
            makeTeam('A', 2, ['B', 'C', 'D', 'E', 'F'], 100),
            makeTeam('B', 2, ['A', 'C', 'D', 'E', 'F'], 90),
            makeTeam('C', 1, ['A', 'B', 'D', 'E', 'F'], 80),
            makeTeam('D', 1, ['A', 'B', 'C', 'E', 'F'], 70),
            makeTeam('E', 0, ['A', 'B', 'C', 'D', 'F'], 60),
            makeTeam('F', 0, ['A', 'B', 'C', 'D', 'E'], 50),
        ];
        const tournament = makeTournament(teams, { useRating: true });
        const { round, error } = drawSwissRound(tournament, teams, 6);
        expect(error).toBe('cantDraw');
        expect(round).toBeNull();
    });

    it('technical team rotates when already played technical', () => {
        const teams = [
            makeTeam('A', 0, ['Technical'], 50),
            makeTeam('B', 0, [], 40),
            makeTeam('C', 0, [], 30),
            makeTeam('D', 0, ['Technical'], 20),
            makeTeam('E', 0, [], 10),
        ];
        const tournament = makeTournament(teams, { useRating: true });
        const { round } = drawSwissRound(tournament, teams, 2);
        const technicalGame = round.find(g => g.team_2 === 'Technical');
        expect(technicalGame.team_1).not.toBe('A');
        expect(technicalGame.team_1).not.toBe('D');
    });
});

describe('drawSupermeleRound', () => {
    it('pairs all players in doubles-preferred format', () => {
        const teams = Array.from({ length: 8 }, (_, i) => makeTeam(`P${i + 1}`));
        const tournament = makeTournament(teams, { system: 'supermele', supermelePlayers: 2 });
        const round = drawSupermeleRound(tournament, teams);
        expect(round.length).toBeGreaterThan(0);
        const allPlayers = round.flatMap(g => [...g.team_1_players, ...g.team_2_players]);
        expect(allPlayers).toHaveLength(8);
    });

    it('pairs all players in triples-preferred format', () => {
        const teams = Array.from({ length: 12 }, (_, i) => makeTeam(`P${i + 1}`));
        const tournament = makeTournament(teams, { system: 'supermele', supermelePlayers: 3 });
        const round = drawSupermeleRound(tournament, teams);
        expect(round.length).toBeGreaterThan(0);
        const allPlayers = round.flatMap(g => [...g.team_1_players, ...g.team_2_players]);
        expect(allPlayers).toHaveLength(12);
    });

    it('no player appears in multiple games', () => {
        const teams = Array.from({ length: 8 }, (_, i) => makeTeam(`P${i + 1}`));
        const tournament = makeTournament(teams, { system: 'supermele', supermelePlayers: 2 });
        const round = drawSupermeleRound(tournament, teams);
        const allPlayers = round.flatMap(g => [...g.team_1_players, ...g.team_2_players]);
        const uniquePlayers = new Set(allPlayers);
        expect(uniquePlayers.size).toBe(allPlayers.length);
    });
});

describe('assignLanes', () => {
    it('assigns unique lanes to each game', () => {
        const teams = [
            makeTeam('A'), makeTeam('B'), makeTeam('C'),
            makeTeam('D'), makeTeam('E'), makeTeam('F'),
        ];
        const tournament = makeTournament(teams, { fieldsStart: 1 });
        const games = [
            { team_1: 'A', team_1_score: null, team_2: 'B', team_2_score: null },
            { team_1: 'C', team_1_score: null, team_2: 'D', team_2_score: null },
            { team_1: 'E', team_1_score: null, team_2: 'F', team_2_score: null },
        ];
        const result = assignLanes(games, tournament);
        const lanes = result.map(g => g.lane);
        const uniqueLanes = new Set(lanes);
        expect(uniqueLanes.size).toBe(3);
    });

    it('returns games sorted by lane', () => {
        const teams = [
            makeTeam('A'), makeTeam('B'), makeTeam('C'),
            makeTeam('D'), makeTeam('E'), makeTeam('F'),
        ];
        const tournament = makeTournament(teams, { fieldsStart: 1 });
        const games = [
            { team_1: 'A', team_1_score: null, team_2: 'B', team_2_score: null },
            { team_1: 'C', team_1_score: null, team_2: 'D', team_2_score: null },
            { team_1: 'E', team_1_score: null, team_2: 'F', team_2_score: null },
        ];
        const result = assignLanes(games, tournament);
        for (let i = 1; i < result.length; i++) {
            expect(result[i].lane).toBeGreaterThanOrEqual(result[i - 1].lane);
        }
    });

    it('avoids ALL previously played lanes, not just last', () => {
        const teams = [
            { ...makeTeam('A'), lanes: [0, 1] },
            { ...makeTeam('B'), lanes: [0, 1] },
            { ...makeTeam('C'), lanes: [2] },
            { ...makeTeam('D'), lanes: [2] },
            { ...makeTeam('E'), lanes: [] },
            { ...makeTeam('F'), lanes: [] },
        ];
        const tournament = makeTournament(teams, { fieldsStart: 1 });
        const games = [
            { team_1: 'A', team_1_score: null, team_2: 'B', team_2_score: null },
            { team_1: 'C', team_1_score: null, team_2: 'D', team_2_score: null },
        ];
        const result = assignLanes(games, tournament);
        const gameAB = result.find(g => g.team_1 === 'A');
        // A and B played lanes 0 and 1 — should get lane 2
        expect(gameAB.lane).not.toBe(0);
        expect(gameAB.lane).not.toBe(1);
    });

    it('falls back to least-used lane when all lanes played', () => {
        const teams = [
            { ...makeTeam('A'), lanes: [0, 1, 2] },
            { ...makeTeam('B'), lanes: [0, 1, 2] },
            { ...makeTeam('C'), lanes: [0] },
            { ...makeTeam('D'), lanes: [1] },
        ];
        const tournament = makeTournament(teams, { fieldsStart: 1 });
        const games = [
            { team_1: 'A', team_1_score: null, team_2: 'B', team_2_score: null },
        ];
        const result = assignLanes(games, tournament);
        // All lanes used — should pick minimum weight (each used once, so any is valid)
        expect(result[0].lane).toBeDefined();
    });

    it('handles technical game in swiss with odd teams', () => {
        const teams = [
            makeTeam('A'), makeTeam('B'), makeTeam('C'),
            makeTeam('D'), makeTeam('E'),
        ];
        const tournament = makeTournament(teams, { system: 'swiss', fieldsStart: 1 });
        const games = [
            { team_1: 'A', team_1_score: null, team_2: 'B', team_2_score: null },
            { team_1: 'C', team_1_score: null, team_2: 'D', team_2_score: null },
            { team_1: 'E', team_1_score: 13, team_2: 'Technical', team_2_score: 0 },
        ];
        const result = assignLanes(games, tournament);
        expect(result).toHaveLength(3);
        const technical = result.find(g => g.team_2 === 'Technical');
        expect(technical).toBeDefined();
    });

    it('respects fieldsStart offset', () => {
        const teams = [
            makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D'),
        ];
        const tournament = makeTournament(teams, { fieldsStart: 3 });
        const games = [
            { team_1: 'A', team_1_score: null, team_2: 'B', team_2_score: null },
            { team_1: 'C', team_1_score: null, team_2: 'D', team_2_score: null },
        ];
        const result = assignLanes(games, tournament);
        result.forEach(g => {
            expect(g.lane).toBeGreaterThanOrEqual(2);
        });
    });
});

describe('createGroups', () => {
    it('creates correct number of groups', () => {
        const teams = Array.from({ length: 8 }, (_, i) => makeTeam(`T${i + 1}`, 0, [], 100 - i * 10));
        const tournament = makeTournament(teams, { useRating: true });
        const { groups } = createGroups(tournament, 4);
        expect(groups).toHaveLength(2);
    });

    it('distributes teams evenly across groups', () => {
        const teams = Array.from({ length: 12 }, (_, i) => makeTeam(`T${i + 1}`, 0, [], 100 - i * 5));
        const tournament = makeTournament(teams, { useRating: true });
        const { groups } = createGroups(tournament, 4);
        expect(groups).toHaveLength(3);
        groups.forEach(group => {
            expect(group).toHaveLength(4);
        });
    });

    it('generates round-robin schemas', () => {
        const teams = Array.from({ length: 8 }, (_, i) => makeTeam(`T${i + 1}`, 0, [], 100 - i * 10));
        const tournament = makeTournament(teams, { useRating: true });
        const { schemas } = createGroups(tournament, 4);
        expect(schemas).toHaveLength(2);
        schemas.forEach(scheme => {
            expect(scheme.top).toBeDefined();
            expect(scheme.bottom).toBeDefined();
            expect(scheme.top.length).toBe(scheme.bottom.length);
        });
    });

    it('uses seeding scheme for 2 groups with rating', () => {
        const teams = Array.from({ length: 16 }, (_, i) => makeTeam(`T${i + 1}`, 0, [], 160 - i * 10));
        const tournament = makeTournament(teams, { useRating: true });
        const { groups } = createGroups(tournament, 8);
        expect(groups).toHaveLength(2);
        expect(groups[0].length + groups[1].length).toBe(16);
    });

    it('handles odd teams in group (adds technical slot in schema)', () => {
        const teams = Array.from({ length: 9 }, (_, i) => makeTeam(`T${i + 1}`, 0, [], 100 - i * 10));
        const tournament = makeTournament(teams, { useRating: true });
        const { groups, schemas } = createGroups(tournament, 5);
        const oddGroup = groups.find(g => g.length % 2 !== 0);
        if (oddGroup) {
            const idx = groups.indexOf(oddGroup);
            expect(schemas[idx].top.length + schemas[idx].bottom.length).toBe(oddGroup.length + 1);
        }
    });
});

describe('saveResultsForRound', () => {
    it('updates wins for swiss tournament', () => {
        const teams = [
            makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D'),
        ];
        const tournament = makeTournament(teams, {
            system: 'swiss',
            games: [[
                { team_1: 'A', team_1_score: 13, team_2: 'B', team_2_score: 5 },
                { team_1: 'C', team_1_score: 7, team_2: 'D', team_2_score: 13 },
            ]]
        });
        saveResultsForRound(tournament, 0);
        expect(tournament.teams.find(t => t.title === 'A').wins).toBe(1);
        expect(tournament.teams.find(t => t.title === 'B').wins).toBe(0);
        expect(tournament.teams.find(t => t.title === 'C').wins).toBe(0);
        expect(tournament.teams.find(t => t.title === 'D').wins).toBe(1);
    });

    it('updates opponents list', () => {
        const teams = [makeTeam('A'), makeTeam('B')];
        const tournament = makeTournament(teams, {
            system: 'swiss',
            games: [[{ team_1: 'A', team_1_score: 13, team_2: 'B', team_2_score: 5 }]]
        });
        saveResultsForRound(tournament, 0);
        expect(tournament.teams[0].opponents).toContain('B');
        expect(tournament.teams[1].opponents).toContain('A');
    });

    it('updates points correctly', () => {
        const teams = [makeTeam('A'), makeTeam('B')];
        const tournament = makeTournament(teams, {
            system: 'swiss',
            games: [[{ team_1: 'A', team_1_score: 13, team_2: 'B', team_2_score: 7 }]]
        });
        saveResultsForRound(tournament, 0);
        expect(tournament.teams[0].pointsPlus).toBe(13);
        expect(tournament.teams[0].pointsMinus).toBe(7);
        expect(tournament.teams[1].pointsPlus).toBe(7);
        expect(tournament.teams[1].pointsMinus).toBe(13);
    });

    it('does not award win to Technical team', () => {
        const teams = [makeTeam('A'), makeTeam('B')];
        const tournament = makeTournament(teams, {
            system: 'swiss',
            games: [[{ team_1: 'A', team_1_score: 0, team_2: 'Technical', team_2_score: 13 }]]
        });
        saveResultsForRound(tournament, 0);
        expect(tournament.teams[0].wins).toBe(0);
    });

    it('handles supermele format', () => {
        const teams = [makeTeam('P1'), makeTeam('P2'), makeTeam('P3'), makeTeam('P4')];
        const tournament = makeTournament(teams, {
            system: 'supermele',
            games: [[{
                team_1: 'P1, P2',
                team_1_players: ['P1', 'P2'],
                team_1_score: 13,
                team_2: 'P3, P4',
                team_2_players: ['P3', 'P4'],
                team_2_score: 5
            }]]
        });
        saveResultsForRound(tournament, 0);
        expect(tournament.teams.find(t => t.title === 'P1').wins).toBe(1);
        expect(tournament.teams.find(t => t.title === 'P2').wins).toBe(1);
        expect(tournament.teams.find(t => t.title === 'P3').wins).toBe(0);
        expect(tournament.teams.find(t => t.title === 'P4').wins).toBe(0);
    });

    it('records partners as opponents in supermele', () => {
        const teams = [makeTeam('P1'), makeTeam('P2'), makeTeam('P3'), makeTeam('P4')];
        const tournament = makeTournament(teams, {
            system: 'supermele',
            games: [[{
                team_1: 'P1, P2',
                team_1_players: ['P1', 'P2'],
                team_1_score: 13,
                team_2: 'P3, P4',
                team_2_players: ['P3', 'P4'],
                team_2_score: 5
            }]]
        });
        saveResultsForRound(tournament, 0);
        expect(tournament.teams.find(t => t.title === 'P1').opponents).toContain('P2');
        expect(tournament.teams.find(t => t.title === 'P3').opponents).toContain('P4');
    });

    it('clears placeholder opponents for early rounds', () => {
        const teams = [
            { ...makeTeam('A'), opponents: ['placeholder'] },
            { ...makeTeam('B'), opponents: ['placeholder'] },
        ];
        const tournament = makeTournament(teams, {
            system: 'swiss',
            games: [[{ team_1: 'A', team_1_score: 13, team_2: 'B', team_2_score: 5 }]]
        });
        saveResultsForRound(tournament, 0);
        expect(tournament.teams[0].opponents).not.toContain('placeholder');
    });
});
