/**
 * Upcasting whole stored records — online game documents and local games —
 * to the current shape before they are schema-checked. Writes are always the
 * current shape, so each record is upcast at most until it is next saved.
 *
 *   game doc v1 → style Original (v1); `mode` is dropped (an old "hotseat"
 *     game simply has the same player in both seats, which reads as such).
 *   game doc v2 → style Tiered (v2).
 *   local game without a style (v2) → style Tiered (v2), facts rebuilt from
 *     its own turn list.
 *
 * Turn documents need nothing: their v1 extras (`key`, `libraryAdded` on
 * charts) are ignored by the schema.
 */

import { ORIGINAL_V1, styleRef, TIERED_V2 } from '../../../variants';
import { isJson, upcastState } from './state';

export function upcastGameDoc(data: unknown): unknown {
  if (!isJson(data)) return data;
  if (data.schemaVersion === 1) {
    const { mode: _mode, ...rest } = data;
    return { ...rest, schemaVersion: 3, style: styleRef(ORIGINAL_V1), state: upcastState(data.state) };
  }
  if (data.schemaVersion === 2) {
    return { ...data, schemaVersion: 3, style: styleRef(TIERED_V2), state: upcastState(data.state) };
  }
  return data;
}

export function upcastLocalRecord(data: unknown): unknown {
  if (!isJson(data) || 'style' in data || !isJson(data.state) || data.state.rulesVersion !== 2) return data;
  const turns = Array.isArray(data.turns) ? data.turns : null;
  return { ...data, style: styleRef(TIERED_V2), state: upcastState(data.state, turns) };
}
