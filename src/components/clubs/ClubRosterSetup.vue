<template>
  <section class="club-rosters">
    <template v-if="portalImport">
      <header class="club-rosters__heading">
        <UsersRound :size="22" aria-hidden="true" />
        <div>
          <h3>{{ $t('club.detected') }}</h3>
          <p>{{ portalImport.tournament?.display_name || portalImport.tournament?.name }}</p>
        </div>
      </header>
      <label class="club-rosters__format"
        >{{ $t('club.rosterLimit')
        }}<select v-model.number="rosterLimit" class="input" :disabled="busy">
          <option v-for="size in rosterSizes" :key="size" :value="size">{{ size }}</option>
        </select></label
      >
      <p class="club-rosters__hint">{{ $t('club.rosterRule', { count: rosterLimit }) }}</p>
      <p class="club-rosters__hint">{{ $t('club.captainClubRule') }}</p>
    </template>
    <header v-else class="club-rosters__heading">
      <UsersRound :size="22" aria-hidden="true" />
      <h3>
        {{ $t('club.rosterList') }} <span>{{ tournament.teams?.length || 0 }}</span>
      </h3>
    </header>
    <div class="club-rosters__list">
      <details
        v-for="club in displayedClubs"
        :key="club.portalTeamId || club.clubId"
        class="club-rosters__entry"
        :open="!!portalImport"
      >
        <summary>
          <img
            v-if="captain(club)?.club_logo_url"
            :src="captain(club).club_logo_url"
            class="club-rosters__logo"
            alt=""
            loading="lazy"
          />
          <span
            ><strong>{{ club.title }}</strong
            ><small
              >{{ $t('club.playerCount', { count: club.players.length })
              }}<template v-if="!portalImport"> · {{ $t('club.rosterLocked') }}</template></small
            ></span
          >
          <ChevronDown :size="18" aria-hidden="true" />
        </summary>
        <label v-if="portalImport && editingCaptain === club.portalTeamId" class="club-rosters__captain"
          >{{ $t('club.captain')
          }}<select v-model="club.captainId" class="input" :disabled="busy" @change="selectCaptain(club)">
            <option v-for="player in club.players" :key="player.id" :value="player.id">
              {{ player.surname }} {{ player.name }}
            </option>
          </select></label
        >
        <button
          v-if="portalImport && editingCaptain !== club.portalTeamId"
          type="button"
          class="club-rosters__edit-captain"
          @click="editingCaptain = club.portalTeamId"
        >
          {{ $t('club.changeCaptain') }}
        </button>
        <div class="club-rosters__players">
          <div v-for="player in club.players" :key="player.id" class="club-rosters__player">
            <PlayerChip :player="player" :is-captain="String(player.id) === String(club.captainId)" />
            <button
              v-if="portalImport && club.players.length > rosterLimit"
              type="button"
              class="button is-light is-small"
              :disabled="busy"
              @click="removeDraftPlayer(club, player.id)"
            >
              {{ $t('club.removeDraftPlayer') }}
            </button>
          </div>
        </div>
        <p v-if="portalImport && club.players.length > rosterLimit" class="club-rosters__error">
          {{ $t('club.errors.rosterSize') }}
        </p>
      </details>
    </div>
    <template v-if="portalImport && isOwnerOrAdmin">
      <p class="club-rosters__hint">{{ $t('club.submitWarning') }}</p>
      <div class="club-rosters__actions">
        <button type="button" class="button is-purple" :disabled="busy" @click="submitImport">
          {{ $t('club.importClubs', { count: drafts.length }) }}</button
        ><button type="button" class="button is-light" :disabled="busy" @click="$emit('cancel-import')">
          {{ $t('club.cancel') }}
        </button>
      </div>
    </template>
    <p v-if="error" role="alert" class="club-rosters__error">{{ error }}</p>
  </section>
</template>

<script>
import { mapActions, mapState } from 'pinia';
import { UsersRound, ChevronDown } from 'lucide-vue-next';
import PlayerChip from '@/components/partials/PlayerChip.vue';
import { useMainStore } from '@/stores/main';
import { CLUB_ROSTER_SIZES } from '@/services/club-encounter';
import { CLUB_CHANGE, createPortalClubDraft } from '@/services/club-competition';

export default {
  name: 'ClubRosterSetup',
  components: { PlayerChip, UsersRound, ChevronDown },
  props: { tournament: { type: Object, required: true }, portalImport: { type: Object, default: null } },
  emits: ['imported', 'cancel-import'],
  data() {
    return { drafts: [], editingCaptain: null, rosterLimit: 9, rosterSizes: CLUB_ROSTER_SIZES, busy: false, error: '' };
  },
  computed: {
    ...mapState(useMainStore, ['isOwnerOrAdmin']),
    displayedClubs() {
      return this.portalImport ? this.drafts : this.tournament.teams || [];
    },
  },
  watch: {
    portalImport: {
      immediate: true,
      handler(value) {
        this.drafts = (value?.teams || []).map(createPortalClubDraft);
        this.rosterLimit = this.drafts.some((club) => club.players.length > 8) ? 9 : 8;
        this.error = '';
      },
    },
  },
  methods: {
    ...mapActions(useMainStore, ['changeClubCompetition', 'setTournamentInfoFromPortal', 'setTournamentIdFromPortal']),
    captain(club) {
      return club.players.find((player) => String(player.id) === String(club.captainId));
    },
    selectCaptain(club) {
      const player = this.captain(club);
      club.clubId = player.club_id;
      club.title = player.club;
      this.editingCaptain = null;
    },
    removeDraftPlayer(club, playerId) {
      club.players = club.players.filter((player) => player.id !== playerId);
      if (club.captainId === playerId) {
        club.captainId = club.players[0]?.id;
        this.selectCaptain(club);
      }
    },
    async submitImport() {
      this.busy = true;
      this.error = '';
      try {
        await this.changeClubCompetition({
          type: CLUB_CHANGE.IMPORT,
          rosterSize: this.rosterLimit,
          clubs: this.drafts,
        });
        if (this.portalImport.tournament) this.setTournamentInfoFromPortal(this.portalImport.tournament);
        this.setTournamentIdFromPortal(this.portalImport.portalId);
        this.$emit('imported');
      } catch (error) {
        this.error = this.$te(`club.errors.${error.code}`)
          ? this.$t(`club.errors.${error.code}`)
          : this.$t('messages.failedSaving');
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>

<style scoped>
.club-rosters__edit-captain {
  border: 0;
  background: none;
  color: var(--color-primary);
  font-size: 12px;
  padding: 0.5rem 0 0;
  cursor: pointer;
}

.club-rosters {
  padding: 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text);
}

.club-rosters__heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.club-rosters__heading > svg {
  color: var(--color-primary);
}

.club-rosters__heading h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
}

.club-rosters__heading p,
.club-rosters__hint {
  color: var(--color-text-muted);
  font-size: 13px;
  margin: 0.5rem 0;
}

.club-rosters__heading span {
  color: var(--color-primary);
}

.club-rosters label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 13px;
}

.club-rosters .input {
  width: auto;
  min-width: 0;
  border-radius: 8px;
  font-size: 14px;
}

.club-rosters__list {
  display: grid;
  gap: 0.75rem;
}

.club-rosters__entry {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 0.85rem;
}

.club-rosters__entry summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.club-rosters__entry summary > span {
  flex: 1;
}

.club-rosters__entry summary strong {
  display: block;
  font-size: 15px;
}

.club-rosters__entry summary small {
  display: block;
  color: var(--color-text-muted);
  font-size: 12px;
  margin-top: 0.15rem;
}

.club-rosters__logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
  flex-shrink: 0;
}

.club-rosters__captain {
  margin: 0.75rem 0;
}

.club-rosters__players {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.85rem;
}

.club-rosters__player {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.club-rosters__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.club-rosters .button {
  border-radius: 8px;
  gap: 0.4rem;
}

.club-rosters__error {
  color: var(--color-error);
  font-size: 13px;
  margin: 0.75rem 0;
}

.club-rosters :is(input, select, button, summary):focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
@media (max-width: 600px) {
  .club-rosters {
    padding: 1rem;
  }

  .club-rosters__captain {
    flex-wrap: wrap;
  }

  .club-rosters__actions .button {
    white-space: normal;
    height: auto;
    min-height: 40px;
  }
}
</style>
