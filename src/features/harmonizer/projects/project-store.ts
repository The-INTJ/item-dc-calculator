/**
 * Projects + saving (my design for Drew's review): localStorage-persisted,
 * client-only, following the repo's useSyncExternalStore + storage-event
 * pattern (see contest's useRecentContest — pattern copied, never imported).
 *
 * Envelope is zod-validated on read; corruption or a version mismatch yields
 * a stable empty envelope instead of a crash (a version bump deliberately
 * discards old data — documented POC policy). Writes are quota-guarded.
 */

import { useSyncExternalStore } from 'react';
import { z } from 'zod';
import type { CandidatePath } from '../domain/analysis-types';
import type { ConstraintLock } from '../domain/locks';
import type {
  PersistedCandidate,
  PersistedWorkbench,
  WorkbenchState,
} from '../domain/workbench-state';
import {
  AcceptedContextSchema,
  BoundaryConstraintSchema,
  MelodyFragmentSchema,
  PersistedCandidateSchema,
  PhraseIntentSchema,
  TonalContextSchema,
} from '../fixtures/schemas';

const STORAGE_KEY = 'harmonizer.projects.v2';
/** Retired keys are removed on the first successful v2 write (quota hygiene). */
const LEGACY_KEYS = ['harmonizer.projects.v1'];
const CHANGE_EVENT = 'harmonizer-projects:change';
const MAX_PROJECTS = 20;
const MAX_APPLIED_PER_PROJECT = 50;

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
});

const ProjectEnvelopeSchema: z.ZodType<ProjectEnvelope> = z.strictObject({
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

const EMPTY_ENVELOPE: ProjectEnvelope = { version: 2, activeProjectId: null, projects: [] };

let cachedRaw: string | null = null;
let cachedSnapshot: ProjectEnvelope = EMPTY_ENVELOPE;

export function readProjects(): ProjectEnvelope {
  if (typeof window === 'undefined') return EMPTY_ENVELOPE;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  if (!raw) {
    cachedSnapshot = EMPTY_ENVELOPE;
    return cachedSnapshot;
  }
  try {
    cachedSnapshot = ProjectEnvelopeSchema.parse(JSON.parse(raw));
  } catch {
    // Corruption or version mismatch — start clean, never crash.
    cachedSnapshot = EMPTY_ENVELOPE;
  }
  return cachedSnapshot;
}

export function subscribeToProjects(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  const handleCustom = () => onChange();
  window.addEventListener('storage', handleStorage);
  window.addEventListener(CHANGE_EVENT, handleCustom);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(CHANGE_EVENT, handleCustom);
  };
}

export function useProjects(): ProjectEnvelope {
  return useSyncExternalStore(subscribeToProjects, readProjects, () => EMPTY_ENVELOPE);
}

function writeEnvelope(envelope: ProjectEnvelope): 'saved' | 'error' {
  if (typeof window === 'undefined') return 'error';
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    for (const key of LEGACY_KEYS) window.localStorage.removeItem(key);
    window.dispatchEvent(new Event(CHANGE_EVENT));
    return 'saved';
  } catch {
    return 'error'; // quota / private mode — surfaced as the error dot
  }
}

function trimWorkbench(workbench: PersistedWorkbench): PersistedWorkbench {
  if (workbench.appliedFragments.length <= MAX_APPLIED_PER_PROJECT) return workbench;
  return {
    ...workbench,
    appliedFragments: workbench.appliedFragments.slice(-MAX_APPLIED_PER_PROJECT),
  };
}

export function getActiveProject(): HarmonizerProject | null {
  const envelope = readProjects();
  return (
    envelope.projects.find((project) => project.id === envelope.activeProjectId) ?? null
  );
}

export function createProject(
  name: string,
  workbench: PersistedWorkbench,
): HarmonizerProject {
  const now = new Date().toISOString();
  const project: HarmonizerProject = {
    id:
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().slice(0, 12)
        : Math.random().toString(36).slice(2, 14),
    name,
    createdAt: now,
    updatedAt: now,
    workbench: trimWorkbench(workbench),
  };
  const envelope = readProjects();
  writeEnvelope({
    version: 2,
    activeProjectId: project.id,
    projects: [...envelope.projects, project].slice(-MAX_PROJECTS),
  });
  return project;
}

export function renameProject(id: string, name: string): void {
  const envelope = readProjects();
  writeEnvelope({
    ...envelope,
    projects: envelope.projects.map((project) =>
      project.id === id
        ? { ...project, name: name.trim() || project.name, updatedAt: new Date().toISOString() }
        : project,
    ),
  });
}

/** Deletes; the active project falls back to the most recent remaining. */
export function deleteProject(id: string): ProjectEnvelope {
  const envelope = readProjects();
  const projects = envelope.projects.filter((project) => project.id !== id);
  const activeProjectId =
    envelope.activeProjectId === id
      ? (projects[projects.length - 1]?.id ?? null)
      : envelope.activeProjectId;
  const next: ProjectEnvelope = { version: 2, activeProjectId, projects };
  writeEnvelope(next);
  return next;
}

export function setActiveProject(id: string): void {
  const envelope = readProjects();
  if (!envelope.projects.some((project) => project.id === id)) return;
  writeEnvelope({ ...envelope, activeProjectId: id });
}

export function saveWorkbench(id: string, workbench: PersistedWorkbench): 'saved' | 'error' {
  const envelope = readProjects();
  if (!envelope.projects.some((project) => project.id === id)) return 'error';
  return writeEnvelope({
    ...envelope,
    projects: envelope.projects.map((project) =>
      project.id === id
        ? {
            ...project,
            workbench: trimWorkbench(workbench),
            updatedAt: new Date().toISOString(),
          }
        : project,
    ),
  });
}

/** The Tier-1 strip: drop everything re-derivable from the notes. */
export function toPersistedCandidate(candidate: CandidatePath): PersistedCandidate {
  const {
    harmonyEvents: _harmony,
    melodyInterpretations: _interpretations,
    derivability: _derivability,
    approach: _approach,
    ...persisted
  } = candidate;
  return persisted;
}

export function toPersistedWorkbench(state: WorkbenchState): PersistedWorkbench {
  const working =
    state.candidates.find((candidate) => candidate.id === state.selectedCandidateId) ?? null;
  return {
    tonalContext: state.tonalContext,
    phraseIntent: state.phraseIntent,
    tempoBpm: state.tempoBpm,
    acceptedContext: state.acceptedContext,
    appliedFragments: state.appliedFragments.map((applied) => ({
      id: applied.id,
      fragment: applied.fragment,
      candidate: toPersistedCandidate(applied.candidate),
    })),
    fragment: state.fragment,
    boundaryConstraints: state.boundaryConstraints,
    sourceFixtureId: state.sourceFixtureId,
    workingCandidate: working ? toPersistedCandidate(working) : null,
    // Suggestion cards are not persisted; only locks on the working notes
    // mean anything after a reload.
    locks: state.locks.filter((lock) => lock.candidateId === working?.id),
  };
}
