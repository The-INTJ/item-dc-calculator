/**
 * Compact move notation for the history list.
 *
 *   Wd2-d3  Wd2xe3          warden step / capture
 *   Tf4-f6  Tf4xc6          tracer strike
 *   Ke1-f2  Ke1xb4 [J-1,3]  king move; borrowed pattern in brackets
 *   Tb1~b3 J88              chart: kind letter + path digits
 *   (Kd8-c7)                free king step
 *   --                      pass
 *   #  #L  =                king captured / lone king / drawn by dodge streak
 *
 * White's turns are numbered `1.`, Black's `1…`.
 */

import type { ActionRecord, GameResult, TurnRecord } from './types';

const PIECE_LETTER = { warden: 'W', strike: 'T', king: 'K' } as const;

function patternLabel(code: string): string {
  return code.replace(':', '');
}

export function formatAction(action: ActionRecord): string {
  switch (action.kind) {
    case 'step':
      return `(K${action.from}-${action.to})`;
    case 'chart': {
      const letter = action.pattern.startsWith('J:') ? 'J' : 'R';
      return `T${action.from}~${action.to} ${letter}${action.steps}`;
    }
    case 'pass':
      return '--';
    default: {
      const joiner = action.captured ? 'x' : '-';
      const base = `${PIECE_LETTER[action.kind]}${action.from}${joiner}${action.to}`;
      const showSource = action.kind === 'king' && action.via !== 'base';
      return showSource ? `${base} [${patternLabel(action.via)}]` : base;
    }
  }
}

function resultSuffix(result: GameResult): string {
  if (result.status === 'won' && result.reason === 'king-capture') return '#';
  if (result.status === 'won' && result.reason === 'lone-king') return '#L';
  if (result.status === 'drawn' && result.reason === 'step-streak') return ' =';
  return '';
}

export function turnNumberLabel(ply: number): string {
  const number = Math.floor(ply / 2) + 1;
  return ply % 2 === 0 ? `${number}.` : `${number}…`;
}

export function formatTurn(record: TurnRecord): string {
  const moves = record.actions.map(formatAction).join(' ');
  return `${turnNumberLabel(record.ply)} ${moves}${resultSuffix(record.result)}`;
}
