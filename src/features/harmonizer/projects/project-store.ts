/**
 * Projects + saving (my design for Drew's review): localStorage-persisted,
 * client-only, following the repo's useSyncExternalStore + storage-event
 * pattern (see contest's useRecentContest — pattern copied, never imported).
 *
 * Envelope is zod-validated on read; corruption or a version mismatch yields
 * a stable empty envelope instead of a crash (a version bump deliberately
 * discards old data — documented POC policy). Writes are quota-guarded.
 *
 * The envelope's shape lives in project-envelope.ts; the state→persisted
 * serialization lives in persisted-workbench.ts. Both re-export from here so
 * import paths stay stable.
 */

import { useSyncExternalStore } from 'react';
import type { PersistedWorkbench } from '../domain/workbench-state';
import {
  EMPTY_ENVELOPE,
  ProjectEnvelopeSchema,
  type HarmonizerProject,
  type ProjectEnvelope,
} from './project-envelope';

export type { HarmonizerProject, ProjectEnvelope } from './project-envelope';
export { toPersistedCandidate, toPersistedWorkbench } from './persisted-workbench';

const STORAGE_KEY = 'harmonizer.projects.v2';
/** Retired keys are removed on the first successful v2 write (quota hygiene). */
const LEGACY_KEYS = ['harmonizer.projects.v1'];
const CHANGE_EVENT = 'harmonizer-projects:change';
const MAX_PROJECTS = 20;
const MAX_APPLIED_PER_PROJECT = 50;

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
  const { appliedFragments, selectedMeasureId } = workbench;
  if (appliedFragments.length <= MAX_APPLIED_PER_PROJECT) return workbench;
  // Drop from the head as before, but never across the selected measure — a
  // save may then exceed MAX only while the user is editing inside the
  // would-be-dropped head (the quota guard still covers write failure).
  const overflow = appliedFragments.length - MAX_APPLIED_PER_PROJECT;
  const selectedIndex = selectedMeasureId
    ? appliedFragments.findIndex((entry) => entry.id === selectedMeasureId)
    : -1;
  const cut = selectedIndex >= 0 ? Math.min(overflow, selectedIndex) : overflow;
  return {
    ...workbench,
    appliedFragments: appliedFragments.slice(cut),
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
