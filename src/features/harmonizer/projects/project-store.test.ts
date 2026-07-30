import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialWorkbenchState, workbenchReducer } from '../state/workbenchReducer';
import { getDefaultFixture } from '../fixtures/registry';
import {
  createProject,
  deleteProject,
  getActiveProject,
  readProjects,
  renameProject,
  saveWorkbench,
  setActiveProject,
  toPersistedWorkbench,
} from './project-store';

const workbench = toPersistedWorkbench(createInitialWorkbenchState(getDefaultFixture()));

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
  // Bust the module cache by writing/removing a differing raw value.
  window.localStorage.setItem('harmonizer.projects.v2', '');
  window.localStorage.removeItem('harmonizer.projects.v2');
});

describe('project store', () => {
  it('round-trips create → save → read and tracks the active project', () => {
    const project = createProject('My first hymn', workbench);
    expect(getActiveProject()?.id).toBe(project.id);
    expect(readProjects().projects).toHaveLength(1);

    const edited = { ...workbench, tempoBpm: 120 };
    expect(saveWorkbench(project.id, edited)).toBe('saved');
    expect(getActiveProject()?.workbench.tempoBpm).toBe(120);

    renameProject(project.id, 'Renamed');
    expect(getActiveProject()?.name).toBe('Renamed');
  });

  it('round-trips a mid-hymn save, seam and all', () => {
    // A snippet in the middle carries an `approach` on every candidate: the
    // previous chord plus the note each voice arrives from. This is the shape
    // that silently wiped projects when its schema was too strict.
    const initial = createInitialWorkbenchState(getDefaultFixture());
    const applied = workbenchReducer(initial, { type: 'APPLY_CANDIDATE', appliedId: 'ap1' });
    const midHymn = workbenchReducer(applied, {
      type: 'LOAD_SAMPLE',
      source: { kind: 'fixture', fixture: getDefaultFixture() },
      keepAcceptedContext: true,
    });
    expect(midHymn.candidates[0].approach?.voices.soprano).toBeTruthy();

    const project = createProject('Mid hymn', toPersistedWorkbench(midHymn));
    const restored = getActiveProject();
    expect(restored?.id).toBe(project.id);
    // v2 strips the re-derivable approach from candidates; the seam DATA
    // (previous voicing) persists on the accepted context and the approach is
    // re-stamped on load.
    expect(restored?.workbench.acceptedContext.previousVoicing).not.toBeNull();
    expect(restored?.workbench.appliedFragments).toHaveLength(1);
    expect(restored?.workbench.workingCandidate).not.toBeNull();
  });

  it('removes the retired v1 key on the first v2 write', () => {
    window.localStorage.setItem('harmonizer.projects.v1', '{"version":1,"projects":[]}');
    createProject('Fresh', workbench);
    expect(window.localStorage.getItem('harmonizer.projects.v1')).toBeNull();
    expect(window.localStorage.getItem('harmonizer.projects.v2')).not.toBeNull();
  });

  it('strips re-derivable analysis from saved candidates', () => {
    const project = createProject('Strip', workbench);
    const raw = window.localStorage.getItem('harmonizer.projects.v2')!;
    expect(raw).not.toContain('"harmonyEvents"');
    expect(raw).not.toContain('"melodyInterpretations"');
    expect(raw).not.toContain('"derivability"');
    expect(getActiveProject()?.id).toBe(project.id);
    expect(getActiveProject()?.workbench.workingCandidate?.voicing.soprano.length).toBeGreaterThan(
      0,
    );
  });

  it('recovers cleanly from corruption and version mismatches', () => {
    window.localStorage.setItem('harmonizer.projects.v2', '{not json');
    expect(readProjects()).toEqual({ version: 2, activeProjectId: null, projects: [] });
    window.localStorage.setItem(
      'harmonizer.projects.v2',
      JSON.stringify({ version: 1, activeProjectId: null, projects: [] }),
    );
    expect(readProjects().projects).toEqual([]);
  });

  it('delete falls back the active project; switching validates ids', () => {
    const first = createProject('One', workbench);
    const second = createProject('Two', workbench);
    expect(getActiveProject()?.id).toBe(second.id);
    setActiveProject(first.id);
    expect(getActiveProject()?.id).toBe(first.id);
    setActiveProject('nope');
    expect(getActiveProject()?.id).toBe(first.id);

    const afterDelete = deleteProject(first.id);
    expect(afterDelete.activeProjectId).toBe(second.id);
    expect(afterDelete.projects).toHaveLength(1);
  });

  it('reports quota failures as an error instead of throwing', () => {
    const project = createProject('Quota', workbench);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(saveWorkbench(project.id, workbench)).toBe('error');
  });

  it('caps stored projects', () => {
    for (let index = 0; index < 25; index += 1) {
      createProject(`P${index}`, workbench);
    }
    expect(readProjects().projects.length).toBeLessThanOrEqual(20);
  });
});
