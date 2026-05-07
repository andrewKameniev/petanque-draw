<template>
    <Modal @close-modal="$emit('close-modal')">
        <div class="is-size-3 mb-3 text-center">{{ $t('remote.qrAndLink') }}</div>
        <div class="text-center">
            <qrcode-vue :value="tournamentLink" :size="size" level="H" />
            <div class="my-3">
                <a :href="tournamentLink" target="_blank" class="is-size-5 tournament-link">{{tournamentLink}}</a>
            </div>
        </div>
        <div class="buttons is-centered">
            <div class="control">
                <button class="button" @click="copyContent(tournamentLink)">{{ $t('remote.copyLink') }}</button>
            </div>
        </div>
    </Modal>
</template>

<script>
import QrcodeVue from 'qrcode.vue'
import Modal from "@/components/Modal";
import {mapState} from "vuex";
import {copyContent} from "@/helpers";

export default {
    name: 'QrCode',
    components: {Modal, QrcodeVue},
    data() {
        return {
            size: 300,
        }
    },
    computed: {
        ...mapState(['tournaments', 'currentTournamentIndex', 'user']),
        tournamentLink() {
            const domain = import.meta.env.PROD ? '/petanque-draw/#/' : '/#/';
            const shortRef = `${this.user.uid}.${parseInt(this.tournaments[this.currentTournamentIndex].id).toString(36)}`;
            return `${window.location.origin}${domain}tournament?ref=${shortRef}`
        },
    },
    methods: {copyContent}
}
</script>

<style>
.tournament-link {
    word-break: break-word;
}
</style>
