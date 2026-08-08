import { getDatabase, onValue, ref, set, update } from 'firebase/database';
import {
  getTournamentMain,
  getTournamentStorageTarget,
  isTournamentEnvelope,
  normalizeTournamentRecord,
  replaceTournamentGroup,
} from '@/services/tournament-record';

const MAIN_PATHS = [
  'system',
  'teams',
  'games',
  'groups',
  'groupSchedule',
  'groupsScheme',
  'preferences',
  'roundIsActive',
  'roundTimer',
  'tournamentIsFinished',
  'playOff',
  'playoff',
  'playOffBracket',
  'playOffStage',
  'cadrage',
  'barrage',
  'eliminationRound',
  'streamPresets',
  'ranking',
  'tirParticipants',
  'tirRound',
  'tirR2Participants',
  'tirTiebreakerCount',
  'tirTiebreakerActive',
  'tirTiebreakerParticipantIds',
  'tirStarted',
  'tirConfig',
  'teamPlayoff',
  'tirPlayoff',
];

const LEGACY_SIMPLE_PATHS = [
  'tirParticipants',
  'tirRound',
  'tirR2Participants',
  'tirTiebreakerCount',
  'tirTiebreakerActive',
  'tirTiebreakerParticipantIds',
  'roundTimer',
  'tournamentIsFinished',
  'tournamentMessage',
  'teams',
  'groups',
  'groupSchedule',
  'groupsScheme',
  'preferences',
  'streamPresets',
  'playOff',
  'playoff',
  'playOffStage',
  'barrage',
  'tirStarted',
  'tirConfig',
  'activeGroup',
  'groupB',
  'ranking',
];

export function serializeFirebaseValue(value) {
  return value != null && typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : value;
}

function permissionDenied(error) {
  return error?.code?.toLowerCase() === 'permission_denied';
}

function mergeMatchCollection(localMatches, remoteMatches, keyForIndex, recentSyncs) {
  if (!Array.isArray(localMatches) || !Array.isArray(remoteMatches)) return;
  remoteMatches.forEach((remoteMatch, index) => {
    if (recentSyncs.has(keyForIndex(index))) return;
    const localMatch = localMatches[index];
    if (!localMatch) {
      localMatches[index] = remoteMatch;
      return;
    }
    Object.assign(localMatch, remoteMatch);
  });
}

export function mergeGames(local, remote, { prefix = '', recentSyncs = new Set() } = {}) {
  if (!remote.games || !local.games) return;
  const activeRound = local.games.length - 1;
  mergeMatchCollection(
    local.games[activeRound],
    remote.games?.[activeRound],
    (index) => `${prefix}games:${activeRound}/${index}`,
    recentSyncs,
  );
}

export function mergeCadrage(local, remote, { prefix = '', recentSyncs = new Set() } = {}) {
  mergeMatchCollection(local.cadrage, remote.cadrage, (index) => `${prefix}cadrage:${index}`, recentSyncs);
}

export function mergeBracketPlayoff(local, remote, { prefix = '', recentSyncs = new Set() } = {}) {
  const localBracket = local.playOffBracket;
  const remoteBracket = remote.playOffBracket;
  if (!remoteBracket || !localBracket) return;

  if (remoteBracket.stages && localBracket.stages) {
    remoteBracket.stages.forEach((remoteStage, stageIndex) => {
      if (!localBracket.stages[stageIndex]) {
        localBracket.stages[stageIndex] = remoteStage;
        return;
      }
      mergeMatchCollection(
        localBracket.stages[stageIndex].teams,
        remoteStage.teams,
        (gameIndex) => `${prefix}playOffBracket:stages/${stageIndex}/teams/${gameIndex}`,
        recentSyncs,
      );
    });
  }
  if (remoteBracket.thirdPlace) {
    if (!localBracket.thirdPlace) localBracket.thirdPlace = remoteBracket.thirdPlace;
    else if (!recentSyncs.has(`${prefix}playOffBracket:thirdPlace`)) {
      Object.assign(localBracket.thirdPlace, remoteBracket.thirdPlace);
    }
  }
  if (remoteBracket.format === 'double') {
    ['champion', 'runnerUp', 'placements', 'grandFinalMode', 'participantCount', 'size'].forEach((field) => {
      if (remoteBracket[field] !== undefined) localBracket[field] = remoteBracket[field];
    });
  }
}

function mergePlayoff(localPlayoff, remotePlayoff, namespace, recentSyncs) {
  if (!remotePlayoff || !localPlayoff) return;
  if (remotePlayoff.rounds) {
    if (!localPlayoff.rounds) localPlayoff.rounds = remotePlayoff.rounds;
    else {
      while (localPlayoff.rounds.length < remotePlayoff.rounds.length) {
        localPlayoff.rounds.push(remotePlayoff.rounds[localPlayoff.rounds.length]);
      }
      remotePlayoff.rounds.forEach((remoteRound, roundIndex) => {
        if (!localPlayoff.rounds[roundIndex]) {
          localPlayoff.rounds[roundIndex] = remoteRound;
          return;
        }
        mergeMatchCollection(
          localPlayoff.rounds[roundIndex].matches,
          remoteRound.matches,
          (matchIndex) => `${namespace}:rounds/${roundIndex}/matches/${matchIndex}`,
          recentSyncs,
        );
      });
    }
  }
  ['final', 'thirdPlace'].forEach((field) => {
    if (!remotePlayoff[field]) return;
    if (!localPlayoff[field]) localPlayoff[field] = remotePlayoff[field];
    else if (!recentSyncs.has(`${namespace}:${field}`)) Object.assign(localPlayoff[field], remotePlayoff[field]);
  });
  if (remotePlayoff.qualified) localPlayoff.qualified = remotePlayoff.qualified;
  if (remotePlayoff.size) localPlayoff.size = remotePlayoff.size;
}

export function mergeTeamPlayoff(local, remote, { prefix = '', recentSyncs = new Set() } = {}) {
  mergePlayoff(local.teamPlayoff, remote.teamPlayoff, `${prefix}teamPlayoff`, recentSyncs);
}

export function mergeTirPlayoff(local, remote, { prefix = '', recentSyncs = new Set() } = {}) {
  mergePlayoff(local.tirPlayoff, remote.tirPlayoff, `${prefix}tirPlayoff`, recentSyncs);
}

function shouldKeepLocalTimer(localTimer, remoteTimer, now) {
  if (remoteTimer?.timerStatus !== 'ended' || localTimer?.timerStatus !== 'running') return false;
  return new Date(localTimer.timerEndsAt).getTime() > now();
}

export function createTournamentSyncRuntime(store, dependencies = {}) {
  const firebase = {
    getDatabase: dependencies.getDatabase || getDatabase,
    onValue: dependencies.onValue || onValue,
    ref: dependencies.ref || ref,
    set: dependencies.set || set,
    update: dependencies.update || update,
  };
  const now = dependencies.now || Date.now;
  const recentSyncPaths = new Set();
  const recentMatchSyncs = new Set();
  const matchTimeouts = new Map();
  let messageTimeout = null;
  let tournamentUnsubscribers = [];
  let generation = 0;

  function context() {
    const tournamentId = store.currentTournamentIndex;
    const userUid = store.user?.uid;
    const tournament = store.tournaments[tournamentId];
    return {
      tournament,
      tournamentId,
      userUid,
      ownerUid: tournament?._ownerUid || userUid,
    };
  }

  function notifyRevoked(error, ownerUid, userUid, tournamentId) {
    if (permissionDenied(error) && ownerUid !== userUid) store._handleAccessRevoked(tournamentId);
  }

  function syncPath(path, data) {
    const { ownerUid, tournamentId, userUid } = context();
    if (!userUid || !tournamentId) return undefined;
    const writeGeneration = generation;
    recentSyncPaths.add(path);
    const fullPath = `${ownerUid}/tournaments/${tournamentId}/${path}`;
    return firebase.set(firebase.ref(firebase.getDatabase(), fullPath), serializeFirebaseValue(data)).catch((error) => {
      recentSyncPaths.delete(path);
      if (generation === writeGeneration) notifyRevoked(error, ownerUid, userUid, tournamentId);
      console.error('Error updating path:', path, error);
    });
  }

  function syncPaths(pathValues) {
    const { ownerUid, tournamentId, userUid } = context();
    if (!userUid || !tournamentId) return undefined;

    const updates = Object.fromEntries(
      Object.entries(pathValues || {})
        .filter(([path, value]) => path && value !== undefined)
        .map(([path, value]) => [path, serializeFirebaseValue(value)]),
    );
    if (!Object.keys(updates).length) return Promise.resolve();

    const writeGeneration = generation;
    const basePath = `${ownerUid}/tournaments/${tournamentId}`;
    return firebase.update(firebase.ref(firebase.getDatabase(), basePath), updates).catch((error) => {
      if (generation === writeGeneration) notifyRevoked(error, ownerUid, userUid, tournamentId);
      console.error('Error updating tournament paths:', Object.keys(updates), error);
      throw error;
    });
  }

  function syncMatchDebounced(namespace, key, data) {
    const scheduledContext = context();
    if (!scheduledContext.userUid || !scheduledContext.tournamentId) return;
    const timeoutKey = `${namespace}_${key}`;
    const syncKey = `${namespace}:${key}`;
    const scheduledGeneration = generation;
    recentMatchSyncs.add(syncKey);
    clearTimeout(matchTimeouts.get(timeoutKey));
    matchTimeouts.set(
      timeoutKey,
      setTimeout(() => {
        matchTimeouts.delete(timeoutKey);
        if (generation !== scheduledGeneration) {
          recentMatchSyncs.delete(syncKey);
          return;
        }
        const { ownerUid, tournamentId, userUid } = scheduledContext;
        const path = `${ownerUid}/tournaments/${tournamentId}/${namespace}/${key}`;
        firebase
          .set(firebase.ref(firebase.getDatabase(), path), serializeFirebaseValue(data))
          .then(() => recentMatchSyncs.delete(syncKey))
          .catch((error) => {
            recentMatchSyncs.delete(syncKey);
            notifyRevoked(error, ownerUid, userUid, tournamentId);
            console.error(`Error updating ${namespace}/${key}:`, error);
          });
      }, 200),
    );
  }

  function doSync() {
    const { tournament, tournamentId, userUid } = context();
    if (!userUid || !tournamentId || tournament?._ownerUid) return undefined;
    const writeGeneration = generation;
    return firebase
      .update(firebase.ref(firebase.getDatabase(), `${userUid}/tournaments/`), {
        [tournamentId]: serializeFirebaseValue(tournament),
      })
      .catch((error) => {
        if (generation !== writeGeneration) return;
        console.error('Error updating specific tournament:', error);
        store.showMessage({
          title: dependencies.translate?.('messages.error') || 'messages.error',
          text: dependencies.translate?.('messages.failedSaving') || 'messages.failedSaving',
          type: 'error',
        });
      });
  }

  function mergeOptions() {
    const { prefix } = getTournamentStorageTarget(context().tournament, context().tournament?.activeGroup);
    return { prefix, recentSyncs: store._recentMatchSyncs || recentMatchSyncs };
  }

  function applyCompetitionValue(path, value, localCompetition) {
    if (!localCompetition || value === undefined) return;
    if (path === 'games') {
      if (value && localCompetition.games && localCompetition.roundIsActive) {
        mergeGames(localCompetition, { games: value }, mergeOptions());
      }
      return;
    }
    if (path === 'cadrage') {
      if (value && localCompetition.cadrage) mergeCadrage(localCompetition, { cadrage: value }, mergeOptions());
      return;
    }
    if (path === 'playOffBracket') {
      if (value && localCompetition.playOffBracket) {
        mergeBracketPlayoff(localCompetition, { playOffBracket: value }, mergeOptions());
      }
      return;
    }
    if (path === 'tirPlayoff' || path === 'teamPlayoff') {
      if (!localCompetition[path]) localCompetition[path] = value;
      else if (path === 'tirPlayoff') mergeTirPlayoff(localCompetition, { [path]: value }, mergeOptions());
      else mergeTeamPlayoff(localCompetition, { [path]: value }, mergeOptions());
      return;
    }
    if (path === 'roundIsActive' && !value && localCompetition.roundIsActive) {
      if (!store._roundActivatedAt || now() - store._roundActivatedAt > 3000) localCompetition[path] = value;
      return;
    }
    if (path === 'roundTimer' && shouldKeepLocalTimer(localCompetition.roundTimer, value, now)) return;
    localCompetition[path] = value;
  }

  function unsubscribeSubscriptions() {
    tournamentUnsubscribers.forEach((unsubscribe) => unsubscribe());
    tournamentUnsubscribers = [];
  }

  function subscribeTournament() {
    unsubscribeSubscriptions();
    const { ownerUid, tournament, tournamentId, userUid } = context();
    if (!userUid || !tournamentId) return;
    const subscriptionGeneration = generation;
    const basePath = `${ownerUid}/tournaments/${tournamentId}`;

    const subscribePath = (path, handler) => {
      const unsubscribe = firebase.onValue(
        firebase.ref(firebase.getDatabase(), `${basePath}/${path}`),
        (snapshot) => {
          if (generation !== subscriptionGeneration || store.currentTournamentIndex !== tournamentId) return;
          if (recentSyncPaths.has(path)) {
            recentSyncPaths.delete(path);
            return;
          }
          const local = store.tournaments[tournamentId];
          if (local) handler(snapshot.val(), local);
        },
        (error) => notifyRevoked(error, ownerUid, userUid, tournamentId),
      );
      if (typeof unsubscribe === 'function') tournamentUnsubscribers.push(unsubscribe);
    };

    if (isTournamentEnvelope(tournament)) {
      const mainPrefix = getTournamentStorageTarget(tournament, 'A').prefix;
      const groupBPrefix = getTournamentStorageTarget(tournament, 'B', { allowFallback: false }).prefix;
      MAIN_PATHS.forEach((path) => {
        subscribePath(`${mainPrefix}${path}`, (value) => {
          applyCompetitionValue(path, value, getTournamentMain(store.tournaments[tournamentId]));
        });
      });
      subscribePath(groupBPrefix.slice(0, -1), (value, local) => {
        if (value == null) return;
        const recentSubPaths = [...recentSyncPaths].filter((path) => path.startsWith(groupBPrefix));
        if (recentSubPaths.length) {
          recentSubPaths.forEach((path) => recentSyncPaths.delete(path));
          return;
        }
        const localGroupB = getTournamentStorageTarget(local, 'B', { allowFallback: false }).data;
        if (localGroupB) Object.assign(localGroupB, value);
        else {
          store.tournaments[tournamentId] = normalizeTournamentRecord(replaceTournamentGroup(local, 'B', value), {
            id: tournamentId,
            ownerUid: local._ownerUid,
          });
        }
      });
      ['activeGroup', 'tournamentMessage', 'name'].forEach((path) => {
        subscribePath(path, (value, local) => {
          if (value !== undefined) local[path] = value;
        });
      });
      return;
    }

    ['games', 'cadrage', 'playOffBracket', 'tirPlayoff', 'teamPlayoff'].forEach((path) => {
      subscribePath(path, (value, local) => applyCompetitionValue(path, value, local));
    });
    LEGACY_SIMPLE_PATHS.forEach((path) => {
      subscribePath(path, (value, local) => {
        if (value === undefined || shouldKeepLocalTimer(local.roundTimer, value, now)) return;
        local[path] = value;
      });
    });
    subscribePath('roundIsActive', (value, local) => applyCompetitionValue('roundIsActive', value, local));
  }

  function scheduleTournamentMessage(message) {
    clearTimeout(messageTimeout);
    const tournament = context().tournament;
    if (tournament && message !== undefined) tournament.tournamentMessage = message;
    messageTimeout = setTimeout(
      () => store._syncPath('tournamentMessage', message ?? tournament?.tournamentMessage),
      300,
    );
  }

  function cancelPendingWrites() {
    generation += 1;
    matchTimeouts.forEach((timeout) => clearTimeout(timeout));
    matchTimeouts.clear();
    clearTimeout(messageTimeout);
    messageTimeout = null;
    recentMatchSyncs.clear();
    recentSyncPaths.clear();
  }

  function dispose() {
    unsubscribeSubscriptions();
    cancelPendingWrites();
  }

  return {
    recentMatchSyncs,
    recentSyncPaths,
    cancelPendingWrites,
    dispose,
    doSync,
    mergeBracketPlayoff: (local, remote) => mergeBracketPlayoff(local, remote, mergeOptions()),
    mergeCadrage: (local, remote) => mergeCadrage(local, remote, mergeOptions()),
    mergeGames: (local, remote) => mergeGames(local, remote, mergeOptions()),
    mergeTeamPlayoff: (local, remote) => mergeTeamPlayoff(local, remote, mergeOptions()),
    mergeTirPlayoff: (local, remote) => mergeTirPlayoff(local, remote, mergeOptions()),
    scheduleTournamentMessage,
    subscribeTournament,
    syncMatchDebounced,
    syncPath,
    syncPaths,
  };
}
