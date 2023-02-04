<template>
    <router-view></router-view>
</template>

<script>

import {mapMutations} from "vuex";

export default {
    name: 'App',
    methods: {
        ...mapMutations(['loginAdmin'])
    },
    mounted() {
        if (sessionStorage.getItem('isAdmin')) {
            this.loginAdmin(true);
            this.$router.push('/admin');
        }
    }
}
</script>


<style src="./assets/css/bulma.min.css"></style>
<style src="./assets/css/style.css"></style>