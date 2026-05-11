<template>
    <div class="modal is-active" style="z-index: 10000;">
        <div class="modal-background" @click.self="$emit('close-modal')"></div>
        <div class="modal-content bracket-modal">
            <div class="bracket-container" ref="container">
                <svg :width="svgWidth" :height="svgHeight" class="bracket-svg">
                    <!-- Winner Bracket label -->
                    <text :x="padding" :y="16" class="bracket-section-label">{{ $t('ranking.winnerBracket') }}</text>

                    <!-- Winner Bracket stages -->
                    <g v-for="(stage, si) in wbStages" :key="'wb'+si">
                        <text :x="stage.x + boxWidth / 2" :y="sectionHeaderY" class="round-header">
                            {{ wbRoundLabel(si) }}
                        </text>
                        <g v-for="(game, gi) in stage.games" :key="'wbg'+gi">
                            <rect :x="game.x" :y="game.y" :width="boxWidth" :height="boxHeight" rx="6" ry="6" class="game-box"/>
                            <line :x1="game.x + 1" :y1="game.y + boxHeight / 2" :x2="game.x + boxWidth - 1" :y2="game.y + boxHeight / 2" class="game-divider"/>
                            <path v-if="teamBg(game.data, 1)" :d="topHalfPath(game.x, game.y)" :class="teamBg(game.data, 1)"/>
                            <path v-if="teamBg(game.data, 2)" :d="bottomHalfPath(game.x, game.y)" :class="teamBg(game.data, 2)"/>
                            <text :x="game.x + 10" :y="game.y + boxHeight / 4 + 4" class="team-name" :class="{'team-winner': isWinner(game.data, 1)}">{{ truncName(game.data.team_1) || $t('games.someone') }}</text>
                            <text :x="game.x + boxWidth - 18" :y="game.y + boxHeight / 4 + 4" class="team-score">{{ game.data.team_1_score }}</text>
                            <text :x="game.x + 10" :y="game.y + boxHeight * 3 / 4 + 4" class="team-name" :class="{'team-winner': isWinner(game.data, 2)}">{{ truncName(game.data.team_2) || $t('games.lucky') }}</text>
                            <text :x="game.x + boxWidth - 18" :y="game.y + boxHeight * 3 / 4 + 4" class="team-score">{{ game.data.team_2_score }}</text>
                        </g>
                    </g>

                    <!-- WB Connectors -->
                    <g class="connectors">
                        <path v-for="(path, i) in wbConnectors" :key="'wbc'+i" :d="path" class="connector-line"/>
                    </g>

                    <!-- Loser Bracket label -->
                    <text :x="padding" :y="lbStartY - 8" class="bracket-section-label">{{ $t('ranking.loserBracket') }}</text>

                    <!-- Loser Bracket stages -->
                    <g v-for="(stage, si) in lbStages" :key="'lb'+si">
                        <text :x="stage.x + boxWidth / 2" :y="lbStartY + 16" class="round-header">
                            L{{ si + 1 }}
                        </text>
                        <g v-for="(game, gi) in stage.games" :key="'lbg'+gi">
                            <rect :x="game.x" :y="game.y" :width="boxWidth" :height="boxHeight" rx="6" ry="6" class="game-box game-box--loser"/>
                            <line :x1="game.x + 1" :y1="game.y + boxHeight / 2" :x2="game.x + boxWidth - 1" :y2="game.y + boxHeight / 2" class="game-divider"/>
                            <path v-if="teamBg(game.data, 1)" :d="topHalfPath(game.x, game.y)" :class="teamBg(game.data, 1)"/>
                            <path v-if="teamBg(game.data, 2)" :d="bottomHalfPath(game.x, game.y)" :class="teamBg(game.data, 2)"/>
                            <text :x="game.x + 10" :y="game.y + boxHeight / 4 + 4" class="team-name" :class="{'team-winner': isWinner(game.data, 1)}">{{ truncName(game.data.team_1) || $t('games.someone') }}</text>
                            <text :x="game.x + boxWidth - 18" :y="game.y + boxHeight / 4 + 4" class="team-score">{{ game.data.team_1_score }}</text>
                            <text :x="game.x + 10" :y="game.y + boxHeight * 3 / 4 + 4" class="team-name" :class="{'team-winner': isWinner(game.data, 2)}">{{ truncName(game.data.team_2) || $t('games.lucky') }}</text>
                            <text :x="game.x + boxWidth - 18" :y="game.y + boxHeight * 3 / 4 + 4" class="team-score">{{ game.data.team_2_score }}</text>
                        </g>
                    </g>

                    <!-- LB Connectors -->
                    <g class="connectors">
                        <path v-for="(path, i) in lbConnectors" :key="'lbc'+i" :d="path" class="connector-line connector-line--loser"/>
                    </g>

                    <!-- Grand Final -->
                    <g v-if="grandFinalPos">
                        <text :x="grandFinalPos.x + boxWidth / 2" :y="grandFinalPos.y - 12" class="round-header round-header--final">{{ $t('ranking.grandFinal') }}</text>
                        <rect :x="grandFinalPos.x" :y="grandFinalPos.y" :width="boxWidth" :height="boxHeight" rx="6" ry="6" class="game-box game-box--final"/>
                        <line :x1="grandFinalPos.x + 1" :y1="grandFinalPos.y + boxHeight / 2" :x2="grandFinalPos.x + boxWidth - 1" :y2="grandFinalPos.y + boxHeight / 2" class="game-divider"/>
                        <path v-if="teamBg(bracket.grandFinal, 1, true)" :d="topHalfPath(grandFinalPos.x, grandFinalPos.y)" :class="teamBg(bracket.grandFinal, 1, true)"/>
                        <path v-if="teamBg(bracket.grandFinal, 2, true)" :d="bottomHalfPath(grandFinalPos.x, grandFinalPos.y)" :class="teamBg(bracket.grandFinal, 2, true)"/>
                        <text :x="grandFinalPos.x + 10" :y="grandFinalPos.y + boxHeight / 4 + 4" class="team-name" :class="{'team-winner': isWinner(bracket.grandFinal, 1)}">{{ truncName(bracket.grandFinal.team_1) || $t('games.someone') }}</text>
                        <text :x="grandFinalPos.x + boxWidth - 18" :y="grandFinalPos.y + boxHeight / 4 + 4" class="team-score">{{ bracket.grandFinal.team_1_score }}</text>
                        <text :x="grandFinalPos.x + 10" :y="grandFinalPos.y + boxHeight * 3 / 4 + 4" class="team-name" :class="{'team-winner': isWinner(bracket.grandFinal, 2)}">{{ truncName(bracket.grandFinal.team_2) || $t('games.lucky') }}</text>
                        <text :x="grandFinalPos.x + boxWidth - 18" :y="grandFinalPos.y + boxHeight * 3 / 4 + 4" class="team-score">{{ bracket.grandFinal.team_2_score }}</text>
                    </g>

                    <!-- Drop-down arrows from WB to LB -->
                    <g class="connectors">
                        <path v-for="(path, i) in dropDownPaths" :key="'dd'+i" :d="path" class="connector-line connector-line--dropdown"/>
                    </g>
                </svg>
            </div>
        </div>
        <button class="modal-close is-large bracket-close" aria-label="close" @click="$emit('close-modal')"></button>
    </div>
</template>

<script>
export default {
    name: 'DoubleBracket',
    props: ['bracket'],
    emits: ['close-modal'],
    mounted() {
        document.documentElement.style.overflow = 'hidden';
    },
    beforeUnmount() {
        document.documentElement.style.overflow = '';
    },
    data() {
        return {
            boxWidth: 200,
            boxHeight: 56,
            colGap: 36,
            rowGap: 14,
            padding: 20,
            sectionHeaderY: 40,
            wbTopOffset: 50,
            sectionGap: 60,
        }
    },
    computed: {
        wbStages() {
            const stages = this.bracket.winnerStages;
            return stages.map((stage, si) => {
                const x = this.padding + si * (this.boxWidth + this.colGap);
                const totalHeight = this.wbHeight;
                const gamesCount = stage.teams.length;
                const spacing = totalHeight / gamesCount;
                const games = stage.teams.map((game, gi) => ({
                    x,
                    y: this.wbTopOffset + gi * spacing + (spacing - this.boxHeight) / 2,
                    data: game
                }));
                return {games, x};
            });
        },
        wbHeight() {
            const firstStage = this.bracket.winnerStages[0];
            return firstStage.teams.length * (this.boxHeight + this.rowGap);
        },
        lbStartY() {
            return this.wbTopOffset + this.wbHeight + this.sectionGap;
        },
        lbStages() {
            const stages = this.bracket.loserStages;
            return stages.map((stage, si) => {
                const x = this.padding + si * (this.boxWidth + this.colGap) * 0.6;
                const totalHeight = this.lbHeight;
                const gamesCount = stage.teams.length;
                const spacing = totalHeight / Math.max(gamesCount, 1);
                const games = stage.teams.map((game, gi) => ({
                    x,
                    y: this.lbStartY + 28 + gi * spacing + (spacing - this.boxHeight) / 2,
                    data: game
                }));
                return {games, x};
            });
        },
        lbHeight() {
            const maxGames = Math.max(...this.bracket.loserStages.map(s => s.teams.length), 1);
            return maxGames * (this.boxHeight + this.rowGap);
        },
        grandFinalPos() {
            const wbLastStage = this.wbStages[this.wbStages.length - 1];
            const x = wbLastStage.x + this.boxWidth + this.colGap;
            const wbFinalY = wbLastStage.games[0]?.y || this.wbTopOffset;
            const lbLastStage = this.lbStages[this.lbStages.length - 1];
            const lbFinalY = lbLastStage?.games[0]?.y || this.lbStartY + 28;
            const y = (wbFinalY + lbFinalY) / 2;
            return {x, y};
        },
        svgWidth() {
            const wbWidth = this.bracket.winnerStages.length * (this.boxWidth + this.colGap);
            const lbWidth = this.bracket.loserStages.length * (this.boxWidth + this.colGap) * 0.6;
            return this.padding * 2 + Math.max(wbWidth, lbWidth) + this.boxWidth + this.colGap;
        },
        svgHeight() {
            return this.lbStartY + 28 + this.lbHeight + this.padding + 40;
        },
        wbConnectors() {
            const paths = [];
            for (let si = 0; si < this.wbStages.length - 1; si++) {
                const cur = this.wbStages[si];
                const next = this.wbStages[si + 1];
                for (let gi = 0; gi < next.games.length; gi++) {
                    const g1 = cur.games[gi * 2];
                    const g2 = cur.games[gi * 2 + 1];
                    const ng = next.games[gi];
                    if (g1 && g2 && ng) {
                        const midX = g1.x + this.boxWidth + this.colGap / 2;
                        const nextMidY = ng.y + this.boxHeight / 2;
                        paths.push(`M${g1.x + this.boxWidth},${g1.y + this.boxHeight / 2} H${midX} V${nextMidY} H${ng.x}`);
                        paths.push(`M${g2.x + this.boxWidth},${g2.y + this.boxHeight / 2} H${midX} V${nextMidY}`);
                    }
                }
            }
            return paths;
        },
        lbConnectors() {
            const paths = [];
            for (let si = 0; si < this.lbStages.length - 1; si++) {
                const cur = this.lbStages[si];
                const next = this.lbStages[si + 1];
                if (cur.games.length === next.games.length) {
                    for (let gi = 0; gi < next.games.length; gi++) {
                        const cg = cur.games[gi];
                        const ng = next.games[gi];
                        if (cg && ng) {
                            paths.push(`M${cg.x + this.boxWidth},${cg.y + this.boxHeight / 2} H${ng.x}`);
                        }
                    }
                } else {
                    for (let gi = 0; gi < next.games.length; gi++) {
                        const g1 = cur.games[gi * 2];
                        const g2 = cur.games[gi * 2 + 1];
                        const ng = next.games[gi];
                        if (g1 && ng) {
                            const midX = g1.x + this.boxWidth + (this.colGap * 0.6) / 2;
                            const nextMidY = ng.y + this.boxHeight / 2;
                            paths.push(`M${g1.x + this.boxWidth},${g1.y + this.boxHeight / 2} H${midX} V${nextMidY} H${ng.x}`);
                            if (g2) {
                                paths.push(`M${g2.x + this.boxWidth},${g2.y + this.boxHeight / 2} H${midX} V${nextMidY}`);
                            }
                        }
                    }
                }
            }
            return paths;
        },
        dropDownPaths() {
            const paths = [];
            for (let si = 0; si < this.wbStages.length - 1; si++) {
                const wbStage = this.wbStages[si];
                const lbTargetIndex = si * 2;
                if (lbTargetIndex < this.lbStages.length) {
                    const lbStage = this.lbStages[lbTargetIndex];
                    const wbMidX = wbStage.x + this.boxWidth / 2;
                    const lbMidX = lbStage.x + this.boxWidth / 2;
                    const midX = (wbMidX + lbMidX) / 2;
                    const wbBottomY = wbStage.games[wbStage.games.length - 1]?.y + this.boxHeight;
                    const lbTopY = lbStage.games[0]?.y;
                    if (wbBottomY && lbTopY) {
                        paths.push(`M${wbMidX},${wbBottomY + 4} V${(wbBottomY + lbTopY) / 2} H${midX} V${lbTopY - 4}`);
                    }
                }
            }
            return paths;
        },
    },
    methods: {
        wbRoundLabel(index) {
            const stages = this.bracket.winnerStages;
            if (index === stages.length - 1) return 'WB Final';
            if (index === stages.length - 2) return 'WB Semi';
            return `WB R${index + 1}`;
        },
        truncName(name) {
            if (!name) return '';
            const maxWidth = this.boxWidth - 44;
            const maxChars = Math.floor(maxWidth / 6.5);
            if (name.length > maxChars) return name.slice(0, maxChars - 1) + '…';
            return name;
        },
        isWinner(game, team) {
            if (!game || game.team_1_score == null || game.team_2_score == null) return false;
            return team === 1 ? game.team_1_score > game.team_2_score : game.team_2_score > game.team_1_score;
        },
        teamBg(game, team, isFinal = false) {
            if (!game || game.team_1_score == null || game.team_2_score == null) return null;
            const isWinner = this.isWinner(game, team);
            if (isFinal) return isWinner ? 'bg-gold' : 'bg-silver';
            return isWinner ? 'bg-winner' : 'bg-loser';
        },
        topHalfPath(x, y) {
            const r = 5;
            const w = this.boxWidth - 2;
            const h = this.boxHeight / 2 - 1;
            const x0 = x + 1;
            const y0 = y + 1;
            return `M${x0 + r},${y0} H${x0 + w - r} Q${x0 + w},${y0} ${x0 + w},${y0 + r} V${y0 + h} H${x0} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} Z`;
        },
        bottomHalfPath(x, y) {
            const r = 5;
            const w = this.boxWidth - 2;
            const h = this.boxHeight / 2 - 1;
            const x0 = x + 1;
            const y0 = y + this.boxHeight / 2;
            return `M${x0},${y0} H${x0 + w} V${y0 + h - r} Q${x0 + w},${y0 + h} ${x0 + w - r},${y0 + h} H${x0 + r} Q${x0},${y0 + h} ${x0},${y0 + h - r} Z`;
        },
    }
}
</script>

<style scoped>
.bracket-close {
    top: 6px !important;
}

.bracket-modal {
    --bracket-winner: rgba(16, 185, 129, 0.12);
    --bracket-gold: rgba(255, 197, 0, 0.18);
    --bracket-silver: rgba(192, 192, 192, 0.25);
    --bracket-loser: rgba(255, 255, 255, 1);
    --bracket-text: #333;
    --bracket-divider: #eee;
    --bracket-connector: #ccc;
    --bracket-dropdown: #e57373;

    background: white;
    border-radius: 8px;
    max-width: 95vw;
    max-height: 90vh;
    overflow: auto;
}

.bracket-container {
    padding: 10px 10px 20px;
}

.bracket-svg {
    display: block;
}

.bracket-section-label {
    font-size: 13px;
    font-weight: 700;
    fill: #7c3aed;
}

.game-box {
    fill: #fff;
    stroke: var(--bracket-connector);
    stroke-width: 1;
}

.game-box--loser {
    stroke: #e57373;
    stroke-opacity: 0.5;
}

.game-box--final {
    stroke: #ffc500;
    stroke-width: 2;
}

.game-divider {
    stroke: var(--bracket-divider);
    stroke-width: 1;
}

.team-name {
    font-size: 11px;
    fill: var(--bracket-text);
}

.team-name.team-winner {
    font-weight: 700;
}

.team-score {
    font-size: 12px;
    font-weight: 700;
    fill: var(--bracket-text);
    text-anchor: middle;
}

.connector-line {
    fill: none;
    stroke: var(--bracket-connector);
    stroke-width: 2;
}

.connector-line--loser {
    stroke: #e57373;
    stroke-opacity: 0.6;
}

.connector-line--dropdown {
    stroke: var(--bracket-dropdown);
    stroke-width: 1.5;
    stroke-dasharray: 4 3;
}

.round-header {
    font-size: 11px;
    font-weight: 700;
    fill: var(--bracket-text);
    text-anchor: middle;
}

.round-header--final {
    fill: #b8860b;
}

.bg-winner {
    fill: var(--bracket-winner);
}

.bg-gold {
    fill: var(--bracket-gold);
}

.bg-silver {
    fill: var(--bracket-silver);
}

.bg-loser {
    fill: var(--bracket-loser);
}
</style>
