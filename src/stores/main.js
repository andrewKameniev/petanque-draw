import {defineStore} from 'pinia';
import {tournamentNames} from "@/helpers";
import {get, getDatabase, ref, set, remove, update} from "firebase/database";
import {database} from "@/firebase";
import i18n from "@/i18n";

const actionsRequiringSync = ['savePreferences', 'saveTournamentData', 'finishTournament', 'changeTournamentName', 'setPlayOffStage', 'setPlayOffBracket', 'setPlayOff', 'setCadrage', 'saveCadrageScores', 'restoreRound', 'addRoundToGames', 'endRound', 'startRound', 'shuffleLanesStore'];

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
            fieldsStart: 1,
            withCadrage: false,
            playB: false
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
        savePreferences(preferences) {
            console.log(preferences);
            this.syncToFirebase();
        },
        shuffleLanesStore(games) {
            this.tournaments[this.currentTournamentIndex].games[this.tournaments[this.currentTournamentIndex].games.length - 1] = games;
            this.tournaments[this.currentTournamentIndex].teams.forEach(team => team.lanes.pop())
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
