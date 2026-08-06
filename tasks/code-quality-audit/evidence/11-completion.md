# Task 11 Completion Evidence

## Status

- Repository implementation: **complete and locally verified**
- Pull request: [#179](https://github.com/andrewKameniev/petanque-draw/pull/179)
- Pull-request CI: **not scheduled by GitHub; repository Actions policy/approval requires owner review**
- External credential checkpoint: **pending authorized rotation or revocation**
- Overall Task 11: **not complete until the external checkpoint is recorded**
- Verification commit: `5f845c3` on `codex/task-11-ui-agent-standards`
- Base: `f048877` (`origin/develop` when the branch was created)

## Production changes

- `TournamentNav` now requires localized names and stable ID prefixes, validates
  tab IDs, recovers from removed/invalid active tabs, exposes valid native tab
  semantics, and has visible light/dark keyboard focus without deriving its
  presentation from tournament business IDs.
- `PageLoader` now requires its localized status label, exposes one live name,
  becomes static for reduced motion, and does not trap pointer or keyboard input.
- `ScrollButtons` now uses named native buttons, an explicit window/container
  target contract, fail-closed missing selectors, visible focus, minimum targets,
  and instant scrolling under reduced motion.
- `RoundTimer` and `RoundTimerControls` now use a passive root plus dedicated
  native controls, validated states and custom minutes, localized names/errors,
  a single ended event per transition, and genuinely non-interactive read-only
  rendering. Fractional minutes are rejected instead of being silently coerced.
- Tir primitives now expose named and sized controls, valid roving tabs, pressed
  and disabled state, and visible/programmatic non-color result cues. Redundant
  unreachable public-detail/result copies were removed in favor of canonical
  primitives.
- `TrainingSession` no longer mutates its `session` prop; it owns a local working
  copy and emits/persists an explicit result payload through the parent boundary.
- Direct Tournament, Public, Archived, Docs, Training, Protocol, Ranking, Results,
  Draw, and tir consumers were migrated to the public primitive contracts.
- The exposed live E2E credential and shared-project write instructions were
  removed. Write-capable browser tests now require disposable emulator fixtures,
  the `demo-petanque-draw` project, Auth and RTDB emulator hosts, and a browser
  sentinel before writes.
- Root `AGENTS.md`, shared `RTK.md`, and `CLAUDE.md` now resolve to one validated
  engineering contract for Codex and Claude. AST-aware UI, instruction-contract,
  and secret gates prevent the corrected defects from recurring.

Tournament rules, scoring/qualification rules, Firebase data shapes, Public/TV
subscription ownership, and GitHub Pages deployment behavior were not moved into
the primitives or changed by this task.

## Primitive and CSS ownership

| Family                     | Markup and generic behavior owner                        | Parent/domain owner                                                           | Selector owner                                               |
| -------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Navigation                 | `TournamentNav.vue`                                      | tab availability and route/view state in each consumer                        | `.tournament-nav*` in `TournamentNav.vue`                    |
| Loading                    | `PageLoader.vue`                                         | load/error state and localized label in Draw/Public/PublicStats               | `.page-loader*` in `PageLoader.vue`                          |
| Scrolling                  | `ScrollButtons.vue`                                      | explicit target selection in the consumer                                     | `.scroll-buttons*` in `ScrollButtons.vue`                    |
| Timer                      | `RoundTimer.vue` and `RoundTimerControls.vue`            | persistence and tournament timer policy in Games/Cadrage/PlayOff/Public       | `.round-timer*` in the timer components                      |
| Tir tabs and scoring atoms | the corresponding `src/components/ui/Tir*.vue` primitive | scoring, qualification, availability, and persistence in tir/training parents | each primitive's matching `.tir-*` prefix                    |
| Public shells              | `PublicPageShell.vue`                                    | page content and route/data state                                             | `.public-page-shell*`; leakage is mounted and browser tested |

The remaining view-prefixed selectors are intentional composition/layout rules,
not alternate copies of primitive markup. The UI-standards manifest owns the
bounded legacy allowlist with a reason, owner, and expiry for every entry.

## Verification results

All commands ran against an isolated Task 11 worktree, so unrelated concurrent
Task 10/archive changes in the shared worktree were not part of these results.
The only change after the full static/unit/build matrix was the one-line E2E auth
readiness wait in `5f845c3`; the final emulator run used that exact source.

| Command                        |        Exit | Result                                                                                             |
| ------------------------------ | ----------: | -------------------------------------------------------------------------------------------------- |
| `npm run lint`                 |           0 | ESLint zero warnings; Stylelint and Prettier clean                                                 |
| `npm run test:run`             |           0 | 65 files, 1,188 tests passed                                                                       |
| `npm run test:ui-primitives`   |           0 | 6 files, 186 mounted/behavior tests passed                                                         |
| `npm run test:tooling`         |           0 | 3 files, 18 validator tests passed                                                                 |
| `npm run check:agent-contract` |           0 | AGENTS and CLAUDE entry points resolved through RTK with all 11 mandatory rule IDs and zero errors |
| `npm run check:ui-standards`   |           0 | `{ "ok": true, "violations": [] }`                                                                 |
| `npm run check:secrets`        |           0 | `{ "ok": true, "findings": [] }`                                                                   |
| pinned `actionlint`            |           0 | both new workflow files are syntactically and semantically valid                                   |
| `npm run test:ui-a11y`         |           0 | 28/28 passed; zero critical, serious, or unwaived moderate affected-region violations              |
| `npm run test:ui-visual`       |           0 | 31/31 active snapshots matched without an update flag                                              |
| direct `playwright ... --list` | 1, expected | aborted before browser startup because emulator mode was absent                                    |
| `npm run e2e:ui:emulator`      |           0 | 4/4 Task 11 browser integrations passed on the first attempt; emulators shut down cleanly          |
| `npm run build`                |           0 | production build completed; 2,583 modules transformed                                              |
| `git diff --check`             |           0 | no whitespace errors in Task 11 changes                                                            |

The build retains the pre-existing archive-index mixed-import and chunk-size
advisories; neither is a Task 11 failure or a new warning from affected code.

During isolation, the first visual invocation used a symlink to the main
worktree's `node_modules`. Vite correctly refused to serve font files outside the
isolated root, causing font-geometry snapshot differences. Installing the locked
dependencies inside the isolated worktree restored the local Inter fonts and the
unchanged normal command passed 31/31. The first emulator run revealed one auth
readiness retry; `login()` was fixed to wait for authenticated app UI, and the
final suite passed 4/4 without retries.

## Visual and manual review

The active matrix contains these 31 reviewed snapshots:

- Loader: `loader-light-desktop`, `loader-dark-desktop`,
  `loader-light-mobile`, `loader-dark-mobile`.
- Navigation: Tournament/Public/Archived/tir default and visible-focus variants
  at their representative light/dark desktop/mobile breakpoints.
- Tir: participant editable, atelier editable, public read-only, playoff
  comparison, and Training states.
- Timer: not-started, fixed running, paused, ended, restart-open, and read-only.
- Shell: Public responsive light desktop/dark mobile, PublicStats compact dark
  desktop, and Archived plain light mobile.
- Scroll controls: contained-target light desktop and window dark mobile, each
  in default and visible-focus states.

All images were inspected for clipping, overflow, focus visibility, control
placement, result cues, light/dark contrast, and responsive layout. Reviewer:
Codex. Result: pass. Artifacts live in `e2e/visual/__screenshots__/`.

The original 16 coarse pre-fix screenshots remain as baseline evidence from
commit `87d8802`; the 31 named state snapshots are the active read-only CI matrix.
Intentional differences are limited to focus rings, localized/semantic control
boundaries, static reduced-motion loader behavior, minimum target sizing, and
visible non-color tir result cues. No redesign or breakpoint change was accepted.

The same pre-fix accessibility suite failed on the base implementation (9
failures) for the representative removed focus, unnamed control, active motion,
color-only result, and nested-control faults, then passed unchanged after the
fixes. Mounted and validator fixture suites additionally exercise broken event,
label, ID, prop, and selector contracts and fail on those representative faults.

## Security and external checkpoint

- Required owner: repository owner / Firebase project owner
- Pending action: rotate or revoke the shared live-project account whose
  credential was previously committed in E2E documentation/helpers
- Repository result: plaintext credential and shared-account directions removed;
  the secret scanner passes without allowlisting that credential
- Runtime result: required write-capable E2E has no fallback route to the live
  project and fails closed unless the expected local emulator contract is present
- External result: not performed or verified because repository implementation
  authority does not authorize Firebase account mutation
- Git history: not rewritten

Task 11 must not be reported complete until the named owner performs the external
rotation/revocation and records the result without reproducing the credential.
There are no code, accessibility, visual, lint, test, or local E2E waivers.

## Deployment and CI boundary

Task 11 adds pull-request-only reusable quality validation. It has a zero diff
for `.github/workflows/deploy.yml` and `.github/workflows/static.yml`; merging to
`develop` therefore preserves the repository's existing GitHub Pages deployment
behavior.

GitHub did not schedule the new workflow for either PR #179's `opened` event or
the subsequent `synchronize` event. Both workflow files pass pinned actionlint,
the PR is mergeable, and repository Actions are active for the existing Pages
workflow. The authenticated contributor account receives HTTP 403 when reading
the repository Actions policy, so an owner/admin must inspect workflow approval
or allowed-actions settings. No remote quality result is claimed until GitHub
schedules those jobs.
