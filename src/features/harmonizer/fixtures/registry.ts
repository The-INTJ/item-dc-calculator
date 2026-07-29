/**
 * Fixture registry. Spec §17.2: fixtures validate at startup — the parsed
 * output IS the registry, so an invalid fixture throws at module load (on the
 * server and the client) instead of ever rendering false musical content.
 */

import type { HarmonizationFixture } from '../domain/fixture-types';
import { cMajorSolFaMiContinue } from './c-major-sol-fa-mi-continue';
import { parseHarmonizationFixture } from './schemas';

export const DEFAULT_FIXTURE_ID = 'c-major-sol-fa-mi-continue';

const fixtures: readonly HarmonizationFixture[] = [
  parseHarmonizationFixture(cMajorSolFaMiContinue),
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
