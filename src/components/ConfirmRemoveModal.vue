<template>
    <Modal @close-modal="$emit('close-modal')">
        <p class="text-center mb-4 is-size-4">Are you sure you want to delete <br>
            <strong>{{tournament.name}}</strong>?</p>
        <div class="buttons is-centered">
            <div class="control">
                <button class="button" @click="$emit('close-modal')">Cancel</button>
            </div>
            <div class="control">
                <button class="button is-danger" @click="removeCurrentTournament">Remove</button>
            </div>
        </div>
    </Modal>
</template>

<script>
import {mapMutations, mapState} from "vuex";
import Modal from "@/components/Modal";

export default {
    name: 'ConfirmRemoveModal',
    components: {Modal},
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex']),
        tournament() {
            return this.tournaments[this.currentTournamentIndex]
        }
    },
    methods: {
        ...mapMutations(['removeTournament']),
        removeCurrentTournament() {
            this.removeTournament();
            this.$emit('close-modal')
        }
    },
}
</script>
