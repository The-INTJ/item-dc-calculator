import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INSTRUMENT_ID,
  FALLBACK_INSTRUMENT_ID,
  getInstrumentDef,
  INSTRUMENTS,
  noteLengthFor,
} from './instruments';

describe('instrument roster', () => {
  it('starts on the sampled choir with an offline synth to fall back to', () => {
    expect(DEFAULT_INSTRUMENT_ID).toBe('choir');
    expect(getInstrumentDef(DEFAULT_INSTRUMENT_ID).engine).toBe('smplr');
    // The fallback must never need the network — that is the whole point of it.
    expect(getInstrumentDef(FALLBACK_INSTRUMENT_ID).requiresNetwork).toBe(false);
  });

  it('gives every instrument the config its engine needs', () => {
    for (const def of INSTRUMENTS) {
      if (def.engine === 'tone') {
        expect(def.tone).toBeTruthy();
        expect(def.requiresNetwork).toBe(false);
      } else {
        expect(def.smplr).toBeTruthy();
        expect(def.requiresNetwork).toBe(true);
      }
    }
  });
});

describe('noteLengthFor', () => {
  it('never clips notes short — congregational singing runs them together', () => {
    for (const def of INSTRUMENTS) {
      expect(noteLengthFor(def)).toBeGreaterThanOrEqual(1);
    }
  });

  it('overlaps sampled voices so the change of note blends', () => {
    expect(noteLengthFor(getInstrumentDef('choir'))).toBeGreaterThan(1);
    // Synth patches stop exactly on time; their own short release covers the join.
    expect(noteLengthFor(getInstrumentDef('soft-organ'))).toBe(1);
  });
});
