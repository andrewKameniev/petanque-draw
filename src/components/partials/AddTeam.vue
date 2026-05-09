<template>
    <div class="add-team-card">
        <div class="add-team-card__row" v-if="!importHidden">
            <input v-model="tournamentId" @keydown.enter="importList" class="add-team-card__input" type="number" data-testid="input-portal-id" :placeholder="$t('teams.tournamentId')">
            <button class="add-team-card__btn add-team-card__btn--import" data-testid="btn-import-portal" @click="importList">{{ $t('teams.importPortal') }}</button>
        </div>
        <div class="add-team-card__row">
            <input v-model="teamTitle" @keyup.enter="addTeam(teamTitle, teamRating)" class="add-team-card__input add-team-card__input--name" type="text" data-testid="input-team-title" :placeholder="$t('teams.teamTitle')">
            <input v-if="tournament.useRating" v-model="teamRating" @keyup.enter="addTeam(teamTitle, teamRating)" class="add-team-card__input add-team-card__input--rating" type="number" :placeholder="$t('teams.rating')">
            <button class="add-team-card__btn" data-testid="btn-add-team" @click="addTeam(teamTitle, teamRating)">{{ $t('teams.addTeam') }}</button>
        </div>
        <div class="add-team-card__footer">
            <label class="add-team-card__checkbox">
                <input type="checkbox" :checked="tournament.useRating" @change="changeDrawType($event.target.checked)">
                {{ $t('teams.useTeamRating') }}
            </label>
            <button v-if="showRestore" class="add-team-card__restore" @click="$emit('restore')">{{ $t('teams.restoreTeams') }}</button>
        </div>
    </div>
</template>

<script>
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";

export default {
    name: 'AddTeam',
    props: ['importHidden', 'showRestore'],
    data(){
        return {
            teamTitle: null,
            teamRating: null,
            tournamentId: null,
        }
    },
    emits: ['add-team', 'change-draw-style', 'restore'],
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament']),
        tournament() {
            return this.currentTournament
        },
    },
    methods: {
        ...mapActions(useMainStore, ['addTeamToStore', 'changeDrawType', 'showMessage', 'setTournamentIdFromPortal', 'setTournamentInfoFromPortal']),
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

<style scoped>
.add-team-card {
    background: #fff;
    border: 1px solid var(--color-border, #e5e7f0);
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.add-team-card__row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.add-team-card__input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border, #e5e7f0);
    border-radius: 8px;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.15s;
}

.add-team-card__input:focus {
    border-color: var(--color-primary, #7c3aed);
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
}

.add-team-card__input--name {
    flex: 2;
}

.add-team-card__input--rating {
    flex: 0 0 80px;
}

.add-team-card__btn {
    padding: 0.5rem 1rem;
    border: 1px solid #22c55e;
    background: #22c55e;
    color: #fff;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
}

.add-team-card__btn:hover {
    background: #16a34a;
    border-color: #16a34a;
}

.add-team-card__btn--import {
    background: var(--color-primary, #7c3aed);
    border-color: var(--color-primary, #7c3aed);
}

.add-team-card__btn--import:hover {
    background: var(--color-primary-hover, #6d28d9);
    border-color: var(--color-primary-hover, #6d28d9);
}

.add-team-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.add-team-card__checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--color-text-secondary, #374151);
    cursor: pointer;
}


.add-team-card__restore {
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid var(--color-border, #e5e7f0);
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-secondary, #374151);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
}

.add-team-card__restore:hover {
    border-color: var(--color-primary, #7c3aed);
    color: var(--color-primary, #7c3aed);
}

@media (max-width: 768px) {
    .add-team-card {
        padding: 1rem;
    }

    .add-team-card__row {
        flex-wrap: wrap;
    }

    .add-team-card__input--name {
        flex: 1 1 100%;
    }

    .add-team-card__input--rating {
        flex: 1;
    }
}
</style>