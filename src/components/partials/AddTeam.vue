<template>
    <div class="columns" v-if="!importHidden">
        <div class="column is-three-fifths">
            <div class="field control">
                <input v-model="tournamentId" @keydown.enter="importList" class="input" type="number" :placeholder="$t('teams.tournamentId')">
            </div>
        </div>
        <div class="column is-two-fifths">
            <div class="field control">
                <button class="button is-success is-fullwidth" @click="importList">{{ $t('teams.importPortal') }}</button>
            </div>
        </div>
    </div>
    <div class="columns">
        <div class="column is-three-fifths-desktop is-two-fifths-tablet">
            <div class="field control">
                <input v-model="teamTitle" @keyup.enter="addTeam(teamTitle, teamRating)" class="input" type="text" :placeholder="$t('teams.teamTitle')">
            </div>
        </div>
        <div class="column is-one-fifth" v-if="tournament.useRating">
            <div class="field control">
                <input v-model="teamRating" @keyup.enter="addTeam(teamTitle, teamRating)" class="input" type="number" id="rating" :placeholder="$t('teams.rating')">
            </div>
        </div>
        <div class="column is-one-fifth-desktop is-two-fifths-tablet is-full-mobile">
            <div class="field control">
                <button class="button is-success is-fullwidth" @click="addTeam(teamTitle, teamRating)">{{ $t('teams.addTeam') }}</button>
            </div>
        </div>
    </div>
    <div>
         <label class="checkbox">
              <input type="checkbox" :checked="tournament.useRating" @change="changeDrawType($event.target.checked)">
             {{ $t('teams.useTeamRating') }}
        </label>
    </div>
</template>

<script>
import {mapMutations, mapState} from "vuex";

export default {
    name: 'AddTeam',
    props: ['importHidden'],
    data(){
        return {
            teamTitle: null,
            teamRating: null,
            tournamentId: null,
        }
    },
    emits: ['add-team', 'change-draw-style'],
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex']),
        tournament() {
            return this.tournaments[this.currentTournamentIndex]
        },
    },
    methods: {
        ...mapMutations(['addTeamToStore', 'changeDrawType', 'showMessage', 'setTournamentIdFromPortal', 'setTournamentInfoFromPortal']),
        addTeam(title, rating, players = false){
            if(title !== null && title !== ''){
                let teamExists = false;
                if (!this.tournament.teams) {
                    this.tournament.teams = [];
                }
                this.tournament.teams.forEach(team => {
                    if(team.title === title){
                        teamExists = true;
                    }
                });
                if(!teamExists){
                    const team = {
                        title: title.trim(),
                        rating: rating,
                        players: players,
                        wins: 0,
                        buhgolts: 0,
                        smallBuhgolts: 0,
                        pointsPlus: 0,
                        pointsMinus: 0,
                        opponents: ['placeholder'],
                        lanes: [],
                    }
                    this.addTeamToStore(team)
                    this.teamTitle = null;
                    this.teamRating = null;
                } else {
                    this.showMessage({title: this.$t('messages.error'), text: this.$t('messages.teamExists'), type: 'error'});
                }
            } else {
                this.showMessage({title: this.$t('messages.error'), text: this.$t('messages.enterFields'), type: 'error'});
            }

        },
        async importList(){
            let response = await fetch(`https://portal.petanque.org.ua/tournament/team_export/${this.tournamentId}?format=json`);

            if (response.ok) {
                let importedList = await response.json();

                importedList.teams.forEach(team => {
                    this.addTeam(team.name, +team.power, team.players);
                } )
                this.setTournamentInfoFromPortal(importedList.tournament);
                this.setTournamentIdFromPortal(this.tournamentId);

            } else {
                alert("Error" + response.status);
            }
        }
    },
}
</script>