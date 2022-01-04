<template>
    <article class="message is-success" :class='{"is-danger": type === "error"}'>
        <div class="message-header">
            <p>{{title}}</p>
            <button class="delete" aria-label="delete" @click="closeMessage"></button>
        </div>
        <div class="message-body">
            {{text}}
        </div>
</article>
</template>

<script>
export default {
    name: 'Message',
    props: ['type', 'title','text'],
    mounted(){
        setTimeout(this.closeMessage, 3000);
    },
    methods: {
        closeMessage(){
            this.$emit('closemessage');
        }
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