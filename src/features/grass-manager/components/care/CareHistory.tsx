import type { CareEvent } from '../../lib/types';
import { eventLabel } from '../../lib/storage';
import { segmentName } from '../../lib/yard';
import styles from '../GrassManagerView.module.scss';

export function CareHistory({ events, onRemove }: { events: CareEvent[]; onRemove: (id: string) => void }) {
  if (!events.length) return null;
  return (
    <details className={styles.history}>
      <summary>Care history ({events.length})</summary>
      <div className={styles.historyList}>
        {[...events].sort((a, b) => b.at.localeCompare(a.at)).map((event) => (
          <div className={styles.logRow} key={event.id}>
            <div><strong>{eventLabel(event.type)} · {segmentName(event.segmentId)}</strong>
              <span>{event.at}{event.minutes ? ` · ${event.minutes} min / position` : ''}{event.product ? ` · ${event.product}` : ''}{event.note ? ` · ${event.note}` : ''}</span></div>
            <button type="button" onClick={() => onRemove(event.id)} aria-label={`Remove ${eventLabel(event.type)} entry for ${segmentName(event.segmentId)}`}>Remove</button>
          </div>
        ))}
      </div>
    </details>
  );
}
