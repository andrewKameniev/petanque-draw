<template>
    <Modal @close-modal="$emit('close-modal')">
        <div class="content">
            <h3>Some notes</h3>
            <ol>
                <li>To change tournament name just click on its default name.</li>
                <li>In swiss system you can modify previous round result if you wrote it not correct. This possibility available when you already draw next round.</li>
            </ol>
            <div class="buttons is-centered">
                <div class="control">
                    <button class="button" @click="$emit('close-modal')">Close</button>
                </div>
            </div>
        </div>
    </Modal>
</template>

<script>
import {mapMutations, mapState} from "vuex";
import Modal from "@/components/Modal";

export default {
    name: 'Help',
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
