<template>
  <div class="tir-table">
    <div v-if="participants.length" class="tir-table__scroll">
      <table class="tir-table__content">
        <thead>
          <tr v-if="isTwoRoundSystem">
            <th class="tir-table__sticky-col">#</th>
            <th class="tir-table__sticky-col tir-table__sticky-col--name">{{ $t('tir.participant') }}</th>
            <th>{{ $t('tir.round1Score') }}</th>
            <th v-for="i in tiebreakerCount" :key="`exh${i}`">EX{{ i }}</th>
            <th v-if="currentRound >= 2">{{ $t('tir.round2Score') }}</th>
            <th v-if="currentRound >= 2">{{ $t('tir.combinedScore') }}</th>
            <th v-if="playoffHasQf">1/4</th>
            <th v-if="playoffHasSf">1/2</th>
            <th v-if="playoffHasFinal">{{ $t('games.final') }}</th>
            <th>{{ $t('tir.place') }}</th>
          </tr>
          <tr v-else>
            <th>#</th>
            <th>{{ $t('tir.participant') }}</th>
            <th>{{ $t('ranking.points') }}</th>
            <th>{{ $t('tir.throws') }}</th>
          </tr>
        </thead>
        <tbody v-if="isTwoRoundSystem">
          <tr v-for="(row, index) in rows" :key="row.id" :class="row.rowClass">
            <td class="tir-table__sticky-col">{{ index + 1 }}</td>
            <td
              class="tir-table__sticky-col tir-table__sticky-col--name tir-table__clickable"
              @click="$emit('open-participant', row.id)"
            >
              {{ row.name }}
            </td>
            <td :class="{ 'tir-table__muted': row.r1 === '—' }">{{ row.r1 }}</td>
            <td v-for="(score, scoreIndex) in row.tiebreakers" :key="`ex${scoreIndex + 1}`">{{ score }}</td>
            <td v-if="currentRound >= 2" :class="{ 'tir-table__muted': row.r2 === '—' }">{{ row.r2 }}</td>
            <td v-if="currentRound >= 2" :class="{ 'tir-table__muted': row.combined === '—' }">
              <strong>{{ row.combined }}</strong>
            </td>
            <td v-if="playoffHasQf">{{ row.qf }}</td>
            <td v-if="playoffHasSf">{{ row.sf }}</td>
            <td v-if="playoffHasFinal">{{ row.final }}</td>
            <td>{{ row.displayPlace }}</td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr
            v-for="(participant, index) in rankedParticipants"
            :key="participant.id"
            :class="{ 'tir-table__row--qualified': canStartPlayoff && index < qualifyCount }"
          >
            <td>{{ index + 1 }}</td>
            <td class="tir-table__clickable" @click="$emit('open-participant', participant.id)">
              {{ participant.name }}
            </td>
            <td>
              <strong>{{ getScoreTotal(participant, 'scores') }}</strong> / {{ maxTotalScore }}
            </td>
            <td>{{ getThrowCount(participant, 'scores') }} / {{ totalThrows }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="tir-table__empty">{{ $t('tir.noParticipants') }}</div>

    <div v-if="showTiebreaker" class="tir-tiebreaker">
      <div class="tir-tiebreaker__header">
        <h4 class="tir-tiebreaker__title">{{ $t('tir.tiebreaker') }} {{ tiebreakerDisplayNumber }}</h4>
        <p class="tir-tiebreaker__desc">{{ $t('tir.tiebreakerDesc') }}</p>
      </div>
      <div v-if="!isTiebreakerInProgress" class="tir-tiebreaker__actions">
        <button class="tir-table__playoff-btn" @click="$emit('start-tiebreaker')">
          {{ $t('tir.startTiebreaker') }}
        </button>
      </div>
      <div v-else-if="isTiebreakerRoundComplete" class="tir-tiebreaker__actions">
        <button class="tir-table__playoff-btn" @click="$emit('finish-tiebreaker')">
          {{ $t('tir.finishTiebreaker') }}
        </button>
      </div>
      <p v-else class="tir-tiebreaker__desc">{{ $t('tir.tiebreakerInProgress') }}</p>
    </div>

    <div v-if="canTransitionToRound2 && !hasPlayoff" class="tir-table__actions">
      <p class="tir-table__hint">{{ $t('tir.round2Hint') }}</p>
      <div class="tir-table__actions-row">
        <button class="tir-table__playoff-btn" @click="$emit('start-round-two')">
          {{ $t('tir.startRound2') }}
        </button>
      </div>
    </div>

    <div v-if="currentRound >= 2 && !hasPlayoff" class="tir-table__actions">
      <div class="tir-table__actions-row">
        <button class="tir-table__return-btn" @click="$emit('return-to-round-one')">
          {{ $t('tir.returnToRound1') }}
        </button>
      </div>
    </div>

    <div v-if="canStartPlayoff && !tournamentFinished && !hasPlayoff" class="tir-table__actions">
      <div v-if="!isTwoRoundSystem" class="tir-table__playoff-row">
        <span class="tir-table__playoff-label">{{ $t('tir.qualifiedForPlayoff') }}:</span>
        <div class="select">
          <select :value="qualifyCount" @change="$emit('update-qualify-count', Number($event.target.value))">
            <option v-for="value in qualifyOptions" :key="value" :value="value">{{ value }}</option>
          </select>
        </div>
      </div>
      <div class="tir-table__actions-row">
        <button class="tir-table__playoff-btn" @click="$emit('start-playoff')">{{ $t('tir.startPlayoff') }}</button>
        <span class="tir-table__actions-or">{{ $t('common.or') }}</span>
        <button class="tir-table__finish-btn" @click="$emit('finish')">
          {{ $t('teams.finishTournament') }}
        </button>
      </div>
    </div>
    <div
      v-else-if="!tournamentFinished && !hasPlayoff && participants.length && !canTransitionToRound2"
      class="tir-table__actions"
    >
      <div class="tir-table__actions-row">
        <button class="tir-table__finish-btn" @click="$emit('finish')">
          {{ $t('teams.finishTournament') }}
        </button>
      </div>
    </div>

    <div v-if="participants.length && tournamentStarted" class="tir-table__export">
      <button class="tir-table__export-btn" @click="$emit('export', 'csv')"><Download :size="14" />CSV</button>
      <button class="tir-table__export-btn" @click="$emit('export', 'json')"><Download :size="14" />JSON</button>
    </div>
  </div>
</template>

<script>
import { Download } from 'lucide-vue-next';
import { getScoreTotal, getThrowCount } from '@/services/tir';

export default {
  name: 'TirRoundTable',
  components: { Download },
  props: {
    participants: { type: Array, required: true },
    rows: { type: Array, required: true },
    rankedParticipants: { type: Array, required: true },
    isTwoRoundSystem: { type: Boolean, required: true },
    tiebreakerCount: { type: Number, default: 0 },
    currentRound: { type: Number, required: true },
    playoffHasQf: { type: Boolean, default: false },
    playoffHasSf: { type: Boolean, default: false },
    playoffHasFinal: { type: Boolean, default: false },
    canStartPlayoff: { type: Boolean, default: false },
    qualifyCount: { type: Number, required: true },
    qualifyOptions: { type: Array, required: true },
    maxTotalScore: { type: Number, required: true },
    totalThrows: { type: Number, required: true },
    showTiebreaker: { type: Boolean, default: false },
    tiebreakerDisplayNumber: { type: Number, default: 1 },
    isTiebreakerInProgress: { type: Boolean, default: false },
    isTiebreakerRoundComplete: { type: Boolean, default: false },
    canTransitionToRound2: { type: Boolean, default: false },
    hasPlayoff: { type: Boolean, default: false },
    tournamentFinished: { type: Boolean, default: false },
    tournamentStarted: { type: Boolean, default: false },
  },
  emits: [
    'open-participant',
    'start-tiebreaker',
    'finish-tiebreaker',
    'start-round-two',
    'return-to-round-one',
    'update-qualify-count',
    'start-playoff',
    'finish',
    'export',
  ],
  methods: { getScoreTotal, getThrowCount },
};
</script>

<style scoped>
.tir-table__content {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.tir-table__content th {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 2px solid var(--color-border);
  font-weight: 600;
  font-size: 12px;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.tir-table__content td {
  padding: 10px 8px;
  border-bottom: 1px solid var(--color-border-light);
  white-space: nowrap;
}

.tir-table__row--qualified td {
  background: var(--color-highlight);
}

.tir-table__row--direct td {
  background: var(--tir-row-direct-bg);
}

.tir-table__row--r2 td {
  background: var(--tir-row-r2-bg);
}

.tir-table__row--eliminated td {
  color: var(--color-text-muted);
}

td.tir-table__muted {
  color: var(--color-text-muted);
  font-weight: 400;
}

.tir-table__scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tir-table__sticky-col {
  position: sticky;
  left: 0;
  z-index: 2;
}

.tir-table__sticky-col--name {
  left: 32px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tir-table__clickable {
  cursor: pointer;
  font-weight: 500;
}

.tir-table__clickable:hover {
  text-decoration: underline;
}

.tir-table__content tr th.tir-table__sticky-col,
.tir-table__content tr td.tir-table__sticky-col {
  background-color: var(--color-surface);
  background-image: none;
}

.tir-table__content tr.tir-table__row--direct td.tir-table__sticky-col {
  background-color: var(--color-surface);
  background-image: linear-gradient(var(--tir-row-direct-bg), var(--tir-row-direct-bg));
}

.tir-table__content tr.tir-table__row--r2 td.tir-table__sticky-col {
  background-color: var(--color-surface);
  background-image: linear-gradient(var(--tir-row-r2-bg), var(--tir-row-r2-bg));
}

.tir-table__content tr.tir-table__row--eliminated td.tir-table__sticky-col {
  background-color: var(--color-surface);
  background-image: none;
}

.place-gold td {
  background: var(--color-badge-gold-bg) !important;
}

.place-silver td {
  background: var(--color-badge-silver-bg) !important;
}

.place-bronze td {
  background: var(--color-badge-bronze-bg) !important;
}

.place-gold td:first-child {
  border-left: 3px solid var(--color-badge-gold-border);
}

.place-gold td.tir-table__sticky-col {
  background-color: var(--color-surface) !important;
  background-image: linear-gradient(var(--color-badge-gold-bg), var(--color-badge-gold-bg)) !important;
}

.place-silver td:first-child {
  border-left: 3px solid var(--color-badge-silver-border);
}

.place-silver td.tir-table__sticky-col {
  background-color: var(--color-surface) !important;
  background-image: linear-gradient(var(--color-badge-silver-bg), var(--color-badge-silver-bg)) !important;
}

.place-bronze td:first-child {
  border-left: 3px solid var(--color-badge-bronze-border);
}

.place-bronze td.tir-table__sticky-col {
  background-color: var(--color-surface) !important;
  background-image: linear-gradient(var(--color-badge-bronze-bg), var(--color-badge-bronze-bg)) !important;
}

.tir-table__empty {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
}

.tir-table__actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.tir-table__hint {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 10px;
}

.tir-table__actions-or {
  font-size: 13px;
  color: var(--color-text-muted);
}

.tir-table__actions-row,
.tir-table__playoff-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tir-table__playoff-row {
  margin-bottom: 12px;
}

.tir-table__playoff-label {
  font-size: 14px;
  font-weight: 500;
}

.tir-table__playoff-btn {
  padding: 10px 20px;
  background: var(--tir-touche);
  color: var(--color-btn-text);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.tir-table__finish-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: var(--color-text-muted);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  color: var(--color-btn-text);
}

.tir-table__return-btn {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: none;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
  color: var(--color-text-muted);
}

.tir-table__export {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.tir-table__export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
  transition: background 0.15s;
}

.tir-table__export-btn:hover {
  background: var(--color-surface-alt);
}

.tir-tiebreaker {
  margin-top: 16px;
  padding: 16px;
  border: 2px solid var(--color-warning);
  border-radius: 12px;
  background: rgb(245 166 35 / 6%);
}

.tir-tiebreaker__header {
  margin-bottom: 12px;
}

.tir-tiebreaker__title {
  margin: 0 0 4px;
  font-size: 16px;
}

.tir-tiebreaker__desc {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
}

.tir-tiebreaker__actions {
  margin-top: 12px;
}
</style>
