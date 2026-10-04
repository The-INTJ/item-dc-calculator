/**
 * Words for the screen: titles, results, piece and pattern names. Shared by
 * the page metadata (link previews) and the UI.
 */

import { otherSide, parsePattern, patternKind, type ActionRecord, type PatternCode, type Side } from '../../engine';
import type { TracerGame } from '../types';
import { countWord, KIND_NAME } from './ruleText';

export const SIDE_NAME: Record<Side, string> = { w: 'White', b: 'Black' };

export function seatName(game: TracerGame, side: Side): string {
  const seat = game.seats[side];
  if (seat.uid) return seat.name ?? SIDE_NAME[side];
  return seat.name ? `Open seat (was ${seat.name})` : 'Open seat';
}

export function resultText(game: TracerGame): string {
  const result = game.state.result;
  if (result.status === 'active') return 'In progress';
  if (result.status === 'drawn') {
    if (result.reason === 'agreement') return 'Drawn by agreement';
    return `Drawn — ${countWord(game.state.rules.dodgeDraw)} dodges in a row`;
  }
  const winner = seatName(game, result.winner);
  switch (result.reason) {
    case 'king-capture':
      return `${winner} captured the king`;
    case 'lone-king':
      return `${winner} wins — only a lone king remains`;
    case 'resignation':
      return `${seatName(game, otherSide(result.winner))} resigned — ${winner} wins`;
  }
}

/** One line for link previews, tab titles and the recent-games list. */
export function gameTitle(game: TracerGame): string {
  if (game.status === 'open') return `${game.createdBy.name} challenged you to Tracer`;
  const players = `${seatName(game, 'w')} vs ${seatName(game, 'b')}`;
  return game.status === 'finished' ? `${players} — ${resultText(game)}` : players;
}

/** A plain-words description of one action, for the action bar. */
export function describeAction(action: ActionRecord): string {
  switch (action.kind) {
    case 'step':
      return `King steps ${action.from} → ${action.to}`;
    case 'chart':
      return `Tracer charts a ${patternKind(action.pattern) ?? 'rider'} ${action.from} → ${action.to}`;
    case 'pass':
      return 'Pass';
    default: {
      const verb = action.captured ? `takes the ${KIND_NAME[action.captured.kind]} on` : '→';
      const who = action.kind === 'warden' ? 'Warden' : action.kind === 'strike' ? 'Tracer' : 'King';
      return `${who} ${action.from} ${verb} ${action.to}`;
    }
  }
}

/** "Rider · 7 steps" or "Jumper · 1 × 7". */
export function patternLabel(code: PatternCode): string {
  const pattern = parsePattern(code);
  if (!pattern) return 'Unknown pattern';
  if (pattern.kind === 'rider') {
    const steps = pattern.steps.length;
    return `Rider · ${steps} ${steps === 1 ? 'step' : 'steps'}`;
  }
  return `Jumper · ${Math.abs(pattern.dx)} × ${Math.abs(pattern.dy)}`;
}
