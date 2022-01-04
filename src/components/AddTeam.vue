<template>
 <div class="field is-grouped">
    <div class="control">
        <input v-model="tournamentId" @keydown.enter="importList" class="input" type="number" placeholder="Tournament ID">
    </div>
    <div class="control">
        <button class="button is-success" @click="importList">Import from portal</button>
    </div>
</div>
  <div class="field is-grouped">
    <div class="control">
        <input v-model="teamTitle" @keyup.enter="addTeam(teamTitle, teamRating)" class="input" type="text" placeholder="Team title">
    </div>
    <div class="control">
        <input v-model="teamRating" @keyup.enter="addTeam(teamTitle, teamRating)" class="input -rating" type="number" id="rating" placeholder="Rating">
    </div>
    <div class="control">
        <button class="button" @click="addTeam(teamTitle, teamRating)">Add team</button>
    </div>
</div>
</template>

<script>
export default {
    name: 'AddTeam',
    data(){
        return {
            teamTitle: null,
            teamRating: null,
            tournamentId: null
        }
    },
    methods: {
        addTeam(title, rating){
            this.$emit('addteam', title, rating || 0);
            this.teamTitle = null;
            this.teamRating = null;
        },
        async importList(){
            let response = await fetch(`https://portal.petanque.org.ua/tournament/team_export/${this.tournamentId}?format=json`);

            if (response.ok) {

                let importedList = await response.json();
                console.log(importedList);

                importedList.teams.forEach(team => {
                    console.log(team);
                    this.addTeam(team.name, +team.power);
                } )

            } else {
                alert("Ошибка HTTP: " + response.status);
            }
        }
    },
}
</script>