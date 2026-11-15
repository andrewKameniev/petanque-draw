<template>
  <div class="team-search-wrapper">
    <button
      ref="trigger"
      type="button"
      class="team-search-btn"
      :aria-label="modelValue ? `${modelValue} (${$t('teams.findCourt')})` : undefined"
      aria-haspopup="dialog"
      :aria-expanded="showSearch"
      @click="openSearch"
    >
      <Search :size="16" aria-hidden="true" />
      <span>{{ clubLabels[modelValue] || modelValue || $t('teams.findCourt') }}</span>
    </button>
    <button
      v-if="modelValue"
      type="button"
      class="team-search-clear"
      :aria-label="$t('teams.clearCourtSearch', { name: modelValue })"
      @click="clearSelection"
    >
      <X :size="16" aria-hidden="true" />
    </button>
    <dialog ref="dialog" class="team-search-dialog" :aria-label="$t('teams.findCourt')" @cancel.prevent="closeSearch">
      <header class="team-search-header">
        <h2>{{ $t('teams.findCourt') }}</h2>
        <button type="button" class="team-search-close" :aria-label="$t('common.close')" autofocus @click="closeSearch">
          <X :size="22" aria-hidden="true" />
        </button>
      </header>
      <div v-if="showSearch" class="team-search-body">
        <label class="team-search-field">
          {{ $t('teams.courtSearchQuery') }}
          <input
            v-model="searchQuery"
            type="search"
            class="team-search-input"
            enterkeyhint="search"
            @keydown.enter="applySearch"
          />
        </label>
        <ul v-if="filteredClubs.length" class="team-search-list">
          <li v-for="club in filteredClubs" :key="club">
            <button
              type="button"
              class="team-search-item"
              :aria-pressed="modelValue === club"
              :aria-label="club"
              :title="club"
              @click="selectTeam(club)"
            >
              <img
                v-if="clubLogos[club] && !failedLogos.includes(clubLogos[club])"
                class="team-search-logo"
                :src="clubLogos[club]"
                alt=""
                loading="lazy"
                @error="failedLogos.push(clubLogos[club])"
              />
              <Building2 v-else :size="18" aria-hidden="true" />
              <span>{{ clubLabels[club] }}</span>
            </button>
          </li>
        </ul>
        <ul v-if="filteredTeams.length" class="team-search-list">
          <li v-for="team in filteredTeams" :key="team">
            <button
              type="button"
              class="team-search-item"
              :aria-pressed="modelValue === team"
              @click="selectTeam(team)"
            >
              <span>{{ team }}</span>
            </button>
          </li>
        </ul>
        <p v-if="!filteredTeams.length && !filteredClubs.length" class="team-search-empty" role="status">
          {{ $t('teams.noResults') }}
        </p>
      </div>
    </dialog>
  </div>
</template>

<script>
import { Building2, Search, X } from 'lucide-vue-next';

export default {
  name: 'TeamSearch',
  components: { Building2, Search, X },
  props: {
    teams: { type: Array, default: () => [] },
    tournamentTeams: { type: Array, default: () => [] },
    teamClubMap: { type: Object, default: () => ({}) },
    modelValue: { type: String, default: null },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      showSearch: false,
      searchQuery: '',
      failedLogos: [],
    };
  },
  computed: {
    query() {
      return this.searchQuery.trim().toLowerCase();
    },
    allClubs() {
      return [...new Set(Object.values(this.teamClubMap).filter(Boolean))].sort();
    },
    clubLabels() {
      const labels = {};
      const counts = new Map();
      for (const club of this.allClubs) {
        const label = this.shortClubName(club);
        labels[club] = label;
        counts.set(label.toLocaleLowerCase(), (counts.get(label.toLocaleLowerCase()) || 0) + 1);
      }
      for (const club of this.allClubs) {
        if (counts.get(labels[club].toLocaleLowerCase()) > 1) labels[club] = club;
      }
      return labels;
    },
    clubLogos() {
      const logos = {};
      for (const team of this.tournamentTeams) {
        for (const player of team.players || []) {
          if (player.club && player.club_logo_url && !logos[player.club]) {
            logos[player.club] = player.club_logo_url;
          }
        }
      }
      return logos;
    },
    filteredClubs() {
      return this.allClubs.filter(
        (club) => club.toLowerCase().includes(this.query) || this.clubLabels[club].toLowerCase().includes(this.query),
      );
    },
    filteredTeams() {
      if (!this.query) return this.teams;
      return this.teams.filter(
        (team) => team.toLowerCase().includes(this.query) || this.teamClubMap[team]?.toLowerCase().includes(this.query),
      );
    },
  },
  beforeUnmount() {
    if (this.showSearch) this.closeSearch();
  },
  methods: {
    shortClubName(club) {
      const short = club
        .replace(/^\s*(?:громадська\s+організація|го)\s*/iu, '')
        .replace(/^[\s«"„“]+/u, '')
        .replace(/^(?:спортивний\s+)?(?:петанк[ -])?клуб\s*/iu, '')
        .replace(/^[\s«"„“]+|[\s»"”]+$/gu, '')
        .trim();
      return short || club;
    },
    openSearch() {
      this.searchQuery = '';
      this.updateSearchViewport();
      this.$refs.dialog.showModal();
      this.showSearch = true;
      window.visualViewport?.addEventListener('resize', this.updateSearchViewport);
      window.visualViewport?.addEventListener('scroll', this.updateSearchViewport);
    },
    closeSearch() {
      this.$refs.dialog.close();
      this.showSearch = false;
      window.visualViewport?.removeEventListener('resize', this.updateSearchViewport);
      window.visualViewport?.removeEventListener('scroll', this.updateSearchViewport);
      this.$refs.trigger.focus();
    },
    updateSearchViewport() {
      const viewport = window.visualViewport;
      if (!viewport) return;
      const { style } = this.$refs.dialog;
      style.setProperty('--search-viewport-left', `${viewport.offsetLeft}px`);
      style.setProperty('--search-viewport-top', `${viewport.offsetTop}px`);
      style.setProperty('--search-viewport-width', `${viewport.width}px`);
      style.setProperty('--search-viewport-height', `${viewport.height}px`);
    },
    clearSelection() {
      this.$emit('update:modelValue', null);
      this.$refs.trigger.focus();
    },
    selectTeam(team) {
      this.$emit('update:modelValue', this.modelValue === team ? null : team);
      this.closeSearch();
    },
    applySearch() {
      if (!this.query) return;
      if (this.filteredTeams.length === 1) {
        this.selectTeam(this.filteredTeams[0]);
      } else if (this.filteredClubs.length === 1 && !this.filteredTeams.length) {
        this.selectTeam(this.filteredClubs[0]);
      } else if (this.filteredTeams.length || this.filteredClubs.length) {
        this.$emit('update:modelValue', this.searchQuery.trim());
        this.closeSearch();
      }
    },
  },
};
</script>

<style scoped>
.team-search-wrapper {
  position: relative;
  isolation: isolate;
  display: inline-flex;
  min-width: 0;
  max-width: min(100%, 22rem);
  border-radius: 999px;
}

.team-search-wrapper::before {
  position: absolute;
  z-index: -1;
  inset: 7px 0;
  border-radius: inherit;
  border: 1px solid var(--color-border);
  background: var(--color-primary-bg);
  content: '';
  pointer-events: none;
}

.team-search-btn,
.team-search-clear,
.team-search-close,
.team-search-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 48px;
  padding: 0.5rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  line-height: 1.3;
  overflow-wrap: anywhere;
  cursor: pointer;
}

.team-search-btn,
.team-search-clear {
  border: 0;
  border-radius: inherit;
}

.team-search-btn {
  gap: 0.375rem;
  min-width: 0;
  padding-inline: 0.625rem;
  font-weight: 650;
  text-align: start;
}

.team-search-clear {
  justify-content: center;
  flex: 0 0 48px;
  padding: 0;
  color: var(--color-text-secondary);
}

.team-search-wrapper:has(> button:hover)::before,
.team-search-item[aria-pressed='true'] {
  background: var(--color-primary-bg-hover);
}

.team-search-item[aria-pressed='true'] {
  font-weight: 700;
}

.team-search-wrapper svg {
  flex-shrink: 0;
}

.team-search-wrapper :is(button, input):focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}

.team-search-dialog {
  position: fixed;
  inset: auto;
  top: calc(var(--search-viewport-top, 0px) + var(--search-viewport-height, 100dvh) / 2);
  left: calc(var(--search-viewport-left, 0px) + var(--search-viewport-width, 100vw) / 2);
  transform: translate(-50%, -50%);
  width: min(34rem, calc(var(--search-viewport-width, 100vw) - 1rem));
  max-width: none;
  max-height: min(42rem, calc(var(--search-viewport-height, 100dvh) - 1rem));
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: var(--color-modal-bg);
  color: var(--color-text);
  box-shadow: 0 8px 24px var(--color-dropdown-shadow);
  text-align: start;
  font-size: 1rem;
  font-weight: 400;
}

.team-search-dialog::backdrop {
  background: var(--color-overlay-bg);
}

.team-search-dialog[open] {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
}

.team-search-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.team-search-header h2 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.team-search-close {
  justify-content: center;
  width: 48px;
  padding: 0;
  border-color: var(--color-border);
}

.team-search-body {
  padding: 0.75rem;
  overflow: auto;
  overscroll-behavior: contain;
  scroll-padding: 0.75rem;
}

.team-search-field {
  display: grid;
  gap: 0.25rem;
}

.team-search-input {
  width: 100%;
  min-height: 48px;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-text-secondary);
  border-radius: 0.5rem;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

.team-search-list {
  display: grid;
  gap: 0.25rem;
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
}

.team-search-list + .team-search-list {
  border-top: 1px solid var(--color-border);
  padding-top: 0.75rem;
}

.team-search-item {
  width: 100%;
  text-align: start;
}

.team-search-logo {
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.team-search-item[aria-pressed='false']:hover,
.team-search-close:hover {
  background: var(--color-surface-hover);
}

.team-search-empty {
  margin: 0.75rem 0 0;
}
</style>
