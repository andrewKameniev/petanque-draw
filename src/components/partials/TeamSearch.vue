<template>
    <div class="team-search-wrapper" ref="wrapper">
        <button class="team-search-btn" @click="showSearch = !showSearch" :class="{'team-search-btn--active': modelValue}">
            <Search :size="16"/>
            <UserRound :size="16"/>
        </button>
        <div v-if="showSearch" class="team-search-popover">
            <input ref="searchInput" v-model="searchQuery" class="team-search-input" :placeholder="$t('teams.searchTeam')" @keydown.escape="showSearch = false" @keydown.enter="applySearch"/>
            <ul v-if="filteredClubs.length" class="team-search-list team-search-clubs">
                <li v-for="club in filteredClubs" :key="'club-'+club"
                    class="team-search-item team-search-item--club"
                    :class="{'team-search-item--active': modelValue === club}"
                    @click="selectTeam(club)">
                    <Building2 :size="12"/>
                    {{ club }}
                </li>
            </ul>
            <ul class="team-search-list">
                <li v-for="team in filteredTeams" :key="team"
                    class="team-search-item"
                    :class="{'team-search-item--active': isHighlighted(team)}"
                    @click="selectTeam(team)">
                    {{ team }}
                </li>
                <li v-if="!filteredTeams.length && !filteredClubs.length" class="team-search-empty">{{ $t('teams.noResults') }}</li>
            </ul>
        </div>
    </div>
</template>

<script>
import {Search, UserRound, Building2} from "lucide-vue-next";

export default {
    name: 'TeamSearch',
    components: {Search, UserRound, Building2},
    props: {
        teams: { type: Array, default: () => [] },
        teamClubMap: { type: Object, default: () => ({}) },
        modelValue: { default: null },
    },
    emits: ['update:modelValue'],
    data() {
        return {
            showSearch: false,
            searchQuery: '',
        }
    },
    watch: {
        showSearch(val) {
            if (val) {
                this.$nextTick(() => this.$refs.searchInput?.focus());
                document.addEventListener('click', this._onClickOutside);
            } else {
                document.removeEventListener('click', this._onClickOutside);
            }
        }
    },
    created() {
        this._onClickOutside = (e) => {
            if (this.$refs.wrapper && !this.$refs.wrapper.contains(e.target)) {
                this.showSearch = false;
            }
        };
    },
    beforeUnmount() {
        document.removeEventListener('click', this._onClickOutside);
    },
    computed: {
        allClubs() {
            const clubs = new Set();
            Object.values(this.teamClubMap).forEach(c => { if (c) clubs.add(c); });
            return [...clubs].sort();
        },
        filteredClubs() {
            if (!this.searchQuery.trim()) return this.allClubs;
            const q = this.searchQuery.toLowerCase();
            return this.allClubs.filter(c => c.toLowerCase().includes(q));
        },
        filteredTeams() {
            if (!this.searchQuery.trim()) return this.teams;
            const q = this.searchQuery.toLowerCase();
            return this.teams.filter(t =>
                t.toLowerCase().includes(q) ||
                (this.teamClubMap[t] && this.teamClubMap[t].toLowerCase().includes(q))
            );
        }
    },
    methods: {
        selectTeam(team) {
            this.$emit('update:modelValue', this.modelValue === team ? null : team);
            this.showSearch = false;
            this.searchQuery = '';
        },
        applySearch() {
            if (this.filteredTeams.length === 1) {
                this.selectTeam(this.filteredTeams[0]);
            } else if (this.filteredClubs.length === 1 && !this.filteredTeams.length) {
                this.selectTeam(this.filteredClubs[0]);
            } else if (this.searchQuery.trim()) {
                this.$emit('update:modelValue', this.searchQuery.trim());
                this.showSearch = false;
            }
        },
        isHighlighted(team) {
            if (!this.modelValue) return false;
            if (this.modelValue === team) return true;
            return this.teamClubMap[team] === this.modelValue;
        },
    }
}
</script>

<style scoped>
.team-search-wrapper {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
}

.team-search-btn {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    width: 40px;
    height: 24px;
    justify-content: center;
    border: none;
    border-radius: 12px;
    background: var(--color-text-muted, #9ca3af);
    color: white;
    cursor: pointer;
    transition: background 0.15s;
    -webkit-tap-highlight-color: transparent;
    -webkit-appearance: none;
    appearance: none;
}

.team-search-btn svg {
    width: 12px;
    height: 12px;
}

.team-search-btn:hover {
    background: var(--color-text-muted, #6b7280);
}

.team-search-btn:focus,
.team-search-btn:focus-visible,
.team-search-btn:active {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
    background: var(--color-text-muted, #6b7280);
}

.team-search-btn--active {
    background: var(--color-text-muted, #6b7280);
}

.team-search-popover {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    width: 260px;
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    z-index: 100;
    padding: 0.5rem;
}

.team-search-input {
    width: 100%;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 6px;
    font-size: 1rem;
    outline: none;
    background: var(--color-surface, #fff);
    color: var(--color-text, #1a1a1a);
}

.team-search-input:focus {
    border-color: var(--color-primary);
}

.team-search-list {
    list-style: none;
    margin: 0.4rem 0 0;
    padding: 0;
    max-height: 200px;
    overflow-y: auto;
}

.team-search-item {
    padding: 0.35rem 0.6rem;
    font-size: 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.1s;
}

.team-search-item:hover {
    background: var(--color-surface-hover, #f3f4f6);
}

.team-search-item--active {
    background: var(--color-primary);
    color: white;
}

.team-search-clubs {
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    padding-bottom: 0.4rem;
    margin-bottom: 0.2rem;
}

.team-search-item--club {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 500;
}

.team-search-item--club svg {
    flex-shrink: 0;
}

.team-search-empty {
    padding: 0.5rem 0.6rem;
    font-size: 1rem;
    color: var(--color-text-muted, #9ca3af);
}
</style>
