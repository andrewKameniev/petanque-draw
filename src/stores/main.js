import { defineStore } from 'pinia';
import { tournamentNames } from '@/helpers';
import { get, getDatabase, ref, set, remove, update, onValue } from 'firebase/database';
import { database } from '@/firebase';
import { userMapService, collaboratorService } from '@/services/db';
import i18n from '@/i18n';

const defaultPreferences = {
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
  playoffTimeLimit: 70,
  noTimeLimitFinale: false,
  cochonettesEnabled: false,
  cochonettesEnabledPlayoff: false,
  cochonettes: 1,
  groupDrawMethod: 'seeded',
  groupFormat: 'round_robin',
  groupSwissRounds: 3,
  swissRoundsCount: null,
  prizePlaces: 3,
  isTestTournament: false,
  cadrageLosersToB: false,
  colorSchema: '',
};

function createTournamentData(overrides = {}) {
  return {
    games: [],
    teams: [],
    system: 'swiss',
    roundIsActive: false,
    useRating: false,
    playoff: false,
    isCadrage: false,
    supermelePlayers: 2,
    supermeleMode: 'ideal',
    supermeleTetATet: true,
    tournamentIsFinished: false,
    preferences: { ...defaultPreferences },
    ...overrides,
  };
}

function createTournament(overrides = {}) {
  const { name, id, createdAt, ...dataOverrides } = overrides;
  const wrapper = {
    name: name || 'Tournament A',
    tournamentMessage: '',
    activeGroup: 'A',
    tournamentB: null,
    main: createTournamentData(dataOverrides),
  };
  if (id) wrapper.id = id;
  if (createdAt) wrapper.createdAt = createdAt;
  return wrapper;
}

function isNewFormat(tournament) {
  return !!tournament?.main;
}

export const useMainStore = defineStore('main', {
  state: () => ({
    _router: null,
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
      const t = this.currentTournament;
      if (!t) return null;
      if (isNewFormat(t)) {
        return t.activeGroup === 'B' && t.tournamentB ? t.tournamentB : t.main;
      }
      return t;
    },
    isNewFormat() {
      return isNewFormat(this.currentTournament);
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
      if (isNewFormat(tournament)) {
        if (tournament.activeGroup === 'B' && tournament.tournamentB) {
          return { data: tournament.tournamentB, prefix: 'tournamentB/' };
        }
        return { data: tournament.main, prefix: 'main/' };
      }
      // Old format fallback
      if (tournament?.activeGroup === 'B' && tournament.groupB) {
        return { data: tournament.groupB, prefix: 'groupB/' };
      }
      return { data: tournament, prefix: '' };
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
      const target = isNewFormat(tournament) ? tournament.tournamentB : tournament?.groupB;
      if (!target) return;
      newTeams.forEach((t) => {
        const existing = target.teams.find((bt) => bt.title === t.title);
        if (!existing) target.teams.push({ ...t });
      });
      const prefix = isNewFormat(tournament) ? 'tournamentB' : 'groupB';
      this._syncPath(`${prefix}/teams`, target.teams);
    },
    setTournamentBEliminationRound(eliminationData) {
      const tournament = this.tournaments[this.currentTournamentIndex];
      const target = isNewFormat(tournament) ? tournament.tournamentB : tournament?.groupB;
      if (!target) return;
      target.eliminationRound = eliminationData;
      const prefix = isNewFormat(tournament) ? 'tournamentB' : 'groupB';
      this._syncPath(`${prefix}/eliminationRound`, eliminationData);
    },
    syncEliminationGames() {
      const tournament = this.tournaments[this.currentTournamentIndex];
      const target = isNewFormat(tournament) ? tournament.tournamentB : tournament?.groupB;
      if (!target?.eliminationRound) return;
      const prefix = isNewFormat(tournament) ? 'tournamentB' : 'groupB';
      this._syncPath(`${prefix}/eliminationRound/games`, target.eliminationRound.games);
    },
    completeTournamentBElimination() {
      const tournament = this.tournaments[this.currentTournamentIndex];
      const target = isNewFormat(tournament) ? tournament.tournamentB : tournament?.groupB;
      if (!target?.eliminationRound) return;
      const elim = target.eliminationRound;
      elim.completed = true;
      elim.games.forEach((game) => {
        const loserTitle = Number(game.team_1_score) > Number(game.team_2_score) ? game.team_2 : game.team_1;
        const loser = target.teams.find((t) => t.title === loserTitle);
        if (loser) loser.eliminated = true;
      });
      const prefix = isNewFormat(tournament) ? 'tournamentB' : 'groupB';
      this._syncPath(`${prefix}/eliminationRound`, elim);
      this._syncPath(`${prefix}/teams`, target.teams);
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
      if (!this.user || !this.user.uid || !this.currentTournamentIndex) return;
      if (!this._recentSyncPaths) this._recentSyncPaths = new Set();
      this._recentSyncPaths.add(path);
      const db = getDatabase();
      const ownerUid = this._getTournamentOwnerUid();
      const fullPath = `${ownerUid}/tournaments/${this.currentTournamentIndex}/${path}`;
      const plain = data != null && typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : data;
      return set(ref(db, fullPath), plain).catch((error) => {
        if (error?.code?.toLowerCase() === 'permission_denied' && ownerUid !== this.user.uid) {
          this._handleAccessRevoked(this.currentTournamentIndex);
        }
        console.error('Error updating path:', path, error);
      });
    },
    _syncMatchDebounced(namespace, key, data) {
      if (!this._syncMatchTimeouts) this._syncMatchTimeouts = {};
      if (!this._recentMatchSyncs) this._recentMatchSyncs = new Set();
      const timeoutKey = `${namespace}_${key}`;
      const syncKey = `${namespace}:${key}`;
      this._recentMatchSyncs.add(syncKey);
      clearTimeout(this._syncMatchTimeouts[timeoutKey]);
      this._syncMatchTimeouts[timeoutKey] = setTimeout(() => {
        if (!this.user || !this.user.uid || !this.currentTournamentIndex) return;
        const db = getDatabase();
        const ownerUid = this._getTournamentOwnerUid();
        const tid = this.currentTournamentIndex;
        const path = `${ownerUid}/tournaments/${tid}/${namespace}/${key}`;
        const plain = data != null && typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : data;
        set(ref(db, path), plain)
          .then(() => {
            this._recentMatchSyncs.delete(syncKey);
          })
          .catch((error) => {
            this._recentMatchSyncs.delete(syncKey);
            if (error?.code?.toLowerCase() === 'permission_denied' && ownerUid !== this.user.uid) {
              this._handleAccessRevoked(tid);
            }
            console.error(`Error updating ${namespace}/${key}:`, error);
          });
      }, 200);
    },
    _doSync() {
      if (this.user && this.user.uid && this.currentTournamentIndex) {
        const tournament = this.tournaments[this.currentTournamentIndex];
        if (tournament?._ownerUid) return;
        const db = getDatabase();
        update(ref(db, `${this.user.uid}/tournaments/`), {
          [this.currentTournamentIndex]: JSON.parse(JSON.stringify(tournament)),
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
      this.unsubscribeTournament();
      if (!this.user || !this.user.uid || !this.currentTournamentIndex) return;
      const db = getDatabase();
      const ownerUid = this._getTournamentOwnerUid();
      const basePath = `${ownerUid}/tournaments/${this.currentTournamentIndex}`;
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

      const tournament = this.tournaments[this.currentTournamentIndex];
      if (isNewFormat(tournament)) {
        const mainPaths = [
          'system',
          'teams',
          'games',
          'preferences',
          'roundIsActive',
          'roundTimer',
          'tournamentIsFinished',
          'playOff',
          'playOffBracket',
          'playOffStage',
          'cadrage',
          'barrage',
          'eliminationRound',
          'streamPresets',
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
        mainPaths.forEach((path) => {
          subscribePath(`main/${path}`, (value) => {
            const local = this.tournaments[this.currentTournamentIndex];
            if (!local?.main || value === undefined) return;
            if (path === 'games') {
              if (!value || !local.main.games || !local.main.roundIsActive) return;
              this._mergeGames(local.main, { games: value });
              return;
            }
            if (path === 'cadrage') {
              if (!value || !local.main.cadrage) return;
              this._mergeCadrage(local.main, { cadrage: value });
              return;
            }
            if (path === 'playOffBracket') {
              if (!value || !local.main.playOffBracket) return;
              this._mergeBracketPlayoff(local.main, { playOffBracket: value });
              return;
            }
            if (path === 'tirPlayoff') {
              if (!local.main.tirPlayoff) {
                local.main.tirPlayoff = value;
                return;
              }
              this._mergeTirPlayoff(local.main, { tirPlayoff: value });
              return;
            }
            if (path === 'teamPlayoff') {
              if (!local.main.teamPlayoff) {
                local.main.teamPlayoff = value;
                return;
              }
              this._mergeTeamPlayoff(local.main, { teamPlayoff: value });
              return;
            }
            if (path === 'roundIsActive' && !value && local.main.roundIsActive) {
              if (!this._roundActivatedAt || Date.now() - this._roundActivatedAt > 3000) {
                local.main[path] = value;
              }
              return;
            }
            if (
              path === 'roundTimer' &&
              value?.timerStatus === 'ended' &&
              local.main.roundTimer?.timerStatus === 'running'
            ) {
              const endsAt = new Date(local.main.roundTimer.timerEndsAt).getTime();
              if (endsAt > Date.now()) return;
            }
            local.main[path] = value;
          });
        });
        subscribePath('tournamentB', (value) => {
          const local = this.tournaments[this.currentTournamentIndex];
          if (!local || value == null) return;
          const recentSubPaths = [...(this._recentSyncPaths || [])].filter((p) => p.startsWith('tournamentB/'));
          if (recentSubPaths.length) {
            recentSubPaths.forEach((p) => this._recentSyncPaths.delete(p));
            return;
          }
          if (!local.tournamentB) {
            local.tournamentB = value;
            return;
          }
          Object.keys(value).forEach((key) => {
            local.tournamentB[key] = value[key];
          });
        });
        ['activeGroup', 'tournamentMessage', 'name'].forEach((path) => {
          subscribePath(path, (value, local) => {
            if (value !== undefined) local[path] = value;
          });
        });
      } else {
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
          'activeGroup',
          'groupB',
        ];

        simplePaths.forEach((path) => {
          subscribePath(path, (value, local) => {
            if (value !== undefined) {
              if (
                path === 'roundTimer' &&
                value?.timerStatus === 'ended' &&
                local.roundTimer?.timerStatus === 'running'
              ) {
                const endsAt = new Date(local.roundTimer.timerEndsAt).getTime();
                if (endsAt > Date.now()) return;
              }
              local[path] = value;
            }
          });
        });

        subscribePath('roundIsActive', (value, local) => {
          if (value !== undefined && !value && local.roundIsActive) {
            if (!this._roundActivatedAt || Date.now() - this._roundActivatedAt > 3000) {
              local.roundIsActive = value;
            }
          }
        });
      }
    },
    _mergeTirPlayoff(local, remote) {
      const localPlayoff = local.tirPlayoff;
      const remotePlayoff = remote.tirPlayoff;
      if (!remotePlayoff) return;
      const { prefix } = this._getTarget();
      const ns = `${prefix}tirPlayoff`;
      const recentSyncs = this._recentMatchSyncs || new Set();

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
              if (recentSyncs.has(`${ns}:rounds/${rIdx}/matches/${mIdx}`)) return;
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
        } else if (!recentSyncs.has(`${ns}:final`)) {
          Object.assign(localPlayoff.final, remotePlayoff.final);
        }
      }

      if (remotePlayoff.thirdPlace) {
        if (!localPlayoff.thirdPlace) {
          localPlayoff.thirdPlace = remotePlayoff.thirdPlace;
        } else if (!recentSyncs.has(`${ns}:thirdPlace`)) {
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
      const { prefix } = this._getTarget();
      const ns = `${prefix}teamPlayoff`;
      const recentSyncs = this._recentMatchSyncs || new Set();

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
              if (recentSyncs.has(`${ns}:rounds/${rIdx}/matches/${mIdx}`)) return;
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
        } else if (!recentSyncs.has(`${ns}:final`)) {
          Object.assign(localPlayoff.final, remotePlayoff.final);
        }
      }

      if (remotePlayoff.thirdPlace) {
        if (!localPlayoff.thirdPlace) {
          localPlayoff.thirdPlace = remotePlayoff.thirdPlace;
        } else if (!recentSyncs.has(`${ns}:thirdPlace`)) {
          Object.assign(localPlayoff.thirdPlace, remotePlayoff.thirdPlace);
        }
      }

      if (remotePlayoff.qualified) localPlayoff.qualified = remotePlayoff.qualified;
      if (remotePlayoff.size) localPlayoff.size = remotePlayoff.size;
    },
    _mergeGames(local, remote) {
      const { prefix } = this._getTarget();
      const recentSyncs = this._recentMatchSyncs || new Set();
      if (!remote.games || !local.games) return;
      const activeRound = local.games.length - 1;
      const remoteRound = remote.games?.[activeRound];
      if (!Array.isArray(remoteRound) || !local.games[activeRound]) return;
      remoteRound.forEach((remoteGame, gIdx) => {
        if (recentSyncs.has(`${prefix}games:${activeRound}/${gIdx}`)) return;
        const localGame = local.games[activeRound][gIdx];
        if (!localGame) {
          local.games[activeRound][gIdx] = remoteGame;
          return;
        }
        Object.assign(localGame, remoteGame);
      });
    },
    _mergeCadrage(local, remote) {
      const { prefix } = this._getTarget();
      const recentSyncs = this._recentMatchSyncs || new Set();
      if (!Array.isArray(remote.cadrage) || !Array.isArray(local.cadrage)) return;
      remote.cadrage.forEach((remoteGame, idx) => {
        if (recentSyncs.has(`${prefix}cadrage:${idx}`)) return;
        const localGame = local.cadrage[idx];
        if (!localGame) {
          local.cadrage[idx] = remoteGame;
          return;
        }
        Object.assign(localGame, remoteGame);
      });
    },
    _mergeBracketPlayoff(local, remote) {
      const { prefix } = this._getTarget();
      const recentSyncs = this._recentMatchSyncs || new Set();
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
            if (recentSyncs.has(`${prefix}playOffBracket:stages/${sIdx}/teams/${gIdx}`)) return;
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
        } else if (!recentSyncs.has(`${prefix}playOffBracket:thirdPlace`)) {
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
      if (this._accessWatcherUnsub) {
        this._accessWatcherUnsub();
        this._accessWatcherUnsub = null;
      }
    },
    async getTournaments() {
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
            migratedMap[id] = {
              status:
                allTournaments[id].tournamentIsFinished || allTournaments[id].main?.tournamentIsFinished
                  ? 'archived'
                  : 'active',
              role: 'owner',
              name: allTournaments[id].name || 'Tournament',
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
        this.setTournaments(active);
      } else {
        this.setTournaments({});
      }

      this.savedTournamentIds = Object.entries(this.userTournamentMap)
        .filter(([, entry]) => entry.status === 'archived')
        .map(([id]) => id);
    },
    async fetchSavedTournaments() {
      const archivedIds = Object.entries(this.userTournamentMap)
        .filter(([, entry]) => entry.status === 'archived' && entry.role === 'owner')
        .map(([id]) => id);

      if (!archivedIds.length) {
        this.setSavedTournaments({});
        this.savedTournamentIds = [];
        return;
      }

      const db = getDatabase();
      const results = {};
      await Promise.all(
        archivedIds.map(async (id) => {
          let snapshot = await get(ref(db, `${this.user.uid}/tournaments/${id}`));
          if (!snapshot.exists()) {
            snapshot = await get(ref(db, `${this.user.uid}/saved/${id}`));
          }
          if (snapshot.exists()) results[id] = snapshot.val();
        }),
      );
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
    setTournaments(tournaments) {
      Object.keys(tournaments).forEach((key) => {
        const t = tournaments[key];
        if (isNewFormat(t)) {
          const mainDefaults = createTournamentData();
          t.main = {
            ...mainDefaults,
            ...t.main,
            preferences: { ...mainDefaults.preferences, ...(t.main.preferences || {}) },
          };
          if (t.tournamentB) {
            t.tournamentB = {
              ...mainDefaults,
              ...t.tournamentB,
              isTournamentB: true,
              preferences: { ...mainDefaults.preferences, ...(t.tournamentB.preferences || {}) },
            };
          }
          t.id = t.id || key;
          t.activeGroup = t.activeGroup || 'A';
        } else {
          const defaults = createTournamentData();
          tournaments[key] = {
            ...defaults,
            ...t,
            id: t.id || key,
            teams: t.teams || [],
            games: t.games || [],
            preferences: { ...defaults.preferences, ...(t.preferences || {}) },
          };
        }
      });
      this.tournaments = tournaments;
      console.log('Tournaments:', JSON.parse(JSON.stringify(tournaments)));
      if (!Object.keys(this.tournaments).length) {
        this.addTournament();
      }
      const routeT = this._getRouteQueryT();
      const pinned = routeT || localStorage.getItem('petanqueDrawPinned');
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
      if (value && value.email && value.uid) {
        const db = getDatabase();
        const emailKey = value.email.replace(/\./g, ',');
        set(ref(db, `emails/${emailKey}`), value.uid);
      }
    },
    setRouter(router) {
      this._router = router;
    },
    _getRouteQueryT() {
      if (!this._router) return null;
      const query = this._router.currentRoute?.value?.query;
      return query?.t || null;
    },
    _updateRouteQuery(tournamentId) {
      if (!this._router) return;
      const current = this._router.currentRoute?.value;
      if (!current || current.path !== '/') return;
      const currentT = current.query?.t;
      if (String(currentT) === String(tournamentId)) return;
      this._router.replace({ path: '/', query: { t: tournamentId } });
    },
    setActiveTournament(index) {
      this.currentTournamentIndex = index;
      this._updateRouteQuery(index);
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
    syncTournamentMessage() {
      clearTimeout(this._syncMessageTimeout);
      this._syncMessageTimeout = setTimeout(() => {
        const tournament = this.tournaments[this.currentTournamentIndex];
        this._syncPath('tournamentMessage', tournament?.tournamentMessage);
      }, 300);
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
      if (!data?.preferences?.timeLimitEnabled) return;
      const prefs = data.preferences;
      const isPlayoff = !!(data.playOff || data.cadrage || data.teamPlayoff);
      const isFinale =
        data.playOffStage === 1 || (data.playOff?.length && data.playOff[data.playOff.length - 1].teams?.length === 1);
      if (isFinale && prefs.noTimeLimitFinale) return;
      const minutes = isPlayoff && prefs.playoffTimeLimit ? prefs.playoffTimeLimit : prefs.timeLimit;
      const now = new Date().toISOString();
      const endsAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      data.roundTimer = {
        timerStartedAt: now,
        timerEndsAt: endsAt,
        timerStatus: 'running',
        timeLimitMinutes: minutes,
      };
      this._syncPath(`${prefix}roundTimer`, data.roundTimer);
    },
    endRoundTimer() {
      const { data, prefix } = this._getTarget();
      if (data?.roundTimer) {
        data.roundTimer.timerStatus = 'ended';
        this._syncPath(`${prefix}roundTimer`, data.roundTimer);
      }
    },
    restartRoundTimer(minutes) {
      const { data, prefix } = this._getTarget();
      if (!data) return;
      const now = new Date().toISOString();
      const endsAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      data.roundTimer = {
        timerStartedAt: now,
        timerEndsAt: endsAt,
        timerStatus: 'running',
        timeLimitMinutes: minutes,
      };
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
      const tournament = createTournament({
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
    addToSaved(tournament) {
      const id = String(tournament.id || this.currentTournamentIndex);
      const mapUpdate = { status: 'archived' };

      userMapService
        .update(this.user.uid, id, mapUpdate)
        .then(() => {
          if (this.userTournamentMap[id]) {
            this.userTournamentMap[id].status = 'archived';
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
        })
        .catch((error) => {
          console.error('Error archiving:', error);
          this.showMessage({ title: i18n.global.t('messages.error'), text: error, type: 'error' });
        });
    },
    removeSavedTournament(id) {
      const db = getDatabase();
      const dataRef = ref(db, `${this.user.uid}/tournaments/${id}`);

      remove(dataRef)
        .then(() => {
          userMapService.remove(this.user.uid, id);
          delete this.savedTournaments[id];
          delete this.userTournamentMap[id];
          this.savedTournamentIds = this.savedTournamentIds.filter((k) => k !== id);
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
      update(ref(db, `${this.user.uid}/tournaments/${id}`), { name }).then(() => {
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
      const snapshot = await collaboratorService.findUserByEmail(email);
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

      const collabData = { role, email };
      await collaboratorService.add(this.user.uid, tournamentId, collaboratorUid, collabData);

      const mapEntry = {
        status: 'active',
        role,
        ownerUid: this.user.uid,
        name: tournament.name,
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
        const tournament = snapshot.val();
        tournament.id = tournamentId;
        tournament._ownerUid = ownerUid;
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
    unarchiveTournament(id) {
      userMapService.update(this.user.uid, id, { status: 'active' }).then(() => {
        if (this.userTournamentMap[id]) {
          this.userTournamentMap[id].status = 'active';
        }
        this.savedTournamentIds = this.savedTournamentIds.filter((k) => k !== id);
        this.showMessage({
          title: i18n.global.t('messages.saved'),
          text: i18n.global.t('messages.tournamentUnarchived'),
        });
      });
    },
  },
});
