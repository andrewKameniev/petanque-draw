<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div v-if="tournament.teams?.length > 2" class="setup-card setup-card--system">
    <h3 class="setup-card__title">{{ $t('setup.readyToStart') }}</h3>
    <p class="setup-card__summary">
      {{ tournament.teams.length }}
      {{
        tournament.system === 'tir' ? pluralizeParticipants(tournament.teams.length) : $t('teams.teams').toLowerCase()
      }}
    </p>

    <div class="setup-card__field">
      <label class="setup-card__label">{{ $t('teams.system') }}</label>
      <div class="setup-card__radios">
        <label class="setup-card__radio" v-if="tournament.teams?.length > 4">
          <input type="radio" name="system" value="swiss" v-model="tournament.system" data-testid="radio-system-swiss" />
          {{ $t('teams.swiss') }}
        </label>
        <label class="setup-card__radio">
          <input type="radio" name="system" value="groups" v-model="tournament.system" data-testid="radio-system-groups" />
          {{ $t('teams.groups') }}
        </label>
        <label class="setup-card__radio">
          <input type="radio" name="system" value="playoff" v-model="tournament.system" data-testid="radio-system-playoff" />
          {{ $t('teams.playoff') }}
        </label>
        <label class="setup-card__radio" v-if="tournament.teams?.length >= 8 && tournament.teams?.length % 4 === 0">
          <input type="radio" name="system" value="poules" v-model="tournament.system" data-testid="radio-system-poules" />
          {{ $t('teams.poules') }}
        </label>
        <label class="setup-card__radio">
          <input type="radio" name="system" value="supermele" v-model="tournament.system" data-testid="radio-system-supermele" />
          {{ $t('teams.supermele') }}
        </label>
        <label class="setup-card__radio">
          <input type="radio" name="system" value="tir" v-model="tournament.system" data-testid="radio-system-tir" />
          {{ $t('teams.tir') }}
        </label>
      </div>
    </div>

    <div v-if="tournament.system === 'groups'" class="setup-card__field">
      <label class="setup-card__label">{{ $t('teams.teamsInGroup') }}</label>
      <select class="setup-card__select" data-testid="select-teams-in-group" v-model.number="localTeamsInGroup">
        <option :value="tournament.teams.length">{{ $t('teams.allTeams') }}</option>
        <template v-for="(team, index) in tournament.teams" :key="index">
          <option v-if="index > 1">{{ index + 1 }}</option>
        </template>
      </select>

      <div class="setup-card__field mt-2">
        <label class="setup-card__label">{{ $t('teams.groupFormat') }}</label>
        <div class="setup-card__radios">
          <label class="setup-card__radio">
            <input type="radio" name="groupFormat" value="round_robin" v-model="tournament.preferences.groupFormat" />
            {{ $t('teams.groupFormatRoundRobin') }}
          </label>
          <label class="setup-card__radio">
            <input type="radio" name="groupFormat" value="swiss" v-model="tournament.preferences.groupFormat" />
            {{ $t('teams.groupFormatSwiss') }}
          </label>
        </div>
      </div>

      <div v-if="tournament.preferences.groupFormat === 'swiss'" class="setup-card__field mt-2">
        <label class="setup-card__label">{{ $t('teams.groupSwissRounds') }}</label>
        <input
          class="setup-card__input"
          type="number"
          v-model.number="tournament.preferences.groupSwissRounds"
          min="1"
          :max="localTeamsInGroup - 1"
        />
        <span class="setup-card__hint">{{ $t('teams.groupSwissRoundsHint') }}</span>
      </div>

      <div
        v-if="isAllTeamsGroup && tournament.preferences.groupFormat === 'round_robin'"
        class="setup-card__field mt-2"
      >
        <label class="setup-card__label">{{ $t('teams.roundsCount') }}</label>
        <select class="setup-card__select" v-model.number="localGroupRoundsCount">
          <option v-for="r in maxGroupRounds" :key="r" :value="r">{{ r }}</option>
        </select>
        <span class="setup-card__hint">{{ $t('teams.roundsCountHint') }}</span>
      </div>
      <GroupDrawMethod v-if="hasTeamRatings" v-model="tournament.preferences.groupDrawMethod" />
    </div>

    <div v-if="tournament.system === 'poules'" class="setup-card__field">
      <span class="setup-card__hint"
        >{{ Math.floor(tournament.teams.length / 4) }} {{ $t('setup.poulesInfo', { count: poulesPlayoffCount }) }}</span
      >
      <span v-if="tournament.teams.length % 4 !== 0" class="setup-card__hint setup-card__hint--warn">{{
        $t('setup.poulesHint')
      }}</span>
    </div>

    <div v-if="tournament.system === 'playoff'" class="setup-card__field">
      <span class="setup-card__hint">{{ $t('setup.straightPlayoffHint') }}</span>
      <span v-if="hasTeamRatings && !isPowerOfTwo" class="setup-card__hint mt-2">
        {{ $t('setup.straightPlayoffTechWins') }}
      </span>
      <GroupDrawMethod v-if="hasTeamRatings" v-model="tournament.preferences.groupDrawMethod" />
    </div>

    <div v-if="tournament.system === 'supermele'" class="setup-card__field">
      <label class="setup-card__label">{{ $t('teams.playersInTeam') }}</label>
      <select class="setup-card__select" v-model.number="tournament.supermelePlayers">
        <option value="2">2</option>
        <option value="3">3</option>
      </select>
    </div>

    <div v-if="tournament.system === 'tir'" class="setup-card__field">
      <label class="setup-card__checkbox">
        <input type="checkbox" v-model="localTirTwoRounds" />
        {{ $t('tir.twoRoundSystem') }}
      </label>
      <span class="setup-card__hint">{{ $t('tir.twoRoundHint') }}</span>
      <label class="setup-card__checkbox" style="margin-top: 0.75rem">
        <input type="checkbox" v-model="localTirJunior" />
        {{ $t('tir.juniorTournament') }}
      </label>
      <span class="setup-card__hint">{{ $t('tir.juniorHint') }}</span>
    </div>

    <div
      v-if="
        (tournament.system === 'swiss' || tournament.system === 'groups') &&
        tournament.system !== 'poules' &&
        tournament.system !== 'playoff'
      "
      class="setup-card__field"
    >
      <label class="setup-card__checkbox">
        <input type="checkbox" v-model="localSetupPlayOff" data-testid="checkbox-playoff" />
        {{ $t('setup.enablePlayOff') }}
      </label>
      <div v-if="localSetupPlayOff" class="setup-card__sub">
        <div v-if="!localWithBarrage">
          <label class="setup-card__label">{{ $t('modals.playOffTeams') }}</label>
          <select
            class="setup-card__select"
            v-model.number="tournament.preferences.playOffTeams"
            data-testid="select-playoff-teams"
          >
            <template v-for="value in teamToPlayOffValues" :key="value">
              <option :value="value" v-if="tournament.teams.length >= value">{{ value }}</option>
            </template>
          </select>
          <span class="setup-card__hint">{{ $t('modals.playOffTeamsHint') }}</span>
          <span
            v-if="qualifyPerGroupInfo"
            class="setup-card__hint"
            :class="{ 'setup-card__hint--warn': !qualifyPerGroupEven }"
          >
            {{ qualifyPerGroupInfo }}
          </span>
        </div>
        <label class="setup-card__checkbox setup-card__checkbox--sub">
          <input type="checkbox" v-model="localWithCadrage" data-testid="checkbox-cadrage" />
          {{ $t('ranking.withCadrage') }}
        </label>
        <span class="setup-card__hint setup-card__hint--sub">{{ $t('ranking.cadrageHint') }}</span>
        <label v-if="tournament.system === 'swiss'" class="setup-card__checkbox setup-card__checkbox--sub mt-2">
          <input type="checkbox" v-model="localWithBarrage" data-testid="checkbox-barrage" />
          {{ $t('ranking.withBarrage') }}
        </label>
        <span v-if="tournament.system === 'swiss'" class="setup-card__hint setup-card__hint--sub">{{
          $t('ranking.barrageHint')
        }}</span>
        <div v-if="localWithBarrage && tournament.system === 'swiss'" class="setup-card__sub">
          <label class="setup-card__label">{{ $t('ranking.barrageTeams') }}</label>
          <select
            class="setup-card__select"
            v-model.number="tournament.preferences.barrageTeams"
            data-testid="select-barrage-teams"
          >
            <template v-for="value in barrageTeamValues" :key="value">
              <option :value="value">{{ value }}</option>
            </template>
          </select>
          <span class="setup-card__hint">{{ $t('ranking.barrageTeamsHint') }}</span>
          <span class="setup-card__hint">{{ barrageToPlayoffCount }} {{ $t('ranking.barrageToPlayoff') }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="
        (tournament.system === 'swiss' || tournament.system === 'groups') &&
        !tournament.isTournamentB &&
        tournament.system !== 'playoff'
      "
      class="setup-card__field"
    >
      <label class="setup-card__checkbox">
        <input type="checkbox" v-model="localPlayB" data-testid="checkbox-play-b" />
        {{ $t('ranking.alsoPlay') }} <strong>{{ $t('ranking.tournamentB') }}</strong>
      </label>
    </div>

    <div v-if="tournament.system === 'swiss'" class="setup-card__field">
      <label class="setup-card__label">{{ $t('modals.swissRoundsCount') }}</label>
      <input class="setup-card__input" type="number" v-model.number="tournament.preferences.swissRoundsCount" min="1" />
      <span class="setup-card__hint">{{ $t('modals.swissRoundsCountHint') }}</span>
    </div>

    <div v-if="tournament.system === 'swiss' && !localSetupPlayOff" class="setup-card__field">
      <label class="setup-card__label">{{ $t('modals.prizePlaces') }}</label>
      <input class="setup-card__input" type="number" v-model.number="tournament.preferences.prizePlaces" min="1" />
      <span class="setup-card__hint">{{ $t('modals.prizePlacesHint') }}</span>
    </div>

    <div v-if="tournament.system !== 'tir'" class="setup-card__timer-section">
      <label class="setup-card__timer-header">
        <input type="checkbox" v-model="tournament.preferences.timeLimitEnabled" />
        <Timer :size="18" />
        <span>{{ $t('modals.timeLimit') }}</span>
      </label>
      <span class="setup-card__hint">{{ $t('modals.timeLimitHint') }}</span>
      <div v-if="tournament.preferences.timeLimitEnabled" class="setup-card__timer-body">
        <div class="setup-card__row">
          <div class="setup-card__row-item">
            <span v-if="localSetupPlayOff || tournament.system === 'playoff'" class="setup-card__label">{{
              tournament.system === 'playoff' ? $t('modals.timeLimit') : $t('modals.timeLimitSwiss')
            }}</span>
            <div class="select is-fullwidth">
              <select v-model.number="tournament.preferences.timeLimit">
                <option v-for="t in timeLimitOptions" :key="t" :value="t">{{ t }} {{ $t('modals.min') }}</option>
              </select>
            </div>
          </div>
          <div v-if="localSetupPlayOff || tournament.system === 'playoff'" class="setup-card__row-item">
            <span class="setup-card__label">{{ $t('modals.timeLimitPlayoff') }}</span>
            <div class="select is-fullwidth">
              <select v-model.number="tournament.preferences.playoffTimeLimit">
                <option :value="0">{{ $t('modals.noTimeLimit') }}</option>
                <option v-for="t in timeLimitOptions" :key="t" :value="t">{{ t }} {{ $t('modals.min') }}</option>
              </select>
            </div>
          </div>
        </div>
        <label v-if="localSetupPlayOff || tournament.system === 'playoff'" class="setup-card__checkbox mt-2">
          <input type="checkbox" v-model="tournament.preferences.noTimeLimitFinale" />
          {{ $t('modals.noTimeLimitFinale') }}
        </label>
        <div class="mt-4">
          <label class="setup-card__label">{{ $t('modals.cochonettes') }}</label>
          <div class="select is-fullwidth">
            <select v-model.number="tournament.preferences.cochonettes">
              <option :value="1">1</option>
              <option :value="2">2</option>
            </select>
          </div>
          <span class="setup-card__hint">{{ $t('modals.cochonettesHint') }}</span>
        </div>
      </div>
    </div>

    <button
      v-if="tournament.system !== 'tir'"
      class="setup-card__collapse-toggle"
      @click="showAdvancedSettings = !showAdvancedSettings"
    >
      <ChevronDown
        :size="16"
        class="setup-card__collapse-icon"
        :class="{ 'setup-card__collapse-icon--open': showAdvancedSettings }"
      />
      {{ $t('setup.additionalSettings') }}
    </button>

    <div v-if="showAdvancedSettings && tournament.system !== 'tir'" class="setup-card__collapse-content">

      <div class="setup-card__field">
        <label v-if="tournament.system !== 'playoff'" class="setup-card__checkbox">
          <input type="checkbox" v-model="tournament.preferences.cochonettesEnabled" />
          {{ $t('modals.perRoundScoring') }}
        </label>
        <label
          v-if="localSetupPlayOff || tournament.system === 'playoff'"
          class="setup-card__checkbox"
          :class="{ 'mt-2': tournament.system !== 'playoff' }"
        >
          <input type="checkbox" v-model="tournament.preferences.cochonettesEnabledPlayoff" />
          {{
            tournament.system === 'playoff' ? $t('modals.perRoundScoringGeneric') : $t('modals.perRoundScoringPlayoff')
          }}
        </label>
        <span class="setup-card__hint">{{ $t('modals.perRoundScoringHint') }}</span>
      </div>

      <div class="setup-card__field">
        <label class="setup-card__label">{{ $t('modals.technicalScore') }}</label>
        <div class="setup-card__row">
          <div class="setup-card__row-item">
            <span class="setup-card__hint">{{ $t('games.first') }}</span>
            <input
              class="setup-card__input"
              type="number"
              v-model="tournament.preferences.technical.technicalFirst"
              min="0"
            />
          </div>
          <div class="setup-card__row-item">
            <span class="setup-card__hint">{{ $t('games.technical') }} 2</span>
            <input
              class="setup-card__input"
              type="number"
              v-model="tournament.preferences.technical.technicalSecond"
              min="0"
            />
          </div>
        </div>
        <span class="setup-card__hint">{{ $t('modals.technicalScoreHint') }}</span>
      </div>

      <div class="setup-card__field">
        <label class="setup-card__label">{{ $t('modals.maxScore') }}</label>
        <input class="setup-card__input" type="number" v-model="tournament.preferences.maxScore" min="1" />
        <span class="setup-card__hint">{{ $t('modals.maxScoreHint') }}</span>
      </div>

      <div class="setup-card__field">
        <label class="setup-card__label">{{ $t('modals.fieldsStart') }}</label>
        <input class="setup-card__input" type="number" v-model="tournament.preferences.fieldsStart" min="1" />
        <span class="setup-card__hint">{{ $t('modals.fieldsStartHint') }}</span>
      </div>

      <div class="setup-card__field">
        <label class="setup-card__checkbox">
          <input type="checkbox" v-model="tournament.preferences.isTestTournament" />
          {{ $t('setup.testTournament') }}
        </label>
        <span class="setup-card__hint">{{ $t('setup.testTournamentHint') }}</span>
      </div>
    </div>

    <div class="setup-card__actions">
      <button class="setup-card__start" data-testid="btn-draw-first-round" @click="$emit('draw')">
        <Play :size="18" />
        {{ $t('setup.drawFirstRound') }}
      </button>
      <span class="setup-card__or">{{ $t('common.or') }}</span>
      <button class="setup-card__delete" data-testid="btn-delete-setup" @click="$emit('remove')">
        <Trash2 :size="16" />
        <span class="is-hidden-mobile">{{ $t('teams.removeTournament') }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import GroupDrawMethod from '@/components/partials/GroupDrawMethod';
import { Play, Trash2, ChevronDown, Timer } from 'lucide-vue-next';

export default {
  name: 'SetupCard',
  components: { GroupDrawMethod, Play, Trash2, ChevronDown, Timer },
  emits: [
    'draw',
    'remove',
    'update:teamsInGroup',
    'update:groupRoundsCount',
    'update:setupPlayOff',
    'update:withCadrage',
    'update:withBarrage',
    'update:playB',
    'update:tirTwoRounds',
    'update:tirJunior',
    'update:playoffTimeLimitEnabled',
  ],
  props: {
    tournament: { type: Object, required: true },
    teamsInGroup: { type: Number, default: null },
    groupRoundsCount: { type: Number, default: null },
    setupPlayOff: { type: Boolean, default: false },
    withCadrage: { type: Boolean, default: false },
    withBarrage: { type: Boolean, default: false },
    playB: { type: Boolean, default: false },
    tirTwoRounds: { type: Boolean, default: false },
    tirJunior: { type: Boolean, default: false },
    playoffTimeLimitEnabled: { type: Boolean, default: true },
  },
  data() {
    return {
      showAdvancedSettings: false,
    };
  },
  watch: {
    localWithCadrage(val) {
      if (val) this.localWithBarrage = false;
    },
    localWithBarrage(val) {
      if (val) this.localWithCadrage = false;
    },
    localTeamsInGroup(val) {
      if (val === this.tournament.teams?.length) {
        this.localGroupRoundsCount = this.defaultGroupRounds;
      }
    },
  },
  computed: {
    localTeamsInGroup: {
      get() {
        return this.teamsInGroup;
      },
      set(val) {
        this.$emit('update:teamsInGroup', val);
      },
    },
    localGroupRoundsCount: {
      get() {
        return this.groupRoundsCount;
      },
      set(val) {
        this.$emit('update:groupRoundsCount', val);
      },
    },
    localSetupPlayOff: {
      get() {
        return this.setupPlayOff;
      },
      set(val) {
        this.$emit('update:setupPlayOff', val);
      },
    },
    localWithCadrage: {
      get() {
        return this.withCadrage;
      },
      set(val) {
        this.$emit('update:withCadrage', val);
      },
    },
    localWithBarrage: {
      get() {
        return this.withBarrage;
      },
      set(val) {
        this.$emit('update:withBarrage', val);
      },
    },
    localPlayB: {
      get() {
        return this.playB;
      },
      set(val) {
        this.$emit('update:playB', val);
      },
    },
    localTirTwoRounds: {
      get() {
        return this.tirTwoRounds;
      },
      set(val) {
        this.$emit('update:tirTwoRounds', val);
      },
    },
    localTirJunior: {
      get() {
        return this.tirJunior;
      },
      set(val) {
        this.$emit('update:tirJunior', val);
      },
    },
    isAllTeamsGroup() {
      return this.tournament.system === 'groups' && this.teamsInGroup === this.tournament.teams.length;
    },
    maxGroupRounds() {
      const n = this.tournament.teams.length;
      const singleRoundRobin = n % 2 === 0 ? n - 1 : n;
      return singleRoundRobin * 2;
    },
    defaultGroupRounds() {
      const n = this.tournament.teams.length;
      return n % 2 === 0 ? n - 1 : n;
    },
    timeLimitOptions() {
      const options = [1];
      for (let i = 20; i <= 120; i += 5) options.push(i);
      return options;
    },
    teamToPlayOffValues() {
      const values = [];
      for (let i = 2; i <= this.tournament.teams.length; i *= 2) {
        values.push(i);
      }
      if (this.localWithCadrage) {
        values.pop();
      }
      return values;
    },
    localPlayoffTimeLimitEnabled: {
      get() {
        return this.playoffTimeLimitEnabled;
      },
      set(val) {
        this.$emit('update:playoffTimeLimitEnabled', val);
      },
    },
    isPowerOfTwo() {
      const n = this.tournament.teams?.length || 0;
      return n > 0 && (n & (n - 1)) === 0;
    },
    hasTeamRatings() {
      return this.tournament.useRating && this.tournament.teams?.some((t) => t.rating > 0);
    },
    poulesPlayoffCount() {
      const groups = Math.floor(this.tournament.teams?.length / 4) || 0;
      const estimated = groups * 2;
      return Math.pow(2, Math.ceil(Math.log2(estimated || 1)));
    },
    barrageTeamValues() {
      const values = [];
      const maxTeams = this.tournament.teams?.length || 0;
      for (let i = 4; i <= maxTeams; i *= 2) {
        values.push(i);
      }
      return values;
    },
    barrageToPlayoffCount() {
      const barrageTeams = this.tournament.preferences?.barrageTeams || 8;
      const groups = barrageTeams / 4;
      const estimated = groups * 2;
      return Math.pow(2, Math.ceil(Math.log2(estimated)));
    },
    groupCount() {
      if (this.tournament.system !== 'groups' || !this.localTeamsInGroup) return 0;
      return Math.ceil(this.tournament.teams.length / this.localTeamsInGroup);
    },
    qualifyPerGroupEven() {
      if (!this.groupCount || !this.tournament.preferences?.playOffTeams) return true;
      return this.tournament.preferences.playOffTeams % this.groupCount === 0;
    },
    qualifyPerGroupInfo() {
      if (this.tournament.system !== 'groups' || !this.localSetupPlayOff || this.localWithBarrage) return '';
      if (!this.groupCount || this.groupCount < 2) return '';
      const playOffTeams = this.tournament.preferences?.playOffTeams || 0;
      if (!playOffTeams) return '';
      if (!this.qualifyPerGroupEven) return this.$t('teams.qualifyUnevenWarning');
      const perGroup = playOffTeams / this.groupCount;
      return this.$t('teams.qualifyPerGroup', { count: perGroup });
    },
  },
  methods: {
    pluralizeParticipants(n) {
      const locale = this.$i18n.locale;
      if (locale === 'ua') {
        const mod10 = n % 10;
        const mod100 = n % 100;
        if (mod10 === 1 && mod100 !== 11) return 'учасник';
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'учасники';
        return 'учасників';
      }
      if (locale === 'fr') return n === 1 ? 'participant' : 'participants';
      if (locale === 'es') return n === 1 ? 'participante' : 'participantes';
      return n === 1 ? 'participant' : 'participants';
    },
  },
};
</script>

<style scoped>
.setup-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.setup-card__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.25rem;
}

.setup-card__summary {
  font-size: 1rem;
  color: var(--color-text-muted);
  margin: 0 0 1.25rem;
}

.setup-card__field {
  margin-bottom: 1rem;
}

.setup-card__label {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.35rem;
}

.setup-card__radios {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.setup-card__radio {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 1rem;
  cursor: pointer;
}

.setup-card__select {
  height: auto;
  padding: 0.5rem 2.5rem 0.5rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-input);
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 16px;
}

.setup-card__select:focus {
  border-color: var(--color-primary);
}

.setup-card__input {
  width: 100%;
  padding: 0.45rem 0.75rem;
  font-size: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-input);
  outline: none;
}

.setup-card__input:focus {
  border-color: var(--color-primary);
}

.setup-card__hint {
  display: block;
  font-size: 1rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}

.setup-card__hint--sub {
  margin-left: 1.5rem;
}

.setup-card__hint--warn {
  color: var(--color-error, #dc3545);
}

.setup-card__row {
  display: flex;
  gap: 0.75rem;
}

.setup-card__row-item {
  flex: 1;
}

.setup-card__checkbox {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1rem;
  cursor: pointer;
}

.setup-card__checkbox--sub {
  margin-top: 0.5rem;
}

.setup-card__sub {
  margin-top: 0.5rem;
  padding-left: 1.25rem;
}

.setup-card__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.setup-card__or {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.setup-card__start {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  flex: 1;
  padding: 0.7rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  background: var(--color-success);
  color: var(--color-btn-text);
  cursor: pointer;
  transition: background 0.15s;
}

.setup-card__start:hover {
  background: var(--color-success-hover);
}

.setup-card__delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.7rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  border: 1px solid var(--color-error);
  border-radius: 8px;
  background: transparent;
  color: var(--color-error);
  cursor: pointer;
  transition: all 0.15s;
  outline: none;
}

.setup-card__delete:focus-visible {
  box-shadow: 0 0 0 2px var(--color-error);
}

.setup-card__delete:hover {
  background: var(--color-error);
  color: var(--color-btn-text);
}

.setup-card__collapse-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-muted, #888);
  cursor: pointer;
  padding: 0.5rem 0;
  transition: color 0.15s;
}

.setup-card__collapse-toggle:hover {
  color: var(--color-primary);
}

.setup-card__collapse-icon {
  transition: transform 0.2s ease;
}

.setup-card__collapse-icon--open {
  transform: rotate(180deg);
}

.setup-card__timer-section {
  margin-top: 1.25rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-bg-soft, #fafafa);
}

.setup-card__timer-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text);
  cursor: pointer;
}

.setup-card__timer-header input[type='checkbox'] {
  background-color: #fff;
}

.setup-card__timer-body {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.setup-card__collapse-content {
  padding-top: 0.25rem;
}

.setup-card__nested {
  margin-top: 0.5rem;
  padding-left: 1.25rem;
  border-left: 2px solid var(--color-border);
}
</style>
