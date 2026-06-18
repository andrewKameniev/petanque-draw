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
          <img src="../assets/img/tv-logo.png" alt="logo" class="tv__logo" />
        </div>
        <div class="tv__header-center">
          <div class="tv__system-box">
            <span class="tv__system-label">СИСТЕМА</span>
            <span class="tv__system-text">{{ systemSummary }}</span>
          </div>
          <div class="tv__timer-box" :class="{ 'tv__timer-box--ended': timerEnded }">
            <div class="tv__timer-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        <section v-if="!showPlayoffBracket" class="tv__matches">
          <div class="tv__matches-grid" :style="gridStyle">
            <div
              v-for="(game, index) in currentGames"
              :key="index"
              class="tv__card"
              :class="cardClass(game)"
            >
              <div class="tv__card-header">
                <span class="tv__card-lane" :class="laneClass(game)">{{ gameLane(index) }}</span>
                <span class="tv__card-lane-label">Доріжка {{ gameLane(index) }}</span>
              </div>
              <div class="tv__card-body">
                <div class="tv__card-row">
                  <span class="tv__card-name" :class="{ 'tv__card-name--winner': isWinner(game, 1) }">{{ formatName(game.team_1) }}</span>
                  <span class="tv__card-score">{{ gameScore(game, 1) }}</span>
                </div>
                <div class="tv__card-row">
                  <span class="tv__card-name" :class="{ 'tv__card-name--winner': isWinner(game, 2) }">{{ formatName(game.team_2) }}</span>
                  <span class="tv__card-score">{{ gameScore(game, 2) }}</span>
                </div>
              </div>
              <div v-if="game.score_history && game.score_history.length" class="tv__card-history">
                <span v-for="(entry, i) in game.score_history" :key="i" class="tv__card-chip">
                  {{ entry.s1 }}-{{ entry.s2 }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Playoff bracket view -->
        <section v-else class="tv__bracket">
          <div class="tv__bracket-container">
            <svg :width="bracketWidth" :height="bracketHeight" class="tv__bracket-svg">
              <g v-for="(stage, si) in bracketStages" :key="si">
                <text :x="stage.x + bracketBoxWidth / 2" :y="20" class="tv__bracket-header">
                  {{ stage.label }}
                </text>
                <g v-for="(game, gi) in stage.games" :key="gi">
                  <rect :x="game.x" :y="game.y" :width="bracketBoxWidth" :height="bracketBoxHeight" rx="6" class="tv__bracket-box" />
                  <line :x1="game.x + 1" :y1="game.y + bracketBoxHeight / 2" :x2="game.x + bracketBoxWidth - 1" :y2="game.y + bracketBoxHeight / 2" class="tv__bracket-divider" />
                  <text :x="game.x + 10" :y="game.y + bracketBoxHeight / 4 + 5" class="tv__bracket-name" :class="{ 'tv__bracket-name--winner': isBracketWinner(game.data, 1) }">
                    {{ truncBracketName(game.data.team_1) }}
                  </text>
                  <text :x="game.x + bracketBoxWidth - 20" :y="game.y + bracketBoxHeight / 4 + 5" class="tv__bracket-score">
                    {{ game.data.team_1_score ?? '' }}
                  </text>
                  <text :x="game.x + 10" :y="game.y + (bracketBoxHeight * 3) / 4 + 5" class="tv__bracket-name" :class="{ 'tv__bracket-name--winner': isBracketWinner(game.data, 2) }">
                    {{ truncBracketName(game.data.team_2) }}
                  </text>
                  <text :x="game.x + bracketBoxWidth - 20" :y="game.y + (bracketBoxHeight * 3) / 4 + 5" class="tv__bracket-score">
                    {{ game.data.team_2_score ?? '' }}
                  </text>
                </g>
              </g>
              <g class="tv__bracket-connectors">
                <path v-for="(p, i) in bracketConnectors" :key="'c' + i" :d="p" class="tv__bracket-connector" />
              </g>
              <!-- Third place -->
              <g v-if="bracketThirdPlace">
                <text :x="bracketThirdPlace.x + bracketBoxWidth / 2" :y="bracketThirdPlace.y - 8" class="tv__bracket-header">
                  3-є місце
                </text>
                <rect :x="bracketThirdPlace.x" :y="bracketThirdPlace.y" :width="bracketBoxWidth" :height="bracketBoxHeight" rx="6" class="tv__bracket-box" />
                <line :x1="bracketThirdPlace.x + 1" :y1="bracketThirdPlace.y + bracketBoxHeight / 2" :x2="bracketThirdPlace.x + bracketBoxWidth - 1" :y2="bracketThirdPlace.y + bracketBoxHeight / 2" class="tv__bracket-divider" />
                <text :x="bracketThirdPlace.x + 10" :y="bracketThirdPlace.y + bracketBoxHeight / 4 + 5" class="tv__bracket-name">
                  {{ truncBracketName(bracketThirdPlace.data.team_1) }}
                </text>
                <text :x="bracketThirdPlace.x + bracketBoxWidth - 20" :y="bracketThirdPlace.y + bracketBoxHeight / 4 + 5" class="tv__bracket-score">
                  {{ bracketThirdPlace.data.team_1_score ?? '' }}
                </text>
                <text :x="bracketThirdPlace.x + 10" :y="bracketThirdPlace.y + (bracketBoxHeight * 3) / 4 + 5" class="tv__bracket-name">
                  {{ truncBracketName(bracketThirdPlace.data.team_2) }}
                </text>
                <text :x="bracketThirdPlace.x + bracketBoxWidth - 20" :y="bracketThirdPlace.y + (bracketBoxHeight * 3) / 4 + 5" class="tv__bracket-score">
                  {{ bracketThirdPlace.data.team_2_score ?? '' }}
                </text>
              </g>
            </svg>
          </div>
        </section>
      </main>

      <!-- Bottom status bar -->
      <footer class="tv__footer">
        <span class="tv__footer-item tv__footer-item--finished">
          <span class="tv__footer-dot tv__footer-dot--finished"></span>
          ЗАВЕРШЕНО
        </span>
        <span class="tv__footer-item tv__footer-item--active">
          <span class="tv__footer-dot tv__footer-dot--active"></span>
          ТРИВАЄ
        </span>
        <span class="tv__footer-item tv__footer-item--waiting">
          <span class="tv__footer-dot tv__footer-dot--waiting"></span>
          ОЧІКУЄ
        </span>
        <span class="tv__footer-spacer"></span>
        <span class="tv__footer-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          {{ phaseLabel }}
        </span>
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
    <aside class="tv__sidebar">
      <div class="tv__table-wrapper">
        <h2 class="tv__table-title">ТУРНІРНА ТАБЛИЦЯ</h2>
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
              :class="{ 'tv__table-row--qualified': playoffQualifyCount && (currentTablePage * tablePageSize + index) < playoffQualifyCount }"
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
            {{ currentTablePage * tablePageSize + 1 }}–{{ Math.min((currentTablePage + 1) * tablePageSize, flatRanking.length) }} з {{ flatRanking.length }}
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
          <span class="tv__qr-label">Підтримати турнір</span>
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
import { getTeamsRanking } from '@/helpers';
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
      if (this.totalTablePages > 1) {
        this.currentTablePage = (this.currentTablePage + 1) % this.totalTablePages;
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
      return this.tournament.roundIsActive
        ? this.tournament.games.length
        : this.tournament.games.length + 1;
    },
    currentGames() {
      if (this.tournament?.cadrage) return this.tournament.cadrage;
      if (!this.tournament?.games?.length) return [];
      return this.tournament.games[this.tournament.games.length - 1] || [];
    },
    showPlayoffBracket() {
      return !!this.tournament?.playOff && !!this.tournament?.playOffBracket;
    },
    gridStyle() {
      const count = this.currentGames.length;
      let cols;
      if (count <= 4) cols = 2;
      else if (count <= 6) cols = 3;
      else if (count <= 12) cols = 4;
      else if (count <= 35) cols = 5;
      else cols = 6;
      const rows = Math.ceil(count / cols);
      return {
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      };
    },
    systemSummary() {
      if (!this.tournament) return '';
      const prefs = this.tournament.preferences;
      const rounds = prefs?.swissRoundsCount || this.tournament.games?.length || 4;
      let text = `${rounds} кола швейцарки`;
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
    matchStats() {
      const games = this.currentGames;
      let finished = 0, active = 0, waiting = 0;
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
    bracketBoxWidth() { return 220; },
    bracketBoxHeight() { return 64; },
    bracketColGap() { return 44; },
    bracketRowGap() { return 16; },
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
      return 56 + firstCount * (this.bracketBoxHeight + this.bracketRowGap) + 40;
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
        'games', 'roundIsActive', 'roundTimer', 'playOff', 'playOffBracket',
        'playOffStage', 'cadrage', 'barrage', 'tournamentIsFinished',
        'tournamentIsStarted', 'teams', 'preferences',
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
      if (!game.status || game.status === 'not_started') return '—';
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
    truncBracketName(name) {
      if (!name) return '—';
      if (name.length > 20) return name.substring(0, 18) + '…';
      return name;
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
  grid-template-rows: 135px 1fr 50px;
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
  to { transform: rotate(360deg); }
}

/* Header */

.tv__header {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  border-bottom: 2px solid #e5e7eb;
  background: #fff;
}

.tv__header-left {
  display: flex;
  align-items: center;
}

.tv__logo {
  height: 100%;
  width: 320px;
  object-fit: cover;
}

.tv__header-center {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 10px 0;
}

.tv__system-box {
  background: #4b1fc4;
  color: #fff;
  padding: 14px 28px;
  border-radius: 12px;
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
  font-size: 22px;
  font-weight: 700;
  white-space: pre-line;
}

.tv__timer-box {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #f0fdf4;
  border: 2px solid #1f9d3a;
  border-radius: 14px;
  padding: 12px 28px;
}

.tv__timer-box--ended {
  background: #fef2f2;
  border-color: #dc2626;
}

.tv__timer-icon {
  color: #1f9d3a;
}

.tv__timer-box--ended .tv__timer-icon {
  color: #dc2626;
}

.tv__timer-value {
  font-size: 64px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: #111827;
}

.tv__timer-meta {
  display: flex;
  flex-direction: column;
  font-size: 20px;
  font-weight: 600;
  color: #374151;
}

.tv__timer-cochonettes {
  color: #4b1fc4;
  font-size: 16px;
}

.tv__header-right {
  text-align: right;
  padding: 10px 20px;
}

.tv__clock {
  font-size: 44px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #111827;
}

.tv__date {
  font-size: 18px;
  color: #6b7280;
}

/* Main layout */

.tv__main {
  padding: 8px 10px;
  min-height: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
}

/* Matches grid */

.tv__matches {
  min-height: 0;
  overflow: hidden;
  width: 100%;
}

.tv__matches-grid {
  display: grid;
  gap: 8px;
  height: 100%;
}

/* Match card */

.tv__card {
  border-radius: 8px;
  border: 1.5px solid #e5e7eb;
  background: #fff;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-size: cover;
  background-position: center;
}

.tv__card--active {
  background-image: url('@/assets/img/card-bg-active.png');
  border-color: #8b5cf6;
}

.tv__card--finished {
  background-image: url('@/assets/img/card-bg-finished.png');
  border-color: #22c55e;
}

.tv__card--waiting {
  background-image: url('@/assets/img/card-bg-upcoming.png');
  border-color: #d1d5db;
}

.tv__card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.tv__card-lane {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #e5e7eb;
  color: #374151;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tv__card-lane--active {
  background: #8b5cf6;
  color: #fff;
}

.tv__card-lane--finished {
  background: #22c55e;
  color: #fff;
}

.tv__card-lane-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.tv__card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}

.tv__card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tv__card-name {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: calc(100% - 36px);
}

.tv__card-name--winner {
  color: #111827;
  font-weight: 800;
}

.tv__card-score {
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  min-width: 24px;
  text-align: right;
}

.tv__card-history {
  display: flex;
  gap: 4px;
  margin-top: 2px;
  flex-wrap: nowrap;
  overflow: hidden;
}

.tv__card-chip {
  font-size: 11px;
  font-weight: 600;
  background: #e5e7eb;
  color: #374151;
  padding: 1px 5px;
  border-radius: 4px;
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
}

.tv__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.tv__table thead th {
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  text-align: left;
  padding: 4px;
  border-bottom: 1.5px solid #e5e7eb;
}

.tv__table thead th:first-child {
  width: 28px;
  text-align: center;
}

.tv__table thead th:nth-child(n+3) {
  text-align: center;
  width: 36px;
}

.tv__table thead th:last-child {
  width: 48px;
  text-align: center;
}

.tv__table tbody td {
  padding: 3px 4px;
  border-bottom: 1px solid #f3f4f6;
  font-variant-numeric: tabular-nums;
}

.tv__table tbody td:first-child {
  text-align: center;
  font-weight: 700;
  color: #6b7280;
}

.tv__table tbody td:nth-child(n+3) {
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

.tv__table-row--qualified td {
  background: #ecfdf5;
}

.tv__table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.tv__table-pager {
  font-style: italic;
}

.tv__table-total {
  margin-left: auto;
}

/* QR section */

.tv__qr-section {
  display: flex;
  gap: 20px;
  padding: 12px 14px 14px;
  border-top: 1.5px solid #e5e7eb;
  justify-content: center;
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
  font-size: 14px;
  font-weight: 700;
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
  font-size: 13px;
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
  background: #8b5cf6;
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
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tv__bracket-container {
  overflow: hidden;
}

.tv__bracket-svg {
  display: block;
}

.tv__bracket-box {
  fill: #fff;
  stroke: #e5e7eb;
  stroke-width: 1.5;
}

.tv__bracket-divider {
  stroke: #e5e7eb;
  stroke-width: 1;
}

.tv__bracket-header {
  font-size: 13px;
  font-weight: 700;
  fill: #6b7280;
  text-anchor: middle;
}

.tv__bracket-name {
  font-size: 13px;
  font-weight: 600;
  fill: #374151;
}

.tv__bracket-name--winner {
  font-weight: 800;
  fill: #111827;
}

.tv__bracket-score {
  font-size: 14px;
  font-weight: 800;
  fill: #111827;
  text-anchor: end;
}

.tv__bracket-connector {
  fill: none;
  stroke: #d1d5db;
  stroke-width: 1.5;
}
</style>
