# Hymn Harmonization Workbench

Phase 0 UI proof of concept for a hymn-harmonization tool: enter a short
soprano melody fragment, compare three fixture-authored harmonizations, hear
them, and inspect the SATB voicing in solfège. The authoritative product and
technical specification is [hymn_harmonization_workbench_spec.md](./hymn_harmonization_workbench_spec.md).

Route: `/harmonizer` (route group `app/(harmonizer)/`, `noindex`).

## Status — FULL POC ✅ (live regeneration + derivability probe + minor key + projects)

Everything below plus: **live regeneration** (every soprano/key/intent/lock/
accepted-harmony edit re-resolves suggestions synchronously — authored fixture
match → authored lock-set → naive computed skeletons → honest notice; no stale
state, no refresh button); **the derivability probe** (computed cards from
`domain/enumerate.ts` label every aspect ✓ computed / ✎ needs data / ? unsure —
the engine-vs-data question answered in the UI); working note tools (diatonic
▲▼ via `domain/scale.ts`, insert/delete with rests); five fixture families
(A + lock-alternative sets, B suspension, C I6, D build [arrow-reachable hero
demo], E la-based A minor with si); one Key select (C major / A minor);
Samples menu; boundary through-lines merging into the chord strip; apply →
chips → next-fragment chooser; undo/redo with drag coalescing; **projects**
(`projects/project-store.ts`: `harmonizer.projects.v1`, zod-guarded,
corruption-safe, autosave + header switcher). Suggestion resolution lives in
`domain/suggest.ts`; the reducer imports the static registry (pure data) by
design.

### Sound toggle (swappable instruments)

The context bar's **Sound** select swaps the playback instrument live
(persisted in `harmonizer.sound.v1`). Two engines behind one
`ActiveInstrument` interface in `services/tone-playback-service.ts`, with the
roster as pure data in `services/instruments.ts`:

- **Synth patches (Tone.js, instant/offline):** *Soft organ* (default — a
  "principal" voicing of sine fundamental + octave partials only, so low bass
  can never imply a second pitch class; a triangle's 3rd harmonic is a twelfth,
  which is exactly the old "bass sounds like two notes" artifact), *Warm reed*
  (FM, harmonicity 1 so every sideband lands on an integer harmonic), and
  *Warm synth* (the original triangle, kept for A/B).
- **Sampled (smplr, fetched on first use):** *Piano* (SplendidGrandPiano),
  *Church organ*, *Choir*, *Strings* (GM soundfonts, ~3 MB each). Samples are
  cached in the browser Cache API (`CacheStorage`), and a failed load falls
  back to the default synth with a console warning.

Chord quality fixes that apply to every synth patch: per-voice velocities
(inner voices tucked, bass forward), gain staging that keeps the summed peak
under the `Limiter(-1)` so it never pumps, and a release trim (0.85) that
lets each chord's tail decay before the next onset instead of flanging
against retriggered common tones.

## Historical status — slice 1 (spec milestones 1–3) + first design review

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
- **Notes are the edit surface** (second review, same day): click a note for
  its tool cluster (▲▼ pitch, lock, delete, flanking "+" — only lock is live
  this slice); drag its edges to resize. Drag semantics live in
  `domain/voice-editing.ts`: an inner edge moves the shared boundary between
  contiguous notes (total conserved), the first note's left edge can only
  create a leading rest, the last note's right edge extends freely, and
  Shift-drag ripples later notes (part length changes). Soprano edits mirror
  onto the melody fragment. Locks are per-note ConstraintLocks — no row locks.
- Suggested-reading cards are click-to-select (no Select buttons).

Not yet implemented (spec milestones 4–6): note editing (the Add note button
will open a pick-a-part dropdown), boundary editing, stale-suggestion
handling, interactive locks, fixture-based refresh, apply, undo/redo,
fixtures B–D. Controls for these render disabled with a "Coming in a later
milestone" tooltip.

## Self-containment contract

- No imports from other features, no MUI, no Firebase, no backend. The only
  runtime dependencies beyond React are `zod` (fixture validation), `tone`,
  and `smplr` (playback engines, both dynamically imported inside
  `services/tone-playback-service.ts` — never during SSR or in jsdom tests).
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
| `services/` | `PlaybackService` contract, the instrument roster (`instruments.ts`), and the dual-engine (Tone.js synth + smplr samples) implementation. |
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
