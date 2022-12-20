<template>
    <article class="message is-success" :class='{"is-danger": message.type === "error"}'>
        <div class="message-header">
            <p>{{message.title}}</p>
            <button class="delete" aria-label="delete" @click="closeMessage"></button>
        </div>
        <div class="message-body">
            {{message.text}}
        </div>
</article>
</template>

<script>
import {mapMutations, mapState} from "vuex";

export default {
    name: 'Message',
    mounted(){
        const self = this;
        setTimeout(self.hideMessage, 3000);
    },
    computed: mapState(['message']),
    methods: {
        ...mapMutations(['hideMessage']),
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
    }
</style>