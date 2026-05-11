<template>
    <div class="finished-banner" data-testid="finished-banner">
        <Trophy :size="20" class="finished-banner__icon"/>
        <span class="finished-banner__text">{{ $t('games.tournamentFinished') }}</span>
        <span class="finished-banner__dot">&middot;</span>
        <a href="#" class="finished-banner__link" @click.prevent="$emit('openResults')">{{ $t('games.seeResult') }}</a>
    </div>
</template>

<script>
import {Trophy} from "lucide-vue-next";

export default {
    name: 'FinishedBanner',
    components: {Trophy},
    emits: ['openResults'],
}
</script>

<style scoped>
.finished-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 0;
}

.finished-banner__icon {
    color: #f5a623;
    flex-shrink: 0;
}

.finished-banner__text {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text, #1a1a1a);
}

.finished-banner__dot {
    color: var(--color-text-muted, #999);
}

.finished-banner__link {
    font-size: 1.25rem;
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 500;
}

.finished-banner__link:hover {
    text-decoration: underline;
}
</style>
