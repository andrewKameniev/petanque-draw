<template>
  <div class="container protocol-container">
    <ProtocolGate
      v-if="!skipGate && password !== 499"
      v-model:password="password"
      :card-copied="cardCopied"
      @copy-card="copyCard"
    />
    <div v-else>
      <div class="protocol-warning">
        <AlertTriangle :size="18" />
        <span
          >Протокол не є гарантовано вірним, може бути некоректна чи не вся інформація на порталі, може бути специфічний
          регламент, може не бути всіх даних по гравцям. Перевіряйте вручну, будь ласка!</span
        >
      </div>
      <ProtocolParticipantTools
        :refreshing="refreshing"
        @refresh="refreshPlayersFromPortal"
        @remove-markers="removeDopyshit"
        @reset="resetProtocol"
      />
      <div id="protocol" class="mb-3" @input="saveProtocolToStorage">
        <div class="protocol-page">
          <h2 class="text-center is-size-3 mb-2">
            Підсумковий протокол <br />
            {{ tournamentName }}
          </h2>
          <table class="table is-bordered protocol-info-table">
            <tbody>
              <tr>
                <td>Дата початку змагань</td>
                <td
                  :key="`info-start-${formatDateToHumanReadable(tournamentDate)}`"
                  contenteditable="plaintext-only"
                  data-protocol-edit-key="info.start-date"
                  :data-protocol-source="formatDateToHumanReadable(tournamentDate)"
                  v-text="formatDateToHumanReadable(tournamentDate)"
                ></td>
              </tr>
              <tr>
                <td>Дата закінчення змагань</td>
                <td
                  :key="`info-end-${formatDateToHumanReadable(tournamentDate)}`"
                  contenteditable="plaintext-only"
                  data-protocol-edit-key="info.end-date"
                  :data-protocol-source="formatDateToHumanReadable(tournamentDate)"
                  v-text="formatDateToHumanReadable(tournamentDate)"
                ></td>
              </tr>
              <tr>
                <td>Місце/місто проведення</td>
                <td
                  contenteditable="plaintext-only"
                  data-protocol-edit-key="info.venue"
                  data-protocol-manual="true"
                  data-protocol-source=""
                ></td>
              </tr>
              <tr>
                <td>Організатор</td>
                <td
                  contenteditable="plaintext-only"
                  data-protocol-edit-key="info.organizer"
                  data-protocol-manual="true"
                  data-protocol-source=""
                ></td>
              </tr>
              <tr>
                <td>Головний суддя</td>
                <td
                  :key="arbitr"
                  contenteditable="plaintext-only"
                  data-protocol-edit-key="info.main-judge"
                  :data-protocol-source="arbitr"
                  v-text="arbitr"
                ></td>
              </tr>
              <tr>
                <td>Загальна кількість гравців</td>
                <td>{{ playersCount }}</td>
              </tr>
            </tbody>
          </table>
          <br />
          <h3 class="text-center is-size-4 mb-2">Учасники та результати</h3>
          <table v-if="participantChunks.length" class="table is-bordered">
            <thead>
              <tr class="has-text-centered">
                <th style="width: 30px">№ <span style="white-space: nowrap">з/п</span></th>
                <th>ПІП</th>
                <th style="width: 16%">Регіон</th>
                <th style="width: 18%">Тренер(и)</th>
                <th style="width: 10%">Спортивний розряд/звання</th>
                <th v-if="tournament.playOff?.length">Місце після відбіркових ігор</th>
                <th style="width: 7%">Загальне підсумкове місце</th>
              </tr>
            </thead>
            <tbody v-for="(team, index) in participantChunks[0]" :key="index" class="team-group">
              <tr>
                <td :rowspan="team.players?.length > 1 ? team.players?.length + 1 : 1" class="has-text-centered">
                  {{ index + 1 }}
                </td>
                <td
                  :key="`participant-${team.title}-name-${teamPlayerDetailsKey(team)}`"
                  class="has-text-weight-bold"
                  :colspan="team.players?.length > 1 ? 2 : 1"
                  contenteditable="plaintext-only"
                  :data-protocol-edit-key="`participant.${team.title}.name`"
                  :data-protocol-source="teamPlayerDetailsKey(team)"
                  v-text="protocolTeamName(team)"
                ></td>
                <td v-if="team.players?.length === 1">{{ regions[team.players[0].club_id] || '' }}</td>
                <td
                  contenteditable="plaintext-only"
                  :data-protocol-edit-key="`participant.${team.title}.coach`"
                  data-protocol-manual="true"
                  data-protocol-source=""
                  :rowspan="team.players?.length > 1 ? team.players.length + 1 : 1"
                ></td>
                <td
                  :key="`participant-${team.title}-sport-${team.players?.[0]?.sport_title || ''}`"
                  contenteditable="plaintext-only"
                  :data-protocol-edit-key="`participant.${team.title}.sport-title`"
                  :data-protocol-source="team.players?.[0]?.sport_title || ''"
                  v-text="team.players?.length === 1 ? protocolSportTitle(team.players[0]) : ''"
                ></td>
                <td
                  v-if="tournament.playOff?.length"
                  class="has-text-centered"
                  :rowspan="team.players?.length > 1 ? team.players?.length + 1 : 1"
                >
                  {{
                    tournament.system === 'swiss'
                      ? getSwissPlace(team.title)
                      : getTeamPlaceInGroups(team.place, rankingTeams.length)
                  }}
                </td>
                <td class="has-text-centered" :rowspan="team.players?.length > 1 ? team.players?.length + 1 : 1">
                  {{
                    tournament.playOff?.length
                      ? tournamentRanking.find((item) => item.title === team.title)?.place
                      : index + 1
                  }}
                </td>
              </tr>
              <template v-if="team.players?.length > 1">
                <tr v-for="(player, playerIndex) in team.players" :key="playerIndex">
                  <td
                    :key="`participant-player-${player.id || playerIndex}-name-${playerDetailsKey(player)}`"
                    class="is-capitalized"
                    contenteditable="plaintext-only"
                    :data-protocol-edit-key="`participant.${team.title}.player.${player.id || playerIndex}.name`"
                    :data-protocol-source="playerDetailsKey(player)"
                    v-text="protocolPlayerName(player, true)"
                  ></td>
                  <td>{{ regions[player.club_id] || '' }}</td>
                  <td
                    :key="`participant-player-${player.id || playerIndex}-sport-${player.sport_title || ''}`"
                    contenteditable="plaintext-only"
                    :data-protocol-edit-key="`participant.${team.title}.player.${player.id || playerIndex}.sport-title`"
                    :data-protocol-source="player.sport_title || ''"
                    v-text="protocolSportTitle(player)"
                  ></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div v-for="(chunk, ci) in participantChunks.slice(1)" :key="'pc' + ci" class="pdf-page-break">
          <table class="table is-bordered">
            <thead>
              <tr class="has-text-centered">
                <th style="width: 30px">№ <span style="white-space: nowrap">з/п</span></th>
                <th>ПІП</th>
                <th style="width: 16%">Регіон</th>
                <th style="width: 18%">Тренер(и)</th>
                <th style="width: 10%">Спортивний розряд/звання</th>
                <th v-if="tournament.playOff?.length">Місце після відбіркових ігор</th>
                <th style="width: 7%">Загальне підсумкове місце</th>
              </tr>
            </thead>
            <tbody v-for="(team, index) in chunk" :key="index" class="team-group">
              <tr>
                <td :rowspan="team.players?.length > 1 ? team.players?.length + 1 : 1" class="has-text-centered">
                  {{ participantChunkOffsets[ci + 1] + index + 1 }}
                </td>
                <td
                  :key="`participant-${team.title}-name-${teamPlayerDetailsKey(team)}`"
                  class="has-text-weight-bold"
                  :colspan="team.players?.length > 1 ? 2 : 1"
                  contenteditable="plaintext-only"
                  :data-protocol-edit-key="`participant.${team.title}.name`"
                  :data-protocol-source="teamPlayerDetailsKey(team)"
                  v-text="protocolTeamName(team)"
                ></td>
                <td v-if="team.players?.length === 1">{{ regions[team.players[0].club_id] || '' }}</td>
                <td
                  contenteditable="plaintext-only"
                  :data-protocol-edit-key="`participant.${team.title}.coach`"
                  data-protocol-manual="true"
                  data-protocol-source=""
                  :rowspan="team.players?.length > 1 ? team.players.length + 1 : 1"
                ></td>
                <td
                  :key="`participant-${team.title}-sport-${team.players?.[0]?.sport_title || ''}`"
                  contenteditable="plaintext-only"
                  :data-protocol-edit-key="`participant.${team.title}.sport-title`"
                  :data-protocol-source="team.players?.[0]?.sport_title || ''"
                  v-text="team.players?.length === 1 ? protocolSportTitle(team.players[0]) : ''"
                ></td>
                <td
                  v-if="tournament.playOff?.length"
                  class="has-text-centered"
                  :rowspan="team.players?.length > 1 ? team.players?.length + 1 : 1"
                >
                  {{
                    tournament.system === 'swiss'
                      ? getSwissPlace(team.title)
                      : getTeamPlaceInGroups(team.place, rankingTeams.length)
                  }}
                </td>
                <td class="has-text-centered" :rowspan="team.players?.length > 1 ? team.players?.length + 1 : 1">
                  {{
                    tournament.playOff?.length
                      ? tournamentRanking.find((item) => item.title === team.title)?.place
                      : participantChunkOffsets[ci + 1] + index + 1
                  }}
                </td>
              </tr>
              <template v-if="team.players?.length > 1">
                <tr v-for="(player, playerIndex) in team.players" :key="playerIndex">
                  <td
                    :key="`participant-player-${player.id || playerIndex}-name-${playerDetailsKey(player)}`"
                    class="is-capitalized"
                    contenteditable="plaintext-only"
                    :data-protocol-edit-key="`participant.${team.title}.player.${player.id || playerIndex}.name`"
                    :data-protocol-source="playerDetailsKey(player)"
                    v-text="protocolPlayerName(player, true)"
                  ></td>
                  <td>{{ regions[player.club_id] || '' }}</td>
                  <td
                    :key="`participant-player-${player.id || playerIndex}-sport-${player.sport_title || ''}`"
                    contenteditable="plaintext-only"
                    :data-protocol-edit-key="`participant.${team.title}.player.${player.id || playerIndex}.sport-title`"
                    :data-protocol-source="player.sport_title || ''"
                    v-text="protocolSportTitle(player)"
                  ></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <Results
          :previewTournament="tournament"
          :only-qualifying="true"
          :is-for-protocol="true"
          :team-titles="protocolTitles"
          section-title="Результати кожного раунду"
        />
        <Ranking
          :tournament="tournament"
          :rankingTeams="rankingTeams"
          :is-for-protocol="true"
          :team-titles="protocolTitles"
          :section-title="`Результати відбіркових ігор <span class='is-size-5'>(${tournament.system === 'swiss' ? 'швейцарська' : 'кругова'} система (${tournament.games.length} раундів))</span>`"
        />
        <template v-if="tournament.playOff?.length">
          <Results
            :previewTournament="tournament"
            :is-for-protocol="true"
            :only-play-off="true"
            :team-titles="protocolTitles"
            section-title="Результати ігор на виліт"
          />
        </template>
        <div class="pdf-page-break">
          <h3 class="text-center is-size-4 mb-2">Судді змагання</h3>
          <table
            class="table is-bordered protocol-arbiters-table"
            :data-replace-afpu-with-second-category="String(replaceAfpuWithSecondCategory)"
          >
            <thead class="has-text-centered">
              <tr>
                <th style="width: 60px">№ з/п</th>
                <th>Прізвище, ім'я, по батькові</th>
                <th style="width: 22%">Посада</th>
                <th style="width: 14%">Суддівська категорія</th>
                <th v-if="showArbitrCertificate">№ посвідчення</th>
                <th>Регіон</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in arbitres"
                :key="
                  [
                    index,
                    item.name,
                    item.role,
                    item.category,
                    item.certificate,
                    item.region,
                    replaceAfpuWithSecondCategory,
                  ].join('|')
                "
              >
                <td>{{ index + 1 }}</td>
                <td
                  contenteditable="plaintext-only"
                  :data-protocol-edit-key="`judge.${index}.name`"
                  :data-protocol-source="item.name"
                  v-text="item.name"
                  @blur="updateArbiterField(index, 'name', $event)"
                ></td>
                <td
                  contenteditable="plaintext-only"
                  :data-protocol-edit-key="`judge.${index}.role`"
                  :data-protocol-source="item.role"
                  v-text="item.role"
                  @blur="updateArbiterField(index, 'role', $event)"
                ></td>
                <td
                  contenteditable="plaintext-only"
                  :data-protocol-edit-key="`judge.${index}.category`"
                  :data-protocol-original-category="item.category"
                  :data-protocol-source="displayArbiterCategory(item.category)"
                  v-text="displayArbiterCategory(item.category)"
                  @blur="updateArbiterCategory(index, $event)"
                ></td>
                <td
                  v-if="showArbitrCertificate"
                  contenteditable="plaintext-only"
                  :data-protocol-edit-key="`judge.${index}.certificate`"
                  :data-protocol-source="item.certificate"
                  v-text="item.certificate"
                  @blur="updateArbiterField(index, 'certificate', $event)"
                ></td>
                <td
                  contenteditable="plaintext-only"
                  :data-protocol-edit-key="`judge.${index}.region`"
                  :data-protocol-source="item.region"
                  v-text="item.region"
                  @blur="updateArbiterField(index, 'region', $event)"
                ></td>
              </tr>
            </tbody>
          </table>
          <div>
            <table width="100%" class="is-fullwidth protocol-signature-table">
              <tbody>
                <tr>
                  <td>Головний суддя змагань</td>
                  <td class="has-text-centered">
                    ___________________ <br />
                    (печатка)
                  </td>
                  <td
                    class="has-text-right"
                    contenteditable="plaintext-only"
                    data-protocol-edit-key="signature.main-judge"
                    data-protocol-manual="true"
                    data-protocol-source=""
                  ></td>
                </tr>
                <tr>
                  <td>Суддя</td>
                  <td class="has-text-centered">
                    ___________________ <br />
                    (підпис)
                  </td>
                  <td
                    class="has-text-right"
                    contenteditable="plaintext-only"
                    data-protocol-edit-key="signature.judge"
                    data-protocol-manual="true"
                    data-protocol-source=""
                  ></td>
                </tr>
                <tr>
                  <td>Головний секретар змагань</td>
                  <td class="has-text-centered">
                    ___________________ <br />
                    (підпис)
                  </td>
                  <td
                    class="has-text-right"
                    contenteditable="plaintext-only"
                    data-protocol-edit-key="signature.secretary"
                    data-protocol-manual="true"
                    data-protocol-source=""
                  ></td>
                </tr>
                <tr>
                  <td>Президент ГС «Федерація петанку України»</td>
                  <td class="has-text-centered">
                    ___________________ <br />
                    (підпис)
                  </td>
                  <td class="has-text-right">Литвин Лілія Миколаївна</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ProtocolFooter
        :user-id="user?.uid"
        :arbitres="arbitres"
        :tournament-name="tournamentName"
        :show-arbitr-certificate="showArbitrCertificate"
        :replace-afpu-with-second-category="replaceAfpuWithSecondCategory"
        :exporting-docx="exportingDocx"
        :hide-close="hideClose"
        @update:show-arbitr-certificate="showArbitrCertificate = $event"
        @update:replace-afpu-with-second-category="updateReplaceAfpuWithSecondCategory"
        @add-arbiter="addArbitr"
        @apply-arbiter-selection="applyArbiterSelection"
        @apply-arbiter-preset="applyArbiterPreset"
        @export-pdf="exportPdf"
        @export-docx="exportDocx"
        @copy-protocol="copyProtocol"
        @close="$emit('close')"
      />
    </div>
    <button class="protocol-back-top" @click="scrollToggle">
      <ChevronUp :size="20" :class="{ 'protocol-back-top__icon--down': !showBackTop }" />
    </button>
  </div>
</template>

<script>
import Results from '@/components/partials/Results';
import { getTournamentRanking, regions } from '@/helpers';
import {
  formatName,
  getPlayerThirdName,
  formatDateToHumanReadable,
  getTeamPlaceInGroups,
  getAllTeams,
  countPlayers,
  buildTeamTitle,
  getProtocolTournamentMeta,
  refreshTournamentPlayerDetails,
} from '@/protocol-helpers';
import Ranking from '@/components/partials/Ranking';
import ProtocolFooter from '@/components/partials/ProtocolFooter.vue';
import ProtocolGate from '@/components/partials/ProtocolGate.vue';
import ProtocolParticipantTools from '@/components/partials/ProtocolParticipantTools.vue';
import playersNames from '../../data.json';
import { mapActions, mapState } from 'pinia';
import { useMainStore } from '@/stores/main';
import { downloadProtocolDocx } from '@/services/protocol-docx';
import { isMainArbiterRole, normalizeArbiterRole } from '@/services/arbiter-registry';
import {
  clearProtocolHtml,
  copyProtocolElement,
  exportProtocolPdf,
  fetchPortalTournamentTeams,
  readProtocolHtml,
  removeProtocolMarkers,
  restoreProtocolEditableHtml,
  saveProtocolHtml,
} from '@/services/protocol-runtime';
import { AlertTriangle, ChevronUp } from 'lucide-vue-next';

export default {
  name: 'Protocol',
  components: {
    Ranking,
    Results,
    AlertTriangle,
    ChevronUp,
    ProtocolFooter,
    ProtocolGate,
    ProtocolParticipantTools,
  },
  props: ['tournament', 'tournamentMeta', 'rankingTeams', 'skipGate', 'hideClose'],
  emits: ['close'],
  data() {
    return {
      password: null,
      cardCopied: false,
      regions,
      titleCounts: {},
      mixedTeamCount: 1,
      noRegionTeamCount: 1,
      protocolTitles: {},
      arbitr: '',
      refreshing: false,
      exportingDocx: false,
      showArbitrCertificate: true,
      replaceAfpuWithSecondCategory: false,
      showBackTop: false,
      arbitres: [],
    };
  },
  mounted() {
    if (this.tournament.system === 'groups') {
      this.rankingTeams.forEach((group) => {
        group.forEach((team) => {
          this.setTeamTitle(team.title, team.players);
        });
      });
    } else {
      this.rankingTeams.forEach((team) => {
        this.setTeamTitle(team.title, team.players);
      });
    }
    this.$nextTick(() => {
      this.restoreProtocolFromStorage();
    });
    window.addEventListener('scroll', this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  watch: {
    tournamentName() {
      this.updateProtocolTitle();
    },
  },
  computed: {
    ...mapState(useMainStore, ['currentTournament', 'user']),
    protocolTournamentMeta() {
      return getProtocolTournamentMeta(this.tournament, this.tournamentMeta, this.currentTournament);
    },
    tournamentName() {
      return this.protocolTournamentMeta.name;
    },
    tournamentDate() {
      return this.protocolTournamentMeta.date;
    },
    tournamentPortalId() {
      return this.protocolTournamentMeta.portalIdTournament;
    },
    protocolStorageKey() {
      return `protocol_${this.protocolTournamentMeta.id}`;
    },
    playersCount() {
      return countPlayers(this.tournament.teams);
    },
    tournamentRanking() {
      return getTournamentRanking(this.tournament, this.rankingTeams);
    },
    participantsList() {
      if (this.tournament.playOff?.length || this.tournament.playOffBracket) {
        return this.tournamentRanking;
      }
      return this.tournament.system === 'swiss' ? this.rankingTeams : getAllTeams(this.rankingTeams);
    },
    participantChunkSize() {
      return 28;
    },
    maxRowsPerPage() {
      return 38;
    },
    participantChunks() {
      const list = this.participantsList;
      if (!list || !list.length) return [];
      const chunks = [];
      let chunk = [];
      let rows = 0;
      for (const team of list) {
        const teamRows = team.players?.length > 1 ? team.players.length + 1 : 1;
        if (chunk.length > 0 && rows + teamRows > this.maxRowsPerPage) {
          chunks.push(chunk);
          chunk = [];
          rows = 0;
        }
        chunk.push(team);
        rows += teamRows;
      }
      if (chunk.length) chunks.push(chunk);
      return chunks;
    },
    participantChunkOffsets() {
      const offsets = [0];
      for (let i = 0; i < this.participantChunks.length - 1; i++) {
        offsets.push(offsets[i] + this.participantChunks[i].length);
      }
      return offsets;
    },
  },
  methods: {
    ...mapActions(useMainStore, ['showMessage']),
    handleScroll() {
      this.showBackTop = window.scrollY > 400;
    },
    scrollToggle() {
      if (this.showBackTop) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    },
    copyCard() {
      navigator.clipboard.writeText('5353542324470856');
      this.cardCopied = true;
      this.showMessage({ title: 'Скопійовано', text: 'Номер картки скопійовано' });
      setTimeout(() => {
        this.cardCopied = false;
      }, 2000);
    },
    getTeamPlaceInGroups,
    formatDateToHumanReadable,
    getSwissPlace(teamTitle) {
      const index = this.rankingTeams.findIndex((t) => t.title === teamTitle);
      return index !== -1 ? index + 1 : '';
    },
    async refreshPlayersFromPortal() {
      if (this.refreshing) return;
      let portalId = this.tournamentPortalId;
      if (!portalId) {
        portalId = prompt('Введіть ID турніру на порталі (з URL: portal.petanque.org.ua/tournament/XXX)');
        if (!portalId) return;
      }
      this.refreshing = true;
      try {
        // The protocol intentionally works on the selected tournament's local copy.
        const stats = refreshTournamentPlayerDetails(this.tournament.teams, await fetchPortalTournamentTeams(portalId));
        this.$forceUpdate();
        await this.$nextTick();
        this.saveProtocolToStorage();

        const missingText = stats.missing ? ` Не знайдено: ${stats.missing}.` : '';
        this.showMessage({
          title: stats.changed ? 'Оновлено' : 'Без змін',
          text: stats.changed
            ? `Оновлено ${stats.changed} з ${stats.matched} знайдених гравців.${missingText}`
            : `Дані ${stats.matched} знайдених гравців уже актуальні.${missingText}`,
        });
      } catch (e) {
        console.error('Refresh error:', e);
        this.showMessage({
          title: 'Помилка',
          text: `Не вдалося завантажити дані з порталу: ${e.message}`,
          type: 'error',
        });
      } finally {
        this.refreshing = false;
      }
    },
    saveProtocolToStorage() {
      saveProtocolHtml(this.protocolStorageKey, document.getElementById('protocol'));
    },
    restoreProtocolFromStorage() {
      const saved = readProtocolHtml(this.protocolStorageKey);
      if (!saved) return;
      const el = document.getElementById('protocol');
      if (!el) return;

      const template = document.createElement('template');
      template.innerHTML = saved;
      const savedProtocol = template.content;
      const arbitersHeading = [...savedProtocol.querySelectorAll('h3')].find((heading) =>
        heading.textContent.includes('Судді змагання'),
      );
      const arbitersTable = arbitersHeading?.nextElementSibling;

      if (arbitersTable?.matches('table')) {
        const headers = [...arbitersTable.querySelectorAll('thead th')].map((header) => header.textContent.trim());
        const hasCertificate = headers.some((header) => header.includes('посвідчення'));
        this.showArbitrCertificate = hasCertificate;
        this.replaceAfpuWithSecondCategory = arbitersTable.dataset.replaceAfpuWithSecondCategory === 'true';
        this.arbitres = [...arbitersTable.querySelectorAll('tbody tr')].map((row) => {
          const cellElements = [...row.querySelectorAll('td')];
          const cells = cellElements.map((cell) => cell.textContent.trim());
          const savedField = (field) => row.querySelector(`[data-protocol-edit-key$=".${field}"]`);
          const categoryCell = savedField('category') || cellElements[3];
          return {
            name: savedField('name')?.textContent.trim() || cells[1] || '',
            role: normalizeArbiterRole(savedField('role')?.textContent.trim() || cells[2]),
            category: categoryCell?.dataset.protocolOriginalCategory || categoryCell?.textContent.trim() || 'АФПУ',
            certificate: savedField('certificate')?.textContent.trim() || (hasCertificate ? cells[4] || '' : ''),
            region: savedField('region')?.textContent.trim() || cells[hasCertificate ? 5 : 4] || '',
          };
        });
        this.arbitr = this.arbitres.find((arbiter) => isMainArbiterRole(arbiter.role))?.name || '';
      }

      this.$nextTick(() => {
        restoreProtocolEditableHtml(savedProtocol, el);
        this.updateProtocolTitle();
      });
    },
    updateProtocolTitle() {
      const el = document.getElementById('protocol');
      if (!el) return;
      const titleEl = el.querySelector('h2');
      if (titleEl) {
        titleEl.innerHTML = `Підсумковий протокол <br>\n${this.tournamentName}`;
      }
    },
    resetProtocol() {
      clearProtocolHtml(this.protocolStorageKey);
      location.reload();
    },
    removeDopyshit() {
      const el = document.getElementById('protocol');
      const count = removeProtocolMarkers(el);
      this.saveProtocolToStorage?.();
      this.showMessage({ title: 'Готово', text: `Прибрано ${count} міток` });
    },
    addArbitr(arbiter) {
      this.arbitres.push(arbiter);
      if (isMainArbiterRole(arbiter.role)) this.arbitr = arbiter.name;
      this.$nextTick(() => this.saveProtocolToStorage());
    },
    applyArbiterSelection(arbiters) {
      this.arbitres = arbiters;
      this.arbitr = arbiters.find((arbiter) => isMainArbiterRole(arbiter.role))?.name || '';
      this.$nextTick(() => this.saveProtocolToStorage());
    },
    applyArbiterPreset(arbiters) {
      this.arbitres = arbiters;
      this.arbitr = arbiters.find((arbiter) => isMainArbiterRole(arbiter.role))?.name || '';
      this.$nextTick(() => this.saveProtocolToStorage());
    },
    updateArbiterField(index, field, event) {
      this.arbitres[index][field] = event.currentTarget.textContent.trim();
      if (field === 'name' || field === 'role') {
        this.arbitr = this.arbitres.find((arbiter) => isMainArbiterRole(arbiter.role))?.name || '';
      }
    },
    displayArbiterCategory(category) {
      const normalizedCategory = String(category || '')
        .trim()
        .toLocaleUpperCase('uk-UA');
      return this.replaceAfpuWithSecondCategory && normalizedCategory === 'АФПУ' ? '2' : category || '';
    },
    updateArbiterCategory(index, event) {
      const displayedCategory = event.currentTarget.textContent.trim();
      const originalCategory = this.arbitres[index]?.category || '';
      const unchangedReplacement =
        this.replaceAfpuWithSecondCategory &&
        String(originalCategory).trim().toLocaleUpperCase('uk-UA') === 'АФПУ' &&
        displayedCategory === '2';

      if (!unchangedReplacement) this.arbitres[index].category = displayedCategory;
      this.$nextTick(() => this.saveProtocolToStorage());
    },
    updateReplaceAfpuWithSecondCategory(value) {
      this.replaceAfpuWithSecondCategory = value;
      this.$nextTick(() => this.saveProtocolToStorage());
    },
    formatName,
    playerDetailsKey(player) {
      return [
        player?.id,
        player?.surname,
        player?.name,
        player?.second_name,
        player?.club_id,
        player?.sport_title,
      ].join('|');
    },
    teamPlayerDetailsKey(team) {
      const players = Array.isArray(team?.players) ? team.players : Object.values(team?.players || {});
      return players.map((player) => this.playerDetailsKey(player)).join(';');
    },
    protocolPlayerName(player, lowercasePatronymic = false) {
      if (!player) return '';
      const patronymic = player.second_name
        ? lowercasePatronymic
          ? player.second_name.toLowerCase()
          : player.second_name
        : this.getPlayerThirdName(player.surname, player.name);
      return `${formatName(player.surname)} ${formatName(player.name)} ${patronymic}`.trim();
    },
    protocolTeamName(team) {
      const players = Array.isArray(team?.players) ? team.players : Object.values(team?.players || {});
      if (players.length > 1) return this.protocolTitles[team.title] || '';
      return this.protocolPlayerName(players[0]);
    },
    protocolSportTitle(player) {
      return player?.sport_title === 'candidate' ? 'КМСУ' : '';
    },
    getPlayerThirdName(surname, name) {
      return getPlayerThirdName(surname, name, playersNames);
    },
    copyProtocol() {
      const element = document.getElementById('protocol');
      try {
        const successful = copyProtocolElement(element);
        if (successful) {
          this.showMessage({ title: this.$t('messages.success'), text: this.$t('messages.protocolCopied') });
        } else {
          this.showMessage({
            title: this.$t('messages.error'),
            text: this.$t('messages.cantCopyProtocol'),
            type: 'error',
          });
        }
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    },
    async exportPdf() {
      const el = document.getElementById('protocol');
      await exportProtocolPdf(el, {
        normalizeResponsive: true,
        html2pdf: {
          margin: [10, 5, 10, 5],
          filename: `${this.tournamentName}_protocol.pdf`,
          pagebreak: { mode: ['avoid-all'], before: '.pdf-page-break', avoid: ['.team-group', 'tr'] },
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, scrollY: 0, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        },
      });
    },
    async exportDocx() {
      const element = document.getElementById('protocol');
      if (!element || this.exportingDocx) return;

      this.exportingDocx = true;
      try {
        await downloadProtocolDocx(element, this.tournamentName);
      } catch (error) {
        console.error('DOCX export error:', error);
        this.showMessage({
          title: this.$t('messages.error'),
          text: this.$t('messages.docxExportFailed'),
          type: 'error',
        });
      } finally {
        this.exportingDocx = false;
      }
    },
    setTeamTitle(team, players) {
      let title;
      if (players?.length > 1) {
        const result = buildTeamTitle(players, this.titleCounts, this.mixedTeamCount);
        title = result.title;
        this.mixedTeamCount = result.mixedTeamCount;
      } else {
        title = team;
      }
      this.protocolTitles[team] = title;
    },
  },
};
</script>

<style>
.protocol-container {
  background: #e8e8e8;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 900px) {
  .protocol-container {
    padding: 1rem 0.5rem;
  }
}

.protocol-gate {
  margin-bottom: 1.5rem;
}

.protocol-gate__card {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  background: var(--color-bg-input);
}

.protocol-gate__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.7rem;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--color-warning);
  color: var(--color-btn-text);
  border-radius: 4px;
  margin-bottom: 0.75rem;
}

.protocol-gate__desc {
  font-size: 1rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-bottom: 1rem;
}

.protocol-gate__payment {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.protocol-gate__price {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
}

.protocol-gate__card-number {
  font-size: 1rem;
  font-weight: 600;
  font-family: monospace;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  color: var(--color-text);
}

.protocol-gate__copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;
}

.protocol-gate__copy:hover {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.protocol-gate__contact {
  font-size: 1rem;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.protocol-gate__contact strong {
  color: var(--color-text-secondary);
}

.protocol-gate__tips {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border-top: 1px solid var(--color-border);
  padding-top: 0.75rem;
}

.protocol-gate__tip {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  font-size: 1rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.protocol-gate__tip svg {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--color-primary);
}

.protocol-gate__password {
  margin-top: 1rem;
  max-width: 240px;
}

.protocol-gate__label {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.3rem;
}

.protocol-gate__input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-white);
  outline: none;
  transition: border-color 0.2s;
}

.protocol-gate__input:focus {
  border-color: var(--color-primary);
}

.protocol-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-warning-border);
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 1.25rem;
}

.protocol-warning svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.protocol-tools {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.protocol-tools--bottom {
  margin-top: 1.5rem;
  margin-bottom: 0;
}

.protocol-tools--export {
  margin-top: 1rem;
  margin-bottom: 0;
}

.protocol-tools__section {
  padding: 1.15rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-bg-input);
  box-shadow: 0 2px 8px rgb(0 0 0 / 5%);
}

.protocol-tools__section--arbiters {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, var(--color-primary-bg), var(--color-bg-input) 58%);
}

.protocol-tools__section--export {
  position: relative;
  overflow: hidden;
  padding-top: 1.35rem;
}

.protocol-tools__section--export::before {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
  content: '';
}

.protocol-tools__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.protocol-tools__eyebrow {
  display: block;
  margin-bottom: 0.2rem;
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.protocol-tools__header h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.1rem;
  font-weight: 700;
}

.protocol-tools__header p {
  max-width: 560px;
  margin: 0.3rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  line-height: 1.4;
}

.protocol-tools__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.55rem;
  border-radius: 999px;
  background: var(--color-primary);
  color: var(--color-btn-text);
  font-weight: 700;
}

.protocol-tools__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.protocol-tools__checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem 1.25rem;
  margin-top: 0.9rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--color-border);
}

.protocol-actions__checkbox.protocol-tools__checkbox {
  width: fit-content;
  margin-left: 0;
}

.protocol-actions__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.9rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.15s;
  text-decoration: none;
}

.protocol-actions__btn--primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-btn-text);
}

.protocol-actions__btn--primary:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary-light);
}

.protocol-actions__btn--success {
  background: var(--color-success);
  border-color: var(--color-success);
  color: var(--color-btn-text);
}

.protocol-actions__btn--success:hover {
  background: var(--color-success-hover);
  border-color: var(--color-success-hover);
}

.protocol-actions__btn--outline {
  background: transparent;
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}

.protocol-actions__btn--outline:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.protocol-actions__btn--ghost {
  background: transparent;
  border-color: transparent;
  color: var(--color-text-muted);
}

.protocol-actions__btn--ghost:hover {
  color: var(--color-danger, #e53935);
  background: rgb(229 57 53 / 6%);
  border-color: transparent;
}

.protocol-actions__checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  margin-left: auto;
}

@media (max-width: 700px) {
  .protocol-tools__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .protocol-tools__actions .protocol-actions__btn {
    justify-content: center;
    width: 100%;
  }
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

#protocol {
  color: #000;
  font-family: 'Times New Roman', serif;
  width: 210mm;
  min-width: 210mm;
  margin: 0 auto;
  counter-reset: protocol-page 1;
}

#protocol > .protocol-page,
#protocol .pdf-page-break {
  background: #fff;
  border: 1px solid #bbb;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
  box-sizing: border-box;
  padding: 15mm;
  padding-bottom: 20mm;
  min-height: 297mm;
  position: relative;
  counter-increment: protocol-page;
  margin-bottom: 24px;
  break-before: page;
  overflow: hidden;
}

#protocol > .protocol-page {
  break-before: auto;
}

#protocol > .protocol-page::after,
#protocol .pdf-page-break::after {
  content: counter(protocol-page);
  position: absolute;
  bottom: 10mm;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10pt;
  color: #aaa;
  font-family: Arial, sans-serif;
}

#protocol h2,
#protocol h3 {
  font-weight: bold;
  break-after: avoid;
}

#protocol table tr,
#protocol table tbody.team-group {
  break-inside: avoid;
}

#protocol table {
  width: 100%;
}

#protocol .content h3,
#protocol .content h4,
#protocol table th,
#protocol table td {
  color: #000;
}

#protocol table td {
  padding: 0.2em 0.3em;
}

#protocol table td[contenteditable] {
  user-select: text;
  cursor: text;
  min-height: 1.4em;
}

#protocol .table-container {
  overflow: visible;
  max-width: none;
}

.protocol-info-table {
  width: 100%;
}

.protocol-info-table td:first-child {
  width: 40%;
  white-space: nowrap;
}

.protocol-info-table td:last-child {
  width: 60%;
  min-width: 300px;
}

#protocol.is-exporting {
  width: 200mm;
  min-width: 200mm;
}

#protocol.is-exporting > .protocol-page,
#protocol.is-exporting .pdf-page-break {
  border: none;
  box-shadow: none;
  min-height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  break-before: auto;
}

#protocol.is-exporting .pdf-page-break {
  padding-top: 10mm;
}

#protocol.is-exporting > .protocol-page::after,
#protocol.is-exporting .pdf-page-break::after {
  display: none;
}

#protocol.is-exporting table.is-bordered {
  border-collapse: separate;
  border-spacing: 0;
}

#protocol.is-exporting table.is-bordered td,
#protocol.is-exporting table.is-bordered th {
  border-top: none;
}

.protocol-back-top {
  position: fixed;
  bottom: calc(5rem + env(safe-area-inset-bottom, 0px));
  right: 1.5rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px var(--color-primary-shadow);
  transition: transform 0.2s;
  z-index: 50;
}

.protocol-back-top:hover {
  transform: scale(1.1);
}

.protocol-back-top__icon--down {
  transform: rotate(180deg);
}
</style>
