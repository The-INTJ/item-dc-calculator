/**
 * Slider-panned note track (mobile only — CSS decides whether these values
 * apply). The time grid keeps its proportional percentage layout; we make the
 * track a multiple of its window width and shift it with a transform, so there
 * is never a scrollbar and the track cannot be swiped — the slider is the only
 * way to move it. Pure math, unit-tested without a DOM.
 */

/** How many notes the window shows before panning is offered. */
export const VISIBLE_NOTES = 4;

export function needsPan(noteCount: number): boolean {
  return noteCount > VISIBLE_NOTES;
}

/** Track width as a multiple of the visible window. 1 = no panning. */
export function trackScale(noteCount: number): number {
  return needsPan(noteCount) ? noteCount / VISIBLE_NOTES : 1;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Offset for a 0–1 pan, as a percentage of the VISIBLE WINDOW's width — the
 * base CSS uses for `left` on a relatively-positioned track. A scale-2 track
 * hides exactly one window's worth, so a full pan is -100%.
 */
export function panShiftPercent(pan: number, scale: number): string {
  if (scale <= 1) return '0%';
  const shift = -clamp01(pan) * (scale - 1) * 100;
  return `${Math.round(shift * 1000) / 1000}%`;
}

/** The pan that centers a 1-based timeline unit in the window. */
export function panForUnit(activeUnit: number, gridUnits: number, scale: number): number {
  if (scale <= 1 || gridUnits <= 0) return 0;
  const windowFraction = 1 / scale;
  const position = (activeUnit - 1) / gridUnits;
  return clamp01((position - windowFraction / 2) / (1 - windowFraction));
}
