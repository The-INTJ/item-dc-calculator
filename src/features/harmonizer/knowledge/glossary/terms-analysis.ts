/**
 * Analysis tier — the reading-harmony vocabulary. Definitions may reference
 * core terms plus the five analysis helpers (step, half-step, scale-degree,
 * chord-tone, non-chord-tone); glossary.test.ts enforces that discipline so
 * no definition ever leans on a harder word than itself.
 */

import type { GlossaryTerm } from './types';

/** Shared tradition note for the two syllable-name entries. */
export const SI_TI_NOTE =
  'Older seven-shape books print si for the seventh degree; this workbench writes ti.';

export const analysisTerms = {
  interval: {
    id: 'interval',
    display: 'interval',
    matches: ['intervals'],
    tier: 'analysis',
    definition:
      'The distance between two [pitches|pitch], counted along the [scale]. Near intervals feel like neighbors talking; wide ones feel like calls across a valley.',
    seeAlso: ['step', 'half-step'],
  },
  step: {
    id: 'step',
    display: 'step',
    matches: ['steps', 'stepwise'],
    tier: 'analysis',
    definition:
      'Motion from a [note] to the very next note of the [scale], up or down. Lines that move by step are the easiest to sing.',
    seeAlso: ['half-step', 'interval'],
  },
  'half-step': {
    id: 'half-step',
    display: 'half step',
    matches: ['half-steps', 'half steps', 'semitone', 'semitones'],
    tier: 'analysis',
    definition:
      'The smallest distance between two notes in this music — a [step] squeezed tight, like mi to fa or ti to do.',
    seeAlso: ['step', 'leading-tone'],
  },
  'scale-degree': {
    id: 'scale-degree',
    display: 'scale degree',
    matches: ['scale-degrees', 'scale degrees', 'degree', 'degrees'],
    tier: 'analysis',
    definition:
      'A note’s numbered rung on the [scale] ladder, counted up from home: do is 1, re is 2, and so on to ti at 7.',
    seeAlso: ['solfege'],
  },
  'chord-tone': {
    id: 'chord-tone',
    display: 'chord tone',
    matches: ['chord-tones', 'chord tones'],
    tier: 'analysis',
    definition:
      'A [melody] note that belongs to the [chord] sounding beneath it. Chord tones feel at rest inside the harmony — at home wherever the chord is.',
    seeAlso: ['non-chord-tone'],
  },
  'non-chord-tone': {
    id: 'non-chord-tone',
    display: 'non-chord tone',
    matches: ['non-chord-tones', 'non-chord tones', 'nonharmonic tone', 'nonharmonic tones'],
    tier: 'analysis',
    definition:
      'A [melody] note that does not belong to the [chord] under it. The gentle clash it makes is deliberate — it gives a line motion and color.',
    seeAlso: ['chord-tone', 'passing-tone', 'neighbor-tone', 'suspension'],
  },
  triad: {
    id: 'triad',
    display: 'triad',
    matches: ['triads'],
    tier: 'analysis',
    definition:
      'The plainest [chord]: three notes stacked from a starting note, skipping every other rung of the [scale] on the way up.',
    seeAlso: ['root', 'seventh-chord'],
  },
  root: {
    id: 'root',
    display: 'root',
    matches: ['roots'],
    tier: 'analysis',
    definition:
      'The [note] a [chord] is built from and named after. When the root is also the lowest note sung, the chord stands its firmest.',
    seeAlso: ['inversion', 'bass'],
  },
  'seventh-chord': {
    id: 'seventh-chord',
    display: 'seventh chord',
    matches: ['seventh-chords', 'seventh chords', 'seventh'],
    tier: 'analysis',
    definition:
      'A [chord] of four different notes: a triad with one more skip stacked on top. That fourth note adds a tension that wants to move.',
    seeAlso: ['triad', 'dominant'],
  },
  inversion: {
    id: 'inversion',
    display: 'inversion',
    matches: ['inversions', 'inverted'],
    tier: 'analysis',
    definition:
      'Turning a [chord] over so a note other than its root sits on the bottom. Same chord, softer footing — it keeps its name but loses some planted weight.',
    seeAlso: ['root', 'figured-bass'],
  },
  'leading-tone': {
    id: 'leading-tone',
    display: 'leading tone',
    matches: ['leading-tones', 'leading tones'],
    tier: 'analysis',
    definition:
      'The seventh [scale-degree], ti — one [half-step] below home. It leans so hard toward do that the ear all but sings the arrival for you.',
    seeAlso: ['tonic', 'tendency-tone'],
    note: SI_TI_NOTE,
  },
  dominant: {
    id: 'dominant',
    display: 'dominant',
    matches: ['dominants'],
    tier: 'analysis',
    definition:
      'The [chord] built on the fifth [scale-degree], sol. It gathers the strongest pull toward home — a drawn bowstring aimed at the [tonic].',
    seeAlso: ['tonic', 'authentic-cadence'],
  },
  subdominant: {
    id: 'subdominant',
    display: 'subdominant',
    matches: ['subdominants'],
    tier: 'analysis',
    definition:
      'The [chord] built on the fourth [scale-degree], fa. It leans gently away from home — the step out the front door before the walk back.',
    seeAlso: ['plagal-cadence', 'dominant'],
  },
  'roman-numeral': {
    id: 'roman-numeral',
    display: 'Roman numeral',
    matches: ['roman-numerals', 'roman numerals', 'numeral', 'numerals'],
    tier: 'analysis',
    definition:
      'A label that names a [chord] by the [scale-degree] it is built on — I for the chord on do, V for the chord on sol — so the same pattern can be read in any [key].',
    seeAlso: ['scale-degree', 'inversion'],
  },
  solfege: {
    id: 'solfege',
    display: 'solfège',
    matches: ['solfege', 'sol-fa', 'syllable', 'syllables'],
    tier: 'analysis',
    definition:
      'The do-re-mi names for the notes of the [scale]. Because they name rungs on the ladder rather than fixed [pitches|pitch], a tune keeps the same syllables in every [key].',
    seeAlso: ['scale-degree'],
    note: SI_TI_NOTE,
  },
  consonance: {
    id: 'consonance',
    display: 'consonance',
    matches: ['consonances', 'consonant'],
    tier: 'analysis',
    definition: 'Two or more notes that sound settled together — at rest, needing nowhere to go.',
    seeAlso: ['dissonance'],
  },
  dissonance: {
    id: 'dissonance',
    display: 'dissonance',
    matches: ['dissonances', 'dissonant'],
    tier: 'analysis',
    definition:
      'Notes that rub against each other when sounded together, making a tension the music then wants to soothe.',
    seeAlso: ['consonance', 'resolution'],
  },
  resolution: {
    id: 'resolution',
    display: 'resolution',
    matches: ['resolutions', 'resolve', 'resolves', 'resolved', 'resolving'],
    tier: 'analysis',
    definition:
      'The moment a tense [note] or [chord] settles into a restful one — the breath let out after being held.',
    seeAlso: ['dissonance', 'cadence'],
  },
  cadence: {
    id: 'cadence',
    display: 'cadence',
    matches: ['cadences', 'cadential'],
    tier: 'analysis',
    definition:
      'A stopping place at the end of a phrase: a pair of [chords|chord] that acts like a comma or a period in the music’s sentence.',
    seeAlso: ['authentic-cadence', 'half-cadence', 'plagal-cadence', 'deceptive-cadence'],
  },
  'authentic-cadence': {
    id: 'authentic-cadence',
    display: 'authentic cadence',
    matches: ['authentic-cadences', 'authentic cadences'],
    tier: 'analysis',
    definition:
      'The firmest close: the chord on sol moving home to the chord on do — a period at the end of the sentence.',
    seeAlso: ['cadence', 'dominant', 'tonic'],
  },
  'half-cadence': {
    id: 'half-cadence',
    display: 'half cadence',
    matches: ['half-cadences', 'half cadences'],
    tier: 'analysis',
    definition:
      'A phrase that pauses on the chord built on sol instead of going home — a comma that leaves the thought hanging, ready to continue.',
    seeAlso: ['cadence', 'dominant'],
  },
  'plagal-cadence': {
    id: 'plagal-cadence',
    display: 'plagal cadence',
    matches: ['plagal-cadences', 'plagal cadences', 'amen cadence'],
    tier: 'analysis',
    definition:
      'The “Amen” close sung at the end of many hymns: the chord on fa settling home to the chord on do, gentler than a full stop.',
    seeAlso: ['cadence', 'subdominant'],
  },
  'deceptive-cadence': {
    id: 'deceptive-cadence',
    display: 'deceptive cadence',
    matches: ['deceptive-cadences', 'deceptive cadences'],
    tier: 'analysis',
    definition:
      'A close that changes its mind: the music sets up a return home, then steps aside to a different [chord], keeping the phrase alive a little longer.',
    seeAlso: ['cadence', 'dominant'],
  },
  'passing-tone': {
    id: 'passing-tone',
    display: 'passing tone',
    matches: ['passing-tones', 'passing tones'],
    tier: 'analysis',
    definition:
      'A [non-chord-tone] that walks by [step] between two [chord-tones|chord-tone], usually on a weak [beat] — a stepping stone between two banks.',
    seeAlso: ['neighbor-tone', 'non-chord-tone'],
  },
  'neighbor-tone': {
    id: 'neighbor-tone',
    display: 'neighbor tone',
    matches: ['neighbor-tones', 'neighbor tones'],
    tier: 'analysis',
    definition:
      'A [non-chord-tone] that steps off a [chord-tone] to the note next door and steps right back — a quick visit before returning home.',
    seeAlso: ['passing-tone', 'non-chord-tone'],
  },
  suspension: {
    id: 'suspension',
    display: 'suspension',
    matches: ['suspensions', 'suspended'],
    tier: 'analysis',
    definition:
      'A [note] held over from the old [chord] into the new one, where it clashes, then settles down by [step]. The tension and its release are the whole point of the figure.',
    seeAlso: ['retardation', 'resolution', 'non-chord-tone'],
  },
} satisfies Record<string, GlossaryTerm>;
