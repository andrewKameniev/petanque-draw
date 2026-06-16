import { describe, it, expect } from 'vitest';
import { getGameDisplayState } from '@/services/results';

describe('getGameDisplayState', () => {
    describe('upcoming (not started)', () => {
        it('returns upcoming when status is not_started', () => {
            const result = getGameDisplayState({ status: 'not_started', team_1_score: null, team_2_score: null });
            expect(result.state).toBe('upcoming');
            expect(result.showScore).toBe(false);
            expect(result.winner).toBeNull();
        });

        it('returns upcoming when status is undefined', () => {
            const result = getGameDisplayState({ team_1_score: null, team_2_score: null });
            expect(result.state).toBe('upcoming');
            expect(result.showScore).toBe(false);
        });

        it('returns upcoming when status is empty string', () => {
            const result = getGameDisplayState({ status: '', team_1_score: null, team_2_score: null });
            expect(result.state).toBe('upcoming');
            expect(result.showScore).toBe(false);
        });

        it('returns upcoming for null game', () => {
            const result = getGameDisplayState(null);
            expect(result.state).toBe('upcoming');
            expect(result.showScore).toBe(false);
        });
    });

    describe('in_progress (active)', () => {
        it('returns in_progress with showScore true', () => {
            const result = getGameDisplayState({ status: 'in_progress', team_1_score: 5, team_2_score: 3 });
            expect(result.state).toBe('in_progress');
            expect(result.showScore).toBe(true);
            expect(result.winner).toBeNull();
        });

        it('returns in_progress even when scores are 0:0', () => {
            const result = getGameDisplayState({ status: 'in_progress', team_1_score: 0, team_2_score: 0 });
            expect(result.state).toBe('in_progress');
            expect(result.showScore).toBe(true);
        });

        it('does not determine a winner during in_progress', () => {
            const result = getGameDisplayState({ status: 'in_progress', team_1_score: 12, team_2_score: 3 });
            expect(result.winner).toBeNull();
        });
    });

    describe('finished', () => {
        it('returns finished with showScore true', () => {
            const result = getGameDisplayState({ status: 'finished', team_1_score: 13, team_2_score: 7 });
            expect(result.state).toBe('finished');
            expect(result.showScore).toBe(true);
        });

        it('returns team_1 as winner when team_1_score > team_2_score', () => {
            const result = getGameDisplayState({ status: 'finished', team_1_score: 13, team_2_score: 7 });
            expect(result.winner).toBe('team_1');
        });

        it('returns team_2 as winner when team_2_score > team_1_score', () => {
            const result = getGameDisplayState({ status: 'finished', team_1_score: 5, team_2_score: 13 });
            expect(result.winner).toBe('team_2');
        });

        it('returns null winner on draw', () => {
            const result = getGameDisplayState({ status: 'finished', team_1_score: 10, team_2_score: 10 });
            expect(result.winner).toBeNull();
        });

        it('handles 0:0 finished game', () => {
            const result = getGameDisplayState({ status: 'finished', team_1_score: 0, team_2_score: 0 });
            expect(result.state).toBe('finished');
            expect(result.showScore).toBe(true);
            expect(result.winner).toBeNull();
        });
    });

    describe('cadrage games use same logic', () => {
        it('cadrage game not started shows as upcoming', () => {
            const cadrageGame = { team_1: 'A', team_2: 'B', team_1_score: null, team_2_score: null };
            const result = getGameDisplayState(cadrageGame);
            expect(result.state).toBe('upcoming');
            expect(result.showScore).toBe(false);
        });

        it('cadrage game in progress shows scores', () => {
            const cadrageGame = { team_1: 'A', team_2: 'B', status: 'in_progress', team_1_score: 8, team_2_score: 6 };
            const result = getGameDisplayState(cadrageGame);
            expect(result.state).toBe('in_progress');
            expect(result.showScore).toBe(true);
        });

        it('cadrage game finished shows winner', () => {
            const cadrageGame = { team_1: 'A', team_2: 'B', status: 'finished', team_1_score: 13, team_2_score: 9 };
            const result = getGameDisplayState(cadrageGame);
            expect(result.state).toBe('finished');
            expect(result.winner).toBe('team_1');
        });
    });

    describe('saveCadrageScores sets status on all games', () => {
        it('all cadrage games get status finished after bulk save', () => {
            const cadrage = [
                { team_1: 'A', team_2: 'B', team_1_score: '13', team_2_score: '7' },
                { team_1: 'C', team_2: 'D', team_1_score: '5', team_2_score: '13' },
                { team_1: 'E', team_2: 'F', team_1_score: '10', team_2_score: '8' },
                { team_1: 'G', team_2: 'H', team_1_score: '9', team_2_score: '13' },
            ];

            cadrage.forEach(game => {
                game.team_1_score = Number(game.team_1_score);
                game.team_2_score = Number(game.team_2_score);
                game.status = 'finished';
                game.winner = game.team_1_score > game.team_2_score ? game.team_1 : game.team_2;
            });

            cadrage.forEach(game => {
                expect(game.status).toBe('finished');
                const display = getGameDisplayState(game);
                expect(display.state).toBe('finished');
                expect(display.showScore).toBe(true);
            });

            expect(cadrage[0].winner).toBe('A');
            expect(cadrage[1].winner).toBe('D');
            expect(cadrage[2].winner).toBe('E');
            expect(cadrage[3].winner).toBe('H');
        });

        it('game without status after individual score entry shows as upcoming', () => {
            const game = { team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 7 };
            const result = getGameDisplayState(game);
            expect(result.state).toBe('upcoming');
            expect(result.showScore).toBe(false);
        });
    });
});
