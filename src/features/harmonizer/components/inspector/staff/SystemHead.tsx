'use client';

import {
  ACCIDENTAL_GLYPHS,
  CLEF_GLYPHS,
  type StaffModel,
  type StaveId,
} from '../../../domain/notation';
import { GlyphMark } from './GlyphMark';
import { SPACE_PX, stepY } from './staff-geometry';
import styles from './StaffView.module.scss';

/** The line each clef names: the treble G on step 6, the bass F on step 2. */
const CLEF_STEP: Record<StaveId, number> = { treble: 6, bass: 2 };

/**
 * Clefs are drawn small, faded and tucked toward the top of their stave, where
 * they read as a label for the stave rather than as part of the music (Drew,
 * 2026-07-31). A full-size clef is the widest thing in the system and buys
 * nothing here — the reader already knows which stave is which — so shrinking
 * it hands most of its width back to the notes, where crowding actually hurts.
 */
const CLEF_SPACE_PX = SPACE_PX * 0.4;
/**
 * The treble label sits above its stave and the bass label below its own, which
 * clears the gap between them for the meter — the one piece of whitespace in
 * the system that was doing nothing.
 */
const CLEF_MARGIN_SPACES = 1.5;

const CLEF_X = 0.3;
const SIGNATURE_X = 1.5;
const SIGNATURE_STEP = 0.86;
/**
 * Only a hair of air between the opening and the first note. Small clefs and a
 * meter tucked into the gap leave the head narrow, and every pixel it gives up
 * goes to the music, where crowding is actually felt.
 */
const SIGNATURE_TAIL = 0.35;

/** How much room the clefs, signature and meter need, in pixels. */
export function headWidthPx(accidentalCount: number): number {
  return (SIGNATURE_X + accidentalCount * SIGNATURE_STEP + SIGNATURE_TAIL) * SPACE_PX;
}

/** Where a stave's clef label sits: above the treble, below the bass. */
function clefLabelY(stave: StaveId): number {
  return stave === 'treble'
    ? stepY('treble', 0) - CLEF_MARGIN_SPACES * SPACE_PX
    : stepY('bass', 8) + CLEF_MARGIN_SPACES * SPACE_PX;
}

/**
 * What opens the system: a clef and key signature on each stave, and the meter
 * once, sitting in the gap between the staves where it costs no width at all.
 * Decorative — every voice's name and every note's reading live elsewhere.
 */
export function SystemHead({ model }: { model: StaffModel }) {
  const accidentals = model.staves[0]?.keySignature.length ?? 0;
  const [beats, unit] = model.timeSignature.split('/');
  // Halfway between the treble's bottom line and the bass's top line.
  const meterY = (stepY('treble', 8) + stepY('bass', 0)) / 2;

  return (
    <span className={styles.head} style={{ width: headWidthPx(accidentals) }} aria-hidden="true">
      {model.staves.map((stave) => (
        <span key={stave.stave}>
          {/* Centred in the margin by its own box, so the clef's height never
              pushes it into the stave it labels. */}
          <span
            className={styles.clef}
            style={{ left: CLEF_X * SPACE_PX, top: clefLabelY(stave.stave) }}
          >
            <GlyphMark glyph={CLEF_GLYPHS[stave.stave]} spacePx={CLEF_SPACE_PX} />
          </span>
          {stave.keySignature.map((mark) => (
            <GlyphMark
              key={`${stave.stave}-${mark.index}`}
              glyph={ACCIDENTAL_GLYPHS[mark.accidental]!}
              spacePx={SPACE_PX}
              at={{
                x: (SIGNATURE_X + mark.index * SIGNATURE_STEP) * SPACE_PX,
                y: stepY(stave.stave, mark.step),
              }}
            />
          ))}
        </span>
      ))}

      <span className={styles.meter} style={{ left: CLEF_X * SPACE_PX, top: meterY }}>
        <span>{beats}</span>
        <span>{unit}</span>
      </span>
    </span>
  );
}
