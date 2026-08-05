import { get, getDatabase, onValue, ref, remove, set, update } from 'firebase/database';
import { database } from '@/firebase';
import { collaboratorService, userMapService } from '@/services/db';
import { getTournamentMain, getTournamentMetadata, normalizeTournamentRecord } from '@/services/tournament-record';

export const ARCHIVE_STATUS_VERSION = 1;

function adminCollaboratorUids(tournament) {
  return Object.entries(tournament?.collaborators || {})
    .filter(([, collaborator]) => {
      const role = typeof collaborator === 'string' ? collaborator : collaborator.role;
      return role === 'admin';
    })
    .map(([uid]) => uid);
}

export function createArchiveCollaborationRuntime(store, dependencies = {}) {
  const firebase = {
    database: dependencies.database || database,
    get: dependencies.get || get,
    getDatabase: dependencies.getDatabase || getDatabase,
    onValue: dependencies.onValue || onValue,
    ref: dependencies.ref || ref,
    remove: dependencies.remove || remove,
    set: dependencies.set || set,
    update: dependencies.update || update,
  };
  const maps = dependencies.userMapService || userMapService;
  const collaborators = dependencies.collaboratorService || collaboratorService;
  const translate = dependencies.translate || ((key) => key);
  let accessWatcherUnsubscribe = null;
  let accessRevokedHandled = false;
  let accessRevokedResetTimeout = null;
  let generation = 0;

  function operationContext() {
    return { generation, userUid: store.user?.uid };
  }

  function isCurrent(operation) {
    return generation === operation.generation && store.user?.uid === operation.userUid;
  }

  function showError(error) {
    store.showMessage({ title: translate('messages.error'), text: error, type: 'error' });
  }

  async function getTournaments({ routeQueryT } = {}) {
    const operation = operationContext();
    const mapSnapshot = await maps.getAll(operation.userUid);
    const tournamentsSnapshot = await firebase.get(
      firebase.ref(firebase.database, `${operation.userUid}/tournaments/`),
    );
    if (!isCurrent(operation)) return;

    if (mapSnapshot.exists()) store.userTournamentMap = mapSnapshot.val();
    else {
      const migratedMap = {};
      if (tournamentsSnapshot.exists()) {
        Object.entries(tournamentsSnapshot.val()).forEach(([id, tournament]) => {
          migratedMap[id] = {
            status: getTournamentMain(tournament)?.tournamentIsFinished ? 'archived' : 'active',
            role: 'owner',
            name: getTournamentMetadata(tournament, { name: 'Tournament' }).name,
          };
        });
      }
      const savedSnapshot = await firebase.get(firebase.ref(firebase.database, `${operation.userUid}/saved/`));
      if (!isCurrent(operation)) return;
      if (savedSnapshot.exists()) {
        Object.entries(savedSnapshot.val()).forEach(([id, tournament]) => {
          if (!migratedMap[id])
            migratedMap[id] = { status: 'archived', role: 'owner', name: tournament.name || 'Tournament' };
        });
      }
      store.userTournamentMap = migratedMap;
      if (Object.keys(migratedMap).length) {
        await firebase.set(firebase.ref(firebase.getDatabase(), `users/${operation.userUid}/tournaments`), migratedMap);
      }
    }
    if (!isCurrent(operation)) return;

    const ownActive = Object.entries(store.userTournamentMap)
      .filter(([, entry]) => entry.role === 'owner' && entry.status !== 'archived')
      .map(([id]) => id);
    const active = {};
    if (tournamentsSnapshot.exists()) {
      const all = tournamentsSnapshot.val();
      if (ownActive.length) ownActive.forEach((id) => all[id] && (active[id] = all[id]));
      else if (!Object.keys(store.userTournamentMap).length) Object.assign(active, all);
    }
    store.setTournaments(active, { routeQueryT });
    store.savedTournamentIds = Object.entries(store.userTournamentMap)
      .filter(([, entry]) => entry.status === 'archived')
      .map(([id]) => id);
  }

  async function fetchSavedTournaments() {
    const operation = operationContext();
    const archivedEntries = Object.entries(store.userTournamentMap).filter(
      ([, entry]) =>
        (entry.role === 'owner' && entry.status === 'archived') ||
        (entry.role === 'admin' &&
          entry.ownerUid &&
          (entry.status === 'archived' || entry.archiveStatusVersion !== ARCHIVE_STATUS_VERSION)),
    );
    if (!archivedEntries.length) {
      store.setSavedTournaments({});
      store.savedTournamentIds = [];
      return;
    }

    const results = {};
    const migrated = [];
    await Promise.all(
      archivedEntries.map(async ([id, entry]) => {
        const ownerUid = entry.role === 'owner' ? operation.userUid : entry.ownerUid;
        const tournamentSnapshot = await firebase.get(
          firebase.ref(firebase.getDatabase(), `${ownerUid}/tournaments/${id}`),
        );
        const tournamentData = tournamentSnapshot.exists() ? tournamentSnapshot.val() : null;
        const competition = getTournamentMain(tournamentData);
        const hasTournamentData = tournamentData && (competition?.teams || competition?.tirParticipants);

        if (entry.role === 'owner' && !hasTournamentData) {
          const savedSnapshot = await firebase.get(
            firebase.ref(firebase.getDatabase(), `${operation.userUid}/saved/${id}`),
          );
          if (savedSnapshot.exists()) {
            const data = savedSnapshot.val();
            await firebase.set(firebase.ref(firebase.getDatabase(), `${operation.userUid}/tournaments/${id}`), data);
            await firebase.remove(firebase.ref(firebase.getDatabase(), `${operation.userUid}/saved/${id}`));
            results[id] = data;
            migrated.push({ id, name: getTournamentMetadata(data, { name: id }).name });
            return;
          }
        }
        if (!tournamentSnapshot.exists()) return;

        const shouldMigrateAdminArchive =
          entry.role === 'admin' &&
          entry.status !== 'archived' &&
          entry.archiveStatusVersion !== ARCHIVE_STATUS_VERSION &&
          !!getTournamentMain(tournamentData)?.tournamentIsFinished;
        if (entry.status !== 'archived' && !shouldMigrateAdminArchive) return;
        if (shouldMigrateAdminArchive) {
          const archiveUpdate = { status: 'archived', archiveStatusVersion: ARCHIVE_STATUS_VERSION };
          await maps.update(operation.userUid, id, archiveUpdate);
          Object.assign(entry, archiveUpdate);
        }
        results[id] = tournamentData;
      }),
    );
    if (!isCurrent(operation)) return;
    if (migrated.length) {
      console.warn(`[Migration] Moved ${migrated.length} tournament(s) from saved/ to tournaments/:`, migrated);
    }
    store.setSavedTournaments(results);
    store.savedTournamentIds = Object.keys(results);
  }

  async function addToSaved(tournament) {
    const id = String(tournament.id || store.currentTournamentIndex);
    const previousStatus = store.userTournamentMap[id]?.status || 'active';
    let ownMapUpdated = false;
    try {
      await maps.update(store.user.uid, id, { status: 'archived' });
      ownMapUpdated = true;
      const mapEntry = store.userTournamentMap[id];
      if (mapEntry?.role === 'owner') {
        const updateData = { status: 'archived', archiveStatusVersion: ARCHIVE_STATUS_VERSION };
        await Promise.all(adminCollaboratorUids(tournament).map((uid) => maps.update(uid, id, updateData)));
      }
      if (mapEntry) mapEntry.status = 'archived';
      if (!store.savedTournamentIds.includes(id)) store.savedTournamentIds.push(id);
      delete store.tournaments[id];
      if (String(store.currentTournamentIndex) === id) {
        const remaining = Object.keys(store.tournaments);
        if (remaining.length) store.setActiveTournament(remaining[remaining.length - 1]);
        else store.addTournament();
      }
      store.showMessage({
        title: translate('messages.saved'),
        text: translate('messages.tournamentSavedList'),
      });
    } catch (error) {
      if (ownMapUpdated) {
        try {
          await maps.update(store.user.uid, id, { status: previousStatus });
        } catch (rollbackError) {
          console.error('Error rolling back archive status:', rollbackError);
        }
      }
      console.error('Error archiving:', error);
      showError(error);
    }
  }

  async function removeSavedTournament(id) {
    const mapEntry = store.userTournamentMap[id];
    try {
      if (mapEntry?.role === 'owner') {
        await firebase.remove(firebase.ref(firebase.getDatabase(), `${store.user.uid}/tournaments/${id}`));
        await maps.remove(store.user.uid, id);
        delete store.userTournamentMap[id];
      } else {
        await maps.update(store.user.uid, id, {
          status: 'active',
          archiveStatusVersion: ARCHIVE_STATUS_VERSION,
        });
        if (mapEntry) mapEntry.status = 'active';
      }
      delete store.savedTournaments[id];
      store.savedTournamentIds = store.savedTournamentIds.filter((key) => key !== id);
      store.showMessage({
        title: translate('messages.removed'),
        text: translate('messages.tournamentRemovedSaved'),
      });
    } catch (error) {
      console.error('Error deleting data:', error);
      showError(error);
    }
  }

  function renameSavedTournament(id, name, ownerUid = store.user.uid) {
    return firebase.update(firebase.ref(firebase.getDatabase(), `${ownerUid}/tournaments/${id}`), { name }).then(() => {
      if (store.savedTournaments[id]) store.savedTournaments[id].name = name;
      if (store.userTournamentMap[id]) store.userTournamentMap[id].name = name;
      return maps.update(store.user.uid, id, { name });
    });
  }

  async function addCollaborator(email, role) {
    const normalizedEmail = email.trim().toLowerCase();
    const userSnapshot = await collaborators.findUserByEmail(normalizedEmail);
    const collaboratorUid = userSnapshot.exists() ? userSnapshot.val() : null;
    if (!collaboratorUid || typeof collaboratorUid !== 'string') {
      store.showMessage({
        title: translate('messages.error'),
        text: translate('messages.userNotFound'),
        type: 'error',
      });
      return false;
    }
    if (collaboratorUid === store.user.uid) {
      store.showMessage({
        title: translate('messages.error'),
        text: translate('messages.cannotAddSelf'),
        type: 'error',
      });
      return false;
    }

    const tournamentId = store.currentTournamentIndex;
    const tournament = store.currentTournament;
    const collaboratorData = { role, email: normalizedEmail };
    await collaborators.add(store.user.uid, tournamentId, collaboratorUid, collaboratorData);
    try {
      await maps.set(collaboratorUid, tournamentId, {
        status: 'active',
        role,
        ownerUid: store.user.uid,
        name: tournament.name,
        archiveStatusVersion: ARCHIVE_STATUS_VERSION,
      });
    } catch (error) {
      await collaborators.remove(store.user.uid, tournamentId, collaboratorUid);
      throw error;
    }
    if (!tournament.collaborators) tournament.collaborators = {};
    tournament.collaborators[collaboratorUid] = collaboratorData;
    store.showMessage({ title: translate('messages.saved'), text: translate('messages.collaboratorAdded') });
    return true;
  }

  async function removeCollaborator(collaboratorUid) {
    const tournamentId = store.currentTournamentIndex;
    await maps.remove(collaboratorUid, tournamentId);
    await collaborators.remove(store.user.uid, tournamentId, collaboratorUid);
    if (store.currentTournament.collaborators) delete store.currentTournament.collaborators[collaboratorUid];
  }

  async function leaveSharedTournament(tournamentId) {
    const mapEntry = store.userTournamentMap[tournamentId];
    if (!mapEntry || mapEntry.role === 'owner') return;
    await maps.remove(store.user.uid, tournamentId);
    delete store.userTournamentMap[tournamentId];
    delete store.tournaments[tournamentId];
    if (String(store.currentTournamentIndex) === String(tournamentId)) {
      const remaining = Object.keys(store.tournaments);
      if (remaining.length) store.setActiveTournament(remaining[remaining.length - 1]);
      else store.currentTournamentIndex = null;
    }
    store.unsubscribeTournament();
  }

  async function loadSharedTournament(tournamentId, ownerUid) {
    const operation = operationContext();
    const tournamentSnapshot = await firebase.get(
      firebase.ref(firebase.getDatabase(), `${ownerUid}/tournaments/${tournamentId}`),
    );
    if (!isCurrent(operation) || !tournamentSnapshot.exists()) return;
    store.tournaments[tournamentId] = normalizeTournamentRecord(tournamentSnapshot.val(), {
      id: tournamentId,
      ownerUid,
    });
    store.setActiveTournament(tournamentId);
    store.subscribeTournament();
    watchCollaboratorAccess(tournamentId, ownerUid);
  }

  function disposeAccessWatcher() {
    accessWatcherUnsubscribe?.();
    accessWatcherUnsubscribe = null;
  }

  function handleAccessRevoked(tournamentId) {
    if (accessRevokedHandled) return;
    accessRevokedHandled = true;
    store.unsubscribeTournament();
    accessRevokedHandled = true;
    delete store.tournaments[tournamentId];
    if (String(store.currentTournamentIndex) === String(tournamentId)) {
      const remaining = Object.keys(store.tournaments);
      if (remaining.length) store.setActiveTournament(remaining[remaining.length - 1]);
      else store.currentTournamentIndex = null;
    }
    if (store.userTournamentMap[tournamentId]) {
      delete store.userTournamentMap[tournamentId];
      maps.remove(store.user.uid, tournamentId);
    }
    accessRevokedHandled = true;
    store.showMessage({
      title: translate('messages.error'),
      text: translate('messages.accessRevoked'),
      type: 'error',
    });
    accessRevokedResetTimeout = setTimeout(() => {
      accessRevokedHandled = false;
      accessRevokedResetTimeout = null;
    }, 1000);
  }

  function watchCollaboratorAccess(tournamentId, ownerUid) {
    disposeAccessWatcher();
    const accessPath = `${ownerUid}/tournaments/${tournamentId}/collaborators/${store.user.uid}`;
    accessWatcherUnsubscribe = firebase.onValue(
      firebase.ref(firebase.getDatabase(), accessPath),
      (accessSnapshot) => {
        if (!accessSnapshot.exists() && store.tournaments[tournamentId]?._ownerUid) {
          disposeAccessWatcher();
          handleAccessRevoked(tournamentId);
        }
      },
      (error) => {
        if (error?.code?.toLowerCase() === 'permission_denied') handleAccessRevoked(tournamentId);
      },
    );
  }

  async function unarchiveTournament(id) {
    const mapEntry = store.userTournamentMap[id];
    if (!mapEntry) return false;
    const previousStatus = mapEntry.status;
    let ownMapUpdated = false;
    try {
      await maps.update(store.user.uid, id, { status: 'active', archiveStatusVersion: ARCHIVE_STATUS_VERSION });
      ownMapUpdated = true;
      const restoredTournament = store.savedTournaments[id];
      if (mapEntry.role === 'owner' && restoredTournament) {
        const updateData = { status: 'active', archiveStatusVersion: ARCHIVE_STATUS_VERSION };
        await Promise.all(adminCollaboratorUids(restoredTournament).map((uid) => maps.update(uid, id, updateData)));
        store.tournaments[id] = normalizeTournamentRecord(restoredTournament, { id });
      }
      Object.assign(mapEntry, { status: 'active', archiveStatusVersion: ARCHIVE_STATUS_VERSION });
      delete store.savedTournaments[id];
      store.savedTournamentIds = store.savedTournamentIds.filter((key) => key !== id);
      store.showMessage({ title: translate('messages.saved'), text: translate('messages.tournamentUnarchived') });
      return true;
    } catch (error) {
      if (ownMapUpdated) {
        try {
          await maps.update(store.user.uid, id, { status: previousStatus });
        } catch (rollbackError) {
          console.error('Error rolling back restore status:', rollbackError);
        }
      }
      console.error('Error restoring tournament:', error);
      showError(error);
      return false;
    }
  }

  function dispose() {
    generation += 1;
    disposeAccessWatcher();
    clearTimeout(accessRevokedResetTimeout);
    accessRevokedResetTimeout = null;
    accessRevokedHandled = false;
  }

  return {
    addCollaborator,
    addToSaved,
    dispose,
    fetchSavedTournaments,
    getTournaments,
    handleAccessRevoked,
    leaveSharedTournament,
    loadSharedTournament,
    removeCollaborator,
    removeSavedTournament,
    renameSavedTournament,
    unarchiveTournament,
    watchCollaboratorAccess,
  };
}
