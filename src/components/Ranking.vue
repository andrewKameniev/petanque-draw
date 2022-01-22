<template>
    <div class="content tabs-content">
       <h2>Ranking after {{activeRound - 1}} round{{activeRound > 1 ? 's' : '' }}</h2>
        <table id="table-ranking" class="table">
            <thead>	
                <tr>
                    <th>#</th>
                    <th>Team</th>
                    <th>Wins</th>
                    <th>Buh</th>
                    <th>SBuh</th>
                    <th>Points</th>
                    <th v-if="showIfUseRating">Rating</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="team in rankingTeams" :key="team.title">
                    <td><span class="team-count"></span></td>
                    <td>{{team.title}}</td>
                    <td align="center">{{team.wins}}</td>
                    <td align="center">{{team.buhgolts}}</td>
                    <td align="center">{{team.smallBuhgolts}}</td>
                    <td align="center">{{team.pointsPlus}}:{{team.pointsMinus}}</td>
                    <td v-if="showIfUseRating">{{team.rating}}</td>
                </tr>
            </tbody>
        </table>
        <div class="mt-5" v-if="!isPlayOff">
            <h2 class="h2">Go to play-off?</h2>
            <div class="is-flex is-align-items-center">Choose number of teams 
            <div class="select ml-3">
              <select>
                <option>4</option>
                <option v-if="rankingTeams.length > 8">8</option>
                <option v-if="rankingTeams.length > 16">16</option>
                <option v-if="rankingTeams.length > 32">32</option>
                <option v-if="rankingTeams.length > 64">64</option>
              </select>
            </div>
            <button @click="runPlayOff" class="button is-success ml-3">Go!</button>
            </div>
        </div>
    </div>
</template>


<script>
export default {
    name: 'Ranking',
    props: ['showIfUseRating', 'isPlayOff', 'rankingTeams', 'activeRound'],
    emits: ['is-playoff'],
    methods: {
       runPlayOff(){
           
       }
    },
}
</script>