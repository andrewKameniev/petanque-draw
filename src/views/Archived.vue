<template>
  <PublicPageShell class="wrapper">
    <Navbar @open-menu="menuOpen = !menuOpen" />
    <Menu :active="menuOpen" @closeMenu="menuOpen = false" />
    <div class="container">
      <div class="archived-layout">
        <aside class="archived-sidebar">
          <div class="archived-sidebar__card">
            <div class="archived-sidebar__header">
              {{ $t('common.archivedTournaments') }}
              <label v-if="isSuperAdmin" class="archived-sidebar__toggle">
                <input type="checkbox" v-model="showAllUsers" @change="onShowAllChange" />
                <span>{{ $t('common.showAll') }}</span>
              </label>
            </div>
            <div class="archived-sidebar__search">
              <input
                v-model="searchQuery"
                type="text"
                class="archived-sidebar__search-input"
                :placeholder="$t('common.search') + '...'"
              />
              <select v-if="useArchiveIndex" v-model="systemFilter" class="archived-sidebar__filter-select">
                <option value="">{{ $t('teams.system') }}</option>
                <option value="swiss">Swiss</option>
                <option value="groups">{{ $t('teams.groups') }}</option>
                <option value="poules">{{ $t('teams.poules') }}</option>
                <option value="supermele">Supermêlée</option>
                <option value="tir">{{ $t('teams.tir') }}</option>
              </select>
            </div>
            <div class="archived-sidebar__list">
              <template v-if="isArchiveLoading">
                <div v-for="n in 7" :key="`archive-sidebar-skeleton-${n}`" class="archive-sidebar-skeleton-row">
                  <span class="archive-skeleton__bone archive-sidebar-skeleton-row__name"></span>
                  <span class="archive-skeleton__bone archive-sidebar-skeleton-row__meta"></span>
                </div>
              </template>
              <button
                v-else
                v-for="[key, item] in tournamentEntries"
                :key="key"
                class="archived-sidebar__item"
                :data-tournament-id="key"
                :class="{ 'archived-sidebar__item--active': key === activeKey }"
                @click="selectTournament(key)"
              >
                <span class="archived-sidebar__item-name">{{ getRecordMetadata(item).name }}</span>
                <span class="archived-sidebar__item-meta">
                  <span v-if="formatDate(getRecordMetadata(item).date)" class="archived-sidebar__item-date">{{
                    formatDate(getRecordMetadata(item).date)
                  }}</span>
                  <span v-if="getFormatTag(item)" class="archived-sidebar__item-tag">{{ getFormatTag(item) }}</span>
                </span>
              </button>
            </div>
          </div>
          <div v-if="isArchiveLoading" class="archived-sidebar__actions archive-sidebar-actions-skeleton">
            <span class="archive-skeleton__bone archive-sidebar-actions-skeleton__label"></span>
            <span class="archive-skeleton__bone archive-sidebar-actions-skeleton__input"></span>
            <span
              class="archive-skeleton__bone archive-sidebar-actions-skeleton__label archive-sidebar-actions-skeleton__label--short"
            ></span>
            <div class="archive-sidebar-actions-skeleton__buttons">
              <span class="archive-skeleton__bone"></span>
              <span class="archive-skeleton__bone"></span>
            </div>
            <div
              class="archive-sidebar-actions-skeleton__buttons archive-sidebar-actions-skeleton__buttons--management"
            >
              <span class="archive-skeleton__bone"></span>
              <span class="archive-skeleton__bone"></span>
            </div>
          </div>
          <div v-else-if="activeKey && tournament" class="archived-sidebar__actions">
            <div class="sidebar-action-row">
              <label class="sidebar-action-row__label"
                >DB ID: <span class="sidebar-action-row__db-id" @click="copyDbId">{{ activeKey }}</span></label
              >
            </div>
            <div class="sidebar-action-row">
              <label class="sidebar-action-row__label">Portal ID</label>
              <div class="sidebar-action-row__input-group">
                <input
                  v-model="portalIdInput"
                  class="sidebar-action-row__input"
                  type="number"
                  :placeholder="$t('teams.tournamentId')"
                  @keyup.enter="savePortalId"
                />
                <button
                  class="sidebar-action-row__save"
                  @click="savePortalId"
                  :disabled="!portalIdInput || portalIdInput == portalId"
                >
                  {{ $t('common.save') }}
                </button>
              </div>
            </div>
            <div class="sidebar-action-row sidebar-action-row--buttons">
              <button
                v-if="portalId"
                class="archived-links__btn archived-links__btn--secondary"
                :disabled="fetchingLogos"
                @click="refreshClubLogos"
              >
                <RefreshCw :size="14" :class="{ spin: fetchingLogos }" />
                {{ fetchingLogos ? '...' : $t('common.refreshLogos') }}
              </button>
              <button class="archived-links__btn" @click="copyPublicLink">
                <Link2 :size="14" />
                {{ publicLinkCopied ? $t('messages.success') : $t('remote.copyLink') }}
              </button>
            </div>
            <div class="sidebar-action-row sidebar-action-row--buttons sidebar-action-row--management">
              <button v-if="isActiveOwner || isSuperAdmin" class="button btn-make-active" @click="makeActive">
                <ArchiveRestore :size="16" />
                <span>{{ $t('common.makeActive') }}</span>
              </button>
              <button v-if="canDeleteActive" class="button btn-remove-archived" @click="removeTournament">
                <Trash2 :size="16" />
                <span>{{ $t('common.remove') }}</span>
              </button>
              <button v-else-if="!isActiveOwner" class="button btn-remove-archived" @click="removeFromView">
                <EyeOff :size="16" />
                <span>{{ $t('common.removeFromList') }}</span>
              </button>
            </div>
          </div>
        </aside>

        <div class="archived-content">
          <div v-if="showLoadingSkeleton" class="archive-skeleton" aria-hidden="true">
            <div class="archive-skeleton__heading">
              <span class="archive-skeleton__bone archive-skeleton__title"></span>
              <span class="archive-skeleton__bone archive-skeleton__icon"></span>
              <span class="archive-skeleton__bone archive-skeleton__header-button"></span>
            </div>

            <div class="archive-skeleton__summary">
              <span class="archive-skeleton__bone archive-skeleton__status"></span>
              <div
                v-for="width in ['42%', '64%', '30%', '48%', '36%']"
                :key="width"
                class="archive-skeleton__summary-row"
              >
                <span class="archive-skeleton__bone archive-skeleton__summary-label"></span>
                <span class="archive-skeleton__bone archive-skeleton__summary-value" :style="{ width }"></span>
              </div>
            </div>

            <div class="archive-skeleton__panel">
              <div class="archive-skeleton__tabs">
                <div v-for="n in 4" :key="`archive-tab-skeleton-${n}`" class="archive-skeleton__tab">
                  <span class="archive-skeleton__bone archive-skeleton__tab-icon"></span>
                  <span class="archive-skeleton__bone archive-skeleton__tab-label"></span>
                </div>
              </div>
              <div class="archive-skeleton__panel-body">
                <div class="archive-skeleton__toolbar">
                  <span class="archive-skeleton__bone archive-skeleton__toolbar-pill"></span>
                  <span
                    class="archive-skeleton__bone archive-skeleton__toolbar-pill archive-skeleton__toolbar-pill--short"
                  ></span>
                  <span class="archive-skeleton__toolbar-spacer"></span>
                  <span class="archive-skeleton__bone archive-skeleton__toolbar-button"></span>
                  <span class="archive-skeleton__bone archive-skeleton__toolbar-button"></span>
                </div>
                <div class="archive-skeleton__table">
                  <div class="archive-skeleton__table-row archive-skeleton__table-row--header">
                    <span v-for="n in 3" :key="`archive-header-cell-${n}`" class="archive-skeleton__bone"></span>
                  </div>
                  <div v-for="n in 9" :key="`archive-table-row-${n}`" class="archive-skeleton__table-row">
                    <span class="archive-skeleton__bone archive-skeleton__cell-place"></span>
                    <span class="archive-skeleton__bone" :style="{ width: `${52 + ((n * 7) % 32)}%` }"></span>
                    <span class="archive-skeleton__bone" :style="{ width: `${66 + ((n * 5) % 25)}%` }"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            v-else-if="activeKey && savedTournaments[activeKey]"
            class="tournament-selector"
            @click="selectorOpen = !selectorOpen"
            v-click-outside="closeSelector"
          >
            <template v-if="editingName">
              <input
                ref="nameInput"
                class="tournament-selector__input"
                :value="savedTournaments[activeKey].name"
                @click.stop
                @keyup.enter="saveName($event.target.value)"
                @keyup.escape="editingName = false"
                @blur="saveName($event.target.value)"
              />
            </template>
            <template v-else>
              <span class="tournament-selector__name">{{ savedTournaments[activeKey].name }}</span>
              <button class="tournament-selector__edit" @click.stop="startEditName" :title="$t('common.edit')">
                <Pencil :size="16" />
              </button>
            </template>
            <svg
              class="tournament-selector__arrow tournament-selector__arrow--mobile"
              :class="{ 'tournament-selector__arrow--open': selectorOpen }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
            <div class="tournament-selector__mobile-actions">
              <button v-if="isActiveOwner || isSuperAdmin" class="button btn-make-active" @click.stop="makeActive">
                <ArchiveRestore :size="16" />
                <span class="is-hidden-mobile">{{ $t('common.makeActive') }}</span>
              </button>
              <button v-if="canDeleteActive" class="button btn-remove-archived" @click.stop="removeTournament">
                <Trash2 :size="16" />
                <span class="is-hidden-mobile">{{ $t('common.remove') }}</span>
              </button>
              <button v-else-if="!isActiveOwner" class="button btn-remove-archived" @click.stop="removeFromView">
                <EyeOff :size="16" />
                <span class="is-hidden-mobile">{{ $t('common.removeFromList') }}</span>
              </button>
            </div>
            <div class="tournament-selector__dropdown" v-if="selectorOpen">
              <a
                href="#"
                class="tournament-selector__option"
                :class="{ 'tournament-selector__option--active': key === activeKey }"
                v-for="[key, item] in tournamentEntries"
                :key="key"
                @click.prevent.stop="selectTournament(key)"
              >
                {{ item.name }}
                <span v-if="getFormatTag(item)" class="tournament-selector__tag">{{ getFormatTag(item) }}</span>
              </a>
            </div>
          </div>

          <div v-if="!showLoadingSkeleton && !activeKey" class="empty-state">
            <svg class="empty-state__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            <h2 class="empty-state__title">{{ $t('common.archivedTournaments') }}</h2>
            <p class="empty-state__text">{{ $t('messages.noArchivedTournaments') }}</p>
            <router-link to="/" class="button empty-state__btn">{{ $t('common.draw') }}</router-link>
          </div>

          <template v-if="activeTournament && !showLoadingSkeleton">
            <div class="tournament-info-card mt-3 mb-3">
              <span class="badge badge-corner" :class="badgeClass">
                {{ badgeLabel }}
              </span>
              <div class="tournament-info-row" v-if="tournamentDate">
                <span class="has-text-grey-dark">{{ $t('common.date') }}:</span>
                <span class="has-text-weight-semibold">{{ tournamentDate }}</span>
              </div>
              <div class="tournament-info-row">
                <span class="has-text-grey-dark">{{ $t('teams.system') }}:</span>
                <span class="has-text-weight-semibold">{{ systemDescription }}</span>
              </div>
              <div class="tournament-info-row" v-if="activeTournament.teams">
                <span class="has-text-grey-dark">{{ $t('common.teamsCount') }}:</span>
                <span class="has-text-weight-semibold">{{ activeTournament.teams.length }}</span>
              </div>
              <div class="tournament-info-row" v-if="tournamentExtrasLine">
                <span class="has-text-grey-dark">{{ $t('common.timeLimit') }}:</span>
                <span class="has-text-weight-semibold">{{ tournamentExtrasLine }}</span>
              </div>
              <div class="tournament-info-row" v-if="activeTournament.cadrage">
                <span class="has-text-grey-dark">{{ $t('games.cadrage') }}:</span>
                <span class="has-text-weight-semibold">{{ cadrageRange }}</span>
              </div>
              <div class="tournament-info-row" v-if="activeTournament.playOff">
                <span class="has-text-grey-dark">{{ $t('games.playOff') }}:</span>
                <span class="has-text-weight-semibold">{{ playOffTeamsCount }} {{ $t('common.teamsLabel') }}</span>
              </div>
              <div class="archived-links archived-links--mobile">
                <button class="archived-links__btn" @click="copyPublicLink">
                  <Link2 :size="14" />
                  {{ publicLinkCopied ? $t('messages.success') : $t('remote.copyLink') }}
                </button>
                <button
                  v-if="portalId"
                  class="archived-links__btn archived-links__btn--secondary"
                  :disabled="fetchingLogos"
                  @click="refreshClubLogos"
                >
                  <RefreshCw :size="14" :class="{ spin: fetchingLogos }" />
                  {{ fetchingLogos ? '...' : $t('common.refreshLogos') }}
                </button>
              </div>
            </div>
            <TirPublicView
              v-if="activeTournament.system === 'tir'"
              :key="activeKey"
              :tournament="activeTournament"
              :protocol-available="activeTournament.tournamentIsFinished"
              :protocol-tournament-meta="protocolTournamentMeta"
              class="mt-3"
            />
            <template v-else>
              <TournamentNav v-model="activeTab" :tabs="tabs" />
              <div
                id="tournament-tabpanel"
                class="tabs-content-area"
                role="tabpanel"
                :aria-labelledby="`tab-${activeTab}`"
              >
                <DoubleElimination
                  v-if="activeTab === 'bracket' && isDoubleElimination"
                  :active-tournament="activeTournament"
                  :is-public-view="true"
                  :bracket-only="true"
                  class="playoff-public-wrapper"
                />
                <Bracket
                  v-else-if="activeTab === 'bracket' && hasPlayoffBracket"
                  :bracket="activeTournament.playOffBracket"
                  :embedded="true"
                  class="playoff-public-wrapper"
                />
                <div v-if="activeTab === 'teams'">
                  <TeamsList :previewTournament="activeTournament" />
                </div>
                <Results
                  v-if="activeTab === 'results'"
                  :previewTournament="activeTournament"
                  :hide-bracket-button="hasPlayoffBracket"
                />
                <div v-if="activeTab === 'ranking'">
                  <Ranking :tournament="activeTournament" :rankingTeams="rankingTeams" :activeRound="activeRound" />
                </div>
                <div v-if="activeTab === 'protocol'">
                  <Protocol
                    :tournament="activeTournament"
                    :tournament-meta="protocolTournamentMeta"
                    :rankingTeams="rankingTeams"
                    :skipGate="true"
                    :hide-close="true"
                  />
                </div>
              </div>
            </template>
          </template>
        </div>
      </div>
    </div>
    <Footer />
  </PublicPageShell>
</template>

<script>
import Ranking from '@/components/partials/Ranking';
import Results from '@/components/partials/Results';
import Protocol from '@/components/partials/Protocol';
import TeamsList from '@/components/partials/TeamsList';
import DoubleElimination from '@/components/partials/DoubleElimination.vue';
import Bracket from '@/components/partials/Bracket.vue';
import TirPublicView from '@/components/tir/TirPublicView.vue';
import Footer from '@/components/partials/Footer.vue';
import Navbar from '@/components/Navbar.vue';
import Menu from '@/components/Menu.vue';
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { getTeamsRanking } from '@/helpers';
import { tournamentService } from '@/services/db';
import { syncFromPortal, FIELD_SETS } from '@/services/portal-sync';
import { PortalError } from '@/services/portal';
import { encodeTournamentRef } from '@/services/tournament-ref';
import {
  getActiveRound,
  getCadragePlaceRange,
  getPlayoffParticipantCount,
  getSystemDescription,
  getTournamentBadge,
  getTournamentExtras,
  isFinale as computeIsFinale,
  isInPlayoff as computeIsInPlayoff,
  isTournamentFinished,
  isTournamentStarted,
  splitTournamentMessage,
} from '@/services/tournament-presentation';
import {
  getTournamentGroup,
  getTournamentMain,
  getTournamentMetadata,
  getTournamentStorageTarget,
  normalizeTournamentRecord,
} from '@/services/tournament-record';
import PublicPageShell from '@/components/ui/PublicPageShell.vue';
import TournamentNav from '@/components/ui/TournamentNav.vue';
import {
  GitFork,
  Users,
  List,
  Trophy as TrophyIcon,
  FileText,
  Pencil,
  Link2,
  RefreshCw,
  ArchiveRestore,
  Trash2,
  EyeOff,
} from 'lucide-vue-next';

export default {
  name: 'Archived',
  components: {
    PublicPageShell,
    TournamentNav,
    Footer,
    Navbar,
    Menu,
    DoubleElimination,
    Bracket,
    TirPublicView,
    TeamsList,
    Results,
    Ranking,
    Protocol,
    Pencil,
    Link2,
    RefreshCw,
    ArchiveRestore,
    Trash2,
    EyeOff,
  },
  data() {
    return {
      activeTab: 'ranking',
      activeKey: null,
      selectorOpen: false,
      menuOpen: false,
      tournament: null,
      isArchiveLoading: true,
      isLoading: false,
      editingName: false,
      publicLinkCopied: false,
      fetchingLogos: false,
      portalIdInput: null,
      searchQuery: '',
      systemFilter: '',
      showAllUsers: localStorage.getItem('petanqueDrawArchiveShowAll') !== 'false',
    };
  },
  directives: {
    'click-outside': {
      mounted(el, binding) {
        el._clickOutside = (e) => {
          if (!el.contains(e.target)) binding.value();
        };
        document.addEventListener('click', el._clickOutside);
      },
      unmounted(el) {
        document.removeEventListener('click', el._clickOutside);
      },
    },
  },
  async created() {
    try {
      const promises = [this.fetchSavedTournaments()];
      if (this.isSuperAdmin) promises.push(this.fetchArchiveIndex());
      await Promise.all(promises);
      const keys = this.filteredKeys;
      if (keys.length) {
        this.activeKey = keys[keys.length - 1];
      }
    } finally {
      this.isArchiveLoading = false;
    }
  },
  watch: {
    savedTournaments: {
      handler() {
        if (!this.activeKey && this.tournamentKeys.length) {
          this.activeKey = this.tournamentKeys[this.tournamentKeys.length - 1];
        }
      },
      immediate: true,
    },
    activeKey: {
      handler(key) {
        if (key) {
          const selected = this.savedTournaments?.[key];
          const tournament = getTournamentGroup(selected, 'A');
          this.activeTab = this.getDefaultTab(tournament);
          this.subscribeTournament(key);
        }
      },
      immediate: true,
    },
    portalId(val) {
      this.portalIdInput = val || null;
    },
  },
  beforeUnmount() {
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  },
  computed: {
    ...mapState(useMainStore, ['savedTournaments', 'user', 'userTournamentMap', 'isSuperAdmin', 'archiveIndex']),
    archiveIndexEntries() {
      if (!this.archiveIndex) return [];
      let entries = Object.entries(this.archiveIndex).filter(([, item]) => item.portalId);
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        entries = entries.filter(
          ([, item]) => item.nameLower?.includes(q) || item.name?.toLowerCase().includes(q) || item.date?.includes(q),
        );
      }
      if (this.systemFilter) {
        entries = entries.filter(([, item]) => item.system === this.systemFilter);
      }
      return entries.sort((a, b) => (b[1].date || '').localeCompare(a[1].date || ''));
    },
    useArchiveIndex() {
      return this.isSuperAdmin && this.showAllUsers && this.archiveIndex;
    },
    tournamentEntries() {
      if (this.useArchiveIndex) return this.archiveIndexEntries;
      let entries = Object.entries(this.savedTournaments);
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        entries = entries.filter(([, item]) => {
          const meta = getTournamentMetadata(item);
          return meta.name?.toLowerCase().includes(q) || meta.date?.includes(q);
        });
      }
      return entries.reverse();
    },
    tournamentKeys() {
      return this.tournamentEntries.map(([key]) => key);
    },
    filteredKeys() {
      return this.tournamentKeys;
    },
    activeTournament() {
      return getTournamentGroup(this.tournament, 'A');
    },
    tournamentMetadata() {
      return getTournamentMetadata(this.tournament, { id: this.activeKey });
    },
    activeMapEntry() {
      return this.userTournamentMap?.[this.activeKey] || null;
    },
    activeOwnerUid() {
      if (this.activeMapEntry?.role === 'admin') return this.activeMapEntry.ownerUid;
      if (this.useArchiveIndex && this.archiveIndex?.[this.activeKey]?.ownerUid) {
        return this.archiveIndex[this.activeKey].ownerUid;
      }
      return this.user?.uid;
    },
    canDeleteActive() {
      if (!this.activeKey || !this.tournament) return false;
      const hasPortalId = !!getTournamentMetadata(this.tournament).portalIdTournament;
      if (hasPortalId) return false;
      if (this.isSuperAdmin) return true;
      return this.activeMapEntry?.role === 'owner';
    },
    isActiveOwner() {
      return this.activeMapEntry?.role === 'owner';
    },
    showLoadingSkeleton() {
      return this.isArchiveLoading || this.isLoading;
    },
    protocolTournamentMeta() {
      if (!this.tournament) return null;
      return getTournamentMetadata(this.tournament, { id: this.activeKey });
    },
    hasPlayoffBracket() {
      return !!this.activeTournament?.playOffBracket?.stages?.length;
    },
    isDoubleElimination() {
      return this.activeTournament?.playOffBracket?.format === 'double';
    },
    tabs() {
      const t = this.activeTournament;
      const list = [];
      if (this.hasPlayoffBracket) {
        list.push({ id: 'bracket', label: this.$t('doubleElimination.bracketTab'), icon: GitFork });
      }
      list.push({ id: 'teams', label: this.$t('teams.teams'), icon: Users });
      list.push({ id: 'results', label: this.$t('teams.results'), icon: List });
      list.push({ id: 'ranking', label: this.$t('teams.ranking'), icon: TrophyIcon });
      if (t?.tournamentIsFinished && t?.teams?.length) {
        list.push({ id: 'protocol', label: this.$t('teams.protocol'), icon: FileText });
      }
      return list;
    },
    activeRound() {
      return getActiveRound(this.activeTournament);
    },
    isFinished() {
      return isTournamentFinished(this.activeTournament);
    },
    isStarted() {
      return isTournamentStarted(this.activeTournament);
    },
    badgeClass() {
      const badge = getTournamentBadge(this.activeTournament);
      return badge === 'finished' ? 'badge-finished' : badge === 'not-started' ? 'badge-not-started' : 'badge-active';
    },
    badgeLabel() {
      if (this.isFinished) return this.$t('common.finished');
      if (!this.isStarted) return this.$t('common.notStarted');
      return this.$t('common.active');
    },
    rankingTeams() {
      if (!this.activeTournament?.teams || !this.activeTournament?.games) return [];
      if (
        (this.activeTournament.system === 'groups' || this.activeTournament.system === 'poules') &&
        !this.activeTournament.groups
      )
        return [];
      return getTeamsRanking(this.activeTournament, this.activeRound);
    },
    tournamentMessageLines() {
      return splitTournamentMessage(this.tournamentMetadata.tournamentMessage);
    },
    systemDescription() {
      return getSystemDescription(this.activeTournament, this.$i18n.locale, {
        swiss: this.$t('ranking.swiss'),
        playOff: this.$t('games.playOff').toLowerCase(),
        poulesBarrage: this.$t('games.poulesBarrage').toLowerCase(),
        systemLabel: this.$t('teams.' + (this.activeTournament?.system || 'swiss')),
        tir: this.$t('teams.tir'),
        twoRoundsShort: this.$t('tir.twoRoundsShort'),
        system_groups: this.$t('teams.groups'),
        system_poules: this.$t('teams.poules'),
        system_supermele: this.$t('teams.supermele'),
      });
    },
    cadrageRange() {
      const range = getCadragePlaceRange(this.activeTournament);
      if (!range) return '';
      return `${range.from}-${range.to} ${this.$t('common.places')}`;
    },
    playOffTeamsCount() {
      return getPlayoffParticipantCount(this.activeTournament);
    },
    isInPlayoff() {
      return computeIsInPlayoff(this.activeTournament);
    },
    isFinale() {
      return computeIsFinale(this.activeTournament);
    },
    tournamentDate() {
      const date = this.tournamentMetadata.date;
      if (!date) return '';
      return this.formatDate(date);
    },
    portalId() {
      return this.tournamentMetadata.portalIdTournament || null;
    },
    allTeamsHaveLogos() {
      const t = this.activeTournament;
      if (!t) return true;
      if (t.teams?.length) {
        return t.teams.every(
          (team) => !team.players?.length || team.players.every((p) => !p.club_id || p.club_logo_url),
        );
      }
      if (t.tirParticipants?.length) {
        return t.tirParticipants.every((p) => !p.name || p.avatar_url || p.club_logo_url);
      }
      return true;
    },
    publicLink() {
      if (!this.activeKey || !this.activeOwnerUid) return '';
      const tournamentId = this.savedTournaments[this.activeKey]?.id || this.activeKey;
      const ref = encodeTournamentRef(this.activeOwnerUid, tournamentId);
      const domain = import.meta.env.PROD ? '/petanque-draw/#/' : '/#/';
      return `${window.location.origin}${domain}tournament?ref=${ref}`;
    },
    tournamentExtrasLine() {
      const extras = getTournamentExtras(this.activeTournament);
      if (!extras.time) return '';
      const parts = [];
      if (extras.time === 'no-limit-finale') {
        parts.push(this.$t('modals.noTimeLimitFinale'));
      } else {
        parts.push(`${extras.time} ${this.$t('modals.min')}`);
      }
      if (extras.cochonettes) {
        parts.push(
          `+ ${extras.cochonettes} ${extras.cochonettes === 1 ? this.$t('common.cochonette') : this.$t('common.cochonettes')}`,
        );
      }
      return parts.join(' ');
    },
  },
  methods: {
    ...mapActions(useMainStore, [
      'fetchSavedTournaments',
      'fetchArchiveIndex',
      'removeSavedTournament',
      'renameSavedTournament',
      'unarchiveTournament',
    ]),
    getRecordMetadata(record) {
      if (record.nameLower !== undefined) return record;
      return getTournamentMetadata(record);
    },
    getFormatTag(item) {
      if (item.nameLower !== undefined) {
        if (item.system === 'tir') return this.$t('teams.tir');
        return item.system || '';
      }
      const data = getTournamentGroup(item, 'A');
      if (data.system === 'tir') return this.$t('teams.tir');
      const players = data.teams?.[0]?.players?.length;
      if (!players) return '';
      if (players === 1) return this.$t('common.formatTete');
      if (players === 2) return this.$t('common.formatDoublette');
      if (players >= 3) return this.$t('common.formatTriplette');
      return '';
    },
    getDefaultTab(tournament) {
      if (tournament?.system === 'tir') return 'results';
      return 'ranking';
    },
    async selectTournament(key) {
      const tournamentChanged = key !== this.activeKey;
      this.activeKey = key;
      this.selectorOpen = false;
      if (this.savedTournaments?.[key]) {
        const tournament = getTournamentGroup(this.savedTournaments[key], 'A');
        this.activeTab = this.getDefaultTab(tournament);
      } else if (this.useArchiveIndex && this.archiveIndex?.[key]) {
        this.isLoading = true;
        try {
          const { tournamentService } = await import('@/services/db');
          const ownerUid = this.archiveIndex[key].ownerUid;
          const snapshot = await tournamentService.getOne(ownerUid, key);
          if (snapshot.exists()) {
            const data = snapshot.val();
            this.tournament = data;
            const tournament = getTournamentGroup(data, 'A');
            this.activeTab = this.getDefaultTab(tournament);
          }
        } finally {
          this.isLoading = false;
        }
      }
      if (tournamentChanged) {
        this.$nextTick(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
      }
    },
    onShowAllChange() {
      localStorage.setItem('petanqueDrawArchiveShowAll', String(this.showAllUsers));
      if (this.showAllUsers && this.isSuperAdmin && !this.archiveIndex) {
        this.fetchArchiveIndex();
      }
    },
    closeSelector() {
      this.selectorOpen = false;
    },
    startEditName() {
      this.editingName = true;
      this.$nextTick(() => {
        this.$refs.nameInput?.focus();
        this.$refs.nameInput?.select();
      });
    },
    saveName(value) {
      const name = value.trim();
      if (name && name !== this.savedTournaments[this.activeKey].name) {
        this.renameSavedTournament(this.activeKey, name, this.activeOwnerUid);
      }
      this.editingName = false;
    },
    removeTournament() {
      if (
        !window.confirm(this.$t('modals.sureRemove') + ' ' + (this.savedTournaments[this.activeKey]?.name || '') + '?')
      )
        return;
      this.removeSavedTournament(this.activeKey);
      const remaining = this.tournamentKeys.filter((k) => k !== this.activeKey);
      this.activeKey = remaining.length ? remaining[remaining.length - 1] : null;
      this.tournament = null;
    },
    removeFromView() {
      if (!window.confirm(this.$t('modals.sureRemove') + '?')) return;
      this.removeSavedTournament(this.activeKey);
      const remaining = this.tournamentKeys.filter((k) => k !== this.activeKey);
      this.activeKey = remaining.length ? remaining[remaining.length - 1] : null;
      this.tournament = null;
    },
    async makeActive() {
      const key = this.activeKey;
      if (!key) return;
      const restored = await this.unarchiveTournament(key);
      if (!restored) return;

      const remaining = this.tournamentKeys.filter((tournamentKey) => tournamentKey !== key);
      this.activeKey = remaining.length ? remaining[remaining.length - 1] : null;
      this.tournament = null;
    },
    subscribeTournament(key) {
      if (this._unsubscribe) {
        this._unsubscribe();
        this._unsubscribe = null;
      }
      if (!this.activeOwnerUid) return;
      this.isLoading = true;
      const cached = this.savedTournaments[key];
      const cachedCompetition = getTournamentMain(cached);
      if (cachedCompetition?.teams || cachedCompetition?.tirParticipants) {
        this.tournament = cached;
        this.isLoading = false;
        return;
      }
      this._unsubscribe = tournamentService.subscribe(
        this.activeOwnerUid,
        key,
        (snapshot) => {
          const value = snapshot.val();
          const competition = getTournamentMain(value);
          if (snapshot.exists() && (competition?.teams || competition?.tirParticipants)) {
            this.tournament = normalizeTournamentRecord(value, {
              id: key,
              ownerUid: this.activeMapEntry?.role === 'admin' ? this.activeOwnerUid : undefined,
            });
          } else {
            this.tournament = this.savedTournaments[key] || null;
          }
          this.isLoading = false;
        },
        () => {
          this.tournament = this.savedTournaments[key] || null;
          this.isLoading = false;
        },
      );
    },
    async refreshClubLogos() {
      if (!this.portalId || this.fetchingLogos) return;
      this.fetchingLogos = true;
      try {
        const results = await syncFromPortal(this.portalId, {
          teams: this.activeTournament.teams || null,
          tirParticipants: this.activeTournament.tirParticipants || null,
          fields: FIELD_SETS.media,
        });

        const totalChanged = (results.teams?.changedPlayers || 0) + (results.tirParticipants?.changedPlayers || 0);

        if (totalChanged > 0) {
          const basePath = getTournamentStorageTarget(this.tournament, 'A').prefix;
          if (this.activeTournament.teams) {
            await tournamentService.updatePath(
              this.activeOwnerUid,
              this.activeKey,
              `${basePath}teams`,
              this.activeTournament.teams,
            );
          }
          if (this.activeTournament.tirParticipants) {
            await tournamentService.updatePath(
              this.activeOwnerUid,
              this.activeKey,
              `${basePath}tirParticipants`,
              this.activeTournament.tirParticipants,
            );
          }
          this.$forceUpdate();
        }
      } catch (err) {
        console.error(`Logo refresh failed:`, err);
      } finally {
        this.fetchingLogos = false;
      }
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      return `${dd}.${mm}.${yy}`;
    },
    async savePortalId() {
      if (!this.portalIdInput) return;
      const value = String(this.portalIdInput);
      await tournamentService.updatePath(this.activeOwnerUid, this.activeKey, 'portalIdTournament', value);
      this.tournament = { ...this.tournament, portalIdTournament: value };
      this.portalIdInput = null;
    },
    copyDbId() {
      navigator.clipboard.writeText(this.activeKey);
    },
    copyPublicLink() {
      navigator.clipboard.writeText(this.publicLink);
      this.publicLinkCopied = true;
      setTimeout(() => {
        this.publicLinkCopied = false;
      }, 2000);
    },
  },
};
</script>

<style scoped>
.wrapper :deep(.navbar) {
  z-index: 10;
}

.wrapper .navbar-item:hover {
  background: transparent;
}

.tournament-selector {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.75rem 1.5rem;
  margin: 1rem auto;
  width: fit-content;
  max-width: 100%;
}

.tournament-selector__mobile-actions {
  display: flex;
  flex-basis: 100%;
  justify-content: center;
  gap: 0.5rem;
  padding-top: 0.25rem;
}

.tournament-selector__name {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-text);
  text-align: center;
  line-height: 1.2;
}

.tournament-selector__edit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  flex-shrink: 0;
}

.tournament-selector__edit:hover {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.tournament-selector__input {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-text);
  text-align: center;
  line-height: 1.2;
  border: none;
  border-bottom: 2px solid var(--color-primary);
  background: transparent;
  outline: none;
  width: 100%;
  min-width: 200px;
}

@media screen and (max-width: 768px) {
  .tournament-selector__input {
    font-size: 1.2rem;
    min-width: 0;
  }
}

.tournament-selector__arrow {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  color: var(--color-primary);
  transition: transform 0.25s;
}

.tournament-selector__arrow--open {
  transform: rotate(180deg);
}

.tournament-selector__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-white);
  border-radius: 0.75rem;
  box-shadow:
    0 8px 32px rgb(0 0 0 / 12%),
    0 2px 8px rgb(0 0 0 / 6%);
  min-width: 280px;
  max-width: 90vw;
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
  z-index: 100;
  animation: selector-in 0.15s ease;
}

@keyframes selector-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.tournament-selector__option {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-radius: 0.5rem;
  text-decoration: none;
  transition:
    background 0.15s,
    color 0.15s;
}

.tournament-selector__option:hover {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.tournament-selector__option--active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-weight: 600;
}

.tournament-selector__tag {
  flex-shrink: 0;
  padding: 0.1rem 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 4px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  text-transform: lowercase;
  white-space: nowrap;
}

.tabs-content-area {
  background: var(--color-surface, var(--color-white));
  border: 1px solid var(--color-border);
  border-radius: 0 0 12px 12px;
  padding: 16px;
  min-height: 200px;
}

@media screen and (max-width: 768px) {
  .tournament-selector__name {
    font-size: 1.4rem;
  }

  .tournament-selector__arrow {
    width: 22px;
    height: 22px;
  }

  .tournament-selector__dropdown {
    left: 0;
    right: 0;
    transform: none;
    max-width: 100%;
    min-width: unset;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-state__icon {
  width: 64px;
  height: 64px;
  color: var(--color-primary);
  opacity: 0.4;
  margin-bottom: 1.5rem;
}

.empty-state__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.empty-state__text {
  font-size: 1rem;
  color: var(--color-text-muted);
  max-width: 360px;
  margin-bottom: 1.5rem;
}

.empty-state__btn {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  font-weight: 600;
  padding: 0.6rem 1.5rem;
  border-radius: 0.5rem;
}

.empty-state__btn:hover {
  opacity: 0.9;
  color: var(--color-white);
}

.btn-remove-archived {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: var(--color-danger, #e74c3c);
  border-color: var(--color-danger, #e74c3c);
  background: transparent;
}

.btn-make-active {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: transparent;
}

.btn-make-active:hover {
  color: var(--color-btn-text, #fff);
  background: var(--color-primary);
}

.btn-remove-archived:hover {
  background: var(--color-danger, #e74c3c);
  color: var(--color-white);
}

.archived-links {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.archived-links__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 2px solid var(--color-primary);
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.archived-links__btn:hover {
  background: var(--color-primary);
  color: var(--color-btn-text);
}

.archived-links__btn--secondary {
  border-color: var(--color-border);
  background: var(--color-surface);
}

.archived-links__btn--secondary:hover {
  background: var(--color-primary-bg);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.archived-links__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.archived-layout {
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
}

.archive-skeleton__bone {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 6px;
  background: var(--color-surface-alt, #ececf2);
}

.archive-skeleton__bone::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 52%), transparent);
  transform: translateX(-100%);
  animation: archive-skeleton-shimmer 1.55s ease-in-out infinite;
}

.archive-sidebar-skeleton-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 38px;
  padding: 0.6rem 0.25rem;
}

.archive-sidebar-skeleton-row__name {
  width: min(70%, 270px);
  height: 13px;
}

.archive-sidebar-skeleton-row__meta {
  width: 76px;
  height: 12px;
}

.archive-sidebar-actions-skeleton__label {
  width: 42%;
  height: 10px;
}

.archive-sidebar-actions-skeleton__label--short {
  width: 28%;
}

.archive-sidebar-actions-skeleton__input {
  width: 100%;
  height: 34px;
}

.archive-sidebar-actions-skeleton__buttons {
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 0.5rem;
}

.archive-sidebar-actions-skeleton__buttons .archive-skeleton__bone {
  height: 36px;
}

.archive-sidebar-actions-skeleton__buttons--management {
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.archive-skeleton {
  width: 100%;
  padding-top: 0.2rem;
}

.archive-skeleton__heading {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 64px;
  padding: 0.75rem 0;
}

.archive-skeleton__title {
  width: min(68%, 620px);
  height: 34px;
  border-radius: 8px;
}

.archive-skeleton__icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
}

.archive-skeleton__header-button {
  width: 112px;
  height: 36px;
  margin-left: auto;
}

.archive-skeleton__summary {
  position: relative;
  min-height: 190px;
  padding: 1.5rem;
  border: 2px solid color-mix(in srgb, var(--color-primary) 38%, var(--color-border));
  border-radius: 10px;
  background: var(--color-surface);
}

.archive-skeleton__status {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 108px;
  height: 34px;
  border-radius: 14px;
}

.archive-skeleton__summary-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 29px;
}

.archive-skeleton__summary-label {
  width: 82px;
  height: 13px;
}

.archive-skeleton__summary-value {
  max-width: 480px;
  height: 15px;
}

.archive-skeleton__panel {
  margin-top: 0.9rem;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.archive-skeleton__tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  min-height: 72px;
  border-bottom: 1px solid var(--color-border);
}

.archive-skeleton__tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.archive-skeleton__tab-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.archive-skeleton__tab-label {
  width: 62px;
  height: 10px;
}

.archive-skeleton__panel-body {
  padding: 1rem;
}

.archive-skeleton__toolbar {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 48px;
}

.archive-skeleton__toolbar-pill {
  width: 142px;
  height: 34px;
}

.archive-skeleton__toolbar-pill--short {
  width: 126px;
}

.archive-skeleton__toolbar-spacer {
  flex: 1;
}

.archive-skeleton__toolbar-button {
  width: 160px;
  height: 34px;
}

.archive-skeleton__table {
  width: min(100%, 720px);
  margin: 0.75rem auto 0;
}

.archive-skeleton__table-row {
  display: grid;
  grid-template-columns: 10% 34% 56%;
  align-items: center;
  gap: 0.75rem;
  min-height: 43px;
  padding: 0 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.archive-skeleton__table-row .archive-skeleton__bone {
  width: 84%;
  height: 13px;
}

.archive-skeleton__table-row--header {
  min-height: 38px;
}

.archive-skeleton__table-row--header .archive-skeleton__bone {
  width: 62%;
  height: 11px;
}

.archive-skeleton__cell-place {
  width: 24px !important;
}

@keyframes archive-skeleton-shimmer {
  to {
    transform: translateX(100%);
  }
}

@media screen and (max-width: 768px) {
  .archive-skeleton__heading {
    min-height: 54px;
  }

  .archive-skeleton__title {
    width: 58%;
    height: 24px;
  }

  .archive-skeleton__header-button {
    width: 42px;
    height: 34px;
  }

  .archive-skeleton__summary {
    min-height: 162px;
    padding: 1.15rem;
  }

  .archive-skeleton__status {
    width: 78px;
    height: 28px;
  }

  .archive-skeleton__summary-row {
    min-height: 25px;
  }

  .archive-skeleton__summary-label {
    width: 62px;
  }

  .archive-skeleton__tabs {
    min-height: 62px;
  }

  .archive-skeleton__toolbar-button,
  .archive-skeleton__toolbar-pill--short {
    display: none;
  }

  .archive-skeleton__toolbar-pill {
    width: 132px;
  }

  .archive-skeleton__table-row {
    grid-template-columns: 14% 36% 50%;
    min-height: 39px;
    padding: 0 0.25rem;
  }

  .archive-skeleton__table-row:nth-child(n + 7) {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .archive-skeleton__bone::after {
    animation: none;
  }
}

.archived-sidebar {
  display: none;
  width: 500px;
  flex-shrink: 0;
  align-self: flex-start;
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
}

.archived-sidebar__card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  overflow-y: auto;
}

.archived-sidebar__header {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.4rem 0.5rem;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.archived-sidebar__toggle {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: none;
  cursor: pointer;
}

.archived-sidebar__toggle input {
  margin: 0;
}

.archived-sidebar__search {
  padding: 0 0.5rem 0.5rem;
  display: flex;
  gap: 0.4rem;
}

.archived-sidebar__search-input {
  flex: 1;
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text);
  outline: none;
}

.archived-sidebar__search-input:focus {
  border-color: var(--color-primary);
}

.archived-sidebar__filter-select {
  padding: 0.35rem 0.4rem;
  font-size: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text);
  min-width: 80px;
}

.archived-sidebar__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.archived-sidebar__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  margin: 0 -0.5rem;
  border: none;
  border-radius: 6px;
  background: none;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  transition:
    background 0.15s,
    color 0.15s;
}

.archived-sidebar__item:hover {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.archived-sidebar__item--active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-weight: 600;
}

.archived-sidebar__item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.archived-sidebar__item-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.archived-sidebar__item-date {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.archived-sidebar__item-tag {
  flex-shrink: 0;
  padding: 0.1rem 0.35rem;
  font-size: 0.65rem;
  font-weight: 600;
  border-radius: 4px;
  background: var(--color-surface-alt);
  color: var(--color-text-muted);
  text-transform: lowercase;
}

.archived-sidebar__actions {
  margin-top: 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sidebar-action-row__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.25rem;
  display: block;
}

.sidebar-action-row__db-id {
  font-family: monospace;
  font-size: 0.7rem;
  color: var(--color-text);
  cursor: pointer;
  user-select: all;
  text-transform: none;
}

.sidebar-action-row__input-group {
  display: flex;
  gap: 0.4rem;
}

.sidebar-action-row__input {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.85rem;
  background: var(--color-surface);
  color: var(--color-text);
  min-width: 0;
}

.sidebar-action-row__input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.sidebar-action-row__save {
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--color-primary);
  border-radius: 6px;
  background: var(--color-primary);
  color: var(--color-btn-text, #fff);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.sidebar-action-row__save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sidebar-action-row--buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.sidebar-action-row--management {
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.archived-content {
  flex: 1;
  min-width: 0;
}

@media screen and (min-width: 1100px) {
  .container {
    max-width: 100% !important;
    padding-left: 1.5rem !important;
    padding-right: 1.5rem !important;
  }

  .archived-layout {
    gap: 1rem;
  }

  .archived-content {
    max-width: 900px;
  }

  .archived-sidebar {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 100px);
  }

  .archived-sidebar__card {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .archived-sidebar__actions {
    flex-shrink: 0;
  }

  .archived-links--mobile {
    display: none;
  }

  .tournament-selector__arrow--mobile {
    display: none;
  }

  .tournament-selector__dropdown {
    display: none !important;
  }

  .tournament-selector {
    cursor: default;
    justify-content: flex-start;
    padding: 0.75rem 0;
    margin: 0;
  }

  .tournament-selector__mobile-actions {
    display: none;
  }
}
</style>

<style>
.tournament-info-card {
  position: relative;
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  padding-right: 7rem;
  background: var(--color-surface, #fff);
}

@media screen and (max-width: 352px) {
  .tournament-info-card {
    padding-right: 1.25rem;
    padding-top: 2.5rem;
  }
}

.badge-corner {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
}

.badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
}

.badge-active {
  background: var(--color-primary);
  color: var(--color-white);
}

.badge-finished {
  background: var(--color-grey);
  color: var(--color-white);
}

.badge-not-started {
  background: var(--color-warning-border);
  color: var(--color-white);
}

.tournament-info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.2rem 0;
}

.btn-bracket-group {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 0.25rem;
}

.btn-bracket {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
}

.btn-bracket:hover {
  color: var(--color-white);
}

.playoff-public-wrapper .play-off-stage-wrapper {
  padding: 0;
}

.playoff-public-wrapper h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.playoff-public-wrapper h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-public-text-muted);
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.playoff-public-wrapper .game-row.compact {
  background: var(--color-white);
  border-radius: 8px;
  padding: 0.6rem 1rem;
  margin-bottom: 0.4rem;
  box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
  gap: 0.75rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.playoff-public-wrapper .game-row.compact .score-block {
  flex: 0 0 auto;
  min-width: 60px;
  padding: 0 0.5rem;
}

.current-round-card {
  background: var(--color-surface, var(--color-white));
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  min-width: 280px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.round-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.75rem;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.match-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--color-surface, var(--color-white));
  border: 1px solid var(--color-border);
  transition:
    background 0.15s,
    border-color 0.15s;
}

.match-item:hover {
  border-color: var(--tir-touche, #ff9800);
}

.match-item--upcoming {
  border-color: #bdbdbd;
  background: url('@/assets/img/card-bg-upcoming.webp') center/cover no-repeat !important;
}

.match-team {
  min-width: 0;
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow-wrap: break-word;
}

.match-team-right {
  text-align: right;
}

.match-vs {
  text-align: center;
}

.match-lane {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-surface-alt, var(--color-primary-bg));
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 700;
}
</style>
