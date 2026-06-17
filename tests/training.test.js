import { describe, it, expect } from 'vitest';
import {
    TRAINING_STATUS,
    TRAINING_TYPE,
    PRESET_CONFIGS,
    createSession,
    addAttempt,
    getSessionProgress,
    getSessionStats,
    getMultiSessionStats,
} from '@/services/training';
import { ATELIER_KEYS, DISTANCES_FULL } from '@/services/tir';

describe('Training Service', () => {
    describe('Constants', () => {
        it('has correct training statuses', () => {
            expect(TRAINING_STATUS.DRAFT).toBe('draft');
            expect(TRAINING_STATUS.IN_PROGRESS).toBe('in_progress');
            expect(TRAINING_STATUS.COMPLETED).toBe('completed');
        });

        it('has correct training types', () => {
            expect(TRAINING_TYPE.TIR_FULL).toBe('tir_full');
            expect(TRAINING_TYPE.TIR_SINGLE_EXERCISE).toBe('tir_single_exercise');
            expect(TRAINING_TYPE.TIR_SINGLE_DISTANCE).toBe('tir_single_distance');
            expect(TRAINING_TYPE.TIR_CUSTOM).toBe('tir_custom');
        });

        it('TIR_FULL preset includes all exercises and distances', () => {
            const preset = PRESET_CONFIGS[TRAINING_TYPE.TIR_FULL];
            expect(preset.exercises).toHaveLength(ATELIER_KEYS.length);
            expect(preset.distances).toEqual(DISTANCES_FULL);
            expect(preset.attempts).toBe(1);
        });

        it('TIR_SINGLE_DISTANCE has multiple attempts', () => {
            const preset = PRESET_CONFIGS[TRAINING_TYPE.TIR_SINGLE_DISTANCE];
            expect(preset.exercises).toEqual([0]);
            expect(preset.distances).toEqual([6]);
            expect(preset.attempts).toBe(10);
        });
    });

    describe('createSession', () => {
        it('creates a session with correct structure', () => {
            const config = { exercises: [0, 1], distances: [6, 7], attempts: 2 };
            const session = createSession(TRAINING_TYPE.TIR_CUSTOM, config, 'Test Training');

            expect(session.name).toBe('Test Training');
            expect(session.type).toBe(TRAINING_TYPE.TIR_CUSTOM);
            expect(session.status).toBe(TRAINING_STATUS.DRAFT);
            expect(session.config.exercises).toEqual([0, 1]);
            expect(session.config.distances).toEqual([6, 7]);
            expect(session.config.attempts).toBe(2);
            expect(session.attempts).toEqual([]);
            expect(session.id).toBeDefined();
            expect(session.createdAt).toBeDefined();
            expect(session.completedAt).toBeNull();
        });

        it('creates sessions with string id based on timestamp', () => {
            const config = { exercises: [0], distances: [6], attempts: 1 };
            const s1 = createSession(TRAINING_TYPE.TIR_CUSTOM, config, 'A');
            expect(typeof s1.id).toBe('string');
            expect(Number(s1.id)).toBeGreaterThan(0);
        });
    });

    describe('addAttempt', () => {
        it('adds an attempt to a session', () => {
            const config = { exercises: [0], distances: [6], attempts: 3 };
            const session = createSession(TRAINING_TYPE.TIR_CUSTOM, config, 'Test');
            addAttempt(session, 0, 6, 'carreau');

            expect(session.attempts).toHaveLength(1);
            expect(session.attempts[0]).toEqual({
                exerciseIndex: 0,
                distance: 6,
                attemptNumber: 1,
                score: 'carreau',
            });
        });

        it('increments attempt number for same exercise/distance', () => {
            const config = { exercises: [0], distances: [6], attempts: 3 };
            const session = createSession(TRAINING_TYPE.TIR_CUSTOM, config, 'Test');
            addAttempt(session, 0, 6, 'carreau');
            addAttempt(session, 0, 6, 'reussi');
            addAttempt(session, 0, 6, 'manque');

            expect(session.attempts[0].attemptNumber).toBe(1);
            expect(session.attempts[1].attemptNumber).toBe(2);
            expect(session.attempts[2].attemptNumber).toBe(3);
        });

        it('resets attempt numbering for different distances', () => {
            const config = { exercises: [0], distances: [6, 7], attempts: 2 };
            const session = createSession(TRAINING_TYPE.TIR_CUSTOM, config, 'Test');
            addAttempt(session, 0, 6, 'carreau');
            addAttempt(session, 0, 7, 'reussi');

            expect(session.attempts[0].attemptNumber).toBe(1);
            expect(session.attempts[1].attemptNumber).toBe(1);
        });

        it('updates the session updatedAt timestamp', () => {
            const config = { exercises: [0], distances: [6], attempts: 1 };
            const session = createSession(TRAINING_TYPE.TIR_CUSTOM, config, 'Test');
            const before = session.updatedAt;
            addAttempt(session, 0, 6, 'carreau');
            expect(session.updatedAt).toBeGreaterThanOrEqual(before);
        });
    });

    describe('getSessionProgress', () => {
        it('returns 0 progress for empty session', () => {
            const config = { exercises: [0, 1], distances: [6, 7], attempts: 2 };
            const session = createSession(TRAINING_TYPE.TIR_CUSTOM, config, 'Test');
            const progress = getSessionProgress(session);

            expect(progress.completed).toBe(0);
            expect(progress.total).toBe(8); // 2 exercises * 2 distances * 2 attempts
            expect(progress.percent).toBe(0);
        });

        it('calculates progress correctly', () => {
            const config = { exercises: [0], distances: [6], attempts: 4 };
            const session = createSession(TRAINING_TYPE.TIR_CUSTOM, config, 'Test');
            addAttempt(session, 0, 6, 'carreau');
            addAttempt(session, 0, 6, 'reussi');
            const progress = getSessionProgress(session);

            expect(progress.completed).toBe(2);
            expect(progress.total).toBe(4);
            expect(progress.percent).toBe(50);
        });

        it('returns 100% when all attempts are filled', () => {
            const config = { exercises: [0], distances: [6], attempts: 2 };
            const session = createSession(TRAINING_TYPE.TIR_CUSTOM, config, 'Test');
            addAttempt(session, 0, 6, 'carreau');
            addAttempt(session, 0, 6, 'carreau');
            const progress = getSessionProgress(session);

            expect(progress.percent).toBe(100);
        });
    });

    describe('getSessionStats', () => {
        function makeSessionWithAttempts() {
            const config = { exercises: [0, 1], distances: [6, 7], attempts: 1 };
            const session = createSession(TRAINING_TYPE.TIR_CUSTOM, config, 'Test');
            addAttempt(session, 0, 6, 'carreau');
            addAttempt(session, 0, 7, 'reussi');
            addAttempt(session, 1, 6, 'touche');
            addAttempt(session, 1, 7, 'manque');
            return session;
        }

        it('calculates overall stats correctly', () => {
            const session = makeSessionWithAttempts();
            const stats = getSessionStats(session);

            expect(stats.total).toBe(5 + 3 + 1 + 0);
            expect(stats.count).toBe(4);
            expect(stats.average).toBe(2.25);
            expect(stats.best).toBe(5);
            expect(stats.worst).toBe(0);
            expect(stats.carreau).toBe(1);
            expect(stats.reussi).toBe(1);
            expect(stats.touche).toBe(1);
            expect(stats.manque).toBe(1);
        });

        it('filters by exercise index', () => {
            const session = makeSessionWithAttempts();
            const stats = getSessionStats(session, { exerciseIndex: 0 });

            expect(stats.count).toBe(2);
            expect(stats.carreau).toBe(1);
            expect(stats.reussi).toBe(1);
        });

        it('filters by distance', () => {
            const session = makeSessionWithAttempts();
            const stats = getSessionStats(session, { distance: 6 });

            expect(stats.count).toBe(2);
            expect(stats.carreau).toBe(1);
            expect(stats.touche).toBe(1);
        });

        it('returns null for empty attempts', () => {
            const config = { exercises: [0], distances: [6], attempts: 1 };
            const session = createSession(TRAINING_TYPE.TIR_CUSTOM, config, 'Test');
            const stats = getSessionStats(session);
            expect(stats).toBeNull();
        });
    });

    describe('getMultiSessionStats', () => {
        function makeSessions() {
            const config = { exercises: [0], distances: [6], attempts: 2 };
            const s1 = createSession(TRAINING_TYPE.TIR_CUSTOM, config, 'Session 1');
            s1.createdAt = new Date('2024-01-01').getTime();
            addAttempt(s1, 0, 6, 'carreau');
            addAttempt(s1, 0, 6, 'reussi');

            const s2 = createSession(TRAINING_TYPE.TIR_CUSTOM, config, 'Session 2');
            s2.createdAt = new Date('2024-02-01').getTime();
            addAttempt(s2, 0, 6, 'touche');
            addAttempt(s2, 0, 6, 'manque');

            return [s1, s2];
        }

        it('aggregates stats across multiple sessions', () => {
            const sessions = makeSessions();
            const stats = getMultiSessionStats(sessions);

            expect(stats.count).toBe(4);
            expect(stats.total).toBe(5 + 3 + 1 + 0);
            expect(stats.sessionCount).toBe(2);
            expect(stats.carreau).toBe(1);
            expect(stats.reussi).toBe(1);
            expect(stats.touche).toBe(1);
            expect(stats.manque).toBe(1);
        });

        it('filters by date range', () => {
            const sessions = makeSessions();
            const stats = getMultiSessionStats(sessions, {
                dateFrom: new Date('2024-01-15').getTime(),
            });

            expect(stats.count).toBe(2);
            expect(stats.touche).toBe(1);
            expect(stats.manque).toBe(1);
        });

        it('returns null for empty sessions', () => {
            const stats = getMultiSessionStats([]);
            expect(stats).toBeNull();
        });
    });

    describe('Rerun session (createSession from existing config)', () => {
        it('creates a new session with same config but fresh state', () => {
            const config = { exercises: [0, 1, 2], distances: [6, 7, 8], attempts: 3 };
            const original = createSession(TRAINING_TYPE.TIR_FULL, config, 'Full Tir Training');
            original.id = '1000';
            addAttempt(original, 0, 6, 'carreau');
            original.status = TRAINING_STATUS.COMPLETED;

            const rerun = createSession(original.type, original.config, original.name);

            expect(rerun.name).toBe(original.name);
            expect(rerun.type).toBe(original.type);
            expect(rerun.config).toEqual(original.config);
            expect(rerun.status).toBe(TRAINING_STATUS.DRAFT);
            expect(rerun.attempts).toEqual([]);
            expect(rerun.id).not.toBe(original.id);
        });
    });

    describe('Fill zeros (manque for unfilled attempts)', () => {
        it('fills empty slots with manque', () => {
            const config = { exercises: [0], distances: [6, 7], attempts: 2 };
            const session = createSession(TRAINING_TYPE.TIR_CUSTOM, config, 'Test');
            addAttempt(session, 0, 6, 'carreau');

            // Simulate fillAllZeros for exercise 0
            for (const distance of config.distances) {
                for (let attemptNum = 1; attemptNum <= config.attempts; attemptNum++) {
                    const existing = session.attempts.find(
                        (a) => a.exerciseIndex === 0 && a.distance === distance && a.attemptNumber === attemptNum,
                    );
                    if (!existing) {
                        session.attempts.push({
                            exerciseIndex: 0,
                            distance,
                            attemptNumber: attemptNum,
                            score: 'manque',
                        });
                    }
                }
            }

            expect(session.attempts).toHaveLength(4);
            expect(session.attempts[0].score).toBe('carreau');
            expect(session.attempts[1].score).toBe('manque'); // 6m attempt 2
            expect(session.attempts[2].score).toBe('manque'); // 7m attempt 1
            expect(session.attempts[3].score).toBe('manque'); // 7m attempt 2
        });

        it('does not overwrite existing scores', () => {
            const config = { exercises: [0], distances: [6], attempts: 3 };
            const session = createSession(TRAINING_TYPE.TIR_CUSTOM, config, 'Test');
            addAttempt(session, 0, 6, 'carreau');
            addAttempt(session, 0, 6, 'reussi');

            for (let attemptNum = 1; attemptNum <= config.attempts; attemptNum++) {
                const existing = session.attempts.find(
                    (a) => a.exerciseIndex === 0 && a.distance === 6 && a.attemptNumber === attemptNum,
                );
                if (!existing) {
                    session.attempts.push({
                        exerciseIndex: 0,
                        distance: 6,
                        attemptNumber: attemptNum,
                        score: 'manque',
                    });
                }
            }

            expect(session.attempts).toHaveLength(3);
            expect(session.attempts[0].score).toBe('carreau');
            expect(session.attempts[1].score).toBe('reussi');
            expect(session.attempts[2].score).toBe('manque');
        });
    });

    describe('Auto-generated session name', () => {
        it('generates name with exercise and distance info', () => {
            // Simulating the name generation logic from TrainingCreate
            const exercises = [0];
            const distances = [6, 7];
            const atelierNames = ATELIER_KEYS.map((_, i) => `Exercise ${i + 1}`);

            const exerciseNames = exercises.map((idx) => atelierNames[idx]);
            const exercisePart =
                exerciseNames.length === ATELIER_KEYS.length ? 'All exercises' : exerciseNames.join(', ');
            const distPart =
                distances.length === DISTANCES_FULL.length ? 'All distances' : distances.map((d) => `${d}m`).join(', ');
            const name = `${exercisePart}. ${distPart}.`;

            expect(name).toBe('Exercise 1. 6m, 7m.');
        });

        it('shows "All" when all exercises/distances selected', () => {
            const exercises = ATELIER_KEYS.map((_, i) => i);
            const distances = [...DISTANCES_FULL];
            const atelierNames = ATELIER_KEYS.map((_, i) => `Exercise ${i + 1}`);

            const exerciseNames = exercises.map((idx) => atelierNames[idx]);
            const exercisePart =
                exerciseNames.length === ATELIER_KEYS.length ? 'All exercises' : exerciseNames.join(', ');
            const distPart =
                distances.length === DISTANCES_FULL.length ? 'All distances' : distances.map((d) => `${d}m`).join(', ');
            const name = `${exercisePart}. ${distPart}.`;

            expect(name).toBe('All exercises. All distances.');
        });
    });
});
