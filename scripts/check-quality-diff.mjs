import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const COLOR_REGISTRIES = new Set([
  'src/assets/css/color-schemas.css',
  'src/assets/css/variables.css',
  'src/assets/css/bulma.min.css',
]);

const CODE_FILE_PATTERN = /\.(?:[cm]?js|jsx|ts|tsx|vue)$/i;
const COLOR_SOURCE_PATTERN = /^src\/.*\.(?:[cm]?js|ts|css|scss|sass|less|vue)$/i;
const RAW_COLOR_PATTERN = /#[\da-f]{3,8}(?![\da-f])|\b(?:rgb|hsl)a?\(\s*[\d.]/i;
const COMMON_PALETTE_NAMES = [
  'black',
  'blue',
  'brown',
  'coral',
  'cyan',
  'gold',
  'gray',
  'green',
  'grey',
  'indigo',
  'lime',
  'magenta',
  'maroon',
  'navy',
  'olive',
  'orange',
  'pink',
  'purple',
  'red',
  'silver',
  'teal',
  'violet',
  'white',
  'yellow',
].join('|');
const CSS_NAMED_COLOR_PATTERN = new RegExp(
  `(?:^|[;{])\\s*(?:--[\\w-]+|color|background(?:-color)?|border(?:-[\\w-]+)?|outline(?:-color)?|fill|stroke|text-shadow|box-shadow)\\s*:[^;}]*(?:\\b(?:${COMMON_PALETTE_NAMES})\\b)`,
  'i',
);
const SCRIPT_NAMED_COLOR_PATTERN = new RegExp(
  `\\b(?:color|backgroundColor|borderColor|fillStyle|strokeStyle)\\s*(?:=|:)\\s*['"](?:${COMMON_PALETTE_NAMES})['"]`,
  'i',
);
const SVG_NAMED_COLOR_PATTERN = new RegExp(`\\b(?:color|fill|stroke)=['"](?:${COMMON_PALETTE_NAMES})['"]`, 'i');
const COLOR_EXCEPTION_REASON_PATTERN = /\b(?:brand|canvas|export|pdf|svg)\b/i;
const FIREBASE_IMPORT_PATTERN =
  /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\()\s*['"](?:firebase(?:\/[^'"]*)?|[^'"]*\/firebase(?:\.js)?)['"]/i;
const ONLY_PATTERN = /\b(?:describe|it|test)\.only\s*\(|\b(?:fdescribe|fit)\s*\(/;

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function stripGitPrefix(value) {
  const unquoted = value.startsWith('"') && value.endsWith('"') ? JSON.parse(value) : value;
  return unquoted.startsWith('b/') ? unquoted.slice(2) : unquoted;
}

export function parseUnifiedDiff(diffText) {
  const files = [];
  let current = null;
  let nextLine = 0;

  for (const line of diffText.split('\n')) {
    if (line.startsWith('diff --git ')) {
      current = { file: null, status: 'M', addedLines: [] };
      files.push(current);
      nextLine = 0;
      continue;
    }
    if (!current) continue;
    if (line.startsWith('new file mode ')) current.status = 'A';
    if (line.startsWith('deleted file mode ')) current.status = 'D';
    if (line.startsWith('rename to ')) {
      current.file = line.slice('rename to '.length);
      current.status = 'R';
    } else if (line.startsWith('+++ ')) {
      const candidate = line.slice(4);
      if (candidate !== '/dev/null') current.file = stripGitPrefix(candidate);
    } else if (line.startsWith('@@ ')) {
      const match = line.match(/\+(\d+)(?:,\d+)?/);
      nextLine = match ? Number(match[1]) : 0;
    } else if (nextLine > 0 && line.startsWith('+') && !line.startsWith('+++')) {
      current.addedLines.push({ line: nextLine, text: line.slice(1) });
      nextLine += 1;
    } else if (nextLine > 0 && !line.startsWith('-')) {
      nextLine += 1;
    }
  }

  return files.filter(({ file }) => file).sort((left, right) => left.file.localeCompare(right.file));
}

function adjacentExplanation(lines, index, marker) {
  const current = lines[index];
  const previous = lines[index - 1];
  const explanation = new RegExp(`${marker}:\\s*(\\S.{3,})`, 'i');
  const currentMatch = current?.text.match(explanation);
  if (currentMatch) return currentMatch[1];
  if (previous?.line === current?.line - 1) return previous.text.match(explanation)?.[1] ?? null;
  return null;
}

function containsNamedPaletteColor(text) {
  const withoutVariableNames = text.replace(
    /\bvar\(\s*--[\w-]+(?:\s*,\s*([^()]*))?\)/gi,
    (_match, fallback = '') => fallback,
  );
  return (
    CSS_NAMED_COLOR_PATTERN.test(withoutVariableNames) ||
    SCRIPT_NAMED_COLOR_PATTERN.test(withoutVariableNames) ||
    SVG_NAMED_COLOR_PATTERN.test(withoutVariableNames)
  );
}

function hasAllowedColorException(lines, index) {
  const reason = adjacentExplanation(lines, index, 'quality-allow-color');
  return reason ? COLOR_EXCEPTION_REASON_PATTERN.test(reason) : false;
}

export function inspectAddedLines(diffFiles) {
  const findings = [];

  for (const diffFile of diffFiles) {
    const file = toPosix(diffFile.file);
    for (let index = 0; index < diffFile.addedLines.length; index += 1) {
      const added = diffFile.addedLines[index];
      const location = { file, line: added.line };

      const hasLiteralColor = RAW_COLOR_PATTERN.test(added.text) || containsNamedPaletteColor(added.text);
      if (
        COLOR_SOURCE_PATTERN.test(file) &&
        !COLOR_REGISTRIES.has(file) &&
        hasLiteralColor &&
        !hasAllowedColorException(diffFile.addedLines, index)
      ) {
        findings.push({
          ...location,
          rule: 'raw-color',
          message:
            'Use a CSS custom property. `quality-allow-color: reason` is limited to adjacent brand/canvas/export/PDF/SVG cases.',
        });
      }

      if (
        (file.startsWith('src/components/') || file.startsWith('src/views/')) &&
        FIREBASE_IMPORT_PATTERN.test(added.text)
      ) {
        findings.push({
          ...location,
          rule: 'firebase-in-ui',
          message: 'Components and views must call a store/service boundary instead of importing Firebase directly.',
        });
      }

      if (!CODE_FILE_PATTERN.test(file)) continue;
      if (ONLY_PATTERN.test(added.text)) {
        findings.push({ ...location, rule: 'focused-test', message: 'Focused tests must never be committed.' });
      }
    }
  }

  return findings;
}

export function analyzeQualityDiff({ diffText }) {
  const findings = inspectAddedLines(parseUnifiedDiff(diffText));
  findings.sort((left, right) =>
    `${left.file}:${left.line ?? 0}:${left.rule}`.localeCompare(`${right.file}:${right.line ?? 0}:${right.rule}`),
  );
  return findings;
}

async function git(root, args, options = {}) {
  const { stdout } = await execFileAsync('git', args, {
    cwd: root,
    encoding: options.encoding ?? 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });
  return stdout;
}

async function revisionExists(root, revision) {
  try {
    await git(root, ['rev-parse', '--verify', `${revision}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

export async function resolveComparisonBase(root = process.cwd(), explicitBase) {
  const requested = explicitBase || process.env.QUALITY_BASE_SHA;
  if (requested && !/^0+$/.test(requested)) {
    if (!(await revisionExists(root, requested)))
      throw new Error(`Quality comparison base does not exist: ${requested}`);
    return requested;
  }

  if (process.env.GITHUB_BASE_REF) {
    const remoteBase = `origin/${process.env.GITHUB_BASE_REF}`;
    if (await revisionExists(root, remoteBase)) return remoteBase;
  }
  if (await revisionExists(root, 'origin/develop')) {
    const remoteDevelop = (await git(root, ['rev-parse', 'origin/develop'])).trim();
    const head = (await git(root, ['rev-parse', 'HEAD'])).trim();
    return remoteDevelop === head ? 'HEAD' : 'origin/develop';
  }
  if (await revisionExists(root, 'HEAD^')) return 'HEAD^';
  return 'HEAD';
}

export function parseNameStatus(output) {
  const fields = output.split('\0').filter(Boolean);
  const changes = [];
  for (let index = 0; index < fields.length;) {
    const statusField = fields[index++];
    const status = statusField[0];
    if (status === 'R' || status === 'C') {
      const previousFile = toPosix(fields[index++]);
      const file = toPosix(fields[index++]);
      changes.push({ status: 'R', previousFile, file });
    } else {
      changes.push({ status, file: toPosix(fields[index++]) });
    }
  }
  return changes.sort((left, right) => left.file.localeCompare(right.file));
}

export function createSyntheticAddedFileDiff(file, text) {
  const lines = text.split('\n');
  if (lines.at(-1) === '') lines.pop();
  const body = lines.map((line) => `+${line}`).join('\n');
  return [
    `diff --git a/${file} b/${file}`,
    'new file mode 100644',
    '--- /dev/null',
    `+++ b/${file}`,
    `@@ -0,0 +1,${lines.length} @@`,
    body,
  ].join('\n');
}

async function readUntrackedFiles(root) {
  const output = await git(root, ['ls-files', '--others', '--exclude-standard', '-z']);
  const files = output.split('\0').filter(Boolean).map(toPosix).sort();
  const contents = new Map();
  for (const file of files) {
    try {
      const buffer = await readFile(path.join(root, file));
      if (buffer.subarray(0, 8000).includes(0)) continue;
      contents.set(file, buffer.toString('utf8'));
    } catch {
      // A concurrently removed untracked file can be ignored.
    }
  }
  return contents;
}

export async function loadQualityDiff({ root = process.cwd(), base: explicitBase } = {}) {
  const resolvedRoot = path.resolve(root);
  const requestedBase = await resolveComparisonBase(resolvedRoot, explicitBase);
  let base = requestedBase;
  try {
    base = (await git(resolvedRoot, ['merge-base', requestedBase, 'HEAD'])).trim() || requestedBase;
  } catch {
    // An explicit commit can still be used directly when no merge base exists.
  }

  const [trackedDiffText, nameStatus, untrackedContents] = await Promise.all([
    git(resolvedRoot, ['diff', '--unified=0', '--no-ext-diff', '--diff-filter=ACMR', base, '--']),
    git(resolvedRoot, ['diff', '--name-status', '-z', '--diff-filter=ACMRD', base, '--']),
    readUntrackedFiles(resolvedRoot),
  ]);
  const changes = parseNameStatus(nameStatus);
  const knownFiles = new Set(changes.map(({ file }) => file));
  for (const file of untrackedContents.keys()) {
    if (!knownFiles.has(file)) changes.push({ status: 'A', file });
  }
  changes.sort((left, right) => left.file.localeCompare(right.file));

  const untrackedDiffText = [...untrackedContents.entries()]
    .map(([file, text]) => createSyntheticAddedFileDiff(file, text))
    .join('\n');
  const diffText = [trackedDiffText.trimEnd(), untrackedDiffText].filter(Boolean).join('\n');
  return { root: resolvedRoot, base, diffText, changes };
}

async function main() {
  const rootIndex = process.argv.indexOf('--root');
  const baseIndex = process.argv.indexOf('--base');
  const input = await loadQualityDiff({
    root: rootIndex >= 0 ? process.argv[rootIndex + 1] : process.cwd(),
    base: baseIndex >= 0 ? process.argv[baseIndex + 1] : undefined,
  });
  const findings = analyzeQualityDiff(input);
  const result = {
    ok: findings.length === 0,
    base: input.base,
    files: input.changes.map(({ file }) => file),
    findings,
  };

  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (result.ok) {
    process.stdout.write(
      `Differential quality check passed against ${input.base} (${input.changes.length} changed files).\n`,
    );
  } else {
    process.stderr.write(`Differential quality check failed against ${input.base} with ${findings.length} issue(s):\n`);
    for (const finding of findings) {
      process.stderr.write(
        `- ${finding.file}${finding.line ? `:${finding.line}` : ''} [${finding.rule}] ${finding.message}\n`,
      );
    }
  }

  if (!result.ok) process.exitCode = 1;
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedFile === fileURLToPath(import.meta.url)) await main();
