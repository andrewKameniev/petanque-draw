import { describe, expect, it, vi } from 'vitest';

vi.mock('@/stores/main', () => ({ useMainStore: vi.fn() }));

import TirModule from '@/components/tir/TirModule.vue';
import TirPublicView from '@/components/tir/TirPublicView.vue';
import TirPublicDetails from '@/components/tir/TirPublicDetails.vue';
import TirPublicResults from '@/components/tir/TirPublicResults.vue';
import TirProtocol from '@/components/tir/TirProtocol.vue';
import TrainingSession from '@/components/training/TrainingSession.vue';
import { getScoreTotal, rankParticipants, SCORING, RESULT_OPTIONS } from '@/services/tir';

const participants = [
  { id: 'C', name: 'C', scores: { 0: { 6: 'reussi', 7: 'touche', 8: 'touche', 9: 'touche' } } },
  { id: 'A', name: 'A', scores: { 0: { 6: 'reussi', 7: 'reussi' } } },
  { id: 'B', name: 'B', scores: { 0: { 6: 'carreau', 7: 'touche' } } },
];

describe('admin/public/protocol tir domain consistency', () => {
  it('uses the same production ranking order in every one-round view', () => {
    const expected = rankParticipants(participants, 'scores').map((participant) => participant.name);

    const admin = TirModule.computed.rankedParticipants.call({
      tirParticipants: participants,
      activeScoresKey: 'scores',
    });
    const publicView = TirPublicView.computed.rankedParticipants.call({
      activeBracket: 'r1',
      scoringParticipants: participants,
      activeScoresKey: 'scores',
    });
    const publicDetails = TirPublicDetails.computed.rankedParticipants.call({ participants });
    const publicResults = TirPublicResults.computed.rankedParticipants.call({ participants });
    const protocol = TirProtocol.computed.qualificationRankedParticipants.call({
      isTwoRound: false,
      participants,
      tiebreakerCount: 0,
    });

    [admin, publicView, publicDetails, publicResults, protocol].forEach((ranked) => {
      expect(ranked.map((participant) => participant.name)).toEqual(expected);
    });
    expect(expected).toEqual(['B', 'A', 'C']);
  });

  it('TrainingSession reuses shared scoring constants from tir service without local copies', () => {
    const session = { config: { exercises: [0], distances: [6, 7], attempts: 2 } };
    const data = TrainingSession.data.call({ session });
    expect(data.resultOptions).toBe(RESULT_OPTIONS);

    const ctx = { session: { ...session, attempts: [{ score: 'carreau', exercise: 0, distance: 6 }] } };
    const totalScore = TrainingSession.computed.totalScore.call(ctx);
    expect(totalScore).toBe(SCORING.carreau);
  });

  it('uses the shared score total in admin, public, and protocol adapters', () => {
    const participant = participants[0];
    const expected = getScoreTotal(participant, 'scores');

    expect(TirModule.methods.getParticipantTotal.call({ activeScoresKey: 'scores' }, participant)).toBe(expected);
    expect(
      TirPublicView.methods.getTotal.call(
        {
          activeBracket: 'r1',
          activeScoresKey: 'scores',
        },
        participant,
      ),
    ).toBe(expected);
    expect(TirPublicDetails.methods.getTotal.call({}, participant)).toBe(expected);
    expect(TirPublicResults.methods.getTotal.call({}, participant)).toBe(expected);
    expect(TirProtocol.methods.getR1Score.call({}, participant)).toBe(expected);
  });
});
