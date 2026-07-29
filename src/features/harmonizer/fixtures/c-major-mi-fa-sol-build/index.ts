import type { HarmonizationFixture } from '../../domain/fixture-types';
import { candidateD1, candidateD2, candidateD3 } from './candidates';
import { FIXTURE_D_ID, initialState, match } from './shared';

/** Fixture D (spec §11.4) — the hero-demo target, arrow-reachable from fixture A. */
export const cMajorMiFaSolBuild = {
  id: FIXTURE_D_ID,
  name: 'Rising melody — build',
  match,
  initialState,
  candidateSets: [
    {
      id: 'default',
      candidates: [candidateD1, candidateD2, candidateD3],
    },
  ],
} satisfies HarmonizationFixture;
