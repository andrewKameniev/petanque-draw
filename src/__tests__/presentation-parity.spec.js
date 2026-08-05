import { describe, expect, it, vi } from 'vitest';

vi.mock('@/firebase', () => ({ auth: {}, database: {} }));
vi.mock('@/stores/main', () => ({ useMainStore: vi.fn() }));
vi.mock('@/components/partials/ThemeSwitcher.vue', () => ({ default: {} }));
vi.mock('@/components/partials/LanguageSwitcher.vue', () => ({ default: {} }));
vi.mock('@/components/Menu.vue', () => ({ default: {} }));
vi.mock('@/services/db', () => ({
  tournamentService: { getOne: vi.fn(), subscribe: vi.fn(), subscribePath: vi.fn(), updatePath: vi.fn() },
}));

import Public from '@/views/Public.vue';
import Archived from '@/views/Archived.vue';
import { normalizeTournamentRecord } from '@/services/tournament-record';

const $t = (key) => key;
const $i18n = { locale: 'en' };

function makeFixture(overrides = {}) {
  return normalizeTournamentRecord(
    {
      id: 'parity-1',
      name: 'Parity Cup',
      date: '2026-08-01',
      tournamentMessage: 'Line 1\nLine 2\n\nLine 3',
      main: {
        system: 'swiss',
        teams: [{ title: 'A' }, { title: 'B' }],
        games: [[{ team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 7, status: 'finished' }]],
        preferences: {
          maxScore: 13,
          timeLimitEnabled: true,
          timeLimit: 45,
          playoffTimeLimit: 70,
          playOffEnabled: true,
          cochonettesEnabled: true,
          cochonettes: 2,
          noTimeLimitFinale: false,
          swissRoundsCount: 5,
        },
        cadrage: [{ id: 1 }, { id: 2 }],
        playOff: [{ teams: [{}, {}] }, { teams: [{}, {}] }],
        roundIsActive: false,
        tournamentIsFinished: false,
        tournamentIsStarted: true,
      },
    },
    { id: 'parity-1' },
  );
}

describe('Public/Archived presentation parity', () => {
  const tournament = makeFixture();

  const publicContext = {
    tournament,
    publicActiveGroup: 'A',
    $t,
    $i18n,
  };

  function callPublicComputed(name) {
    const computed = Public.computed[name];
    const ctx = { ...publicContext };
    if (computed.call) {
      Object.keys(Public.computed).forEach((key) => {
        if (key !== name && Public.computed[key]) {
          Object.defineProperty(ctx, key, { get: () => Public.computed[key].call(ctx) });
        }
      });
      return computed.call(ctx);
    }
    return undefined;
  }

  function callArchivedComputed(name) {
    const computed = Archived.computed[name];
    const ctx = {
      tournament,
      activeKey: 'parity-1',
      $t,
      $i18n,
    };
    Object.keys(Archived.computed).forEach((key) => {
      if (key !== name && Archived.computed[key]) {
        Object.defineProperty(ctx, key, { get: () => Archived.computed[key].call(ctx) });
      }
    });
    return computed.call(ctx);
  }

  it('activeRound matches', () => {
    expect(callPublicComputed('activeRound')).toBe(callArchivedComputed('activeRound'));
  });

  it('isFinished matches', () => {
    expect(callPublicComputed('isFinished')).toBe(callArchivedComputed('isFinished'));
  });

  it('badgeClass matches', () => {
    expect(callPublicComputed('badgeClass')).toBe(callArchivedComputed('badgeClass'));
  });

  it('tournamentMessageLines matches', () => {
    expect(callPublicComputed('tournamentMessageLines')).toEqual(callArchivedComputed('tournamentMessageLines'));
  });

  it('cadrageRange matches', () => {
    expect(callPublicComputed('cadrageRange')).toBe(callArchivedComputed('cadrageRange'));
  });

  it('isInPlayoff matches', () => {
    expect(callPublicComputed('isInPlayoff')).toBe(callArchivedComputed('isInPlayoff'));
  });

  it('isFinale matches', () => {
    expect(callPublicComputed('isFinale')).toBe(callArchivedComputed('isFinale'));
  });

  it('tournamentExtrasLine matches', () => {
    expect(callPublicComputed('tournamentExtrasLine')).toBe(callArchivedComputed('tournamentExtrasLine'));
  });
});
