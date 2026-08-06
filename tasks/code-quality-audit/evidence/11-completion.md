# Task 11 Completion Evidence

## External credential checkpoint

- Required owner: repository owner / Firebase project owner
- Status: **pending authorized rotation or revocation**
- Scope: the shared live-project account whose credential was previously
  committed in the E2E documentation and helpers
- Repository result: the plaintext credential and shared-account directions
  have been removed from the current tree; required write-capable E2E now fails
  closed unless both local Firebase emulators and the explicit
  `demo-petanque-draw` project are configured
- External result: no rotation or revocation was performed or verified during
  Task 11 because repository implementation authority does not authorize a
  Firebase account mutation

Task 11 must not be reported complete until the named owner performs the
rotation/revocation and records the result without reproducing the credential.
Git history was not rewritten.

## Deployment boundary

Task 11 adds pull-request-only quality validation. It does not edit, disable,
or delete `.github/workflows/deploy.yml` or `.github/workflows/static.yml`.
Deployment gating remains separately authorized follow-up work.
