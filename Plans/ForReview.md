# For Review – Code Smells & Follow-ups

This doc is a sweep for “intern-grade” smells: overgrown files, duplicated logic, mixed concerns, and architectural oddities to revisit.

## Files over 100 lines
(Counts are approximate and taken from a quick `wc -l` scan.)

- `src/features/mixology/server/firebase/firebaseBackendProvider.ts` (~728)
- `src/features/mixology/contexts/AdminContestContext.tsx` (~584)
- `src/features/mixology/contexts/AuthContext.tsx` (~521)
- `src/features/mixology/server/backend/inMemoryProvider.ts` (~440)
- `src/features/mixology/server/firebase/firebaseAuthProvider.ts` (~363)
- `src/features/mixology/components/adminPage/ContestSetupForm.tsx` (~320)
- `src/features/mixology/lib/auth/storage.ts` (~268)
- `src/features/mixology/hooks/useBackend.ts` (~248)
- `src/features/legacy/dcCalculations.ts` (~216)
- `src/features/mixology/components/adminPage/AttributeEditor.tsx` (~213)
- `src/features/mixology/components/adminPage/ContestConfigEditor.tsx` (~206)
- `src/features/mixology/lib/auth/types.ts` (~205)
- `src/features/mixology/lib/auth/mockAuthProvider.ts` (~205)
- `src/features/legacy/Effects/Common.tsx` (~188)
- `src/features/legacy/values.ts` (~187)
- `src/features/mixology/components/adminPage/ContestDetails.tsx` (~172)
- `src/features/mixology/components/adminPage/AdminDashboard.tsx` (~164)
- `app/api/mixology/contests/[id]/scores/route.ts` (~161)
- `src/features/mixology/types/types.ts` (~151)
- `app/(mixology)/mixology/onboard/page.tsx` (~147)
- `src/features/mixology/components/adminPage/ContestCategories.tsx` (~145)
- `src/features/mixology/hooks/useVoteScores.ts` (~140)
- `src/features/mixology/components/adminPage/AdminContestRounds.tsx` (~140)
- `src/features/mixology/contexts/MixologyDataContext.tsx` (~138)
- `app/(mixology)/mixology/account/page.tsx` (~137)
- `src/features/mixology/components/adminPage/AdminMixologists.tsx` (~132)
- `src/features/mixology/types/uiTypes.ts` (~130)
- `src/features/mixology/hooks/useSubmitVotes.ts` (~129)
- `src/features/mixology/components/auth/LoginForm.tsx` (~129)
- `src/features/mixology/lib/scoreUtils.ts` (~123)
- `src/features/mixology/lib/__tests__/uiMappings.test.ts` (~123)
- `src/features/mixology/components/auth/RegisterForm.tsx` (~118)
- `app/(mixology)/mixology/vote/VotePage.tsx` (~117)
- `src/features/mixology/server/backend/types.ts` (~116)
- `src/features/mixology/lib/auth/cookies.ts` (~113)
- `src/features/mixology/components/auth/GuestPrompt.tsx` (~107)
- `src/features/legacy/Header/TitleBar.tsx` (~106)
- `src/features/legacy/App.tsx` (~105)

## Duplicate-ish logic to consolidate

- **Auth “session hydrate” logic is repeated across login flows.** `login`, `loginWithGoogle`, and `loginAnonymously` all build near-identical `LocalSession` objects, merge guest votes, and persist to storage. This looks like a single helper (e.g., `buildSyncedSession` + `mergeGuestVotes`) that is currently copy/pasted in three places, increasing the chance of drift (e.g., profile defaults, invite context handling). See `AuthContext.tsx`. 
- **Firestore provider CRUD boilerplate is duplicated across contests/entries/judges/scores.** `firebaseBackendProvider.ts` repeats “get contest → find item → update array → update doc” across `createFirebaseEntriesProvider`, `createFirebaseJudgesProvider`, and `createFirebaseScoresProvider`. Similarly, `inMemoryProvider.ts` repeats near-identical CRUD logic across multiple provider factories. There is obvious refactor potential into generic helpers and/or a shared adapter. 
- **Legacy DC calculation logic has multiple overlapping paths.** `calculateEffectDC` routes to specialized handlers but also retains `originalEffectDCMethod`, with additional shared logic (e.g., dice contributions, base+mods). The combination of new rules and fallback rules makes it easy for implementations to diverge or for partial upgrades to leave old behavior in place. See `dcCalculations.ts`. 

## Odd architecture / mixed concerns

- **AuthContext is a “god object” for auth + storage + backend sync + cookie management.** `AuthContext.tsx` manages provider initialization, local storage, cookie state, guest identity, and remote sync. This makes it hard to reason about side effects, and increases risk of regressions. Consider splitting into a service layer (auth/session orchestrator) plus a lean context. 
- **Contest creation UI mixes heavy form state + networking + routing in one component.** `ContestSetupForm.tsx` validates data, constructs payloads, calls `/api/mixology/contests`, and navigates the router, all inside a single React component. This is manageable but busy; moving API calls and validation into hooks or service functions would lower cognitive load. 
- **API route handles multiple responsibilities in one file.** `app/api/mixology/contests/[id]/scores/route.ts` handles contest lookup, input validation, judge creation, score creation/update, and transformation of score breakdowns. A slim route handler calling a separate “score service” could reduce complexity and make it easier to unit test. 

## Other smells & cleanup ideas

- **Large files with multiple concerns likely hide local “state machines.”** `AdminContestContext.tsx`, `MixologyDataContext.tsx`, and the backend providers are all large and likely doing view-model orchestration that could be split into smaller modules. 
- **Deprecated naming drift (`drinks` vs `entries`).** Both backend providers support `drinks` as a deprecated alias while the rest of the code seems to prefer `entries`. This can confuse future contributors; consolidate on one name and deprecate the alias when possible. See `firebaseBackendProvider.ts` and `inMemoryProvider.ts`. 

## Suggested first refactors (low risk)

1. Extract a `buildSessionFromProvider()` helper in `AuthContext.tsx` and share it across login flows.
2. Extract CRUD helpers for array-backed items in `firebaseBackendProvider.ts` and `inMemoryProvider.ts`.
3. Move contest creation API logic (payload shaping + validation) into a small service module so `ContestSetupForm` can call it as a single async function.
4. Add tests around the DC calculation logic before changing behavior, since it includes a legacy fallback.
