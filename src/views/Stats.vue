<template>
  <div class="wrapper">
    <Navbar @open-menu="menuOpen = !menuOpen" />
    <div class="container">
      <Menu :active="menuOpen" @closeMenu="menuOpen = false" />
      <div class="stat-container">
        <div v-if="user" class="stats-page">
          <!-- Active game tracking view -->
          <div v-if="activeGameIndex !== null && !showResults" class="stats-page__game">
            <StatsTracking
              :team1="team1"
              :team2="team2"
              :currentMan="currentMan"
              :currentScore="currentScore"
              :manCount="manCount"
              :statSystem="statSystem"
              :asCouch="asCouch"
              :isSaving="isSaving"
              :gameName="gameName"
              :gameType="gameType"
              @newGame="startNewGame"
              @finishGame="finishGame"
              @updateScore="updateTeamScore"
              @removeThrow="removeThrow"
              @addThrow="addThrow"
              @x2Throw="doubleThrowResult"
              @updateThrow="updateThrow"
              @changePlayer="changePlayerInTeam"
              @replacePlayer="replacePlayerInTeam"
              @next="currentMan++"
              @prev="currentMan--"
              @removeMan="removeMan"
              @distanceChange="onDistanceChange"
              @minimize="minimizeGame"
            />
          </div>

          <!-- Results view after finishing -->
          <div v-else-if="showResults && finishedGame" class="stats-page__results">
            <div class="stats-page__results-header">
              <button
                @click="
                  showResults = false;
                  currentTab = 'active';
                "
                class="stats-btn stats-btn--ghost"
              >
                <ArrowLeft :size="16" /> {{ $t('stat.back') }}
              </button>
              <div class="stats-page__results-header-right">
                <button v-if="finishedGameId" @click="shareFinishedGame" class="stats-btn stats-btn--secondary">
                  <Share2 :size="16" /> {{ $t('remote.copyLink') }}
                </button>
                <button @click="startNewGame" class="stats-btn stats-btn--primary">
                  <Plus :size="16" /> {{ $t('stat.newGame') }}
                </button>
              </div>
            </div>
            <h2 class="stats-page__results-title">{{ finishedGame.name }}</h2>
            <div class="stats-page__results-grid">
              <StatResult :label="$t('stat.team1Label')" :team="finishedGame.team1" :system="finishedGame.system" />
              <StatResult :label="$t('stat.team2Label')" :team="finishedGame.team2" :system="finishedGame.system" />
            </div>
          </div>

          <!-- Main tabbed view -->
          <div v-else class="stats-page__main">
            <div class="stats-tabs">
              <button
                class="stats-tabs__btn"
                :class="{ 'stats-tabs__btn--active': currentTab === 'active' }"
                @click="currentTab = 'active'"
              >
                <Play :size="15" />
                {{ $t('stat.activeGames') }}
                <span class="stats-tabs__badge" v-if="savedGames.length">{{ savedGames.length }}</span>
              </button>
              <button
                class="stats-tabs__btn"
                :class="{ 'stats-tabs__btn--active': currentTab === 'new' }"
                @click="currentTab = 'new'"
              >
                <Plus :size="15" />
                {{ $t('stat.newGameTab') }}
              </button>
              <button
                class="stats-tabs__btn"
                :class="{ 'stats-tabs__btn--active': currentTab === 'history' }"
                @click="currentTab = 'history'"
              >
                <Archive :size="15" />
                {{ $t('stat.history') }}
              </button>
            </div>

            <div class="stats-tabs__content">
              <!-- Active Games Tab -->
              <div v-if="currentTab === 'active'" class="stats-active">
                <div v-if="savedGames.length === 0" class="stats-active__empty">
                  <CircleOff :size="32" class="stats-active__empty-icon" />
                  <span>{{ $t('stat.noActiveGames') }}</span>
                </div>
                <div v-else class="stats-active__list">
                  <div class="stats-active__card" v-for="(game, index) in savedGames" :key="index">
                    <div class="stats-active__card-info">
                      <span class="stats-active__card-name">{{ game.name || 'Game ' + (index + 1) }}</span>
                      <span class="stats-active__card-meta">
                        {{ $t('stat.round') }} {{ game.currentMan + 1 }} &middot;
                        {{ game.team1.score.reduce((a, b) => a + b, 0) }} :
                        {{ game.team2.score.reduce((a, b) => a + b, 0) }}
                      </span>
                    </div>
                    <div class="stats-active__card-actions">
                      <button class="stats-btn stats-btn--sm stats-btn--primary" @click="loadGame(index)">
                        <Play :size="14" /> {{ $t('stat.continueGame') }}
                      </button>
                      <button
                        v-if="confirmDeleteIndex === index"
                        class="stats-btn stats-btn--sm stats-btn--danger-confirm"
                        @click="deleteGame(index)"
                      >
                        {{ $t('stat.deleteGame') }}?
                      </button>
                      <button
                        v-else
                        class="stats-btn stats-btn--sm stats-btn--danger"
                        @click="confirmDeleteIndex = index"
                      >
                        <Trash2 :size="14" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- New Game Tab -->
              <div v-if="currentTab === 'new'">
                <StatsSetup
                  :tags="tags"
                  :team1="team1"
                  :team2="team2"
                  :initialGameType="gameType"
                  :initialStatMode="statMode"
                  :initialStatScenario="statScenario"
                  :initialStatSystem="statSystem"
                  :initialAsCouch="asCouch"
                  :initialGameName="gameName"
                  :initialGameTags="gameTags"
                  @start="onSetupStart"
                  @changeType="onChangeType"
                  @addTag="addTag"
                  @removeTag="removeTag"
                />
              </div>

              <!-- History Tab -->
              <div v-if="currentTab === 'history'">
                <StatsArchive :tags="tags" />
              </div>
            </div>
          </div>
        </div>
        <div v-else class="stats-page__login">
          {{ $t('stat.onlyLogin') }}
          <div class="mt-5">
            <router-link to="/" class="btn-login-primary btn-login-primary--large">
              <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {{ $t('common.loginUser') }}
            </router-link>
          </div>
        </div>
      </div>
      <Message v-if="message.show" />
    </div>
    <Footer />
  </div>
</template>

<script>
import Footer from '@/components/partials/Footer.vue';
import Navbar from '@/components/Navbar.vue';
import Menu from '@/components/Menu.vue';
import { statsService } from '@/services/db';
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import StatsArchive from '@/components/stats/StatsArchive.vue';
import StatResult from '@/components/stats/StatResult.vue';
import StatsSetup from '@/components/stats/StatsSetup.vue';
import StatsTracking from '@/components/stats/StatsTracking.vue';
import { gameTypes, validateScore } from '@/helpers-stat.js';
import Message from '@/components/Message.vue';
import { Plus, Play, Archive, CircleOff, Trash2, ArrowLeft, Share2 } from 'lucide-vue-next';

export default {
  name: 'Stats',
  components: {
    Message,
    StatResult,
    StatsArchive,
    StatsSetup,
    StatsTracking,
    Menu,
    Navbar,
    Footer,
    Plus,
    Play,
    Archive,
    CircleOff,
    Trash2,
    ArrowLeft,
    Share2,
  },
  data() {
    return {
      isSaving: false,
      tagsLoading: false,
      tags: null,
      gameTags: [],
      menuOpen: false,
      showResults: false,
      finishedGame: null,
      finishedGameId: null,
      currentTab: 'active',
      activeGameIndex: null,
      gameName: '',
      gameType: 1,
      statScenario: false,
      statMode: false,
      asCouch: false,
      statSystem: 'simple',
      currentMan: null,
      gameTypes,
      team1: { score: [] },
      team2: { score: [] },
      manDistance: null,
      savedGames: [],
      confirmDeleteIndex: null,
    };
  },
  mounted() {
    this.loadSavedGames();
    this.getTags();
    this.changePlayers();
    this.syncPlayerUsageFromArchive();
    if (this.savedGames.length === 0) {
      this.currentTab = 'new';
    }
  },
  computed: {
    ...mapState(useMainStore, ['user', 'message']),
    currentScore() {
      return {
        team1: this.team1.score.reduce((a, b) => a + b, 0),
        team2: this.team2.score.reduce((a, b) => a + b, 0),
      };
    },
    manCount() {
      return this.team1.players?.[0]?.stat?.length || 0;
    },
    throwInfo() {
      return {
        isMade: this.statMode,
        type: 'p',
        success: this.statScenario,
        french: 'D',
        distance: this.manDistance,
        important: this.currentScore.team1 > 9 && this.currentScore.team2 > 9,
      };
    },
  },
  watch: {
    currentMan() {
      if (this.currentMan !== null && (this.currentScore.team1 < 13 || this.currentScore.team2 < 13)) {
        this.nextMan();
      }
    },
    manDistance(newValue) {
      if (this.team1.players) {
        this.team1.players.forEach((player) =>
          player.stat[this.currentMan]?.forEach((item) => {
            item.distance = newValue;
          }),
        );
      }
      if (this.team2.players) {
        this.team2.players.forEach((player) =>
          player.stat[this.currentMan]?.forEach((item) => {
            item.distance = newValue;
          }),
        );
      }
    },
  },
  methods: {
    ...mapActions(useMainStore, ['showMessage']),
    loadSavedGames() {
      const raw = localStorage.getItem('statGames');
      this.savedGames = raw ? JSON.parse(raw) : [];

      // Migrate old single-game localStorage to new format
      const oldGame = localStorage.getItem('statGame');
      if (oldGame) {
        const gameData = JSON.parse(oldGame);
        this.savedGames.push({
          name: gameData.name || '',
          type: gameData.type,
          system: gameData.system,
          scenario: gameData.scenario,
          mode: gameData.mode,
          asCouch: gameData.asCouch,
          team1: gameData.team1,
          team2: gameData.team2,
          currentMan: gameData.team1.players[0].stat.length - 1,
          tags: [],
        });
        this.persistGames();
        localStorage.removeItem('statGame');
      }
    },
    persistGames() {
      localStorage.setItem('statGames', JSON.stringify(this.savedGames));
    },
    getTags() {
      this.tagsLoading = true;
      statsService
        .getTags(this.user.uid)
        .then((snapshot) => {
          this.tags = snapshot.exists() ? snapshot.val() : null;
        })
        .catch((error) => {
          console.error('Error loading tags:', error);
          this.tags = null;
        })
        .finally(() => {
          this.tagsLoading = false;
        });
    },
    saveCurrentGame() {
      if (this.activeGameIndex === null || !this.team1.players?.length) return;
      this.savedGames[this.activeGameIndex] = {
        name: this.gameName,
        type: this.gameType,
        system: this.statSystem,
        scenario: this.statScenario,
        mode: this.statMode,
        asCouch: this.asCouch,
        team1: { ...this.team1 },
        team2: { ...this.team2 },
        currentMan: this.currentMan,
        manDistance: this.manDistance,
        tags: this.gameTags,
      };
      this.persistGames();
    },
    loadGame(index) {
      const game = this.savedGames[index];
      this.gameName = game.name;
      this.gameType = game.type;
      this.statSystem = game.system;
      this.statScenario = game.scenario;
      this.statMode = game.mode;
      this.asCouch = game.asCouch;
      this.team1 = { ...game.team1 };
      this.team2 = { ...game.team2 };
      this.currentMan = game.currentMan;
      this.manDistance = game.manDistance || null;
      this.gameTags = game.tags || [];
      this.activeGameIndex = index;
    },
    deleteGame(index) {
      this.confirmDeleteIndex = null;
      this.savedGames.splice(index, 1);
      this.persistGames();
    },
    minimizeGame() {
      this.saveCurrentGame();
      this.activeGameIndex = null;
      this.currentTab = 'active';
    },
    onSetupStart({ gameName, gameType, statMode, statScenario, statSystem, asCouch, gameTags }) {
      this.gameName = gameName;
      this.gameType = gameType;
      this.statMode = statMode;
      this.statScenario = statScenario;
      this.statSystem = statSystem;
      this.asCouch = asCouch;
      this.gameTags = gameTags;
      this.manDistance = null;
      this.currentMan = 0;

      // Save as new active game
      this.savedGames.push({
        name: gameName,
        type: gameType,
        system: statSystem,
        scenario: statScenario,
        mode: statMode,
        asCouch,
        team1: { ...this.team1 },
        team2: { ...this.team2 },
        currentMan: 0,
        tags: gameTags,
      });
      this.persistGames();
      this.activeGameIndex = this.savedGames.length - 1;
    },
    onChangeType(gameType) {
      this.gameType = gameType;
      this.changePlayers();
    },
    onDistanceChange(newValue) {
      this.manDistance = newValue;
    },
    addTag(id, name) {
      if (!this.tags) this.tags = {};
      this.tags[id] = name;
    },
    removeTag(id) {
      delete this.tags[id];
    },
    trackPlayerUsage() {
      const raw = localStorage.getItem('statPlayerUsage');
      const usage = raw ? JSON.parse(raw) : {};
      [...this.team1.players, ...this.team2.players].forEach((p) => {
        if (p.name.trim()) {
          usage[p.name.trim()] = (usage[p.name.trim()] || 0) + 1;
        }
      });
      localStorage.setItem('statPlayerUsage', JSON.stringify(usage));
    },
    syncPlayerUsageFromArchive() {
      if (!this.user) return;
      statsService.getAll(this.user.uid).then((snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.val();
        const usage = {};
        Object.values(data).forEach((game) => {
          if (!game?.team1?.players) return;
          [...(game.team1.players || []), ...(game.team2?.players || [])].forEach((p) => {
            if (p.name?.trim()) {
              usage[p.name.trim()] = (usage[p.name.trim()] || 0) + 1;
            }
          });
        });
        if (Object.keys(usage).length) {
          localStorage.setItem('statPlayerUsage', JSON.stringify(usage));
        }
      });
    },
    finishGame() {
      this.trackPlayerUsage();
      this.finishedGame = {
        name: this.gameName,
        system: this.statSystem,
        team1: JSON.parse(JSON.stringify(this.team1)),
        team2: JSON.parse(JSON.stringify(this.team2)),
      };
      this.showResults = true;
      let statResult = {
        date: Date.now(),
        system: this.statSystem,
        tags: this.gameTags,
        name: this.gameName,
        team1: this.finishedGame.team1,
        team2: this.finishedGame.team2,
      };
      this.finishedGameId = statResult.date;
      this.isSaving = true;
      statsService
        .save(this.user.uid, statResult.date, statResult)
        .then(() => {
          this.showMessage({ title: this.$t('messages.awesome'), text: this.$t('messages.statsSaved') });
          if (this.activeGameIndex !== null) {
            this.savedGames.splice(this.activeGameIndex, 1);
            this.persistGames();
          }
          this.activeGameIndex = null;
          this.isSaving = false;
          this.resetGameState();
        })
        .catch((error) => {
          console.error('Error save:', error);
          this.showMessage({ title: this.$t('messages.error'), text: error, type: 'error' });
          this.isSaving = false;
        });
    },
    resetGameState() {
      this.currentMan = null;
      this.gameName = '';
      this.gameTags = [];
      this.team1 = { score: [] };
      this.team2 = { score: [] };
      this.changePlayers();
    },
    shareFinishedGame() {
      const domain = import.meta.env.PROD ? '/petanque-draw/#/' : '/#/';
      const shareRef = `${this.user.uid}.${this.finishedGameId}`;
      const link = `${window.location.origin}${domain}stats/share?ref=${shareRef}`;
      navigator.clipboard.writeText(link).then(() => {
        this.showMessage({ title: this.$t('messages.awesome'), text: this.$t('remote.copyLink') });
      });
    },
    startNewGame() {
      this.showResults = false;
      this.activeGameIndex = null;
      this.resetGameState();
      this.currentTab = 'new';
    },
    changePlayerInTeam(teamIndex, playerIndex, playerName) {
      this['team' + teamIndex].players[playerIndex].name = playerName;
    },
    replacePlayerInTeam(teamIndex, playerIndex, newPlayerName) {
      const team = this['team' + teamIndex];
      team.players[playerIndex].wasChanged = true;

      const newPlayer = {
        name: newPlayerName,
        stat: [],
      };
      for (let i = 0; i <= this.currentMan; i++) {
        newPlayer.stat.push([]);
      }
      team.players.push(newPlayer);
    },
    removeThrow(team, playerIndex, manIndex, throwIndex) {
      team.players[playerIndex].stat[manIndex].splice(throwIndex, 1);
    },
    addThrow(team, playerIndex, manIndex, throwIndex) {
      team.players[playerIndex].stat[manIndex][throwIndex].isMade = true;
    },
    doubleThrowResult(team, playerIndex, manIndex, throwIndex, res) {
      team.players[playerIndex].stat[manIndex][throwIndex].x2 = res;
    },
    updateThrow(team, playerIndex, manIndex, throwIndex, type, value) {
      team.players[playerIndex].stat[manIndex][throwIndex][type] = value;
    },
    updateTeamScore(team, newScore, manIndex) {
      const otherTeam = team === this.team1 ? this.team2 : this.team1;
      const score = validateScore(this.gameType, team.score, manIndex, newScore);

      if (score > 0) {
        otherTeam.score[manIndex] = 0;
      }

      team.score[manIndex] = score;
    },
    removeMan() {
      this.team1.players.forEach((player) => {
        player.stat.splice(this.currentMan, 1);
      });
      this.team2.players.forEach((player) => {
        player.stat.splice(this.currentMan, 1);
      });
      this.currentMan--;
    },
    addPlayersStats(players) {
      players.forEach((player, index) => {
        if (index === 2) {
          this.throwInfo.type = 't';
        } else {
          this.throwInfo.type = 'p';
        }
        this.addPlayerStats(player);
      });
    },
    addPlayerStats(player) {
      const statEntry = [JSON.parse(JSON.stringify(this.throwInfo)), JSON.parse(JSON.stringify(this.throwInfo))];
      if (this.gameType === 1 || this.gameType === 2) {
        statEntry.push(JSON.parse(JSON.stringify(this.throwInfo)));
      }
      if (!player.wasChanged) {
        player.stat.push(statEntry);
      }
    },
    nextMan() {
      if (this.team1.players[0].stat.length <= this.currentMan) {
        this.addPlayersStats(this.team1.players);
        this.addPlayersStats(this.team2.players);
        if (this.currentMan) {
          this.saveCurrentGame();
        }
      }
    },
    changePlayers() {
      this.team1.players = [];
      this.team2.players = [];
      for (let i = 0; i < this.gameType; i++) {
        this.addPlayer(this.team1);
        this.addPlayer(this.team2);
      }
    },
    addPlayer(team, name = '') {
      const playerInfo = { name: name, stat: [] };
      team.players.push({ ...JSON.parse(JSON.stringify(playerInfo)) });
    },
  },
};
</script>

<style scoped>
.stats-page {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.stats-page__login {
  font-size: 1.2rem;
  padding: 2rem;
  text-align: center;
}

.stats-page__main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.stats-page__game {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.stats-page__results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stats-page__results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.stats-page__results-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stats-page__results-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text);
}

.stats-page__results-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media screen and (max-width: 768px) {
  .stats-page__results-grid {
    grid-template-columns: 1fr;
  }
}

/* Tabs */

.stats-tabs {
  display: flex;
  gap: 0.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 0.3rem;
}

.stats-tabs__btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.stats-tabs__btn:hover {
  color: var(--color-text);
  background: var(--color-surface-hover);
}

.stats-tabs__btn--active {
  background: var(--color-primary);
  color: var(--color-btn-text);
}

.stats-tabs__btn--active:hover {
  background: var(--color-primary-light);
  color: var(--color-btn-text);
}

.stats-tabs__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  font-size: 1rem;
  font-weight: 700;
  background: var(--color-error);
  color: var(--color-btn-text);
  padding: 0 4px;
}

.stats-tabs__btn--active .stats-tabs__badge {
  background: rgb(255 255 255 / 30%);
  color: var(--color-btn-text);
}

.stats-tabs__content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Active games */

.stats-active__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-muted);
  font-size: 1rem;
}

.stats-active__empty-icon {
  opacity: 0.4;
}

.stats-active__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stats-active__card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  transition: box-shadow 0.15s;
}

.stats-active__card:hover {
  box-shadow: 0 2px 8px var(--color-card-shadow);
}

.stats-active__card-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.stats-active__card-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.stats-active__card-meta {
  font-size: 1rem;
  color: var(--color-text-muted);
}

.stats-active__card-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

/* Shared button styles */

.stats-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition:
    background 0.15s,
    box-shadow 0.15s;
}

.stats-btn--sm {
  padding: 0.4rem 0.75rem;
  font-size: 1rem;
}

.stats-btn--primary {
  background: var(--color-primary);
  color: var(--color-btn-text);
}

.stats-btn--primary:hover {
  background: var(--color-primary-light);
}

.stats-btn--secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.stats-btn--secondary:hover {
  background: var(--color-surface-hover);
}

.stats-btn--ghost {
  background: transparent;
  color: var(--color-text-muted);
}

.stats-btn--ghost:hover {
  color: var(--color-primary);
}

.stats-btn--danger {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.stats-btn--danger:hover {
  background: var(--color-error);
  color: var(--color-btn-text);
}

.stats-btn--danger-confirm {
  background: var(--color-error);
  color: var(--color-btn-text);
  animation: pulse-danger 0.3s ease;
}

@keyframes pulse-danger {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}
</style>

<style>
.stat-container {
  flex: 1;
  padding: 1rem;
}

@media screen and (max-width: 500px) {
  .stat-container {
    display: flex;
    flex-direction: column;
  }

  .mobile-stat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}

.throw-result-container {
  line-height: 0;
}

.throw-result {
  display: inline-block;
  margin-right: 3px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-error);
}

.throw-result.-success {
  background: var(--color-success);
}

.throw-result.-carro {
  background: var(--color-stat-blue);
}
</style>
