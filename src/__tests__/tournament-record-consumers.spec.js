import { describe, expect, it, vi } from 'vitest';

vi.mock('@/firebase', () => ({ auth: {}, database: {} }));
vi.mock('@/stores/main', () => ({ useMainStore: vi.fn() }));
vi.mock('@/components/partials/ThemeSwitcher.vue', () => ({ default: {} }));
vi.mock('@/components/partials/LanguageSwitcher.vue', () => ({ default: {} }));
vi.mock('@/components/Menu.vue', () => ({ default: {} }));
vi.mock('@/services/db', () => ({
  tournamentService: {
    getOne: vi.fn(),
    subscribe: vi.fn(),
    subscribePath: vi.fn(),
    updatePath: vi.fn(),
  },
}));

import Archived from '@/views/Archived.vue';
import Navbar from '@/components/Navbar.vue';
import Public from '@/views/Public.vue';
import TvDashboard from '@/views/TvDashboard.vue';
import { normalizeTournamentRecord } from '@/services/tournament-record';

const wrapper = normalizeTournamentRecord(
  {
    id: 'wrapper-1',
    name: 'Wrapper Cup',
    date: '2026-08-05',
    tournamentMessage: 'Wrapper message',
    portalIdTournament: '725',
    activeGroup: 'B',
    main: {
      system: 'swiss',
      teams: [{ title: 'A Team' }],
      games: [],
      preferences: {},
    },
    tournamentB: {
      system: 'playoff',
      teams: [{ title: 'B Team' }],
      games: [],
      preferences: {},
    },
  },
  { id: 'wrapper-1' },
);

const legacy = normalizeTournamentRecord(
  {
    id: 'legacy-1',
    name: 'Legacy Cup',
    date: '2025-06-07',
    tournamentMessage: 'Legacy message',
    system: 'groups',
    teams: [{ title: 'Legacy A' }],
    games: [],
    preferences: {},
    groupB: { teams: [{ title: 'Legacy B' }] },
  },
  { id: 'legacy-1' },
);

describe('tournament-record UI consumers', () => {
  it.each([
    ['wrapper', wrapper, 'A Team', 'B Team'],
    ['legacy', legacy, 'Legacy A', 'Legacy B'],
  ])('selects public A and B data for a %s record', (_label, tournament, aTeam, bTeam) => {
    expect(Public.computed.activeTournamentView.call({ tournament, publicActiveGroup: 'A' }).teams[0].title).toBe(
      aTeam,
    );
    expect(Public.computed.activeTournamentView.call({ tournament, publicActiveGroup: 'B' }).teams[0].title).toBe(
      bTeam,
    );
    expect(Public.computed.hasTournamentB.call({ tournament })).toBe(true);
  });

  it.each([
    ['wrapper', wrapper, 'Wrapper Cup', '2026-08-05', 'swiss', 'Wrapper message'],
    ['legacy', legacy, 'Legacy Cup', '2025-06-07', 'groups', 'Legacy message'],
  ])(
    'builds Navbar metadata and competition summaries for a %s record',
    (_label, record, name, date, system, message) => {
      const [item] = Navbar.computed.sortedTournaments.call({ tournaments: { [record.id]: record } });
      expect(item).toMatchObject({ id: record.id, name, date, system, teamsCount: 1 });

      const tvContext = { tournamentRecord: record };
      expect(TvDashboard.computed.tournament.call(tvContext).system).toBe(system);
      expect(TvDashboard.computed.tournamentMetadata.call(tvContext).tournamentMessage).toBe(message);
    },
  );

  it.each([
    ['wrapper', wrapper, 'Wrapper Cup', '2026-08-05', '725'],
    ['legacy', legacy, 'Legacy Cup', '2025-06-07', undefined],
  ])(
    'exposes archived metadata without competition-shape branching for a %s record',
    (_label, tournament, name, date, portalId) => {
      const tournamentMetadata = Archived.computed.tournamentMetadata.call({ tournament, activeKey: 'fallback' });
      expect(tournamentMetadata).toMatchObject({ name, date });
      expect(tournamentMetadata.portalIdTournament).toBe(portalId);
      expect(Archived.computed.activeTournament.call({ tournament }).teams).toHaveLength(1);
    },
  );
});
