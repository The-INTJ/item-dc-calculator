import type { YardSegment } from '../lib/types';
import styles from './GrassManagerView.module.scss';

interface Props { segments: YardSegment[]; selectedId: string; onChoose: (id: string) => void }

export function YardMap({ segments, selectedId, onChoose }: Props) {
  return (
    <div className={styles.yardMap} role="group" aria-label="Clickable yard areas">
      <div className={styles.treeLine} aria-hidden="true"><span>Treeline · shade</span></div>
      {segments.map((segment) => (
        <button type="button" key={segment.id} className={styles.zone} data-area={segment.area}
          data-segment-id={segment.id} data-condition={segment.condition}
          aria-pressed={selectedId === segment.id} onClick={() => onChoose(segment.id)}>
          <span>{segment.shortName}</span>
        </button>
      ))}
      <div className={styles.house} aria-hidden="true"><span>House</span></div>
    </div>
  );
}
