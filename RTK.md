# Shared Engineering Standard

This is the canonical detailed contract for Codex, Claude, and human
contributors. Tool-specific files may add operational guidance but may not
weaken this contract.

## Instruction precedence

1. Platform, system, and developer safety policies
2. Explicit current user intent and approvals
3. The closest scoped `AGENTS.md`
4. Root `AGENTS.md` and this shared standard
5. Task documentation
6. Tool-specific notes such as `CLAUDE.md`

A lower-precedence instruction cannot broaden authority or weaken a higher one.
References must not form circular imports.

## Authority and worktree safety

### AUTH-001 — Respect authority

Review, audit, diagnosis, explanation, and status requests are read-only.
Implementation permits repository changes within the requested scope, not
materially different work. Staging, committing, pushing, creating a pull
request, deploying, migrating, and changing external systems each require
matching authorization.

### WORKTREE-001 — Preserve user work

Read the closest instruction file and inspect `git status` before editing.
Treat pre-existing modifications and untracked files as user-owned. Preserve
them, avoid unrelated formatting, and stop for direction if safe isolation is
not possible. Never use destructive Git or filesystem operations to manufacture
a clean tree.

### EXTERNAL-001 — Keep external operations explicit

Do not mutate production Firebase/GCP data, rules, Functions, custom claims,
IAM, retention policies, deployments, repository settings, or credentials
without explicit environment-specific approval. Resolve targets with read-only
checks first. A repository task can prepare a proposed change without granting
permission to apply it remotely.

## Baselines and refactors

### BASELINE-001 — Prove the baseline first

Before production changes, record the base SHA, current status, affected
consumers, public contracts, states, themes, viewports, selectors, known
failures, and exact focused command results. Add characterization tests before
extraction. A confirmed bug gets a regression test that fails against the base
for the correct reason and passes after the fix.

Change one primitive family or behavior boundary at a time. Preserve public
contracts unless an intentional migration is documented and all consumers move
in the same bounded change. Do not absorb domain rules into presentation
components merely to reduce duplication.

## Vue and data boundaries

### VUE-001 — Keep ownership explicit

- Declare props with types, required/default behavior, and validators for closed
  value sets; declare emits and payload expectations.
- Do not mutate props or use `$forceUpdate` to mask unclear ownership.
- Keep computed/render paths free of persistence side effects.
- Prefer native semantic controls and stable IDs/keys.
- Normalize numbers and IDs at input and persistence boundaries.
- Version, cancel, or otherwise guard async loads so stale data cannot replace a
  newer selection.
- Do not access Vue or Pinia private runtime internals outside a documented test
  adapter.

## Accessibility, localization, and CSS

### A11Y-001 — Accessibility is compatibility

Keyboard and screen-reader behavior are release requirements. Never suppress
focus without a visible tested replacement. Icon-only controls require native
semantics, a localized name and state, and `type="button"`. Every input needs a
programmatic label and error relationship. Meaningful state cannot be conveyed
by color alone. Disable nonessential motion under reduced-motion preferences.

### I18N-001 — Localize at the boundary

Shared primitives receive localized user-facing strings and accessible names;
do not embed English defaults. Add each new key to every supported locale. Use
design tokens where available, declare one owner for shared selector families,
and namespace global CSS with a mounted non-leakage test.

## Testing and evidence

### TEST-001 — Match evidence to the claim

- Source-string and AST checks prove architecture only, never interaction.
- Interactive components require mounted event, focus, reactivity, and DOM
  semantics tests.
- Visual preservation requires deterministic, reviewed screenshots at declared
  states, themes, and viewports.
- E2E uses public behavior and deterministic fixtures; never Vue/Pinia private
  internals or arbitrary sleeps as proof.
- Snapshot updates cannot be used to silence an unexplained failure.
- Run focused tests while iterating, then formatting, zero-warning lint, full
  unit tests, affected accessibility/visual/E2E suites, and the build.
- Report exact commands, exit codes, pass counts, visual-diff disposition,
  accessibility results, unrun gates, and expiring waivers.

A required gate that was not run or did not pass makes the task incomplete.

### FIREBASE-001 — Fail closed around shared data

Write-heavy Firebase tests use disposable users and the Auth plus Realtime
Database emulators under one explicit `demo-*` project. The launcher, browser,
and fixture client must independently validate emulator mode, project ID, and
both loopback hosts. Missing or partial configuration aborts before a browser or
write starts. Shared-project smoke tests, if separately approved, are opt-in,
read-only, secret-injected, and never a fallback.

## Security and quality gates

### SECRETS-001 — Protect credentials

Never commit, paste into documentation, log, or artifact passwords, private
tokens, service-account keys, or unnecessary user data. If a credential is
tracked, stop reproducing it, remove it from the current tree, and record the
owner-approved rotation or revocation checkpoint. Do not rewrite history
without separate approval.

Browser code is not a trusted authority for ownership, retention, backup
integrity, destructive policy, or privileged success. Durability claims require
independent storage and a verified restore drill.

### CI-001 — Do not bypass gates

Keep first-party application, test, Function, and script code in scoped lint
configuration with zero warnings in CI. Do not weaken, skip, rename, exclude,
or blindly update a gate to obtain green output. Deployment must depend on the
same reviewed quality workflow used for pull requests once the authoritative
deployment workflow is owner-approved.

For Task 11 specifically, existing deployment workflows remain unchanged.
Task 11 may create pull-request validation, but deployment gating or workflow
retirement requires a separate change request.

## Handoff standard

The final handoff states what changed, exact verification and counts, known
failures, visual/accessibility status, waivers, external actions actually taken,
and remaining approval checkpoints. Never imply that an unrun test, undeployed
change, unrotated credential, or unverified restore is complete.
