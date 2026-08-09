# Components and styles

New UI should resemble the small components in `src/components/ui/`, not the large legacy feature shells. Use the established Vue Options API unless a separate migration explicitly changes that convention.

## Reuse before creation

Search `src/components/ui/`, then the relevant feature directory, before writing markup. Existing examples include:

- `TournamentNav.vue` for accessible tournament/TIR tabs;
- `RoundTimerControls.vue` for timer presentation and intent events;
- `PublicPageShell.vue` and `PageLoader.vue` for public layouts and loading state;
- `TirScoreGrid.vue`, `TirScoreCircle.vue`, `TirScoreLegend.vue`, and related TIR controls;
- `ScrollButtons.vue` for page or container scrolling;
- `PublicGameCard.vue` plus `assets/css/public-game-card.css` for shared match rendering;
- `ConfirmDialog.vue` and existing modal components before introducing another dialog pattern.

Consider a primitive when multiple consumers share the same interaction or
visual concept. Extract only when the resulting props/events contract is clear
and each consumer becomes easier to understand. Domain behavior should be
centralized when separate copies could make different decisions.

## Component contract

New components must:

- declare typed props with required/default/validator rules and factory defaults for objects and arrays;
- declare every emitted event;
- keep props immutable and communicate changes through events;
- use slots for reusable content where a growing set of boolean props would encode layout variants;
- use stable `data-testid` values only where semantic queries are insufficient;
- translate visible text and accessible labels with vue-i18n;
- use semantic elements and explicit `type="button"` for non-submit buttons;
- support keyboard behavior, focus state, ARIA state, and reduced motion where relevant.

A primitive receives data through props and returns intent through emits. It does not read Pinia, call Firebase, inspect route-specific tournament shapes, or own a domain transition.

## Cohesion without fragmentation

Line counts are review signals, not limits. Keep a component together when its
template, state, and handlers form one readable flow—even when that is longer
than an arbitrary target. Split only when a section has a clear name and API,
has independent reuse or testing value, or contains a domain responsibility that
does not belong in the view. Avoid tiny pass-through components and abstractions
that make readers jump between files to understand one interaction.

## CSS token contract

`src/assets/css/variables.css` owns the primitive palette and light/dark semantic tokens. `color-schemas.css` overrides semantic brand tokens. Consumer styles use semantic tokens such as `--color-text`, `--color-surface`, `--color-border`, and domain-semantic `--tir-*` tokens.

Rules:

- no new hex, `rgb()`, `hsl()`, or named color values in component/view styles, including fallback values such as `var(--token, #fff)`;
- consumers do not use palette tokens such as `--red-400` directly; add or reuse a semantic token;
- define both light and dark meaning for a new semantic color;
- add schema overrides only when the meaning should vary by schema;
- allow raw colors only in token registries or necessary SVG, flag, canvas, PDF,
  export, or third-party-brand code; place an adjacent
  `quality-allow-color: <reason>` comment that names that category;
- named palette colors are literals too; `transparent`, `currentColor`, and
  `inherit` remain semantic CSS keywords;
- prefer scoped styles; use a dedicated shared stylesheet only when multiple renderers intentionally share the same class contract;
- do not add broad global selectors to solve a local layout issue.

Use existing spacing and Bulma utilities when they express the intent. Extract a shared spacing, radius, shadow, or z-index token only after it becomes a cross-feature design decision.

## Localization

All user-facing content is localized, including:

- headings, buttons, empty/error states, hints, and confirmation text;
- `aria-label`, `title`, `placeholder`, and screen-reader-only text;
- text passed to `alert`, `confirm`, or `prompt` while those APIs remain in use.

Stable status values are not translated in state. Translate them at the rendering boundary. Add the same leaf keys to `en`, `ua`, `fr`, and `es`, using the appropriate lazy locale module for feature-specific copy.

## Component verification

Cover the rendered states and interactions affected by the change, including
keyboard/ARIA or responsive behavior when relevant. Test domain behavior at the
service layer and keep component tests focused on the integration seam. Do not
add structural tests merely to enforce an abstraction choice.

See [Testing](./testing.md) for the required matrix and [Architecture and boundaries](./architecture-and-boundaries.md) for state ownership.
