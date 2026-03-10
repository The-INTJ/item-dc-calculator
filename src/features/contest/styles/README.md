# Contest Styles

This folder owns contest-specific styling.

## Layout

- `tokens/`: contest design primitives
- `semantic/`: semantic mappings
- `mixins/`: reusable SCSS patterns
- `admin/`: admin-area partials split by dashboard, details, forms, and rounds
- top-level partials: feature entry points such as bracket, auth, display, and vote styles

## Rules

- Keep app-shell globals out of this folder unless a style is truly contest-wide.
- Prefer tokens and mixins over new one-off values.
- Shared primitives that are identical across contest and DC calculator code should live under `src/styles/system/`.
