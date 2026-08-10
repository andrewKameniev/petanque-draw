<template>
  <div>
    <div class="ranking-header mb-4" v-if="hasRankingSubtabs">
      <div class="round-tabs ranking-subtabs">
        <button
          v-if="tournament.tournamentIsFinished"
          type="button"
          class="button is-small mr-1 mb-1"
          :class="{ 'is-purple': rankingSubtab === 'result' }"
          :aria-pressed="rankingSubtab === 'result'"
          @click="rankingSubtab = 'result'"
        >
          {{ $t('ranking.tournamentResult') }}
        </button>
        <button
          type="button"
          class="button is-small mr-1 mb-1"
          :class="{ 'is-purple': rankingSubtab === 'swiss' }"
          :aria-pressed="rankingSubtab === 'swiss'"
          @click="rankingSubtab = 'swiss'"
        >
          {{ $t(rankingTableLabel) }}
        </button>
        <button
          v-if="tournament.system === 'swiss' && tournament.barrage"
          type="button"
          class="button is-small mr-1 mb-1"
          :class="{ 'is-purple': rankingSubtab === 'barrage' }"
          :aria-pressed="rankingSubtab === 'barrage'"
          @click="rankingSubtab = 'barrage'"
        >
          {{ $t('games.poulesBarrage') }}
        </button>
      </div>
      <div
        v-if="
          canUseResultActions && !readOnly && tournament.tournamentIsFinished && !isRankingTableOnly && !isBarrageOnly
        "
        class="ranking-header__actions"
      >
        <button
          v-if="isTournamentOrg && portalIdTournament"
          class="button is-small btn-purple-outline"
          @click="showExportConfirm = true"
        >
          <Upload :size="18" />
          <span class="is-hidden-mobile">{{ $t('ranking.exportResults') }}</span>
        </button>
        <button
          class="button is-small btn-purple-outline"
          :class="{ 'btn-purple-outline--copied': resultsCopied }"
          @click="copyResults"
        >
          <template v-if="resultsCopied">
            <Check :size="18" />
          </template>
          <template v-else>
            <Copy :size="18" class="is-hidden-mobile" />
            <span class="is-hidden-mobile">{{ $t('ranking.copyResults') }}</span>
            <Copy class="is-hidden-tablet" :size="20" />
          </template>
        </button>
      </div>
    </div>
    <div v-if="tournament.tournamentIsFinished && !isRankingTableOnly && !isBarrageOnly" class="mb-5">
      <div
        v-if="
          !hasRankingSubtabs &&
          canUseResultActions &&
          !isForProtocol &&
          !readOnly &&
          !(tournament.system === 'swiss' && !showInSaved)
        "
        class="ranking-header"
      >
        <div class="ranking-header__actions ml-auto">
          <button
            v-if="isTournamentOrg && portalIdTournament"
            class="button is-small btn-purple-outline"
            @click="showExportConfirm = true"
          >
            <Upload :size="18" />
            <span class="is-hidden-mobile">{{ $t('ranking.exportResults') }}</span>
          </button>
          <button
            class="button is-small btn-purple-outline"
            :class="{ 'btn-purple-outline--copied': resultsCopied }"
            @click="copyResults"
          >
            <template v-if="resultsCopied">
              <Check :size="18" />
            </template>
            <template v-else>
              <Copy :size="18" class="is-hidden-mobile" />
              <span class="is-hidden-mobile">{{ $t('ranking.copyResults') }}</span>
              <Copy class="is-hidden-tablet" :size="20" />
            </template>
          </button>
        </div>
      </div>
      <div v-if="!isForProtocol" class="table-container">
        <table id="table-finish-ranking" class="table">
          <thead>
            <tr>
              <th>{{ $t('ranking.place') }}</th>
              <th>{{ isTetATet ? $t('ranking.player') : $t('ranking.team') }}</th>
              <th>{{ isTetATet ? $t('ranking.club') : $t('ranking.players') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(team, index) in showInSaved ? tournament.ranking : tournamentRanking"
              :key="index"
              :class="{
                'place-gold': team.place == 1,
                'place-silver': team.place == 2,
                'place-bronze': team.place == 3,
              }"
            >
              <td>{{ team.place }}</td>
              <td>{{ team.title }}</td>
              <td>
                <template v-if="isTetATet">{{ resolvedClubMap[team.title] || '–' }}</template>
                <div
                  v-else-if="
                    showInSaved ? team.players && team.players.length : team.title && getTeamPlayers(team.title).length
                  "
                  class="is-size-7"
                >
                  <span
                    class="has-text-dark"
                    v-for="(player, pIdx) in showInSaved ? team.players : getTeamPlayers(team.title)"
                    :key="pIdx"
                    >{{ player.name }} {{ player.surname || ''
                    }}<span v-if="pIdx < (showInSaved ? team.players : getTeamPlayers(team.title)).length - 1"
                      >,
                    </span></span
                  >
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-if="tournament.games?.length && rankingTeams && !isResultOnly">
      <div
        v-if="
          tournament.barrage &&
          activeRound > tournament.barrage.startIndex &&
          !tournament.playOff &&
          !tournament.tournamentIsFinished &&
          rankingSubtab !== 'swiss'
        "
      >
        <div v-for="(group, gIndex) in rankingTeams" :key="gIndex">
          <h4 v-if="tournament.barrage.groups.length > 1">{{ $t('common.group') }} {{ groupsNames[gIndex] }}</h4>
          <div class="table-container mb-5">
            <table class="table table is-striped">
              <thead>
                <tr>
                  <th>{{ $t('ranking.place') }}</th>
                  <th>{{ $t('ranking.team') }}</th>
                  <th align="center">
                    <span class="is-hidden-mobile">{{ $t('ranking.wins') }}</span>
                    <span class="is-hidden-tablet">{{ $t('ranking.winsMobile') }}</span>
                  </th>
                  <th align="center">
                    <span class="is-hidden-mobile">{{ $t('ranking.points') }}</span>
                    <span class="is-hidden-tablet">{{ $t('ranking.pointsMobile') }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(team, index) in group"
                  :key="index"
                  :class="{
                    'playoff-highlight': tournament.playOff && index < getQualifiedForGroup(gIndex),
                    'search-highlight': isTeamHighlighted(team.title),
                  }"
                >
                  <td>{{ index + 1 }}</td>
                  <td>{{ team.title }}</td>
                  <td align="center" class="td-highlight">{{ team.wins }}</td>
                  <td align="center" class="nowrap">{{ team.pointsPlus }} : {{ team.pointsMinus }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div v-else-if="isBarrageOnly">
        <div v-for="(group, gIndex) in barrageRankingTeams" :key="'b' + gIndex">
          <h4 v-if="tournament.barrage.groups.length > 1">{{ $t('common.group') }} {{ groupsNames[gIndex] }}</h4>
          <div class="table-container mb-5">
            <table class="table table is-striped">
              <thead>
                <tr>
                  <th>{{ $t('ranking.place') }}</th>
                  <th>{{ $t('ranking.team') }}</th>
                  <th v-for="(col, colIndex) in group" :key="colIndex" align="center">
                    {{ colIndex + 1 }}
                  </th>
                  <th align="center">
                    <span class="is-hidden-mobile">{{ $t('ranking.wins') }}</span>
                    <span class="is-hidden-tablet">{{ $t('ranking.winsMobile') }}</span>
                  </th>
                  <th align="center">
                    <span class="is-hidden-mobile">{{ $t('ranking.points') }}</span>
                    <span class="is-hidden-tablet">{{ $t('ranking.pointsMobile') }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(team, index) in group" :key="index" :class="{ 'playoff-highlight': team.wins >= 2 }">
                  <td>{{ index + 1 }}</td>
                  <td>{{ team.title }}</td>
                  <td v-for="(opponent, oi) in group" :key="oi" align="center" class="no-wrap group-cell">
                    <template v-if="team.title === opponent.title">-</template>
                    <template v-else>
                      <div
                        v-for="(result, ri) in getBarrageGameResults(team.title, opponent.title)"
                        :key="ri"
                        :class="{
                          'group-cell--win': result.diff > 0,
                          'group-cell--lose': result.diff < 0,
                        }"
                      >
                        {{ result.text }}
                      </div>
                    </template>
                  </td>
                  <td align="center" class="td-highlight">{{ team.wins }}</td>
                  <td align="center" class="nowrap">{{ team.pointsPlus }} : {{ team.pointsMinus }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div v-else-if="(!tournament.system || tournament.system === 'swiss') && !tournament.groups">
        <div v-if="!isForProtocol && activeRound > 1 && !tournament.playOff" class="has-text-grey is-size-7 mb-2">
          {{ $t('ranking.roundsPlayed') }}: {{ activeRound - 1 }}
        </div>
        <template v-if="isForProtocol">
          <div v-for="(chunk, ci) in rankingChunks" :key="'rc' + ci" class="pdf-page-break">
            <h3 v-if="ci === 0 && sectionTitle" class="text-center is-size-4 mb-2" v-html="sectionTitle"></h3>
            <table
              :id="ci === 0 ? 'table-ranking' : undefined"
              class="table is-bordered ranking-chunk protocol-swiss-ranking-table"
            >
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ $t('ranking.team') }}</th>
                  <th align="center">{{ $t('ranking.games') }}</th>
                  <th align="center">{{ $t('ranking.wins') }}</th>
                  <th align="center">{{ $t('ranking.buh') }}</th>
                  <th align="center">{{ $t('ranking.sbuh') }}</th>
                  <th align="center">{{ $t('ranking.points') }}</th>
                  <th v-if="tournament.useRating" align="center">{{ $t('ranking.rating') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(team, index) in chunk"
                  :key="team.title"
                  :class="{
                    'place-gold': index === 0 && ci === 0,
                    'place-silver': index === 1 && ci === 0,
                    'place-bronze': index === 2 && ci === 0,
                  }"
                >
                  <td>{{ ci * rankingChunkSize + index + 1 }}</td>
                  <td>{{ teamTitles[team.title] }}</td>
                  <td align="center">{{ team.gamesPlayed }}</td>
                  <td align="center" class="td-highlight">{{ team.wins }}</td>
                  <td align="center">{{ team.buhgolts }}</td>
                  <td align="center">{{ team.smallBuhgolts }}</td>
                  <td align="center" class="nowrap">{{ team.pointsPlus }} : {{ team.pointsMinus }}</td>
                  <td v-if="tournament.useRating" align="center">
                    <span class="rating-badge">{{ team.rating }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <div v-else class="table-container" :style="activeTooltip ? 'overflow: visible' : ''">
          <table id="table-ranking" class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ $t('ranking.team') }}</th>
                <th align="center">
                  <span class="is-hidden-mobile">{{ $t('ranking.games') }}</span>
                  <span class="is-hidden-tablet">{{ $t('ranking.gamesMobile') }}</span>
                </th>
                <th align="center">
                  <span class="is-hidden-mobile">{{ $t('ranking.wins') }}</span>
                  <span class="is-hidden-tablet">{{ $t('ranking.winsMobile') }}</span>
                </th>
                <th align="center" class="has-tooltip" @click="activeTooltip = activeTooltip === 'buh' ? null : 'buh'">
                  <span class="is-hidden-mobile">{{ $t('ranking.buh') }}</span>
                  <span class="is-hidden-tablet">{{ $t('ranking.buhMobile') }}</span>
                  <div v-if="activeTooltip === 'buh'" class="ranking-tooltip">
                    {{ $t('ranking.buhTooltip') }}
                  </div>
                </th>
                <th
                  align="center"
                  class="has-tooltip"
                  @click="activeTooltip = activeTooltip === 'sbuh' ? null : 'sbuh'"
                >
                  <span class="is-hidden-mobile">{{ $t('ranking.sbuh') }}</span>
                  <span class="is-hidden-tablet">{{ $t('ranking.sbuhMobile') }}</span>
                  <div v-if="activeTooltip === 'sbuh'" class="ranking-tooltip">
                    {{ $t('ranking.sbuhTooltip') }}
                  </div>
                </th>
                <th
                  align="center"
                  class="has-tooltip"
                  @click="activeTooltip = activeTooltip === 'points' ? null : 'points'"
                >
                  <span class="is-hidden-mobile">{{ $t('ranking.points') }}</span>
                  <span class="is-hidden-tablet">{{ $t('ranking.pointsMobile') }}</span>
                  <div v-if="activeTooltip === 'points'" class="ranking-tooltip ranking-tooltip-right">
                    {{ $t('ranking.pointsTooltip') }}
                  </div>
                </th>
                <th v-if="tournament.useRating" align="center">
                  <span class="is-hidden-mobile">{{ $t('ranking.rating') }}</span>
                  <span class="is-hidden-tablet">{{ $t('ranking.ratingMobile') }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(team, index) in effectiveRankingTeams"
                :key="team.title"
                :class="{
                  'playoff-highlight': isPrizeHighlighted(index),
                  'place-gold': !tournament.playOff && tournament.tournamentIsFinished && index === 0,
                  'place-silver': !tournament.playOff && tournament.tournamentIsFinished && index === 1,
                  'place-bronze': !tournament.playOff && tournament.tournamentIsFinished && index === 2,
                  'search-highlight': isTeamHighlighted(team.title),
                  'team-withdrawn': team.withdrawn,
                }"
              >
                <td><span class="team-count"></span></td>
                <td>
                  <span :class="{ 'text-line-through': team.withdrawn }">{{ team.title }}</span>
                  <span v-if="team.withdrawn" class="withdrawn-badge">{{ $t('ranking.withdrawn') }}</span>
                </td>
                <td align="center">{{ team.gamesPlayed }}</td>
                <td align="center" class="td-highlight">{{ team.wins }}</td>
                <td align="center">{{ team.buhgolts }}</td>
                <td align="center">{{ team.smallBuhgolts }}</td>
                <td align="center" class="nowrap">{{ team.pointsPlus }} : {{ team.pointsMinus }}</td>
                <td v-if="tournament.useRating" align="center">
                  <span class="rating-badge">{{ team.rating }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else-if="tournament.system === 'supermele'">
        <div class="table-container">
          <table id="table-ranking" class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ $t('ranking.player') }}</th>
                <th align="center">
                  <span class="is-hidden-mobile">{{ $t('ranking.wins') }}</span>
                  <span class="is-hidden-tablet">{{ $t('ranking.winsMobile') }}</span>
                </th>
                <th align="center">
                  <span class="is-hidden-mobile">{{ $t('ranking.difference') }}</span>
                  <span class="is-hidden-tablet">{{ $t('ranking.differenceMobile') }}</span>
                </th>
                <th align="center">
                  <span class="is-hidden-mobile">{{ $t('ranking.points') }}</span>
                  <span class="is-hidden-tablet">{{ $t('ranking.pointsMobile') }}</span>
                </th>
                <th v-if="tournament.useRating" align="center">
                  <span class="is-hidden-mobile">{{ $t('ranking.rating') }}</span>
                  <span class="is-hidden-tablet">{{ $t('ranking.ratingMobile') }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(team, index) in effectiveRankingTeams"
                :key="team.title"
                :class="{
                  'playoff-highlight': isPrizeHighlighted(index),
                  'place-gold': tournament.tournamentIsFinished && index === 0,
                  'place-silver': tournament.tournamentIsFinished && index === 1,
                  'place-bronze': tournament.tournamentIsFinished && index === 2,
                  'search-highlight': isTeamHighlighted(team.title),
                }"
              >
                <td><span class="team-count"></span></td>
                <td>{{ team.title }}</td>
                <td align="center" class="td-highlight">{{ team.wins }}</td>
                <td align="center" class="td-highlight">
                  {{ team.pointsPlus - team.pointsMinus > 0 ? '+' : '' }}{{ team.pointsPlus - team.pointsMinus }}
                </td>
                <td align="center" class="nowrap">{{ team.pointsPlus }} : {{ team.pointsMinus }}</td>
                <td v-if="tournament.useRating" align="center">
                  <span class="rating-badge">{{ team.rating }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else-if="tournament.groups">
        <div
          v-if="!isForProtocol && activeRound > 1 && !tournament.playOff && tournament.roundRobinCircle > 1"
          class="has-text-grey is-size-7 mb-2"
        >
          {{ $t('games.circlesPlayed') }}: {{ tournament.roundRobinCircle }}
        </div>
        <div v-if="tournament.groups.length > 1 && !isForProtocol" class="group-tabs mb-4">
          <button
            v-for="(group, gIndex) in rankingTeams"
            :key="gIndex"
            class="group-tabs__btn"
            :class="{ 'group-tabs__btn--active': activeGroupTab === gIndex }"
            @click="activeGroupTab = gIndex"
          >
            {{ $t('common.group') }} {{ groupsNames[gIndex] }}
          </button>
        </div>
        <div
          v-for="(group, gIndex) in rankingTeams"
          v-show="isForProtocol || tournament.groups.length === 1 || activeGroupTab === gIndex"
          :key="gIndex"
          class="group-ranking-table"
        >
          <h4 v-if="isForProtocol && tournament.groups.length > 1">
            {{ $t('common.group') }} {{ groupsNames[gIndex] }}
          </h4>
          <!-- Swiss format: buchholz table -->
          <div v-if="isSwissGroups" class="table-container mb-5">
            <table class="table is-striped" :class="{ 'protocol-swiss-ranking-table': isForProtocol }">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ $t('ranking.team') }}</th>
                  <th align="center">
                    <span class="is-hidden-mobile">{{ $t('ranking.wins') }}</span>
                    <span class="is-hidden-tablet">{{ $t('ranking.winsMobile') }}</span>
                  </th>
                  <th align="center">
                    <span class="is-hidden-mobile">{{ $t('ranking.buh') }}</span>
                    <span class="is-hidden-tablet">{{ $t('ranking.buhMobile') }}</span>
                  </th>
                  <th align="center">
                    <span class="is-hidden-mobile">{{ $t('ranking.sbuh') }}</span>
                    <span class="is-hidden-tablet">{{ $t('ranking.sbuhMobile') }}</span>
                  </th>
                  <th align="center">
                    <span class="is-hidden-mobile">{{ $t('ranking.points') }}</span>
                    <span class="is-hidden-tablet">{{ $t('ranking.pointsMobile') }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(team, index) in group"
                  :key="team.title"
                  :class="{
                    'playoff-highlight': tournament.preferences?.playOffEnabled && index < playOffTeamsPerGroup,
                    'place-gold': !tournament.playOff && tournament.tournamentIsFinished && index === 0,
                    'place-silver': !tournament.playOff && tournament.tournamentIsFinished && index === 1,
                    'place-bronze': !tournament.playOff && tournament.tournamentIsFinished && index === 2,
                    'search-highlight': isTeamHighlighted(team.title),
                  }"
                >
                  <td>{{ index + 1 }}</td>
                  <td>{{ isForProtocol ? teamTitles[team.title] : team.title }}</td>
                  <td align="center" class="td-highlight">{{ team.wins }}</td>
                  <td align="center">{{ team.buhgolts }}</td>
                  <td align="center">{{ team.smallBuhgolts }}</td>
                  <td align="center" class="nowrap">{{ team.pointsPlus }} : {{ team.pointsMinus }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Round-robin format: head-to-head matrix -->
          <div v-else class="table-container mb-5">
            <table class="table table is-striped">
              <thead>
                <tr>
                  <th>{{ $t('ranking.place') }}</th>
                  <th>{{ $t('ranking.team') }}</th>
                  <th v-for="(col, colIndex) in group" :key="colIndex" align="center">
                    {{ colIndex + 1 }}
                  </th>
                  <th align="center">
                    <span class="is-hidden-mobile">{{ $t('ranking.wins') }}</span>
                    <span class="is-hidden-tablet">{{ $t('ranking.winsMobile') }}</span>
                  </th>
                  <th align="center">
                    <span class="is-hidden-mobile">{{ $t('ranking.points') }}</span>
                    <span class="is-hidden-tablet">{{ $t('ranking.pointsMobile') }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(team, index) in group"
                  :key="index"
                  :class="{
                    'playoff-highlight':
                      (tournament.playOff || tournament.preferences?.playOffEnabled) &&
                      index < getQualifiedForGroup(gIndex),
                    'place-gold': !tournament.playOff && tournament.tournamentIsFinished && index === 0,
                    'place-silver': !tournament.playOff && tournament.tournamentIsFinished && index === 1,
                    'place-bronze': !tournament.playOff && tournament.tournamentIsFinished && index === 2,
                    'search-highlight': isTeamHighlighted(team.title),
                  }"
                >
                  <td>{{ index + 1 }}</td>
                  <td>{{ isForProtocol ? teamTitles[team.title] : team.title }}</td>
                  <td
                    v-for="(opponent, indexOpponent) in group"
                    :key="indexOpponent"
                    align="center"
                    class="no-wrap group-cell"
                  >
                    <template v-if="team.title === opponent.title"><span class="group-cell--muted">-</span></template>
                    <template v-else>
                      <div
                        v-for="(result, ri) in getGameResults(team.title, opponent.title)"
                        :key="ri"
                        :class="{
                          'group-cell--win': result.diff > 0 && !result.inProgress,
                          'group-cell--lose': result.diff < 0 && !result.inProgress,
                          'group-cell--in-progress': result.inProgress,
                          'group-cell--muted': result.pending,
                        }"
                      >
                        {{ result.text }}
                      </div>
                    </template>
                  </td>
                  <td align="center" class="td-highlight">{{ team.wins }}</td>
                  <td align="center" class="nowrap">{{ team.pointsPlus }} : {{ team.pointsMinus }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="!tournament.tournamentIsFinished && !isResultOnly && !isRankingTableOnly" class="ranking-empty">
      <Trophy :size="40" class="ranking-empty__icon" />
      <p class="ranking-empty__text">{{ $t('ranking.noRanking') }}</p>
    </div>
    <Modal v-if="showExportConfirm" @close-modal="showExportConfirm = false">
      <div class="confirm-export">
        <p class="confirm-export__text">{{ $t('ranking.exportConfirm') }}</p>
        <div class="confirm-export__actions">
          <button class="confirm-export__btn confirm-export__btn--cancel" @click="showExportConfirm = false">
            {{ $t('common.cancel') }}
          </button>
          <button
            class="confirm-export__btn confirm-export__btn--confirm"
            @click="
              showExportConfirm = false;
              exportResults();
            "
          >
            {{ $t('ranking.exportResults') }}
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import {
  tournamentNames,
  getGameResultInGroup,
  getTournamentRanking,
  copyContent,
  sortSwissWithLiveStats,
} from '@/helpers';
import { getQualifiedCountForGroup, getPlayOffTeamsPerGroup } from '@/services/results';
import { rankBarrageGroups } from '@/services/group-ranking';
import { Copy, Check, Upload, Trophy } from 'lucide-vue-next';
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { tournamentOrgsService } from '@/services/db';
import Modal from '@/components/Modal';

const RESULT_ACTION_EMAILS = new Set(['ancam1987@gmail.com', 'nemo15.alex@gmail.com']);

export default {
  name: 'Ranking',
  components: { Copy, Check, Upload, Trophy, Modal },
  props: [
    'tournament',
    'rankingTeams',
    'activeRound',
    'showInSaved',
    'isForProtocol',
    'readOnly',
    'teamTitles',
    'highlightedTeam',
    'teamClubMap',
    'sectionTitle',
  ],
  emits: ['is-playoff'],
  data() {
    return {
      playOffBracket: localStorage.getItem('playOffBracket')
        ? JSON.parse(localStorage.getItem('playOffBracket'))
        : null,
      activeTooltip: null,
      rankingSubtab: 'result',
      resultsCopied: false,
      isTournamentOrg: false,
      showExportConfirm: false,
      activeGroupTab: 0,
    };
  },
  created() {
    if (this.isForProtocol) {
      this.rankingSubtab = 'swiss';
    } else if (this.hasActiveBarrage) {
      this.rankingSubtab = 'barrage';
    }
  },
  async mounted() {
    this._onClickOutside = (e) => {
      if (this.activeTooltip && !e.target.closest('.has-tooltip')) {
        this.activeTooltip = null;
      }
    };
    document.addEventListener('click', this._onClickOutside);
    if (!this.readOnly && this.canUseResultActions && this.user?.email) {
      const snapshot = await tournamentOrgsService.check(this.user.email);
      this.isTournamentOrg = snapshot.exists();
    }
  },
  beforeUnmount() {
    document.removeEventListener('click', this._onClickOutside);
  },
  methods: {
    ...mapActions(useMainStore, ['showMessage']),
    isPrizeHighlighted(index) {
      const prefs = this.tournament.preferences;
      if ((prefs?.playOffEnabled || this.tournament.playOff) && index < prefs?.playOffTeams) return true;
      if (!prefs?.playOffEnabled && !this.tournament.playOff && prefs?.prizePlaces && index < prefs.prizePlaces)
        return true;
      return false;
    },
    getQualifiedForGroup(gIndex) {
      return getQualifiedCountForGroup(this.tournament, this.rankingTeams, gIndex);
    },
    isTeamHighlighted(title) {
      if (!this.highlightedTeam) return false;
      if (this.highlightedTeam === title) return true;
      return this.resolvedClubMap[title] === this.highlightedTeam;
    },
    getGameResultInGroup: getGameResultInGroup,
    getGameResults(team, opponent) {
      const results = [];
      const playedRounds = this.tournament.games?.length || 0;
      const lastRoundActive = this.tournament.roundIsActive;
      if (this.tournament.groupSchedule) {
        this.tournament.groupSchedule.forEach((round, roundIndex) => {
          round.forEach((game) => {
            if (
              (game.team_1 === team && game.team_2 === opponent) ||
              (game.team_2 === team && game.team_1 === opponent)
            ) {
              if (roundIndex < playedRounds) {
                const playedGame = this.tournament.games[roundIndex].find(
                  (g) => (g.team_1 === team && g.team_2 === opponent) || (g.team_2 === team && g.team_1 === opponent),
                );
                if (
                  playedGame &&
                  (playedGame.status === 'in_progress' ||
                    playedGame.status === 'finished' ||
                    (playedGame.team_1_score != null && playedGame.team_2_score != null))
                ) {
                  const isFirst = playedGame.team_1 === team && playedGame.team_2 === opponent;
                  const s1 = isFirst ? (playedGame.team_1_score ?? 0) : (playedGame.team_2_score ?? 0);
                  const s2 = isFirst ? (playedGame.team_2_score ?? 0) : (playedGame.team_1_score ?? 0);
                  const isCurrentRound = roundIndex === playedRounds - 1 && lastRoundActive;
                  const inProgress = isCurrentRound && playedGame.status === 'in_progress';
                  results.push({ text: `${s1} : ${s2}`, diff: s1 - s2, inProgress });
                } else {
                  results.push({ text: '-- : --', diff: 0, pending: true });
                }
              } else {
                results.push({ text: `R${roundIndex + 1}`, diff: 0, pending: true });
              }
            }
          });
        });
        // Include extra-circle rounds beyond the original schedule
        const scheduleLength = this.tournament.groupSchedule.length;
        if (playedRounds > scheduleLength) {
          for (let i = scheduleLength; i < playedRounds; i++) {
            this.tournament.games[i].forEach((game) => {
              if (
                (game.team_1 === team && game.team_2 === opponent) ||
                (game.team_2 === team && game.team_1 === opponent)
              ) {
                const isFirst = game.team_1 === team && game.team_2 === opponent;
                if (
                  game.status === 'in_progress' ||
                  game.status === 'finished' ||
                  (game.team_1_score != null && game.team_2_score != null)
                ) {
                  const s1 = isFirst ? (game.team_1_score ?? 0) : (game.team_2_score ?? 0);
                  const s2 = isFirst ? (game.team_2_score ?? 0) : (game.team_1_score ?? 0);
                  const isCurrentRound = i === playedRounds - 1 && lastRoundActive;
                  const inProgress = isCurrentRound && game.status === 'in_progress';
                  results.push({ text: `${s1} : ${s2}`, diff: s1 - s2, inProgress });
                } else {
                  results.push({ text: '-- : --', diff: 0, pending: true });
                }
              }
            });
          }
        }
      } else if (this.tournament.games) {
        this.tournament.games.forEach((round, roundIndex) => {
          round.forEach((game) => {
            if (
              (game.team_1 === team && game.team_2 === opponent) ||
              (game.team_2 === team && game.team_1 === opponent)
            ) {
              const isFirst = game.team_1 === team && game.team_2 === opponent;
              if (
                game.status === 'in_progress' ||
                game.status === 'finished' ||
                (game.team_1_score != null && game.team_2_score != null)
              ) {
                const s1 = isFirst ? (game.team_1_score ?? 0) : (game.team_2_score ?? 0);
                const s2 = isFirst ? (game.team_2_score ?? 0) : (game.team_1_score ?? 0);
                const isCurrentRound = roundIndex === playedRounds - 1 && lastRoundActive;
                const inProgress = isCurrentRound && game.status === 'in_progress';
                results.push({ text: `${s1} : ${s2}`, diff: s1 - s2, inProgress });
              } else {
                results.push({ text: '-- : --', diff: 0, pending: true });
              }
            }
          });
        });
      }
      return results;
    },
    getBarrageGameResults(team, opponent) {
      const results = [];
      const barrageGames = this.tournament.games.slice(this.tournament.barrage.startIndex);
      barrageGames.forEach((round) => {
        round.forEach((game) => {
          if (game.team_1 === team && game.team_2 === opponent) {
            results.push({
              text: `${game.team_1_score || 0} : ${game.team_2_score || 0}`,
              diff: (game.team_1_score || 0) - (game.team_2_score || 0),
            });
          } else if (game.team_2 === team && game.team_1 === opponent) {
            results.push({
              text: `${game.team_2_score || 0} : ${game.team_1_score || 0}`,
              diff: (game.team_2_score || 0) - (game.team_1_score || 0),
            });
          }
        });
      });
      return results;
    },
    async exportResults() {
      if (!this.canUseResultActions || this.readOnly) return;
      const token = import.meta.env.VITE_FPU_AUTH_TOKEN;
      if (!token) {
        this.showMessage({ title: this.$t('messages.error'), text: 'API token not configured', type: 'error' });
        return;
      }

      let portalTeams;
      try {
        const res = await fetch(
          `https://portal.petanque.org.ua/tournament/team_export/${this.portalIdTournament}?format=json`,
        );
        if (!res.ok) throw new Error(`Portal responded ${res.status}`);
        const data = await res.json();
        portalTeams = data.teams;
      } catch (e) {
        this.showMessage({ title: this.$t('messages.error'), text: e.message, type: 'error' });
        return;
      }

      const teams = this.tournamentRanking
        .map((item) => {
          const localTeam = this.tournament.teams?.find((t) => t.title === item.title);
          const portalTeamId = localTeam?.portalTeamId || portalTeams.find((pt) => pt.name === item.title)?.id;
          if (!portalTeamId) return null;
          const place = String(item.place);
          const entry = {
            team_id: portalTeamId,
            place_min: parseInt(place.split('-')[0]),
          };
          if (place.includes('-')) {
            entry.place_max = parseInt(place.split('-')[1]);
          }
          return entry;
        })
        .filter(Boolean);

      try {
        const response = await fetch('https://portal.petanque.org.ua/api/tournament/results/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token,
          },
          body: JSON.stringify({
            tournament_id: Number(this.portalIdTournament),
            teams,
          }),
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
        console.error('Import results failed:', e);
        this.showMessage({ title: this.$t('messages.error'), text: e.message, type: 'error' });
      }
    },
    copyResults() {
      if (!this.canUseResultActions || this.readOnly) return;
      let content = '';
      this.tournamentRanking.forEach((item) => {
        content += item.place + ' ' + item.title + '\n';
      });
      copyContent(content);
      this.resultsCopied = true;
      setTimeout(() => {
        this.resultsCopied = false;
      }, 2000);
    },
    getTeamPlayers(title) {
      const team = this.tournament.teams?.find((item) => item.title === title);
      return team?.players || '';
    },
  },
  computed: {
    ...mapState(useMainStore, ['user', 'currentTournament']),
    canUseResultActions() {
      return RESULT_ACTION_EMAILS.has(String(this.user?.email || '').toLowerCase());
    },
    portalIdTournament() {
      return this.currentTournament?.portalIdTournament || this.tournament.portalIdTournament;
    },
    groupsNames() {
      return tournamentNames;
    },
    tournamentRanking() {
      return getTournamentRanking(this.tournament, this.rankingTeams);
    },
    playOffTeamsPerGroup() {
      return getPlayOffTeamsPerGroup(this.tournament);
    },
    isTetATet() {
      return this.tournament.teams?.every((t) => t.players?.length === 1);
    },
    resolvedClubMap() {
      if (this.teamClubMap) return this.teamClubMap;
      if (!this.tournament?.teams) return {};
      const map = {};
      this.tournament.teams.forEach((t) => {
        if (t.players?.length && t.players[0].club) {
          map[t.title] = t.players[0].club;
        }
      });
      return map;
    },
    isSwissGroups() {
      return this.tournament.preferences?.groupFormat === 'swiss';
    },
    hasActiveBarrage() {
      return (
        this.tournament.barrage &&
        this.activeRound > this.tournament.barrage.startIndex &&
        !this.tournament.playOff &&
        !this.tournament.tournamentIsFinished
      );
    },
    hasRankingSubtabs() {
      if (this.isForProtocol || this.showInSaved) return false;
      if (this.hasActiveBarrage) return this.tournament.system === 'swiss';
      return Boolean(
        this.tournament.tournamentIsFinished &&
        this.tournament.games?.length &&
        this.rankingTeams?.length &&
        this.tournamentRanking.length,
      );
    },
    rankingTableLabel() {
      return this.tournament.system === 'swiss' && !this.tournament.groups ? 'ranking.swissTable' : 'ranking.ranking';
    },
    isRankingTableOnly() {
      if (this.isForProtocol) return true;
      return this.hasRankingSubtabs && this.rankingSubtab === 'swiss';
    },
    isResultOnly() {
      if (this.isForProtocol) return false;
      return this.hasRankingSubtabs && this.tournament.tournamentIsFinished && this.rankingSubtab === 'result';
    },
    isBarrageOnly() {
      if (this.isForProtocol) return false;
      return (
        this.tournament.system === 'swiss' &&
        (this.tournament.tournamentIsFinished || this.hasActiveBarrage) &&
        this.rankingSubtab === 'barrage'
      );
    },
    rankingChunkSize() {
      return 28;
    },
    rankingChunks() {
      const teams = this.effectiveRankingTeams;
      if (!teams) return [];
      const chunks = [];
      for (let i = 0; i < teams.length; i += this.rankingChunkSize) {
        chunks.push(teams.slice(i, i + this.rankingChunkSize));
      }
      return chunks;
    },
    barrageRankingTeams() {
      return rankBarrageGroups(this.tournament);
    },
    swissRankingTeams() {
      return sortSwissWithLiveStats(this.tournament);
    },
    effectiveRankingTeams() {
      if (this.isRankingTableOnly && this.hasActiveBarrage) {
        return this.swissRankingTeams;
      }
      return this.rankingTeams;
    },
  },
};
</script>

<style scoped>
.protocol-swiss-ranking-table th:first-child,
.protocol-swiss-ranking-table td:first-child {
  width: 4.48%;
  white-space: nowrap;
  text-align: center;
}

.ranking-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.ranking-header__actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-purple-outline {
  background: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: 6px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.btn-purple-outline:hover {
  background: var(--color-primary);
  color: var(--color-btn-text);
}

.btn-purple-outline:focus {
  box-shadow: none;
  outline: none;
}

@media screen and (max-width: 768px) {
  .btn-purple-outline {
    border: none;
    padding: 0.5rem;
    width: 36px;
    height: 36px;
  }
}

.btn-purple-outline--copied {
  color: var(--color-text-muted) !important;
  border-color: var(--color-border) !important;
  background: transparent !important;
}

.has-tooltip {
  position: relative;
  cursor: pointer;
  text-decoration: underline dotted;
}

.ranking-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-ranking-primary-bg);
  color: var(--color-btn-text);
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: normal;
  white-space: nowrap;
  z-index: 10;
  margin-bottom: 4px;
}

.ranking-tooltip-right {
  left: auto;
  right: 0;
  transform: none;
}

.playoff-highlight :deep(td) {
  background: var(--color-primary-bg) !important;
}

.playoff-highlight {
  background: var(--color-primary-bg) !important;
}

.search-highlight td {
  background: var(--color-primary-bg) !important;
}

.search-highlight td:first-child {
  border-left: 3px solid var(--color-primary);
}

.place-gold td {
  background: var(--color-badge-gold-bg) !important;
}

.place-gold td:first-child {
  border-left: 3px solid var(--color-badge-gold-border);
}

.place-silver td {
  background: var(--color-badge-silver-bg) !important;
}

.place-silver td:first-child {
  border-left: 3px solid var(--color-badge-silver-border);
}

.place-bronze td {
  background: var(--color-badge-bronze-bg) !important;
}

.place-bronze td:first-child {
  border-left: 3px solid var(--color-badge-bronze-border);
}

.rating-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  padding: 0.15rem 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 10px;
  background: var(--color-badge-purple);
  color: var(--color-primary);
}

.ranking-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.ranking-empty__icon {
  color: var(--color-text-muted);
  opacity: 0.5;
  margin-bottom: 0.75rem;
}

.ranking-empty__text {
  color: var(--color-text-muted);
  font-size: 1rem;
  margin: 0;
}

.group-tabs {
  display: flex;
  width: 100%;
}

.group-tabs__btn {
  flex: 1;
  padding: 8px 4px;
  font-size: 14px;
  font-weight: 600;
  border: 1.5px solid #d1d5db;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
  margin-left: -1.5px;
}

.group-tabs__btn:first-child {
  border-radius: 6px 0 0 6px;
  margin-left: 0;
}

.group-tabs__btn:last-child {
  border-radius: 0 6px 6px 0;
}

.group-tabs__btn--active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
  z-index: 1;
}

.group-cell {
  white-space: nowrap;
}

.group-cell--win {
  color: var(--tir-winner-text);
  font-weight: 600;
  white-space: nowrap;
}

.group-cell--lose {
  color: var(--color-error);
  font-weight: 600;
  white-space: nowrap;
}

.group-cell--in-progress {
  color: var(--color-primary);
  font-weight: 600;
  white-space: nowrap;
}

.group-cell--muted {
  color: #aaa;
}

.confirm-export {
  padding: 0.5rem 0;
}

.confirm-export__text {
  font-size: 1rem;
  color: var(--color-text);
  line-height: 1.5;
  margin-bottom: 1.25rem;
}

.confirm-export__actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.confirm-export__btn {
  padding: 0.5rem 1.25rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.15s;
}

.confirm-export__btn--cancel {
  background: transparent;
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}

.confirm-export__btn--cancel:hover {
  border-color: var(--color-text-muted);
  background: var(--color-surface-hover);
}

.confirm-export__btn--confirm {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-btn-text);
}

.confirm-export__btn--confirm:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary-light);
}

.td-highlight {
  font-weight: 500;
}

.nowrap {
  white-space: nowrap;
}

.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  max-width: 100%;
  min-width: 0;
}

.table-container .table {
  margin: 0 auto;
}

.team-withdrawn {
  opacity: 0.5;
}

.text-line-through {
  text-decoration: line-through;
}

.withdrawn-badge {
  display: inline-block;
  margin-left: 0.35rem;
  padding: 0.1rem 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 3px;
  background: var(--color-danger, #e53935);
  color: #fff;
  vertical-align: middle;
}
</style>
