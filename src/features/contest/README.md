# Contest Feature

This is the active product area.

## Folder map

- `components/`: UI grouped by area
- `contexts/`: React state providers
- `lib/backend/`: provider interfaces and provider factory
- `lib/domain/`: pure contest logic and validation
- `lib/presentation/`: UI-facing derived models
- `lib/firebase/`: Firebase-backed provider implementations
- `lib/hooks/`: contest hooks
- `styles/`: contest tokens, mixins, and feature styles

## Conventions

- Import contest code through `@/contest/*`.
- Keep browser CRUD flows inside `lib/api/*`.
- Keep route-handler logic shared and documented, but do not treat it as the live client path unless that migration is completed.
- Keep pure derivation helpers in `lib/domain/` or `lib/presentation/`.
- Keep display/bracket models render-focused and testable.
