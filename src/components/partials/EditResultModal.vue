<template>
    <Modal @close-modal="$emit('close')">
        <div class="edit-result">
            <div class="edit-result__header">
                <span class="edit-result__title">{{ $t('results.editResultTitle') }}</span>
                <button class="edit-result__close" @click="$emit('close')">
                    <X :size="18"/>
                </button>
            </div>
            <div class="edit-result__body">
                <div class="edit-result__teams">
                    <div class="edit-result__team">
                        <label class="edit-result__label">{{ game.team_1 }}</label>
                        <input ref="score1" class="edit-result__input" type="number" min="0"
                               v-model.number="score1" @keydown.enter="save">
                    </div>
                    <span class="edit-result__separator">:</span>
                    <div class="edit-result__team">
                        <label class="edit-result__label">{{ game.team_2 }}</label>
                        <input class="edit-result__input" type="number" min="0"
                               v-model.number="score2" @keydown.enter="save">
                    </div>
                </div>
                <p v-if="error" class="edit-result__error">{{ error }}</p>
            </div>
            <div class="edit-result__footer">
                <button class="edit-result__btn edit-result__btn--cancel" @click="$emit('close')">{{ $t('common.cancel') }}</button>
                <button class="edit-result__btn edit-result__btn--save" @click="save">{{ $t('results.saveResult') }}</button>
            </div>
        </div>
    </Modal>
</template>

<script>
import Modal from "@/components/Modal";
import {X} from "lucide-vue-next";

export default {
    name: 'EditResultModal',
    components: {Modal, X},
    props: ['game'],
    emits: ['close', 'save'],
    data() {
        return {
            score1: this.game.team_1_score,
            score2: this.game.team_2_score,
            error: ''
        }
    },
    mounted() {
        this.$nextTick(() => this.$refs.score1?.focus());
    },
    methods: {
        save() {
            this.error = '';
            const s1 = Number(this.score1);
            const s2 = Number(this.score2);
            if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
                this.error = this.$t('games.resultsError');
                return;
            }
            if (s1 === s2) {
                this.error = this.$t('games.noDrawsAllowed');
                return;
            }
            this.$emit('save', {score1: s1, score2: s2});
        }
    }
}
</script>

<style scoped>
.edit-result {
    display: flex;
    flex-direction: column;
    min-width: 480px;
}

@media screen and (max-width: 520px) {
    .edit-result {
        min-width: auto;
    }
}

.edit-result__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.75rem;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border);
}

.edit-result__title {
    font-size: 1rem;
    font-weight: 600;
}

.edit-result__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
}

.edit-result__close:hover {
    background: var(--color-surface-hover);
    color: var(--color-text);
}

.edit-result__body {
    padding: 0.75rem 0 1.25rem;
}

.edit-result__teams {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    justify-content: center;
}

.edit-result__team {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
}

.edit-result__label {
    font-weight: 600;
    font-size: 0.95rem;
    text-align: center;
    white-space: nowrap;
}

@media screen and (max-width: 520px) {
    .edit-result__label {
        white-space: normal;
        word-break: break-word;
    }
}

.edit-result__input {
    width: 70px;
    text-align: center;
    font-size: 1.25rem;
    font-weight: 700;
    padding: 0.5rem;
    border: 2px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface, var(--color-white));
    color: var(--color-text);
    outline: none;
    transition: border-color 0.15s;
}

.edit-result__input:focus {
    border-color: var(--color-primary);
}

.edit-result__separator {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text-muted);
    margin-top: 1.5rem;
}

.edit-result__error {
    color: var(--color-error, #e53935);
    text-align: center;
    margin-top: 0.75rem;
    font-size: 0.9rem;
}

.edit-result__footer {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}

.edit-result__btn {
    padding: 0.5rem 1.25rem;
    font-size: 1rem;
    font-weight: 500;
    border-radius: 6px;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.15s;
}

.edit-result__btn--cancel {
    background: transparent;
    border-color: var(--color-border);
    color: var(--color-text-secondary);
}

.edit-result__btn--cancel:hover {
    border-color: var(--color-text-muted);
    background: var(--color-surface-hover);
}

.edit-result__btn--save {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-btn-text, #fff);
}

.edit-result__btn--save:hover {
    opacity: 0.85;
}
</style>
