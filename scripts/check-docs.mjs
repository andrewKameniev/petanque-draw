import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_DOC_ROOTS = Object.freeze([
  { index: 'docs/README.md', scope: 'docs' },
  { index: 'tasks/README.md', scope: 'tasks' },
]);

export const DEFAULT_WORD_BUDGETS = Object.freeze({
  agents: 900,
  index: 650,
});

const IGNORED_DIRECTORIES = new Set(['.git', 'dist', 'node_modules', 'output', 'playwright-report', 'test-results']);

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function insideRoot(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function stripFencedCode(text) {
  return text.replace(/(?:^|\n)[ \t]*(```|~~~)[^\n]*\n[\s\S]*?\n[ \t]*\1(?=\n|$)/g, (block) =>
    block.replace(/[^\n]/g, ' '),
  );
}

function normalizeMarkdownTarget(rawTarget) {
  let target = rawTarget.trim();
  if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
  target = target.replace(/\\([ ()])/g, '$1');

  if (!target || target.startsWith('#') || target.startsWith('/') || target.startsWith('//')) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(target)) return null;

  target = target.split('#')[0].split('?')[0];
  if (!target) return null;
  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}

export function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/u).length : 0;
}

export function extractLocalMarkdownLinks(text) {
  const source = stripFencedCode(text);
  const links = [];
  const patterns = [
    /!?\[[^\]]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g,
    /^[ \t]*\[[^\]]+\]:[ \t]*(<[^>]+>|\S+)/gm,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const target = normalizeMarkdownTarget(match[1]);
      if (!target) continue;
      links.push({ target, line: source.slice(0, match.index).split('\n').length });
    }
  }

  return links;
}

async function listMarkdownFiles(root) {
  const files = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(absolute);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        files.push(toPosix(path.relative(root, absolute)));
      }
    }
  }

  await visit(root);
  return files.sort();
}

async function fileExists(filename) {
  try {
    await access(filename);
    return true;
  } catch {
    return false;
  }
}

async function markdownTarget(root, sourceFile, target) {
  const absolute = path.resolve(root, path.dirname(sourceFile), target);
  if (!insideRoot(root, absolute)) return { absolute, relative: toPosix(path.relative(root, absolute)), escaped: true };

  try {
    const details = await stat(absolute);
    if (details.isDirectory()) {
      const readme = path.join(absolute, 'README.md');
      return {
        absolute,
        relative: toPosix(path.relative(root, absolute)),
        markdown: (await fileExists(readme)) ? toPosix(path.relative(root, readme)) : null,
      };
    }
    return {
      absolute,
      relative: toPosix(path.relative(root, absolute)),
      markdown: absolute.toLowerCase().endsWith('.md') ? toPosix(path.relative(root, absolute)) : null,
    };
  } catch {
    return { absolute, relative: toPosix(path.relative(root, absolute)), missing: true };
  }
}

async function collectReachableMarkdown(root, indexFile, textByFile) {
  const reachable = new Set();
  const pending = [indexFile];

  while (pending.length > 0) {
    const current = pending.shift();
    if (reachable.has(current) || !textByFile.has(current)) continue;
    reachable.add(current);

    for (const { target } of extractLocalMarkdownLinks(textByFile.get(current))) {
      const resolved = await markdownTarget(root, current, target);
      if (resolved.markdown && textByFile.has(resolved.markdown) && !reachable.has(resolved.markdown)) {
        pending.push(resolved.markdown);
      }
    }
  }

  return [...reachable].sort();
}

function budgetFor(relativeFile, budgets) {
  if (path.posix.basename(relativeFile) === 'AGENTS.md') return { kind: 'AGENTS', maximum: budgets.agents };
  if (
    (relativeFile.startsWith('docs/') || relativeFile.startsWith('tasks/')) &&
    path.posix.basename(relativeFile) === 'README.md'
  ) {
    return { kind: 'index', maximum: budgets.index };
  }
  return null;
}

export async function validateDocs({
  root = process.cwd(),
  docRoots = DEFAULT_DOC_ROOTS,
  budgets = DEFAULT_WORD_BUDGETS,
} = {}) {
  const resolvedRoot = path.resolve(root);
  const files = await listMarkdownFiles(resolvedRoot);
  const textByFile = new Map();
  const errors = [];

  for (const file of files) textByFile.set(file, await readFile(path.join(resolvedRoot, file), 'utf8'));

  for (const file of files) {
    const text = textByFile.get(file);
    const budget = budgetFor(file, budgets);
    if (budget && countWords(text) > budget.maximum) {
      errors.push({
        code: 'WORD_BUDGET_EXCEEDED',
        file,
        message: `${budget.kind} file has ${countWords(text)} words; maximum is ${budget.maximum}.`,
      });
    }

    for (const link of extractLocalMarkdownLinks(text)) {
      const target = await markdownTarget(resolvedRoot, file, link.target);
      if (target.escaped) {
        errors.push({
          code: 'LINK_ESCAPES_REPOSITORY',
          file,
          line: link.line,
          message: `Local link escapes the repository: ${link.target}`,
        });
      } else if (target.missing) {
        errors.push({
          code: 'BROKEN_LOCAL_LINK',
          file,
          line: link.line,
          message: `Local target does not exist: ${link.target}`,
        });
      }
    }
  }

  const reachability = [];
  for (const { index, scope } of docRoots) {
    if (!textByFile.has(index)) {
      errors.push({ code: 'MISSING_INDEX', file: index, message: `Required Markdown index is missing for ${scope}/.` });
      reachability.push({ index, scope, reachable: [] });
      continue;
    }

    const reachable = await collectReachableMarkdown(resolvedRoot, index, textByFile);
    reachability.push({ index, scope, reachable });
    const scopedFiles = files.filter((file) => file === `${scope}/README.md` || file.startsWith(`${scope}/`));
    for (const file of scopedFiles) {
      if (!reachable.includes(file)) {
        errors.push({
          code: 'UNREACHABLE_MARKDOWN',
          file,
          message: `${file} is not recursively reachable from ${index}.`,
        });
      }
    }
  }

  errors.sort((left, right) =>
    `${left.file}:${left.line ?? 0}:${left.code}`.localeCompare(`${right.file}:${right.line ?? 0}:${right.code}`),
  );
  return { ok: errors.length === 0, files, reachability, errors };
}

async function main() {
  const rootIndex = process.argv.indexOf('--root');
  const root = rootIndex >= 0 ? process.argv[rootIndex + 1] : process.cwd();
  const result = await validateDocs({ root });

  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (result.ok) {
    process.stdout.write(`Documentation check passed (${result.files.length} Markdown files).\n`);
  } else {
    process.stderr.write(`Documentation check failed with ${result.errors.length} issue(s):\n`);
    for (const error of result.errors) {
      process.stderr.write(`- ${error.file}${error.line ? `:${error.line}` : ''} [${error.code}] ${error.message}\n`);
    }
  }

  if (!result.ok) process.exitCode = 1;
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedFile === fileURLToPath(import.meta.url)) await main();
