'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { content } from '../../../content';
import { headGlyph } from '../../../domain/notation';
import type { StemDirection } from '../../../domain/notation';
import type { TonalContext } from '../../../domain/music-types';
import { Icon } from '../../shared/Icon';
import { GlyphMark } from './GlyphMark';
import { buildGridCells, type GridCell, type GridNote } from './note-grid-cells';
import type { GridSide } from './useGridPlacement';
import styles from './NoteGrid.module.scss';

interface NoteGridProps {
  note: GridNote;
  tonalContext: TonalContext;
  stem: StemDirection;
  reach: number;
  side: GridSide;
  onChoose: (cell: GridCell) => void;
  onClose: () => void;
}

const CELL_SPACE_PX = 11;

function otherSide(side: GridSide): GridSide {
  return side === 'below' ? 'above' : 'below';
}

/**
 * The note chooser: length across, pitch up and down, the note you tapped in
 * the middle.
 *
 * It stays open after a choice and re-centres on whatever you picked, so a big
 * move is the same gesture repeated rather than a different one. Every cell
 * draws the note it would give you — the shape follows the new pitch's degree
 * and the head opens or fills with the new length — so the choice is read
 * rather than calculated.
 */
export function NoteGrid({
  note,
  tonalContext,
  stem,
  reach,
  side,
  onChoose,
  onClose,
}: NoteGridProps) {
  const rows = buildGridCells(tonalContext, note, reach);
  const panel = useRef<HTMLDivElement>(null);
  const centre = useRef<HTMLButtonElement>(null);
  const [flipped, setFlipped] = useState(false);

  /**
   * Focus follows the note, not the cell that was pressed. After a choice the
   * grid re-centres, so leaving focus on the pressed cell would leave the
   * keyboard pointing at a square that now means something else.
   */
  useEffect(() => {
    centre.current?.focus();
  }, [note.pitch.midi, note.units]);

  /**
   * The side was chosen from where the staff sits, which is a good guess and
   * only a guess — a short window, a tall grid or a staff near an edge can all
   * leave it hanging off. So the panel measures itself once it is on screen and
   * flips if it is genuinely overflowing and the other side genuinely has room.
   */
  useLayoutEffect(() => {
    setFlipped(false);
    const element = panel.current;
    if (!element || typeof window === 'undefined') return;
    const rect = element.getBoundingClientRect();
    const overflows = rect.top < 0 || rect.bottom > window.innerHeight;
    if (!overflows) return;
    const height = rect.height;
    const staff = element.parentElement?.getBoundingClientRect();
    if (!staff) return;
    const roomAbove = staff.top;
    const roomBelow = window.innerHeight - staff.bottom;
    const better = side === 'below' ? roomAbove : roomBelow;
    if (better >= height) setFlipped(true);
  }, [side, note.pitch.midi, note.units, reach]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (panel.current?.contains(target)) return;
      // A note's own button decides for itself: tapping the open note closes
      // the grid, tapping a different one moves to it. Closing here as well
      // would land the grid back open, because the staff would see no
      // selection by the time the click arrived.
      if (target.closest('[data-staff-system] button[data-event-id]')) return;
      onClose();
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [onClose]);

  return (
    <div
      className={styles.panel}
      data-side={flipped ? otherSide(side) : side}
      ref={panel}
      role="group"
      aria-label={content.noteGrid.label}
    >
      <button
        type="button"
        className={styles.close}
        aria-label={content.noteGrid.close}
        onClick={onClose}
      >
        <Icon name="close" />
      </button>

      <span className={styles.axisY} aria-hidden="true">
        {content.noteGrid.pitchAxis}
      </span>
      <span className={styles.axisX} aria-hidden="true">
        {content.noteGrid.lengthAxis}
      </span>

      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${reach * 2 + 1}, 2.6rem)` }}
      >
        {rows.map((row) =>
          row.map((cell) => (
            <button
              key={`${cell.x}:${cell.y}`}
              ref={cell.centre ? centre : undefined}
              type="button"
              className={styles.cell}
              data-centre={cell.centre || undefined}
              disabled={cell.value === null}
              aria-label={cellLabel(cell)}
              onClick={() => (cell.centre ? onClose() : onChoose(cell))}
            >
              {cell.shape && cell.base ? (
                <span className={styles.cellMark}>
                  <GlyphMark
                    glyph={headGlyph(cell.shape, cell.base, stem)}
                    spacePx={CELL_SPACE_PX}
                  />
                  {cell.dots > 0 ? <span className={styles.cellDot} /> : null}
                </span>
              ) : null}
            </button>
          )),
        )}
      </div>
    </div>
  );
}

/** Each cell says what it does, since its drawing is decorative. */
function cellLabel(cell: GridCell): string {
  if (cell.centre) return content.noteGrid.keep;
  if (!cell.value) return content.noteGrid.unavailable;
  const pitch = cell.y === 0 ? content.noteGrid.samePitch : pitchWord(cell.y);
  const length = cell.x === 0 ? content.noteGrid.sameLength : lengthWord(cell.x);
  return `${pitch}, ${length}`;
}

function pitchWord(steps: number): string {
  const word = steps > 0 ? content.noteGrid.higher : content.noteGrid.lower;
  return `${Math.abs(steps)} ${word}`;
}

function lengthWord(steps: number): string {
  const word = steps > 0 ? content.noteGrid.longer : content.noteGrid.shorter;
  return `${Math.abs(steps)} ${word}`;
}
