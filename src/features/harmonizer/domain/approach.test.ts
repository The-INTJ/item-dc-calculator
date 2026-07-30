import { describe, expect, it } from 'vitest';
import { getDefaultFixture } from '../fixtures/registry';
import { approachFromAccepted, lastSounding, stampApproach } from './approach';
import type { AcceptedContext } from './workbench-state';

const fixture = getDefaultFixture();
const candidates = fixture.candidateSets[0].candidates;
const candidate = candidates[0];

describe('lastSounding', () => {
  it('takes the note latest on the timeline, not last in the array', () => {
    const reversed = {
      ...candidate.voicing,
      soprano: [...candidate.voicing.soprano].reverse(),
    };
    const forwards = lastSounding(candidate.voicing, 'soprano');
    const backwards = lastSounding(reversed, 'soprano');
    expect(backwards?.id).toBe(forwards?.id);
    // Fixture A's melody ends on mi.
    expect(forwards?.scaleDegree.syllable).toBe('mi');
  });
});

describe('approachFromAccepted', () => {
  it('is null when the snippet opens the piece', () => {
    expect(
      approachFromAccepted({ previousHarmony: null, previousVoicing: null }),
    ).toBeNull();
  });

  it('reads the note each voice arrives from', () => {
    const accepted: AcceptedContext = {
      previousHarmony: fixture.initialState.acceptedContext.previousHarmony,
      previousVoicing: candidate.voicing,
    };
    const approach = approachFromAccepted(accepted);
    expect(approach).not.toBeNull();
    if (!approach) return;
    expect(approach.harmony?.analysis.romanNumeral).toBe('I');
    expect(approach.voices.soprano?.scaleDegree.syllable).toBe('mi');
    expect(approach.voices.bass?.pitch.letter).toBe('C');
    // Every voice that sounded is represented.
    expect(Object.keys(approach.voices).sort()).toEqual(['alto', 'bass', 'soprano', 'tenor']);
  });

  it('keeps a hand-picked chord even with no voicing behind it', () => {
    const approach = approachFromAccepted({
      previousHarmony: fixture.initialState.acceptedContext.previousHarmony,
      previousVoicing: null,
    });
    expect(approach?.harmony).not.toBeNull();
    expect(approach?.voices).toEqual({});
  });
});

describe('stampApproach', () => {
  it('attaches the seam to every candidate without touching a note', () => {
    const stamped = stampApproach(candidates, {
      previousHarmony: fixture.initialState.acceptedContext.previousHarmony,
      previousVoicing: candidate.voicing,
    });
    expect(stamped).toHaveLength(candidates.length);
    stamped.forEach((entry, index) => {
      expect(entry.approach?.voices.soprano?.scaleDegree.syllable).toBe('mi');
      expect(entry.voicing).toBe(candidates[index].voicing);
    });
  });

  it('strips the seam again when the snippet opens the piece', () => {
    const stamped = stampApproach(candidates, {
      previousHarmony: fixture.initialState.acceptedContext.previousHarmony,
      previousVoicing: candidate.voicing,
    });
    const cleared = stampApproach(stamped, { previousHarmony: null, previousVoicing: null });
    for (const entry of cleared) {
      expect('approach' in entry).toBe(false);
    }
  });
});
