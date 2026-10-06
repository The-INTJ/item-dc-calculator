import { contact, projects, services } from './content';

/**
 * One route, like the Moriah previews: `?page=` picks the body, so the nav
 * navigates for real (URL, title, back button) without a route file per page.
 * Work filters (`&type=`) and booking prefills (`&service=`) are query params
 * too, so every state of the site is a shareable link.
 */

export const STN_PATH = '/sound-to-note';

export type StnPage = 'home' | 'work' | 'gear' | 'about' | 'links' | 'contact';

const PAGE_KEYS: readonly StnPage[] = ['home', 'work', 'gear', 'about', 'links', 'contact'];

/** Unknown or missing `?page=` falls back to home rather than 404ing. */
export function parseStnPage(value: string | undefined): StnPage {
  return PAGE_KEYS.includes(value as StnPage) ? (value as StnPage) : 'home';
}

export function stnHref(page: StnPage, params: Record<string, string> = {}): string {
  const query = new URLSearchParams(page === 'home' ? params : { page, ...params }).toString();
  return query ? `${STN_PATH}?${query}` : STN_PATH;
}

export const stnTitles: Record<StnPage, string> = {
  home: `${contact.name} — ${contact.role}`,
  work: 'Work',
  gear: 'Gear',
  about: 'About',
  links: 'Links',
  contact: 'Book Alex',
};

/** The nav's links; Home is the logo and Contact is the gradient CTA. */
export const stnNav: readonly { page: StnPage; label: string }[] = [
  { page: 'work', label: 'Work' },
  { page: 'gear', label: 'Gear' },
  { page: 'about', label: 'About' },
  { page: 'links', label: 'Links' },
];

export function typeSlug(type: string): string {
  return type.toLowerCase().replace(/\s+/g, '-');
}

/** Each project type once, in credit order — the Work page's filter chips. */
export const projectTypes: readonly string[] = [...new Set(projects.map((p) => p.type))];

/** `?type=` matched against the known types; anything else shows all work. */
export function parseProjectType(value: string | undefined): string | null {
  return projectTypes.find((type) => typeSlug(type) === value) ?? null;
}

/** `?service=` slugs (comma separated) mapped to the booking form's labels. */
export function parseServices(value: string | undefined): string[] {
  const wanted = (value ?? '').split(',');
  return services.filter((s) => wanted.includes(s.slug)).map((s) => s.label);
}
