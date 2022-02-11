<template>
    <div class="menu-wrapper" :class="{active: active}" @click.self="$emit('closeMenu')">
        <aside class="menu">
            <div class="has-text-right">
                <a href="#" class="delete is-large" @click.prevent="$emit('closeMenu')"></a>
            </div>
            <p class="menu-label">
                Saved tournaments
            </p>
            <ul class="menu-list">
                <li v-for="(title, index) in tournaments" :key="index">
                    <a href="#" @click.prevent="$emit('openSavedTournament', index)">{{ title }}</a>
                </li>
            </ul>
            <p class="menu-label">
                Info
            </p>
            <ul class="menu-list">
                <li><a>Swiss system</a></li>
            </ul>
            <p class="menu-label">
                Usefull Links
            </p>
            <ul class="menu-list">
                <li><a href="http://portal.petanque.org.ua/" target="_blank">Portal</a></li>
            </ul>
        </aside>
    </div>
</template>

<script>
export default {
    name: 'Menu',
    props: ['active', 'tournaments'],
    methods: {

    },
}
</script>


<style scoped>
    .menu {
        position: absolute;
        left: 0;
        top: 0;
        background: #fff;
        width: 300px;
        max-width: 90%;
        height: 100vh;
        padding: 20px;
        transition: all 0.3s;
        transform: translateX(-100%);
        box-shadow: 0 0 10px 0 rgba(0,0,0,0.3);
    }
    .menu-wrapper {
        position: fixed;
        opacity: 0;
        visibility: hidden;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        transition: all 0.3s;
    }
    .menu-wrapper.active {
        background: rgba(0,0,0,0.4);
        opacity: 1;
        visibility: visible;
    }
    .active .menu {
        transform: none;
    }
</style>