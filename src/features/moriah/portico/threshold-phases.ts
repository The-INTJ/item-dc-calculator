/**
 * The home page's entrance, as a function of scroll.
 *
 * `progress` runs 0 → 1 while the porch stage is pinned. Each phase eases in
 * over its own window so nothing starts or stops abruptly:
 *
 *   rest   0.00–0.04  the facade, still
 *   open   0.04–0.40  the doors swing in on their hinges
 *   zoom   0.22–0.86  the reader walks up the steps and through the doorway
 *   flood  0.62–0.86  the light inside fills the view
 *   words  0.80–0.95  the pastor's prayer, in that light
 *
 * The windows overlap on purpose — the doors are still opening as the walk
 * begins, the way you would approach a door someone has opened for you.
 */

export interface ThresholdPhases {
  /** 0 closed → 1 fully open. */
  open: number;
  /** 0 at the foot of the steps → 1 through the doorway; applied geometrically to scale. */
  zoom: number;
  flood: number;
  words: number;
}

/** Smoothstep from `from` to `to`, clamped. */
export function ramp(from: number, to: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

export function thresholdPhases(progress: number): ThresholdPhases {
  return {
    open: ramp(0.04, 0.4, progress),
    zoom: ramp(0.22, 0.86, progress),
    flood: ramp(0.62, 0.86, progress),
    words: ramp(0.8, 0.95, progress),
  };
}

/** Where to glide to when the door itself is clicked: the prayer, fully lit. */
export const ENTERED_PROGRESS = 0.965;

/**
 * Pinned-stage progress from layout numbers: how far the section has risen
 * past the point where the stage pins, over how far it can travel pinned.
 */
export function stageProgress(sectionTop: number, pinTop: number, travel: number): number {
  if (travel <= 0) return 0;
  return Math.min(1, Math.max(0, (pinTop - sectionTop) / travel));
}
