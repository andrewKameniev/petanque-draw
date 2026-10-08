<template>
  <article v-if="game.clubAbsence" class="club-match club-match--absence" data-testid="club-absence">
    <Trophy :size="20" aria-hidden="true" />
    <div>
      <strong>{{ game.winner || game.team_1 || game.team_2 }}</strong>
      <p>{{ $t(`club.absence.${game.clubAbsence}`) }}</p>
    </div>
    <strong v-if="game.team_1_score != null"
      >{{ Math.max(game.team_1_score, game.team_2_score) }} :
      {{ Math.min(game.team_1_score, game.team_2_score) }}</strong
    >
  </article>
  <article v-else-if="encounter" class="club-match" data-testid="club-encounter">
    <header class="club-match__header">
      <div class="club-match__meta">
        <span>{{ $t(`club.phase.${encounter.phase}`) }}</span
        ><span
          class="club-match__status"
          :class="{ 'club-match__status--complete': encounter.status === statuses.COMPLETED }"
          >{{ $t(`club.status.${encounter.status}`) }}</span
        >
      </div>
      <div class="club-match__scoreboard">
        <div class="club-match__club">
          <span class="club-match__crest">
            <img v-if="captain(clubs[0])?.club_logo_url" :src="captain(clubs[0]).club_logo_url" alt="" />
            <Shield v-else :size="32" aria-hidden="true" />
          </span>
          <h3>{{ game.team_1 }}</h3>
        </div>
        <div>
          <strong>{{ encounter.points[0] }} : {{ encounter.points[1] }}</strong
          ><small>{{ $t('club.clubPoints') }}</small>
        </div>
        <div class="club-match__club">
          <span class="club-match__crest">
            <img v-if="captain(clubs[1])?.club_logo_url" :src="captain(clubs[1]).club_logo_url" alt="" />
            <Shield v-else :size="32" aria-hidden="true" />
          </span>
          <h3>{{ game.team_2 }}</h3>
        </div>
      </div>
      <p v-if="winner" class="club-match__winner">
        <Trophy :size="16" aria-hidden="true" />{{ $t('club.winner', { club: winner.title }) }}
      </p>
      <div class="club-match__header-actions">
        <button
          v-if="editable && encounter.status !== statuses.COMPLETED && activeTab === 'games'"
          type="button"
          class="button is-purple is-small"
          @click="openStage(currentStageIndex)"
        >
          {{ $t('club.openCurrentStage') }}<ChevronRight :size="16" aria-hidden="true" />
        </button>
        <button
          v-if="canContinue"
          type="button"
          class="button is-purple is-small"
          :disabled="busy"
          @click="perform({ type: commands.CONTINUE })"
        >
          {{ $t('club.continue') }}
        </button>
      </div>
    </header>
    <TournamentNav
      v-model="activeTab"
      :tabs="tabs"
      :label="$t('club.sections')"
      :id-prefix="tabPrefix"
      :panel-id="`${tabPrefix}-panel`"
      variant="match"
    />
    <div
      :id="`${tabPrefix}-panel`"
      class="club-match__panel"
      role="tabpanel"
      :aria-labelledby="`${tabPrefix}-${activeTab}`"
    >
      <p v-if="error" role="alert" class="club-match__error">{{ error }}</p>
      <div v-if="activeTab === 'teams'" class="club-match__rosters">
        <section v-for="club in clubs" :key="club.clubId" class="club-match__roster">
          <h4>
            {{ club.title }} <small>{{ club.players.length }}</small>
          </h4>
          <div class="club-match__roster-players">
            <PlayerChip
              v-for="player in club.players"
              :key="player.id"
              :player="player"
              :is-captain="String(player.id) === String(club.captainId)"
            />
          </div>
        </section>
      </div>
      <section v-for="{ stage, index: stageIndex } in displayedStages" :key="stage.id" class="club-encounter__stage">
        <header class="club-match__stage-heading">
          <button
            v-if="activeTab === 'games'"
            type="button"
            class="club-match__stage-link"
            @click="openStage(stageIndex)"
          >
            {{ $t(`club.stages.${stage.id}`) }}<ChevronRight :size="16" aria-hidden="true" />
          </button>
          <h4 v-else>{{ $t(`club.stages.${stage.id}`) }}</h4>
          <span>{{ completedGames(stage) }}/{{ definitions[stageIndex].count }}</span
          ><strong>{{ stagePoints(stage).join(' : ') }}</strong>
        </header>
        <template v-if="activeTab !== 'games'">
          <p class="club-match__hint">
            {{
              $t('club.stagePoints', { count: definitions[stageIndex].count, points: definitions[stageIndex].points })
            }}
          </p>
          <p
            v-if="editable && stage.started && completedGames(stage) < definitions[stageIndex].count"
            class="club-match__hint"
          >
            {{ $t('club.scoreHint') }}
          </p>
          <div
            v-if="editable && !stage.started && encounter.status !== statuses.COMPLETED && available(stageIndex)"
            class="club-match__actions"
          >
            <button
              v-if="editingStage !== stageIndex"
              type="button"
              class="button is-purple is-small"
              :disabled="busy"
              @click="editLineups(stageIndex)"
            >
              {{ $t(stage.published ? 'club.editLineups' : 'club.enterLineups') }}
            </button>
            <button
              v-if="stage.published && editingStage !== stageIndex"
              type="button"
              class="button is-success is-small"
              :disabled="busy"
              @click="perform({ type: commands.START, stageIndex })"
            >
              {{ $t('club.startStage') }}
            </button>
          </div>
          <p v-if="!stage.published" class="club-match__hint">
            {{ $t(available(stageIndex) ? 'club.awaitingLineups' : 'club.awaitingPrevious') }}
          </p>
        </template>
        <form
          v-if="editingStage === stageIndex && editable && activeTab === stage.id"
          class="club-encounter__form"
          @submit.prevent="publish(stageIndex)"
        >
          <p class="club-match__hint">{{ $t('club.lineupHint') }}</p>
          <div class="club-match__lineups">
            <fieldset v-for="(club, side) in clubs" :key="club.clubId" :disabled="busy">
              <legend>{{ club.title }}</legend>
              <div v-for="(position, positionIndex) in lineups[side]" :key="positionIndex" class="club-match__position">
                <strong>{{ positionLabel(stageIndex, positionIndex) }}</strong>
                <label v-for="(_, playerIndex) in position" :key="playerIndex"
                  ><span v-if="position.length > 1">{{ $t('club.playerNumber', { number: playerIndex + 1 }) }}</span>
                  <select
                    v-model="lineups[side][positionIndex][playerIndex]"
                    :aria-label="`${club.title} · ${positionLabel(stageIndex, positionIndex)} · ${$t('club.playerNumber', { number: playerIndex + 1 })}`"
                    required
                    class="input"
                  >
                    <option value="" disabled>{{ $t('club.choose') }}</option>
                    <option
                      v-for="player in club.players"
                      :key="player.id"
                      :value="String(player.id)"
                      :disabled="unavailablePlayer(player, side, positionIndex, playerIndex)"
                    >
                      {{ player.surname }} {{ player.name }}
                    </option>
                  </select>
                </label>
              </div>
            </fieldset>
          </div>
          <div class="club-match__actions">
            <button type="submit" class="button is-success" :disabled="busy">{{ $t('club.publish') }}</button
            ><button type="button" class="button is-light" :disabled="busy" @click="editingStage = null">
              {{ $t('club.cancel') }}
            </button>
          </div>
        </form>
        <template v-else>
          <div class="club-match__clash">
            <template v-for="(club, side) in clubs" :key="club.clubId">
              <span v-if="side === 1" class="club-match__versus" aria-hidden="true">{{ $t('club.versus') }}</span>
              <div class="club-match__opponent" :class="{ 'club-match__opponent--right': side === 1 }">
                <span class="club-match__crest">
                  <img v-if="captain(club)?.club_logo_url" :src="captain(club).club_logo_url" alt="" loading="lazy" />
                  <Shield v-else :size="32" aria-hidden="true" />
                </span>
                <strong>{{ club.title }}</strong>
              </div>
            </template>
          </div>
          <component
            :is="isScoreEditing(stageIndex, gameIndex) ? 'form' : 'div'"
            v-for="(match, gameIndex) in stage.games"
            :key="match.position"
            class="club-match__game"
            :class="{ 'club-encounter__score-form': isScoreEditing(stageIndex, gameIndex) }"
            :aria-label="positionLabel(stageIndex, gameIndex)"
            data-testid="club-game"
            @submit.prevent="saveScore(stageIndex, gameIndex, match.status === statuses.COMPLETED)"
          >
            <div class="club-match__game-meta">
              <span :class="{ 'club-match__special': gameIndex === 0 }">{{ positionLabel(stageIndex, gameIndex) }}</span
              ><span>{{ $t(`club.status.${match.status}`) }}</span>
            </div>
            <PublicGameCard
              :game="individualGame(match)"
              :lane-number="match.position"
              :show-status="false"
              :class="{ 'club-match__card--editing': isScoreEditing(stageIndex, gameIndex) }"
            >
              <template #team-one
                ><div class="club-match__players">
                  <PlayerChip
                    v-for="player in playersFor(match.players1, clubs[0])"
                    :key="player.id"
                    :player="player"
                    :is-captain="String(player.id) === String(clubs[0].captainId)"
                  /><span v-if="!match.players1?.length">{{ $t('club.awaitingLineups') }}</span>
                </div></template
              >
              <template v-if="isScoreEditing(stageIndex, gameIndex)" #score>
                <span class="club-match__score-inputs">
                  <template v-for="(club, side) in clubs" :key="club.clubId">
                    <span v-if="side === 1" class="club-match__score-separator" aria-hidden="true">:</span>
                    <input
                      class="input"
                      type="number"
                      inputmode="numeric"
                      min="0"
                      max="13"
                      step="1"
                      required
                      :aria-label="$t('club.scoreFor', { club: club.title })"
                      :aria-invalid="!!scoreErrors[`${stageIndex}-${gameIndex}`]"
                      :aria-describedby="
                        scoreErrors[`${stageIndex}-${gameIndex}`]
                          ? `${tabPrefix}-score-error-${stageIndex}-${gameIndex}`
                          : undefined
                      "
                      :disabled="busy"
                      :value="draftScore(stageIndex, gameIndex, side)"
                      @focus="$event.target.select()"
                      @input="setScore(stageIndex, gameIndex, side, $event.target.value)"
                    />
                  </template>
                </span>
              </template>
              <template #team-two
                ><div class="club-match__players">
                  <PlayerChip
                    v-for="player in playersFor(match.players2, clubs[1])"
                    :key="player.id"
                    :player="player"
                    :is-captain="String(player.id) === String(clubs[1].captainId)"
                  /><span v-if="!match.players2?.length">{{ $t('club.awaitingLineups') }}</span>
                </div></template
              >
            </PublicGameCard>
            <div v-if="isScoreEditing(stageIndex, gameIndex)" class="club-match__score-footer">
              <span class="club-match__save-state" role="status">
                <template v-if="hasScoreChanges(stageIndex, gameIndex)">{{ $t('club.unsavedScore') }}</template>
                <template v-else-if="match.score1 != null"
                  ><Check :size="13" aria-hidden="true" />{{ $t('club.savedScore') }}</template
                >
              </span>
              <div class="club-match__score-actions">
                <button
                  v-if="match.status !== statuses.COMPLETED"
                  type="submit"
                  class="button is-light is-small"
                  :disabled="busy || !canSaveScore(stageIndex, gameIndex, false)"
                >
                  <Save :size="14" aria-hidden="true" />{{ $t('club.saveLive') }}
                </button>
                <button
                  :type="match.status === statuses.COMPLETED ? 'submit' : 'button'"
                  class="button is-success is-small"
                  :disabled="busy || !canSaveScore(stageIndex, gameIndex, true)"
                  @click="match.status !== statuses.COMPLETED && saveScore(stageIndex, gameIndex, true)"
                >
                  <Check :size="15" aria-hidden="true" />{{
                    $t(match.status === statuses.COMPLETED ? 'club.correctResult' : 'club.confirmResult')
                  }}
                </button>
                <button
                  v-if="match.status === statuses.COMPLETED"
                  type="button"
                  class="button is-light is-small"
                  :disabled="busy"
                  @click="cancelScoreEdit(stageIndex, gameIndex)"
                >
                  {{ $t('club.cancel') }}
                </button>
              </div>
              <p
                v-if="scoreErrors[`${stageIndex}-${gameIndex}`]"
                :id="`${tabPrefix}-score-error-${stageIndex}-${gameIndex}`"
                role="alert"
                class="club-match__score-error"
              >
                <CircleAlert :size="15" aria-hidden="true" />{{ scoreErrors[`${stageIndex}-${gameIndex}`] }}
              </p>
            </div>
            <button
              v-else-if="editable && activeTab === stage.id && stage.started && match.status === statuses.COMPLETED"
              type="button"
              class="club-match__edit"
              @click="editingResult = `${stageIndex}-${gameIndex}`"
            >
              <Pencil :size="13" aria-hidden="true" />{{ $t('club.editScore') }}
            </button>
          </component>
        </template>
        <button
          v-if="
            editable &&
            activeTab === stage.id &&
            stageIndex < 2 &&
            completedGames(stage) === definitions[stageIndex].count &&
            encounter.status !== statuses.COMPLETED
          "
          type="button"
          class="button is-purple is-small"
          @click="openStage(stageIndex + 1)"
        >
          {{ $t('club.nextStage', { stage: $t(`club.stages.${definitions[stageIndex + 1].id}`) })
          }}<ChevronRight :size="16" aria-hidden="true" />
        </button>
      </section>
      <details v-if="editable && activeTab === 'games' && encounter.audit?.length" class="club-match__audit">
        <summary>{{ $t('club.audit') }}</summary>
        <ol>
          <li v-for="(entry, index) in encounter.audit" :key="index">
            <time>{{ formatTime(entry.at) }}</time> · {{ $t(`club.actions.${entry.type}`)
            }}<span v-if="entry.stageIndex != null"> · {{ $t(`club.stages.${definitions[entry.stageIndex].id}`) }}</span
            ><span v-if="entry.gameIndex != null"> · №{{ entry.gameIndex + 1 }}</span>
            <p v-if="entry.type === commands.SCORE">
              {{ entry.before[0] ?? '–' }}:{{ entry.before[1] ?? '–' }} → {{ entry.after[0] }}:{{ entry.after[1] }}
            </p>
            <p v-if="entry.type === commands.LINEUPS">{{ auditLineups(entry.after) }}</p>
          </li>
        </ol>
      </details>
    </div>
  </article>
  <p v-else class="club-match__hint">{{ $t('club.awaitingClubs') }}</p>
</template>

<script>
import { mapActions, mapState } from 'pinia';
import { useId } from 'vue';
import {
  LayoutDashboard,
  UserRound,
  UsersRound,
  Users,
  ClipboardList,
  Pencil,
  ChevronRight,
  Trophy,
  Shield,
  Save,
  Check,
  CircleAlert,
} from 'lucide-vue-next';
import TournamentNav from '@/components/ui/TournamentNav.vue';
import PlayerChip from '@/components/partials/PlayerChip.vue';
import PublicGameCard from '@/components/partials/PublicGameCard.vue';
import { useMainStore } from '@/stores/main';
import {
  CLUB_STAGES,
  CLUB_STATUS,
  CLUB_COMMAND,
  CLUB_PHASE,
  createClubEncounter,
  clubStageComplete,
  clubStagePoints,
  canEditClubGame,
  validClubScore,
} from '@/services/club-encounter';
import { CLUB_CHANGE } from '@/services/club-competition';

export default {
  name: 'ClubEncounter',
  components: {
    TournamentNav,
    PlayerChip,
    PublicGameCard,
    Pencil,
    ChevronRight,
    Trophy,
    Shield,
    Save,
    Check,
    CircleAlert,
  },
  setup() {
    return { tabPrefix: useId() };
  },
  props: {
    game: { type: Object, required: true },
    tournament: { type: Object, required: true },
    phase: { type: String, default: CLUB_PHASE.QUALIFICATION },
    readOnly: { type: Boolean, default: true },
    locator: { type: Object, default: null },
  },
  data() {
    return {
      definitions: CLUB_STAGES,
      statuses: CLUB_STATUS,
      commands: CLUB_COMMAND,
      activeTab: 'games',
      editingResult: null,
      editingStage: null,
      lineups: [],
      scoreDrafts: {},
      scoreErrors: {},
      busy: false,
      error: '',
    };
  },
  computed: {
    ...mapState(useMainStore, ['isOwnerOrAdmin', 'user']),
    tabs() {
      return [
        { id: 'games', label: this.$t('club.overview'), icon: LayoutDashboard },
        { id: 'singles', label: this.$t('club.stages.singles'), icon: UserRound },
        { id: 'doubles', label: this.$t('club.stages.doubles'), icon: UsersRound },
        { id: 'triples', label: this.$t('club.stages.triples'), icon: Users },
        { id: 'teams', label: this.$t('club.rostersShort'), icon: ClipboardList },
      ];
    },
    displayedStages() {
      return this.encounter.stages
        .map((stage, index) => ({ stage, index }))
        .filter(({ stage }) => this.activeTab === 'games' || this.activeTab === stage.id);
    },
    currentStageIndex() {
      const index = this.encounter.stages.findIndex((stage) => !clubStageComplete(stage));
      return index < 0 ? 2 : index;
    },
    clubs() {
      return [this.game.team_1, this.game.team_2].map((title) =>
        this.tournament.teams?.find((club) => club.title === title),
      );
    },
    encounter() {
      if (this.clubs.some((club) => !club)) return null;
      if (this.game.clubEncounter) return this.game.clubEncounter;
      try {
        return createClubEncounter(this.clubs, this.tournament.preferences.clubRosterSize, this.phase);
      } catch {
        return null;
      }
    },
    editable() {
      return (
        !this.readOnly &&
        !!this.user &&
        this.isOwnerOrAdmin &&
        this.locator &&
        canEditClubGame(this.tournament, this.locator)
      );
    },
    winner() {
      return this.clubs.find((club) => String(club?.clubId) === this.encounter.winnerClubId);
    },
    canContinue() {
      return (
        this.editable &&
        this.encounter.phase === CLUB_PHASE.PLAYOFF &&
        this.encounter.status === CLUB_STATUS.COMPLETED &&
        !this.encounter.stages.every(clubStageComplete)
      );
    },
  },
  methods: {
    ...mapActions(useMainStore, ['changeClubCompetition']),
    stagePoints: clubStagePoints,
    captain(club) {
      return club.players.find((player) => String(player.id) === String(club.captainId));
    },
    playersFor(ids, club) {
      return (ids || []).map((id) => club.players.find((player) => String(player.id) === String(id))).filter(Boolean);
    },
    completedGames(stage) {
      return stage.games.filter((game) => game.status === CLUB_STATUS.COMPLETED).length;
    },
    individualGame(match) {
      return {
        team_1: this.playerNames(match.players1, this.clubs[0], '\n') || this.$t('club.awaitingLineups'),
        team_2: this.playerNames(match.players2, this.clubs[1], '\n') || this.$t('club.awaitingLineups'),
        team_1_score: match.score1,
        team_2_score: match.score2,
        status:
          match.status === CLUB_STATUS.COMPLETED
            ? 'finished'
            : match.status === CLUB_STATUS.ACTIVE
              ? 'in_progress'
              : 'not_started',
      };
    },
    openStage(index) {
      this.activeTab = CLUB_STAGES[index].id;
    },
    available(stageIndex) {
      return this.encounter.stages.slice(0, stageIndex).every(clubStageComplete);
    },
    playerNames(ids, club, separator = ', ') {
      return this.playersFor(ids, club)
        .map((player) => `${player.surname} ${player.name}`)
        .join(separator);
    },
    positionLabel(stageIndex, index) {
      return `№${index + 1} · ${this.$t(index === 0 ? (stageIndex === 0 ? 'club.femaleSingle' : 'club.mixed') : `club.stages.${CLUB_STAGES[stageIndex].id}`)}`;
    },
    editLineups(stageIndex) {
      this.openStage(stageIndex);
      this.editingStage = stageIndex;
      this.error = '';
      this.lineups = [1, 2].map((side) =>
        this.encounter.stages[stageIndex].games.map((game) =>
          Array.from({ length: CLUB_STAGES[stageIndex].size }, (_, index) => game[`players${side}`]?.[index] || ''),
        ),
      );
    },
    unavailablePlayer(player, side, positionIndex, playerIndex) {
      return this.lineups[side].some((position, i) =>
        position.some((id, j) => (i !== positionIndex || j !== playerIndex) && id === String(player.id)),
      );
    },
    async publish(stageIndex) {
      if (
        await this.perform({
          type: CLUB_COMMAND.LINEUPS,
          stageIndex,
          positions1: this.lineups[0],
          positions2: this.lineups[1],
        })
      )
        this.editingStage = null;
    },
    isScoreEditing(stageIndex, gameIndex) {
      const stage = this.encounter.stages[stageIndex];
      const match = stage.games[gameIndex];
      return (
        this.editable &&
        this.activeTab === stage.id &&
        stage.started &&
        match.status !== CLUB_STATUS.NOT_PLAYED &&
        (match.status !== CLUB_STATUS.COMPLETED || this.editingResult === `${stageIndex}-${gameIndex}`)
      );
    },
    hasScoreChanges(stageIndex, gameIndex) {
      const match = this.encounter.stages[stageIndex].games[gameIndex];
      return [0, 1].some((side) => this.draftScore(stageIndex, gameIndex, side) !== (match[`score${side + 1}`] ?? 0));
    },
    canSaveScore(stageIndex, gameIndex, complete) {
      const match = this.encounter.stages[stageIndex].games[gameIndex];
      if (
        !validClubScore(this.draftScore(stageIndex, gameIndex, 0), this.draftScore(stageIndex, gameIndex, 1), complete)
      )
        return false;
      if (complete && match.status !== CLUB_STATUS.COMPLETED) return true;
      return this.hasScoreChanges(stageIndex, gameIndex) && (complete || match.status !== CLUB_STATUS.COMPLETED);
    },
    cancelScoreEdit(stageIndex, gameIndex) {
      [0, 1].forEach((side) => {
        delete this.scoreDrafts[`${stageIndex}-${gameIndex}-${side}`];
      });
      delete this.scoreErrors[`${stageIndex}-${gameIndex}`];
      this.editingResult = null;
    },
    draftScore(stageIndex, gameIndex, side) {
      const key = `${stageIndex}-${gameIndex}-${side}`;
      const draft = this.scoreDrafts[key];
      return draft !== undefined
        ? draft
        : (this.encounter.stages[stageIndex].games[gameIndex][`score${side + 1}`] ?? 0);
    },
    setScore(stageIndex, gameIndex, side, value) {
      this.scoreDrafts[`${stageIndex}-${gameIndex}-${side}`] = value === '' ? null : Number(value);
      delete this.scoreErrors[`${stageIndex}-${gameIndex}`];
    },
    async saveScore(stageIndex, gameIndex, complete) {
      if (!this.canSaveScore(stageIndex, gameIndex, complete)) return;
      const command = {
        type: CLUB_COMMAND.SCORE,
        stageIndex,
        gameIndex,
        complete,
        score1: this.draftScore(stageIndex, gameIndex, 0),
        score2: this.draftScore(stageIndex, gameIndex, 1),
      };
      if (await this.perform(command)) {
        if (complete) this.editingResult = null;
        [0, 1].forEach((side) => {
          delete this.scoreDrafts[`${stageIndex}-${gameIndex}-${side}`];
        });
      }
    },
    async perform(command) {
      if (!this.editable || this.busy) return false;
      this.busy = true;
      const scoreKey = command.type === CLUB_COMMAND.SCORE ? `${command.stageIndex}-${command.gameIndex}` : null;
      if (scoreKey) delete this.scoreErrors[scoreKey];
      else this.error = '';
      try {
        await this.changeClubCompetition({ type: CLUB_CHANGE.MATCH, locator: this.locator, command });
        return true;
      } catch (error) {
        const message = this.$te(`club.errors.${error.code}`)
          ? this.$t(`club.errors.${error.code}`)
          : this.$t('messages.failedSaving');
        if (scoreKey) this.scoreErrors[scoreKey] = message;
        else this.error = message;
        return false;
      } finally {
        this.busy = false;
      }
    },
    formatTime(at) {
      return at ? new Date(at).toLocaleString(this.$i18n.locale === 'ua' ? 'uk' : this.$i18n.locale) : '';
    },
    auditLineups(positions) {
      return positions
        .map(
          (sides, i) => `№${i + 1}: ${sides.map((ids, side) => this.playerNames(ids, this.clubs[side])).join(' / ')}`,
        )
        .join('; ');
    },
  },
};
</script>

<style scoped>
.club-match__club {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.club-match__crest {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  padding: 7px;
  flex-shrink: 0;
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  background: var(--color-surface);
  color: var(--color-primary);
}

.club-match__crest img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.club-match__club .club-match__crest {
  width: 76px;
  height: 76px;
}

.club-match__players {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}

.club-match__players :deep(.player-chip) {
  text-align: left;
  padding: 0.3rem;
  gap: 0.3rem;
}

.club-match__players :deep(.player-chip__info) {
  flex-wrap: wrap;
  gap: 0.15rem;
}

.club-match__players :deep(.player-chip__name) {
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.25;
  font-size: 12px;
}

.club-match__players :deep(.player-chip__avatar) {
  width: 26px;
  height: 26px;
}

.club-match__roster-players {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
@media (max-width: 600px) {
  .club-match__players :deep(.player-chip) {
    flex-wrap: wrap;
    border-radius: 10px;
  }

  .club-match__players :deep(.player-chip__info) {
    flex: 1 1 50px;
  }

  .club-match__players :deep(.player-chip__name) {
    font-size: 11px;
  }

  .club-match__players :deep(.player-chip__sport-title) {
    margin-left: 0;
  }
}

.club-match {
  width: 100%;
  min-width: 0;
  margin-bottom: 1rem;
  color: var(--color-text);
}

.club-match__header {
  padding: 1rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-bottom: 0;
  border-radius: 12px 12px 0 0;
}

.club-match__meta {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  color: var(--color-text-muted);
  font-size: 12px;
}

.club-match__status {
  color: var(--color-primary);
  font-weight: 600;
}

.club-match__status--complete {
  color: var(--color-match-winner);
}

.club-match__scoreboard {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 1rem;
  margin: 0.75rem 0;
  text-align: center;
}

.club-match__scoreboard h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.club-match__scoreboard strong {
  display: block;
  font-size: 2rem;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.club-match__scoreboard small {
  display: block;
  margin-top: 0.25rem;
  color: var(--color-text-muted);
  font-size: 11px;
}

.club-match__winner,
.club-match__header-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.club-match__winner {
  color: var(--color-match-winner);
  font-weight: 600;
  font-size: 13px;
  margin: 0.5rem 0;
}

.club-match__header-actions:empty {
  display: none;
}

.club-match__panel {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-top: 0;
  border-radius: 0 0 12px 12px;
  background: var(--color-surface);
}

.club-encounter__stage + .club-encounter__stage {
  margin-top: 1.25rem;
}

.club-match__stage-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
}

.club-match__stage-heading h4 {
  flex: 1;
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.club-match__stage-heading > span {
  color: var(--color-text-muted);
  font-size: 12px;
}

.club-match__stage-heading > strong {
  min-width: 3rem;
  color: var(--color-primary);
  text-align: right;
}

.club-match__stage-link {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 0.25rem;
  padding: 0;
  border: 0;
  color: var(--color-text);
  background: none;
  font-size: 14px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.club-match__hint {
  margin: 0.5rem 0 0.75rem;
  color: var(--color-text-muted);
  font-size: 13px;
}

.club-match__clash {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin: 0.75rem 0 1.25rem;
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  background: linear-gradient(110deg, var(--color-primary-bg), var(--color-surface) 50%, var(--color-primary-bg));
}

.club-match__opponent {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.club-match__opponent strong {
  color: var(--color-text);
  font-size: 15px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.club-match__opponent--right {
  flex-direction: row-reverse;
  text-align: right;
}

.club-match__versus {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--color-border-light);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.club-match__game {
  margin-bottom: 0.75rem;
}

.club-match__game-meta {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  margin: 0 0.2rem 0.25rem;
  color: var(--color-text-muted);
  font-size: 11px;
}

.club-match__special {
  color: var(--color-primary);
  font-weight: 600;
}

.club-match :deep(.public-game-card) {
  margin-bottom: 0;
}

.club-match :deep(.match-team) {
  display: block;
  white-space: pre-line;
  -webkit-line-clamp: unset;
}

.club-match__edit {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0.35rem 0 0 auto;
  padding: 0.2rem;
  color: var(--color-text-muted);
  background: none;
  border: 0;
  font-size: 11px;
  cursor: pointer;
}

.club-match :deep(.club-match__card--editing) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.club-match__score-inputs {
  display: grid;
  grid-template-columns: auto auto auto;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.club-match__score-inputs .input {
  width: 54px;
  height: 46px;
  padding: 0.25rem;
  border: 1px solid var(--color-border-medium);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: center;
  font-size: 23px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  appearance: textfield;
}

.club-match__score-inputs .input::-webkit-inner-spin-button,
.club-match__score-inputs .input::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}

.club-match__score-inputs .input[aria-invalid='true'] {
  border-color: var(--color-error);
}

.club-match__score-separator {
  color: var(--color-text-muted);
  font-size: 20px;
}

.club-match__score-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border);
  border-top: 0;
  border-radius: 0 0 14px 14px;
  background: var(--color-surface);
}

.club-match__score-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.club-match__score-actions .button.is-small {
  min-height: 36px;
  border-radius: 8px;
}

.club-match__score-actions .button.is-light {
  background-color: var(--color-surface-alt);
  border-color: var(--color-border);
  color: var(--color-text);
}

.club-match__score-actions .button:disabled {
  background-color: var(--color-surface-alt);
  border-color: var(--color-border-light);
  color: var(--color-text-muted);
  opacity: 1;
}

.club-match__save-state {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-text-muted);
  font-size: 11px;
}

.club-match__score-error {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  flex-basis: 100%;
  margin: 0;
  color: var(--color-error);
  font-size: 12px;
}

.club-match__score-error svg {
  flex-shrink: 0;
}

.club-match__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.5rem 0;
}

.club-match .button {
  border-radius: 8px;
  gap: 0.3rem;
  white-space: normal;
  height: auto;
  min-height: 34px;
}

.club-match__lineups,
.club-match__rosters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
}

.club-match__lineups fieldset {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.club-match__lineups legend {
  padding: 0 0 0.5rem;
  font-size: 14px;
  font-weight: 700;
}

.club-match__position {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.65rem;
  margin-bottom: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.club-match__position strong {
  font-size: 12px;
  color: var(--color-text-muted);
}

.club-match__position label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.club-match__position label span {
  color: var(--color-text-muted);
  font-size: 11px;
  white-space: nowrap;
}

.club-match__position select {
  min-width: 0;
  height: 38px;
  font-size: 13px;
}

.club-match__roster {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.club-match__roster h4 {
  display: flex;
  justify-content: space-between;
  margin: 0 0 0.5rem;
  font-weight: 700;
}

.club-match__roster small {
  color: var(--color-text-muted);
  font-size: 11px;
}

.club-match__roster ol {
  margin: 0;
  padding: 0;
  list-style: none;
}

.club-match__roster li {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 13px;
}

.club-match__audit {
  margin-top: 1rem;
  font-size: 12px;
  color: var(--color-text-muted);
}

.club-match__audit summary {
  cursor: pointer;
}

.club-match__audit ol {
  padding-left: 1.25rem;
}

.club-match__error {
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--color-error);
  border-radius: 8px;
  color: var(--color-error);
}

.club-match--absence {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.club-match--absence > strong {
  margin-left: auto;
  white-space: nowrap;
}

.club-match--absence p {
  font-size: 12px;
  color: var(--color-text-muted);
}

.club-match :is(button, select, input, summary):focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
@media (max-width: 600px) {
  .club-match__clash {
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .club-match__opponent {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }

  .club-match__opponent strong {
    font-size: 12px;
  }

  .club-match__crest,
  .club-match__club .club-match__crest {
    width: 58px;
    height: 58px;
    padding: 6px;
    border-radius: 13px;
  }

  .club-match__header {
    padding: 0.75rem;
  }

  .club-match__scoreboard {
    gap: 0.5rem;
  }

  .club-match__scoreboard h3 {
    font-size: 14px;
  }

  .club-match__scoreboard strong {
    font-size: 26px;
  }

  .club-match__panel {
    padding: 0.75rem;
  }

  .club-match__lineups,
  .club-match__rosters {
    grid-template-columns: minmax(0, 1fr);
  }

  .club-match__meta {
    font-size: 11px;
  }

  .club-match :deep(.club-match__card--editing) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    padding: 36px 10px 12px;
  }

  .club-match :deep(.club-match__card--editing .match-team-right) {
    grid-column: 1;
    grid-row: 1;
  }

  .club-match :deep(.club-match__card--editing .match-team:not(.match-team-right)) {
    grid-column: 2;
    grid-row: 1;
  }

  .club-match :deep(.club-match__card--editing .match-vs) {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .club-match__score-inputs {
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  }

  .club-match__score-inputs .input {
    justify-self: center;
    width: 64px;
  }

  .club-match__game-meta {
    font-size: 10px;
  }
}
</style>
