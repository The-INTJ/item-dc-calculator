/**
 * Core tier — the bedrock vocabulary. Every definition here is plain English
 * with ZERO bracket markup (enforced by glossary.test.ts): a reader must be
 * able to stop at any core term and stand on solid ground.
 */

import type { GlossaryTerm } from './types';

export const coreTerms = {
  note: {
    id: 'note',
    display: 'note',
    matches: ['notes'],
    tier: 'core',
    definition:
      'A single musical sound with a definite highness and a definite length. Notes are the letters music spells its words with.',
  },
  pitch: {
    id: 'pitch',
    display: 'pitch',
    matches: ['pitches'],
    tier: 'core',
    definition:
      'How high or low a note sounds. Pitches are named with the letters A through G, and each has its own line or space on the staff.',
  },
  beat: {
    id: 'beat',
    display: 'beat',
    matches: ['beats'],
    tier: 'core',
    definition:
      'The steady pulse under the music — what your foot taps. Notes last for one beat, part of a beat, or several beats.',
    seeAlso: ['measure'],
  },
  measure: {
    id: 'measure',
    display: 'measure',
    matches: ['measures', 'bar', 'bars'],
    tier: 'core',
    definition:
      'A small parcel of beats marked off by bar lines. Hymns usually count three or four beats to the measure, with the first beat carrying the most weight.',
    seeAlso: ['beat'],
  },
  melody: {
    id: 'melody',
    display: 'melody',
    matches: ['melodies', 'melodic', 'tune'],
    tier: 'core',
    definition:
      'The tune itself — the line of notes you would hum on its own. In this workbench the soprano part carries the melody.',
    seeAlso: ['soprano', 'harmony'],
  },
  harmony: {
    id: 'harmony',
    display: 'harmony',
    matches: ['harmonies', 'harmonic', 'harmonize', 'harmonized', 'harmonization'],
    tier: 'core',
    definition:
      'Notes sounded together with the melody to support and color it. Where the melody is one singer’s path, harmony is the whole congregation’s sound.',
    seeAlso: ['chord', 'voice-leading'],
  },
  chord: {
    id: 'chord',
    display: 'chord',
    matches: ['chords', 'chordal'],
    tier: 'core',
    definition:
      'Three or more pitches sounding at the same time, heard as one combined sound — the block harmony is built from.',
    seeAlso: ['triad', 'harmony'],
  },
  scale: {
    id: 'scale',
    display: 'scale',
    matches: ['scales'],
    tier: 'core',
    definition:
      'The ladder of notes a piece draws from, climbing rung by rung from the home note back to itself: do, re, mi, fa, sol, la, ti, do.',
    seeAlso: ['key', 'scale-degree'],
  },
  key: {
    id: 'key',
    display: 'key',
    matches: ['keys'],
    tier: 'core',
    definition:
      'The family of notes a piece lives in, named for its home note. Knowing the key tells you where do sits and which notes belong.',
    seeAlso: ['tonic', 'scale'],
  },
  tonic: {
    id: 'tonic',
    display: 'tonic',
    matches: ['tonics'],
    tier: 'core',
    definition:
      'The home note, and the home chord built on it: the place the music gravitates toward and feels finished when it lands. Do in solfège.',
    seeAlso: ['key', 'dominant'],
  },
  soprano: {
    id: 'soprano',
    display: 'soprano',
    matches: ['sopranos'],
    tier: 'core',
    definition:
      'The highest of the four parts, and the one that carries the melody here. Its notes sit at the top of each chord.',
    seeAlso: ['alto', 'melody'],
  },
  alto: {
    id: 'alto',
    display: 'alto',
    matches: ['altos'],
    tier: 'core',
    definition:
      'The second part down, singing just beneath the soprano and filling in the upper middle of each chord.',
    seeAlso: ['soprano', 'tenor'],
  },
  tenor: {
    id: 'tenor',
    display: 'tenor',
    matches: ['tenors'],
    tier: 'core',
    definition:
      'The third part down, above the bass. It often moves in close harmony with the alto and can carry striking lines of its own.',
    seeAlso: ['alto', 'bass'],
  },
  bass: {
    id: 'bass',
    display: 'bass',
    matches: ['basses'],
    tier: 'core',
    definition:
      'The lowest of the four parts — the floor the chords stand on. Which note the bass sings shapes how solid each chord feels.',
    seeAlso: ['root', 'inversion'],
  },
} satisfies Record<string, GlossaryTerm>;
