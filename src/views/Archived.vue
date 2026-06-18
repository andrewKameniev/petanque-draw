<template>
  <div class="wrapper">
    <Navbar @open-menu="menuOpen = !menuOpen" />
    <Menu :active="menuOpen" @closeMenu="menuOpen = false" />
    <div class="container">
      <div
        v-if="activeKey && savedTournaments[activeKey]"
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
          class="tournament-selector__arrow"
          :class="{ 'tournament-selector__arrow--open': selectorOpen }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
        <button class="button btn-remove-archived" @click.stop="removeTournament">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span class="is-hidden-mobile">{{ $t('common.remove') }}</span>
        </button>
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
          </a>
        </div>
      </div>

      <div v-if="!activeKey && !isLoading" class="empty-state">
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

      <template v-if="activeTournament && !isLoading">
        <div class="tournament-info-card mt-3 mb-3">
          <span class="badge badge-corner" :class="badgeClass">
            {{ badgeLabel }}
          </span>
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
          <div v-if="activeTournament.playOff" class="btn-bracket-group">
            <button class="button is-small btn-bracket" @click="$refs.playOff && ($refs.playOff.showBracket = true)">
              <GitFork :size="14" style="transform: rotate(90deg); margin-right: 0.3rem;" />
              {{ $t('games.showBracket') }}
            </button>
          </div>
        </div>
        <TeamPlayoff v-if="activeTournament.teamPlayoff" :read-only="true" />
        <PlayOff
          v-else-if="activeTournament.playOff"
          ref="playOff"
          :active-tournament="activeTournament"
          :is-public-view="true"
          :hide-header="true"
          @openResults="activeTab = 'ranking'"
          class="playoff-public-wrapper"
        />
        <Cadrage
          v-else-if="activeTournament.cadrage"
          :active-tournament="activeTournament"
          :is-public-view="true"
          class="playoff-public-wrapper"
        />
        <div
          v-if="
            activeTournament.games &&
            activeTournament.roundIsActive &&
            !activeTournament.cadrage &&
            !activeTournament.playOff
          "
          class="current-round-card mt-3 mb-3"
        >
          <div class="round-header">{{ $t('common.round') }} {{ activeRound }}</div>
          <div class="match-list">
            <div
              class="match-item match-item--upcoming"
              v-for="(game, index) in activeTournament.games[activeRound - 1]"
              :key="index"
            >
              <span class="match-team match-team-right">{{ game.team_1 }}</span>
              <span class="match-vs">
                <span class="match-lane">{{ index + (activeTournament.preferences?.fieldsStart || 1) }}</span>
              </span>
              <span class="match-team">{{ game.team_2 }}</span>
            </div>
          </div>
        </div>
        <div class="tournament-nav">
          <button
            v-for="(tab, index) in tabs"
            :key="index"
            class="tournament-nav__btn"
            :class="[`tournament-nav__btn--${tab.id}`, { 'tournament-nav__btn--active': tab.id === activeTab }]"
            @click="activeTab = tab.id"
          >
            <component :is="tab.icon" :size="18" />
            <span>{{ tab.label }}</span>
          </button>
        </div>
        <div class="tabs-content-area">
          <div v-if="activeTab === 'teams'">
            <TeamsList :previewTournament="activeTournament" />
          </div>
          <Results v-if="activeTab === 'results'" :previewTournament="activeTournament" />
          <div v-if="activeTab === 'ranking'">
            <Ranking :tournament="activeTournament" :rankingTeams="rankingTeams" :activeRound="activeRound" />
          </div>
          <div v-if="activeTab === 'protocol'">
            <Protocol :tournament="activeTournament" :rankingTeams="rankingTeams" :skipGate="true" />
          </div>
        </div>
      </template>
    </div>
    <Footer />
  </div>
</template>

<script>
import Ranking from '@/components/partials/Ranking';
import Results from '@/components/partials/Results';
import Protocol from '@/components/partials/Protocol';
import TeamsList from '@/components/partials/TeamsList';
import PlayOff from '@/components/partials/PlayOff.vue';
import TeamPlayoff from '@/components/partials/TeamPlayoff.vue';
import Cadrage from '@/components/partials/Cadrage.vue';
import Footer from '@/components/partials/Footer.vue';
import Navbar from '@/components/Navbar.vue';
import Menu from '@/components/Menu.vue';
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { getTeamsRanking } from '@/helpers';
import { tournamentService } from '@/services/db';
import { GitFork, Users, List, Trophy as TrophyIcon, FileText, Pencil } from 'lucide-vue-next';

export default {
  name: 'Archived',
  components: {
    Footer,
    Navbar,
    Menu,
    PlayOff,
    TeamPlayoff,
    Cadrage,
    TeamsList,
    Results,
    Ranking,
    Protocol,
    GitFork,
    Users,
    List,
    TrophyIcon,
    FileText,
    Pencil,
  },
  data() {
    return {
      activeTab: 'ranking',
      activeKey: null,
      selectorOpen: false,
      menuOpen: false,
      tournament: null,
      isLoading: false,
      editingName: false,
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
  created() {
    if (this.tournamentKeys.length) {
      this.activeKey = this.tournamentKeys[this.tournamentKeys.length - 1];
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
        if (key) this.subscribeTournament(key);
      },
      immediate: true,
    },
  },
  beforeUnmount() {
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  },
  computed: {
    ...mapState(useMainStore, ['savedTournaments', 'user']),
    tournamentEntries() {
      return Object.entries(this.savedTournaments).reverse();
    },
    tournamentKeys() {
      return Object.keys(this.savedTournaments);
    },
    activeTournament() {
      return this.tournament;
    },
    tabs() {
      const tabs = [
        { id: 'teams', label: this.$t('teams.teams'), icon: 'Users' },
        { id: 'results', label: this.$t('teams.results'), icon: 'List' },
        { id: 'ranking', label: this.$t('teams.ranking'), icon: 'TrophyIcon' },
      ];
      if (this.activeTournament?.tournamentIsFinished && this.activeTournament?.teams?.length) {
        tabs.push({ id: 'protocol', label: this.$t('teams.protocol'), icon: 'FileText' });
      }
      return tabs;
    },
    activeRound() {
      if (!this.activeTournament?.games?.length) return 1;
      return this.activeTournament.roundIsActive
        ? this.activeTournament.games.length
        : this.activeTournament.games.length + 1;
    },
    isFinished() {
      return !!this.activeTournament?.tournamentIsFinished;
    },
    isStarted() {
      return !!this.activeTournament?.tournamentIsStarted || !!this.activeTournament?.games?.length;
    },
    badgeClass() {
      if (this.isFinished) return 'badge-finished';
      if (!this.isStarted) return 'badge-not-started';
      return 'badge-active';
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
      if (!this.activeTournament?.tournamentMessage) return [];
      return this.activeTournament.tournamentMessage.split('\n').filter((l) => l.trim());
    },
    systemDescription() {
      if (!this.activeTournament) return '';
      if (this.activeTournament.system !== 'swiss') {
        return this.$t('teams.' + this.activeTournament.system);
      }
      let desc;
      if (this.activeTournament.games?.length) {
        const barrage = this.activeTournament.barrage;
        const swissRounds = barrage ? barrage.startIndex : this.activeTournament.games.length;
        const total = this.activeTournament.preferences?.swissRoundsCount;
        if (total) {
          desc = swissRounds + '/' + total + ' ' + this.pluralizeRounds(swissRounds) + ' ' + this.$t('ranking.swiss');
        } else {
          desc = swissRounds + ' ' + this.pluralizeRounds(swissRounds) + ' ' + this.$t('ranking.swiss');
        }
        if (barrage) {
          desc += ' + ' + this.$t('games.poulesBarrage').toLowerCase();
        }
      } else {
        desc = this.$t('teams.' + this.activeTournament.system);
        const total = this.activeTournament.preferences?.swissRoundsCount;
        if (total) {
          desc += ' (' + total + ' ' + this.pluralizeRounds(total) + ')';
        }
      }
      if (
        this.activeTournament.playOff ||
        this.activeTournament.playoff ||
        this.activeTournament.preferences?.playOffEnabled
      ) {
        desc += ' + ' + this.$t('games.playOff').toLowerCase();
      }
      return desc;
    },
    cadrageRange() {
      if (!this.activeTournament?.cadrage?.length) return '';
      const from = (this.activeTournament.playOff?.length || 0) + 1;
      const to = from + this.activeTournament.cadrage.length * 2 - 1;
      return `${from}-${to} ${this.$t('common.places')}`;
    },
    playOffTeamsCount() {
      if (!this.activeTournament?.playOff?.length) return 0;
      return this.activeTournament.playOff.length * 2;
    },
    isInPlayoff() {
      return !!this.activeTournament?.playOff || !!this.activeTournament?.cadrage;
    },
    isFinale() {
      const po = this.activeTournament?.playOff;
      if (!po?.length) return false;
      return po[po.length - 1].teams?.length === 1;
    },
    tournamentExtrasLine() {
      const prefs = this.activeTournament?.preferences;
      if (!prefs?.timeLimitEnabled) return '';
      const parts = [];
      const time =
        prefs.playOffEnabled && this.isInPlayoff ? prefs.playoffTimeLimit || prefs.timeLimit : prefs.timeLimit;
      if (prefs.noTimeLimitFinale && prefs.playOffEnabled && this.isInPlayoff && this.isFinale) {
        parts.push(this.$t('modals.noTimeLimitFinale'));
      } else {
        parts.push(`${time} ${this.$t('modals.min')}`);
      }
      if (prefs.cochonettesEnabled && prefs.cochonettes) {
        parts.push(
          `+ ${prefs.cochonettes} ${prefs.cochonettes === 1 ? this.$t('common.cochonette') : this.$t('common.cochonettes')}`,
        );
      }
      return parts.join(' ');
    },
  },
  methods: {
    ...mapActions(useMainStore, ['removeSavedTournament', 'renameSavedTournament']),
    selectTournament(key) {
      this.activeKey = key;
      this.selectorOpen = false;
      this.activeTab = 'ranking';
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
        this.renameSavedTournament(this.activeKey, name);
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
    subscribeTournament(key) {
      if (this._unsubscribe) {
        this._unsubscribe();
        this._unsubscribe = null;
      }
      if (!this.user?.uid) return;
      const tournamentId = this.savedTournaments[key]?.id || key;
      this.isLoading = true;
      this._unsubscribe = tournamentService.subscribe(
        this.user.uid,
        tournamentId,
        (snapshot) => {
          if (snapshot.exists()) {
            this.tournament = snapshot.val();
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
    pluralizeRounds(n) {
      if (this.$i18n.locale === 'ua') {
        const mod10 = n % 10;
        const mod100 = n % 100;
        if (mod10 === 1 && mod100 !== 11) return 'коло';
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'кола';
        return 'кіл';
      }
      return n === 1 ? 'round' : 'rounds';
    },
  },
};
</script>

<style scoped>
.wrapper {
  position: relative;
  background: transparent;
  min-height: 100vh;
}

.wrapper::before {
  content: '';
  position: fixed;
  inset: 0;
  background: url('@/assets/img/bg-petanque.avif') repeat;
  background-size: 800px;
  opacity: 0.5;
  z-index: 0;
  pointer-events: none;
}

[data-theme='dark'] .wrapper::before {
  display: none;
}

.wrapper > * {
  position: relative;
  z-index: 1;
}

.wrapper :deep(.navbar) {
  z-index: 10;
}

.wrapper .navbar-item:hover {
  background: transparent;
}

.tournament-selector {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.75rem 1.5rem;
  margin: 1rem auto;
  width: fit-content;
  max-width: 100%;
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
  display: block;
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

.tournament-nav {
  display: flex;
  background: var(--color-surface, var(--color-white));
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 6px 0;
  margin-bottom: 16px;
}

.tournament-nav__btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 6px;
  border: none;
  background: none;
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.tournament-nav__btn--active {
  font-weight: 700;
}

.tournament-nav__btn--teams.tournament-nav__btn--active {
  color: var(--tir-delete, #e53935);
}

.tournament-nav__btn--results.tournament-nav__btn--active {
  color: var(--tir-carreau, #4caf50);
}

.tournament-nav__btn--ranking.tournament-nav__btn--active {
  color: var(--tir-touche, #ff9800);
}

.tournament-nav__btn--protocol.tournament-nav__btn--active {
  color: var(--color-primary, #6c63ff);
}

.tabs-content-area {
  background: var(--color-surface, var(--color-white));
  border: 1px solid var(--color-border);
  border-radius: 12px;
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
  margin-left: 0.5rem;
}

.btn-remove-archived:hover {
  background: var(--color-danger, #e74c3c);
  color: var(--color-white);
}
</style>

<style>
.tournament-info-card {
  position: relative;
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  padding-right: 7rem;
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
  background: url('@/assets/img/card-bg-upcoming.png') center/cover no-repeat !important;
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
  word-break: break-word;
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
