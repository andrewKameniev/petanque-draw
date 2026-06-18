<template>
  <a
    class="player-chip"
    :class="{ 'player-chip--captain': isCaptain }"
    :href="player.id ? 'https://portal.petanque.org.ua/player/' + player.id : undefined"
    :target="player.id ? '_blank' : undefined"
  >
    <img v-if="player.avatar_url" :src="player.avatar_url" class="player-chip__avatar" alt="" />
    <UserCircle v-else :size="30" class="player-chip__avatar-placeholder" />
    <div class="player-chip__info">
      <span class="player-chip__name">{{ player.surname }} {{ player.name }}</span>
      <span v-if="player.rating_place" class="player-chip__rating"
        ><TrendingUp :size="10" />{{ player.rating_place }}</span
      >
    </div>
    <span v-if="player.sport_title" class="player-chip__sport-title">{{
      sportTitleLabel(player.sport_title)
    }}</span>
    <span v-if="isCaptain" class="player-chip__captain-badge">
      <svg class="player-chip__captain-crown" viewBox="0 0 64 48" fill="none" aria-hidden="true">
        <defs>
          <linearGradient :id="gradientId" x1="16" y1="8" x2="46" y2="42">
            <stop offset="0%" stop-color="#9B6CFF" />
            <stop offset="55%" stop-color="#7c3aed" />
            <stop offset="100%" stop-color="#5521b5" />
          </linearGradient>
          <filter :id="filterId" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#6F35F4" flood-opacity="0.24" />
          </filter>
        </defs>
        <g :filter="`url(#${filterId})`">
          <circle cx="10" cy="11" r="3.2" fill="#7c3aed" />
          <circle cx="32" cy="5" r="3.4" fill="#9B6CFF" />
          <circle cx="54" cy="11" r="3.2" fill="#7c3aed" />
          <path
            d="M9 17L21.5 27L32 10L42.5 27L55 17L50 38C50 38 42 34 32 34C22 34 14 38 14 38L9 17Z"
            :fill="`url(#${gradientId})`"
          />
          <path
            d="M14 38C14 38 22 34 32 34C42 34 50 38 50 38C50 38 43 42 32 42C21 42 14 38 14 38Z"
            fill="#5521b5"
            opacity="0.9"
          />
          <path
            d="M20 30C27 27 38 27 45 30"
            stroke="#DCCBFF"
            stroke-width="3"
            stroke-linecap="round"
            opacity="0.55"
          />
        </g>
      </svg>
      <span class="player-chip__captain-circle">C</span>
    </span>
  </a>
</template>

<script>
import { UserCircle, TrendingUp } from 'lucide-vue-next';

let uid = 0;

export default {
  name: 'PlayerChip',
  components: { UserCircle, TrendingUp },
  props: {
    player: { type: Object, required: true },
    isCaptain: { type: Boolean, default: false },
  },
  data() {
    return { instanceId: uid++ };
  },
  computed: {
    gradientId() {
      return `captainCrownGradient_${this.instanceId}`;
    },
    filterId() {
      return `captainCrownShadow_${this.instanceId}`;
    },
  },
  methods: {
    sportTitleLabel(title) {
      const map = { candidate: 'КМС' };
      return map[title] || title;
    },
  },
};
</script>

<style scoped>
.player-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.6rem 0.3rem 0.3rem;
  border-radius: 24px;
  background: var(--color-bg-input, #f5f5f5);
  border: 1px solid var(--color-border, #eee);
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}

.player-chip:hover {
  border-color: rgb(22 163 74 / 50%);
}

.player-chip--captain {
  background: rgb(124 58 237 / 6%);
  border-color: rgb(124 58 237 / 35%);
}

.player-chip--captain:hover {
  border-color: rgb(124 58 237 / 60%);
}

.player-chip__avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.player-chip__avatar-placeholder {
  color: var(--color-text-muted, #bbb);
  flex-shrink: 0;
}

.player-chip__info {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
}

.player-chip__name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
}

.player-chip__rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.65rem;
  font-weight: 600;
  color: #16a34a;
  background: rgb(22 163 74 / 10%);
  padding: 1px 5px;
  border-radius: 8px;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s;
}

.player-chip__rating:hover {
  background: rgb(22 163 74 / 20%);
}

.player-chip__sport-title {
  font-size: 0.6rem;
  font-weight: 600;
  color: #92700c;
  background: #fdf6e3;
  padding: 1px 5px;
  border-radius: 6px;
  white-space: nowrap;
  flex-shrink: 0;
}

.player-chip__captain-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: auto;
  flex-shrink: 0;
}

.player-chip__captain-crown {
  width: 20px;
  height: 12px;
  transform: rotate(10deg) translate(3px, -3px);
  margin-bottom: -2px;
  margin-top: -10px;
}

.player-chip__captain-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  line-height: 1;
}

@media (max-width: 480px) {
  .player-chip {
    padding: 0.2rem 0.5rem 0.2rem 0.2rem;
  }

  .player-chip__avatar {
    width: 26px;
    height: 26px;
  }

  .player-chip__name {
    font-size: 0.78rem;
  }
}
</style>
