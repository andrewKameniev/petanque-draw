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
import { CLUB_COMMAND, CLUB_PHASE } from '@/services/club-encounter';
import { clubAbsenceGame, CLUB_ABSENCE } from '@/services/club-encounter';

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
  it('shows all 11 games and both rosters without any gender entry or public editing', async () => {
    editor(true);
    expect(wrapper.findAll('[data-testid="club-game"]')).toHaveLength(11);
    expect(wrapper.text()).toContain('Жіночий тет-а-тет');
    expect(wrapper.text()).toContain('Мікст');
    expect(wrapper.findAll('input, select, .club-encounter__score-form')).toHaveLength(0);
    expect(wrapper.findAll('[role=tab]')).toHaveLength(5);
    await wrapper.findAll('[role=tab]')[4].trigger('click');
    expect(wrapper.text()).toContain('Surname7 Name7');
    expect(writes.update).not.toHaveBeenCalled();
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
    await first.findAll('input')[0].setValue(13);
    await first.findAll('input')[1].setValue(7);
    await first.find('button[type="button"]').trigger('click');
    await flushPromises();
    expect(store.activeTournament.games[0][0].clubEncounter.points).toEqual([0, 0]);
    await first.trigger('submit');
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
      await form.trigger('submit');
      await flushPromises();
    }
    expect(wrapper.text()).toContain('Переможець: Club a');
    expect(wrapper.text()).toContain('Не зіграно');
    await button('Продовжити ігри').trigger('click');
    await flushPromises();
    expect(wrapper.text()).not.toContain('Не зіграно');
    expect(store.activeTournament.playOffBracket.stages[0].teams[0].team_1_score).toBeNull();
  });
});
