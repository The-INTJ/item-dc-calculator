# Plan: Genericize "Mixology" → Generic Contest App

**Date**: 2026-02-05  
**Goal**: Transform the app from a mixology-specific contest app into a generic contest app. Remove all mixology-specific naming, deprecated code, and domain-specific assumptions. Radically simplify. Net-delete lines.

---

## Guiding Principles

1. **Delete > Rename > Rewrite.** Prefer deleting code over renaming it. Prefer renaming over adding new code.
2. **Remove all `@deprecated` items.** This is a breaking change; we'll fix what breaks.
3. **If genericizing loses functionality, delete the functionality entirely.** Rebuild later.
4. **Do not touch `src/features/dc-calculator/` or `app/(dc-calculator)/`.**
5. **Delete tests if they obstruct.** (None currently exist, so this is moot.)
6. **Radically simple.** Fewer files, fewer abstractions, fewer layers.

---

## Phase 0: Preparation ✅ Completed

---

## Phase 1: Remove All Deprecated Code ✅ Completed

Deleted deprecated types (`Drink`, `MixologyScoreBreakdown`, `MixologyData`, `VoteCategory`), fields (`drinkId`, `currentDrinkId`, `categories`), functions (`buildVoteTotalsFromScores`, `buildVoteTotals`, `buildDrinkSummary`, `isBreakdownKey` in uiMappings), and the `/categories/` API routes. Updated all consumers to use `entryId` and `config.attributes` instead.

---

## Phase 2: Rename Feature Directory & Path Aliases ✅ Completed

Renamed `src/features/mixology/` to `src/features/contest/`, replaced all `@/mixology*` and `@/src/features/mixology*` imports, and simplified `tsconfig.json` aliases to only `@/contest` and `@/contest/*`.

## Phase 3: Rename App Router Paths ✅ Completed

Renamed `(mixology)/mixology` routes to `(contest)/contest`, renamed `app/api/mixology` to `app/api/contest`, and moved `drinks/[drinkId]` API routes to `entries/[entryId]`.

## Phase 4: Rename Contexts & Providers

### 4.1 — Rename `MixologyDataContext.tsx` → `ContestDataContext.tsx`

| Old Name | New Name |
|----------|----------|
| `MixologyDataState` | `ContestDataState` |
| `MixologyDataContext` | `ContestDataContext` |
| `MixologyDataProvider` | `ContestDataProvider` |
| `useMixologyData()` | `useContestDetails()` |
| `drinks` field | `entries` field |
| Event: `'mixology:contest-updated'` | `'contest:data-updated'` |

### 4.2 — Rename `RoundStateContext.tsx` events

| Old Name | New Name |
|----------|----------|
| Event: `'mixology:state-changed'` | `'contest:phase-changed'` |

Remove mixology-specific phase descriptions (e.g., "Drinks are being made"). Use generic wording:
- `set` → "Preparation phase. Participants joining."
- `shake` → "Active phase. Judging is OPEN."
- `scored` → "Scoring CLOSED. Tallying results."

### 4.3 — Rename `MixologyAuthProvider` → `AuthProvider`

In `src/features/contest/contexts/auth/AuthContext.tsx`:
- `MixologyAuthProvider` → `AuthProvider`
- Update the import in `RootLayoutClient.tsx`

### 4.4 — Rename `MixologyBackendProvider` → `BackendProvider`

In `src/features/contest/lib/helpers/types.ts`:
- `MixologyBackendProvider` → `BackendProvider`
- Update all references (in `backendProvider.ts`, `firebaseBackendProvider.ts`, etc.)

---

## Phase 5: Rename "Mixologist" → "Contestant" in Actions & Components

### 5.1 — Contest actions (in `contestTypes.ts`)

| Old Name | New Name |
|----------|----------|
| `addMixologist(contestId, { name, drinkName, roundId })` | `addContestant(contestId, { name, entryName, roundId })` |
| `updateMixologist(contestId, drinkId, updates)` | `updateContestant(contestId, entryId, updates)` |
| `removeMixologist(contestId, drinkId)` | `removeContestant(contestId, entryId)` |

### 5.2 — Admin components

| Old File | Action |
|----------|--------|
| `AdminMixologists.tsx` | Rename → `AdminContestants.tsx`. Replace all "mixologist"/"drink" language with "contestant"/"entry". |
| `DrinkCard.tsx` | Rename → `EntryCard.tsx`. Replace `DrinkCardProps` → `EntryCardProps`, etc. |
| `DrinkCard` references everywhere | Update to `EntryCard` |

### 5.3 — CSS class renames

All `mixology-*` CSS classes → `contest-*`. All `*-drink-*` classes → `*-entry-*`. Mass find-and-replace in:
- `src/features/contest/styles/*.scss`
- All component files referencing these classes

---

## Phase 6: Rename API Client Functions & URL Strings

### 6.1 — `contestApi.ts`

Update all URL strings: `/api/mixology/...` → `/api/contest/...`  
Update `/drinks` path segments → `/entries`

### 6.2 — `adminApi.ts`

Same URL updates as `contestApi.ts`.

### 6.3 — Hooks

Update URL strings in:
- `useVoteScores.ts` — `/api/mixology/contests/...` → `/api/contest/contests/...`
- `useSubmitVotes.ts` — same
- `useCurrentContest.ts` — `/api/mixology/current` → `/api/contest/current`

---

## Phase 7: Rename Firebase Collection Constants

### 7.1 — Collection names

These are Firestore collection names. Renaming them will orphan existing data — acceptable for a breaking change.

| Old Name | New Name |
|----------|----------|
| `mixology_contests` | `contests` |
| `mixology_guests` | `guests` |
| `mixology_users` | `users` |
| `mixology_votes` | `votes` |

Files affected:
- `scoreLock.ts`
- `guest.ts`
- `firebaseAuthProvider.ts`
- `useVoting.ts`

### 7.2 — Firebase custom claims

In `serverAuth.ts`:
- `claims.mixologyRole` → `claims.contestRole` (or just `claims.role` — simplify)

### 7.3 — API header

In `requireAdmin.ts`:
- `x-mixology-role` → `x-contest-role`
- `MIXOLOGY_ALLOW_ADMIN_HEADER` env check → just check a generic env var or delete (simplify)

---

## Phase 8: Update Navigation & Layout

### 8.1 — `navItems.ts`

```typescript
// New nav items with generic naming
export const navItems: NavItem[] = [
  { key: 'contest-home',    label: 'Home',          href: '/contest' },
  { key: 'contest-vote',    label: 'Current Round',  href: '/contest/vote' },
  { key: 'contest-bracket', label: 'Bracket',        href: '/contest/bracket' },
  { key: 'contest-account', label: 'Account',        href: '/contest/account', variant: 'secondary' },
  { key: 'contest-admin',   label: 'Admin',          href: '/contest/admin', variant: 'secondary', requiresAdmin: true },
];
```

### 8.2 — `NavBar.tsx`

Update `/mixology` prefix checks → `/contest`.

### 8.3 — `SiteHeader.tsx`

Update auth-required path prefixes from `/mixology/admin`, `/mixology/vote` → `/contest/admin`, `/contest/vote`.

### 8.4 — `app/layout.tsx` metadata

```typescript
export const metadata = {
  title: 'Contest App | Shard DC Calculator',
  description: 'A generic contest judging and scoring platform.',
};
```

### 8.5 — `app/RootLayoutClient.tsx`

Update import: `MixologyAuthProvider` → `AuthProvider` (from new path `@/contest/contexts/auth/AuthContext`).

---

## Phase 9: Update OpenAPI Spec

### 9.1 — `openapi.json`

- Update all `/api/mixology/...` paths → `/api/contest/...`
- Rename `/drinks` paths → `/entries`, `{drinkId}` → `{entryId}`
- Remove deprecated `drinkId` params/fields
- Remove `categories` endpoints entirely
- Update title/description to be generic
- Remove `x-mixology-role` header references → `x-contest-role`

---

## Phase 10: Rename SCSS Files & Clean Up Styles

### 10.1 — SCSS file renames

| Old | New |
|-----|-----|
| `_drinks-styles.scss` | `_entry-styles.scss` |
| `mixology.scss` | `contest.scss` |

### 10.2 — CSS class mass rename

Global find-and-replace in all `.scss` and `.tsx` files:
- `mixology-` → `contest-`
- `-drink-` → `-entry-`
- `admin-mixologist-` → `admin-contestant-`

### 10.3 — Delete `MIXOLOGY_QUICKSTART.md`

This is mixology-specific documentation. Delete it.

---

## Phase 11: Clean Up Contest Templates

### 11.1 — `contestTemplates.ts`

- Rename `MIXOLOGY_CONFIG` → `DEFAULT_CONFIG` (keep it as one of several templates)
- `getDefaultConfig()` returns a truly generic template or the first available template
- Keep all templates (mixology, chili, cosplay, dance) — they are already generic configs, just named data

---

## Phase 12: Remove `useMemo` (DEV_STANDARDS compliance)

As noted in exploration, `MixologyDataContext.tsx` (now `ContestDataContext.tsx`) uses `useMemo`. Per DEV_STANDARDS (React 19 + React Compiler), remove `useMemo` and use plain object construction.

Files to update:
- `ContestDataContext.tsx` (formerly `MixologyDataContext.tsx`)
- `ContestContext.tsx` — also uses `useMemo`

---

## Phase 13: Simplify the `uiMappings.ts` Scoring

### 13.1 — Remove hardcoded breakdown key logic

The hardcoded `breakdownKeys = ['aroma', 'balance', 'presentation', 'creativity', 'overall']` and related `isBreakdownKey()` function must go. Scoring attributes are dynamic per-contest via `contest.config.attributes`.

### 13.2 — Rewrite `buildVoteTotalsFromScores`

Accept `AttributeConfig[]` (from `contest.config.attributes`) instead of `VoteCategory[]`. Since `VoteCategory` is being deleted, this function must adapt or be deleted.

If the function is only used in `buildRoundDetail` and `buildVoteTotals`, and those are only consumed by `MixologyDataContext` (now `ContestDataContext`), consider whether this layer is even needed or if it should be inlined.

### 13.3 — Delete `buildVoteTotals` wrapper

It's a one-liner that just delegates. Inline its logic or delete.

---

## Phase 14: Final Cleanup ✅ Completed

Deleted `scripts/migrate-to-contest-config.js` and `MIXOLOGY_QUICKSTART.md`, updated docs/config (`DEV_STANDARDS.md`, `README.md`, `package.json` docs script path), and verified `npm run build` succeeds.

Note: grep still returns many `mixolog`/`drink` references outside `dc-calculator`; these are legacy leftovers from earlier phases and should be handled in a focused follow-up pass.

---

## Execution Order Summary

| Phase | Description | Estimated Impact |
|-------|-------------|-----------------|
| 0 | Prep: branch + baseline build | — |
| 1 | Delete all deprecated code | Net delete ~50 lines |
| 2 | Rename feature dir + path aliases | Net delete aliases (~20 lines) |
| 3 | Rename app router + API paths | Net zero (renames) |
| 4 | Rename contexts & providers | Net delete ~10 lines (simplifications) |
| 5 | Rename mixologist→contestant, drink→entry | Net delete some compat code |
| 6 | Update API client URL strings | Net zero |
| 7 | Rename Firebase collections + claims | Net zero |
| 8 | Update nav + layout | Net zero |
| 9 | Update OpenAPI spec | Net delete (remove deprecated params) |
| 10 | Rename SCSS + delete quickstart doc | Net delete |
| 11 | Clean up templates | Net delete ~5 lines |
| 12 | Remove `useMemo` | Net delete ~10 lines |
| 13 | Simplify scoring/uiMappings | Net delete ~30 lines |
| 14 | Final cleanup + build verification | Net delete (migration script, etc.) |

---

## Files to DELETE (complete list)

| File/Directory | Reason | Status |
|----------------|--------|--------|
| `scripts/migrate-to-contest-config.js` | One-time migration, deprecated data format no longer supported | ✅ Deleted |
| `MIXOLOGY_QUICKSTART.md` | Mixology-specific documentation | ✅ Deleted |
| `app/api/mixology/contests/[id]/categories/` (entire dir) | `VoteCategory` is deprecated; config attributes replace it | ✅ Deleted |

---

## Naming Glossary (Old → New)

| Old Term | New Term | Scope |
|----------|----------|-------|
| Mixology | Contest | App name, paths, CSS prefixes |
| Drink | Entry | Domain model, components, API paths |
| DrinkCard | EntryCard | Component |
| Mixologist | Contestant | UI labels, component names, action names |
| MixologyDataProvider | ContestDataProvider | Context |
| useMixologyData | useContestDetails | Hook |
| MixologyAuthProvider | AuthProvider | Context |
| MixologyBackendProvider | BackendProvider | Interface |
| /mixology/ | /contest/ | URL paths |
| /api/mixology/ | /api/contest/ | API paths |
| /drinks/ | /entries/ | API sub-paths |
| drinkId | entryId | Params, fields, variables |
| drinkName | entryName | Variables |
| mixology_contests | contests | Firestore collection |
| mixology_users | users | Firestore collection |
| mixology_guests | guests | Firestore collection |
| mixology_votes | votes | Firestore collection |
| x-mixology-role | x-contest-role | HTTP header |
| mixologyRole | contestRole | Firebase claim |
| mixology:* | contest:* | Custom DOM events |
| mixology-* | contest-* | CSS class prefix |

---

## Risk Notes

1. **Firestore collection renames orphan existing data.** This is expected for a breaking change. Production data (if any) will need a manual migration or fresh start.
2. **URL path changes break bookmarks & external links.** Expected.
3. **Firebase custom claims change breaks existing user sessions.** Users will need to re-authenticate or have claims re-set.
4. **OpenAPI spec changes break any external consumers.** Expected.
