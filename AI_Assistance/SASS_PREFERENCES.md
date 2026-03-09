# SASS Preferences

## Current Style Entry Pattern

- `app/(contest)/contest.scss` is the contest route-group style aggregator.
- Feature partials live in `src/features/contest/styles/`.
- Tokens live under `src/features/contest/styles/tokens/`.
- Reusable mixins live under `src/features/contest/styles/mixins/`.

## Existing Contest Style Language

- Bracket styles use BEM-like names such as `contest-bracket__*` and `contest-matchup-card__*`.
- `_bracket-styles.scss` already uses container queries for mobile vs desktop behavior.
- Typography, spacing, and surface rules are mostly expressed through tokens and mixins.

## Preferred Way To Add New Styles

- Create display-specific styles in `src/features/contest/styles/_display-styles.scss`.
- Import that partial once from `app/(contest)/contest.scss`.
- Reuse existing spacing, typography, color, shadow, and transition tokens.
- Reuse mixins for typography, layout, scroll snap, and surface patterns.
- Keep TV-mode overrides separate from `_bracket-styles.scss` until the new display is stable.

## Do

- Prefer token variables over raw hex, raw rgb, or one-off spacing values.
- Prefer mixins like `type-*`, `container(...)`, `scroll-snap-*`, and surface helpers over ad-hoc copies.
- Keep selectors feature-scoped and aligned with the current contest naming style.
- Use a new `contest-display__*` namespace for display-only classes.

## Watch-Outs In The Current Styles

- `type-secondary` in `mixins/_typography.scss` references `$font-size-base`, which does not appear in the token file.
- `mixins/_surface.scss` still has a few hardcoded error colors; treat those as cleanup targets, not the preferred pattern.
- The token set is useful but not fully normalized yet, so double-check names before creating new ones.
