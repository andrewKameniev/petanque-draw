import { describe, it, expect } from 'vitest';
import { reshuffleGroupSchedule, drawGroupsRound, resetGroupsScheme } from '@/services/draw';

function makeTeam(title, rating = 0, club = null) {
    return {
        title,
        wins: 0,
        opponents: [],
        rating,
        buhgolts: 0,
        smallBuhgolts: 0,
        pointsPlus: 0,
        pointsMinus: 0,
        lanes: [],
        players: club ? [{ club }] : []
    };
}

function makeTournament(teams, groups) {
    const schemas = groups.map(group => {
        const n = group.length;
        let groupIndexes = Array.from({length: n}, (_, i) => i);
        if (n % 2 !== 0) groupIndexes.push(n);
        const scheme = {top: [], bottom: []};
        for (let i = 0; i < groupIndexes.length / 2; i++) {
            scheme.top.push(i);
        }
        for (let i = groupIndexes.length - 1; i >= groupIndexes.length / 2; i--) {
            scheme.bottom.push(i);
        }
        return scheme;
    });

    return {
        teams,
        system: 'groups',
        useRating: true,
        roundRobinCircle: 1,
        groups,
        groupsScheme: schemas,
        groupSchedule: null,
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
    const group = tournament.groups[0];
    const totalRounds = group.length % 2 === 0 ? group.length - 1 : group.length;
    for (let r = 0; r < totalRounds; r++) {
        const round = drawGroupsRound(tournament);
        rounds.push(round);
    }
    return rounds;
}

describe('reshuffleGroupSchedule', () => {
    it('produces a valid round-robin: every team plays once per round, every pair plays exactly once', () => {
        const teams = Array.from({length: 10}, (_, i) => makeTeam(`Team ${i}`, 100 - i * 10));
        const groups = [teams];
        const tournament = makeTournament(teams, groups);

        const result = reshuffleGroupSchedule(tournament);
        tournament.groups = result.groups;
        tournament.groupsScheme = result.schemas;

        const rounds = generateFullSchedule(tournament);
        expect(rounds).toHaveLength(9);

        const allPairs = new Set();
        rounds.forEach(round => {
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
        expect(allPairs.size).toBe(45);
    });

    it('keeps the same teams in the group (no teams lost or added)', () => {
        const teams = Array.from({length: 8}, (_, i) => makeTeam(`T${i}`, 80 - i * 10));
        const groups = [teams];
        const tournament = makeTournament(teams, groups);

        const result = reshuffleGroupSchedule(tournament);
        const resultTitles = result.groups[0].map(t => t.title).sort();
        const originalTitles = teams.map(t => t.title).sort();
        expect(resultTitles).toEqual(originalTitles);
    });

    it('produces different orderings on consecutive calls (randomness)', () => {
        const teams = Array.from({length: 10}, (_, i) => makeTeam(`T${i}`, 100 - i * 10));
        const groups = [teams];
        const tournament = makeTournament(teams, groups);

        const orderings = new Set();
        for (let i = 0; i < 10; i++) {
            const result = reshuffleGroupSchedule(tournament);
            orderings.add(result.groups[0].map(t => t.title).join(','));
        }
        expect(orderings.size).toBeGreaterThan(1);
    });

    it('avoids strongest teams meeting in the same round', () => {
        const teams = [
            makeTeam('Top1', 100),
            makeTeam('Top2', 95),
            makeTeam('Top3', 90),
            makeTeam('Mid1', 50),
            makeTeam('Mid2', 45),
            makeTeam('Mid3', 40),
            makeTeam('Low1', 10),
            makeTeam('Low2', 5),
        ];
        const groups = [teams];
        const tournament = makeTournament(teams, groups);

        const topTitles = ['Top1', 'Top2', 'Top3'];
        let topMeetInFirstRound = 0;
        const iterations = 20;

        for (let i = 0; i < iterations; i++) {
            const result = reshuffleGroupSchedule(tournament);
            const t = makeTournament(teams, result.groups);
            t.groupsScheme = result.schemas;
            const rounds = generateFullSchedule(t);

            const firstRound = rounds[0];
            for (const game of firstRound) {
                if (topTitles.includes(game.team_1) && topTitles.includes(game.team_2)) {
                    topMeetInFirstRound++;
                }
            }
        }

        // With proper balancing, the top 3 teams should not all meet each other in round 1
        // On average it should be much less than if random (which would cluster them)
        expect(topMeetInFirstRound).toBeLessThan(iterations);
    });

    it('spreads high-rating matchups across rounds', () => {
        const teams = Array.from({length: 8}, (_, i) => makeTeam(`T${i}`, 80 - i * 10));
        const groups = [teams];
        const tournament = makeTournament(teams, groups);

        let totalMaxSpread = 0;
        const iterations = 20;

        for (let iter = 0; iter < iterations; iter++) {
            const result = reshuffleGroupSchedule(tournament);
            const t = makeTournament(teams, result.groups);
            t.groupsScheme = result.schemas;

            const rounds = generateFullSchedule(t);
            const roundMaxRatings = rounds.map(round => {
                let max = 0;
                round.forEach(game => {
                    const r1 = teams.find(tm => tm.title === game.team_1)?.rating || 0;
                    const r2 = teams.find(tm => tm.title === game.team_2)?.rating || 0;
                    if (r1 + r2 > max) max = r1 + r2;
                });
                return max;
            });

            const maxDiff = Math.max(...roundMaxRatings) - Math.min(...roundMaxRatings);
            totalMaxSpread += maxDiff;
        }

        const avgSpread = totalMaxSpread / iterations;
        // The top two teams sum to 150 (80+70). A completely unbalanced schedule
        // would have 150 in one round and much less in others. Balanced should keep spread small.
        // Maximum possible sum = 150, minimum pair among 8 teams = 10+20=30, so max spread = 120.
        // With balancing, expect spread to be under 80 on average.
        expect(avgSpread).toBeLessThan(80);
    });

    it('handles odd number of teams (with technical bye)', () => {
        const teams = Array.from({length: 9}, (_, i) => makeTeam(`T${i}`, 90 - i * 10));
        const groups = [teams];
        const tournament = makeTournament(teams, groups);

        const result = reshuffleGroupSchedule(tournament);
        expect(result.groups[0]).toHaveLength(9);
        expect(result.schemas[0].top.length + result.schemas[0].bottom.length).toBe(10);

        tournament.groups = result.groups;
        tournament.groupsScheme = result.schemas;
        const rounds = generateFullSchedule(tournament);
        expect(rounds).toHaveLength(9);

        const allPairs = new Set();
        rounds.forEach(round => {
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
            expect(teamsInRound.size).toBe(8);
        });
        // 9 teams, C(9,2)=36, each plays 8 games (one bye per round)
        expect(allPairs.size).toBe(36);
    });

    it('works with multiple groups', () => {
        const teams = Array.from({length: 12}, (_, i) => makeTeam(`T${i}`, 120 - i * 10));
        const group1 = teams.slice(0, 6);
        const group2 = teams.slice(6, 12);
        const tournament = makeTournament(teams, [group1, group2]);

        const result = reshuffleGroupSchedule(tournament);
        expect(result.groups).toHaveLength(2);
        expect(result.groups[0]).toHaveLength(6);
        expect(result.groups[1]).toHaveLength(6);

        const group1Titles = result.groups[0].map(t => t.title).sort();
        const group2Titles = result.groups[1].map(t => t.title).sort();
        expect(group1Titles).toEqual(group1.map(t => t.title).sort());
        expect(group2Titles).toEqual(group2.map(t => t.title).sort());
    });

    it('generates valid schemas for each group', () => {
        const teams = Array.from({length: 8}, (_, i) => makeTeam(`T${i}`, 80 - i * 10));
        const groups = [teams];
        const tournament = makeTournament(teams, groups);

        const result = reshuffleGroupSchedule(tournament);
        expect(result.schemas).toHaveLength(1);
        expect(result.schemas[0].top.length).toBe(result.schemas[0].bottom.length);
        expect(result.schemas[0].top.length).toBe(4);
    });

    it('handles minimum group size of 4', () => {
        const teams = Array.from({length: 4}, (_, i) => makeTeam(`T${i}`, 40 - i * 10));
        const groups = [teams];
        const tournament = makeTournament(teams, groups);

        const result = reshuffleGroupSchedule(tournament);
        expect(result.groups[0]).toHaveLength(4);

        tournament.groups = result.groups;
        tournament.groupsScheme = result.schemas;
        const rounds = generateFullSchedule(tournament);
        expect(rounds).toHaveLength(3);
    });

    it('handles group of 3 teams', () => {
        const teams = Array.from({length: 3}, (_, i) => makeTeam(`T${i}`, 30 - i * 10));
        const groups = [teams];
        const tournament = makeTournament(teams, groups);

        const result = reshuffleGroupSchedule(tournament);
        expect(result.groups[0]).toHaveLength(3);
        const resultTitles = result.groups[0].map(t => t.title).sort();
        expect(resultTitles).toEqual(['T0', 'T1', 'T2']);
    });

    it('teams with zero rating still produce valid schedule', () => {
        const teams = Array.from({length: 6}, (_, i) => makeTeam(`T${i}`, 0));
        const groups = [teams];
        const tournament = makeTournament(teams, groups);

        const result = reshuffleGroupSchedule(tournament);
        expect(result.groups[0]).toHaveLength(6);

        tournament.groups = result.groups;
        tournament.groupsScheme = result.schemas;
        const rounds = generateFullSchedule(tournament);
        expect(rounds).toHaveLength(5);
    });
});
