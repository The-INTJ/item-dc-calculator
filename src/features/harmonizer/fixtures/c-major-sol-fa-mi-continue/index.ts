import type { HarmonizationFixture } from '../../domain/fixture-types';
import { candidateA } from './candidate-a-grounded-descent';
import { candidateB } from './candidate-b-strong-arrival';
import { candidateC } from './candidate-c-keep-moving';
import { FIXTURE_ID, initialState, match } from './shared';

/** Fixture A (spec §11.1) — the default and most polished fixture. */
export const cMajorSolFaMiContinue = {
  id: FIXTURE_ID,
  name: 'Descending melody — continue',
  match,
  initialState,
  candidateSets: [
    {
      id: 'default',
      candidates: [candidateA, candidateB, candidateC],
    },
  ],
} satisfies HarmonizationFixture;
