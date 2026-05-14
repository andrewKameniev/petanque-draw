<template>
    <div @touchstart="onTouchStart"
         @touchmove="onTouchMove"
         @touchend="onTouchEnd"
         class="mobile-stat-container"
    >
        <div class="mobile-stat-container-header">
            <div class="is-flex is-justify-content-space-between mb-3">
                <div class="control">
                    <button @click="$emit('newGame')" class="button is-danger">{{ $t('stat.newGame') }}</button>
                </div>
                <div class="control">
                    <button @click="$emit('finishGame')" class="button is-info">
                        <Loader v-if="isSaving"/>
                        <span :class="{'opacity-0': isSaving}">{{ $t('stat.finishGame') }}</span>
                    </button>
                </div>
            </div>
        </div>
        <div class="is-flex is-justify-content-space-between">
            <div>{{ $t('stat.man') }} <strong>{{ currentMan + 1 }}</strong>/{{manCount}}</div>
            <div>
                <strong>{{ $t('stat.score') }}</strong>
                {{currentScore.team1}} : {{currentScore.team2}}
            </div>
        </div>
        <hr>
        <div>
            <div>{{ $t('stat.whatDistance') }}</div>
            <div class="field">
                <label class="radio" v-for="dist in throwDistances" :key="dist">
                    <input type="radio" name="manDistance" :id="'manDistance' + dist" :value="dist" v-model="localManDistance">
                    {{dist === 11 ? '>10m' : '~' + dist + 'm'}}
                </label>
            </div>
        </div>
        <hr>
        <Teaminfo :team="team1" :current-man="currentMan" :iterator="1" :system="statSystem" :isCouch="asCouch"
                  @update-score="(...args) => $emit('updateScore', ...args)" @removethrow="(...args) => $emit('removeThrow', ...args)" @addthrow="(...args) => $emit('addThrow', ...args)"
                  @x2throw="(...args) => $emit('x2Throw', ...args)" @next="$emit('next')"
                  @updatethrow="(...args) => $emit('updateThrow', ...args)" @changePlayer="(...args) => $emit('changePlayer', ...args)"
        />
        <hr>
        <Teaminfo :team="team2" :current-man="currentMan" :iterator="2" :system="statSystem" :isCouch="asCouch"
                  @update-score="(...args) => $emit('updateScore', ...args)" @removethrow="(...args) => $emit('removeThrow', ...args)" @addthrow="(...args) => $emit('addThrow', ...args)"
                  @x2throw="(...args) => $emit('x2Throw', ...args)" @next="$emit('next')"
                  @updatethrow="(...args) => $emit('updateThrow', ...args)" @changePlayer="(...args) => $emit('changePlayer', ...args)"
        />
        <div class="is-flex is-justify-content-space-between mt-3">
            <button class="button is-info" @click="$emit('prev')" v-if="currentMan >= 1">{{ $t('stat.prev') }}</button>
            <button class="button is-danger" v-if="currentMan !== 0" @click="$emit('removeMan')">{{ $t('stat.removeMan') }}</button>
            <button class="button is-success" @click="$emit('next')">{{ $t('stat.next') }}</button>
        </div>
    </div>
</template>

<script>
import Teaminfo from "@/components/stats/Teaminfo.vue";
import Loader from "@/components/Loader.vue";
import {throwDistances} from "@/helpers-stat.js";

export default {
    name: 'StatsTracking',
    components: {Teaminfo, Loader},
    props: ['team1', 'team2', 'currentMan', 'currentScore', 'manCount', 'statSystem', 'asCouch', 'isSaving'],
    emits: ['newGame', 'finishGame', 'updateScore', 'removeThrow', 'addThrow', 'x2Throw', 'updateThrow', 'changePlayer', 'next', 'prev', 'removeMan', 'distanceChange'],
    data() {
        return {
            throwDistances,
            startX: 0,
            startY: 0,
            swipeDirection: null,
            localManDistance: null,
        }
    },
    watch: {
        localManDistance(newValue) {
            this.$emit('distanceChange', newValue);
        }
    },
    methods: {
        onTouchStart(event) {
            this.startX = event.touches[0].clientX;
            this.startY = event.touches[0].clientY;
        },
        onTouchMove(event) {
            event.preventDefault();
        },
        onTouchEnd(event) {
            const endX = event.changedTouches[0].clientX;
            const endY = event.changedTouches[0].clientY;
            const deltaX = endX - this.startX;
            const deltaY = endY - this.startY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                this.swipeDirection = deltaX > 0 ? "right" : "left";
                if (Math.abs(endX - this.startX) > 50) {
                    if (this.swipeDirection === 'right') {
                        if (this.currentMan > 0) {
                            this.$emit('prev');
                        }
                    } else {
                        this.$emit('next');
                    }
                }
            } else {
                this.swipeDirection = deltaY > 0 ? "down" : "up";
            }
        },
    }
}
</script>
