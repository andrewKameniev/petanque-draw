<template>
    <Modal @close-modal="$emit('close-modal')">
        <div class="is-size-3 mb-3 text-center">QRCode and link for tournament</div>
        <div class="text-center">
            <qrcode-vue :value="tournamentLink" :size="size" level="H" />
            <div class="my-3">
                <a :href="tournamentLink" target="_blank" class="is-size-3 tournament-link">{{tournamentLink}}</a>
            </div>
        </div>
        <div class="buttons is-centered">
            <div class="control">
                <button class="button" @click="copyContent(tournamentLink)">Copy link</button>
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
        ...mapState(['tournaments', 'currentTournamentIndex']),
        tournamentLink() {
            const domain = process.env.NODE_ENV === 'production' ? '/petanque-draw/dist/#/' : '/#/';
            return `${window.location.origin}${domain}tournaments/${this.tournaments[this.currentTournamentIndex].portalIdTournament}`
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
