import { defineStore } from 'pinia';
import { tournamentNames } from '@/helpers';
import { get, getDatabase, ref, set, remove, update, onValue } from 'firebase/database';
import { database } from '@/firebase';
import { userMapService, collaboratorService } from '@/services/db';
import i18n from '@/i18n';
import {
  createTournamentData,
  createTournamentRecord,
  getActiveTournamentGroup,
  getTournamentMain,
  getTournamentMetadata,
  getTournamentStorageTarget,
  isTournamentEnvelope,
  normalizeTournamentRecord,
} from '@/services/tournament-record';
import {
  createRoundTimer,
  endRoundTimerState,
  pauseRoundTimerState,
  restartRoundTimerState,
  resumeRoundTimerState,
} from '@/services/round-timer';
import { createTournamentSyncRuntime } from '@/services/tournament-sync';

export const SUPER_ADMIN_EMAIL = 'nemo15.alex@gmail.com';
const ARCHIVE_STATUS_VERSION = 1;

function getTournamentSyncRuntime(store) {
  if (!store._tournamentSyncRuntime) {
    store._tournamentSyncRuntime = createTournamentSyncRuntime(store, {
      translate: (key) => i18n.global.t(key),
    });
    // Temporary aliases retain compatibility for code/tests that inspect the
    // old runtime-only fields while the runtime remains their sole owner.
    if (!store._recentMatchSyncs) store._recentMatchSyncs = store._tournamentSyncRuntime.recentMatchSyncs;
    if (!store._recentSyncPaths) store._recentSyncPaths = store._tournamentSyncRuntime.recentSyncPaths;
  }
  return store._tournamentSyncRuntime;
}

export const useMainStore = defineStore('main', {
  state: () => ({
    tournaments: {},
    message: {
      show: false,
      type: 'success',
      title: 'Message',
      text: '',
    },
    userTournamentMap: {},
    savedTournaments: {},
    savedTournamentIds: [],
    currentTournamentIndex: null,
    isAdmin: false,
    user: false,
    _activePlayoffMatchPath: null,
    _activeTeamPlayoffMatchPath: null,
    _activeGameMatchPath: null,
    _activeBracketMatchPath: null,
    _activeCadrageIndex: null,
  }),
  getters: {
    currentTournament: (state) => state.tournaments[state.currentTournamentIndex],
    activeTournament() {
      return getActiveTournamentGroup(this.currentTournament);
    },
    isNewFormat() {
      return isTournamentEnvelope(this.currentTournament);
    },
    currentRole() {
      const tournament = this.currentTournament;
      if (!tournament?._ownerUid) return 'owner';
      const mapEntry = this.userTournamentMap[this.currentTournamentIndex];
      return mapEntry?.role || 'scorer';
    },
    isOwnerOrAdmin() {
      return this.currentRole === 'owner' || this.currentRole === 'admin';
    },
    allScoresFilled() {
      const t = this.activeTournament;
      if (!t) return false;
      const activeRound = t.games?.length ? (t.roundIsActive ? t.games.length : t.games.length + 1) : 1;
      const games = t.games?.[activeRound - 1];
      if (!games) return false;
      return games.every(
        (g) => g.team_1_score !== null && g.team_1_score !== '' && g.team_2_score !== null && g.team_2_score !== '',
      );
    },
  },
  actions: {
    _getTournamentOwnerUid() {
      const tournament = this.tournaments[this.currentTournamentIndex];
      return tournament?._ownerUid || this.user.uid;
    },
    _getTarget() {
      const tournament = this.tournaments[this.currentTournamentIndex];
      return getTournamentStorageTarget(tournament, tournament?.activeGroup);
    },
    setActiveGroup(group) {
      const tournament = this.tournaments[this.currentTournamentIndex];
      if (!tournament) return;
      tournament.activeGroup = group;
      this._syncPath('activeGroup', group);
    },
    initTournamentB(teams, mode = 'swiss') {
      const tournament = this.tournaments[this.currentTournamentIndex];
      if (!tournament) return;
      tournament.tournamentB = createTournamentData({
        isTournamentB: true,
        system: mode,
        teams: teams.map((t) => ({ ...t })),
      });
      tournament.activeGroup = 'A';
      this._syncPath('tournamentB', tournament.tournamentB);
      this._syncPath('activeGroup', 'A');
    },
    removeTournamentB() {
      const tournament = this.tournaments[this.currentTournamentIndex];
      if (!tournament || !tournament.tournamentB) return;
      tournament.tournamentB = null;
      tournament.activeGroup = 'A';
      this._syncPath('tournamentB', null);
      this._syncPath('activeGroup', 'A');
    },
    addTournamentBTeams(newTeams) {
      const tournament = this.tournaments[this.currentTournamentIndex];
      const { data: target, prefix } = getTournamentStorageTarget(tournament, 'B', { allowFallback: false });
      if (!target) return;
      newTeams.forEach((t) => {
        const existing = target.teams.find((bt) => bt.title === t.title);
        if (!existing) target.teams.push({ ...t });
      });
      this._syncPath(`${prefix}teams`, target.teams);
    },
    setTournamentBEliminationRound(eliminationData) {
      const tournament = this.tournaments[this.currentTournamentIndex];
      const { data: target, prefix } = getTournamentStorageTarget(tournament, 'B', { allowFallback: false });
      if (!target) return;
      target.eliminationRound = eliminationData;
      this._syncPath(`${prefix}eliminationRound`, eliminationData);
    },
    syncEliminationGames() {
      const tournament = this.tournaments[this.currentTournamentIndex];
      const { data: target, prefix } = getTournamentStorageTarget(tournament, 'B', { allowFallback: false });
      if (!target?.eliminationRound) return;
      this._syncPath(`${prefix}eliminationRound/games`, target.eliminationRound.games);
    },
    completeTournamentBElimination() {
      const tournament = this.tournaments[this.currentTournamentIndex];
      const { data: target, prefix } = getTournamentStorageTarget(tournament, 'B', { allowFallback: false });
      if (!target?.eliminationRound) return;
      const elim = target.eliminationRound;
      elim.completed = true;
      elim.games.forEach((game) => {
        const loserTitle = Number(game.team_1_score) > Number(game.team_2_score) ? game.team_2 : game.team_1;
        const loser = target.teams.find((t) => t.title === loserTitle);
        if (loser) loser.eliminated = true;
      });
      this._syncPath(`${prefix}eliminationRound`, elim);
      this._syncPath(`${prefix}teams`, target.teams);
    },
    toggleWithdrawn(teamTitle) {
      const { data, prefix } = this._getTarget();
      if (!data) return;
      const team = data.teams.find((t) => t.title === teamTitle);
      if (team) {
        team.withdrawn = !team.withdrawn;
        this._syncPath(`${prefix}teams`, data.teams);
      }
    },
    _syncPath(path, data) {
      return getTournamentSyncRuntime(this).syncPath(path, data);
    },
    _syncMatchDebounced(namespace, key, data) {
      getTournamentSyncRuntime(this).syncMatchDebounced(namespace, key, data);
    },
    _doSync() {
      return getTournamentSyncRuntime(this).doSync();
    },
    setActivePlayoffMatchPath(path) {
      this._activePlayoffMatchPath = path;
    },
    setActiveTeamPlayoffMatchPath(path) {
      this._activeTeamPlayoffMatchPath = path;
    },
    setActiveGameMatchPath(path) {
      this._activeGameMatchPath = path;
    },
    setActiveBracketMatchPath(path) {
      this._activeBracketMatchPath = path;
    },
    setActiveCadrageIndex(index) {
      this._activeCadrageIndex = index;
    },
    syncGameMatch(roundIndex, gameIndex, gameData) {
      const { prefix } = this._getTarget();
      this._syncMatchDebounced(`${prefix}games`, `${roundIndex}/${gameIndex}`, gameData);
    },
    syncCadrageMatch(gameIndex, gameData) {
      const { prefix } = this._getTarget();
      this._syncMatchDebounced(`${prefix}cadrage`, gameIndex, gameData);
    },
    syncBracketMatch(matchPath, matchData) {
      const { prefix } = this._getTarget();
      this._syncMatchDebounced(`${prefix}playOffBracket`, matchPath, matchData);
    },
    syncTeamPlayoffMatch(matchPath, matchData) {
      const { data, prefix } = this._getTarget();
      if (matchPath) {
        this._syncMatchDebounced(`${prefix}teamPlayoff`, matchPath, matchData);
      } else {
        this._syncPath(`${prefix}teamPlayoff`, data?.teamPlayoff);
      }
    },
    syncTirPlayoffMatch(matchPath, matchData) {
      const { data, prefix } = this._getTarget();
      if (matchPath) {
        this._syncMatchDebounced(`${prefix}tirPlayoff`, matchPath, matchData);
      } else {
        this._syncPath(`${prefix}tirPlayoff`, data?.tirPlayoff);
      }
    },
    subscribeTournament() {
      getTournamentSyncRuntime(this).subscribeTournament();
    },
    _mergeTirPlayoff(local, remote) {
      getTournamentSyncRuntime(this).mergeTirPlayoff(local, remote);
    },
    _mergeTeamPlayoff(local, remote) {
      getTournamentSyncRuntime(this).mergeTeamPlayoff(local, remote);
    },
    _mergeGames(local, remote) {
      getTournamentSyncRuntime(this).mergeGames(local, remote);
    },
    _mergeCadrage(local, remote) {
      getTournamentSyncRuntime(this).mergeCadrage(local, remote);
    },
    _mergeBracketPlayoff(local, remote) {
      getTournamentSyncRuntime(this).mergeBracketPlayoff(local, remote);
    },
    unsubscribeTournament() {
      getTournamentSyncRuntime(this).dispose();
      if (this._accessWatcherUnsub) {
        this._accessWatcherUnsub();
        this._accessWatcherUnsub = null;
      }
    },
    async getTournaments({ routeQueryT } = {}) {
      const mapSnapshot = await userMapService.getAll(this.user.uid);
      const dbRef = ref(database, `${this.user.uid}/tournaments/`);
      const snapshot = await get(dbRef);

      if (mapSnapshot.exists()) {
        this.userTournamentMap = mapSnapshot.val();
      } else {
        this.userTournamentMap = {};
        const migratedMap = {};
        if (snapshot.exists()) {
          const allTournaments = snapshot.val();
          Object.keys(allTournaments).forEach((id) => {
            const competition = getTournamentMain(allTournaments[id]);
            migratedMap[id] = {
              status: competition?.tournamentIsFinished ? 'archived' : 'active',
              role: 'owner',
              name: getTournamentMetadata(allTournaments[id], { name: 'Tournament' }).name,
            };
          });
        }
        const savedRef = ref(database, `${this.user.uid}/saved/`);
        const savedSnapshot = await get(savedRef);
        if (savedSnapshot.exists()) {
          Object.keys(savedSnapshot.val()).forEach((id) => {
            if (!migratedMap[id]) {
              migratedMap[id] = {
                status: 'archived',
                role: 'owner',
                name: savedSnapshot.val()[id].name || 'Tournament',
              };
            }
          });
        }
        if (Object.keys(migratedMap).length) {
          this.userTournamentMap = migratedMap;
          const db = getDatabase();
          set(ref(db, `users/${this.user.uid}/tournaments`), migratedMap);
        }
      }

      const ownActive = Object.entries(this.userTournamentMap)
        .filter(([, entry]) => entry.role === 'owner' && entry.status !== 'archived')
        .map(([id]) => id);

      if (snapshot.exists()) {
        const all = snapshot.val();
        const active = {};
        if (ownActive.length) {
          ownActive.forEach((id) => {
            if (all[id]) active[id] = all[id];
          });
        } else if (!Object.keys(this.userTournamentMap).length) {
          Object.assign(active, all);
        }
        this.setTournaments(active, { routeQueryT });
      } else {
        this.setTournaments({}, { routeQueryT });
      }

      this.savedTournamentIds = Object.entries(this.userTournamentMap)
        .filter(([, entry]) => entry.status === 'archived')
        .map(([id]) => id);
    },
    async fetchSavedTournaments() {
      const archivedEntries = Object.entries(this.userTournamentMap).filter(
        ([, entry]) =>
          (entry.role === 'owner' && entry.status === 'archived') ||
          (entry.role === 'admin' &&
            entry.ownerUid &&
            (entry.status === 'archived' || entry.archiveStatusVersion !== ARCHIVE_STATUS_VERSION)),
      );

      if (!archivedEntries.length) {
        this.setSavedTournaments({});
        this.savedTournamentIds = [];
        return;
      }

      const db = getDatabase();
      const results = {};
      const migrated = [];
      await Promise.all(
        archivedEntries.map(async ([id, entry]) => {
          const ownerUid = entry.role === 'owner' ? this.user.uid : entry.ownerUid;
          let snapshot = await get(ref(db, `${ownerUid}/tournaments/${id}`));
          const tournamentData = snapshot.exists() ? snapshot.val() : null;
          const competition = getTournamentMain(tournamentData);
          const hasTournamentData = tournamentData && (competition?.teams || competition?.tirParticipants);

          // Only owners can have data in the legacy saved/ location. Shared
          // tournaments always remain under their owner's tournaments/ path.
          if (entry.role === 'owner' && !hasTournamentData) {
            const savedSnapshot = await get(ref(db, `${this.user.uid}/saved/${id}`));
            if (savedSnapshot.exists()) {
              const data = savedSnapshot.val();
              await set(ref(db, `${this.user.uid}/tournaments/${id}`), data);
              await remove(ref(db, `${this.user.uid}/saved/${id}`));
              results[id] = data;
              migrated.push({ id, name: getTournamentMetadata(data, { name: id }).name });
              return;
            }
          }

          if (!snapshot.exists()) return;

          const isFinished = !!getTournamentMain(tournamentData)?.tournamentIsFinished;
          const shouldMigrateAdminArchive =
            entry.role === 'admin' &&
            entry.status !== 'archived' &&
            entry.archiveStatusVersion !== ARCHIVE_STATUS_VERSION &&
            isFinished;

          if (entry.status !== 'archived' && !shouldMigrateAdminArchive) return;

          if (shouldMigrateAdminArchive) {
            const archiveUpdate = { status: 'archived', archiveStatusVersion: ARCHIVE_STATUS_VERSION };
            await userMapService.update(this.user.uid, id, archiveUpdate);
            Object.assign(entry, archiveUpdate);
          }

          results[id] = tournamentData;
        }),
      );
      if (migrated.length) {
        console.warn(`[Migration] Moved ${migrated.length} tournament(s) from saved/ to tournaments/:`, migrated);
      }
      this.setSavedTournaments(results);
      this.savedTournamentIds = Object.keys(results);
    },
    savePreferences() {
      const { data, prefix } = this._getTarget();
      this._syncPath(`${prefix}preferences`, data.preferences);
    },
    syncStreamPresets() {
      const { data, prefix } = this._getTarget();
      this._syncPath(`${prefix}streamPresets`, data.streamPresets);
    },
    shuffleLanesStore(games) {
      const { data, prefix } = this._getTarget();
      data.games[data.games.length - 1] = games;
      data.teams.forEach((team) => {
        if (team.lanes) team.lanes.pop();
      });
      this.saveLanesToTeams(games);
      this._syncPath(`${prefix}games`, data.games);
      this._syncPath(`${prefix}teams`, data.teams);
    },
    swapLanesStore({ roundIndex, indexA, indexB }) {
      const { data, prefix } = this._getTarget();
      const games = data.games[roundIndex];
      const temp = games[indexA];
      games[indexA] = games[indexB];
      games[indexB] = temp;
      const tempLane = games[indexA].lane;
      games[indexA].lane = games[indexB].lane;
      games[indexB].lane = tempLane;
      data.teams.forEach((team) => {
        if (team.lanes) team.lanes.pop();
      });
      this.saveLanesToTeams(games);
      this._syncPath(`${prefix}games`, data.games);
      this._syncPath(`${prefix}teams`, data.teams);
    },
    saveLanesToTeams(games) {
      const { data } = this._getTarget();
      games.map((game) => {
        data.teams.map((team) => {
          if (!team.lanes) team.lanes = [];
          if (team.title === game.team_1 && game.lane != null) {
            team.lanes.push(game.lane);
          }
          if (team.title === game.team_2 && game.lane != null) {
            team.lanes.push(game.lane);
          }
        });
      });
    },
    setTournaments(tournaments, { routeQueryT } = {}) {
      this.tournaments = Object.fromEntries(
        Object.entries(tournaments).map(([key, tournament]) => [
          key,
          normalizeTournamentRecord(tournament, { id: key }),
        ]),
      );
      if (!Object.keys(this.tournaments).length) {
        this.addTournament();
      }
      const pinned = routeQueryT || localStorage.getItem('petanqueDrawPinned');
      if (pinned && this.tournaments[pinned]) {
        this.setActiveTournament(pinned);
      } else if (pinned && this.userTournamentMap[pinned] && this.userTournamentMap[pinned].role !== 'owner') {
        const entry = this.userTournamentMap[pinned];
        this.loadSharedTournament(pinned, entry.ownerUid);
      } else {
        this.setActiveTournament(
          this.tournaments[Object.keys(this.tournaments)[Object.keys(this.tournaments).length - 1]].id,
        );
      }
    },
    setSavedTournaments(tournaments) {
      this.savedTournaments = Object.fromEntries(
        Object.entries(tournaments).map(([key, tournament]) => {
          const entry = this.userTournamentMap[key];
          const ownerUid = entry?.role === 'admin' ? entry.ownerUid : undefined;
          return [key, normalizeTournamentRecord(tournament, { id: key, ownerUid })];
        }),
      );
    },
    setTournamentIdFromPortal(value) {
      this.tournaments[this.currentTournamentIndex].portalIdTournament = value;
      this._syncPath('portalIdTournament', value);
    },
    setTournamentInfoFromPortal(info) {
      this.tournaments[this.currentTournamentIndex].name = info.name;
      this.tournaments[this.currentTournamentIndex].date = info.start_date;
      this._syncPath('name', info.name);
      this._syncPath('date', info.start_date);
    },
    loginUser(value) {
      const previousUid = this.user?.uid;
      const nextUid = value?.uid;
      if (previousUid && previousUid !== nextUid) {
        this.unsubscribeTournament();
        this.tournaments = {};
        this.userTournamentMap = {};
        this.savedTournaments = {};
        this.savedTournamentIds = [];
        this.currentTournamentIndex = null;
        this.isAdmin = false;
      }
      this.user = value;
      if (value && value.email && value.uid) {
        const db = getDatabase();
        const emailKey = value.email.replace(/\./g, ',');
        set(ref(db, `emails/${emailKey}`), value.uid);
      }
    },
    setActiveTournament(index) {
      if (this.currentTournamentIndex !== null && String(this.currentTournamentIndex) !== String(index)) {
        this.unsubscribeTournament();
      }
      this.currentTournamentIndex = index;
    },
    changeTournamentName(name) {
      this.tournaments[this.currentTournamentIndex].name = name;
      this._syncPath('name', name);
      if (this.userTournamentMap[this.currentTournamentIndex]) {
        this.userTournamentMap[this.currentTournamentIndex].name = name;
        userMapService.update(this.user.uid, this.currentTournamentIndex, { name });
      }
    },
    removeTournament() {
      const db = getDatabase();
      const tournamentId = this.currentTournamentIndex;
      const dataRef = ref(db, `${this.user.uid}/tournaments/${tournamentId}`);
      const tokensRef = ref(db, `tokens/${this.user.uid}/${tournamentId}`);

      this.unsubscribeTournament();

      remove(tokensRef).catch((error) => {
        console.error('Error deleting data:', error);
      });

      remove(dataRef)
        .then(() => {
          userMapService.remove(this.user.uid, tournamentId);
          delete this.userTournamentMap[tournamentId];
          delete this.tournaments[tournamentId];
          if (Object.keys(this.tournaments).length >= 1) {
            this.setActiveTournament(Object.keys(this.tournaments)[0]);
          } else {
            this.addTournament();
          }
          this.showMessage({
            title: i18n.global.t('messages.removed'),
            text: i18n.global.t('messages.tournamentRemoved'),
          });
        })
        .catch((error) => {
          console.error('Error deleting data:', error);
          this.showMessage({ title: i18n.global.t('messages.error'), text: error, type: 'error' });
        });
    },
    addTeamToStore(team) {
      const { data } = this._getTarget();
      if (!data.teams) data.teams = [];
      data.teams.push(team);
      localStorage.setItem('petanqueDrawTeamsRestore', JSON.stringify(data.teams));
    },
    removeTeam(titleToRemove) {
      const { data } = this._getTarget();
      data.teams = data.teams.filter((team) => team.title !== titleToRemove);
    },
    clearTeams() {
      const { data, prefix } = this._getTarget();
      data.teams = [];
      localStorage.removeItem('petanqueDrawTeamsRestore');
      this._syncPath(`${prefix}teams`, []);
    },
    changeDrawType(value) {
      const { data } = this._getTarget();
      data.useRating = value;
    },
    startRound() {
      const { data, prefix } = this._getTarget();
      data.roundIsActive = true;
      this._roundActivatedAt = Date.now();
      this._syncPath(`${prefix}roundIsActive`, true);
    },
    endRound() {
      const { data, prefix } = this._getTarget();
      data.roundIsActive = false;
      this._syncPath(`${prefix}roundIsActive`, false);
    },
    syncGames() {
      const { data, prefix } = this._getTarget();
      this._syncPath(`${prefix}games`, data.games);
    },
    syncTeams() {
      const { data, prefix } = this._getTarget();
      this._syncPath(`${prefix}teams`, data.teams);
    },
    syncGamesAndTeams() {
      const { data, prefix } = this._getTarget();
      this._syncPath(`${prefix}games`, data.games);
      this._syncPath(`${prefix}teams`, data.teams);
    },
    syncTeamPlayoff() {
      const { data, prefix } = this._getTarget();
      this._syncPath(`${prefix}teamPlayoff`, data.teamPlayoff);
    },
    syncCadrageFull() {
      const { data, prefix } = this._getTarget();
      this._syncPath(`${prefix}cadrage`, data.cadrage);
    },
    syncTirParticipants() {
      const { data, prefix } = this._getTarget();
      this._syncPath(`${prefix}tirParticipants`, data.tirParticipants);
    },
    syncTirState() {
      const { data, prefix } = this._getTarget();
      this._syncPath(`${prefix}tirRound`, data.tirRound);
      this._syncPath(`${prefix}tirR2Participants`, data.tirR2Participants || null);
      this._syncPath(`${prefix}tirTiebreakerActive`, data.tirTiebreakerActive || false);
      this._syncPath(`${prefix}tirTiebreakerCount`, data.tirTiebreakerCount || null);
      this._syncPath(`${prefix}tirTiebreakerParticipantIds`, data.tirTiebreakerParticipantIds || null);
    },
    syncTirPlayoff() {
      const { data, prefix } = this._getTarget();
      this._syncPath(`${prefix}tirPlayoff`, data.tirPlayoff);
    },
    syncTournamentMessage(message) {
      getTournamentSyncRuntime(this).scheduleTournamentMessage(message);
    },
    syncTirStart() {
      const { data, prefix } = this._getTarget();
      this._syncPath(`${prefix}system`, data.system);
      this._syncPath(`${prefix}tirStarted`, true);
      this._syncPath(`${prefix}tirParticipants`, data.tirParticipants);
      this._syncPath(`${prefix}tirConfig`, data.tirConfig);
      this._syncPath(`${prefix}tirRound`, 1);
      this._syncPath(`${prefix}games`, data.games);
    },
    syncDrawStart() {
      const { data, prefix } = this._getTarget();
      this._syncPath(`${prefix}system`, data.system);
      if (data.groups) this._syncPath(`${prefix}groups`, data.groups);
      if (data.groupsScheme) this._syncPath(`${prefix}groupsScheme`, data.groupsScheme);
      if (data.groupSchedule) this._syncPath(`${prefix}groupSchedule`, data.groupSchedule);
      if (data.poulesRound) this._syncPath(`${prefix}poulesRound`, data.poulesRound);
    },
    syncRedraw() {
      const { data, prefix } = this._getTarget();
      this._syncPath(`${prefix}games`, data.games);
      this._syncPath(`${prefix}teams`, data.teams);
      this._syncPath(`${prefix}roundIsActive`, false);
      this._syncPath(`${prefix}tournamentIsStarted`, false);
      this._syncPath(`${prefix}groupSchedule`, data.groupSchedule || null);
      this._syncPath(`${prefix}groupsScheme`, data.groupsScheme || null);
      this._syncPath(`${prefix}groups`, data.groups || null);
    },
    syncPathNull(path) {
      const { prefix } = this._getTarget();
      this._syncPath(`${prefix}${path}`, null);
    },
    syncTournamentStarted(value) {
      const { prefix } = this._getTarget();
      this._syncPath(`${prefix}tournamentIsStarted`, value);
    },
    syncPoulesRound() {
      const { data, prefix } = this._getTarget();
      this._syncPath(`${prefix}poulesRound`, data.poulesRound || null);
    },
    startRoundTimer() {
      const { data, prefix } = this._getTarget();
      const timer = createRoundTimer(data);
      if (!timer) return;
      data.roundTimer = timer;
      this._syncPath(`${prefix}roundTimer`, data.roundTimer);
    },
    endRoundTimer() {
      const { data, prefix } = this._getTarget();
      if (data?.roundTimer) {
        data.roundTimer = endRoundTimerState(data.roundTimer);
        this._syncPath(`${prefix}roundTimer`, data.roundTimer);
      }
    },
    restartRoundTimer(minutes) {
      const { data, prefix } = this._getTarget();
      if (!data) return;
      data.roundTimer = restartRoundTimerState(minutes);
      this._syncPath(`${prefix}roundTimer`, data.roundTimer);
    },
    pauseRoundTimer() {
      const { data, prefix } = this._getTarget();
      const timer = pauseRoundTimerState(data?.roundTimer);
      if (!timer) return;
      data.roundTimer = timer;
      this._syncPath(`${prefix}roundTimer`, data.roundTimer);
    },
    resumeRoundTimer() {
      const { data, prefix } = this._getTarget();
      const timer = resumeRoundTimerState(data?.roundTimer);
      if (!timer) return;
      data.roundTimer = timer;
      this._syncPath(`${prefix}roundTimer`, data.roundTimer);
    },
    clearRoundTimer() {
      const { data, prefix } = this._getTarget();
      if (data) {
        data.roundTimer = null;
        this._syncPath(`${prefix}roundTimer`, null);
      }
    },
    addRoundToGames(round) {
      const { data, prefix } = this._getTarget();
      if (!data.games) data.games = [];
      data.games.push(round);
      data.roundIsActive = true;
      this._roundActivatedAt = Date.now();
      this.saveLanesToTeams(round);
      this._syncPath(`${prefix}games`, data.games);
      this._syncPath(`${prefix}teams`, data.teams);
      this._syncPath(`${prefix}roundIsActive`, true);
    },
    restoreRound() {
      const { data, prefix } = this._getTarget();
      data.games.pop();
      data.teams.forEach((team) => team.opponents.pop());
      data.teams.forEach((team) => {
        if (team.lanes) team.lanes.pop();
      });
      this._syncPath(`${prefix}games`, data.games);
      this._syncPath(`${prefix}teams`, data.teams);
    },
    setPlayOff(scheme) {
      const { data, prefix } = this._getTarget();
      data.playOff = scheme;
      this._syncPath(`${prefix}playOff`, scheme);
    },
    setCadrage(games) {
      const { data, prefix } = this._getTarget();
      data.cadrage = games;
      data.isCadrage = true;
      this._syncPath(`${prefix}cadrage`, games);
      this._syncPath(`${prefix}isCadrage`, true);
    },
    setBarrage(barrage) {
      const { data, prefix } = this._getTarget();
      data.barrage = barrage;
      this._syncPath(`${prefix}barrage`, barrage);
    },
    setBarrageGames(games) {
      const { data, prefix } = this._getTarget();
      data.games = games;
      this._syncPath(`${prefix}games`, games);
    },
    saveCadrageScores() {
      const { data, prefix } = this._getTarget();
      data.cadrage = [...data.cadrage];
      this._syncPath(`${prefix}cadrage`, data.cadrage);
    },
    setPlayOffBracket(bracket) {
      const { data, prefix } = this._getTarget();
      data.playOffBracket = bracket;
      this._syncPath(`${prefix}playOffBracket`, bracket);
    },
    setPlayOffStage(stage) {
      const { data, prefix } = this._getTarget();
      data.playOffStage = stage;
      this._syncPath(`${prefix}playOffStage`, stage);
    },
    updateGameScore({ activeRound, gameIndex, team, score }) {
      const { data } = this._getTarget();
      data.games[activeRound][gameIndex][team] = score;
    },
    finishTournament() {
      const { data, prefix } = this._getTarget();
      data.tournamentIsFinished = true;
      this._syncPath(`${prefix}tournamentIsFinished`, true);
    },
    revertFinishTournament() {
      const { data, prefix } = this._getTarget();
      data.tournamentIsFinished = false;
      this._syncPath(`${prefix}tournamentIsFinished`, false);
    },
    showMessage({ title, text, type = 'success' }) {
      this.message = {
        show: true,
        title: title,
        text: text,
        type: type,
      };
    },
    hideMessage() {
      this.message.show = false;
    },
    addTournament(overrides = {}) {
      if (Object.keys(this.tournaments).length >= 20) {
        this.showMessage({
          title: i18n.global.t('messages.notAvailable'),
          text: i18n.global.t('messages.maxTournaments'),
          type: 'error',
        });
        return false;
      }
      const tournamentId = Date.now();
      const { name, teams, ...dataOverrides } = overrides;
      const tournament = createTournamentRecord({
        name: name || `Tournament ${tournamentNames[Object.keys(this.tournaments).length]}`,
        id: tournamentId,
        createdAt: new Date().toISOString(),
        teams: teams || [],
        ...dataOverrides,
      });
      this.tournaments[tournamentId] = tournament;
      this.setActiveTournament(tournamentId);

      const mapEntry = { status: 'active', role: 'owner', name: tournament.name };
      this.userTournamentMap[tournamentId] = mapEntry;
      userMapService.set(this.user.uid, tournamentId, mapEntry);

      this._doSync();
    },
    async addToSaved(tournament) {
      const id = String(tournament.id || this.currentTournamentIndex);
      const mapUpdate = { status: 'archived' };

      try {
        await userMapService.update(this.user.uid, id, mapUpdate);

        const mapEntry = this.userTournamentMap[id];
        if (mapEntry?.role === 'owner') {
          const adminCollaboratorUids = Object.entries(tournament.collaborators || {})
            .filter(([, collaborator]) => {
              const role = typeof collaborator === 'string' ? collaborator : collaborator.role;
              return role === 'admin';
            })
            .map(([uid]) => uid);
          const collaboratorArchiveUpdate = {
            status: 'archived',
            archiveStatusVersion: ARCHIVE_STATUS_VERSION,
          };
          await Promise.all(
            adminCollaboratorUids.map((uid) => userMapService.update(uid, id, collaboratorArchiveUpdate)),
          );
        }

        if (mapEntry) {
          mapEntry.status = 'archived';
        }
        if (!this.savedTournamentIds.includes(id)) {
          this.savedTournamentIds.push(id);
        }
        delete this.tournaments[id];
        if (String(this.currentTournamentIndex) === id) {
          const remaining = Object.keys(this.tournaments);
          if (remaining.length) {
            this.setActiveTournament(remaining[remaining.length - 1]);
          } else {
            this.addTournament();
          }
        }
        this.showMessage({
          title: i18n.global.t('messages.saved'),
          text: i18n.global.t('messages.tournamentSavedList'),
        });
      } catch (error) {
        console.error('Error archiving:', error);
        this.showMessage({ title: i18n.global.t('messages.error'), text: error, type: 'error' });
      }
    },
    async removeSavedTournament(id) {
      const db = getDatabase();
      const mapEntry = this.userTournamentMap[id];

      try {
        if (mapEntry?.role === 'owner') {
          await remove(ref(db, `${this.user.uid}/tournaments/${id}`));
          await userMapService.remove(this.user.uid, id);
          delete this.userTournamentMap[id];
        } else {
          // Removing a shared tournament from the archive must never delete
          // the owner's data. Return it to this collaborator's active list.
          await userMapService.update(this.user.uid, id, {
            status: 'active',
            archiveStatusVersion: ARCHIVE_STATUS_VERSION,
          });
          if (mapEntry) mapEntry.status = 'active';
        }

        delete this.savedTournaments[id];
        this.savedTournamentIds = this.savedTournamentIds.filter((k) => k !== id);
        this.showMessage({
          title: i18n.global.t('messages.removed'),
          text: i18n.global.t('messages.tournamentRemovedSaved'),
        });
      } catch (error) {
        console.error('Error deleting data:', error);
        this.showMessage({ title: i18n.global.t('messages.error'), text: error, type: 'error' });
      }
    },
    renameSavedTournament(id, name, ownerUid = this.user.uid) {
      const db = getDatabase();
      update(ref(db, `${ownerUid}/tournaments/${id}`), { name }).then(() => {
        if (this.savedTournaments[id]) this.savedTournaments[id].name = name;
        if (this.userTournamentMap[id]) this.userTournamentMap[id].name = name;
        userMapService.update(this.user.uid, id, { name });
      });
    },
    saveTournamentData() {
      this.showMessage({
        title: i18n.global.t('messages.saved'),
        text: i18n.global.t('messages.tournamentDataSaved'),
      });
      this._doSync();
    },
    async addCollaborator(email, role) {
      const normalizedEmail = email.trim().toLowerCase();
      const snapshot = await collaboratorService.findUserByEmail(normalizedEmail);
      if (!snapshot.exists()) {
        this.showMessage({
          title: i18n.global.t('messages.error'),
          text: i18n.global.t('messages.userNotFound'),
          type: 'error',
        });
        return false;
      }
      const collaboratorUid = snapshot.val();
      if (!collaboratorUid || typeof collaboratorUid !== 'string') {
        this.showMessage({
          title: i18n.global.t('messages.error'),
          text: i18n.global.t('messages.userNotFound'),
          type: 'error',
        });
        return false;
      }
      if (collaboratorUid === this.user.uid) {
        this.showMessage({
          title: i18n.global.t('messages.error'),
          text: i18n.global.t('messages.cannotAddSelf'),
          type: 'error',
        });
        return false;
      }
      const tournamentId = this.currentTournamentIndex;
      const tournament = this.currentTournament;

      const collabData = { role, email: normalizedEmail };
      await collaboratorService.add(this.user.uid, tournamentId, collaboratorUid, collabData);

      const mapEntry = {
        status: 'active',
        role,
        ownerUid: this.user.uid,
        name: tournament.name,
        archiveStatusVersion: ARCHIVE_STATUS_VERSION,
      };
      await userMapService.set(collaboratorUid, tournamentId, mapEntry);

      if (!tournament.collaborators) tournament.collaborators = {};
      tournament.collaborators[collaboratorUid] = collabData;

      this.showMessage({
        title: i18n.global.t('messages.saved'),
        text: i18n.global.t('messages.collaboratorAdded'),
      });
      return true;
    },
    async removeCollaborator(collaboratorUid) {
      const tournamentId = this.currentTournamentIndex;
      await userMapService.remove(collaboratorUid, tournamentId);
      await collaboratorService.remove(this.user.uid, tournamentId, collaboratorUid);

      if (this.currentTournament.collaborators) {
        delete this.currentTournament.collaborators[collaboratorUid];
      }
    },
    async leaveSharedTournament(tournamentId) {
      const mapEntry = this.userTournamentMap[tournamentId];
      if (!mapEntry || mapEntry.role === 'owner') return;
      await userMapService.remove(this.user.uid, tournamentId);
      delete this.userTournamentMap[tournamentId];
      if (this.tournaments[tournamentId]) {
        delete this.tournaments[tournamentId];
      }
      if (String(this.currentTournamentIndex) === String(tournamentId)) {
        const remaining = Object.keys(this.tournaments);
        if (remaining.length) {
          this.setActiveTournament(remaining[remaining.length - 1]);
        } else {
          this.currentTournamentIndex = null;
        }
      }
      this.unsubscribeTournament();
    },
    async loadSharedTournament(tournamentId, ownerUid) {
      const db = getDatabase();
      const dbRef = ref(db, `${ownerUid}/tournaments/${tournamentId}`);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const tournament = normalizeTournamentRecord(snapshot.val(), { id: tournamentId, ownerUid });
        this.tournaments[tournamentId] = tournament;
        this.setActiveTournament(tournamentId);
        this.subscribeTournament();
        this._watchCollaboratorAccess(tournamentId, ownerUid);
      }
    },
    _handleAccessRevoked(tournamentId) {
      if (this._accessRevokedHandled) return;
      this._accessRevokedHandled = true;
      this.unsubscribeTournament();
      delete this.tournaments[tournamentId];
      if (String(this.currentTournamentIndex) === String(tournamentId)) {
        const remaining = Object.keys(this.tournaments);
        if (remaining.length) {
          this.setActiveTournament(remaining[remaining.length - 1]);
        } else {
          this.currentTournamentIndex = null;
        }
      }
      if (this.userTournamentMap[tournamentId]) {
        delete this.userTournamentMap[tournamentId];
        userMapService.remove(this.user.uid, tournamentId);
      }
      this.showMessage({
        title: i18n.global.t('messages.error'),
        text: i18n.global.t('messages.accessRevoked'),
        type: 'error',
      });
      setTimeout(() => {
        this._accessRevokedHandled = false;
      }, 1000);
    },
    _watchCollaboratorAccess(tournamentId, ownerUid) {
      if (this._accessWatcherUnsub) {
        this._accessWatcherUnsub();
        this._accessWatcherUnsub = null;
      }
      const db = getDatabase();
      const accessRef = ref(db, `${ownerUid}/tournaments/${tournamentId}/collaborators/${this.user.uid}`);
      this._accessWatcherUnsub = onValue(accessRef, (snap) => {
        if (!snap.exists() && this.tournaments[tournamentId]?._ownerUid) {
          this._accessWatcherUnsub();
          this._accessWatcherUnsub = null;
          this._handleAccessRevoked(tournamentId);
        }
      });
    },
    async unarchiveTournament(id) {
      const mapEntry = this.userTournamentMap[id];
      if (!mapEntry) return false;

      try {
        await userMapService.update(this.user.uid, id, {
          status: 'active',
          archiveStatusVersion: ARCHIVE_STATUS_VERSION,
        });

        const restoredTournament = this.savedTournaments[id];
        if (mapEntry.role === 'owner' && restoredTournament) {
          const adminCollaboratorUids = Object.entries(restoredTournament.collaborators || {})
            .filter(([, collaborator]) => {
              const role = typeof collaborator === 'string' ? collaborator : collaborator.role;
              return role === 'admin';
            })
            .map(([uid]) => uid);
          const collaboratorActiveUpdate = {
            status: 'active',
            archiveStatusVersion: ARCHIVE_STATUS_VERSION,
          };
          await Promise.all(
            adminCollaboratorUids.map((uid) => userMapService.update(uid, id, collaboratorActiveUpdate)),
          );

          this.tournaments[id] = normalizeTournamentRecord(restoredTournament, { id });
        }

        if (this.userTournamentMap[id]) {
          this.userTournamentMap[id].status = 'active';
          this.userTournamentMap[id].archiveStatusVersion = ARCHIVE_STATUS_VERSION;
        }
        delete this.savedTournaments[id];
        this.savedTournamentIds = this.savedTournamentIds.filter((k) => k !== id);
        this.showMessage({
          title: i18n.global.t('messages.saved'),
          text: i18n.global.t('messages.tournamentUnarchived'),
        });
        return true;
      } catch (error) {
        console.error('Error restoring tournament:', error);
        this.showMessage({ title: i18n.global.t('messages.error'), text: error, type: 'error' });
        return false;
      }
    },
  },
});
