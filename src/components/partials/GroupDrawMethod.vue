<template>
    <div class="draw-method">
        <label class="draw-method__label">{{ $t('setup.drawMethod') }}</label>
        <div class="draw-method__options">
            <button v-for="option in options" :key="option.value"
                    class="draw-method__option"
                    :class="{'draw-method__option--active': modelValue === option.value}"
                    @click="$emit('update:modelValue', option.value)">
                <component :is="option.icon" :size="18" class="draw-method__icon"/>
                <span class="draw-method__option-label">{{ option.label }}</span>
                <span class="draw-method__option-desc">{{ option.description }}</span>
            </button>
        </div>
        <button class="draw-method__learn-more" @click="showModal = true">
            {{ $t('setup.drawMethodLearnMore') }}
        </button>
        <Modal v-if="showModal" @close-modal="showModal = false">
            <div class="draw-method-modal">
                <h3 class="draw-method-modal__title">{{ $t('setup.drawMethodModalTitle') }}</h3>
                <p class="draw-method-modal__intro">{{ $t('setup.drawMethodModalIntro') }}</p>

                <div v-for="method in modalMethods" :key="method.key" class="draw-method-modal__method">
                    <h4 class="draw-method-modal__method-title">
                        <component :is="method.icon" :size="16"/>
                        {{ method.title }}
                    </h4>
                    <p class="draw-method-modal__method-desc">{{ method.description }}</p>
                    <div class="draw-method-modal__best-for">
                        <span class="draw-method-modal__best-label">{{ $t('setup.drawMethodBestFor') }}:</span>
                        <ul class="draw-method-modal__best-list">
                            <li v-for="(item, i) in method.bestFor" :key="i">{{ item }}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </Modal>
    </div>
</template>

<script>
import Modal from '@/components/Modal.vue';
import {Layers, ArrowDownUp, Shuffle} from 'lucide-vue-next';

export default {
    name: 'GroupDrawMethod',
    components: {Modal, Layers, ArrowDownUp, Shuffle},
    props: {
        modelValue: {
            type: String,
            default: 'seeded'
        }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            showModal: false
        };
    },
    computed: {
        options() {
            return [
                {
                    value: 'seeded',
                    label: this.$t('setup.drawMethodSeeded'),
                    description: this.$t('setup.drawMethodSeededDesc'),
                    icon: 'Layers'
                },
                {
                    value: 'snake',
                    label: this.$t('setup.drawMethodSnake'),
                    description: this.$t('setup.drawMethodSnakeDesc'),
                    icon: 'ArrowDownUp'
                },
                {
                    value: 'balanced_random',
                    label: this.$t('setup.drawMethodBalanced'),
                    description: this.$t('setup.drawMethodBalancedDesc'),
                    icon: 'Shuffle'
                }
            ];
        },
        modalMethods() {
            return [
                {
                    key: 'seeded',
                    title: this.$t('setup.drawMethodSeeded'),
                    description: this.$t('setup.drawMethodSeededFull'),
                    icon: 'Layers',
                    bestFor: [
                        this.$t('setup.drawMethodSeededBest1'),
                        this.$t('setup.drawMethodSeededBest2'),
                        this.$t('setup.drawMethodSeededBest3')
                    ]
                },
                {
                    key: 'snake',
                    title: this.$t('setup.drawMethodSnake'),
                    description: this.$t('setup.drawMethodSnakeFull'),
                    icon: 'ArrowDownUp',
                    bestFor: [
                        this.$t('setup.drawMethodSnakeBest1'),
                        this.$t('setup.drawMethodSnakeBest2'),
                        this.$t('setup.drawMethodSnakeBest3')
                    ]
                },
                {
                    key: 'balanced_random',
                    title: this.$t('setup.drawMethodBalanced'),
                    description: this.$t('setup.drawMethodBalancedFull'),
                    icon: 'Shuffle',
                    bestFor: [
                        this.$t('setup.drawMethodBalancedBest1'),
                        this.$t('setup.drawMethodBalancedBest2'),
                        this.$t('setup.drawMethodBalancedBest3')
                    ]
                }
            ];
        }
    }
};
</script>

<style scoped>
.draw-method {
    margin-top: 0.5rem;
}

.draw-method__label {
    display: block;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 0.5rem;
}

.draw-method__options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.draw-method__option {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    padding: 0.65rem 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg-input);
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
}

.draw-method__option:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-bg);
}

.draw-method__option--active {
    border-color: var(--color-primary);
    background: var(--color-primary-bg);
    box-shadow: 0 0 0 1px var(--color-primary);
}

.draw-method__icon {
    color: var(--color-primary);
    flex-shrink: 0;
}

.draw-method__option-label {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
}

.draw-method__option-desc {
    width: 100%;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-top: 0.15rem;
    padding-left: 1.65rem;
}

.draw-method__learn-more {
    display: inline-block;
    margin-top: 0.5rem;
    background: none;
    border: none;
    font-size: 0.9rem;
    color: var(--color-primary);
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 2px;
}

.draw-method__learn-more:hover {
    color: var(--color-primary-light);
}

.draw-method-modal {
    padding: 0.25rem 0;
}

.draw-method-modal__title {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
}

.draw-method-modal__intro {
    font-size: 0.95rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0 0 1rem;
}

.draw-method-modal__method {
    padding: 0.75rem 0;
    border-top: 1px solid var(--color-border);
}

.draw-method-modal__method-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.35rem;
    color: var(--color-text);
}

.draw-method-modal__method-desc {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0 0 0.5rem;
}

.draw-method-modal__best-for {
    margin-top: 0.35rem;
}

.draw-method-modal__best-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-muted);
}

.draw-method-modal__best-list {
    margin: 0.25rem 0 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
}
</style>
