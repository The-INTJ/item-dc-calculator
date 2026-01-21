# Style Plan

## Scope and intent
This document outlines the Sass architecture plan and migration roadmap. It focuses on tokens, mixins, module styling conventions, and a theme boundary between legacy calculator and mixology. No code changes are proposed here.

## Progress tracker
See [Style Progress](StyleProgress.md) for current styling task status and decisions.

## Goals
- Establish a robust, modern Sass token system (colors, spacing, typography, radii, shadows, motion, z-index, etc.).
- Keep module class names clear and human‑readable without BEM conventions.
- Create a strong theming architecture that keeps legacy calculator and mixology mostly siloed while sharing tokens where possible.
- Commit to a container query first approach immediately.
- Leverage MUI Base for accessibility and behavior without fighting styling.

## Guiding principles
1. Tokens are the single source of truth for primitive values.
2. Semantic tokens map shared primitives to theme intent (foreground, background, accent, etc.).
3. Theme layers are isolated by feature domain but draw from shared tokens.
4. Modules use simple, readable class names because scoping prevents collisions.
5. Container queries are preferred over viewport queries for layout decisions.
6. MUI Base components get minimal overrides and align with shared tokens.

## Current folder hierarchy
The token/mixin stack is implemented per feature domain:

- **Mixology styles**: [src/features/mixology/styles](src/features/mixology/styles)
  - `tokens/` (colors, spacing, typography, radii, shadows, motion, z-index, breakpoints, layout)
  - `semantic/` (core, legacy, mixology semantic layers)
  - `mixins/` (typography, layout, surface, interactive, container)
  - `functions/` (color, math)
  - `config/`
  - `index.scss` (single entry for mixology tokens)
- **Legacy styles**: [src/features/legacy/assets](src/features/legacy/assets)
  - Mirrors token/mixin stack for the legacy calculator

Mixology feature styles are loaded via [app/(mixology)/mixology/mixology.scss](app/(mixology)/mixology/mixology.scss), while global resets live in [app/globals.scss](app/globals.scss).

## Naming conventions for module classes
- Use simple descriptive names without BEM and without scoping prefixes.
- Prefer `Card`, `Header`, `Actions`, `Meta`, `Toolbar`, `Sidebar`, `Badge`.
- Variants use suffixes like `isActive`, `isMuted`, `isGhost`.
- This relies on module scoping to avoid collisions.

## Theming architecture
### Shared layer
- Shared tokens are currently duplicated between mixology and legacy stacks.
- Future work should consider extracting a true shared base to reduce duplication.

### Theme layers
- Legacy calculator theme: use semantic tokens under `src/features/legacy/assets/semantic`.
- Mixology theme: use semantic tokens under `src/features/mixology/styles/semantic`.

### Current reality (needs alignment)
- MUI themes live in `src/features/legacy/theme` (legacy + mixology) with hardcoded palette values.
- Semantic tokens are not yet mapped into those MUI themes.
- Legacy assets currently forward a `semantic/mixology` placeholder, even though it is not populated.

### Decisions (recorded)
- Move MUI themes to a shared location (e.g. `src/theme`) once migration work starts.
- Use semantic tokens as the source of truth that drive MUI theme palette values.
- Remove the `semantic/mixology` placeholder from the legacy assets stack to preserve isolation.

### Isolation rules
- Mixology and legacy styles do not import each other’s semantic tokens.
- Each feature loads its own token index (`styles/index.scss` or `assets/index.scss`).
- Global styles stay minimal; only reset and shared helpers live in `app/globals.scss`.

## Container query first approach
- Default to container queries for layout decisions.
- Use viewport media queries only for global layout shifts.
- Provide a mixin in `mixins/_container.scss` to normalize container usage.

## MUI Base strategy
- Use MUI Base components for behavior and accessibility.
- Tokens provide the values for colors, spacing, and typography.
- Keep overrides scoped and minimal, favoring `sx` or theme overrides.
- Confirm WCAG‑driven states (focus, hover, disabled, error) map to tokens.

## Migration plan (incremental)
1. ✅ Token/mixin stacks exist for mixology and legacy under their feature directories.
2. Define shared primitives and semantic tokens that can be reused across both stacks.
3. Map semantic tokens into MUI themes (or document a different source-of-truth).
4. Consolidate duplicated tokens into a shared base if/when needed.
5. Reduce global styles in `app/globals.scss` to essentials.
6. Convert legacy calculator Sass to modules with clear class naming.
7. Convert mixology styles to module equivalents using shared tokens.
8. Audit for container query usage and replace viewport media queries.

## Open decisions (resolved)
- Tokens live under feature-level style folders rather than a global `src/assets`.
- Theme strategy: shared primitives where possible, per‑theme semantic layers.
- Container queries: immediate rollout.

## Open decisions (needs confirmation)
_(none)_
