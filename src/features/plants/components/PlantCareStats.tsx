import { formatDaysAgo, formatInterval, formatVibe, trendLabel } from '../lib/format';
import type { PlantStats } from '../lib/types';
import styles from './PlantCard.module.scss';

interface PlantCareStatsProps {
  stats: PlantStats;
  now: number;
}

export function PlantCareStats({ stats, now }: PlantCareStatsProps) {
  const statCells: { label: string; value: string }[] = [
    { label: 'Last watered', value: formatDaysAgo(stats.lastWateredAt, now) },
    { label: 'Last nutrition', value: formatDaysAgo(stats.lastNutritionAt, now) },
    { label: 'Last replanted', value: formatDaysAgo(stats.lastReplantedAt, now) },
    { label: 'Latest vibe', value: formatVibe(stats.lastVibeRating) },
    { label: 'Avg. watering', value: formatInterval(stats.averageWateringIntervalDays) },
    { label: 'Last interval', value: formatInterval(stats.lastWateringIntervalDays) },
    { label: 'Watering trend', value: trendLabel(stats.wateringTrend) },
    { label: 'Waterings', value: String(stats.totalWaterings) },
    { label: 'Nutrition feeds', value: String(stats.totalNutritions) },
    { label: 'Replants', value: String(stats.totalReplants) },
    { label: 'Notes', value: String(stats.totalNotes) },
    { label: 'Vibe checks', value: String(stats.totalVibeChecks) },
  ];

  return (
    <section>
      <h3 className={styles.sectionLabel}>Care metrics</h3>
      <div className={styles.statGrid}>
        {statCells.map((cell) => (
          <div key={cell.label} className={styles.stat}>
            <span className={styles.statLabel}>{cell.label}</span>
            <span className={styles.statValue}>{cell.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
