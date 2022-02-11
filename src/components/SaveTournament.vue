<template>
    <div class="modal is-active" >
        <div class="modal-background" @click.self="$emit('close-modal')"></div>
        <div class="modal-content">
            <div class="box">
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
                <div class="field is-grouped is-flex-justify-content-center">
                    <div class="control">
                        <button class="button" @click="$emit('close-modal')">Cancel</button>
                    </div>
                    <div class="control">
                        <button class="button is-success" @click="saveTournament">Save</button>
                    </div>
                </div>
            </div>
        </div>
        <button class="modal-close is-large" aria-label="close" @click="$emit('close-modal')"></button>
    </div>
</template>

<script>
export default {
    name: 'SaveTournament',
    props: ['bracket', 'tournamentsNames'],
    emits: ['close-modal', 'save-tournament'],
    data(){
        return {
            name: null,
            hasError: false
        }
    },
    methods: {
        saveTournament(){
            this.hasError = false;
            if(!this.name || this.tournamentsNames && this.tournamentsNames.includes(this.name)){
                this.hasError = true
            } else {
                const currentTournament = {
                    name: this.name,
                    swiss: JSON.parse(localStorage.getItem('games')),
                    playOff: localStorage.getItem('playOffBracket') ? JSON.parse(localStorage.getItem('playOffBracket')) : null,
                    ranking: JSON.parse(localStorage.getItem('teams'))
                }
                this.$emit('save-tournament', currentTournament)
            }
        }
    }
}
</script>