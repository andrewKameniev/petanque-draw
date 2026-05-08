import { describe, it, expect } from 'vitest';
import { sortTeams, countBuhgolts, gameHasError, isScoreError, shuffleArray } from '@/helpers';

function makeTeam(title, wins = 0, opponents = [], pointsPlus = 0, pointsMinus = 0, rating = 0) {
    return { title, wins, opponents, pointsPlus, pointsMinus, rating, buhgolts: 0, smallBuhgolts: 0 };
}

describe('sortTeams', () => {
    it('sorts by wins descending', () => {
        const teams = [
            makeTeam('A', 1),
            makeTeam('B', 3),
            makeTeam('C', 2),
        ];
        const sorted = sortTeams(teams);
        expect(sorted[0].title).toBe('B');
        expect(sorted[1].title).toBe('C');
        expect(sorted[2].title).toBe('A');
    });

    it('breaks ties by buchholz', () => {
        const teams = [
            makeTeam('A', 2, ['B']),
            makeTeam('B', 1, ['A']),
            makeTeam('C', 2, ['B']),
        ];
        const sorted = sortTeams(teams);
        expect(sorted[0].wins).toBe(2);
        expect(sorted[1].wins).toBe(2);
        expect(sorted[2].wins).toBe(1);
    });

    it('breaks ties by point difference', () => {
        const teams = [
            makeTeam('A', 2, [], 10, 5),
            makeTeam('B', 2, [], 13, 3),
            makeTeam('C', 2, [], 8, 8),
        ];
        const sorted = sortTeams(teams);
        expect(sorted[0].title).toBe('B');
        expect(sorted[1].title).toBe('A');
        expect(sorted[2].title).toBe('C');
    });

    it('breaks ties by pointsPlus when difference is equal', () => {
        const teams = [
            makeTeam('A', 2, [], 10, 5),
            makeTeam('B', 2, [], 12, 7),
        ];
        const sorted = sortTeams(teams);
        expect(sorted[0].title).toBe('B');
        expect(sorted[1].title).toBe('A');
    });

    it('breaks ties by rating as last resort', () => {
        const teams = [
            makeTeam('A', 2, [], 10, 5, 100),
            makeTeam('B', 2, [], 10, 5, 200),
        ];
        const sorted = sortTeams(teams);
        expect(sorted[0].title).toBe('B');
        expect(sorted[1].title).toBe('A');
    });
});

describe('countBuhgolts', () => {
    it('calculates buchholz as sum of opponents wins', () => {
        const teams = [
            makeTeam('A', 3, ['B', 'C']),
            makeTeam('B', 2, ['A']),
            makeTeam('C', 1, ['A']),
        ];
        const result = countBuhgolts(teams, 'buhgolts');
        expect(result.find(t => t.title === 'A').buhgolts).toBe(3); // B(2) + C(1)
        expect(result.find(t => t.title === 'B').buhgolts).toBe(3); // A(3)
        expect(result.find(t => t.title === 'C').buhgolts).toBe(3); // A(3)
    });

    it('handles placeholder opponents', () => {
        const teams = [
            makeTeam('A', 2, ['placeholder']),
            makeTeam('B', 1, ['A']),
        ];
        const result = countBuhgolts(teams, 'buhgolts');
        expect(result.find(t => t.title === 'A').buhgolts).toBe(0);
    });

    it('calculates smallBuhgolts as sum of opponents buchholz', () => {
        const teams = [
            makeTeam('A', 3, ['B', 'C']),
            makeTeam('B', 2, ['A', 'C']),
            makeTeam('C', 1, ['A', 'B']),
        ];
        countBuhgolts(teams, 'buhgolts');
        countBuhgolts(teams, 'smallBuhgolts');
        expect(teams.find(t => t.title === 'A').smallBuhgolts).toBe(
            teams.find(t => t.title === 'B').buhgolts + teams.find(t => t.title === 'C').buhgolts
        );
    });
});

describe('gameHasError', () => {
    it('returns truthy for equal scores', () => {
        expect(gameHasError({ team_1_score: 5, team_2_score: 5 }, 13)).toBeTruthy();
    });

    it('returns truthy for negative scores', () => {
        expect(gameHasError({ team_1_score: -1, team_2_score: 5 }, 13)).toBeTruthy();
    });

    it('returns truthy for scores exceeding max', () => {
        expect(gameHasError({ team_1_score: 14, team_2_score: 5 }, 13)).toBeTruthy();
        expect(gameHasError({ team_1_score: 5, team_2_score: 14 }, 13)).toBeTruthy();
    });

    it('returns falsy for valid game', () => {
        expect(gameHasError({ team_1_score: 13, team_2_score: 5 }, 13)).toBeFalsy();
    });

    it('returns falsy when scores are null (game not played)', () => {
        expect(gameHasError({ team_1_score: null, team_2_score: null }, 13)).toBeFalsy();
    });
});

describe('isScoreError', () => {
    it('returns true for equal scores', () => {
        expect(isScoreError({ team_1_score: 5, team_2_score: 5 }, 13)).toBe(true);
    });

    it('returns true for null scores', () => {
        expect(isScoreError({ team_1_score: null, team_2_score: 5 }, 13)).toBe(true);
        expect(isScoreError({ team_1_score: 5, team_2_score: null }, 13)).toBe(true);
    });

    it('returns true for scores exceeding max', () => {
        expect(isScoreError({ team_1_score: 14, team_2_score: 5 }, 13)).toBe(true);
    });

    it('returns false for valid different scores', () => {
        expect(isScoreError({ team_1_score: 13, team_2_score: 7 }, 13)).toBe(false);
    });
});

describe('shuffleArray', () => {
    it('returns array of same length', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = shuffleArray([...arr]);
        expect(result).toHaveLength(5);
    });

    it('contains all original elements', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = shuffleArray([...arr]);
        expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
    });

    it('handles empty array', () => {
        expect(shuffleArray([])).toEqual([]);
    });

    it('handles single element', () => {
        expect(shuffleArray([42])).toEqual([42]);
    });
});
