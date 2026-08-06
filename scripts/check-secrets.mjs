import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const MAX_TEXT_SIZE = 2 * 1024 * 1024;
const RULES = [
  {
    id: 'private-key',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    id: 'github-token',
    pattern: /\b(?:gh[opusr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/g,
  },
  {
    id: 'literal-test-password',
    pattern: /\b(?:TEST_PASSWORD|SHARED_OWNER_PASSWORD)\s*=\s*["'][^"'\n]+["']/g,
  },
  {
    id: 'documented-password',
    pattern: /\bpassword\s*:\s*[`"'][^`"'\n]+[`"']/gi,
    markdownOnly: true,
  },
  {
    id: 'service-account-key',
    pattern: /["']private_key["']\s*:\s*["'][^"'\n]+/g,
  },
];

function lineAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

function looksBinary(buffer) {
  return buffer.subarray(0, 8000).includes(0);
}

export async function scanSecrets(root = process.cwd()) {
  const { stdout } = await execFileAsync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: root,
    encoding: 'buffer',
    maxBuffer: 20 * 1024 * 1024,
  });
  const files = stdout.toString('utf8').split('\0').filter(Boolean).sort();
  const findings = [];
  for (const file of files) {
    let buffer;
    try {
      buffer = await readFile(path.join(root, file));
    } catch {
      continue;
    }
    if (buffer.length > MAX_TEXT_SIZE || looksBinary(buffer)) continue;
    const text = buffer.toString('utf8');
    for (const rule of RULES) {
      if (rule.markdownOnly && !file.endsWith('.md')) continue;
      for (const match of text.matchAll(rule.pattern)) {
        findings.push({ file, line: lineAt(text, match.index), rule: rule.id });
      }
    }
  }
  return findings;
}

const findings = await scanSecrets();
console.log(JSON.stringify({ ok: findings.length === 0, findings }, null, 2));
if (findings.length > 0) process.exitCode = 1;
