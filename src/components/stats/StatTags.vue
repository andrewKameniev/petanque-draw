<template>
    <div class="stat-tags">
        <div class="stat-tags__form">
            <input v-model="tagName" class="stat-tags__input" type="text" id="tagName" :placeholder="$t('stat.tagName')" @keyup.enter="addTag">
            <button class="stat-tags__add-btn" @click="addTag">{{ $t('stat.addTag') }}</button>
        </div>
        <div class="stat-tags__list" v-if="tags && Object.keys(tags).length > 0">
            <span class="stat-tags__chip" v-for="(tag, key) in tags" :key="key">
              {{ tag }}
              <button class="stat-tags__remove" @click="removeTag(key)"><X :size="10"/></button>
            </span>
        </div>
    </div>
</template>
<script>
import {statsService} from "@/services/db";
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {X} from "lucide-vue-next";

export default {
    name: "StatTags",
    components: {X},
    props: ['tags'],
    data() {
        return {
            tagName: ''
        }
    },
    computed: {
        ...mapState(useMainStore, ['user', 'message']),
    },
    methods: {
        ...mapActions(useMainStore, ['showMessage']),
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
<style scoped>
.stat-tags {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.stat-tags__form {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.stat-tags__input {
    flex: 1;
    padding: 0.45rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg-input);
    color: var(--color-text);
    font-size: 1rem;
    outline: none;
    transition: border-color 0.15s;
}

.stat-tags__input:focus {
    border-color: var(--color-primary);
}

.stat-tags__add-btn {
    padding: 0.45rem 0.9rem;
    border-radius: 8px;
    border: none;
    background: var(--color-success);
    color: var(--color-btn-text);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
}

.stat-tags__add-btn:hover {
    background: var(--color-success-hover);
}

.stat-tags__list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
}

.stat-tags__chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.6rem;
    border-radius: 12px;
    background: var(--color-primary-bg);
    color: var(--color-primary);
    font-size: 1rem;
    font-weight: 500;
}

.stat-tags__remove {
    background: none;
    border: none;
    color: var(--color-primary);
    cursor: pointer;
    padding: 0;
    display: flex;
    opacity: 0.6;
    transition: opacity 0.15s;
}

.stat-tags__remove:hover {
    opacity: 1;
}
</style>