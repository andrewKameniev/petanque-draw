import { ATELIER_KEYS, DISTANCES_FULL, SCORING } from './tir';

export const TRAINING_STATUS = {
    DRAFT: 'draft',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
};

export const TRAINING_TYPE = {
    TIR_FULL: 'tir_full',
    TIR_SINGLE_EXERCISE: 'tir_single_exercise',
    TIR_SINGLE_DISTANCE: 'tir_single_distance',
    TIR_CUSTOM: 'tir_custom',
};

export const PRESET_CONFIGS = {
    [TRAINING_TYPE.TIR_FULL]: {
        exercises: ATELIER_KEYS.map((_, i) => i),
        distances: [...DISTANCES_FULL],
        attempts: 1,
    },
    [TRAINING_TYPE.TIR_SINGLE_EXERCISE]: {
        exercises: [0],
        distances: [...DISTANCES_FULL],
        attempts: 1,
    },
    [TRAINING_TYPE.TIR_SINGLE_DISTANCE]: {
        exercises: [0],
        distances: [6],
        attempts: 10,
    },
    [TRAINING_TYPE.TIR_CUSTOM]: {
        exercises: [0],
        distances: [...DISTANCES_FULL],
        attempts: 1,
    },
};

export function createSession(type, config, name) {
    return {
        id: Date.now().toString(),
        name,
        type,
        status: TRAINING_STATUS.DRAFT,
        config: {
            exercises: config.exercises,
            distances: config.distances,
            attempts: config.attempts,
        },
        attempts: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        completedAt: null,
    };
}

export function addAttempt(session, exerciseIndex, distance, score) {
    const attemptNumber =
        session.attempts.filter((a) => a.exerciseIndex === exerciseIndex && a.distance === distance).length + 1;

    session.attempts.push({
        exerciseIndex,
        distance,
        attemptNumber,
        score,
    });
    session.updatedAt = Date.now();
    return session;
}

export function getSessionProgress(session) {
    const totalExpected = session.config.exercises.length * session.config.distances.length * session.config.attempts;
    const completed = session.attempts.length;
    return {
        completed,
        total: totalExpected,
        percent: totalExpected ? Math.round((completed / totalExpected) * 100) : 0,
    };
}

export function getSessionStats(session, filters = {}) {
    let attempts = [...session.attempts];

    if (filters.exerciseIndex !== undefined) {
        attempts = attempts.filter((a) => a.exerciseIndex === filters.exerciseIndex);
    }
    if (filters.distance !== undefined) {
        attempts = attempts.filter((a) => a.distance === filters.distance);
    }

    if (!attempts.length) return null;

    const scores = attempts.map((a) => SCORING[a.score] ?? a.score);
    const total = scores.reduce((sum, s) => sum + s, 0);

    return {
        total,
        count: attempts.length,
        average: +(total / attempts.length).toFixed(2),
        best: Math.max(...scores),
        worst: Math.min(...scores),
        carreau: attempts.filter((a) => a.score === 'carreau').length,
        reussi: attempts.filter((a) => a.score === 'reussi').length,
        touche: attempts.filter((a) => a.score === 'touche').length,
        manque: attempts.filter((a) => a.score === 'manque').length,
    };
}

export function getMultiSessionStats(sessions, filters = {}) {
    let allAttempts = [];

    sessions.forEach((session) => {
        let attempts = [...(session.attempts || [])];
        if (filters.exerciseIndex !== undefined) {
            attempts = attempts.filter((a) => a.exerciseIndex === filters.exerciseIndex);
        }
        if (filters.distance !== undefined) {
            attempts = attempts.filter((a) => a.distance === filters.distance);
        }
        if (filters.dateFrom) {
            if (session.createdAt < filters.dateFrom) return;
        }
        if (filters.dateTo) {
            if (session.createdAt > filters.dateTo) return;
        }
        allAttempts.push(...attempts);
    });

    if (!allAttempts.length) return null;

    const scores = allAttempts.map((a) => SCORING[a.score] ?? a.score);
    const total = scores.reduce((sum, s) => sum + s, 0);

    return {
        total,
        count: allAttempts.length,
        average: +(total / allAttempts.length).toFixed(2),
        best: Math.max(...scores),
        worst: Math.min(...scores),
        carreau: allAttempts.filter((a) => a.score === 'carreau').length,
        reussi: allAttempts.filter((a) => a.score === 'reussi').length,
        touche: allAttempts.filter((a) => a.score === 'touche').length,
        manque: allAttempts.filter((a) => a.score === 'manque').length,
        sessionCount: sessions.length,
    };
}
