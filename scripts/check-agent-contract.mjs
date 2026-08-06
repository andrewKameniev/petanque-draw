import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const INCLUDE_PATTERN = /^\s*@([^\s#]+\.md)\s*$/gm;
const RULE_PATTERN = /\b[A-Z][A-Z0-9]*-\d{3}\b/g;
const NPM_RUN_PATTERN = /\bnpm run ([a-zA-Z0-9:_-]+)/g;
const LOCAL_LINK_PATTERN = /\]\((?!https?:|mailto:|#)([^)#]+)(?:#[^)]*)?\)/g;

function unique(values) {
  return [...new Set(values)];
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function insideRoot(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

async function loadJson(filename) {
  return JSON.parse(await readFile(filename, 'utf8'));
}

async function readText(filename, errors, code = 'READ_ERROR') {
  try {
    return await readFile(filename, 'utf8');
  } catch (error) {
    errors.push({ code, file: filename, message: error.message });
    return null;
  }
}

function referencedMarkdown(text) {
  const references = [];
  for (const match of text.matchAll(INCLUDE_PATTERN)) references.push(match[1]);
  for (const match of text.matchAll(LOCAL_LINK_PATTERN)) references.push(match[1]);
  return unique(references);
}

async function resolveEntryPoint(root, entryPoint, requiredRuleIds) {
  const errors = [];
  const resolved = [];
  const texts = new Map();
  const visiting = [];

  async function visit(relativeFile) {
    const normalized = toPosix(path.normalize(relativeFile));
    const absolute = path.resolve(root, normalized);
    if (!insideRoot(root, absolute)) {
      errors.push({
        code: 'ROOT_ESCAPE',
        file: normalized,
        message: 'Reference resolves outside the repository root.',
      });
      return;
    }
    if (visiting.includes(normalized)) {
      errors.push({
        code: 'CIRCULAR_REFERENCE',
        file: normalized,
        message: [...visiting.slice(visiting.indexOf(normalized)), normalized].join(' -> '),
      });
      return;
    }
    if (texts.has(normalized)) return;

    const text = await readText(absolute, errors, 'DANGLING_REFERENCE');
    if (text === null) return;
    texts.set(normalized, text);
    resolved.push(normalized);
    visiting.push(normalized);
    for (const reference of referencedMarkdown(text)) {
      const target = toPosix(path.join(path.dirname(normalized), reference));
      await visit(target);
    }
    visiting.pop();
  }

  await visit(entryPoint);
  const reachableRules = unique([...texts.values()].flatMap((text) => text.match(RULE_PATTERN) ?? [])).sort();
  for (const ruleId of requiredRuleIds) {
    if (!reachableRules.includes(ruleId)) {
      errors.push({ code: 'MISSING_RULE', file: entryPoint, message: `Required rule ${ruleId} is not reachable.` });
    }
  }

  return {
    entryPoint,
    resolvedFiles: resolved.sort(),
    requiredRuleIds,
    errors,
    texts,
  };
}

export async function discoverAgentEntryPoints(root, startDirectory) {
  const resolvedRoot = await realpath(root);
  let current = path.resolve(resolvedRoot, startDirectory);
  if (!insideRoot(resolvedRoot, current)) throw new Error('Start directory is outside the repository root.');

  const directories = [];
  while (insideRoot(resolvedRoot, current)) {
    directories.push(current);
    if (current === resolvedRoot) break;
    current = path.dirname(current);
  }

  const found = [];
  for (const directory of directories.reverse()) {
    const relative = toPosix(path.relative(resolvedRoot, path.join(directory, 'AGENTS.md')));
    try {
      await readFile(path.join(resolvedRoot, relative), 'utf8');
      found.push(relative);
    } catch {
      // A directory without scoped instructions is expected.
    }
  }
  return found;
}

export async function validateAgentContract({ root = process.cwd(), configFile = 'config/agent-contract.json' } = {}) {
  const resolvedRoot = await realpath(root);
  const config = await loadJson(path.resolve(resolvedRoot, configFile));
  const sharedErrors = [];

  for (const requiredFile of config.requiredFiles) {
    await readText(path.resolve(resolvedRoot, requiredFile), sharedErrors, 'MISSING_REQUIRED_FILE');
  }

  const packageJson = await loadJson(path.resolve(resolvedRoot, 'package.json'));
  for (const documentedFile of config.documentedCommandFiles) {
    const text = await readText(path.resolve(resolvedRoot, documentedFile), sharedErrors, 'MISSING_COMMAND_DOC');
    if (text === null) continue;
    for (const match of text.matchAll(NPM_RUN_PATTERN)) {
      if (!packageJson.scripts?.[match[1]]) {
        sharedErrors.push({
          code: 'UNKNOWN_PACKAGE_COMMAND',
          file: documentedFile,
          message: `Documented command npm run ${match[1]} is missing from package.json.`,
        });
      }
    }
  }

  const canonicalText = await readText(path.resolve(resolvedRoot, config.canonicalFile), sharedErrors);
  if (canonicalText !== null) {
    for (const section of config.requiredCanonicalSections) {
      if (!canonicalText.includes(`## ${section}`)) {
        sharedErrors.push({
          code: 'MISSING_SECTION',
          file: config.canonicalFile,
          message: `Missing section: ${section}`,
        });
      }
    }
  }

  const results = [];
  for (const entryPoint of config.entryPoints) {
    const result = await resolveEntryPoint(resolvedRoot, entryPoint, config.requiredRuleIds);
    if (!result.resolvedFiles.includes(config.canonicalFile)) {
      result.errors.push({
        code: 'CANONICAL_NOT_RESOLVED',
        file: entryPoint,
        message: `${entryPoint} does not resolve ${config.canonicalFile}.`,
      });
    }
    if (entryPoint === 'AGENTS.md') {
      const directText = result.texts.get(entryPoint) ?? '';
      for (const ruleId of config.requiredDirectAgentRuleIds) {
        if (!(directText.match(RULE_PATTERN) ?? []).includes(ruleId)) {
          result.errors.push({
            code: 'MISSING_DIRECT_AGENT_RULE',
            file: entryPoint,
            message: `${ruleId} must be stated directly in AGENTS.md.`,
          });
        }
      }
    }
    result.errors.unshift(...sharedErrors);
    delete result.texts;
    results.push(result);
  }
  return results;
}

async function main() {
  const rootIndex = process.argv.indexOf('--root');
  const root = rootIndex >= 0 ? process.argv[rootIndex + 1] : process.cwd();
  const results = await validateAgentContract({ root });
  console.log(JSON.stringify(results, null, 2));
  if (results.some(({ errors }) => errors.length > 0)) process.exitCode = 1;
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedFile === fileURLToPath(import.meta.url)) await main();
