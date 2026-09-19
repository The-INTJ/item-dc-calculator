import { lastCare } from '../lib/careHistory';
import { zoneAdvice } from '../lib/lawnCare';
import { wateringAmount } from '../lib/watering';
import { describeCondition, describeSun } from '../lib/yard';
import type { CareEvent, GrassProfile, WateringPlan, YardSegment } from '../lib/types';
import { CareActions } from './care';
import styles from './GrassManagerView.module.scss';

interface Props {
  segment: YardSegment; plan: WateringPlan | null; profile: GrassProfile; events: CareEvent[]; today: string;
  onChange: (segment: YardSegment, patch: Partial<Pick<YardSegment, 'sun' | 'condition'>>) => void;
  onAdd: (event: Omit<CareEvent, 'id'>) => void; onClose: () => void;
}

export function ZoneDetails({ segment, plan, profile, events, today, onChange, onAdd, onClose }: Props) {
  const lastWatered = lastCare(events, 'watered', segment.id, today);
  const lastTreatment = lastCare(events, 'weed-control', segment.id, today);
  const advice = zoneAdvice(profile, segment);
  return (
    <section className={styles.zoneDetails} aria-label={`${segment.name} details`}>
      <header className={styles.cardHeading}><h3>{segment.name}</h3><button type="button" onClick={onClose} className={styles.textButton}>Close area</button></header>
      <div className={styles.zoneGrid}>
        <div><strong>{plan?.label ?? 'Choose a location for a watering plan'}</strong>{plan && <p>{plan.reason}</p>}
          {lastWatered && <small>Last watered {lastWatered.at}{lastWatered.segmentId === 'whole-yard' ? ' · whole yard' : ''}</small>}
          {plan?.status === 'water-now' && <p>{wateringAmount(profile, segment)}</p>}
        </div>
        <div><p>{advice}</p>{segment.slope !== 'flat' && advice !== segment.note && <p>{segment.note}</p>}
          {lastTreatment && <small>Weed treatment {lastTreatment.at}: check its label before repeating.</small>}
        </div>
        <div className={styles.formPair}>
          <label className={styles.field}>Sun coverage<select value={segment.sun} onChange={(event) => onChange(segment, { sun: event.target.value as YardSegment['sun'] })}>
            {(['unknown', 'full-sun', 'part-sun', 'shade'] as const).map((sun) => <option key={sun} value={sun}>{describeSun(sun)}</option>)}
          </select></label>
          <label className={styles.field}>Condition<select value={segment.condition} onChange={(event) => onChange(segment, { condition: event.target.value as YardSegment['condition'] })}>
            {(['unknown', 'strong', 'thin', 'weedy', 'bare'] as const).map((condition) => <option key={condition} value={condition}>{describeCondition(condition)}</option>)}
          </select></label>
        </div>
      </div>
      <CareActions key={segment.id} scope={segment.id} profile={profile} today={today} onAdd={onAdd} />
    </section>
  );
}
