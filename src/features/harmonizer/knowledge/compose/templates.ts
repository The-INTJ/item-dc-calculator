/**
 * Explanation templates — where engine facts become beginner prose. Style
 * contract (tested): at most two sentences, "what + why", solfège-first
 * (numerals ride along in parentheses — singing-school students know do-re-mi
 * long before they meet roman numerals), stable endpoints first → moving
 * syllable → tension → resolution, and NEVER the banned judgment words
 * (best/correct/illegal/bad/percent). Every music term is glossary-marked via
 * the TermId-typed term() builder, so a typo is a compile error.
 */

import { term } from '../glossary';

/** Solfège-first chord naming: "the sol chord (V, G)". */
export function chordName(rootSyllable: string, numeral: string, symbol: string): string {
  return `the ${rootSyllable} ${term('chord')} (${numeral}, ${symbol})`;
}

export interface NctProseParams {
  /** The moving note's syllable: 'fa'. */
  syllable: string;
  /** Stable endpoints, when known. */
  from?: string;
  to?: string;
  /** Solfège-first name of the chord the note sounds against. */
  chordName: string;
  /** True when the harmony holds still beneath the note. */
  held: boolean;
  suspensionFigure?: string;
}

export const composeTemplates = {
  chordTone(p: { syllable: string; chordName: string }): string {
    return `The ${p.syllable} sits inside ${p.chordName} — a ${term('chord-tone')}, at rest with the ${term('harmony')} around it.`;
  },

  passing(p: NctProseParams): string {
    if (p.held && p.from && p.to) {
      return `Hold ${p.chordName} while the soprano moves ${p.from}–${p.syllable}–${p.to}. The ${p.syllable} acts as a ${term('passing-tone')}, briefly creating ${term('dissonance')} against the held chord before resolving to ${p.to}.`;
    }
    return `The ${p.syllable} walks by ${term('step')} between two chord tones${p.from && p.to ? ` (${p.from} to ${p.to})` : ''}. A ${term('passing-tone')} fills the gap in one direction.`;
  },

  neighbor(p: NctProseParams): string {
    return `The soprano steps from ${p.from ?? 'a chord tone'} to ${p.syllable} and right back. The ${p.syllable} is a ${term('neighbor-tone')}, brushing against ${p.chordName} before settling home.`;
  },

  suspension(p: NctProseParams): string {
    const figure = p.suspensionFigure && p.suspensionFigure !== 'other' ? ` (${p.suspensionFigure})` : '';
    return `The ${p.syllable} holds over from the previous chord while the ${term('harmony')} moves to ${p.chordName}. The held note clashes — a ${term('suspension')}${figure} — then falls by ${term('step')}${p.to ? ` to ${p.to}` : ''} to ${term('resolution', 'resolve')}.`;
  },

  retardation(p: NctProseParams): string {
    return `The ${p.syllable} holds over from the previous chord and clashes against ${p.chordName}. Instead of falling, it rises by ${term('step')}${p.to ? ` to ${p.to}` : ''} — a ${term('retardation')}, the upward cousin of the ${term('suspension')}.`;
  },

  anticipation(p: NctProseParams): string {
    return `The ${p.syllable} belongs to the next chord and arrives a moment early — an ${term('anticipation')}. The ${term('harmony')} catches up right after.`;
  },

  appoggiatura(p: NctProseParams): string {
    return `The soprano leaps onto ${p.syllable}, which lands with a clash against ${p.chordName}. A leaning note (${term('appoggiatura')}) — it steps${p.to ? ` to ${p.to}` : ''} to ${term('resolution', 'resolve')}.`;
  },

  escape(p: NctProseParams): string {
    return `The ${p.syllable} steps away from a chord tone, then escapes by leap — an ${term('escape-tone')}, a light ornament on the way out.`;
  },

  pedal(p: NctProseParams): string {
    return `The ${p.syllable} holds its ground while the chords change around it — a ${term('pedal-point')}, clashing and re-fitting as the ${term('harmony')} passes.`;
  },

  ambiguous(p: { syllable: string; chordName: string }): string {
    return `The ${p.syllable} is not a tone of ${p.chordName}, and no single textbook reading fits it cleanly. Hearing it more than one way is legitimate.`;
  },

  noChordIdentity(p: { syllable: string }): string {
    return `The notes sounding under the ${p.syllable} form no ${term('chord')} to measure it against — shown exactly as it sounds.`;
  },
} as const;

export type CadenceKind = 'authentic' | 'half' | 'plagal' | 'deceptive';

export const cadenceDescriptors: Record<
  CadenceKind,
  { label: string; explanation: string }
> = {
  authentic: {
    label: 'settled close',
    explanation: `The phrase closes ${term('dominant')}-to-${term('tonic')} (V → I) — an ${term('authentic-cadence')}, the strongest way home.`,
  },
  half: {
    label: 'open pause',
    explanation: `The phrase pauses on the ${term('dominant')} (V) — a ${term('half-cadence')}, a comma that leaves the ear waiting for more.`,
  },
  plagal: {
    label: 'gentle amen',
    explanation: `The ${term('subdominant')} settles onto the ${term('tonic')} (IV → I) — a ${term('plagal-cadence')}, the familiar Amen ending.`,
  },
  deceptive: {
    label: 'surprise turn',
    explanation: `The ${term('dominant')} sets up home but lands somewhere else — a ${term('deceptive-cadence')}, a gentle "but…" that keeps the phrase going.`,
  },
};

export const stabilityDescriptors = {
  grounded: {
    label: 'grounded',
    explanation: `The ${term('harmony')} stays on the home chord (${term('tonic')}) throughout — nothing pulls away.`,
  },
  keepsMoving: {
    label: 'keeps moving',
    explanation: `The chords lean away from home toward the ${term('dominant')}, keeping the phrase in motion.`,
  },
} as const;

export const tensionDescriptors = {
  heldBreath: {
    label: 'held breath',
    explanation: `A ${term('suspension')} delays its landing by a beat — ${term('dissonance')} held, then released.`,
  },
} as const;

export const styleDescriptors = {
  openSound: {
    label: 'open sound',
    explanation: `A bare ${term('open-fifth')} rings here — the hollow color the old shape-note books use freely.`,
  },
} as const;
