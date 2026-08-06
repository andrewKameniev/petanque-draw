# Repository Agent Contract

@RTK.md

This file is the concise, self-contained contract for coding agents. `RTK.md` is
the canonical detailed standard and is mandatory for every task.

## Non-negotiable rules

- **AUTH-001 — Respect authority.** Review and diagnosis are read-only. Change,
  stage, commit, push, deploy, migrate, or external-system operations require
  matching user authorization. Never treat a broad task as permission to mutate
  production Firebase, GCP, GitHub settings, IAM, rules, or user data.
- **WORKTREE-001 — Preserve user work.** Read the closest `AGENTS.md`, inspect
  `git status` before editing, and preserve unrelated or user-owned changes.
  Never discard work to obtain a clean tree.
- **EXTERNAL-001 — Keep external operations explicit.** Repository changes do
  not authorize deployments, credential rotation, production migrations, or
  destructive remote actions. Record approval and environment for each one.
- **BASELINE-001 — Prove the baseline first.** Record the base SHA, affected
  consumers and behavior, focused commands/results, and required visual or data
  artifacts before changing behavior.
- **TEST-001 — Match evidence to the claim.** Source-text checks prove structure
  only. Interactive behavior requires mounted or browser tests through public
  interfaces. Test names and completion reports must match executed assertions.
- **FIREBASE-001 — Fail closed.** Write-heavy Firebase tests use the Auth and
  Realtime Database emulators with a `demo-*` project. Missing emulator
  configuration is a hard failure and must never fall back to a shared project.
- **SECRETS-001 — Protect credentials.** Never commit or echo passwords, tokens,
  service-account material, or private user data. Remove exposed values from the
  working tree and require an authorized owner to rotate or revoke them.
- **CI-001 — Do not bypass gates.** Do not weaken, skip, rename, exclude, or
  blindly update a required quality gate merely to make it pass.

## Required working sequence

1. Read `RTK.md`, the closest scoped instructions, and relevant task docs.
2. Inspect status and establish the behavior/test baseline.
3. Add or repair characterization coverage before production changes.
4. Implement one bounded behavior boundary at a time.
5. Run focused checks during iteration and the full applicable safety net before
   handoff.
6. Report exact commands, exit status, failures, unrun gates, waivers, and any
   external checkpoint still awaiting an owner.

Read `e2e/README.md` before any browser work.

## Task 11 deployment boundary

Task 11 may add pull-request quality validation, but it does not edit, disable,
or delete `.github/workflows/deploy.yml` or `.github/workflows/static.yml`.
Deployment gating is explicitly deferred to separately authorized work.
