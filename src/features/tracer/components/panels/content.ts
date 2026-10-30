/**
 * How to play, written for one rule set — short enough to read on a phone
 * between moves. The full spec lives in src/features/tracer/README.md.
 */

import { chartLimit, dodgeLimit, hasChartLimit, kingDeclares, landsAnywhere, tracedOnly, type RuleSet } from '../../engine';
import { countWord, stepCompanions } from '../../lib/presentation/ruleText';

export interface RuleSection {
  title: string;
  points: string[];
}

/** The step limits the layout's Tracers start with, smallest first ("3, 5 or 8"). */
function limitsInPlay(rules: RuleSet): string | null {
  const tracers = rules.layout.pieces.filter((p) => p.kind === 'tracer' && hasChartLimit(rules, p));
  const limits = [...new Set(tracers.map((p) => chartLimit(rules, p)))].sort((a, b) => a - b);
  if (limits.length === 0) return null;
  return limits.length === 1 ? String(limits[0]) : `${limits.slice(0, -1).join(', ')} or ${limits[limits.length - 1]}`;
}

const KING_SOURCE: Record<RuleSet['kingMemory'], string> = {
  none: '',
  current: 'your king borrows each Tracer’s current pattern',
  'current-kept': 'your king borrows each Tracer’s current pattern',
  'every-chart': 'your king learns every pattern your Tracers chart',
};

const KING_POINTS: Record<RuleSet['kingMemory'], string[]> = {
  none: ['The king never borrows patterns: it steps one square at a time.'],
  current: [
    'The king borrows one pattern from each of its Tracers: whatever that Tracer charted last.',
    'If a Tracer is captured, its pattern is lost to the king.',
  ],
  'current-kept': [
    'The king borrows one pattern from each of its Tracers: whatever that Tracer charted last.',
    'If a Tracer is captured, its king keeps that Tracer’s last pattern for the rest of the game.',
  ],
  'every-chart': [
    'Every pattern your Tracers chart joins your king’s library for the rest of the game — even after the Tracer charts again or is captured.',
    'Rotations and mirror images of a pattern count as one.',
  ],
};

function pieces(rules: RuleSet, numbers: string | null): string[] {
  const tracer = numbers
    ? `Tracer (diamond, numbered ${numbers}): Strike with its current pattern, or Chart a new one of up to that many squares.`
    : 'Tracer (diamond): Strike with its current pattern, or Chart a new one of any length.';
  const start = rules.tracerStep
    ? 'It may instead step one square in any direction, never capturing. Tracers start unformed (dashed outline).'
    : 'Tracers start unformed (dashed outline), so their first move is a chart.';
  const king = rules.kingMemory === 'none' ? 'one step any direction.' : 'one step any direction, or a borrowed pattern.';
  return ['Warden (shield): one step any direction; always captures.', `${tracer} ${start}`, `King (crown): ${king}`];
}

function charting(rules: RuleSet, numbers: string | null): string[] {
  const length = numbers ? ', at most the Tracer’s number' : ', as long as you like';
  const stop = landsAnywhere(rules)
    ? ' Then choose where the Tracer stops: anywhere along the path, or where it started.'
    : ' The Tracer moves to the end of the path.';
  const replaces = rules.kingMemory === 'none' || rules.kingMemory === 'every-chart' ? '' : ', for the Tracer and for its king';
  const turns = tracedOnly(rules)
    ? 'A pattern works only exactly as traced — out from wherever its piece stands, never turned or mirrored. Both players see every route on the board.'
    : 'Patterns work in all 8 orientations — rotated and mirrored.';
  return [
    `Tap a chain of neighbouring squares (straight or diagonal)${length}. No square twice, never back to the start, and the last square must be empty — charting never captures.${stop}`,
    'If the path passes over any piece, the pattern is a Jumper: from then on it lands exactly on that start-to-finish offset, ignoring pieces in between.',
    'Otherwise it is a Rider: it walks the path and may stop on any square along it, but pieces block it (an enemy in the way can be captured).',
    `${turns} A new pattern replaces the Tracer’s old one${replaces}.`,
  ];
}

function kingPoints(rules: RuleSet): string[] {
  const declare = kingDeclares(rules) && rules.kingMemory !== 'none'
    ? ['The king never uses a borrowed route straight away: it spends a turn declaring one (the opponent sees it), then may move by it on any later turn, until it declares another.']
    : [];
  return [...KING_POINTS[rules.kingMemory], ...declare];
}

function turn(rules: RuleSet): string[] {
  const companions = stepCompanions(rules);
  const borrowed = kingDeclares(rules) ? 'a step, its declared route, or declaring a route' : 'a step, or one of its patterns';
  const kingMove = rules.kingMemory === 'none' ? 'one step' : borrowed;
  return [
    `Move one Tracer or Warden, or play the king (${kingMove}). A king turn is the whole turn.`,
    ...(companions
      ? [`With a ${companions} move you may also take one free king step — to an empty neighbouring square, no capture — before or after it.`]
      : []),
    'There is no check. Moving into danger is legal; the game warns you first.',
  ];
}

function dodgeDraw(rules: RuleSet): string[] {
  const dodges = dodgeLimit(rules);
  if (dodges === null || !stepCompanions(rules)) return [];
  const count = countWord(dodges).replace(/^./, (c) => c.toUpperCase());
  return rules.dodgeNeedsThreat
    ? [
        `${count} dodges in a row by one player, with no capture by anyone meanwhile, draws the game. A dodge is a free king step taken while your king is threatened; any other turn resets your count.`,
      ]
    : [`${count} free king steps in a row by one player, with no capture by anyone meanwhile, draws the game.`];
}

function ending(rules: RuleSet): string[] {
  const capture = rules.loneKingWins ? 'Capture the king, or capture the last piece beside it, and you win.' : 'Capture the king and you win.';
  return [capture, ...dodgeDraw(rules), 'You can resign or agree a draw at any time.'];
}

export function howToPlay(rules: RuleSet): RuleSection[] {
  const numbers = limitsInPlay(rules);
  const source = KING_SOURCE[rules.kingMemory];
  const win = rules.loneKingWins ? ' — or by leaving the enemy with nothing but its king' : '';
  return [
    {
      title: 'The idea',
      points: [
        `Tracers learn their moves from the paths you draw${source ? `, and ${source}` : ''}.`,
        `Win by capturing the enemy king${win}.`,
      ],
    },
    { title: 'Pieces', points: pieces(rules, numbers) },
    { title: 'Charting', points: charting(rules, numbers) },
    { title: 'The king', points: kingPoints(rules) },
    { title: 'Your turn', points: turn(rules) },
    { title: 'Ending', points: ending(rules) },
  ];
}
