'use client';

import { useState } from 'react';
import { content } from '../../content';
import {
  deleteProject,
  setActiveProject,
  type HarmonizerProject,
  type ProjectEnvelope,
} from '../../projects/project-store';
import { Icon } from '../shared/Icon';
import { PopoverMenu, PopoverMenuItem } from '../shared/PopoverMenu';
import styles from './ProjectSwitcher.module.scss';

interface ProjectMenuProps {
  envelope: ProjectEnvelope;
  active: HarmonizerProject | null;
  onSwitch: (project: HarmonizerProject) => void;
  onNew: () => void;
  onActiveDeleted: (next: HarmonizerProject | null) => void;
}

/**
 * Switch, create, delete. Delete asks twice in place — the second press of the
 * same item confirms — so losing a project takes a deliberate second action
 * without a modal interrupting the header.
 */
export function ProjectMenu({
  envelope,
  active,
  onSwitch,
  onNew,
  onActiveDeleted,
}: ProjectMenuProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function removeActive(close: () => void) {
    if (!active) return;
    close();
    setConfirmingDelete(false);
    const next = deleteProject(active.id);
    const fallback =
      next.projects.find((project) => project.id === next.activeProjectId) ?? null;
    if (fallback) setActiveProject(fallback.id);
    onActiveDeleted(fallback);
  }

  return (
    <PopoverMenu
      triggerLabel={<Icon name="expand_more" />}
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
              <PopoverMenuItem onSelect={() => removeActive(close)}>
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
  );
}
