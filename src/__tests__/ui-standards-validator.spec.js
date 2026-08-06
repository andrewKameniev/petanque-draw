import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import { scanUiStandards } from '../../scripts/check-ui-standards.mjs';

const roots = [];
const execFileAsync = promisify(execFile);
const validatorCli = path.resolve(process.cwd(), 'scripts/check-ui-standards.mjs');

function fixtureConfig() {
  return {
    schemaVersion: 2,
    fileGroups: {
      templates: { files: ['src/components/ui/Fixture.vue'] },
      scripts: { files: ['src/components/ui/Fixture.vue'] },
      styles: { files: ['src/components/ui/Fixture.vue'] },
      e2e: { files: ['e2e/fixture.spec.js'] },
    },
    ruleScopes: {
      'button-type': ['templates'],
      'button-name': ['templates'],
      'no-interactive-generic-element': ['templates'],
      'no-english-accessible-default': ['scripts'],
      'no-outline-suppression': ['styles'],
      'no-raw-color': ['styles'],
      'undocumented-global-style': ['styles'],
      'global-selector-leakage': ['styles'],
      'no-private-vue-runtime': ['e2e'],
      'no-arbitrary-sleep': ['e2e'],
      'no-disabled-required-test': ['e2e'],
    },
  };
}

async function createFixture(vueSource, e2eSource = '') {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ui-standards-'));
  roots.push(root);
  await mkdir(path.join(root, 'src/components/ui'), { recursive: true });
  await mkdir(path.join(root, 'e2e'), { recursive: true });
  await writeFile(path.join(root, 'src/components/ui/Fixture.vue'), vueSource);
  await writeFile(path.join(root, 'e2e/fixture.spec.js'), e2eSource);
  return root;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('UI standards validator', () => {
  it('parses multiline dynamic button attributes and accessible content without false positives', async () => {
    const root = await createFixture(`
      <template>
        <button
          :type="buttonType"
          :aria-label="label"
          @click="go"
        >
          <Icon aria-hidden="true" />
        </button>
        <button :type="'button'">
          <span>{{ label }}</span>
        </button>
      </template>
      <script>
      export default {
        props: {
          buttonType: { type: String, default: 'button' },
          label: { type: String, required: true },
        },
        methods: { go() {} },
      };
      </script>
      <style scoped>
      button { color: var(--color-text, #fff); }
      </style>
    `);

    await expect(scanUiStandards({ root, config: fixtureConfig() })).resolves.toEqual([]);
  });

  it('reports AST-detected template, script, style, and E2E violations', async () => {
    const root = await createFixture(
      `
        <template>
          <div
            role="button"
            @click="go"
          >Open</div>
          <button
            @click="go"
          ><Icon aria-hidden="true" /></button>
        </template>
        <script>
        export default {
          props: {
            label: {
              type: String,
              default: 'Loading results',
            },
          },
        };
        </script>
        <style>
        .outside {
          color: rgb(1 2 3);
          outline: none;
        }
        </style>
      `,
      `
        test.skip('legacy', async ({ page }) => {
          document.querySelector('#app').__vue_app__;
          await page.waitForTimeout(100);
        });
      `,
    );
    const violations = await scanUiStandards({ root, config: fixtureConfig() });
    expect(violations.map(({ rule }) => rule)).toEqual(
      expect.arrayContaining([
        'no-interactive-generic-element',
        'button-type',
        'button-name',
        'no-english-accessible-default',
        'no-outline-suppression',
        'no-raw-color',
        'undocumented-global-style',
        'no-private-vue-runtime',
        'no-arbitrary-sleep',
        'no-disabled-required-test',
      ]),
    );
  });

  it('exits nonzero when the CLI reports a standards violation', async () => {
    const root = await createFixture('<template><button>Open</button></template>');
    await mkdir(path.join(root, 'config'), { recursive: true });
    await writeFile(path.join(root, 'config/ui-standards.json'), JSON.stringify(fixtureConfig()));

    let failure;
    try {
      await execFileAsync(process.execPath, [validatorCli], { cwd: root });
    } catch (error) {
      failure = error;
    }

    expect(failure?.code).toBe(1);
    expect(failure?.stdout).toContain('"ok": false');
    expect(failure?.stdout).toContain('"rule": "button-type"');
  });

  it('enforces each rule only inside its declared file groups', async () => {
    const root = await createFixture(`
      <template><button><Icon aria-hidden="true" /></button></template>
      <style scoped>.fixture { color: #fff; }</style>
    `);
    await mkdir(path.join(root, 'src/views'), { recursive: true });
    await writeFile(
      path.join(root, 'src/views/StyleOnly.vue'),
      '<template><button><Icon /></button></template><style scoped>.style-only { color: #000; }</style>',
    );
    const config = {
      fileGroups: {
        templates: { files: ['src/components/ui/Fixture.vue'] },
        styles: { files: ['src/views/StyleOnly.vue'] },
      },
      ruleScopes: {
        'button-type': ['templates'],
        'no-raw-color': ['styles'],
      },
    };

    const violations = await scanUiStandards({ root, config });
    expect(violations).toEqual([
      expect.objectContaining({ file: 'src/components/ui/Fixture.vue', rule: 'button-type' }),
      expect.objectContaining({ file: 'src/views/StyleOnly.vue', rule: 'no-raw-color' }),
    ]);
  });

  it('accepts token fallbacks and BEM descendants of a documented global namespace', async () => {
    const root = await createFixture(`
      <template><div class="fixture">Safe</div></template>
      <style>
      .fixture,
      .fixture--active,
      [data-theme='dark'] .fixture__label {
        color: var(--color-text, #fff);
      }
      </style>
    `);
    const config = fixtureConfig();
    config.globalStyleNamespaces = { 'src/components/ui/Fixture.vue': '.fixture' };
    await expect(scanUiStandards({ root, config })).resolves.toEqual([]);
  });

  it('rejects incomplete, expired, broad, or stale standards waivers', async () => {
    const root = await createFixture('<template><div>Fixture</div></template>');
    await mkdir(path.join(root, 'config'), { recursive: true });
    await writeFile(
      path.join(root, 'config/allowlist.json'),
      JSON.stringify({
        entries: [
          {
            file: 'e2e/*.spec.js',
            line: 0,
            rule: 'no-arbitrary-sleep',
            reason: 'Legacy fixture',
            owner: '',
            expires: '2000-01-01',
          },
        ],
      }),
    );
    const config = fixtureConfig();
    config.allowlistFile = 'config/allowlist.json';

    const violations = await scanUiStandards({ root, config });
    expect(violations.map(({ rule }) => rule)).toEqual(
      expect.arrayContaining(['invalid-allowlist', 'expired-allowlist', 'stale-allowlist']),
    );
  });

  it('keeps every changed TIR component and nav, loader, and scroll consumer in semantic scope', async () => {
    const config = JSON.parse(await readFile(path.join(process.cwd(), 'config/ui-standards.json'), 'utf8'));
    const semanticGroup = config.fileGroups.task11AffectedTemplates;
    expect(semanticGroup.directories).toContain('src/components/ui');
    expect(semanticGroup.files).toEqual(
      expect.arrayContaining([
        'src/components/Draw.vue',
        'src/components/Tournament.vue',
        'src/components/partials/Protocol.vue',
        'src/components/partials/RoundTimer.vue',
        'src/components/tir/TirAtelierView.vue',
        'src/components/tir/TirModule.vue',
        'src/components/tir/TirParticipantView.vue',
        'src/components/tir/TirParticipantsList.vue',
        'src/components/tir/TirPlayoffComparison.vue',
        'src/components/tir/TirPlayoffMatch.vue',
        'src/components/tir/TirPublicView.vue',
        'src/components/tir/TirScoringWorkspace.vue',
        'src/components/training/TrainingSession.vue',
        'src/views/Archived.vue',
        'src/views/Docs.vue',
        'src/views/Public.vue',
        'src/views/PublicStats.vue',
        'src/views/Training.vue',
      ]),
    );
    for (const rule of ['button-type', 'button-name', 'no-interactive-generic-element']) {
      expect(config.ruleScopes[rule]).toContain('task11AffectedTemplates');
    }
  });
});
