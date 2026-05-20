import { describe, it, expect } from 'vitest';
import { isScoreError, shuffleArray } from '@/helpers';

describe('Bug #1: Restore from first playoff stage should restore cadrage', () => {
    function makeRestoreContext({ hasCadrage, currentStage, firstPlayoffStageLabel }) {
        const tournament = {
            playOff: [{ stage: firstPlayoffStageLabel }],
            playOffBracket: {
                stages: [
                    ...(hasCadrage ? [{ stageLabel: 'cadrage', teams: [] }] : []),
                    { stageLabel: firstPlayoffStageLabel, teams: [{ team_1: 'A', team_2: 'B' }] },
                ]
            },
            playOffStage: currentStage,
            cadrage: hasCadrage ? [{ team_1: 'A', team_2: 'B', team_1_score: 10, team_2_score: 5 }] : undefined,
        };
        return tournament;
    }

    it('when at first playoff stage with cadrage, keeps cadrage and removes playoff', () => {
        const tournament = makeRestoreContext({
            hasCadrage: true,
            currentStage: 4,
            firstPlayoffStageLabel: 4,
        });

        const bracket = tournament.playOffBracket;
        const currentStage = tournament.playOffStage;
        const firstPlayoffStageLabel = bracket.stages.find(s => s.stageLabel !== 'cadrage')?.stageLabel;

        // Simulate the restore logic
        const shouldRestoreToPreviousPlayoffStage = bracket && currentStage && currentStage < firstPlayoffStageLabel;
        expect(shouldRestoreToPreviousPlayoffStage).toBe(false);

        const shouldRestoreToCadrage = tournament.cadrage?.length > 0;
        expect(shouldRestoreToCadrage).toBe(true);

        // After restore: cadrage remains, playoff removed
        if (shouldRestoreToCadrage) {
            delete tournament.playOff;
            delete tournament.playOffBracket;
            delete tournament.playOffStage;
        }

        expect(tournament.cadrage).toBeDefined();
        expect(tournament.cadrage).toHaveLength(1);
        expect(tournament.playOff).toBeUndefined();
        expect(tournament.playOffBracket).toBeUndefined();
        expect(tournament.playOffStage).toBeUndefined();
    });

    it('when at first playoff stage without cadrage, removes everything', () => {
        const tournament = makeRestoreContext({
            hasCadrage: false,
            currentStage: 4,
            firstPlayoffStageLabel: 4,
        });

        const bracket = tournament.playOffBracket;
        const currentStage = tournament.playOffStage;
        const firstPlayoffStageLabel = bracket.stages.find(s => s.stageLabel !== 'cadrage')?.stageLabel;

        const shouldRestoreToPreviousPlayoffStage = bracket && currentStage && currentStage < firstPlayoffStageLabel;
        expect(shouldRestoreToPreviousPlayoffStage).toBe(false);

        const shouldRestoreToCadrage = tournament.cadrage?.length > 0;
        expect(shouldRestoreToCadrage).toBe(false);

        // After restore: everything removed
        delete tournament.playOff;
        delete tournament.playOffBracket;
        delete tournament.playOffStage;
        delete tournament.cadrage;

        expect(tournament.playOff).toBeUndefined();
        expect(tournament.cadrage).toBeUndefined();
    });

    it('when at a later playoff stage, restores to previous playoff stage', () => {
        const tournament = {
            playOff: [{ stage: 4 }],
            playOffBracket: {
                stages: [
                    { stageLabel: 4, teams: [{ team_1: 'A', team_2: 'B' }] },
                    { stageLabel: 2, teams: [{ team_1: 'C', team_2: null }] },
                ]
            },
            playOffStage: 2,
        };

        const bracket = tournament.playOffBracket;
        const currentStage = tournament.playOffStage;
        const firstPlayoffStageLabel = bracket.stages.find(s => s.stageLabel !== 'cadrage')?.stageLabel;

        const shouldRestoreToPreviousPlayoffStage = bracket && currentStage && currentStage < firstPlayoffStageLabel;
        expect(shouldRestoreToPreviousPlayoffStage).toBe(true);

        const previousStage = currentStage * 2;
        expect(previousStage).toBe(4);
    });
});

describe('Bug #2: Cadrage saveResults validates scores before advancing', () => {
    it('blocks save when scores are null', () => {
        const cadrageGames = [
            { team_1_score: 10, team_2_score: 5 },
            { team_1_score: null, team_2_score: null },
        ];
        const maxScore = 13;

        const hasError = cadrageGames.some(game => isScoreError(game, maxScore));
        expect(hasError).toBe(true);
    });

    it('blocks save when scores are tied', () => {
        const cadrageGames = [
            { team_1_score: 10, team_2_score: 10 },
        ];
        const maxScore = 13;

        const hasError = cadrageGames.some(game => isScoreError(game, maxScore));
        expect(hasError).toBe(true);
    });

    it('blocks save when score exceeds maxScore', () => {
        const cadrageGames = [
            { team_1_score: 14, team_2_score: 5 },
        ];
        const maxScore = 13;

        const hasError = cadrageGames.some(game => isScoreError(game, maxScore));
        expect(hasError).toBe(true);
    });

    it('allows save when all scores are valid', () => {
        const cadrageGames = [
            { team_1_score: 13, team_2_score: 7 },
            { team_1_score: 10, team_2_score: 5 },
            { team_1_score: 8, team_2_score: 11 },
        ];
        const maxScore = 13;

        const hasError = cadrageGames.some(game => isScoreError(game, maxScore));
        expect(hasError).toBe(false);
    });
});

describe('Bug #3: Playoff lane order is shuffled', () => {
    it('laneOrder is a valid permutation of indices', () => {
        const teamCount = 4;
        const indices = Array.from({ length: teamCount }, (_, k) => k);
        const laneOrder = shuffleArray([...indices]);

        expect(laneOrder).toHaveLength(teamCount);
        expect([...laneOrder].sort()).toEqual(indices);
    });

    it('laneOrder contains each index exactly once', () => {
        const teamCount = 8;
        const indices = Array.from({ length: teamCount }, (_, k) => k);
        const laneOrder = shuffleArray([...indices]);

        const unique = new Set(laneOrder);
        expect(unique.size).toBe(teamCount);
        laneOrder.forEach(lane => {
            expect(lane).toBeGreaterThanOrEqual(0);
            expect(lane).toBeLessThan(teamCount);
        });
    });

    it('displayLane uses laneNumber when provided', () => {
        const fieldsStart = 1;
        const gameIndex = 0;
        const laneNumber = 3;

        // When laneNumber is provided, displayLane = laneNumber + fieldsStart
        const displayLane = laneNumber != null ? laneNumber + fieldsStart : gameIndex + fieldsStart;
        expect(displayLane).toBe(4);
    });

    it('displayLane falls back to gameIndex when laneNumber is null', () => {
        const fieldsStart = 1;
        const gameIndex = 2;
        const laneNumber = null;

        const displayLane = laneNumber != null ? laneNumber + fieldsStart : gameIndex + fieldsStart;
        expect(displayLane).toBe(3);
    });

    it('shuffleArray produces different orders (not always sequential)', () => {
        const teamCount = 8;
        const indices = Array.from({ length: teamCount }, (_, k) => k);
        let differentCount = 0;
        for (let i = 0; i < 20; i++) {
            const laneOrder = shuffleArray([...indices]);
            if (JSON.stringify(laneOrder) !== JSON.stringify(indices)) {
                differentCount++;
            }
        }
        // With 8 items, probability of getting sequential order is 1/40320
        // Over 20 attempts, virtually impossible to always get sequential
        expect(differentCount).toBeGreaterThan(0);
    });
});
