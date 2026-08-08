<template>
  <div class="team-replacement-panel" data-testid="team-replacement-panel">
    <div class="team-replacement-panel__copy">
      <strong>{{ $t('teams.replaceTeam') }}</strong>
      <span>{{ $t('teams.replaceTeamHint') }}</span>
    </div>
    <button class="team-replacement-panel__open" type="button" data-testid="team-replacement-open" @click="openDialog">
      {{ $t('teams.replaceTeam') }}
    </button>
  </div>

  <Modal v-if="dialogOpen && !confirmOpen" @close-modal="closeDialog">
    <form class="team-replacement" data-testid="team-replacement-modal" @submit.prevent="loadPortalTeams">
      <h3 class="team-replacement__title">{{ $t('teams.replaceTeamDialogTitle') }}</h3>
      <p class="team-replacement__description">{{ $t('teams.replaceTeamDialogHint') }}</p>

      <label class="team-replacement__label" for="team-replacement-portal-id">
        {{ $t('teams.replacePortalId') }}
      </label>
      <div class="team-replacement__portal-row">
        <input
          id="team-replacement-portal-id"
          v-model.trim="portalId"
          class="team-replacement__control"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          data-testid="team-replacement-portal-id"
          :placeholder="$t('teams.tournamentId')"
          :disabled="loading"
          @input="clearPortalResults"
        />
        <button
          class="team-replacement__button team-replacement__button--secondary"
          type="submit"
          data-testid="team-replacement-fetch"
          :disabled="loading || !portalId"
        >
          <span v-if="loading" class="team-replacement__spinner" aria-hidden="true"></span>
          {{ loading ? $t('teams.loadingPortalTeams') : $t('teams.loadPortalTeams') }}
        </button>
      </div>

      <p v-if="loadError" class="team-replacement__error" data-testid="team-replacement-fetch-error">
        {{ loadError }}
      </p>
      <p v-else-if="portalTeamsLoaded" class="team-replacement__loaded" data-testid="team-replacement-loaded">
        {{ $t('teams.portalTeamsLoaded', { count: portalTeams.length }) }}
      </p>

      <template v-if="portalTeamsLoaded">
        <label class="team-replacement__label" for="team-replacement-old-team">
          {{ $t('teams.selectExistingTeam') }}
        </label>
        <select
          id="team-replacement-old-team"
          v-model="selectedOldTitle"
          class="team-replacement__control"
          data-testid="team-replacement-old-select"
        >
          <option value="" disabled>{{ $t('teams.selectTeamPlaceholder') }}</option>
          <option v-for="team in teams" :key="team.title" :value="team.title">
            {{ team.title }}
          </option>
        </select>

        <label class="team-replacement__label" for="team-replacement-portal-team">
          {{ $t('teams.selectPortalTeam') }}
        </label>
        <select
          id="team-replacement-portal-team"
          v-model="selectedPortalIndex"
          class="team-replacement__control"
          data-testid="team-replacement-portal-select"
        >
          <option value="" disabled>{{ $t('teams.selectTeamPlaceholder') }}</option>
          <option
            v-for="(team, index) in portalTeams"
            :key="portalTeamKey(team, index)"
            :value="String(index)"
            :disabled="isPortalTeamUnavailable(team)"
          >
            {{ portalTeamTitle(team)
            }}{{ isPortalTeamUnavailable(team) ? ` — ${$t('teams.portalTeamAlreadyUsed')}` : '' }}
          </option>
        </select>

        <div
          v-if="selectedOldTitle && selectedPortalTeam"
          class="team-replacement__preview"
          data-testid="team-replacement-preview"
        >
          <span class="team-replacement__preview-label">{{ $t('teams.replacementPreview') }}</span>
          <div class="team-replacement__names">
            <span>{{ selectedOldTitle }}</span>
            <span class="team-replacement__arrow" aria-hidden="true">→</span>
            <strong>{{ portalTeamTitle(selectedPortalTeam) }}</strong>
          </div>
          <div class="team-replacement__meta">
            <span v-if="portalTeamIdentifier(selectedPortalTeam) != null">
              {{ $t('teams.portalTeamId') }}: {{ portalTeamIdentifier(selectedPortalTeam) }}
            </span>
            <span>{{ $t('teams.rating') }}: {{ portalTeamRating(selectedPortalTeam) }}</span>
          </div>
          <div class="team-replacement__players">
            <span class="team-replacement__preview-label">{{ $t('teams.portalPlayers') }}</span>
            <span>{{ portalPlayersLabel(selectedPortalTeam) }}</span>
          </div>
        </div>

        <p v-if="portalTeams.length === 0" class="team-replacement__empty">
          {{ $t('teams.noPortalTeams') }}
        </p>
      </template>

      <div class="team-replacement__actions">
        <button class="team-replacement__button team-replacement__button--cancel" type="button" @click="closeDialog">
          {{ $t('common.cancel') }}
        </button>
        <button
          class="team-replacement__button team-replacement__button--primary"
          type="button"
          data-testid="team-replacement-submit"
          :disabled="!canReplace"
          @click="confirmOpen = true"
        >
          {{ $t('teams.replaceTeam') }}
        </button>
      </div>
    </form>
  </Modal>

  <ConfirmDialog
    v-if="confirmOpen"
    :message="confirmationMessage"
    :confirm-label="$t('teams.confirmTeamReplacement')"
    :cancel-label="$t('common.cancel')"
    confirm-test-id="team-replacement-confirm"
    @confirm="emitReplacement"
    @cancel="confirmOpen = false"
  />
</template>

<script>
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/partials/ConfirmDialog';
import { fetchPortalTeams } from '@/services/portal';

export default {
  name: 'TeamReplacementPanel',
  components: { ConfirmDialog, Modal },
  props: {
    teams: { type: Array, default: () => [] },
    portalTournamentId: { type: [String, Number], default: null },
  },
  emits: ['replace'],
  data() {
    return {
      dialogOpen: false,
      confirmOpen: false,
      loading: false,
      loadError: '',
      portalId: this.portalTournamentId == null ? '' : String(this.portalTournamentId),
      portalTeams: [],
      portalTeamsLoaded: false,
      selectedOldTitle: '',
      selectedPortalIndex: '',
    };
  },
  computed: {
    selectedPortalTeam() {
      if (this.selectedPortalIndex === '') return null;
      return this.portalTeams[Number(this.selectedPortalIndex)] || null;
    },
    canReplace() {
      return (
        !!this.selectedOldTitle && !!this.selectedPortalTeam && !this.isPortalTeamUnavailable(this.selectedPortalTeam)
      );
    },
    confirmationMessage() {
      return this.$t('teams.replaceTeamConfirm', {
        oldTeam: this.selectedOldTitle,
        newTeam: this.selectedPortalTeam ? this.portalTeamTitle(this.selectedPortalTeam) : '',
      });
    },
  },
  watch: {
    portalTournamentId(value) {
      this.portalId = value == null ? '' : String(value);
      this.clearPortalResults();
    },
    selectedOldTitle() {
      if (this.selectedPortalTeam && this.isPortalTeamUnavailable(this.selectedPortalTeam)) {
        this.selectedPortalIndex = '';
      }
    },
  },
  methods: {
    openDialog() {
      this.dialogOpen = true;
      this.confirmOpen = false;
      this.loadError = '';
    },
    closeDialog() {
      this.dialogOpen = false;
      this.confirmOpen = false;
    },
    clearPortalResults() {
      this.portalTeams = [];
      this.portalTeamsLoaded = false;
      this.selectedPortalIndex = '';
      this.loadError = '';
    },
    async loadPortalTeams() {
      if (!this.portalId || this.loading) return;

      this.loading = true;
      this.loadError = '';
      this.portalTeamsLoaded = false;
      this.selectedPortalIndex = '';

      try {
        this.portalTeams = await fetchPortalTeams(this.portalId);
        this.portalTeamsLoaded = true;
      } catch {
        this.portalTeams = [];
        this.loadError = this.$t('teams.portalTeamsLoadError');
      } finally {
        this.loading = false;
      }
    },
    portalTeamTitle(team) {
      return String(team?.name ?? team?.title ?? '').trim();
    },
    portalTeamIdentifier(team) {
      return team?.id ?? team?.portalTeamId ?? null;
    },
    portalTeamRating(team) {
      const rating = Number(team?.power ?? team?.rating);
      return Number.isFinite(rating) ? rating : '—';
    },
    portalTeamKey(team, index) {
      return this.portalTeamIdentifier(team) ?? `${this.portalTeamTitle(team)}-${index}`;
    },
    isPortalTeamUnavailable(portalTeam) {
      const portalId = this.portalTeamIdentifier(portalTeam);
      const portalTitle = this.portalTeamTitle(portalTeam);

      return this.teams.some((team) => {
        if (team.title === this.selectedOldTitle) return false;

        const samePortalId =
          portalId != null && team.portalTeamId != null && String(team.portalTeamId) === String(portalId);
        return samePortalId || team.title === portalTitle;
      });
    },
    portalPlayersLabel(team) {
      if (!Array.isArray(team?.players) || team.players.length === 0) {
        return this.$t('teams.noPortalPlayers');
      }

      return team.players
        .map((player) => [player.surname, player.name].filter(Boolean).join(' '))
        .filter(Boolean)
        .join(', ');
    },
    emitReplacement() {
      if (!this.canReplace) {
        this.confirmOpen = false;
        return;
      }

      this.$emit('replace', {
        oldTitle: this.selectedOldTitle,
        portalTeam: this.selectedPortalTeam,
      });
      this.confirmOpen = false;
      this.dialogOpen = false;
    },
  },
};
</script>

<style scoped>
.team-replacement-panel {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.team-replacement-panel__copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  color: var(--color-text);
}

.team-replacement-panel__copy span {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  line-height: 1.35;
}

.team-replacement-panel__open,
.team-replacement__button {
  padding: 0.55rem 0.9rem;
  color: var(--color-btn-text);
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    opacity 0.15s;
}

.team-replacement-panel__open:hover,
.team-replacement__button--primary:hover:not(:disabled) {
  background: var(--color-primary-light);
  border-color: var(--color-primary-light);
}

.team-replacement {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.team-replacement__title {
  padding-right: 2.25rem;
  margin: 0;
  color: var(--color-text);
  font-size: 1.25rem;
  font-weight: 700;
}

.team-replacement__description {
  margin: 0 0 0.35rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.45;
}

.team-replacement__label {
  margin-top: 0.25rem;
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
}

.team-replacement__portal-row {
  display: flex;
  gap: 0.5rem;
}

.team-replacement__control {
  width: 100%;
  min-width: 0;
  padding: 0.55rem 0.7rem;
  color: var(--color-text);
  font-size: 0.95rem;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  outline: none;
}

.team-replacement__control:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-shadow);
}

.team-replacement__portal-row .team-replacement__control {
  flex: 1;
}

.team-replacement__button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.team-replacement__button--secondary,
.team-replacement__button--cancel {
  color: var(--color-text);
  background: transparent;
  border-color: var(--color-border);
}

.team-replacement__button--secondary:hover:not(:disabled),
.team-replacement__button--cancel:hover {
  background: var(--color-surface-hover);
}

.team-replacement__spinner {
  display: inline-block;
  width: 0.8rem;
  height: 0.8rem;
  margin-right: 0.3rem;
  vertical-align: -0.1rem;
  border: 2px solid currentcolor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: team-replacement-spin 0.7s linear infinite;
}

.team-replacement__error,
.team-replacement__loaded,
.team-replacement__empty {
  margin: 0;
  font-size: 0.82rem;
}

.team-replacement__error {
  color: var(--color-danger, #d33);
}

.team-replacement__loaded {
  color: var(--color-text-secondary);
}

.team-replacement__empty {
  padding: 0.65rem;
  color: var(--color-text-secondary);
  text-align: center;
}

.team-replacement__preview {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.75rem;
  margin-top: 0.25rem;
  color: var(--color-text);
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.team-replacement__preview-label {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.team-replacement__names {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 0.5rem;
  align-items: center;
}

.team-replacement__names span,
.team-replacement__names strong {
  overflow-wrap: anywhere;
}

.team-replacement__arrow {
  color: var(--color-primary);
  font-size: 1.1rem;
}

.team-replacement__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1rem;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
}

.team-replacement__players {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.85rem;
}

.team-replacement__actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 0.5rem;
}

@keyframes team-replacement-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .team-replacement-panel {
    align-items: stretch;
    flex-direction: column;
  }

  .team-replacement-panel__open {
    width: 100%;
  }

  .team-replacement__portal-row {
    flex-direction: column;
  }

  .team-replacement__names {
    grid-template-columns: 1fr;
  }

  .team-replacement__arrow {
    width: 1.1rem;
    justify-self: start;
    transform: rotate(90deg);
  }

  .team-replacement__actions {
    flex-direction: column-reverse;
  }

  .team-replacement__button {
    width: 100%;
  }
}
</style>
