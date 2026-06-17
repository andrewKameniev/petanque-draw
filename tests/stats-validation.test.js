import { describe, it, expect } from 'vitest';
import { validateScore, validateGameStart, extractPlayers } from '@/helpers-stat';

describe('validateScore', () => {
    describe('max per man by game type', () => {
        it('caps at 3 for tete-a-tete (gameType 1)', () => {
            expect(validateScore(1, [0, 0], 0, 5)).toBe(3);
        });

        it('caps at 6 for doubles (gameType 2)', () => {
            expect(validateScore(2, [0, 0], 0, 8)).toBe(6);
        });

        it('caps at 6 for triples (gameType 3)', () => {
            expect(validateScore(3, [0, 0], 0, 10)).toBe(6);
        });

        it('allows score within max', () => {
            expect(validateScore(1, [0, 0], 0, 2)).toBe(2);
            expect(validateScore(2, [0, 0], 0, 4)).toBe(4);
        });
    });

    describe('no negatives', () => {
        it('clamps negative to 0', () => {
            expect(validateScore(1, [0, 0], 0, -3)).toBe(0);
        });

        it('treats null/undefined as 0', () => {
            expect(validateScore(1, [0, 0], 0, null)).toBe(0);
            expect(validateScore(1, [0, 0], 0, undefined)).toBe(0);
        });
    });

    describe('total never exceeds 13', () => {
        it('caps so total stays at 13', () => {
            // Already have 11 across other mans, can only add 2 more
            expect(validateScore(2, [5, 6, 0], 2, 5)).toBe(2);
        });

        it('returns 0 if already at 13', () => {
            expect(validateScore(2, [6, 6, 1, 0], 3, 3)).toBe(0);
        });

        it('allows full score when total is low', () => {
            expect(validateScore(1, [2, 1, 0], 2, 3)).toBe(3);
        });

        it('does not count current man index in running total', () => {
            // Man 1 already has a value of 5, but we're overwriting it
            expect(validateScore(2, [6, 5, 0], 1, 6)).toBe(6);
        });
    });

    describe('edge cases', () => {
        it('handles empty score array', () => {
            expect(validateScore(1, [], 0, 2)).toBe(2);
        });

        it('handles single man', () => {
            expect(validateScore(1, [0], 0, 3)).toBe(3);
        });

        it('exactly 13 is winning — allows reaching 13', () => {
            expect(validateScore(2, [6, 6, 0], 2, 1)).toBe(1);
        });
    });
});

describe('validateGameStart', () => {
    it('returns false if game name is empty', () => {
        expect(validateGameStart('', [{ name: 'Alice' }])).toBe(false);
    });

    it('returns false if game name is whitespace only', () => {
        expect(validateGameStart('   ', [{ name: 'Alice' }])).toBe(false);
    });

    it('returns false if any player has no name', () => {
        expect(validateGameStart('My Game', [{ name: 'Alice' }, { name: '' }])).toBe(false);
    });

    it('returns false if player name is whitespace only', () => {
        expect(validateGameStart('My Game', [{ name: 'Alice' }, { name: '   ' }])).toBe(false);
    });

    it('returns true when game name and all players have names', () => {
        expect(validateGameStart('My Game', [{ name: 'Alice' }, { name: 'Bob' }])).toBe(true);
    });

    it('returns true for single player', () => {
        expect(validateGameStart('Game', [{ name: 'Solo' }])).toBe(true);
    });

    it('returns false for empty players array', () => {
        expect(validateGameStart('Game', [])).toBe(true);
    });
});

describe('extractPlayers', () => {
    it('returns empty array for null stats', () => {
        expect(extractPlayers(null)).toEqual([]);
    });

    it('returns empty array for empty stats', () => {
        expect(extractPlayers({})).toEqual([]);
    });

    it('extracts unique player names from both teams', () => {
        const stats = {
            1700000000: {
                team1: { players: [{ name: 'Alice' }, { name: 'Bob' }] },
                team2: { players: [{ name: 'Charlie' }, { name: 'Diana' }] },
            },
        };
        expect(extractPlayers(stats)).toEqual(['Alice', 'Bob', 'Charlie', 'Diana']);
    });

    it('deduplicates players across games', () => {
        const stats = {
            1700000000: {
                team1: { players: [{ name: 'Alice' }] },
                team2: { players: [{ name: 'Bob' }] },
            },
            1700000001: {
                team1: { players: [{ name: 'Alice' }] },
                team2: { players: [{ name: 'Charlie' }] },
            },
        };
        expect(extractPlayers(stats)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('trims whitespace from names', () => {
        const stats = {
            1700000000: {
                team1: { players: [{ name: '  Alice  ' }] },
                team2: { players: [{ name: 'Bob ' }] },
            },
        };
        expect(extractPlayers(stats)).toEqual(['Alice', 'Bob']);
    });

    it('skips empty/null player names', () => {
        const stats = {
            1700000000: {
                team1: { players: [{ name: '' }, { name: 'Alice' }] },
                team2: { players: [{ name: null }, { name: 'Bob' }] },
            },
        };
        expect(extractPlayers(stats)).toEqual(['Alice', 'Bob']);
    });

    it('skips null players', () => {
        const stats = {
            1700000000: {
                team1: { players: [null, { name: 'Alice' }] },
                team2: { players: [{ name: 'Bob' }] },
            },
        };
        expect(extractPlayers(stats)).toEqual(['Alice', 'Bob']);
    });

    it('returns sorted names', () => {
        const stats = {
            1700000000: {
                team1: { players: [{ name: 'Zara' }] },
                team2: { players: [{ name: 'Anna' }] },
            },
        };
        expect(extractPlayers(stats)).toEqual(['Anna', 'Zara']);
    });

    it('handles single player per game', () => {
        const stats = {
            1700000000: {
                team1: { players: [{ name: 'Solo' }] },
                team2: { players: [{ name: 'Solo' }] },
            },
        };
        expect(extractPlayers(stats)).toEqual(['Solo']);
    });
});
