# Quick Wins (Mixology-first)

This document lists small, low-risk tasks that an AI agent can implement with a low chance of production build failures. All work should be **mixology-focused**. The legacy calculator should remain untouched except for purely organizational changes that do not alter behavior.

## Safety criteria (must meet all)
- **Mixology-only** scope (routes under `/mixology`, `src/mixology/`, or app-wide docs).
- **No behavior changes** to the legacy calculator.
- **No dependency changes** unless explicitly requested.
- **Small PRs** (single focus, easy review).
- **No global styling churn**; avoid touching legacy styling or global selectors.

## Guardrails
- Do **not** modify calculator logic or UI in `src/` unless the task is purely organizational and mechanical.
- If reorganizing legacy files, update imports mechanically and avoid changing logic, styles, or component behavior.
- Prefer docs, plan sync, and small mixology-only refactors.

## PR template (copy into PR description)
- **Goal:**
- **Scope:**
- **Risk level:** Low
- **Files touched:**
- **Testing:** Not run (docs-only) / Manual spot check
- **Acceptance check:**

## Ready-to-run quick wins

### Docs + plan hygiene
- [x] Add cross-links between plan and progress docs so each plan references its progress tracker.
  - Files: Plans/MasterPlan.md, Plans/UXPlan.md, Plans/BackendPlan.md, Plans/StylePlan.md
  - Acceptance: Each plan has a short “Progress tracker” section linking to the matching progress file.
- [x] Add Quick-Wins.md link to README “Progress & roadmap” section.
  - Files: README.md
  - Acceptance: README includes a link to this doc near other roadmap links.
- [x] Clarify legacy isolation in README (explicitly state legacy is direct URL only).
  - Files: README.md
  - Acceptance: README describes `/legacy` as direct URL access only.

### UX plan follow-through (docs-only)
- [x] Add a short “navbar status” note to UXPlan.md so it’s clear that the current navbar is generic and still needs to be minimized.
  - Files: Plans/UXPlan.md
  - Acceptance: UXPlan mentions current NavBar is not yet minimal and links to UXProgress.
- [x] Document the bracket library decision as “TBD” with evaluation criteria.
  - Files: Plans/UXPlan.md
  - Acceptance: A short criteria list (rendering, customization, accessibility, SSR) is added.

### Mixology-only UI refactors (safe, no behavior change)
- [ ] Extract `navItems` definition from the NavBar file into a small data module to keep the component under 80 LOC.
  - Files: app/components/NavBar.tsx, app/components/navItems.ts
  - Acceptance: No visual changes; `NavBar` remains functionally identical.
- [ ] Add lightweight `data-testid` attributes to Mixology landing CTAs for testing stability.
  - Files: app/page.tsx
  - Acceptance: No visual changes; elements include `data-testid` for `AuthPrimaryAction` and admin link.

### Small UI polish (mixology-only)
- [ ] Add a subtle empty-state copy to `/mixology/bracket` if data is missing (placeholder text only).
  - Files: app/mixology/bracket/page.tsx
  - Acceptance: Page renders a friendly message when no bracket data is present.
- [ ] Add basic loading copy to `/mixology/vote` when backend hook is loading.
  - Files: app/mixology/vote/page.tsx
  - Acceptance: Page shows “Loading current round…” while data is pending.

### Auth + session docs
- [x] Add a “Guest session cookies” section to MIXOLOGY_QUICKSTART.md (describe cookie names and purpose).
  - Files: MIXOLOGY_QUICKSTART.md
  - Acceptance: Section lists `mixology_guest_id`, `mixology_guest_index`, and `mixology_invite_context`.

### Legacy isolation (organizational only)
- [ ] Move legacy calculator files under a dedicated folder (e.g., `src/legacy/`) with **no logic changes**.
  - Files: `src/**`, `app/legacy/page.tsx`
  - Acceptance: Imports update mechanically, legacy calculator behavior unchanged.

## Not safe for quick wins
- Backend provider swaps or Firestore write paths.
- Auth/session logic changes beyond small doc updates.
- Global CSS refactors or token migrations.
- Anything requiring schema changes or new environment variables.
