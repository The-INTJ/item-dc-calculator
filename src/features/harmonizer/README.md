# Hymn Harmonization Workbench

Phase 0 UI proof of concept for a hymn-harmonization tool: enter a short
soprano melody fragment, compare three fixture-authored harmonizations, hear
them, and inspect the SATB voicing in solfège. The authoritative product and
technical specification is [hymn_harmonization_workbench_spec.md](./hymn_harmonization_workbench_spec.md).

Route: `/harmonizer` (route group `app/(harmonizer)/`, `noindex`).

## Status — slice 1 (spec milestones 1–3) ✅ + first design review applied

Implemented: workspace-first single screen rendering the default fixture
(`c-major-sol-fa-mi-continue`) — context bar, accepted-context rail, the
**Selected reading workspace** (the main working surface: four SATB lanes with
per-part checkboxes, boundary chips, chord lane, effect summary, analysis
drawer), and the **Suggested readings** palette below it. Playback: one master
Play button plays exactly the checked parts, per-lane solo buttons, loop,
moving cursor, live tempo, Space shortcut.

Design decisions locked by Drew's first review (2026-07-29) — these supersede
the spec's §9 five-region layout where they conflict:
- The selected-reading workspace is the primary interface, at the top; the
  suggested-readings cards are a core feature and sit directly below it.
- No separate melody strip or harmony-plan region — the soprano lane IS the
  melody; boundary chips and the chord lane live inside the workspace.
- Playback = checkboxes + one Play button (+ per-lane solo). No mode buttons
  (Melody/Harmony/SATB) — they read as redundant and unclear.
- Duration is communicated by visual spacing (grid spans), not notation. Keep it.
- Voices may be silent for parts of the fragment (rests): fixture integrity
  requires in-bounds, non-overlapping events per voice — NOT full coverage.

Not yet implemented (spec milestones 4–6): note editing (the Add note button
will open a pick-a-part dropdown), boundary editing, stale-suggestion
handling, interactive locks, fixture-based refresh, apply, undo/redo,
fixtures B–D. Controls for these render disabled with a "Coming in a later
milestone" tooltip.

## Self-containment contract

- No imports from other features, no MUI, no Firebase, no backend. The only
  runtime dependencies beyond React are `zod` (fixture validation) and `tone`
  (playback, dynamically imported inside `services/tone-playback-service.ts`).
- Design tokens are CSS custom properties scoped to the `.workbench` class in
  `components/HarmonizationWorkbench.module.scss` — never `:root`. A retheme
  is an edit to that one block.
- **No musical values in JSX.** Components render typed `CandidatePath` data;
  all musical content comes from schema-validated fixtures (`fixtures/`), all
  chrome copy from `content.ts`.
- Every interpretive claim in fixture data carries evidence with source
  (`computed | rule | corpus | curated | user`) and provenance. Do not attach
  universal effect claims (e.g. `soundsFinal`) to chord objects — see spec §19.2.

## Folder map

| Folder | Contents |
|---|---|
| `domain/` | Spec §15 music/analysis types, §14 state types, §16 locks, §17 fixture types, pure timing + signature math. Dependency-free. |
| `fixtures/` | Zod schemas, parse-at-module-load registry, authoring helpers, and the authored fixture data. |
| `state/` | Reducer (house pattern: module-private pure reducer + hook), actions, selectors. |
| `services/` | `PlaybackService` contract + Tone.js implementation. |
| `components/` | UI, organized by screen region; shared time-grid helpers in `components/shared/`. |

## Working on this feature

- Dev server: `npx next dev` → http://localhost:3000/harmonizer (plain Next;
  the repo-level `npm run dev` boots Firebase emulators this feature never uses).
- Tests: `npx vitest run src/features/harmonizer` (or repo-wide `npm test`).
- The fixture integrity tests (`fixtures/registry.test.ts`) enforce: soprano ≡
  melody, every voice sums to the fragment length, harmony events tile the
  fragment and respect `hold` boundaries, match signatures equal computed
  signatures, and all evidence references resolve. Author new fixture data
  against those rules.
