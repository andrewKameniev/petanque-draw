# Documentation Router

Use progressive disclosure: select the affected area below, read its index or
canonical document, and avoid loading unrelated plans or historical reports.
Code is authoritative when a document and the implementation disagree; repair
the canonical document in the same change.

**Scoped agent instructions:** [docs/AGENTS.md](./AGENTS.md)

| Change area                                       | Read first                                              | Update when                                                          |
| ------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------- |
| Engineering rules, reuse, duplication, CSS, tests | [Code quality index](./code-quality/README.md)          | A reusable boundary or quality rule changes                          |
| Active implementation task                        | [Task index](../tasks/README.md)                        | Scope, dependency, status, or evidence changes                       |
| Application boundaries and routes                 | [Architecture](./architecture.md)                       | Ownership, data flow, routes, or top-level directories change        |
| Pinia façade and runtime lifecycle                | [Main store architecture](./main-store-architecture.md) | Store API ownership or cleanup behavior changes                      |
| Persisted tournament shapes                       | [Data model](./data-model.md)                           | Stored fields, compatibility, or normalization changes               |
| Firebase paths, access, and synchronization       | [Firebase](./firebase.md)                               | Paths, rules, subscriptions, archives, or remote-write policy change |
| Tournament rules and algorithms                   | [System index](./systems/README.md)                     | Pairing, ranking, phase, or setting behavior changes                 |
| Statistics                                        | [Statistics](./statistics.md)                           | Statistics workflow or storage changes                               |
| Training                                          | [Training](./training.md)                               | Training workflow or storage changes                                 |
| Browser coverage                                  | [E2E guide](../e2e/README.md)                           | Harness, fixtures, credentials, or cleanup rules change              |
| Build and hosting                                 | [Deployment](./deployment.md)                           | Environment, build, or workflow behavior changes                     |
| Past audits and plans                             | [History index](./history/README.md)                    | Normally never; these documents are non-authoritative snapshots      |

## Documentation rules

- Keep one canonical owner for each fact; link instead of copying it.
- Prefer stable symbols and paths over line numbers or fixed test counts.
- Put task-specific deltas in task briefs, not repeated engineering rules.
- Update docs with behavior, contract, persistence, route, or workflow changes.
- Keep indexes concise enough to route an agent without loading every target.
