import { defineStore } from 'pinia';
import { tournamentNames } from '@/helpers';
import { get, getDatabase, ref, set, remove, update, onValue } from 'firebase/database';
import { database } from '@/firebase';
import i18n from '@/i18n';

function createTournament(overrides = {}) {
  return {
    name: 'Tournament A',
    games: [],
    teams: [],
    system: 'swiss',
    roundIsActive: false,
    useRating: false,
    playoff: false,
    isCadrage: false,
    supermelePlayers: 2,
    tournamentIsFinished: false,
    tournamentMessage: '',
    preferences: {
      technical: {
        technicalFirst: 13,
        technicalSecond: 7,
      },
      maxScore: 13,
      playOffTeams: 8,
      playOffEnabled: false,
      fieldsStart: 1,
      withCadrage: false,
      withBarrage: false,
      barrageTeams: 8,
      playB: false,
      timeLimitEnabled: false,
      timeLimit: 45,
      playoffTimeLimit: 30,
      noTimeLimitFinale: false,
      cochonettesEnabled: false,
      cochonettesEnabledPlayoff: false,
      cochonettes: 1,
      groupDrawMethod: 'seeded',
      groupFormat: 'round_robin',
      groupSwissRounds: 3,
      swissRoundsCount: null,
      prizePlaces: null,
      isTestTournament: false,
    },
    ...overrides,
  };
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
    savedTournaments: {},
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
    allScoresFilled() {
      const tournament = this.currentTournament;
      if (!tournament) return false;
      const activeRound = tournament.games?.length
        ? tournament.roundIsActive
          ? tournament.games.length
          : tournament.games.length + 1
        : 1;
      const games = tournament.games?.[activeRound - 1];
      if (!games) return false;
      return games.every(
        (g) => g.team_1_score !== null && g.team_1_score !== '' && g.team_2_score !== null && g.team_2_score !== '',
      );
    },
  },
  actions: {
    _syncPath(path, data) {
      if (!this.user || !this.user.uid || !this.currentTournamentIndex) return;
      if (!this._recentSyncPaths) this._recentSyncPaths = new Set();
      this._recentSyncPaths.add(path.split('/')[0]);
      const db = getDatabase();
      const fullPath = `${this.user.uid}/tournaments/${this.currentTournamentIndex}/${path}`;
      const plain = data != null && typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : data;
      return set(ref(db, fullPath), plain).catch((error) => {
        console.error('Error updating path:', path, error);
      });
    },
    _syncMatchDebounced(namespace, key, data) {
      if (!this._syncMatchTimeouts) this._syncMatchTimeouts = {};
      const timeoutKey = `${namespace}_${key}`;
      clearTimeout(this._syncMatchTimeouts[timeoutKey]);
      this._syncMatchTimeouts[timeoutKey] = setTimeout(() => {
        if (!this.user || !this.user.uid || !this.currentTournamentIndex) return;
        const db = getDatabase();
        const path = `${this.user.uid}/tournaments/${this.currentTournamentIndex}/${namespace}/${key}`;
        const plain = data != null && typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : data;
        set(ref(db, path), plain).catch((error) => {
          console.error(`Error updating ${namespace}/${key}:`, error);
        });
      }, 200);
    },
    syncToFirebase() {
      if (import.meta.env.DEV) {
        console.warn('[perf] syncToFirebase() called — consider using _syncPath() instead');
      }
      clearTimeout(this._syncTimeout);
      this._syncTimeout = setTimeout(() => {
        this._doSync();
      }, 300);
    },
    _doSync() {
      if (this.user && this.user.uid && this.currentTournamentIndex) {
        const db = getDatabase();
        update(ref(db, `${this.user.uid}/tournaments/`), {
          [this.currentTournamentIndex]: this.tournaments[this.currentTournamentIndex],
        }).catch((error) => {
          console.error('Error updating specific tournament:', error);
          this.showMessage({
            title: i18n.global.t('messages.error'),
            text: i18n.global.t('messages.failedSaving'),
            type: 'error',
          });
        });
      }
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
      this._syncMatchDebounced('games', `${roundIndex}/${gameIndex}`, gameData);
    },
    syncCadrageMatch(gameIndex, gameData) {
      this._syncMatchDebounced('cadrage', gameIndex, gameData);
    },
    syncBracketMatch(matchPath, matchData) {
      this._syncMatchDebounced('playOffBracket', matchPath, matchData);
    },
    syncTeamPlayoffMatch(matchPath, matchData) {
      if (matchPath) {
        this._syncMatchDebounced('teamPlayoff', matchPath, matchData);
      } else {
        this._syncPath('teamPlayoff', this.tournaments[this.currentTournamentIndex]?.teamPlayoff);
      }
    },
    syncTirPlayoffMatch(matchPath, matchData) {
      if (matchPath) {
        this._syncMatchDebounced('tirPlayoff', matchPath, matchData);
      } else {
        this._syncPath('tirPlayoff', this.tournaments[this.currentTournamentIndex]?.tirPlayoff);
      }
    },
    subscribeTournament() {
      this.unsubscribeTournament();
      if (!this.user || !this.user.uid || !this.currentTournamentIndex) return;
      const db = getDatabase();
      const basePath = `${this.user.uid}/tournaments/${this.currentTournamentIndex}`;
      this._tournamentUnsubscribers = [];

      const subscribePath = (path, handler) => {
        const dbRef = ref(db, `${basePath}/${path}`);
        const unsub = onValue(dbRef, (snapshot) => {
          if (this._recentSyncPaths?.has(path)) {
            this._recentSyncPaths.delete(path);
            return;
          }
          const local = this.tournaments[this.currentTournamentIndex];
          if (!local) return;
          handler(snapshot.val(), local);
        });
        this._tournamentUnsubscribers.push(unsub);
      };

      subscribePath('games', (remoteGames, local) => {
        if (!remoteGames || !local.games || !local.roundIsActive) return;
        this._mergeGames(local, { games: remoteGames });
      });

      subscribePath('cadrage', (remoteCadrage, local) => {
        if (!remoteCadrage || !local.cadrage) return;
        this._mergeCadrage(local, { cadrage: remoteCadrage });
      });

      subscribePath('playOffBracket', (remoteBracket, local) => {
        if (!remoteBracket || !local.playOffBracket) return;
        this._mergeBracketPlayoff(local, { playOffBracket: remoteBracket });
      });

      subscribePath('tirPlayoff', (remotePlayoff, local) => {
        if (!remotePlayoff) return;
        if (!local.tirPlayoff) {
          local.tirPlayoff = remotePlayoff;
          return;
        }
        this._mergeTirPlayoff(local, { tirPlayoff: remotePlayoff });
      });

      subscribePath('teamPlayoff', (remotePlayoff, local) => {
        if (!remotePlayoff) return;
        if (!local.teamPlayoff) {
          local.teamPlayoff = remotePlayoff;
          return;
        }
        this._mergeTeamPlayoff(local, { teamPlayoff: remotePlayoff });
      });

      const simplePaths = [
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
        'preferences',
        'streamPresets',
        'playOff',
        'playOffStage',
        'barrage',
        'tirStarted',
        'tirConfig',
      ];

      simplePaths.forEach((path) => {
        subscribePath(path, (value, local) => {
          if (value !== undefined) local[path] = value;
        });
      });

      subscribePath('roundIsActive', (value, local) => {
        if (value !== undefined && !value && local.roundIsActive) {
          if (!this._roundActivatedAt || Date.now() - this._roundActivatedAt > 3000) {
            local.roundIsActive = value;
          }
        }
      });
    },
    _mergeTirPlayoff(local, remote) {
      const localPlayoff = local.tirPlayoff;
      const remotePlayoff = remote.tirPlayoff;
      if (!remotePlayoff) return;
      const editingPath = this._activePlayoffMatchPath;

      if (remotePlayoff.rounds) {
        if (!localPlayoff.rounds) {
          localPlayoff.rounds = remotePlayoff.rounds;
        } else {
          while (localPlayoff.rounds.length < remotePlayoff.rounds.length) {
            localPlayoff.rounds.push(remotePlayoff.rounds[localPlayoff.rounds.length]);
          }
          remotePlayoff.rounds.forEach((remoteRound, rIdx) => {
            if (!localPlayoff.rounds[rIdx]) {
              localPlayoff.rounds[rIdx] = remoteRound;
              return;
            }
            remoteRound.matches.forEach((remoteMatch, mIdx) => {
              if (editingPath === `rounds/${rIdx}/matches/${mIdx}`) return;
              const localMatch = localPlayoff.rounds[rIdx].matches[mIdx];
              if (!localMatch) {
                localPlayoff.rounds[rIdx].matches[mIdx] = remoteMatch;
                return;
              }
              Object.assign(localMatch, remoteMatch);
            });
          });
        }
      }

      if (remotePlayoff.final) {
        if (!localPlayoff.final) {
          localPlayoff.final = remotePlayoff.final;
        } else if (editingPath !== 'final') {
          Object.assign(localPlayoff.final, remotePlayoff.final);
        }
      }

      if (remotePlayoff.thirdPlace) {
        if (!localPlayoff.thirdPlace) {
          localPlayoff.thirdPlace = remotePlayoff.thirdPlace;
        } else if (editingPath !== 'thirdPlace') {
          Object.assign(localPlayoff.thirdPlace, remotePlayoff.thirdPlace);
        }
      }

      if (remotePlayoff.qualified) localPlayoff.qualified = remotePlayoff.qualified;
      if (remotePlayoff.size) localPlayoff.size = remotePlayoff.size;
    },
    _mergeTeamPlayoff(local, remote) {
      const localPlayoff = local.teamPlayoff;
      const remotePlayoff = remote.teamPlayoff;
      if (!remotePlayoff) return;
      const editingPath = this._activeTeamPlayoffMatchPath;

      if (remotePlayoff.rounds) {
        if (!localPlayoff.rounds) {
          localPlayoff.rounds = remotePlayoff.rounds;
        } else {
          while (localPlayoff.rounds.length < remotePlayoff.rounds.length) {
            localPlayoff.rounds.push(remotePlayoff.rounds[localPlayoff.rounds.length]);
          }
          remotePlayoff.rounds.forEach((remoteRound, rIdx) => {
            if (!localPlayoff.rounds[rIdx]) {
              localPlayoff.rounds[rIdx] = remoteRound;
              return;
            }
            remoteRound.matches.forEach((remoteMatch, mIdx) => {
              if (editingPath === `rounds/${rIdx}/matches/${mIdx}`) return;
              const localMatch = localPlayoff.rounds[rIdx].matches[mIdx];
              if (!localMatch) {
                localPlayoff.rounds[rIdx].matches[mIdx] = remoteMatch;
                return;
              }
              Object.assign(localMatch, remoteMatch);
            });
          });
        }
      }

      if (remotePlayoff.final) {
        if (!localPlayoff.final) {
          localPlayoff.final = remotePlayoff.final;
        } else if (editingPath !== 'final') {
          Object.assign(localPlayoff.final, remotePlayoff.final);
        }
      }

      if (remotePlayoff.thirdPlace) {
        if (!localPlayoff.thirdPlace) {
          localPlayoff.thirdPlace = remotePlayoff.thirdPlace;
        } else if (editingPath !== 'thirdPlace') {
          Object.assign(localPlayoff.thirdPlace, remotePlayoff.thirdPlace);
        }
      }

      if (remotePlayoff.qualified) localPlayoff.qualified = remotePlayoff.qualified;
      if (remotePlayoff.size) localPlayoff.size = remotePlayoff.size;
    },
    _mergeGames(local, remote) {
      const editingPath = this._activeGameMatchPath;
      if (!remote.games || !local.games) return;
      const activeRound = local.games.length - 1;
      const remoteRound = remote.games?.[activeRound];
      if (!Array.isArray(remoteRound) || !local.games[activeRound]) return;
      remoteRound.forEach((remoteGame, gIdx) => {
        if (editingPath === `${activeRound}/${gIdx}`) return;
        const localGame = local.games[activeRound][gIdx];
        if (!localGame) {
          local.games[activeRound][gIdx] = remoteGame;
          return;
        }
        Object.assign(localGame, remoteGame);
      });
    },
    _mergeCadrage(local, remote) {
      const editingIndex = this._activeCadrageIndex;
      if (!Array.isArray(remote.cadrage) || !Array.isArray(local.cadrage)) return;
      remote.cadrage.forEach((remoteGame, idx) => {
        if (editingIndex === idx) return;
        const localGame = local.cadrage[idx];
        if (!localGame) {
          local.cadrage[idx] = remoteGame;
          return;
        }
        Object.assign(localGame, remoteGame);
      });
    },
    _mergeBracketPlayoff(local, remote) {
      const editingPath = this._activeBracketMatchPath;
      const localBracket = local.playOffBracket;
      const remoteBracket = remote.playOffBracket;
      if (!remoteBracket || !localBracket) return;
      if (remoteBracket.stages && localBracket.stages) {
        remoteBracket.stages.forEach((remoteStage, sIdx) => {
          if (!localBracket.stages[sIdx]) {
            localBracket.stages[sIdx] = remoteStage;
            return;
          }
          if (!remoteStage.teams) return;
          remoteStage.teams.forEach((remoteGame, gIdx) => {
            if (editingPath === `stages/${sIdx}/teams/${gIdx}`) return;
            const localGame = localBracket.stages[sIdx].teams[gIdx];
            if (!localGame) {
              localBracket.stages[sIdx].teams[gIdx] = remoteGame;
              return;
            }
            Object.assign(localGame, remoteGame);
          });
        });
      }
      if (remoteBracket.thirdPlace) {
        if (!localBracket.thirdPlace) {
          localBracket.thirdPlace = remoteBracket.thirdPlace;
        } else if (editingPath !== 'thirdPlace') {
          Object.assign(localBracket.thirdPlace, remoteBracket.thirdPlace);
        }
      }
    },
    unsubscribeTournament() {
      if (this._tournamentUnsubscribers) {
        this._tournamentUnsubscribers.forEach((fn) => fn());
        this._tournamentUnsubscribers = null;
      }
      if (this._tournamentUnsubscribe) {
        this._tournamentUnsubscribe();
        this._tournamentUnsubscribe = null;
      }
    },
    async getTournaments() {
      const dbRef = ref(database, `${this.user.uid}/tournaments/`);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        this.setTournaments(snapshot.val());
      } else {
        this.setTournaments({});
      }
      const dbRefSaved = ref(database, `${this.user.uid}/saved/`);
      const snapshotSaved = await get(dbRefSaved);
      if (snapshot.exists() && snapshotSaved.val() !== null) {
        this.setSavedTournaments(snapshotSaved.val());
      } else {
        this.setSavedTournaments({});
      }
    },
    savePreferences() {
      this._syncPath('preferences', this.tournaments[this.currentTournamentIndex].preferences);
    },
    syncStreamPresets() {
      this._syncPath('streamPresets', this.tournaments[this.currentTournamentIndex].streamPresets);
    },
    shuffleLanesStore(games) {
      this.tournaments[this.currentTournamentIndex].games[
        this.tournaments[this.currentTournamentIndex].games.length - 1
      ] = games;
      this.tournaments[this.currentTournamentIndex].teams.forEach((team) => {
        if (team.lanes) team.lanes.pop();
      });
      this.saveLanesToTeams(games);
      this._syncPath('games', this.tournaments[this.currentTournamentIndex].games);
      this._syncPath('teams', this.tournaments[this.currentTournamentIndex].teams);
    },
    swapLanesStore({ roundIndex, indexA, indexB }) {
      const games = this.tournaments[this.currentTournamentIndex].games[roundIndex];
      const temp = games[indexA];
      games[indexA] = games[indexB];
      games[indexB] = temp;
      const tempLane = games[indexA].lane;
      games[indexA].lane = games[indexB].lane;
      games[indexB].lane = tempLane;
      this.tournaments[this.currentTournamentIndex].teams.forEach((team) => {
        if (team.lanes) team.lanes.pop();
      });
      this.saveLanesToTeams(games);
      this._syncPath('games', this.tournaments[this.currentTournamentIndex].games);
      this._syncPath('teams', this.tournaments[this.currentTournamentIndex].teams);
    },
    saveLanesToTeams(games) {
      games.map((game) => {
        this.tournaments[this.currentTournamentIndex].teams.map((team) => {
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
    setTournaments(tournaments) {
      Object.keys(tournaments).forEach((key) => {
        const defaults = createTournament();
        const t = tournaments[key];
        tournaments[key] = {
          ...defaults,
          ...t,
          id: t.id || key,
          teams: t.teams || [],
          games: t.games || [],
          preferences: { ...defaults.preferences, ...(t.preferences || {}) },
        };
      });
      this.tournaments = tournaments;
      if (!Object.keys(this.tournaments).length) {
        this.addTournament();
      }
      const pinned = localStorage.getItem('petanqueDrawPinned');
      if (pinned && this.tournaments[pinned]) {
        this.setActiveTournament(pinned);
      } else {
        this.setActiveTournament(
          this.tournaments[Object.keys(this.tournaments)[Object.keys(this.tournaments).length - 1]].id,
        );
      }
    },
    setSavedTournaments(tournaments) {
      this.savedTournaments = tournaments;
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
      this.user = value;
    },
    setActiveTournament(index) {
      this.currentTournamentIndex = index;
    },
    changeTournamentName(name) {
      this.tournaments[this.currentTournamentIndex].name = name;
      this._syncPath('name', name);
    },
    removeTournament() {
      const db = getDatabase();
      const dataRef = ref(db, `${this.user.uid}/tournaments/${this.currentTournamentIndex}`);
      const tokensRef = ref(db, `tokens/${this.user.uid}/${this.currentTournamentIndex}`);

      remove(tokensRef).catch((error) => {
        console.error('Error deleting data:', error);
      });

      remove(dataRef)
        .then(() => {
          delete this.tournaments[this.currentTournamentIndex];
          if (Object.keys(this.tournaments).length >= 1) {
            this.currentTournamentIndex = Object.keys(this.tournaments)[0];
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
      if (!this.tournaments[this.currentTournamentIndex].teams) {
        this.tournaments[this.currentTournamentIndex].teams = [];
      }
      this.tournaments[this.currentTournamentIndex].teams.push(team);
      localStorage.setItem(
        'petanqueDrawTeamsRestore',
        JSON.stringify(this.tournaments[this.currentTournamentIndex].teams),
      );
    },
    removeTeam(titleToRemove) {
      this.tournaments[this.currentTournamentIndex].teams = this.tournaments[this.currentTournamentIndex].teams.filter(
        (team) => team.title !== titleToRemove,
      );
    },
    clearTeams() {
      this.tournaments[this.currentTournamentIndex].teams = [];
      localStorage.removeItem('petanqueDrawTeamsRestore');
      this._syncPath('teams', []);
    },
    changeDrawType(value) {
      this.tournaments[this.currentTournamentIndex].useRating = value;
    },
    startRound() {
      this.tournaments[this.currentTournamentIndex].roundIsActive = true;
      this._roundActivatedAt = Date.now();
      this._syncPath('roundIsActive', true);
    },
    endRound() {
      this.tournaments[this.currentTournamentIndex].roundIsActive = false;
      this._syncPath('roundIsActive', false);
    },
    syncGames() {
      this._syncPath('games', this.tournaments[this.currentTournamentIndex].games);
    },
    syncTeams() {
      this._syncPath('teams', this.tournaments[this.currentTournamentIndex].teams);
    },
    syncGamesAndTeams() {
      this._syncPath('games', this.tournaments[this.currentTournamentIndex].games);
      this._syncPath('teams', this.tournaments[this.currentTournamentIndex].teams);
    },
    syncTeamPlayoff() {
      this._syncPath('teamPlayoff', this.tournaments[this.currentTournamentIndex].teamPlayoff);
    },
    syncCadrageFull() {
      this._syncPath('cadrage', this.tournaments[this.currentTournamentIndex].cadrage);
    },
    syncTirParticipants() {
      this._syncPath('tirParticipants', this.tournaments[this.currentTournamentIndex].tirParticipants);
    },
    syncTirState() {
      const t = this.tournaments[this.currentTournamentIndex];
      this._syncPath('tirRound', t.tirRound);
      this._syncPath('tirR2Participants', t.tirR2Participants || null);
      this._syncPath('tirTiebreakerActive', t.tirTiebreakerActive || false);
      this._syncPath('tirTiebreakerCount', t.tirTiebreakerCount || null);
      this._syncPath('tirTiebreakerParticipantIds', t.tirTiebreakerParticipantIds || null);
    },
    syncTirPlayoff() {
      this._syncPath('tirPlayoff', this.tournaments[this.currentTournamentIndex].tirPlayoff);
    },
    syncTournamentMessage() {
      clearTimeout(this._syncMessageTimeout);
      this._syncMessageTimeout = setTimeout(() => {
        this._syncPath('tournamentMessage', this.tournaments[this.currentTournamentIndex].tournamentMessage);
      }, 300);
    },
    syncTirStart() {
      const t = this.tournaments[this.currentTournamentIndex];
      this._syncPath('tirStarted', true);
      this._syncPath('tirParticipants', t.tirParticipants);
      this._syncPath('tirConfig', t.tirConfig);
      this._syncPath('tirRound', 1);
      this._syncPath('games', t.games);
    },
    syncDrawStart() {
      const t = this.tournaments[this.currentTournamentIndex];
      if (t.groups) this._syncPath('groups', t.groups);
      if (t.groupsScheme) this._syncPath('groupsScheme', t.groupsScheme);
      if (t.groupSchedule) this._syncPath('groupSchedule', t.groupSchedule);
      if (t.poulesRound) this._syncPath('poulesRound', t.poulesRound);
    },
    syncRedraw() {
      const t = this.tournaments[this.currentTournamentIndex];
      this._syncPath('games', t.games);
      this._syncPath('teams', t.teams);
      this._syncPath('roundIsActive', false);
      this._syncPath('tournamentIsStarted', false);
      this._syncPath('groupSchedule', t.groupSchedule || null);
      this._syncPath('groupsScheme', t.groupsScheme || null);
      this._syncPath('groups', t.groups || null);
    },
    syncPathNull(path) {
      this._syncPath(path, null);
    },
    syncTournamentStarted(value) {
      this._syncPath('tournamentIsStarted', value);
    },
    startRoundTimer() {
      const tournament = this.tournaments[this.currentTournamentIndex];
      if (!tournament?.preferences?.timeLimitEnabled) return;
      const prefs = tournament.preferences;
      const isPlayoff = !!(tournament.playOff || tournament.cadrage || tournament.teamPlayoff);
      const isFinale =
        tournament.playOffStage === 1 ||
        (tournament.playOff?.length && tournament.playOff[tournament.playOff.length - 1].teams?.length === 1);
      if (isFinale && prefs.noTimeLimitFinale) return;
      const minutes = isPlayoff && prefs.playoffTimeLimit ? prefs.playoffTimeLimit : prefs.timeLimit;
      const now = new Date().toISOString();
      const endsAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      tournament.roundTimer = {
        timerStartedAt: now,
        timerEndsAt: endsAt,
        timerStatus: 'running',
        timeLimitMinutes: minutes,
      };
      this._syncPath('roundTimer', tournament.roundTimer);
    },
    endRoundTimer() {
      const tournament = this.tournaments[this.currentTournamentIndex];
      if (tournament?.roundTimer) {
        tournament.roundTimer.timerStatus = 'ended';
        this._syncPath('roundTimer', tournament.roundTimer);
      }
    },
    restartRoundTimer(minutes) {
      const tournament = this.tournaments[this.currentTournamentIndex];
      if (!tournament) return;
      const now = new Date().toISOString();
      const endsAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      tournament.roundTimer = {
        timerStartedAt: now,
        timerEndsAt: endsAt,
        timerStatus: 'running',
        timeLimitMinutes: minutes,
      };
      this._syncPath('roundTimer', tournament.roundTimer);
    },
    clearRoundTimer() {
      const tournament = this.tournaments[this.currentTournamentIndex];
      if (tournament) {
        tournament.roundTimer = null;
        this._syncPath('roundTimer', null);
      }
    },
    addRoundToGames(round) {
      if (!this.tournaments[this.currentTournamentIndex].games) {
        this.tournaments[this.currentTournamentIndex].games = [];
      }
      this.tournaments[this.currentTournamentIndex].games.push(round);
      this.tournaments[this.currentTournamentIndex].roundIsActive = true;
      this._roundActivatedAt = Date.now();
      this.saveLanesToTeams(round);
      this._syncPath('games', this.tournaments[this.currentTournamentIndex].games);
      this._syncPath('teams', this.tournaments[this.currentTournamentIndex].teams);
      this._syncPath('roundIsActive', true);
    },
    restoreRound() {
      this.tournaments[this.currentTournamentIndex].games.pop();
      this.tournaments[this.currentTournamentIndex].teams.forEach((team) => team.opponents.pop());
      this.tournaments[this.currentTournamentIndex].teams.forEach((team) => {
        if (team.lanes) team.lanes.pop();
      });
      this._syncPath('games', this.tournaments[this.currentTournamentIndex].games);
      this._syncPath('teams', this.tournaments[this.currentTournamentIndex].teams);
    },
    setPlayOff(scheme) {
      this.tournaments[this.currentTournamentIndex].playOff = scheme;
      this._syncPath('playOff', scheme);
    },
    setCadrage(games) {
      this.tournaments[this.currentTournamentIndex].cadrage = games;
      this.tournaments[this.currentTournamentIndex].isCadrage = true;
      this._syncPath('cadrage', games);
      this._syncPath('isCadrage', true);
    },
    setBarrage(barrage) {
      this.tournaments[this.currentTournamentIndex].barrage = barrage;
      this._syncPath('barrage', barrage);
    },
    setBarrageGames(games) {
      this.tournaments[this.currentTournamentIndex].games = games;
      this._syncPath('games', games);
    },
    saveCadrageScores() {
      this.tournaments[this.currentTournamentIndex].cadrage = [
        ...this.tournaments[this.currentTournamentIndex].cadrage,
      ];
      this._syncPath('cadrage', this.tournaments[this.currentTournamentIndex].cadrage);
    },
    setPlayOffBracket(bracket) {
      this.tournaments[this.currentTournamentIndex].playOffBracket = bracket;
      this._syncPath('playOffBracket', bracket);
    },
    setPlayOffStage(stage) {
      this.tournaments[this.currentTournamentIndex].playOffStage = stage;
      this._syncPath('playOffStage', stage);
    },
    updateGameScore({ activeRound, gameIndex, team, score }) {
      this.tournaments[this.currentTournamentIndex].games[activeRound][gameIndex][team] = score;
    },
    finishTournament() {
      this.tournaments[this.currentTournamentIndex].tournamentIsFinished = true;
      this._syncPath('tournamentIsFinished', true);
    },
    revertFinishTournament() {
      this.tournaments[this.currentTournamentIndex].tournamentIsFinished = false;
      this._syncPath('tournamentIsFinished', false);
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
      const tournament = createTournament({
        ...overrides,
        id: tournamentId,
        createdAt: new Date().toISOString(),
      });
      tournament.name = `Tournament ${tournamentNames[Object.keys(this.tournaments).length]}`;
      this.tournaments[tournament.id] = tournament;
      this.currentTournamentIndex = tournamentId;
      this.syncToFirebase();
    },
    addToSaved(tournament) {
      const db = getDatabase();
      set(ref(db, `${this.user.uid}/saved/${tournament.id}`), tournament)
        .then(() => {
          this.savedTournaments[tournament.id] = tournament;
          this.showMessage({
            title: i18n.global.t('messages.saved'),
            text: i18n.global.t('messages.tournamentSavedList'),
          });
        })
        .catch((error) => {
          console.error('Error save:', error);
          this.showMessage({ title: i18n.global.t('messages.error'), text: error, type: 'error' });
        });
    },
    removeSavedTournament(id) {
      const db = getDatabase();
      const dataRef = ref(db, `${this.user.uid}/saved/${id}`);

      remove(dataRef)
        .then(() => {
          delete this.savedTournaments[id];
          this.showMessage({
            title: i18n.global.t('messages.removed'),
            text: i18n.global.t('messages.tournamentRemovedSaved'),
          });
        })
        .catch((error) => {
          console.error('Error deleting data:', error);
          this.showMessage({ title: i18n.global.t('messages.error'), text: error, type: 'error' });
        });
    },
    renameSavedTournament(id, name) {
      const db = getDatabase();
      update(ref(db, `${this.user.uid}/saved/${id}`), { name }).then(() => {
        this.savedTournaments[id].name = name;
      });
    },
    addBTournament(teams, name, isGroupB) {
      this.addTournament({ teams: [...teams] });
      if (name) {
        this.changeTournamentName(name);
      }
      if (isGroupB) {
        this.tournaments[this.currentTournamentIndex].isGroupB = true;
        this._syncPath('isGroupB', true);
      }
    },
    saveTournamentData() {
      this.showMessage({
        title: i18n.global.t('messages.saved'),
        text: i18n.global.t('messages.tournamentDataSaved'),
      });
      this.syncToFirebase();
    },
  },
});
