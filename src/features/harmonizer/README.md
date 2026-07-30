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

### The editing pass (2026-07-30, Drew's QoL review)

The workbench stopped explaining itself with buttons and started explaining
itself with the notes.

- **Notes touch.** No inline margin between cells; the seam between two notes
  IS the control — one draggable bar per boundary (a note owns the bar on its
  right; the run's first note also owns the opening bar, which is the one that
  can open a leading rest). Only the run's outer ends are rounded — and they
  are the only ones with a strong border: internal edges are a hairline
  (`--wb-line`), so a shared seam is one light line rather than two stacked
  dark ones. The grip itself is a short 2px mark at 45% opacity that brightens
  when you hover the note and turns accent when you hover the seam; the hit
  area stays the full 14px either way. (First pass drew a full-height 4px
  slab — same geometry, far too heavy.)
- **Ghost notes replace the "+" affordances and the Add note menu.** Clicking a
  note puts a translucent, dotted note on each side showing the syllable it
  would create over a small black `(click to add)`. Each ghost claims its room
  by shrinking the neighbour it abuts (`makeRoomLeft`/`makeRoomRight`); at the
  run's own ends there is no neighbour to displace, so the ghost moves *inside*
  and the edited note shortens instead — which is also what happens to a note
  long enough to fill the whole track.
- **One transport.** Loop is gone; Play is a big mahogany Material Symbol,
  box-free, right-aligned in its own container. The space the old buttons held
  now carries the three gestures you cannot guess by looking (drag the bars,
  click a note, check the parts).
- **Every symbol is a Material Symbol** (`components/shared/Icon.tsx`, font
  loaded once by the route-group layout) and **no symbol sits in a white box**
  — icon-only controls use the `wb-icon-button` mixin: no background, no
  border, colour on hover.
- **Phrase intent moved** out of the settings bar and in beside the readings it
  steers, as "What do you want this section to do?" — it is a question about
  the next reading, not a setting about the piece. What it actually drives:
  `style.cadenceCost(intent, cadence)` inside the generator's beam search
  (`domain/engine/generate.ts`), which re-prices every candidate path by how
  it ends — `close` rewards authentic cadences and penalises half cadences,
  `build` and `approach_cadence` do the reverse, `continue` penalises arrival
  outright. Changing it visibly swaps the suggestion **cards** (the C-major
  demo goes from the authored trio to `V → IV6 → I` / `V6/5 → I` on `close`).
  It never touches the workbench: the working reading survives every
  regeneration by the surface rule, so the card you are staring at is exactly
  the one that cannot change.
- **Settings labels teach themselves.** Key/Tempo/Sound are glossary Terms
  (`tempo` and `sound` are new core terms, allowlisted in
  `STANDALONE_TERM_IDS` because nothing in the harmonic vocabulary links to
  them). Their field is a `div`, not a `<label>` — a label would forward the
  Term button's click to the control it wraps.
- **Engine bookkeeping is a dev view.** Provenance badges and derivability
  chips ("chord path", "voicing", …) are hidden unless `?dev=1`
  (`components/shared/useDevFlag.ts`, remembered in localStorage, `?dev=0` to
  clear). The emotional descriptors — "settled close", "strong dominant
  arrival" — always show: a musician judges a reading by how it sounds, not by
  which subsystem produced it.
- **The selected reading's card reports the workbench, not itself.** Whichever
  card is the selected reading is titled **Current chords** and carries no
  prose at all: chord path, bass outline, then `Your work's reading:` and
  chips. The reading's *name* is one of those chips, and only when something
  stands behind it — a name equal to the chord path (the engine's own
  `titleFromHarmony`) is dropped, because the line above already said it.
- **Every popover clamps to the viewport.** `PopoverMenu` and the glossary
  `Term` tip each measure on open and translate themselves back inside
  (`VIEWPORT_MARGIN`). Flipping sides is not enough on a phone: a trigger in
  the middle of the screen overflows whichever way the panel hangs. `Term`
  clears its own transform before measuring, so the maths is never against a
  previous nudge, and re-measures when nested navigation changes the panel.

### The composition (accepted-context rail)

The rail is the piece so far, not just a context chip. Each applied fragment is
a chip you can **click to load back into the workspace** for rework, plus a ▶ to
hear that piece alone; the rail header plays **the whole hymn** end to end.

- `domain/composition.ts` retimes the applied fragments onto one continuous
  timeline (`compositionCandidate`) so playback is an ordinary
  `PlaybackService` call on a synthetic reading whose id is
  `COMPOSITION_CANDIDATE_ID`. It carries no interpretive claims — it is a
  projection for playback and display, never an authored reading.
- **Add fragment** (the rail's own button) is the only way a reading joins the
  composition. It commits and continues in one undoable step
  (`START_NEXT_FRAGMENT`): the working reading is applied, then the next
  fragment opens already **holding the chord this one lands on** — one beat,
  one note per part, at exactly the pitches the previous fragment ended with
  (`domain/next-fragment.ts`). Starting from silence made every fragment feel
  like a new piece; starting from the held chord makes the hymn continuous, and
  the first thing you do is move away from it. `APPLY_CANDIDATE` survives as
  the plain commit half (`applyWorkingReading`), no longer wired to a button.
- Rework is edit-in-place: `EDIT_APPLIED_FRAGMENT` loads the piece with the
  *preceding* piece as its accepted context (the first piece opens the hymn),
  and applying then **replaces it where it stands** rather than appending,
  keeping its id and position. Finishing a rework returns the accepted context
  to the hymn's tail. `editingAppliedId` is transient session intent — like
  `lastGestureId` it is excluded from snapshots and persistence.
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
single-column and the settings **fold away**: the context bar collapses to the
word "Settings" and a caret — *text inside the card, not a button drawn inside
a card* — and the toggle fills the whole pill and owns its padding, so a tap
anywhere on the pill opens it. Key/tempo/sound drop out underneath, with
**Samples at the bottom of the opened card**; neither exists while it is
closed. (They are set once per hymn and cost a screen every time you look at
the notes.) The project name truncates and the Help button hides. Glossary tips
have no hover path on touch — a tap opens them pinned. The note surface **drops
its card** entirely so the time track gets the full width, and each lane
becomes two rows: the part label plus its checkbox and play button on top, the
full-width track underneath — with **zero gap between a label and its own
track** (`align-items: flex-end` keeps the taller controls from lifting it), so
the space that reads as separation is the one between parts.

Three more things reflow rather than shrink: the chord strip stacks its label
**under** the solfège (`flex: 1 0 100%` on the syllable wraps the numeral and
symbol together onto a second line — no extra markup); the phrase-intent
question and its select stack instead of sitting side by side with the select
shoved to the far edge; and applied fragments **stack vertically**, each a
full-width row. The fragment being reworked gains a raised, boxy look *in
place* — it never jumps to the top, because where a fragment sits is which part
of the hymn it is.

Every card that reads as a pill or panel uses Drew's measured phone spacing,
`padding: 2px 2px 0 8px` — regions, the context bar, suggestion cards, and note
cells alike, so their inner columns line up down the page.

Popovers and glossary tips nudge themselves back on-screen (see The editing
pass), which is what keeps the project menu — anchored to a trigger a third of
the way across a phone — from opening off the left edge, and a definition
opened from mid-sentence card prose from hanging off either one.

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
Play button plays exactly the checked parts, per-lane solo buttons, ~~loop~~
(dropped 2026-07-30), moving cursor, live tempo, Space shortcut.

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
  this slice; the "+" pair became ghost notes on 2026-07-30, see The editing
  pass); drag its edges to resize. Drag semantics live in
  `domain/voice-editing.ts`: an inner edge moves the shared boundary between
  contiguous notes (total conserved), the first note's left edge can only
  create a leading rest, the last note's right edge extends freely, and
  Shift-drag ripples later notes (part length changes). Soprano edits mirror
  onto the melody fragment. Locks are per-note ConstraintLocks — no row locks.
- ~~Suggested-reading cards are click-to-select (no Select buttons).~~
  Superseded 2026-07-30: cards carry an explicit **Select** button again —
  their prose now hosts glossary term triggers, and a whole-card click target
  fights the definition popovers.

Not yet implemented *as of that slice* (spec milestones 4–6): note editing,
boundary editing, stale-suggestion handling, interactive locks, fixture-based
refresh, apply, undo/redo, fixtures B–D. All of these landed in v1 — see
Status above; the one that never shipped in the planned shape is the Add note
dropdown, which the ghost notes replaced outright.

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
