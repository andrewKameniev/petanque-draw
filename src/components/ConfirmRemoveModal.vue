<template>
    <Modal @close-modal="$emit('close')">
        <p class="text-center mb-4 is-size-4">{{title}}</p>
        <div class="buttons is-centered">
            <div class="control">
                <button class="button" @click="$emit('close')">{{ $t('common.cancel') }}</button>
            </div>
            <div class="control">
                <button class="button is-danger" @click="$emit('remove'); $emit('close')">{{ $t('common.remove') }}</button>
            </div>
        </div>
    </Modal>
</template>

<script>
import Modal from "@/components/Modal";

export default {
    name: 'ConfirmRemoveModal',
    props: ['title'],
    emits: ['remove', 'close'],
    components: {Modal},
}
</script>
