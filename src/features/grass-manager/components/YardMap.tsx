import { describeCondition, describeSlope, describeSun, YARD_SEGMENTS } from '../lib/yard';
import type { YardSegment } from '../lib/types';
import styles from './GrassManagerView.module.scss';

interface YardMapProps {
  selectedId: string;
  onChoose: (id: string) => void;
  selectedSegment: YardSegment;
}

export function YardMap({ selectedId, onChoose, selectedSegment }: YardMapProps) {
  return (
    <section className={styles.mapCard}>
      <div className={styles.cardHeading}>
        <div><span className={styles.eyebrow}>Your yard model</span><h2>Click a zone to make the plan local</h2></div>
        <span className={styles.mapKey}>5 zones</span>
      </div>
      <p className={styles.sectionIntro}>A rough working map is enough to turn uneven sun, the treeline, and the hill into different care decisions.</p>
      <div className={styles.yardMap} role="group" aria-label="Clickable yard zones">
        <div className={styles.treeLine} aria-hidden="true">TREELINE · SHADE</div>
        {YARD_SEGMENTS.map((segment) => (
          <button
            type="button"
            key={segment.id}
            className={styles.zone}
            data-segment-id={segment.id}
            data-selected={selectedId === segment.id}
            onClick={() => onChoose(segment.id)}
            aria-pressed={selectedId === segment.id}
          >
            <span>{segment.shortName}</span>
            <small>{describeCondition(segment.condition)}</small>
          </button>
        ))}
        <div className={styles.house} aria-label="House footprint"><span>HOUSE</span></div>
      </div>
      <div className={styles.zoneDetails}>
        <div className={styles.zoneDetailTitle}><span className={styles.zoneDot} data-condition={selectedSegment.condition} /><h3>{selectedSegment.name}</h3></div>
        <div className={styles.zoneTags}><span>{describeSun(selectedSegment.sun)}</span><span>{describeSlope(selectedSegment.slope)}</span><span>{describeCondition(selectedSegment.condition)}</span></div>
        <p>{selectedSegment.note}</p>
      </div>
    </section>
  );
}
