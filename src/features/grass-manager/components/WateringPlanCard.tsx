import type { WateringPlan } from '../lib/types';
import styles from './GrassManagerView.module.scss';

interface WateringPlanCardProps {
  plan: WateringPlan | null;
  segmentName: string;
}

export function WateringPlanCard({ plan, segmentName }: WateringPlanCardProps) {
  if (!plan) {
    return <section className={styles.planCard} data-status="empty">
      <span className={styles.eyebrow}>Deterministic care call</span>
      <h2>Choose a weather location first.</h2>
      <p>The manager will explain the decision, not just show an icon: rain, heat, shade, slope, and your own care log all count.</p>
    </section>;
  }

  return (
    <section className={styles.planCard} data-status={plan.status}>
      <div className={styles.planTopline}><span className={styles.eyebrow}>For {segmentName}</span><span className={styles.planBadge}>{plan.label}</span></div>
      <h2>{plan.headline}</h2>
      <p className={styles.planDetail}>{plan.detail}</p>
      <div className={styles.timingCallout}><span>Best window</span><strong>{plan.timing}</strong></div>
      {plan.minutes > 0 && <div className={styles.minutesCallout}><strong>{plan.minutes} min</strong><span>starting point for this zone</span></div>}
      <ul className={styles.reasonList}>
        {plan.reasons.map((reason) => <li key={reason}>{reason}</li>)}
      </ul>
      <p className={styles.watchLine}><strong>Watch for:</strong> {plan.watchFor}</p>
    </section>
  );
}
