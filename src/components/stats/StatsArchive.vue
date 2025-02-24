<script>
import {mapMutations, mapState} from "vuex";
import {getDate} from "@/helpers-stat";
import {getDatabase, ref, get, remove, update} from "firebase/database";
import StatResult from "@/components/stats/StatResult.vue";
import StatsAnalysis from "@/components/stats/StatsAnalysis.vue";
import ConfirmRemoveModal from "@/components/ConfirmRemoveModal.vue";
export default {
    name: "StatsArchive",
    props: ['tags'],
    components: {ConfirmRemoveModal, StatsAnalysis, StatResult},
    data() {
        return {
            confirmRemoveId: null,
            statsList: null,
            showStatAnalysis: false,
            filterGamesTag: []
        }
    },
    mounted() {
        const db = getDatabase();
        const statsRef = ref(db, `${this.user.uid}/stats/`);

        this.isLoading = true;

        get(statsRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    this.statsList = Object.keys(snapshot.val()).reverse().reduce(
                        (obj, key) => {
                            obj[key] = snapshot.val()[key];
                            return obj;
                        },
                        {}
                    ); // Extract the data
                    Object.keys(this.statsList).forEach(key => {
                        this.statsList[key].isOpen = false
                    })
                    delete this.statsList['tags'];
                    this.showMessage({
                        title: 'Awesome!',
                        text: 'Statistics successfully loaded from the database!',
                    });
                } else {
                    this.statsList = null; // Handle case where data doesn't exist
                    this.showMessage({
                        title: 'Info',
                        text: 'No statistics found for this user.',
                    });
                }
            })
            .catch((error) => {
                console.error('Error loading statistics:', error);
                this.statsList = null;
                this.showMessage({
                    title: 'Error',
                    text: 'Failed to load statistics. Please try again later.',
                    type: 'error',
                });
            })
            .finally(() => {
                this.isLoading = false;
            });
    },
    computed: {
        ...mapState(['user']),
        filteredGames() {
            return this.filterGamesTag.length ? Object.values(this.statsList).filter(game => game.tags?.some(tag => this.filterGamesTag.includes(tag))) : this.statsList;
        }
    },
    methods: {
        ...mapMutations(['showMessage']),
        removeGame(id) {
            const db = getDatabase();
            const statsRef = ref(db, `${this.user.uid}/stats/${id}`);

            remove(statsRef)
                .then(() => {
                    delete this.statsList[id];
                    this.showMessage({
                        title: 'Awesome!',
                        text: 'Game successfully removed the database!',
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
        },
        getDate,
        toggleTagFilter(tag) {
            if (this.filterGamesTag.includes(tag)) {
                this.filterGamesTag = this.filterGamesTag.filter(item => item !== tag)
            } else {
                this.filterGamesTag.push(tag);
            }
        },
        addTagToGame(game, tag) {
            if (!this.statsList[game].tags) {
                this.statsList[game].tags = []
            }
            this.statsList[game].tags.push(tag);
            this.saveGame(game, this.statsList[game].tags);
        },
        removeTagFromGame(game, tag) {
            this.statsList[game].tags = this.statsList[game].tags.filter(item => item !== tag);
            this.saveGame(game, this.statsList[game].tags);
        },
        saveGame(game, tags) {
            console.log(game, tags);
            const db = getDatabase();
            const statsRef = ref(db, `${this.user.uid}/stats/${game}`);
            update(statsRef, {tags}).then(() => {
                this.showMessage({title: 'Awesome!', text: 'Tag updated'});
            }).catch((error) => {
                console.error('Error save:', error);
                this.showMessage({title: 'error', text: error, type: 'error'});
            });
        }
    }
}
</script>

<template>
    <div class="mobile-stat-container">
        <ConfirmRemoveModal title="Remove this game?" @remove="removeGame(confirmRemoveId)" @close="confirmRemoveId = null" v-if="confirmRemoveId"/>
        <div class="is-flex is-justify-content-space-between mobile-stat-container-header">
            <button class="button is-info" @click="$emit('close')">{{$t('stat.back')}}</button>
            <button class="button is-info" @click="showStatAnalysis = !showStatAnalysis">{{ showStatAnalysis ? $t('common.hide') : $t('common.show')}} {{ $t('stat.analysis') }}</button>
        </div>
        <div>
            <div v-if="filteredGames" class="mt-3">
                <div class="field" v-if="Object.keys(tags).length && !showStatAnalysis">
                    <form action="">
                        <label for="" class="label">{{ $t('stat.chooseOnly') }}</label>
                        <div class="is-flex is-align-items-center is-flex-wrap-wrap">
                            <label class="radio" v-for="(tag, key) in tags" :key="key">
                                <input type="checkbox" :name="'gameTag' + key" :id="'tag' + key"
                                       :checked="filterGamesTag.includes(tag)" @change="toggleTagFilter(tag)">
                                {{ tag }}
                            </label>
                            <button class="button is-small ml-2" type="reset" v-if="filterGamesTag" @click="filterGamesTag = []">{{ $t('stat.clear') }}</button>
                        </div>
                    </form>
                </div>
                <StatsAnalysis v-if="showStatAnalysis" :stats="statsList" :tags="tags"/>
                <div v-for="(item, gameKey) in filteredGames" :key="item.date">
                    <div class="player-info p-2 mb-2 is-flex is-align-items-center is-justify-content-space-between" style="cursor: pointer" @click="item.isOpen = !item.isOpen">
                        <span class="is-size-4">
                            {{ item.name }}
                            <span class="is-size-6">{{getDate(item.date)}}</span>
                            <span v-if="item.tags?.length" class="is-size-7">
                                (<span v-for="(tag, index) in item.tags" :key="index">{{tag}}<span v-if="index !== item.tags.length - 1">, </span></span>)
                            </span>
                        </span>
                        <span class="delete" @click.stop="confirmRemoveId = item.date"></span>
                    </div>
                    <div v-if="item.isOpen">
                        <div v-if="item.tags" class="tags">
                             <span class="tag is-rounded is-white" v-for="(tag, key) in item.tags" :key="key">
                              {{ tag }}
                              <button class="delete is-small" @click="removeTagFromGame(gameKey, tag)"></button>
                            </span>
                        </div>
                        <div v-if="tags" class="mb-2">
                            <div class="label">Add tag: </div>
                            <div class="tags">
                                <button class="cursor-pointer tag is-white is-rounded" :class="{'is-hidden': item.tags?.includes(tag)}"
                                        v-for="(tag, key) in tags" :key="key"
                                        @click="addTagToGame(gameKey, tag)">
                                    {{tag}}
                                </button>
                            </div>
                        </div>
                        <div class="columns is-desktop" >
                            <div class="column is-half-desktop">
                                <StatResult :team="item.team1" :system="item.system" label="Team 1"/>
                            </div>
                            <div class="column is-half-desktop">
                                <StatResult :team="item.team2" :system="item.system" label="Team 2"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="mt-3">
                {{$t('stat.nothingShow') }}
            </div>
        </div>

    </div>
</template>

<style scoped>

</style>