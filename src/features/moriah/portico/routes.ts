import { urls } from '../content';
import { contactPage, faithPage, lockup, siteLabels } from './content';

/**
 * The Portico preview is one route, like v1: `?page=` picks the body, so the
 * nav navigates for real without a route file per page. Its pages follow the
 * live site's own structure — Pastor, Our Faith, Sermons, Calendar, Contact —
 * rather than v1's, and Directions and the bicentennial book stay external
 * links, as they are on moriahpbc.org.
 */

export const PORTICO_PATH = '/moriah-2';

export type PorticoPage = 'home' | 'pastor' | 'faith' | 'sermons' | 'calendar' | 'contact';

const PAGE_KEYS: readonly PorticoPage[] = [
  'home',
  'pastor',
  'faith',
  'sermons',
  'calendar',
  'contact',
];

/** Unknown or missing `?page=` falls back to home rather than 404ing. */
export function parsePorticoPage(value: string | undefined): PorticoPage {
  return PAGE_KEYS.includes(value as PorticoPage) ? (value as PorticoPage) : 'home';
}

export function porticoHref(page: PorticoPage): string {
  return page === 'home' ? PORTICO_PATH : `${PORTICO_PATH}?page=${page}`;
}

/** The title each page carries in its gable and its browser tab. */
export const porticoTitles: Record<PorticoPage, string> = {
  home: `${lockup.first} ${lockup.rest}`,
  pastor: siteLabels.pastor,
  faith: faithPage.heading,
  sermons: siteLabels.sermons,
  calendar: siteLabels.calendar,
  contact: contactPage.heading,
};

export interface PorticoLink {
  label: string;
  href: string;
  /** Set for in-preview pages, so the nav can mark where the reader is. */
  page?: PorticoPage;
  external?: boolean;
}

/** The architrave: the live site's own link labels, in reading order. */
export const porticoNav: readonly PorticoLink[] = [
  { label: siteLabels.pastor, href: porticoHref('pastor'), page: 'pastor' },
  { label: siteLabels.faith, href: porticoHref('faith'), page: 'faith' },
  { label: siteLabels.sermons, href: porticoHref('sermons'), page: 'sermons' },
  { label: siteLabels.calendar, href: porticoHref('calendar'), page: 'calendar' },
  { label: siteLabels.contact, href: porticoHref('contact'), page: 'contact' },
  { label: siteLabels.directions, href: urls.maps, external: true },
];
