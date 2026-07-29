import { content } from '../content';
import styles from './HarmonizationWorkbench.module.scss';

export function WorkbenchHeader() {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{content.header.title}</h1>
      <div className={styles.headerActions}>
        <button type="button" className={styles.headerButton} disabled title={content.comingSoon}>
          {content.header.undo}
        </button>
        <button type="button" className={styles.headerButton} disabled title={content.comingSoon}>
          {content.header.redo}
        </button>
        <button type="button" className={styles.headerButton} disabled title={content.comingSoon}>
          {content.header.help}
        </button>
      </div>
    </header>
  );
}
