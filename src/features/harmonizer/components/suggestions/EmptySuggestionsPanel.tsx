import { content } from '../../content';
import styles from './EmptySuggestionsPanel.module.scss';

interface EmptySuggestionsPanelProps {
  onRestoreSample: () => void;
  onChooseSample?: () => void;
}

/** Spec §11.5 — the honest no-content state (rare now that skeletons exist). */
export function EmptySuggestionsPanel({
  onRestoreSample,
  onChooseSample,
}: EmptySuggestionsPanelProps) {
  return (
    <div className={styles.panel}>
      <p className={styles.message}>{content.emptyState.message}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.action} onClick={onRestoreSample}>
          {content.emptyState.restore}
        </button>
        {onChooseSample ? (
          <button type="button" className={styles.action} onClick={onChooseSample}>
            {content.emptyState.choose}
          </button>
        ) : null}
      </div>
    </div>
  );
}
