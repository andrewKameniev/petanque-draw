<template>
    <Modal @close-modal="$emit('close')">
        <div class="confirm-playoff" data-testid="playoff-confirm-modal">
            <h3 class="confirm-playoff__title">{{ $t('ranking.goPlayOff') }}</h3>

            <div v-if="!withBarrage" class="confirm-playoff__field">
                <label class="confirm-playoff__label">{{ $t('modals.playOffTeams') }}</label>
                <div class="select">
                    <select data-testid="confirm-playoff-teams" v-model.number="tournament.preferences.playOffTeams">
                        <template v-for="value in teamToPlayOffValues" :key="value">
                            <option :value="value" v-if="tournament.teams.length >= value">{{ value }}</option>
                        </template>
                    </select>
                </div>
            </div>

            <div v-if="tournament.system === 'swiss'" class="confirm-playoff__field">
                <label class="confirm-playoff__checkbox">
                    <input type="checkbox" v-model="withCadrage" data-testid="confirm-cadrage">
                    {{ $t('ranking.withCadrage') }}
                </label>
                <span class="confirm-playoff__hint">{{ $t('ranking.cadrageHint') }}</span>
                <span v-if="withCadrage && teamToPlayOff" class="confirm-playoff__hint">{{ teamToPlayOff / 2 }} + {{ teamToPlayOff }} {{ $t('teams.teams').toLowerCase() }}</span>
            </div>

            <div v-if="tournament.system === 'swiss'" class="confirm-playoff__field">
                <label class="confirm-playoff__checkbox">
                    <input type="checkbox" v-model="withBarrage" data-testid="confirm-barrage">
                    {{ $t('ranking.withBarrage') }}
                </label>
                <span class="confirm-playoff__hint">{{ $t('ranking.barrageHint') }}</span>
                <div v-if="withBarrage" class="mt-2">
                    <label class="confirm-playoff__label">{{ $t('ranking.barrageTeams') }}</label>
                    <div class="select">
                        <select v-model.number="tournament.preferences.barrageTeams" data-testid="confirm-barrage-teams">
                            <template v-for="value in barrageTeamValues" :key="value">
                                <option :value="value">{{ value }}</option>
                            </template>
                        </select>
                    </div>
                    <span class="confirm-playoff__hint">{{ $t('ranking.barrageTeamsHint') }}</span>
                    <span class="confirm-playoff__hint">{{ barrageToPlayoffCount }} {{ $t('ranking.barrageToPlayoff') }}</span>
                </div>
            </div>

            <div v-if="tournament.system === 'swiss' && !tournament.isGroupB" class="confirm-playoff__field">
                <label class="confirm-playoff__checkbox">
                    <input type="checkbox" v-model="playB" data-testid="confirm-play-b">
                    {{ $t('ranking.alsoPlay') }} <strong>{{ $t('ranking.tournamentB') }}</strong>
                </label>
            </div>

            <button class="setup-card__collapse-toggle" @click="showAdvanced = !showAdvanced">
                <ChevronDown :size="16" class="setup-card__collapse-icon" :class="{'setup-card__collapse-icon--open': showAdvanced}"/>
                {{ $t('setup.additionalSettings') }}
            </button>

            <div v-if="showAdvanced">
                <div v-if="tournament.system === 'swiss' && !tournament.isGroupB && playB" class="confirm-playoff__field">
                    <label v-if="withCadrage" class="confirm-playoff__checkbox confirm-playoff__checkbox--sub">
                        <input type="checkbox" v-model="tournament.preferences.cadrageLosersToB">
                        {{ $t('ranking.cadrageLosersToB') }}
                    </label>
                    <span v-if="withCadrage" class="confirm-playoff__hint confirm-playoff__hint--sub">{{ $t('ranking.cadrageLosersHint') }}</span>
                    <label class="confirm-playoff__checkbox confirm-playoff__checkbox--sub">
                        <input type="checkbox" v-model="withElimination" data-testid="confirm-elimination">
                        {{ $t('ranking.eliminationRound') }}
                    </label>
                    <div v-if="withElimination" class="confirm-playoff__sub-field">
                        <label class="confirm-playoff__label">{{ $t('ranking.teamsToEliminate') }}</label>
                        <div class="select">
                            <select v-model.number="eliminationCount" data-testid="confirm-elimination-count">
                                <option v-for="value in eliminationCountValues" :key="value" :value="value">{{ value }}</option>
                            </select>
                        </div>
                    </div>
                    <span v-if="withElimination" class="confirm-playoff__hint">{{ eliminationCount }} {{ $t('ranking.eliminationLegend', {eliminated: eliminationCount / 2}) }}</span>
                    <div class="confirm-playoff__sub-field confirm-playoff__inline-field">
                        <label class="confirm-playoff__label">{{ $t('ranking.groupBMode') }}:</label>
                        <div class="select">
                            <select v-model="groupBMode">
                                <option value="swiss">{{ $t('teams.swiss') }}</option>
                                <option value="playoff">{{ $t('games.playOff') }}</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div v-if="playB && groupBLegend" class="confirm-playoff__legend">
                    <div class="confirm-playoff__legend-title">{{ $t('ranking.tournamentB') }}:</div>
                    <div v-if="groupBLegend.withdrawn" class="confirm-playoff__legend-row">
                        <span class="confirm-playoff__legend-label">{{ $t('ranking.withdrawn') }}:</span>
                        <span class="confirm-playoff__legend-value">−{{ groupBLegend.withdrawn }}</span>
                    </div>
                    <div class="confirm-playoff__legend-row">
                        <span class="confirm-playoff__legend-label">{{ $t('ranking.directToA') }}:</span>
                        <span class="confirm-playoff__legend-value">{{ groupBLegend.directToA }}</span>
                    </div>
                    <div v-if="groupBLegend.cadrageTeams" class="confirm-playoff__legend-row">
                        <span class="confirm-playoff__legend-label">{{ $t('ranking.withCadrage') }}:</span>
                        <span class="confirm-playoff__legend-value">{{ groupBLegend.cadrageTeams }}</span>
                    </div>
                    <div class="confirm-playoff__legend-row">
                        <span class="confirm-playoff__legend-label">{{ $t('ranking.directToB') }}:</span>
                        <span class="confirm-playoff__legend-value">{{ groupBLegend.directToB }}</span>
                    </div>
                    <div v-if="groupBLegend.cadrageLosersToB" class="confirm-playoff__legend-row">
                        <span class="confirm-playoff__legend-label">{{ $t('ranking.cadrageLosersToB') }}:</span>
                        <span class="confirm-playoff__legend-value">+{{ groupBLegend.cadrageLosersToB }}</span>
                    </div>
                    <div v-if="groupBLegend.eliminated" class="confirm-playoff__legend-row">
                        <span class="confirm-playoff__legend-label">{{ $t('ranking.eliminationRound') }}:</span>
                        <span class="confirm-playoff__legend-value">−{{ groupBLegend.eliminated }}</span>
                    </div>
                    <div class="confirm-playoff__legend-row confirm-playoff__legend-row--total">
                        <span class="confirm-playoff__legend-label">{{ $t('ranking.totalInB') }}:</span>
                        <span class="confirm-playoff__legend-value">{{ groupBLegend.totalB }}</span>
                    </div>
                </div>

                <div v-if="rankingTeams.length" class="confirm-playoff__field" style="padding-top: 0.75rem;">
                    <label class="confirm-playoff__label">{{ $t('ranking.withdrawTeam') }}</label>
                    <div class="confirm-playoff__withdraw-list">
                        <div v-for="(team, idx) in rankingTeams" :key="team.title"
                             class="confirm-playoff__withdraw-item"
                             :class="{'confirm-playoff__withdraw-item--wd': team.withdrawn}">
                            <span class="confirm-playoff__withdraw-place">{{ idx + 1 }}.</span>
                            <span class="confirm-playoff__withdraw-name">{{ team.title }}</span>
                            <button class="confirm-playoff__withdraw-btn"
                                    :class="{'confirm-playoff__withdraw-btn--active': team.withdrawn}"
                                    @click="toggleWithdrawn(team.title)">
                                {{ team.withdrawn ? $t('ranking.withdrawn') : '✕' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="confirm-playoff__actions">
                <button class="confirm-playoff__btn confirm-playoff__btn--cancel" @click="$emit('close')">{{ $t('common.cancel') }}</button>
                <button class="confirm-playoff__btn confirm-playoff__btn--confirm" data-testid="btn-confirm-playoff" @click="onConfirm">{{ $t('ranking.go') }}</button>
            </div>
        </div>
    </Modal>
</template>

<script>
import {mapActions, mapState} from 'pinia';
import {useMainStore} from '@/stores/main';
import Modal from '@/components/Modal.vue';
import {ChevronDown} from 'lucide-vue-next';

export default {
    name: 'PlayoffConfirmModal',
    components: {Modal, ChevronDown},
    props: {
        rankingTeams: {type: Array, required: true},
        initialWithCadrage: {type: Boolean, default: false},
        initialWithBarrage: {type: Boolean, default: false},
        initialPlayB: {type: Boolean, default: false},
    },
    emits: ['close', 'confirm'],
    data() {
        return {
            withCadrage: this.initialWithCadrage,
            withBarrage: this.initialWithBarrage,
            playB: this.initialPlayB,
            withElimination: false,
            eliminationCount: 2,
            groupBMode: 'swiss',
            showAdvanced: false,
        };
    },
    watch: {
        withCadrage(val) {
            if (val) this.withBarrage = false;
        },
        withBarrage(val) {
            if (val) this.withCadrage = false;
        },
    },
    computed: {
        ...mapState(useMainStore, ['currentTournament']),
        tournament() {
            return this.currentTournament;
        },
        teamToPlayOff() {
            return this.tournament.preferences.playOffTeams;
        },
        teamToPlayOffValues() {
            const values = [];
            for (let i = 2; i <= this.tournament.teams.length; i *= 2) {
                values.push(i);
            }
            if (this.withCadrage) {
                values.pop();
            }
            return values;
        },
        barrageTeamValues() {
            const values = [];
            const maxTeams = this.tournament.teams?.length || 0;
            for (let i = 4; i <= maxTeams; i *= 2) {
                values.push(i);
            }
            return values;
        },
        barrageToPlayoffCount() {
            const barrageTeams = this.tournament.preferences?.barrageTeams || 8;
            const groups = barrageTeams / 4;
            const estimated = groups * 2;
            return Math.pow(2, Math.ceil(Math.log2(estimated)));
        },
        eliminationCountValues() {
            const totalTeams = this.tournament.teams?.length || 0;
            const playOffTeams = this.teamToPlayOff || 0;
            const groupBCount = totalTeams - playOffTeams - (this.withCadrage ? playOffTeams / 2 : 0);
            const values = [];
            for (let i = 2; i < groupBCount && i <= groupBCount - 2; i += 2) {
                values.push(i);
            }
            return values;
        },
        groupBLegend() {
            if (!this.playB) return null;
            const totalTeams = this.tournament.teams?.length || 0;
            const withdrawn = this.rankingTeams.filter(t => t.withdrawn).length;
            const eligible = totalTeams - withdrawn;
            const playOffTeams = this.teamToPlayOff || 0;
            const directToA = this.withCadrage ? playOffTeams / 2 : playOffTeams;
            const cadrageTeams = this.withCadrage ? playOffTeams : 0;
            const cadrageLosersToB = (this.withCadrage && this.tournament.preferences?.cadrageLosersToB) ? cadrageTeams / 2 : 0;
            const directToB = eligible - directToA - cadrageTeams;
            const eliminated = this.withElimination ? this.eliminationCount / 2 : 0;
            const totalB = directToB + cadrageLosersToB - eliminated;
            return {directToA, cadrageTeams, cadrageLosersToB, directToB, eliminated, totalB, withdrawn};
        },
    },
    methods: {
        ...mapActions(useMainStore, ['toggleWithdrawn']),
        onConfirm() {
            this.$emit('confirm', {
                withCadrage: this.withCadrage,
                withBarrage: this.withBarrage,
                playB: this.playB,
                withElimination: this.withElimination,
                eliminationCount: this.eliminationCount,
                groupBMode: this.groupBMode,
            });
        },
    },
};
</script>

<style scoped>
.confirm-playoff {
    margin: -1.25rem;
    padding: 1.25rem;
}

.confirm-playoff__title {
    font-size: 1.1rem;
    font-weight: 700;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--color-border, #e0e0e0);
    margin-left: -1.25rem;
    margin-right: -1.25rem;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
}

.confirm-playoff__field {
    margin-bottom: 0.75rem;
}

.confirm-playoff__label {
    display: block;
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 0.35rem;
    color: var(--color-text-secondary, #555);
}

.confirm-playoff__checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
}

.confirm-playoff__withdraw-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 6px;
    margin-top: 0.35rem;
}

.confirm-playoff__withdraw-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.6rem;
    font-size: 0.85rem;
    border-bottom: 1px solid var(--color-border, #f0f0f0);
}

.confirm-playoff__withdraw-item:last-child {
    border-bottom: none;
}

.confirm-playoff__withdraw-item--wd {
    opacity: 0.5;
    text-decoration: line-through;
}

.confirm-playoff__withdraw-place {
    min-width: 1.5rem;
    font-weight: 600;
    color: var(--color-text-muted);
}

.confirm-playoff__withdraw-name {
    flex: 1;
}

.confirm-playoff__withdraw-btn {
    padding: 0.15rem 0.4rem;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.15s;
}

.confirm-playoff__withdraw-btn:hover {
    border-color: var(--color-danger, #e53935);
    color: var(--color-danger, #e53935);
}

.confirm-playoff__withdraw-btn--active {
    background: var(--color-danger, #e53935);
    color: #fff;
    border-color: var(--color-danger, #e53935);
}

.confirm-playoff__checkbox--sub {
    margin-top: 0.35rem;
    margin-left: 1.5rem;
    font-size: 0.9rem;
}

.confirm-playoff__sub-field {
    margin-top: 0.35rem;
    margin-left: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
}

.confirm-playoff__hint {
    display: block;
    font-size: 1rem;
    color: var(--color-text-muted, #888);
    margin-top: 0.25rem;
    margin-left: 1.5rem;
}

.confirm-playoff__hint--sub {
    margin-left: 2.75rem;
}

.confirm-playoff__legend {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: var(--color-bg-muted, #f5f5f5);
    border-radius: 6px;
    font-size: 0.9rem;
}

.confirm-playoff__legend-title {
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.confirm-playoff__legend-row {
    display: flex;
    justify-content: space-between;
    padding: 0.15rem 0;
}

.confirm-playoff__legend-row--total {
    border-top: 1px solid var(--color-border, #ddd);
    margin-top: 0.25rem;
    padding-top: 0.35rem;
    font-weight: 600;
}

.confirm-playoff__legend-value {
    font-weight: 500;
}

.confirm-playoff__actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 1rem;
    border-top: 1px solid var(--color-border, #e0e0e0);
    margin-left: -1.25rem;
    margin-right: -1.25rem;
    padding: 1rem 1.25rem;
}

.confirm-playoff__btn {
    padding: 0.5rem 1.25rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 6px;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.15s;
}

.confirm-playoff__btn--cancel {
    background: transparent;
    border-color: var(--color-border, #e0e0e0);
    color: var(--color-text-secondary, #555);
}

.confirm-playoff__btn--cancel:hover {
    border-color: var(--color-text-muted);
    background: var(--color-surface-hover);
}

.confirm-playoff__btn--confirm {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
}

.confirm-playoff__btn--confirm:hover {
    background: var(--color-primary-light, #5b21b6);
    border-color: var(--color-primary-light, #5b21b6);
}

.confirm-playoff__inline-field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.setup-card__collapse-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: none;
    border: none;
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-text-muted, #888);
    cursor: pointer;
    padding: 0.5rem 0;
    transition: color 0.15s;
}

.setup-card__collapse-toggle:hover {
    color: var(--color-primary);
}

.setup-card__collapse-icon {
    transition: transform 0.2s ease;
}

.setup-card__collapse-icon--open {
    transform: rotate(180deg);
}
</style>
