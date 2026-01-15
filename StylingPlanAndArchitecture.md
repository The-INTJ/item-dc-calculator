# Styling Plan & Architecture

## Goals
- **Shared tokens, separate themes.** Keep a single source of truth for spacing, typography, and semantic color tokens while allowing the Mixology and Legacy (D&D calculator) apps to look distinct.
- **Composable layout system.** Establish layout primitives that scale from small screens to wide screens without hard-coded widths.
- **Container-first responsiveness.** Prefer container queries over viewport queries so components respond to the space they actually occupy.

## Current State
- Global styles live in `app/globals.scss`, with app styles and legacy styles imported there.
- Legacy styles exist in `src/*.scss` and mixology styles live in `app/mixology/**.scss`.
- Theme separation is now driven by body classes (`theme-mixology` and `theme-legacy`) that map to shared CSS custom properties.
- Container queries are available for the primary layouts and a few legacy components, but not fully migrated.

## Architecture Plan
### 1) Tokens
**Source of truth:** `src/variables.scss` for Sass variables, plus CSS custom properties defined in `app/globals.scss` for runtime theming.

**Next steps:**
- Define semantic CSS variables for typography scale, spacing steps, radii, and elevations.
- Map legacy colors to the semantic token layer (already started via `--legacy-*` in `app/globals.scss`).
- Replace direct hex usage in mixology-specific styles with semantic CSS variables.

### 2) Theme Separation
**Approach:**
- Body class determines theme values (`theme-mixology` or `theme-legacy`).
- Mixology and Legacy can share the same component styles while using different token values.

**Next steps:**
- Wrap any new components in tokenized styles (no raw colors unless in token definitions).
- Migrate existing legacy styles that still hardcode colors to use semantic tokens.

### 3) Layout & Containers
**Approach:**
- Use layout primitives like `.site-shell`, `.site-main`, and section containers.
- Replace fixed widths with responsive layout primitives (flex/grid, `gap`, padding, and alignment).

**Next steps:**
- Add `container-type: inline-size` to reusable layout wrappers (e.g. card, panel, section).
- Migrate remaining viewport queries to container queries when feasible.
- Audit components that assume a single viewport width and refactor to rely on container size.

### 4) Component Inventory (Visual)
**Needed components (tokenized):**
- Primary/secondary button variants (shared between mixology + legacy).
- Cards (base card + elevated card).
- Form fields (input, select, checkbox) with consistent spacing + focus styles.
- Hero section (mixology landing) with flexible content slots.
- Modal shell + modal content container.

## Progress Checklist
- [x] Theme body class toggling to separate mixology vs legacy.
- [x] Shared token mapping in `app/globals.scss`.
- [x] Removed hard-coded widths (non-token usage).
- [ ] Container queries for remaining legacy components (needs audit).
- [ ] Replace remaining hard-coded color values with semantic tokens.
- [ ] Build shared component styles (buttons, cards, form elements) using tokens.

## Notes / Future Migration Targets
- Legacy shard UI and effect editor still use direct Sass variables and some structural assumptions.
- Mixology admin + auth screens should migrate to semantic tokenized colors entirely.
- Introduce a typography scale token set to unify heading sizes across both apps.
