<template>
    <div class="remote-toolbar">
        <div class="remote-toolbar__actions">
            <button class="remote-toolbar__btn" @click="$emit('show-qr')">
                <Link :size="18"/>
                <span class="is-hidden-mobile">{{ $t('remote.showLinks') }}</span>
                <span class="is-hidden-tablet">{{ $t('remote.showLink') }}</span>
            </button>
            <button class="remote-toolbar__btn" :class="{'remote-toolbar__btn--active': showInput, 'remote-toolbar__btn--has-message': !showInput && hasMessage}" @click="showInput = !showInput">
                <MessageCircle :size="18"/>
                {{ $t('remote.writeMessage') }}
                <ChevronDown :size="14" class="remote-toolbar__chevron" :class="{'remote-toolbar__chevron--open': showInput}"/>
            </button>
        </div>
        <progress class="progress is-small is-info" max="100" v-if="loading">15%</progress>
        <Transition name="slide">
            <div class="remote-toolbar__message" v-if="showInput">
                <span v-if="saved" class="message-saved-label">
                    <Check :size="14"/>
                    {{ $t('remote.messageSaved') }}
                </span>
                <textarea rows="3" :value="message" class="remote-toolbar__textarea" :placeholder="$t('remote.writeMessage') + '...'" @input="onInput"></textarea>
            </div>
        </Transition>
    </div>
</template>

<script>
import {Link, MessageCircle, ChevronDown, Check} from "lucide-vue-next";

export default {
    name: 'RemoteToolbar',
    components: { Link, MessageCircle, ChevronDown, Check },
    emits: ['show-qr', 'update:message'],
    props: {
        message: { type: String, default: '' },
        loading: { type: Boolean, default: false }
    },
    data() {
        return {
            showInput: false,
            saved: false,
            saveTimeout: null
        }
    },
    computed: {
        hasMessage() {
            return this.message?.trim();
        }
    },
    methods: {
        onInput(e) {
            this.saved = false;
            this.$emit('update:message', e.target.value);
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                this.saved = true;
            }, 1000);
        }
    },
    beforeUnmount() {
        clearTimeout(this.saveTimeout);
    }
}
</script>

<style scoped>
.remote-toolbar {
    background: var(--color-white);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
}

.remote-toolbar__actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.remote-toolbar__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.85rem;
    font-size: 1rem;
    font-weight: 500;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg-input);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.15s;
}

.remote-toolbar__btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-bg);
}

.remote-toolbar__btn--active {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-bg);
}

.remote-toolbar__btn--has-message {
    color: var(--color-primary);
}

.remote-toolbar__message {
    position: relative;
    margin-top: 0.75rem;
}

.remote-toolbar__textarea {
    width: 100%;
    min-height: 100px;
    padding: 0.6rem 0.75rem;
    font-size: 1rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg-input);
    resize: vertical;
    outline: none;
    transition: border-color 0.2s;
}

.remote-toolbar__textarea:focus {
    border-color: var(--color-primary);
}

.remote-toolbar__chevron {
    transition: transform 0.25s ease;
    margin-left: 0.1rem;
}

.remote-toolbar__chevron--open {
    transform: rotate(180deg);
}

.slide-enter-active,
.slide-leave-active {
    transition: all 0.25s ease;
    overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    max-height: 0;
}

.slide-enter-to,
.slide-leave-from {
    opacity: 1;
    max-height: 200px;
}

.message-saved-label {
    position: absolute;
    top: 0.4rem;
    right: 0.6rem;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-primary);
    background: var(--color-primary-bg);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    z-index: 1;
}
</style>
