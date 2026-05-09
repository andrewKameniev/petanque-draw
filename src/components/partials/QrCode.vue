<template>
    <Modal @close-modal="$emit('close-modal')">
        <div class="qr-modal">
            <h3 class="qr-modal__title">{{ $t('remote.qrAndLink') }}</h3>
            <div class="qr-modal__code">
                <qrcode-vue :value="tournamentLink" :size="size" level="H" />
            </div>
            <div class="qr-modal__link-box">
                <a :href="tournamentLink" target="_blank" class="qr-modal__link">{{tournamentLink}}</a>
            </div>
            <div class="qr-modal__actions">
                <button class="button qr-modal__btn" :class="{'qr-modal__btn--copied': linkCopied}" @click="copyLink">
                    <Check v-if="linkCopied" :size="16"/>
                    <Copy v-else :size="16"/>
                    {{ linkCopied ? $t('messages.success') : $t('remote.copyLink') }}
                </button>
            </div>
        </div>
    </Modal>
</template>

<script>
import QrcodeVue from 'qrcode.vue'
import Modal from "@/components/Modal";
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {Copy, Check} from "lucide-vue-next";

export default {
    name: 'QrCode',
    components: {Modal, QrcodeVue, Copy, Check},
    data() {
        return {
            size: 300,
            linkCopied: false,
        }
    },
    computed: {
        ...mapState(useMainStore, ['currentTournamentIndex', 'user', 'currentTournament']),
        tournament() {
            return this.currentTournament
        },
        tournamentLink() {
            const domain = import.meta.env.PROD ? '/petanque-draw/#/' : '/#/';
            const shortRef = `${this.user.uid}.${parseInt(this.currentTournamentIndex).toString(36)}`;
            return `${window.location.origin}${domain}tournament?ref=${shortRef}`
        },
    },
    methods: {
        ...mapActions(useMainStore, ['showMessage']),
        copyLink() {
            navigator.clipboard.writeText(this.tournamentLink);
            this.linkCopied = true;
            setTimeout(() => { this.linkCopied = false; }, 2000);
        }
    }
}
</script>

<style scoped>
.qr-modal {
    text-align: center;
}

.qr-modal__title {
    font-size: 1.4rem;
    font-weight: 700;
    margin-bottom: 1.25rem;
}

.qr-modal__code {
    display: inline-block;
    padding: 1rem;
    background: var(--color-qr-bg);
    border-radius: 12px;
    border: 1px solid var(--color-qr-border);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.qr-modal__link-box {
    margin-top: 1rem;
    padding: 0.6rem 1rem;
    background: var(--color-qr-alt-bg);
    border-radius: 8px;
    border: 1px solid var(--color-qr-border);
}

.qr-modal__link {
    font-size: 0.85rem;
    word-break: break-all;
    color: var(--color-primary);
    text-decoration: none;
}

.qr-modal__link:hover {
    text-decoration: underline;
}

.qr-modal__actions {
    margin-top: 1.25rem;
}

.qr-modal__btn {
    background: var(--color-surface);
    color: var(--color-primary);
    border: 2px solid var(--color-primary);
    border-radius: 8px;
    font-weight: 600;
    padding: 0.5rem 1.25rem;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
}

.qr-modal__btn:hover {
    background: var(--color-primary);
    color: var(--color-surface);
}

.qr-modal__btn--copied {
    border-color: var(--color-success) !important;
    color: var(--color-success) !important;
}

.qr-modal__btn--copied:hover {
    background: var(--color-success);
    border-color: var(--color-success);
    color: var(--color-surface) !important;
}
</style>
