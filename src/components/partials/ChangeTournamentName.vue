<template>
    <Modal @close-modal="$emit('close-modal')">
        <div class="is-size-4 mb-3">{{ $t('modals.enterTournamentName') }}</div>
        <div class="field">
            <div class="control">
                <input class="input" v-model="name" :class="{'is-danger': hasError}"
                       type="text" :placeholder="$t('common.tournamentName')"
                       @keyup.enter="changeCurrentTournamentName">
            </div>
        </div>
        <div class="buttons is-centered">
            <div class="control">
                <button class="button" @click="$emit('close-modal')">{{ $t('common.cancel') }}</button>
            </div>
            <div class="control">
                <button class="button is-success" @click="changeCurrentTournamentName">{{ $t('common.change') }}</button>
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
            name: '',
            hasError: false
        }
    },
    created() {
        this.name = this.tournament.name
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
            this.hasError = false;
            if (this.name !== '') {
                this.changeTournamentName(this.name);
                this.$emit('close-modal')
            } else {
                this.hasError = true
            }

        }
    },
}
</script>
