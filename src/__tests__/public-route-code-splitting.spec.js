import { describe, expect, it, vi } from 'vitest';

vi.mock('@/firebase', () => ({ auth: {}, database: {} }));
vi.mock('@/stores/main', () => ({ useMainStore: vi.fn() }));
vi.mock('@/components/partials/ThemeSwitcher.vue', () => ({ default: {} }));
vi.mock('@/components/partials/LanguageSwitcher.vue', () => ({ default: {} }));

import PlayOff from '@/components/partials/PlayOff.vue';
import Results from '@/components/partials/Results.vue';
import TeamsList from '@/components/partials/TeamsList.vue';
import TirParticipantsList from '@/components/tir/TirParticipantsList.vue';
import TirPublicView from '@/components/tir/TirPublicView.vue';
import Public from '@/views/Public.vue';

function expectAsyncComponent(component) {
  expect(component?.__asyncLoader).toEqual(expect.any(Function));
}

describe('public route code splitting', () => {
  it('keeps inactive public tabs and tournament systems behind async boundaries', () => {
    [
      'Ranking',
      'Results',
      'TeamsList',
      'PlayOff',
      'DoubleElimination',
      'Bracket',
      'TeamPlayoff',
      'TirPublicView',
    ].forEach((name) => expectAsyncComponent(Public.components[name]));

    expect(Public.components.PublicGameCard.__asyncLoader).toBeUndefined();
    expect(Public.components.RoundTimer.__asyncLoader).toBeUndefined();
  });

  it('defers nested branches until their tab or interaction is active', () => {
    expectAsyncComponent(PlayOff.components.Bracket);
    expectAsyncComponent(PlayOff.components.DoubleElimination);
    expectAsyncComponent(Results.components.Bracket);
    expectAsyncComponent(Results.components.EditResultModal);
    expectAsyncComponent(TeamsList.components.ParticipantGames);
    expectAsyncComponent(TirParticipantsList.components.TirParticipantView);
    expectAsyncComponent(TirPublicView.components.TirPlayoffComparison);
    expectAsyncComponent(TirPublicView.components.TirProtocol);

    expect(TirPublicView.components.TirParticipantsList.__asyncLoader).toBeUndefined();
  });
});
