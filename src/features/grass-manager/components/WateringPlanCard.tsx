import type { WateringPlan } from '../lib/types';
import styles from './GrassManagerView.module.scss';

export function WateringPlanCard({ plan, isToday }: { plan: WateringPlan; isToday: boolean }) {
  return (
    <div className={styles.plan} data-status={plan.status} aria-live="polite">
      <h3>{isToday ? 'Today' : 'If the forecast holds'}<span>{plan.label}</span></h3>
      <p>{plan.reason}</p>
      {plan.timing && <small>{plan.timing} · yard local time</small>}
    </div>
  );
}
