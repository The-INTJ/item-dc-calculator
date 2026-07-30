---
title: "Hymn Harmonization Workbench"
subtitle: "Phase 0 UI Proof-of-Concept Product and Technical Specification"
author: "Prepared for implementation by an AI coding agent"
date: "July 29, 2026"
---

# Document status

**Status:** Implementation-ready specification for a hard-coded UI proof of concept (POC).

**Primary purpose:** Give an AI coding agent enough product, interaction, visual, state, and data-model detail to build the first usable interface without inventing the product while coding it.

**Normative rule:** Phase 0 is a UI and interaction prototype. It must not attempt to solve harmonic analysis, generate theoretically correct harmonizations, or present invented values as computed musical truth. All candidate harmonizations, explanations, scores, and voicings in Phase 0 come from versioned fixture data.

**Working product name:** Hymn Harmonization Workbench. This is a placeholder and must not be treated as final branding.

# 1. Executive summary

The product helps a hymn writer who already has a melody they like but is uncertain about the supporting harmony and four-part voicing. The writer enters a short melody fragment, supplies minimal tonal context, and auditions a small number of meaningfully different harmonizations. They may lock a chord, bass note, individual voice, or complete voicing, then ask the system to present compatible alternatives for the unlocked material.

The product is not initially a notation editor, automatic hymn composer, giant graph of every chord, or universal measure of whether music is “good.” Its first job is much narrower:

> Given a short soprano melody fragment, the current tonal and harmonic context, and a broad phrase intention, present a few distinct, understandable, and audible ways to harmonize that fragment in congregational four-part hymn style.

The first deliverable is a polished, fully interactive POC whose values are hard-coded in fixture files. The POC exists to settle the interface, information hierarchy, editing model, lock behavior, and audition workflow before implementing music-theory mathematics or a real recommendation engine.

The long-term architecture must support a hybrid intelligence model:

1. **Computed facts:** pitch membership, intervals, inversion, common tones, voice ranges, voice-leading distances, parallel motion, preparation and resolution patterns, and other properties that can be derived mechanically.
2. **Rule-derived interpretations:** chord function, non-chord-tone readings, cadence types, tendency-tone treatment, and idiomatic four-part rules.
3. **Corpus-derived evidence:** how frequently a transition or voicing appears in a relevant hymn corpus.
4. **Curated knowledge:** style-specific labels, exceptions, explanatory copy, preference weights, and manually authored “knowledge pack” updates.

The data model must never place universal claims such as `soundsFinal: true` directly on a chord. Finality, forward motion, passing quality, and stability depend on the sequence, bass, inversion, melody, meter, phrase position, voicing, and style profile.

# 2. Product problem

## 2.1 User situation

The user writes congregational hymns by first discovering a melody. The melody is usually the fixed creative idea. The difficulty comes afterward:

- Which chord or short chord path best supports the melody?
- Is a melody note a chord tone, passing tone, neighbor tone, suspension, or anticipation?
- Should the bass remain stable, move by step, or create a cadential fifth?
- Does a tonic chord feel final, or can an inversion preserve tonic function without closing the phrase?
- How can the inner voices move cleanly without sacrificing the melody?
- What is the audible difference between several theoretically plausible choices?

The desired tool should make alternatives visible and audible without replacing the writer’s judgment.

## 2.2 Core product promise

The interface should let the writer say:

> “Here is my melody fragment. Here is where I am coming from. I want this phrase to continue, build, approach a cadence, or close. Show me a few genuinely different readings, let me hear them, and let me preserve the parts I like while changing the rest.”

## 2.3 Product posture

The product is a **workbench**, not an oracle.

It should explain consequences rather than declare permission:

- Good: “This keeps tonic function but weakens closure because the bass is on mi.”
- Good: “The melody’s fa is treated as the seventh of V7 and resolves to mi.”
- Bad: “This is 92% correct.”
- Bad: “Invalid progression.”

Candidate ordering is useful, but the UI must avoid implying that a universal scalar “goodness” score exists.

# 3. Phase 0 objective

## 3.1 What Phase 0 must prove

Phase 0 must answer these product questions:

1. Can a writer enter and understand a short melody fragment without full staff notation?
2. Is the relationship between melody timing and chord-change boundaries clear?
3. Can three candidate harmonizations be compared quickly?
4. Does the user understand the difference between previewing, selecting, locking, and applying?
5. Is the SATB representation readable in solfège while still exposing absolute note and chord labels?
6. Does audio audition make the harmonic alternatives meaningfully distinguishable?
7. Can the interface preserve partial decisions without becoming cluttered?
8. Does the interface feel like a compositional instrument rather than a theory dashboard?

## 3.2 What Phase 0 explicitly does not prove

Phase 0 does not prove:

- correctness of generated harmony;
- completeness of hymn theory coverage;
- quality of automatic voicing;
- accuracy of phrase-intent inference;
- support for minor keys or church modes;
- full-song editing;
- MusicXML import/export;
- corpus-based ranking;
- real MIDI device integration.

## 3.3 Definition of success

The POC is successful when a user can complete the following flow without explanation from the developer:

1. Choose or accept a key.
2. inspect a short melody fragment represented as note cards;
3. understand where harmony may change;
4. audition three candidate readings;
5. select one candidate and inspect its chord path, bass line, and SATB voicing;
6. lock one portion of the candidate;
7. request alternatives and see the unlocked portions change;
8. apply the candidate to the accepted context;
9. move to the next fragment.

All of this may operate from authored fixture data.

# 4. Deliberate scope constraints

## 4.1 Musical scope for the POC

The visible interface should assume:

- major key only;
- movable-do solfège;
- melody is the soprano line;
- 4/4 meter;
- 2–8 melody events in the active fragment;
- diatonic triads, first inversions, V7, and a small number of authored non-chord-tone examples;
- four voices: soprano, alto, tenor, bass;
- one active fragment at a time;
- one previous accepted harmony as immediate context;
- three candidate paths at a time.

Minor keys, Dorian, Mixolydian, modulation, secondary dominants, modal mixture, and extended chromatic vocabulary are future concerns. The data model must allow them later, but the Phase 0 interface must not expose disabled complexity merely to advertise future scope.

## 4.2 Product scope for the POC

The POC is not a full score editor. It does not need:

- measures spanning an entire hymn;
- lyrics;
- engraving-quality notation;
- drag-and-drop staff note entry;
- printing;
- collaboration;
- accounts or persistence beyond local state;
- backend services.

## 4.3 Visual scope

The original 2.5D graph concept is not the primary Phase 0 interaction. Depth may be used subtly to communicate candidate layers, active selection, and history, but the interface must not require navigating a spatial chord universe.

The POC should optimize for comprehension, comparison, and audition rather than spectacle.

# 5. Core domain vocabulary

Use these terms consistently in code and UI copy.

| Term | Meaning in this product |
|---|---|
| Melody event | One soprano pitch occurrence with duration and metric placement. Repeated pitches are separate events when their timing differs. |
| Fragment | The active 2–8 melody-event window currently being harmonized. |
| Harmonic boundary | A point between melody events at which a new harmony is permitted or required. |
| Harmony event | A chord or sonority occupying a time span within the fragment. |
| Candidate path | A complete proposed reading of the fragment, including harmony events, SATB voicing, note interpretations, and explanatory descriptors. |
| Accepted context | The previously applied harmony and optional voicing that constrain the active fragment. |
| Phrase intent | A broad user-selected ranking signal: Continue, Build, Approach cadence, or Close. |
| Lock | A constraint preserving a selected chord, bass note, voice note, or complete voicing during regeneration. |
| Reading | A musical interpretation of the fragment, not merely a chord list. It includes whether melody notes are chord tones or non-chord tones. |
| Effect descriptor | A context-sensitive explanation such as “softens closure” or “creates strong dominant arrival.” |
| Evidence | A computed, rule-based, corpus-derived, or curated fact supporting a descriptor or rank. |
| Knowledge pack | A versioned collection of style-specific rules, mappings, corpus statistics, and curated explanations. |

# 6. Primary user story

> As a hymn writer with a melody fragment I want to compare a small number of harmonizations, hear each one, inspect the four voices in solfège, and lock decisions I like so that I can continue composing without surrendering authorship to the software.

# 7. UX principles

## 7.1 Melody is visually primary

The melody is the user’s fixed creative material and must occupy the strongest visual position. Harmony is shown beneath it and aligned in time. Suggestions must appear as responses to the melody, not as the main subject of the application.

## 7.2 Show readings, not chord inventories

A candidate must represent a path through the complete fragment. The system must not simply list every chord containing the current melody pitch.

## 7.3 Compare a few distinct alternatives

Default to three candidates. Each candidate should represent a meaningfully different reading, such as:

- stable or prolongational;
- directed or cadential;
- continuing or non-final.

The labels may vary by fixture and must not become fixed universal categories.

## 7.4 Audio is a first-class explanation

A candidate that cannot be heard is incomplete. Playback controls must be prominent, fast, and predictable.

## 7.5 Reveal theory progressively

The initial card should answer:

- What happens?
- How does it feel/function?
- Can I hear it?

Detailed Roman numerals, chord spelling, note interpretation, score features, and rule evidence should be available on expansion rather than occupying the default surface.

## 7.6 Locks must be granular

The writer may know the bass but not the inner voices, or the chord but not its inversion. The interface must allow preserving partial decisions.

## 7.7 Never hide uncertainty

Later engines may disagree or have low confidence. The model and UI must allow “plausible reading,” “ambiguous,” and “style dependent,” rather than forcing every output into certainty.

## 7.8 Avoid pseudo-objective scores

Do not display a universal “quality percentage.” Candidate order and qualitative fit labels are acceptable. Detailed views may show separate dimensions such as melodic fit, voice-leading ease, closure strength, and style fit.

# 8. Information required from the user

The application should request only information that materially improves suggestions.

## 8.1 Required in Phase 0

1. **Key tonic:** C, D-flat, D, and so on. The fixtures may initially support only C major while the control visually supports choosing other values.
2. **Mode:** Major. The field may be structurally present but contain only Major in Phase 0.
3. **Phrase intent:** Continue, Build, Approach cadence, or Close.
4. **Melody fragment:** 2–8 soprano melody events.
5. **Harmonic boundaries:** Whether harmony may change between adjacent melody events.
6. **Previous harmony:** Default I in root position; editable through a compact context control.

## 8.2 Optional or deferred

- meter and beat strength;
- exact previous SATB voicing;
- expected destination chord;
- tempo;
- style pack;
- congregation difficulty level;
- range preferences;
- open versus close spacing preference.

The underlying data model should permit these fields even when the POC does not expose them.

# 9. Primary screen anatomy

The POC should be a single-screen desktop workbench with five vertical regions:

1. Context bar
2. Accepted-context rail
3. Melody and harmonic-boundary strip
4. Candidate palette
5. Selected-candidate inspector

The page should feel horizontally musical: events align left-to-right in time. It should not feel like a settings form followed by unrelated cards.

## 9.1 Annotated desktop wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Hymn Harmonization Workbench                      Undo  Redo      Settings        Help   │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ KEY  C major      PHRASE INTENT  Continue      TEMPO  76      [Play accepted context]   │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ ACCEPTED CONTEXT                                                                          │
│  …  [ I · C major · root position ] ───────────────────────────────▶ active fragment     │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ MELODY                                                                                   │
│     ┌────────────┐       ┌────────────┐       ┌──────────────┐                            │
│     │ sol        │       │ fa         │       │ mi           │       [+ Add note]         │
│     │ G4     ♩   │       │ F4     ♩   │       │ E4       𝅗𝅥   │                            │
│     │ beat 1     │       │ beat 2     │       │ beats 3–4    │                            │
│     └────────────┘       └────────────┘       └──────────────┘                            │
│                [hold harmony]      [change allowed]                                      │
│                                                                                          │
│ HARMONY PLAN                                                                             │
│     ┌───────────────────────────── unresolved fragment ───────────────────────────────┐   │
│     └─────────────────────────────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ SUGGESTED READINGS                          [Refresh alternatives]  [Show theory details] │
│                                                                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │ A  Grounded descent  │  │ B  Strong arrival   │  │ C  Keep moving       │             │
│  │ I held               │  │ V7  →  I            │  │ I  →  I6             │             │
│  │ Bass: do — do        │  │ Bass: sol → do      │  │ Bass: do → mi        │             │
│  │ Calm; fa passes      │  │ fa resolves to mi   │  │ tonic, less final    │             │
│  │ [▶ Full] [▶ Parts]   │  │ [▶ Full] [▶ Parts]  │  │ [▶ Full] [▶ Parts]   │             │
│  │              [Select]│  │              [Select]│  │              [Select]│             │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘             │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ SELECTED READING: C — Keep moving                                  [Apply to composition] │
│                                                                                          │
│ Timeline:      sol              fa                    mi                                  │
│ Chords:        I ───────────────────────────────▶      I6                                 │
│ Soprano:       sol              fa                    mi        [locked: melody]           │
│ Alto:          mi               re                    do        [lock row]                 │
│ Tenor:         do               ti                    do        [lock row]                 │
│ Bass:          do               do                    mi        [lock row]                 │
│                                                                                          │
│ Effect: Preserves tonic identity but avoids a root-position close.                       │
│ [▶ Melody] [▶ Harmony] [▶ SATB] [Loop]         [View notation] [View analysis evidence] │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

This wireframe is conceptual, not a demand for exact typography. The hierarchy, alignment, and interaction relationships are normative.

## 9.2 Context bar

The context bar must remain compact and visually subordinate to the melody.

Required controls:

- key selector;
- mode selector, showing Major only in Phase 0;
- phrase-intent segmented control or select;
- tempo control;
- playback for accepted context plus active candidate.

Phrase-intent descriptions should be available on hover/focus or via a small information control:

- **Continue:** avoid strong closure; favor prolongation and forward availability.
- **Build:** favor increasing tension, rising energy, or dominant preparation.
- **Approach cadence:** favor predominant and dominant preparation without necessarily completing the cadence.
- **Close:** favor convincing local or phrase-level arrival.

These values are ranking intentions, not commands that make other candidates illegal.

## 9.3 Accepted-context rail

The accepted-context rail shows the immediate musical state before the active fragment.

Phase 0 requirements:

- Show one previous harmony chip.
- Include Roman numeral, absolute chord name, inversion, and optionally bass solfège.
- Clicking the chip opens a compact editor.
- The rail visually points into the active fragment.
- It must be clear that suggestions are conditioned on this context.

Example:

```text
I · C major · root position · bass do
```

Future versions may show multiple accepted harmony events, but Phase 0 should not become a full horizontal score.

## 9.4 Melody strip

The melody strip is the most important control.

Each melody-event card must display:

- movable-do syllable prominently;
- absolute pitch secondarily;
- octave;
- duration symbol or textual duration;
- beat or metric position;
- optional tie indicator;
- lock state, with the melody always locked by definition. *(Superseded
  2026-07-30: nothing defaults locked in the UI — all four voices carry live
  lock toggles. "Melody locked" survives only as engine anchoring: the
  generator builds around the soprano by construction.)*

Clicking a melody card opens an inline or popover editor with:

- solfège syllable;
- chromatic alteration where supported (`di`, `ra`, `ri`, `me`, `fi`, `se`, `si`, `le`, `li`, `te`);
- octave;
- duration;
- tie from previous;
- delete note.

For Phase 0, the user-visible note options may be limited to the fixture’s supported values. The component and types must still support chromatic solfège.

### 9.4.1 Adding notes

The Add note button appends a new event and opens its editor. The default event may copy the prior duration and octave, but it must not silently copy pitch.

### 9.4.2 Removing and reordering

The POC should support deleting notes. Drag reordering is optional. Arrow buttons or keyboard shortcuts are sufficient for Phase 0.

## 9.5 Harmonic-boundary controls

The boundary between two melody events must be an explicit interactive object. This is critical because melody rhythm and harmonic rhythm are not identical.

Each boundary supports three states:

1. **Hold:** a chord change is prohibited at this boundary.
2. **Allowed:** candidate paths may either hold or change harmony.
3. **Required:** candidate paths must change harmony here.

Recommended visual treatment:

```text
[sol] —— hold —— [fa]  | change allowed |  [mi]
```

The control may be a small three-state toggle. It must include text or accessible labels; color alone is insufficient.

In Phase 0 fixtures, changing a boundary state may switch to another authored candidate set or show a no-fixture empty state.

## 9.6 Harmony-plan lane

Directly beneath the melody, show the currently accepted or unresolved harmonic span.

Before a candidate is selected, it should read as unresolved rather than blank. After selection, it should display that candidate’s chord blocks aligned to melody timing. Locks applied to chord events should be visible here.

The lane exists to connect the melody strip to the selected candidate. It is not a separate editable score in Phase 0.

## 9.7 Candidate palette

The candidate palette displays exactly three default candidates when fixture data provides them.

Each candidate card must contain:

- short descriptive title;
- compact chord path in Roman numerals;
- absolute chord names on demand or as secondary text;
- bass outline in solfège;
- one-sentence musical interpretation;
- two playback controls: Full SATB and Parts;
- Select action;
- qualitative badges such as “strong intent match,” “easy voice leading,” or “color option,” where supplied by fixture data.

A candidate card must not present every detail. The purpose is rapid comparison.

### 9.7.1 Candidate diversity

Fixture authors and later engines should avoid returning three tiny variants of the same answer. A candidate set should maximize interpretive diversity under the user’s constraints.

For example, over `sol–fa–mi`:

- Candidate A: I held; fa is a passing tone.
- Candidate B: V7 to I; fa is the chordal seventh resolving to mi.
- Candidate C: I to I6; bass moves to mi and closure remains incomplete.

### 9.7.2 Selection versus application

**Select** previews a candidate in the inspector. It does not commit it.

**Apply to composition** commits the selected candidate to accepted context and advances the workflow.

This distinction must be visually obvious.

## 9.8 Selected-candidate inspector

The selected-candidate inspector is the detailed working area.

It has four synchronized layers:

1. Melody timeline
2. Harmony events
3. SATB voices
4. Analysis and effect explanation

### 9.8.1 Timeline alignment

All events should align horizontally by musical time. The POC does not need engraving-quality proportional spacing, but duration differences must be visible.

### 9.8.2 SATB representation

Default representation should be a lane or grid, not traditional notation.

Each voice row displays:

- solfège syllable;
- absolute pitch as secondary text;
- duration or span;
- lock control per note or per row;
- optional movement arrows between notes.

The voice rows are ordered:

1. Soprano
2. Alto
3. Tenor
4. Bass

The soprano row is derived from the melody and is always locked. *(Superseded
2026-07-30: the soprano row is editable and lockable like every other voice;
the generator still anchors on it — see domain/engine/generate.ts.)*

### 9.8.3 Optional notation view

A “View notation” control may switch the inspector to a minimal grand-staff or four-staff visualization if implementation is inexpensive. This is optional for Phase 0 and must not delay the lane-based view.

## 9.9 Locking model

Locks are constraints, not cosmetic favorites.

Supported lock targets:

- harmony event identity;
- harmony inversion;
- bass note;
- individual alto or tenor note;
- entire voice row;
- complete SATB voicing.

The melody is inherently locked and should not display redundant lock controls on every soprano event.

### 9.9.1 Lock visual states

Every lockable object must have two unmistakable states:

- unlocked: neutral outline lock icon or explicit “Lock” action;
- locked: filled lock icon, persistent accent outline, and accessible text.

Locked elements remain visible when alternatives are refreshed. If fixture data cannot satisfy a lock combination, show a direct message:

> No authored POC alternative satisfies these locks. Unlock one element or restore the previous candidate.

Do not silently ignore locks.

### 9.9.2 Lock hierarchy

A broader lock overrides narrower controls:

- Locking complete voicing locks all voices and chords.
- Locking a voice row locks each note in that row.
- Unlocking one child of a locked row converts the row to a mixed state.

Use a tri-state visual where a group is partially locked.

## 9.10 Playback

Playback is required in Phase 0.

Controls:

- Play melody only
- Play harmony reduction
- Play full SATB
- Play individual voice
- Loop selected fragment
- Stop
- Tempo

Recommended POC implementation:

- Use Tone.js or the Web Audio API.
- Hard-code MIDI note numbers in fixture voicings.
- Use one simple, restrained instrument timbre for all voices at first.
- Slightly differentiate voices by register or envelope rather than dramatically different instruments.
- Prevent overlapping playback sessions; starting a new playback stops the previous one.
- Visually highlight the active event during playback.

“Parts” on a candidate card may open a small menu for S, A, T, or B playback.

Do not require a hardware MIDI device. MIDI export and Web MIDI input are future work.

## 9.11 Analysis drawer

Detailed theory should live in an expandable drawer or panel.

For each candidate, show:

- chord-event analysis;
- melody-note interpretation per event;
- cadence or phrase-function interpretation;
- voice-leading observations;
- effect descriptors;
- evidence provenance;
- confidence where relevant.

Example:

```text
Melody event: fa (F4)
Interpretation: chordal seventh of V7
Resolution: descends by step to mi (E4)
Evidence:
  - computed: F is present in G7
  - computed: F descends one diatonic step to E
  - rule pack: dominant seventh normally resolves downward
  - curated explanation: creates a strong audible arrival into I
```

The Phase 0 values are authored fixtures, but the drawer must already render evidence generically.

# 10. Detailed interaction flows

## 10.1 Initial load

1. Load the default fixture `descending-close-c-major`.
2. Context bar shows C major, Continue, tempo 76.
3. Accepted context shows I in root position.
4. Melody strip shows sol–fa–mi.
5. Boundaries show Hold after sol and Allowed after fa, or fixture-defined defaults.
6. Candidate palette shows three authored readings.
7. Candidate A is preview-selected by default but not applied.
8. Inspector shows Candidate A.

## 10.2 Editing the melody

1. User selects the fa card.
2. Editor appears without navigating away.
3. User changes fa to sol.
4. Existing candidates become visibly stale.
5. A banner reads: “Melody changed. Refresh suggestions.”
6. Refresh looks for a matching fixture.
7. If a matching fixture exists, load it.
8. Otherwise show the authored-fixture empty state.

The POC must not continue displaying old suggestions as though they still match.

## 10.3 Changing a harmonic boundary

1. User changes the boundary before mi from Allowed to Required.
2. Candidates are marked stale.
3. Refresh resolves a matching fixture variant.
4. Candidate cards visibly reflect a chord change at that point.

## 10.4 Auditioning candidates

1. User presses Full on Candidate B.
2. Playback begins immediately.
3. The card receives an active-playing state.
4. Current melody and harmony events highlight in time.
5. Pressing Full on Candidate C stops B and begins C.
6. Playback stops at the fragment end unless Loop is enabled.

## 10.5 Selecting and inspecting

1. User presses Select on Candidate C.
2. Candidate C receives selected styling.
3. Inspector changes to Candidate C.
4. Candidate cards remain visible for comparison.
5. No composition state is committed yet.

## 10.6 Locking and refreshing

1. User locks the bass line in Candidate C.
2. Bass lane shows a locked state.
3. User presses Refresh alternatives.
4. POC loads authored alternatives tagged as compatible with the same bass-lock signature.
5. Chords or inner voices may change; bass remains identical.
6. A small message confirms: “Alternatives preserve the locked bass line.”

## 10.7 Applying a candidate

1. User presses Apply to composition.
2. The selected candidate becomes accepted.
3. Accepted-context rail updates to the candidate’s final harmony and final voicing where available.
4. A compact history chip is added.
5. The active fragment may reset to a new fixture or an empty note sequence.
6. Undo can restore the pre-application state.

## 10.8 Restoring an earlier candidate

The POC should keep candidate selection and lock changes in an undoable local-state history. Full branching composition history is out of scope.

# 11. Hard-coded POC fixture set

All POC musical content must come from fixture files. Include at least the following four fixture families.

## 11.1 Fixture A: Descending melody, stable reading

**ID:** `c-major-sol-fa-mi-continue`

**Context:**

- Key: C major
- Previous harmony: I root position
- Phrase intent: Continue
- Melody: sol quarter, fa quarter, mi half

**Candidate themes:**

1. Grounded descent — I held, fa treated as passing.
2. Directed arrival — V7 to I, fa as chordal seventh resolving to mi.
3. Keep moving — I to I6, weaker closure due to bass on mi.

This fixture is the default and should be the most polished.

## 11.2 Fixture B: Suspension reading

**ID:** `c-major-do-ti-suspension`

**Context:**

- Key: C major
- Previous harmony: I
- Phrase intent: Approach cadence or Close
- Melody: do held or tied, then ti

**Candidate themes:**

1. 4–3 suspension over V.
2. Direct V harmony without suspension, if rhythm permits.
3. Tonic prolongation or alternative authored reading.

The UI must show that the suspension is an interpretation across a harmonic change, not a standalone peer chord.

## 11.3 Fixture C: Non-final tonic arrival

**ID:** `c-major-re-mi-continue-i6`

**Context:**

- Melody approaches mi.
- Phrase intent: Continue.
- Candidate emphasizes I6 rather than root-position I.

This fixture validates the distinction between tonic function and final closure.

## 11.4 Fixture D: Build toward dominant

**ID:** `c-major-mi-fa-sol-build`

**Context:**

- Melody: mi–fa–sol.
- Phrase intent: Build or Approach cadence.
- Candidates may include IV, ii6, V, or authored paths appropriate to the fixture.

This fixture validates increasing forward pressure and candidate diversity.

## 11.5 Unknown-fixture state

When current input does not match authored data, show:

> This UI proof of concept does not contain a harmonization fixture for the current fragment. Restore a sample, or continue editing the interface without suggestions.

Actions:

- Restore nearest sample
- Choose sample fragment
- Keep editing

Never generate random or false theory content merely to avoid an empty state.

# 12. Visual design specification

## 12.1 Overall character

The interface should feel like a calm compositional workbench:

- spacious but information-dense;
- precise rather than decorative;
- musical timing expressed horizontally;
- warm enough to avoid feeling like a data-analysis dashboard;
- no large ornamental piano keyboard unless it directly aids note editing;
- no giant web, orbit, or chord galaxy in Phase 0.

## 12.2 Depth and the “2.5D” idea

Use depth sparingly:

- selected candidate appears slightly raised relative to unselected candidates;
- prior accepted context visually recedes;
- expanded analysis may slide forward as a layer;
- playback may create a moving focus plane across aligned events.

Do not use free camera rotation, perspective distortion, or zooming through a graph. Those interactions would consume attention without supporting the narrow workflow.

## 12.3 Color semantics

Use theme tokens rather than hard-coded colors.

Suggested semantic roles:

- accent: current selection and playback position;
- locked: accent outline plus lock icon;
- stale: muted warning treatment;
- accepted: stable neutral-positive treatment;
- unresolved: dashed or subdued neutral;
- dissonant/non-chord tone: a patterned or annotated marker, not an alarm color;
- evidence provenance: icons or labels, not color alone.

Do not assign fixed colors to Roman-numeral functions in Phase 0 unless the mapping is used consistently and remains secondary to labels.

## 12.4 Typography

- Melody solfège should be the strongest repeated typographic element.
- Absolute notes and MIDI-oriented details are secondary.
- Roman numerals and chord symbols should be visually distinct but not oversized.
- Explanations should use concise prose.
- Use a monospaced or tabular-number treatment only where alignment benefits.

## 12.5 Motion

Permitted motion:

- 120–220 ms selection transitions;
- event highlighting during playback;
- candidate inspector crossfade or slide;
- lock confirmation;
- stale-state appearance.

Avoid decorative looping animation.

## 12.6 Responsive behavior

Desktop is the primary POC target.

- At widths above approximately 1024 px, show three candidate cards in one row.
- At tablet widths, allow a two-column or horizontally scrollable candidate palette, but keep the selected inspector below.
- At mobile widths, stack all regions, make the melody strip horizontally scrollable if necessary, and collapse SATB details by voice.
- The interface must remain operable at 320 px, but mobile polish is not the primary acceptance gate.

# 13. Component architecture

Recommended React component tree:

```text
HarmonizationWorkbench
├── WorkbenchHeader
├── ContextBar
│   ├── KeySelector
│   ├── ModeSelector
│   ├── PhraseIntentControl
│   ├── TempoControl
│   └── GlobalPlaybackControl
├── AcceptedContextRail
│   └── HarmonyContextChip
├── FragmentWorkspace
│   ├── MelodyStrip
│   │   ├── MelodyEventCard[]
│   │   ├── HarmonicBoundaryControl[]
│   │   └── AddMelodyEventButton
│   └── HarmonyPlanLane
├── CandidatePalette
│   ├── CandidateCard[]
│   └── RefreshAlternativesButton
├── CandidateInspector
│   ├── AlignedTimeline
│   ├── HarmonyLane
│   ├── VoiceLane[SATB]
│   ├── LockControls
│   ├── PlaybackTransport
│   ├── EffectSummary
│   └── AnalysisDrawer
├── FixtureEmptyState
└── DeveloperFixturePanel (development builds only)
```

## 13.1 Component rules

- Components render from typed data; do not embed specific chords or notes in JSX.
- A candidate card receives a complete `CandidatePathSummary` prop.
- The inspector receives the full `CandidatePath`.
- Audio scheduling is isolated behind a playback service or hook.
- Lock state is stored separately from candidate fixture data.
- UI labels must come from a copy dictionary where practical.
- No component should decide music theory.

# 14. Application state model

Use a reducer, state machine, or a small predictable store. Do not distribute core workflow state across unrelated component-local hooks.

## 14.1 Top-level state

```ts
interface WorkbenchState {
  tonalContext: TonalContext;
  phraseIntent: PhraseIntent;
  tempoBpm: number;
  acceptedContext: AcceptedContext;
  fragment: MelodyFragment;
  boundaryPolicies: HarmonicBoundaryPolicy[];
  suggestionStatus: "fresh" | "stale" | "loading" | "empty" | "error";
  candidateSetId: string | null;
  candidates: CandidatePath[];
  selectedCandidateId: string | null;
  locks: ConstraintLock[];
  playback: PlaybackState;
  history: WorkbenchSnapshot[];
  future: WorkbenchSnapshot[];
}
```

## 14.2 Important transitions

```text
LOAD_FIXTURE
EDIT_TONAL_CONTEXT
EDIT_PHRASE_INTENT
ADD_MELODY_EVENT
UPDATE_MELODY_EVENT
DELETE_MELODY_EVENT
SET_BOUNDARY_POLICY
MARK_SUGGESTIONS_STALE
REFRESH_SUGGESTIONS
SELECT_CANDIDATE
TOGGLE_LOCK
CLEAR_LOCKS
START_PLAYBACK
STOP_PLAYBACK
APPLY_CANDIDATE
UNDO
REDO
```

## 14.3 Stale-state rule

Any change to these fields marks suggestions stale:

- key or mode;
- phrase intent;
- melody pitch, duration, tie, or metric placement;
- harmonic-boundary policy;
- previous harmony;
- locks.

The UI must not silently treat stale candidates as current.

# 15. Future-ready musical data model

The following types are conceptual. The agent may adjust exact syntax, but must preserve the distinctions.

## 15.1 Pitch spelling

Do not store music only as MIDI numbers or pitch classes. Preserve spelling.

```ts
type LetterName = "C" | "D" | "E" | "F" | "G" | "A" | "B";
type Accidental = "bb" | "b" | "natural" | "#" | "x";

interface SpelledPitch {
  letter: LetterName;
  accidental: Accidental;
  octave: number;
  midi: number;
  pitchClass: number; // 0–11
}
```

## 15.2 Solfège representation

```ts
type DiatonicDegree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type SolfegeSyllable =
  | "do" | "di"
  | "ra" | "re" | "ri"
  | "me" | "mi"
  | "fa" | "fi"
  | "se" | "sol" | "si"
  | "le" | "la" | "li"
  | "te" | "ti";

interface ScaleDegreePitch {
  degree: DiatonicDegree;
  chromaticOffset: number;
  syllable: SolfegeSyllable;
}
```

## 15.3 Tonal context

```ts
type ModeId =
  | "major"
  | "natural_minor"
  | "harmonic_minor"
  | "melodic_minor"
  | "dorian"
  | "mixolydian";

interface TonalContext {
  tonic: Omit<SpelledPitch, "octave" | "midi">;
  tonicPitchClass: number;
  mode: ModeId;
  keySignature?: string;
  solfegeSystem: "movable_do";
  minorDoSystem?: "do_based" | "la_based";
}
```

Only `major` is exposed in Phase 0, but the type must not make major permanent.

## 15.4 Timing

Use rational musical duration rather than floating-point seconds.

```ts
interface MusicalTime {
  measure: number;
  beat: number;
  subdivision: number;
}

interface RationalDuration {
  numerator: number;
  denominator: number;
}
```

For a POC, a simplified tick value is acceptable internally if it converts cleanly to rational duration.

## 15.5 Melody event

```ts
interface MelodyEvent {
  id: string;
  pitch: SpelledPitch;
  scaleDegree: ScaleDegreePitch;
  start: MusicalTime;
  duration: RationalDuration;
  tieFromPrevious: boolean;
  metricStrength?: "strong" | "medium" | "weak";
  phraseBoundaryAfter?: "none" | "subphrase" | "phrase" | "stanza";
}
```

## 15.6 Harmonic boundary policy

```ts
type HarmonicBoundaryPolicy = "hold" | "allowed" | "required";

interface BoundaryConstraint {
  afterMelodyEventId: string;
  policy: HarmonicBoundaryPolicy;
}
```

## 15.7 Chord identity

A chord’s identity must be distinct from its function in a particular key.

```ts
interface ChordStructure {
  id: string;
  root: Omit<SpelledPitch, "octave" | "midi">;
  pitchClasses: number[];
  spelledChordTones: Array<Omit<SpelledPitch, "octave" | "midi">>;
  quality:
    | "major"
    | "minor"
    | "diminished"
    | "augmented"
    | "dominant_seventh"
    | "major_seventh"
    | "minor_seventh"
    | "half_diminished_seventh"
    | "fully_diminished_seventh"
    | "suspended_second"
    | "suspended_fourth"
    | "other";
  extensions?: string[];
  alterations?: string[];
}

interface HarmonicAnalysis {
  romanNumeral: string;
  scaleDegreeRoot: ScaleDegreePitch;
  functionTags: HarmonicFunctionTag[];
  appliedTo?: string;
  borrowedFrom?: ModeId;
}

type HarmonicFunctionTag =
  | "tonic"
  | "tonic_prolongation"
  | "predominant"
  | "dominant"
  | "dominant_prolongation"
  | "passing"
  | "pedal"
  | "ambiguous";
```

## 15.8 Harmony event

```ts
interface HarmonyEvent {
  id: string;
  start: MusicalTime;
  duration: RationalDuration;
  chord: ChordStructure;
  analysis: HarmonicAnalysis;
  inversion: 0 | 1 | 2 | 3;
  bassPitch: SpelledPitch;
  figuredBass?: string;
  displaySymbol: string; // e.g. C, G7, C/E
}
```

## 15.9 Voice event and voicing

```ts
type VoiceId = "soprano" | "alto" | "tenor" | "bass";

interface VoiceEvent {
  id: string;
  voice: VoiceId;
  pitch: SpelledPitch;
  scaleDegree: ScaleDegreePitch;
  start: MusicalTime;
  duration: RationalDuration;
  tieFromPrevious: boolean;
}

interface SATBVoicing {
  soprano: VoiceEvent[];
  alto: VoiceEvent[];
  tenor: VoiceEvent[];
  bass: VoiceEvent[];
}
```

## 15.10 Melody-note interpretation

```ts
type MelodyRole =
  | "chord_tone"
  | "passing_tone"
  | "neighbor_tone"
  | "suspension"
  | "retardation"
  | "anticipation"
  | "appoggiatura"
  | "escape_tone"
  | "pedal_tone"
  | "unclassified"
  | "ambiguous";

interface MelodyInterpretation {
  melodyEventId: string;
  harmonyEventIds: string[];
  role: MelodyRole;
  preparationEventId?: string;
  resolutionEventId?: string;
  suspensionType?: "4-3" | "7-6" | "9-8" | "2-3" | "other";
  explanation: string;
  evidence: AnalysisEvidence[];
}
```

## 15.11 Candidate path

```ts
interface CandidatePath {
  id: string;
  fixtureId?: string;
  title: string;
  summary: string;
  tonalContext: TonalContext;
  phraseIntent: PhraseIntent;
  harmonyEvents: HarmonyEvent[];
  voicing: SATBVoicing;
  melodyInterpretations: MelodyInterpretation[];
  descriptors: EffectDescriptor[];
  evidence: AnalysisEvidence[];
  rank?: number;
  rankingDimensions?: RankingDimensions;
  provenance: CandidateProvenance;
  compatibilityTags?: string[];
}
```

## 15.12 Evidence and provenance

This is essential for supporting both mathematics and manually patched knowledge.

```ts
type EvidenceSource = "computed" | "rule" | "corpus" | "curated" | "user";

interface AnalysisEvidence {
  id: string;
  source: EvidenceSource;
  featureId: string;
  value: boolean | number | string | string[];
  confidence?: number; // 0–1, not displayed as goodness
  explanation?: string;
  providerId: string;
  providerVersion: string;
}

interface CandidateProvenance {
  generatorId: string;
  generatorVersion: string;
  knowledgePackIds: string[];
  generatedAt?: string;
  fixtureAuthored: boolean;
}
```

## 15.13 Context-sensitive effect descriptors

```ts
type EffectDimension =
  | "closure_strength"
  | "forward_motion"
  | "stability"
  | "tension"
  | "brightness"
  | "voice_leading_ease"
  | "melodic_fit"
  | "style_fit"
  | "congregational_singability";

interface EffectDescriptor {
  id: string;
  dimension: EffectDimension;
  value?: number; // normalized internal value, when available
  label: string;  // e.g. "softens closure"
  explanation: string;
  evidenceIds: string[];
  source: EvidenceSource | "hybrid";
  overrideOf?: string;
}
```

The UI should display labels and explanations by default. Numeric values may be visible only in a developer or detailed-analysis view.

## 15.14 Ranking dimensions

```ts
interface RankingDimensions {
  intentMatch?: number;
  melodicFit?: number;
  voiceLeadingEase?: number;
  styleFit?: number;
  closureStrength?: number;
  forwardMotion?: number;
  novelty?: number;
  confidence?: number;
}
```

These values are separate dimensions. Do not average them into a universal “quality” score without an explicit style profile and ranking policy.

# 16. Constraint and lock data model

```ts
type LockTargetType =
  | "harmony_event"
  | "chord_identity"
  | "inversion"
  | "voice_event"
  | "voice_row"
  | "bass_line"
  | "complete_voicing";

interface ConstraintLock {
  id: string;
  targetType: LockTargetType;
  targetId: string;
  candidateId: string;
  valueSnapshot: unknown;
  createdAt: string;
}
```

For future engine calls, locks should be translated into explicit generation constraints rather than applied after generation.

# 17. Fixture architecture

## 17.1 Fixture registry

```ts
interface HarmonizationFixture {
  id: string;
  name: string;
  match: FixtureMatchCriteria;
  initialState: Partial<WorkbenchState>;
  candidateSets: FixtureCandidateSet[];
}

interface FixtureMatchCriteria {
  tonalContext: TonalContext;
  melodySignature: string;
  boundarySignature: string;
  phraseIntent?: PhraseIntent;
  acceptedHarmonySignature?: string;
}

interface FixtureCandidateSet {
  id: string;
  lockSignature?: string;
  candidates: CandidatePath[];
}
```

## 17.2 Fixture rules

- Store fixtures outside UI components.
- Validate fixtures at startup with a schema validator such as Zod.
- Candidate playback pitches must come from fixture voicings.
- Candidate cards and inspector must use the same candidate object.
- Fixture files should include provenance marking them as authored.
- Development mode should offer a fixture picker and a raw-data inspector.

## 17.3 Sample abbreviated fixture

```json
{
  "id": "c-major-sol-fa-mi-continue",
  "name": "Descending melody — continue",
  "match": {
    "tonalContext": { "tonicPitchClass": 0, "mode": "major" },
    "melodySignature": "sol4:q|fa4:q|mi4:h",
    "boundarySignature": "hold|allowed",
    "phraseIntent": "continue",
    "acceptedHarmonySignature": "I:root"
  },
  "candidateSets": [
    {
      "id": "default",
      "candidates": [
        {
          "id": "grounded-descent",
          "title": "Grounded descent",
          "summary": "Hold tonic while fa passes through the soprano line.",
          "descriptors": [
            {
              "id": "stable-1",
              "dimension": "stability",
              "label": "calm and grounded",
              "explanation": "The harmony remains on tonic while the melody moves through a passing dissonance.",
              "evidenceIds": ["ev-1", "ev-2"],
              "source": "curated"
            }
          ],
          "provenance": {
            "generatorId": "fixture",
            "generatorVersion": "0.1.0",
            "knowledgePackIds": ["poc-hymn-major-v1"],
            "fixtureAuthored": true
          }
        }
      ]
    }
  ]
}
```

The production fixture must contain complete timing, chord, voicing, interpretation, and evidence data.

# 18. Audio architecture

## 18.1 Service boundary

```ts
interface PlaybackService {
  playMelody(fragment: MelodyFragment, options?: PlaybackOptions): Promise<void>;
  playHarmony(candidate: CandidatePath, options?: PlaybackOptions): Promise<void>;
  playSATB(candidate: CandidatePath, options?: PlaybackOptions): Promise<void>;
  playVoice(candidate: CandidatePath, voice: VoiceId, options?: PlaybackOptions): Promise<void>;
  stop(): void;
}
```

## 18.2 Playback behavior

- Convert musical time to seconds using tempo.
- Schedule all notes before playback begins where possible.
- Apply short release tails without smearing adjacent harmonies.
- Use a master limiter or conservative gain to prevent clipping when four voices sound simultaneously.
- Highlight current timeline events using a playback cursor callback.
- Audio context should initialize only after user interaction to satisfy browser policies.

## 18.3 POC timbre

A plain organ-like, piano-like, or soft synthesized tone is acceptable. The goal is harmonic comparison, not realism. Avoid a bright attack or long reverb that obscures voice leading.

# 19. Architecture for future intelligence

## 19.1 Required separation of responsibilities

The eventual engine should be composed of replaceable stages:

```ts
interface CandidateGenerator {
  generate(request: HarmonizationRequest): Promise<GeneratedCandidate[]>;
}

interface CandidateAnnotator {
  annotate(candidate: GeneratedCandidate, request: HarmonizationRequest): Promise<AnnotatedCandidate>;
}

interface CandidateRanker {
  rank(candidates: AnnotatedCandidate[], request: HarmonizationRequest): Promise<RankedCandidate[]>;
}

interface ExplanationComposer {
  compose(candidate: RankedCandidate, request: HarmonizationRequest): Promise<EffectDescriptor[]>;
}
```

Phase 0 implementation:

- `FixtureCandidateGenerator`
- `FixtureCandidateAnnotator`
- `FixtureCandidateRanker`
- `FixtureExplanationComposer`

Future implementations may include:

- `RuleBasedCandidateGenerator`
- `ConstraintSolverVoicingGenerator`
- `CorpusFrequencyRanker`
- `HymnStyleKnowledgePack`
- `UserPreferenceReranker`

The UI must depend only on the shared output contracts.

## 19.2 Do not attach effects directly to chord definitions

Incorrect design:

```ts
const tonicChord = {
  symbol: "C",
  soundsFinal: true,
  feeling: "home"
};
```

Correct design:

```ts
const closureDescriptor = analyzeClosure({
  previousHarmony,
  currentHarmony,
  inversion,
  bassMotion,
  melodyEnding,
  phraseBoundary,
  metricPlacement,
  styleProfile
});
```

A root-position tonic after V with scale-degree 1 in soprano at a phrase boundary may be highly final. The same tonic in first inversion, on a weak beat, inside a sequence, or beneath continuing melodic motion may not be.

## 19.3 Knowledge-pack system

```ts
interface KnowledgePackManifest {
  id: string;
  version: string;
  styleId: string;
  displayName: string;
  supportedModes: ModeId[];
  ruleProviderIds: string[];
  corpusProviderIds: string[];
  curatedDescriptorProviderIds: string[];
  compatibilityVersion: string;
}
```

A knowledge pack may supply:

- chord-function mappings;
- cadence classifications;
- voice-leading rules and severities;
- non-chord-tone recognition patterns;
- candidate-generation templates;
- style-frequency data;
- effect-label mappings;
- explanatory prose;
- exceptions and overrides.

Knowledge packs should be data/configuration where possible, code plugins where necessary, and versioned in all cases.

## 19.4 Override and patch strategy

The architecture should support a computed descriptor being refined or replaced by curated content without losing provenance.

Example:

```ts
{
  id: "closure-17",
  dimension: "closure_strength",
  value: 0.62,
  label: "local arrival, but not fully settled",
  source: "hybrid",
  evidenceIds: ["computed-cadence", "rule-inversion", "curated-hymn-label"],
  overrideOf: "generic-closure-label-v2"
}
```

This permits future patch updates without restructuring chord objects or UI components.

# 20. What can be computed versus curated

The initial research should not assume either “pure math solves it” or “everything must be manually authored.” The likely answer is hybrid.

## 20.1 Strongly computable facts

These can be calculated directly from symbolic music data:

- whether a melody pitch belongs to a chord;
- pitch-class and spelled interval relationships;
- chord completeness and doubling;
- inversion and bass scale degree;
- number of common tones between harmonies;
- total semitone or diatonic voice movement;
- contrary, similar, oblique, and parallel motion;
- voice crossing and overlap;
- spacing between adjacent voices;
- voice range violations;
- parallel perfect fifths or octaves under a defined rule set;
- hidden/direct perfect intervals under a defined rule set;
- leading-tone and chordal-seventh resolution;
- preparation and stepwise resolution patterns;
- whether a candidate satisfies required harmonic boundaries;
- cadence-shape candidates based on chord sequence, soprano, and bass;
- metrical placement and duration of dissonance;
- repetition and sequence patterns.

## 20.2 Rule-derived but style-dependent interpretations

These can be implemented as rules, but the rules require style assumptions:

- tonic, predominant, and dominant function;
- whether a 6/4 is cadential, passing, pedal, or arpeggiated;
- whether a melody note is a suspension rather than an accented passing tone;
- severity of parallels or spacing issues;
- preferred doubling;
- whether a deceptive cadence is idiomatic;
- whether a progression is ordinary in a particular hymn tradition;
- how strongly a first-inversion tonic weakens closure;
- whether harmonic rhythm is too active for congregational style.

These belong in versioned style or rule packs, not universal constants.

## 20.3 Corpus-derived properties

A representative corpus may estimate:

- transition frequency;
- inversion frequency in a context;
- common soprano-bass scale-degree pairs;
- common cadence patterns;
- typical harmonic rhythm;
- voice-leading distributions;
- stylistic outliers.

Corpus frequency does not equal correctness or quality. It is one ranking signal.

## 20.4 Curated properties

Human-authored knowledge will probably remain useful for:

- concise experiential labels such as “keeps moving” or “settled close”;
- explanations accessible to a solfège-first writer;
- exceptions that a compact rule system misclassifies;
- tradition-specific preferences;
- pedagogical ordering;
- candidate-diversity policies;
- hand-approved examples;
- mappings from multidimensional features to natural-language descriptions.

## 20.5 Recommended research posture

Build the system so every conclusion can carry:

- raw features;
- interpreted rule results;
- corpus evidence;
- curated descriptor or override;
- confidence;
- provider and version.

Then empirically determine which layers are needed. Do not decide this prematurely in the UI code.

# 21. Candidate generation and ranking research plan

This is post-POC work, but the interfaces should anticipate it.

## 21.1 Candidate generation stages

1. Partition the melody fragment into harmonic spans consistent with boundary policies.
2. Generate chord identities capable of supporting strong melody events.
3. Permit selected non-chord-tone interpretations on weaker or prepared events.
4. Build short harmonic paths consistent with the previous harmony and optional destination.
5. Generate bass choices and inversions.
6. Generate SATB voicings under range and spacing constraints.
7. Remove hard violations under the chosen style pack.
8. Annotate surviving candidates.
9. Rank by phrase intent and style profile.
10. Diversify the top results so the user receives distinct readings.

## 21.2 Constraint solver versus enumeration

Possible approaches:

- bounded exhaustive enumeration for tiny fragments;
- dynamic programming over harmonic spans;
- weighted finite-state graph;
- SAT/SMT or constraint-programming solver for voicing;
- beam search with rule-based pruning;
- learned reranking over rule-generated candidates.

The POC should not choose among these. It should establish the input and output contracts they must satisfy.

## 21.3 Candidate diversity

Ranking alone may produce near-duplicates. Add a diversity stage based on differences in:

- harmonic function path;
- cadence behavior;
- bass contour;
- number and type of non-chord tones;
- inversion pattern;
- tension profile;
- closure strength.

# 22. Phrase-intent model

Phrase intent is a user-facing simplification of a multidimensional target.

```ts
type PhraseIntent = "continue" | "build" | "approach_cadence" | "close";
```

Each intent eventually maps to a versioned weighting profile rather than a fixed chord list.

Example conceptual weights:

| Dimension | Continue | Build | Approach cadence | Close |
|---|---:|---:|---:|---:|
| Closure strength | Low | Low | Medium | High |
| Forward motion | Medium | High | High | Medium until final event |
| Dominant preparation | Low/Medium | Medium | High | High |
| Tonic root-position ending | Discouraged | Neutral | Neutral | Favored |
| Stable prolongation | Favored | Low | Medium | Low before arrival |
| Tension increase | Low | High | Medium/High | Resolve by end |

These are illustrative, not authoritative theory values.

# 23. Copy and labeling

## 23.1 Preferred language

Use concrete musical consequences:

- “Keeps tonic function without sounding fully closed.”
- “Treats fa as a passing tone over a held tonic.”
- “Creates dominant pressure and resolves strongly into I.”
- “Preserves your bass line while changing the inner voices.”

Avoid:

- “Best chord”
- “Correct answer”
- “Illegal”
- “Bad progression”
- “92% good”
- unexplained jargon as the only description.

## 23.2 Labels shown together

Where space permits, expose all three representations:

```text
do–mi–sol     I     C major
```

For a candidate path:

```text
V7 → I     G7 → C     sol–ti–re–fa → do–mi–sol
```

Solfège is primary, Roman numeral is analytical, and absolute chord symbol is practical.

# 24. Accessibility

Phase 0 requirements:

- All controls are keyboard operable.
- Focus indicators are visible.
- Candidate selection is not indicated by color alone.
- Lock states have accessible names.
- Playback state is announced through an `aria-live` region.
- Melody cards expose pitch, octave, duration, and beat in accessible text.
- Harmonic boundary controls state Hold, Allowed, or Required.
- SATB grid has row and event labels.
- Motion respects reduced-motion preference.
- Audio is never the sole carrier of an explanation.

Suggested keyboard behaviors:

- Left/right: move between melody events or candidate cards.
- Enter: edit selected item.
- Space: play or stop selected candidate when focus is not in a form control.
- L: toggle lock on the focused lockable object, when safe and discoverable.
- Escape: close editor or drawer.

# 25. Technical implementation recommendation

This is a recommendation rather than a strict product requirement.

## 25.1 Stack

- Next.js with TypeScript and the App Router, or a standalone React/Vite application.
- Component styling through Tailwind, CSS Modules, or an established component library; use semantic design tokens.
- Zod for fixture validation.
- Tone.js or Web Audio API for playback.
- Vitest/Jest and React Testing Library for unit and interaction tests.
- Playwright for primary workflow coverage and visual snapshots.

## 25.2 POC deployment

- Client-only operation.
- No database.
- No authentication.
- Fixtures bundled with the application.
- Optional localStorage only for restoring the last POC state; not required.

## 25.3 Suggested folder structure

```text
src/
├── app/
│   └── page.tsx
├── components/
│   ├── context/
│   ├── melody/
│   ├── candidates/
│   ├── inspector/
│   ├── playback/
│   └── shared/
├── domain/
│   ├── music-types.ts
│   ├── workbench-state.ts
│   ├── constraints.ts
│   └── evidence.ts
├── fixtures/
│   ├── registry.ts
│   ├── c-major-sol-fa-mi.ts
│   ├── c-major-do-ti-suspension.ts
│   └── schemas.ts
├── services/
│   ├── candidate-provider.ts
│   ├── fixture-candidate-provider.ts
│   └── playback-service.ts
├── state/
│   ├── reducer.ts
│   └── selectors.ts
├── styles/
│   └── tokens.css
└── tests/
```

# 26. Phase 0 implementation sequence

## Milestone 1: Static visual skeleton

- Build the five primary page regions.
- Render the default fixture.
- Match the annotated wireframe’s hierarchy.
- No editing or audio yet.

**Exit condition:** The static screen communicates the product without a verbal explanation.

## Milestone 2: Candidate selection and inspector

- Select among three candidate cards.
- Update the inspector from candidate data.
- Expand and collapse analysis details.

**Exit condition:** Candidate comparison is clear and no musical values are duplicated in component code.

## Milestone 3: Playback

- Melody, harmony reduction, SATB, and individual voice playback.
- Playback cursor and stop behavior.

**Exit condition:** A user can hear the meaningful difference among default candidates.

## Milestone 4: Melody and boundary editing

- Add, update, and delete melody events.
- Change boundary policies.
- Mark suggestions stale.
- Refresh into matching fixture or empty state.

**Exit condition:** Input and suggestions have an understandable causal relationship.

## Milestone 5: Locks and authored regeneration

- Lock chord, bass, voice, or voicing.
- Refresh to a compatible fixture candidate set.
- Explain unsatisfied lock combinations.

**Exit condition:** Partial decision preservation is comprehensible.

## Milestone 6: Apply, undo, and polish

- Apply selected candidate.
- Update accepted context.
- Undo/redo.
- Responsive and accessibility pass.
- Visual regression snapshots.

**Exit condition:** Complete POC success flow works reliably.

# 27. Acceptance criteria

## 27.1 Visual and interaction acceptance

- [ ] Melody strip is visually dominant.
- [ ] Harmonic-boundary controls are clearly separate from note cards.
- [ ] Candidate cards show three distinct readings in one glance.
- [ ] Selected and applied states cannot be confused.
- [ ] The inspector aligns melody, harmony, and SATB events by time.
- [ ] Lock states are visible and understandable.
- [ ] Theory detail is available but not forced onto the default view.
- [ ] The interface contains no giant graph or decorative chord web.

## 27.2 Functional acceptance

- [ ] Default fixture loads without network access.
- [ ] Candidate selection updates the inspector.
- [ ] Melody, harmony, SATB, and single-voice playback work.
- [ ] Starting new playback stops old playback.
- [ ] Editing context marks suggestions stale.
- [ ] Refresh loads a matching fixture or explicit empty state.
- [ ] Locks persist across compatible authored alternatives.
- [ ] Incompatible locks produce an explicit message.
- [ ] Apply updates accepted context.
- [ ] Undo restores the previous state.

## 27.3 Architecture acceptance

- [ ] No chord or candidate values are hard-coded inside display components.
- [ ] Fixtures validate against schemas.
- [ ] UI consumes generic candidate contracts.
- [ ] Lock state is independent of fixture data.
- [ ] Audio is isolated behind a service.
- [ ] Evidence supports computed, rule, corpus, curated, and user sources.
- [ ] Effect descriptors are context-sensitive and carry provenance.
- [ ] Major-only UI does not make major-only assumptions irreversible in types.

# 28. Testing plan

## 28.1 Unit tests

- melody signature generation;
- boundary signature generation;
- fixture matching;
- stale-state rules;
- lock hierarchy and mixed states;
- reducer transitions;
- timing-to-seconds conversion;
- fixture schema validation.

## 28.2 Component tests

- melody card editor behavior;
- boundary three-state control;
- candidate selection;
- analysis drawer expansion;
- lock toggles;
- empty fixture state;
- stale suggestions banner.

## 28.3 End-to-end tests

1. Load default fixture, play each candidate, select C, apply C.
2. Edit melody, verify stale state, refresh, verify unknown-fixture state.
3. Restore fixture, lock bass, refresh, verify bass preserved.
4. Attempt incompatible locks, verify explicit explanation.
5. Keyboard-only candidate selection and playback.

## 28.4 Visual regression states

Capture snapshots for:

- initial default;
- candidate playing;
- Candidate C selected;
- analysis drawer open;
- mixed lock state;
- stale suggestions;
- unknown fixture;
- tablet layout;
- mobile layout.

# 29. Explicit non-goals for the coding agent

The coding agent must not spend Phase 0 time on:

- building a generalized chord generator;
- scraping hymn corpora;
- implementing species counterpoint;
- generating notation-quality SVG staff engraving;
- training or integrating an ML model;
- producing every inversion or chord extension;
- adding modes to the visible UI;
- creating a spatial chord graph;
- creating accounts, cloud storage, or a backend;
- inventing theory explanations not present in fixtures.

# 30. Product questions to answer after the POC

After interface validation, evaluate:

1. Does the user prefer entering durations explicitly or choosing from rhythmic templates?
2. Are boundary controls intuitive, or should the user instead draw harmony spans?
3. Is three candidates the correct default?
4. Which lock granularity is genuinely useful?
5. Is lane-based SATB sufficient, or is staff notation necessary early?
6. Should bass be promoted into a first-class editable lane before alto and tenor?
7. Does phrase intent provide enough context, or is an expected destination needed?
8. Which effect descriptors are actually useful in composition?
9. Can closure and continuation be modeled from features reliably enough to generate labels?
10. Which judgments require curated hymn-style knowledge?
11. What corpus best represents the target tradition?
12. Should the user be able to choose among multiple hymn-style knowledge packs?
13. Should repeated user choices train only local preference weights or alter style rules?

# 31. Recommended first engine experiments after UI approval

Do not attempt the full engine at once. Run small experiments behind the established provider interface.

## Experiment 1: Chord-tone support

Given a melody span and allowed chord vocabulary, enumerate chords containing strong-beat melody notes. Measure candidate explosion and determine necessary pruning.

## Experiment 2: Harmonic segmentation

Enumerate chord-change placements under Hold, Allowed, and Required boundaries. Test whether explicit boundaries sufficiently control overharmonization.

## Experiment 3: SATB constraint solving

For one chord path, generate voicings that satisfy ranges, spacing, chord completeness, and a limited set of voice-leading rules.

## Experiment 4: Closure feature model

Compute a feature vector containing:

- final chord function;
- inversion;
- final bass scale degree;
- soprano scale degree;
- preceding harmonic function;
- root motion;
- phrase boundary;
- metric strength;
- tendency-tone resolution.

Have a knowledgeable reviewer label examples on a closure scale. Compare deterministic rules, weighted models, and curated exceptions.

## Experiment 5: Non-chord-tone classification

Begin with passing tones and suspensions only. Require explicit preparation and resolution evidence. Allow ambiguous classification.

## Experiment 6: Candidate diversity

Generate many candidates, then select three that differ in harmonic path, bass contour, and closure profile. Evaluate whether diversity is more valuable than raw rank.

# 32. Agent handoff instructions

The coding agent should treat the following as the immediate assignment:

> Build Phase 0 of the Hymn Harmonization Workbench as a polished client-side React/Next.js proof of concept. Use typed, schema-validated fixture data for every melody, chord, SATB voicing, explanation, descriptor, and score. Implement the five-region single-screen workbench, candidate comparison, detailed inspector, audio audition, melody and harmonic-boundary editing, stale-state handling, granular locks, fixture-based alternative refresh, apply, and undo. Do not implement a theory engine. Do not place music values in UI components. Preserve the future-facing domain, evidence, provenance, provider, and knowledge-pack boundaries described in this specification.

The agent should begin with the default `sol–fa–mi` fixture and deliver vertical slices. The first review should occur after the static visual skeleton and default candidate inspector are implemented, before adding all interactions.

# Appendix A. Default candidate copy deck

## Candidate A

**Title:** Grounded descent  
**Path:** I held  
**Bass:** do — do  
**Summary:** Hold tonic while fa passes through the soprano line.  
**Effect:** Calm and grounded; the phrase remains harmonically stable.  
**Detailed explanation:** The melody moves sol–fa–mi while the underlying tonic remains in place. The fa is heard as a passing dissonance between two chord tones rather than as a demand for a separate chord.

## Candidate B

**Title:** Strong arrival  
**Path:** V7 → I  
**Bass:** sol → do  
**Summary:** Use fa as the seventh of V7 and resolve it downward to mi.  
**Effect:** Creates dominant pressure followed by a clear arrival.  
**Detailed explanation:** The soprano’s fa belongs to V7 and resolves by step to mi over tonic. The bass motion sol–do and dominant-to-tonic progression make this the most closing reading of the three.

## Candidate C

**Title:** Keep moving  
**Path:** I → I6  
**Bass:** do → mi  
**Summary:** Preserve tonic function while moving the bass to the third.  
**Effect:** Sounds locally settled but not fully complete.  
**Detailed explanation:** The final sonority remains tonic, but first inversion reduces the sense of root-position closure. This can support the end of a subphrase or stanza line that must continue.

# Appendix B. Suggested development-only fixture panel

A development panel may be hidden behind a query parameter or environment flag. It should provide:

- fixture selector;
- candidate-set selector;
- raw state viewer;
- raw candidate JSON viewer;
- lock-signature viewer;
- playback event log;
- schema validation status;
- button to copy a reproducible state snapshot.

This panel must not influence the production information hierarchy.

# Appendix C. Review checklist for the first UI build

During the first visual review, answer these questions before approving further development:

1. Is the melody unmistakably the primary material?
2. Can a non-expert understand that boundaries control possible chord changes?
3. Can the three readings be compared without opening details?
4. Is the difference between Select and Apply obvious?
5. Does the selected candidate’s SATB lane remain readable at ordinary laptop width?
6. Are solfège, Roman numerals, and absolute chord names balanced correctly?
7. Do locks feel like constraints rather than bookmarks?
8. Does playback feel immediate enough for rapid comparison?
9. Is any section visually impressive but compositionally useless?
10. Is any theory label shown before the user needs it?

