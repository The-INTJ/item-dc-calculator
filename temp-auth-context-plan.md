# Temp Auth Context Plan

## Path forward: provide auth context to any component/page that wants it
- **Keep `MixologyAuthProvider` as the global provider for mixology routes.**
  - It already wraps mixology pages via `app/mixology/MixologyLayoutClient.tsx`, so any component under `/app/mixology/**` can call `useAuth()` directly.
  - If we need auth outside mixology routes, either:
    - **Option A:** Promote a top-level provider (e.g., in `app/layout.tsx`) that wraps the entire app, or
    - **Option B:** Create a small shared layout/provider per route segment that needs auth.
- **Standardize on a single hook (`useAuth`)** for all components/pages that need auth state, so the implementation can evolve without touching every consumer.
- **Document the provider boundary** in a short README note so new pages/components know when `useAuth` is safe to call.

## Path forward: change homepage button when already signed in
- Use `useAuth()` to read `session.status` or `session.firebaseUid` and adjust button label/state accordingly.
- Example logic:
  - If `session.status === 'authenticated'` or `session.firebaseUid` is present → show “Continue” / “Go to dashboard” / “Sign out” (whichever is intended).
  - Otherwise → show “Sign in”.
- If the homepage is outside the mixology provider scope, wrap it with the provider (see above) or add a light wrapper layout so `useAuth` is available.

## Notes: Is Firebase auth enough or do we also need a React context?
- **Firebase auth alone is not enough for the UI** because components need a reliable, app-level way to access and react to auth state.
- **The repo already has a React context**:
  - `src/mixology/auth/AuthContext.tsx` provides a `MixologyAuthProvider` and `useAuth()` hook.
  - It abstracts Firebase auth via `createFirebaseAuthProvider()` and falls back to a mock provider if Firebase isn’t configured.
- **Recommended approach:** keep using the existing React context as the primary interface for components/pages.
  - Firebase provides the underlying auth state, but the context handles app-specific state, session metadata, and loading/error flows.
  - This also makes it easier to plug in mock auth for local development/testing.

## Open questions / follow-ups
- Should the auth provider wrap the entire app, or only specific route segments?
- What should the signed-in homepage CTA say (“Continue”, “Go to Mixology”, “Account”, etc.)?
- Do we want a global nav/user menu outside mixology routes?
