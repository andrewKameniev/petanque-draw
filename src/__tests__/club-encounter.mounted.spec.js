// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import ua from '@/locales/ua';
import {
  makeClub,
  makeClubTournament,
  clubPositions,
  clubMatchAfterSingles,
} from '../../tests/fixtures/club-competition';
import { CLUB_CHANGE } from '@/services/club-competition';
import {
  CLUB_COMMAND,
  CLUB_PHASE,
  createClubEncounter,
  clubGameWithResult,
  applyClubEncounterCommand,
} from '@/services/club-encounter';
import { clubAbsenceGame, CLUB_ABSENCE } from '@/services/club-encounter';
import { beginClubStage } from '../../tests/fixtures/club-competition';

const writes = vi.hoisted(() => ({ update: vi.fn(() => Promise.resolve()) }));
const portal = vi.hoisted(() => ({ fetchTournament: vi.fn() }));
vi.mock('@/services/portal', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchPortalTournament: portal.fetchTournament,
}));
vi.mock('@/firebase', () => ({ auth: {}, database: {} }));
vi.mock('@/i18n', () => ({ default: { global: { t: (key) => key } } }));
vi.mock('@/services/db', () => ({ userMapService: {}, collaboratorService: {} }));
vi.mock('firebase/database', () => ({
  get: vi.fn(() => Promise.resolve({ exists: () => false })),
  getDatabase: vi.fn(() => 'database'),
  onValue: vi.fn(() => vi.fn()),
  ref: vi.fn((_database, path) => path),
  remove: vi.fn(() => Promise.resolve()),
  set: vi.fn(() => Promise.resolve()),
  update: (...args) => writes.update(...args),
}));
const { default: ClubEncounter } = await import('@/components/clubs/ClubEncounter.vue');
const { default: AddTeam } = await import('@/components/partials/AddTeam.vue');
const { default: ClubRosterSetup } = await import('@/components/clubs/ClubRosterSetup.vue');
const { default: Games } = await import('@/components/partials/Games.vue');
const { default: PlayOff } = await import('@/components/partials/PlayOff.vue');
const { useMainStore } = await import('@/stores/main');

describe('club forms and persistence', () => {
  let store;
  let pinia;
  let wrapper;
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useMainStore();
    store.user = { uid: 'organizer' };
    store.currentTournamentIndex = 'club-test';
    store.tournaments = { 'club-test': { id: 'club-test', activeGroup: 'A', main: makeClubTournament() } };
    writes.update.mockClear();
  });
  afterEach(() => {
    wrapper?.unmount();
    vi.restoreAllMocks();
  });
  const i18n = () => createI18n({ locale: 'ua', messages: { ua } });
  function editor(readOnly = false, phase = CLUB_PHASE.QUALIFICATION) {
    const Shell = defineComponent({
      components: { ClubEncounter },
      setup: () => ({ store, readOnly, phase }),
      template:
        '<ClubEncounter :game="store.activeTournament.games[0][0]" :tournament="store.activeTournament" :read-only="readOnly" :phase="phase" :locator="{ kind: \'round\', roundIndex: 0, gameIndex: 0 }" />',
    });
    wrapper = mount(Shell, { global: { plugins: [pinia, i18n()] } });
    return wrapper;
  }
  const button = (text) => wrapper.findAll('button').find((candidate) => candidate.text() === text);
  it.each([CLUB_ABSENCE.REST, CLUB_ABSENCE.WALKOVER])('renders %s without lineup or score controls', (kind) => {
    store.activeTournament.games[0][0] = clubAbsenceGame({ team_1: 'Club a', team_2: 'Technical' }, kind);
    editor();
    expect(wrapper.find('[data-testid="club-absence"]').exists()).toBe(true);
    expect(wrapper.findAll('button, input, select, [data-testid="club-game"]')).toHaveLength(0);
    expect(wrapper.text()).toContain(kind === CLUB_ABSENCE.REST ? 'Відпочинок' : '21 : 10');
    expect(writes.update).not.toHaveBeenCalled();
  });
  it('shows all 11 games in four focused tabs without public editing', () => {
    editor(true);
    expect(wrapper.findAll('[data-testid="club-game"]')).toHaveLength(11);
    expect(wrapper.text()).toContain('Жіночий тет-а-тет');
    expect(wrapper.text()).toContain('Мікст');
    expect(wrapper.findAll('input, select, .club-encounter__score-form')).toHaveLength(0);
    expect(wrapper.findAll('[role=tab]')).toHaveLength(4);
    expect(wrapper.findAll('[role=tab]').map((tab) => tab.text())).toEqual([
      'Огляд',
      'Тет-а-тети',
      'Дуплети',
      'Триплети',
    ]);
    expect(writes.update).not.toHaveBeenCalled();
  });
  it('confirms a completed singles score sheet together and unlocks doubles', async () => {
    const tournament = store.activeTournament;
    const singles = beginClubStage(
      createClubEncounter(tournament.teams, 8, CLUB_PHASE.QUALIFICATION),
      tournament.teams,
      0,
    );
    tournament.games[0][0] = clubGameWithResult(tournament.games[0][0], singles);
    editor();
    await wrapper.findAll('[role=tab]')[1].trigger('click');
    expect(button('Підтвердити результати етапу').element.disabled).toBe(true);
    for (const form of wrapper.findAll('.club-encounter__score-form')) {
      await form.findAll('input')[0].setValue(2);
      await form.findAll('input')[1].setValue(1);
    }
    expect(button('Підтвердити результати етапу').element.disabled).toBe(false);
    await button('Підтвердити результати етапу').trigger('click');
    await flushPromises();
    expect(writes.update).toHaveBeenCalledOnce();
    expect(tournament.games[0][0].clubEncounter.stages[0].games.every((game) => game.status === 'completed')).toBe(
      true,
    );
    expect(tournament.games[0][0].clubEncounter.points).toEqual([12, 0]);
    await wrapper.findAll('[role=tab]')[2].trigger('click');
    expect(button('Внести бланки капітанів').exists()).toBe(true);
  });
  it('enters paper positions, starts singles and separates live scores from confirmed points', async () => {
    editor();
    await wrapper.findAll('[role=tab]')[1].trigger('click');
    expect(
      wrapper.findAll('button').filter((candidate) => candidate.text() === 'Внести бланки капітанів'),
    ).toHaveLength(1);
    await button('Внести бланки капітанів').trigger('click');
    const fields = wrapper.get('.club-encounter__form').findAll('select');
    expect(fields).toHaveLength(12);
    for (let i = 0; i < 12; i++) await fields[i].setValue(`${i < 6 ? 'a' : 'b'}-${i % 6}`);
    await wrapper.get('.club-encounter__form').trigger('submit');
    await flushPromises();
    expect(store.activeTournament.games[0][0].clubEncounter.stages[0].published).toBe(true);
    expect(wrapper.find('.club-encounter__form').exists()).toBe(false);
    await button('Почати етап').trigger('click');
    await flushPromises();
    const first = wrapper.findAll('.club-encounter__score-form')[0];
    await first.findAll('input')[0].setValue(2);
    await first.findAll('input')[1].setValue(1);
    await first.trigger('submit');
    await flushPromises();
    expect(store.activeTournament.games[0][0].clubEncounter.points).toEqual([0, 0]);
    expect(first.get('button[type="submit"]').element.disabled).toBe(true);
    await first.get('button[type="button"]').trigger('click');
    await flushPromises();
    expect(store.activeTournament.games[0][0].clubEncounter.points).toEqual([2, 0]);
    expect(store.activeTournament.games[0][0].team_1_score).toBeNull();
    expect(wrapper.text()).toContain('Surname0 Name0');
    expect(writes.update.mock.calls.at(-1)[1]).toHaveProperty('organizer/tournaments/club-test/main/games/0/0');
    expect(
      writes.update.mock.calls.at(-1)[1]['publicTournaments/organizer/club-test/record/main/games/0/0'].clubEncounter
        .audit,
    ).toBeUndefined();
  });
  it('saves live scores with Enter and only enables finishing at a valid final score', async () => {
    store.activeTournament.games[0][0] = clubMatchAfterSingles(store.activeTournament);
    editor();
    await wrapper.findAll('[role=tab]')[2].trigger('click');
    const form = wrapper.findAll('.club-encounter__score-form')[0];
    const [left, right] = form.findAll('input');
    const save = form.get('button[type="submit"]');
    const finish = form.get('button[type="button"]');
    expect(save.element.disabled).toBe(true);
    expect(finish.element.disabled).toBe(true);
    await left.setValue(5);
    await right.setValue(3);
    expect(save.element.disabled).toBe(false);
    expect(finish.element.disabled).toBe(false);
    await form.trigger('submit');
    await flushPromises();
    const encounter = () => store.activeTournament.games[0][0].clubEncounter;
    expect(encounter().stages[1].games[0]).toMatchObject({ score1: 5, score2: 3, status: 'in_progress' });
    expect(encounter().points).toEqual([12, 0]);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(form.text()).toContain('Збережено');
    for (const [s1, s2] of [
      [13, 13],
      [14, 3],
      [2.5, 3],
      ['', 3],
      [-1, 3],
    ]) {
      await left.setValue(s1);
      await right.setValue(s2);
      expect(finish.element.disabled).toBe(true);
    }
    await left.setValue(5);
    await right.setValue(3);
    expect(finish.element.disabled).toBe(false);
    await finish.trigger('click');
    await flushPromises();
    expect(encounter().points).toEqual([15, 0]);
    const completed = wrapper.findAll('[data-testid="club-game"]')[0];
    expect(completed.find('input').exists()).toBe(false);
    await completed.get('button').trigger('click');
    const correction = wrapper.findAll('.club-encounter__score-form')[0];
    await correction.findAll('input')[0].setValue(3);
    await correction.findAll('input')[1].setValue(5);
    await correction.get('button[type="button"]').trigger('click');
    await wrapper.findAll('[data-testid="club-game"]')[0].get('button').trigger('click');
    const reopened = wrapper.findAll('.club-encounter__score-form')[0];
    expect(reopened.findAll('input').map((input) => input.element.value)).toEqual(['5', '3']);
    await reopened.findAll('input')[0].setValue(3);
    await reopened.findAll('input')[1].setValue(5);
    await reopened.trigger('submit');
    await flushPromises();
    expect(encounter().points).toEqual([12, 3]);
  });
  it('keeps drafts and shows a failed save beside only the affected game', async () => {
    store.activeTournament.games[0][0] = clubMatchAfterSingles(store.activeTournament);
    editor();
    await wrapper.findAll('[role=tab]')[2].trigger('click');
    const before = JSON.parse(JSON.stringify(store.activeTournament));
    const form = wrapper.findAll('.club-encounter__score-form')[0];
    await form.findAll('input')[0].setValue(5);
    await form.findAll('input')[1].setValue(3);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    writes.update.mockRejectedValueOnce(new Error('offline'));
    await form.trigger('submit');
    await flushPromises();
    expect(store.activeTournament).toEqual(before);
    expect(form.findAll('input').map((input) => input.element.value)).toEqual(['5', '3']);
    expect(form.get('[role="alert"]').text()).toBe(ua.messages.failedSaving);
    expect(wrapper.find('.club-match__error').exists()).toBe(false);
    expect(wrapper.findAll('.club-encounter__score-form')[1].find('[role="alert"]').exists()).toBe(false);
    expect(form.findAll('input')[0].attributes('aria-describedby')).toBe(form.get('[role="alert"]').attributes('id'));
    await form.trigger('submit');
    await flushPromises();
    expect(form.find('[role="alert"]').exists()).toBe(false);
    expect(form.text()).toContain('Збережено');
  });
  it.each(['legacy', 'envelope'])('writes and rolls back a %s match on persistence failure', async (format) => {
    if (format === 'legacy') store.tournaments['club-test'] = { id: 'club-test', ...makeClubTournament() };
    const before = JSON.parse(JSON.stringify(store.activeTournament));
    const command = {
      type: CLUB_COMMAND.LINEUPS,
      stageIndex: 0,
      positions1: clubPositions(before.teams[0], 0),
      positions2: clubPositions(before.teams[1], 0),
    };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    writes.update.mockRejectedValueOnce(new Error('offline'));
    await expect(
      store.changeClubCompetition({
        type: CLUB_CHANGE.MATCH,
        locator: { kind: 'round', roundIndex: 0, gameIndex: 0 },
        command,
      }),
    ).rejects.toThrow('offline');
    expect(store.activeTournament).toEqual(before);
    expect(store._clubSavePending).toBe(false);
    expect(writes.update.mock.calls[0][1]).toHaveProperty(
      `organizer/tournaments/club-test/${format === 'envelope' ? 'main/' : ''}games/0/0`,
    );
  });
  it('keeps failed forms visible with a localized message and blocks scorer access', async () => {
    editor();
    await wrapper.findAll('[role=tab]')[1].trigger('click');
    await button('Внести бланки капітанів').trigger('click');
    await wrapper.get('.club-encounter__form').trigger('submit');
    await flushPromises();
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(wrapper.find('.club-encounter__form').exists()).toBe(true);
    store.tournaments['club-test']._ownerUid = 'owner';
    store.userTournamentMap = { 'club-test': { role: 'scorer' } };
    await expect(store.changeClubCompetition({ type: CLUB_CHANGE.CONFIGURE, rosterSize: 9 })).rejects.toThrow('access');
    expect(writes.update).not.toHaveBeenCalled();
  });
  it('prevents old team controls from changing the fixed club roster', () => {
    expect(() => store.addTeamToStore({ title: 'Other' })).toThrow('locked');
    expect(() => store.removeTeam('Club a')).toThrow('locked');
    expect(() => store.clearTeams()).toThrow('locked');
    expect(() => store.updateGameScore({ activeRound: 0, gameIndex: 0, team: 'team_1_score', score: 13 })).toThrow(
      'locked',
    );
    wrapper = mount(ClubRosterSetup, {
      props: { tournament: store.activeTournament, allowRegistration: true },
      global: { plugins: [pinia, i18n()] },
    });
    expect(wrapper.findAll('input, select, button')).toHaveLength(0);
    expect(wrapper.text()).not.toContain('Стать');
  });
  it('uses the normal portal ID form to detect a club event, retain media and import a seven-player roster', async () => {
    store.activeTournament.games = [];
    store.activeTournament.teams = [];
    delete store.activeTournament.preferences.clubRosterSize;
    const players = makeClub('c', 7).players;
    Object.assign(players[0], {
      avatar_url: 'https://example.com/avatar.jpg',
      club_logo_url: 'https://example.com/logo.png',
      rating_place: 12,
      sport_title: 'candidate',
    });
    const exported = {
      tournament: { name: 'Club event', start_date: '2026-10-08' },
      teams: [{ id: 'portal-c', name: 'Captain', players }],
    };
    portal.fetchTournament.mockResolvedValueOnce(exported);
    wrapper = mount(AddTeam, { global: { plugins: [pinia, i18n()] } });
    await wrapper.get('[data-testid="input-portal-id"]').setValue('691');
    await wrapper.get('[data-testid="btn-import-portal"]').trigger('click');
    await flushPromises();
    expect(portal.fetchTournament).toHaveBeenCalledWith('691');
    const pending = wrapper.emitted('club-import')[0][0];
    expect(store.activeTournament.teams).toHaveLength(0);
    wrapper.unmount();
    wrapper = mount(ClubRosterSetup, {
      props: { tournament: store.activeTournament, portalImport: pending },
      global: { plugins: [pinia, i18n()] },
    });
    expect(wrapper.findAll('.player-chip')).toHaveLength(7);
    expect(wrapper.get('.player-chip__avatar').attributes('src')).toBe(players[0].avatar_url);
    expect(wrapper.get('.club-rosters__logo').attributes('src')).toBe(players[0].club_logo_url);
    expect(wrapper.text()).not.toContain('Бракує');
    expect(wrapper.text()).not.toContain('Змінити капітана');
    expect(wrapper.findAll('select')).toHaveLength(1);
    await button('Імпортувати клуби (1)').trigger('click');
    await flushPromises();
    expect(store.activeTournament.teams[0]).toMatchObject({
      title: 'Club c',
      captainId: 'c-0',
      portalTeamId: 'portal-c',
    });
    expect(store.activeTournament.teams[0].players).toHaveLength(7);
    expect(store.currentTournament.portalIdTournament).toBe('691');
    expect(wrapper.emitted('imported')).toHaveLength(1);
  });
  it('keeps the portal captain when reducing an imported roster to eight players', async () => {
    store.activeTournament.games = [];
    store.activeTournament.teams = [];
    delete store.activeTournament.preferences.clubRosterSize;
    const players = makeClub('c', 9).players;
    wrapper = mount(ClubRosterSetup, {
      props: {
        tournament: store.activeTournament,
        portalImport: { portalId: '691', teams: [{ id: 'portal-c', players }] },
      },
      global: { plugins: [pinia, i18n()] },
    });
    await wrapper.get('select').setValue('8');
    const rows = wrapper.findAll('.club-rosters__player');
    expect(rows[0].find('button').exists()).toBe(false);
    await rows[1].get('button').trigger('click');
    await button('Імпортувати клуби (1)').trigger('click');
    await flushPromises();
    const imported = store.activeTournament.teams[0];
    expect(imported.captainId).toBe(players[0].id);
    expect(imported.players).toHaveLength(8);
    expect(imported.players.some((player) => player.id === players[0].id)).toBe(true);
    expect(imported.players.some((player) => player.id === players[1].id)).toBe(false);
  });
  it('retains a final encounter for correction and clears its players when returning to semifinals', () => {
    const tournament = store.activeTournament;
    const game = clubMatchAfterSingles(tournament, CLUB_PHASE.PLAYOFF);
    tournament.playOffStage = 0;
    tournament.playOffBracket = {
      stages: [
        { stageLabel: 2, teams: [] },
        { stageLabel: 1, teams: [game] },
      ],
    };
    const context = {
      tournament,
      setPlayOffBracket: (bracket) => {
        tournament.playOffBracket = bracket;
      },
      setPlayOffStage: (stage) => {
        tournament.playOffStage = stage;
      },
    };
    Games.methods.restorePlayoffStage.call(context);
    expect(tournament.playOffStage).toBe(1);
    expect(tournament.playOffBracket.stages[1].teams[0]).toEqual(game);
    Games.methods.restorePlayoffStage.call(context);
    expect(tournament.playOffStage).toBe(2);
    const cleared = tournament.playOffBracket.stages[1].teams[0];
    expect(cleared.team_1).toBeNull();
    expect(cleared.team_2).toBeNull();
    expect(cleared.clubEncounter).toBeUndefined();
  });
  it('shows the automatic playoff result and provides continuation', async () => {
    store.activeTournament.games[0][0] = clubMatchAfterSingles(store.activeTournament, CLUB_PHASE.PLAYOFF);
    const game = store.activeTournament.games[0][0];
    store.activeTournament.playOffStage = 1;
    store.activeTournament.playOffBracket = { stages: [{ stageLabel: 1, teams: [game] }] };
    const Shell = defineComponent({
      components: { ClubEncounter },
      setup: () => ({ store }),
      template:
        '<ClubEncounter :game="store.activeTournament.playOffBracket.stages[0].teams[0]" :tournament="store.activeTournament" :read-only="false" :locator="{ kind: \'playoff\', stageIndex: 0, gameIndex: 0 }" />',
    });
    wrapper = mount(Shell, { global: { plugins: [pinia, i18n()] } });
    await wrapper.findAll('[role=tab]')[2].trigger('click');
    for (let index = 0; index < 2; index++) {
      const form = wrapper.findAll('.club-encounter__score-form')[0];
      await form.findAll('input')[0].setValue(13);
      await form.findAll('input')[1].setValue(7);
      await form.get('button[type="button"]').trigger('click');
      await flushPromises();
    }
    expect(wrapper.text()).toContain('Переможець: Club a');
    expect(store.activeTournament.playOffBracket.stages[0].teams[0].clubEncounter.stages[1].games[2].status).toBe(
      'not_played',
    );
    expect(wrapper.findAll('[data-testid="club-game"]')[2].find('.match-item--upcoming').exists()).toBe(true);
    await button('Продовжити ігри').trigger('click');
    await flushPromises();
    expect(store.activeTournament.playOffBracket.stages[0].teams[0].clubEncounter.stages[1].games[2].status).toBe(
      'in_progress',
    );
    expect(store.activeTournament.playOffBracket.stages[0].teams[0].team_1_score).toBeNull();
  });
  it('offers playoff advancement only after both club encounters are complete', async () => {
    const tournament = store.activeTournament;
    tournament.teams.push(makeClub('c'), makeClub('d'));
    const first = clubMatchAfterSingles({ ...tournament, teams: tournament.teams.slice(0, 2) }, CLUB_PHASE.PLAYOFF);
    const secondSource = {
      ...tournament,
      teams: tournament.teams.slice(2),
      games: [[{ team_1: 'Club c', team_2: 'Club d', status: 'not_started' }]],
    };
    const second = clubMatchAfterSingles(secondSource, CLUB_PHASE.PLAYOFF);
    tournament.playOff = [first, second];
    tournament.playOffStage = 2;
    tournament.playOffBracket = {
      stages: [
        { stageLabel: 2, teamsCount: 4, teams: [first, second] },
        { stageLabel: 1, teamsCount: 2, teams: [{ team_1: null, team_2: null }] },
      ],
    };
    wrapper = mount(PlayOff, {
      props: { activeTournament: tournament },
      global: { plugins: [pinia, i18n()], stubs: { Game: true } },
    });
    expect(wrapper.find('[data-testid="btn-save-playoff"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('Завершіть клубні зустрічі');

    for (const [index, source] of [first, second].entries()) {
      let encounter = source.clubEncounter;
      for (let gameIndex = 0; gameIndex < 2; gameIndex++)
        encounter = applyClubEncounterCommand(encounter, tournament.teams.slice(index * 2, index * 2 + 2), {
          type: CLUB_COMMAND.SCORE,
          stageIndex: 1,
          gameIndex,
          score1: 13,
          score2: 7,
          complete: true,
        });
      tournament.playOffBracket.stages[0].teams[index] = clubGameWithResult(source, encounter);
    }
    await flushPromises();
    expect(wrapper.get('[data-testid="btn-save-playoff"]').text()).toContain('Перейти до наступного раунду');
    await wrapper.get('[data-testid="btn-save-playoff"]').trigger('click');
    await flushPromises();
    expect(tournament.playOffStage).toBe(1);
    expect(tournament.playOffBracket.stages[1].teams[0].team_1).toBe('Club a');
    expect(tournament.playOffBracket.stages[1].teams[0].team_2).toBe('Club c');
  });
});
