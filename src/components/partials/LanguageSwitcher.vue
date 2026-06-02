<script>
const LOCALES = [
    { code: 'ua', label: 'Українська', flag: 'ua' },
    { code: 'en', label: 'English', flag: 'en' },
    { code: 'fr', label: 'Français', flag: 'fr' },
    { code: 'es', label: 'Español', flag: 'es' },
]

export default {
    name: "LanguageSwitcher",
    data() {
        return {
            open: false,
            locales: LOCALES,
        }
    },
    mounted() {
        if (localStorage.getItem('petanqueDrawLang')) {
            this.$i18n.locale = localStorage.getItem('petanqueDrawLang');
        }
        document.addEventListener('click', this.closeOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.closeOutside);
    },
    computed: {
        currentLocale() {
            return LOCALES.find(l => l.code === this.$i18n.locale) || LOCALES[0];
        },
    },
    methods: {
        toggle() {
            this.open = !this.open;
        },
        selectLang(code) {
            this.$i18n.locale = code;
            localStorage.setItem('petanqueDrawLang', code);
            this.open = false;
        },
        closeOutside(e) {
            if (!this.$el.contains(e.target)) {
                this.open = false;
            }
        },
    }
}
</script>

<template>
    <div class="lang-switcher-wrapper">
        <button class="lang-switcher" @click="toggle" :title="$t('common.language')">
            <span class="lang-label">{{ currentLocale.label }}</span>
            <svg class="lang-flag" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
                <!-- UA -->
                <template v-if="currentLocale.flag === 'ua'">
                    <rect width="640" height="240" fill="#005BBB"/>
                    <rect y="240" width="640" height="240" fill="#FFD500"/>
                </template>
                <!-- EN -->
                <template v-else-if="currentLocale.flag === 'en'">
                    <path fill="#012169" d="M0 0h640v480H0z"/>
                    <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
                    <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
                    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
                    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
                </template>
                <!-- FR -->
                <template v-else-if="currentLocale.flag === 'fr'">
                    <rect width="213" height="480" fill="#002395"/>
                    <rect x="213" width="214" height="480" fill="#FFF"/>
                    <rect x="427" width="213" height="480" fill="#ED2939"/>
                </template>
                <!-- ES -->
                <template v-else-if="currentLocale.flag === 'es'">
                    <rect width="640" height="480" fill="#AA151B"/>
                    <rect y="120" width="640" height="240" fill="#F1BF00"/>
                </template>
            </svg>
        </button>
        <ul v-if="open" class="lang-dropdown">
            <li
                v-for="locale in locales"
                :key="locale.code"
                :class="{ active: locale.code === currentLocale.code }"
                @click="selectLang(locale.code)"
            >
                <svg class="lang-flag-small" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
                    <template v-if="locale.flag === 'ua'">
                        <rect width="640" height="240" fill="#005BBB"/>
                        <rect y="240" width="640" height="240" fill="#FFD500"/>
                    </template>
                    <template v-else-if="locale.flag === 'en'">
                        <path fill="#012169" d="M0 0h640v480H0z"/>
                        <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
                        <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
                        <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
                        <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
                    </template>
                    <template v-else-if="locale.flag === 'fr'">
                        <rect width="213" height="480" fill="#002395"/>
                        <rect x="213" width="214" height="480" fill="#FFF"/>
                        <rect x="427" width="213" height="480" fill="#ED2939"/>
                    </template>
                    <template v-else-if="locale.flag === 'es'">
                        <rect width="640" height="480" fill="#AA151B"/>
                        <rect y="120" width="640" height="240" fill="#F1BF00"/>
                    </template>
                </svg>
                <span>{{ locale.label }}</span>
            </li>
        </ul>
    </div>
</template>

<style scoped>
.lang-switcher-wrapper {
    position: relative;
    display: inline-block;
}

.lang-switcher {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.75rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1rem;
    border-radius: 6px;
    transition: background-color 0.2s;
}

.lang-switcher:hover {
    background-color: var(--color-surface-hover);
}

.lang-label {
    color: var(--color-navbar-link);
    font-weight: 500;
}

.lang-flag {
    width: 1.5rem;
    height: 1.1rem;
    border-radius: 2px;
    box-shadow: 0 0 1px rgba(0,0,0,0.3);
}

.lang-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 1000;
    list-style: none;
    margin: 0.25rem 0 0;
    padding: 0.25rem 0;
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: 150px;
}

.lang-dropdown li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: background-color 0.15s;
}

.lang-dropdown li:hover {
    background-color: var(--color-surface-hover, #f5f5f5);
}

.lang-dropdown li.active {
    font-weight: 600;
}

.lang-flag-small {
    width: 1.2rem;
    height: 0.9rem;
    border-radius: 2px;
    box-shadow: 0 0 1px rgba(0,0,0,0.3);
}
</style>
