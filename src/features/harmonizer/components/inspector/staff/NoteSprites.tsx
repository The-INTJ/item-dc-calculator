'use client';

import {
  REST_GLYPHS,
  tieSideForVoice,
  type NoteSymbol,
  type StaffStave,
} from '../../../domain/notation';
import type { VoiceId } from '../../../domain/music-types';
import { GlyphMark } from './GlyphMark';
import { NoteSprite } from './NoteSprite';
import { StaffHits } from './StaffHits';
import { HEAD_WIDTH_PX, shiftX, SPACE_PX, stepY, unitX } from './staff-geometry';
import styles from './StaffView.module.scss';

interface NoteSpritesProps {
  stave: StaffStave;
  gridUnits: number;
  selectedEventId?: string | null;
  /** Absent when the staff is a picture rather than an editing surface. */
  onSelect?: (voice: VoiceId, eventId: string) => void;
}

interface TiePair {
  note: NoteSymbol;
  next: NoteSymbol;
}

/**
 * A tie runs from the note it leaves to the note it reaches, and is the one mark
 * here that stretches: ties are elastic in engraving too, so a long one simply
 * arcs further. It bulges away from the stem, which keeps the two voices sharing
 * a stave from tangling.
 */
function TieArc({ note, next, gridUnits }: TiePair & { gridUnits: number }) {
  const from = shiftX(unitX(note.startUnit, gridUnits), HEAD_WIDTH_PX * 0.5);
  const to = shiftX(unitX(next.startUnit, gridUnits), HEAD_WIDTH_PX * 0.5);
  const over = tieSideForVoice(note.voice) === 'over';
  const y = stepY(note.stave, note.step) + (over ? -SPACE_PX * 0.75 : SPACE_PX * 0.75);

  return (
    <svg
      className={styles.tie}
      style={{
        left: from,
        top: y - SPACE_PX * 0.4,
        width: `calc(${to} - ${from})`,
        height: SPACE_PX * 0.8,
      }}
      viewBox="0 0 100 20"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={over ? 'M2 18 Q50 0 98 18' : 'M2 2 Q50 20 98 2'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Pairs each held note with the one it is tied into. */
function tiePairs(notes: NoteSymbol[]): TiePair[] {
  const pairs: TiePair[] = [];
  for (const note of notes) {
    if (!note.tieToNext) continue;
    const next = notes.find(
      (other) => other.eventId === note.eventId && other.startUnit === note.startUnit + note.units,
    );
    if (next) pairs.push({ note, next });
  }
  return pairs;
}

/**
 * Every mark one stave carries, in two layers.
 *
 * The drawing is decorative and hidden from assistive tech — a screen reader
 * gains nothing from a notehead's outline. The reachable layer above it is one
 * button per note, and exists only when the staff has been granted editing.
 * Keeping them apart is what lets the picture stay a picture.
 */
export function NoteSprites({
  stave,
  gridUnits,
  selectedEventId = null,
  onSelect,
}: NoteSpritesProps) {
  return (
    <>
      <span className={styles.sprites} aria-hidden="true">
        {stave.rests.map((rest) => (
          <GlyphMark
            key={rest.id}
            glyph={REST_GLYPHS[rest.base]}
            spacePx={SPACE_PX}
            at={{
              x: shiftX(unitX(rest.startUnit, gridUnits), HEAD_WIDTH_PX * 0.3),
              y: stepY(rest.stave, rest.step),
            }}
          />
        ))}

        {tiePairs(stave.notes).map(({ note, next }) => (
          <TieArc key={`tie-${note.id}`} note={note} next={next} gridUnits={gridUnits} />
        ))}

        {stave.notes.map((note) => (
          <NoteSprite
            key={note.id}
            note={note}
            x={unitX(note.startUnit, gridUnits)}
            selected={note.eventId === selectedEventId}
          />
        ))}
      </span>

      {onSelect ? (
        <StaffHits
          stave={stave}
          gridUnits={gridUnits}
          selectedEventId={selectedEventId}
          onSelect={onSelect}
        />
      ) : null}
    </>
  );
}
