'use client';

import { useEffect, useState, type Dispatch } from 'react';
import { content } from '../content';
import type { WorkbenchState } from '../domain/workbench-state';
import { getDefaultFixture } from '../fixtures/registry';
import {
  createProject,
  getActiveProject,
  readProjects,
  saveWorkbench,
  setActiveProject,
  toPersistedWorkbench,
  type HarmonizerProject,
} from '../projects/project-store';
import type { WorkbenchAction } from '../state/actions';
import { createInitialWorkbenchState } from '../state/workbenchReducer';
import type { SaveIndicator } from './header/ProjectSwitcher';
import type { WorkbenchPlayback } from './useWorkbenchPlayback';

function freshWorkbench() {
  return toPersistedWorkbench(createInitialWorkbenchState(getDefaultFixture()));
}

// Debounced autosave. Deps are the individual persisted field references so
// playback ticks and history churn never trigger a save.
function useAutosave(state: WorkbenchState, hydrated: boolean): SaveIndicator {
  const [saveIndicator, setSaveIndicator] = useState<SaveIndicator>(null);
  useEffect(() => {
    if (!hydrated) return;
    const activeId = readProjects().activeProjectId;
    if (!activeId) return;
    setSaveIndicator('saving');
    const timeout = window.setTimeout(() => {
      setSaveIndicator(saveWorkbench(activeId, toPersistedWorkbench(state)));
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [
    hydrated,
    state.tonalContext,
    state.phraseIntent,
    state.tempoBpm,
    state.acceptedContext,
    state.appliedFragments,
    state.fragment,
    state.boundaryConstraints,
    state.sourceFixtureId,
    // v2 persists only the WORKING reading — suggestion-card churn alone
    // still schedules a save only because candidates identity changes; the
    // selected candidate's identity is what the save actually captures.
    state.candidates,
    state.selectedCandidateId,
    state.locks,
    state.selectedMeasureId,
  ]);
  return saveIndicator;
}

/** Hydration from the active project, debounced autosave, and project switching. */
export function useProjectPersistence(
  state: WorkbenchState,
  dispatch: Dispatch<WorkbenchAction>,
  pb: WorkbenchPlayback,
) {
  const [hydrated, setHydrated] = useState(false);
  const saveIndicator = useAutosave(state, hydrated);
  const { dispatchStructural } = pb;

  // Post-mount hydration: SSR/first paint always renders the default fixture
  // (deterministic — zero hydration risk); the active project loads as an
  // explicit action once localStorage is readable. First visit auto-creates a
  // project (guarded so StrictMode's double effect can't create two).
  useEffect(() => {
    const active = getActiveProject();
    if (active) {
      dispatch({ type: 'LOAD_PROJECT', workbench: active.workbench });
    } else if (readProjects().projects.length === 0) {
      createProject(content.projects.untitled, toPersistedWorkbench(state));
    }
    pb.restoreStoredSound();
    setHydrated(true);
  }, []);

  function flushSave() {
    const activeId = readProjects().activeProjectId;
    if (hydrated && activeId) {
      saveWorkbench(activeId, toPersistedWorkbench(state));
    }
  }

  function switchProject(project: HarmonizerProject) {
    flushSave();
    setActiveProject(project.id);
    dispatchStructural({ type: 'LOAD_PROJECT', workbench: project.workbench });
  }

  function newProject() {
    flushSave();
    const fresh = freshWorkbench();
    createProject(content.projects.untitled, fresh);
    dispatchStructural({ type: 'LOAD_PROJECT', workbench: fresh });
  }

  function afterActiveDeleted(next: HarmonizerProject | null) {
    // No flush — the deleted project's state must not leak into the fallback.
    if (next) {
      dispatchStructural({ type: 'LOAD_PROJECT', workbench: next.workbench });
    } else {
      const fresh = freshWorkbench();
      createProject(content.projects.untitled, fresh);
      dispatchStructural({ type: 'LOAD_PROJECT', workbench: fresh });
    }
  }

  return {
    hydrated,
    switcherProps: {
      saveIndicator,
      onSwitch: switchProject,
      onNew: newProject,
      onActiveDeleted: afterActiveDeleted,
    },
  };
}
