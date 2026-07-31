'use client';

import {
  ACCIDENTAL_GLYPHS,
  AUGMENTATION_DOT,
  flagGlyph,
  headGlyph,
  type NoteSymbol,
} from '../../../domain/notation';
import { GlyphMark } from './GlyphMark';
import {
  dotStepFor,
  HEAD_WIDTH_PX,
  LEDGER_OVERHANG_PX,
  shiftX,
  SPACE_PX,
  STEM_LENGTH_PX,
  STEM_WIDTH_PX,
  stepY,
} from './staff-geometry';
import styles from './StaffView.module.scss';

interface NoteSpriteProps {
  note: NoteSymbol;
  /** Where the note's time slot begins, as a share of the measure's width. */
  x: string;
  selected?: boolean;
}

/**
 * One notehead and everything hanging off it — stem, flag, dot, ledger lines and
 * accidental. Each part is placed against the head's own left edge, so the whole
 * assembly moves together when a collision nudges the head aside.
 */
export function NoteSprite({ note, x, selected = false }: NoteSpriteProps) {
  if (!note.shape) return null;
  const left = shiftX(x, note.offsetHead ? HEAD_WIDTH_PX : 0);
  const y = stepY(note.stave, note.step);
  const up = note.stem === 'up';
  // A whole note carries no stem, so it takes no flag either.
  const stemmed = note.base !== 'w';
  const flag = stemmed ? flagGlyph(note.base, note.stem) : null;
  const stemX = up ? shiftX(left, HEAD_WIDTH_PX - STEM_WIDTH_PX) : left;
  const accidental = note.accidental ? ACCIDENTAL_GLYPHS[note.accidental] : null;

  return (
    <span
      className={styles.note}
      data-voice={note.voice}
      data-shape={note.shape}
      data-base={note.base}
      data-accidental={note.accidental ?? undefined}
      data-selected={selected || undefined}
    >
      {note.ledgerSteps.map((step) => (
        <span
          key={step}
          className={styles.ledger}
          style={{
            left: shiftX(left, -LEDGER_OVERHANG_PX),
            top: stepY(note.stave, step),
            width: HEAD_WIDTH_PX + LEDGER_OVERHANG_PX * 2,
          }}
        />
      ))}

      {stemmed ? (
        <span
          className={styles.stem}
          style={{
            left: stemX,
            top: up ? y - STEM_LENGTH_PX : y,
            width: STEM_WIDTH_PX,
            height: STEM_LENGTH_PX,
          }}
        />
      ) : null}

      {flag ? (
        <GlyphMark
          glyph={flag}
          spacePx={SPACE_PX}
          at={{ x: stemX, y: up ? y - STEM_LENGTH_PX : y + STEM_LENGTH_PX }}
        />
      ) : null}

      <GlyphMark
        glyph={headGlyph(note.shape, note.base, note.stem)}
        spacePx={SPACE_PX}
        at={{ x: left, y }}
      />

      {note.dots > 0 ? (
        <GlyphMark
          glyph={AUGMENTATION_DOT}
          spacePx={SPACE_PX}
          at={{
            x: shiftX(left, HEAD_WIDTH_PX * 1.2),
            y: stepY(note.stave, dotStepFor(note.step)),
          }}
        />
      ) : null}

      {accidental ? (
        <GlyphMark
          glyph={accidental}
          spacePx={SPACE_PX}
          at={{ x: shiftX(left, -HEAD_WIDTH_PX * 0.95), y }}
        />
      ) : null}
    </span>
  );
}
