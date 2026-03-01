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
import {getDatabase, ref, remove, set} from "firebase/database";
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
            const db = getDatabase();
            set(ref(db, `${this.user.uid}/stats/tags/${tagId}`), this.tagName.trim()).then(() => {
                this.showMessage({title: 'Awesome!', text: 'Tag saved to db'});
                this.$emit('addtag', tagId, this.tagName);
                this.tagName = '';
            }).catch((error) => {
                console.error('Error save:', error);
                this.showMessage({title: 'error', text: error, type: 'error'});
            });
        },
        removeTag(id) {
            const db = getDatabase();
            const statsRef = ref(db, `${this.user.uid}/stats/tags/${id}`);

            remove(statsRef)
                .then(() => {
                    this.$emit('removetag', id)
                    this.showMessage({
                        title: 'Awesome!',
                        text: 'Tag successfully removed the database!',
                    });
                })
                .catch((error) => {
                    console.error('Error deleting data:', error);
                    this.showMessage({
                        title: 'Error',
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