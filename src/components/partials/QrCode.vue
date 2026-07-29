<template>
  <Modal @close-modal="$emit('close-modal')">
    <div class="qr-modal">
      <h3 class="qr-modal__title">{{ $t('remote.qrAndLink') }}</h3>
      <div class="qr-modal__code">
        <qrcode-vue :value="tournamentLink" :size="size" level="H" />
      </div>
      <div class="qr-modal__link-box">
        <a :href="tournamentLink" target="_blank" class="qr-modal__link">{{ tournamentLink }}</a>
      </div>
      <div class="qr-modal__actions">
        <button class="button qr-modal__btn" :class="{ 'qr-modal__btn--copied': linkCopied }" @click="copyLink">
          <Check v-if="linkCopied" :size="16" />
          <Copy v-else :size="16" />
          {{ linkCopied ? $t('messages.success') : $t('remote.copyLink') }}
        </button>
      </div>
      <template v-if="!isTir">
        <div class="qr-modal__divider"></div>
        <h4 class="qr-modal__tv-title">
          <Monitor :size="18" />
          TV Dashboard
        </h4>
        <div class="qr-modal__link-box">
          <a :href="tvLink" target="_blank" class="qr-modal__link">{{ tvLink }}</a>
        </div>
        <div class="qr-modal__actions">
          <button class="button qr-modal__btn" :class="{ 'qr-modal__btn--copied': tvLinkCopied }" @click="copyTvLink">
            <Check v-if="tvLinkCopied" :size="16" />
            <Copy v-else :size="16" />
            {{ tvLinkCopied ? $t('messages.success') : $t('remote.copyLink') }}
          </button>
        </div>
      </template>

      <div class="qr-modal__divider"></div>
      <div class="qr-modal__collab-section">
        <button class="qr-modal__collab-toggle" @click="collabOpen = !collabOpen">
          <Users :size="18" />
          {{ $t('collaborators.title') }}
          <span v-if="!collabOpen && collaboratorsList.length" class="qr-modal__collab-badge">{{
            collaboratorsList.length
          }}</span>
          <ChevronDown :size="16" :class="{ rotated: collabOpen }" />
        </button>
        <div v-if="collabOpen" class="qr-modal__collab-body">
          <p class="qr-modal__collab-legend">{{ $t('collaborators.legend') }}</p>
          <div class="qr-modal__collab-form">
            <input
              v-model="collabEmail"
              type="email"
              class="input"
              :placeholder="$t('collaborators.emailPlaceholder')"
              @keyup.enter="handleAddCollaborator"
            />
            <div class="qr-modal__collab-actions">
              <div class="select">
                <select v-model="collabRole">
                  <option value="scorer">{{ $t('collaborators.scorer') }}</option>
                  <option value="admin">{{ $t('collaborators.admin') }}</option>
                </select>
              </div>
              <button class="button" :disabled="!collabEmail || collabLoading" @click="handleAddCollaborator">
                <UserPlus :size="16" />
              </button>
            </div>
          </div>
          <ul v-if="collaboratorsList.length" class="qr-modal__collab-list">
            <li v-for="collab in collaboratorsList" :key="collab.uid" class="qr-modal__collab-item">
              <span class="qr-modal__collab-email">{{ collab.email }}</span>
              <span class="qr-modal__collab-role">{{ $t(`collaborators.${collab.role}`) }}</span>
              <button class="qr-modal__collab-remove" @click="handleRemoveCollaborator(collab.uid)">
                <X :size="14" />
              </button>
            </li>
          </ul>
          <p v-else class="qr-modal__collab-empty">{{ $t('collaborators.empty') }}</p>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script>
import QrcodeVue from 'qrcode.vue';
import Modal from '@/components/Modal';
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { Copy, Check, Monitor, Users, ChevronDown, UserPlus, X } from 'lucide-vue-next';

export default {
  name: 'QrCode',
  components: { Modal, QrcodeVue, Copy, Check, Monitor, Users, ChevronDown, UserPlus, X },
  data() {
    return {
      size: 300,
      linkCopied: false,
      tvLinkCopied: false,
      collabOpen: false,
      collabEmail: '',
      collabRole: 'scorer',
      collabLoading: false,
    };
  },
  computed: {
    ...mapState(useMainStore, ['currentTournamentIndex', 'user', 'currentTournament', 'activeTournament']),
    tournament() {
      return this.currentTournament;
    },
    isTir() {
      return (this.activeTournament || this.currentTournament)?.system === 'tir';
    },
    shortRef() {
      return `${this._getTournamentOwnerUid()}.${parseInt(this.currentTournamentIndex).toString(36)}`;
    },
    tournamentLink() {
      const domain = import.meta.env.PROD ? '/petanque-draw/#/' : '/#/';
      return `${window.location.origin}${domain}tournament?ref=${this.shortRef}`;
    },
    tvLink() {
      const domain = import.meta.env.PROD ? '/petanque-draw/#/' : '/#/';
      return `${window.location.origin}${domain}tv?ref=${this.shortRef}`;
    },
    collaboratorsList() {
      const collabs = this.tournament?.collaborators;
      if (!collabs) return [];
      return Object.entries(collabs).map(([uid, val]) => ({
        uid,
        role: typeof val === 'string' ? val : val.role,
        email: typeof val === 'string' ? uid : val.email,
      }));
    },
  },
  methods: {
    ...mapActions(useMainStore, ['showMessage', 'addCollaborator', 'removeCollaborator', '_getTournamentOwnerUid']),
    copyLink() {
      navigator.clipboard.writeText(this.tournamentLink);
      this.linkCopied = true;
      setTimeout(() => {
        this.linkCopied = false;
      }, 2000);
    },
    copyTvLink() {
      navigator.clipboard.writeText(this.tvLink);
      this.tvLinkCopied = true;
      setTimeout(() => {
        this.tvLinkCopied = false;
      }, 2000);
    },
    async handleAddCollaborator() {
      if (!this.collabEmail || this.collabLoading) return;
      this.collabLoading = true;
      await this.addCollaborator(this.collabEmail.trim(), this.collabRole);
      this.collabEmail = '';
      this.collabLoading = false;
    },
    async handleRemoveCollaborator(uid) {
      await this.removeCollaborator(uid);
    },
  },
};
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
  box-shadow: 0 2px 8px rgb(0 0 0 / 5%);
}

.qr-modal__link-box {
  margin-top: 1rem;
  padding: 0.6rem 1rem;
  background: var(--color-qr-alt-bg);
  border-radius: 8px;
  border: 1px solid var(--color-qr-border);
}

.qr-modal__link {
  font-size: 1rem;
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
  color: var(--color-btn-text);
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

.qr-modal__divider {
  height: 1px;
  background: var(--color-qr-border);
  margin: 1.25rem 0;
}

.qr-modal__tv-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--color-text);
}

.qr-modal__collab-section {
  text-align: left;
}

.qr-modal__collab-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  background: none;
  border: none;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
  padding: 0.5rem 0;
}

.qr-modal__collab-toggle svg.rotated {
  transform: rotate(180deg);
}

.qr-modal__collab-badge {
  background: var(--color-primary);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}

.qr-modal__collab-legend {
  font-size: 0.85rem;
  color: var(--color-text-secondary, #888);
  margin-bottom: 0.75rem;
}

.qr-modal__collab-body {
  margin-top: 0.75rem;
}

.qr-modal__collab-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.qr-modal__collab-actions {
  display: flex;
  gap: 0.5rem;
}

.qr-modal__collab-list {
  list-style: none;
  padding: 0;
  margin: 0.75rem 0 0;
}

.qr-modal__collab-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-qr-alt-bg);
  border-radius: 6px;
  margin-bottom: 0.4rem;
}

.qr-modal__collab-email {
  flex: 1;
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qr-modal__collab-role {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-primary);
}

.qr-modal__collab-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-danger, #e53e3e);
  padding: 0.2rem;
  display: flex;
}

.qr-modal__collab-empty {
  font-size: 0.9rem;
  color: var(--color-text-secondary, #888);
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .qr-modal__code {
    transform: scale(0.7);
    transform-origin: center;
    margin: -1.5rem auto;
  }
}
</style>
