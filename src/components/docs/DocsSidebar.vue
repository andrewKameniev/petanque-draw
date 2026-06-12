<template>
    <aside class="docs__sidebar" :class="{'docs__sidebar--open': open}">
        <div class="docs__search">
            <Search :size="16"/>
            <input
                type="text"
                :placeholder="$t('docs.search')"
                :value="searchQuery"
                @input="$emit('update:searchQuery', $event.target.value)"
            />
            <button v-if="searchQuery" class="docs__search-clear" @click="$emit('update:searchQuery', '')">
                <X :size="14"/>
            </button>
        </div>
        <nav class="docs__nav">
            <template v-for="group in navGroups" :key="group.label">
                <p class="docs__nav-label">{{ group.label }}</p>
                <ul>
                    <li v-for="item in group.items" :key="item.id">
                        <a
                            href="#"
                            :class="{'docs__nav-active': activeSection === item.id}"
                            @click.prevent="$emit('navigate', item.id)"
                        >
                            <component :is="item.icon" :size="16"/>
                            {{ item.label }}
                        </a>
                    </li>
                </ul>
            </template>
        </nav>
    </aside>
</template>

<script>
import {
    Search, X, Shuffle, Grid3x3, Users, Target, Trophy,
    GitBranch, Layers, Copy, BarChart3, HelpCircle, BookOpen
} from 'lucide-vue-next';

export default {
    name: 'DocsSidebar',
    components: { Search, X, Shuffle, Grid3x3, Users, Target, Trophy, GitBranch, Layers, Copy, BarChart3, HelpCircle, BookOpen },
    props: {
        open: Boolean,
        activeSection: String,
        searchQuery: String,
    },
    emits: ['navigate', 'update:searchQuery'],
    computed: {
        sections() {
            return [
                { id: 'glossary', label: this.$t('docs.quickRef'), icon: BookOpen },
                { id: 'swiss', label: this.$t('docs.swissSystem.title'), icon: Shuffle },
                { id: 'groups', label: this.$t('docs.groupsSystem.title'), icon: Grid3x3 },
                { id: 'barrage', label: this.$t('docs.barrageSystem.title'), icon: Users },
                { id: 'supermele', label: this.$t('docs.supermeleSystem.title'), icon: Shuffle },
                { id: 'tir', label: 'TIR', icon: Target },
                { id: 'playoff', label: this.$t('docs.playoffSystem.title'), icon: Trophy },
                { id: 'cadrage', label: this.$t('docs.cadrageSystem.title'), icon: GitBranch },
                { id: 'swiss-playoff', label: this.$t('docs.swissPlayoff.title'), icon: Layers },
                { id: 'swiss-barrage-playoff', label: this.$t('docs.swissBarragePlayoff.title'), icon: Layers },
                { id: 'tournament-b', label: this.$t('docs.tournamentB.title'), icon: Copy },
                { id: 'rankings', label: this.$t('docs.rankingAlgorithms.title'), icon: BarChart3 },
                { id: 'faq', label: 'FAQ', icon: HelpCircle },
            ];
        },
        navGroups() {
            return [
                { label: this.$t('docs.quickRef'), items: [this.sections[0]] },
                { label: this.$t('docs.systems'), items: this.sections.slice(1, 8) },
                { label: this.$t('docs.formats'), items: this.sections.slice(8, 11) },
                { label: this.$t('docs.rankings'), items: [this.sections[11]] },
                { label: this.$t('docs.faq'), items: this.sections.slice(12) },
            ];
        },
    }
}
</script>

<style scoped>
.docs__sidebar {
    width: 280px;
    flex-shrink: 0;
    background: var(--color-white);
    border-right: 1px solid var(--color-border-light);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.docs__search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--color-border-light);
}

.docs__search svg {
    color: var(--color-text-muted);
    flex-shrink: 0;
}

.docs__search input {
    border: none;
    outline: none;
    box-shadow: none;
    font-size: 0.9rem;
    width: 100%;
    background: transparent;
    color: var(--color-text);
}

.docs__search-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 50%;
    background: var(--color-border-light);
    color: var(--color-text-muted);
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s;
}

.docs__search-clear:hover {
    background: var(--color-border);
    color: var(--color-text);
}

.docs__nav {
    padding: 0.5rem 0;
    flex: 1;
    overflow-y: auto;
}

.docs__nav-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    padding: 1rem 1.25rem 0.25rem;
    margin: 0;
}

.docs__nav ul {
    list-style: none;
    margin: 0;
    padding: 0;
}

.docs__nav ul li a {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1.25rem;
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
    border-left: 3px solid transparent;
}

.docs__nav ul li a:hover {
    background: var(--color-primary-bg);
    color: var(--color-primary);
}

.docs__nav-active {
    background: var(--color-primary-bg) !important;
    color: var(--color-primary) !important;
    border-left-color: var(--color-primary) !important;
    font-weight: 600;
}

@media (max-width: 768px) {
    .docs__sidebar {
        display: none;
        position: fixed;
        top: 52px;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        z-index: 200;
        border-right: none;
    }

    .docs__sidebar--open {
        display: flex;
    }
}

@media (min-width: 769px) and (max-width: 1024px) {
    .docs__sidebar {
        width: 240px;
    }
}
</style>
