/* ---------------- stage B: voicing ---------------- */

import type { SpelledPitch, TonalContext } from '../../music-types';
import { computeMidi } from '../../pitch';
import { spellDegree } from '../../scale';
import type { StylePack } from '../style';
import type { DegreeMemberRef, EnumeratedChord } from './enumerate';
import type { LockedPitchConstraint, PathStep } from './path-steps';

export const STAGE_B_BEAM = 40;

export interface ChordSegment {
  step: PathStep;
  startUnit: number;
  units: number;
  eventIndex: number;
}

export interface Assignment {
  bass: SpelledPitch;
  tenor: SpelledPitch;
  alto: SpelledPitch;
  localCost: number;
  signature: string;
}

const VOICE_RANGES: Record<'bass' | 'tenor' | 'alto', { low: number; high: number }> = {
  bass: { low: 40, high: 60 },
  tenor: { low: 48, high: 67 },
  alto: { low: 55, high: 74 },
};

function placementsFor(
  context: TonalContext,
  member: DegreeMemberRef,
  range: { low: number; high: number },
): SpelledPitch[] {
  const spelled = spellDegree(context, member.degree, member.chromaticOffset);
  if (!spelled) return [];
  const placements: SpelledPitch[] = [];
  for (let octave = 1; octave <= 6; octave += 1) {
    const midi = computeMidi(spelled.letter, spelled.accidental, octave);
    if (midi >= range.low && midi <= range.high) {
      placements.push({ ...spelled, octave, midi });
    }
  }
  return placements;
}

/** Enumerate SATB completions of one chord under a fixed soprano. */
export function assignmentsFor(
  context: TonalContext,
  chord: EnumeratedChord,
  sopranoMidi: number,
  sopranoPc: number,
  allowSecondInversion: boolean,
  locks: LockedPitchConstraint[],
  style: StylePack,
): Assignment[] {
  const leadingPc = (context.tonicPitchClass + 11) % 12;
  const bassMembers: DegreeMemberRef[] = [chord.members[0]];
  if (chord.members.length === 3 || chord.members.length === 4) {
    bassMembers.push(chord.members[1]); // first inversion
  }
  if (allowSecondInversion && chord.members.length === 3) {
    bassMembers.push(chord.members[2]); // cadential six-four only
  }

  const lockFor = (voice: 'bass' | 'tenor' | 'alto') =>
    locks.find((lock) => lock.voice === voice) ?? null;
  const bassLock = lockFor('bass');
  // A locked bass fixes the pitch outright — one iteration, no member choice.
  const effectiveBassMembers = bassLock ? [bassMembers[0]] : bassMembers;

  const results: Assignment[] = [];
  for (const bassMember of effectiveBassMembers) {
    const bassOptions = bassLock
      ? [bassLock.pitch]
      : placementsFor(context, bassMember, VOICE_RANGES.bass);
    for (const bass of bassOptions) {
      for (const tenorMember of chord.members) {
        const tenorLock = lockFor('tenor');
        const tenorOptions = tenorLock
          ? [tenorLock.pitch]
          : placementsFor(context, tenorMember, VOICE_RANGES.tenor);
        for (const tenor of tenorOptions) {
          if (tenor.midi < bass.midi) continue;
          for (const altoMember of chord.members) {
            const altoLock = lockFor('alto');
            const altoOptions = altoLock
              ? [altoLock.pitch]
              : placementsFor(context, altoMember, VOICE_RANGES.alto);
            for (const alto of altoOptions) {
              if (alto.midi < tenor.midi || alto.midi > sopranoMidi) continue;
              if (alto.midi - tenor.midi > 12) continue;
              if (sopranoMidi - alto.midi > 12) continue;

              // Completeness + doubling.
              const pcs = new Set([bass.pitchClass, tenor.pitchClass, alto.pitchClass, sopranoPc]);
              let localCost = 0;
              const root = chord.pitchClasses[0];
              const third = chord.pitchClasses[1];
              const fifth = chord.pitchClasses[2];
              if (!pcs.has(root)) localCost += 2.5; // a chord without its root is another chord
              if (!pcs.has(third)) localCost += 2; // a chord without its third barely speaks
              if (!pcs.has(fifth)) localCost += chord.members.length === 4 ? 0.1 : 0.3;
              if (chord.members.length === 4 && !pcs.has(chord.pitchClasses[3])) localCost += 2;
              // Hymnal settings sit mostly in root position (corpus ≈ 55–58%).
              if (bass.pitchClass !== root) localCost += 0.35;
              const leadingCount = [bass, tenor, alto].filter(
                (pitch) => pitch.pitchClass === leadingPc,
              ).length + (sopranoPc === leadingPc ? 1 : 0);
              if (leadingCount >= 2) localCost += style.voiceLeadingCost('doubled_leading_tone');

              results.push({
                bass,
                tenor,
                alto,
                localCost,
                signature: `${bass.midi}.${tenor.midi}.${alto.midi}`,
              });
            }
          }
        }
      }
    }
  }
  results.sort((a, b) => a.localCost - b.localCost || a.signature.localeCompare(b.signature));
  return results.slice(0, STAGE_B_BEAM);
}
