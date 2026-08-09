# Testing

Tests protect behavior at the narrowest useful layer. A passing full suite is not evidence that a changed edge case is covered; map the behavior first.

## Test locations

| Layer                          | Location                  | Purpose                                                              |
| ------------------------------ | ------------------------- | -------------------------------------------------------------------- |
| Pure service/unit              | `tests/*.test.js`         | Algorithms, transitions, defaults, normalization, errors             |
| Component/integration/contract | `src/__tests__/*.spec.js` | Rendering, events, store/service seams, consumer parity              |
| Browser flow                   | `e2e/*.spec.js`           | Critical user behavior, routing, Firebase integration, responsive UI |

Follow the nearest established naming convention when extending an existing area. Prefer a focused file over adding unrelated sections to an already large test file.

## Practical loop

1. Identify the public behavior, owner, consumers, persisted shapes, and existing tests.
2. Use `npm run docs:impact -- <changed-code-paths...>` only when the relevant
   docs or focused checks are not already obvious.
3. Add a deterministic characterization or regression test when coverage is
   missing and the behavior is important or risky.
4. Run that focused test against the current implementation.
5. Make the smallest coherent implementation and rerun the focused test.
6. Expand validation in proportion to the changed surface and risk.
7. Report the exact commands and outcomes in the task or PR; do not write changing test totals into canonical docs.

For a bug fix, the new test should fail for the reported defect before the fix whenever reproducible. If it cannot be reproduced locally, state the limitation and test the closest verified contract.

## Service matrix

A new or changed service covers the relevant cases:

- normal path;
- empty, malformed, boundary, and legacy input;
- string/number coercion where persisted data can vary;
- input immutability and no retained mutable references;
- stable errors and partial-failure/rollback behavior;
- timer, debounce, subscription, reconnect, and idempotent cleanup behavior;
- parity across consumers when replacing duplicate implementations.

Inject clocks, randomness, Firebase/HTTP adapters, `document`, and `window` targets rather than depending on live global state.

## Component matrix

Test observable behavior rather than internal implementation:

- rendered states and meaningful variants;
- emitted intent and parent/service integration;
- keyboard behavior, focus, ARIA state, and disabled/read-only behavior;
- localized empty, loading, success, and error states;
- responsive behavior that changes interaction or information;
- no direct mutation of props.

Do not retest a domain algorithm through every component. Prove it in the service suite, then cover one integration seam. Source-text assertions are reserved for architectural invariants such as required primitive reuse or forbidden raw colors; behavior tests remain primary.

Do not commit focused tests. Keep a skip or todo only when its reason and
follow-up are clear to reviewers; do not add custom marker syntax for routine
test management.

## E2E matrix

Read `e2e/README.md` before browser work. Reuse `e2e/helpers.js` and deterministic Firebase fixtures. Every created tournament or remote record must be cleaned up even when the test fails.

Add or update E2E coverage when a change affects:

- a critical create/draw/score/finish/archive flow;
- authentication, permissions, routing, or a Firebase path;
- legacy and envelope tournament compatibility;
- public/admin/TV parity;
- a responsive interaction that unit rendering cannot prove.

Prefer intercepted third-party responses over live external dependencies. Never approve a visual snapshot change without inspecting the rendered difference.

## Useful coverage

There is no repository-wide percentage target for every changed service. Cover
the decisions, meaningful branches, regressions, and failure paths introduced by
the change. Do not add low-value assertions merely to reach a number. Existing
area-specific gates such as `test:protocol:coverage` remain valid for their own
scope.

Example focused command:

```bash
npm run test:run -- tests/<service>.test.js
```

## Proportional validation

| Change                                                  | Normal local validation                                  |
| ------------------------------------------------------- | -------------------------------------------------------- |
| Documentation only                                      | `npm run docs:check`                                     |
| Narrow service or component change                      | Focused test plus the relevant lint command              |
| CSS or UI boundary change                               | Style/lint check plus focused rendered behavior          |
| Credentials, E2E configuration, or environment handling | `npm run check:secrets` plus the relevant E2E guard/test |
| Broad refactor, shared contract, or PR-ready feature    | `npm run lint`, `npm run test:run`, and `npm run build`  |

Run Playwright only for an affected browser contract and only against an
appropriate isolated target. CI runs the broad static/unit/build gate; local
work should get fast feedback first.
