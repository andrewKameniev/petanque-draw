# Documentation scope

Before editing docs, read [code-quality/README.md](./code-quality/README.md), then only [documentation.md](./code-quality/documentation.md) and the feature document being changed.

- Keep `README.md` files compact routing indexes.
- Put each durable rule in one canonical file and link to it elsewhere.
- Update the nearest index when a document is added, renamed, moved, or removed.
- Update architecture/data/feature/test docs in the same change that alters their contract.
- Use stable paths and exported names; avoid source line references and volatile test/file totals in canonical docs.
- Put dated evidence in an explicitly historical document.
- Verify relative links, referenced paths, commands, and package-script names before handoff.
- Do not claim documentation auto-updates without an enforcing generator or check.
- Use `npm run docs:impact -- <changed-code-paths...>` when routing is unclear;
  run `npm run docs:check` after changing documentation.
