/**
 * Helpers for the shared time-grid layout (see _time-grid.scss). Every
 * time-aligned lane renders on an identical CSS grid: one label track plus
 * `--wb-time-units` fractional tracks (1 unit = one sixteenth note).
 */

import type { CSSProperties } from 'react';
import type { TimelineSpan } from '../../domain/timing';

/** Inline CSS custom properties without `any` (CSSProperties lacks --* keys). */
export function cssVars(vars: Record<string, string | number>): CSSProperties {
  return vars as CSSProperties;
}

/** Grid placement for an event; +1 skips the label track. */
export function timeSpanStyle(span: TimelineSpan): CSSProperties {
  return { gridColumn: `${span.startUnit + 1} / span ${span.spanUnits}` };
}

/** Percentage offset of a boundary point over the time tracks (gap must be 0). */
export function boundaryLeftPercent(boundaryUnit: number, total: number): string {
  return `${(boundaryUnit / total) * 100}%`;
}

/** Whether the playback cursor is inside this span. */
export function isUnitActive(span: TimelineSpan, activeUnit: number | null): boolean {
  if (activeUnit === null) return false;
  return activeUnit >= span.startUnit && activeUnit < span.startUnit + span.spanUnits;
}
