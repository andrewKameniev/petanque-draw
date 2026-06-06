import { describe, it, expect } from 'vitest';
import { generateConstrainedGroups, drawGroupsRound } from '@/services/draw';

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

function makeTournament(teams) {
    return {
        teams,
        system: 'groups',
        useRating: false,
        roundRobinCircle: 1,
        preferences: {
            fieldsStart: 1,
            technical: { technicalFirst: 13, technicalSecond: 0 },
            maxScore: 13
        },
        games: []
    };
}

function generateFullSchedule(tournament) {
    const rounds = [];
    const totalRounds = tournament.groups[0].length - 1;
    for (let r = 0; r < totalRounds; r++) {
        const round = drawGroupsRound(tournament);
        rounds.push(round);
    }
    return rounds;
}

describe('generateConstrainedGroups', () => {
    it('places same-club teams in the earliest possible rounds', () => {
        const CLUB_X = 'Club X';
        const CLUB_Y = 'Club Y';

        const teams = [
            makeTeam('Team X1', CLUB_X),
            makeTeam('Team X2', CLUB_X),
            makeTeam('Team Y1', CLUB_Y),
            makeTeam('Team Y2', CLUB_Y),
            makeTeam('Team A'),
            makeTeam('Team B'),
            makeTeam('Team C'),
            makeTeam('Team D'),
            makeTeam('Team E'),
            makeTeam('Team F'),
        ];

        const tournament = makeTournament(teams);
        const result = generateConstrainedGroups(tournament, 10);

        expect(result.groups).toHaveLength(1);
        expect(result.groups[0]).toHaveLength(10);
        expect(result.warning).toBeNull();

        tournament.groups = result.groups;
        tournament.groupsScheme = result.schemas;

        const rounds = generateFullSchedule(tournament);
        const firstHalfEnd = Math.floor((rounds.length) / 2);

        const sameClubPairs = [
            ['Team X1', 'Team X2'],
            ['Team Y1', 'Team Y2'],
        ];

        for (const [teamA, teamB] of sameClubPairs) {
            let meetRound = -1;
            rounds.forEach((round, rIdx) => {
                round.forEach(game => {
                    if ((game.team_1 === teamA && game.team_2 === teamB) ||
                        (game.team_1 === teamB && game.team_2 === teamA)) {
                        meetRound = rIdx;
                    }
                });
            });
            expect(meetRound).toBeGreaterThanOrEqual(0);
            expect(meetRound).toBeLessThanOrEqual(firstHalfEnd);
        }
    });

    it('returns valid round-robin: every team plays once per round, every pair plays once', () => {
        const teams = [];
        for (let i = 0; i < 10; i++) {
            teams.push(makeTeam(`Team ${i}`));
        }

        const tournament = makeTournament(teams);
        const result = generateConstrainedGroups(tournament, 10);
        tournament.groups = result.groups;
        tournament.groupsScheme = result.schemas;

        const rounds = generateFullSchedule(tournament);
        expect(rounds).toHaveLength(9);

        const allPairs = new Set();
        rounds.forEach((round, rIdx) => {
            const teamsInRound = new Set();
            round.forEach(game => {
                expect(teamsInRound.has(game.team_1)).toBe(false);
                expect(teamsInRound.has(game.team_2)).toBe(false);
                teamsInRound.add(game.team_1);
                teamsInRound.add(game.team_2);

                const pair = [game.team_1, game.team_2].sort().join('|');
                expect(allPairs.has(pair)).toBe(false);
                allPairs.add(pair);
            });
            expect(teamsInRound.size).toBe(10);
        });

        expect(allPairs.size).toBe(45); // C(10,2) = 45
    });

    it('falls back to regular createGroups for multi-group tournaments', () => {
        const teams = [];
        for (let i = 0; i < 12; i++) {
            teams.push(makeTeam(`Team ${i}`));
        }

        const tournament = makeTournament(teams);
        const result = generateConstrainedGroups(tournament, 6);

        expect(result.groups).toHaveLength(2);
        expect(result.groups[0]).toHaveLength(6);
        expect(result.groups[1]).toHaveLength(6);
    });
});
