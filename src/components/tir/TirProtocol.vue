<template>
  <div class="container protocol-container">
    <div class="protocol-gate" v-if="password !== 499">
      <div class="protocol-gate__card">
        <div class="protocol-gate__badge">
          <Star :size="14" />
          Платна опція
        </div>
        <p class="protocol-gate__desc">
          Ви отримуєте на 80% готовий протокол. Треба дописати тільки тренерів та трохи відформатувати текстовий
          документ.
        </p>
        <div class="protocol-gate__payment">
          <span class="protocol-gate__price">300 грн</span>
          <span class="protocol-gate__card-number">5353 5423 2447 0856</span>
          <button class="protocol-gate__copy" @click="copyCard" :title="cardCopied ? 'Скопійовано!' : 'Скопіювати'">
            <Copy v-if="!cardCopied" :size="18" />
            <Check v-else :size="18" />
          </button>
        </div>
        <div class="protocol-gate__contact">
          Після оплати пишіть у Telegram <strong>@andrewkamenev</strong> або дзвоніть
          <a href="tel:+380951804418"><strong>+38-095-180-44-18</strong></a>
        </div>
      </div>
      <div class="protocol-gate__password">
        <label class="protocol-gate__label" for="protocolPassword">Пароль</label>
        <input
          class="protocol-gate__input"
          id="protocolPassword"
          type="number"
          v-model="password"
          placeholder="Введіть пароль"
        />
      </div>
    </div>
    <div v-else>
      <div class="protocol-warning">
        <AlertTriangle :size="18" />
        <span
          >Протокол не є гарантовано вірним, може бути некоректна чи не вся інформація на порталі. Перевіряйте вручну,
          будь ласка!</span
        >
      </div>
      <div id="protocol" class="mb-3">
        <h2 class="text-center is-size-3 mb-2">
          Підсумковий протокол <br />
          {{ tournamentName }}
        </h2>
        <table class="table is-bordered">
          <tbody>
            <tr>
              <td>Дата початку змагань</td>
              <td contenteditable="plaintext-only">{{ formatDate(tournamentDate) || '-' }}</td>
            </tr>
            <tr>
              <td>Дата закінчення змагань</td>
              <td contenteditable="plaintext-only">{{ formatDate(tournamentDate) || '-' }}</td>
            </tr>
            <tr>
              <td>Місце/місто проведення</td>
              <td contenteditable="plaintext-only"></td>
            </tr>
            <tr>
              <td>Організатор</td>
              <td contenteditable="plaintext-only"></td>
            </tr>
            <tr>
              <td>Головний суддя</td>
              <td contenteditable="plaintext-only">{{ arbitr }}</td>
            </tr>
            <tr>
              <td>Дисципліна</td>
              <td>Тир</td>
            </tr>
            <tr>
              <td>Загальна кількість учасників</td>
              <td>{{ participants.length }}</td>
            </tr>
          </tbody>
        </table>
        <br />
        <h3 class="text-center is-size-4 mb-2">Результати відбіркових змагань</h3>
        <table class="table is-bordered">
          <thead>
            <tr class="has-text-centered">
              <th style="white-space: nowrap">№ з/п</th>
              <th>ПІП</th>
              <th>Місто/Регіон</th>
              <th>Тренер(и)</th>
              <th>Спортивний розряд/звання</th>
              <th>Рахунок R1</th>
              <th v-if="isTwoRound">Рахунок R2</th>
              <th v-if="isTwoRound">Сума</th>
              <th>Підсумкове місце</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, index) in rankedParticipants" :key="p.id">
              <td class="has-text-centered">{{ index + 1 }}</td>
              <td contenteditable="plaintext-only">{{ p.name }}</td>
              <td contenteditable="plaintext-only">{{ p.city || '' }}</td>
              <td contenteditable="plaintext-only"></td>
              <td contenteditable="plaintext-only"></td>
              <td class="has-text-centered">{{ getR1Score(p) }}</td>
              <td v-if="isTwoRound" class="has-text-centered">
                {{ hasR2Scores(p) ? getR2Score(p) : '—' }}
              </td>
              <td v-if="isTwoRound" class="has-text-centered has-text-weight-bold">
                {{ hasR2Scores(p) ? getCombined(p) : getR1Score(p) }}
              </td>
              <td class="has-text-centered">{{ getPlace(index) }}</td>
            </tr>
          </tbody>
        </table>

        <template v-if="playoff">
          <br />
          <h3 class="text-center is-size-4 mb-2">Результати ігор на виліт (плей-оф)</h3>
          <template v-for="(round, rIdx) in playoffRounds" :key="rIdx">
            <h4 class="is-size-5 mb-1">{{ round.title }}</h4>
            <table class="table is-bordered mb-3">
              <thead>
                <tr class="has-text-centered">
                  <th>Учасник 1</th>
                  <th>Рахунок</th>
                  <th>Учасник 2</th>
                  <th>Рахунок</th>
                  <th>Переможець</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(match, mIdx) in round.matches" :key="mIdx">
                  <td :class="{ 'has-text-weight-bold': match.winner === match.player1 }">
                    {{ match.player1 || '—' }}
                  </td>
                  <td class="has-text-centered">{{ match.score1 ?? '—' }}</td>
                  <td :class="{ 'has-text-weight-bold': match.winner === match.player2 }">
                    {{ match.player2 || '—' }}
                  </td>
                  <td class="has-text-centered">{{ match.score2 ?? '—' }}</td>
                  <td class="has-text-weight-bold">{{ match.winner || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </template>

        <br />
        <h3 class="text-center is-size-4 mb-2">Судді змагання</h3>
        <table class="table is-bordered">
          <thead class="has-text-centered">
            <tr>
              <th style="width: 40px">№ з/п</th>
              <th>Прізвище, ім'я, по батькові</th>
              <th style="width: 22%">Посада</th>
              <th style="width: 14%">Суддівська категорія</th>
              <th>№ посвідчення</th>
              <th>Регіон</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in arbitres" :key="index">
              <td>{{ index + 1 }}</td>
              <td
                contenteditable="plaintext-only"
                v-text="item.name"
                @blur="updateArbiterField(index, 'name', $event)"
              ></td>
              <td
                contenteditable="plaintext-only"
                v-text="item.role"
                @blur="updateArbiterField(index, 'role', $event)"
              ></td>
              <td
                contenteditable="plaintext-only"
                v-text="item.category"
                @blur="updateArbiterField(index, 'category', $event)"
              ></td>
              <td
                contenteditable="plaintext-only"
                v-text="item.certificate"
                @blur="updateArbiterField(index, 'certificate', $event)"
              ></td>
              <td
                contenteditable="plaintext-only"
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
                <td class="has-text-right" contenteditable="plaintext-only"></td>
              </tr>
              <tr>
                <td>Суддя</td>
                <td class="has-text-centered">
                  ___________________ <br />
                  (підпис)
                </td>
                <td class="has-text-right" contenteditable="plaintext-only"></td>
              </tr>
              <tr>
                <td>Головний секретар змагань</td>
                <td class="has-text-centered">
                  ___________________ <br />
                  (підпис)
                </td>
                <td class="has-text-right" contenteditable="plaintext-only"></td>
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
      <div class="protocol-actions">
        <div class="protocol-actions__row">
          <ProtocolArbiterControls
            :user-id="user?.uid"
            :current-arbiters="arbitres"
            :tournament-name="tournamentName"
            @add="addArbitr"
            @apply-selection="applyArbiterSelection"
            @apply-preset="applyArbiterPreset"
          />
        </div>
        <div class="protocol-actions__row">
          <button class="protocol-actions__btn protocol-actions__btn--outline" @click="$emit('close')">
            {{ $t('common.close') }}
          </button>
          <button class="protocol-actions__btn protocol-actions__btn--primary" @click="exportPdf">
            <FileDown :size="16" /> {{ $t('teams.exportPdf') }}
          </button>
          <button
            class="protocol-actions__btn protocol-actions__btn--primary"
            :disabled="exportingDocx"
            @click="exportDocx"
          >
            <FileText :size="16" /> {{ exportingDocx ? '...' : $t('teams.exportDocx') }}
          </button>
          <button class="protocol-actions__btn protocol-actions__btn--primary" @click="copyProtocol">
            <Copy :size="16" /> {{ $t('teams.copyProtocol') }}
          </button>
        </div>
      </div>
    </div>
    <button class="protocol-back-top" @click="scrollToggle">
      <ChevronUp :size="20" :class="{ 'protocol-back-top__icon--down': !showBackTop }" />
    </button>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia';
import { useMainStore } from '@/stores/main';
import { downloadProtocolDocx } from '@/services/protocol-docx';
import ProtocolArbiterControls from '@/components/partials/ProtocolArbiterControls';
import {
  getScoreTotal,
  getScoreCarreauCount,
  rankWithTiebreakers,
  getCombinedTotal,
  getPlayoffPlaces,
} from '@/services/tir';
import { Star, Copy, Check, AlertTriangle, FileDown, FileText, ChevronUp } from 'lucide-vue-next';

export default {
  name: 'TirProtocol',
  components: { Star, Copy, Check, AlertTriangle, ProtocolArbiterControls, FileDown, FileText, ChevronUp },
  props: ['tournament'],
  emits: ['close'],
  data() {
    return {
      password: null,
      cardCopied: false,
      showBackTop: false,
      arbitr: '',
      arbitres: [],
      exportingDocx: false,
    };
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  computed: {
    ...mapState(useMainStore, ['currentTournament', 'user']),
    tournamentName() {
      return this.currentTournament?.name || this.tournament.name;
    },
    tournamentDate() {
      return this.currentTournament?.date || this.tournament.date;
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
    rankedParticipants() {
      let ranked;
      if (this.isTwoRound) {
        ranked = [...this.participants].sort(
          (a, b) =>
            getCombinedTotal(b) - getCombinedTotal(a) ||
            getScoreCarreauCount(b, 'scores') +
              getScoreCarreauCount(b, 'scores2') -
              (getScoreCarreauCount(a, 'scores') + getScoreCarreauCount(a, 'scores2')),
        );
      } else {
        ranked = rankWithTiebreakers(this.participants, 'scores', this.tiebreakerCount);
      }
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
      if (!this.playoff) return [];
      const rounds = [];
      if (this.playoff.rounds?.length) {
        this.playoff.rounds.forEach((round) => {
          const count = round.matches.length;
          let title = 'Раунд';
          if (count === 4) title = 'Чвертьфінал';
          else if (count === 2) title = 'Півфінал';
          else if (count === 8) title = '1/8 фіналу';
          rounds.push({ title, matches: round.matches });
        });
      }
      if (this.playoff.thirdPlace) {
        rounds.push({ title: 'Матч за 3-тє місце', matches: [this.playoff.thirdPlace] });
      }
      if (this.playoff.final) {
        rounds.push({ title: 'Фінал', matches: [this.playoff.final] });
      }
      return rounds;
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
    addArbitr(arbiter) {
      this.arbitres.push(arbiter);
      if (arbiter.role === 'Головний Арбітр') this.arbitr = arbiter.name;
    },
    applyArbiterSelection(arbiters) {
      this.arbitres = arbiters;
      this.arbitr = arbiters.find((arbiter) => arbiter.role === 'Головний Арбітр')?.name || '';
    },
    applyArbiterPreset(arbiters) {
      this.arbitres = arbiters;
      this.arbitr = arbiters.find((arbiter) => arbiter.role === 'Головний Арбітр')?.name || '';
    },
    updateArbiterField(index, field, event) {
      this.arbitres[index][field] = event.currentTarget.textContent.trim();
      if (field === 'name' || field === 'role') {
        this.arbitr = this.arbitres.find((arbiter) => arbiter.role === 'Головний Арбітр')?.name || '';
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
    copyProtocol() {
      const element = document.getElementById('protocol');
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      try {
        const successful = document.execCommand('copy');
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
      selection.removeAllRanges();
    },
    async exportPdf() {
      const { default: html2pdf } = await import('html2pdf.js');
      html2pdf(document.getElementById('protocol'), {
        margin: 1,
        filename: `${this.tournamentName}_protocol.pdf`,
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
  },
};
</script>
