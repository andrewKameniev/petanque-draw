<template>
    <Modal @close-modal="$emit('close-modal')">
        <div class="is-size-4 mb-3">{{ $t('modals.enterTournamentName') }}</div>
        <div class="field">
            <div class="control">
                <input
                    class="input"
                    v-model="name"
                    :class="{ 'is-danger': hasError }"
                    type="text"
                    :placeholder="$t('common.tournamentName')"
                    @keyup.enter="changeCurrentTournamentName"
                />
            </div>
        </div>
        <div class="buttons is-centered">
            <div class="control">
                <button class="button" @click="$emit('close-modal')">{{ $t('common.cancel') }}</button>
            </div>
            <div class="control">
                <button class="button is-success" @click="changeCurrentTournamentName">
                    {{ $t('common.change') }}
                </button>
            </div>
        </div>
    </Modal>
</template>

<script>
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import Modal from '@/components/Modal';

export default {
    name: 'ChangeTournamentName',
    components: { Modal },
    data() {
        return {
            name: '',
            hasError: false,
        };
    },
    created() {
        this.name = this.tournament.name;
    },
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament']),
        tournament() {
            return this.currentTournament;
        },
    },
    methods: {
        ...mapActions(useMainStore, ['changeTournamentName']),
        changeCurrentTournamentName() {
            this.hasError = false;
            if (this.name !== '') {
                this.changeTournamentName(this.name);
                this.$emit('close-modal');
            } else {
                this.hasError = true;
            }
        },
    },
};
</script>
