/**
 * Marked-text parser. Grammar (no nesting, no escapes):
 *   `[term-id]`            → term segment displaying the glossary display form
 *   `[Display text|term-id]` → term segment displaying the custom text
 * Unknown ids degrade to plain text (the display text or the raw id), with a
 * one-time dev warning per id so authored typos surface without crashing prose.
 */

import { glossaryTerms, isTermId } from '../glossary';

export type MarkedSegment =
  | { kind: 'text'; text: string }
  | { kind: 'term'; termId: string; display: string };

const TOKEN = /\[([^[\]]+)\]/g;

const warnedUnknownIds = new Set<string>();

function warnUnknownId(termId: string): void {
  if (process.env.NODE_ENV === 'production') return;
  if (warnedUnknownIds.has(termId)) return;
  warnedUnknownIds.add(termId);
  console.warn(`[harmonizer] Unknown glossary term id "${termId}" in marked text.`);
}

export function parseMarkedText(text: string): MarkedSegment[] {
  const segments: MarkedSegment[] = [];
  let cursor = 0;
  TOKEN.lastIndex = 0;
  for (let match = TOKEN.exec(text); match !== null; match = TOKEN.exec(text)) {
    if (match.index > cursor) {
      segments.push({ kind: 'text', text: text.slice(cursor, match.index) });
    }
    const body = match[1];
    const pipe = body.lastIndexOf('|');
    const termId = pipe >= 0 ? body.slice(pipe + 1) : body;
    const customDisplay = pipe >= 0 ? body.slice(0, pipe) : null;
    if (isTermId(termId)) {
      segments.push({
        kind: 'term',
        termId,
        display: customDisplay ?? glossaryTerms[termId].display,
      });
    } else {
      warnUnknownId(termId);
      segments.push({ kind: 'text', text: customDisplay ?? termId });
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) {
    segments.push({ kind: 'text', text: text.slice(cursor) });
  }
  return segments;
}

/** The plain-text rendering of marked text — for attribute strings (e.g. title). */
export function plainTextFromMarked(text: string): string {
  return parseMarkedText(text)
    .map((segment) => (segment.kind === 'text' ? segment.text : segment.display))
    .join('');
}
