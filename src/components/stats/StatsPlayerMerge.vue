<template>
  <div class="player-merge">
    <div class="player-merge__intro">
      <div>
        <h3 class="player-merge__title">{{ $t('stat.playerIdentities') }}</h3>
        <p class="player-merge__description">{{ $t('stat.playerIdentitiesHelp') }}</p>
      </div>
      <div class="player-merge__legend">
        <Link2 :size="15" />
        {{ $t('stat.mergeIsReversible') }}
      </div>
    </div>

    <div v-if="!canonicalPlayers.length" class="player-merge__empty">
      <UserRoundSearch :size="34" />
      <strong>{{ $t('stat.noPortalPlayers') }}</strong>
      <span>{{ $t('stat.noPortalPlayersHelp') }}</span>
    </div>

    <div v-else class="player-merge__grid">
      <section class="player-merge__column">
        <div class="player-merge__column-heading">
          <span>{{ $t('stat.portalPlayers') }}</span>
          <span class="player-merge__count">{{ canonicalPlayers.length }}</span>
        </div>
        <button
          v-for="player in canonicalPlayers"
          :key="player.portalPlayerId"
          class="player-merge__player"
          :class="{ 'player-merge__player--active': selectedPortalId === player.portalPlayerId }"
          @click="selectPlayer(player.portalPlayerId)"
        >
          <span class="player-merge__player-main">
            <strong>{{ player.name }}</strong>
            <small>ID {{ player.portalPlayerId }}</small>
          </span>
          <span class="player-merge__player-games"> {{ mergedGamesCount(player) }} {{ $t('stat.games') }} </span>
        </button>
      </section>

      <section class="player-merge__column player-merge__column--aliases">
        <template v-if="selectedPlayer">
          <div class="player-merge__selected-heading">
            <div>
              <span class="player-merge__eyebrow">{{ $t('stat.mergeInto') }}</span>
              <h4>{{ selectedPlayer.name }}</h4>
            </div>
            <span class="player-merge__id">Portal ID {{ selectedPlayer.portalPlayerId }}</span>
          </div>

          <label class="player-merge__label">{{ $t('stat.legacyNames') }}</label>
          <VueSelect
            v-model="selectedAliases"
            :options="availableLegacyOptions"
            :is-multi="true"
            :placeholder="$t('stat.selectLegacyNames')"
          />
          <p class="player-merge__hint">{{ $t('stat.legacyNamesHelp') }}</p>

          <div v-if="selectedPlayer.aliases.length" class="player-merge__saved-links">
            <span class="player-merge__label">{{ $t('stat.savedPlayerLinks') }}</span>
            <div class="player-merge__saved-links-list">
              <button
                v-for="alias in selectedPlayer.aliases"
                :key="alias"
                class="player-merge__saved-link"
                :disabled="saving"
                :title="$t('stat.unlinkPlayerName')"
                @click="unlinkAlias(alias)"
              >
                {{ alias }}
                <Unlink :size="13" />
              </button>
            </div>
          </div>

          <div class="player-merge__preview">
            <span>{{ $t('stat.mergePreview') }}</span>
            <strong>
              {{ selectedPlayer.directGames }} + {{ selectedAliasGames }} = {{ previewGames }}
              {{ $t('stat.games') }}
            </strong>
          </div>

          <div class="player-merge__actions">
            <span v-if="saved" class="player-merge__saved"><Check :size="15" /> {{ $t('common.saved') }}</span>
            <button class="player-merge__save" :disabled="saving" @click="saveAliases">
              <LoaderCircle v-if="saving" :size="16" class="player-merge__spinner" />
              <Save v-else :size="16" />
              {{ $t('stat.saveMerge') }}
            </button>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<script>
import VueSelect from 'vue3-select-component';
import 'vue3-select-component/dist/styles.css';
import { Check, Link2, LoaderCircle, Save, Unlink, UserRoundSearch } from 'lucide-vue-next';
import { mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { statsPlayerIdentityService } from '@/services/db';
import { collectCanonicalPlayers, collectLegacyPlayers, normalizePlayerName } from '@/helpers-stat-identities';

export default {
  name: 'StatsPlayerMerge',
  components: { VueSelect, Check, Link2, LoaderCircle, Save, Unlink, UserRoundSearch },
  props: {
    stats: { type: Object, default: null },
    identities: { type: Object, default: null },
    userId: { type: String, required: true },
  },
  emits: ['identitiesUpdated'],
  data() {
    return {
      selectedPortalId: null,
      selectedAliases: [],
      saving: false,
      saved: false,
    };
  },
  computed: {
    canonicalPlayers() {
      return collectCanonicalPlayers(this.stats, this.identities);
    },
    legacyPlayers() {
      return collectLegacyPlayers(this.stats);
    },
    selectedPlayer() {
      return this.canonicalPlayers.find((player) => player.portalPlayerId === this.selectedPortalId) || null;
    },
    aliasesOwnedByOtherPlayers() {
      const owned = new Set();
      Object.values(this.identities || {}).forEach((identity) => {
        if (String(identity.portalPlayerId) === this.selectedPortalId) return;
        (identity.aliases || []).forEach((alias) => owned.add(normalizePlayerName(alias)));
      });
      return owned;
    },
    automaticallyMatchedCanonicalNames() {
      const counts = new Map();
      this.canonicalPlayers.forEach((player) => {
        const name = normalizePlayerName(player.name);
        counts.set(name, (counts.get(name) || 0) + 1);
      });
      return new Set([...counts.entries()].filter(([, count]) => count === 1).map(([name]) => name));
    },
    availableLegacyOptions() {
      if (!this.selectedPlayer) return [];
      const currentAliases = new Set(this.selectedAliases.map(normalizePlayerName));
      const options = this.legacyPlayers
        .filter((player) => {
          if (currentAliases.has(player.normalized)) return true;
          return (
            !this.aliasesOwnedByOtherPlayers.has(player.normalized) &&
            !this.automaticallyMatchedCanonicalNames.has(player.normalized)
          );
        })
        .map((player) => ({
          label: `${player.name} · ${player.games} ${this.$t('stat.games')}`,
          value: player.name,
        }));

      this.selectedAliases.forEach((alias) => {
        if (!options.some((option) => normalizePlayerName(option.value) === normalizePlayerName(alias))) {
          options.push({ label: alias, value: alias });
        }
      });
      return options.sort((a, b) => a.label.localeCompare(b.label));
    },
    selectedAliasGames() {
      return this.getLinkedLegacyGames(this.selectedPlayer, this.selectedAliases);
    },
    previewGames() {
      return (this.selectedPlayer?.directGames || 0) + this.selectedAliasGames;
    },
  },
  watch: {
    canonicalPlayers: {
      immediate: true,
      handler(players) {
        if (!this.selectedPortalId && players.length) this.selectPlayer(players[0].portalPlayerId);
      },
    },
  },
  methods: {
    ...mapActions(useMainStore, ['showMessage']),
    selectPlayer(portalPlayerId) {
      this.selectedPortalId = String(portalPlayerId);
      const identity = Object.values(this.identities || {}).find(
        (item) => String(item.portalPlayerId) === this.selectedPortalId,
      );
      this.selectedAliases = [...(identity?.aliases || [])];
      this.saved = false;
    },
    mergedGamesCount(player) {
      return player.directGames + this.getLinkedLegacyGames(player, player.aliases || []);
    },
    getLinkedLegacyGames(player, aliases) {
      if (!player) return 0;
      const linkedNames = new Set(aliases.map(normalizePlayerName));
      const canonicalName = normalizePlayerName(player.name);
      const playersWithSameName = this.canonicalPlayers.filter(
        (canonical) => normalizePlayerName(canonical.name) === canonicalName,
      );
      if (playersWithSameName.length === 1) linkedNames.add(canonicalName);
      return this.legacyPlayers.reduce(
        (total, legacy) => total + (linkedNames.has(legacy.normalized) ? legacy.games : 0),
        0,
      );
    },
    unlinkAlias(alias) {
      this.selectedAliases = this.selectedAliases.filter(
        (selectedAlias) => normalizePlayerName(selectedAlias) !== normalizePlayerName(alias),
      );
      this.saveAliases();
    },
    async saveAliases() {
      if (!this.selectedPlayer) return;
      this.saving = true;
      this.saved = false;
      const aliases = [
        ...new Map(this.selectedAliases.map((alias) => [normalizePlayerName(alias), alias.trim()])).values(),
      ]
        .filter(Boolean)
        .filter((alias) => !this.automaticallyMatchedCanonicalNames.has(normalizePlayerName(alias)));
      const identity = {
        portalPlayerId: this.selectedPlayer.portalPlayerId,
        name: this.selectedPlayer.name,
        aliases,
      };

      try {
        await statsPlayerIdentityService.save(this.userId, this.selectedPlayer.portalPlayerId, identity);
        this.selectedAliases = aliases;
        this.saved = true;
        this.$emit('identitiesUpdated', this.selectedPlayer.portalPlayerId, identity);
      } catch (error) {
        console.error('Error saving player identity:', error);
        this.showMessage({ title: this.$t('messages.error'), text: error, type: 'error' });
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.player-merge {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.player-merge__intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.player-merge__title,
.player-merge__selected-heading h4 {
  margin: 0;
  color: var(--color-text);
}

.player-merge__description,
.player-merge__hint {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
}

.player-merge__legend,
.player-merge__saved {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-primary);
  white-space: nowrap;
}

.player-merge__grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.8fr) minmax(360px, 1.2fr);
  gap: 1rem;
}

.player-merge__column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.player-merge__column-heading,
.player-merge__selected-heading,
.player-merge__preview,
.player-merge__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.player-merge__column-heading {
  padding-bottom: 0.4rem;
  font-weight: 700;
  color: var(--color-text);
}

.player-merge__count,
.player-merge__id {
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 600;
}

.player-merge__player {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  padding: 0.7rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-input);
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
}

.player-merge__player:hover,
.player-merge__player--active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.player-merge__player-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.player-merge__player-main strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-merge__player-main small,
.player-merge__player-games,
.player-merge__eyebrow,
.player-merge__label {
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.player-merge__eyebrow,
.player-merge__label {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.player-merge__column--aliases {
  gap: 0.75rem;
}

.player-merge__preview {
  margin-top: 0.35rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: var(--color-primary-bg);
  color: var(--color-text);
}

.player-merge__saved-links {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-top: 0.25rem;
}

.player-merge__saved-links-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.player-merge__saved-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--color-primary);
  border-radius: 999px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  cursor: pointer;
}

.player-merge__saved-link:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.player-merge__saved-link:disabled {
  opacity: 0.6;
  cursor: wait;
}

.player-merge__actions {
  margin-top: auto;
  padding-top: 0.5rem;
}

.player-merge__save {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-left: auto;
  padding: 0.6rem 0.9rem;
  border: 0;
  border-radius: 8px;
  background: var(--color-primary);
  color: var(--color-btn-text);
  font-weight: 600;
  cursor: pointer;
}

.player-merge__save:disabled {
  opacity: 0.6;
  cursor: wait;
}

.player-merge__spinner {
  animation: player-merge-spin 0.8s linear infinite;
}

.player-merge__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 2.5rem 1rem;
  border: 1px dashed var(--color-border);
  border-radius: 10px;
  color: var(--color-text-muted);
  text-align: center;
}

@keyframes player-merge-spin {
  to {
    transform: rotate(360deg);
  }
}

@media screen and (max-width: 768px) {
  .player-merge__intro,
  .player-merge__selected-heading {
    flex-direction: column;
  }

  .player-merge__grid {
    grid-template-columns: 1fr;
  }
}
</style>
