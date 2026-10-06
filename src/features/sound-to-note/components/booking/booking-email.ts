import { contact } from '../../content';

export interface Inquiry {
  location: string;
  dates: string;
  rate: string;
  description: string;
  name: string;
  email: string;
  phone: string;
  services: string[];
}

export const emptyInquiry: Omit<Inquiry, 'services'> = {
  location: '',
  dates: '',
  rate: '',
  description: '',
  name: '',
  email: '',
  phone: '',
};

/**
 * The booking form has no backend: it opens the visitor's own mail app with
 * everything filled in, addressed to Alex.
 */
export function inquiryMailto(inquiry: Inquiry): string {
  const subject = `Booking inquiry${inquiry.name ? ` — ${inquiry.name}` : ''}`;
  const body = [
    `Filming location(s): ${inquiry.location}`,
    `Rate: ${inquiry.rate}`,
    `Dates/times: ${inquiry.dates}`,
    `Services: ${inquiry.services.join(', ')}`,
    '',
    'Project:',
    inquiry.description,
    '',
    `Contact: ${[inquiry.name, inquiry.email, inquiry.phone].filter(Boolean).join(' · ')}`,
  ].join('\n');

  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
