'use client';

import { useState } from 'react';

import type { ApiResult } from '../lib/api/tracerApi';
import {
  endLocalGame,
  localAsTracerGame,
  playLocalTurn,
  undoLocalTurn,
  type LocalGameRecord,
} from '../lib/local/localGame';
import { saveLocalGame, useLocalGameRecord } from '../lib/local/localStore';
import { rememberGame } from '../lib/recentGames';
import type { SubmitTurnInput } from '../lib/schemas';

function title(record: LocalGameRecord): string {
  const turn = Math.floor(record.state.ply / 2) + 1;
  return record.state.result.status === 'active' ? `Local game · turn ${turn}` : 'Local game · finished';
}

/**
 * A game played on this device only. Turns run through the engine right
 * here and are saved to localStorage — no sign-in, no server calls. If the
 * browser refuses to save, the game carries on in memory for this visit.
 */
export function useLocalGame(id: string) {
  const stored = useLocalGameRecord(id);
  const [unsaved, setUnsaved] = useState<LocalGameRecord | null>(null);
  const record = unsaved ?? stored;

  function commit(next: LocalGameRecord) {
    setUnsaved(saveLocalGame(next) ? null : next);
    rememberGame({ id: next.id, title: title(next), href: `/tracer/local/${next.id}` });
  }

  async function submitTurn(input: SubmitTurnInput): Promise<ApiResult<null>> {
    if (!record) return { ok: false, code: 'GAME_NOT_FOUND', message: 'This game is gone.', reason: null };
    const played = playLocalTurn(record, input.turn, Date.now());
    if (!played.ok) return { ok: false, code: 'ILLEGAL_TURN', message: played.message, reason: played.code };
    commit(played.record);
    return { ok: true, data: null };
  }

  return {
    record,
    game: record ? localAsTracerGame(record) : null,
    submitTurn,
    undo: () => record && commit(undoLocalTurn(record, Date.now())),
    resign: () => record && commit(endLocalGame(record, 'resign', Date.now())),
    draw: () => record && commit(endLocalGame(record, 'draw', Date.now())),
  };
}
