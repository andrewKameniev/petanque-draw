import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { discoverAgentEntryPoints, validateAgentContract } from '../../scripts/check-agent-contract.mjs';

const temporaryRoots = [];
const rules = [
  'AUTH-001',
  'WORKTREE-001',
  'EXTERNAL-001',
  'BASELINE-001',
  'VUE-001',
  'A11Y-001',
  'I18N-001',
  'TEST-001',
  'FIREBASE-001',
  'SECRETS-001',
  'CI-001',
];

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'agent-contract-'));
  temporaryRoots.push(root);
  await mkdir(path.join(root, 'config'), { recursive: true });
  await writeFile(
    path.join(root, 'config/agent-contract.json'),
    JSON.stringify({
      schemaVersion: 1,
      canonicalFile: 'RTK.md',
      entryPoints: ['AGENTS.md', 'CLAUDE.md'],
      documentedCommandFiles: ['CLAUDE.md'],
      requiredFiles: ['AGENTS.md', 'RTK.md', 'CLAUDE.md'],
      requiredRuleIds: rules,
      requiredDirectAgentRuleIds: rules.slice(0, 3),
      requiredCanonicalSections: ['Contract'],
    }),
  );
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { verify: 'node verify.mjs' } }));
  await writeFile(path.join(root, 'RTK.md'), `# Shared\n\n## Contract\n\n${rules.join(' ')}`);
  await writeFile(path.join(root, 'AGENTS.md'), `# Agent\n\n@RTK.md\n\n${rules.slice(0, 3).join(' ')}`);
  await writeFile(path.join(root, 'CLAUDE.md'), '# Claude\n\n@RTK.md\n\n```bash\nnpm run verify\n```');
  return root;
}

afterEach(async () => {
  const { rm } = await import('node:fs/promises');
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('agent contract validator', () => {
  it('validates the repository contract and emits the required result shape', async () => {
    const results = await validateAgentContract();
    expect(results).toHaveLength(2);
    expect(results.every(({ errors }) => errors.length === 0)).toBe(true);
    expect(results[0]).toEqual(
      expect.objectContaining({
        entryPoint: 'AGENTS.md',
        resolvedFiles: expect.arrayContaining(['AGENTS.md', 'RTK.md']),
        requiredRuleIds: expect.arrayContaining(rules),
        errors: [],
      }),
    );
  });

  it('resolves root and closest nested AGENTS files in precedence order', async () => {
    const root = await fixture();
    await mkdir(path.join(root, 'nested/deeper'), { recursive: true });
    await writeFile(path.join(root, 'nested/AGENTS.md'), '# Scoped instructions');
    await expect(discoverAgentEntryPoints(root, 'nested/deeper')).resolves.toEqual(['AGENTS.md', 'nested/AGENTS.md']);
  });

  it('rejects dangling and circular imports', async () => {
    const root = await fixture();
    await writeFile(path.join(root, 'AGENTS.md'), '# Agent\n\n@missing.md');
    let results = await validateAgentContract({ root });
    expect(results[0].errors.map(({ code }) => code)).toContain('DANGLING_REFERENCE');

    await writeFile(path.join(root, 'AGENTS.md'), '# Agent\n\n@RTK.md');
    await writeFile(path.join(root, 'RTK.md'), `# Shared\n\n## Contract\n\n@AGENTS.md\n\n${rules.join(' ')}`);
    results = await validateAgentContract({ root });
    expect(results[0].errors.map(({ code }) => code)).toContain('CIRCULAR_REFERENCE');
  });

  it('rejects missing rules and undocumented package commands', async () => {
    const root = await fixture();
    const canonical = await readFile(path.join(root, 'RTK.md'), 'utf8');
    await writeFile(path.join(root, 'RTK.md'), canonical.replace('A11Y-001', ''));
    await writeFile(path.join(root, 'CLAUDE.md'), '# Claude\n\n@RTK.md\n\nnpm run missing');
    const results = await validateAgentContract({ root });
    const codes = results.flatMap(({ errors }) => errors.map(({ code }) => code));
    expect(codes).toContain('MISSING_RULE');
    expect(codes).toContain('UNKNOWN_PACKAGE_COMMAND');
  });
});
