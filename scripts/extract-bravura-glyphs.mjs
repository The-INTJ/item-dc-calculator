/**
 * Regenerates src/features/harmonizer/domain/notation/bravura-glyphs.ts.
 *
 * The harmonizer's staff view draws notation from embedded outlines rather than
 * loading a music font: it needs ~30 symbols, not 3000, and inline paths stay
 * token-colorable and SSR-safe. This script pulls those outlines from Bravura,
 * the SMuFL reference font (SIL Open Font License 1.1).
 *
 *   node scripts/extract-bravura-glyphs.mjs
 *
 * Sources are downloaded once into the OS temp dir and reused on later runs.
 * Paths are copied verbatim in font units (y up); bounding boxes come from the
 * font's own SMuFL metadata, converted from bBoxNE/bBoxSW pairs to x/y/w/h.
 */

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = join(
  REPO_ROOT,
  'src/features/harmonizer/domain/notation/bravura-glyphs.ts',
);
const CACHE_DIR = join(tmpdir(), 'bravura-source');
const BASE_URL = 'https://raw.githubusercontent.com/steinbergmedia/bravura/master/redist';
const SOURCES = {
  'Bravura.svg': `${BASE_URL}/svg/Bravura.svg`,
  'bravura_metadata.json': `${BASE_URL}/bravura_metadata.json`,
};

/**
 * Every glyph the staff view can draw, by SMuFL name and codepoint. The eight
 * notehead pairs are the seven Aikin shapes — fa needs both orientations
 * because its upright edge always sits on the stem side.
 */
const WANTED = [
  ['noteShapeRoundWhite', 0xe1b0], ['noteShapeRoundBlack', 0xe1b1],
  ['noteShapeSquareWhite', 0xe1b2], ['noteShapeSquareBlack', 0xe1b3],
  ['noteShapeTriangleRightWhite', 0xe1b4], ['noteShapeTriangleRightBlack', 0xe1b5],
  ['noteShapeTriangleLeftWhite', 0xe1b6], ['noteShapeTriangleLeftBlack', 0xe1b7],
  ['noteShapeDiamondWhite', 0xe1b8], ['noteShapeDiamondBlack', 0xe1b9],
  ['noteShapeTriangleUpWhite', 0xe1ba], ['noteShapeTriangleUpBlack', 0xe1bb],
  ['noteShapeMoonWhite', 0xe1bc], ['noteShapeMoonBlack', 0xe1bd],
  ['noteShapeTriangleRoundWhite', 0xe1be], ['noteShapeTriangleRoundBlack', 0xe1bf],
  ['gClef', 0xe050], ['fClef', 0xe062],
  ['restWhole', 0xe4e3], ['restHalf', 0xe4e4], ['restQuarter', 0xe4e5],
  ['rest8th', 0xe4e6], ['rest16th', 0xe4e7],
  ['flag8thUp', 0xe240], ['flag8thDown', 0xe241],
  ['flag16thUp', 0xe242], ['flag16thDown', 0xe243],
  ['augmentationDot', 0xe1e7],
  ['accidentalFlat', 0xe260], ['accidentalNatural', 0xe261], ['accidentalSharp', 0xe262],
  ['accidentalDoubleSharp', 0xe263], ['accidentalDoubleFlat', 0xe264],
];

async function source(name) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const cached = join(CACHE_DIR, name);
  if (!existsSync(cached)) {
    process.stdout.write(`fetching ${name}...\n`);
    const response = await fetch(SOURCES[name]);
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
    writeFileSync(cached, Buffer.from(await response.arrayBuffer()));
  }
  return readFileSync(cached, 'utf8');
}

/** Index the SVG font's outlines by codepoint, skipping multi-codepoint ligatures. */
function outlinesByCodepoint(svg) {
  const byCode = new Map();
  for (const element of svg.matchAll(/<glyph\b([\s\S]*?)\/>/g)) {
    const attributes = element[1];
    const unicode = /unicode="([^"]*)"/.exec(attributes);
    const outline = /\sd="([^"]*)"/.exec(attributes);
    if (!unicode || !outline) continue;
    const codes = [...unicode[1].matchAll(/&#x([0-9a-fA-F]+);/g)].map((c) => parseInt(c[1], 16));
    if (codes.length !== 1) continue;
    byCode.set(codes[0], outline[1].replace(/\s+/g, ' ').trim());
  }
  return byCode;
}

function fileText(rows, fontVersion) {
  const entries = rows
    .map(
      (row) =>
        `  ${row.name}: {\n` +
        `    box: { x: ${row.x}, y: ${row.y}, w: ${row.w}, h: ${row.h} },\n` +
        `    path:\n      '${row.path}',\n` +
        `  },`,
    )
    .join('\n');

  return `/**
 * Bravura glyph outlines — GENERATED DATA, do not hand-edit.
 * Regenerate with: node scripts/extract-bravura-glyphs.mjs
 *
 * Source: Bravura ${fontVersion} (the SMuFL reference font),
 * https://github.com/steinbergmedia/bravura — outlines from redist/svg/Bravura.svg,
 * bounding boxes from redist/bravura_metadata.json.
 *
 * Copyright (c) 2021, Steinberg Media Technologies GmbH (http://www.steinberg.net/),
 * with Reserved Font Name "Bravura". This Font Software is licensed under the SIL
 * Open Font License, Version 1.1 — http://scripts.sil.org/OFL
 *
 * These are embedded outlines, not a font: nothing is loaded at runtime and nothing
 * here is redistributed as font software.
 *
 * Coordinates: paths are in FONT UNITS with y pointing UP, exactly as Bravura ships
 * them. Boxes are in STAFF SPACES, also y up, relative to the glyph origin — which
 * for a notehead is its left edge at the vertical centre of the head. Renderers flip
 * y and scale by FONT_UNITS_PER_SPACE; see components/inspector/staff/GlyphMark.tsx.
 */

export interface BravuraGlyph {
  /** Bounding box in staff spaces, y up, relative to the glyph origin. */
  box: { x: number; y: number; w: number; h: number };
  /** Outline in font units, y up. */
  path: string;
}

/** SMuFL defines the em as four staff spaces; Bravura's em is 1000 units. */
export const FONT_UNITS_PER_SPACE = 250;

export const bravuraGlyphs = {
${entries}
} as const satisfies Record<string, BravuraGlyph>;

export type BravuraGlyphId = keyof typeof bravuraGlyphs;
`;
}

const [svg, metadataText] = await Promise.all([
  source('Bravura.svg'),
  source('bravura_metadata.json'),
]);
const metadata = JSON.parse(metadataText);
const outlines = outlinesByCodepoint(svg);

const rows = [];
const missing = [];
for (const [name, code] of WANTED) {
  const path = outlines.get(code);
  const box = metadata.glyphBBoxes?.[name];
  if (!path || !box) {
    missing.push(name);
    continue;
  }
  const [eastX, northY] = box.bBoxNE;
  const [westX, southY] = box.bBoxSW;
  const round = (value) => Number(value.toFixed(4));
  rows.push({
    name,
    path,
    x: round(westX),
    y: round(southY),
    w: round(eastX - westX),
    h: round(northY - southY),
  });
}

if (missing.length) {
  throw new Error(`Bravura is missing: ${missing.join(', ')}`);
}

writeFileSync(OUT_FILE, fileText(rows, metadata.fontVersion ?? 'unknown'));
process.stdout.write(`wrote ${rows.length} glyphs to ${OUT_FILE}\n`);
