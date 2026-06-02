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
                <tr v-for="(participant, index) in rankedParticipants" :key="participant.id || index" :class="{'tir-public__row--qualified': isQualified(participant)}">
                    <td class="tir-public__rank">{{ index + 1 }}</td>
                    <td>{{ participant.name }}</td>
                    <td><strong>{{ getTotal(participant) }}</strong> / {{ maxTotal }}</td>
                    <td>{{ getThrows(participant) }} / {{ totalThrows }}</td>
                </tr>
            </tbody>
        </table>
        <div v-else class="tir-public__empty">{{ $t('tir.noParticipants') }}</div>

        <!-- Playoff bracket -->
        <div v-if="tournament.tirPlayoff" class="tir-public__playoff">
            <h3 class="tir-public__title">{{ $t('games.playOff') }}</h3>
            <div v-for="(round, rIdx) in playoffDisplayRounds" :key="rIdx" class="tir-public__round" :class="{'tir-public__round--final': round.isFinal}">
                <h4 class="tir-public__round-title">{{ round.title }}</h4>
                <div v-for="(match, mIdx) in round.matches" :key="mIdx" class="tir-public__match" :class="{'tir-public__match--complete': match.complete}">
                    <div class="tir-public__match-player" :class="{'tir-public__match-player--winner': match.winner === match.player1}">
                        <span>{{ match.player1 || '—' }}</span>
                        <span class="tir-public__match-score" v-if="match.score1 !== null">{{ match.score1 }}</span>
                    </div>
                    <div class="tir-public__match-player" :class="{'tir-public__match-player--winner': match.winner === match.player2}">
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
const SCORING = {carreau: 5, reussi: 3, touche: 1, manque: 0};

export default {
    name: 'TirPublicResults',
    props: {
        tournament: {type: Object, required: true}
    },
    computed: {
        isJunior() {
            return !!this.tournament.tirConfig?.junior;
        },
        distances() {
            return this.isJunior ? [6, 7, 8] : [6, 7, 8, 9];
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
            return [...this.participants].sort((a, b) => this.getTotal(b) - this.getTotal(a) || this.getCarreauCount(b) - this.getCarreauCount(a));
        },
        qualifiedNames() {
            return this.tournament.tirPlayoff?.qualified || [];
        },
        playoffDisplayRounds() {
            const playoff = this.tournament.tirPlayoff;
            if (!playoff) return [];
            const rounds = [];
            const firstRoundMatches = playoff.rounds?.[0]?.matches?.length || 0;
            const playoffSize = firstRoundMatches > 0 ? firstRoundMatches * 2 : playoff.size || 2;

            if (playoff.rounds) {
                playoff.rounds.forEach((round, rIdx) => {
                    const matchCount = round.matches.length;
                    rounds.push({
                        title: this.getRoundTitle(matchCount, playoffSize),
                        matches: round.matches,
                        isFinal: false
                    });
                });
            }

            if (playoff.thirdPlace) {
                rounds.push({
                    title: this.$t('tir.thirdPlaceMatch'),
                    matches: [playoff.thirdPlace],
                    isFinal: false
                });
            }

            if (playoff.final) {
                rounds.push({
                    title: this.$t('games.final'),
                    matches: [playoff.final],
                    isFinal: true
                });
            }

            return rounds;
        },
        finalPlaces() {
            const playoff = this.tournament.tirPlayoff;
            if (!playoff || !this.tournament.tournamentIsFinished) return [];
            const places = [];
            if (playoff.final && playoff.final.winner) {
                places.push({medal: '🥇', name: playoff.final.winner});
                places.push({medal: '🥈', name: playoff.final.loser});
            }
            if (playoff.thirdPlace && playoff.thirdPlace.winner) {
                places.push({medal: '🥉', name: playoff.thirdPlace.winner});
            }
            return places;
        }
    },
    methods: {
        getTotal(participant) {
            if (!participant.scores) return 0;
            let total = 0;
            Object.values(participant.scores).forEach(atelier => {
                Object.values(atelier).forEach(val => {
                    total += SCORING[val] || 0;
                });
            });
            return total;
        },
        getThrows(participant) {
            if (!participant.scores) return 0;
            let count = 0;
            Object.values(participant.scores).forEach(atelier => {
                count += Object.keys(atelier).length;
            });
            return count;
        },
        getCarreauCount(participant) {
            if (!participant.scores) return 0;
            let count = 0;
            Object.values(participant.scores).forEach(atelier => {
                Object.values(atelier).forEach(val => {
                    if (val === 'carreau') count++;
                });
            });
            return count;
        },
        isQualified(participant) {
            return this.qualifiedNames.includes(participant.name);
        },
        getRoundTitle(matchCount, playoffSize) {
            if (playoffSize === 2) return this.$t('games.final');
            if (matchCount === 2) return this.$t('tir.semifinal');
            if (matchCount === 4) return this.$t('tir.quarterfinal');
            if (matchCount === 8) return this.$t('tir.eighthFinal');
            if (matchCount === 16) return this.$t('tir.sixteenthFinal');
            return this.$t('tir.round') + ' ' + matchCount;
        }
    }
}
</script>

<style scoped>
.tir-public {
    background: var(--card-bg, #fff);
    border-radius: 12px;
    padding: 1.25rem;
    border: 1px solid var(--color-border, #e0e0e0);
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
    border-bottom: 2px solid var(--color-border, #e0e0e0);
    font-size: 0.8rem;
    text-transform: uppercase;
    color: var(--text-secondary, #666);
}

.tir-public__table td {
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid var(--color-border, #f0f0f0);
}

.tir-public__rank {
    font-weight: 600;
    color: var(--text-secondary, #666);
}

.tir-public__row--qualified {
    background: rgba(76, 175, 80, 0.05);
}

.tir-public__empty {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary, #888);
}

/* Playoff */
.tir-public__playoff {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border, #e0e0e0);
}

.tir-public__round {
    margin-bottom: 1rem;
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 10px;
    padding: 12px;
}

.tir-public__round--final {
    border-color: var(--primary-color, #f5a623);
    background: rgba(245, 166, 35, 0.03);
}

.tir-public__round-title {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-secondary, #666);
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
    background: rgba(76, 175, 80, 0.04);
    border-color: rgba(76, 175, 80, 0.2);
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
    color: #4caf50;
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
    background: var(--bg-secondary, #f9f9f9);
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
