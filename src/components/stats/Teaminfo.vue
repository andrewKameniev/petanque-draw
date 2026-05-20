<template>
    <div class="team-card">
        <div class="team-card__header">
            <div class="team-card__stats" v-if="isCouch">
                <div v-if="system === 'simple'">
                    <div v-if="commonTeamStat && commonTeamStat.all.positive + commonTeamStat.all.negative > 0" class="team-card__stat-line">
                        <span class="team-card__stat-badge">{{ $t('stat.total') }}: {{ commonTeamStat.all.positive }}/{{ commonTeamStat.all.positive + commonTeamStat.all.negative }}
                            — <strong>{{ Math.round(commonTeamStat.all.positive/(commonTeamStat.all.positive + commonTeamStat.all.negative) * 100) }}%</strong>
                        </span>
                        <span class="team-card__stat-badge team-card__stat-badge--points" v-if="commonTeamStat.points.positive + commonTeamStat.points.negative !== 0">
                            P: {{ commonTeamStat.points.positive }}/{{ commonTeamStat.points.positive + commonTeamStat.points.negative }}
                            — {{ Math.round(commonTeamStat.points.positive/(commonTeamStat.points.positive + commonTeamStat.points.negative) * 100) }}%
                        </span>
                        <span class="team-card__stat-badge team-card__stat-badge--tirs" v-if="commonTeamStat.tirs.positive + commonTeamStat.tirs.negative !== 0">
                            T: {{ commonTeamStat.tirs.positive }}/{{ commonTeamStat.tirs.positive + commonTeamStat.tirs.negative }}
                            — {{ Math.round(commonTeamStat.tirs.positive/(commonTeamStat.tirs.positive + commonTeamStat.tirs.negative) * 100) }}%
                        </span>
                    </div>
                </div>
                <div v-else class="team-card__stat-line">
                    <span class="team-card__stat-badge team-card__stat-badge--points">
                        P: vol {{ commonTeamStat.points.volume / team.players.length }}% int {{ commonTeamStat.points.intensity / team.players.length }}%
                    </span>
                    <span class="team-card__stat-badge team-card__stat-badge--tirs">
                        T: vol {{ commonTeamStat.tirs.volume / team.players.length }}% int {{ commonTeamStat.tirs.intensity / team.players.length }}%
                    </span>
                </div>
            </div>
            <div class="team-card__score">
                <span class="team-card__score-label">{{ $t('stat.howManyPoints') }}</span>
                <input type="number" class="team-card__score-input"
                       min="0" max="6"
                       :value="team.score[currentMan]" @keyup.enter="$emit('next')"
                       @input="updateScore($event.target.value)">
            </div>
        </div>

        <div class="team-card__players">
            <template v-for="(player, index) in team.players" :key="index">
            <div class="team-card__player">
                <div class="team-card__player-info">
                    <button class="team-card__change-btn" @click="showChangePlayerModal(index)">
                        <UserRoundPen :size="12"/>
                    </button>
                    <div class="team-card__player-details">
                        <span class="team-card__player-name">{{ player.name || $t('stat.playerName') + ' ' + (index + 1) }}</span>
                        <div class="team-card__player-stat" v-if="isCouch && system === 'simple' && teamsStat[index].all.positive + teamsStat[index].all.negative > 0">
                            {{ teamsStat[index].all.positive }}/{{ teamsStat[index].all.positive + teamsStat[index].all.negative }}
                            — <strong>{{ Math.round(teamsStat[index].all.positive/(teamsStat[index].all.positive + teamsStat[index].all.negative) * 100) }}%</strong>
                        </div>
                        <div class="team-card__player-stat" v-else-if="isCouch && system !== 'simple'">
                            <span v-if="teamsStat[index].serie.filter(item => item.type === 'p').length">
                                P: vol {{ getFrenchStat(teamsStat[index].points.volume, teamsStat[index].serie.filter(item => item.type === 'p').length) }}%
                                int {{ getFrenchStat(teamsStat[index].points.intensity, teamsStat[index].serie.filter(item => item.type === 'p').length) }}%
                            </span>
                            <span v-if="teamsStat[index].serie.filter(item => item.type === 't').length">
                                T: vol {{ getFrenchStat(teamsStat[index].tirs.volume, teamsStat[index].serie.filter(item => item.type === 't').length) }}%
                                int {{ getFrenchStat(teamsStat[index].tirs.intensity, teamsStat[index].serie.filter(item => item.type === 't').length) }}%
                            </span>
                        </div>
                        <div class="throw-result-container" v-if="system === 'simple' && isCouch">
                            <span class="throw-result" :class="{'-success': item.success, '-carro': item.x2 && item.type === 't' && item.success}"
                                  v-for="(item, itemIndex) in teamsStat[index].serie.slice(-12)"
                                  :key="itemIndex"></span>
                        </div>
                    </div>
                </div>
                <div class="team-card__throws">
                    <ThrowResult v-for="(res, throwIndex) in team.players[index].stat[currentMan]"
                                 :info="res" :key="throwIndex" :system="system"
                                 :iterator="'throwTypeTeam' + iterator + index + throwIndex"
                                 @remove="$emit('removethrow', team, index, currentMan, throwIndex)"
                                 @add="$emit('addthrow', team, index, currentMan, throwIndex)"
                                 @super="$emit('x2throw', team, index, currentMan, throwIndex, $event)"
                                 @updatetype="$emit('updatethrow', team, index, currentMan, throwIndex, 'type', $event)"
                                 @updateresult="$emit('updatethrow', team, index, currentMan, throwIndex, 'success', $event)"
                                 @updateresultfrench="$emit('updatethrow', team, index, currentMan, throwIndex, 'french', $event)"
                                 @updatedistance="$emit('updatethrow', team, index, currentMan, throwIndex, 'distance', $event)"
                    />
                </div>
            </div>
            </template>
        </div>

        <Modal v-if="changePlayerModalOpen" @close-modal="changePlayerModalOpen = false">
            <div class="team-card__modal">
                <label class="team-card__modal-label">{{ $t('stat.enterPlayerName') }}</label>
                <input type="text" class="team-card__modal-input" v-model="changePlayerName"/>
                <button class="team-card__modal-btn"
                        @click="changePlayerModalOpen = false; $emit('changePlayer', iterator, changePlayerIndex, changePlayerName)">
                    {{ $t('stat.changePlayer') }}
                </button>
            </div>
        </Modal>
    </div>
</template>

<script>
import ThrowResult from "@/components/stats/ThrowResult.vue";
import Modal from "@/components/Modal.vue";
import {calculateCommonTeamStat, calculateTeamPlayersStat, getFrenchStat} from "@/helpers-stat";
import {UserRoundPen} from "lucide-vue-next";

export default {
    components: {Modal, ThrowResult, UserRoundPen},
    props: ['team', 'currentMan', 'iterator', 'showThrow', 'system', 'isCouch'],
    emits: ['update-score', 'removethrow', 'addthrow', 'x2throw', 'updatethrow', 'next', 'changePlayer'],
    data() {
        return {
            changePlayerModalOpen: false,
            changePlayerName: '',
            changePlayerIndex: null
        }
    },
    computed: {
        teamsStat() {
            return calculateTeamPlayersStat(this.team, this.system)
        },
        commonTeamStat() {
            return calculateCommonTeamStat(this.teamsStat, this.system);
        },
    },
    methods: {
        getFrenchStat,
        showChangePlayerModal(index) {
            this.changePlayerName = this.team.players[index].name || '';
            this.changePlayerModalOpen = true;
            this.changePlayerIndex = index;
        },
        updateScore(value) {
            this.$emit("update-score", this.team, parseInt(value, 10) || 0, this.currentMan);
        },
    }
};
</script>

<style scoped>
.team-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
}

.team-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.team-card__stats {
    flex: 1;
    min-width: 0;
}

.team-card__stat-line {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
}

.team-card__stat-badge {
    font-size: 1rem;
    font-weight: 500;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    background: var(--color-surface-alt);
    color: var(--color-text-muted);
}

.team-card__stat-badge--points {
    background: rgba(2, 198, 111, 0.1);
    color: var(--color-stat-green);
}

.team-card__stat-badge--tirs {
    background: rgba(25, 144, 255, 0.1);
    color: var(--color-stat-blue);
}

.team-card__score {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.team-card__score-label {
    font-size: 1.1rem;
    color: var(--color-text-muted);
    white-space: nowrap;
}

.team-card__score-input {
    width: 55px;
    padding: 0.4rem 0.5rem;
    border-radius: 8px;
    border: 1px solid var(--color-border);
    background: var(--color-bg-input);
    font-size: 1rem;
    font-weight: 700;
    text-align: center;
    color: var(--color-text);
    outline: none;
    transition: border-color 0.2s;
}

.team-card__score-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-shadow);
}

.team-card__players {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.team-card__player {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0.6rem;
    background: var(--color-surface-alt);
    border-radius: 8px;
}

.team-card__player-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    flex: 1;
}

.team-card__change-btn {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 0.3rem;
    border-radius: 6px;
    transition: color 0.15s, background 0.15s, border-color 0.15s;
    flex-shrink: 0;
}

.team-card__change-btn:hover {
    color: var(--color-primary);
    background: var(--color-primary-bg);
}

.team-card__player-details {
    min-width: 0;
}

.team-card__player-name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    display: block;
}

.team-card__player-stat {
    font-size: 1rem;
    color: var(--color-text-muted);
}

.team-card__throws {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.team-card__modal {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.team-card__modal-label {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
}

.team-card__modal-input {
    padding: 0.55rem 0.75rem;
    border-radius: 8px;
    border: 1px solid var(--color-border);
    background: var(--color-bg-input);
    font-size: 1rem;
    color: var(--color-text);
    outline: none;
}

.team-card__modal-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-shadow);
}

.team-card__modal-btn {
    padding: 0.55rem 1.2rem;
    border-radius: 8px;
    border: none;
    background: var(--color-primary);
    color: var(--color-btn-text);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    align-self: flex-start;
}

.team-card__modal-btn:hover {
    background: var(--color-primary-light);
}

@media screen and (max-width: 600px) {
    .team-card__header {
        flex-direction: column-reverse;
        align-items: stretch;
    }

    .team-card__score {
        justify-content: flex-end;
    }

    .team-card__player {
        flex-direction: column;
        align-items: stretch;
        gap: 0.4rem;
    }

    .team-card__throws {
        justify-content: flex-end;
    }
}
</style>
