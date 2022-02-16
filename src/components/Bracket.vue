<template>
    <div class="modal is-active" >
        <div class="modal-background" @click.self="$emit('close-modal')"></div>
        <div class="modal-content">
            <div class="columns play-off-wrapper">
                <div v-for="(stage, index) in bracket" :key="index" class="column play-off-stage-wrapper">
                    <div class="has-text-centered has-text-weight-bold mb-3">{{stage.stageLabel === 1 ? 'Final' : '1/' + stage.stageLabel + ' final'}}</div>
                    <div class="play-off-stage" ref="stage" >
                        <div v-for="(game, ind) in stage.teams" :key="ind" class="play-off-game box">
                            <div class="play-off-game-vertical-line -top" v-if="index !== 0" :style="{height: stageHeight/stage.teamsCount/2 +'px'}"></div>
                            <div class="play-off-game-vertical-line -bottom" v-if="index !== 0" :style="{height: stageHeight/stage.teamsCount/2 +'px'}"></div>
                            <div class="play-off-team">
                                <span class="play-off-team-place" v-if="game.team_1_place">{{game.team_1_place}}</span>
                                <span class="play-off-team-title" :class="{'has-text-grey-lighter': !game.team_1}">{{game.team_1 || 'Someone'}}</span><span class="play-off-team-score">{{game.team_1_score}}</span>
                            </div>
                            <div class="play-off-team">
                                <span class="play-off-team-place" v-if="game.team_2_place">{{game.team_2_place}}</span>
                                <span class="play-off-team-title" :class="{'has-text-grey-lighter': !game.team_2}">{{game.team_2 || 'Lucky guy'}}</span><span class="play-off-team-score">{{game.team_2_score}}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <button class="modal-close is-large" aria-label="close" @click="$emit('close-modal')"></button>
    </div>
</template>

<script>
export default {
    name: 'Bracket',
    props: ['bracket'],
    emits: ['close-modal'],
    data(){
        return {
            isMounted: false
        }
    },
    mounted() {
        console.log(this.bracket);
        this.isMounted = true
    },
    computed: {
        stageHeight() {
            return this.isMounted ? this.$refs.stage[0].offsetHeight : 100
        }
    }
}
</script>