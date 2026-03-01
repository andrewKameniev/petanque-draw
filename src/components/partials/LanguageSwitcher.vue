<script>
export default {
    name: "LanguageSwitcher",
    mounted() {
        if (localStorage.getItem('petanqueDrawLang')) {
            this.$i18n.locale = localStorage.getItem('petanqueDrawLang');
        }
    },
    methods: {
        setLang(lang) {
            this.$i18n.locale = lang;
            localStorage.setItem('petanqueDrawLang', lang);
        }
    }
}
</script>

<template>
    <div class="navbar-item has-dropdown is-hoverable" style="max-width: 130px">
        <a class="navbar-link">
            {{ $t('common.language') }}
        </a>
        <div class="navbar-dropdown">
            <a class="navbar-item" :class="{'is-active': $i18n.locale === locale}"
               v-for="locale in $i18n.availableLocales" :key="`locale-${locale}`"
               @click.prevent="setLang(locale)">
                {{ locale }}
            </a>
        </div>
    </div>
</template>

<style scoped>

</style>