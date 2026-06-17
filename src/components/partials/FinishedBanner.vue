<template>
    <div class="finished-banner" data-testid="finished-banner">
        <Trophy :size="20" class="finished-banner__icon" />
        <span class="finished-banner__text">{{ $t('games.tournamentFinished') }}</span>
        <span class="finished-banner__dot">&middot;</span>
        <a href="#" class="finished-banner__link" @click.prevent="$emit('openResults')">{{ $t('games.seeResult') }}</a>
    </div>
</template>

<script>
import { Trophy } from 'lucide-vue-next';

export default {
    name: 'FinishedBanner',
    components: { Trophy },
    emits: ['openResults'],
};
</script>

<style scoped>
.finished-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 4rem 1rem;
}

.finished-banner__icon {
    color: var(--color-warning);
    flex-shrink: 0;
}

.finished-banner__text {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text);
}

.finished-banner__dot {
    color: var(--color-text-muted);
}

.finished-banner__link {
    font-size: 1.1rem;
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 500;
}

.finished-banner__link:hover {
    text-decoration: underline;
}
</style>
