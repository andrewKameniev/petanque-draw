<template>
  <div class="tir-public">
    <h3 class="tir-public__title">{{ $t('tir.resultsTable') }}</h3>
    <table v-if="rankedParticipants.length" class="tir-public__table">
      <thead>
        <tr>
          <th>#</th>
          <th>{{ $t('tir.participant') }}</th>
          <th>{{ $t('ranking.points') }}</th>
          <th>{{ $t('tir.throws') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(participant, index) in rankedParticipants"
          :key="participant.id || index"
          :class="{ 'tir-public__row--qualified': isQualified(participant) }"
        >
          <td class="tir-public__rank">{{ index + 1 }}</td>
          <td>{{ participant.name }}</td>
          <td>
            <strong>{{ getTotal(participant) }}</strong> / {{ maxTotal }}
          </td>
          <td>{{ getThrows(participant) }} / {{ totalThrows }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else class="tir-public__empty">{{ $t('tir.noParticipants') }}</div>

    <!-- Playoff bracket -->
    <div v-if="tournament.tirPlayoff" class="tir-public__playoff">
      <h3 class="tir-public__title">{{ $t('games.playOff') }}</h3>
      <div
        v-for="(round, rIdx) in playoffDisplayRounds"
        :key="rIdx"
        class="tir-public__round"
        :class="{ 'tir-public__round--final': round.isFinal }"
      >
        <h4 class="tir-public__round-title">{{ round.title }}</h4>
        <div
          v-for="(match, mIdx) in round.matches"
          :key="mIdx"
          class="tir-public__match"
          :class="{ 'tir-public__match--complete': match.complete }"
        >
          <div
            class="tir-public__match-player"
            :class="{ 'tir-public__match-player--winner': match.winner === match.player1 }"
          >
            <span>{{ match.player1 || '—' }}</span>
            <span class="tir-public__match-score" v-if="match.score1 !== null">{{ match.score1 }}</span>
          </div>
          <div
            class="tir-public__match-player"
            :class="{ 'tir-public__match-player--winner': match.winner === match.player2 }"
          >
            <span>{{ match.player2 || '—' }}</span>
            <span class="tir-public__match-score" v-if="match.score2 !== null">{{ match.score2 }}</span>
          </div>
        </div>
      </div>

      <!-- Final places -->
      <div v-if="finalPlaces.length" class="tir-public__places">
        <div v-for="(place, idx) in finalPlaces" :key="idx" class="tir-public__place">
          <span class="tir-public__place-medal">{{ place.medal }}</span>
          <span class="tir-public__place-name">{{ place.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  SCORING,
  DISTANCES_FULL,
  DISTANCES_JUNIOR,
  getScoreTotal,
  getScoreCarreauCount,
  getThrowCount,
  rankParticipants,
  getTirPlayoffDisplayRounds,
} from '@/services/tir';

export default {
  name: 'TirPublicResults',
  props: {
    tournament: { type: Object, required: true },
  },
  computed: {
    isJunior() {
      return !!this.tournament.tirConfig?.junior;
    },
    distances() {
      return this.isJunior ? DISTANCES_JUNIOR : DISTANCES_FULL;
    },
    totalThrows() {
      return 5 * this.distances.length;
    },
    maxTotal() {
      return 5 * this.distances.length * SCORING.carreau;
    },
    participants() {
      return this.tournament.tirParticipants || [];
    },
    rankedParticipants() {
      return rankParticipants(this.participants, 'scores');
    },
    qualifiedNames() {
      return this.tournament.tirPlayoff?.qualified || [];
    },
    playoffDisplayRounds() {
      return getTirPlayoffDisplayRounds(this.tournament.tirPlayoff, {
        final: this.$t('games.final'),
        thirdPlace: this.$t('tir.thirdPlaceMatch'),
        semifinal: this.$t('tir.semifinal'),
        quarterfinal: this.$t('tir.quarterfinal'),
        eighthFinal: this.$t('tir.eighthFinal'),
        sixteenthFinal: this.$t('tir.sixteenthFinal'),
        round: this.$t('tir.round'),
        pending: this.$t('tir.matchPending'),
      });
    },
    finalPlaces() {
      const playoff = this.tournament.tirPlayoff;
      if (!playoff || !this.tournament.tournamentIsFinished) return [];
      const places = [];
      if (playoff.final && playoff.final.winner) {
        places.push({ medal: '🥇', name: playoff.final.winner });
        places.push({ medal: '🥈', name: playoff.final.loser });
      }
      if (playoff.thirdPlace && playoff.thirdPlace.winner) {
        places.push({ medal: '🥉', name: playoff.thirdPlace.winner });
      }
      return places;
    },
  },
  methods: {
    getTotal(participant) {
      return getScoreTotal(participant, 'scores');
    },
    getThrows(participant) {
      return getThrowCount(participant, 'scores');
    },
    getCarreauCount(participant) {
      return getScoreCarreauCount(participant, 'scores');
    },
    isQualified(participant) {
      return this.qualifiedNames.includes(participant.name);
    },
  },
};
</script>

<style scoped>
.tir-public {
  background: var(--color-surface);
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid var(--color-border);
}

.tir-public__title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.tir-public__table {
  width: 100%;
  border-collapse: collapse;
}

.tir-public__table th {
  text-align: left;
  padding: 0.75rem 0.5rem;
  border-bottom: 2px solid var(--color-border);
  font-size: 0.8rem;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.tir-public__table td {
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--color-border, #f0f0f0);
}

.tir-public__rank {
  font-weight: 600;
  color: var(--color-text-muted);
}

.tir-public__row--qualified {
  background: rgb(76 175 80 / 5%);
}

.tir-public__empty {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-muted);
}

/* Playoff */

.tir-public__playoff {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.tir-public__round {
  margin-bottom: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 12px;
}

.tir-public__round--final {
  border-color: var(--tir-touche);
  background: rgb(245 166 35 / 3%);
}

.tir-public__round-title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.tir-public__match {
  padding: 8px 10px;
  border: 1px solid var(--color-border, #f0f0f0);
  border-radius: 8px;
  margin-bottom: 6px;
}

.tir-public__match:last-child {
  margin-bottom: 0;
}

.tir-public__match--complete {
  background: rgb(76 175 80 / 4%);
  border-color: rgb(76 175 80 / 20%);
}

.tir-public__match-player {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 0.9rem;
}

.tir-public__match-player--winner {
  font-weight: 700;
  color: var(--tir-carreau);
}

.tir-public__match-score {
  font-weight: 700;
  font-size: 0.95rem;
}

/* Final places */

.tir-public__places {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tir-public__place {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--color-surface-hover);
  border-radius: 8px;
}

.tir-public__place-medal {
  font-size: 1.3rem;
}

.tir-public__place-name {
  font-weight: 600;
  font-size: 1rem;
}
</style>
