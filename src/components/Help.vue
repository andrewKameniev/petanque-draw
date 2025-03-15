<template>
    <nav class="navbar" role="navigation" aria-label="main navigation">
        <div class="navbar-brand">
            <a class="navbar-item" href="/">
                <picture>
                    <source srcset="../assets/img/logo.webp" type="image/webp">
                    <source srcset="../assets/img/logo.png" type="image/jpeg">
                    <img src="../assets/img/logo.png" alt="logo">
                </picture>
            </a>
            <LanguageSwitcher/>
        </div>
    </nav>
    <div class="container">
        <div class="content">
            <button class="button is-light" @click="back">{{ $t('login.back') }}</button>
            <div class="tabs is-centered">
                <ul>
                    <li :class="{'is-active': activeTab === tab.id}" v-for="tab in tabs" :key="tab.id">
                        <a @click.prevent="activeTab = tab.id">{{tab.label}}</a>
                    </li>
                </ul>
            </div>
            <DocsDraw v-if="activeTab === 1"/>
            <DocsStat v-if="activeTab === 2"/>
            <DocsTraining v-if="activeTab === 3"/>
        </div>
    </div>
    <Footer/>
</template>

<script>

import LanguageSwitcher from "@/components/partials/LanguageSwitcher.vue";
import Footer from "@/components/partials/Footer.vue";
import DocsDraw from "@/components/docs/DocsDraw.vue";
import DocsStat from "@/components/docs/DocsStat.vue";
import DocsTraining from "@/components/docs/DocsTraining.vue";

export default {
    name: 'Help',
    components: {DocsDraw, DocsStat, DocsTraining, Footer, LanguageSwitcher},
    data() {
        return {
            activeTab: 1,
            tabs: [
                {
                    id: 1,
                    label: 'Draw'
                },
                {
                    id: 2,
                    label: 'Stat'
                },
                {
                    id: 3,
                    label: 'Training'
                },
            ]
        }
    },
    mounted() {
        document.body.classList.add('documentation')
    },
    beforeUnmount() {
        document.body.classList.remove('documentation')
    },
    methods: {
        back() {
            this.$router.go(-1);
        }
    }
}
</script>
<style scoped>
.image {
    border: solid 1px #ddd;
    border-radius: 10px;
}
</style>