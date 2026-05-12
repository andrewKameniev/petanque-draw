<template>
    <Modal @close-modal="$emit('close')">
        <div class="confirm-remove">
            <div class="confirm-remove__header">
                <div class="confirm-remove__header-left">
                    <span class="confirm-remove__icon">
                        <AlertTriangle :size="16"/>
                    </span>
                    <span class="confirm-remove__header-hint">{{ hint || $t('modals.removeHint') }}</span>
                </div>
                <button class="confirm-remove__close" @click="$emit('close')">
                    <X :size="18"/>
                </button>
            </div>
            <div class="confirm-remove__body">
                <p class="confirm-remove__question">
                    <template v-if="message">{{ message }}</template>
                    <template v-else>{{ $t('modals.sureRemove') }} <strong>{{ name }}</strong>?</template>
                </p>
            </div>
            <div class="confirm-remove__footer">
                <button class="confirm-remove__btn confirm-remove__btn--cancel" @click="$emit('close')">{{ $t('common.cancel') }}</button>
                <button class="confirm-remove__btn confirm-remove__btn--danger" data-testid="btn-confirm-remove" @click="$emit('confirm'); $emit('remove'); $emit('close')">{{ confirmLabel || $t('common.remove') }}</button>
            </div>
        </div>
    </Modal>
</template>

<script>
import Modal from "@/components/Modal";
import {AlertTriangle, X} from "lucide-vue-next";

export default {
    name: 'ConfirmRemoveModal',
    props: ['title', 'name', 'hint', 'message', 'confirmLabel'],
    emits: ['confirm', 'remove', 'close'],
    components: {Modal, AlertTriangle, X},
}
</script>

<style scoped>
.confirm-remove {
    display: flex;
    flex-direction: column;
}

.confirm-remove__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.75rem;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border, #e5e7f0);
}

.confirm-remove__header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.confirm-remove__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-error-bg, #fef2f2);
    color: var(--color-error, #ef4444);
}

.confirm-remove__header-hint {
    font-size: 0.82rem;
    font-weight: 500;
}

.confirm-remove__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-muted, #888);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
}

.confirm-remove__close:hover {
    background: #f5f5f5;
    color: var(--color-text, #1a1a1a);
}

.confirm-remove__body {
    padding: 0.5rem 0 1.25rem;
}

.confirm-remove__question {
    font-size: 0.9rem;
    color: var(--color-text, #1a1a1a);
    line-height: 1.5;
}

.confirm-remove__question strong {
    color: var(--color-primary);
}

.confirm-remove__footer {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}

.confirm-remove__btn {
    padding: 0.5rem 1.25rem;
    font-size: 0.8rem;
    font-weight: 500;
    border-radius: 6px;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.15s;
}

.confirm-remove__btn--cancel {
    background: transparent;
    border-color: var(--color-border, #e0e0e0);
    color: var(--color-text-secondary, #555);
}

.confirm-remove__btn--cancel:hover {
    border-color: var(--color-text-muted);
    background: #f5f5f5;
}

.confirm-remove__btn--danger {
    background: var(--color-error, #ef4444);
    border-color: var(--color-error, #ef4444);
    color: white;
}

.confirm-remove__btn--danger:hover {
    background: #dc2626;
    border-color: #dc2626;
}
</style>
