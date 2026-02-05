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

## Phase 4: Rename Contexts & Providers ✅ Completed

Renamed `MixologyDataContext.tsx` to `ContestDataContext.tsx`, updated exports/consumers (`ContestDataProvider`, `useContestDetails`), switched events to `contest:data-updated` and `contest:phase-changed`, renamed `MixologyAuthProvider` to `AuthProvider`, renamed `MixologyBackendProvider` to `BackendProvider`, and updated RoundState phase descriptions to generic wording.

---

## Phase 5: Rename "Mixologist" → "Contestant" in Actions & Components ✅ Completed

Renamed contest actions (`addContestant`, `updateContestant`, `removeContestant`), renamed admin/component files (`AdminContestants.tsx`, `EntryCard.tsx`), updated references, and migrated admin-specific CSS hooks from `admin-mixologist-*` to `admin-contestant-*` plus entry card class names.

---

## Phase 6: Rename API Client Functions & URL Strings ✅ Completed

Updated `contestApi.ts`, `adminApi.ts`, and vote hooks to use `/api/contest/...` URLs and `/entries` path segments.

## Phase 7: Rename Firebase Collection Constants ✅ Completed

Renamed Firestore collection constants to generic names (`contests`, `guests`, `users`, `votes`), switched claims fallback to `contestRole`, and updated legacy admin header support to use `x-contest-role` plus `CONTEST_ALLOW_ADMIN_HEADER`.

## Phase 8: Update Navigation & Layout ✅ Completed

Updated nav/header routing and contest-facing links from `/mixology` to `/contest`, and kept layout/auth imports aligned with renamed contest auth provider paths.

## Phase 9: Update OpenAPI Spec ✅ Completed

Updated OpenAPI server URL/header to contest naming, renamed entries paths and `{entryId}` params, and removed deprecated `drinkId` references.

---

## Phase 10: Rename SCSS Files & Clean Up Styles ✅ Completed

Renamed `_drinks-styles.scss` → `_entry-styles.scss`, `mixology.scss` → `contest.scss`, and migrated `mixology-`/`-drink-` class prefixes under contest-facing app and feature files.

---

## Phase 11: Clean Up Contest Templates ✅ Completed

Renamed `MIXOLOGY_CONFIG` to `DEFAULT_CONFIG` and made `getDefaultConfig()` return the first available template with a safe fallback.

---

## Phase 12: Remove `useMemo` (DEV_STANDARDS compliance) ✅ Completed

Removed `useMemo` from `ContestDataContext.tsx` and `ContestContext.tsx` in favor of plain object construction.

---

## Phase 13: Simplify the `uiMappings.ts` Scoring ✅ Completed

No action required in current code: hardcoded breakdown-key logic and vote-total wrappers were already removed; `buildRoundDetail` already returns an empty `voteSummary` and entry summaries only.

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
