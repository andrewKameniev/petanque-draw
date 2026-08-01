import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildArbiterSelection,
  fetchArbiterRegistryFromSheet,
  isMainArbiterRole,
  matchCurrentArbiterSelection,
  normalizeArbiterSetup,
  parseArbiterRegistryTable,
  resolveArbiterCategory,
} from '../services/arbiter-registry';

describe('arbiter registry', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the highest awarded category and falls back to AFPU', () => {
    expect(resolveArbiterCategory(['2', '1', 'НК', ''])).toBe('НК');
    expect(resolveArbiterCategory(['2', '1'])).toBe('1');
    expect(resolveArbiterCategory(['2'])).toBe('2');
    expect(resolveArbiterCategory([])).toBe('АФПУ');
  });

  it('maps the sheet name, region, certificate, and repeated category columns', () => {
    const table = {
      cols: [
        { label: '№ посвідчення' },
        { label: 'ПІП судді' },
        { label: 'Область' },
        { label: 'Присвоєна категорія' },
        { label: 'Дата присвоєної категорії' },
        { label: 'Присвоєна категорія' },
      ],
      rows: [
        {
          c: [
            { v: 11, f: '11' },
            { v: 'Черевань Владислав' },
            { v: 'м.Київ' },
            { v: 2, f: '2' },
            null,
            { v: 1, f: '1' },
          ],
        },
        {
          c: [{ v: 12, f: '12' }, { v: 'Аксьом Василь' }, { v: 'Закарпатська' }],
        },
        { c: [{ v: 13, f: '13' }, null, { v: 'Львівська' }] },
      ],
    };

    expect(parseArbiterRegistryTable(table)).toEqual([
      { name: 'Аксьом Василь', category: 'АФПУ', certificate: '12', region: 'Закарпатська' },
      { name: 'Черевань Владислав', category: '1', certificate: '11', region: 'м.Київ' },
    ]);
  });

  it('normalizes the complete setup before saving it as a preset', () => {
    expect(
      normalizeArbiterSetup([
        { name: 'Суддя 1', region: 'Львівська' },
        { name: 'Суддя 2', role: 'Головний Арбітр', category: '1', certificate: '12' },
        { name: '' },
      ]),
    ).toEqual([
      { name: 'Суддя 1', role: 'Арбітр', category: 'АФПУ', certificate: '', region: 'Львівська' },
      { name: 'Суддя 2', role: 'Головний Арбітр', category: '1', certificate: '12', region: '' },
    ]);
  });

  it('normalizes main-arbiter roles from older presets', () => {
    expect(isMainArbiterRole('  ГОЛОВНИЙ\u00a0АРБІТР ')).toBe(true);
    expect(normalizeArbiterSetup([{ name: 'Суддя 1', role: 'головний арбітр' }])[0].role).toBe('Головний Арбітр');
  });

  it('builds a multi-selection with one optional head arbiter', () => {
    const arbiters = [{ name: 'Суддя 1' }, { name: 'Суддя 2' }, { name: 'Суддя 3' }];

    expect(buildArbiterSelection(arbiters, ['0', '2'], '2')).toEqual([
      { name: 'Суддя 1', role: 'Арбітр' },
      { name: 'Суддя 3', role: 'Головний Арбітр' },
    ]);
  });

  it('matches arbiters already present in the protocol when reopening the picker', () => {
    const arbiters = [{ name: 'Суддя 1' }, { name: 'Суддя 2' }, { name: 'Суддя 3' }];

    expect(
      matchCurrentArbiterSelection(arbiters, [
        { name: ' суддя 1 ', role: 'Арбітр' },
        { name: 'СУДДЯ 3', role: 'Головний Арбітр' },
      ]),
    ).toEqual({ selectedIndexes: ['0', '2'], mainArbiterIndex: '2' });
  });

  it('restores the main arbiter selection from a preset regardless of role casing', () => {
    const arbiters = [{ name: 'Суддя 1' }, { name: 'Суддя 2' }];

    expect(
      matchCurrentArbiterSelection(arbiters, [
        { name: 'Суддя 1', role: 'Арбітр' },
        { name: 'Суддя 2', role: 'головний арбітр' },
      ]),
    ).toEqual({ selectedIndexes: ['0', '1'], mainArbiterIndex: '1' });
  });

  it('matches a preset name containing Cyrillic letters to registry homoglyph typos', () => {
    const arbiters = [{ name: 'Рожок Олександр Олекcандрович', certificate: '8' }];

    expect(
      matchCurrentArbiterSelection(arbiters, [
        { name: 'Рожок Олександр Олександрович', role: 'Головний Арбітр', certificate: '' },
      ]),
    ).toEqual({ selectedIndexes: ['0'], mainArbiterIndex: '0' });
  });

  it('uses the certificate when a registry name changed after a preset was saved', () => {
    const arbiters = [{ name: 'Нове повне ім’я', certificate: '42' }];

    expect(
      matchCurrentArbiterSelection(arbiters, [{ name: 'Старе повне ім’я', role: 'Головний Арбітр', certificate: 42 }]),
    ).toEqual({ selectedIndexes: ['0'], mainArbiterIndex: '0' });
  });

  it('does not select an ambiguous short name without a certificate or full-name match', () => {
    const arbiters = [{ name: 'Коваль Олександр Петрович' }];

    expect(
      matchCurrentArbiterSelection(arbiters, [
        { name: 'Коваль Олександр Іванович', role: 'Головний Арбітр' },
        { name: 'Коваль Олександр Сергійович', role: 'Арбітр' },
      ]),
    ).toEqual({ selectedIndexes: [], mainArbiterIndex: '' });
  });

  it('ignores invalid selected indexes and arbiters without names', () => {
    expect(buildArbiterSelection([{ name: 'Valid' }, { name: '' }], ['0', '1', '99'], '')).toEqual([
      { name: 'Valid', role: 'Арбітр' },
    ]);
  });

  it('returns an empty registry for malformed sheets or missing required columns', () => {
    expect(parseArbiterRegistryTable()).toEqual([]);
    expect(parseArbiterRegistryTable({ cols: [{ label: 'ПІП судді' }], rows: [] })).toEqual([]);
  });

  it('loads a JSONP registry and cleans up the callback and script', async () => {
    const windowObject = {};
    const script = { remove: vi.fn() };
    const documentObject = {
      createElement: vi.fn(() => script),
      head: { appendChild: vi.fn() },
    };
    const pending = fetchArbiterRegistryFromSheet({ windowObject, documentObject, timeoutMs: 1000 });
    const callbackName = Object.keys(windowObject)[0];

    windowObject[callbackName]({
      status: 'ok',
      table: {
        cols: [{ label: 'ПІП судді' }, { label: 'Область' }],
        rows: [{ c: [{ v: 'Суддя Тестовий' }, { v: 'Київська' }] }],
      },
    });

    await expect(pending).resolves.toEqual([
      { name: 'Суддя Тестовий', category: 'АФПУ', certificate: '', region: 'Київська' },
    ]);
    expect(script.async).toBe(true);
    expect(script.src).toContain(encodeURIComponent(`out:json;responseHandler:${callbackName}`));
    expect(documentObject.head.appendChild).toHaveBeenCalledWith(script);
    expect(script.remove).toHaveBeenCalledOnce();
    expect(windowObject).not.toHaveProperty(callbackName);
  });

  it('rejects invalid JSONP responses and script loading errors once', async () => {
    const makeRequest = () => {
      const windowObject = {};
      const script = { remove: vi.fn() };
      const documentObject = { createElement: () => script, head: { appendChild: vi.fn() } };
      const pending = fetchArbiterRegistryFromSheet({ windowObject, documentObject, timeoutMs: 1000 });
      return { windowObject, script, pending, callbackName: Object.keys(windowObject)[0] };
    };
    const invalid = makeRequest();
    invalid.windowObject[invalid.callbackName]({ status: 'error' });
    invalid.script.onerror();

    await expect(invalid.pending).rejects.toThrow('invalid arbiter registry response');
    expect(invalid.script.remove).toHaveBeenCalledOnce();

    const failedScript = makeRequest();
    failedScript.script.onerror();
    await expect(failedScript.pending).rejects.toThrow('Could not load');
    expect(failedScript.script.remove).toHaveBeenCalledOnce();
  });

  it('times out a stalled JSONP request and cleans it up', async () => {
    vi.useFakeTimers();
    const windowObject = {};
    const script = { remove: vi.fn() };
    const documentObject = { createElement: () => script, head: { appendChild: vi.fn() } };
    const pending = fetchArbiterRegistryFromSheet({ windowObject, documentObject, timeoutMs: 25 });

    const rejection = expect(pending).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(25);
    await rejection;

    expect(script.remove).toHaveBeenCalledOnce();
    expect(windowObject).toEqual({});
  });
});
