import { describe, it, expect } from 'vitest';
import { assignLanes, drawGroupsRound, generateConstrainedGroups } from '@/services/draw';

function makeTeam(title) {
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
        players: []
    };
}

function makeTournament(teamCount) {
    const teams = [];
    for (let i = 0; i < teamCount; i++) {
        teams.push(makeTeam(`Team ${i + 1}`));
    }
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
        games: [],
        groups: [],
        groupsScheme: []
    };
}

function simulateRounds(tournament, roundCount) {
    const rounds = [];
    for (let r = 0; r < roundCount; r++) {
        const games = drawGroupsRound(tournament);
        const scheduled = assignLanes(games, tournament);
        scheduled.forEach(game => {
            const t1 = tournament.teams.find(t => t.title === game.team_1);
            const t2 = tournament.teams.find(t => t.title === game.team_2);
            if (t1 && game.lane != null) t1.lanes.push(game.lane);
            if (t2 && game.lane != null) t2.lanes.push(game.lane);
        });
        rounds.push(scheduled);
    }
    return rounds;
}

describe('assignLanes - consecutive lane avoidance', () => {
    it('avoids assigning same lane in consecutive rounds when possible', () => {
        const tournament = makeTournament(6);
        const result = generateConstrainedGroups(tournament, 6);
        tournament.groups = result.groups;
        tournament.groupsScheme = result.schemas;

        const rounds = simulateRounds(tournament, 5);

        let consecutiveCount = 0;
        let totalChecks = 0;

        for (const team of tournament.teams) {
            for (let i = 1; i < team.lanes.length; i++) {
                totalChecks++;
                if (team.lanes[i] === team.lanes[i - 1]) {
                    consecutiveCount++;
                }
            }
        }

        expect(consecutiveCount).toBeLessThan(totalChecks * 0.2);
    });

    it('assigns lanes to all games', () => {
        const tournament = makeTournament(8);
        const result = generateConstrainedGroups(tournament, 8);
        tournament.groups = result.groups;
        tournament.groupsScheme = result.schemas;

        const rounds = simulateRounds(tournament, 3);

        rounds.forEach(round => {
            round.forEach(game => {
                expect(game.lane).toBeDefined();
                expect(game.lane).not.toBeNull();
            });
        });
    });

    it('still distributes lanes evenly across all rounds', () => {
        const tournament = makeTournament(8);
        const result = generateConstrainedGroups(tournament, 8);
        tournament.groups = result.groups;
        tournament.groupsScheme = result.schemas;

        simulateRounds(tournament, 7);

        for (const team of tournament.teams) {
            const laneCounts = {};
            team.lanes.forEach(lane => {
                laneCounts[lane] = (laneCounts[lane] || 0) + 1;
            });
            const counts = Object.values(laneCounts);
            const maxCount = Math.max(...counts);
            const minCount = Math.min(...counts);
            expect(maxCount - minCount).toBeLessThanOrEqual(2);
        }
    });
});
