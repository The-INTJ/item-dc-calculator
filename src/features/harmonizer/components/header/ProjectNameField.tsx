'use client';

import { useState } from 'react';
import { content } from '../../content';
import { renameProject, type HarmonizerProject } from '../../projects/project-store';
import styles from './ProjectSwitcher.module.scss';

interface ProjectNameFieldProps {
  active: HarmonizerProject | null;
}

/** The project name doubles as its rename control — click the title, type, Enter. */
export function ProjectNameField({ active }: ProjectNameFieldProps) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState('');

  function commitRename() {
    if (active && draft.trim()) renameProject(active.id, draft);
    setRenaming(false);
  }

  if (renaming && active) {
    return (
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
    );
  }

  return (
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
  );
}
