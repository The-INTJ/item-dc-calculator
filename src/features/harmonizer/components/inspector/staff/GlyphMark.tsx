'use client';

import {
  bravuraGlyphs,
  FONT_UNITS_PER_SPACE,
  type BravuraGlyphId,
} from '../../../domain/notation';

interface GlyphMarkProps {
  glyph: BravuraGlyphId;
  /** One staff space in pixels — the single scale every staff measurement derives from. */
  spacePx: number;
  /**
   * Where the glyph's own origin should land inside a positioned parent. A
   * notehead's origin is its left edge at the vertical centre of the head, and a
   * clef's is the line it names, so callers position by musical meaning rather
   * than by bounding box. Omit to let the mark flow inline.
   *
   * `x` may be any CSS length, because horizontal position is a percentage of
   * the measure: the staff stretches with the same fluid grid the lanes use.
   * `y` is always pixels — a staff never stretches vertically.
   */
  at?: { x: number | string; y: number };
  className?: string;
}

/**
 * One notation symbol, drawn at a fixed size.
 *
 * Every glyph gets its own SVG sized to its own bounding box rather than sharing
 * one stretched canvas: the staff's width tracks a fluid grid, and a viewBox
 * stretched to match would squash round noteheads into ellipses. Sizing each
 * mark independently keeps the outlines exact at any staff width.
 */
export function GlyphMark({ glyph, spacePx, at, className }: GlyphMarkProps) {
  const { box, path } = bravuraGlyphs[glyph];
  const units = FONT_UNITS_PER_SPACE;
  // Bravura draws with y pointing up; SVG counts y downward. Flipping the
  // outline and pinning the viewBox to the glyph's own box keeps the origin at
  // a known offset, which is what `at` positions against.
  const viewBox = [
    box.x * units,
    -(box.y + box.h) * units,
    box.w * units,
    box.h * units,
  ].join(' ');
  const originShift = box.x * spacePx;
  const placement = at
    ? {
        position: 'absolute' as const,
        left:
          typeof at.x === 'number' ? at.x + originShift : `calc(${at.x} + ${originShift}px)`,
        top: at.y - (box.y + box.h) * spacePx,
      }
    : undefined;

  return (
    <svg
      className={className}
      style={placement}
      width={box.w * spacePx}
      height={box.h * spacePx}
      viewBox={viewBox}
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} transform="scale(1,-1)" fill="currentColor" />
    </svg>
  );
}
