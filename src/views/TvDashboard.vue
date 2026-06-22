<template>
  <div v-if="isLoading" class="tv-loading">
    <div class="tv-loading__spinner"></div>
  </div>
  <div v-else-if="!tournament" class="tv-loading">
    <p class="tv-loading__text">Турнір не знайдено</p>
  </div>
  <div v-else class="tv">
    <!-- Two-column layout: left (header+grid+footer) | right (table+QR) -->
    <div class="tv__left">
      <!-- Header -->
      <header class="tv__header">
        <div class="tv__header-left">
          <img src="../assets/img/tv-logo.png" alt="" class="tv__header-logo" />
        </div>
        <div class="tv__header-center">
          <div class="tv__system-box">
            <span class="tv__system-label">СИСТЕМА</span>
            <span class="tv__system-text">{{ systemSummary }}</span>
            <span v-if="tournament.tournamentMessage" class="tv__system-message">{{ tournament.tournamentMessage }}</span>
          </div>
          <div class="tv__timer-box" :class="{ 'tv__timer-box--ended': timerEnded }">
            <div class="tv__timer-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div class="tv__timer-value">{{ timerDisplay }}</div>
            <div class="tv__timer-meta">
              <span>{{ phaseLabel }}</span>
              <span v-if="cochonettesLine" class="tv__timer-cochonettes">{{ cochonettesLine }}</span>
            </div>
          </div>
        </div>
        <div class="tv__header-right">
          <div class="tv__clock">{{ currentTime }}</div>
          <div class="tv__date">{{ currentDate }}</div>
        </div>
      </header>

      <!-- Matches grid -->
      <main class="tv__main">
        <section
          v-if="!tournament.roundIsActive && (!tournament.games || !tournament.games.length || (tournament.games.length === 1 && !hasFinishedGames))"
          class="tv__registration"
        >
          <div class="tv__registration-content">
            <div class="tv__registration-icon">📋</div>
            <div class="tv__registration-text">Триває реєстрація</div>
            <div class="tv__registration-teams">{{ tournament.teams?.length || 0 }} команд зареєстровано</div>
          </div>
        </section>
        <section v-else-if="!showPlayoffBracket" class="tv__matches">
          <!-- Groups mode: columns with headers -->
          <div v-if="isGroupsMode" class="tv__matches-columns">
            <div v-for="(col, ci) in groupedColumns" :key="ci" class="tv__matches-col">
              <div class="tv__col-header">Група {{ groupLabel(ci) }}</div>
              <div class="tv__col-games">
                <div v-for="(game, gi) in col" :key="gi" class="tv__card" :class="cardClass(game)">
                  <div class="tv__card-top">
                    <span class="tv__card-lane" :class="laneClass(game)">{{ game._lane }}</span>
                  </div>
                  <div class="tv__card-main">
                    <span class="tv__card-name tv__card-name--left" :class="{ 'tv__card-name--winner': isWinner(game, 1) }">{{ formatName(game.team_1) }}</span>
                    <span class="tv__card-score" :class="{ 'tv__card-score--waiting': !game.status || game.status === 'not_started' }">{{ gameScore(game, 1) }}&nbsp;:&nbsp;{{ gameScore(game, 2) }}</span>
                    <span class="tv__card-name tv__card-name--right" :class="{ 'tv__card-name--winner': isWinner(game, 2) }">{{ formatName(game.team_2) }}</span>
                  </div>
                  <div v-if="game.score_history && game.score_history.length" class="tv__card-history">
                    <span v-for="(entry, i) in game.score_history" :key="i" class="tv__card-chip">
                      <span class="tv__card-chip-num">{{ i + 1 }}</span>
                      <span class="tv__card-chip-score">{{ entry.s1 }}-{{ entry.s2 }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Default: flat grid -->
          <div v-else class="tv__matches-grid" :style="gridStyle">
            <div v-for="(game, index) in sortedGames" :key="index" class="tv__card" :class="cardClass(game)">
              <div class="tv__card-top">
                <span class="tv__card-lane" :class="laneClass(game)">{{ game._lane }}</span>
              </div>
              <div class="tv__card-main">
                <span class="tv__card-name tv__card-name--left" :class="{ 'tv__card-name--winner': isWinner(game, 1) }">{{ formatName(game.team_1) }}</span>
                <span class="tv__card-score" :class="{ 'tv__card-score--waiting': !game.status || game.status === 'not_started' }">{{ gameScore(game, 1) }}&nbsp;:&nbsp;{{ gameScore(game, 2) }}</span>
                <span class="tv__card-name tv__card-name--right" :class="{ 'tv__card-name--winner': isWinner(game, 2) }">{{ formatName(game.team_2) }}</span>
              </div>
              <div v-if="game.score_history && game.score_history.length" class="tv__card-history">
                <span v-for="(entry, i) in game.score_history" :key="i" class="tv__card-chip">
                  <span class="tv__card-chip-num">{{ i + 1 }}</span>
                  <span class="tv__card-chip-score">{{ entry.s1 }}-{{ entry.s2 }}</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Playoff bracket view -->
        <section v-else class="tv__bracket">
          <div class="tv__bracket-container">
            <svg :viewBox="`0 0 ${bracketWidth} ${bracketHeight}`" class="tv__bracket-svg">
              <g v-for="(stage, si) in bracketStages" :key="si">
                <g v-for="(game, gi) in stage.games" :key="gi">
                  <rect :x="game.x" :y="game.y" :width="bracketBoxWidth" :height="bracketBoxHeight" rx="6" ry="6" class="tv__game-box" />
                  <line :x1="game.x + 1" :y1="game.y + bracketBoxHeight / 2" :x2="game.x + bracketBoxWidth - 1" :y2="game.y + bracketBoxHeight / 2" class="tv__game-divider" />
                  <path v-if="tvTeamBg(game.data, 1, stage.stageLabel)" :d="tvTopHalfPath(game.x, game.y)" :class="tvTeamBg(game.data, 1, stage.stageLabel)" />
                  <path v-if="tvTeamBg(game.data, 2, stage.stageLabel)" :d="tvBottomHalfPath(game.x, game.y)" :class="tvTeamBg(game.data, 2, stage.stageLabel)" />
                  <text :x="game.x + 10" :y="game.y + bracketBoxHeight / 4 + 5" class="tv__team-name" :class="{ 'tv__team-winner': isBracketWinner(game.data, 1) }">
                    {{ truncBracketName(game.data.team_1) }}
                  </text>
                  <path v-if="tvTeamBg(game.data, 1, stage.stageLabel)" :d="tvScoreTopPath(game.x, game.y)" :class="'tv__score-bg-' + tvTeamBg(game.data, 1, stage.stageLabel)" />
                  <text :x="game.x + bracketBoxWidth - 20" :y="game.y + bracketBoxHeight / 4 + 5" class="tv__team-score">
                    {{ game.data.team_1_score ?? '' }}
                  </text>
                  <text :x="game.x + 10" :y="game.y + (bracketBoxHeight * 3) / 4 + 5" class="tv__team-name" :class="{ 'tv__team-winner': isBracketWinner(game.data, 2) }">
                    {{ truncBracketName(game.data.team_2) }}
                  </text>
                  <path v-if="tvTeamBg(game.data, 2, stage.stageLabel)" :d="tvScoreBottomPath(game.x, game.y)" :class="'tv__score-bg-' + tvTeamBg(game.data, 2, stage.stageLabel)" />
                  <text :x="game.x + bracketBoxWidth - 20" :y="game.y + (bracketBoxHeight * 3) / 4 + 5" class="tv__team-score">
                    {{ game.data.team_2_score ?? '' }}
                  </text>
                </g>
              </g>
              <!-- Third place -->
              <g v-if="bracketThirdPlace">
                <text :x="bracketThirdPlace.x + bracketBoxWidth / 2" :y="bracketThirdPlace.y - 8" class="tv__round-header">
                  3 місце
                </text>
                <rect :x="bracketThirdPlace.x" :y="bracketThirdPlace.y" :width="bracketBoxWidth" :height="bracketBoxHeight" rx="6" ry="6" class="tv__game-box" />
                <line :x1="bracketThirdPlace.x + 1" :y1="bracketThirdPlace.y + bracketBoxHeight / 2" :x2="bracketThirdPlace.x + bracketBoxWidth - 1" :y2="bracketThirdPlace.y + bracketBoxHeight / 2" class="tv__game-divider" />
                <path v-if="tvTeamBg(bracketThirdPlace.data, 1, 'third')" :d="tvTopHalfPath(bracketThirdPlace.x, bracketThirdPlace.y)" :class="tvTeamBg(bracketThirdPlace.data, 1, 'third')" />
                <path v-if="tvTeamBg(bracketThirdPlace.data, 2, 'third')" :d="tvBottomHalfPath(bracketThirdPlace.x, bracketThirdPlace.y)" :class="tvTeamBg(bracketThirdPlace.data, 2, 'third')" />
                <text :x="bracketThirdPlace.x + 10" :y="bracketThirdPlace.y + bracketBoxHeight / 4 + 5" class="tv__team-name" :class="{ 'tv__team-winner': isBracketWinner(bracketThirdPlace.data, 1) }">
                  {{ truncBracketName(bracketThirdPlace.data.team_1) }}
                </text>
                <path v-if="tvTeamBg(bracketThirdPlace.data, 1, 'third')" :d="tvScoreTopPath(bracketThirdPlace.x, bracketThirdPlace.y)" :class="'tv__score-bg-' + tvTeamBg(bracketThirdPlace.data, 1, 'third')" />
                <text :x="bracketThirdPlace.x + bracketBoxWidth - 20" :y="bracketThirdPlace.y + bracketBoxHeight / 4 + 5" class="tv__team-score">
                  {{ bracketThirdPlace.data.team_1_score ?? '' }}
                </text>
                <text :x="bracketThirdPlace.x + 10" :y="bracketThirdPlace.y + (bracketBoxHeight * 3) / 4 + 5" class="tv__team-name" :class="{ 'tv__team-winner': isBracketWinner(bracketThirdPlace.data, 2) }">
                  {{ truncBracketName(bracketThirdPlace.data.team_2) }}
                </text>
                <path v-if="tvTeamBg(bracketThirdPlace.data, 2, 'third')" :d="tvScoreBottomPath(bracketThirdPlace.x, bracketThirdPlace.y)" :class="'tv__score-bg-' + tvTeamBg(bracketThirdPlace.data, 2, 'third')" />
                <text :x="bracketThirdPlace.x + bracketBoxWidth - 20" :y="bracketThirdPlace.y + (bracketBoxHeight * 3) / 4 + 5" class="tv__team-score">
                  {{ bracketThirdPlace.data.team_2_score ?? '' }}
                </text>
              </g>
              <!-- Connectors -->
              <g class="tv__connectors">
                <path v-for="(p, i) in bracketConnectors" :key="'c' + i" :d="p" class="tv__connector-line" />
              </g>
              <!-- Round headers -->
              <g class="tv__round-headers">
                <text v-for="(stage, si) in bracketStages" :key="'h' + si" :x="stage.x + bracketBoxWidth / 2" :y="20" class="tv__round-header">
                  {{ stage.label }}
                </text>
              </g>
            </svg>
          </div>
          <div v-if="podium" class="tv__podium">
            <div class="tv__podium-card tv__podium-card--gold">
              <div class="tv__podium-icon">🥇</div>
              <div class="tv__podium-place">1-е місце</div>
              <div class="tv__podium-name">{{ podium.first ? formatName(podium.first) : '—' }}</div>
            </div>
            <div class="tv__podium-card tv__podium-card--silver">
              <div class="tv__podium-icon">🥈</div>
              <div class="tv__podium-place">2-е місце</div>
              <div class="tv__podium-name">{{ podium.second ? formatName(podium.second) : '—' }}</div>
            </div>
            <div class="tv__podium-card tv__podium-card--bronze">
              <div class="tv__podium-icon">🥉</div>
              <div class="tv__podium-place">3-є місце</div>
              <div class="tv__podium-name">{{ podium.third ? formatName(podium.third) : '—' }}</div>
            </div>
          </div>
        </section>
      </main>

      <!-- Bottom status bar -->
      <footer class="tv__footer">
        <span class="tv__footer-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {{ phaseLabel }}
        </span>
        <span class="tv__footer-spacer"></span>
        <span class="tv__footer-item tv__footer-item--stat">
          <span class="tv__footer-dot tv__footer-dot--finished"></span> ЗАВЕРШЕНИХ: {{ matchStats.finished }}
        </span>
        <span class="tv__footer-item tv__footer-item--stat">
          <span class="tv__footer-dot tv__footer-dot--active"></span> АКТИВНИХ МАТЧІВ: {{ matchStats.active }}
        </span>
        <span class="tv__footer-item tv__footer-item--stat">
          <span class="tv__footer-dot tv__footer-dot--waiting"></span> ОЧІКУЮТЬ: {{ matchStats.waiting }}
        </span>
      </footer>
    </div>

    <!-- Right column: standings table + QR codes -->
    <aside v-if="tournament.roundIsActive || (tournament.games && tournament.games.length > 0)" class="tv__sidebar">
      <!-- Groups mode: per-group tables -->
      <div v-if="isGroupsMode" class="tv__table-wrapper tv__table-wrapper--groups">
        <h2 class="tv__table-title">ТУРНІРНА ТАБЛИЦЯ</h2>
        <div class="tv__groups-tables">
          <div v-for="(group, gi) in visibleGroups" :key="gi" class="tv__group-block">
            <div class="tv__group-header">Група {{ groupLabel(gi + currentGroupPage * groupsPerPage) }}</div>
            <div v-if="totalGroupPages > 1" class="tv__rotation-ribbon">
              <div class="tv__rotation-ribbon-bar" :key="groupRotationKey"></div>
            </div>
            <table class="tv__table tv__table--group">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Команда</th>
                  <th>В</th>
                  <th v-if="isSwissGroups">КБ</th>
                  <th v-if="isSwissGroups">МБ</th>
                  <th>+/-</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(team, index) in group"
                  :key="team.title"
                  :class="{ 'tv__table-row--qualified': index < qualifyPerGroup }"
                >
                  <td>{{ index + 1 }}</td>
                  <td class="tv__table-name">{{ formatName(team.title) }}</td>
                  <td>{{ team.wins }}</td>
                  <td v-if="isSwissGroups">{{ team.buhgolts }}</td>
                  <td v-if="isSwissGroups">{{ team.smallBuhgolts }}</td>
                  <td>{{ team.pointsPlus }}:{{ team.pointsMinus }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="tv__table-footer">
          <span v-if="totalGroupPages > 1" class="tv__table-pager">
            {{ currentGroupPage + 1 }} / {{ groupRankings.length }}
          </span>
          <span v-if="qualifyPerGroup" class="tv__table-qualify">Топ {{ qualifyPerGroup }} виходять</span>
        </div>
      </div>
      <!-- Default: flat table -->
      <div v-else class="tv__table-wrapper">
        <h2 class="tv__table-title">ТУРНІРНА ТАБЛИЦЯ</h2>
        <div v-if="totalTablePages > 1" class="tv__rotation-ribbon">
          <div class="tv__rotation-ribbon-bar" :key="tableRotationKey"></div>
        </div>
        <table class="tv__table">
          <thead>
            <tr>
              <th>#</th>
              <th>Команда</th>
              <th>В</th>
              <th>КБ</th>
              <th>МБ</th>
              <th>Очки</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(team, index) in visibleRanking"
              :key="team.title"
              :class="{
                'tv__table-row--qualified':
                  playoffQualifyCount && currentTablePage * tablePageSize + index < playoffQualifyCount,
              }"
            >
              <td>{{ currentTablePage * tablePageSize + index + 1 }}</td>
              <td class="tv__table-name">{{ formatName(team.title) }}</td>
              <td>{{ team.wins }}</td>
              <td>{{ team.buhgolts }}</td>
              <td>{{ team.smallBuhgolts }}</td>
              <td>{{ team.pointsPlus }}:{{ team.pointsMinus }}</td>
            </tr>
          </tbody>
        </table>
        <div class="tv__table-footer">
          <span v-if="totalTablePages > 1" class="tv__table-pager">
            {{ currentTablePage * tablePageSize + 1 }}–{{
              Math.min((currentTablePage + 1) * tablePageSize, flatRanking.length)
            }}
            з {{ flatRanking.length }}
          </span>
          <span v-if="flatRanking.length" class="tv__table-total">Всього команд: {{ flatRanking.length }}</span>
        </div>
      </div>
      <div class="tv__qr-section">
        <div class="tv__qr-item">
          <span class="tv__qr-label">Результати онлайн</span>
          <div class="tv__qr-box">
            <qrcode-vue v-if="qrPublicUrl" :value="qrPublicUrl" :size="148" level="M" />
          </div>
        </div>
        <div class="tv__qr-item">
          <span class="tv__qr-label">Підтримати розробників додатку</span>
          <div class="tv__qr-box">
            <img src="../assets/img/donate-qr.jpg" alt="Donate" class="tv__qr-img" />
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script>
import { tournamentService } from '@/services/db';
import { getTeamsRanking, pluralizeRounds } from '@/helpers';
import QrcodeVue from 'qrcode.vue';

export default {
  name: 'TvDashboard',
  components: { QrcodeVue },
  data() {
    return {
      isLoading: true,
      tournament: null,
      now: Date.now(),
      clockInterval: null,
      tableRotationInterval: null,
      currentTablePage: 0,
      currentGroupPage: 0,
      groupRotationKey: 0,
      tableRotationKey: 0,
      tablePageSize: 20,
      qrCanvas: null,
    };
  },
  mounted() {
    this._unsubscribers = [];
    this.getInfo();
    this.clockInterval = setInterval(() => {
      this.now = Date.now();
    }, 1000);
    this.tableRotationInterval = setInterval(() => {
      if (this.isGroupsMode && this.totalGroupPages > 1) {
        this.currentGroupPage = (this.currentGroupPage + 1) % this.totalGroupPages;
        this.groupRotationKey++;
      } else if (this.totalTablePages > 1) {
        this.currentTablePage = (this.currentTablePage + 1) % this.totalTablePages;
        this.tableRotationKey++;
      }
    }, 12000);
  },
  beforeUnmount() {
    this._unsubscribeAll();
    clearInterval(this.clockInterval);
    clearInterval(this.tableRotationInterval);
  },
  computed: {
    userId() {
      if (this.$route.query.ref) {
        const refParam = this.$route.query.ref;
        if (refParam.includes('.')) {
          return refParam.split('.')[0];
        }
        const decoded = atob(refParam);
        return decoded.split(':')[0];
      }
      return this.$route.query.user;
    },
    tournamentId() {
      if (this.$route.query.ref) {
        const refParam = this.$route.query.ref;
        if (refParam.includes('.')) {
          return parseInt(refParam.split('.')[1], 36).toString();
        }
        const decoded = atob(refParam);
        return decoded.split(':')[1];
      }
      return this.$route.query.tournament;
    },
    activeRound() {
      if (!this.tournament?.games?.length) return 1;
      return this.tournament.roundIsActive ? this.tournament.games.length : this.tournament.games.length + 1;
    },
    hasFinishedGames() {
      const games = this.tournament?.games;
      if (!games?.length) return false;
      return games[games.length - 1].some((g) => g.status === 'finished');
    },
    currentGames() {
      if (this.tournament?.cadrage) return this.tournament.cadrage;
      if (!this.tournament?.games?.length) return [];
      return this.tournament.games[this.tournament.games.length - 1] || [];
    },
    sortedGames() {
      const games = this.currentGames;
      const start = this.tournament?.preferences?.fieldsStart || 1;
      if (!this.isGroupsMode) {
        return games.map((g, i) => ({ ...g, _lane: i + start }));
      }
      const grouped = {};
      games.forEach((game, i) => {
        const g = game.group ?? 0;
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push({ ...game, _lane: i + start });
      });
      const keys = Object.keys(grouped).sort((a, b) => a - b);
      const maxLen = Math.max(...keys.map((k) => grouped[k].length));
      const result = [];
      for (let row = 0; row < maxLen; row++) {
        for (const k of keys) {
          if (grouped[k][row]) result.push(grouped[k][row]);
        }
      }
      return result;
    },
    groupedColumns() {
      const games = this.currentGames;
      const start = this.tournament?.preferences?.fieldsStart || 1;
      const grouped = {};
      games.forEach((game, i) => {
        const g = game.group ?? 0;
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push({ ...game, _lane: i + start });
      });
      return Object.keys(grouped)
        .sort((a, b) => a - b)
        .map((k) => grouped[k]);
    },
    showPlayoffBracket() {
      return !!this.tournament?.playOff && !!this.tournament?.playOffBracket;
    },
    gridStyle() {
      const count = this.sortedGames.length;
      let cols;
      if (this.isGroupsMode) {
        cols = this.tournament.groups.length;
      } else if (count <= 8) {
        cols = 1;
      } else if (count <= 16) {
        cols = 2;
      } else if (count <= 24) {
        cols = 3;
      } else {
        cols = 4;
      }
      const rows = Math.ceil(count / cols);
      return {
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      };
    },
    systemSummary() {
      if (!this.tournament) return '';
      const prefs = this.tournament.preferences;
      if (this.isGroupsMode) {
        const groupCount = this.tournament.groups.length;
        const format = prefs?.groupFormat === 'swiss' ? 'швейцарка' : 'кругова';
        let text = `${groupCount} групи / ${format}`;
        if (prefs?.playOffEnabled) text += '\n+ плей-оф';
        return text;
      }
      const rounds = prefs?.swissRoundsCount || this.tournament.games?.length || 4;
      let text = `${rounds} ${pluralizeRounds(rounds, 'ua')} швейцарки`;
      if (prefs?.playOffEnabled) text += '\n+ плей-оф';
      return text;
    },
    timerDisplay() {
      const rt = this.tournament?.roundTimer;
      if (!rt || rt.timerStatus === 'not_started') return '--:--';
      if (rt.timerStatus === 'ended') return '0:00';
      if (rt.timerEndsAt) {
        const remaining = Math.max(0, new Date(rt.timerEndsAt).getTime() - this.now);
        const totalSeconds = Math.ceil(remaining / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      return '--:--';
    },
    timerEnded() {
      const rt = this.tournament?.roundTimer;
      if (!rt) return false;
      if (rt.timerStatus === 'ended') return true;
      if (rt.timerStatus === 'running' && rt.timerEndsAt) {
        return this.now >= new Date(rt.timerEndsAt).getTime();
      }
      return false;
    },
    cochonettesLine() {
      const prefs = this.tournament?.preferences;
      if (!prefs?.cochonettesEnabled || !prefs?.cochonettes) return '';
      return `+${prefs.cochonettes} кошонет`;
    },
    displayRound() {
      if (!this.tournament?.games?.length) return 1;
      return this.tournament.games.length;
    },
    phaseLabel() {
      if (!this.tournament) return '';
      if (this.tournament.playOff) return 'Плей-оф';
      if (this.tournament.cadrage) return 'Кадраж';
      return `Раунд ${this.displayRound}`;
    },
    currentTime() {
      const d = new Date(this.now);
      return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    },
    currentDate() {
      const d = new Date(this.now);
      return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
    },
    rankingTeams() {
      if (!this.tournament) return [];
      return getTeamsRanking(this.tournament, this.activeRound);
    },
    flatRanking() {
      const r = this.rankingTeams;
      if (!r) return [];
      if (Array.isArray(r[0])) return r.flat();
      return r;
    },
    totalTablePages() {
      return Math.ceil(this.flatRanking.length / this.tablePageSize);
    },
    visibleRanking() {
      const start = this.currentTablePage * this.tablePageSize;
      return this.flatRanking.slice(start, start + this.tablePageSize);
    },
    playoffQualifyCount() {
      const prefs = this.tournament?.preferences;
      if (prefs?.playOffEnabled) return prefs.playOffTeams || 0;
      return 0;
    },
    isGroupsMode() {
      return this.tournament?.groups?.length > 0;
    },
    isSwissGroups() {
      return this.tournament?.preferences?.groupFormat === 'swiss';
    },
    groupRankings() {
      if (!this.isGroupsMode) return [];
      if (Array.isArray(this.rankingTeams?.[0])) return this.rankingTeams;
      return this.tournament.groups.map((group) =>
        group.map((t) => ({
          title: t.title,
          wins: t.wins || 0,
          pointsPlus: t.pointsPlus || 0,
          pointsMinus: t.pointsMinus || 0,
        })),
      );
    },
    qualifyPerGroup() {
      if (!this.isGroupsMode || !this.playoffQualifyCount || !this.groupRankings.length) return 0;
      return Math.floor(this.playoffQualifyCount / this.groupRankings.length);
    },
    groupsPerPage() {
      return 1;
    },
    totalGroupPages() {
      return Math.ceil(this.groupRankings.length / this.groupsPerPage);
    },
    visibleGroups() {
      const start = this.currentGroupPage * this.groupsPerPage;
      return this.groupRankings.slice(start, start + this.groupsPerPage);
    },
    matchStats() {
      const games = this.currentGames;
      let finished = 0,
        active = 0,
        waiting = 0;
      games.forEach((g) => {
        if (g.status === 'finished') finished++;
        else if (g.status === 'in_progress') active++;
        else waiting++;
      });
      return { finished, active, waiting };
    },
    qrPublicUrl() {
      if (!this.userId || !this.tournamentId) return null;
      const shortRef = `${this.userId}.${parseInt(this.tournamentId).toString(36)}`;
      const domain = import.meta.env.PROD ? '/petanque-draw/#/' : '/#/';
      return `${window.location.origin}${domain}tournament?ref=${shortRef}`;
    },
    // Bracket computations
    bracketBoxWidth() {
      return 260;
    },
    bracketBoxHeight() {
      return 72;
    },
    bracketColGap() {
      return 52;
    },
    bracketRowGap() {
      return 18;
    },
    bracketStages() {
      if (!this.tournament?.playOffBracket?.stages) return [];
      const stages = this.tournament.playOffBracket.stages;
      const padding = 20;
      const headerH = 36;
      const firstCount = stages[0].teams.length;
      const firstH = firstCount * (this.bracketBoxHeight + this.bracketRowGap);

      return stages.map((stage, si) => {
        const x = padding + si * (this.bracketBoxWidth + this.bracketColGap);
        const gamesCount = stage.teams.length;
        const spacing = firstH / gamesCount;
        const games = stage.teams.map((game, gi) => ({
          x,
          y: headerH + padding + gi * spacing + (spacing - this.bracketBoxHeight) / 2,
          data: game,
        }));
        let label;
        if (stage.stageLabel === 'cadrage') label = 'Кадраж';
        else if (stage.stageLabel === 1) label = 'Фінал';
        else label = `1/${stage.stageLabel} фіналу`;
        return { games, x, label, stageLabel: stage.stageLabel };
      });
    },
    bracketWidth() {
      if (!this.bracketStages.length) return 0;
      const stages = this.tournament.playOffBracket.stages;
      return 40 + stages.length * this.bracketBoxWidth + (stages.length - 1) * this.bracketColGap;
    },
    bracketHeight() {
      if (!this.tournament?.playOffBracket?.stages) return 0;
      const firstCount = this.tournament.playOffBracket.stages[0].teams.length;
      let h = 56 + firstCount * (this.bracketBoxHeight + this.bracketRowGap) + 40;
      if (this.tournament.playOffBracket.thirdPlace) {
        const lastStage = this.bracketStages[this.bracketStages.length - 1];
        if (lastStage?.games?.length) {
          const finalGame = lastStage.games[0];
          const thirdY = finalGame.y + this.bracketBoxHeight + 80;
          const needed = thirdY + this.bracketBoxHeight + 20;
          if (needed > h) h = needed;
        }
      }
      return h;
    },
    bracketConnectors() {
      const paths = [];
      for (let si = 0; si < this.bracketStages.length - 1; si++) {
        const cur = this.bracketStages[si];
        const next = this.bracketStages[si + 1];
        if (cur.games.length === next.games.length) {
          for (let gi = 0; gi < next.games.length; gi++) {
            const cg = cur.games[gi];
            const ng = next.games[gi];
            const midY1 = cg.y + this.bracketBoxHeight / 2;
            const midY2 = ng.y + this.bracketBoxHeight / 2;
            const r = cg.x + this.bracketBoxWidth;
            const l = ng.x;
            const mx = r + this.bracketColGap / 2;
            paths.push(`M${r},${midY1} H${mx} V${midY2} H${l}`);
          }
        } else {
          for (let gi = 0; gi < next.games.length; gi++) {
            const ng = next.games[gi];
            const midY = ng.y + this.bracketBoxHeight / 2;
            const l = ng.x;
            const g1 = cur.games[gi * 2];
            const g2 = cur.games[gi * 2 + 1];
            if (g1 && g2) {
              const r = g1.x + this.bracketBoxWidth;
              const mx = r + this.bracketColGap / 2;
              paths.push(`M${r},${g1.y + this.bracketBoxHeight / 2} H${mx} V${midY} H${l}`);
              paths.push(`M${r},${g2.y + this.bracketBoxHeight / 2} H${mx} V${midY}`);
            }
          }
        }
      }
      return paths;
    },
    bracketThirdPlace() {
      const tp = this.tournament?.playOffBracket?.thirdPlace;
      if (!tp || (!tp.team_1 && !tp.team_2)) return null;
      const lastStage = this.bracketStages[this.bracketStages.length - 1];
      if (!lastStage?.games?.length) return null;
      const finalGame = lastStage.games[0];
      return {
        x: lastStage.x,
        y: finalGame.y + this.bracketBoxHeight + 80,
        data: tp,
      };
    },
    podium() {
      if (!this.showPlayoffBracket) return null;
      const stages = this.bracketStages;
      if (!stages.length) return null;
      let first = null;
      let second = null;
      let third = null;
      const finalStage = stages[stages.length - 1];
      if (finalStage?.games?.length) {
        const finalGame = finalStage.games[0].data;
        if (finalGame.team_1_score != null && finalGame.team_2_score != null) {
          const s1 = Number(finalGame.team_1_score);
          const s2 = Number(finalGame.team_2_score);
          first = s1 > s2 ? finalGame.team_1 : finalGame.team_2;
          second = s1 > s2 ? finalGame.team_2 : finalGame.team_1;
        }
      }
      const tp = this.tournament?.playOffBracket?.thirdPlace;
      if (tp && tp.team_1_score != null && tp.team_2_score != null) {
        third = Number(tp.team_1_score) > Number(tp.team_2_score) ? tp.team_1 : tp.team_2;
      }
      return { first, second, third };
    },
  },
  methods: {
    async getInfo() {
      this.isLoading = true;
      try {
        const snapshot = await tournamentService.getOne(this.userId, this.tournamentId);
        if (snapshot.exists()) {
          this.tournament = snapshot.val();
        }
      } catch (error) {
        console.error('Error fetching TV data:', error);
      }
      this.isLoading = false;
      this._subscribeDynamic();
    },
    _subscribeDynamic() {
      const paths = [
        'games',
        'roundIsActive',
        'roundTimer',
        'playOff',
        'playOffBracket',
        'playOffStage',
        'cadrage',
        'barrage',
        'tournamentIsFinished',
        'tournamentIsStarted',
        'teams',
        'preferences',
        'groups',
        'system',
        'groupSchedule',
        'tournamentMessage',
      ];
      for (const path of paths) {
        const unsub = tournamentService.subscribePath(this.userId, this.tournamentId, path, (snapshot) => {
          if (!this.tournament) return;
          this.tournament[path] = snapshot.val();
        });
        this._unsubscribers.push(unsub);
      }
    },
    _unsubscribeAll() {
      if (this._unsubscribers) {
        this._unsubscribers.forEach((fn) => fn());
        this._unsubscribers = [];
      }
    },
    formatName(name) {
      if (!name) return '—';
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].toUpperCase();
      const surname = parts[0].toUpperCase();
      const initial = parts[1][0].toUpperCase() + '.';
      return `${surname} ${initial}`;
    },
    cardClass(game) {
      if (game.status === 'finished') return 'tv__card--finished';
      if (game.status === 'in_progress') return 'tv__card--active';
      return 'tv__card--waiting';
    },
    laneClass(game) {
      if (game.status === 'finished') return 'tv__card-lane--finished';
      if (game.status === 'in_progress') return 'tv__card-lane--active';
      return '';
    },
    gameLane(index) {
      const start = this.tournament?.preferences?.fieldsStart || 1;
      return index + start;
    },
    gameScore(game, team) {
      if (!game.status || game.status === 'not_started') return '--';
      return team === 1 ? (game.team_1_score ?? 0) : (game.team_2_score ?? 0);
    },
    isWinner(game, team) {
      if (game.status !== 'finished') return false;
      if (team === 1) return Number(game.team_1_score) > Number(game.team_2_score);
      return Number(game.team_2_score) > Number(game.team_1_score);
    },
    isBracketWinner(data, team) {
      if (data.team_1_score == null || data.team_2_score == null) return false;
      if (team === 1) return Number(data.team_1_score) > Number(data.team_2_score);
      return Number(data.team_2_score) > Number(data.team_1_score);
    },
    tvTeamBg(data, team, stageLabel) {
      if (!data || data.team_1_score == null || data.team_2_score == null) return null;
      const isWinner = this.isBracketWinner(data, team);
      if (stageLabel === 1) return isWinner ? 'tv__bg-gold' : 'tv__bg-silver';
      if (stageLabel === 'third') return isWinner ? 'tv__bg-bronze' : 'tv__bg-loser';
      return isWinner ? 'tv__bg-winner' : 'tv__bg-loser';
    },
    tvTopHalfPath(x, y) {
      const r = 5;
      const w = this.bracketBoxWidth - 2;
      const h = this.bracketBoxHeight / 2 - 1;
      const x0 = x + 1;
      const y0 = y + 1;
      return `M${x0 + r},${y0} H${x0 + w - r} Q${x0 + w},${y0} ${x0 + w},${y0 + r} V${y0 + h} H${x0} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} Z`;
    },
    tvBottomHalfPath(x, y) {
      const r = 5;
      const w = this.bracketBoxWidth - 2;
      const h = this.bracketBoxHeight / 2 - 1;
      const x0 = x + 1;
      const y0 = y + this.bracketBoxHeight / 2;
      return `M${x0},${y0} H${x0 + w} V${y0 + h - r} Q${x0 + w},${y0 + h} ${x0 + w - r},${y0 + h} H${x0 + r} Q${x0},${y0 + h} ${x0},${y0 + h - r} Z`;
    },
    tvScoreTopPath(x, y) {
      const r = 5;
      const sw = 34;
      const x0 = x + this.bracketBoxWidth - sw - 1;
      const x1 = x + this.bracketBoxWidth - 1;
      const y0 = y + 1;
      const y1 = y + this.bracketBoxHeight / 2;
      return `M${x0},${y0} H${x1 - r} Q${x1},${y0} ${x1},${y0 + r} V${y1} H${x0} Z`;
    },
    tvScoreBottomPath(x, y) {
      const r = 5;
      const sw = 34;
      const x0 = x + this.bracketBoxWidth - sw - 1;
      const x1 = x + this.bracketBoxWidth - 1;
      const y0 = y + this.bracketBoxHeight / 2;
      const y1 = y + this.bracketBoxHeight - 1;
      return `M${x0},${y0} H${x1} V${y1 - r} Q${x1},${y1} ${x1 - r},${y1} H${x0} Z`;
    },
    truncBracketName(name) {
      if (!name) return '—';
      if (name.length > 20) return name.substring(0, 18) + '…';
      return name;
    },
    groupLabel(index) {
      return String.fromCharCode(65 + index);
    },
  },
};
</script>

<style>
.tv {
  width: 1920px;
  height: 1080px;
  overflow: hidden;
  background: #fff !important;
  color: #111827;
  font-family: Inter, Roboto, Arial, sans-serif;
  display: grid;
  grid-template-columns: 1fr 360px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
}

.tv__left {
  display: grid;
  grid-template-rows: 150px 1fr 50px;
  min-height: 0;
  overflow: hidden;
}

.tv-loading {
  width: 1920px;
  height: 1080px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff !important;
  font-family: Inter, Roboto, Arial, sans-serif;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
}

.tv-loading__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #4b1fc4;
  border-radius: 50%;
  animation: tv-spin 0.8s linear infinite;
}

.tv-loading__text {
  font-size: 28px;
  color: #6b7280;
}

@keyframes tv-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Header */

.tv__header {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  border-bottom: 2px solid #e5e7eb;
  background: #081C69;
}

.tv__header-left {
  display: flex;
  align-items: stretch;
}

.tv__header-logo {
  height: 100%;
  width: auto;
  display: block;
}

.tv__header-center {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 8px 0;
}

.tv__system-box {
  background: #182F8C;
  color: #fff;
  padding: 13px 28px;
  border-radius: 11px;
  text-align: center;
  line-height: 1.3;
}

.tv__system-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  opacity: 0.8;
  letter-spacing: 0.5px;
}

.tv__system-text {
  display: block;
  font-size: 19px;
  font-weight: 700;
  white-space: pre-line;
}

.tv__system-message {
  display: block;
  font-size: 13px;
  font-weight: 500;
  opacity: 0.85;
  margin-top: 4px;
  white-space: pre-line;
}

.tv__timer-box {
  display: flex;
  align-items: center;
  gap: 13px;
  background: #DDF4F9;
  border: 2px solid #53B7D2;
  border-radius: 11px;
  padding: 13px 28px;
}

.tv__timer-box--ended {
  background: #fef2f2;
  border-color: #dc2626;
}

.tv__timer-icon {
  color: #53B7D2;
}

.tv__timer-icon svg {
  width: 24px;
  height: 24px;
}

.tv__timer-box--ended .tv__timer-icon {
  color: #dc2626;
}

.tv__timer-value {
  font-size: 62px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: #3E899E;
}

.tv__timer-meta {
  display: flex;
  flex-direction: column;
  font-size: 20px;
  font-weight: 600;
  color: #3E899E;
}

.tv__timer-cochonettes {
  font-size: 15px;
  color: #53B7D2;
  font-weight: 700;
}

.tv__header-right {
  text-align: right;
  padding: 8px 22px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.tv__clock {
  font-size: 43px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #fff;
}

.tv__date {
  font-size: 20px;
  font-weight: 600;
  color: white;
}

/* Main layout */

.tv__main {
  padding: 14px 24px;
  min-height: 0;
  overflow: hidden;
  display: flex;
  align-items: stretch;
}

/* Registration state */

.tv__registration {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.tv__registration-content {
  text-align: center;
}

.tv__registration-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.tv__registration-text {
  font-size: 48px;
  font-weight: 800;
  color: #111827;
}

.tv__registration-teams {
  font-size: 28px;
  font-weight: 600;
  color: #6b7280;
  margin-top: 12px;
}

/* Matches grid */

.tv__matches {
  min-height: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.tv__matches-columns {
  display: flex;
  gap: 24px;
  height: 96%;
}

.tv__matches-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.tv__col-header {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  text-align: center;
  padding: 4px 0 8px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.tv__col-games {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tv__matches-grid {
  display: grid;
  gap: 8px 10px;
  height: 100%;
}

/* Match card */

.tv__card {
  border-radius: 6px;
  border: 1.5px solid #e5e7eb;
  background: #fff;
  padding: 4px 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  flex: 1;
}

.tv__card--active {
  background-image: url('@/assets/img/card-bg-active.png');
  border-color: #2e3b8e;
}

.tv__card--finished {
  background-image: url('@/assets/img/card-bg-finished.png');
  border-color: #22c55e;
}

.tv__card--waiting {
  background-image: url('@/assets/img/card-bg-upcoming.png');
  border-color: #d1d5db;
}

.tv__card-top {
  display: flex;
  align-items: center;
}

.tv__card-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.tv__card-lane {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #fff;
  color: #6b7280;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #d1d5db;
  flex-shrink: 0;
  line-height: 1;
}

.tv__card-lane--active {
  background: #fff;
  color: #2e3b8e;
  border-color: #2e3b8e;
}

.tv__card-lane--finished {
  background: #fff;
  color: #22c55e;
  border-color: #22c55e;
}

.tv__card-name {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  flex: 1;
  min-width: 0;
  overflow-wrap: break-word;
}

.tv__card-name--left {
  text-align: right;
}

.tv__card-name--right {
  text-align: left;
}

.tv__card-name--winner {
  color: #15803d;
  font-weight: 800;
}


.tv__card-score {
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  text-align: center;
  min-width: 55px;
  letter-spacing: 1px;
}

.tv__card-score--waiting {
  color: #9ca3af;
}

.tv__card-history {
  display: flex;
  gap: 3px;
  flex-wrap: nowrap;
  justify-content: center;
}

.tv__card-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px 1px 2px;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.tv__card-chip-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #4b1fc4;
  color: #fff;
  font-size: 8px;
  font-weight: 700;
}

.tv__card-chip-score {
  font-size: 11px;
  font-weight: 600;
  color: #111827;
}

/* Sidebar */

.tv__sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: #fff;
  border-left: 2px solid #e5e7eb;
}

.tv__table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 12px 14px 8px;
}

.tv__table-title {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 8px;
  letter-spacing: 0.3px;
  text-align: center;
}

.tv__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
}

.tv__table thead th {
  font-size: 15px;
  font-weight: 700;
  color: #6b7280;
  text-align: left;
  padding: 5px 4px;
  border-bottom: 1.5px solid #e5e7eb;
}

.tv__table thead th:first-child {
  width: 28px;
  text-align: center;
}

.tv__table thead th:nth-child(n + 3) {
  text-align: center;
  width: 36px;
}

.tv__table thead th:last-child {
  width: 48px;
  text-align: center;
}

.tv__table tbody tr:nth-child(even) td {
  background: #f0f1f3;
}

.tv__table tbody td {
  padding: 5px 4px;
  border-bottom: 1px solid #f3f4f6;
  font-variant-numeric: tabular-nums;
}

.tv__table tbody td:first-child {
  text-align: center;
  font-weight: 700;
  color: #6b7280;
}

.tv__table tbody td:nth-child(n + 3) {
  text-align: center;
}

.tv__table-name {
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 180px;
}

.tv__table tbody tr.tv__table-row--qualified td {
  background: #ecfdf5;
}

.tv__table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.tv__table-pager {
  font-style: italic;
}

.tv__table-total {
  margin-left: auto;
}

.tv__table-qualify {
  margin-left: auto;
  color: #059669;
  font-weight: 600;
}

/* Groups tables */

.tv__table-wrapper--groups {
  display: block;
}

.tv__groups-tables {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tv__group-block {
}

.tv__group-header {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 6px;
  letter-spacing: 0.3px;
  text-align: center;
}

.tv__table--group {
  font-size: 15px;
}

.tv__table--group thead th {
  font-size: 14px;
  padding: 5px 4px;
}

.tv__table--group tbody td {
  padding: 4px 4px;
}

/* Rotation ribbon */

.tv__rotation-ribbon {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 10px;
}

.tv__rotation-ribbon-bar {
  height: 100%;
  width: 100%;
  background: #2e3b8e;
  border-radius: 2px;
  animation: ribbon-shrink 12s linear forwards;
}

@keyframes ribbon-shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* QR section */

.tv__qr-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px 14px;
  border-top: 1.5px solid #e5e7eb;
  align-items: center;
}

.tv__qr-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.tv__qr-box {
  width: 160px;
  height: 160px;
  background: #fff;
  border-radius: 8px;
  border: 1.5px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 4px;
  flex-shrink: 0;
}

.tv__qr-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.tv__qr-label {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
}

/* Footer */

.tv__footer {
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 18px;
  background: #fff;
  border-top: 2px solid #e5e7eb;
  font-size: 15px;
  font-weight: 600;
}

.tv__footer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #374151;
}

.tv__footer-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.tv__footer-dot--finished {
  background: #22c55e;
}

.tv__footer-dot--active {
  background: #2e3b8e;
}

.tv__footer-dot--waiting {
  background: #9ca3af;
}

.tv__footer-spacer {
  flex: 1;
}

.tv__footer-item--stat {
  gap: 4px;
}

/* Bracket */

.tv__bracket {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.tv__bracket-container {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tv__bracket-svg {
  display: block;
  max-width: 100%;
  max-height: 100%;
}

.tv__game-box {
  fill: #fff;
  stroke: #6b7280;
  stroke-width: 1.5;
}

.tv__game-divider {
  stroke: #9ca3af;
  stroke-width: 1.5;
}

.tv__round-header {
  font-size: 14px;
  font-weight: 700;
  fill: #374151;
  text-anchor: middle;
}

.tv__team-name {
  font-size: 15px;
  fill: #374151;
}

.tv__team-name.tv__team-winner {
  font-weight: 700;
}

.tv__team-score {
  font-size: 16px;
  font-weight: 700;
  fill: #374151;
  text-anchor: middle;
}

.tv__bg-winner {
  fill: var(--color-bracket-winner, #dcfce7);
}

.tv__bg-gold {
  fill: var(--color-bracket-gold, #fef9c3);
}

.tv__bg-silver {
  fill: var(--color-bracket-silver, #f3f4f6);
}

.tv__bg-bronze {
  fill: var(--color-bracket-bronze, #ffedd5);
}

.tv__bg-loser {
  fill: var(--color-bracket-loser, #fff);
}

.tv__score-bg-tv__bg-winner {
  fill: var(--color-bracket-winner-score, #4ade80);
}

.tv__score-bg-tv__bg-gold {
  fill: var(--color-bracket-gold-score, #facc15);
}

.tv__score-bg-tv__bg-silver {
  fill: var(--color-bracket-silver-score, #d1d5db);
}

.tv__score-bg-tv__bg-bronze {
  fill: var(--color-bracket-bronze-score, #fb923c);
}

.tv__score-bg-tv__bg-loser {
  fill: var(--color-bracket-loser-score, #f3f4f6);
}

.tv__connector-line {
  fill: none;
  stroke: #4b5563;
  stroke-width: 2.5;
}

.tv__podium {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  padding: 20px 24px;
  min-width: 260px;
  align-self: stretch;
}

.tv__podium-card {
  border-radius: 14px;
  padding: 20px 24px;
  text-align: center;
}

.tv__podium-card--gold {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #d4a017;
}

.tv__podium-card--silver {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #9ca3af;
}

.tv__podium-card--bronze {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #b45309;
}

.tv__podium-icon {
  font-size: 36px;
  margin-bottom: 6px;
}

.tv__podium-place {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.tv__podium-card--gold .tv__podium-place {
  color: #d4a017;
}

.tv__podium-card--silver .tv__podium-place {
  color: #9ca3af;
}

.tv__podium-card--bronze .tv__podium-place {
  color: #b45309;
}

.tv__podium-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}
</style>
