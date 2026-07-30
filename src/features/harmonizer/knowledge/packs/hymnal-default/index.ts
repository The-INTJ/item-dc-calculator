/**
 * The hymnal-default knowledge pack (spec §19.3) — the one style shipped in
 * v1: seven-shape gospel-SATB convention with the old books' lenient posture
 * on parallels and open sounds. The numeric tables live as the engine's
 * DEFAULT_STYLE_PACK (domain/engine/style.ts — McHose prevalences, directed
 * progressions, de Clercq cadence weights, congregational ranges); this
 * module is the versioned manifest around them plus the §19.4 curated
 * override seat (empty in v1 — a future patch can replace any composed
 * descriptor with hand-written prose without losing provenance).
 *
 * A second flavor (e.g. old-style dispersed harmony) is a sibling folder plus
 * a pack selector in state — no engine or composer changes.
 */

import { DEFAULT_STYLE_PACK, type StylePack } from '../../../domain/engine/style';
import type { ModeId } from '../../../domain/music-types';

export interface KnowledgePackManifest {
  id: string;
  version: string;
  styleId: string;
  displayName: string;
  supportedModes: ModeId[];
  ruleProviderIds: string[];
  corpusProviderIds: string[];
  curatedDescriptorProviderIds: string[];
  compatibilityVersion: string;
}

export const HYMNAL_DEFAULT_MANIFEST: KnowledgePackManifest = {
  id: DEFAULT_STYLE_PACK.id,
  version: DEFAULT_STYLE_PACK.version,
  styleId: 'seven-shape-gospel-satb',
  displayName: 'Hymnal (seven-shape gospel SATB)',
  supportedModes: ['major', 'natural_minor'],
  ruleProviderIds: ['engine-core', 'explanation-composer'],
  corpusProviderIds: [],
  curatedDescriptorProviderIds: [],
  compatibilityVersion: '1',
};

/** §19.4 seat: curated replacements for composed descriptors. Empty in v1. */
export interface CuratedDescriptorOverride {
  /** Composed descriptor id suffix to replace (e.g. 'cadence'). */
  match: string;
  label: string;
  explanation: string;
}

export const CURATED_DESCRIPTOR_OVERRIDES: CuratedDescriptorOverride[] = [];

export const HYMNAL_DEFAULT_PACK: StylePack = DEFAULT_STYLE_PACK;
