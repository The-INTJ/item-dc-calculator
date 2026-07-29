/**
 * Fixture registry. Spec §17.2: fixtures validate at startup — the parsed
 * output IS the registry, so an invalid fixture throws at module load (on the
 * server and the client) instead of ever rendering false musical content.
 */

import type { HarmonizationFixture } from '../domain/fixture-types';
import type { TonalContext } from '../domain/music-types';
import { aMinorLaTiDoContinue } from './a-minor-la-ti-do-continue';
import { cMajorDoTiSuspension } from './c-major-do-ti-suspension';
import { cMajorMiFaSolBuild } from './c-major-mi-fa-sol-build';
import { cMajorReMiContinueI6 } from './c-major-re-mi-continue-i6';
import { cMajorSolFaMiContinue } from './c-major-sol-fa-mi-continue';
import { parseHarmonizationFixture } from './schemas';

export const DEFAULT_FIXTURE_ID = 'c-major-sol-fa-mi-continue';

const fixtures: readonly HarmonizationFixture[] = [
  parseHarmonizationFixture(cMajorSolFaMiContinue),
  parseHarmonizationFixture(cMajorMiFaSolBuild),
  parseHarmonizationFixture(cMajorDoTiSuspension),
  parseHarmonizationFixture(cMajorReMiContinueI6),
  parseHarmonizationFixture(aMinorLaTiDoContinue),
];

export function getFixtureById(id: string): HarmonizationFixture | null {
  return fixtures.find((fixture) => fixture.id === id) ?? null;
}

export function getDefaultFixture(): HarmonizationFixture {
  const fixture = getFixtureById(DEFAULT_FIXTURE_ID);
  if (!fixture) {
    throw new Error(`Default fixture "${DEFAULT_FIXTURE_ID}" is not registered.`);
  }
  return fixture;
}

export function listFixtures(): readonly HarmonizationFixture[] {
  return fixtures;
}

export interface FixtureSummary {
  id: string;
  name: string;
  tonalContext: TonalContext;
  melodySignature: string;
}

/** Data for the Samples menu / next-fragment chooser. */
export function listFixtureSummaries(): FixtureSummary[] {
  return fixtures.map((fixture) => ({
    id: fixture.id,
    name: fixture.name,
    tonalContext: fixture.initialState.tonalContext,
    melodySignature: fixture.match.melodySignature,
  }));
}

/** Distinct tonal contexts across the registry — drives the Key selector. */
export function listTonalContexts(): TonalContext[] {
  const seen = new Map<string, TonalContext>();
  for (const fixture of fixtures) {
    const context = fixture.initialState.tonalContext;
    const key = `${context.tonicPitchClass}:${context.mode}:${context.minorDoSystem ?? ''}`;
    if (!seen.has(key)) seen.set(key, context);
  }
  return [...seen.values()];
}
