/**
 * Advanced tier — the craft vocabulary. Definitions may reference core terms
 * and any analysis term (enforced by glossary.test.ts). The open-fifth entry
 * is deliberately neutral: in the shape-note tradition it is a sound with its
 * own character, never an error.
 */

import type { GlossaryTerm } from './types';

export const advancedTerms = {
  'voice-leading': {
    id: 'voice-leading',
    display: 'voice leading',
    matches: ['voice leading', 'voice-led'],
    tier: 'advanced',
    definition:
      'How each part travels from note to note as [chords|chord] change. Smooth voice leading gives every singer a line worth singing, not just notes to hit.',
    seeAlso: ['doubling', 'tendency-tone'],
  },
  doubling: {
    id: 'doubling',
    display: 'doubling',
    matches: ['doublings', 'doubled'],
    tier: 'advanced',
    definition:
      'Giving the same chord tone to two parts at once. Four voices singing a three-note [triad] must double something — most often the [root].',
    seeAlso: ['voice-leading', 'open-fifth'],
  },
  'tendency-tone': {
    id: 'tendency-tone',
    display: 'tendency tone',
    matches: ['tendency-tones', 'tendency tones'],
    tier: 'advanced',
    definition:
      'A [note] that leans hard toward one particular neighbor — the [leading-tone] pulling up to do, a chordal seventh pulling down. Hearing where a note wants to go is half of harmony.',
    seeAlso: ['leading-tone', 'resolution'],
  },
  'figured-bass': {
    id: 'figured-bass',
    display: 'figured bass',
    matches: ['figured basses', 'figures'],
    tier: 'advanced',
    definition:
      'An old shorthand: small numbers under a [bass] note naming the [intervals|interval] that sound above it, and so which [inversion] of the chord is meant.',
    seeAlso: ['inversion', 'roman-numeral'],
  },
  'pedal-point': {
    id: 'pedal-point',
    display: 'pedal point',
    matches: ['pedal-points', 'pedal points', 'pedal tone', 'pedal tones', 'pedal'],
    tier: 'advanced',
    definition:
      'A [note] — usually in the [bass] — held steady while the [chords|chord] change above it, like an organ’s pedal droning under moving harmony.',
    seeAlso: ['bass', 'non-chord-tone'],
  },
  anticipation: {
    id: 'anticipation',
    display: 'anticipation',
    matches: ['anticipations', 'anticipated'],
    tier: 'advanced',
    definition:
      'A [note] that arrives early: a voice slips to its next [chord-tone] just before the chord itself changes, leaning into what is coming.',
    seeAlso: ['suspension', 'non-chord-tone'],
  },
  appoggiatura: {
    id: 'appoggiatura',
    display: 'appoggiatura',
    matches: ['appoggiaturas'],
    tier: 'advanced',
    definition:
      'A [non-chord-tone] that leaps in, lands leaning on a strong [beat] with a pang of [dissonance], then settles by [step] — drama first, rest after.',
    seeAlso: ['suspension', 'escape-tone'],
  },
  'escape-tone': {
    id: 'escape-tone',
    display: 'escape tone',
    matches: ['escape-tones', 'escape tones'],
    tier: 'advanced',
    definition:
      'A [non-chord-tone] that steps away from a [chord-tone], then leaps off to the next chord — slipping out the side door instead of walking through it.',
    seeAlso: ['appoggiatura', 'neighbor-tone'],
  },
  retardation: {
    id: 'retardation',
    display: 'retardation',
    matches: ['retardations'],
    tier: 'advanced',
    definition:
      'A [suspension]’s upward twin: a held [note] clashes with the new [chord], then rises by [step] to settle — as when ti is held and then lifts to do.',
    seeAlso: ['suspension', 'resolution'],
  },
  'open-fifth': {
    id: 'open-fifth',
    display: 'open fifth',
    matches: ['open-fifths', 'open fifths', 'bare fifth', 'bare fifths'],
    tier: 'advanced',
    definition:
      'A [chord] sounded with only its [root] and fifth — no third — leaving a bare, hollow ring. The old shape-note books use this stark sound freely; it is part of their voice.',
    seeAlso: ['doubling', 'triad'],
  },
} satisfies Record<string, GlossaryTerm>;
