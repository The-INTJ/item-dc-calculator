import type { ReactNode } from 'react';
import { content } from '../content';
import styles from './HarmonizationWorkbench.module.scss';

interface WorkbenchHeaderProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  projectSlot?: ReactNode;
}

export function WorkbenchHeader({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  projectSlot,
}: WorkbenchHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{content.header.title}</h1>
      {projectSlot}
      <div className={styles.headerActions}>
        <button
          type="button"
          className={styles.headerButton}
          disabled={!canUndo}
          onClick={onUndo}
        >
          {content.header.undo}
        </button>
        <button
          type="button"
          className={styles.headerButton}
          disabled={!canRedo}
          onClick={onRedo}
        >
          {content.header.redo}
        </button>
        <button
          type="button"
          className={styles.headerButtonOptional}
          disabled
          title={content.comingSoon}
        >
          {content.header.help}
        </button>
      </div>
    </header>
  );
}
