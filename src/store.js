import { createStore } from 'vuex';
import {tournamentNames} from "@/helpers";
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
            tournaments: localStorage.getItem('tournaments') ?
                JSON.parse(localStorage.getItem('tournaments')) : [JSON.parse(JSON.stringify(newTournament))],
            message: {
                show: false,
                type: 'success',
                title: 'Message',
                text: '',
            },
            savedTournaments: localStorage.getItem('tournamentsList') ?  JSON.parse(localStorage.getItem('tournamentsList')) : [],
            currentTournamentIndex: null,
            isAdmin: false
        }
    },
    mutations: {
        setTournamentIdFromPortal(state, value) {
            state.tournaments[state.currentTournamentIndex].portalIdTournament = value
        },
        loginAdmin (state, value) {
            state.isAdmin = value;
            if(!value) {
                localStorage.removeItem("isAdmin")
            }
        },
        setActiveTournament (state, index) {
            state.currentTournamentIndex = index
        },
        changeTournamentName(state, name) {
            state.tournaments[state.currentTournamentIndex].name = name
        },
        removeTournament (state) {
            if (state.tournaments.length > 1) {
                state.tournaments.splice(state.currentTournamentIndex, 1);
                state.currentTournamentIndex = 0
            } else {
                state.tournaments[state.currentTournamentIndex] = JSON.parse(JSON.stringify(newTournament));
            }
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
            if (state.tournaments.length >= 10) {
                store.commit('showMessage', {title: 'Not available', text: 'You can make only 10 tournaments simultaneously. Remove old tournaments, please', type: 'error'});
                return false
            }
            state.tournaments.push(JSON.parse(JSON.stringify(newTournament)));
            state.currentTournamentIndex = state.tournaments.length - 1;
            store.commit('changeTournamentName', `Tournament ${tournamentNames[state.tournaments.length - 1]}`);
        },
        addToSaved(state, tournament) {
            state.savedTournaments.push(tournament)
        },
        removeSavedTournament (state, name) {
            state.savedTournaments = state.savedTournaments.filter(item => item.name !== name)
        },
        addBTournament(state, teams) {
            store.commit('addTournament');
            state.tournaments[state.currentTournamentIndex].teams = teams
        }
    }
})

store.subscribe((mutation, state) => {
    localStorage.setItem('tournaments', JSON.stringify(state.tournaments));
    localStorage.setItem('tournamentsList', JSON.stringify(state.savedTournaments));
});

export {store}