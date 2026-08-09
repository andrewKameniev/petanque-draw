import { get, limitToFirst, limitToLast, onValue, query, ref, remove, set, update } from 'firebase/database';
import { database as db } from '@/firebase';
import { getPublicTournamentProjectionPath } from '@/services/public-tournament-projection';

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
  subscribePath(uid, tournamentId, path, callback, errorCallback, options = {}) {
    const pathRef = ref(db, `${uid}/tournaments/${tournamentId}/${path}`);
    const dbRef = options.limitToFirst
      ? query(pathRef, limitToFirst(options.limitToFirst))
      : options.limitToLast
        ? query(pathRef, limitToLast(options.limitToLast))
        : pathRef;
    return onValue(dbRef, callback, errorCallback);
  },
};

export const publicTournamentService = {
  subscribe(uid, tournamentId, callback, errorCallback) {
    return onValue(ref(db, getPublicTournamentProjectionPath(uid, tournamentId)), callback, errorCallback);
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

export const statsPlayerIdentityService = {
  getAll(uid) {
    return get(ref(db, `${uid}/statPlayerIdentities/`));
  },
  save(uid, portalPlayerId, data) {
    return set(ref(db, `${uid}/statPlayerIdentities/${portalPlayerId}`), data);
  },
  updateAll(uid, data) {
    return update(ref(db, `${uid}/statPlayerIdentities/`), data);
  },
};

export const tournamentOrgsService = {
  check(email) {
    const key = email.replace(/\./g, ',');
    return get(ref(db, `tournamentOrgs/${key}`));
  },
};

export const arbiterRegistryService = {
  get(uid) {
    return get(ref(db, `${uid}/arbiterRegistry`));
  },
  save(uid, data) {
    return set(ref(db, `${uid}/arbiterRegistry`), data);
  },
};

export const arbiterPresetService = {
  getAll(uid) {
    return get(ref(db, `${uid}/arbiterPresets`));
  },
  save(uid, presetId, data) {
    return set(ref(db, `${uid}/arbiterPresets/${presetId}`), data);
  },
  remove(uid, presetId) {
    return remove(ref(db, `${uid}/arbiterPresets/${presetId}`));
  },
};

export const userMapService = {
  getAll(uid) {
    return get(ref(db, `users/${uid}/tournaments`));
  },
  set(uid, tournamentId, data) {
    return set(ref(db, `users/${uid}/tournaments/${tournamentId}`), data);
  },
  remove(uid, tournamentId) {
    return remove(ref(db, `users/${uid}/tournaments/${tournamentId}`));
  },
  update(uid, tournamentId, data) {
    return update(ref(db, `users/${uid}/tournaments/${tournamentId}`), data);
  },
};

export const collaboratorService = {
  getAll(ownerUid, tournamentId) {
    return get(ref(db, `${ownerUid}/tournaments/${tournamentId}/collaborators`));
  },
  add(ownerUid, tournamentId, collaboratorUid, data) {
    return set(ref(db, `${ownerUid}/tournaments/${tournamentId}/collaborators/${collaboratorUid}`), data);
  },
  remove(ownerUid, tournamentId, collaboratorUid) {
    return remove(ref(db, `${ownerUid}/tournaments/${tournamentId}/collaborators/${collaboratorUid}`));
  },
  findUserByEmail(email) {
    const key = email.replace(/\./g, ',');
    return get(ref(db, `emails/${key}`));
  },
};

export const customRoutesService = {
  get(slug) {
    return get(ref(db, `customRoutes/${slug}`));
  },
  getAll() {
    return get(ref(db, 'customRoutes'));
  },
  create(slug, data) {
    return set(ref(db, `customRoutes/${slug}`), data);
  },
  update(slug, data) {
    return update(ref(db, `customRoutes/${slug}`), data);
  },
  remove(slug) {
    return remove(ref(db, `customRoutes/${slug}`));
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
