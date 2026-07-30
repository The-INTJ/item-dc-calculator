/**
 * The seam between fragments.
 *
 * "Add fragment" commits what you have and opens the next one already holding
 * the chord you just landed on: one beat, one note per part, at exactly the
 * pitches the previous fragment ended with (Drew, 2026-07-30). Starting from
 * silence made every fragment feel like a new piece; starting from the held
 * chord makes the hymn continuous, and the first thing you do is move away
 * from it.
 *
 * Pure and id-injected — safe inside the reducer.
 */

import type { CandidatePath } from './analysis-types';
import { USER_GENERATOR_ID, withDerivedAnalysis } from './derive-harmony';
import type {
  HarmonyEvent,
  MelodyEvent,
  MelodyFragment,
  SATBVoicing,
  VoiceEvent,
  VoiceId,
} from './music-types';
import { metricStrengthAt } from './timing';

const VOICES: VoiceId[] = ['soprano', 'alto', 'tenor', 'bass'];
const ONE_BEAT = { numerator: 1, denominator: 4 } as const;
const FRAGMENT_START = { measure: 1, beat: 1, subdivision: 0 } as const;

export interface NextFragmentIds {
  fragmentId: string;
  candidateId: string;
  melodyEventId: string;
  voiceEventIds: Record<VoiceId, string>;
}

export interface NextFragment {
  fragment: MelodyFragment;
  candidate: CandidatePath;
}

/** Same shape the engine uses for computed readings (engine/generate.ts). */
function titleFromHarmony(harmonyEvents: HarmonyEvent[]): string {
  const numerals = harmonyEvents.map((event) => event.analysis.romanNumeral);
  if (numerals.length === 0) return '';
  if (numerals.length === 1) return `${numerals[0]} held`;
  return numerals.join(' → ');
}

function heldNote(source: VoiceEvent, voice: VoiceId, id: string): VoiceEvent {
  return {
    id,
    voice,
    pitch: source.pitch,
    scaleDegree: source.scaleDegree,
    start: FRAGMENT_START,
    duration: ONE_BEAT,
    tieFromPrevious: false,
  };
}

/**
 * Build the fragment that continues `previous`. Null when any part is empty —
 * there is no note to carry over, so there is nothing honest to open with.
 */
export function continuationFragment(
  previous: CandidatePath,
  ids: NextFragmentIds,
): NextFragment | null {
  const tails = VOICES.map((voice) => {
    const events = previous.voicing[voice];
    return events[events.length - 1] ?? null;
  });
  if (tails.some((tail) => tail === null)) return null;

  const voicing = VOICES.reduce((accumulator, voice, index) => {
    accumulator[voice] = [heldNote(tails[index] as VoiceEvent, voice, ids.voiceEventIds[voice])];
    return accumulator;
  }, {} as SATBVoicing);

  const soprano = voicing.soprano[0];
  const melodyEvent: MelodyEvent = {
    id: ids.melodyEventId,
    pitch: soprano.pitch,
    scaleDegree: soprano.scaleDegree,
    start: FRAGMENT_START,
    duration: ONE_BEAT,
    tieFromPrevious: false,
    metricStrength: metricStrengthAt(0),
  };
  const fragment: MelodyFragment = { id: ids.fragmentId, events: [melodyEvent] };

  const stub: CandidatePath = {
    id: ids.candidateId,
    title: '',
    summary: '',
    tonalContext: previous.tonalContext,
    phraseIntent: previous.phraseIntent,
    harmonyEvents: [],
    voicing,
    melodyInterpretations: [],
    descriptors: [],
    evidence: [],
    provenance: {
      generatorId: USER_GENERATOR_ID,
      generatorVersion: '1.0.0',
      knowledgePackIds: [],
      fixtureAuthored: false,
    },
  };
  const derived = withDerivedAnalysis(stub, fragment, previous.tonalContext);
  return { fragment, candidate: { ...derived, title: titleFromHarmony(derived.harmonyEvents) } };
}
