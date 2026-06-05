import {defineStore} from 'pinia';
import {tournamentNames} from "@/helpers";
import {get, getDatabase, ref, set, remove, update, onValue} from "firebase/database";
import {database} from "@/firebase";
import i18n from "@/i18n";

// eslint-disable-next-line no-unused-vars
const actionsRequiringSync = ['savePreferences', 'saveTournamentData', 'finishTournament', 'changeTournamentName', 'setPlayOffStage', 'setPlayOffBracket', 'setPlayOff', 'setCadrage', 'saveCadrageScores', 'restoreRound', 'addRoundToGames', 'endRound', 'startRound', 'shuffleLanesStore', 'swapLanesStore', 'setBarrage', 'setBarrageGames'];

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
                technicalSecond: 7
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
            cochonettesEnabled: true,
            cochonettes: 1,
            groupDrawMethod: 'seeded',
            swissRoundsCount: null,
            prizePlaces: null,
        },
        ...overrides
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
        user: false
    }),
    getters: {
        currentTournament: (state) => state.tournaments[state.currentTournamentIndex],
        allScoresFilled() {
            const tournament = this.currentTournament;
            if (!tournament) return false;
            const activeRound = tournament.games?.length
                ? (tournament.roundIsActive ? tournament.games.length : tournament.games.length + 1)
                : 1;
            const games = tournament.games?.[activeRound - 1];
            if (!games) return false;
            return games.every(g => g.team_1_score !== null && g.team_1_score !== '' && g.team_2_score !== null && g.team_2_score !== '');
        }
    },
    actions: {
        syncToFirebase() {
            clearTimeout(this._syncTimeout);
            this._syncTimeout = setTimeout(() => {
                if (this.user && this.user.uid && this.currentTournamentIndex) {
                    const db = getDatabase();
                    update(ref(db, `${this.user.uid}/tournaments/`), {
                        [this.currentTournamentIndex]: this.tournaments[this.currentTournamentIndex]
                    }).catch(error => {
                        console.error('Error updating specific tournament:', error)
                        this.showMessage({title: i18n.global.t('messages.error'), text: i18n.global.t('messages.failedSaving'), type: 'error'});
                    });
                }
            }, 300);
        },
        syncTirPlayoff() {
            clearTimeout(this._syncTirPlayoffTimeout);
            this._syncTirPlayoffTimeout = setTimeout(() => {
                if (this.user && this.user.uid && this.currentTournamentIndex) {
                    const tournament = this.tournaments[this.currentTournamentIndex];
                    if (!tournament?.tirPlayoff) return;
                    const db = getDatabase();
                    set(ref(db, `${this.user.uid}/tournaments/${this.currentTournamentIndex}/tirPlayoff`), tournament.tirPlayoff)
                        .catch(error => {
                            console.error('Error updating tirPlayoff:', error);
                        });
                }
            }, 200);
        },
        subscribeTournament() {
            this.unsubscribeTournament();
            if (!this.user || !this.user.uid || !this.currentTournamentIndex) return;
            const db = getDatabase();
            const dbRef = ref(db, `${this.user.uid}/tournaments/${this.currentTournamentIndex}`);
            this._tournamentUnsubscribe = onValue(dbRef, (snapshot) => {
                if (!snapshot.exists()) return;
                const remote = snapshot.val();
                const local = this.tournaments[this.currentTournamentIndex];
                if (!local) return;
                if (remote.tirPlayoff && local.tirPlayoff) {
                    this._mergeTirPlayoff(local, remote);
                }
                if (remote.tirParticipants) {
                    local.tirParticipants = remote.tirParticipants;
                }
                if (remote.tirRound !== undefined) local.tirRound = remote.tirRound;
                if (remote.tirR2Participants !== undefined) local.tirR2Participants = remote.tirR2Participants;
                if (remote.tirTiebreakerCount !== undefined) local.tirTiebreakerCount = remote.tirTiebreakerCount;
                if (remote.tirTiebreakerActive !== undefined) local.tirTiebreakerActive = remote.tirTiebreakerActive;
                if (remote.tirTiebreakerParticipantIds !== undefined) local.tirTiebreakerParticipantIds = remote.tirTiebreakerParticipantIds;
                if (remote.tournamentIsFinished) local.tournamentIsFinished = remote.tournamentIsFinished;
            });
        },
        _mergeTirPlayoff(local, remote) {
            const localPlayoff = local.tirPlayoff;
            const remotePlayoff = remote.tirPlayoff;
            if (!remotePlayoff) return;

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
                            const localMatch = localPlayoff.rounds[rIdx].matches[mIdx];
                            if (!localMatch) {
                                localPlayoff.rounds[rIdx].matches[mIdx] = remoteMatch;
                                return;
                            }
                            if (remoteMatch.complete && !localMatch.complete) {
                                Object.assign(localMatch, remoteMatch);
                            } else if (!localMatch.complete && !remoteMatch.complete) {
                                const localThrows = this._countMatchThrows(localMatch);
                                const remoteThrows = this._countMatchThrows(remoteMatch);
                                if (remoteThrows > localThrows) {
                                    Object.assign(localMatch, remoteMatch);
                                }
                            }
                        });
                    });
                }
            }

            if (remotePlayoff.final) {
                if (!localPlayoff.final) {
                    localPlayoff.final = remotePlayoff.final;
                } else if (remotePlayoff.final.complete && !localPlayoff.final.complete) {
                    Object.assign(localPlayoff.final, remotePlayoff.final);
                } else if (!localPlayoff.final.complete) {
                    const localThrows = this._countMatchThrows(localPlayoff.final);
                    const remoteThrows = this._countMatchThrows(remotePlayoff.final);
                    if (remoteThrows > localThrows) {
                        Object.assign(localPlayoff.final, remotePlayoff.final);
                    }
                }
            }

            if (remotePlayoff.thirdPlace) {
                if (!localPlayoff.thirdPlace) {
                    localPlayoff.thirdPlace = remotePlayoff.thirdPlace;
                } else if (remotePlayoff.thirdPlace.complete && !localPlayoff.thirdPlace.complete) {
                    Object.assign(localPlayoff.thirdPlace, remotePlayoff.thirdPlace);
                } else if (!localPlayoff.thirdPlace.complete) {
                    const localThrows = this._countMatchThrows(localPlayoff.thirdPlace);
                    const remoteThrows = this._countMatchThrows(remotePlayoff.thirdPlace);
                    if (remoteThrows > localThrows) {
                        Object.assign(localPlayoff.thirdPlace, remotePlayoff.thirdPlace);
                    }
                }
            }

            if (remotePlayoff.qualified) localPlayoff.qualified = remotePlayoff.qualified;
            if (remotePlayoff.size) localPlayoff.size = remotePlayoff.size;
        },
        _countMatchThrows(match) {
            let count = 0;
            ['scores1', 'scores2'].forEach(key => {
                const scores = match[key];
                if (scores && typeof scores === 'object') {
                    Object.values(scores).forEach(atelier => {
                        if (atelier && typeof atelier === 'object') {
                            count += Object.keys(atelier).length;
                        }
                    });
                }
            });
            return count;
        },
        unsubscribeTournament() {
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
            this.syncToFirebase();
        },
        shuffleLanesStore(games) {
            this.tournaments[this.currentTournamentIndex].games[this.tournaments[this.currentTournamentIndex].games.length - 1] = games;
            this.tournaments[this.currentTournamentIndex].teams.forEach(team => team.lanes.pop())
            this.saveLanesToTeams(games);
            this.syncToFirebase();
        },
        swapLanesStore({ roundIndex, indexA, indexB }) {
            const games = this.tournaments[this.currentTournamentIndex].games[roundIndex];
            const temp = games[indexA];
            games[indexA] = games[indexB];
            games[indexB] = temp;
            const tempLane = games[indexA].lane;
            games[indexA].lane = games[indexB].lane;
            games[indexB].lane = tempLane;
            this.tournaments[this.currentTournamentIndex].teams.forEach(team => {
                if (team.lanes) team.lanes.pop();
            });
            this.saveLanesToTeams(games);
            this.syncToFirebase();
        },
        saveLanesToTeams(games) {
            games.map(game => {
                this.tournaments[this.currentTournamentIndex].teams.map(team => {
                    if (!team.lanes) team.lanes = [];
                    if ((team.title === game.team_1) && game.lane != null) {
                        team.lanes.push(game.lane)
                    }
                    if ((team.title === game.team_2) && game.lane != null) {
                        team.lanes.push(game.lane)
                    }
                })
            })
        },
        setTournaments(tournaments) {
            this.tournaments = tournaments;
            if (!Object.keys(this.tournaments).length) {
                this.addTournament();
            }
            const pinned = localStorage.getItem('petanqueDrawPinned');
            if (pinned && this.tournaments[pinned]) {
                this.setActiveTournament(pinned);
            } else {
                this.setActiveTournament(this.tournaments[Object.keys(this.tournaments)[Object.keys(this.tournaments).length - 1]].id)
            }
        },
        setSavedTournaments(tournaments) {
            this.savedTournaments = tournaments;
        },
        setTournamentIdFromPortal(value) {
            this.tournaments[this.currentTournamentIndex].portalIdTournament = value
        },
        setTournamentInfoFromPortal(info) {
            this.tournaments[this.currentTournamentIndex].name = info.name
            this.tournaments[this.currentTournamentIndex].date = info.start_date
        },
        loginUser(value) {
            this.user = value;
        },
        setActiveTournament(index) {
            this.currentTournamentIndex = index
        },
        changeTournamentName(name) {
            this.tournaments[this.currentTournamentIndex].name = name
            this.syncToFirebase();
        },
        removeTournament() {
            const db = getDatabase();
            const dataRef = ref(db, `${this.user.uid}/tournaments/${this.currentTournamentIndex}`);
            const tokensRef = ref(db, `tokens/${this.user.uid}/${this.currentTournamentIndex}`);

            remove(tokensRef)
                .catch((error) => {
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
                    this.showMessage({title: i18n.global.t('messages.removed'), text: i18n.global.t('messages.tournamentRemoved')});
                })
                .catch((error) => {
                    console.error('Error deleting data:', error);
                    this.showMessage({title: i18n.global.t('messages.error'), text: error, type: 'error'});
                });
        },
        addTeamToStore(team) {
            if (!this.tournaments[this.currentTournamentIndex].teams) {
                this.tournaments[this.currentTournamentIndex].teams = []
            }
            this.tournaments[this.currentTournamentIndex].teams.push(team);
            localStorage.setItem('petanqueDrawTeamsRestore', JSON.stringify(this.tournaments[this.currentTournamentIndex].teams));
        },
        removeTeam(titleToRemove) {
            this.tournaments[this.currentTournamentIndex].teams = this.tournaments[this.currentTournamentIndex].teams.filter(team => team.title !== titleToRemove);
        },
        changeDrawType(value) {
            this.tournaments[this.currentTournamentIndex].useRating = value;
        },
        startRound() {
            this.tournaments[this.currentTournamentIndex].roundIsActive = true;
            this.syncToFirebase();
        },
        endRound() {
            this.tournaments[this.currentTournamentIndex].roundIsActive = false;
            this.syncToFirebase();
        },
        addRoundToGames(round) {
            if (!this.tournaments[this.currentTournamentIndex].games) {
                this.tournaments[this.currentTournamentIndex].games = []
            }
            this.tournaments[this.currentTournamentIndex].games.push(round);
            this.tournaments[this.currentTournamentIndex].roundIsActive = true;
            this.saveLanesToTeams(round);
            this.syncToFirebase();
        },
        restoreRound() {
            this.tournaments[this.currentTournamentIndex].games.pop();
            this.tournaments[this.currentTournamentIndex].teams.forEach(team => team.opponents.pop())
            this.tournaments[this.currentTournamentIndex].teams.forEach(team => team.lanes.pop())
            this.syncToFirebase();
        },
        setPlayOff(scheme) {
            this.tournaments[this.currentTournamentIndex].playOff = scheme
            this.syncToFirebase();
        },
        setCadrage(games) {
            this.tournaments[this.currentTournamentIndex].cadrage = games;
            this.tournaments[this.currentTournamentIndex].isCadrage = true;
            this.syncToFirebase();
        },
        setBarrage(barrage) {
            this.tournaments[this.currentTournamentIndex].barrage = barrage;
            this.syncToFirebase();
        },
        setBarrageGames(games) {
            this.tournaments[this.currentTournamentIndex].games = games;
            this.syncToFirebase();
        },
        saveCadrageScores() {
            this.tournaments[this.currentTournamentIndex].cadrage = [...this.tournaments[this.currentTournamentIndex].cadrage];
            this.syncToFirebase();
        },
        setPlayOffBracket(bracket) {
            this.tournaments[this.currentTournamentIndex].playOffBracket = bracket
            this.syncToFirebase();
        },
        setPlayOffStage(stage) {
            this.tournaments[this.currentTournamentIndex].playOffStage = stage
            this.syncToFirebase();
        },
        updateGameScore({activeRound, gameIndex, team, score}) {
            this.tournaments[this.currentTournamentIndex].games[activeRound][gameIndex][team] = score;
        },
        finishTournament() {
            this.tournaments[this.currentTournamentIndex].tournamentIsFinished = true
            this.syncToFirebase();
        },
        showMessage({title, text, type = 'success'}) {
            this.message = {
                show: true,
                title: title,
                text: text,
                type: type,
            }
        },
        hideMessage() {
            this.message.show = false
        },
        addTournament(overrides = {}) {
            if (Object.keys(this.tournaments).length >= 10) {
                this.showMessage({title: i18n.global.t('messages.notAvailable'), text: i18n.global.t('messages.maxTournaments'), type: 'error'});
                return false
            }
            const tournamentId = Date.now();
            const tournament = createTournament({id: tournamentId, createdAt: new Date().toISOString(), ...overrides});
            this.tournaments[tournament.id] = tournament;
            this.currentTournamentIndex = tournamentId;
            this.changeTournamentName(`Tournament ${tournamentNames[Object.keys(this.tournaments).length - 1]}`);
        },
        addToSaved(tournament) {
            const db = getDatabase();
            set(ref(db, `${this.user.uid}/saved/${tournament.id}`), tournament).then(() => {
                this.savedTournaments[tournament.id] = tournament;
                this.showMessage({title: i18n.global.t('messages.saved'), text: i18n.global.t('messages.tournamentSavedList')});
            }).catch((error) => {
                console.error('Error save:', error);
                this.showMessage({title: i18n.global.t('messages.error'), text: error, type: 'error'});
            });
        },
        removeSavedTournament(id) {
            const db = getDatabase();
            const dataRef = ref(db, `${this.user.uid}/saved/${id}`);

            remove(dataRef)
                .then(() => {
                    delete this.savedTournaments[id];
                    this.showMessage({title: i18n.global.t('messages.removed'), text: i18n.global.t('messages.tournamentRemovedSaved')});
                })
                .catch((error) => {
                    console.error('Error deleting data:', error);
                    this.showMessage({title: i18n.global.t('messages.error'), text: error, type: 'error'});
                });
        },
        addBTournament(teams, name, isGroupB) {
            this.addTournament({teams: [...teams]});
            if (name) {
                this.changeTournamentName(name);
            }
            if (isGroupB) {
                this.tournaments[this.currentTournamentIndex].isGroupB = true;
                this.syncToFirebase();
            }
        },
        saveTournamentData() {
            this.showMessage({title: i18n.global.t('messages.saved'), text: i18n.global.t('messages.tournamentDataSaved')});
            this.syncToFirebase();
        }
    }
});
