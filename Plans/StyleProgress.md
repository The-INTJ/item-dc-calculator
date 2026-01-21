# Style Progress

## Status
Token and mixin stacks exist under mixology and legacy feature folders. Container query mixins exist, and mixology feature styles are loaded separately, but shared token consolidation and module migrations remain. MUI themes exist but are not wired to semantic tokens.

## Migration tracker
| Step | Description | Status | Notes |
| --- | --- | --- | --- |
| 1 | Establish token + mixin stacks per feature | ✅ Done | Mixology: `src/features/mixology/styles`, Legacy: `src/features/legacy/assets`. |
| 2 | Define shared primitives and semantic tokens | 🟡 In progress | Mixology tokens exist; shared base not extracted yet. |
| 3 | Connect semantic tokens to MUI themes | 🟡 In progress | MUI themes exist in `src/features/legacy/theme`, but palettes are hardcoded and not mapped to semantic tokens. |
| 4 | Reduce global styles in app/globals.scss | ⏳ Not started | Global styles still include mixology landing styles. |
| 5 | Convert legacy calculator Sass to modules | ⏳ Not started | Legacy still uses legacy styles. |
| 6 | Convert mixology styles to modules | ⏳ Not started | Mixology uses feature-level SCSS files. |
| 7 | Container query audit and replacement | ⏳ Not started | No audit yet (container mixins exist). |

## Implemented work
- Mixology token/mixin stack and semantic layers live in `src/features/mixology/styles`.
- Legacy token/mixin stack lives in `src/features/legacy/assets`.
- Container query mixins are defined (`mixins/_container.scss`, plus `mixins/_layout.scss` container helpers).
- Mixology styles are loaded from `app/(mixology)/mixology/mixology.scss`.
- MUI themes exist at `src/features/legacy/theme` (legacy + mixology) but are not driven by semantic tokens.

## Notes
- StylePlan.md remains the source of truth; update it if the folder structure changes.
- Decision recorded: move themes to a shared location, drive MUI palette from semantic tokens, and remove `semantic/mixology` from legacy assets when migration work begins.
