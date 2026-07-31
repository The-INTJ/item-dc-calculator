'use client';

import type { PointerEvent as ReactPointerEvent } from 'react';
import { classes } from '../shared/format';
import { newId } from '../shared/ids';
import styles from './CandidateInspector.module.scss';

type ResizeDispatch = (
  eventId: string,
  edge: 'left' | 'right',
  targetBoundary: number,
  ripple: boolean,
  gestureId: string,
) => void;

/**
 * Edge drag: convert pointer x to a 0-based sixteenth boundary using the
 * lane's own grid geometry, dispatch on every snapped change. Audio-free and
 * stateless — the reducer owns clamping and neighbor semantics.
 */
function handleEdgePointerDown(
  pointerEvent: ReactPointerEvent<HTMLElement>,
  eventId: string,
  edge: 'left' | 'right',
  gridUnits: number,
  onResize: ResizeDispatch,
) {
  pointerEvent.preventDefault();
  pointerEvent.stopPropagation();
  const handle = pointerEvent.currentTarget;
  const grid = handle.closest('[data-lane-grid]');
  if (!(grid instanceof HTMLElement)) return;
  // Measure from the grid itself so the math holds in both layouts: on
  // mobile the in-grid label is hidden (zero width) and the lane label sits
  // above the track instead. The rect already includes any pan transform.
  const gridRect = grid.getBoundingClientRect();
  const label = grid.querySelector('[data-lane-label]');
  const labelWidth = label instanceof HTMLElement ? label.getBoundingClientRect().width : 0;
  const trackLeft = gridRect.left + labelWidth;
  const trackWidth = gridRect.right - trackLeft;
  if (trackWidth <= 0 || gridUnits <= 0) return;
  const unitWidth = trackWidth / gridUnits;
  const gestureId = newId(); // one undo entry per drag
  let lastBoundary: number | null = null;
  try {
    handle.setPointerCapture(pointerEvent.pointerId);
  } catch {
    // jsdom has no pointer capture; harmless.
  }
  const onMove = (moveEvent: PointerEvent) => {
    const boundary = Math.round((moveEvent.clientX - trackLeft) / unitWidth);
    if (boundary !== lastBoundary) {
      lastBoundary = boundary;
      onResize(eventId, edge, boundary, moveEvent.shiftKey, gestureId);
    }
  };
  const onEnd = () => {
    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup', onEnd);
    handle.removeEventListener('pointercancel', onEnd);
  };
  handle.addEventListener('pointermove', onMove);
  handle.addEventListener('pointerup', onEnd);
  handle.addEventListener('pointercancel', onEnd);
}

/**
 * One draggable bar per boundary: a note owns the bar on its right, and the
 * lane's opening bar belongs to the first note (dragging it opens a leading
 * rest).
 */
export function EdgeHandle({
  edge,
  eventId,
  gridUnits,
  onResize,
}: {
  edge: 'left' | 'right';
  eventId: string;
  /** Total grid units — needed to convert drag pixels to boundaries. */
  gridUnits: number;
  onResize: ResizeDispatch;
}) {
  return (
    <span
      className={classes(
        styles.edgeHandle,
        edge === 'left' ? styles.edgeHandleLeft : styles.edgeHandleRight,
      )}
      aria-hidden="true"
      onClick={(clickEvent) => clickEvent.stopPropagation()}
      onPointerDown={(downEvent) => handleEdgePointerDown(downEvent, eventId, edge, gridUnits, onResize)}
    />
  );
}
