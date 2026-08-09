# E2E Agent Contract

These rules apply to every file under `e2e/` in addition to the root contract.

- Read [README.md](./README.md) before running or changing browser tests.
- The current suite writes to a remote Firebase project. Do not run it without
  explicit approval, `E2E_ALLOW_REMOTE=1`, and environment-injected test
  credentials.
- Never add credentials, private user data, or credential fallbacks to source,
  documentation, logs, screenshots, traces, or reports.
- New write-heavy coverage should use disposable Auth and Realtime Database
  emulator data when an emulator harness is available. Missing safety
  configuration must fail closed.
- Use unique deterministic fixtures and clean up every created tournament in a
  failure-safe teardown. Never use broad cleanup against data a test did not
  create.
- Test public behavior and stable selectors. Avoid framework internals and
  arbitrary sleeps; a source-text check does not prove browser interaction.
- Run the smallest affected spec while iterating, then the complete applicable
  browser matrix. Report exact commands and any suite not run.
