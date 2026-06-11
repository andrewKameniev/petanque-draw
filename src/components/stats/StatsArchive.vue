<script>
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {getDate, gameTypes} from "@/helpers-stat";
import {statsService} from "@/services/db";
import StatResult from "@/components/stats/StatResult.vue";
import StatsAnalysis from "@/components/stats/StatsAnalysis.vue";
import ConfirmRemoveModal from "@/components/ConfirmRemoveModal.vue";
import {BarChart3, Trash2, Tag, X, Share2, Pencil, Check} from "lucide-vue-next";
export default {
    name: "StatsArchive",
    props: ['tags'],
    components: {ConfirmRemoveModal, StatsAnalysis, StatResult, BarChart3, Trash2, Tag, X, Share2, Pencil, Check},
    data() {
        return {
            isLoading: false,
            confirmRemoveId: null,
            statsList: null,
            showStatAnalysis: false,
            filterGamesTag: [],
            filterGameType: null,
            editingGameKey: null,
            editName: '',
            editPlayers: {team1: [], team2: []}
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
        gameTypes() { return gameTypes; },
        filteredGames() {
            if (!this.statsList) return [];
            let games = Object.values(this.statsList);
            if (this.filterGamesTag.length > 0) {
                games = games.filter(game => game.tags?.some(tag => this.filterGamesTag.includes(tag)));
            }
            if (this.filterGameType) {
                games = games.filter(game => this.getGameType(game) === this.filterGameType);
            }
            return games;
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
        getGameType(item) {
            if (item.type) return item.type;
            const playerCount = item.team1?.players?.filter(p => !p.wasChanged).length;
            return playerCount || null;
        },
        getGameTypeLabel(type) {
            const found = gameTypes.find(t => t.value === type);
            return found ? found.label : '';
        },
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
        },
        shareGame(statId) {
            const domain = import.meta.env.PROD ? '/petanque-draw/#/' : '/#/';
            const shareRef = `${this.user.uid}.${statId}`;
            const link = `${window.location.origin}${domain}stats/share?ref=${shareRef}`;
            navigator.clipboard.writeText(link).then(() => {
                this.showMessage({title: this.$t('messages.awesome'), text: this.$t('remote.copyLink')});
            });
        },
        startEditing(gameKey) {
            const game = this.statsList[gameKey];
            this.editingGameKey = gameKey;
            this.editName = game.name || '';
            this.editPlayers = {
                team1: game.team1?.players?.map(p => p.name || '') || [],
                team2: game.team2?.players?.map(p => p.name || '') || []
            };
        },
        cancelEditing() {
            this.editingGameKey = null;
        },
        saveEditing() {
            const game = this.statsList[this.editingGameKey];
            const updatedData = {name: this.editName};
            if (game.team1?.players) {
                updatedData.team1 = {...game.team1, players: game.team1.players.map((p, i) => ({...p, name: this.editPlayers.team1[i] || p.name}))};
            }
            if (game.team2?.players) {
                updatedData.team2 = {...game.team2, players: game.team2.players.map((p, i) => ({...p, name: this.editPlayers.team2[i] || p.name}))};
            }
            statsService.update(this.user.uid, this.editingGameKey, updatedData).then(() => {
                this.statsList[this.editingGameKey].name = this.editName;
                if (updatedData.team1) this.statsList[this.editingGameKey].team1 = updatedData.team1;
                if (updatedData.team2) this.statsList[this.editingGameKey].team2 = updatedData.team2;
                this.editingGameKey = null;
                this.showMessage({title: this.$t('messages.awesome'), text: this.$t('messages.saved')});
            }).catch((error) => {
                console.error('Error saving:', error);
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

        <div v-if="isLoading" class="archive__skeleton">
            <div class="archive__skeleton-card" v-for="n in 8" :key="n">
                <div class="archive__skeleton-line archive__skeleton-line--title"></div>
                <div class="archive__skeleton-line archive__skeleton-line--date"></div>
            </div>
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

            <div v-if="!showStatAnalysis" class="archive__type-filters">
                <button v-for="gt in gameTypes" :key="gt.value"
                        class="archive__type-btn"
                        :class="{'archive__type-btn--active': filterGameType === gt.value}"
                        @click="filterGameType = filterGameType === gt.value ? null : gt.value">
                    {{ gt.label }}
                </button>
            </div>

            <StatsAnalysis v-if="showStatAnalysis" :stats="statsList" :tags="tags"/>

            <div v-else-if="filteredGames && gamesCount > 0" class="archive__list">
                <div class="archive__game" v-for="(item, gameKey) in filteredGames" :key="item.date">
                    <div class="archive__game-header" @click="item.isOpen = !item.isOpen">
                        <div class="archive__game-info">
                            <span class="archive__game-name">{{ item.name || 'Unnamed game' }}</span>
                            <span v-if="getGameType(item)" class="archive__game-type-badge">{{ getGameTypeLabel(getGameType(item)) }}</span>
                            <span class="archive__game-date">{{ getDate(item.date) }}</span>
                            <span v-if="item.tags?.length" class="archive__game-tags-inline">
                                <span v-for="(tag, index) in item.tags" :key="index" class="archive__game-tag-badge">{{tag}}</span>
                            </span>
                        </div>
                        <div class="archive__game-actions">
                            <button class="archive__game-edit" @click.stop="startEditing(gameKey)" :title="$t('common.editResult')">
                                <Pencil :size="15"/>
                            </button>
                            <button class="archive__game-share" @click.stop="shareGame(item.date)" :title="$t('remote.copyLink')">
                                <Share2 :size="15"/>
                            </button>
                            <button class="archive__game-delete" @click.stop="confirmRemoveId = item.date">
                                <Trash2 :size="15"/>
                            </button>
                        </div>
                    </div>

                    <div v-if="editingGameKey === gameKey" class="archive__game-body">
                        <div class="archive__edit-section">
                            <div class="archive__edit-field">
                                <label class="archive__edit-label">{{ $t('stat.enterName') }}</label>
                                <input class="archive__edit-input" v-model="editName" />
                            </div>
                            <div class="archive__edit-field" v-if="item.team1?.players">
                                <label class="archive__edit-label">{{ $t('stat.team1Label') || 'Team 1' }}</label>
                                <div class="archive__edit-players">
                                    <input class="archive__edit-input" v-for="(p, i) in editPlayers.team1" :key="i" v-model="editPlayers.team1[i]" :placeholder="$t('stat.playerName') + ' ' + (i + 1)" />
                                </div>
                            </div>
                            <div class="archive__edit-field" v-if="item.team2?.players">
                                <label class="archive__edit-label">{{ $t('stat.team2Label') || 'Team 2' }}</label>
                                <div class="archive__edit-players">
                                    <input class="archive__edit-input" v-for="(p, i) in editPlayers.team2" :key="i" v-model="editPlayers.team2[i]" :placeholder="$t('stat.playerName') + ' ' + (i + 1)" />
                                </div>
                            </div>
                            <div class="archive__edit-actions">
                                <button class="archive__edit-btn archive__edit-btn--save" @click="saveEditing">
                                    <Check :size="14" />
                                    {{ $t('common.save') }}
                                </button>
                                <button class="archive__edit-btn archive__edit-btn--cancel" @click="cancelEditing">
                                    <X :size="14" />
                                    {{ $t('common.cancel') }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-else-if="item.isOpen" class="archive__game-body">
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
    font-size: 1rem;
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

.archive__type-filters {
    display: flex;
    gap: 0.4rem;
}

.archive__type-btn {
    padding: 0.35rem 0.75rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.15s;
}

.archive__type-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.archive__type-btn--active {
    background: var(--color-primary);
    color: var(--color-btn-text);
    border-color: var(--color-primary);
}

.archive__type-btn--active:hover {
    background: var(--color-primary-light);
    color: var(--color-btn-text);
}

.archive__skeleton {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.archive__skeleton-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.archive__skeleton-line {
    height: 14px;
    border-radius: 6px;
    background: var(--color-border);
    animation: skeleton-pulse 1.2s ease-in-out infinite;
}

.archive__skeleton-line--title {
    width: 40%;
}

.archive__skeleton-line--date {
    width: 20%;
    opacity: 0.6;
}

@keyframes skeleton-pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
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
    font-size: 1rem;
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
    font-size: 1rem;
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
    font-size: 1rem;
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
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--color-text);
}

.archive__game-type-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    background: var(--color-surface-hover, #f0f0f0);
    color: var(--color-text-secondary);
    text-transform: capitalize;
}

.archive__game-date {
    font-size: 1rem;
    color: var(--color-text-muted);
}

.archive__game-tags-inline {
    display: flex;
    gap: 0.25rem;
}

.archive__game-tag-badge {
    font-size: 1rem;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    background: var(--color-primary-bg);
    color: var(--color-primary);
    font-weight: 500;
}

.archive__game-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.archive__game-share {
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 0.3rem;
    border-radius: 4px;
    transition: color 0.15s, background 0.15s;
}

.archive__game-share:hover {
    color: var(--color-primary);
    background: var(--color-primary-bg);
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
    font-size: 1rem;
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
    font-size: 1rem;
    color: var(--color-text-muted);
}

.archive__game-tag-add-btn {
    font-size: 1rem;
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

.archive__game-edit {
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 0.3rem;
    border-radius: 4px;
    transition: color 0.15s, background 0.15s;
}

.archive__game-edit:hover {
    color: var(--color-primary);
    background: var(--color-primary-bg);
}

.archive__edit-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.archive__edit-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.archive__edit-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.archive__edit-players {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.archive__edit-input {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-size: 1rem;
    color: var(--color-text);
    background: var(--color-white);
    transition: border-color 0.15s;
}

.archive__edit-input:focus {
    outline: none;
    border-color: var(--color-primary);
}

.archive__edit-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.25rem;
}

.archive__edit-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.45rem 0.85rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
}

.archive__edit-btn--save {
    background: var(--color-primary);
    color: var(--color-btn-text);
}

.archive__edit-btn--save:hover {
    background: var(--color-primary-light);
}

.archive__edit-btn--cancel {
    background: var(--color-surface);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
}

.archive__edit-btn--cancel:hover {
    background: var(--color-surface-hover);
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
    font-size: 1rem;
    color: var(--color-text-muted);
}
</style>
