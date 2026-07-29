import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialWorkbenchState } from '../state/workbenchReducer';
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
  window.localStorage.setItem('harmonizer.projects.v1', '');
  window.localStorage.removeItem('harmonizer.projects.v1');
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

  it('recovers cleanly from corruption and version mismatches', () => {
    window.localStorage.setItem('harmonizer.projects.v1', '{not json');
    expect(readProjects()).toEqual({ version: 1, activeProjectId: null, projects: [] });
    window.localStorage.setItem(
      'harmonizer.projects.v1',
      JSON.stringify({ version: 2, activeProjectId: null, projects: [] }),
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
