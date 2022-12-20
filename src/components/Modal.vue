<template>
    <div class="modal is-active" >
        <div class="modal-background" @click.self="$emit('close-modal')"></div>
        <div class="modal-content">
            <div class="box">
                <slot></slot>
            </div>
        </div>
        <button class="modal-close is-large" aria-label="close" @click="$emit('close-modal')"></button>
    </div>
</template>

<script>

export default {
    name: 'Modal',
    emits: ['close-modal'],
}
</script>