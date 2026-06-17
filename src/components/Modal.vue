<template>
    <Teleport to="body">
        <div class="modal is-active">
            <div class="modal-background" @click.self="$emit('close-modal')"></div>
            <div class="modal-content">
                <div class="box">
                    <slot></slot>
                </div>
            </div>
            <button class="modal-close is-large" aria-label="close" @click="$emit('close-modal')"></button>
        </div>
    </Teleport>
</template>

<script>
export default {
    name: 'Modal',
    emits: ['close-modal'],
    mounted() {
        document.documentElement.classList.add('is-clipped');
    },
    beforeUnmount() {
        document.documentElement.classList.remove('is-clipped');
    },
};
</script>

<style scoped>
.modal {
    z-index: 10000;
}

.modal-content {
    max-width: calc(100vw - 20px);
    max-height: calc(100vh - 40px);
    overflow-y: auto;
}
</style>
