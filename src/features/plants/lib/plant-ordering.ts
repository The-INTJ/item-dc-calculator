import { computePlantStats, urgencyRank } from './stats';
import type { Plant } from './types';

/**
 * Thirstiest first. Within the same urgency the one left longest comes first,
 * so the list reads as a work queue rather than an inventory. A plant that has
 * never been watered sorts as -1 days, behind any plant with a real reading.
 */
export function rankPlantsByUrgency(plants: Plant[], now: number): Plant[] {
  return [...plants].sort((a, b) => {
    const statsA = computePlantStats(a, now);
    const statsB = computePlantStats(b, now);
    const byUrgency = urgencyRank(statsA.wateringStatus) - urgencyRank(statsB.wateringStatus);
    if (byUrgency !== 0) {
      return byUrgency;
    }
    return (statsB.daysSinceWatered ?? -1) - (statsA.daysSinceWatered ?? -1);
  });
}
