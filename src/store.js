import { createStore } from 'vuex';
import {tournamentNames} from "@/helpers";
import {get, getDatabase, ref, set, remove, update} from "firebase/database";
import {database} from "@/firebase";
const mutationsAfterUpdateDb = ['finishTournament', 'changeTournamentName', 'setPlayOffStage', 'setPlayOffBracket', 'setPlayOff', 'restoreRound', 'addRoundToGames', 'endRound', 'startRound'];
const newTournament = {
    name: 'Tournament A',
    games: [],
    gamesCopy: [],
    teams: [],
    system: 'swiss',
    roundIsActive: false,
    useRating: false,
    isPlayOff: false,
    playoff: false,
    supermelePlayers: 2,
    tournamentIsFinished: false,
    tournamentMessage: '',
    preferences: {
        technical: {
            technicalFirst: 13,
            technicalSecond: 7
        },
        maxScore: 13
    }
}
const store = createStore({
    state () {
        return {
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
        }
    },
    actions: {
        async getTournaments({state, commit}) {
            const dbRef = ref(database, `${state.user.uid}/tournaments/`);
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                commit('setTournaments', snapshot.val());
            } else {
                commit('setTournaments', {});
            }
            const dbRefSaved = ref(database, `${state.user.uid}/saved/`);
            const snapshotSaved = await get(dbRefSaved);
            if (snapshot.exists() && snapshotSaved.val() !== null) {
                commit('setSavedTournaments', snapshotSaved.val());
            } else {
                commit('setSavedTournaments', {});
            }
        },
    },
    mutations: {
        setTournaments(state, tournaments) {
            state.tournaments = tournaments;
            if (!Object.keys(state.tournaments).length) {
                store.commit('addTournament');
            }
            store.commit('setActiveTournament', state.tournaments[Object.keys(state.tournaments)[Object.keys(state.tournaments).length - 1]].id)
        },
        setSavedTournaments(state, tournaments) {
            state.savedTournaments = tournaments;
        },
        setTournamentIdFromPortal(state, value) {
            state.tournaments[state.currentTournamentIndex].portalIdTournament = value
        },
        setTournamentInfoFromPortal(state, info) {
            state.tournaments[state.currentTournamentIndex].name = info.name
            state.tournaments[state.currentTournamentIndex].date = info.start_date
        },
        loginAdmin (state, value) {
            state.isAdmin = value;
            if(!value) {
                localStorage.removeItem("isAdmin")
            }
        },
        loginUser (state, value) {
            state.user = value;
            if(!value) {
                // localStorage.removeItem("isAdmin")
            }
        },
        setActiveTournament (state, index) {
            state.currentTournamentIndex = index
        },
        changeTournamentName(state, name) {
            state.tournaments[state.currentTournamentIndex].name = name
        },
        removeTournament (state) {
            const db = getDatabase();
            const dataRef = ref(db, `${state.user.uid}/tournaments/${state.currentTournamentIndex}`);

            remove(dataRef)
                .then(() => {
                    delete state.tournaments[state.currentTournamentIndex];
                    if (Object.keys(state.tournaments).length >= 1) {
                        state.currentTournamentIndex = Object.keys(state.tournaments)[0];
                    } else {
                        store.commit('addTournament');
                    }
                    store.commit('showMessage', {title: 'Removed', text: 'Tournament has been removed'});
                })
                .catch((error) => {
                    console.error('Error deleting data:', error);
                    store.commit('showMessage', {title: 'error', text: error, type: 'error'});
                });
        },
        addTeamToStore (state, team) {
            if(!state.tournaments[state.currentTournamentIndex].teams) {
                state.tournaments[state.currentTournamentIndex].teams = []
            }
            state.tournaments[state.currentTournamentIndex].teams.push(team);
            localStorage.setItem('petanqueDrawTeamsRestore', JSON.stringify(state.tournaments[state.currentTournamentIndex].teams));
        },
        removeTeam (state, titleToRemove){
            state.tournaments[state.currentTournamentIndex].teams = state.tournaments[state.currentTournamentIndex].teams.filter(team => team.title !== titleToRemove);
        },
        changeDrawType (state, value) {
            state.tournaments[state.currentTournamentIndex].useRating = value;
        },
        startRound (state) {
            state.tournaments[state.currentTournamentIndex].roundIsActive = true;
        },
        endRound (state) {
            state.tournaments[state.currentTournamentIndex].roundIsActive = false;
        },
        addRoundToGames(state, round){
            if (!state.tournaments[state.currentTournamentIndex].games) {
                state.tournaments[state.currentTournamentIndex].games = []
            }
            state.tournaments[state.currentTournamentIndex].games.push(round);
            if (!state.tournaments[state.currentTournamentIndex].gamesCopy) {
                state.tournaments[state.currentTournamentIndex].gamesCopy = []
            }
            state.tournaments[state.currentTournamentIndex].gamesCopy.push(round);
            state.tournaments[state.currentTournamentIndex].roundIsActive = true;
        },
        restoreRound(state) {
            state.tournaments[state.currentTournamentIndex].games.pop()
            state.tournaments[state.currentTournamentIndex].teams.forEach(team => team.opponents.pop())
        },
        setPlayOff(state, scheme) {
            state.tournaments[state.currentTournamentIndex].playOff = scheme
        },
        setPlayOffBracket(state, bracket) {
            state.tournaments[state.currentTournamentIndex].playOffBracket = bracket
        },
        setPlayOffStage(state, stage) {
            state.tournaments[state.currentTournamentIndex].playOffStage = stage
        },
        finishTournament(state) {
            state.tournaments[state.currentTournamentIndex].tournamentIsFinished = true
        },
        showMessage(state, {title, text, type = 'success'}){
            state.message = {
                show: true,
                title: title,
                text: text,
                type: type,
            }
        },
        hideMessage(state) {
            state.message.show = false
        },
        addTournament(state) {
            if (Object.keys(state.tournaments).length >=10) {
                store.commit('showMessage', {title: 'Not available', text: 'You can make only 10 tournaments simultaneously. Remove old tournaments, please', type: 'error'});
                return false
            }
            const tournamentId = Date.now();
            newTournament.id = tournamentId;
            state.tournaments[newTournament.id] = JSON.parse(JSON.stringify(newTournament));
            state.currentTournamentIndex = tournamentId;
            store.commit('changeTournamentName', `Tournament ${tournamentNames[Object.keys(state.tournaments).length - 1]}`);
        },
        addToSaved(state, tournament) {
            const db = getDatabase();
            set(ref(db, `${state.user.uid}/saved/${tournament.id}`), tournament).then(() => {
                state.savedTournaments[tournament.id] = tournament;
                store.commit('showMessage', {title: 'Saved', text: 'You can see your saved tournaments in the menu'});
            }).catch((error) => {
                console.error('Error save:', error);
                store.commit('showMessage', {title: 'error', text: error, type: 'error'});
            });
        },
        removeSavedTournament (state, id) {
            const db = getDatabase();
            const dataRef = ref(db, `${state.user.uid}/saved/${id}`);

            remove(dataRef)
                .then(() => {
                    delete state.savedTournaments[id];
                    console.log('Data successfully deleted');
                    store.commit('showMessage', {title: 'Removed', text: 'Tournament removed from your saved tournaments'});
                })
                .catch((error) => {
                    console.error('Error deleting data:', error);
                    store.commit('showMessage', {title: 'error', text: error, type: 'error'});
                });
        },
        addBTournament(state, teams) {
            newTournament.teams = teams;
            store.commit('addTournament');
            newTournament.teams = [];
        }
    }
})

store.subscribe((mutation, state) => {
    if (mutationsAfterUpdateDb.includes(mutation.type)) {
        if (state.user && state.user.uid && state.currentTournamentIndex) {
            const db = getDatabase();
            update(ref(db, `${state.user.uid}/tournaments/`), {
                [state.currentTournamentIndex]: state.tournaments[state.currentTournamentIndex]
            }).catch(error => console.error('Error updating specific tournament:', error));
        }
    }
});

export {store}