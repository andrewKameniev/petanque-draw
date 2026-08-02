const HEADING_LEVELS = {
  H1: 1,
  H2: 2,
  H3: 3,
  H4: 4,
};

const DOCX_TABLE_WIDTH = 11160;
const DOCX_NUMBER_COLUMN_WIDTH = 500;
const DOCX_SIGNATURE_COLUMN_WIDTHS = [4350, 2680, 4130];

function textLines(element) {
  const text = element?.innerText ?? element?.textContent ?? '';
  return text
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function isHiddenDuplicate(element) {
  return element.classList?.contains('is-hidden-tablet');
}

function isInlineResultBlock(element) {
  return (
    element.classList?.contains('playoff-stage-label') ||
    element.classList?.contains('playoff-game') ||
    element.classList?.contains('results-card-round-label') ||
    element.classList?.contains('match-item')
  );
}

function paragraphFromText(text, docx, options = {}) {
  const { AlignmentType, HeadingLevel, Paragraph, TextRun } = docx;
  const heading = options.heading ? HeadingLevel[`HEADING_${options.heading}`] : undefined;

  return new Paragraph({
    heading,
    alignment: options.centered ? AlignmentType.CENTER : undefined,
    pageBreakBefore: options.pageBreakBefore,
    spacing: { after: options.heading ? 160 : 40, line: 240 },
    children: [
      new TextRun({
        text,
        bold: options.bold || !!options.heading,
        size: options.heading ? Math.max(24, 36 - options.heading * 4) : 18,
      }),
    ],
  });
}

function tableCellToDocx(cell, docx, width, border, options = {}) {
  const { AlignmentType, Paragraph, ShadingType, TableCell, TextRun, VerticalAlign, WidthType } = docx;
  const lines = textLines(cell);
  const centered = cell.classList?.contains('has-text-centered');
  const rightAligned = cell.classList?.contains('has-text-right');
  const isSignatureTable = options.isSignatureTable;
  const bold =
    cell.tagName === 'TH' ||
    cell.classList?.contains('has-text-weight-bold') ||
    !!cell.querySelector?.('.has-text-weight-bold, strong, b') ||
    (isSignatureTable && options.columnIndex === 0);
  const children = (lines.length ? lines : ['']).map((line) => {
    const isSignatureHint = isSignatureTable && /^\(.+\)$/.test(line);
    return new Paragraph({
      alignment: centered ? AlignmentType.CENTER : rightAligned ? AlignmentType.RIGHT : undefined,
      spacing: { after: 0, line: isSignatureTable ? 180 : 210 },
      children: [
        new TextRun({
          text: line,
          bold: isSignatureHint ? false : bold,
          color: isSignatureHint ? '5F6875' : undefined,
          size: isSignatureHint ? 14 : isSignatureTable ? 18 : 16,
        }),
      ],
    });
  });

  return new TableCell({
    children,
    columnSpan: cell.colSpan > 1 ? cell.colSpan : undefined,
    rowSpan: cell.rowSpan > 1 ? cell.rowSpan : undefined,
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    borders: {
      top: border,
      right: border,
      bottom: border,
      left: border,
    },
    shading:
      cell.tagName === 'TH' || (isSignatureTable && options.columnIndex === 0)
        ? {
            type: ShadingType.CLEAR,
            fill: isSignatureTable ? options.signatureFill || 'F4F5F7' : options.headerFill || 'EDEDED',
          }
        : undefined,
    margins: isSignatureTable
      ? { top: 45, right: 100, bottom: 45, left: 100 }
      : { top: 60, right: 80, bottom: 60, left: 80 },
  });
}

function getTableColumnCount(table) {
  return Math.max(
    ...Array.from(table.rows).map((row) =>
      Array.from(row.cells).reduce((count, cell) => count + Math.max(1, cell.colSpan || 1), 0),
    ),
  );
}

function isProtocolSignatureTable(table) {
  if (table.classList?.contains('protocol-signature-table')) return true;

  const firstColumn = Array.from(table.rows || []).map((row) => textLines(row.cells?.[0]).join(' '));
  return (
    firstColumn[0] === 'Головний суддя змагань' &&
    firstColumn.some((text) => text.startsWith('Президент ГС «Федерація петанку України»'))
  );
}

function getExplicitTableColumnWidths(table) {
  const value = table.dataset?.docxColumnWidths || table.getAttribute?.('data-docx-column-widths');
  if (!value) return null;

  const widths = String(value)
    .split(',')
    .map((width) => Number(width.trim()))
    .filter((width) => Number.isFinite(width) && width > 0);
  return widths.length === getTableColumnCount(table) ? widths : null;
}

function getTableColumnWidths(table, tableWidth = DOCX_TABLE_WIDTH) {
  if (Array.isArray(table.docxColumnWidths)) return table.docxColumnWidths;
  const explicitWidths = getExplicitTableColumnWidths(table);
  if (explicitWidths) return explicitWidths;
  if (isProtocolSignatureTable(table)) return DOCX_SIGNATURE_COLUMN_WIDTHS;

  const columnCount = getTableColumnCount(table);
  if (columnCount <= 1) return [tableWidth];

  const firstHeaderText = textLines(table.rows[0]?.cells[0]).join(' ');
  const hasNumberColumn = /^№(?:\s*з\/п)?$/i.test(firstHeaderText);
  if (!hasNumberColumn) {
    const width = Math.floor(tableWidth / columnCount);
    return Array.from({ length: columnCount }, (_, index) =>
      index === columnCount - 1 ? tableWidth - width * (columnCount - 1) : width,
    );
  }

  const remainingWidth = tableWidth - DOCX_NUMBER_COLUMN_WIDTH;
  const dataColumnWidth = Math.floor(remainingWidth / (columnCount - 1));
  return Array.from({ length: columnCount }, (_, index) => {
    if (index === 0) return DOCX_NUMBER_COLUMN_WIDTH;
    if (index === columnCount - 1) return remainingWidth - dataColumnWidth * (columnCount - 2);
    return dataColumnWidth;
  });
}

function tableToDocx(table, docx, options = {}) {
  const { AlignmentType, BorderStyle, HeightRule, Table, TableLayoutType, TableRow, WidthType } = docx;
  const border = { style: BorderStyle.SINGLE, size: 6, color: options.borderColor || '7F7F7F' };
  const isSignatureTable = isProtocolSignatureTable(table);
  const columnWidths = getTableColumnWidths(table, options.tableWidth);
  const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const occupiedUntilRow = Array(columnWidths.length).fill(0);
  const rows = Array.from(table.rows).map((row, rowIndex) => {
    let columnIndex = 0;
    const cells = Array.from(row.cells).map((cell) => {
      while (occupiedUntilRow[columnIndex] > rowIndex) columnIndex += 1;
      const cellColumnIndex = columnIndex;
      const columnSpan = Math.max(1, cell.colSpan || 1);
      const width = columnWidths.slice(columnIndex, columnIndex + columnSpan).reduce((sum, value) => sum + value, 0);

      if (cell.rowSpan > 1) {
        for (let index = columnIndex; index < columnIndex + columnSpan; index += 1) {
          occupiedUntilRow[index] = rowIndex + cell.rowSpan;
        }
      }
      columnIndex += columnSpan;
      return tableCellToDocx(cell, docx, width, border, {
        isSignatureTable,
        columnIndex: cellColumnIndex,
        headerFill: options.headerFill,
        signatureFill: options.signatureFill,
      });
    });

    return new TableRow({
      cantSplit: true,
      height: isSignatureTable ? { value: 500, rule: HeightRule.ATLEAST } : undefined,
      tableHeader: row.parentElement?.tagName === 'THEAD',
      children: cells,
    });
  });

  return new Table({
    rows,
    columnWidths,
    alignment: AlignmentType.CENTER,
    layout: TableLayoutType.FIXED,
    width: { size: tableWidth, type: WidthType.DXA },
    borders: {
      top: border,
      right: border,
      bottom: border,
      left: border,
      insideHorizontal: border,
      insideVertical: border,
    },
  });
}

function syntheticClassList(...names) {
  return { contains: (name) => names.includes(name) };
}

function syntheticTableCell(tagName, innerText, classes = [], columnSpan = 1) {
  return {
    tagName,
    innerText,
    classList: syntheticClassList(...classes),
    colSpan: columnSpan,
    rowSpan: 1,
    querySelector: () => null,
  };
}

function playoffStageToDocx(label, games, docx, options = {}) {
  const rows = [
    {
      cells: [syntheticTableCell('TH', label, ['has-text-centered'], 3)],
      parentElement: { tagName: 'THEAD' },
    },
    {
      cells: [
        syntheticTableCell('TH', 'Команда 1', ['has-text-centered']),
        syntheticTableCell('TH', 'Рахунок', ['has-text-centered']),
        syntheticTableCell('TH', 'Команда 2', ['has-text-centered']),
      ],
      parentElement: { tagName: 'THEAD' },
    },
    ...games.map((game) => {
      const gameChildren = Array.from(game.children || []);
      const teams = gameChildren.filter((child) => child.classList?.contains('playoff-team'));
      const score = gameChildren.find((child) => child.classList?.contains('playoff-score'));
      return {
        cells: [
          syntheticTableCell('TD', textLines(teams[0]).join(' '), ['has-text-right']),
          syntheticTableCell('TD', textLines(score).join(' '), ['has-text-centered']),
          syntheticTableCell('TD', textLines(teams[1]).join(' ')),
        ],
        parentElement: { tagName: 'TBODY' },
      };
    }),
  ];

  return tableToDocx(
    {
      rows,
      docxColumnWidths: [4750, 1660, 4750],
    },
    docx,
    options,
  );
}

function playoffSectionToDocxChildren(section, docx, options = {}) {
  const { Paragraph } = docx;
  const children = [];
  let stageLabel = '';
  let stageGames = [];

  const flushStage = () => {
    if (!stageLabel || !stageGames.length) return;
    children.push(playoffStageToDocx(stageLabel, stageGames, docx, options));
    children.push(new Paragraph({ spacing: { after: 80, line: 40 } }));
    stageLabel = '';
    stageGames = [];
  };

  Array.from(section.children || []).forEach((child) => {
    if (HEADING_LEVELS[child.tagName]) {
      flushStage();
      const text = textLines(child).join(' ');
      if (text) {
        children.push(
          paragraphFromText(text, docx, {
            heading: HEADING_LEVELS[child.tagName],
            centered: child.classList?.contains('text-center'),
          }),
        );
      }
      return;
    }

    if (child.classList?.contains('playoff-stage-label')) {
      flushStage();
      stageLabel = textLines(child).join(' ');
      return;
    }

    if (child.classList?.contains('playoff-game')) stageGames.push(child);
  });
  flushStage();

  return children;
}

export function protocolElementToDocxChildren(element, docx, options = {}) {
  const { Paragraph } = docx;
  const children = [];

  function visit(node) {
    if (!node?.tagName || isHiddenDuplicate(node)) return;

    if (node.classList?.contains('playoff-section')) {
      children.push(...playoffSectionToDocxChildren(node, docx, options));
      return;
    }

    if (node.tagName === 'TABLE') {
      children.push(tableToDocx(node, docx, options));
      children.push(new Paragraph({ spacing: { after: 0, line: 40 } }));
      return;
    }

    const headingLevel = HEADING_LEVELS[node.tagName];
    if (headingLevel) {
      const text = textLines(node).join(' ');
      if (text) {
        children.push(
          paragraphFromText(text, docx, {
            heading: headingLevel,
            centered: node.classList?.contains('text-center'),
            pageBreakBefore: node.classList?.contains('docx-page-break'),
          }),
        );
      }
      return;
    }

    if (node.tagName === 'P') {
      const text = textLines(node).join(' ');
      if (text) children.push(paragraphFromText(text, docx));
      return;
    }

    if (isInlineResultBlock(node)) {
      const text = textLines(node).join(' ');
      if (text) {
        children.push(
          paragraphFromText(text, docx, {
            bold:
              node.classList?.contains('playoff-stage-label') || node.classList?.contains('results-card-round-label'),
          }),
        );
      }
      return;
    }

    Array.from(node.children || []).forEach((child) => visit(child));
  }

  Array.from(element.children || []).forEach((child) => visit(child));
  return children;
}

export function sanitizeDocxFilename(filename) {
  return (
    filename
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim() || 'protocol'
  );
}

export async function createProtocolDocxBlob(element, options = {}) {
  const docx = await import('docx');
  const { AlignmentType, Document, Footer, Packer, PageNumber, PageOrientation, Paragraph, TextRun } = docx;
  const isLandscape = options.orientation === 'landscape';
  const orientation = isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT;
  const margins =
    options.margins ||
    (isLandscape
      ? { top: 560, right: 560, bottom: 560, left: 1700, footer: 720 }
      : { top: 720, right: 360, bottom: 720, left: 360 });
  const footers = options.pageNumbers
    ? {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 0 },
              children: [new TextRun({ children: [PageNumber.CURRENT], size: 18 })],
            }),
          ],
        }),
      }
    : undefined;
  const documentFile = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 18 },
          paragraph: { spacing: { after: 80, line: 240 } },
        },
      },
      paragraphStyles: [
        ...[1, 2, 3, 4].map((level) => ({
          id: `Heading${level}`,
          name: `Heading ${level}`,
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: {
            font: 'Times New Roman',
            size: Math.max(24, 36 - level * 4),
            bold: true,
            color: '000000',
            italics: false,
          },
          paragraph: { spacing: { before: 120, after: 160, line: 240 } },
        })),
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { orientation },
            margin: margins,
          },
        },
        footers,
        children: protocolElementToDocxChildren(element, docx, options),
      },
    ],
  });

  return Packer.toBlob(documentFile);
}

export async function downloadProtocolDocx(element, tournamentName, options = {}) {
  const blob = await createProtocolDocxBlob(element, options);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeDocxFilename(tournamentName)}_protocol.docx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 0);
}
