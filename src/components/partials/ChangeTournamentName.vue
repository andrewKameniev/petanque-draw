<template>
    <Modal @close-modal="$emit('close-modal')">
        <div class="is-size-4 mb-3">Please, enter tournament name</div>
        <div class="field">
            <div class="control">
                <input class="input" v-model="name" :class="{'is-danger': hasError}"
                       type="text" placeholder="Tournament name"
                       @keyup.enter="changeCurrentTournamentName">
            </div>
        </div>
        <div class="buttons is-centered">
            <div class="control">
                <button class="button" @click="$emit('close-modal')">Cancel</button>
            </div>
            <div class="control">
                <button class="button is-success" @click="changeCurrentTournamentName">Change</button>
            </div>
        </div>
    </Modal>
</template>

<script>
import {mapMutations, mapState} from "vuex";
import Modal from "@/components/Modal";

export default {
    name: 'ChangeTournamentName',
    components: {Modal},
    data() {
        return {
            name: ''
        }
    },
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex']),
        tournament() {
            return this.tournaments[this.currentTournamentIndex]
        }
    },
    methods: {
        ...mapMutations(['changeTournamentName']),
        changeCurrentTournamentName() {
            this.changeTournamentName(this.name);
            this.$emit('close-modal')
        }
    },
}
</script>
