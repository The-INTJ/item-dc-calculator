# Backend Progress

This document tracks backend implementation milestones for the Mixology Rating App. Each item is small, testable, and scoped to one behavior or surface. Check items off as they land.

## Legend
- ✅ Done
- 🟡 In progress
- ⬜ Not started

---

## Phase 0 — Foundations (current state)
- ✅ Provider abstraction exists (`MixologyBackendProvider`).
- ✅ In-memory backend provider works.
- ✅ Firebase client auth works.
- ✅ Session storage is in localStorage.

---

## Phase 1 — Auth + session refinements

### 1.1 Guest creation via URL
- ⬜ Parse invite query params on `/mixology` and persist `inviteContext` in session.
- ⬜ Auto-create guest session if unauthenticated and invite is present.
- ⬜ Add tests for invite parsing and session creation.

### 1.2 Cookie-backed guest identity
- ⬜ Add cookie helpers for `mixology_guest_id` and `mixology_guest_index`.
- ⬜ Ensure multiple guest profiles can exist on one device.
- ⬜ Add tests for cookie read/write and multi-guest selection.

### 1.3 Google OAuth
- ⬜ Add Google provider sign-in (Firebase Auth).
- ⬜ Add UI entry for Google sign-in.
- ⬜ Verify account creation populates Firestore profile.

---

## Phase 2 — Firestore data provider

### 2.1 Firestore read-only provider
- ⬜ Implement `MixologyBackendProvider` Firestore reads for contests/drinks.
- ⬜ Feature-flag provider swap behind env or config.
- ⬜ Add tests for fetch/deserialize mapping.

### 2.2 Firestore write primitives
- ⬜ Write helpers for contests and drinks (admin only).
- ⬜ Add validation for required fields.
- ⬜ Add tests for write success/failure paths.

---

## Phase 3 — Scores + N/A support

### 3.1 N/A score model
- ⬜ Add `naSections` to score model.
- ⬜ Allow `null`/missing section values when N/A.
- ⬜ Add validation to prevent scoring N/A sections.

### 3.2 Aggregation normalization
- ⬜ Implement per-section averages ignoring N/A.
- ⬜ Implement normalized overall score aggregation.
- ⬜ Add tests for mixed N/A/non-N/A scenarios.

---

## Phase 4 — Mixer flow

### 4.1 Mixer assignment
- ⬜ Add `mixerUserId`/`mixerGuestId` to drink model.
- ⬜ Add write path for marking mixer.
- ⬜ Add tests for mixer assignment.

### 4.2 Mixer scoring rules
- ⬜ Block mixer from submitting manual score.
- ⬜ Auto-generate max score when mixer set.
- ⬜ Add tests for enforcement + auto-score.

---

## Phase 5 — Admin surface (server-side)

### 5.1 Admin SDK setup
- ⬜ Add Firebase Admin SDK initialization for server routes.
- ⬜ Add env validation and secure credentials.
- ⬜ Add tests for server route auth guard.

### 5.2 Admin APIs
- ⬜ Implement `/api/mixology/contests` admin writes.
- ⬜ Implement `/api/mixology/contests/[id]/drinks` admin writes.
- ⬜ Add tests for admin-only access.

---

## Phase 6 — Invite validation API
- ⬜ Implement `/api/mixology/invite` validation endpoint.
- ⬜ Verify invite → contest mapping.
- ⬜ Add tests for invalid/expired invites.

---

## Phase 7 — Guest persistence in Firestore
- ⬜ Create `mixology_guests` records on guest creation.
- ⬜ Update `lastSeenAt` on session refresh.
- ⬜ Add tests for guest upsert logic.

---

## Phase 8 — Security rules hardening
- ⬜ Author rules for user profile read/write.
- ⬜ Restrict contest/drink writes to admin.
- ⬜ Validate score writes are by owner and not mixer.

---

## Notes
- All users are judges (any visitor can score).
- Use feature flags or env toggles when switching providers.
- Keep the legacy calculator isolated from mixology backend changes.
