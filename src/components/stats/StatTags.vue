<template>
    <div>
        <div class="columns">
            <div class="column is-half">
                <div class="field control">
                    <input v-model="tagName" class="input is-small" type="text" id="tagName" placeholder="Tag name" @keyup.enter="addTag">
                </div>
            </div>
            <div class="column">
                <div class="field control">
                    <button class="button is-success is-small" @click="addTag">Add</button>
                </div>
            </div>
        </div>
        <div class="tags" v-if="Object.keys(tags).length > 0">
            <span class="tag is-rounded is-white" v-for="(tag, key) in tags" :key="key">
              {{ tag }}
              <button class="delete is-small" @click="removeTag(key)"></button>
            </span>
        </div>
    </div>
</template>
<script>
import {statsService} from "@/services/db";
import {mapMutations, mapState} from "vuex";

export default {
    name: "StatTags",
    props: ['tags'],
    data() {
        return {
            tagName: ''
        }
    },
    computed: {
        ...mapState(['user', 'message']),
    },
    methods: {
        ...mapMutations(['showMessage']),
        addTag() {
            const tagId = Date.now();
            statsService.addTag(this.user.uid, tagId, this.tagName.trim()).then(() => {
                this.showMessage({title: this.$t('messages.awesome'), text: this.$t('messages.tagSaved')});
                this.$emit('addtag', tagId, this.tagName);
                this.tagName = '';
            }).catch((error) => {
                console.error('Error save:', error);
                this.showMessage({title: this.$t('messages.error'), text: error, type: 'error'});
            });
        },
        removeTag(id) {
            statsService.removeTag(this.user.uid, id)
                .then(() => {
                    this.$emit('removetag', id)
                    this.showMessage({
                        title: this.$t('messages.awesome'),
                        text: this.$t('messages.tagRemoved'),
                    });
                })
                .catch((error) => {
                    console.error('Error deleting data:', error);
                    this.showMessage({
                        title: this.$t('messages.error'),
                        text: error,
                        type: 'error',
                    });
                });
        }
    }
}
</script>
<style>

</style>