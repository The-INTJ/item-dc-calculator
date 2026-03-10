# Org Map

## Main Areas

- `app/`: App Router entry points and layout groups.
- `app/(contest)/contest/[id]/page.tsx`: current interactive contest page.
- `app/(contest)/layout.tsx`: loads contest SCSS and wraps the route group with `ActiveContestProvider`.
- `app/RootLayoutClient.tsx`: wraps the whole app with `AuthProvider -> RoundStateProvider -> ContestProvider`, then renders `SiteHeader`.
- `src/features/contest/components/`: contest UI, admin, and display components.
- `src/features/contest/contexts/`: shared client state and auth.
- `src/features/contest/lib/helpers/`: pure derivation, getters, and mapping helpers.
- `src/features/contest/lib/firebase/`: Firebase providers and transactions.
- `src/features/contest/styles/`: SCSS partials, tokens, mixins, and modules.

## Alias Map

- `@/*` points at the repo root.
- `@/components/*` points at `src/components/*`.
- `@/contest/*` points at `src/features/contest/*`.
- Some files still import through `@/src/...`; new contest work should prefer `@/contest/*` plus `@/components/*`.

## Contest Page Chain

1. `app/RootLayoutClient.tsx`
2. `app/(contest)/layout.tsx`
3. `app/(contest)/contest/[id]/page.tsx`
4. `src/features/contest/components/ui/BracketView.tsx`

## Where New Display-Mode Code Belongs

- Route shell: `app/(contest)/contest/[id]/display/page.tsx`
- Feature brain: `src/features/contest/components/ui/ContestDisplay.tsx`
- Pure model builder: `src/features/contest/lib/helpers/displayModel.ts`
- Presentational bracket: `src/features/contest/components/ui/DisplayBracket.tsx`
- Styles: `src/features/contest/styles/_display-styles.scss`

## Important Caveats

- `ActiveContestProvider` is placeholder-only; contest selection now comes from the URL and `ContestContext`.
- `SiteHeader` is outside the contest route group, so full-screen display work must handle `RootLayoutClient`, not just contest layout files.
- The contest feature is the active product area; the DC calculator still shares the app shell, so global style changes can spill over.
