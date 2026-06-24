export const heritageTabIds = [
  'home',
  'hymns',
  'hymnals',
  'about',
  'connect',
  'donate',
  'for-jack',
] as const;

export type HeritageTabId = (typeof heritageTabIds)[number];

export interface HeritageTab {
  id: HeritageTabId;
  label: string;
  nav: boolean;
  donate?: boolean;
}

export const heritageTabs: HeritageTab[] = [
  { id: 'home', label: 'Home', nav: false },
  { id: 'hymns', label: 'Hymns', nav: true },
  { id: 'hymnals', label: 'Hymnals', nav: true },
  { id: 'about', label: 'About', nav: true },
  { id: 'connect', label: 'Connect', nav: true },
  { id: 'donate', label: 'Donate', nav: true, donate: true },
  { id: 'for-jack', label: 'For Jack', nav: true },
];

const heritageTabSet = new Set<string>(heritageTabIds);

export function normalizeHeritageTab(value: string | string[] | null | undefined): HeritageTabId {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && heritageTabSet.has(candidate) ? (candidate as HeritageTabId) : 'home';
}

export function getHeritageTabHref(tab: HeritageTabId): string {
  return tab === 'home' ? '/heritage-hymns' : `/heritage-hymns?tab=${tab}`;
}
