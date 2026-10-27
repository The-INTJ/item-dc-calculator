import { contact } from '../../content';

export interface Inquiry {
  dates: string;
  location: string;
  type: string;
  team: string;
  rate: string;
  description: string;
  name: string;
  email: string;
  phone: string;
  services: string[];
}

export const emptyInquiry: Omit<Inquiry, 'services'> = {
  dates: '',
  location: '',
  type: '',
  team: '',
  rate: '',
  description: '',
  name: '',
  email: '',
  phone: '',
};

/**
 * The booking form has no backend: it opens the visitor's own mail app with
 * everything filled in, addressed to Alex. Dates lead, since Alex reads them first.
 */
export function inquiryMailto(inquiry: Inquiry): string {
  const subject = `Booking inquiry${inquiry.dates ? ` — ${inquiry.dates}` : ''}`;
  const body = [
    `Dates: ${inquiry.dates}`,
    `Filming location(s): ${inquiry.location}`,
    `Project type: ${inquiry.type}`,
    `Sound team: ${inquiry.team}`,
    `Rate: ${inquiry.rate}`,
    `Services: ${inquiry.services.join(', ')}`,
    '',
    'Project:',
    inquiry.description,
    '',
    `Contact: ${[inquiry.name, inquiry.email, inquiry.phone].filter(Boolean).join(' · ')}`,
  ].join('\n');

  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
