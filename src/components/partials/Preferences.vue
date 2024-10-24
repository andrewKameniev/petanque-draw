<template>
    <Modal @close-modal="$emit('close-modal')">
        <div class="is-size-2 mb-3">Tournament preferences</div>
        <table class="table">
            <tr>
                <td class="is-size-5">Technical score</td>
                <td>
                    <input class="input" v-model="tournament.preferences.technical.technicalFirst" type="number">
                </td>
                <td>
                    <input class="input" v-model="tournament.preferences.technical.technicalSecond" type="number">
                </td>
            </tr>
            <tr>
                <td class="is-size-5">Maximum score</td>
                <td>
                    <input class="input" v-model="tournament.preferences.maxScore" type="number">
                </td>
                <td></td>
            </tr>
        </table>
        <div class="buttons is-centered">
            <div class="control">
                <button class="button" @click="$emit('close-modal')">Close</button>
            </div>
        </div>
    </Modal>
</template>

<script>
import {mapMutations, mapState} from "vuex";
import Modal from "@/components/Modal";

export default {
    name: 'Preferences',
    components: {Modal},
    emits: ['close-modal'],
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex']),
        tournament() {
            return this.tournaments[this.currentTournamentIndex]
        },
    },
    methods: {
        ...mapMutations(['savePreferences']),
        save(info) {
            this.savePreferences(info);
            this.$emit('close-modal');
        }
    }
}
</script>