'use client';

import { useState } from 'react';
import { content } from '../../content';
import {
  deleteProject,
  renameProject,
  setActiveProject,
  useProjects,
  type HarmonizerProject,
} from '../../projects/project-store';
import { classes } from '../shared/format';
import { PopoverMenu, PopoverMenuItem } from '../shared/PopoverMenu';
import styles from './ProjectSwitcher.module.scss';

export type SaveIndicator = 'saving' | 'saved' | 'error' | null;

interface ProjectSwitcherProps {
  saveIndicator: SaveIndicator;
  /** Switch to another project (root flushes the current save first). */
  onSwitch: (project: HarmonizerProject) => void;
  /** Create a fresh project (root flushes, creates, loads). */
  onNew: () => void;
  /** After deleting the ACTIVE project: load the fallback (no flush!). */
  onActiveDeleted: (next: HarmonizerProject | null) => void;
}

export function ProjectSwitcher({
  saveIndicator,
  onSwitch,
  onNew,
  onActiveDeleted,
}: ProjectSwitcherProps) {
  const envelope = useProjects();
  const active =
    envelope.projects.find((project) => project.id === envelope.activeProjectId) ?? null;
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function commitRename() {
    if (active && draft.trim()) renameProject(active.id, draft);
    setRenaming(false);
  }

  return (
    <div className={styles.switcher}>
      {renaming && active ? (
        <input
          className={styles.nameInput}
          value={draft}
          autoFocus
          aria-label={content.projects.renameHint}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitRename}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commitRename();
            if (event.key === 'Escape') setRenaming(false);
          }}
        />
      ) : (
        <button
          type="button"
          className={styles.name}
          title={content.projects.renameHint}
          onClick={() => {
            if (!active) return;
            setDraft(active.name);
            setRenaming(true);
          }}
        >
          {active?.name ?? content.projects.untitled}
        </button>
      )}
      <span
        className={classes(
          styles.saveDot,
          saveIndicator === 'saved' && styles.saveDotSaved,
          saveIndicator === 'error' && styles.saveDotError,
        )}
        title={
          saveIndicator === 'error'
            ? content.projects.error
            : saveIndicator === 'saving'
              ? content.projects.saving
              : content.projects.saved
        }
        aria-label={
          saveIndicator === 'error'
            ? content.projects.error
            : saveIndicator === 'saving'
              ? content.projects.saving
              : content.projects.saved
        }
      />
      <PopoverMenu
        triggerLabel="▾"
        triggerClassName={styles.menuTrigger}
        heading={content.projects.menuHeading}
        align="right"
      >
        {(close) => (
          <>
            {envelope.projects.map((project) => (
              <PopoverMenuItem
                key={project.id}
                active={project.id === envelope.activeProjectId}
                onSelect={() => {
                  close();
                  setConfirmingDelete(false);
                  if (project.id !== envelope.activeProjectId) onSwitch(project);
                }}
              >
                {project.name}
              </PopoverMenuItem>
            ))}
            <PopoverMenuItem
              onSelect={() => {
                close();
                setConfirmingDelete(false);
                onNew();
              }}
            >
              {content.projects.newProject}
            </PopoverMenuItem>
            {active ? (
              confirmingDelete ? (
                <PopoverMenuItem
                  onSelect={() => {
                    close();
                    setConfirmingDelete(false);
                    const next = deleteProject(active.id);
                    const fallback =
                      next.projects.find((project) => project.id === next.activeProjectId) ??
                      null;
                    if (fallback) setActiveProject(fallback.id);
                    onActiveDeleted(fallback);
                  }}
                >
                  {content.projects.confirmDelete}
                </PopoverMenuItem>
              ) : (
                <PopoverMenuItem onSelect={() => setConfirmingDelete(true)}>
                  {content.projects.deleteProject}
                </PopoverMenuItem>
              )
            ) : null}
          </>
        )}
      </PopoverMenu>
    </div>
  );
}
