<script>
import { useTheme } from '@/composables/useTheme';

export default {
    name: 'ThemeSwitcher',
    setup() {
        const { theme, toggleTheme } = useTheme();
        return { theme, toggleTheme };
    },
};
</script>

<template>
    <button
        class="theme-switch"
        :class="{ 'theme-switch--dark': theme === 'dark' }"
        @click="toggleTheme"
        :aria-label="theme === 'light' ? $t('common.darkTheme') : $t('common.lightTheme')"
    >
        <span class="theme-switch__track">
            <span class="theme-switch__thumb">
                <svg
                    class="theme-switch__icon theme-switch__sun"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                <svg
                    class="theme-switch__icon theme-switch__moon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
            </span>
        </span>
    </button>
</template>

<style scoped>
.theme-switch {
    position: relative;
    display: inline-flex;
    align-items: center;
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    border-radius: 20px;
    transition: background 0.3s;
}

.theme-switch:hover .theme-switch__track {
    box-shadow: 0 0 0 2px var(--color-primary-shadow);
}

.theme-switch__track {
    position: relative;
    width: 44px;
    height: 24px;
    background: var(--color-border);
    border-radius: 12px;
    transition:
        background 0.4s cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow 0.2s;
    overflow: hidden;
}

.theme-switch--dark .theme-switch__track {
    background: var(--color-primary);
}

.theme-switch__thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: var(--color-surface);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgb(0 0 0 / 20%);
}

.theme-switch--dark .theme-switch__thumb {
    transform: translateX(20px);
}

.theme-switch__icon {
    position: absolute;
    width: 12px;
    height: 12px;
    transition:
        opacity 0.3s,
        transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-switch__sun {
    color: var(--color-warning);
    opacity: 1;
    transform: rotate(0deg) scale(1);
}

.theme-switch--dark .theme-switch__sun {
    opacity: 0;
    transform: rotate(90deg) scale(0.5);
}

.theme-switch__moon {
    color: var(--color-primary);
    opacity: 0;
    transform: rotate(-90deg) scale(0.5);
}

.theme-switch--dark .theme-switch__moon {
    opacity: 1;
    transform: rotate(0deg) scale(1);
}
</style>
