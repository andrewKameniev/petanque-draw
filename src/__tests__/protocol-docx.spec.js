import { describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import { createProtocolDocxBlob, downloadProtocolDocx, sanitizeDocxFilename } from '../services/protocol-docx';

const classList = (...names) => ({ contains: (name) => names.includes(name) });

describe('protocol DOCX export', () => {
  it('creates a valid DOCX zip from protocol headings and tables', async () => {
    const headerCell = {
      tagName: 'TH',
      innerText: 'Команда',
      classList: classList('has-text-centered'),
      colSpan: 1,
      rowSpan: 1,
      querySelector: () => null,
    };
    const dataCell = {
      tagName: 'TD',
      innerText: 'Команда Київської області 1',
      classList: classList(),
      colSpan: 1,
      rowSpan: 1,
      querySelector: () => null,
    };
    const table = {
      tagName: 'TABLE',
      classList: classList(),
      rows: [
        { cells: [headerCell], parentElement: { tagName: 'THEAD' } },
        { cells: [dataCell], parentElement: { tagName: 'TBODY' } },
      ],
    };
    const protocol = {
      children: [
        {
          tagName: 'DIV',
          classList: classList('pdf-page-break'),
          children: [
            {
              tagName: 'H2',
              innerText: 'Підсумковий протокол',
              classList: classList('text-center'),
              children: [],
            },
            table,
            {
              tagName: 'DIV',
              innerText: 'Команда 1 13 : 8 Команда 2',
              classList: classList('playoff-game'),
              children: [],
            },
          ],
        },
      ],
    };

    const blob = await createProtocolDocxBlob(protocol);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const zip = await JSZip.loadAsync(bytes);
    const documentXml = await zip.file('word/document.xml').async('string');

    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(bytes.byteLength).toBeGreaterThan(500);
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe('PK');
    expect(documentXml).toContain('Команда 1 13 : 8 Команда 2');
    expect(documentXml).not.toContain('w:pageBreakBefore');
    expect(documentXml).toContain('<w:tcBorders>');
    expect(documentXml).toContain('w:sz="6"');
  });

  it('sanitizes characters that are invalid in downloaded filenames', () => {
    expect(sanitizeDocxFilename('Кубок: фінал/2026?')).toBe('Кубок- фінал-2026-');
    expect(sanitizeDocxFilename('   ')).toBe('protocol');
  });

  it.each(['№ з/п', '#'])('keeps the %s ordinal table column compact in DOCX output', async (ordinalLabel) => {
    const headerLabels = [ordinalLabel, 'ПІП', 'Регіон', 'Тренер(и)', 'Розряд', 'Місце', 'Підсумкове місце'];
    const table = {
      tagName: 'TABLE',
      classList: classList(),
      rows: [
        {
          cells: headerLabels.map((label) => ({
            tagName: 'TH',
            innerText: label,
            classList: classList(),
            colSpan: 1,
            rowSpan: 1,
            querySelector: () => null,
          })),
          parentElement: { tagName: 'THEAD' },
        },
      ],
    };
    const protocol = {
      children: [{ tagName: 'DIV', classList: classList(), children: [table] }],
    };

    const blob = await createProtocolDocxBlob(protocol);
    const zip = await JSZip.loadAsync(new Uint8Array(await blob.arrayBuffer()));
    const documentXml = await zip.file('word/document.xml').async('string');
    const gridWidths = [...documentXml.matchAll(/<w:gridCol w:w="(\d+)"\/>/g)].map((match) => Number(match[1]));

    expect(gridWidths).toHaveLength(7);
    expect(gridWidths[0]).toBe(500);
    expect(gridWidths[0]).toBeLessThan(gridWidths[1] / 3);
    expect(gridWidths.reduce((sum, width) => sum + width, 0)).toBe(11160);
  });

  it('keeps portrait margins and the page-number footer in DOCX output', async () => {
    const blob = await createProtocolDocxBlob(
      { children: [{ tagName: 'P', innerText: 'Protocol', classList: classList(), children: [] }] },
      { pageNumbers: true },
    );
    const zip = await JSZip.loadAsync(new Uint8Array(await blob.arrayBuffer()));
    const documentXml = await zip.file('word/document.xml').async('string');
    const footerXml = await zip.file('word/footer1.xml').async('string');

    expect(documentXml).toContain(
      '<w:pgMar w:top="720" w:right="360" w:bottom="720" w:left="360" w:header="708" w:footer="708" w:gutter="0"/>',
    );
    expect(footerXml).toContain('PAGE');
  });

  it('supports the landscape TIR protocol geometry and page-number footer', async () => {
    const labels = ['№ з/п', 'ПІП', 'Регіон', 'Тренер', 'Розряд', '1 тур', '2 тур', 'Загалом', 'Відбір', 'Місце'];
    const table = {
      tagName: 'TABLE',
      classList: classList(),
      dataset: { docxColumnWidths: '690,3285,1905,2865,1305,645,645,960,1230,1155' },
      rows: [
        {
          cells: labels.map((label) => ({
            tagName: 'TH',
            innerText: label,
            classList: classList(),
            colSpan: 1,
            rowSpan: 1,
            querySelector: () => null,
          })),
          parentElement: { tagName: 'THEAD' },
        },
      ],
    };

    const blob = await createProtocolDocxBlob(
      {
        children: [
          {
            tagName: 'H3',
            innerText: 'Учасники та результати',
            classList: classList('text-center', 'docx-page-break'),
            children: [],
          },
          table,
        ],
      },
      {
        orientation: 'landscape',
        tableWidth: 14640,
        pageNumbers: true,
        borderColor: '000000',
        headerFill: 'FFFFFF',
      },
    );
    const zip = await JSZip.loadAsync(new Uint8Array(await blob.arrayBuffer()));
    const documentXml = await zip.file('word/document.xml').async('string');
    const footerXml = await zip.file('word/footer1.xml').async('string');
    const gridWidths = [...documentXml.matchAll(/<w:gridCol w:w="(\d+)"\/>/g)].map((match) => Number(match[1]));

    expect(gridWidths).toEqual([690, 3285, 1905, 2865, 1305, 645, 645, 960, 1230, 1155]);
    expect(gridWidths.reduce((sum, width) => sum + width, 0)).toBe(14685);
    expect(documentXml).toContain('w:w="16838"');
    expect(documentXml).toContain('w:h="11906"');
    expect(documentXml).toContain('w:orient="landscape"');
    expect(documentXml).toContain('w:left="1700"');
    expect(documentXml).toContain('<w:pageBreakBefore/>');
    expect(documentXml).toContain('w:fill="FFFFFF"');
    expect(footerXml).toContain('PAGE');
  });

  it('merges preview table chunks with the same DOCX group into one table', async () => {
    const cell = (tagName, text) => ({
      tagName,
      innerText: text,
      classList: classList(),
      colSpan: 1,
      rowSpan: 1,
      querySelector: () => null,
    });
    const table = (participant) => ({
      tagName: 'TABLE',
      classList: classList('tir-protocol-results-table'),
      dataset: { docxTableGroup: 'tir-participants', docxColumnWidths: '500,9500' },
      rows: [
        {
          cells: [cell('TH', '№ з/п'), cell('TH', 'ПІП')],
          parentElement: { tagName: 'THEAD' },
        },
        {
          cells: [cell('TD', String(participant.number)), cell('TD', participant.name)],
          parentElement: { tagName: 'TBODY' },
        },
      ],
    });
    const protocol = {
      children: [
        { tagName: 'SECTION', classList: classList(), children: [table({ number: 1, name: 'Гравець 1' })] },
        { tagName: 'SECTION', classList: classList(), children: [table({ number: 33, name: 'Гравець 33' })] },
      ],
    };

    const blob = await createProtocolDocxBlob(protocol);
    const zip = await JSZip.loadAsync(new Uint8Array(await blob.arrayBuffer()));
    const documentXml = await zip.file('word/document.xml').async('string');

    expect(documentXml.match(/<w:tbl>/g)).toHaveLength(1);
    expect(documentXml.match(/№ з\/п/g)).toHaveLength(1);
    expect(documentXml).toContain('Гравець 1');
    expect(documentXml).toContain('Гравець 33');
    expect(documentXml).toContain('<w:gridCol w:w="500"/>');
    expect(documentXml).toContain('<w:gridCol w:w="9500"/>');
  });

  it('exports playoff stages as bordered team-score-team tables', async () => {
    const span = (text, className) => ({
      tagName: 'SPAN',
      innerText: text,
      classList: classList(className),
      children: [],
    });
    const game = (team1, score, team2) => ({
      tagName: 'DIV',
      classList: classList('playoff-game'),
      children: [span(team1, 'playoff-team'), span(score, 'playoff-score'), span(team2, 'playoff-team')],
    });
    const protocol = {
      children: [
        {
          tagName: 'DIV',
          classList: classList('playoff-section'),
          children: [
            { tagName: 'H3', innerText: 'Результати ігор на виліт', classList: classList('text-center') },
            { tagName: 'DIV', innerText: '1/4 фіналу', classList: classList('playoff-stage-label') },
            game('Команда 1', '13 : 8', 'Команда 2'),
            game('Команда 3', '9 : 13', 'Команда 4'),
          ],
        },
      ],
    };

    const blob = await createProtocolDocxBlob(protocol);
    const zip = await JSZip.loadAsync(new Uint8Array(await blob.arrayBuffer()));
    const documentXml = await zip.file('word/document.xml').async('string');

    expect(documentXml.match(/<w:tbl>/g)).toHaveLength(1);
    expect(documentXml).toContain('1/4 фіналу');
    expect(documentXml).toContain('Команда 1');
    expect(documentXml).toContain('13 : 8');
    expect(documentXml).toContain('<w:gridCol w:w="1660"/>');
  });

  it('exports the sign-off block as a compact, proportioned table', async () => {
    const cell = (text, classes = []) => ({
      tagName: 'TD',
      innerText: text,
      classList: classList(...classes),
      colSpan: 1,
      rowSpan: 1,
      querySelector: () => null,
    });
    const row = (role, label, name = '') => ({
      cells: [
        cell(role),
        cell(`___________________\n(${label})`, ['has-text-centered']),
        cell(name, ['has-text-right']),
      ],
      parentElement: { tagName: 'TBODY' },
    });
    const table = {
      tagName: 'TABLE',
      classList: classList('protocol-signature-table'),
      rows: [
        row('Головний суддя змагань', 'печатка'),
        row('Суддя', 'підпис'),
        row('Головний секретар змагань', 'підпис'),
        row('Президент ГС «Федерація петанку України»', 'підпис', 'Литвин Лілія Миколаївна'),
      ],
    };
    const protocol = {
      children: [{ tagName: 'DIV', classList: classList(), children: [table] }],
    };

    const blob = await createProtocolDocxBlob(protocol);
    const zip = await JSZip.loadAsync(new Uint8Array(await blob.arrayBuffer()));
    const documentXml = await zip.file('word/document.xml').async('string');
    const gridWidths = [...documentXml.matchAll(/<w:gridCol w:w="(\d+)"\/>/g)].map((match) => Number(match[1]));

    expect(gridWidths).toEqual([4350, 2680, 4130]);
    expect(gridWidths.reduce((sum, width) => sum + width, 0)).toBe(11160);
    expect(documentXml.match(/<w:trHeight w:val="500" w:hRule="atLeast"\/>/g)).toHaveLength(4);
    expect(documentXml).toContain('w:fill="F4F5F7"');
    expect(documentXml).toContain('Литвин Лілія Миколаївна');
  });

  it('skips hidden duplicate layouts while keeping paragraphs and inline results', async () => {
    const protocol = {
      children: [
        {
          tagName: 'DIV',
          classList: classList('is-hidden-tablet'),
          innerText: 'DO NOT EXPORT',
          children: [],
        },
        { tagName: 'P', classList: classList(), innerText: '  Звичайний   абзац  ', children: [] },
        {
          tagName: 'DIV',
          classList: classList('results-card-round-label'),
          innerText: 'Раунд 1',
          children: [],
        },
        { tagName: 'DIV', classList: classList('match-item'), innerText: 'Команда 1 13 : 7 Команда 2', children: [] },
      ],
    };

    const blob = await createProtocolDocxBlob(protocol);
    const zip = await JSZip.loadAsync(new Uint8Array(await blob.arrayBuffer()));
    const documentXml = await zip.file('word/document.xml').async('string');

    expect(documentXml).not.toContain('DO NOT EXPORT');
    expect(documentXml).toContain('Звичайний абзац');
    expect(documentXml).toContain('Раунд 1');
    expect(documentXml).toContain('Команда 1 13 : 7 Команда 2');
  });

  it('preserves table column spans and row spans in the DOCX table grid', async () => {
    const cell = (text, { tagName = 'TD', colSpan = 1, rowSpan = 1 } = {}) => ({
      tagName,
      innerText: text,
      classList: classList(),
      colSpan,
      rowSpan,
      querySelector: () => null,
    });
    const table = {
      tagName: 'TABLE',
      classList: classList(),
      rows: [
        {
          cells: [cell('Група', { tagName: 'TH', colSpan: 2 }), cell('Місце', { tagName: 'TH', rowSpan: 2 })],
          parentElement: { tagName: 'THEAD' },
        },
        {
          cells: [cell('Команда', { tagName: 'TH' }), cell('Регіон', { tagName: 'TH' })],
          parentElement: { tagName: 'THEAD' },
        },
      ],
    };

    const blob = await createProtocolDocxBlob({ children: [table] });
    const zip = await JSZip.loadAsync(new Uint8Array(await blob.arrayBuffer()));
    const documentXml = await zip.file('word/document.xml').async('string');

    expect(documentXml).toContain('<w:gridSpan w:val="2"/>');
    expect(documentXml).toContain('<w:vMerge w:val="restart"/>');
  });

  it('downloads using a sanitized filename and revokes the object URL', async () => {
    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;
    const revokeObjectURL = vi.fn();
    const link = { click: vi.fn(), remove: vi.fn(), href: '', download: '' };
    globalThis.window = {
      URL: {
        createObjectURL: vi.fn(() => 'blob:protocol'),
        revokeObjectURL,
      },
    };
    globalThis.document = {
      createElement: vi.fn(() => link),
      body: { appendChild: vi.fn() },
    };

    try {
      await downloadProtocolDocx({ children: [] }, 'Кубок: 2026');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(link.href).toBe('blob:protocol');
      expect(link.download).toBe('Кубок- 2026_protocol.docx');
      expect(globalThis.document.body.appendChild).toHaveBeenCalledWith(link);
      expect(link.click).toHaveBeenCalledOnce();
      expect(link.remove).toHaveBeenCalledOnce();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:protocol');
    } finally {
      globalThis.window = originalWindow;
      globalThis.document = originalDocument;
    }
  });
});
