'use client';

import { useProjects, type HarmonizerProject } from '../../projects/project-store';
import { ProjectMenu } from './ProjectMenu';
import { ProjectNameField } from './ProjectNameField';
import { SaveIndicatorDot, type SaveIndicator } from './SaveIndicatorDot';
import styles from './ProjectSwitcher.module.scss';

export type { SaveIndicator } from './SaveIndicatorDot';

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

  return (
    <div className={styles.switcher}>
      <ProjectNameField active={active} />
      <SaveIndicatorDot saveIndicator={saveIndicator} />
      <ProjectMenu
        envelope={envelope}
        active={active}
        onSwitch={onSwitch}
        onNew={onNew}
        onActiveDeleted={onActiveDeleted}
      />
    </div>
  );
}
