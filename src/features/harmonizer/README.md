# Hymn Harmonization Workbench

A hymn-harmonization workbench for beginner-to-intermediate hymn writers in
the a-cappella congregational (Primitive Baptist, seven-shape) tradition:
enter a melody snippet in ANY of the 24 offered keys, hear and edit the SATB
voicing, and get live engine analysis (chord naming, non-chord tones,
voice-leading facts) plus generated suggestions with beginner prose whose
every music term opens a glossary definition. The authoritative product spec
is [hymn_harmonization_workbench_spec.md](./hymn_harmonization_workbench_spec.md);
this README records what is BUILT.

Route: `/harmonizer` (route group `app/(harmonizer)/`, `noindex`).

## The surface rule (read this first)

**The selected reading's SATB notes are the source of truth.** Everything else
is derived from them, and Drew's constraint is absolute:

- Editing one note **never moves another note**, and never swaps the
  workspace out from under you. The melody is not a chord assigner — the whole
  SATB is the surface we generate *around*.
- The working reading's chord strip is **derived from its own sounding notes**
  (`domain/derive-harmony.ts`). Change the melody's la to sol over an
  alto/tenor/bass of mi/do/la and you get `Am7` — not a re-voiced C chord.
  Naming a sonority is pure math; whether it *works* is judgment we never fake.
- The namer is an honesty ladder (`domain/engine/chord-id.ts`): exact template →
  fifth-less seventh → incomplete triad → open fifth (first-class — the old
  books use them freely) → dyad-with-candidates → best-explaining subset →
  `?` plus the sounding letters. Never a guess, never an error.
- Regeneration only replaces the **suggestion cards** around the surface.
  Adopting one is an explicit click on that card. The working reading is always
  card A, badged "Your reading".

`domain/enumerate.ts` (suggestions) proposes; `domain/derive-harmony.ts`
(surface) reports. Anything that would rewrite the user's notes belongs in
neither.

## Status — v1: THE REAL MATH AND DATA ✅

The fixture-driven POC grew its engine (2026-07-30). What is live:

- **Every key.** 12 flat-preferred majors + 12 relative (la-based) minors in
  the Key select (`domain/keys.ts`), with a computed key-signature hint. A key
  change re-READS everything and moves nothing: pitches stay byte-identical
  while every stored scaleDegree re-derives (`domain/respell.ts`) — out-of-key
  notes read honestly as chromatic syllables (F in G major = te).
- **The engine** (`domain/engine/`): spelling-faithful chord identification
  and roman numerals with inversion figures (`chord-id.ts`, `roman.ts` — Bb
  in C reads bVII, C-over-E reads I6 with the slash symbol), harmonic
  segmentation with ornamental merging (`segmentation.ts` — a weak passing
  sixteenth joins the held chord instead of becoming a new one;
  prepared+resolving sus4s re-read as 4-3 suspensions), textbook non-chord-
  tone classification (`nct.ts` — solid on passing/neighbor/suspension,
  honestly 'ambiguous' elsewhere; the published ceiling for this task is
  F1≈0.72, so ambiguity IS correctness), voice-leading FACTS with zero
  judgment (`voice-leading.ts` — severity lives in style packs; parallels
  and open fifths are legitimate style here), a quiet Krumhansl key-sanity
  flag (`key-sanity.ts`), and ONE shared annotator (`annotate.ts`) so the
  surface and every card tell the same story.
- **Generation** (`generate.ts` + `style.ts`): a two-stage beam DP — chord
  paths costed by McHose chord prevalences, directed progressions, harmonic
  rhythm, gapped-melody weighting (pentatonic tunes lean away from ti-chords,
  weighted never filtered), and de Clercq cadence tables ranked by phrase
  intent (which ranks, never filters); then SATB voicing under hymnal ranges,
  completeness/doubling rules, root-position preference, and style-weighted
  smoothness, seeded across the approach seam. Boundary constraints bind
  (hold forbids a change, required forbids continuing). Common tones merge
  into held notes, as congregations sing them. Explainable holes absorb into
  the previous chord as classified ornaments; impossible locks still render
  honest `?` sketches with pinned notes verbatim.
- **Engine-first suggestions** (`suggest.ts`): the generator leads always;
  authored fixtures are Samples-menu demos, parity-regression corpora
  (`engine-regression.test.ts`), and the unsupported-mode fallback — never a
  match that outranks live analysis.
- **Beginner prose** (`knowledge/compose/`): the ExplanationComposer turns
  facts into solfège-first, glossary-marked sentences ("Hold the do chord
  (I, C) while the soprano moves sol–fa–mi…"), fills the effect summary
  ("settled close", "held breath", "open sound"), and stamps its provenance.
  Curated fixture prose is never overwritten — curated beats computed.
- **Persistence v2** (`harmonizer.projects.v2`): saves store notes + curated
  identity only; ALL analysis re-derives on load (the Tier-1 strip), so
  engine evolution never touches the schema again. Corruption→clean policy
  unchanged; the v1 key is removed on first write.
- **E2E**: `npm run test:e2e:harmonizer` (own Playwright config, plain
  `next dev` on port 3100, no Firebase) drives key change, autosave/reload,
  Samples, and glossary tips through real user surfaces only.

### The approach — what a mid-hymn snippet arrives from

**This is the hook for the real analysis.** Once a hymn is composed snippet by
snippet, a middle snippet cannot be read in isolation: plenty of first chords
look like nothing alone, but with the chord *and the note each voice held*
immediately before them, a passing tone is obvious. So the seam is carried as
data (`domain/approach.ts`), not redrawn as decoration:

- `AcceptedContext.previousVoicing` — which already existed but was always null
  — is now populated on apply and on rework, so the accepted context knows the
  notes the previous snippet ended on, not just its chord.
- `approachFromAccepted` reduces that to `ApproachContext`: the previous chord
  plus, per voice, the pitch and solfège it arrives from. `stampApproach` puts
  it on **every** candidate as `CandidatePath.approach` — including the working
  reading, which is safe because stamping touches no notes (the surface rule
  holds). Suggestions therefore *represent* that they come from something, which
  is what lets the lanes, the chord strip, and the cards all describe one seam.
- Display: each voice lane shows the incoming note in the gap between the part
  label and the first note — solfège over the pitch, with an arrow into the
  snippet. The CHORDS row shows the incoming numeral over its symbol the same
  way, and each suggestion card prefixes its path with `V7 →`.
- When only a chord is known (hand-picked accepted harmony, or the opening
  snippet of a fixture that declares one), `voices` is empty and only the chord
  shows. Nothing is invented.

The hook is CASHED: `domain/engine/annotate.ts` reads
`approach.voices[voice].pitch` so a first-note suspension prepared by the
previous piece is recognized (with an `approach_seam` evidence entry), the
sus4 re-read in `segmentation.ts` accepts seam notes as preparation, and the
generator's opening transition and first voicing column are seeded from the
approach chord and voices.

Schema note: `voices` is spelled out as four optional members, **not** an
enum-keyed `z.record`, which is exhaustive in zod v4 — a chord-only seam
(`voices: {}`) would fail to parse and take the saved project down with it. A
mid-hymn round-trip test in `projects/project-store.test.ts` guards that.

### The composition (accepted-context rail)

The rail is the piece so far, not just a context chip. Each applied fragment is
a chip you can **click to load back into the workspace** for rework, plus a ▶ to
hear that piece alone; the rail header plays **the whole hymn** end to end.

- `domain/composition.ts` retimes the applied fragments onto one continuous
  timeline (`compositionCandidate`) so playback is an ordinary
  `PlaybackService` call on a synthetic reading whose id is
  `COMPOSITION_CANDIDATE_ID`. It carries no interpretive claims — it is a
  projection for playback and display, never an authored reading.
- Rework is edit-in-place: `EDIT_APPLIED_FRAGMENT` loads the piece with the
  *preceding* piece as its accepted context (the first piece opens the hymn),
  and `APPLY_CANDIDATE` then **replaces it where it stands** rather than
  appending, keeping its id and position. Finishing a rework returns the
  accepted context to the hymn's tail, and the next-fragment chooser stays shut.
  `editingAppliedId` is transient session intent — like `lastGestureId` it is
  excluded from snapshots and persistence.
- Playback scoping: the workspace cursor and transport only respond to the
  workspace's own reading (`playback.candidateId === candidate.id`), so a
  whole-hymn pass highlights the sounding chip on the rail and leaves the note
  lanes alone.

Deliberately deferred (Drew's future enhancements, both read-only analyses over
exactly this concatenation): per-chord tallies across the hymn, and progression
stats that flag a cadence the piece has already used.

### The glossary (slice 4)

The teaching layer: ~50 tiered terms (`knowledge/glossary/` — core terms are
plain English, analysis terms may lean on core + five helpers, advanced on
anything below; the tier discipline, banned judgment words, and reachability
are all tested). Prose carries `[term-id]` / `[Display text|term-id]` markup
(`knowledge/markup/parse.ts`; unknown ids degrade to plain text with a one-time
dev warning), rendered by `components/shared/MarkedText.tsx`. Each term is a
hover-enhanced toggletip (`components/shared/Term.tsx`): 250ms hover preview,
click/Enter/Space pins, nested terms replace the panel **in place** with a
back link, one tip at a time via `knowledge/markup/tip-channel.ts`, and the
panel flips right-aligned instead of overflowing the nearest
`[data-glossary-boundary]` ancestor (no portals, no `title=`, never
`role="tooltip"`). Components never hardcode term ids next to musical values —
they go through the typed mapping tables (`roleTermIds`, `voiceTermIds`,
`qualityTermIds`, `solfegeTermId`, `numeralTermId`, `inversionTermId`).
Wired sites: drawer role badges + syllable headings, effect and evidence
prose, card summaries, lane part labels, the chord strip (now solfège-first:
root syllable · numeral · letter), and the header Help button, which opens the
full glossary grouped by tier. `fixtures/glossary-markup.test.ts` sweeps every
authored prose string so a typo'd term id fails CI, not the reader.

### Mobile (≤720px)

One breakpoint, `components/shared/_breakpoints.scss`. The chrome goes
single-column (context-bar fields stack label-over-control, the phrase-intent
group wraps instead of running off-screen, the project name truncates, the
Help button hides). Glossary tips have no hover path on touch — a tap opens
them pinned. The note surface **drops its card** entirely so the
time track gets the full width, and each lane becomes two rows: the part label
plus its checkbox and play button on top, the full-width track underneath.

Panning (`components/shared/pan.ts`, pure + unit-tested): the window is
measured in **beats, not notes** — a note can be any length, so four whole
notes need four times the room of four quarter notes. The window holds one
measure (`BEATS_PER_MEASURE`, the length of the default fragment); anything
longer widens the track to `totalUnits / 16 ×` its window and slides it with
`left` on a relatively-positioned grid, so **there is no scrollbar and a stray
swipe cannot move it — the slider between CHORDS and EFFECT is the only
control**. Edge
shadows mark whichever side continues out of view. While playing, the pan is
*derived* from the playback cursor (`panForUnit`) and the slider disables
itself; when playback ends `activeUnit` goes null and the slider's own position
takes over again, with no effect or timer involved. The boundary through-lines
hide here — stacked label rows break the straight column, so the chord strip's
internal bars carry the boundary instead.

Two environment notes for anyone verifying in the in-app Browser pane: it does
not composite frames, so **CSS transitions freeze at their start value** (a
stuck transition also outranks inline `!important`, which makes it look like a
property is ignored), and synthetic `computer` clicks may not reach React at
narrow widths — call `.click()` on the element instead.

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
(inner voices tucked, bass forward) and gain staging that keeps the summed peak
under the `Limiter(-1)` so it never pumps.

Note spacing is per instrument (`noteLengthFor`), because a congregation does
not enunciate each change or leave gaps between notes: synth patches sound for
exactly the written length (their own short release covers the join) and sampled
voices run 8% long so the change of note blends. Nothing clips short.

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
- ~~Suggested-reading cards are click-to-select (no Select buttons).~~
  Superseded 2026-07-30: cards carry an explicit **Select** button again —
  their prose now hosts glossary term triggers, and a whole-card click target
  fights the definition popovers.

Not yet implemented (spec milestones 4–6): note editing (the Add note button
will open a pick-a-part dropdown), boundary editing, stale-suggestion
handling, interactive locks, fixture-based refresh, apply, undo/redo,
fixtures B–D. Controls for these render disabled with a "Coming in a later
milestone" tooltip.

## Self-containment contract

- No imports from other features, no MUI, no Firebase, no backend. The only
  runtime dependencies beyond React are `zod` (fixture validation), `tone`
  and `smplr` (playback engines, both dynamically imported inside
  `services/tone-playback-service.ts` — never during SSR or in jsdom tests),
  and `tonal` (pure music math — statically imported ONLY inside
  `domain/engine/tonal-bridge.ts`, used for enharmonic interval arithmetic,
  key facts, and as the test oracle for our own spelling/chord math; never
  the source of numeric truth).
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
| `domain/` | Music/analysis/state types, locks, timing + signature math, the canonical pitch module (`pitch.ts`), all-keys scale math (`scale.ts`, `keys.ts`, `respell.ts`), and the reducer-facing analysis seams: `enumerate.ts` (proposes, via the engine) and `derive-harmony.ts` (reports, via the engine). |
| `domain/engine/` | The v1 engine: `tonal-bridge.ts` (the ONLY `tonal` import), `chord-id.ts`, `roman.ts`, `segmentation.ts`, `nct.ts`, `voice-leading.ts`, `annotate.ts`, `generate.ts`, `style.ts`, `key-sanity.ts`, `evidence.ts`. Pure, deterministic, synchronous. |
| `fixtures/` | Zod schemas, parse-at-module-load registry, authoring helpers, and the authored fixture data. |
| `knowledge/` | The glossary (tiered terms + typed mapping tables), the marked-text grammar (`[term-id]` parsing, tip-channel), the ExplanationComposer (`compose/` — fact→prose templates), and the versioned hymnal-default pack manifest (`packs/`). Data + pure functions; the UI lives in `components/shared/Term.tsx` / `MarkedText.tsx`. |
| `state/` | Reducer (house pattern: module-private pure reducer + hook), actions, selectors. |
| `services/` | `PlaybackService` contract, the instrument roster (`instruments.ts`), and the dual-engine (Tone.js synth + smplr samples) implementation. |
| `components/` | UI, organized by screen region; shared time-grid helpers in `components/shared/`. |

## Working on this feature

- Dev server: `npx next dev` → http://localhost:3000/harmonizer (plain Next;
  the repo-level `npm run dev` boots Firebase emulators this feature never uses).
- Tests: `npx vitest run src/features/harmonizer` (or repo-wide `npm test`).
- E2E: `npm run test:e2e:harmonizer` — own config
  (`playwright.harmonizer.config.ts`), plain `next dev` on port 3100, no
  Firebase emulators, real user surfaces only (the repo's no-drift rule).
- The fixture integrity tests (`fixtures/registry.test.ts`) enforce: soprano ≡
  melody, every voice sums to the fragment length, harmony events tile the
  fragment and respect `hold` boundaries, match signatures equal computed
  signatures, and all evidence references resolve. Author new fixture data
  against those rules.
