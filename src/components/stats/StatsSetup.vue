<template>
    <div class="setup">
        <div class="setup__card">
            <div class="setup__field">
                <label class="setup__label">{{ $t('stat.enterName') }}</label>
                <input v-model="gameName" class="setup__input" type="text" :placeholder="$t('stat.enterName')">
            </div>

            <div v-if="gameTags.length > 0" class="setup__current-tags">
                <Tag :size="14"/>
                <span class="setup__tag-chip" v-for="(tag, index) in gameTags" :key="index">
                    {{ tag }}
                    <button class="setup__tag-remove" @click="gameTags.splice(index, 1)"><X :size="10"/></button>
                </span>
            </div>

            <div v-if="tags" class="setup__tags-add">
                <span class="setup__label">{{ $t('stat.addTag') }}</span>
                <div class="setup__pills">
                    <button class="setup__pill" v-for="(tag, key) in tags" :key="key"
                            :class="{'setup__pill--hidden': gameTags.includes(tag)}"
                            @click="addTagToGame(tag)">
                        + {{ tag }}
                    </button>
                </div>
            </div>

            <div v-if="showTags" class="setup__tags-manage">
                <StatTags :tags="tags" @addtag="(id, name) => $emit('addTag', id, name)" @removetag="(id) => $emit('removeTag', id)"/>
            </div>
            <button class="setup__link-btn" @click="showTags = !showTags">
                <Settings :size="14"/>
                {{ showTags ? $t('stat.hideTags') : $t('stat.manageTags') }}
            </button>
        </div>

        <div class="setup__card">
            <div class="setup__grid">
                <div class="setup__section">
                    <span class="setup__label">{{ $t('stat.format') }}</span>
                    <div class="setup__pills">
                        <button v-for="item in gameTypes" :key="item.id"
                                class="setup__pill"
                                :class="{'setup__pill--active': gameType === item.value}"
                                @click="gameType = item.value; $emit('changeType', gameType)">
                            {{ item.label }}
                        </button>
                    </div>
                </div>

                <div class="setup__section">
                    <span class="setup__label">{{ $t('stat.mode') }}</span>
                    <div class="setup__pills">
                        <button class="setup__pill" :class="{'setup__pill--active': !statMode}" @click="statMode = false">
                            {{ $t('stat.classic') }}
                        </button>
                        <button class="setup__pill" :class="{'setup__pill--active': statMode}" @click="statMode = true">
                            {{ $t('stat.fast') }}
                        </button>
                    </div>
                </div>

                <div class="setup__section">
                    <span class="setup__label">{{ $t('stat.system') }}</span>
                    <div class="setup__pills">
                        <button class="setup__pill" :class="{'setup__pill--active': statSystem === 'simple'}" @click="statSystem = 'simple'">
                            {{ $t('stat.simple') }}
                        </button>
                        <button class="setup__pill" :class="{'setup__pill--active': statSystem === 'french'}" @click="statSystem = 'french'">
                            {{ $t('stat.french') }}
                        </button>
                    </div>
                </div>

                <div class="setup__section">
                    <span class="setup__label">{{ $t('stat.scenario') }}</span>
                    <div class="setup__pills">
                        <button class="setup__pill" :class="{'setup__pill--active': !statScenario}" @click="statScenario = false">
                            {{ $t('stat.negative') }}
                        </button>
                        <button class="setup__pill" :class="{'setup__pill--active': statScenario}" @click="statScenario = true">
                            {{ $t('stat.positive') }}
                        </button>
                    </div>
                </div>
            </div>

            <label class="setup__toggle">
                <input type="checkbox" v-model="asCouch">
                <span>{{ $t('stat.asCoach') }}</span>
            </label>
        </div>

        <div class="setup__card" v-if="team1.players?.length">
            <div class="setup__grid">
                <div class="setup__section">
                    <span class="setup__label">{{ $t('stat.team') }} 1</span>
                    <div class="setup__players">
                        <input v-for="(player, index) in team1.players" :key="index"
                               v-model="player.name" class="setup__input"
                               :placeholder="$t('stat.playerName') + ' ' + (index + 1)">
                    </div>
                </div>
                <div class="setup__section">
                    <span class="setup__label">{{ $t('stat.team') }} 2</span>
                    <div class="setup__players">
                        <input v-for="(player, index) in team2.players" :key="index"
                               v-model="player.name" class="setup__input"
                               :placeholder="$t('stat.playerName') + ' ' + (index + 1)">
                    </div>
                </div>
            </div>
        </div>

        <div v-if="validationError" class="setup__error">{{ validationError }}</div>
        <button class="setup__start-btn" @click="tryStart">
            <Play :size="16"/> {{ $t('stat.start') }}
        </button>
    </div>
</template>

<script>
import StatTags from "@/components/stats/StatTags.vue";
import {gameTypes} from "@/helpers-stat.js";
import {Tag, X, Settings, Play} from "lucide-vue-next";

export default {
    name: 'StatsSetup',
    components: {StatTags, Tag, X, Settings, Play},
    props: ['tags', 'team1', 'team2', 'initialGameType', 'initialStatMode', 'initialStatScenario', 'initialStatSystem', 'initialAsCouch', 'initialGameName', 'initialGameTags'],
    emits: ['start', 'changeType', 'addTag', 'removeTag'],
    data() {
        return {
            showTags: false,
            validationError: '',
            gameTypes,
            gameName: this.initialGameName || '',
            gameType: this.initialGameType || 1,
            statMode: this.initialStatMode || false,
            statScenario: this.initialStatScenario || false,
            statSystem: this.initialStatSystem || 'simple',
            asCouch: this.initialAsCouch || false,
            gameTags: this.initialGameTags || [],
        }
    },
    methods: {
        addTagToGame(tag) {
            this.gameTags.push(tag);
        },
        tryStart() {
            if (!this.gameName.trim()) {
                this.validationError = this.$t('stat.fillAllNames');
                return;
            }
            const allFilled = [...this.team1.players, ...this.team2.players].every(p => p.name.trim());
            if (!allFilled) {
                this.validationError = this.$t('stat.fillAllNames');
                return;
            }
            this.validationError = '';
            this.$emit('start', { gameName: this.gameName, gameType: this.gameType, statMode: this.statMode, statScenario: this.statScenario, statSystem: this.statSystem, asCouch: this.asCouch, gameTags: this.gameTags });
        }
    }
}
</script>

<style scoped>
.setup {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.setup__card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.setup__field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.setup__label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.setup__input {
    padding: 0.55rem 0.75rem;
    border-radius: 8px;
    border: 1px solid var(--color-border);
    background: var(--color-bg-input);
    font-size: 0.9rem;
    color: var(--color-text);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
}

.setup__input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-shadow);
}

.setup__current-tags {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    color: var(--color-text-muted);
}

.setup__tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    background: var(--color-primary-bg);
    color: var(--color-primary);
    font-weight: 500;
}

.setup__tag-remove {
    background: none;
    border: none;
    color: var(--color-primary);
    cursor: pointer;
    padding: 0;
    display: flex;
    opacity: 0.6;
}

.setup__tag-remove:hover {
    opacity: 1;
}

.setup__tags-add {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.setup__tags-manage {
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border-light);
}

.setup__link-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: none;
    border: none;
    color: var(--color-text-muted);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    transition: color 0.15s;
}

.setup__link-btn:hover {
    color: var(--color-primary);
}

.setup__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

@media screen and (max-width: 600px) {
    .setup__grid {
        grid-template-columns: 1fr;
    }
}

.setup__section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.setup__pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
}

.setup__pill {
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

.setup__pill:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-bg);
    color: var(--color-primary);
}

.setup__pill--active {
    background: var(--color-primary);
    color: var(--color-btn-text);
    border-color: var(--color-primary);
}

.setup__pill--active:hover {
    background: var(--color-primary-light);
    color: var(--color-btn-text);
}

.setup__pill--hidden {
    display: none;
}

.setup__toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text);
    cursor: pointer;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border-light);
}

.setup__toggle input {
    accent-color: var(--color-primary);
    width: 16px;
    height: 16px;
}

.setup__players {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.setup__start-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.7rem 2rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 700;
    border: none;
    background: var(--color-success);
    color: var(--color-btn-text);
    cursor: pointer;
    transition: background 0.15s;
    align-self: flex-start;
}

@media screen and (max-width: 600px) {
    .setup__start-btn {
        align-self: stretch;
        padding: 0.85rem 2rem;
    }
}

.setup__start-btn:hover {
    background: var(--color-success-hover);
}

.setup__error {
    font-size: 0.85rem;
    color: var(--color-error);
    font-weight: 500;
}
</style>
