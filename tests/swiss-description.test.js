import { describe, it, expect } from 'vitest';
import { formatSwissDescription } from '@/helpers';

const labels = {
    swiss: 'швейцарки',
    playOff: 'плей-оф',
    poulesBarrage: 'бараж',
    systemLabel: 'Швейцарка'
};

const labelsEn = {
    swiss: 'swiss',
    playOff: 'play-off',
    poulesBarrage: 'barrage',
    systemLabel: 'Swiss'
};

describe('formatSwissDescription', () => {
    describe('before first round (no games)', () => {
        it('shows system label when no swissRoundsCount', () => {
            const t = { system: 'swiss', games: [], preferences: {} };
            expect(formatSwissDescription(t, 'ua', labels)).toBe('Швейцарка');
        });

        it('shows system label with total rounds in parentheses', () => {
            const t = { system: 'swiss', games: [], preferences: { swissRoundsCount: 4 } };
            expect(formatSwissDescription(t, 'ua', labels)).toBe('Швейцарка (4 кола)');
        });

        it('appends playoff when enabled', () => {
            const t = { system: 'swiss', games: [], preferences: { swissRoundsCount: 4, playOffEnabled: true } };
            expect(formatSwissDescription(t, 'ua', labels)).toBe('Швейцарка (4 кола) + плей-оф');
        });
    });

    describe('round 1 in progress', () => {
        it('shows total rounds format instead of 1/X', () => {
            const t = { system: 'swiss', games: [[{}]], preferences: { swissRoundsCount: 4 } };
            expect(formatSwissDescription(t, 'ua', labels)).toBe('4 кола швейцарки');
        });

        it('shows total rounds + playoff', () => {
            const t = { system: 'swiss', games: [[{}]], preferences: { swissRoundsCount: 4, playOffEnabled: true } };
            expect(formatSwissDescription(t, 'ua', labels)).toBe('4 кола швейцарки + плей-оф');
        });

        it('shows just round count when no total configured', () => {
            const t = { system: 'swiss', games: [[{}]], preferences: {} };
            expect(formatSwissDescription(t, 'ua', labels)).toBe('1 коло швейцарки');
        });
    });

    describe('round 2+ in progress', () => {
        it('shows progress format X/Y', () => {
            const t = { system: 'swiss', games: [[{}], [{}]], preferences: { swissRoundsCount: 4 } };
            expect(formatSwissDescription(t, 'ua', labels)).toBe('2/4 кола швейцарки');
        });

        it('shows 3/4 format on round 3', () => {
            const t = { system: 'swiss', games: [[{}], [{}], [{}]], preferences: { swissRoundsCount: 4 } };
            expect(formatSwissDescription(t, 'ua', labels)).toBe('3/4 кола швейцарки');
        });

        it('shows progress + playoff', () => {
            const t = { system: 'swiss', games: [[{}], [{}]], preferences: { swissRoundsCount: 4, playOffEnabled: true } };
            expect(formatSwissDescription(t, 'ua', labels)).toBe('2/4 кола швейцарки + плей-оф');
        });

        it('shows just rounds when no total', () => {
            const t = { system: 'swiss', games: [[{}], [{}], [{}]], preferences: {} };
            expect(formatSwissDescription(t, 'ua', labels)).toBe('3 кола швейцарки');
        });
    });

    describe('with barrage', () => {
        it('shows rounds before barrage + barrage label', () => {
            const t = { system: 'swiss', games: [[{}], [{}], [{}]], preferences: { swissRoundsCount: 4 }, barrage: { startIndex: 2 } };
            expect(formatSwissDescription(t, 'ua', labels)).toBe('2/4 кола швейцарки + бараж');
        });
    });

    describe('playoff detection', () => {
        it('detects playOff array', () => {
            const t = { system: 'swiss', games: [[{}], [{}]], preferences: { swissRoundsCount: 4 }, playOff: [{}] };
            expect(formatSwissDescription(t, 'ua', labels)).toContain('+ плей-оф');
        });

        it('detects playoff property (typo variant)', () => {
            const t = { system: 'swiss', games: [[{}]], preferences: { swissRoundsCount: 4 }, playoff: true };
            expect(formatSwissDescription(t, 'ua', labels)).toContain('+ плей-оф');
        });

        it('detects preferences.playOffEnabled', () => {
            const t = { system: 'swiss', games: [[{}]], preferences: { swissRoundsCount: 4, playOffEnabled: true } };
            expect(formatSwissDescription(t, 'ua', labels)).toContain('+ плей-оф');
        });
    });

    describe('English locale', () => {
        it('round 1 shows total rounds', () => {
            const t = { system: 'swiss', games: [[{}]], preferences: { swissRoundsCount: 4 } };
            expect(formatSwissDescription(t, 'en', labelsEn)).toBe('4 rounds swiss');
        });

        it('round 2+ shows progress', () => {
            const t = { system: 'swiss', games: [[{}], [{}]], preferences: { swissRoundsCount: 4 } };
            expect(formatSwissDescription(t, 'en', labelsEn)).toBe('2/4 rounds swiss');
        });

        it('single round shows singular', () => {
            const t = { system: 'swiss', games: [[{}]], preferences: {} };
            expect(formatSwissDescription(t, 'en', labelsEn)).toBe('1 round swiss');
        });
    });
});
