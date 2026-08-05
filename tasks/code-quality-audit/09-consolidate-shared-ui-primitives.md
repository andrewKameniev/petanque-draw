# Task 9: Consolidate Shared UI Primitives and Repeated Styles

## Goal

Replace repeated loader, tournament navigation, tir scoring, and timer-control markup/styles with shared components or global feature styles.

Preserve the current visual design and responsive/theme behavior. This is a reuse refactor, not a redesign.

## Problem

Exact or near-exact UI/CSS blocks are repeated across the application:

- Tournament navigation buttons in Tournament, Public, and Archived
- Tir score grids, tabs, score circles, legends, and atelier cards across tir views and TrainingSession
- Timer start/control styling in Games, PlayOff, and Cadrage
- The same page-level “gooey” loader in Draw, Public, and PublicStats
- Repeated wrapper/background styling in Public, Archived, and PublicStats

Because many copies are scoped, a visual change must be applied in several places and can easily drift.

## Dependencies

- Coordinate with Task 1 for public card styles.
- Coordinate with Task 2 before changing tir scoring components, so domain extraction and visual extraction do not create conflicting components.

## Relevant Files

- `src/components/Loader.vue`
- `src/components/Draw.vue`
- `src/views/Public.vue`
- `src/views/PublicStats.vue`
- `src/views/Archived.vue`
- `src/components/Tournament.vue`
- `src/components/partials/Cadrage.vue`
- `src/components/partials/Games.vue`
- `src/components/partials/PlayOff.vue`
- `src/components/partials/RoundTimer.vue`
- `src/components/tir/TirParticipantView.vue`
- `src/components/tir/TirAtelierView.vue`
- `src/components/tir/TirPublicView.vue`
- `src/components/training/TrainingSession.vue`
- `src/assets/css/style.css`
- `src/assets/css/variables.css`
- `src/assets/css/public-game-card.css`
- UI consistency, theme, timer, and responsive tests

## Required Changes

### 1. Inventory repeated UI before extracting

For each repeated block, decide whether reuse should be achieved through:

- A semantic Vue component
- A global feature stylesheet
- A small renderless/shared behavior helper

Do not create a component solely to share two CSS declarations. Conversely, do not use global CSS to hide genuinely duplicated interactive markup.

### 2. Add a page-level loader component

The current `Loader.vue` is an inline spinner. Keep it for button/inline loading if appropriate.

Create a separate `PageLoader.vue` for the repeated gooey full-page loader, then replace copies in Draw, Public, and PublicStats.

It must have accessible status semantics and a localized or screen-reader-only loading label.

### 3. Extract tournament tabs/navigation

Create a reusable navigation component for the repeated `tournament-nav__btn` markup and style.

It should accept tab descriptors, active tab, icons, and emit selection. Preserve the different tab sets supplied by each parent.

Do not make it aware of tournament rules; parents remain responsible for building the tab list.

### 4. Consolidate tir scoring visuals

Move shared score colors, circles, grid cells, tabs, legends, and atelier-card styles into a feature stylesheet such as `src/assets/css/tir-scoring.css` and/or cohesive primitives such as:

- `TirScoreLegend.vue`
- `TirScoreGrid.vue`
- `TirScoreCircle.vue`

Choose components only where markup/behavior is genuinely shared. Training may use different storage semantics but should not carry copied `tir-pview__*` style definitions.

### 5. Consolidate timer controls

Reuse `RoundTimer.vue` for behavior. Move repeated start-button/control styling to a shared class or small control component used by Games, PlayOff, and Cadrage.

Preserve differences in emitted actions and read-only mode.

### 6. Consolidate public page shell/background where safe

Extract common wrapper/background styles used by Public, Archived, and PublicStats into a global shell class or layout component.

Do not force authenticated Archived layout and anonymous Public layout into the same component if their structure differs; sharing the background style alone is acceptable.

### 7. Remove obsolete scoped copies

After migrating all consumers, remove duplicate rules and verify no selector relied on scoped attribute specificity.

Keep design tokens in `variables.css`; do not introduce new hardcoded colors when a token exists.

## Affected Area and Required Regression Coverage

| Affected behavior/visual              | Existing coverage to retain                                                | Required coverage audit/addition                                                                                                        |
| ------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Public-card shared stylesheet         | `src/__tests__/playoff-ui-consistency.spec.js`                             | Coordinate with Task 1 and keep a single source-of-style assertion.                                                                     |
| Page loader presence/state            | Draw/Public/PublicStats have copied markup with no focused component suite | Add component tests for loading/non-loading switch, accessibility role/text, and light/dark rendering.                                  |
| Tournament tab selection/icons        | Structural tests exist for some playoff tabs                               | Add mounted shared-nav tests for active state, emitted ID, dynamic tabs, icon rendering, and keyboard activation.                       |
| Public/Admin/Archived tab integration | Existing unit/E2E coverage is indirect                                     | Add integration assertions that each parent supplies and switches its expected tabs.                                                    |
| Tir score grid/circles/tabs           | Tir unit/E2E covers scoring behavior                                       | Add visual-component tests for all result states, selected/unselected, read-only/editable, senior/junior distances, and training reuse. |
| Tir responsive layout                 | Existing CSS copies are not comprehensively guarded                        | Add stable desktop/mobile screenshot snapshots or equivalent layout assertions for participant, atelier, public, and training screens.  |
| Timer display and controls            | `src/__tests__/timer-ui.spec.js`                                           | Retain paused/running/double-elimination behavior; add shared start/control rendering and event tests.                                  |
| Theme variables/dark mode             | `src/__tests__/theme-ui.spec.js`                                           | Ensure extracted global styles continue using variables and work in light/dark modes.                                                   |
| Archived responsive layout            | `e2e/archived-layout.spec.js`                                              | Retain sidebar/button layout after navigation/shell extraction.                                                                         |
| Public shell/background               | No focused cross-page visual regression suite was identified               | Add screenshots or stable computed-style/layout assertions for Public, Archived, and PublicStats at desktop/mobile.                     |

### Baseline-before-refactor rule

Before moving markup or CSS:

1. Capture baseline screenshots for each affected stable state at desktop and mobile widths, in light and dark themes where applicable.
2. Add behavioral component tests so screenshot differences are not the only signal.
3. Run existing theme, timer, playoff UI, tir, and archived-layout suites.
4. Confirm baseline snapshots/tests pass before extraction.
5. Migrate one primitive family at a time and compare after each family.

If an existing visual difference between copies is intentional, preserve it via a documented variant prop/class rather than accidental selector overrides.

## Unit and Component Tests

Cover:

1. Page loader accessibility and state
2. Tournament tabs rendering, events, keyboard behavior, and dynamic lists
3. Tir score primitives for every result type/state
4. Read-only versus editable score grid behavior
5. Timer control events and variants
6. Parent integration for each migrated consumer
7. No obsolete duplicated markup/style blocks remain
8. Theme-variable usage

## E2E and Visual Regression Tests

Cover stable representative states:

1. Draw/Public/PublicStats page loading
2. Public tournament tabs on desktop/mobile
3. Archived tabs/sidebar on desktop/mobile
4. Tir participant scoring and public read-only results
5. Training session using shared scoring visuals
6. Timer running/paused/ended controls
7. Light and dark themes

Prefer focused screenshots of stable components/regions rather than full-page snapshots containing timestamps or volatile tournament data. Mask or freeze dynamic content.

Follow `e2e/README.md` and clean up fixtures.

## Compatibility Constraints

- No intentional visual redesign.
- Preserve keyboard and screen-reader behavior; improve missing loader semantics.
- Preserve theme tokens and responsive breakpoints.
- Preserve existing test IDs or migrate tests deliberately.
- Avoid global selectors that leak into unrelated components.
- Do not combine training and tir domain data models solely for visual reuse.

## Non-Goals

- Rebuilding the design system
- Rewriting Bulma
- Changing tournament workflows
- Changing tir/training scoring rules
- Full application visual snapshot coverage

## Verification

Run:

```bash
npm run lint
npm run test:run
npx playwright test e2e/ui-primitives.spec.js e2e/archived-layout.spec.js e2e/tir.spec.js
```

Update snapshot artifacts only after reviewing the before/after diff and confirming it is intentional.

## Acceptance Criteria

- Page loading, tournament tabs, tir scoring visuals, and timer controls each have one clear reusable implementation/style source.
- Obsolete scoped copies are removed.
- Parent components retain their view-specific rules and layout.
- Light/dark and desktop/mobile states are covered.
- Visual diffs are reviewed rather than blindly updated.
- The affected-area coverage table has no unexplained gaps.
- The same component/E2E/visual matrix passes before and after each extraction.
- Lint and relevant tests pass.
