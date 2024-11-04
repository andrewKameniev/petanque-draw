import { createStore } from 'vuex';
import {tournamentNames} from "@/helpers";
import {get, getDatabase, ref, set, remove, update} from "firebase/database";
import {database} from "@/firebase";
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
            tournaments: [],
            message: {
                show: false,
                type: 'success',
                title: 'Message',
                text: '',
            },
            savedTournaments: [],
            currentTournamentIndex: null,
            isAdmin: false,
            user: false
        }
    },
    actions: {
        async getTournaments({state, commit}) {
            if (state.user) {
                const dbRef = ref(database, `${state.user.uid}/tournaments/`);
                const snapshot = await get(dbRef);
                console.log(snapshot);
                if (snapshot.exists()) {
                    console.log(1111);
                    commit('setTournaments', snapshot.val());
                } else {
                    console.log(222);
                    commit('setTournaments', {});
                }
                const dbRefSaved = ref(database, `${state.user.uid}/saved/`);
                const snapshotSaved = await get(dbRefSaved);
                if (snapshot.exists()) {
                    commit('setSavedTournaments', snapshotSaved.val());
                } else {
                    commit('setSavedTournaments', {});
                }
            } else {
                const tournaments = localStorage.getItem('tournaments') ?
                    JSON.parse(localStorage.getItem('tournaments')) : {
                    [newTournament.id]: JSON.parse(JSON.stringify(newTournament))
                    };
                commit('setTournaments', tournaments);
                const savedTournaments = localStorage.getItem('tournamentsList') ?
                    JSON.parse(localStorage.getItem('tournamentsList')) : {};
                commit('setSavedTournaments', savedTournaments);
            }
        },
    },
    mutations: {
        setTournaments(state, tournaments) {
            state.tournaments = tournaments;
            console.log(tournaments);
            store.commit('setActiveTournament', Object.keys(state.tournaments).length - 1)
            console.log(Object.keys(state.tournaments).length);
            if (!Object.keys(state.tournaments).length) {
                console.log(1);
                store.commit('addTournament');
            }
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
                    if (Object.keys(state.tournaments).length > 1) {
                        state.currentTournamentIndex = Object.keys(state.tournaments)[0];
                    } else {
                        store.commit('addTournament');
                        // state.tournaments[newTournament.id] = JSON.parse(JSON.stringify(newTournament));
                    }
                    console.log('Data successfully deleted');
                })
                .catch((error) => {
                    console.error('Error deleting data:', error);
                });
        },
        addTeamToStore (state, team) {
            state.tournaments[state.currentTournamentIndex].teams.push(team);
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
            state.tournaments[state.currentTournamentIndex].games.push(round);
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
            newTournament.id = Date.now();
            state.tournaments[newTournament.id] = newTournament;
            state.currentTournamentIndex = newTournament.id;
            store.commit('changeTournamentName', `Tournament ${tournamentNames[Object.keys(state.tournaments).length - 1]}`);

        },
        addToSaved(state, tournament) {
            const db = getDatabase();
            set(ref(db, `${state.user.uid}/saved/${tournament.id}`), tournament);
            state.savedTournaments[tournament.id] = tournament;
        },
        removeSavedTournament (state, id) {
            const db = getDatabase();
            const dataRef = ref(db, `${state.user.uid}/saved/${id}`);

            remove(dataRef)
                .then(() => {
                    delete state.savedTournaments[id];
                    console.log('Data successfully deleted');
                })
                .catch((error) => {
                    console.error('Error deleting data:', error);
                });
        },
        addBTournament(state, teams) {
            store.commit('addTournament');
            state.tournaments[state.currentTournamentIndex].teams = teams
        }
    }
})

store.subscribe((mutation, state) => {
    console.log(mutation);
    if (mutation.type !== 'LoginUser' && mutation.type !== 'setSavedTournaments') {
        if (state.user && state.user.uid && state.currentTournamentIndex) {
            localStorage.setItem('tournaments', JSON.stringify(state.tournaments));
            const db = getDatabase();
            update(ref(db, `${state.user.uid}/tournaments/`), {
                [state.currentTournamentIndex]: state.tournaments[state.currentTournamentIndex]
            }).catch(error => console.error('Error updating specific tournament:', error));
            // localStorage.setItem('tournamentsList', JSON.stringify(state.savedTournaments));
            // set(ref(db, `${state.user.uid}/saved/`), state.savedTournaments);
        }
    }


});

export {store}