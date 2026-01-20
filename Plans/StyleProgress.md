# Style Progress

## Status
Token and mixin stacks exist under mixology and legacy feature folders. Global styles and mixology feature styles are in place, but shared token consolidation and module migrations remain.

## Migration tracker
| Step | Description | Status | Notes |
| --- | --- | --- | --- |
| 1 | Establish token + mixin stacks per feature | ✅ Done | Mixology: `src/features/mixology/styles`, Legacy: `src/features/legacy/assets`. |
| 2 | Define shared primitives and semantic tokens | 🟡 In progress | Mixology tokens exist; shared base not extracted yet. |
| 3 | Connect semantic tokens to MUI themes | ⏳ Not started | No shared theme mapping yet. |
| 4 | Reduce global styles in app/globals.scss | ⏳ Not started | Global styles still include mixology landing styles. |
| 5 | Convert legacy calculator Sass to modules | ⏳ Not started | Legacy still uses legacy styles. |
| 6 | Convert mixology styles to modules | ⏳ Not started | Mixology uses feature-level SCSS files. |
| 7 | Container query audit and replacement | ⏳ Not started | No audit yet. |

## Implemented work
- Mixology token/mixin stack and semantic layers live in `src/features/mixology/styles`.
- Legacy token/mixin stack lives in `src/features/legacy/assets`.
- Mixology styles are loaded from `app/(mixology)/mixology/mixology.scss`.

## Notes
- StylePlan.md remains the source of truth; update it if the folder structure changes.
