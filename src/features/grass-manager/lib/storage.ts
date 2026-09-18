import { DEFAULT_PROFILE, YARD_SEGMENTS } from './yard';
import type { CareEvent, GrassManagerState, GrassProfile } from './types';

const STORAGE_KEY = 'grass-manager-state-v1';

export const DEFAULT_STATE: GrassManagerState = {
  profile: DEFAULT_PROFILE,
  events: [],
  selectedSegmentId: YARD_SEGMENTS[0].id,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeProfile(value: unknown): GrassProfile {
  if (!isRecord(value)) return DEFAULT_PROFILE;
  return {
    ...DEFAULT_PROFILE,
    ...value,
    weedTypes: Array.isArray(value.weedTypes)
      ? value.weedTypes.filter((weed): weed is string => typeof weed === 'string').slice(0, 8)
      : DEFAULT_PROFILE.weedTypes,
    sprinklerMinutes:
      typeof value.sprinklerMinutes === 'number' && value.sprinklerMinutes > 0
        ? Math.min(120, value.sprinklerMinutes)
        : DEFAULT_PROFILE.sprinklerMinutes,
    location: isRecord(value.location) ? value.location as unknown as GrassProfile['location'] : null,
  };
}

function normalizeEvents(value: unknown): CareEvent[] {
  if (!Array.isArray(value)) return [];
  return value.filter((event): event is CareEvent => {
    if (!isRecord(event)) return false;
    return (
      typeof event.id === 'string' &&
      typeof event.at === 'string' &&
      typeof event.segmentId === 'string' &&
      ['watered', 'fertilized', 'weed-control'].includes(String(event.type))
    );
  }).slice(0, 200);
}

export function loadGrassState(): GrassManagerState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      profile: normalizeProfile(parsed.profile),
      events: normalizeEvents(parsed.events),
      selectedSegmentId:
        typeof parsed.selectedSegmentId === 'string' ? parsed.selectedSegmentId : DEFAULT_STATE.selectedSegmentId,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveGrassState(state: GrassManagerState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function todayInputValue(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function eventLabel(type: CareEvent['type']): string {
  return { watered: 'Watered', fertilized: 'Fertilized', 'weed-control': 'Weed control' }[type];
}
