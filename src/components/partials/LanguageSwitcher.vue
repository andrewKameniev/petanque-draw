<script>
export default {
    name: "LanguageSwitcher",
    mounted() {
        if (localStorage.getItem('petanqueDrawLang')) {
            this.$i18n.locale = localStorage.getItem('petanqueDrawLang');
        }
    },
    computed: {
        otherLocale() {
            return this.$i18n.locale === 'ua' ? 'en' : 'ua';
        },
    },
    methods: {
        toggleLang() {
            const newLang = this.otherLocale;
            this.$i18n.locale = newLang;
            localStorage.setItem('petanqueDrawLang', newLang);
        }
    }
}
</script>

<template>
    <button class="lang-switcher" @click="toggleLang" :title="$t('common.language')">
        <span class="lang-label">{{ $i18n.locale === 'ua' ? 'Мова:' : 'Language:' }}</span>
        <svg v-if="$i18n.locale === 'ua'" class="lang-flag" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
            <rect width="640" height="240" fill="#005BBB"/>
            <rect y="240" width="640" height="240" fill="#FFD500"/>
        </svg>
        <svg v-else class="lang-flag" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
            <path fill="#012169" d="M0 0h640v480H0z"/>
            <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
            <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
            <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
            <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
        </svg>
    </button>
</template>

<style scoped>
.lang-switcher {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.75rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.9rem;
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
</style>
