<template>
    <Modal @close-modal="$emit('cancel')">
        <div class="confirm-dialog">
            <p class="confirm-dialog__text">{{ message }}</p>
            <div class="confirm-dialog__actions">
                <button class="confirm-dialog__btn confirm-dialog__btn--cancel" @click="$emit('cancel')">{{ cancelLabel }}</button>
                <button class="confirm-dialog__btn confirm-dialog__btn--confirm" :data-testid="confirmTestId" @click="$emit('confirm')">{{ confirmLabel }}</button>
            </div>
        </div>
    </Modal>
</template>

<script>
import Modal from "@/components/Modal";

export default {
    name: 'ConfirmDialog',
    components: { Modal },
    emits: ['confirm', 'cancel'],
    props: {
        message: { type: String, required: true },
        confirmLabel: { type: String, required: true },
        cancelLabel: { type: String, required: true },
        confirmTestId: { type: String, default: null }
    }
}
</script>

<style scoped>
.confirm-dialog {
    padding: 0.5rem 0;
}

.confirm-dialog__text {
    font-size: 1rem;
    color: var(--color-text);
    line-height: 1.5;
    margin-bottom: 1.25rem;
}

.confirm-dialog__actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}

.confirm-dialog__btn {
    padding: 0.5rem 1.25rem;
    font-size: 1rem;
    font-weight: 500;
    border-radius: 6px;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.15s;
}

.confirm-dialog__btn--cancel {
    background: transparent;
    border-color: var(--color-border);
    color: var(--color-text-secondary);
}

.confirm-dialog__btn--cancel:hover {
    border-color: var(--color-text-muted);
    background: var(--color-surface-hover);
}

.confirm-dialog__btn--confirm {
    background: var(--color-btn-dark);
    border-color: var(--color-btn-dark);
    color: var(--color-btn-text);
}

.confirm-dialog__btn--confirm:hover {
    background: var(--color-btn-dark-hover);
    border-color: var(--color-btn-dark-hover);
}
</style>
