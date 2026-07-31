/**
 * The persisted project envelope: its types, the zod schemas that validate it
 * on read, and the canonical empty envelope. Split from project-store.ts —
 * the store owns storage I/O; this file owns the envelope's shape.
 */

import { z } from 'zod';
import type { ConstraintLock } from '../domain/locks';
import type { PersistedWorkbench } from '../domain/workbench-state';
import {
  AcceptedContextSchema,
  BoundaryConstraintSchema,
  MelodyFragmentSchema,
  PersistedCandidateSchema,
  PhraseIntentSchema,
  TonalContextSchema,
} from '../fixtures/schemas';

export interface HarmonizerProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  workbench: PersistedWorkbench;
}

export interface ProjectEnvelope {
  version: 2;
  activeProjectId: string | null;
  projects: HarmonizerProject[];
}

const ConstraintLockSchema: z.ZodType<ConstraintLock> = z.strictObject({
  id: z.string().min(1),
  targetType: z.enum([
    'harmony_event',
    'chord_identity',
    'inversion',
    'voice_event',
    'voice_row',
    'bass_line',
    'complete_voicing',
  ]),
  targetId: z.string().min(1),
  candidateId: z.string().min(1),
  valueSnapshot: z.unknown(),
  createdAt: z.string(),
});

const PersistedWorkbenchSchema: z.ZodType<PersistedWorkbench> = z.strictObject({
  tonalContext: TonalContextSchema,
  phraseIntent: PhraseIntentSchema,
  tempoBpm: z.number().positive(),
  acceptedContext: AcceptedContextSchema,
  appliedFragments: z.array(
    z.strictObject({
      id: z.string().min(1),
      fragment: MelodyFragmentSchema,
      candidate: PersistedCandidateSchema,
    }),
  ),
  fragment: MelodyFragmentSchema,
  boundaryConstraints: z.array(BoundaryConstraintSchema),
  sourceFixtureId: z.string().nullable(),
  workingCandidate: PersistedCandidateSchema.nullable(),
  locks: z.array(ConstraintLockSchema),
  // Additive (2026-07-30): optional so pre-measures saves still parse under
  // strictObject. Absent ⇒ LOAD_PROJECT migrates (appends the working reading
  // as the selected measure).
  selectedMeasureId: z.string().min(1).optional(),
});

export const ProjectEnvelopeSchema: z.ZodType<ProjectEnvelope> = z.strictObject({
  version: z.literal(2),
  activeProjectId: z.string().nullable(),
  projects: z.array(
    z.strictObject({
      id: z.string().min(1),
      name: z.string().min(1),
      createdAt: z.string(),
      updatedAt: z.string(),
      workbench: PersistedWorkbenchSchema,
    }),
  ),
});

export const EMPTY_ENVELOPE: ProjectEnvelope = {
  version: 2,
  activeProjectId: null,
  projects: [],
};
