/**
 * The in-game rules, short enough to read on a phone between moves. The full
 * spec lives in src/features/tracer/README.md.
 */

export interface RuleSection {
  title: string;
  points: string[];
}

export const RULES: RuleSection[] = [
  {
    title: 'The idea',
    points: [
      'Tracers learn their moves from the paths you draw, and your king borrows each Tracer’s current pattern.',
      'Win by capturing the enemy king — or by leaving the enemy with nothing but its king.',
    ],
  },
  {
    title: 'Pieces',
    points: [
      'Warden (shield): one step any direction; always captures.',
      'Tracer (diamond, numbered 3, 5 or 8): Strike with its current pattern, or Chart a new one of up to that many squares. Tracers start unformed (dashed outline), so their first move is a chart.',
      'King (crown): one step any direction, or any pattern its Tracers lend it.',
    ],
  },
  {
    title: 'Charting',
    points: [
      'Tap a chain of neighbouring squares (straight or diagonal), at most the Tracer’s number. No square twice, never back to the start, and the last square must be empty — charting never captures.',
      'If the path passes over any piece, the pattern is a Jumper: from then on it lands exactly on that start-to-finish offset, ignoring pieces in between.',
      'Otherwise it is a Rider: it walks the path and may stop on any square along it, but pieces block it (an enemy in the way can be captured).',
      'Patterns work in all 8 orientations — rotated and mirrored. A new pattern replaces the Tracer’s old one, for the Tracer and for its king.',
    ],
  },
  {
    title: 'The king',
    points: [
      'The king borrows one pattern from each of its three Tracers: whatever that Tracer charted last.',
      'If a Tracer is captured, its king keeps that Tracer’s last pattern for the rest of the game.',
    ],
  },
  {
    title: 'Your turn',
    points: [
      'Either move one Tracer or Warden — plus, if you like, one free king step (to an empty neighbouring square, no capture) before or after it —',
      'or move the king (a step, or a borrowed pattern). A king move is the whole turn.',
      'There is no check. Moving into danger is legal; the game warns you first.',
    ],
  },
  {
    title: 'Ending',
    points: [
      'Capture the king, or capture the last piece beside it, and you win.',
      'Six free king steps in a row by one player, with no capture by anyone meanwhile, draws the game.',
      'You can resign or agree a draw at any time.',
    ],
  },
];
