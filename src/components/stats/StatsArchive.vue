<script>
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {getDate} from "@/helpers-stat";
import {statsService} from "@/services/db";
import StatResult from "@/components/stats/StatResult.vue";
import StatsAnalysis from "@/components/stats/StatsAnalysis.vue";
import ConfirmRemoveModal from "@/components/ConfirmRemoveModal.vue";
import Loader from "@/components/Loader";
import {BarChart3, Trash2, Tag, X} from "lucide-vue-next";
export default {
    name: "StatsArchive",
    props: ['tags'],
    components: {Loader, ConfirmRemoveModal, StatsAnalysis, StatResult, BarChart3, Trash2, Tag, X},
    data() {
        return {
            isLoading: false,
            confirmRemoveId: null,
            statsList: null,
            showStatAnalysis: false,
            filterGamesTag: []
        }
    },
    mounted() {
        this.isLoading = true;

        statsService.getAll(this.user.uid)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    this.statsList = Object.keys(snapshot.val()).reverse().reduce(
                        (obj, key) => {
                            obj[key] = snapshot.val()[key];
                            return obj;
                        },
                        {}
                    );
                    Object.keys(this.statsList).forEach(key => {
                        this.statsList[key].isOpen = false
                    })
                    delete this.statsList['tags'];
                } else {
                    this.statsList = null;
                }
            })
            .catch((error) => {
                console.error('Error loading statistics:', error);
                this.statsList = null;
                this.showMessage({
                    title: this.$t('messages.error'),
                    text: this.$t('messages.failedLoadData'),
                    type: 'error',
                });
            })
            .finally(() => {
                this.isLoading = false;
            });
    },
    computed: {
        ...mapState(useMainStore, ['user']),
        filteredGames() {
            return (this.filterGamesTag.length > 0) ?
                Object.values(this.statsList).filter(game => game.tags?.some(tag => this.filterGamesTag.includes(tag))) :
                this.statsList;
        },
        gamesCount() {
            if (!this.statsList) return 0;
            return Object.keys(this.statsList).length;
        }
    },
    methods: {
        ...mapActions(useMainStore, ['showMessage']),
        removeGame(id) {
            statsService.remove(this.user.uid, id)
                .then(() => {
                    delete this.statsList[id];
                    this.showMessage({
                        title: this.$t('messages.awesome'),
                        text: this.$t('messages.gameRemoved'),
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
            statsService.update(this.user.uid, game, {tags}).then(() => {
                this.showMessage({title: this.$t('messages.awesome'), text: this.$t('messages.tagUpdated')});
            }).catch((error) => {
                console.error('Error save:', error);
                this.showMessage({title: this.$t('messages.error'), text: error, type: 'error'});
            });
        }
    }
}
</script>

<template>
    <div class="archive">
        <ConfirmRemoveModal :title="$t('messages.removeExercise')" @remove="removeGame(confirmRemoveId)" @close="confirmRemoveId = null" v-if="confirmRemoveId"/>

        <div class="archive__header">
            <button class="archive__btn archive__btn--analysis" @click="showStatAnalysis = !showStatAnalysis">
                <BarChart3 :size="16"/>
                {{ showStatAnalysis ? $t('common.hide') : $t('common.show')}} {{ $t('stat.analysis') }}
            </button>
        </div>

        <div v-if="isLoading" class="archive__loading">
            <Loader isDark="true"/>
        </div>

        <template v-else>
            <div v-if="tags && Object.keys(tags).length && !showStatAnalysis" class="archive__filters">
                <div class="archive__filters-label">
                    <Tag :size="14"/>
                    {{ $t('stat.chooseOnly') }}
                </div>
                <div class="archive__filters-tags">
                    <button v-for="(tag, key) in tags" :key="key"
                            class="archive__filter-tag"
                            :class="{'archive__filter-tag--active': filterGamesTag.includes(tag)}"
                            @click="toggleTagFilter(tag)">
                        {{ tag }}
                    </button>
                    <button class="archive__filter-clear" v-if="filterGamesTag.length" @click="filterGamesTag = []">
                        <X :size="12"/>
                        {{ $t('stat.clear') }}
                    </button>
                </div>
            </div>

            <StatsAnalysis v-if="showStatAnalysis" :stats="statsList" :tags="tags"/>

            <div v-else-if="filteredGames && gamesCount > 0" class="archive__list">
                <div class="archive__game" v-for="(item, gameKey) in filteredGames" :key="item.date">
                    <div class="archive__game-header" @click="item.isOpen = !item.isOpen">
                        <div class="archive__game-info">
                            <span class="archive__game-name">{{ item.name || 'Unnamed game' }}</span>
                            <span class="archive__game-date">{{ getDate(item.date) }}</span>
                            <span v-if="item.tags?.length" class="archive__game-tags-inline">
                                <span v-for="(tag, index) in item.tags" :key="index" class="archive__game-tag-badge">{{tag}}</span>
                            </span>
                        </div>
                        <button class="archive__game-delete" @click.stop="confirmRemoveId = item.date">
                            <Trash2 :size="15"/>
                        </button>
                    </div>

                    <div v-if="item.isOpen" class="archive__game-body">
                        <div v-if="tags" class="archive__game-tags-section">
                            <div class="archive__game-tags-row" v-if="item.tags?.length">
                                <span class="archive__game-tag-chip" v-for="(tag, key) in item.tags" :key="key">
                                    {{ tag }}
                                    <button class="archive__game-tag-remove" @click="removeTagFromGame(gameKey, tag)"><X :size="10"/></button>
                                </span>
                            </div>
                            <div class="archive__game-tags-add">
                                <span class="archive__game-tags-add-label">{{ $t('stat.addTag') }}:</span>
                                <button class="archive__game-tag-add-btn"
                                        v-for="(tag, key) in tags" :key="key"
                                        :class="{'is-hidden': item.tags?.includes(tag)}"
                                        @click="addTagToGame(gameKey, tag)">
                                    + {{tag}}
                                </button>
                            </div>
                        </div>

                        <div class="archive__game-results">
                            <div class="archive__game-result">
                                <StatResult :team="item.team1" :system="item.system" :label="$t('stat.team1Label') || 'Team 1'"/>
                            </div>
                            <div class="archive__game-result">
                                <StatResult :team="item.team2" :system="item.system" :label="$t('stat.team2Label') || 'Team 2'"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="archive__empty">
                <div class="archive__empty-text">{{ $t('stat.nothingShow') }}</div>
            </div>
        </template>
    </div>
</template>

<style scoped>
.archive {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
}

.archive__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
}

.archive__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: background 0.15s, box-shadow 0.15s;
}

.archive__btn--back {
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border);
}

.archive__btn--back:hover {
    background: var(--color-surface-hover);
}

.archive__btn--analysis {
    background: var(--color-primary);
    color: var(--color-btn-text);
}

.archive__btn--analysis:hover {
    background: var(--color-primary-light);
}

.archive__loading {
    display: flex;
    justify-content: center;
    padding: 3rem 0;
}

.archive__filters {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 0.75rem 1rem;
}

.archive__filters-label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 0.5rem;
}

.archive__filters-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
}

.archive__filter-tag {
    padding: 0.3rem 0.7rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.15s;
}

.archive__filter-tag:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-bg);
    color: var(--color-primary);
}

.archive__filter-tag--active {
    background: var(--color-primary);
    color: var(--color-btn-text);
    border-color: var(--color-primary);
}

.archive__filter-tag--active:hover {
    background: var(--color-primary-light);
    color: var(--color-btn-text);
}

.archive__filter-clear {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.3rem 0.6rem;
    border-radius: 20px;
    font-size: 0.75rem;
    border: none;
    background: var(--color-error-bg);
    color: var(--color-error);
    cursor: pointer;
}

.archive__list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.archive__game {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    overflow: hidden;
}

.archive__game-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background 0.15s;
}

.archive__game-header:hover {
    background: var(--color-surface-hover);
}

.archive__game-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.archive__game-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text);
}

.archive__game-date {
    font-size: 0.8rem;
    color: var(--color-text-muted);
}

.archive__game-tags-inline {
    display: flex;
    gap: 0.25rem;
}

.archive__game-tag-badge {
    font-size: 0.7rem;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    background: var(--color-primary-bg);
    color: var(--color-primary);
    font-weight: 500;
}

.archive__game-delete {
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 0.3rem;
    border-radius: 4px;
    transition: color 0.15s, background 0.15s;
}

.archive__game-delete:hover {
    color: var(--color-error);
    background: var(--color-error-bg);
}

.archive__game-body {
    border-top: 1px solid var(--color-border-light);
    padding: 1rem;
}

.archive__game-tags-section {
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border-light);
}

.archive__game-tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-bottom: 0.5rem;
}

.archive__game-tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.75rem;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    background: var(--color-primary-bg);
    color: var(--color-primary);
    font-weight: 500;
}

.archive__game-tag-remove {
    background: none;
    border: none;
    color: var(--color-primary);
    cursor: pointer;
    padding: 0;
    display: flex;
    opacity: 0.6;
}

.archive__game-tag-remove:hover {
    opacity: 1;
}

.archive__game-tags-add {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
}

.archive__game-tags-add-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
}

.archive__game-tag-add-btn {
    font-size: 0.75rem;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    border: 1px dashed var(--color-border);
    background: none;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.15s;
}

.archive__game-tag-add-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.archive__game-results {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

@media screen and (max-width: 768px) {
    .archive__game-results {
        grid-template-columns: 1fr;
    }
}

.archive__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
}

.archive__empty-text {
    font-size: 0.95rem;
    color: var(--color-text-muted);
}
</style>
