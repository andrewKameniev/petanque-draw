// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import TirProtocol from '@/components/tir/TirProtocol.vue';

const computed = TirProtocol.computed;

describe('TIR protocol preview pagination', () => {
  it('chunks ranked participants into 32-row pages without changing their order', () => {
    const rankedParticipants = Array.from({ length: 65 }, (_, index) => ({ id: index + 1 }));
    const participantPageSize = computed.participantPageSize.call({});
    const chunks = computed.rankedParticipantChunks.call({ rankedParticipants, participantPageSize });

    expect(participantPageSize).toBe(32);
    expect(chunks.map((chunk) => chunk.length)).toEqual([32, 32, 1]);
    expect(chunks.flat().map((participant) => participant.id)).toEqual(
      rankedParticipants.map((participant) => participant.id),
    );
  });

  it('keeps one empty results page so results still begin on page two', () => {
    expect(computed.rankedParticipantChunks.call({ rankedParticipants: [], participantPageSize: 32 })).toEqual([[]]);
  });

  it('uses the DOCX column arrays for one-round and two-round previews', () => {
    expect(computed.resultsColumnWidthValues.call({ isTwoRound: false })).toEqual([
      690, 3285, 1905, 2865, 1305, 960, 1800, 1830,
    ]);
    expect(computed.resultsColumnWidthValues.call({ isTwoRound: true })).toEqual([
      690, 3285, 1905, 2865, 1305, 645, 645, 960, 1230, 1155,
    ]);
  });

  it('splits oversized playoff rounds into conservative page models', () => {
    const matches = Array.from({ length: 25 }, (_, index) => ({ player1: `A${index}`, player2: `B${index}` }));
    const playoffPageModels = computed.playoffPageModels.call({
      playoffRounds: [{ title: '1/16 фіналу', matches }],
    });

    expect(playoffPageModels.map((page) => page.segments.flatMap((segment) => segment.matches).length)).toEqual([
      16, 9,
    ]);
    expect(playoffPageModels.flatMap((page) => page.segments).map((segment) => segment.segmentIndex)).toEqual([0, 1]);
  });

  it('charges each packed round for its heading and repeated table header', () => {
    const playoffPageModels = computed.playoffPageModels.call({
      playoffRounds: [10, 10, 4].map((matchCount, roundIndex) => ({
        title: `Round ${roundIndex + 1}`,
        matches: Array.from({ length: matchCount }, () => ({})),
      })),
    });

    expect(playoffPageModels.map((page) => page.segments.flatMap((segment) => segment.matches).length)).toEqual([
      10, 14,
    ]);
    expect(playoffPageModels.map((page) => page.segments.length)).toEqual([1, 2]);
  });

  it('packs a typical eight-player playoff onto one landscape page', () => {
    const playoffPageModels = computed.playoffPageModels.call({
      playoffRounds: [4, 2, 1, 1].map((matchCount, roundIndex) => ({
        title: `Round ${roundIndex + 1}`,
        matches: Array.from({ length: matchCount }, () => ({})),
      })),
    });

    expect(playoffPageModels).toHaveLength(1);
    expect(playoffPageModels[0].segments).toHaveLength(4);
    expect(playoffPageModels[0].segments.flatMap((segment) => segment.matches)).toHaveLength(8);
  });
});
