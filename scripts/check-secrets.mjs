import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const MAX_TEXT_SIZE = 2 * 1024 * 1024;

export const SECRET_RULES = Object.freeze([
  {
    id: 'private-key',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY(?: BLOCK)?-----/g,
  },
  {
    id: 'github-token',
    pattern: /\b(?:gh[opusr]_[A-Za-z\d_]{30,}|github_pat_[A-Za-z\d_]{30,})\b/g,
  },
  {
    id: 'slack-token',
    pattern: /\bxox[baprs]-[A-Za-z\d-]{20,}\b/g,
  },
  {
    id: 'aws-access-key',
    pattern: /\b(?:AKIA|ASIA)[A-Z\d]{16}\b/g,
  },
  {
    id: 'literal-test-password',
    pattern: /\b(?:TEST_PASSWORD|SHARED_OWNER_PASSWORD|E2E_PASSWORD)\s*(?:=|:)\s*["'][^"'\n]+["']/g,
  },
  {
    id: 'documented-password',
    pattern: /\b(?:password|password value)\s*:\s*[`"'][^`"'\n]+[`"']/gi,
    markdownOnly: true,
  },
  {
    id: 'service-account-key',
    pattern: /["']private_key["']\s*:\s*["'][^"'\n]+/g,
  },
  {
    id: 'credentialed-url',
    pattern: /\bhttps?:\/\/[^\s/:@]+:[^\s/@]+@[^\s/]+/gi,
  },
]);

function lineAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

function looksBinary(buffer) {
  return buffer.subarray(0, 8000).includes(0);
}

function isMarkdown(file) {
  return file.toLowerCase().endsWith('.md');
}

function isRealEnvironmentFile(file) {
  const name = path.basename(file).toLowerCase();
  const isEnvironmentFile = name === '.env' || name.startsWith('.env.') || name.endsWith('.env');
  const isTemplate = /(?:^|[._-])(?:example|sample|template)(?:$|[._-])/.test(name);
  return isEnvironmentFile && !isTemplate;
}

function looksLikePlaceholder(value) {
  const normalized = value.trim().replace(/^['"]|['"]$/g, '');
  return (
    !normalized ||
    normalized.startsWith('${') ||
    normalized.startsWith('$') ||
    /^(?:change-me|changeme|example|placeholder|replace-me|todo|your[_-])/i.test(normalized)
  );
}

function scanEnvironmentAssignments(file, text) {
  if (!isRealEnvironmentFile(file)) return [];
  const findings = [];
  const assignment =
    /^\s*(?:export\s+)?((?:[A-Z][A-Z\d]*_)*(?:PRIVATE_KEY|API_KEY|PASSWORD|SECRET|TOKEN)(?:_[A-Z\d]+)*)\s*=\s*(.*?)\s*$/gm;
  for (const match of text.matchAll(assignment)) {
    if (!looksLikePlaceholder(match[2])) {
      findings.push({ file, line: lineAt(text, match.index), rule: 'literal-env-secret' });
    }
  }
  return findings;
}

export function scanTextForSecrets(file, text, rules = SECRET_RULES) {
  const findings = [];
  for (const rule of rules) {
    if (rule.markdownOnly && !isMarkdown(file)) continue;
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    for (const match of text.matchAll(pattern)) {
      findings.push({ file, line: lineAt(text, match.index), rule: rule.id });
    }
  }
  findings.push(...scanEnvironmentAssignments(file, text));
  return findings.sort((left, right) => left.line - right.line || left.rule.localeCompare(right.rule));
}

async function repositoryFiles(root) {
  const { stdout } = await execFileAsync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: root,
    encoding: 'buffer',
    maxBuffer: 20 * 1024 * 1024,
  });
  return stdout.toString('utf8').split('\0').filter(Boolean).sort();
}

export async function scanSecrets({ root = process.cwd(), files } = {}) {
  const resolvedRoot = path.resolve(root);
  const candidates = files ?? (await repositoryFiles(resolvedRoot));
  const findings = [];

  for (const file of candidates) {
    let buffer;
    try {
      buffer = await readFile(path.join(resolvedRoot, file));
    } catch {
      continue;
    }
    if (buffer.length > MAX_TEXT_SIZE || looksBinary(buffer)) continue;
    findings.push(...scanTextForSecrets(file, buffer.toString('utf8')));
  }

  findings.sort((left, right) =>
    `${left.file}:${left.line}:${left.rule}`.localeCompare(`${right.file}:${right.line}:${right.rule}`),
  );
  return findings;
}

async function main() {
  const rootIndex = process.argv.indexOf('--root');
  const root = rootIndex >= 0 ? process.argv[rootIndex + 1] : process.cwd();
  const findings = await scanSecrets({ root });
  const result = { ok: findings.length === 0, findings };

  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (result.ok) {
    process.stdout.write('Secret scan passed.\n');
  } else {
    process.stderr.write(`Secret scan failed with ${findings.length} finding(s); values are intentionally redacted:\n`);
    for (const finding of findings) {
      process.stderr.write(`- ${finding.file}:${finding.line} [${finding.rule}]\n`);
    }
  }

  if (!result.ok) process.exitCode = 1;
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedFile === fileURLToPath(import.meta.url)) await main();
