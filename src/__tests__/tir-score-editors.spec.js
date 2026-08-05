import { describe, expect, it, vi } from 'vitest';

vi.mock('@/stores/main', () => ({ useMainStore: vi.fn() }));

import TirParticipantView from '@/components/tir/TirParticipantView.vue';
import TirAtelierView from '@/components/tir/TirAtelierView.vue';
import TirPlayoffMatch from '@/components/tir/TirPlayoffMatch.vue';
import TirModule from '@/components/tir/TirModule.vue';
import { createMatch } from '@/services/tir';

describe('tir score editor ownership', () => {
  it('TirParticipantView emits an updated participant without mutating its prop', () => {
    const participant = { id: 'A', scores: { 0: { 6: 'reussi' } } };
    const emit = vi.fn();
    const context = {
      participant,
      scoresKey: 'scores',
      activeAtelierIndex: 0,
      readOnly: false,
      scoring: { carreau: 5 },
      distances: [6, 7, 8, 9],
      ateliers: Array.from({ length: 5 }),
      totalThrows: 20,
      lastSaved: null,
      $t: (key) => key,
      $emit: emit,
    };

    TirParticipantView.methods.setScore.call(context, 6, 'carreau');

    expect(participant.scores[0][6]).toBe('reussi');
    expect(emit).toHaveBeenCalledOnce();
    expect(emit.mock.calls[0][0]).toBe('update');
    expect(emit.mock.calls[0][1].scores[0][6]).toBe('carreau');
  });

  it('TirAtelierView emits one participant copy for an inline score edit', () => {
    const participant = { id: 'A', scores: {} };
    const emit = vi.fn();

    TirAtelierView.methods.setScore.call(
      {
        readOnly: false,
        scoresKey: 'scores',
        atelierIndex: 2,
        $emit: emit,
      },
      participant,
      8,
      'touche',
    );

    expect(participant).toEqual({ id: 'A', scores: {} });
    expect(emit).toHaveBeenCalledWith('update', {
      id: 'A',
      scores: { 2: { 8: 'touche' } },
    });
  });

  it('TirAtelierView fills missing throws by emitting participant copies', () => {
    const participants = [{ id: 'A', scores: { 0: { 6: 'carreau' } } }, { id: 'B' }];
    const emit = vi.fn();
    const context = {
      participants,
      scoresKey: 'scores',
      atelierIndex: 0,
      distances: [6, 7],
      showFinishConfirm: true,
      $emit: emit,
    };

    TirAtelierView.methods.confirmFinish.call(context);

    expect(participants).toEqual([{ id: 'A', scores: { 0: { 6: 'carreau' } } }, { id: 'B' }]);
    expect(emit.mock.calls[0][0]).toBe('update');
    expect(emit.mock.calls[0][1][1].scores[0]).toEqual({ 6: 'manque', 7: 'manque' });
    expect(emit).toHaveBeenLastCalledWith('finish');
  });

  it('TirPlayoffMatch emits a recalculated match without mutating its prop', () => {
    const match = createMatch('A', 'B');
    const emit = vi.fn();

    TirPlayoffMatch.methods.setScore.call(
      {
        match,
        readOnly: false,
        totalThrows: 20,
        $emit: emit,
      },
      1,
      0,
      6,
      'carreau',
    );

    expect(match).toEqual(createMatch('A', 'B'));
    expect(emit.mock.calls[0][0]).toBe('update');
    expect(emit.mock.calls[0][1]).toMatchObject({
      scores1: { 0: { 6: 'carreau' } },
      score1: 5,
      complete: false,
    });
  });
});

describe('TirModule synchronization ownership', () => {
  it('applies participant copies before invoking the existing granular sync action', () => {
    const participant = { id: 'A', name: 'Before', scores: {} };
    const syncTirParticipants = vi.fn();
    const context = {
      tirParticipants: [participant],
      activeParticipant: participant,
      syncTirParticipants,
    };

    TirModule.methods.onScoreUpdate.call(context, {
      id: 'A',
      name: 'Before',
      scores: { 0: { 6: 'carreau' } },
    });

    expect(participant.scores).toEqual({ 0: { 6: 'carreau' } });
    expect(context.activeParticipant).toBe(participant);
    expect(syncTirParticipants).toHaveBeenCalledOnce();
  });

  it('applies a match copy and syncs only the active Firebase match path', () => {
    const activePlayoffMatch = createMatch('A', 'B');
    const syncTirPlayoffMatch = vi.fn();
    const context = {
      activePlayoffMatch,
      activePlayoffMatchPath: 'rounds/0/matches/1',
      syncTirPlayoffMatch,
    };
    const update = { ...activePlayoffMatch, score1: 5, scores1: { 0: { 6: 'carreau' } } };

    TirModule.methods.onPlayoffScoreChange.call(context, update);

    expect(activePlayoffMatch).toMatchObject(update);
    expect(syncTirPlayoffMatch).toHaveBeenCalledWith('rounds/0/matches/1', activePlayoffMatch);
  });

  it('preserves independent participant edits before each list sync', () => {
    const participants = [
      { id: 'A', scores: {} },
      { id: 'B', scores: {} },
    ];
    const syncTirParticipants = vi.fn();
    const context = { tirParticipants: participants, activeParticipant: null, syncTirParticipants };

    TirModule.methods.onScoreUpdate.call(context, { id: 'A', scores: { 0: { 6: 'carreau' } } });
    TirModule.methods.onScoreUpdate.call(context, { id: 'B', scores: { 2: { 8: 'reussi' } } });

    expect(participants[0].scores).toEqual({ 0: { 6: 'carreau' } });
    expect(participants[1].scores).toEqual({ 2: { 8: 'reussi' } });
    expect(syncTirParticipants).toHaveBeenCalledTimes(2);
  });

  it('keeps concurrent match edits isolated to their Firebase paths', () => {
    const firstMatch = createMatch('A', 'B');
    const secondMatch = createMatch('C', 'D');
    const syncTirPlayoffMatch = vi.fn();
    const context = {
      activePlayoffMatch: firstMatch,
      activePlayoffMatchPath: 'rounds/0/matches/0',
      syncTirPlayoffMatch,
    };

    TirModule.methods.onPlayoffScoreChange.call(context, {
      ...firstMatch,
      score1: 5,
      scores1: { 0: { 6: 'carreau' } },
    });
    context.activePlayoffMatch = secondMatch;
    context.activePlayoffMatchPath = 'rounds/0/matches/1';
    TirModule.methods.onPlayoffScoreChange.call(context, {
      ...secondMatch,
      score2: 3,
      scores2: { 0: { 6: 'reussi' } },
    });

    expect(firstMatch.score1).toBe(5);
    expect(secondMatch.score2).toBe(3);
    expect(syncTirPlayoffMatch.mock.calls.map(([path]) => path)).toEqual(['rounds/0/matches/0', 'rounds/0/matches/1']);
  });
});
