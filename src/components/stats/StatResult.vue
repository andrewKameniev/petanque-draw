<script>
import { calculateCommonTeamStat, calculateTeamPlayersStat, getFrenchStat } from '@/helpers-stat';

export default {
  name: 'StatResult',
  props: ['team', 'system', 'label'],
  computed: {
    teamStats() {
      return calculateTeamPlayersStat(this.team, this.system);
    },
    commonStat() {
      return calculateCommonTeamStat(this.teamStats, this.system);
    },
    boulesOnMan() {
      const infoEveryMan = [];
      this.team.players.forEach((player) => {
        const playerStat = !Array.isArray(player.stat) ? Array.from(player.stat) : player.stat;
        playerStat.forEach((man, index) => {
          if (man) {
            infoEveryMan[index] = (infoEveryMan[index] || 0) + man.reduce((acc, item) => acc + Number(item.success), 0);
          }
        });
      });
      return infoEveryMan;
    },
    filledScores() {
      let fillScoresArray = [];
      for (let i = 0; i < this.boulesOnMan.length; i++) {
        fillScoresArray.push(this.team.score ? this.team.score[i] || 0 : 0);
      }
      return fillScoresArray;
    },
    tableChunks() {
      const chunkSize = window.innerWidth <= 768 ? 11 : 16;
      const total = this.boulesOnMan.length;
      if (total <= chunkSize) return [{ start: 0, end: total }];
      const chunks = [];
      for (let i = 0; i < total; i += chunkSize) {
        chunks.push({ start: i, end: Math.min(i + chunkSize, total) });
      }
      return chunks;
    },
    hasData() {
      return this.teamStats.some((s) => s.serie.length > 0);
    },
  },
  methods: {
    getFrenchStat,
    countTeamScore(scores) {
      if (scores) {
        if (!Array.isArray(scores)) {
          const tempArray = [];
          Object.values(scores).forEach((value) => tempArray.push(value));
          scores = tempArray;
        }

        return scores.filter((value) => value !== undefined).reduce((acc, value) => acc + value, 0);
      } else {
        return '0';
      }
    },
    pct(positive, negative) {
      const total = positive + negative;
      if (total === 0) return 0;
      return Math.round((positive / total) * 100);
    },
    isImportantPresent(index) {
      return (
        this.teamStats[index].important.points.positive +
          this.teamStats[index].important.points.negative +
          this.teamStats[index].important.tirs.positive +
          this.teamStats[index].important.tirs.negative >
        0
      );
    },
  },
};
</script>

<template>
  <div class="stat-result">
    <div class="stat-result__header">
      <span class="stat-result__label">{{ label }}</span>
      <span class="stat-result__score">{{ countTeamScore(team.score) }}</span>
    </div>

    <div v-if="!hasData" class="stat-result__empty">
      {{ $t('stat.noData') || 'No data recorded' }}
    </div>

    <template v-else>
      <div class="stat-result__section" v-if="team.players.length > 1">
        <div class="stat-result__section-title">{{ $t('stat.teamStats') || 'Team statistics' }}</div>
        <div v-if="system === 'simple'" class="stat-result__stats-grid">
          <div class="stat-result__stat-row">
            <span class="stat-result__stat-label">{{ $t('stat.total') }}</span>
            <span class="stat-result__stat-value"
              >{{ commonStat.all.positive }}/{{ commonStat.all.positive + commonStat.all.negative }}</span
            >
            <span class="stat-result__stat-pct">{{ pct(commonStat.all.positive, commonStat.all.negative) }}%</span>
          </div>
          <div class="stat-result__stat-row">
            <span class="stat-result__stat-label">{{ $t('stat.points') }}</span>
            <span class="stat-result__stat-value"
              >{{ commonStat.points.positive }}/{{ commonStat.points.positive + commonStat.points.negative }}</span
            >
            <span class="stat-result__stat-pct" v-if="commonStat.points.positive + commonStat.points.negative > 0"
              >{{ pct(commonStat.points.positive, commonStat.points.negative) }}%</span
            >
            <span class="stat-result__stat-pct stat-result__stat-pct--empty" v-else>-</span>
          </div>
          <div class="stat-result__stat-row">
            <span class="stat-result__stat-label">{{ $t('stat.tirs') }}</span>
            <span class="stat-result__stat-value"
              >{{ commonStat.tirs.positive }}/{{ commonStat.tirs.positive + commonStat.tirs.negative }}</span
            >
            <span class="stat-result__stat-pct" v-if="commonStat.tirs.positive + commonStat.tirs.negative > 0"
              >{{ pct(commonStat.tirs.positive, commonStat.tirs.negative) }}%</span
            >
            <span class="stat-result__stat-pct stat-result__stat-pct--empty" v-else>-</span>
          </div>
        </div>
        <div v-else class="stat-result__stats-grid">
          <div class="stat-result__stat-row">
            <span class="stat-result__stat-label">{{ $t('stat.points') }}</span>
            <span class="stat-result__stat-value"
              >vol. {{ Math.round(commonStat.points.volume / team.players.length) }}% | int.
              {{ Math.round(commonStat.points.intensity / team.players.length) }}% | eff.
              {{
                Math.round((commonStat.points.volume + commonStat.points.intensity) / 2 / team.players.length)
              }}%</span
            >
          </div>
          <div class="stat-result__stat-row">
            <span class="stat-result__stat-label">{{ $t('stat.tirs') }}</span>
            <span class="stat-result__stat-value"
              >vol. {{ Math.round(commonStat.tirs.volume / team.players.length) }}% | int.
              {{ Math.round(commonStat.tirs.intensity / team.players.length) }}% | eff.
              {{ Math.round((commonStat.tirs.volume + commonStat.tirs.intensity) / 2 / team.players.length) }}%</span
            >
          </div>
        </div>
      </div>

      <div class="stat-result__section">
        <div class="stat-result__section-title">{{ $t('stat.everyManRes') }}</div>
        <div class="stat-result__table-wrap" v-for="(chunk, ci) in tableChunks" :key="ci">
          <table class="stat-result__table">
            <thead>
              <tr>
                <th></th>
                <th v-for="i in chunk.end - chunk.start" :key="i">{{ chunk.start + i }}</th>
                <th v-if="ci === tableChunks.length - 1">Av</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="stat-result__table-label">Res.</td>
                <td v-for="i in chunk.end - chunk.start" :key="i">{{ boulesOnMan[chunk.start + i - 1] }}</td>
                <td v-if="ci === tableChunks.length - 1" class="stat-result__table-avg">
                  {{ (boulesOnMan.reduce((acc, item) => acc + item, 0) / boulesOnMan.length).toFixed(1) }}
                </td>
              </tr>
              <tr>
                <td class="stat-result__table-label">Win</td>
                <td v-for="i in chunk.end - chunk.start" :key="i">{{ filledScores[chunk.start + i - 1] || 0 }}</td>
                <td v-if="ci === tableChunks.length - 1" class="stat-result__table-avg">
                  {{ filledScores.reduce((acc, item) => acc + item, 0) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="stat-result__players">
        <div class="stat-result__player" v-for="(player, index) in team.players" :key="index">
          <div class="stat-result__player-name">
            {{ player.name || $t('stat.playerName') + ' ' + (index + 1) }}
          </div>
          <div v-if="system === 'simple'">
            <div class="stat-result__heatmap" v-if="teamStats[index].serieByRound?.length">
              <div
                v-for="(round, rIdx) in teamStats[index].serieByRound"
                :key="rIdx"
                class="stat-result__heatmap-col"
                :class="{ 'stat-result__heatmap-col--gap': rIdx > 0 && rIdx % 5 === 0 }"
              >
                <span
                  v-for="(item, tIdx) in round"
                  :key="tIdx"
                  class="stat-result__heatmap-cell"
                  :class="{
                    'stat-result__heatmap-cell--point-hit': item.type === 'p' && item.success,
                    'stat-result__heatmap-cell--point-miss': item.type === 'p' && !item.success,
                    'stat-result__heatmap-cell--tir-hit': item.type === 't' && item.success && !item.x2,
                    'stat-result__heatmap-cell--tir-miss': item.type === 't' && !item.success,
                    'stat-result__heatmap-cell--carro': item.type === 't' && item.success && item.x2,
                  }"
                ></span>
              </div>
            </div>
            <div v-if="isImportantPresent(index)" class="stat-result__important-label">
              {{ $t('stat.important') }}
            </div>
            <div class="stat-result__stats-grid">
              <div class="stat-result__stat-row">
                <span class="stat-result__stat-label">{{ $t('stat.total') }}</span>
                <span class="stat-result__stat-value"
                  >{{ teamStats[index].all.positive }}/{{
                    teamStats[index].all.positive + teamStats[index].all.negative
                  }}</span
                >
                <span class="stat-result__stat-pct"
                  >{{ pct(teamStats[index].all.positive, teamStats[index].all.negative) }}%</span
                >
                <span class="stat-result__stat-important" v-if="isImportantPresent(index)">
                  {{ teamStats[index].important.points.positive + teamStats[index].important.tirs.positive }}/{{
                    teamStats[index].important.points.positive +
                    teamStats[index].important.tirs.positive +
                    teamStats[index].important.points.negative +
                    teamStats[index].important.tirs.negative
                  }}
                  ({{
                    pct(
                      teamStats[index].important.points.positive + teamStats[index].important.tirs.positive,
                      teamStats[index].important.points.negative + teamStats[index].important.tirs.negative,
                    )
                  }}%)
                </span>
              </div>
              <div class="stat-result__stat-row">
                <span class="stat-result__stat-label">{{ $t('stat.points') }}</span>
                <span class="stat-result__stat-value"
                  >{{ teamStats[index].points.positive }}/{{
                    teamStats[index].points.positive + teamStats[index].points.negative
                  }}</span
                >
                <span
                  class="stat-result__stat-pct"
                  v-if="teamStats[index].points.positive + teamStats[index].points.negative > 0"
                  >{{ pct(teamStats[index].points.positive, teamStats[index].points.negative) }}%</span
                >
                <span class="stat-result__stat-pct stat-result__stat-pct--empty" v-else>-</span>
                <span class="stat-result__stat-extra" v-if="teamStats[index].x2?.points.positive"
                  >({{ teamStats[index].x2.points.positive }} x2)</span
                >
              </div>
              <div class="stat-result__stat-row">
                <span class="stat-result__stat-label">{{ $t('stat.tirs') }}</span>
                <span class="stat-result__stat-value"
                  >{{ teamStats[index].tirs.positive }}/{{
                    teamStats[index].tirs.positive + teamStats[index].tirs.negative
                  }}</span
                >
                <span
                  class="stat-result__stat-pct"
                  v-if="teamStats[index].tirs.positive + teamStats[index].tirs.negative > 0"
                  >{{ pct(teamStats[index].tirs.positive, teamStats[index].tirs.negative) }}%</span
                >
                <span class="stat-result__stat-pct stat-result__stat-pct--empty" v-else>-</span>
                <span class="stat-result__stat-extra" v-if="teamStats[index].x2?.tirs.positive"
                  >({{ teamStats[index].x2.tirs.positive }} carro)</span
                >
              </div>
            </div>
          </div>
          <div v-else>
            <div
              class="stat-result__stats-grid"
              v-if="teamStats[index].serie.filter((item) => item.type === 'p').length"
            >
              <div class="stat-result__stat-row">
                <span class="stat-result__stat-label">Point</span>
                <span class="stat-result__stat-value"
                  >vol:
                  {{
                    getFrenchStat(
                      teamStats[index].points.volume,
                      teamStats[index].serie.filter((item) => item.type === 'p').length,
                    )
                  }}% | int:
                  {{
                    getFrenchStat(
                      teamStats[index].points.intensity,
                      teamStats[index].serie.filter((item) => item.type === 'p').length,
                    )
                  }}% | eff:
                  {{
                    (getFrenchStat(
                      teamStats[index].points.volume,
                      teamStats[index].serie.filter((item) => item.type === 'p').length,
                    ) +
                      getFrenchStat(
                        teamStats[index].points.intensity,
                        teamStats[index].serie.filter((item) => item.type === 'p').length,
                      )) /
                    2
                  }}%</span
                >
              </div>
            </div>
            <div
              class="stat-result__stats-grid"
              v-if="teamStats[index].serie.filter((item) => item.type === 't').length"
            >
              <div class="stat-result__stat-row">
                <span class="stat-result__stat-label">Tir</span>
                <span class="stat-result__stat-value"
                  >vol:
                  {{
                    getFrenchStat(
                      teamStats[index].tirs.volume,
                      teamStats[index].serie.filter((item) => item.type === 't').length,
                    )
                  }}% | int:
                  {{
                    getFrenchStat(
                      teamStats[index].tirs.intensity,
                      teamStats[index].serie.filter((item) => item.type === 't').length,
                    )
                  }}% | eff:
                  {{
                    (getFrenchStat(
                      teamStats[index].tirs.volume,
                      teamStats[index].serie.filter((item) => item.type === 't').length,
                    ) +
                      getFrenchStat(
                        teamStats[index].tirs.intensity,
                        teamStats[index].serie.filter((item) => item.type === 't').length,
                      )) /
                    2
                  }}%</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stat-result {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1rem;
  overflow: hidden;
}

.stat-result__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border-light);
}

.stat-result__label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.stat-result__score {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-result__empty {
  text-align: center;
  padding: 1.5rem 0;
  color: var(--color-text-muted);
  font-size: 1rem;
}

.stat-result__section {
  margin-bottom: 0.75rem;
}

.stat-result__section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.5rem;
}

.stat-result__stats-grid {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-result__stat-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  line-height: 1.6;
}

.stat-result__stat-label {
  color: var(--color-text-muted);
  min-width: 50px;
  font-size: 1rem;
}

.stat-result__stat-value {
  color: var(--color-text);
}

.stat-result__stat-pct {
  font-weight: 700;
  color: var(--color-text);
}

.stat-result__stat-pct--empty {
  color: var(--color-text-muted);
  font-weight: 400;
}

.stat-result__stat-important {
  font-size: 1rem;
  color: var(--color-text-muted);
  margin-left: auto;
}

.stat-result__stat-extra {
  font-size: 1rem;
  color: var(--color-text-muted);
}

.stat-result__table-wrap {
  overflow-x: auto;
  margin-bottom: 0.25rem;
}

.stat-result__table {
  border-collapse: collapse;
  font-size: 1rem;
  text-align: center;
}

.stat-result__table th {
  font-weight: 500;
  color: var(--color-text-muted);
  padding: 0.35rem 0.5rem;
  font-size: 1rem;
  border-bottom: 1px solid var(--color-border-light);
}

.stat-result__table td {
  padding: 0.35rem 0.5rem;
  color: var(--color-text);
}

.stat-result__table tbody tr:first-child td {
  border-bottom: 1px solid var(--color-border-light);
}

.stat-result__table-label {
  text-align: left;
  font-size: 1rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.stat-result__table-avg {
  font-weight: 600;
  color: var(--color-primary);
}

.stat-result__players {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-result__player {
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 0.75rem;
}

.stat-result__player-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.4rem;
}

.stat-result__important-label {
  font-size: 1rem;
  color: var(--color-text-muted);
  text-align: right;
  text-transform: capitalize;
  margin-bottom: 0.2rem;
}

.stat-result__heatmap {
  display: inline-flex;
  gap: 2px;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
  padding: 0.4rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: #fff;
}

.stat-result__heatmap-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-result__heatmap-col--gap {
  margin-left: 6px;
}

.stat-result__heatmap-cell {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.stat-result__heatmap-cell--point-hit {
  background: #2d6a30;
}

.stat-result__heatmap-cell--point-miss {
  background: #d4edda;
}

.stat-result__heatmap-cell--tir-hit {
  background: #e67700;
}

.stat-result__heatmap-cell--tir-miss {
  background: #fff3cd;
}

.stat-result__heatmap-cell--carro {
  background: #dc2626;
}

@media screen and (max-width: 500px) {
  .stat-result {
    padding: 0.75rem 0.5rem;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}
</style>
