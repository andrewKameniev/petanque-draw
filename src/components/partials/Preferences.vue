<template>
    <Modal @close-modal="$emit('close-modal')">
        <div class="prefs">
            <h2 class="prefs__title">{{ $t('modals.tournamentPreferences') }}</h2>
            <div class="prefs__body">
            <div class="prefs__list">
                <div class="prefs__item">
                    <label class="prefs__label">{{ $t('modals.technicalScore') }}</label>
                    <div class="prefs__inputs prefs__inputs--double">
                        <div class="prefs__input-group">
                            <span class="prefs__input-label">{{ $t('games.first') }}</span>
                            <input class="prefs__input" v-model="tournament.preferences.technical.technicalFirst" type="number">
                        </div>
                        <div class="prefs__input-group">
                            <span class="prefs__input-label">{{ $t('games.technical') }} 2</span>
                            <input class="prefs__input" v-model="tournament.preferences.technical.technicalSecond" type="number">
                        </div>
                    </div>
                    <span class="prefs__hint">{{ $t('modals.technicalScoreHint') }}</span>
                </div>
                <div class="prefs__item">
                    <label class="prefs__label">{{ $t('modals.maxScore') }}</label>
                    <input class="prefs__input" v-model="tournament.preferences.maxScore" type="number">
                    <span class="prefs__hint">{{ $t('modals.maxScoreHint') }}</span>
                </div>
                <div class="prefs__item">
                    <label class="prefs__label">{{ $t('modals.playOffTeams') }}</label>
                    <input class="prefs__input" :class="{'prefs__input--disabled': tournament.playOff}" v-model="tournament.preferences.playOffTeams" type="number" :disabled="!!tournament.playOff">
                    <span class="prefs__hint">{{ tournament.playOff ? $t('modals.playOffAlreadyStarted') : $t('modals.playOffTeamsHint') }}</span>
                </div>
                <div class="prefs__item">
                    <label class="prefs__label">{{ $t('modals.fieldsStart') }}</label>
                    <input class="prefs__input" v-model="tournament.preferences.fieldsStart" type="number">
                    <span class="prefs__hint">{{ $t('modals.fieldsStartHint') }}</span>
                </div>
            </div>
            <div class="prefs__footer">
                <button class="prefs__btn prefs__btn--danger" data-testid="btn-remove-tournament" @click="$emit('remove-tournament')">
                    {{ $t('teams.removeTournament') }}
                </button>
                <div class="prefs__footer-right">
                    <button class="prefs__btn prefs__btn--cancel" @click="$emit('close-modal')">{{ $t('common.cancel') }}</button>
                    <button class="prefs__btn" @click="save">{{ $t('common.save') }}</button>
                </div>
            </div>
            </div>
        </div>
    </Modal>
</template>

<script>
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import Modal from "@/components/Modal";

export default {
    name: 'Preferences',
    components: {Modal},
    emits: ['close-modal', 'remove-tournament'],
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament']),
        tournament() {
            return this.currentTournament
        },
    },
    methods: {
        ...mapActions(useMainStore, ['savePreferences', 'showMessage']),
        save() {
            this.savePreferences();
            this.showMessage({title: this.$t('messages.preferencesSaved')});
            this.$emit('close-modal');
        }
    }
}
</script>

<style scoped>
.prefs {
    margin: -1.25rem -1.5rem;
}

.prefs__title {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text);
}

.prefs__body {
    padding: 1.25rem 1.5rem;
}

.prefs__list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.prefs__item {
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
}

.prefs__item:last-child {
    border-bottom: none;
    padding-bottom: 0;
}

.prefs__label {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 0.4rem;
}

.prefs__hint {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    line-height: 1.3;
    margin-top: 0.3rem;
}

.prefs__inputs--double {
    display: flex;
    gap: 0.75rem;
}

.prefs__input-group {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
}

.prefs__input-label {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.prefs__input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg-input);
    color: var(--color-text);
    outline: none;
    transition: border-color 0.2s;
}

.prefs__input:focus {
    border-color: var(--color-primary);
}

.prefs__input--disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.prefs__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 1.25rem;
}

.prefs__footer-right {
    display: flex;
    gap: 0.5rem;
}

.prefs__btn {
    padding: 0.55rem 1.5rem;
    font-size: 0.85rem;
    font-weight: 500;
    border-radius: 6px;
    border: none;
    background: var(--color-primary);
    color: var(--color-surface);
    cursor: pointer;
    transition: background 0.15s;
}

.prefs__btn:hover {
    background: var(--color-primary-light);
}

.prefs__btn--cancel {
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text-secondary);
}

.prefs__btn--cancel:hover {
    background: var(--color-surface-hover);
    border-color: var(--color-text-muted);
}

.prefs__btn--danger {
    background: transparent;
    border: 1px solid var(--color-error);
    color: var(--color-error);
}

.prefs__btn--danger:hover {
    background: var(--color-error);
    color: var(--color-surface);
}
</style>
