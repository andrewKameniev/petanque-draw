import { createStore } from 'vuex';
import {tournamentNames} from "@/helpers";
import {tournamentService, savedService} from "@/services/db";
import i18n from "@/i18n";
const mutationsAfterUpdateDb = ['savePreferences', 'saveTournamentData', 'finishTournament', 'changeTournamentName', 'setPlayOffStage', 'setPlayOffBracket', 'setPlayOff', 'setCadrage', 'saveCadrageScores', 'restoreRound', 'addRoundToGames', 'endRound', 'startRound', 'shuffleLanesStore'];
const newTournament = {
    name: 'Tournament A',
    games: [],
    gamesCopy: [],
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
        fieldsStart: 1
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
    getters: {
        currentTournament: (state) => state.tournaments[state.currentTournamentIndex]
    },
    actions: {
        async getTournaments({state, commit}) {
            const snapshot = await tournamentService.getAll(state.user.uid);
            if (snapshot.exists()) {
                commit('setTournaments', snapshot.val());
            } else {
                commit('setTournaments', {});
            }
            const snapshotSaved = await savedService.getAll(state.user.uid);
            if (snapshot.exists() && snapshotSaved.val() !== null) {
                commit('setSavedTournaments', snapshotSaved.val());
            } else {
                commit('setSavedTournaments', {});
            }
        },
        async removeTournament({state, commit}) {
            try {
                await tournamentService.removeTokens(state.user.uid, state.currentTournamentIndex);
            } catch (error) {
                console.error('Error deleting tokens:', error);
            }

            try {
                await tournamentService.remove(state.user.uid, state.currentTournamentIndex);
                delete state.tournaments[state.currentTournamentIndex];
                if (Object.keys(state.tournaments).length >= 1) {
                    state.currentTournamentIndex = Object.keys(state.tournaments)[0];
                } else {
                    commit('addTournament');
                }
                commit('showMessage', {title: i18n.global.t('messages.removed'), text: i18n.global.t('messages.tournamentRemoved')});
            } catch (error) {
                console.error('Error deleting data:', error);
                commit('showMessage', {title: i18n.global.t('messages.error'), text: error, type: 'error'});
            }
        },
        async addToSaved({state, commit}, tournament) {
            try {
                await savedService.save(state.user.uid, tournament.id, tournament);
                state.savedTournaments[tournament.id] = tournament;
                commit('showMessage', {title: i18n.global.t('messages.saved'), text: i18n.global.t('messages.tournamentSavedList')});
            } catch (error) {
                console.error('Error save:', error);
                commit('showMessage', {title: i18n.global.t('messages.error'), text: error, type: 'error'});
            }
        },
        async removeSavedTournament({state, commit}, id) {
            try {
                await savedService.remove(state.user.uid, id);
                delete state.savedTournaments[id];
                commit('showMessage', {title: i18n.global.t('messages.removed'), text: i18n.global.t('messages.tournamentRemovedSaved')});
            } catch (error) {
                console.error('Error deleting data:', error);
                commit('showMessage', {title: i18n.global.t('messages.error'), text: error, type: 'error'});
            }
        },
    },
    mutations: {
        savePreferences(state, preferences) {
            console.log(state, preferences);
        },
        shuffleLanesStore(state, games) {
            state.tournaments[state.currentTournamentIndex].games[state.tournaments[state.currentTournamentIndex].games.length - 1] = games;
            state.tournaments[state.currentTournamentIndex].teams.forEach(team => team.lanes.pop())
            store.commit('saveLanesToTeams', games);
        },
        saveLanesToTeams(state, games) {
            games.map(game => {
                state.tournaments[state.currentTournamentIndex].teams.map(team => {
                    if ((team.title === game.team_1) && game.lane != null) {
                        team.lanes.push(game.lane)
                    }
                    if ((team.title === game.team_2) && game.lane != null) {
                        team.lanes.push(game.lane)
                    }
                })
            })
        },
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
        loginUser (state, value) {
            state.user = value;
        },
        setActiveTournament (state, index) {
            state.currentTournamentIndex = index
        },
        changeTournamentName(state, name) {
            state.tournaments[state.currentTournamentIndex].name = name
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
            if (!state.tournaments[state.currentTournamentIndex].tournamentIsStarted) {
                state.tournaments[state.currentTournamentIndex].tournamentIsStarted = true;
                state.tournaments[state.currentTournamentIndex].startedAt = new Date().toISOString();
            }
            state.tournaments[state.currentTournamentIndex].games.push(round);
            if (!state.tournaments[state.currentTournamentIndex].gamesCopy) {
                state.tournaments[state.currentTournamentIndex].gamesCopy = []
            }
            state.tournaments[state.currentTournamentIndex].gamesCopy.push(round);
            state.tournaments[state.currentTournamentIndex].roundIsActive = true;
            store.commit('saveLanesToTeams', round);
        },
        restoreRound(state) {
            state.tournaments[state.currentTournamentIndex].games.pop();
            state.tournaments[state.currentTournamentIndex].teams.forEach(team => team.opponents.pop())
            state.tournaments[state.currentTournamentIndex].teams.forEach(team => team.lanes.pop())
        },
        setPlayOff(state, scheme) {
            state.tournaments[state.currentTournamentIndex].playOff = scheme
        },
        setCadrage(state, games) {
            state.tournaments[state.currentTournamentIndex].cadrage = games;
            state.tournaments[state.currentTournamentIndex].isCadrage = true;
        },
        saveCadrageScores(state) {
            state.tournaments[state.currentTournamentIndex].cadrage = [...state.tournaments[state.currentTournamentIndex].cadrage];
        },
        setPlayOffBracket(state, bracket) {
            state.tournaments[state.currentTournamentIndex].playOffBracket = bracket
        },
        setPlayOffStage(state, stage) {
            state.tournaments[state.currentTournamentIndex].playOffStage = stage
        },
        updateGameScore(state, { activeRound, gameIndex, team, score }) {
            state.tournaments[state.currentTournamentIndex].games[activeRound][gameIndex][team] = score;
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
                store.commit('showMessage', {title: i18n.global.t('messages.notAvailable'), text: i18n.global.t('messages.maxTournaments'), type: 'error'});
                return false
            }
            const tournamentId = Date.now();
            newTournament.id = tournamentId;
            newTournament.createdAt = new Date().toISOString();
            state.tournaments[newTournament.id] = JSON.parse(JSON.stringify(newTournament));
            state.currentTournamentIndex = tournamentId;
            store.commit('changeTournamentName', `Tournament ${tournamentNames[Object.keys(state.tournaments).length - 1]}`);
        },
        addBTournament(state, teams) {
            newTournament.teams = teams;
            store.commit('addTournament');
            newTournament.teams = [];
        },
        saveTournamentData() {
            store.commit('showMessage', {title: i18n.global.t('messages.saved'), text: i18n.global.t('messages.tournamentDataSaved')});
        }
    }
})

store.subscribe((mutation, state) => {
    if (mutationsAfterUpdateDb.includes(mutation.type)) {
        if (state.user && state.user.uid && state.currentTournamentIndex) {
            tournamentService.update(state.user.uid, state.currentTournamentIndex, state.tournaments[state.currentTournamentIndex])
                .catch(error => {
                    console.error('Error updating specific tournament:', error)
                    store.commit('showMessage', {title: i18n.global.t('messages.error'), text: i18n.global.t('messages.failedSaving'), type: 'error'});
                });
        }
    }
});

export {store}