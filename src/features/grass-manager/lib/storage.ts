import { z } from 'zod';
import { GRASS_LABELS } from './lawnCare';
import { DEFAULT_PROFILE } from './yard';
import { dateInYard } from './careHistory';
import type { CareEvent, GrassManagerState, GrassProfile } from './types';

const STORAGE_KEY = 'grass-manager-state-v1';
export const DEFAULT_STATE: GrassManagerState = {
  profile: DEFAULT_PROFILE, events: [], selectedSegmentId: '', zones: {},
};

const locationSchema = z.object({
  name: z.string(), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180),
  admin1: z.string().optional(), country: z.string().optional(), timezone: z.string().optional(),
});
const profileSchema = z.object({
  grassType: z.enum(Object.keys(GRASS_LABELS) as [GrassProfile['grassType'], ...GrassProfile['grassType'][]]).catch('mixed-unsure'),
  weedTypes: z.array(z.string().max(80)).max(8).catch([]),
  sprinklerMinutes: z.number().min(1).max(180).catch(20),
  sprinklerInches: z.number().min(0.01).max(3).optional().catch(undefined),
  weedCoverage: z.enum(['scattered', 'patches', 'widespread']).catch('scattered'),
  lawnStage: z.enum(['established', 'seeding', 'new-seed', 'dormant']).catch('established'),
  configured: z.boolean().catch(false), locationName: z.string().catch(''),
  location: locationSchema.nullable().catch(null),
});
const eventSchema = z.object({
  id: z.string(), type: z.enum(['watered', 'fertilized', 'weed-control', 'hand-weeded']),
  at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((date) => {
    const value = new Date(date);
    return !Number.isNaN(value.getTime()) && value.toISOString().slice(0, 10) === date;
  }),
  segmentId: z.string(), minutes: z.number().min(1).max(180).optional(),
  product: z.string().max(120).optional(), note: z.string().max(500).optional(),
});
const zonesSchema = z.record(z.string(), z.object({
  sun: z.enum(['unknown', 'full-sun', 'part-sun', 'shade']),
  condition: z.enum(['unknown', 'strong', 'thin', 'weedy', 'bare']),
})).catch({});

export function loadGrassState(): GrassManagerState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!parsed || typeof parsed !== 'object') return DEFAULT_STATE;
    const profile = profileSchema.parse(parsed.profile ?? {});
    const events: CareEvent[] = [];
    for (const item of Array.isArray(parsed.events) ? parsed.events : []) {
      const result = eventSchema.safeParse(item);
      if (!result.success) continue;
      const event = result.data;
      if (parsed.version !== 2) {
        if (event.segmentId === 'right-side-hill') event.segmentId = 'left-side-hill';
        else if (event.segmentId === 'left-side') event.segmentId = 'right-side';
      }
      events.push(event);
    }
    if (parsed.version !== 2) profile.configured = profile.grassType !== 'mixed-unsure' || profile.weedTypes.length > 0;
    return { profile, events: events.slice(0, 200), zones: zonesSchema.parse(parsed.zones), selectedSegmentId: '' };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveGrassState(state: GrassManagerState): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, selectedSegmentId: '', version: 2 }));
    return true;
  } catch {
    return false;
  }
}

export function todayInputValue(): string {
  return dateInYard(new Date());
}

export function eventLabel(type: CareEvent['type']): string {
  return { watered: 'Watered', fertilized: 'Fertilized', 'weed-control': 'Weed treatment', 'hand-weeded': 'Hand-weeded' }[type];
}
