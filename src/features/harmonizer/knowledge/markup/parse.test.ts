import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseMarkedText, plainTextFromMarked } from './parse';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('parseMarkedText', () => {
  it('parses the [term-id] form using the glossary display form', () => {
    expect(parseMarkedText('a [passing-tone] here')).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'term', termId: 'passing-tone', display: 'passing tone' },
      { kind: 'text', text: ' here' },
    ]);
  });

  it('parses the [Display text|term-id] form with the custom display', () => {
    expect(parseMarkedText('two [cadences|cadence] later')).toEqual([
      { kind: 'text', text: 'two ' },
      { kind: 'term', termId: 'cadence', display: 'cadences' },
      { kind: 'text', text: ' later' },
    ]);
  });

  it('handles adjacent tokens and leading/trailing tokens', () => {
    expect(parseMarkedText('[tonic][dominant]')).toEqual([
      { kind: 'term', termId: 'tonic', display: 'tonic' },
      { kind: 'term', termId: 'dominant', display: 'dominant' },
    ]);
    expect(parseMarkedText('[tonic] first')).toEqual([
      { kind: 'term', termId: 'tonic', display: 'tonic' },
      { kind: 'text', text: ' first' },
    ]);
  });

  it('passes plain text through untouched', () => {
    expect(parseMarkedText('no markup at all')).toEqual([
      { kind: 'text', text: 'no markup at all' },
    ]);
    expect(parseMarkedText('')).toEqual([]);
  });

  it('degrades an unknown id to plain text and warns once per id in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(parseMarkedText('a [zzz-unknown-alpha] b')).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'text', text: 'zzz-unknown-alpha' },
      { kind: 'text', text: ' b' },
    ]);
    expect(warn).toHaveBeenCalledTimes(1);

    // Same unknown id again — no second warning (once per id).
    parseMarkedText('again [zzz-unknown-alpha]');
    expect(warn).toHaveBeenCalledTimes(1);

    // A different unknown id warns on its own.
    parseMarkedText('[zzz-unknown-beta]');
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('renders an unknown id with custom display as that display text', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseMarkedText('[Custom words|zzz-unknown-gamma]')).toEqual([
      { kind: 'text', text: 'Custom words' },
    ]);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('plainTextFromMarked', () => {
  it('flattens markup to its display text', () => {
    expect(plainTextFromMarked('Hold [tonic] through the [cadences|cadence].')).toBe(
      'Hold tonic through the cadences.',
    );
  });
});
