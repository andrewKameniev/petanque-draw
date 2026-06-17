import { describe, it, expect } from 'vitest';
import {
    calculatePlayerStat,
    calculateTeamPlayersStat,
    calculateCommonTeamStat,
    getFrenchStat,
    getDate,
} from '@/helpers-stat';

function makeThrow(overrides = {}) {
    return {
        isMade: true,
        type: 'p',
        success: true,
        french: 'D',
        distance: 7,
        important: false,
        ...overrides,
    };
}

describe('calculatePlayerStat - simple system', () => {
    it('returns zeroed stat for empty scenario', () => {
        const result = calculatePlayerStat([], 'simple');
        expect(result.points.positive).toBe(0);
        expect(result.points.negative).toBe(0);
        expect(result.tirs.positive).toBe(0);
        expect(result.tirs.negative).toBe(0);
    });

    it('counts successful points', () => {
        const scenario = [[makeThrow({ success: true }), makeThrow({ success: true })]];
        const result = calculatePlayerStat(scenario, 'simple');
        expect(result.points.positive).toBe(2);
        expect(result.points.negative).toBe(0);
    });

    it('counts failed points', () => {
        const scenario = [[makeThrow({ success: false }), makeThrow({ success: false })]];
        const result = calculatePlayerStat(scenario, 'simple');
        expect(result.points.positive).toBe(0);
        expect(result.points.negative).toBe(2);
    });

    it('counts successful tirs', () => {
        const scenario = [[makeThrow({ type: 't', success: true })]];
        const result = calculatePlayerStat(scenario, 'simple');
        expect(result.tirs.positive).toBe(1);
    });

    it('counts failed tirs', () => {
        const scenario = [[makeThrow({ type: 't', success: false })]];
        const result = calculatePlayerStat(scenario, 'simple');
        expect(result.tirs.negative).toBe(1);
    });

    it('skips throws where isMade is false', () => {
        const scenario = [[makeThrow({ isMade: false }), makeThrow({ isMade: true, success: true })]];
        const result = calculatePlayerStat(scenario, 'simple');
        expect(result.points.positive).toBe(1);
    });

    it('calculates allPercent correctly', () => {
        const scenario = [
            [makeThrow({ success: true }), makeThrow({ success: false }), makeThrow({ type: 't', success: true })],
        ];
        const result = calculatePlayerStat(scenario, 'simple');
        expect(result.allPercent).toBe(67);
    });

    it('calculates pointsPercent correctly', () => {
        const scenario = [[makeThrow({ success: true }), makeThrow({ success: true }), makeThrow({ success: false })]];
        const result = calculatePlayerStat(scenario, 'simple');
        expect(result.pointsPercent).toBe(67);
    });

    it('returns dash for percent when no throws', () => {
        const result = calculatePlayerStat([], 'simple');
        expect(result.pointsPercent).toBeUndefined();
    });

    it('filters by distance', () => {
        const scenario = [[makeThrow({ distance: 7 }), makeThrow({ distance: 9 })]];
        const result = calculatePlayerStat(scenario, 'simple', 7);
        expect(result.points.positive).toBe(1);
    });

    it('filters by important flag', () => {
        const scenario = [[makeThrow({ important: true }), makeThrow({ important: false })]];
        const result = calculatePlayerStat(scenario, 'simple', null, true);
        expect(result.points.positive).toBe(1);
    });

    it('builds serie array of made throws', () => {
        const scenario = [[makeThrow(), makeThrow({ isMade: false }), makeThrow()]];
        const result = calculatePlayerStat(scenario, 'simple');
        expect(result.serie).toHaveLength(2);
    });
});

describe('calculatePlayerStat - french system', () => {
    it('returns zeroed stat for empty scenario', () => {
        const result = calculatePlayerStat([], 'french');
        expect(result.points.volume).toBe(0);
        expect(result.points.intensity).toBe(0);
        expect(result.tirs.volume).toBe(0);
        expect(result.tirs.intensity).toBe(0);
    });

    it('calculates volume and intensity for points', () => {
        const scenario = [[makeThrow({ french: 'A' })]];
        const result = calculatePlayerStat(scenario, 'french');
        expect(result.points.volume).toBe(1.5);
        expect(result.points.intensity).toBe(1);
    });

    it('calculates volume and intensity for tirs', () => {
        const scenario = [[makeThrow({ type: 't', french: 'B' })]];
        const result = calculatePlayerStat(scenario, 'french');
        expect(result.tirs.volume).toBe(1);
        expect(result.tirs.intensity).toBe(1);
    });

    it('tirs with french E gets 0.5 intensity', () => {
        const scenario = [[makeThrow({ type: 't', french: 'E' })]];
        const result = calculatePlayerStat(scenario, 'french');
        expect(result.tirs.intensity).toBe(0.5);
    });

    it('handles H grade (best)', () => {
        const scenario = [[makeThrow({ french: 'H' })]];
        const result = calculatePlayerStat(scenario, 'french');
        expect(result.points.volume).toBe(2);
        expect(result.points.intensity).toBe(1);
    });

    it('handles negative grades', () => {
        const scenario = [[makeThrow({ french: 'G' })]];
        const result = calculatePlayerStat(scenario, 'french');
        expect(result.points.volume).toBe(-1.5);
        expect(result.points.intensity).toBe(0);
    });
});

describe('calculateTeamPlayersStat - simple system', () => {
    function makeTeam(playerCount, stats) {
        return {
            players: Array.from({ length: playerCount }, (_, i) => ({
                name: `Player${i + 1}`,
                stat: stats[i] || [],
            })),
        };
    }

    it('returns correct stats for each player', () => {
        const team = makeTeam(2, [
            [[makeThrow({ success: true }), makeThrow({ success: false })]],
            [[makeThrow({ type: 't', success: true })]],
        ]);
        const result = calculateTeamPlayersStat(team, 'simple');
        expect(result[0].points.positive).toBe(1);
        expect(result[0].points.negative).toBe(1);
        expect(result[1].tirs.positive).toBe(1);
    });

    it('tracks x2 throws separately', () => {
        const team = makeTeam(1, [[[makeThrow({ success: true, x2: true }), makeThrow({ success: true })]]]);
        const result = calculateTeamPlayersStat(team, 'simple');
        expect(result[0].x2.points.positive).toBe(1);
        expect(result[0].points.positive).toBe(2);
    });

    it('tracks important throws separately', () => {
        const team = makeTeam(1, [
            [[makeThrow({ success: true, important: true }), makeThrow({ success: true, important: false })]],
        ]);
        const result = calculateTeamPlayersStat(team, 'simple');
        expect(result[0].important.points.positive).toBe(1);
    });

    it('calculates all (combined points + tirs)', () => {
        const team = makeTeam(1, [[[makeThrow({ success: true }), makeThrow({ type: 't', success: true })]]]);
        const result = calculateTeamPlayersStat(team, 'simple');
        expect(result[0].all.positive).toBe(2);
        expect(result[0].all.negative).toBe(0);
    });

    it('handles empty stat array', () => {
        const team = { players: [{ name: 'P1', stat: [] }] };
        const result = calculateTeamPlayersStat(team, 'simple');
        expect(result[0].points.positive).toBe(0);
    });
});

describe('calculateCommonTeamStat - simple system', () => {
    it('sums all player stats', () => {
        const playersStat = [
            { points: { positive: 3, negative: 1 }, tirs: { positive: 2, negative: 0 }, serie: [] },
            { points: { positive: 1, negative: 2 }, tirs: { positive: 1, negative: 1 }, serie: [] },
        ];
        const result = calculateCommonTeamStat(playersStat, 'simple');
        expect(result.all.positive).toBe(7);
        expect(result.all.negative).toBe(4);
        expect(result.points.positive).toBe(4);
        expect(result.points.negative).toBe(3);
        expect(result.tirs.positive).toBe(3);
        expect(result.tirs.negative).toBe(1);
    });
});

describe('calculateCommonTeamStat - french system', () => {
    it('sums volume and intensity with getFrenchStat', () => {
        const playersStat = [
            {
                points: { volume: 3, intensity: 2 },
                tirs: { volume: 1, intensity: 1 },
                serie: [{ type: 'p' }, { type: 'p' }, { type: 't' }],
            },
            {
                points: { volume: 1, intensity: 1 },
                tirs: { volume: 2, intensity: 2 },
                serie: [{ type: 'p' }, { type: 't' }, { type: 't' }],
            },
        ];
        const result = calculateCommonTeamStat(playersStat, 'french');
        expect(result.points.volume).toBe(getFrenchStat(3, 2) + getFrenchStat(1, 1));
        expect(result.tirs.volume).toBe(getFrenchStat(1, 1) + getFrenchStat(2, 2));
    });
});

describe('getFrenchStat', () => {
    it('returns rounded percentage', () => {
        expect(getFrenchStat(3, 2)).toBe(150);
    });

    it('returns 0 for NaN (0/0)', () => {
        expect(getFrenchStat(0, 0)).toBe(0);
    });

    it('handles negative values', () => {
        expect(getFrenchStat(-1.5, 3)).toBe(-50);
    });
});

describe('getDate', () => {
    it('formats timestamp correctly', () => {
        const timestamp = new Date(2024, 5, 15).getTime();
        const result = getDate(timestamp);
        expect(result).toBe('(15-6-2024)');
    });

    it('handles single-digit day and month', () => {
        const timestamp = new Date(2024, 0, 5).getTime();
        const result = getDate(timestamp);
        expect(result).toBe('(5-1-2024)');
    });
});
