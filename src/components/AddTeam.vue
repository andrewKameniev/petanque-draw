<template>
    <div class="columns">
        <div class="column is-three-fifths">
            <div class="field control">
                <input v-model="tournamentId" @keydown.enter="importList" class="input" type="number" placeholder="Tournament ID">
            </div>
        </div>
        <div class="column is-two-fifths">
            <div class="field control">
                <button class="button is-success is-fullwidth" @click="importList">Import from portal</button>
            </div>
        </div>
    </div>
    <div class="columns">
        <div class="column is-three-fifths-desktop is-two-fifths-tablet">
            <div class="field control">
                <input v-model="teamTitle" @keyup.enter="addTeam(teamTitle, teamRating)" class="input" type="text" placeholder="Team title">
            </div>
        </div>
        <div class="column is-one-fifth" v-if="showRating">
            <div class="field control">
                <input v-model="teamRating" @keyup.enter="addTeam(teamTitle, teamRating)" class="input" type="number" id="rating" placeholder="Rating">
            </div>
        </div>
        <div class="column is-one-fifth-desktop is-two-fifths-tablet is-full-mobile">
            <div class="field control">
                <button class="button is-success is-fullwidth" @click="addTeam(teamTitle, teamRating)">Add team</button>
            </div>
        </div>
    </div>
    <div>
         <label class="checkbox">
              <input type="checkbox" :checked="showRating" @change="changeDraw($event.target.checked)">
              Use team rating for drawing (else first round will be drawed randomly)
        </label>
    </div>
</template>

<script>
export default {
    name: 'AddTeam',
    props: ['showRating'],
    data(){
        return {
            teamTitle: null,
            teamRating: null,
            tournamentId: null,
        }
    },
    emits: ['add-team', 'change-draw-style'],
    methods: {
        changeDraw(value){
            this.$emit('change-draw-style', value)
        },
        addTeam(title, rating, players = false){
            this.$emit('add-team', title.trim(), rating, players);
            this.teamTitle = null;
            this.teamRating = null;
        },
        async importList(){
            let response = await fetch(`https://portal.petanque.org.ua/tournament/team_export/${this.tournamentId}?format=json`);

            if (response.ok) {
                let importedList = await response.json();

                importedList.teams.forEach(team => {
                    this.addTeam(team.name, +team.power, team.players);
                } )

            } else {
                alert("Error" + response.status);
            }
        }
    },
}
</script>