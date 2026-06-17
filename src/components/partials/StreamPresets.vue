<template>
  <div class="content tabs-content">
    <div class="stream-subtabs">
      <button
        class="stream-subtabs__btn"
        :class="{ 'stream-subtabs__btn--active': subtab === 'teams' }"
        @click="subtab = 'teams'"
      >
        {{ $t('teams.teams') }}
      </button>
      <button
        class="stream-subtabs__btn"
        :class="{ 'stream-subtabs__btn--active': subtab === 'lanes' }"
        @click="subtab = 'lanes'"
      >
        {{ $t('streams.lanes') }}
      </button>
    </div>

    <div v-if="subtab === 'teams'" class="stream-section">
      <div v-for="team in tournament.teams" :key="team.title" class="stream-preset">
        <div class="stream-preset__header">
          <span class="stream-preset__name">{{ team.title }}</span>
          <button class="stream-preset__add" @click="addTeamStream(team.title)">
            <Plus :size="14" />
          </button>
        </div>
        <div v-if="teamStreams[team.title] && teamStreams[team.title].length" class="stream-preset__links">
          <div v-for="(url, idx) in teamStreams[team.title]" :key="idx" class="stream-preset__link">
            <component :is="getStreamIcon(url)" :size="16" :class="getStreamIconClass(url)" />
            <input
              class="stream-preset__input"
              type="url"
              :value="url"
              :placeholder="$t('games.streamPlaceholder')"
              @change="updateTeamStream(team.title, idx, $event.target.value)"
            />
            <button class="stream-preset__remove" @click="removeTeamStream(team.title, idx)">
              <X :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="subtab === 'lanes'" class="stream-section">
      <div v-for="lane in lanesList" :key="lane" class="stream-preset">
        <div class="stream-preset__header">
          <span class="stream-preset__name">{{ $t('games.lane') }} {{ lane }}</span>
          <button class="stream-preset__add" @click="addLaneStream(lane)">
            <Plus :size="14" />
          </button>
        </div>
        <div v-if="laneStreams[lane] && laneStreams[lane].length" class="stream-preset__links">
          <div v-for="(url, idx) in laneStreams[lane]" :key="idx" class="stream-preset__link">
            <component :is="getStreamIcon(url)" :size="16" :class="getStreamIconClass(url)" />
            <input
              class="stream-preset__input"
              type="url"
              :value="url"
              :placeholder="$t('games.streamPlaceholder')"
              @change="updateLaneStream(lane, idx, $event.target.value)"
            />
            <button class="stream-preset__remove" @click="removeLaneStream(lane, idx)">
              <X :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { getStreamIconComponent, getStreamIconClass } from '@/services/streams';
import { Plus, X, Twitch, Facebook, Instagram, Video } from 'lucide-vue-next';
import YoutubeIcon from '@/components/icons/YoutubeIcon.vue';

export default {
  name: 'StreamPresets',
  components: { Plus, X, YoutubeIcon, Twitch, Facebook, Instagram, Video },
  data() {
    return {
      subtab: 'teams',
    };
  },
  computed: {
    ...mapState(useMainStore, ['currentTournament']),
    tournament() {
      return this.currentTournament;
    },
    teamStreams() {
      return this.tournament.streamPresets?.teams || {};
    },
    laneStreams() {
      return this.tournament.streamPresets?.lanes || {};
    },
    lanesList() {
      const start = this.tournament.preferences?.fieldsStart || 1;
      const count = Math.max(this.tournament.teams?.length ? Math.floor(this.tournament.teams.length / 2) : 4, 1);
      return Array.from({ length: count }, (_, i) => i + start);
    },
  },
  methods: {
    ...mapActions(useMainStore, ['syncToFirebase']),
    ensurePresets() {
      if (!this.tournament.streamPresets) {
        this.tournament.streamPresets = { teams: {}, lanes: {} };
      }
      if (!this.tournament.streamPresets.teams) this.tournament.streamPresets.teams = {};
      if (!this.tournament.streamPresets.lanes) this.tournament.streamPresets.lanes = {};
    },
    addTeamStream(teamTitle) {
      this.ensurePresets();
      if (!this.tournament.streamPresets.teams[teamTitle]) {
        this.tournament.streamPresets.teams[teamTitle] = [];
      }
      this.tournament.streamPresets.teams[teamTitle].push('');
      this.syncToFirebase();
    },
    updateTeamStream(teamTitle, idx, value) {
      this.ensurePresets();
      if (this.tournament.streamPresets.teams[teamTitle]) {
        this.tournament.streamPresets.teams[teamTitle][idx] = value;
        this.syncToFirebase();
      }
    },
    removeTeamStream(teamTitle, idx) {
      this.ensurePresets();
      if (this.tournament.streamPresets.teams[teamTitle]) {
        this.tournament.streamPresets.teams[teamTitle].splice(idx, 1);
        if (!this.tournament.streamPresets.teams[teamTitle].length) {
          delete this.tournament.streamPresets.teams[teamTitle];
        }
        this.syncToFirebase();
      }
    },
    addLaneStream(lane) {
      this.ensurePresets();
      const key = String(lane);
      if (!this.tournament.streamPresets.lanes[key]) {
        this.tournament.streamPresets.lanes[key] = [];
      }
      this.tournament.streamPresets.lanes[key].push('');
      this.syncToFirebase();
    },
    updateLaneStream(lane, idx, value) {
      this.ensurePresets();
      const key = String(lane);
      if (this.tournament.streamPresets.lanes[key]) {
        this.tournament.streamPresets.lanes[key][idx] = value;
        this.syncToFirebase();
      }
    },
    removeLaneStream(lane, idx) {
      this.ensurePresets();
      const key = String(lane);
      if (this.tournament.streamPresets.lanes[key]) {
        this.tournament.streamPresets.lanes[key].splice(idx, 1);
        if (!this.tournament.streamPresets.lanes[key].length) {
          delete this.tournament.streamPresets.lanes[key];
        }
        this.syncToFirebase();
      }
    },
    getStreamIcon: getStreamIconComponent,
    getStreamIconClass,
  },
};
</script>

<style scoped>
.stream-subtabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.stream-subtabs__btn {
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
  font-weight: 500;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.stream-subtabs__btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-btn-text, #fff);
  font-weight: 600;
}

.stream-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stream-preset {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  background: var(--color-surface);
}

.stream-preset__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stream-preset__name {
  font-weight: 600;
  font-size: 0.95rem;
}

.stream-preset__add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.15s;
}

.stream-preset__add:hover {
  background: var(--color-primary-bg);
}

.stream-preset__links {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.stream-preset__link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stream-preset__input {
  flex: 1;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.35rem 0.6rem;
  font-size: 0.85rem;
  outline: none;
  background: var(--color-surface, var(--color-white));
  color: var(--color-text);
}

.stream-preset__input:focus {
  border-color: var(--color-primary);
}

.stream-preset__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.stream-preset__remove:hover {
  color: var(--color-danger, #e53935);
  background: rgb(229 57 53 / 10%);
}

.stream-icon--youtube {
  color: #f00;
}

.stream-icon--twitch {
  color: #9146ff;
}

.stream-icon--facebook {
  color: #1877f2;
}

.stream-icon--instagram {
  color: #e4405f;
}

.stream-icon--default {
  color: var(--color-text-muted);
}
</style>
