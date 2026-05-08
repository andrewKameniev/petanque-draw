<template>
    <div class="mobile-stat-container">
        <div class="has-text-right mobile-stat-container-header">
            <button @click="$emit('openArchive')" class="button is-info">{{ $t('stat.archive') }}</button>
        </div>
        <label class="label" for="gameName">{{ $t('stat.enterName') }}</label>
        <div class="field control">
            <input v-model="gameName" class="input" type="text" id="gameName" :placeholder="$t('stat.enterName')">
        </div>
        <div v-if="gameTags.length > 0" class="mb-2 is-size-7">
            {{ $t('stat.gameTags') }}: <strong v-for="(tag, index) in gameTags" :key="index">{{tag}}<span v-if="index !== gameTags.length - 1">, </span></strong>
        </div>
        <div v-if="tags" class="mb-2">
            <div class="label">{{ $t('stat.addTag') }}: </div>
            <div class="tags">
                <button class="cursor-pointer tag is-white is-rounded" v-for="(tag, key) in tags" :key="key"
                        @click="addTagToGame(tag)" :class="{'is-hidden': gameTags.includes(tag)}">
                  {{tag}}
                </button>
            </div>
        </div>
        <div class="mb-3" v-if="showTags">
            <StatTags :tags="tags" @addtag="$emit('addTag', $event)" @removetag="$emit('removeTag', $event)"/>
        </div>
        <div class="mb-3">
            <button class="button is-info is-small" @click="showTags = !showTags">{{showTags ? $t('stat.hideTags') : $t('stat.showTags')}} {{ $t('stat.tags') }}</button>
        </div>
        <div class="columns">
            <div class="column is-half">
                <label class="label">{{ $t('stat.format') }}</label>
                <div class="field">
                    <label class="radio" v-for="item in gameTypes" :key="item.id">
                        <input type="radio" name="gameType" :id="item.id" :value="item.value" v-model="gameType" @change="$emit('changeType', gameType)">
                        {{ item.label }}
                    </label>
                </div>
                <label class="label">{{ $t('stat.mode') }}</label>
                <div class="field">
                    <label class="radio">
                        <input type="radio" name="statMode" id="statModeClassic" :value="false" v-model="statMode">
                        {{ $t('stat.classic') }}
                    </label>
                    <label class="radio">
                        <input type="radio" name="statMode" id="statModeFast" :value="true" v-model="statMode">
                        {{ $t('stat.fast') }}
                    </label>
                </div>
            </div>
            <div class="column is-half">
                <label class="label">{{ $t('stat.system') }}</label>
                <div class="field">
                    <label class="radio">
                        <input type="radio" name="statSystem" id="statSystemSimple" value="simple" v-model="statSystem">
                        {{ $t('stat.simple') }}
                    </label>
                    <label class="radio">
                        <input type="radio" name="statSystem" id="statSystemFrench" value="french" v-model="statSystem">
                        {{ $t('stat.french') }}
                    </label>
                </div>
                <label class="label">{{ $t('stat.scenario') }}</label>
                <div class="field">
                    <label class="radio">
                        <input type="radio" name="statScenario" id="statScenarioNegative" :value="false" v-model="statScenario">
                        {{ $t('stat.negative') }}
                    </label>
                    <label class="radio">
                        <input type="radio" name="statScenario" id="statScenarioPositive" :value="true" v-model="statScenario">
                        {{ $t('stat.positive') }}
                    </label>
                </div>
            </div>
        </div>
        <div class="field">
            <label class="checkbox">
                <input type="checkbox" id="distanceFirst" v-model="asCouch"/>
                {{ $t('stat.asCoach') }}
            </label>
        </div>
        <div class="columns mb-3" v-if="team1.players?.length">
            <div class="column is-half">
                <div class="label">{{ $t('stat.team') }} 1</div>
                <div class="field control" v-for="(player, index) in team1.players" :key="index">
                    <input v-model="player.name" class="input" type="text" :placeholder="$t('stat.playerName') + ' ' + Number(index + 1)">
                </div>
            </div>
            <div class="column is-half">
                <div class="label">{{ $t('stat.team') }} 2</div>
                <div class="field control" v-for="(player, index) in team2.players" :key="index">
                    <input v-model="player.name" class="input" type="text" :placeholder="$t('stat.playerName') + ' ' + Number(index + 1)">
                </div>
            </div>
        </div>
        <button @click="$emit('start', { gameName, gameType, statMode, statScenario, statSystem, asCouch, gameTags })" class="button is-success">{{ $t('stat.start') }}</button>
    </div>
</template>

<script>
import StatTags from "@/components/stats/StatTags.vue";
import {gameTypes} from "@/helpers-stat.js";

export default {
    name: 'StatsSetup',
    components: {StatTags},
    props: ['tags', 'team1', 'team2', 'initialGameType', 'initialStatMode', 'initialStatScenario', 'initialStatSystem', 'initialAsCouch', 'initialGameName', 'initialGameTags'],
    emits: ['start', 'openArchive', 'changeType', 'addTag', 'removeTag'],
    data() {
        return {
            showTags: false,
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
        }
    }
}
</script>
