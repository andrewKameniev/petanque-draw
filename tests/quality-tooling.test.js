import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { afterEach, describe, expect, it } from 'vitest';

import { countWords, extractLocalMarkdownLinks, validateDocs } from '../scripts/check-docs.mjs';
import {
  analyzeQualityDiff,
  createSyntheticAddedFileDiff,
  inspectAddedLines,
  loadQualityDiff,
  parseNameStatus,
  parseUnifiedDiff,
} from '../scripts/check-quality-diff.mjs';
import { formatImpacts, impactsForFiles, parseDocsImpactArgs } from '../scripts/docs-impact.mjs';
import { scanTextForSecrets } from '../scripts/check-secrets.mjs';

const temporaryDirectories = [];
const execFileAsync = promisify(execFile);

async function fixture(files) {
  const root = await mkdtemp(path.join(tmpdir(), 'petanque-quality-'));
  temporaryDirectories.push(root);
  for (const [file, content] of Object.entries(files)) {
    const filename = path.join(root, file);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, content);
  }
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('documentation quality tooling', () => {
  it('extracts local links while ignoring external links and fenced examples', () => {
    const text = [
      '[Local](./local.md)',
      '[External](https://example.com)',
      '[Anchor](#section)',
      '```md',
      '[Example](./not-real.md)',
      '```',
      '[Reference]: nested/reference.md',
    ].join('\n');

    expect(extractLocalMarkdownLinks(text)).toEqual([
      { target: './local.md', line: 1 },
      { target: 'nested/reference.md', line: 7 },
    ]);
    expect(countWords(' one\n two   three ')).toBe(3);
  });

  it('validates recursive indexes and local Markdown links', async () => {
    const root = await fixture({
      'AGENTS.md': 'Lean repository rules.\n',
      'docs/README.md': '# Docs\n\n- [Systems](./systems/README.md)\n',
      'docs/systems/README.md': '# Systems\n\n- [TIR](./tir.md)\n',
      'docs/systems/tir.md': '# TIR\n',
      'tasks/README.md': '# Tasks\n\n- [Current](./current.md)\n',
      'tasks/current.md': '# Current task\n',
    });

    const result = await validateDocs({ root });

    expect(result.ok).toBe(true);
    expect(result.reachability.find(({ scope }) => scope === 'docs').reachable).toEqual([
      'docs/README.md',
      'docs/systems/README.md',
      'docs/systems/tir.md',
    ]);
  });

  it('reports broken, unreachable, and oversized index files', async () => {
    const root = await fixture({
      'AGENTS.md': 'one two three four',
      'docs/README.md': '# Docs\n\n[Missing](./missing.md)\n',
      'docs/orphan.md': '# Orphan\n',
      'tasks/README.md': '# Tasks\n',
    });

    const result = await validateDocs({ root, budgets: { agents: 3, index: 100 } });
    const codes = result.errors.map(({ code }) => code);

    expect(codes).toContain('BROKEN_LOCAL_LINK');
    expect(codes).toContain('UNREACHABLE_MARKDOWN');
    expect(codes).toContain('WORD_BUDGET_EXCEEDED');
  });
});

describe('secret scanner', () => {
  it('detects credential forms without returning their values', () => {
    const githubToken = `ghp_${'a'.repeat(36)}`;
    const privateKey = ['-----BEGIN ', 'PRIVATE KEY-----'].join('');
    const documentedPassword = ['Password: `', 'sensitive-value', '`'].join('');
    const findings = [
      ...scanTextForSecrets('config.js', `const value = '${githubToken}';\n${privateKey}`),
      ...scanTextForSecrets('guide.md', documentedPassword),
    ];

    expect(findings.map(({ rule }) => rule).sort()).toEqual(['documented-password', 'github-token', 'private-key']);
    expect(JSON.stringify(findings)).not.toContain('sensitive-value');
    expect(JSON.stringify(findings)).not.toContain(githubToken);
  });

  it('allows environment references and explicit placeholders', () => {
    expect(scanTextForSecrets('config.js', 'const value = process.env.TEST_PASSWORD;')).toEqual([]);
    expect(scanTextForSecrets('.env', 'API_TOKEN=${API_TOKEN}\nPASSWORD=change-me\n')).toEqual([]);
  });

  it('detects bare sensitive keys in real dot-env and star-env files without exposing values', () => {
    const values = ['alpha-value', 'bravo-value', 'charlie-value', 'delta-value', 'echo-value'];
    const assignments = [
      `PASSWORD=${values[0]}`,
      `SECRET=${values[1]}`,
      `TOKEN=${values[2]}`,
      `PRIVATE_KEY=${values[3]}`,
      `API_KEY=${values[4]}`,
    ].join('\n');
    const findings = [
      ...scanTextForSecrets('.env.local', assignments),
      ...scanTextForSecrets('production.env', 'export PASSWORD=foxtrot-value'),
    ];

    expect(findings).toHaveLength(6);
    expect(findings.every(({ rule }) => rule === 'literal-env-secret')).toBe(true);
    for (const value of values) expect(JSON.stringify(findings)).not.toContain(value);
    expect(JSON.stringify(findings)).not.toContain('foxtrot-value');
  });

  it('allows bare-key placeholders and ignores environment templates', () => {
    const placeholders = [
      'PASSWORD=${PASSWORD}',
      'SECRET=$SECRET',
      'TOKEN=change-me',
      'PRIVATE_KEY=placeholder',
      'API_KEY=your_api_key',
    ].join('\n');

    expect(scanTextForSecrets('runtime.env', placeholders)).toEqual([]);
    expect(scanTextForSecrets('example.env', 'PASSWORD=literal-documentation-value')).toEqual([]);
    expect(scanTextForSecrets('.env.sample', 'TOKEN=literal-documentation-value')).toEqual([]);
  });
});

describe('differential quality guard', () => {
  const focusedTest = ['test', '.only("focused", () => {});'].join('');
  const diff = [
    'diff --git a/src/components/NewPanel.vue b/src/components/NewPanel.vue',
    'new file mode 100644',
    '--- /dev/null',
    '+++ b/src/components/NewPanel.vue',
    '@@ -0,0 +1,6 @@',
    "+import { ref } from 'firebase/database';",
    '+const accent = "#ff00aa";',
    `+${focusedTest}`,
    '+test.skip("temporarily unavailable", () => {});',
    '+console.log("covered by ESLint");',
    '+// eslint-disable-next-line no-alert',
  ].join('\n');

  it('parses added lines and finds architecture, style, and test violations', () => {
    const parsed = parseUnifiedDiff(diff);
    const findings = inspectAddedLines(parsed);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({ file: 'src/components/NewPanel.vue', status: 'A' });
    expect(findings.map(({ rule }) => rule)).toEqual(['firebase-in-ui', 'raw-color', 'focused-test']);
  });

  it('allows colors in token registries and leaves general lint policy to ESLint', () => {
    const files = [
      {
        file: 'src/assets/css/variables.css',
        status: 'M',
        addedLines: [{ line: 1, text: '--color-new: #abcdef;' }],
      },
      {
        file: 'tests/example.test.js',
        status: 'M',
        addedLines: [
          { line: 1, text: 'test.skip("tracked limitation", () => {});' },
          { line: 2, text: '// eslint-disable-next-line no-alert' },
        ],
      },
    ];

    expect(inspectAddedLines(files)).toEqual([]);
  });

  it('allows only adjacent, categorized color exceptions', () => {
    const files = [
      {
        file: 'src/components/BrandMark.vue',
        status: 'M',
        addedLines: [
          { line: 10, text: '<!-- quality-allow-color: brand federation artwork -->' },
          { line: 11, text: '<path fill="#005bbb" />' },
          { line: 20, text: '// quality-allow-color: canvas PDF export palette' },
          { line: 21, text: 'context.fillStyle = "rgb(1 2 3)";' },
          { line: 30, text: '/* quality-allow-color: visual preference */' },
          { line: 31, text: '.accent { color: #abcdef; }' },
        ],
      },
    ];

    expect(inspectAddedLines(files)).toEqual([
      expect.objectContaining({ file: 'src/components/BrandMark.vue', line: 31, rule: 'raw-color' }),
    ]);
  });

  it('rejects common named palette colors and raw fallbacks but permits semantic CSS keywords and tokens', () => {
    const files = [
      {
        file: 'src/components/Palette.vue',
        status: 'M',
        addedLines: [
          { line: 1, text: '.bad { color: red; background: white; }' },
          { line: 2, text: '<path fill="black" />' },
          { line: 3, text: '.semantic { color: currentColor; background: transparent; border-color: inherit; }' },
          { line: 4, text: '.token { color: var(--red); }' },
          { line: 5, text: '.fallback { color: var(--text-color, red); }' },
        ],
      },
    ];

    expect(inspectAddedLines(files).map(({ line, rule }) => ({ line, rule }))).toEqual([
      { line: 1, rule: 'raw-color' },
      { line: 2, rule: 'raw-color' },
      { line: 5, rule: 'raw-color' },
    ]);
  });

  it('detects bare side-effect Firebase imports in UI files', () => {
    const files = [
      {
        file: 'src/views/NewPublicView.vue',
        status: 'A',
        addedLines: [{ line: 1, text: "import 'firebase/database';" }],
      },
    ];

    expect(inspectAddedLines(files)).toEqual([
      expect.objectContaining({ file: 'src/views/NewPublicView.vue', line: 1, rule: 'firebase-in-ui' }),
    ]);
  });

  it('parses null-delimited Git status including renames', () => {
    expect(parseNameStatus('A\0new.js\0R100\0old.js\0renamed.js\0')).toEqual([
      { status: 'A', file: 'new.js' },
      { status: 'R', previousFile: 'old.js', file: 'renamed.js' },
    ]);
  });

  it('builds a parseable synthetic diff for untracked files', () => {
    const synthetic = createSyntheticAddedFileDiff('src/components/New.vue', '<style>\n.x { color: #123456; }\n');

    expect(parseUnifiedDiff(synthetic)[0]).toMatchObject({
      file: 'src/components/New.vue',
      status: 'A',
      addedLines: [
        { line: 1, text: '<style>' },
        { line: 2, text: '.x { color: #123456; }' },
      ],
    });
  });

  it('includes staged, unstaged, and untracked work when comparing with HEAD', async () => {
    const root = await fixture({
      'src/components/Tracked.vue': '<template><div>before</div></template>\n',
    });
    await execFileAsync('git', ['init', '-q'], { cwd: root });
    await execFileAsync('git', ['config', 'user.email', 'quality@example.invalid'], { cwd: root });
    await execFileAsync('git', ['config', 'user.name', 'Quality Test'], { cwd: root });
    await execFileAsync('git', ['add', '.'], { cwd: root });
    await execFileAsync('git', ['commit', '-qm', 'baseline'], { cwd: root });

    await writeFile(path.join(root, 'src/components/Tracked.vue'), '<template><div>staged</div></template>\n');
    await execFileAsync('git', ['add', 'src/components/Tracked.vue'], { cwd: root });
    await writeFile(path.join(root, 'src/components/Tracked.vue'), '<template><div>after</div></template>\n');
    await writeFile(
      path.join(root, 'src/components/Untracked.vue'),
      '<script>\nimport { ref } from "firebase/database";\n</script>\n<style>.x { color: #123456; }</style>\n',
    );

    const input = await loadQualityDiff({ root, base: 'HEAD' });
    const findings = analyzeQualityDiff(input);

    expect(input.changes).toEqual([
      { status: 'M', file: 'src/components/Tracked.vue' },
      { status: 'A', file: 'src/components/Untracked.vue' },
    ]);
    expect(findings.map(({ rule }) => rule)).toEqual(['firebase-in-ui', 'raw-color']);
  });
});

describe('documentation impact routing', () => {
  it('returns deterministic, focused domain guidance', () => {
    const impacts = impactsForFiles([
      'src/components/tir/TirModule.vue',
      'src/services/tournament-sync.js',
      'src/components/ui/PageLoader.vue',
    ]);

    expect(impacts.map(({ id }) => id)).toEqual(['record-sync-archive', 'tir', 'ui-design-system']);
    expect(impacts.find(({ id }) => id === 'tir').docs).toContain('docs/systems/tir.md');
    expect(formatImpacts(impacts, 3)).toContain('Suggested checks:');
  });

  it('accepts positional paths and explicit file lists from npm run', () => {
    expect(
      parseDocsImpactArgs([
        'src/services/tir.js',
        '--files=src/views/Public.vue,src/services/tir.js',
        '--base',
        'origin/develop',
        '--json',
      ]),
    ).toEqual({
      files: ['src/services/tir.js', 'src/views/Public.vue'],
      base: 'origin/develop',
      json: true,
    });
  });

  it('routes team replacement to its focused service and mounted contracts', () => {
    const impacts = impactsForFiles([
      'src/services/team-replacement.js',
      'src/components/partials/TeamReplacementPanel.vue',
    ]);

    expect(impacts.map(({ id }) => id)).toEqual(['team-replacement']);
    expect(impacts[0].docs).toContain('docs/code-quality/recent-refactors.md');
    expect(impacts[0].commands[0]).toContain('tests/team-replacement.test.js');
    expect(impacts[0].commands[0]).toContain('src/__tests__/team-replacement-panel.mounted.spec.js');
  });

  it('provides low-noise progressive routes for otherwise unknown layers', () => {
    const impacts = impactsForFiles([
      'src/components/feature/NewWidget.vue',
      'src/views/NewRoute.vue',
      'src/theme/new.css',
      'src/services/new-domain.js',
      'src/stores/new-store.js',
      'tests/new-domain.test.js',
      'src/__tests__/new-widget.mounted.spec.js',
      'e2e/new-flow.spec.js',
      'scripts/new-tool.mjs',
    ]);

    expect(impacts.map(({ id }) => id)).toEqual([
      'component-view-style',
      'e2e',
      'quality-tooling',
      'service-layer',
      'store-layer',
      'unit-mounted-tests',
    ]);
    expect(impacts.find(({ id }) => id === 'component-view-style').commands[0]).toContain('npx vitest related');
    expect(impacts.find(({ id }) => id === 'service-layer').docs).toContain(
      'docs/code-quality/services-and-constants.md',
    );
    expect(impacts.find(({ id }) => id === 'store-layer').docs).toContain('docs/main-store-architecture.md');
    expect(impacts.find(({ id }) => id === 'unit-mounted-tests').commands[0]).toContain(
      'src/__tests__/new-widget.mounted.spec.js',
    );
    expect(impacts.find(({ id }) => id === 'e2e').commands).toEqual(['npx playwright test e2e/new-flow.spec.js']);
    expect(impacts.find(({ id }) => id === 'quality-tooling').commands).toContain('npm run test:quality');

    const harnessImpact = impactsForFiles(['e2e/helpers.js', 'e2e/new-flow.spec.js']).find(({ id }) => id === 'e2e');
    expect(harnessImpact.commands).toEqual(['npm run e2e']);
  });
});
