# Style Plan

## Scope and intent
This document outlines the Sass architecture plan and migration roadmap. It focuses on tokens, mixins, module styling conventions, and a theme boundary between legacy calculator and mixology. No code changes are proposed here.

## Goals
- Establish a robust, modern Sass token system (colors, spacing, typography, radii, shadows, motion, z-index, etc.).
- Keep module class names clear and human‑readable without BEM conventions.
- Create a strong theming architecture that keeps legacy calculator and mixology mostly siloed while sharing tokens.
- Commit to a container query first approach immediately.
- Leverage MUI Base for accessibility and behavior without fighting styling.

## Guiding principles
1. Tokens are the single source of truth for primitive values.
2. Semantic tokens map shared primitives to theme intent (foreground, background, accent, etc.).
3. Theme layers are isolated by feature domain but draw from shared tokens.
4. Modules use simple, readable class names because scoping prevents collisions.
5. Container queries are preferred over viewport queries for layout decisions.
6. MUI Base components get minimal overrides and align with shared tokens.

## Proposed folder hierarchy (rooted in src/assets)
- [src/assets/](src/assets/)
  - [src/assets/tokens/](src/assets/tokens/)
    - [src/assets/tokens/_colors.scss](src/assets/tokens/_colors.scss)
    - [src/assets/tokens/_spacing.scss](src/assets/tokens/_spacing.scss)
    - [src/assets/tokens/_typography.scss](src/assets/tokens/_typography.scss)
    - [src/assets/tokens/_radii.scss](src/assets/tokens/_radii.scss)
    - [src/assets/tokens/_shadows.scss](src/assets/tokens/_shadows.scss)
    - [src/assets/tokens/_motion.scss](src/assets/tokens/_motion.scss)
    - [src/assets/tokens/_zindex.scss](src/assets/tokens/_zindex.scss)
    - [src/assets/tokens/_breakpoints.scss](src/assets/tokens/_breakpoints.scss)
    - [src/assets/tokens/_layout.scss](src/assets/tokens/_layout.scss)
  - [src/assets/semantic/](src/assets/semantic/)
    - [src/assets/semantic/_core.scss](src/assets/semantic/_core.scss)
    - [src/assets/semantic/_legacy.scss](src/assets/semantic/_legacy.scss)
    - [src/assets/semantic/_mixology.scss](src/assets/semantic/_mixology.scss)
  - [src/assets/mixins/](src/assets/mixins/)
    - [src/assets/mixins/_typography.scss](src/assets/mixins/_typography.scss)
    - [src/assets/mixins/_layout.scss](src/assets/mixins/_layout.scss)
    - [src/assets/mixins/_surface.scss](src/assets/mixins/_surface.scss)
    - [src/assets/mixins/_interactive.scss](src/assets/mixins/_interactive.scss)
    - [src/assets/mixins/_container.scss](src/assets/mixins/_container.scss)
  - [src/assets/functions/](src/assets/functions/)
    - [src/assets/functions/_color.scss](src/assets/functions/_color.scss)
    - [src/assets/functions/_math.scss](src/assets/functions/_math.scss)
  - [src/assets/config/](src/assets/config/)
    - [src/assets/config/_index.scss](src/assets/config/_index.scss)
  - [src/assets/index.scss](src/assets/index.scss)

Notes:
- The tokens folder is the primitive system.
- The semantic folder maps primitives to purpose and per‑theme intent.
- Mixins and functions stay global and reusable.
- [src/assets/index.scss](src/assets/index.scss) is the single entry for shared Sass.

## Naming conventions for module classes
- Use simple descriptive names without BEM and without scoping prefixes.
- Prefer `Card`, `Header`, `Actions`, `Meta`, `Toolbar`, `Sidebar`, `Badge`.
- Variants use suffixes like `isActive`, `isMuted`, `isGhost`.
- This relies on module scoping to avoid collisions.

## Theming architecture
### Shared layer
- Shared tokens and mixins live under [src/assets/](src/assets/).
- Semantic tokens are split into shared core and per‑theme overrides.

### Theme layers
- Legacy calculator theme: use semantic tokens in [src/assets/semantic/_legacy.scss](src/assets/semantic/_legacy.scss) and map to MUI theme in [src/theme/legacyTheme.ts](src/theme/legacyTheme.ts).
- Mixology theme: use semantic tokens in [src/assets/semantic/_mixology.scss](src/assets/semantic/_mixology.scss) and map to MUI theme in [src/theme/mixologyTheme.ts](src/theme/mixologyTheme.ts).

### Isolation rules
- Mixology and legacy styles do not import each other’s semantic tokens.
- Both import shared tokens via [src/assets/index.scss](src/assets/index.scss).
- Global styles stay minimal; only reset and shared helpers live in [app/globals.scss](app/globals.scss).

## Container query first approach
- Default to container queries for layout decisions and responsive structure.
- Use viewport media queries only for global layout shifts.
- Provide a mixin in [src/assets/mixins/_container.scss](src/assets/mixins/_container.scss) to normalize container usage.

## MUI Base strategy
- Use MUI Base components for behavior and accessibility.
- Tokens provide the values for colors, spacing, and typography.
- Keep overrides scoped and minimal, favoring `sx` or theme overrides.
- Confirm WCAG‑driven states (focus, hover, disabled, error) map to tokens.

## Migration plan (incremental)
1. Create token and mixin folders under [src/assets/](src/assets/).
2. Define shared primitives and semantic tokens for mixology and legacy.
3. Connect semantic tokens to MUI themes in [src/theme/](src/theme/).
4. Reduce global styles in [app/globals.scss](app/globals.scss) to essentials.
5. Convert legacy calculator Sass to modules with clear class naming.
6. Convert mixology styles to module equivalents using shared tokens.
7. Audit for container query usage and replace viewport media queries.

## Open decisions (resolved)
- Assets root: [src/assets/](src/assets/)
- Theme strategy: shared tokens, per‑theme semantic layers
- Container queries: immediate rollout
