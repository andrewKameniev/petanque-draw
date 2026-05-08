<template>
    <div class="toast" :class="{'toast--error': message.type === 'error'}">
        <div class="toast__icon">
            <svg v-if="message.type === 'error'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
        </div>
        <div class="toast__body">
            <p class="toast__title">{{ message.title }}</p>
            <p class="toast__text" v-if="message.text">{{ message.text }}</p>
        </div>
        <button class="toast__close" @click="hideMessage" aria-label="close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    </div>
</template>

<script>
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";

export default {
    name: 'Message',
    mounted() {
        setTimeout(this.hideMessage, 3000);
    },
    computed: mapState(useMainStore, ['message']),
    methods: {
        ...mapActions(useMainStore, ['hideMessage']),
    },
}
</script>

<style scoped>
.toast {
    position: fixed;
    top: 60px;
    right: 10px;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    max-width: 360px;
    padding: 0.875rem 1rem;
    background: var(--color-white);
    border: 1px solid #e0e0e0;
    border-left: 2px solid var(--color-primary);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    z-index: 400;
    animation: slideIn 0.25s ease-out;
}

.toast--error {
    border-left-color: #ef4444;
}

.toast__icon {
    flex-shrink: 0;
    color: var(--color-primary);
    margin-top: 1px;
}

.toast--error .toast__icon {
    color: #ef4444;
}

.toast__body {
    flex: 1;
    min-width: 0;
}

.toast__title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text, #1a1a1a);
    margin: 0 0 0.15rem;
}

.toast__text {
    font-size: 0.8rem;
    color: var(--color-text-muted, #666);
    margin: 0;
    line-height: 1.4;
}

.toast__close {
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: #999;
    padding: 2px;
    border-radius: 4px;
    transition: color 0.2s, background 0.2s;
}

.toast__close:hover {
    color: #333;
    background: #f0f0f0;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@media (max-width: 500px) {
    .toast {
        right: 8px;
        max-width: calc(100% - 16px);
    }
}
</style>
