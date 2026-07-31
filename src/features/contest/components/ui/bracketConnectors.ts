import type { DisplayRound } from '@/contest/lib/presentation/displayModel';

export interface ConnectorPath {
  id: string;
  d: string;
  feedsActive: boolean;
}

/** Exported for unit tests — pure geometry over measured DOMRects. */
export function computeConnectorPaths(
  rounds: DisplayRound[],
  rects: Map<string, DOMRect>,
  canvasRect: DOMRect | null,
): ConnectorPath[] {
  if (!canvasRect) return [];
  const paths: ConnectorPath[] = [];

  for (let r = 1; r < rounds.length; r++) {
    const round = rounds[r];
    if (!round) continue;

    for (const matchup of round.matchups) {
      if (!matchup.sourceMatchups) continue;
      const targetKey = `${r}-${matchup.slotIndex}`;
      const targetRect = rects.get(targetKey);
      if (!targetRect) continue;

      const targetX = targetRect.left - canvasRect.left;
      const targetY = targetRect.top + targetRect.height / 2 - canvasRect.top;

      for (const feederIndex of matchup.sourceMatchups) {
        const feederKey = `${r - 1}-${feederIndex}`;
        const feederRect = rects.get(feederKey);
        if (!feederRect) continue;

        const feederX = feederRect.right - canvasRect.left;
        const feederY = feederRect.top + feederRect.height / 2 - canvasRect.top;
        const midX = feederX + (targetX - feederX) / 2;

        const d = `M ${feederX} ${feederY} H ${midX} V ${targetY} H ${targetX}`;
        paths.push({
          id: `${feederKey}->${targetKey}`,
          d,
          feedsActive: round.isActive,
        });
      }
    }
  }

  return paths;
}
