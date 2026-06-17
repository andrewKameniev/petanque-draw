import { describe, it, expect } from 'vitest';
import { autoFillScores } from '@/services/testUtils';

function makeGame(team1, team2, score1 = null, score2 = null) {
    return { team_1: team1, team_2: team2, team_1_score: score1, team_2_score: score2 };
}

function makeTournament(overrides = {}) {
    return {
        roundIsActive: true,
        games: [[makeGame('A', 'B'), makeGame('C', 'D')]],
        preferences: { maxScore: 13 },
        ...overrides
    };
}

describe('autoFillScores', () => {
    it('fills scores for all games in active round', () => {
        const t = makeTournament();
        autoFillScores(t, 1);

        t.games[0].forEach(game => {
            expect(game.team_1_score).toBeTypeOf('number');
            expect(game.team_2_score).toBeTypeOf('number');
            expect(game.team_1_score >= 0).toBe(true);
            expect(game.team_2_score >= 0).toBe(true);
        });
    });

    it('one score always equals maxScore', () => {
        const t = makeTournament();
        autoFillScores(t, 1);

        t.games[0].forEach(game => {
            const max = Math.max(game.team_1_score, game.team_2_score);
            expect(max).toBe(13);
        });
    });

    it('respects custom maxScore', () => {
        const t = makeTournament({ preferences: { maxScore: 7 } });
        autoFillScores(t, 1);

        t.games[0].forEach(game => {
            const max = Math.max(game.team_1_score, game.team_2_score);
            expect(max).toBe(7);
            const min = Math.min(game.team_1_score, game.team_2_score);
            expect(min).toBeLessThan(7);
        });
    });

    it('does not overwrite already filled scores', () => {
        const t = makeTournament({
            games: [[makeGame('A', 'B', 13, 5), makeGame('C', 'D')]]
        });
        autoFillScores(t, 1);

        expect(t.games[0][0].team_1_score).toBe(13);
        expect(t.games[0][0].team_2_score).toBe(5);
        expect(t.games[0][1].team_1_score).toBeTypeOf('number');
    });

    it('skips Technical games', () => {
        const t = makeTournament({
            games: [[makeGame('A', 'Technical'), makeGame('C', 'D')]]
        });
        autoFillScores(t, 1);

        expect(t.games[0][0].team_1_score).toBeNull();
        expect(t.games[0][0].team_2_score).toBeNull();
        expect(t.games[0][1].team_1_score).toBeTypeOf('number');
    });

    it('skips bye games', () => {
        const t = makeTournament({
            games: [[{ ...makeGame('A', 'B'), isBye: true }, makeGame('C', 'D')]]
        });
        autoFillScores(t, 1);

        expect(t.games[0][0].team_1_score).toBeNull();
        expect(t.games[0][1].team_1_score).toBeTypeOf('number');
    });

    it('does nothing when round is not active', () => {
        const t = makeTournament({ roundIsActive: false });
        autoFillScores(t, 1);

        t.games[0].forEach(game => {
            expect(game.team_1_score).toBeNull();
        });
    });

    it('fills cadrage games', () => {
        const t = makeTournament({
            roundIsActive: false,
            cadrage: [makeGame('A', 'B'), makeGame('C', 'D')],
            playOff: null
        });
        autoFillScores(t, 1);

        t.cadrage.forEach(game => {
            expect(game.team_1_score).toBeTypeOf('number');
            expect(game.team_2_score).toBeTypeOf('number');
        });
    });

    it('fills playoff bracket stages', () => {
        const t = makeTournament({
            roundIsActive: false,
            playOff: [{}],
            playOffBracket: {
                stages: [
                    { stageLabel: 'Semi', teams: [makeGame('A', 'B'), makeGame('C', 'D')] }
                ],
                thirdPlace: null
            },
            playOffStage: 'Semi'
        });
        autoFillScores(t, 1);

        t.playOffBracket.stages[0].teams.forEach(game => {
            expect(game.team_1_score).toBeTypeOf('number');
        });
    });

    it('fills third place match', () => {
        const t = makeTournament({
            roundIsActive: false,
            playOff: [{}],
            playOffBracket: {
                stages: [
                    { stageLabel: 'Final', teams: [makeGame('A', 'B', 13, 10)] }
                ],
                thirdPlace: makeGame('C', 'D')
            },
            playOffStage: 'Final'
        });
        autoFillScores(t, 1);

        expect(t.playOffBracket.thirdPlace.team_1_score).toBeTypeOf('number');
        expect(t.playOffBracket.thirdPlace.team_2_score).toBeTypeOf('number');
    });

    it('handles multi-round correctly (fills only active round)', () => {
        const t = makeTournament({
            games: [
                [makeGame('A', 'B', 13, 5)],
                [makeGame('C', 'D')]
            ]
        });
        autoFillScores(t, 2);

        expect(t.games[0][0].team_1_score).toBe(13);
        expect(t.games[1][0].team_1_score).toBeTypeOf('number');
    });
});
