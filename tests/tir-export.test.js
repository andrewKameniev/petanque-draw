import { describe, expect, it, vi } from 'vitest';
import { buildTirExportData, buildTirCsv, downloadTirFile } from '@/services/tir-export';

describe('tir export', () => {
  it('preserves participant details, round totals, ranking, and playoff shape', () => {
    const data = buildTirExportData({
      tournamentName: 'Cup',
      participants: [
        {
          name: 'Low',
          scores: { 0: { 6: 'touche' } },
          scores2: { 0: { 6: 'manque' } },
        },
        {
          name: 'High',
          city: 'Kyiv',
          scores: { 0: { 6: 'carreau' } },
          scores2: { 0: { 6: 'reussi' } },
        },
      ],
      distances: [6],
      isTwoRoundSystem: true,
      currentRound: 2,
      playoff: {
        rounds: [],
        final: { player1: 'High', score1: 8, player2: 'Low', score2: 1, winner: 'High' },
      },
    });

    expect(data.tournament).toBe('Cup');
    expect(data.participants.map((participant) => participant.name)).toEqual(['High', 'Low']);
    expect(data.participants[0]).toMatchObject({
      city: 'Kyiv',
      r1_score: 5,
      r2_score: 3,
      combined: 8,
      r1_details: { atelier1: { '6m': 5 } },
    });
    expect(data.playoff.final).toEqual({
      player1: 'High',
      score1: 8,
      player2: 'Low',
      score2: 1,
      winner: 'High',
    });
  });

  it('preserves the current CSV columns and playoff section', () => {
    const data = buildTirExportData({
      tournamentName: 'Cup',
      participants: [{ name: 'Alice', city: 'Lyon', scores: { 0: { 6: 'carreau' } } }],
      distances: [6],
      isTwoRoundSystem: false,
      currentRound: 1,
      playoff: {
        rounds: [],
        final: { player1: 'Alice', score1: 5, player2: 'Bob', score2: 3, winner: 'Alice' },
      },
    });

    expect(buildTirCsv(data, [6])).toBe(
      [
        'Name,City,R1,R1_A1_6m,R1_A2_6m,R1_A3_6m,R1_A4_6m,R1_A5_6m',
        '"Alice","Lyon",5,5,,,,',
        '',
        'Playoff',
        'final',
        '"Alice",5,"Bob",3,"Alice"',
      ].join('\n'),
    );
  });

  it('downloads through the supplied browser adapters', () => {
    const click = vi.fn();
    const revokeObjectURL = vi.fn();
    const browserWindow = {
      Blob: class MockBlob {
        constructor(parts, options) {
          this.parts = parts;
          this.type = options.type;
        }
      },
      URL: { createObjectURL: vi.fn(() => 'blob:tir'), revokeObjectURL },
    };
    const link = { click };
    const browserDocument = { createElement: vi.fn(() => link) };

    downloadTirFile('content', 'tir.csv', 'text/csv', browserWindow, browserDocument);

    expect(link).toMatchObject({ href: 'blob:tir', download: 'tir.csv' });
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:tir');
  });
});
