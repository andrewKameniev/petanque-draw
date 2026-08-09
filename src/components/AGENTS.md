# Component scope

Before editing a component, read `../../docs/code-quality/README.md`, then only [components and styles](../../docs/code-quality/components-and-styles.md) plus [testing](../../docs/code-quality/testing.md). Read the architecture contract only when state or persistence is involved.

- Keep the established Vue Options API.
- Search `components/ui/` and the feature directory before creating UI.
- Extract a primitive only when multiple consumers share the same concept and a
  small props/events API improves readability. Do not extract by line count.
- Use typed props, factory defaults, validators where useful, and declared emits.
- Keep primitives free of Pinia, Firebase, routes, and tournament-domain decisions.
- Do not directly mutate persisted tournament state; emit intent or dispatch a store action.
- Put domain rules in the canonical service and test them there.
- Use semantic CSS variables; add no raw color literals or local token fallbacks.
- Localize visible text and ARIA/title/placeholder text in all supported locales.
- Preserve keyboard, focus, ARIA, responsive, and reduced-motion behavior.
- Treat large existing SFCs as migration baselines, not templates for new code.

Run focused component/service tests while editing, then use the proportional
validation guidance in the testing contract.
