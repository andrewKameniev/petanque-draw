<template>
  <div class="container protocol-container tir-protocol-container">
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
          >Протокол не є гарантовано вірним, може бути некоректна чи не вся інформація на порталі. Перевіряйте вручну,
          будь ласка!</span
        >
      </div>
      <ProtocolParticipantTools
        :refreshing="refreshing"
        @refresh="refreshPlayersFromPortal"
        @remove-markers="removeDopyshit"
        @reset="resetProtocol"
      />
      <div id="protocol" class="mb-3" @input="saveProtocolToStorage">
        <h2 class="text-center is-size-3 mb-2">
          Підсумковий протокол <br />
          {{ tournamentName }}
        </h2>
        <table class="table is-bordered protocol-info-table" data-docx-column-widths="3360,11280">
          <tbody>
            <tr>
              <td>Назва змагань</td>
              <td
                :key="tournamentName"
                contenteditable="plaintext-only"
                data-protocol-edit-key="info.name"
                :data-protocol-source="tournamentName"
                v-text="tournamentName"
              ></td>
            </tr>
            <tr>
              <td>Дата початку змагань</td>
              <td
                :key="`info-start-${formatDate(tournamentDate) || '-'}`"
                contenteditable="plaintext-only"
                data-protocol-edit-key="info.start-date"
                :data-protocol-source="formatDate(tournamentDate) || '-'"
                v-text="formatDate(tournamentDate) || '-'"
              ></td>
            </tr>
            <tr>
              <td>Дата закінчення змагань</td>
              <td
                :key="`info-end-${formatDate(tournamentDate) || '-'}`"
                contenteditable="plaintext-only"
                data-protocol-edit-key="info.end-date"
                :data-protocol-source="formatDate(tournamentDate) || '-'"
                v-text="formatDate(tournamentDate) || '-'"
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
              <td>{{ participants.length }}</td>
            </tr>
          </tbody>
        </table>
        <br />
        <h3 class="text-center is-size-4 mb-2 docx-page-break">Учасники та результати</h3>
        <table class="table is-bordered tir-protocol-results-table" :data-docx-column-widths="resultsColumnWidths">
          <thead>
            <tr class="has-text-centered">
              <th style="white-space: nowrap">№ з/п</th>
              <th>ПІП</th>
              <th>Регіон</th>
              <th>Тренер</th>
              <th>Спортивний розряд</th>
              <th>1 тур</th>
              <th v-if="isTwoRound">2 тур</th>
              <th v-if="isTwoRound">Загалом</th>
              <th>Місце після відбору</th>
              <th>Загальне підсумкове місце</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(p, index) in rankedParticipants"
              :key="[p.id, p.name, p.protocolName, p.club_id, p.city, p.coach, p.sport_title].join('|')"
            >
              <td class="has-text-centered">{{ index + 1 }}</td>
              <td
                contenteditable="plaintext-only"
                :data-protocol-edit-key="`participant.${p.id || index}.name`"
                :data-protocol-source="String(p.id || p.name || index)"
                v-text="getParticipantProtocolName(p)"
                @blur="updateParticipantField(p, 'protocolName', $event)"
              ></td>
              <td
                contenteditable="plaintext-only"
                :data-protocol-edit-key="`participant.${p.id || index}.region`"
                :data-protocol-source="String(p.id || p.name || index)"
                v-text="getParticipantRegion(p)"
                @blur="updateParticipantField(p, 'city', $event)"
              ></td>
              <td
                contenteditable="plaintext-only"
                :data-protocol-edit-key="`participant.${p.id || index}.coach`"
                :data-protocol-source="String(p.id || p.name || index)"
                v-text="formatCoachName(p.coach)"
                @blur="updateParticipantField(p, 'coach', $event)"
              ></td>
              <td
                contenteditable="plaintext-only"
                :data-protocol-edit-key="`participant.${p.id || index}.sport-title`"
                :data-protocol-source="String(p.id || p.name || index)"
                v-text="getParticipantSportTitle(p)"
                @blur="updateParticipantField(p, 'sport_title', $event)"
              ></td>
              <td class="has-text-centered has-text-weight-bold">{{ getR1Score(p) }}</td>
              <td v-if="isTwoRound" class="has-text-centered">
                {{ hasR2Scores(p) ? getR2Score(p) : '—' }}
              </td>
              <td v-if="isTwoRound" class="has-text-centered has-text-weight-bold">
                {{ hasR2Scores(p) ? getCombined(p) : getR1Score(p) }}
              </td>
              <td class="has-text-centered">{{ getQualificationPlace(p) }}</td>
              <td class="has-text-centered has-text-weight-bold">{{ getPlace(index) }}</td>
            </tr>
          </tbody>
        </table>

        <template v-if="playoff">
          <br />
          <h3 class="text-center is-size-4 mb-2">Ігри на вибування</h3>
          <template v-for="(round, rIdx) in playoffRounds" :key="rIdx">
            <h4 class="is-size-5 mb-1">{{ round.title }}</h4>
            <table class="table is-bordered mb-3" data-docx-column-widths="4740,1005,1005,5055">
              <thead>
                <tr class="has-text-centered">
                  <th>Учасник 1</th>
                  <th>Рахунок</th>
                  <th>Рахунок</th>
                  <th>Учасник 2</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(match, mIdx) in round.matches" :key="mIdx">
                  <td :class="{ 'has-text-weight-bold': match.winner === match.player1 }">
                    {{ match.player1 || '—' }}
                  </td>
                  <td class="has-text-centered">{{ match.score1 ?? '—' }}</td>
                  <td class="has-text-centered">{{ match.score2 ?? '—' }}</td>
                  <td :class="{ 'has-text-weight-bold': match.winner === match.player2 }">
                    {{ match.player2 || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </template>

        <br />
        <h3 class="text-center is-size-4 mb-2 docx-page-break">Судді турніру</h3>
        <table
          class="table is-bordered protocol-arbiters-table"
          :data-docx-column-widths="arbiterColumnWidths"
          :data-replace-afpu-with-second-category="String(replaceAfpuWithSecondCategory)"
        >
          <thead class="has-text-centered">
            <tr>
              <th style="width: 40px">№ з/п</th>
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
          <table width="100%" class="is-fullwidth protocol-signature-table" data-docx-column-widths="5000,2500,7140">
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
                <td>Президент Федерації петанку України</td>
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
import { mapActions, mapState } from 'pinia';
import { useMainStore } from '@/stores/main';
import { regions } from '@/helpers';
import { formatCoachName, getProtocolTournamentMeta, refreshTirParticipantDetails } from '@/protocol-helpers';
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
import ProtocolFooter from '@/components/partials/ProtocolFooter.vue';
import ProtocolGate from '@/components/partials/ProtocolGate.vue';
import ProtocolParticipantTools from '@/components/partials/ProtocolParticipantTools.vue';
import {
  getScoreTotal,
  rankWithTiebreakers,
  rankByCombined,
  getCombinedTotal,
  getPlayoffPlaces,
  getTirPlayoffDisplayRounds,
} from '@/services/tir';
import { AlertTriangle, ChevronUp } from 'lucide-vue-next';

export default {
  name: 'TirProtocol',
  components: {
    AlertTriangle,
    ChevronUp,
    ProtocolFooter,
    ProtocolGate,
    ProtocolParticipantTools,
  },
  props: {
    tournament: { type: Object, required: true },
    tournamentMeta: { type: Object, default: null },
    skipGate: { type: Boolean, default: false },
    hideClose: { type: Boolean, default: false },
  },
  emits: ['close'],
  data() {
    return {
      password: null,
      cardCopied: false,
      showBackTop: false,
      arbitr: '',
      arbitres: [],
      exportingDocx: false,
      refreshing: false,
      showArbitrCertificate: true,
      replaceAfpuWithSecondCategory: false,
    };
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll);
    this.$nextTick(() => this.restoreProtocolFromStorage());
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  computed: {
    ...mapState(useMainStore, ['currentTournament', 'user']),
    protocolTournamentMeta() {
      return getProtocolTournamentMeta(this.tournament, this.tournamentMeta, this.currentTournament);
    },
    tournamentPortalId() {
      return this.protocolTournamentMeta.portalIdTournament || '';
    },
    protocolStorageKey() {
      return `tir_protocol_${this.protocolTournamentMeta.id || this.tournamentName}`;
    },
    tournamentName() {
      return this.protocolTournamentMeta.name || this.tournament.name || '';
    },
    tournamentDate() {
      return this.protocolTournamentMeta.date || this.tournament.date || '';
    },
    participants() {
      return this.tournament.tirParticipants || [];
    },
    tirConfig() {
      return this.tournament.tirConfig || { junior: false, rounds: 1 };
    },
    isTwoRound() {
      return this.tirConfig.rounds === 2;
    },
    tiebreakerCount() {
      return this.tournament.tirTiebreakerCount || 0;
    },
    resultsColumnWidths() {
      return this.isTwoRound
        ? '690,3285,1905,2865,1305,645,645,960,1230,1155'
        : '690,3285,1905,2865,1305,960,1800,1830';
    },
    arbiterColumnWidths() {
      return this.showArbitrCertificate ? '960,3930,2085,1485,1440,1980' : '960,4380,2385,1785,2370';
    },
    qualificationRankedParticipants() {
      if (this.isTwoRound) {
        return rankByCombined(this.participants);
      }
      return rankWithTiebreakers(this.participants, 'scores', this.tiebreakerCount);
    },
    rankedParticipants() {
      const ranked = this.qualificationRankedParticipants;
      if (!this.playoff) return ranked;
      const places = this.playoffPlaces;
      return [...ranked].sort((a, b) => {
        const pa = this._placeNum(places[a.name]);
        const pb = this._placeNum(places[b.name]);
        return pa - pb;
      });
    },
    playoff() {
      return this.tournament.tirPlayoff;
    },
    playoffPlaces() {
      return getPlayoffPlaces(this.playoff);
    },
    playoffRounds() {
      return getTirPlayoffDisplayRounds(this.playoff, {
        final: 'Фінал',
        thirdPlace: 'Матч за 3-тє місце',
        semifinal: 'Півфінали',
        quarterfinal: '1/4 фіналу',
        eighthFinal: '1/8 фіналу',
        sixteenthFinal: '1/16 фіналу',
        round: 'Раунд',
        pending: 'Очікується',
      });
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
    getR1Score(p) {
      return getScoreTotal(p, 'scores');
    },
    getR2Score(p) {
      return getScoreTotal(p, 'scores2');
    },
    hasR2Scores(p) {
      return p.scores2 && Object.keys(p.scores2).length > 0;
    },
    getCombined(p) {
      return getCombinedTotal(p);
    },
    getQualificationPlace(participant) {
      const index = this.qualificationRankedParticipants.findIndex(
        (candidate) => candidate === participant || (participant.id != null && candidate.id === participant.id),
      );
      return index === -1 ? '—' : index + 1;
    },
    _placeNum(place) {
      if (place === undefined) return 9999;
      if (typeof place === 'number') return place;
      return parseInt(String(place).split('-')[0]) || 9999;
    },
    getPlace(index) {
      const name = this.rankedParticipants[index]?.name;
      if (!this.playoff) return index + 1;
      if (this.playoffPlaces[name] !== undefined) return this.playoffPlaces[name];
      return index + 1;
    },
    getParticipantProtocolName(participant) {
      return participant.protocolName || participant.name || '';
    },
    formatCoachName,
    getParticipantRegion(participant) {
      return regions[participant.club_id] || participant.city || '';
    },
    getParticipantSportTitle(participant) {
      return participant.sport_title === 'candidate' ? 'КМСУ' : participant.sport_title || '';
    },
    updateParticipantField(participant, field, event) {
      participant[field] = event.currentTarget.textContent.trim();
      if (field === 'city') participant.club_id = null;
      this.saveProtocolToStorage?.();
    },
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      const formatter = new Intl.DateTimeFormat('uk-UA', options);
      const parts = formatter.formatToParts(date);
      const day = parts.find((p) => p.type === 'day')?.value;
      const month = parts.find((p) => p.type === 'month')?.value;
      const year = parts.find((p) => p.type === 'year')?.value;
      return `${day} ${month} ${year} року`;
    },
    async refreshPlayersFromPortal() {
      if (this.refreshing) return;
      let portalId = this.tournamentPortalId;
      if (!portalId) {
        portalId = window.prompt('Введіть ID турніру на порталі (з URL: portal.petanque.org.ua/tournament/XXX)');
        if (!portalId) return;
      }

      this.refreshing = true;
      try {
        const stats = refreshTirParticipantDetails(this.participants, await fetchPortalTournamentTeams(portalId));
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
      } catch (error) {
        console.error('Refresh error:', error);
        this.showMessage({
          title: 'Помилка',
          text: `Не вдалося завантажити дані з порталу: ${error.message}`,
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
      const element = document.getElementById('protocol');
      if (!saved || !element) return;

      const template = document.createElement('template');
      template.innerHTML = saved;
      const savedProtocol = template.content;
      const arbitersHeading = [...savedProtocol.querySelectorAll('h3')].find((heading) =>
        heading.textContent.includes('Судді турніру'),
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
        restoreProtocolEditableHtml(savedProtocol, element);
      });
    },
    resetProtocol() {
      clearProtocolHtml(this.protocolStorageKey);
      location.reload();
    },
    removeDopyshit() {
      const element = document.getElementById('protocol');
      const count = removeProtocolMarkers(element);
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
      this.saveProtocolToStorage();
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
    copyCard() {
      navigator.clipboard.writeText('5353542324470856');
      this.cardCopied = true;
      this.showMessage({ title: 'Скопійовано', text: 'Номер картки скопійовано' });
      setTimeout(() => {
        this.cardCopied = false;
      }, 2000);
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
      const element = document.getElementById('protocol');
      await exportProtocolPdf(element, {
        html2pdf: {
          margin: [10, 10, 10, 10],
          filename: `${this.tournamentName}_protocol.pdf`,
          pagebreak: { mode: ['css', 'legacy'], before: '.docx-page-break', avoid: ['tr'] },
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, scrollY: 0, useCORS: true },
          jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' },
        },
      });
    },
    async exportDocx() {
      const element = document.getElementById('protocol');
      if (!element || this.exportingDocx) return;

      this.exportingDocx = true;
      try {
        await downloadProtocolDocx(element, this.tournamentName, {
          orientation: 'landscape',
          tableWidth: 14640,
          pageNumbers: true,
          borderColor: '000000',
          headerFill: 'FFFFFF',
          signatureFill: 'FFFFFF',
        });
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
  },
};
</script>

<style>
.tir-protocol-container #protocol {
  width: 297mm;
  min-width: 297mm;
  min-height: 210mm;
  box-sizing: border-box;
  padding: 10mm;
  margin-right: auto;
  margin-left: auto;
  background: #fff;
  border: 1px solid #c8c8c8;
  box-shadow: 0 2px 10px rgb(0 0 0 / 10%);
}

.tir-protocol-container #protocol.is-exporting {
  width: 277mm;
  min-width: 277mm;
  min-height: auto;
  padding: 0;
  border: 0;
  box-shadow: none;
}
</style>
