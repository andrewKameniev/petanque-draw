<template>
  <div>
    <RemoteToolbar
      v-if="user && isOwnerOrAdmin"
      v-model:message="tournamentWrapper.tournamentMessage"
      :loading="loadingOnServer"
      :show-group-switcher="hasTournamentB"
      :active-group="activeTournamentGroup"
      @show-qr="showQrCode = true"
      @update:message="onMessageInput"
      @update:active-group="setActiveGroup"
    />
    <QrCode v-if="showQrCode && isOwnerOrAdmin" @close-modal="showQrCode = false" />
    <TournamentHeader
      :name="tournamentWrapper.name"
      :system="tournament.system"
      :tournament-started="tournamentStarted"
      :is-test="!!tournament.preferences?.isTestTournament"
      :is-pinned="isPinned"
      @update:name="changeTournamentName"
      @pin="pinTournament"
      @unpin="unpinTournament"
    />
    <!-- PRE-START: Setup flow -->
    <template v-if="!tournamentStarted">
      <SetupCard
        :tournament="tournament"
        v-model:teamsInGroup="teamsInGroup"
        v-model:groupRoundsCount="groupRoundsCount"
        v-model:setupPlayOff="setupPlayOff"
        v-model:withCadrage="withCadrage"
        v-model:withBarrage="withBarrage"
        v-model:playB="playB"
        v-model:tirTwoRounds="tirTwoRounds"
        v-model:tirJunior="tirJunior"
        v-model:playoffTimeLimitEnabled="playoffTimeLimitEnabled"
        @draw="drawFirstRound"
        @remove="removeConfirmId = 1"
      />

      <div class="setup-teams-card">
        <AddTeam
          v-if="tournament.system === 'supermele' || (!tournament.games?.length && !tournament.playOff)"
          :import-hidden="false"
          :show-restore="!tournament.teams?.length"
          @restore="restoreTeamsFromLocalStorage"
        />
        <TeamsList v-if="tournament.teams && tournament.teams.length" :activeRound="activeRound" />
        <div v-else class="setup-empty">{{ $t('common.please') }} {{ $t('teams.addTeamMessage') }}</div>
        <div v-if="!(tournament.teams?.length > 2)" class="setup-card__actions setup-card__actions--delete-only">
          <button class="setup-card__delete" @click="removeConfirmId = 1">
            <Trash2 :size="16" />
            <span>{{ $t('teams.removeTournament') }}</span>
          </button>
        </div>
      </div>
    </template>

    <!-- POST-START: Tir module (no tabs) -->
    <template v-else-if="tournament.system === 'tir'">
      <TirModule ref="tirModule" :tournament-meta="tournamentWrapper" @finish="showFinishConfirm = true" />
      <div class="bottom-actions">
        <div class="bottom-actions__row">
          <button class="bottom-actions__btn bottom-actions__btn--danger" @click="removeConfirmId = 1">
            <Trash2 :size="16" />
            {{ $t('teams.removeTournament') }}
          </button>
          <template v-if="tournament.tournamentIsFinished">
            <span class="bottom-actions__tooltip-wrapper" :title="isAlreadyArchived ? $t('teams.alreadyArchived') : ''">
              <button
                class="bottom-actions__btn bottom-actions__btn--primary"
                :disabled="isAlreadyArchived"
                @click="showSaveTournament = true"
              >
                <IconArchive :size="16" />
                {{ $t('teams.saveTournament') }}
              </button>
            </span>
            <button class="bottom-actions__btn bottom-actions__btn--success" @click="exportTirToPortal">
              <Download :size="16" />
              {{ $t('tir.exportResults') }}
            </button>
          </template>
        </div>
      </div>
    </template>

    <!-- POST-START: Tabbed tournament view -->
    <template v-else>
      <div class="tournament-nav">
        <button
          v-for="(tab, index) in tabs"
          :key="index"
          :id="'tab-' + tab.id"
          class="tournament-nav__btn"
          :class="[`tournament-nav__btn--${tab.id}`, { 'tournament-nav__btn--active': tab.id === activeTab }]"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" :size="18" />
          <span>{{ tab.label }}</span>
        </button>
      </div>
      <div class="tabs-content-area">
        <div class="content tabs-content" v-if="activeTab === 'teams'">
          <AddTeam
            v-if="
              (tournament.system === 'supermele' || (!tournament.games?.length && !tournament.playOff)) &&
              !tournament.tirStarted
            "
            :import-hidden="tournament.system === 'supermele' && tournament.games && tournament.games.length > 0"
          />
          <TeamsList v-if="tournament.teams && tournament.teams.length" :activeRound="activeRound" />
          <div v-else class="mb-5 mt-5">{{ $t('common.please') }} {{ $t('teams.addTeamMessage') }}</div>
        </div>
        <Games
          ref="games"
          v-if="activeTab === 'games'"
          :active-tournament="tournament"
          :rankingTeams="activeViewRankingTeams"
          :activeRound="activeViewRound"
          :teams-in-group="teamsInGroup"
          @openResults="activeTab = 'ranking'"
          @startPlayOff="startPlayOff"
          @startFirstRound="startFirstRound"
          @redraw="redrawRounds"
        />
        <Results
          v-if="activeTab === 'results'"
          :preview-tournament="activeTournamentGroup === 'B' ? tournament : undefined"
        />
        <StreamPresets v-if="activeTab === 'streams'" />
        <div class="content tabs-content" v-if="activeTab === 'ranking'">
          <Ranking :tournament="tournament" :rankingTeams="activeViewRankingTeams" :activeRound="activeViewRound" />
          <!-- TODO: still working on cadrage/group B transition
                <div v-if="!tournament.playOff && tournament.teams?.length > 1 && !tournament.tournamentIsFinished && tournament.games?.length">
                    <div class="mt-5">
                        <h2 class="h2">{{ $t('ranking.goPlayOff') }}</h2>
                        <div class="is-flex is-align-items-center mb-2" v-if="tournament.system === 'swiss'">
                            <label class="checkbox">
                                <input type="checkbox" v-model="withCadrage">
                                {{ $t('ranking.withCadrage') }}
                            </label>
                            <span v-if="withCadrage && teamToPlayOff" class="ml-3">{{teamToPlayOff / 2}} + {{teamToPlayOff}}</span>
                        </div>
                        <div class="is-flex is-align-items-center">{{ $t('ranking.chooseNumberTeams') }}
                            <div class="select ml-3">
                                <select v-model.number="tournament.preferences.playOffTeams">
                                    <template v-for="value in teamToPlayOffValues" :key="value">
                                        <option :value="value"
                                                v-if="tournament.teams.length >= value">{{value}}</option>
                                    </template>
                                </select>
                            </div>
                            <button @click="setPlayOffList" class="button is-success ml-3">{{ $t('ranking.go') }}</button>
                        </div>
                    </div>
                    <div class="mt-5" v-if="tournament.system === 'swiss'">
                        <label class="checkbox">
                            <input type="checkbox" v-model="playB">
                            {{ $t('ranking.alsoPlay') }} <strong>{{ $t('ranking.tournamentB') }}</strong>?
                        </label>
                    </div>
                </div>
                -->
        </div>
        <div class="bottom-actions" v-if="tournament.system !== 'tir' && isOwnerOrAdmin">
          <div class="bottom-actions__row">
            <button
              v-if="
                tournament.preferences?.isTestTournament &&
                !tournament.tournamentIsFinished &&
                (tournament.roundIsActive || tournament.cadrage?.length || tournament.playOff?.length)
              "
              class="bottom-actions__btn bottom-actions__btn--test"
              @click="autoFillScores"
            >
              <Zap :size="16" />
              {{ $t('setup.autoFillScores') }}
            </button>
            <button
              v-if="
                hasPlayOffConfigured &&
                !tournament.tournamentIsFinished &&
                !tournament.roundIsActive &&
                tournament.games?.length &&
                !tournament.playOff?.length &&
                !tournament.cadrage?.length
              "
              data-testid="btn-go-playoff"
              class="bottom-actions__btn bottom-actions__btn--finish"
              @click="openPlayoffConfirm"
            >
              {{ $t('ranking.goPlayOff') }}
            </button>
            <button
              v-if="
                !tournament.tournamentIsFinished &&
                !tournament.roundIsActive &&
                tournament.games?.length &&
                !tournament.playOff?.length &&
                !tournament.cadrage?.length
              "
              data-testid="btn-finish-tournament"
              class="bottom-actions__btn bottom-actions__btn--outline"
              @click="showFinishConfirm = true"
            >
              {{ $t('teams.finishTournament') }}
            </button>
            <button
              v-if="tournament.tournamentIsFinished && tournament.games?.length"
              data-testid="btn-revert-last-round"
              class="bottom-actions__btn bottom-actions__btn--outline"
              @click="showRevertFinishConfirm = true"
            >
              <Undo2 :size="16" />
              {{ $t('teams.revertLastRound') }}
            </button>
            <button
              v-if="(tournament.playOff?.length || tournament.cadrage?.length) && !tournament.tournamentIsFinished"
              data-testid="btn-restore-round"
              class="bottom-actions__btn bottom-actions__btn--outline"
              @click="
                activeTab = 'games';
                $nextTick(() => $refs.games && ($refs.games.showRestoreConfirm = true));
              "
            >
              <Undo2 :size="16" />
              {{ $t('games.restoreRound') }}
            </button>
            <button
              v-if="tournamentStarted"
              data-testid="btn-preferences"
              class="bottom-actions__btn bottom-actions__btn--purple-outline"
              @click="showPreferences = true"
            >
              <IconSettings :size="16" />
              {{ $t('teams.preferences') }}
            </button>
            <button
              v-if="tournament.games?.length === 1 && tournament.roundIsActive"
              class="bottom-actions__btn bottom-actions__btn--outline"
              @click="redrawRounds"
            >
              <RefreshCw :size="16" />
              {{ $t('setup.redraw') }}
            </button>
            <span
              v-if="canSaveTournament || tournament.tournamentIsFinished"
              class="bottom-actions__tooltip-wrapper"
              :title="isAlreadyArchived ? $t('teams.alreadyArchived') : ''"
            >
              <button
                class="bottom-actions__btn bottom-actions__btn--primary"
                :disabled="isAlreadyArchived"
                @click="showSaveTournament = true"
              >
                <IconArchive :size="16" />
                {{ $t('teams.saveTournament') }}
              </button>
            </span>
            <button
              v-if="
                (tournamentWrapper.portalIdTournament || tournament.portalIdTournament) &&
                tournament.tournamentIsFinished &&
                tournament.teams?.length
              "
              class="bottom-actions__btn bottom-actions__btn--gold"
              @click="showProtocol = !showProtocol"
            >
              {{ showProtocol ? $t('common.hide') : $t('common.show') }} {{ $t('teams.protocol') }}
            </button>
          </div>
        </div>
      </div>
    </template>
    <SaveTournament v-if="showSaveTournament" :ranking-teams="rankingTeams" @close-modal="showSaveTournament = false" />
    <ConfirmRemoveModal
      v-if="removeConfirmId"
      :name="tournamentWrapper.name"
      @close="removeConfirmId = null"
      @remove="
        removeTournament();
        showPreferences = false;
      "
    />
    <ConfirmDialog
      v-if="showFinishConfirm"
      :message="$t('teams.finishTournamentConfirm')"
      :confirm-label="$t('teams.finishTournament')"
      :cancel-label="$t('common.cancel')"
      confirm-test-id="btn-confirm-finish"
      @confirm="
        showFinishConfirm = false;
        finishTournament();
      "
      @cancel="showFinishConfirm = false"
    />
    <ConfirmDialog
      v-if="showRevertFinishConfirm"
      :message="$t('teams.revertLastRoundConfirm')"
      :confirm-label="$t('teams.revertLastRound')"
      :cancel-label="$t('common.cancel')"
      confirm-test-id="btn-confirm-revert-round"
      @confirm="
        showRevertFinishConfirm = false;
        revertLastRound();
      "
      @cancel="showRevertFinishConfirm = false"
    />
    <PlayoffConfirmModal
      v-if="showPlayoffConfirm"
      :is-swiss="tournament.system === 'swiss'"
      :is-groups="tournament.system === 'groups'"
      :is-tournament-b="!!tournament?.isTournamentB"
      :teams-count="tournament.teams?.length || 0"
      :play-off-teams="tournament.preferences.playOffTeams"
      :with-cadrage="withCadrage"
      :with-barrage="withBarrage"
      :play-b="playB"
      :barrage-teams="tournament.preferences.barrageTeams || 8"
      :time-limit-enabled="!!tournament.preferences.timeLimitEnabled"
      :playoff-time-limit="tournament.preferences.playoffTimeLimit || 30"
      :no-time-limit-finale="!!tournament.preferences.noTimeLimitFinale"
      :ranking-teams="flatRankingTeams"
      :cadrage-losers-to-b="!!tournament.preferences.cadrageLosersToB"
      :play-off-format="tournament.preferences.playOffFormat || 'single'"
      @confirm="onPlayoffConfirm"
      @cancel="showPlayoffConfirm = false"
    />
    <Preferences
      v-if="showPreferences"
      @close-modal="showPreferences = false"
      @remove-tournament="
        showPreferences = false;
        removeConfirmId = 1;
      "
    />
    <Protocol
      v-if="
        showProtocol &&
        (tournamentWrapper.portalIdTournament || tournament.portalIdTournament) &&
        tournament.tournamentIsFinished &&
        tournament.system !== 'tir'
      "
      @close="showProtocol = false"
      :tournament="tournament"
      :tournament-meta="tournamentWrapper"
      :rankingTeams="rankingTeams"
    />
  </div>
</template>

<script>
import AddTeam from './partials/AddTeam.vue';
import Games from './partials/Games.vue';
import Results from './partials/Results.vue';
import Ranking from './partials/Ranking.vue';
import TeamsList from './partials/TeamsList';
import SaveTournament from './partials/SaveTournament';
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import ConfirmRemoveModal from '@/components/ConfirmRemoveModal';
import { getTeamsRanking, shuffleArray } from '@/helpers';
import {
  buildPlayOffScheme,
  buildCadrageGames,
  buildDoubleEliminationBracket,
  getNextDoubleEliminationStage,
} from '@/services/playoff';
import QrCode from '@/components/partials/QrCode';
import Preferences from '@/components/partials/Preferences';
import Protocol from '@/components/partials/Protocol';
import ConfirmDialog from '@/components/partials/ConfirmDialog';
import PlayoffConfirmModal from '@/components/partials/PlayoffConfirmModal';
import SetupCard from '@/components/partials/SetupCard';
import TournamentHeader from '@/components/partials/TournamentHeader';
import RemoteToolbar from '@/components/partials/RemoteToolbar';
import { IconSettings, IconArchive } from '@/components/icons';
import { Undo2, Trash2, Users, Grid3x3, List, Trophy, RefreshCw, Radio, Download, Zap } from 'lucide-vue-next';
import { autoFillScores as autoFillScoresFn } from '@/services/testUtils';
import StreamPresets from '@/components/partials/StreamPresets.vue';
import {
  drawSwissRound,
  drawSupermeleRound,
  drawGroupsRound,
  drawGroupsSwissRound,
  assignLanes,
  generateConstrainedGroups,
  createPoules,
  drawPoulesRound,
  reshuffleGroupSchedule,
  saveResultsForRound,
} from '@/services/draw';
import TirModule from '@/components/tir/TirModule.vue';
import {
  getPlayoffPlaces,
  getCombinedTotal,
  getScoreCarreauCount,
  getScoreReussiCount,
  getScoreToucheCount,
  rankWithTiebreakers,
} from '@/services/tir';
import { getActiveTournamentGroup, getTournamentPresentation, hasTournamentGroup } from '@/services/tournament-record';

export default {
  name: 'Tournament',
  data() {
    return {
      activeTab: 'teams',
      showSaveTournament: false,
      removeConfirmId: null,
      playB: false,
      withCadrage: false,
      withBarrage: false,
      teamsInGroup: null,
      groupRoundsCount: null,
      showQrCode: false,
      loadingOnServer: false,
      showPreferences: false,
      showProtocol: false,
      showFinishConfirm: false,
      showRevertFinishConfirm: false,
      setupPlayOff: false,
      showAdvancedSettings: false,
      showPlayoffConfirm: false,
      tirTwoRounds: false,
      tirJunior: false,
      playoffTimeLimitEnabled: true,
      pinnedState: localStorage.getItem('petanqueDrawPinned'),
    };
  },
  watch: {
    withCadrage(val) {
      if (val) this.withBarrage = false;
    },
    withBarrage(val) {
      if (val) this.withCadrage = false;
    },
  },
  created() {
    if (!this.tournament) return;
    this.teamsInGroup = this.tournament.groups ? this.tournament.groups.length : 4;
    this.migrateMissingTechnicalGames();
    const n = this.tournament.teams?.length || 4;
    this.groupRoundsCount = n % 2 === 0 ? n - 1 : n;
    if (this.tournament.preferences && !this.tournament.preferences.groupDrawMethod) {
      this.tournament.preferences.groupDrawMethod = 'seeded';
    }
    if (this.tournament.preferences && !this.tournament.preferences.groupFormat) {
      this.tournament.preferences.groupFormat = 'round_robin';
    }
    if (this.tournament.preferences?.withCadrage && this.tournament.system === 'swiss') {
      this.withCadrage = true;
    }
    if (this.tournament.preferences?.withBarrage && this.tournament.system === 'swiss') {
      this.withBarrage = true;
    }
    if (this.tournament.preferences?.playB) {
      this.playB = true;
    }
    if (this.tournament.tournamentIsFinished) {
      this.activeTab = 'ranking';
    } else if (this.tournament.games?.length || this.tournament.tirStarted) {
      this.activeTab = 'games';
    }
  },
  methods: {
    ...mapActions(useMainStore, [
      'startRound',
      'removeTournament',
      'setPlayOff',
      'setPlayOffBracket',
      'setPlayOffStage',
      'setCadrage',
      'setBarrage',
      'finishTournament',
      'revertFinishTournament',
      'showMessage',
      'addTeamToStore',
      'saveP',
      'changeTournamentName',
      'syncTournamentMessage',
      'syncTirStart',
      'syncDrawStart',
      'syncRedraw',
      'syncGames',
      'addRoundToGames',
      'savePreferences',
      'clearRoundTimer',
      'syncTournamentStarted',
      'setActiveGroup',
      'initTournamentB',
      'addTournamentBTeams',
    ]),
    migrateMissingTechnicalGames() {
      const t = this.tournament;
      if (!t.groups?.length || !t.games?.length || t.preferences?.groupFormat !== 'swiss') return;
      const technical = t.preferences?.technical || { technicalFirst: 13, technicalSecond: 7 };
      let migrated = false;
      t.games.forEach((round) => {
        t.groups.forEach((group, groupIndex) => {
          if (group.length % 2 === 0) return;
          const groupGamesInRound = round.filter((g) => g.group === groupIndex);
          const hasTechnical = groupGamesInRound.some((g) => g.team_2 === 'Technical');
          if (hasTechnical) return;
          const groupTitles = new Set(group.map((g) => g.title));
          const playingTeams = new Set();
          groupGamesInRound.forEach((g) => {
            playingTeams.add(g.team_1);
            playingTeams.add(g.team_2);
          });
          const missingTeam = [...groupTitles].find((title) => !playingTeams.has(title));
          if (missingTeam) {
            round.push({
              team_1: missingTeam,
              team_1_score: technical.technicalFirst,
              team_2: 'Technical',
              team_2_score: technical.technicalSecond,
              status: 'finished',
              winner: missingTeam,
              group: groupIndex,
              lane: 0,
            });
            migrated = true;
          }
        });
      });
      if (migrated) {
        t.teams.forEach((team) => {
          team.wins = 0;
          team.opponents = [];
          team.buhgolts = 0;
          team.smallBuhgolts = 0;
          team.pointsMinus = 0;
          team.pointsPlus = 0;
        });
        for (let i = 0; i < t.games.length; i++) {
          if (t.games[i].every((g) => g.status === 'finished')) {
            saveResultsForRound(t, i);
          }
        }
        this.syncGames();
      }
    },
    pinTournament() {
      localStorage.setItem('petanqueDrawPinned', this.currentTournamentIndex);
      this.pinnedState = this.currentTournamentIndex;
      this.showMessage({ title: this.$t('common.pin'), text: this.$t('messages.tournamentPinned') });
    },
    unpinTournament() {
      localStorage.removeItem('petanqueDrawPinned');
      this.pinnedState = null;
      this.showMessage({ title: this.$t('common.unpin'), text: this.$t('messages.tournamentUnpinned') });
    },
    async exportTirToPortal() {
      const portalId = this.tournamentWrapper.portalIdTournament || this.tournament.portalIdTournament;
      if (!portalId) {
        this.$refs.tirModule.exportResults('csv');
        return;
      }
      const token = import.meta.env.VITE_FPU_AUTH_TOKEN;
      if (!token) {
        this.showMessage({ title: this.$t('messages.error'), text: 'API token not configured', type: 'error' });
        return;
      }
      let portalTeams;
      try {
        const res = await fetch(`https://portal.petanque.org.ua/tournament/team_export/${portalId}?format=json`);
        if (!res.ok) throw new Error(`Portal responded ${res.status}`);
        const data = await res.json();
        portalTeams = data.teams;
      } catch (e) {
        this.showMessage({ title: this.$t('messages.error'), text: e.message, type: 'error' });
        return;
      }

      const participants = this.tournament.tirParticipants || [];
      const playoff = this.tournament.tirPlayoff;
      const playoffPlaces = getPlayoffPlaces(playoff);
      const tirConfig = this.tournament.tirConfig || { rounds: 1 };
      const isTwoRound = tirConfig.rounds === 2;
      const tiebreakerCount = this.tournament.tirTiebreakerCount || 0;

      let ranked;
      if (isTwoRound) {
        ranked = [...participants].sort(
          (a, b) =>
            getCombinedTotal(b) - getCombinedTotal(a) ||
            getScoreCarreauCount(b, 'scores') +
              getScoreCarreauCount(b, 'scores2') -
              (getScoreCarreauCount(a, 'scores') + getScoreCarreauCount(a, 'scores2')) ||
            getScoreReussiCount(b, 'scores') +
              getScoreReussiCount(b, 'scores2') -
              (getScoreReussiCount(a, 'scores') + getScoreReussiCount(a, 'scores2')) ||
            getScoreToucheCount(b, 'scores') +
              getScoreToucheCount(b, 'scores2') -
              (getScoreToucheCount(a, 'scores') + getScoreToucheCount(a, 'scores2')),
        );
      } else {
        ranked = rankWithTiebreakers(participants, 'scores', tiebreakerCount);
      }

      const playoffNames = Object.keys(playoffPlaces);
      const maxPlayoffPlace = playoffNames.length
        ? Math.max(
            ...Object.values(playoffPlaces).map((v) =>
              typeof v === 'number' ? v : parseInt(String(v).split('-')[1] || v),
            ),
          )
        : 0;

      let nextPlace = maxPlayoffPlace + 1;
      const allPlaces = { ...playoffPlaces };
      ranked.forEach((p) => {
        if (!allPlaces[p.name]) {
          allPlaces[p.name] = nextPlace;
          nextPlace++;
        }
      });

      const teams = participants
        .map((p) => {
          const portalTeamId = portalTeams.find((pt) => pt.name === p.name)?.id;
          if (!portalTeamId) return null;
          const place = allPlaces[p.name];
          if (place === undefined) return null;
          const placeStr = String(place);
          const entry = { team_id: portalTeamId, place_min: parseInt(placeStr.split('-')[0]) };
          if (placeStr.includes('-')) {
            entry.place_max = parseInt(placeStr.split('-')[1]);
          }
          return entry;
        })
        .filter(Boolean);

      if (!teams.length) {
        this.showMessage({
          title: this.$t('messages.error'),
          text: 'No matching participants found on portal',
          type: 'error',
        });
        return;
      }

      try {
        const response = await fetch('https://portal.petanque.org.ua/api/tournament/results/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: token },
          body: JSON.stringify({ tournament_id: Number(portalId), teams }),
        });
        if (response.ok) {
          const data = await response.json();
          this.showMessage({
            title: this.$t('messages.success'),
            text: `Updated ${data.updated_teams?.length || 0} teams`,
          });
        } else {
          const error = await response.json().catch(() => ({}));
          this.showMessage({
            title: this.$t('messages.error'),
            text: error.error || `Error ${response.status}`,
            type: 'error',
          });
        }
      } catch (e) {
        this.showMessage({ title: this.$t('messages.error'), text: e.message, type: 'error' });
      }
    },
    onMessageInput(message) {
      this.syncTournamentMessage(message);
    },
    onPlayoffConfirm(config) {
      this.showPlayoffConfirm = false;
      this.withCadrage = config.withCadrage;
      this.withBarrage = config.withBarrage;
      this.playB = config.playB;
      this.tournament.preferences.playOffTeams = config.playOffTeams;
      this.tournament.preferences.barrageTeams = config.barrageTeams;
      this.tournament.preferences.playoffTimeLimit = config.playoffTimeLimit;
      this.tournament.preferences.noTimeLimitFinale = config.noTimeLimitFinale;
      this.tournament.preferences.cadrageLosersToB = config.cadrageLosersToB || false;
      this.tournament.preferences.playOffFormat = config.playOffFormat || 'single';
      this.tournament.preferences.grandFinalMode = 'single';
      this._playoffConfig = config;
      this.savePreferences();
      this.setPlayOffList();
    },
    revertLastRound() {
      this.revertFinishTournament();
      if (this.tournament.playOff?.length || this.tournament.cadrage?.length) {
        this.activeTab = 'games';
        this.$nextTick(() => {
          if (this.$refs.games) {
            this.$refs.games.restoreRoundGames();
          }
        });
        return;
      }
      const lastRound = this.tournament.games[this.tournament.games.length - 1];
      if (lastRound) {
        lastRound.forEach((game) => {
          if (game.team_2 !== 'Technical') {
            game.status = 'not_started';
          }
        });
      }
      this.startRound();
      this.syncGames();
      this.activeTab = 'games';
      this.$nextTick(() => {
        if (this.$refs.games) {
          this.$refs.games.autoFinishAfterSave = true;
        }
      });
    },
    openPlayoffConfirm() {
      if (this.tournament.preferences?.playB) this.playB = true;
      if (this.tournament.preferences?.withCadrage) this.withCadrage = true;
      if (this.tournament.preferences?.withBarrage) this.withBarrage = true;
      this.showPlayoffConfirm = true;
    },
    setPlayOffList() {
      const withCadrage = this.withCadrage;
      const withBarrage = this.withBarrage;
      let playOffList;
      if (this.tournament.system === 'swiss' && !this.tournament.groups?.length) {
        if (withBarrage) {
          const barrageCount = this.tournament.preferences.barrageTeams || 8;
          playOffList = this.rankingTeams.slice(0, barrageCount);
          this.startBarrage(playOffList);
          return;
        } else if (withCadrage) {
          playOffList = this.rankingTeams.slice(this.teamToPlayOff * 0.5, this.teamToPlayOff * 1.5);
        } else {
          playOffList = this.rankingTeams.slice(0, this.teamToPlayOff);
        }
      } else {
        if (this.tournament.groups.length > 1) {
          playOffList = [];
          for (let i = 0; i < this.teamToPlayOff / this.tournament.groups.length; i++) {
            this.rankingTeams.forEach((group) => {
              if (group[i]) playOffList.push(group[i]);
            });
          }
        } else {
          playOffList = this.rankingTeams[0].slice(0, this.teamToPlayOff);
        }
      }
      if (withCadrage) {
        this.startCadrage(playOffList);
      } else {
        const nextPow2 = Math.pow(2, Math.ceil(Math.log2(playOffList.length)));
        while (playOffList.length < nextPow2) {
          playOffList.push({ title: null, isBye: true });
        }
        this.startPlayOff(playOffList);
      }
    },
    startCadrage(playOffList) {
      const cadrageGames = buildCadrageGames(playOffList, this.teamToPlayOff);
      this.setCadrage(cadrageGames);
      this.activeTab = 'games';
    },
    startBarrage(teamsList) {
      // Create groups of 4 from the top teams
      const teamsCount = teamsList.length;
      const groupsQuantity = teamsCount / 4;
      const groups = [];
      for (let i = 0; i < groupsQuantity; i++) {
        groups.push([]);
      }

      // Snake distribution (same as createPoules)
      let direction = 1;
      let groupIdx = 0;
      for (let i = 0; i < teamsCount; i++) {
        groups[groupIdx].push(teamsList[i]);
        if (direction === 1 && groupIdx === groupsQuantity - 1) {
          direction = -1;
        } else if (direction === -1 && groupIdx === 0) {
          direction = 1;
        } else {
          groupIdx += direction;
        }
      }

      const startIndex = this.tournament.games ? this.tournament.games.length : 0;

      // Set up barrage data
      const barrage = {
        groups,
        barrageRound: 1,
        startIndex,
      };
      this.setBarrage(barrage);

      // Draw first barrage round using poules round 1 logic
      const round = [];
      groups.forEach((group, groupIndex) => {
        // Round 1: A vs C, B vs D
        round.push({
          group: groupIndex,
          team_1: group[0].title,
          team_1_score: null,
          team_2: group[2].title,
          team_2_score: null,
        });
        round.push({
          group: groupIndex,
          team_1: group[1].title,
          team_1_score: null,
          team_2: group[3].title,
          team_2_score: null,
        });
      });

      this.addRoundToGames(assignLanes(shuffleArray(round), this.tournament));
      this.startRound();
      this.activeTab = 'games';
    },
    startPlayOff(playOffList) {
      if (this.tournament.preferences.playOffFormat === 'double') {
        const bracket = buildDoubleEliminationBracket(playOffList);
        this.setPlayOff(bracket.stages[0].teams);
        this.setPlayOffBracket(bracket);
        this.setPlayOffStage(getNextDoubleEliminationStage(bracket)?.id || 0);
      } else {
        const playOffScheme = buildPlayOffScheme(playOffList, !!this.tournament.cadrage);
        this.setPlayOff(playOffScheme);
      }

      this.activeTab = 'games';

      const hasCadrageLosersToB = this.tournament.preferences?.cadrageLosersToB && this.tournament.cadrage?.length;

      if (hasCadrageLosersToB && this.hasTournamentB) {
        const store = useMainStore();
        const cadrageLosers = this._buildCadrageLosers();
        if (cadrageLosers.length) {
          store.addTournamentBTeams(cadrageLosers);
        }
        return;
      }

      const playB = this.playB;
      if (playB) {
        const store = useMainStore();
        const config = this._playoffConfig || {};
        let tournamentBTeams;
        const ranking = this.flatRankingTeams.filter((t) => !t.withdrawn);
        if (this.tournament.groups?.length > 1 && Array.isArray(this.rankingTeams?.[0])) {
          const qualifyPerGroup = this.teamToPlayOff / this.tournament.groups.length;
          tournamentBTeams = this.rankingTeams
            .flatMap((group) => group.slice(qualifyPerGroup))
            .filter((t) => !t.withdrawn)
            .map((team) => ({ ...team }));
        } else {
          const cadrageSlots = this.withCadrage ? this.teamToPlayOff / 2 : 0;
          const directToA = this.withCadrage ? this.teamToPlayOff / 2 : this.teamToPlayOff;
          const excludeFromB = hasCadrageLosersToB ? directToA + cadrageSlots * 2 : directToA + cadrageSlots;
          tournamentBTeams = ranking.slice(excludeFromB).map((team) => ({ ...team }));
        }

        if (hasCadrageLosersToB) {
          const cadrageLosers = this._buildCadrageLosers();
          tournamentBTeams.push(...cadrageLosers);
        }

        tournamentBTeams.forEach((team) => {
          team.wins = 0;
          team.buhgolts = 0;
          team.smallBuhgolts = 0;
          team.pointsPlus = 0;
          team.pointsMinus = 0;
          team.opponents = ['placeholder'];
          team.lanes = [];
        });
        store.initTournamentB(tournamentBTeams, config.groupBMode || 'swiss');
        this.tournament.preferences.playB = true;
        this.tournament.preferences.cadrageLosersToB = config.cadrageLosersToB || false;
        this.savePreferences();
      }
    },
    _buildCadrageLosers() {
      const cadrageLosers = [];
      this.tournament.cadrage.forEach((game) => {
        const loserTitle = Number(game.team_1_score) > Number(game.team_2_score) ? game.team_2 : game.team_1;
        const loserTeam = this.flatRankingTeams.find((t) => t.title === loserTitle);
        if (loserTeam) {
          cadrageLosers.push({ ...loserTeam });
        }
      });
      return cadrageLosers;
    },
    startStraightPlayoff() {
      const teams = [...this.tournament.teams];
      const useRating = this.tournament.useRating && teams.some((t) => t.rating > 0);

      let playOffList;
      if (useRating) {
        const sorted = [...teams].sort((a, b) => b.rating - a.rating);
        const nextPow2 = Math.pow(2, Math.ceil(Math.log2(sorted.length)));
        playOffList = sorted.map((t) => ({ title: t.title, isBye: false }));
        while (playOffList.length < nextPow2) {
          playOffList.push({ title: null, isBye: true });
        }
      } else {
        const shuffled = [...teams].sort(() => Math.random() - 0.5);
        const nextPow2 = Math.pow(2, Math.ceil(Math.log2(shuffled.length)));
        playOffList = shuffled.map((t) => ({ title: t.title, isBye: false }));
        while (playOffList.length < nextPow2) {
          playOffList.push({ title: null, isBye: true });
        }
      }

      this.tournament.preferences.playOffEnabled = true;
      this.tournament.preferences.playOffTeams = playOffList.length;

      if (this.tournament.preferences.timeLimitEnabled && !this.playoffTimeLimitEnabled) {
        this.tournament.preferences.timeLimitEnabled = false;
      }

      if (!this.tournament.games) {
        this.tournament.games = [];
      }

      this.savePreferences();

      if (this.tournament.preferences.playOffFormat === 'double') {
        const bracket = buildDoubleEliminationBracket(playOffList);
        this.setPlayOff(bracket.stages[0].teams);
        this.setPlayOffBracket(bracket);
        this.setPlayOffStage(getNextDoubleEliminationStage(bracket)?.id || 0);
      } else {
        const playOffScheme = buildPlayOffScheme(playOffList, false);
        this.setPlayOff(playOffScheme);
      }
      this.syncDrawStart();
      this.activeTab = 'games';
    },
    restoreTeamsFromLocalStorage() {
      const teams = JSON.parse(localStorage.getItem('petanqueDrawTeamsRestore'));
      if (!teams) return;
      teams.forEach((item) => {
        this.addTeamToStore(item);
      });
    },
    drawFirstRound() {
      if (this.tournament.system === 'tir') {
        this.tournament.tirStarted = true;
        if (!this.tournament.tirParticipants) {
          this.tournament.tirParticipants = this.tournament.teams.map((team) => {
            const player = Array.isArray(team.players) ? team.players[0] : null;
            const protocolName = [player?.surname, player?.name, player?.second_name].filter(Boolean).join(' ');
            return {
              id: Date.now() + Math.random(),
              name: team.title,
              city: '',
              scores: {},
              protocolName: protocolName || team.title,
              portalTeamId: team.portalTeamId || null,
              club_id: player?.club_id || null,
              sport_title: player?.sport_title || null,
            };
          });
        }
        if (!this.tournament.tirConfig) {
          this.tournament.tirConfig = { junior: this.tirJunior, rounds: this.tirTwoRounds ? 2 : 1 };
        }
        this.tournament.tirRound = 1;
        if (!this.tournament.games) this.tournament.games = [];
        this.tournament.games.push([]);
        this.syncTirStart();
        this.activeTab = 'games';
        return;
      }
      if (this.tournament.teams.length < 5 && this.tournament.system === 'swiss') {
        this.showMessage({
          title: this.$t('games.chooseSystem'),
          text: this.$t('games.chooseSystemText'),
          type: 'error',
        });
        return;
      }
      let round = [];
      if (this.tournament.system === 'swiss') {
        const result = drawSwissRound(this.tournament, this.rankingTeams, this.activeRound);
        if (result.error) {
          this.showMessage({
            title: this.$t('messages.cantDrawRound'),
            text: this.$t('messages.tooManyGames'),
            type: 'error',
          });
          return;
        }
        round = result.round;
      } else if (this.tournament.system === 'groups') {
        if (this.teamsInGroup < 3) {
          this.showMessage({
            title: this.$t('messages.cantDraw'),
            text: this.$t('messages.chooseCorrectTeams'),
            type: 'error',
          });
          return;
        }
        const result = generateConstrainedGroups(this.tournament, this.teamsInGroup);
        this.tournament.groups = result.groups;
        this.tournament.groupsScheme = result.schemas;
        if (result.warning) {
          this.showMessage({
            title: this.$t('messages.warning'),
            text: this.$t('messages.constraintsNotSatisfied'),
            type: 'error',
          });
        }
        if (this.tournament.preferences.groupFormat === 'swiss') {
          round = drawGroupsSwissRound(this.tournament, 1);
        } else if (this.isAllTeamsGroup) {
          this.tournament.preferences.groupTotalRounds = this.groupRoundsCount;
          const schedule = [];
          for (let i = 0; i < this.groupRoundsCount; i++) {
            schedule.push(assignLanes(shuffleArray(drawGroupsRound(this.tournament)), this.tournament));
          }
          this.tournament.groupSchedule = schedule;
          round = schedule[0];
        } else {
          round = drawGroupsRound(this.tournament);
        }
      } else if (this.tournament.system === 'poules') {
        const { groups } = createPoules(this.tournament);
        this.tournament.groups = groups;
        this.tournament.poulesRound = 1;
        round = drawPoulesRound(this.tournament);
      } else if (this.tournament.system === 'playoff') {
        this.startStraightPlayoff();
        return;
      } else if (this.tournament.system === 'supermele') {
        round = drawSupermeleRound(this.tournament, this.rankingTeams);
      }
      if (this.tournament.system === 'poules') {
        this.tournament.preferences.playOffEnabled = true;
        const qualifiedCount = this.tournament.teams.length / 2;
        this.tournament.preferences.playOffTeams = Math.pow(2, Math.ceil(Math.log2(qualifiedCount)));
      } else if (this.setupPlayOff) {
        this.tournament.preferences.playOffEnabled = true;
        this.tournament.preferences.withCadrage = this.withCadrage;
        this.tournament.preferences.withBarrage = this.withBarrage;
        this.tournament.preferences.playB = this.playB;
      } else {
        this.tournament.preferences.playOffEnabled = false;
      }
      this.playB = false;
      this.savePreferences();
      if (this.tournament.groupSchedule) {
        this.addRoundToGames(round);
      } else {
        this.addRoundToGames(assignLanes(shuffleArray(round), this.tournament));
      }
      this.tournament.tournamentIsStarted = true;
      this.syncTournamentStarted(true);
      this.syncDrawStart();
      this.activeTab = 'games';
    },
    startFirstRound() {
      this.tournament.tournamentIsStarted = true;
      this.syncTournamentStarted(true);
      this.startRound();
      this.activeTab = 'games';
    },
    redrawRounds() {
      if (this.tournament.system === 'playoff') {
        this.clearRoundTimer();
        this.tournament.playOff = null;
        this.tournament.playOffBracket = null;
        this.tournament.playOffStage = null;
        this.tournament.games = [];
        this.startStraightPlayoff();
        this.syncRedraw();
        this.showMessage({ title: this.$t('messages.redrawDone'), text: this.$t('messages.redrawDoneText') });
        return;
      }
      if (!this.tournament.games?.length) return;
      if (this.tournament.roundIsActive && this.tournament.games.length > 1) return;
      this.clearRoundTimer();
      this.tournament.games = [];
      this.tournament.teams.forEach((team) => {
        team.lanes = [];
      });

      if (this.tournament.system === 'groups' && this.tournament.groups) {
        const { groups, schemas } = reshuffleGroupSchedule(this.tournament);
        this.tournament.groups = groups;
        this.tournament.groupsScheme = schemas;
        this.tournament.groupSchedule = null;

        let round;
        if (this.tournament.preferences.groupFormat === 'swiss') {
          round = drawGroupsSwissRound(this.tournament, 1);
        } else if (this.isAllTeamsGroup) {
          const totalRounds = this.tournament.preferences?.groupTotalRounds || this.groupRoundsCount;
          const schedule = [];
          for (let i = 0; i < totalRounds; i++) {
            schedule.push(assignLanes(shuffleArray(drawGroupsRound(this.tournament)), this.tournament));
          }
          this.tournament.groupSchedule = schedule;
          round = schedule[0];
        } else {
          round = drawGroupsRound(this.tournament);
        }

        if (this.tournament.groupSchedule) {
          this.addRoundToGames(round);
        } else {
          this.addRoundToGames(assignLanes(shuffleArray(round), this.tournament));
        }
      } else {
        this.tournament.groupSchedule = null;
        this.tournament.groupsScheme = null;
        this.tournament.groups = null;
        this.drawFirstRound();
      }

      this.tournament.roundIsActive = false;
      this.tournament.tournamentIsStarted = false;
      this.syncRedraw();
      this.showMessage({ title: this.$t('messages.redrawDone'), text: this.$t('messages.redrawDoneText') });
    },
    autoFillScores() {
      autoFillScoresFn(this.tournament, this.activeRound);
      if (this.tournament.playOffBracket?.format === 'double') {
        this.setPlayOffBracket(this.tournament.playOffBracket);
        return;
      }
      this.syncGames();
    },
  },
  computed: {
    ...mapState(useMainStore, [
      'tournaments',
      'currentTournamentIndex',
      'isAdmin',
      'user',
      'currentTournament',
      'savedTournamentIds',
      'allScoresFilled',
      'isOwnerOrAdmin',
    ]),
    tournament() {
      return getActiveTournamentGroup(this.currentTournament);
    },
    tournamentWrapper() {
      return this.currentTournament;
    },
    hasTournamentB() {
      return hasTournamentGroup(this.currentTournament, 'B');
    },
    activeTournamentGroup() {
      return getTournamentPresentation(this.currentTournament).group;
    },
    activeViewRound() {
      const t = this.tournament;
      return t.games?.length ? (t.roundIsActive ? t.games.length : t.games.length + 1) : 1;
    },
    activeViewRankingTeams() {
      return getTeamsRanking(this.tournament, this.activeViewRound);
    },
    tabs() {
      if (this.tournament.system === 'tir') {
        return [
          { id: 'teams', label: this.$t('teams.teams'), icon: 'Users' },
          { id: 'games', label: this.$t('teams.games'), icon: 'Grid3x3' },
        ];
      }
      return [
        { id: 'teams', label: this.$t('teams.teams'), icon: 'Users' },
        { id: 'games', label: this.$t('teams.games'), icon: 'Grid3x3' },
        { id: 'results', label: this.$t('teams.results'), icon: 'List' },
        { id: 'ranking', label: this.$t('teams.ranking'), icon: 'Trophy' },
        { id: 'streams', label: this.$t('streams.title'), icon: 'Radio' },
      ];
    },
    isAllTeamsGroup() {
      return this.tournament.system === 'groups' && this.teamsInGroup === this.tournament.teams.length;
    },
    canSaveTournament() {
      return (
        (this.tournament.tournamentIsFinished && this.tournament.games?.length > 1) ||
        (this.tournament.playoff &&
          this.tournament.playoff[this.tournament.playoff.length - 1].teams[0].team_1_score !== null)
      );
    },
    rankingTeams() {
      return getTeamsRanking(this.tournament, this.activeRound);
    },
    flatRankingTeams() {
      if (!this.rankingTeams) return [];
      if (Array.isArray(this.rankingTeams[0])) {
        return this.rankingTeams.flat();
      }
      return this.rankingTeams;
    },
    activeRound() {
      return this.tournament.games && this.tournament.games.length
        ? this.tournament.roundIsActive
          ? this.tournament.games.length
          : this.tournament.games.length + 1
        : 1;
    },
    hasPlayOffConfigured() {
      if (this.tournament.system === 'poules') return false;
      return (
        (this.tournament.system === 'swiss' || this.tournament.system === 'groups') &&
        this.tournament.preferences?.playOffEnabled &&
        this.tournament.preferences.playOffTeams < this.tournament.teams?.length
      );
    },
    isPinned() {
      return String(this.pinnedState) === String(this.currentTournamentIndex);
    },
    isAlreadyArchived() {
      return this.savedTournamentIds.includes(String(this.currentTournamentIndex));
    },
    tournamentStarted() {
      return !!(
        this.tournament.games?.length ||
        this.tournament.playOff ||
        this.tournament.cadrage ||
        this.tournament.tirStarted ||
        this.tournament.tournamentIsFinished
      );
    },
    teamToPlayOff() {
      return this.tournament.preferences.playOffTeams;
    },
    allGamesFinishedForRound() {
      const games = this.tournament.games?.[this.activeRound - 1];
      if (!games?.length) return false;
      return games.every((g) => g.status === 'finished' || g.team_2 === 'Technical');
    },
  },
  components: {
    Undo2,
    Trash2,
    RefreshCw,
    Zap,
    IconSettings,
    IconArchive,
    Protocol,
    Preferences,
    QrCode,
    ConfirmRemoveModal,
    ConfirmDialog,
    PlayoffConfirmModal,
    SetupCard,
    TournamentHeader,
    RemoteToolbar,
    TeamsList,
    AddTeam,
    Games,
    Results,
    Ranking,
    SaveTournament,
    TirModule,
    Users,
    Grid3x3,
    List,
    Trophy,
    Radio,
    Download,
    StreamPresets,
  },
};
</script>

<style scoped>
.bottom-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px solid var(--color-border, #eee);
}

.bottom-actions__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.bottom-actions__tooltip-wrapper {
  display: inline-flex;
}

.bottom-actions__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.9rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.bottom-actions__btn--outline {
  background: var(--color-btn-dark);
  color: var(--color-btn-text);
  border-color: var(--color-btn-dark);
}

.bottom-actions__btn--outline:hover {
  background: var(--color-btn-dark-hover);
  color: var(--color-btn-text);
  border-color: var(--color-btn-dark-hover);
}

.bottom-actions__btn--save-results {
  background: var(--color-btn-green);
  color: var(--color-btn-text);
  border-color: var(--color-btn-green);
}

.bottom-actions__btn--save-results:hover:not(:disabled) {
  background: var(--color-btn-green-hover);
  border-color: var(--color-btn-green-hover);
}

.bottom-actions__btn--save-results:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bottom-actions__btn--finish {
  background: var(--color-btn-blue);
  color: var(--color-btn-text);
  border-color: var(--color-btn-blue);
}

.bottom-actions__btn--finish:hover {
  background: var(--color-btn-blue-hover);
  color: var(--color-btn-text);
  border-color: var(--color-btn-blue-hover);
}

.bottom-actions__btn--primary {
  background: var(--color-primary);
  color: var(--color-btn-text);
  border-color: var(--color-primary);
}

.bottom-actions__btn--primary:hover:not(:disabled) {
  background: var(--color-primary-light);
  border-color: var(--color-primary-light);
}

.bottom-actions__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bottom-actions__btn--purple-outline {
  background: var(--color-primary);
  color: var(--color-btn-text);
  border-color: var(--color-primary);
}

.bottom-actions__btn--purple-outline:hover {
  background: var(--color-primary-light);
  color: var(--color-btn-text);
}

.bottom-actions__btn--success {
  background: var(--color-success);
  color: var(--color-btn-text);
  border-color: var(--color-success);
}

.bottom-actions__btn--success:hover {
  background: var(--color-success-hover);
  border-color: var(--color-success-hover);
}

.bottom-actions__btn--gold {
  background: var(--color-warning);
  color: var(--color-btn-text);
  border-color: var(--color-warning);
  min-width: 10rem;
  justify-content: center;
}

.bottom-actions__btn--gold:hover {
  background: var(--color-warning-hover);
  border-color: var(--color-warning-hover);
  color: var(--color-btn-text);
}

.bottom-actions__btn--danger {
  background: transparent;
  color: var(--color-danger-light);
  border-color: var(--color-danger-light);
}

.bottom-actions__btn--danger:hover {
  background: var(--color-danger-light);
  color: var(--color-btn-text);
}

.setup-teams-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
}

.setup-teams-card :deep(.add-team-card) {
  background: none;
  border: none;
  border-radius: 0;
  padding: 0;
  margin-bottom: 0.75rem;
}

.setup-empty {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  font-size: 1rem;
}

.setup-card__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.setup-card__actions--delete-only {
  justify-content: flex-end;
}

.setup-card__delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.7rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  border: 1px solid var(--color-error);
  border-radius: 8px;
  background: transparent;
  color: var(--color-error);
  cursor: pointer;
  transition: all 0.15s;
  outline: none;
}

.setup-card__delete:hover {
  background: var(--color-error);
  color: var(--color-btn-text);
}

.tournament-nav {
  display: flex;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px 12px 0 0;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: -1px;
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

.tournament-nav__btn--games.tournament-nav__btn--active {
  color: var(--color-primary);
}

.tournament-nav__btn--results.tournament-nav__btn--active {
  color: var(--tir-carreau, #4caf50);
}

.tournament-nav__btn--ranking.tournament-nav__btn--active {
  color: var(--tir-touche, #ff9800);
}

.tournament-nav__btn--streams.tournament-nav__btn--active {
  color: #e53935;
}

.tabs-content-area {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0 0 12px 12px;
  padding: 16px;
  min-height: 240px;
}

.bottom-actions__btn--test {
  background: var(--color-warning, #f59e0b);
  color: var(--color-btn-text, #fff);
  border-color: var(--color-warning, #f59e0b);
}

.bottom-actions__btn--test:hover {
  background: var(--color-warning-hover, #d97706);
  border-color: var(--color-warning-hover, #d97706);
}
</style>
