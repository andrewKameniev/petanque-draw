import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadQualityDiff } from './check-quality-diff.mjs';

const QUALITY_INDEX = 'docs/code-quality/README.md';

export const IMPACT_RULES = Object.freeze([
  {
    id: 'firebase-access',
    matches: (file) => file === 'database.rules.json' || file === 'firebase.json' || file === 'src/firebase.js',
    docs: ['docs/firebase.md', 'docs/data-model.md', QUALITY_INDEX],
    commands: ['npm run test:run', 'npm run build'],
    review:
      'Test authorization and persisted paths with emulators; never validate writes against shared/production data.',
  },
  {
    id: 'localization',
    matches: (file) => file.startsWith('src/locales/') || file === 'src/i18n.js',
    docs: ['docs/README.md', QUALITY_INDEX],
    commands: ['npm run test:run', 'npm run build'],
    review: 'Keep English, Ukrainian, French, and Spanish keys in parity and exercise the affected rendered state.',
  },
  {
    id: 'portal-protocol',
    matches: (file) =>
      /^(?:src\/services\/(?:portal|portal-sync|protocol|arbiter)|src\/protocol-helpers|src\/components\/(?:partials\/Protocol|tir\/TirProtocol))/.test(
        file,
      ),
    docs: ['docs/data-model.md', 'docs/deployment.md', QUALITY_INDEX],
    commands: ['npm run test:protocol', 'npm run test:run'],
    review:
      'Use deterministic portal fixtures, preserve ambiguity handling, and keep network/persistence outside UI components.',
  },
  {
    id: 'quality-tooling',
    matches: (file) =>
      file === 'package.json' ||
      file.startsWith('.github/workflows/') ||
      file.startsWith('scripts/') ||
      file === 'tests/quality-tooling.test.js',
    docs: [QUALITY_INDEX, 'docs/code-quality/documentation.md', 'docs/code-quality/testing.md'],
    commands: ['npm run test:quality', 'npm run docs:check', 'npm run quality:diff'],
    review:
      'Keep checks dependency-free, deterministic, redacted, merge-base aware, and covered by focused tooling tests.',
  },
  {
    id: 'public-tv',
    matches: (file) =>
      /^(?:src\/views\/(?:Public|TvDashboard)|src\/services\/(?:live-tournament|tournament-presentation|tournament-ref)|src\/components\/partials\/PublicGameCard)/.test(
        file,
      ),
    docs: ['docs/architecture.md', 'docs/data-model.md', QUALITY_INDEX],
    commands: [
      'npx vitest run src/__tests__/live-tournament.spec.js src/__tests__/presentation-parity.spec.js src/__tests__/public-game-card.spec.js',
      'npx playwright test e2e/public-live.spec.js e2e/public-match-card.spec.js',
    ],
    review: 'Cover every subscription state and prove parity across Public/TV/Archived consumers.',
  },
  {
    id: 'ranking-draw',
    matches: (file) =>
      /^(?:src\/(?:helpers\.js|services\/(?:draw|group-ranking|results|playoff)\.js)|tests\/(?:draw|group-ranking|helpers|playoff|ranking|results))/.test(
        file,
      ),
    docs: ['docs/ranking-algorithms.md', 'docs/tournament-systems.md', QUALITY_INDEX],
    commands: [
      'npx vitest run tests/draw.test.js tests/group-ranking.test.js tests/helpers.test.js tests/playoff.test.js tests/ranking.test.js',
      'npx playwright test e2e/swiss.spec.js e2e/groups.spec.js e2e/poules-barrage.spec.js',
    ],
    review:
      'Exercise null/string scores, incomplete games, byes, boundary sizes, and every affected tournament system.',
  },
  {
    id: 'record-sync-archive',
    matches: (file) =>
      /^(?:src\/stores\/main\.js|src\/services\/(?:archive-collaboration|archive-index|round-timer|tournament-record|tournament-sync)\.js|src\/views\/Archived\.vue)/.test(
        file,
      ),
    docs: ['docs/data-model.md', 'docs/main-store-architecture.md', 'docs/firebase.md', QUALITY_INDEX],
    commands: [
      'npx vitest run tests/archive-collaboration.test.js tests/tournament-record.test.js tests/tournament-sync.test.js src/__tests__/main-store-characterization.spec.js',
      'npx playwright test e2e/tournament-record.spec.js e2e/archived-layout.spec.js',
    ],
    review: 'Cover envelope/legacy, owned/shared, Group A/B, cleanup, rollback, and exact Firebase paths.',
  },
  {
    id: 'team-replacement',
    matches: (file) =>
      file === 'src/services/team-replacement.js' ||
      file === 'src/components/partials/TeamReplacementPanel.vue' ||
      file === 'tests/team-replacement.test.js' ||
      file === 'src/__tests__/team-replacement-panel.mounted.spec.js',
    docs: [
      'docs/data-model.md',
      'docs/main-store-architecture.md',
      'docs/code-quality/recent-refactors.md',
      QUALITY_INDEX,
    ],
    commands: [
      'npx vitest run tests/team-replacement.test.js src/__tests__/team-replacement-panel.mounted.spec.js src/__tests__/main-store-characterization.spec.js tests/tournament-sync.test.js',
      'npm run build',
    ],
    review:
      'Preserve results/statistics, reject identity collisions, keep the multi-path write atomic, and prove local rollback on failure.',
  },
  {
    id: 'tir',
    matches: (file) =>
      /^(?:src\/(?:components\/tir|services\/tir(?:-export)?\.js)|tests\/tir|e2e\/tir\.spec\.js)/.test(file),
    docs: ['docs/systems/tir.md', 'docs/data-model.md', QUALITY_INDEX],
    commands: [
      'npx vitest run tests/tir.test.js tests/tir-playoff-progress.test.js src/__tests__/tir-domain-consistency.spec.js src/__tests__/tir-score-editors.spec.js',
      'npx playwright test e2e/tir.spec.js',
    ],
    review:
      'Keep scoring/playoff rules in pure services and cover non-power-of-two fields, ties, old data, and admin/public parity.',
  },
  {
    id: 'ui-design-system',
    matches: (file) => file.startsWith('src/components/ui/') || file.startsWith('src/assets/css/'),
    docs: [QUALITY_INDEX],
    commands: ['npx vitest run src/__tests__/ui-primitives.spec.js', 'npx playwright test e2e/ui-primitives.spec.js'],
    review: 'Reuse primitives, use design tokens, and verify keyboard, screen-reader, mobile, and light/dark behavior.',
  },
  {
    id: 'e2e',
    matches: (file) => file.startsWith('e2e/') || file === 'playwright.config.js',
    docs: ['e2e/README.md', 'docs/e2e-testing.md', QUALITY_INDEX],
    commandsFor: (files) => {
      const specs = files.filter((file) => file.endsWith('.spec.js'));
      const harnessChanged = files.some(
        (file) =>
          file === 'playwright.config.js' ||
          (file.startsWith('e2e/') && file.endsWith('.js') && !file.endsWith('.spec.js')),
      );
      if (harnessChanged) return ['npm run e2e'];
      return specs.length > 0 ? [`npx playwright test ${specs.join(' ')}`] : ['npm run e2e'];
    },
    review: 'Use emulators/intercepted APIs, deterministic fixtures, and cleanup in finally blocks.',
  },
  {
    id: 'documentation',
    matches: (file) => file.endsWith('.md') || file.startsWith('docs/') || file.startsWith('tasks/'),
    docs: ['docs/README.md', 'tasks/README.md'],
    commands: ['npm run docs:check'],
    review: 'Keep canonical statements current, indexes recursively complete, and historical plans clearly labeled.',
  },
]);

const PROGRESSIVE_IMPACT_RULES = Object.freeze([
  {
    id: 'component-view-style',
    matches: (file) =>
      file.startsWith('src/components/') ||
      file.startsWith('src/views/') ||
      (file.startsWith('src/') && /\.(?:css|less|sass|scss)$/.test(file)),
    docs: [QUALITY_INDEX, 'docs/code-quality/components-and-styles.md', 'docs/code-quality/testing.md'],
    commandsFor: (files) => [`npx vitest related --run ${files.join(' ')}`],
    review: 'Keep components cohesive, reuse primitives when they improve clarity, and cover rendered behavior.',
  },
  {
    id: 'service-layer',
    matches: (file) => file.startsWith('src/services/'),
    docs: [QUALITY_INDEX, 'docs/code-quality/services-and-constants.md', 'docs/code-quality/testing.md'],
    commandsFor: (files) => [`npx vitest related --run ${files.join(' ')}`],
    review: 'Keep domain operations pure and centralize only stable shared contracts.',
  },
  {
    id: 'store-layer',
    matches: (file) => file.startsWith('src/stores/'),
    docs: [
      QUALITY_INDEX,
      'docs/code-quality/architecture-and-boundaries.md',
      'docs/code-quality/testing.md',
      'docs/main-store-architecture.md',
    ],
    commandsFor: (files) => [`npx vitest related --run ${files.join(' ')}`],
    review:
      'Keep stores as reactive façades and test their public contract, cleanup, delegation, and rollback behavior.',
  },
  {
    id: 'unit-mounted-tests',
    matches: (file) => file.startsWith('tests/') || file.startsWith('src/__tests__/'),
    docs: [QUALITY_INDEX, 'docs/code-quality/testing.md'],
    commandsFor: (files) => [`npx vitest run ${files.join(' ')}`],
    review:
      'Use deterministic fixtures and assert public behavior; every regression test must fail without its production fix.',
  },
]);

function createImpact(rule, files) {
  return {
    id: rule.id,
    files,
    docs: [...new Set(rule.docs)].sort(),
    commands: [...new Set(rule.commandsFor ? rule.commandsFor(files) : rule.commands)],
    review: rule.review,
  };
}

export function impactsForFiles(files) {
  const normalizedFiles = [...new Set(files.map((file) => file.replaceAll('\\', '/')))].sort();
  const impacts = [];
  const matchedFiles = new Set();

  for (const rule of IMPACT_RULES) {
    const changed = normalizedFiles.filter(rule.matches);
    if (changed.length === 0) continue;
    changed.forEach((file) => matchedFiles.add(file));
    impacts.push(createImpact(rule, changed));
  }

  for (const rule of PROGRESSIVE_IMPACT_RULES) {
    const changed = normalizedFiles.filter((file) => !matchedFiles.has(file) && rule.matches(file));
    if (changed.length === 0) continue;
    changed.forEach((file) => matchedFiles.add(file));
    impacts.push(createImpact(rule, changed));
  }

  const unmatchedSource = normalizedFiles.filter((file) => file.startsWith('src/') && !matchedFiles.has(file));
  if (unmatchedSource.length > 0) {
    impacts.push({
      id: 'application-default',
      files: unmatchedSource,
      docs: ['docs/architecture.md', QUALITY_INDEX],
      commands: ['npm run test:run', 'npm run build'],
      review:
        'Identify the canonical owner, keep UI/service/store boundaries explicit, and add focused regression coverage.',
    });
  }

  return impacts.sort((left, right) => left.id.localeCompare(right.id));
}

export function formatImpacts(impacts, fileCount) {
  if (impacts.length === 0) return `No documentation routing matched ${fileCount} changed file(s).\n`;
  const lines = [`Documentation/test impact for ${fileCount} changed file(s):`];
  for (const impact of impacts) {
    lines.push('', `[${impact.id}]`);
    const shownFiles = impact.files.slice(0, 8);
    const remainder = impact.files.length - shownFiles.length;
    lines.push(`Changed: ${shownFiles.join(', ')}${remainder > 0 ? ` (+${remainder} more)` : ''}`);
    lines.push(`Relevant docs: ${impact.docs.join(', ')}`);
    lines.push(`Suggested checks: ${impact.commands.join(' ; ')}`);
    lines.push(`Review: ${impact.review}`);
  }
  return `${lines.join('\n')}\n`;
}

export function parseDocsImpactArgs(argv) {
  const options = { files: [], json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--json') {
      options.json = true;
    } else if (argument === '--root' || argument === '--base' || argument === '--files') {
      const value = argv[++index];
      if (!value) throw new Error(`${argument} requires a value.`);
      if (argument === '--files') {
        options.files.push(
          ...value
            .split(',')
            .map((file) => file.trim())
            .filter(Boolean),
        );
      } else {
        options[argument.slice(2)] = value;
      }
    } else if (argument.startsWith('--files=')) {
      options.files.push(
        ...argument
          .slice('--files='.length)
          .split(',')
          .map((file) => file.trim())
          .filter(Boolean),
      );
    } else if (argument.startsWith('--')) {
      throw new Error(`Unknown option: ${argument}`);
    } else {
      options.files.push(argument);
    }
  }
  options.files = [...new Set(options.files)].sort();
  return options;
}

async function main() {
  const options = parseDocsImpactArgs(process.argv.slice(2));
  let files;
  let base;
  if (options.files.length > 0) {
    files = options.files;
  } else {
    const input = await loadQualityDiff({ root: options.root ?? process.cwd(), base: options.base });
    files = input.changes.map(({ file }) => file);
    base = input.base;
  }

  const impacts = impactsForFiles(files);
  if (options.json) {
    process.stdout.write(`${JSON.stringify({ base, files: [...files].sort(), impacts }, null, 2)}\n`);
  } else {
    process.stdout.write(formatImpacts(impacts, files.length));
  }
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedFile === fileURLToPath(import.meta.url)) await main();
