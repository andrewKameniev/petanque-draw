import { get, ref, set, remove, update, onValue } from 'firebase/database';
import { database as db } from '@/firebase';

export const tournamentService = {
    getAll(uid) {
        return get(ref(db, `${uid}/tournaments/`));
    },
    update(uid, tournamentId, data) {
        return update(ref(db, `${uid}/tournaments/`), { [tournamentId]: data });
    },
    updatePath(uid, tournamentId, path, data) {
        return set(ref(db, `${uid}/tournaments/${tournamentId}/${path}`), data);
    },
    remove(uid, tournamentId) {
        return remove(ref(db, `${uid}/tournaments/${tournamentId}`));
    },
    removeTokens(uid, tournamentId) {
        return remove(ref(db, `tokens/${uid}/${tournamentId}`));
    },
    subscribe(uid, tournamentId, callback, errorCallback) {
        const dbRef = ref(db, `${uid}/tournaments/${tournamentId}`);
        return onValue(dbRef, callback, errorCallback);
    },
    getOne(uid, tournamentId) {
        return get(ref(db, `${uid}/tournaments/${tournamentId}`));
    },
    subscribePath(uid, tournamentId, path, callback, errorCallback) {
        const dbRef = ref(db, `${uid}/tournaments/${tournamentId}/${path}`);
        return onValue(dbRef, callback, errorCallback);
    },
};

export const savedService = {
    getAll(uid) {
        return get(ref(db, `${uid}/saved/`));
    },
    save(uid, id, data) {
        return set(ref(db, `${uid}/saved/${id}`), data);
    },
    remove(uid, id) {
        return remove(ref(db, `${uid}/saved/${id}`));
    },
};

export const statsService = {
    getTags(uid) {
        return get(ref(db, `${uid}/stats/tags`));
    },
    setTags(uid, tags) {
        return set(ref(db, `${uid}/stats/tags`), tags);
    },
    addTag(uid, tagId, value) {
        return set(ref(db, `${uid}/stats/tags/${tagId}`), value);
    },
    removeTag(uid, tagId) {
        return remove(ref(db, `${uid}/stats/tags/${tagId}`));
    },
    getAll(uid) {
        return get(ref(db, `${uid}/stats/`));
    },
    get(uid, key) {
        return get(ref(db, `${uid}/stats/${key}`));
    },
    save(uid, key, data) {
        return set(ref(db, `${uid}/stats/${key}`), data);
    },
    remove(uid, key) {
        return remove(ref(db, `${uid}/stats/${key}`));
    },
    update(uid, key, data) {
        return update(ref(db, `${uid}/stats/${key}`), data);
    },
};

export const tournamentOrgsService = {
    check(email) {
        const key = email.replace(/\./g, ',');
        return get(ref(db, `tournamentOrgs/${key}`));
    },
};

export const trainingService = {
    getAll(uid) {
        return get(ref(db, `${uid}/training/list`));
    },
    save(uid, id, data) {
        return set(ref(db, `${uid}/training/list/${id}`), data);
    },
    remove(uid, id) {
        return remove(ref(db, `${uid}/training/list/${id}`));
    },
    saveResult(uid, id, data) {
        return set(ref(db, `${uid}/training/list/${id}/results`), data);
    },
    getResults(uid, exId) {
        return get(ref(db, `${uid}/training/${exId}`));
    },
    saveTrainingResult(uid, exId, date, data) {
        return set(ref(db, `${uid}/training/${exId}/${date}`), data);
    },
    getSessions(uid) {
        return get(ref(db, `${uid}/training/sessions`));
    },
    saveSession(uid, id, data) {
        return set(ref(db, `${uid}/training/sessions/${id}`), data);
    },
    removeSession(uid, id) {
        return remove(ref(db, `${uid}/training/sessions/${id}`));
    },
};
