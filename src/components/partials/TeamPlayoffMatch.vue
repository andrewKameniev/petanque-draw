<template>
    <div class="team-playoff-match">
        <div class="team-playoff-match__header">
            <button class="team-playoff-match__back" @click="$emit('back')">
                <ArrowLeft :size="18" />
                {{ roundLabel }}
            </button>
        </div>

        <div class="team-playoff-match__card">
            <div class="team-playoff-match__team">
                <span class="team-playoff-match__team-name">{{ match.team1 }}</span>
                <input
                    type="number"
                    class="team-playoff-match__score-input"
                    :value="match.team1Score"
                    :disabled="match.status === 'finished'"
                    min="0"
                    @input="updateScore('team1Score', $event)"
                />
            </div>

            <div class="team-playoff-match__divider">vs</div>

            <div class="team-playoff-match__team">
                <span class="team-playoff-match__team-name">{{ match.team2 }}</span>
                <input
                    type="number"
                    class="team-playoff-match__score-input"
                    :value="match.team2Score"
                    :disabled="match.status === 'finished'"
                    min="0"
                    @input="updateScore('team2Score', $event)"
                />
            </div>
        </div>

        <div v-if="match.status === 'finished'" class="team-playoff-match__finished">
            <Trophy :size="16" />
            {{ match.winner }}
        </div>

        <button v-if="canFinish" class="team-playoff-match__finish-btn" @click="$emit('finish')">
            {{ $t('teamPlayoff.finishMatch') }}
        </button>

        <div v-if="showScoreError" class="team-playoff-match__error">
            {{ $t('teamPlayoff.scoreError') }}
        </div>
    </div>
</template>

<script>
import { ArrowLeft, Trophy } from 'lucide-vue-next';

export default {
    name: 'TeamPlayoffMatch',
    components: { ArrowLeft, Trophy },
    props: {
        match: { type: Object, required: true },
        maxScore: { type: Number, default: 13 },
        roundLabel: { type: String, default: '' },
    },
    emits: ['back', 'update', 'finish'],
    computed: {
        canFinish() {
            if (this.match.status === 'finished') return false;
            const s1 = Number(this.match.team1Score);
            const s2 = Number(this.match.team2Score);
            if (isNaN(s1) || isNaN(s2)) return false;
            return s1 !== s2 && (s1 > 0 || s2 > 0);
        },
        showScoreError() {
            if (this.match.status === 'finished') return false;
            const s1 = Number(this.match.team1Score);
            const s2 = Number(this.match.team2Score);
            if (this.match.team1Score === null || this.match.team2Score === null) return false;
            if (isNaN(s1) || isNaN(s2)) return false;
            return s1 === s2 && s1 > 0;
        },
    },
    methods: {
        updateScore(field, event) {
            const val = event.target.value === '' ? null : Number(event.target.value);
            // eslint-disable-next-line vue/no-mutating-props
            this.match[field] = val;
            if (this.match.status === 'not_started' && val !== null) {
                // eslint-disable-next-line vue/no-mutating-props
                this.match.status = 'in_progress';
                // eslint-disable-next-line vue/no-mutating-props
                this.match.updatedAt = new Date().toISOString();
            }
            this.$emit('update');
        },
    },
};
</script>

<style scoped>
.team-playoff-match {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.team-playoff-match__header {
    display: flex;
    align-items: center;
}

.team-playoff-match__back {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: none;
    background: var(--color-surface-alt);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    cursor: pointer;
}

.team-playoff-match__card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    border: 1px solid var(--color-border);
    border-radius: 14px;
    background: var(--color-surface);
}

.team-playoff-match__team {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.team-playoff-match__team-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text);
    flex: 1;
    min-width: 0;
    word-break: break-word;
}

.team-playoff-match__score-input {
    width: 70px;
    height: 48px;
    text-align: center;
    font-size: 22px;
    font-weight: 700;
    border: 2px solid var(--color-border);
    border-radius: 10px;
    background: var(--color-surface);
    color: var(--color-text);
    flex-shrink: 0;
}

.team-playoff-match__score-input:focus {
    border-color: var(--color-primary);
    outline: none;
}

.team-playoff-match__score-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.team-playoff-match__divider {
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-muted);
}

.team-playoff-match__finished {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: rgb(76 175 80 / 8%);
    border-radius: 8px;
    font-weight: 600;
    color: var(--tir-winner, #2e7d32);
}

.team-playoff-match__finish-btn {
    width: 100%;
    padding: 14px;
    background: var(--tir-carreau, #4caf50);
    color: var(--color-btn-text, #fff);
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
}

.team-playoff-match__error {
    text-align: center;
    font-size: 13px;
    color: var(--color-danger, #e53935);
}
</style>
