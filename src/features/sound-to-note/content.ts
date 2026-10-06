/**
 * Every string the site shows. The voice, headlines, traits and contact
 * details come from the Sound To Note design system (built from Alex's brief).
 * Credits, quotes and gear models are the design's PLACEHOLDERS — swap in real
 * ones as Alex sends them; nothing here should be read as a real credit.
 */

export const contact = {
  name: 'Alex Ferré',
  brand: 'Sound To Note',
  email: 'alexferre8@gmail.com',
  phone: '(770) 377-2721',
  phoneHref: 'tel:+17703772721',
  location: 'Atlanta, GA',
  role: 'Production Audio Mixer',
};

export type Accent = 'orange' | 'cyan' | 'violet' | 'pink' | 'gold';

export interface Project {
  slug: string;
  title: string;
  year: string;
  type: string;
  platform: string;
  director: string;
  producer?: string;
  role: string;
  /** Sticker joke on the still. One per photo, not every photo. */
  note?: string;
  /** Behind-the-scenes story, hidden behind a toggle. */
  story?: string;
}

/** PLACEHOLDER credits from the design system. */
export const projects: readonly Project[] = [
  {
    slug: 'one',
    title: 'Project Title One',
    year: '2025',
    type: 'Feature',
    platform: 'Streamer',
    director: 'Director Name',
    producer: 'Producer Name',
    role: 'Production Mixer',
    note: 'sticker joke goes here',
    story:
      'Placeholder for a short behind-the-scenes story from Alex. Two or three sentences, dry humor welcome.',
  },
  {
    slug: 'two',
    title: 'Project Title Two',
    year: '2024',
    type: 'Series',
    platform: 'Network',
    director: 'Director Name',
    producer: 'Producer Name',
    role: 'One-man sound team',
    story: 'Placeholder story.',
  },
  {
    slug: 'three',
    title: 'Project Title Three',
    year: '2024',
    type: 'Commercial',
    platform: 'Brand',
    director: 'Director Name',
    role: 'Boom Op + Mixer',
    note: 'yes, in the rain',
  },
  {
    slug: 'four',
    title: 'Project Title Four',
    year: '2023',
    type: 'Doc',
    platform: 'Festival',
    director: 'Director Name',
    producer: 'Producer Name',
    role: 'Production Mixer',
    story: 'Placeholder story.',
  },
  {
    slug: 'five',
    title: 'Project Title Five',
    year: '2023',
    type: 'Music video',
    platform: 'Label',
    director: 'Director Name',
    role: 'Sound Mixer',
  },
  {
    slug: 'six',
    title: 'Project Title Six',
    year: '2022',
    type: 'Short',
    platform: 'Festival',
    director: 'Director Name',
    role: 'Production Mixer',
    note: '12 pages, 1 day',
  },
];

export interface Quote {
  quote: string;
  name: string;
  role: string;
  accent: Accent;
}

/** PLACEHOLDER testimonials from the design system. */
export const quotes: readonly Quote[] = [
  {
    quote:
      'Placeholder testimonial. Something about Alex being calm, fast and the person everyone wants at lunch.',
    name: 'Collaborator Name',
    role: 'Director',
    accent: 'cyan',
  },
  {
    quote: 'Placeholder testimonial about clean tracks and zero ADR.',
    name: 'Collaborator Name',
    role: 'Producer',
    accent: 'orange',
  },
  {
    quote: 'Placeholder testimonial from crew.',
    name: 'Collaborator Name',
    role: '1st AD',
    accent: 'violet',
  },
];

export interface GearPiece {
  name: string;
  category: string;
  plain: string;
  count?: number;
}

export interface GearGroup {
  /** The technical group, shown as a tag for the sound folks. */
  group: string;
  /** The plain-English heading everyone else reads. */
  plainGroup: string;
  items: readonly GearPiece[];
}

/** PLACEHOLDER model names; the plain-English lines are the design's. */
export const gear: readonly GearGroup[] = [
  {
    group: 'Recorders & mixers',
    plainGroup: 'The brain',
    items: [
      {
        name: 'Mixer / recorder model',
        category: 'Recorder',
        plain: 'Records every mic on its own track, so editors can fix anything later.',
      },
      {
        name: 'Mixing surface model',
        category: 'Fader controller',
        plain: 'Real faders for mixing live while cameras roll.',
      },
    ],
  },
  {
    group: 'Wireless',
    plainGroup: 'The mics on actors',
    items: [
      {
        name: 'Wireless system model',
        category: 'Receiver',
        count: 6,
        plain: 'Hidden mics on up to six actors at once.',
      },
      {
        name: 'Lavalier model',
        category: 'Lav mic',
        count: 8,
        plain: 'The tiny mic tucked into wardrobe.',
      },
    ],
  },
  {
    group: 'Boom',
    plainGroup: 'The mic on a stick',
    items: [
      {
        name: 'Shotgun mic model',
        category: 'Exterior boom',
        plain: 'Long-reach mic for outdoors.',
      },
      {
        name: 'Hypercardioid model',
        category: 'Interior boom',
        plain: 'The indoor mic. Natural, clean dialogue.',
      },
      {
        name: 'Boom pole model',
        category: 'Pole',
        plain: 'Carbon fiber, very long, surprisingly light.',
      },
    ],
  },
  {
    group: 'Timecode & comms',
    plainGroup: 'Keeping everything in sync',
    items: [
      {
        name: 'Timecode box model',
        category: 'Sync',
        count: 4,
        plain: 'Keeps picture and sound perfectly lined up.',
      },
      {
        name: 'IFB / headphone model',
        category: 'Monitoring',
        plain: 'Lets the director and script hear what I hear.',
      },
    ],
  },
];

export const heroFacts: readonly (readonly [string, string])[] = [
  ['Experience', '7 years'],
  ['Works as', 'Mixer, boom op, or full one-person team'],
  ['Kit', 'Professional, owned and maintained'],
];

export interface Trait {
  icon: string;
  title: string;
  body: string;
  accent: Accent;
}

export const traits: readonly Trait[] = [
  {
    icon: 'clock',
    title: 'Early to call',
    body: 'Gear is built and tested before the camera department has coffee.',
    accent: 'orange',
  },
  {
    icon: 'users',
    title: 'One-man band',
    body: 'Wires actors, booms and mixes at the same time when the budget calls for it.',
    accent: 'cyan',
  },
  {
    icon: 'smile',
    title: 'Easy on set',
    body: "Hires keep coming from referrals. I haven't sent out a resume in 5 years.",
    accent: 'gold',
  },
  {
    icon: 'ear',
    title: 'Invisible',
    body: 'Mics hide, cables vanish, and nobody waits on sound.',
    accent: 'pink',
  },
];

export interface Service {
  slug: string;
  label: string;
}

export const services: readonly Service[] = [
  { slug: 'mixing', label: 'Production mixing' },
  { slug: 'boom', label: 'Boom op' },
  { slug: 'wiring', label: 'Wiring talent' },
  { slug: 'one-man', label: 'One-man sound team' },
  { slug: 'post', label: 'Post-production sound' },
];

export const rates: readonly string[] = [
  'Under $500 / day',
  '$500–$800 / day',
  '$800–$1,200 / day',
  '$1,200+ / day',
  "Let's talk",
];

export interface SocialEntry {
  label: string;
  handle: string;
  icon: string;
  accent: Accent;
  /** PLACEHOLDER destinations until Alex sends his real handles. */
  href: string;
  external: boolean;
}

export const socials: readonly SocialEntry[] = [
  {
    label: 'Instagram',
    handle: '@handle',
    icon: 'instagram',
    accent: 'pink',
    href: 'https://www.instagram.com/',
    external: true,
  },
  {
    label: 'IMDb',
    handle: 'Alex Ferré — full credits',
    icon: 'clapperboard',
    accent: 'gold',
    href: 'https://www.imdb.com/',
    external: true,
  },
  {
    label: 'Post-production sound',
    handle: 'Dialogue edit, cleanup, mix',
    icon: 'audio-lines',
    accent: 'cyan',
    href: '/sound-to-note?page=contact&service=post',
    external: false,
  },
  {
    label: 'ShugahMunny',
    handle: 'Trombone · Instagram',
    icon: 'music',
    accent: 'violet',
    href: 'https://www.instagram.com/',
    external: true,
  },
];
