<template>
    <article class="message is-success" :class='{"is-danger": message.type === "error"}'>
        <div class="message-header">
            <p>{{message.title}}</p>
            <button class="delete" aria-label="delete" @click="hideMessage"></button>
        </div>
        <div class="message-body">
            {{message.text}}
        </div>
</article>
</template>

<script>
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";

export default {
    name: 'Message',
    mounted(){
        const self = this;
        setTimeout(self.hideMessage, 5000);
    },
    computed: mapState(useMainStore, ['message']),
    methods: {
        ...mapActions(useMainStore, ['hideMessage']),
    },
}
</script>


<style scoped>
    .message {
        position: fixed;
        bottom: 0;
        min-width: 300px;
        right: 0;
        margin: 10px;
        z-index: 200;
    }
</style>