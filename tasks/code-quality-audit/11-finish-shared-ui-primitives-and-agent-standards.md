# Task 11: Finish Shared UI Primitives and Establish AI Engineering Standards

## Goal

Complete the work started by Task 9 so the shared UI primitives are accessible, localized, behaviorally tested, visually regression-tested, and difficult to misuse.

As part of this follow-up, establish one durable repository engineering contract that both Codex and Claude discover and follow in future work. Convert the most important rules into lint, test, and CI gates so compliance does not depend on an agent remembering prose.

This is a corrective follow-up to `09-consolidate-shared-ui-primitives.md`. It is not permission for a visual redesign or unrelated refactor.

## Why Task 9 Is Not Complete

The extraction produced useful shared components, but the merged result does not satisfy Task 9's original acceptance criteria:

- `TournamentNav` removes the browser focus outline without a visible replacement.
- `ScrollButtons` uses unnamed icon-only buttons and omits `type="button"`.
- `PageLoader` and navigation primitives contain hard-coded English accessible labels.
- Reduced-motion mode slows the loader animation instead of stopping nonessential translation.
- `RoundTimer` places nested buttons and an input inside a container with `role="button"`.
- Read-only tir score circles communicate some result states only through color.
- Current lint fails on `Ranking.vue` and `Results.vue`, both touched by the Task 9 follow-up.
- Required visual baselines were never committed; existing E2E checks mostly inspect visibility, overflow, or computed style.
- The timer E2E title claims running/paused/ended coverage but does not exercise every named state.
- Many unit tests use `readFileSync(...).toContain(...)` or call component methods directly. These may guard architecture, but they do not prove Vue wiring, reactivity, focus, accessibility, or parent integration.
- The E2E suite mutates `__vue_app__`, Pinia internals, and `__vueParentComponent`, making it coupled to private framework implementation.
- There is no tracked root `AGENTS.md` or `RTK.md`; only `CLAUDE.md` exists, so Codex and Claude do not share a durable repository contract.
- The deployment workflows can publish without requiring lint, unit, accessibility, E2E, or visual gates.

## Dependencies and Coordination

- Task 9 is the implementation baseline for this follow-up.
- Coordinate edits to `Archived.vue`, archive E2E fixtures, and deployment workflows with Task 10.
- Coordinate tir behavior changes with Task 2. This task owns presentation/accessibility, not scoring or qualification rules.
- Keep the Public/TV stale-subscription remediation in Task 5. This task adds the future async-state standard but must not absorb that separate production change.
- Coordinate public match-card styling with Task 1.

## Relevant Files

Shared primitives and direct consumers:

- `src/components/ui/PageLoader.vue`
- `src/components/ui/PublicPageShell.vue`
- `src/components/ui/TournamentNav.vue`
- `src/components/ui/ScrollButtons.vue`
- `src/components/ui/RoundTimerControls.vue`
- `src/components/ui/TirAtelierTabs.vue`
- `src/components/ui/TirRoundTabs.vue`
- `src/components/ui/TirScoreCircle.vue`
- `src/components/ui/TirScoreGrid.vue`
- `src/components/ui/TirScoreLegend.vue`
- `src/components/ui/TirScoringAction.vue`
- `src/components/ui/TirScoringCard.vue`
- `src/components/partials/RoundTimer.vue`
- `src/components/Draw.vue`
- `src/components/Tournament.vue`
- `src/components/partials/Games.vue`
- `src/components/partials/Cadrage.vue`
- `src/components/partials/PlayOff.vue`
- `src/components/partials/Protocol.vue`
- `src/components/tir/`
- `src/components/training/TrainingSession.vue`
- `src/views/Public.vue`
- `src/views/PublicStats.vue`
- `src/views/Archived.vue`
- `src/views/Docs.vue`

Tests and tooling:

- `src/__tests__/ui-primitives.spec.js`
- `src/__tests__/timer-ui.spec.js`
- `src/__tests__/theme-ui.spec.js`
- `src/__tests__/playoff-ui-consistency.spec.js`
- `e2e/ui-primitives.spec.js`
- `e2e/archived-layout.spec.js`
- `e2e/tir.spec.js`
- `e2e/firebase-fixtures.js`
- `e2e/helpers.js`
- `e2e/README.md`
- `firebase.json`
- `playwright.config.js`
- `eslint.config.js`
- `.stylelintrc.json`
- `package.json`
- `.github/workflows/deploy.yml`
- `.github/workflows/static.yml`
- `.github/workflows/quality.yml` (new reusable workflow)

Agent instruction surfaces to create or update:

- `AGENTS.md` — concise, self-contained repository contract for Codex and compatible agents
- `RTK.md` — detailed shared engineering and testing standards referenced by agent entry points
- `CLAUDE.md` — Claude-specific commands/tool notes plus the same mandatory shared contract
- `tasks/code-quality-audit/README.md` — task-runner guidance that points agents to the shared contract
- A script/test that validates instruction discovery, references, commands, and parity

## Required Changes

### 0. Record an honest baseline

Before production edits, create a baseline evidence report containing:

- Merge-base/base SHA and current HEAD SHA
- Clean/dirty worktree status and unrelated user-owned changes
- Complete consumer and selector-ownership inventory for every affected primitive
- Current props, emits, slots, DOM roles/names/states, IDs/test IDs, themes, breakpoints, and intentional consumer variants
- Exact focused commands, exit codes, test counts, and known failures
- Current desktop/mobile, light/dark screenshots for every stable state required below
- Classification of every relevant test as behavioral, integration, accessibility, visual, architecture/static guard, or insufficient

Add characterization tests and the visual harness in a baseline-only change before fixing production behavior. Passing compatibility tests should pass against the base implementation. New tests for confirmed defects should be recorded as expected failures on the base, then pass after the fix; do not encode inaccessible behavior merely to make the baseline green.

An existing failure is not dismissible as “unrelated.” Record the exact output and either fix it within the affected scope or obtain a named, expiring waiver. This task specifically requires fixing the current `Ranking.vue` and `Results.vue` formatting failures.

### 1. Repair confirmed accessibility and localization regressions

#### `TournamentNav`

- Restore a clearly visible `:focus-visible` indicator in light and dark themes.
- Do not use `outline: none` or `outline: 0` without an equal or stronger tested replacement.
- Require a non-empty localized tablist label from the parent; remove the hard-coded English default.
- Ensure tab IDs are unique across simultaneous nav instances.
- Connect each tab to a real `tabpanel` ID, or omit `aria-controls` when no panel relationship exists.
- Guarantee exactly one `tabindex="0"`, including when the active tab is removed dynamically.
- Preserve ArrowLeft/ArrowRight wrapping and Home/End behavior; document whether focus automatically activates the tab.
- Make active styling neutral by default or use an explicit validated presentation `tone`; do not silently derive all visual meaning from business IDs such as `teams` or `ranking`.
- Validate duplicate/empty tab IDs in development and fail predictably in tests.

#### `ScrollButtons`

- Add `type="button"` to both controls.
- Give each icon-only button a localized accessible name and title/tooltip where useful.
- Mark decorative icons `aria-hidden="true"`.
- Add a visible focus state in both themes.
- Use smooth scrolling only when reduced motion is not requested; use instant scrolling under `prefers-reduced-motion: reduce`.
- Replace silent configured-selector failure with an explicit target contract. Window mode must be intentional; a missing configured target warns/no-ops rather than scrolling a different container.
- Preserve native keyboard activation and meet the chosen minimum touch-target size.

#### `PageLoader`

- Require a non-empty localized label or use an explicit localization adapter. Update Draw, Public, and PublicStats in every supported locale.
- Expose one unambiguous accessible name and document the `status`/live-region behavior.
- Under reduced motion, show a static progress indicator; do not merely slow translating animation.
- Verify the fixed overlay does not trap focus or hide page error messages.

#### `RoundTimer` and `RoundTimerControls`

- Remove nested interactive controls from inside a container with `role="button"`.
- Use a dedicated native button for opening restart controls.
- Add `type="button"`, localized accessible names, visible focus, and appropriate state to pause, resume, reset, restart, and submit controls.
- Give the custom-minutes input a programmatic label and clear validation/error semantics.
- Validate the timer status enum and handle unknown status predictably.
- Emit `timer-ended` exactly once per transition into the ended state.
- Preserve read-only mode without exposing interactive semantics.

#### Tir primitives

- Give meaningful read-only score/result states accessible text or labels so they are not color-only.
- Mark truly decorative inactive circles as hidden from assistive technology.
- Require a non-empty accessible name for interactive score controls.
- Consolidate the overlapping `small` and `size` APIs into one validated size contract, with a documented compatibility migration if needed.
- Preserve `aria-pressed`, disabled state, emitted values, and result semantics for carreau/reussi/touche/manque.
- Ensure interactive targets meet the WCAG 2.2 AA target-size rule and the measurable policy in section 5, or identify and test the exact allowed exception.
- Verify all tab primitives have localized labels, unique IDs, valid roving focus, and visible focus.

### 2. Finish primitive ownership and API design

For each primitive family, record exactly one owner of markup, behavior, and selector prefix.

- Shared components own only presentation and generic interaction.
- Parents continue to own tournament rules, tab availability, scoring rules, timer persistence, and route state.
- Use explicit variant/tone/size props rather than consumer-specific selector overrides.
- Props use object declarations with types, defaults/required flags, and validators where the value set is closed.
- Emits are declared and tested with their payload shape.
- Components do not mutate props or require `$forceUpdate`.
- Stable IDs and keys do not depend on translated labels or array positions when items can change.
- User-facing strings and accessible names are localized at the boundary.
- Numeric UI values are normalized explicitly; never rely on lexicographic comparison of numeric strings.

The shared agent standard must require versioning/cancellation of async loads, but implementation of the known Public/TV stale-record issue remains in Task 5. Record that dependency; do not expand this UI follow-up into live-subscription production work.

Inventory remaining copied/dead styles and components. In particular, verify whether `TirPublicDetails.vue` is production-reachable. Delete it if it is test-only/dead, or migrate it to the canonical primitives if intentionally retained. Tests alone are not evidence that a production component is reachable.

Remove obsolete selectors only after mounted/browser tests prove every consumer. Document each remaining duplicate as an intentional view-specific exception with an owner and reason.

### 3. Replace weak tests with behavioral component coverage

Add Vue Test Utils or an equivalent mounted DOM harness suitable for Vue 3.

Rules for the revised suite:

- `readFileSync(...).toContain(...)`, import-string checks, and selector-count scripts are architecture/static guards only.
- Architecture guards must be labeled as such and may not satisfy behavior, integration, accessibility, interaction, or visual acceptance rows.
- Calling `Component.methods.foo.call(...)` is acceptable only for genuinely pure isolated logic; it does not prove Vue event wiring, reactivity, focus, lifecycle, or DOM semantics.
- Parent integration mounts the parent, drives public DOM/user events, and proves props, emissions, state changes, and rendered panels.
- Every test name must match what it actually asserts. A test named running/paused/resumed/ended must exercise and assert all four states.
- Every acceptance row must contain an observable assertion directly coupled to the claimed outcome. For each primitive family, deliberately introduce and revert at least one representative fault (for example, remove event wiring, the accessible name, or the focus rule) and record that the mapped test fails. A pinned mutation-test runner may replace this fault-injection check; raw test counts do not.

Mounted coverage must include:

- `TournamentNav`: click, Enter/Space, ArrowLeft/Right wrap, Home/End, focus movement, dynamic add/remove, invalid model recovery, icons, unique IDs, localized name, `aria-selected`, `aria-controls`, and focus visibility.
- `PageLoader`: role/name, live-region behavior, localized labels for UA/EN/FR/ES, light/dark, and static reduced-motion state.
- `ScrollButtons`: names/types, exact element target, intentional window mode, missing target, reduced motion, native keyboard activation, and focus.
- Tir primitives: every result, active/inactive, disabled, read-only/editable, senior/junior distances, accessible names/states, emitted payloads, and Training reuse.
- Timer: not-started, running, paused, resumed, ended, reset, restart presets/custom value, read-only, invalid status, and one ended event. Use fake time.
- Parent integrations: exact tab sets/switching for Tournament, Public, Archived, admin tir, and public tir; all three loader consumers; Games/PlayOff/Cadrage timer wiring; Training and public tir semantics.
- `PublicPageShell`: variants, light/dark tokens, desktop/mobile layout, and proof that its global selectors do not alter an unrelated page.

### 4. Build deterministic visual regression coverage

Use Playwright component testing or a test-only visual harness that is unavailable in production. Do not mutate `__vue_app__`, Pinia internals, `__vueParentComponent`, or component proxies.

The harness must:

- Use fixed fixtures/IDs and frozen time
- Block or intercept external requests
- Use deterministic local fonts
- Disable caret and nonessential transitions/animations for screenshots
- Seed state through public props, fixture APIs, or Firebase emulators
- Avoid arbitrary sleeps; wait for exact observable state
- Run in the same pinned browser/container environment locally and in CI

Firebase-backed browser tests must fail closed:

- Pin the Firebase CLI used by local and CI runs.
- Add `e2e:ui:emulator` as a cross-platform wrapper around the pinned Firebase CLI's `emulators:exec --only auth,database --project demo-petanque-draw` path. It must start the emulators and run `ui-primitives.spec.js`, `archived-layout.spec.js`, and the Task 11 cases in `tir.spec.js`; a direct Playwright invocation is not an equivalent write-safe command.
- Add a preflight guard that aborts before the browser starts unless the Auth and Realtime Database emulator hosts, the explicit emulator-mode flag, and the expected `demo-*` project ID are present.
- Configure the browser client through a test-only bootstrap to call the Firebase emulator connection APIs. Expose a non-secret emulator sentinel that Playwright asserts before any write.
- Never fall back from emulator mode to the configured live project. The required CI suite must have no route to production/shared Firebase.
- Keep any separately approved shared-project smoke read-only, explicitly tagged, opt-in, and outside the required write-heavy suite.

Remove the shared live-project email/password currently committed in `e2e/README.md` and any helper. Treat that account as compromised: rotation or revocation is an explicit owner-approved external checkpoint and must have an owner and recorded result before this task can be called complete. Emulator tests must seed disposable, unprivileged fixture users at runtime. If an approved read-only shared-project smoke still needs authentication, inject it through CI/local secrets, never source or documentation, and prevent values from appearing in logs or artifacts.

Commit focused region snapshots with `toHaveScreenshot`; do not rely on full volatile pages.

Required visual states:

1. PageLoader: light/dark at 1280x800 and 375x812.
2. TournamentNav: Tournament, Public, Archived, and tir variants; default and keyboard-focus states; desktop/mobile and light/dark where styling/layout differs.
3. Tir: participant editable, atelier editable, public read-only, playoff comparison, and Training; all result colors represented; desktop/mobile and light/dark.
4. Timer: not-started, fixed running time, paused, ended, restart open, and read-only; mobile plus light/dark representative coverage.
5. PublicPageShell: Public, PublicStats, and Archived representative shells at desktop/mobile and light/dark.
6. ScrollButtons: intentional window and contained-target modes, including visible keyboard focus.

Capture the reference before production fixes. Allowed screenshot changes are limited to listed accessibility/localization corrections and must be individually explained. The normal CI command must never update snapshots. Baseline updates require a dedicated reviewed diff artifact.

### 5. Add accessibility and CSS quality gates

Use [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/) as the affected-area conformance target. Make the project policy measurable:

- Pointer targets are at least 24 by 24 CSS pixels, or the exact [SC 2.5.8 exception](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) is identified and tested per control.
- Author-styled focus indicators remain unobscured, use at least a 2 CSS pixel outline/border or equivalent visible area, and have at least [3:1 contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast) against adjacent colors in every affected theme.
- Meaningful result state has both a programmatically determinable name/state and a visible non-color cue such as text, icon shape, or pattern.
- Keyboard traversal tests compare the complete ordered focus-stop list for each harness with the declared expected list, including overlays and restart controls.

Add automated axe coverage for each affected harness/page:

- Zero critical or serious violations in the changed region
- No new moderate violations without an explicit, expiring waiver
- No nested interactive controls
- No unlabeled input or icon-only control
- No color-only meaningful state
- Logical keyboard order and no keyboard trap
- Visible focus at every keyboard stop
- Tested focus/control contrast in both themes
- Reduced-motion mode has no nonessential translation/scaling or forced smooth scroll

Axe alone is not completion evidence for focus appearance, contrast, target spacing, reading order, or color-only meaning. Automate computed size/contrast/focus-order checks where reliable and commit a reviewed manual matrix for the remaining items, listing component, state, theme, viewport, criterion, result, reviewer, and artifact.

Use ESLint/Stylelint/accessibility plugins or an AST-aware repository check to prevent recurrence. At minimum, enforce for new and affected UI code:

- No `outline: none`/`0` without a documented tested replacement
- No icon-only button without a localized accessible name and `type="button"`
- No interactive `div`/`span` when a native control is available
- No user-facing English default in `src/components/ui`
- No new hard-coded hex/rgb colors where a design token exists
- No undocumented global selector leakage
- No private Vue runtime internals in E2E tests
- No `test.only`, skipped required gate, or arbitrary timeout used as the assertion

Do not blanket-ignore first-party `functions/` or `scripts/` from lint. Give different runtimes scoped ESLint configuration and include them in a zero-warning CI gate. Do not weaken, exclude, or rename a gate merely to make it pass.

Scope new static enforcement to `src/components/ui/**`, `RoundTimer.vue`, affected tir/training components and consumers, `e2e/ui-primitives.spec.js`, the Task 11 cases in `e2e/tir.spec.js` and `e2e/archived-layout.spec.js`, and every new harness. Remove private-runtime access and arbitrary waits from all Task 11 cases. Pre-existing occurrences in unrelated E2E cases may remain only in a baseline allowlist containing file, line, rule, reason, owner, and expiry; new occurrences are forbidden. This task does not claim unrelated E2E debt is remediated.

### 6. Establish shared Codex and Claude engineering standards

Create durable root instructions with a single ownership model:

1. Create root `AGENTS.md` as the concise canonical contract automatically discoverable by Codex. Put essential safety and quality rules directly in it; it must not be only a bare include.
2. Create root `RTK.md` as the detailed shared engineering standard referenced by `AGENTS.md` and Claude instructions. This resolves the currently dangling `@RTK.md` convention.
3. Update `CLAUDE.md` to consume the shared contract while retaining only Claude-specific additions such as supported tools and Playwright guidance. Use a verified import mechanism when supported; otherwise keep a generated/checksummed mandatory core block.
4. Update `tasks/code-quality-audit/README.md` so implementation agents read the closest `AGENTS.md`, the shared `RTK.md`, tool-specific instructions such as `CLAUDE.md` when applicable, and `e2e/README.md` before browser work.
5. Define precedence: platform/system and developer safety policies; explicit current user intent and approvals; the closest scoped `AGENTS.md`; root `AGENTS.md`/`RTK.md`; task documentation; then tool-specific notes. No lower-precedence instruction may weaken a higher-precedence safety or authorization boundary.
6. Avoid circular imports and independently edited copies of the same policy.

`AGENTS.md` and `RTK.md` must encode these standards for future agents:

#### Scope, authority, and worktree safety

- Review/diagnosis requests are read-only; implementation requires a change request.
- Inspect status first and preserve unrelated/user-owned changes.
- Do not stage, commit, push, deploy, migrate, change IAM/rules, or mutate production data unless explicitly authorized.
- Read the closest agent instructions and task-specific documentation before editing.
- Read `e2e/README.md` before browser tests.

#### Baseline and refactoring discipline

- Record base SHA, status, affected behavior/consumer matrix, exact commands/results, and required artifacts before production edits.
- Add characterization coverage before extraction; intentional fixes get explicit failing regression tests against the base.
- Change one primitive family or behavior boundary at a time.
- Preserve public contracts and document intentional visual/behavior changes.
- Do not absorb domain rules into a shared presentation component merely to reduce lines.

#### Vue and data-boundary standards

- Declare typed/validated props and emits; do not mutate props.
- Keep computed/render functions free of persistence side effects.
- Prefer native semantic controls and stable IDs/keys.
- Normalize numbers/IDs at input and persistence boundaries.
- Version/cancel async loads so stale data cannot replace newer state.
- Do not access Vue/Pinia private internals outside a documented test adapter.
- Avoid `$forceUpdate`; repair ownership/reactivity instead.

#### Accessibility, localization, and CSS standards

- Keyboard and screen-reader behavior are compatibility requirements, not optional polish.
- Never suppress focus without a visible tested replacement.
- Icon-only controls require native semantics, localized names, state, and `type="button"`.
- Meaningful state cannot be color-only.
- Every input has a programmatic label and error relationship.
- Respect reduced motion by disabling nonessential motion.
- Primitives receive localized strings; no user-facing hard-coded English defaults.
- Use design tokens and one declared owner per shared selector family.
- Global CSS must be namespaced and proven not to leak.

#### Testing and evidence standards

- Source-string/AST checks prove architecture only, never behavior.
- Interactive components require mounted event/focus/reactivity tests.
- Visual preservation requires reviewed deterministic screenshots at declared themes/viewports.
- E2E uses public behavior and deterministic fixtures; no private framework internals or arbitrary sleeps.
- Write-heavy Firebase suites use fail-closed emulators/ephemeral projects. Shared-project tests are separately approved, opt-in, and read-only; they are never a fallback for the required suite.
- Test names and completion reports must match the exact states/assertions executed.
- Snapshot updates cannot be used to silence a failure.
- Run focused tests during iteration, then lint, full unit, affected E2E/visual/accessibility suites, and build.
- Report exact commands, exit codes, pass counts, snapshot diff status, accessibility result, unrun gates, and waivers.
- A task is incomplete when a required gate was not run or failed.

#### External-system and security standards

- Browser/client code is not a trusted authority for ownership, retention, backup integrity, destructive policy, or privileged success.
- No production Firebase/GCP rules, functions, data, custom claims, IAM, retention policy, or migration changes without explicit environment-specific approval.
- Durability claims require independent storage plus a verified restore drill.
- Never commit or echo credentials, service-account keys, private tokens, or unnecessary user data. If a secret is already tracked, stop reproducing it, remove it safely, and require authorized rotation/revocation with recorded ownership.

### 7. Enforce the agent contract and UI gates in CI

Add a deterministic instruction-contract check that verifies:

- `AGENTS.md`, `RTK.md`, and `CLAUDE.md` exist and contain required sections/sentinels
- Every referenced local file exists
- Documented package commands exist in `package.json`
- Shared mandatory rules have not drifted between entry points
- There are no circular/dangling imports
- No plaintext shared-project credential remains in the tracked working tree or is copied into agent instruction files; run the repository secret scanner without allowlisting the exposed live-account password

The check must not depend on a locally installed Codex or Claude CLI. Use a pinned Node test/validator with root and nested-path fixtures that resolves the repository's documented entry-point/import rules and emits machine-readable JSON containing `entryPoint`, `resolvedFiles`, `requiredRuleIds`, and `errors`; any missing rule or resolution error exits non-zero. A real fresh Codex/Claude session may be recorded as additional manual review, but unavailable external tools are not an automated completion blocker.

Add stable scripts such as:

- `test:ui-primitives`
- `test:ui-a11y`
- `test:ui-visual`
- `e2e:ui:emulator`
- `check:agent-contract`
- `check:ui-standards`
- `check:secrets`

Add a pull-request quality workflow that runs formatting, zero-warning lint, secret scanning, full unit tests, focused mounted UI tests, accessibility checks, deterministic visual tests, affected emulator/E2E tests, and production build. Upload Playwright reports, traces, and screenshot diffs on failure.

Before editing deployment workflows, obtain and record the owner decision for the authoritative deployment branch, environment, and whether `deploy.yml` or `static.yml` remains active. Workflow changes are an approval checkpoint; an implementation agent must not infer production authority from this brief.

After approval, implement one reusable quality workflow invoked as a job by both pull-request validation and the authoritative deployment workflow. In the deployment workflow, the publish job uses `needs` on that in-workflow reusable-quality job; do not attempt a cross-workflow `needs` dependency. Disable or remove the redundant publisher only as approved. If the decision or approval is unavailable, prepare the proposed workflow diff and mark this task blocked/incomplete rather than leaving a build-only production path while claiming success.

## Affected Area and Required Regression Coverage

| Affected behavior           | Existing coverage to retain                    | Required addition                                                                                       |
| --------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| PageLoader states and reuse | SSR/source guards and current E2E visibility   | Mounted localization/live-region/reduced-motion tests plus reviewed light/dark desktop/mobile snapshots |
| TournamentNav interaction   | Method-level unit tests and keyboard E2E       | Mounted click/key/focus/dynamic-tab/panel contract tests, localized labels, focus screenshots, axe      |
| ScrollButtons               | No focused behavioral suite                    | Mounted target/window/missing-target/reduced-motion/a11y tests and focused snapshots                    |
| Timer controls              | Existing timer unit tests and partial E2E      | Full state machine semantics, native controls, fake-clock events, parent wiring, state snapshots        |
| Tir primitives              | Extensive SSR/source guards and tir workflows  | Mounted semantic/event matrix, read-only non-color meaning, Training/public integration, visual matrix  |
| PublicPageShell             | Computed-style checks                          | Scoped leakage test plus representative shell screenshots                                               |
| Parent consumers            | Source-string import checks                    | Mounted or browser-visible props/events/panels for every direct consumer                                |
| Theme/responsive behavior   | Theme unit tests and overflow assertions       | Stable region snapshots and contrast/focus/reduced-motion assertions                                    |
| CSS ownership               | Source-string duplicate checks                 | Selector-owner inventory and AST/Stylelint duplicate/leakage guard                                      |
| Agent instruction discovery | Only `CLAUDE.md`; missing `AGENTS.md`/`RTK.md` | Shared contract, deterministic parity/reference resolver, optional manual tool smoke                    |
| Firebase E2E safety         | Shared live account and write-capable project  | Removed plaintext credentials, rotated account, fail-closed Auth/RTDB emulator suite                    |
| Merge/deploy quality        | Build-only deployment                          | Approved authoritative workflow, reusable quality job, and same-workflow deploy dependency              |

### Baseline-before-fix rule

Before changing a primitive:

1. Map its consumers, states, themes, widths, semantics, events, and selector owner.
2. Add mounted behavior coverage and a deterministic screenshot fixture.
3. Prove compatibility tests/snapshots against the base implementation.
4. Record known-defect regression tests failing against the base.
5. Fix one primitive family.
6. Run the identical focused matrix and inspect every visual diff.
7. Stop and repair unexplained differences before moving to the next family.

## Required Test Matrix

### Mounted unit/component tests

Cover every state listed in Required Changes using real mounting, user events, reactive prop updates, emitted payloads, focus, and rendered accessibility state. Architecture guards remain in a separate clearly named suite.

### Browser accessibility tests

Run axe plus keyboard-only flows for every primitive harness and at least one real parent integration. Verify light/dark focus contrast, target size, no nested controls, labels/errors, non-color meaning, and reduced motion.

### Visual tests

Run committed focused snapshots in pinned Chromium. CI consumes snapshots read-only. Store baseline/diff artifacts with clear names containing primitive, state, theme, and viewport.

### Parent and E2E integration

Use public setup behavior, a test-only harness, and Auth/Realtime Database emulator fixtures. Remove direct private Vue/Pinia mutations and fixed sleeps from `e2e/ui-primitives.spec.js` and every Task 11 case in tir/archive E2E. Assert the emulator sentinel before writes. The required suite aborts if emulator configuration is missing and must never mutate the shared Firebase project.

### Agent-contract tests

Validate entry-point discovery and reference integrity with the pinned fixture-based resolver and its machine-readable expected manifest. If an actual Codex and/or Claude runtime is available in the approved CI/local environment, record a fresh manual discovery smoke as supplemental evidence. Do not make installation, login, network access, or an unpinned external agent CLI part of the automated gate.

## Compatibility Constraints

- No unrequested redesign, breakpoint change, or tournament workflow change.
- Accessibility corrections are intentional allowed visual differences and must be documented.
- Preserve existing route, Firebase, tournament, timer, and tir data shapes.
- Preserve supported locales and add every new key to UA/EN/FR/ES.
- Preserve public component contracts where feasible; document deprecations and migrate all consumers in one bounded sequence.
- Keep test-only harnesses and fixture APIs out of production bundles/routes.
- Keep the Public/TV stale-subscription production fix in Task 5.
- Coordinate Archived and deployment workflow conflicts with Task 10.

## Non-Goals

- Building a complete application design system
- Rewriting Bulma or all legacy CSS
- Changing tir scoring/domain rules
- Changing timer persistence/domain behavior beyond confirmed UI event correctness
- Fixing every accessibility issue in the entire repository
- Replacing all E2E tests outside the affected UI scope
- Performing a production deployment or changing live Firebase without approval
- Editing/retiring a deployment workflow before the owner approves the authoritative branch, environment, and workflow design

## Suggested Implementation Order

1. Baseline report, mounted harness, deterministic visual harness, and failing regression tests
2. Shared `AGENTS.md`/`RTK.md` contract and instruction validator
3. TournamentNav, PageLoader, and ScrollButtons fixes
4. RoundTimer/RoundTimerControls semantics and full state coverage
5. Tir primitive semantics/API cleanup and dead-copy inventory
6. PublicPageShell leakage/theme validation
7. Parent integration migration and removal of weak/private-internal tests
8. Axe, visual matrix, CSS/static enforcement, and CI gates
9. Documentation, deterministic agent-contract validation, optional manual tool smoke, full verification, and evidence matrix

Keep primitive families independently reviewable. Do not bundle baseline creation, unrelated production changes, and snapshot replacement into one opaque commit.

## Verification

Add stable scripts, then run the equivalent of:

```bash
npm run format:check
npm run lint
npm run test:run
npm run test:ui-primitives
npm run test:ui-a11y
npm run test:ui-visual
npm run check:agent-contract
npm run check:ui-standards
npm run check:secrets
npm run e2e:ui:emulator
npm run build
```

Record:

- Base SHA and pre/post affected-area evidence matrix
- Exact command results and pass counts
- Number and names of committed visual baselines
- Reviewed visual diff disposition for every changed image
- Axe result and any expiring waiver
- CSS/primitive ownership report
- Agent-contract manifest/validation and any optional Codex/Claude manual-smoke result
- Emulator preflight/sentinel evidence and proof that no required browser test addressed shared/live Firebase
- Confirmation that the committed shared-account credential was removed and the account rotation/revocation checkpoint completed
- CI job status/artifact links
- The approved authoritative deployment branch/workflow decision and quality dependency evidence

## Acceptance Criteria

- Every confirmed Task 9 accessibility, localization, reduced-motion, timer, tir-semantic, and lint defect is fixed.
- Shared primitive APIs are explicit, validated, localized, and preserve domain ownership in parents.
- Every direct consumer is covered by mounted or browser-visible behavior assertions.
- Source-string/method-call tests are classified as architecture/unit guards and are not counted as interaction coverage.
- `e2e/ui-primitives.spec.js` and every Task 11 tir/archive case no longer access Vue/Pinia private internals or use arbitrary sleeps as proof; unrelated legacy occurrences are in the bounded expiring allowlist.
- Required Firebase-backed E2E passes only through the fail-closed Auth/Realtime Database emulator path and asserts its sentinel before writes.
- Plaintext shared-project credentials are absent from the tracked working tree and new commits, and the previously exposed account has been rotated or revoked through the approved checkpoint. Do not rewrite Git history without separate explicit approval.
- Required reviewed visual baselines exist and pass without snapshot-update flags.
- Axe, keyboard, focus contrast, target size, label, semantic-control, and reduced-motion gates pass.
- No affected primitive suppresses focus without a tested replacement.
- No affected icon-only button lacks a localized name or `type="button"`.
- No meaningful tir result is conveyed only through color.
- Every affected user-facing/accessibility string exists in UA/EN/FR/ES.
- Shared CSS selectors have one owner or a documented intentional exception.
- `AGENTS.md`, `RTK.md`, and `CLAUDE.md` expose the same non-negotiable core to Codex and Claude without dangling/circular references.
- The code-quality task index directs future implementation agents to the shared contract and applicable tool/E2E instructions.
- The agent contract contains the standards specified by this task and passes automated parity/reference checks.
- First-party functions/scripts are linted through scoped configuration rather than blanket ignores.
- The owner-approved authoritative deployment workflow calls the same reusable quality job as PR validation and its publish job depends on that job; no redundant build-only publisher remains enabled.
- Formatting, zero-warning lint, secret scan, full unit, focused UI, accessibility, visual, affected emulator E2E, and production build gates pass.
- Completion evidence maps every acceptance criterion to the correct test/artifact layer with no unexplained gaps.

## Completion Standard

Do not mark this follow-up complete if:

- A required visual or browser gate was not run
- A screenshot was blindly updated
- An interaction is certified only by source text, SSR HTML, a mock, or a direct method call
- A test title claims unasserted states
- A focus, localization, semantic-control, reduced-motion, or color-only issue remains in an affected primitive
- Agent files contain a dangling include, duplicated drifting policy, invalid package command, or copied credentials
- Required E2E can fall back to shared/live Firebase, or the exposed shared account has not been rotated/revoked
- Deployment authority/design is undecided, or an enabled publisher can bypass the reusable quality job
- CI does not execute the safety net claimed in the handoff
- A required failure is called “unrelated” without a named, expiring waiver

The final handoff must state exact commands, exit codes, test/pass counts, snapshot and axe status, CI evidence, intentional differences, waivers, and any work that remains.
