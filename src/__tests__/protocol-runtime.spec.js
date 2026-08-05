import { describe, expect, it } from 'vitest';
import { restoreProtocolEditableHtml } from '@/services/protocol-runtime';

function cell({ key, source, html, manual = false }) {
  return {
    dataset: {
      ...(key === undefined ? {} : { protocolEditKey: key }),
      ...(source === undefined ? {} : { protocolSource: source }),
      ...(manual ? { protocolManual: 'true' } : {}),
    },
    innerHTML: html,
  };
}

function root(cells) {
  return { querySelectorAll: () => cells };
}

describe('protocol editable restoration', () => {
  it('restores manual content by stable key instead of cell position', () => {
    const saved = [
      cell({ key: 'signature.judge', source: '', html: 'Підпис судді', manual: true }),
      cell({ key: 'info.venue', source: '', html: 'Львів', manual: true }),
    ];
    const current = [
      cell({ key: 'info.venue', source: '', html: '', manual: true }),
      cell({ key: 'signature.judge', source: '', html: '', manual: true }),
    ];

    expect(restoreProtocolEditableHtml(root(saved), root(current))).toBe(2);
    expect(current.map((item) => item.innerHTML)).toEqual(['Львів', 'Підпис судді']);
  });

  it('does not overlay content saved for an older generated source value', () => {
    const saved = [cell({ key: 'judge.0.name', source: 'Уварова Юлія', html: 'Уварова Юлія' })];
    const current = [
      cell({
        key: 'judge.0.name',
        source: 'Уварова Юлія Володимирівна',
        html: 'Уварова Юлія Володимирівна',
      }),
    ];

    expect(restoreProtocolEditableHtml(root(saved), root(current))).toBe(0);
    expect(current[0].innerHTML).toBe('Уварова Юлія Володимирівна');
  });

  it('restores a manual edit to generated content while its source is unchanged', () => {
    const saved = [cell({ key: 'participant.1.name', source: 'player-1', html: 'Відредаговане ім’я' })];
    const current = [cell({ key: 'participant.1.name', source: 'player-1', html: 'Автоматичне ім’я' })];

    expect(restoreProtocolEditableHtml(root(saved), root(current))).toBe(1);
    expect(current[0].innerHTML).toBe('Відредаговане ім’я');
  });

  it('migrates only manual fields from legacy position-based HTML', () => {
    const saved = [cell({ html: 'Стара автоматична назва' }), cell({ html: 'Ручне місце проведення' })];
    const current = [
      cell({ key: 'judge.0.name', source: 'Нова автоматична назва', html: 'Нова автоматична назва' }),
      cell({ key: 'info.venue', source: '', html: '', manual: true }),
    ];

    expect(restoreProtocolEditableHtml(root(saved), root(current))).toBe(1);
    expect(current.map((item) => item.innerHTML)).toEqual(['Нова автоматична назва', 'Ручне місце проведення']);
  });
});
