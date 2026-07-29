/**
 * Canonical lock signatures — the bridge between the user's per-note locks and
 * authored lock-alternative candidate sets (spec §10.6, §17.1 lockSignature).
 *
 * Grammar: one segment per locked note, `voice@startUnit:units=PitchNotation`
 * (0-based sixteenth start), sorted by SATB voice order then start, joined
 * with `|`. Example: `bass@0:8=G2|bass@8:8=C3`. Candidate-independent and
 * value-carrying, so "this exact bass line" matches regardless of which
 * candidate the notes were locked on. Only voice_event locks participate —
 * per Drew, individual note locks are the only lock primitive.
 */

import type { CandidatePath } from './analysis-types';
import type { ConstraintLock } from './locks';
import type { Accidental, LetterName, SpelledPitch, VoiceId } from './music-types';
import { spellPitch } from './scale';
import { toTimelineSpan } from './timing';

export interface LockSignatureEntry {
  voice: VoiceId;
  startUnit: number;
  units: number;
  pitch: SpelledPitch;
}

const VOICE_ORDER: Record<VoiceId, number> = { soprano: 0, alto: 1, tenor: 2, bass: 3 };
const VOICES: VoiceId[] = ['soprano', 'alto', 'tenor', 'bass'];

function pitchNotation(pitch: SpelledPitch): string {
  const accidental = pitch.accidental === 'natural' ? '' : pitch.accidental;
  return `${pitch.letter}${accidental}${pitch.octave}`;
}

/**
 * Resolve voice_event locks to live notes in the CURRENT candidates (targetId
 * lookup, never stale snapshots), in canonical order.
 */
export function resolveLockEntries(
  locks: ConstraintLock[],
  candidates: CandidatePath[],
): LockSignatureEntry[] {
  const entries: LockSignatureEntry[] = [];
  for (const lock of locks) {
    if (lock.targetType !== 'voice_event') continue;
    const candidate = candidates.find((path) => path.id === lock.candidateId);
    if (!candidate) continue;
    for (const voice of VOICES) {
      const event = candidate.voicing[voice].find((entry) => entry.id === lock.targetId);
      if (!event) continue;
      const span = toTimelineSpan(event.start, event.duration);
      entries.push({
        voice,
        startUnit: span.startUnit - 1,
        units: span.spanUnits,
        pitch: event.pitch,
      });
      break;
    }
  }
  entries.sort(
    (a, b) => VOICE_ORDER[a.voice] - VOICE_ORDER[b.voice] || a.startUnit - b.startUnit,
  );
  return entries;
}

/** '' when no voice_event lock resolves to a live note. Duplicate values (the
 * same note locked across sibling candidates after a lock-set remap) collapse
 * to one segment. */
export function computeLockSignature(
  locks: ConstraintLock[],
  candidates: CandidatePath[],
): string {
  const segments = resolveLockEntries(locks, candidates).map(
    (entry) => `${entry.voice}@${entry.startUnit}:${entry.units}=${pitchNotation(entry.pitch)}`,
  );
  return [...new Set(segments)].join('|');
}

const SEGMENT_PATTERN = /^(soprano|alto|tenor|bass)@(\d+):(\d+)=([A-G])(bb|b|#|x)?(-?\d+)$/;

/** Parse an authored signature; throws on malformed segments (integrity tests). */
export function parseLockSignature(signature: string): LockSignatureEntry[] {
  if (signature === '') return [];
  return signature.split('|').map((segment) => {
    const match = SEGMENT_PATTERN.exec(segment);
    if (!match) throw new Error(`Malformed lock-signature segment: ${segment}`);
    const voice = match[1] as VoiceId;
    const letter = match[4] as LetterName;
    const accidental = (match[5] ?? 'natural') as Accidental;
    return {
      voice,
      startUnit: Number(match[2]),
      units: Number(match[3]),
      pitch: spellPitch(letter, accidental, Number(match[6])),
    };
  });
}
