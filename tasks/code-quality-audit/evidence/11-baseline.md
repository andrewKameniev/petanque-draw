# Task 11 Baseline Evidence

Recorded before Task 11 production-code edits.

## Repository state

- Date/time zone: 2026-08-06, Europe/Kyiv
- Base and HEAD: `f0488772318b49fdb44e64560d233925f7f6f454`
- Branch: `codex/task-11-ui-agent-standards`
- Upstream baseline: `origin/develop` at the same SHA after `git fetch origin develop`
- Runtime: Node `v22.22.0`, npm `10.9.4`
- Pre-existing worktree changes preserved: modified task index and untracked Task 10/Task 11 briefs

No application source had been edited for Task 11 when the commands below ran.

## Consumer inventory

### `TournamentNav`

- `src/components/Tournament.vue`
- `src/components/tir/TirModule.vue`
- `src/components/tir/TirPublicView.vue`
- `src/views/Archived.vue`
- `src/views/Public.vue`

### `PageLoader`

- `src/components/Draw.vue`
- `src/views/Public.vue`
- `src/views/PublicStats.vue`

### Timer primitives

- `src/components/partials/Cadrage.vue`
- `src/components/partials/Games.vue`
- `src/components/partials/PlayOff.vue`
- `src/components/ui/RoundTimerControls.vue`
- `src/views/Public.vue`

### Tir primitives

- `src/components/tir/TirAtelierView.vue`
- `src/components/tir/TirParticipantView.vue`
- `src/components/tir/TirParticipantsList.vue`
- `src/components/tir/TirPlayoffComparison.vue`
- `src/components/tir/TirPlayoffMatch.vue`
- `src/components/tir/TirScoringWorkspace.vue`
- `src/components/training/TrainingSession.vue`

## Existing contract and defect inventory

- `TournamentNav` accepts tabs, active ID, a label, one panel ID, ID prefix, and a `default`/`tir` variant. It automatically activates tabs during arrow/Home/End navigation. Its default label is hard-coded English, its default ID prefix can collide, every tab points at the same optional panel, active color depends on business IDs, and `:focus-visible` removes the outline without replacement.
- `ScrollButtons` silently falls back to window scrolling when a configured selector is missing. Its icon-only buttons have no accessible names or `type="button"`, icons are not hidden, focus has no explicit treatment, and reduced motion is ignored.
- `PageLoader` exposes a status/live region and duplicates its accessible name in `aria-label` and hidden text. The label defaults to English, and reduced motion merely stretches animation duration to eight seconds.
- `RoundTimer` makes its entire container a keyboard button while nesting buttons/input inside it. Several controls lack type/name/focus treatment, the custom input has no programmatic label/error relationship, status is unvalidated, and the ended watcher can emit without an explicit transition guard.
- Read-only tir circles expose visual result classes but no required accessible result label; some inactive/result distinctions are color-only. Tab defaults are hard-coded English and use collision-prone prefixes. `TirScoreCircle` has overlapping `small` and `size` APIs.
- `PublicPageShell` owns unscoped global selectors. Existing checks inspect source/computed style but do not prove non-leakage with a mounted unrelated page.
- The tracked E2E documentation/helpers contain a shared live-project account credential. Existing UI/tir E2E reaches Vue/Pinia private internals and uses fixed waits. It is unsafe to execute write-heavy browser tests until emulator-only fail-closed setup exists.
- Root `AGENTS.md` and `RTK.md` are absent. `CLAUDE.md` directs agents to the plaintext shared credential and does not provide the cross-agent safety/quality contract.
- Both Pages workflows can publish without a complete quality dependency. The owner explicitly kept deployment workflow changes outside Task 11; this observation is not implementation scope for this PR.

## Baseline commands

### Focused affected unit suite

```text
npm run test:run -- src/__tests__/ui-primitives.spec.js src/__tests__/timer-ui.spec.js src/__tests__/theme-ui.spec.js src/__tests__/playoff-ui-consistency.spec.js
exit: 0
files: 2 passed
tests: 138 passed
```

Two requested paths do not exist, demonstrating that the previous Task 9 verification command overstates timer/theme coverage.

### Full unit suite

```text
npm run test:run
exit: 0
files: 57 passed
tests: 1108 passed
```

### Lint/format gate

```text
npm run lint
exit: 1
ESLint: one no-unused-vars warning in src/views/Archived.vue
Prettier: src/components/partials/Ranking.vue, src/components/partials/Results.vue, and src/views/Archived.vue fail
```

### Production build

```text
npm run build
exit: 0
modules transformed: 2583
```

The build reports the pre-existing mixed static/dynamic import warning for `archive-index.js` and chunk-size warnings.

### Browser/visual suites

Not run at baseline. The existing Playwright configuration and helpers target shared Firebase, include write-heavy cases, and have no fail-closed Auth/Realtime Database emulator guard. Running them would violate Task 11's safety boundary.

No `toHaveScreenshot` assertion or committed component-region visual baseline existed at the base SHA.

## Test-quality classification

- `src/__tests__/ui-primitives.spec.js`: mostly SSR markup checks, source-string architecture guards, and direct component-method calls; useful for shape/ownership, insufficient for event wiring, reactivity, focus, lifecycle, computed browser style, and parent integration.
- `src/__tests__/playoff-ui-consistency.spec.js`: architecture/source consistency guard; not visual or mounted behavioral coverage.
- `src/__tests__/tir-score-editors.spec.js` and `tir-domain-consistency.spec.js`: domain/helper coverage to retain; not complete primitive accessibility coverage.
- `e2e/ui-primitives.spec.js`: browser-visible checks, but setup uses private Vue/Pinia state and fixed waits; no committed visual assertions.
- `e2e/tir.spec.js`: broad workflow intent, but currently unsafe for required CI and coupled to private runtime state in affected cases.
- `e2e/archived-layout.spec.js`: responsive layout intent to retain, but must move behind the emulator preflight before write-capable/shared-account use.

## Baseline-only harness added

Before production fixes, the branch added pinned Vue Test Utils/jsdom tooling, a mounted compatibility suite, and a separate Vite/Playwright visual harness that is not part of the production application.

```text
npm run test:ui-primitives
exit: 0
files: 2 passed
tests: 130 passed

npm run test:ui-visual -- --update-snapshots
exit: 0
snapshots: 19 written and passed
```

The committed baseline matrix covers loader, navigation, tir, timer, public shell, and scroll controls across desktop light/dark and mobile light, plus a keyboard-focus navigation state. Representative images were inspected rather than accepted blindly. Confirmed visible baseline defects include the absent navigation focus indicator and color/shape-only score circles.

The desired accessibility regression suite was then added and run against the base implementation:

```text
npx playwright test --config playwright.a11y.config.js
exit: 1 (expected pre-fix red suite)
tests: 2 passed, 9 failed
```

The failures directly demonstrate insufficient navigation/tir contrast, unnamed scroll controls, missing navigation focus, loader motion under reduced-motion preference, unnamed/color-only read-only tir results, and the nested timer-button contract. The post-fix run must use the identical suite and pass without exclusions.

## Baseline stop conditions

The mounted and deterministic visual prerequisites are now satisfied. Required Firebase browser cases remain blocked until the emulator sentinel and fail-closed preflight exist. The known lint failures must be fixed rather than waived.
