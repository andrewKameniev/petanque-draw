<template>
    <Modal @close-modal="$emit('close-modal')">
        <div class="is-size-2 mb-3">{{ $t('modals.tournamentPreferences') }}</div>
        <table class="table">
            <tbody>
                <tr>
                    <td class="is-size-5">{{ $t('modals.technicalScore') }}</td>
                    <td>
                        <input class="input" v-model="tournament.preferences.technical.technicalFirst" type="number">
                    </td>
                    <td>
                        <input class="input" v-model="tournament.preferences.technical.technicalSecond" type="number">
                    </td>
                </tr>
                <tr>
                    <td class="is-size-5">{{ $t('modals.maxScore') }}</td>
                    <td>
                        <input class="input" v-model="tournament.preferences.maxScore" type="number">
                    </td>
                    <td></td>
                </tr>
                <tr>
                    <td class="is-size-5">{{ $t('modals.playOffTeams') }}</td>
                    <td>
                        <input class="input" v-model="tournament.preferences.playOffTeams" type="number">
                    </td>
                    <td></td>
                </tr>
                <tr>
                    <td class="is-size-5">{{ $t('modals.fieldsStart') }}</td>
                    <td>
                        <input class="input" v-model="tournament.preferences.fieldsStart" type="number">
                    </td>
                    <td></td>
                </tr>
            </tbody>
        </table>
        <div class="buttons is-centered">
            <div class="control">
                <button class="button" @click="save">{{ $t('common.close') }}</button>
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
        save() {
            this.savePreferences();
            this.$emit('close-modal');
        }
    }
}
</script>