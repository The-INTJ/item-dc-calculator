# Temp Auth Context Plan

## Path forward: provide auth context to any component/page that wants it
- **Promote `MixologyAuthProvider` to a top-level provider** (e.g., `app/layout.tsx`) so any route can call `useAuth()` safely.
  - This lets us power inside jokes or legacy tweaks when a mixology user visits non-mixology pages.
- **Standardize on a single hook (`useAuth`)** for all components/pages that need auth state, so the implementation can evolve without touching every consumer.
- **Document the provider boundary** in a short README note so new pages/components know when `useAuth` is safe to call.

## Path forward: change homepage button when already signed in
- Use `useAuth()` to read `session.status` or `session.firebaseUid` and adjust button label/state accordingly.
- Example logic:
  - If `session.status === 'authenticated'` or `session.firebaseUid` is present → show “Go to Bracket”.
  - Otherwise → show “Sign in”.
  - Link the authenticated CTA to the bracket experience.

## Notes: Is Firebase auth enough or do we also need a React context?
- **Firebase auth alone is not enough for the UI** because components need a reliable, app-level way to access and react to auth state.
- **The repo already has a React context**:
  - `src/mixology/auth/AuthContext.tsx` provides a `MixologyAuthProvider` and `useAuth()` hook.
  - It abstracts Firebase auth via `createFirebaseAuthProvider()` and falls back to a mock provider if Firebase isn’t configured.
- **Recommended approach:** keep using the existing React context as the primary interface for components/pages.
  - Firebase provides the underlying auth state, but the context handles app-specific state, session metadata, and loading/error flows.
  - This also makes it easier to plug in mock auth for local development/testing.

## Open questions / follow-ups
- Do we want a global nav/user menu outside mixology routes?
