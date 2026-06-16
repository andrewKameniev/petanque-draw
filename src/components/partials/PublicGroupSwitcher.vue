<template>
    <div class="public-group-switcher">
        <button class="public-group-switcher__btn"
                :class="{'public-group-switcher__btn--active': activeGroup === 'A'}"
                @click="switchTo('A')">
            {{ $t('ranking.mainTournament') }}
        </button>
        <button class="public-group-switcher__btn"
                :class="{'public-group-switcher__btn--active': activeGroup === 'B'}"
                @click="switchTo('B')">
            {{ $t('ranking.tournamentB') }}
        </button>
    </div>
</template>

<script>
export default {
    name: 'PublicGroupSwitcher',
    props: ['tournament'],
    emits: ['switch'],
    data() {
        return {
            activeGroup: this.tournament?.activeGroup || 'A'
        }
    },
    methods: {
        switchTo(group) {
            this.activeGroup = group;
            this.$emit('switch', group);
        }
    }
}
</script>

<style scoped>
.public-group-switcher {
    display: flex;
    width: 100%;
    border-bottom: 1px solid var(--color-border, #e0e0e0);
    margin-bottom: 0.75rem;
}

.public-group-switcher__btn {
    flex: 1;
    padding: 0.6rem 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    border: none;
    background: transparent;
    color: var(--color-text-secondary, #888);
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    position: relative;
}

.public-group-switcher__btn--active {
    color: var(--color-primary);
}

.public-group-switcher__btn--active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--color-primary);
    border-radius: 2px 2px 0 0;
}

.public-group-switcher__btn:hover:not(.public-group-switcher__btn--active) {
    color: var(--color-text);
    background: var(--color-surface-hover, rgba(0, 0, 0, 0.03));
}
</style>
