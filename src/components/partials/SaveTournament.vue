<template>
    <Modal @close-modal="$emit('close-modal')">
        <div class="is-size-4 mb-3">Please, enter tournament name</div>
        <div class="field">
            <div class="control">
                <input class="input" v-model="name" :class="{'is-danger': hasError}"
                       type="text" placeholder="Tournament name"
                       @keyup.enter="saveTournament">
            </div>
        </div>
        <div class="field has-text-danger" v-if="hasError">
            It seems you already have such tournament name
        </div>
        <div class="buttons is-centered">
            <div class="control">
                <button class="button" @click="$emit('close-modal')">Cancel</button>
            </div>
            <div class="control">
                <button class="button is-success" @click="saveTournament">Save</button>
            </div>
        </div>
    </Modal>
</template>

<script>
import {mapMutations, mapState} from "vuex";
import Modal from "@/components/Modal";

export default {
    name: 'SaveTournament',
    components: {Modal},
    props: ['rankingTeams'],
    emits: ['close-modal'],
    data(){
        return {
            name: '',
            hasError: false
        }
    },
    mounted() {
        this.name = this.tournament.name
    },
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex', 'savedTournaments']),
        tournament() {
            return this.tournaments[this.currentTournamentIndex]
        },
        tournamentsNames() {
            if (this.savedTournaments.length > 0) {
                let tournamentsTitles = []
                this.savedTournaments.forEach(item => {
                    tournamentsTitles.push(item.name)
                })
                return tournamentsTitles
            } else return false
        },
        tournamentRanking(){
            let tournamentRanking = [];
            if(this.tournament.playOffBracket) {
                const playOffList = JSON.parse(JSON.stringify(this.tournament.playOffBracket.stages)).reverse();
                const thirdPlaceGame = JSON.parse(JSON.stringify(this.tournament.playOffBracket.thirdPlace));
                let teamsInRanking = [];
                for (let i = 0; i < playOffList.length; i++){
                    if(playOffList[i].stageLabel === 1){
                        const firstPlace = {
                            place: '1',
                            title: playOffList[i].teams[0].team_1_score > playOffList[i].teams[0].team_2_score ? playOffList[i].teams[0].team_1 : playOffList[i].teams[0].team_2
                        }
                        tournamentRanking.push(firstPlace)
                        teamsInRanking.push(firstPlace.title)
                        const secondPlace = {
                            place: '2',
                            title: playOffList[i].teams[0].team_1_score > playOffList[i].teams[0].team_2_score ? playOffList[i].teams[0].team_2 : playOffList[i].teams[0].team_1
                        }
                        tournamentRanking.push(secondPlace)
                        teamsInRanking.push(secondPlace.title)
                    } else if(playOffList[i].stageLabel === 2){
                        const thirdPlace = {
                            place: '3',
                            title: thirdPlaceGame.team_1_score > thirdPlaceGame.team_2_score ? thirdPlaceGame.team_1 : thirdPlaceGame.team_2
                        }
                        tournamentRanking.push(thirdPlace)
                        teamsInRanking.push(thirdPlace.title)
                        const fourthPlace = {
                            place: '4',
                            title:thirdPlaceGame.team_1_score > thirdPlaceGame.team_2_score ? thirdPlaceGame.team_2 : thirdPlaceGame.team_1
                        }
                        tournamentRanking.push(fourthPlace)
                        teamsInRanking.push(fourthPlace.title)
                    } else {
                        playOffList[i].teams.forEach(round => {
                            const teamTitle = teamsInRanking.includes(round.team_1) ? round.team_2 : round.team_1
                            const teamPlace = {
                                place: playOffList[i].stageLabel + 1 + '-' + playOffList[i].stageLabel * 2,
                                title: teamTitle
                            }
                            tournamentRanking.push(teamPlace)
                            teamsInRanking.push(teamPlace.title)
                        })
                    }
                }

                if (this.tournament.games.length > 0){
                    this.rankingTeams.slice(this.tournament.playOffBracket.stages[0].teamsCount, this.rankingTeams.length).forEach((team,index) =>{
                        const teamPlace = {
                            place: this.tournament.playOffBracket.stages[0].teamsCount + index + 1,
                            title: team.title
                        }
                        tournamentRanking.push(teamPlace)
                    })
                }
            } else {
                this.rankingTeams.forEach((team,index) =>{
                    const teamPlace = {
                        place: index + 1,
                        title: team.title
                    }
                    tournamentRanking.push(teamPlace)
                })
            }

            return tournamentRanking
        }
    },
    methods: {
        ...mapMutations(['addToSaved', 'showMessage']),
        saveTournament(){
            this.hasError = false;
            if(!this.name || this.tournamentsNames && this.tournamentsNames.includes(this.name)){
                this.hasError = true
            } else {
                const currentTournament = {
                    name: this.name,
                    swiss: this.tournament.games,
                    playOff: this.tournament.playOffBracket ? this.tournament.playOffBracket : null,
                    ranking: this.tournamentRanking
                }
                this.addToSaved(currentTournament);
                this.$emit('close-modal');
                this.showMessage({title: 'Saved', text: 'You can see your saved tournaments in the menu'})
            }
        }
    }
}
</script>