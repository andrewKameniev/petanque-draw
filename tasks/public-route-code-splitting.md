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

- [ ] A Swiss current-round load does not download TIR or inactive playoff
      component chunks.
- [ ] Ranking, Results, Teams, and system-specific chunks load when first used.
- [ ] Public loading/error states and all four locales remain functional.
- [ ] Cold compressed JS/CSS and media totals improve against the recorded
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

- Changed behavior:
- Exact commands and outcomes:
- Deferred follow-up with reason:
- Documentation synchronized:
