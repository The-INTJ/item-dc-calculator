import { describe, expect, it } from 'vitest';
import type { ConstraintLock } from './locks';
import { getDefaultFixture } from '../fixtures/registry';
import { computeLockSignature, parseLockSignature } from './lock-signature';

const fixture = getDefaultFixture();
const candidates = fixture.candidateSets[0].candidates;

function lockFor(candidateId: string, targetId: string): ConstraintLock {
  return {
    id: `lock-${targetId}`,
    targetType: 'voice_event',
    targetId,
    candidateId,
    valueSnapshot: null,
    createdAt: '2026-07-29T00:00:00.000Z',
  };
}

describe('lock signatures', () => {
  it('computes canonical value-carrying signatures from live candidate notes', () => {
    // Candidate A's whole-note bass (C3).
    expect(computeLockSignature([lockFor('grounded-descent', 'a-b-1')], candidates)).toBe(
      'bass@0:16=C3',
    );
    // Candidate B's two-half bass — canonical order by start regardless of lock order.
    const signature = computeLockSignature(
      [lockFor('strong-arrival', 'b-b-2'), lockFor('strong-arrival', 'b-b-1')],
      candidates,
    );
    expect(signature).toBe('bass@0:8=G2|bass@8:8=C3');
  });

  it('sorts voices in SATB order and skips unresolvable locks', () => {
    const signature = computeLockSignature(
      [
        lockFor('strong-arrival', 'b-b-1'),
        lockFor('strong-arrival', 'b-a-1'),
        lockFor('strong-arrival', 'gone'),
        { ...lockFor('strong-arrival', 'b-t-1'), targetType: 'voice_row' },
      ],
      candidates,
    );
    expect(signature).toBe('alto@0:8=B3|bass@0:8=G2');
    expect(computeLockSignature([], candidates)).toBe('');
  });

  it('round-trips through parseLockSignature', () => {
    const entries = parseLockSignature('bass@0:8=G2|bass@8:8=C3');
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ voice: 'bass', startUnit: 0, units: 8 });
    expect(entries[0].pitch.midi).toBe(43);
    expect(entries[1].pitch.midi).toBe(48);
    expect(parseLockSignature('')).toEqual([]);
    expect(() => parseLockSignature('nonsense')).toThrow();
  });
});
