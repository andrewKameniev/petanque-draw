<template>
    <nav class="navbar" role="navigation" aria-label="main navigation">
        <div class="navbar-brand">
            <a class="navbar-item" href="/">
                <img src="../assets/img/logo.webp" alt="logo">
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

import {defineAsyncComponent} from 'vue';
import LanguageSwitcher from "@/components/partials/LanguageSwitcher.vue";
import Footer from "@/components/partials/Footer.vue";

export default {
    name: 'Help',
    components: {
        DocsDraw: defineAsyncComponent(() => import("@/components/docs/DocsDraw.vue")),
        DocsStat: defineAsyncComponent(() => import("@/components/docs/DocsStat.vue")),
        DocsTraining: defineAsyncComponent(() => import("@/components/docs/DocsTraining.vue")),
        Footer,
        LanguageSwitcher
    },
    data() {
        return {
            activeTab: 1
        }
    },
    computed: {
        tabs() {
            return[
                {
                    id: 1,
                    label: this.$t('common.draw')
                },
                {
                    id: 2,
                    label: this.$t('common.stat')
                },
                {
                    id: 3,
                    label: this.$t('common.training')
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
    border: solid 1px var(--color-help-border);
    border-radius: 10px;
}
</style>