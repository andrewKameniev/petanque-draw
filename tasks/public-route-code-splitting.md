# Task: Lazy-load public route code and media

## Goal

Reduce cold public-link transfer and parse cost by loading only the active
tournament system and selected tab, while deferring off-screen remote media.

## Non-goals

- Changing tournament data subscriptions or persisted shapes.
- Redesigning public UI or removing supported systems/tabs.
- Replacing the hosting platform in this task.

## Read first

- `docs/deployment.md`
- `docs/code-quality/components-and-styles.md`
- `docs/code-quality/testing.md`

## Context

- `Public.vue` statically imports Ranking, Results, Teams, TIR, and every
  playoff implementation, so ordinary Swiss links download all branches.
- The main entry also eagerly includes Auth, Messaging, private-store logic,
  and all base locale messages; coordinate with `public-auth-bootstrap.md` to
  avoid overlapping edits.
- Color-schema pages load a 216 KB sponsor image, and participant/avatar images
  lack native lazy loading.

## Implementation outline

1. Record a reproducible build/resource baseline for direct and slug public
   routes.
2. Use route/tab/system-appropriate async components and lazy locale/module
   boundaries without changing visible behavior.
3. Optimize the sponsor asset and defer off-screen data-driven images.

## Acceptance criteria

- [x] A Swiss current-round load does not download TIR or inactive playoff
      component chunks.
- [x] Ranking, Results, Teams, and system-specific chunks load when first used.
- [x] Public loading/error states and all four locales remain functional.
- [x] Cold compressed JS/CSS and media totals improve against the recorded
      baseline without increasing request waterfalls materially.

## Test plan

- Focused command: public mounted tests and `npm run build` with recorded chunk
  output.
- Broader checks warranted by risk: lint, full unit suite, and a local
  Playwright resource capture.
- No remote Firebase writes; use intercepted or missing-record public routes for
  bundle measurement.

## Documentation impact

- Update `docs/deployment.md` only if caching, chunking, or asset delivery
  policy changes.

## Completion evidence

- Changed behavior: Public tournament tabs and tournament-system renderers are
  async, as are nested bracket, modal, participant-detail, and TIR protocol
  branches. Remote participant/club media uses native lazy loading. The sponsor
  strip remains eager but now uses a visually verified 3030x180 JPEG instead of
  the 4529x269 PNG (216,650 -> 90,687 bytes, -58.1%).
- Build/resource baseline: both revisions used `npm run build -- --manifest`.
  The baseline is `f6276c21787e1fc7a68d0c2e35debf5799282d6f`; route totals recursively
  include manifest `imports` (not `dynamicImports`) and gzip each emitted file
  with Node zlib. Direct `/tournament` JS+CSS fell from 364,896 to 273,819
  gzip bytes (-25.0%) and 44 to 29 requests. A resolved `/public/:slug` load
  fell from 365,913 to 274,866 gzip bytes (-24.9%) and 46 to 31 requests.
- Browser evidence: fresh service-worker-blocked Chromium contexts ran against
  `npm run preview -- --host 127.0.0.1 --port 4173`, using missing-record routes
  and in-memory fixtures only. The active Swiss round rendered `Round 1/5` and
  requested no Ranking, Results, Teams, TIR, bracket, or playoff chunks. Teams,
  Ranking, Results, TIR, single playoff, double elimination, and team playoff
  chunks appeared only when selected; all fixtures rendered without page
  errors. English, Ukrainian, French, and Spanish round/tab labels rendered.
- Exact commands and outcomes:
  - `npm run test:run -- src/__tests__/public-route-code-splitting.spec.js src/__tests__/public-tir-winner.mounted.spec.js src/__tests__/tir-public-view.mounted.spec.js src/__tests__/protocol-components.spec.js src/__tests__/playoff-ui-consistency.spec.js src/__tests__/presentation-parity.spec.js src/__tests__/tournament-record-consumers.spec.js src/__tests__/ranking-subtabs.mounted.spec.js`
    - 8 files and 90 tests passed.
  - `npm run lint` - passed.
  - `npm run test:run` - 72 files and 1,217 tests passed.
  - `npm run build -- --manifest` - passed; 2,586 modules transformed.
  - `npm run docs:check` - passed for 59 Markdown files.
- Deferred follow-up with reason: base-locale and authenticated-bootstrap
  splitting remains in `public-auth-bootstrap.md` to avoid overlapping that
  parallel task's `main.js`/`i18n.js` ownership.
- Documentation synchronized: this task records the temporary measurement and
  validation evidence. `docs/deployment.md` is unchanged because caching,
  hosting, and asset-delivery policy did not change.
