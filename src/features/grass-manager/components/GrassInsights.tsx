import type { GrassInsights as GrassInsightsModel, YardSegment } from '../lib/types';
import styles from './GrassManagerView.module.scss';

interface GrassInsightsProps {
  insights: GrassInsightsModel;
  segment: YardSegment;
}

export function GrassInsights({ insights, segment }: GrassInsightsProps) {
  return (
    <section className={styles.insightCard}>
      <div className={styles.cardHeading}><div><span className={styles.eyebrow}>What to do next</span><h2>{insights.headline}</h2></div><span className={styles.insightSpark}>✦</span></div>
      <div className={styles.insightGrid}>
        <article><span className={styles.insightLabel}>Multiply the good</span><p>{insights.propagation}</p></article>
        <article><span className={styles.insightLabel}>Weed plan</span><p>{insights.weedPlan}</p></article>
        <article><span className={styles.insightLabel}>Water this shape</span><p>{insights.sprinklerPlan}</p></article>
      </div>
      <ul className={styles.actionList}>{insights.actions.map((action) => <li key={action}>{action}</li>)}</ul>
      <p className={styles.insightFooter}>Selected zone: <strong>{segment.name}</strong>. These are decision aids, not a substitute for product labels or a local soil test.</p>
    </section>
  );
}
