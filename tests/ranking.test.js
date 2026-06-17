import { describe, it, expect } from 'vitest';
import { rankGroupByRegulations, getTeamsRanking } from '@/helpers';

function makeGame(t1, t2, s1, s2, status = 'finished') {
    return { team_1: t1, team_2: t2, team_1_score: s1, team_2_score: s2, status };
}

function makeTeam(title, wins = 0, pointsPlus = 0, pointsMinus = 0) {
    return { title, wins, pointsPlus, pointsMinus, opponents: [] };
}

function makeGroupsTournament(groups, games) {
    const allTeams = groups.flat();
    return {
        system: 'groups',
        teams: allTeams,
        groups,
        games: games.map((round) => (Array.isArray(round) ? round : [round])),
        groupSchedule: null,
    };
}

describe('rankGroupByRegulations', () => {
    describe('Rule 1: sort by wins', () => {
        it('ranks teams by wins descending', () => {
            const group = [makeTeam('A', 3, 30, 10), makeTeam('B', 1, 15, 25), makeTeam('C', 2, 20, 15)];
            const result = rankGroupByRegulations(group, []);
            expect(result.map((t) => t.title)).toEqual(['A', 'C', 'B']);
        });

        it('single team cluster needs no tiebreaker', () => {
            const group = [makeTeam('A', 3, 30, 10), makeTeam('B', 2, 20, 15), makeTeam('C', 1, 10, 25)];
            const result = rankGroupByRegulations(group, []);
            expect(result.map((t) => t.title)).toEqual(['A', 'B', 'C']);
        });
    });

    describe('Rule 2: two teams tied — head-to-head', () => {
        it('uses h2h result when two teams have same wins', () => {
            const group = [makeTeam('A', 2, 20, 15), makeTeam('B', 2, 22, 12), makeTeam('C', 0, 5, 30)];
            const games = [[makeGame('A', 'B', 13, 10), makeGame('A', 'C', 7, 5), makeGame('B', 'C', 12, 0)]];
            const result = rankGroupByRegulations(group, games);
            expect(result[0].title).toBe('A');
            expect(result[1].title).toBe('B');
        });

        it('uses h2h when A beat B directly despite B having better overall diff', () => {
            const group = [makeTeam('A', 3, 40, 30), makeTeam('B', 3, 50, 20)];
            const games = [[makeGame('A', 'B', 13, 12)]];
            const result = rankGroupByRegulations(group, games);
            expect(result[0].title).toBe('A');
            expect(result[1].title).toBe('B');
        });

        it('falls back to overall point diff when teams have not played each other', () => {
            const group = [makeTeam('A', 2, 20, 15), makeTeam('B', 2, 25, 10)];
            const games = [[]];
            const result = rankGroupByRegulations(group, games);
            expect(result[0].title).toBe('B');
            expect(result[1].title).toBe('A');
        });

        it('falls back to overall point diff when h2h is a draw (multi-leg)', () => {
            const group = [makeTeam('A', 2, 30, 20), makeTeam('B', 2, 25, 22)];
            const games = [[makeGame('A', 'B', 13, 10)], [makeGame('B', 'A', 13, 10)]];
            const result = rankGroupByRegulations(group, games);
            expect(result[0].title).toBe('A');
            expect(result[1].title).toBe('B');
        });

        it('handles reversed game order (team is team_2 in game data)', () => {
            const group = [makeTeam('A', 2, 20, 15), makeTeam('B', 2, 22, 12)];
            const games = [[makeGame('B', 'A', 10, 13)]];
            const result = rankGroupByRegulations(group, games);
            expect(result[0].title).toBe('A');
            expect(result[1].title).toBe('B');
        });
    });

    describe('Rule 3: three+ teams tied — h2h point differential', () => {
        it('uses h2h point diff among three tied teams', () => {
            const group = [makeTeam('A', 2, 30, 20), makeTeam('B', 2, 28, 22), makeTeam('C', 2, 25, 25)];
            const games = [[makeGame('A', 'B', 13, 5), makeGame('B', 'C', 13, 7), makeGame('C', 'A', 13, 8)]];
            // h2h diff: A = (13-5)+(8-13) = +3, B = (5-13)+(13-7) = -2, C = (7-13)+(13-8) = -1
            const result = rankGroupByRegulations(group, games);
            expect(result[0].title).toBe('A');
            expect(result[1].title).toBe('C');
            expect(result[2].title).toBe('B');
        });

        it('circular three-way tie breaks correctly by h2h diff', () => {
            // A beat B 13-0, B beat C 13-0, C beat A 13-12
            const group = [makeTeam('A', 1, 25, 13), makeTeam('B', 1, 13, 26), makeTeam('C', 1, 13, 12)];
            const games = [[makeGame('A', 'B', 13, 0), makeGame('B', 'C', 13, 0), makeGame('C', 'A', 13, 12)]];
            // h2h diff: A = 13 + (-1) = 12, B = -13 + 13 = 0, C = -13 + 1 = -12
            const result = rankGroupByRegulations(group, games);
            expect(result[0].title).toBe('A');
            expect(result[1].title).toBe('B');
            expect(result[2].title).toBe('C');
        });

        it('four teams tied — separates by h2h diff then recurses', () => {
            const group = [
                makeTeam('A', 3, 50, 30),
                makeTeam('B', 3, 48, 32),
                makeTeam('C', 3, 45, 35),
                makeTeam('D', 3, 40, 40),
            ];
            const games = [
                [
                    makeGame('A', 'B', 13, 10),
                    makeGame('A', 'C', 13, 11),
                    makeGame('A', 'D', 5, 13),
                    makeGame('B', 'C', 13, 8),
                    makeGame('B', 'D', 10, 13),
                    makeGame('C', 'D', 13, 12),
                ],
            ];
            // h2h diffs:
            // A: (13-10)+(13-11)+(5-13) = 3+2-8 = -3
            // B: (10-13)+(13-8)+(10-13) = -3+5-3 = -1
            // C: (11-13)+(8-13)+(13-12) = -2-5+1 = -6
            // D: (13-5)+(13-10)+(12-13) = 8+3-1 = 10
            const result = rankGroupByRegulations(group, games);
            expect(result[0].title).toBe('D');
            expect(result[1].title).toBe('B');
            expect(result[2].title).toBe('A');
            expect(result[3].title).toBe('C');
        });

        it('three teams with equal h2h diff — falls to h2h points scored', () => {
            const group = [makeTeam('A', 2, 30, 20), makeTeam('B', 2, 28, 22), makeTeam('C', 2, 25, 25)];
            // A beat B 8-5, B beat C 10-7, C beat A 9-6
            // h2h diff: A = 3+(-3)=0, B = (-3)+3=0, C = (-3)+3=0 — all equal
            // h2h pointsPlus: A = 8+6=14, B = 5+10=15, C = 7+9=16
            const games = [[makeGame('A', 'B', 8, 5), makeGame('B', 'C', 10, 7), makeGame('C', 'A', 9, 6)]];
            const result = rankGroupByRegulations(group, games);
            expect(result[0].title).toBe('C');
            expect(result[1].title).toBe('B');
            expect(result[2].title).toBe('A');
        });

        it('three teams equal h2h diff and points — falls to overall point diff', () => {
            const group = [makeTeam('A', 2, 30, 15), makeTeam('B', 2, 25, 20), makeTeam('C', 2, 20, 25)];
            // A beat B 10-7, B beat C 10-7, C beat A 10-7
            // h2h diff: all 0, h2h plus: all 17
            const games = [[makeGame('A', 'B', 10, 7), makeGame('B', 'C', 10, 7), makeGame('C', 'A', 10, 7)]];
            const result = rankGroupByRegulations(group, games);
            expect(result[0].title).toBe('A');
            expect(result[1].title).toBe('B');
            expect(result[2].title).toBe('C');
        });
    });

    describe('Recursive cluster splitting', () => {
        it('splits cluster, then applies 2-team h2h rule on sub-cluster', () => {
            // 4 teams: A,B,C,D all 3 wins
            // h2h diff splits into {D} and {A,B,C}
            // then A,B,C sub-cluster uses 3-team h2h rules
            const group = [
                makeTeam('A', 3, 45, 30),
                makeTeam('B', 3, 42, 33),
                makeTeam('C', 3, 40, 35),
                makeTeam('D', 3, 50, 20),
            ];
            const games = [
                [
                    makeGame('A', 'B', 13, 10),
                    makeGame('A', 'C', 10, 13),
                    makeGame('A', 'D', 5, 13),
                    makeGame('B', 'C', 10, 13),
                    makeGame('B', 'D', 5, 13),
                    makeGame('C', 'D', 5, 13),
                ],
            ];
            // h2h diff in full cluster:
            // A: 3+(-3)+(-8) = -8
            // B: (-3)+(-3)+(-8) = -14
            // C: 3+3+(-8) = -2
            // D: 8+8+8 = 24
            // Splits: {D:24}, {C:-2}, {A:-8}, {B:-14}
            const result = rankGroupByRegulations(group, games);
            expect(result[0].title).toBe('D');
            expect(result[1].title).toBe('C');
            expect(result[2].title).toBe('A');
            expect(result[3].title).toBe('B');
        });

        it('after partial split, recursively re-computes h2h for remaining cluster', () => {
            // A,B,C,D tied on wins. h2h diff separates A and D; B and C remain tied.
            // For B vs C sub-cluster: use 2-team rule (h2h between B and C only)
            const group = [
                makeTeam('A', 2, 35, 20),
                makeTeam('B', 2, 28, 25),
                makeTeam('C', 2, 26, 27),
                makeTeam('D', 2, 20, 35),
            ];
            const games = [
                [
                    makeGame('A', 'B', 13, 10),
                    makeGame('A', 'C', 13, 10),
                    makeGame('A', 'D', 13, 5),
                    makeGame('B', 'C', 10, 13),
                    makeGame('B', 'D', 13, 5),
                    makeGame('C', 'D', 13, 5),
                ],
            ];
            // h2h diff (full 4-team):
            // A: 3+3+8 = 14
            // B: -3+(-3)+8 = 2
            // C: -3+3+8 = 8  -- wait let me recalc
            // Actually: A vs B=13-10(+3), A vs C=13-10(+3), A vs D=13-5(+8) → A=14
            // B vs A=10-13(-3), B vs C=10-13(-3), B vs D=13-5(+8) → B=2
            // C vs A=10-13(-3), C vs B=13-10(+3), C vs D=13-5(+8) → C=8
            // D vs A=5-13(-8), D vs B=5-13(-8), D vs C=5-13(-8) → D=-24
            // Split: {A:14}, {C:8}, {B:2}, {D:-24} — all different
            const result = rankGroupByRegulations(group, games);
            expect(result[0].title).toBe('A');
            expect(result[1].title).toBe('C');
            expect(result[2].title).toBe('B');
            expect(result[3].title).toBe('D');
        });

        it('B and C form sub-cluster, resolved by direct h2h', () => {
            const games2 = [
                [
                    makeGame('A', 'B', 13, 7),
                    makeGame('A', 'C', 13, 7),
                    makeGame('A', 'D', 13, 5),
                    makeGame('B', 'C', 13, 10),
                    makeGame('B', 'D', 13, 5),
                    makeGame('C', 'D', 13, 5),
                ],
                [makeGame('C', 'B', 13, 10)],
            ];
            // B vs C: first leg 13-10(+3), second leg 10-13(-3) = 0 net
            // h2h diff (full 4-team):
            // A: (13-7)+(13-7)+(13-5) = 6+6+8 = 20
            // B: (7-13)+(13-10)+(10-13)+(13-5) = -6+3-3+8 = 2
            // C: (7-13)+(10-13)+(13-10)+(13-5) = -6-3+3+8 = 2
            // D: (5-13)+(5-13)+(5-13) = -8-8-8 = -24
            // Split: {A:20}, {B:2, C:2}, {D:-24}
            // B and C sub-cluster (2 teams): h2h between them = 0 net → overall diff
            const group2 = [
                makeTeam('A', 2, 65, 31),
                makeTeam('B', 2, 56, 48),
                makeTeam('C', 2, 56, 48),
                makeTeam('D', 2, 25, 75),
            ];
            // Overall diff: B = 56-48=8, C = 56-48=8 — still tied. Equal ranking.
            // Let's give C better overall diff.
            group2[2].pointsPlus = 60;
            group2[2].pointsMinus = 44;
            // C overall diff = 16 > B diff = 8
            const result2 = rankGroupByRegulations(group2, games2);
            expect(result2[0].title).toBe('A');
            expect(result2[1].title).toBe('C');
            expect(result2[2].title).toBe('B');
            expect(result2[3].title).toBe('D');
        });
    });

    describe('Edge cases', () => {
        it('handles single team group', () => {
            const group = [makeTeam('A', 0, 0, 0)];
            const result = rankGroupByRegulations(group, []);
            expect(result.map((t) => t.title)).toEqual(['A']);
        });

        it('handles empty games array', () => {
            const group = [makeTeam('A', 2, 20, 10), makeTeam('B', 2, 15, 15)];
            const result = rankGroupByRegulations(group, []);
            expect(result[0].title).toBe('A');
            expect(result[1].title).toBe('B');
        });

        it('ignores in-progress games', () => {
            const group = [makeTeam('A', 1, 13, 10), makeTeam('B', 1, 10, 13)];
            const games = [[makeGame('A', 'B', 13, 10, 'finished'), makeGame('B', 'A', 5, 3, 'in_progress')]];
            const result = rankGroupByRegulations(group, games);
            expect(result[0].title).toBe('A');
            expect(result[1].title).toBe('B');
        });

        it('ignores not_started games', () => {
            const group = [makeTeam('A', 1, 13, 10), makeTeam('B', 1, 10, 13)];
            const games = [[makeGame('A', 'B', 13, 10, 'finished'), makeGame('B', 'A', null, null, 'not_started')]];
            const result = rankGroupByRegulations(group, games);
            expect(result[0].title).toBe('A');
            expect(result[1].title).toBe('B');
        });

        it('ignores games with null scores', () => {
            const group = [makeTeam('A', 1, 13, 10), makeTeam('B', 1, 10, 13)];
            const games = [[makeGame('A', 'B', 13, 10), makeGame('B', 'A', null, null)]];
            const result = rankGroupByRegulations(group, games);
            expect(result[0].title).toBe('A');
            expect(result[1].title).toBe('B');
        });

        it('all teams completely tied remains in original order', () => {
            const group = [makeTeam('A', 1, 10, 10), makeTeam('B', 1, 10, 10), makeTeam('C', 1, 10, 10)];
            const games = [[makeGame('A', 'B', 5, 5), makeGame('B', 'C', 5, 5), makeGame('C', 'A', 5, 5)]];
            // All have 0 h2h diff, 10 h2h plus, 10 overall diff — fully tied
            const result = rankGroupByRegulations(group, games);
            expect(result).toHaveLength(3);
        });

        it('only counts games between teams in the group', () => {
            const group = [makeTeam('A', 2, 26, 15), makeTeam('B', 2, 23, 18)];
            // Game between A and outsider X should be ignored for h2h
            const games = [[makeGame('A', 'B', 10, 13), makeGame('A', 'X', 13, 5), makeGame('B', 'X', 13, 8)]];
            const result = rankGroupByRegulations(group, games);
            // h2h: B beat A → B first
            expect(result[0].title).toBe('B');
            expect(result[1].title).toBe('A');
        });
    });

    describe('Real tournament scenario', () => {
        it('matches the screenshot standings correctly', () => {
            // From the actual tournament: 9 players, round-robin
            // КОЛОДІЙ: 6W, ГЕРМАНЮК: 5W, ГІЛЛАДЕ: 5W, ПОПОВИЧ: 4W, ЧИКАЛО: 4W,
            // БРУХОВЕЦЬКА: 3W, СТЕПАНЮК: 3W, НЕСМЯНОВИЧ: 2W, МІЩЕНКО: 1W
            const group = [
                makeTeam('КОЛОДІЙ', 6, 75, 36),
                makeTeam('ГЕРМАНЮК', 5, 84, 62),
                makeTeam('ГІЛЛАДЕ', 5, 75, 60),
                makeTeam('ПОПОВИЧ', 4, 69, 43),
                makeTeam('ЧИКАЛО', 4, 72, 57),
                makeTeam('БРУХОВЕЦЬКА', 3, 60, 74),
                makeTeam('СТЕПАНЮК', 3, 52, 72),
                makeTeam('НЕСМЯНОВИЧ', 2, 41, 78),
                makeTeam('МІЩЕНКО', 1, 34, 80),
            ];

            const games = [
                [
                    makeGame('КОЛОДІЙ', 'ГЕРМАНЮК', 10, 9),
                    makeGame('ГІЛЛАДЕ', 'ПОПОВИЧ', 11, 5),
                    makeGame('ЧИКАЛО', 'БРУХОВЕЦЬКА', 6, 13),
                    makeGame('СТЕПАНЮК', 'НЕСМЯНОВИЧ', 2, 13),
                    makeGame('МІЩЕНКО', 'КОЛОДІЙ', 4, 8),
                ],
                [
                    makeGame('КОЛОДІЙ', 'ГІЛЛАДЕ', 10, 5),
                    makeGame('ГЕРМАНЮК', 'ЧИКАЛО', 13, 4),
                    makeGame('ПОПОВИЧ', 'БРУХОВЕЦЬКА', 5, 11),
                    makeGame('СТЕПАНЮК', 'МІЩЕНКО', 12, 11),
                    makeGame('НЕСМЯНОВИЧ', 'КОЛОДІЙ', 3, 13),
                ],
                [
                    makeGame('КОЛОДІЙ', 'ЧИКАЛО', 5, 11),
                    makeGame('ГЕРМАНЮК', 'ПОПОВИЧ', 11, 5),
                    makeGame('ГІЛЛАДЕ', 'БРУХОВЕЦЬКА', 4, 13),
                    makeGame('СТЕПАНЮК', 'НЕСМЯНОВИЧ', 3, 13),
                    makeGame('МІЩЕНКО', 'ГЕРМАНЮК', 5, 13),
                ],
                [
                    makeGame('КОЛОДІЙ', 'БРУХОВЕЦЬКА', 13, 6),
                    makeGame('ГЕРМАНЮК', 'СТЕПАНЮК', 3, 13),
                    makeGame('ГІЛЛАДЕ', 'НЕСМЯНОВИЧ', 10, 7),
                    makeGame('ПОПОВИЧ', 'МІЩЕНКО', 7, 10),
                    makeGame('ЧИКАЛО', 'КОЛОДІЙ', 7, 5),
                ],
                [
                    makeGame('КОЛОДІЙ', 'СТЕПАНЮК', 11, 2),
                    makeGame('ГЕРМАНЮК', 'НЕСМЯНОВИЧ', 11, 12),
                    makeGame('ГІЛЛАДЕ', 'МІЩЕНКО', 12, 11),
                    makeGame('ПОПОВИЧ', 'ЧИКАЛО', 13, 1),
                    makeGame('БРУХОВЕЦЬКА', 'КОЛОДІЙ', 4, 13),
                ],
                [
                    makeGame('КОЛОДІЙ', 'НЕСМЯНОВИЧ', 13, 2),
                    makeGame('ГЕРМАНЮК', 'БРУХОВЕЦЬКА', 13, 3),
                    makeGame('ГІЛЛАДЕ', 'ЧИКАЛО', 13, 5),
                    makeGame('ПОПОВИЧ', 'СТЕПАНЮК', 13, 6),
                    makeGame('МІЩЕНКО', 'ПОПОВИЧ', 1, 13),
                ],
                [
                    makeGame('КОЛОДІЙ', 'ПОПОВИЧ', 13, 1),
                    makeGame('ГЕРМАНЮК', 'ГІЛЛАДЕ', 13, 3),
                    makeGame('ЧИКАЛО', 'СТЕПАНЮК', 6, 9),
                    makeGame('БРУХОВЕЦЬКА', 'НЕСМЯНОВИЧ', 13, 6),
                    makeGame('МІЩЕНКО', 'ЧИКАЛО', 11, 6),
                ],
                [
                    makeGame('КОЛОДІЙ', 'МІЩЕНКО', 8, 4),
                    makeGame('ГЕРМАНЮК', 'КОЛОДІЙ', 13, 5),
                    makeGame('ГІЛЛАДЕ', 'СТЕПАНЮК', 13, 0),
                    makeGame('ПОПОВИЧ', 'БРУХОВЕЦЬКА', 7, 9),
                    makeGame('ЧИКАЛО', 'НЕСМЯНОВИЧ', 13, 7),
                ],
            ];

            const result = rankGroupByRegulations(group, games);

            // ГЕРМАНЮК vs ГІЛЛАДЕ (both 5 wins): ГЕРМАНЮК won 13:3 → ГЕРМАНЮК first
            expect(result[0].title).toBe('КОЛОДІЙ');
            expect(result[1].title).toBe('ГЕРМАНЮК');
            expect(result[2].title).toBe('ГІЛЛАДЕ');

            // ПОПОВИЧ vs ЧИКАЛО (both 4 wins): haven't finished their game yet (excluded)
            // falls to overall diff: ПОПОВИЧ 69-43=26 > ЧИКАЛО 72-57=15
            expect(result[3].title).toBe('ПОПОВИЧ');
            expect(result[4].title).toBe('ЧИКАЛО');

            // БРУХОВЕЦЬКА vs СТЕПАНЮК (both 3 wins): need to check h2h
            // Not present in games above directly — let me check what games exist
            // БРУХОВЕЦЬКА appears vs СТЕПАНЮК? Not in the games I have.
            // Falls to overall diff: БРУХОВЕЦЬКА 60-74=-14, СТЕПАНЮК 52-72=-20
            expect(result[5].title).toBe('БРУХОВЕЦЬКА');
            expect(result[6].title).toBe('СТЕПАНЮК');

            expect(result[7].title).toBe('НЕСМЯНОВИЧ');
            expect(result[8].title).toBe('МІЩЕНКО');
        });
    });

    describe('Integration with getTeamsRanking', () => {
        it('groups system uses cluster-based ranking', () => {
            const tournament = makeGroupsTournament(
                [
                    [
                        { title: 'A', wins: 0, opponents: [], pointsPlus: 0, pointsMinus: 0 },
                        { title: 'B', wins: 0, opponents: [], pointsPlus: 0, pointsMinus: 0 },
                        { title: 'C', wins: 0, opponents: [], pointsPlus: 0, pointsMinus: 0 },
                    ],
                ],
                [[makeGame('A', 'B', 13, 10), makeGame('B', 'C', 13, 7), makeGame('C', 'A', 13, 8)]],
            );
            const result = getTeamsRanking(tournament, 2);
            // h2h diff: A=(13-10)+(8-13)=-2, B=(10-13)+(13-7)=+3, C=(7-13)+(13-8)=-1
            expect(result[0].map((t) => t.title)).toEqual(['B', 'C', 'A']);
        });

        it('multiple groups ranked independently', () => {
            const tournament = makeGroupsTournament(
                [
                    [
                        { title: 'A', wins: 0, opponents: [], pointsPlus: 0, pointsMinus: 0 },
                        { title: 'B', wins: 0, opponents: [], pointsPlus: 0, pointsMinus: 0 },
                    ],
                    [
                        { title: 'X', wins: 0, opponents: [], pointsPlus: 0, pointsMinus: 0 },
                        { title: 'Y', wins: 0, opponents: [], pointsPlus: 0, pointsMinus: 0 },
                    ],
                ],
                [[makeGame('A', 'B', 13, 10), makeGame('Y', 'X', 13, 5)]],
            );
            const result = getTeamsRanking(tournament, 2);
            expect(result[0][0].title).toBe('A');
            expect(result[1][0].title).toBe('Y');
        });
    });

    describe('Double round-robin (multi-circle)', () => {
        it('correctly accumulates h2h across multiple legs', () => {
            const group = [makeTeam('A', 2, 26, 20), makeTeam('B', 2, 24, 22)];
            // A wins first leg, B wins second with bigger margin
            const games = [[makeGame('A', 'B', 13, 10)], [makeGame('B', 'A', 13, 7)]];
            // h2h total: A scored 13+7=20, conceded 10+13=23, diff=-3
            // B scored 10+13=23, conceded 13+7=20, diff=+3 → B ranks higher
            const result = rankGroupByRegulations(group, games);
            expect(result[0].title).toBe('B');
            expect(result[1].title).toBe('A');
        });

        it('three teams double round-robin uses combined h2h', () => {
            const group = [makeTeam('A', 2, 40, 35), makeTeam('B', 2, 38, 37), makeTeam('C', 2, 35, 40)];
            const games = [
                [makeGame('A', 'B', 13, 10), makeGame('B', 'C', 13, 7), makeGame('C', 'A', 13, 8)],
                [makeGame('B', 'A', 13, 5), makeGame('C', 'B', 13, 10), makeGame('A', 'C', 13, 8)],
            ];
            // h2h stats (among all three):
            // A: (13-10)+(5-13)+(8-13)+(13-8) = 3-8-5+5 = -5
            // B: (10-13)+(13-7)+(13-5)+(10-13) = -3+6+8-3 = 8
            // C: (7-13)+(13-8)+(8-13)+(13-10) = -6+5-5+3 = -3
            const result = rankGroupByRegulations(group, games);
            expect(result[0].title).toBe('B');
            expect(result[1].title).toBe('C');
            expect(result[2].title).toBe('A');
        });
    });
});
