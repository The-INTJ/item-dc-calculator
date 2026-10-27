/**
 * Every string the site shows. The voice and headlines come from the Sound To
 * Note design system; the intro, gear list, about copy, links and booking
 * questions come from Alex's own notes (Oct 2026). Credits and quotes are
 * still the design's PLACEHOLDERS — swap in real ones as Alex sends them;
 * nothing marked placeholder should be read as a real credit.
 */

export const contact = {
  name: 'Alex Ferré',
  brand: 'Sound To Note',
  email: 'alexferre8@gmail.com',
  /** Alex asked for no phone number on the site: email or Instagram only. */
  instagram: '@reverentbow578',
  instagramHref: 'https://www.instagram.com/reverentbow578/',
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
  /** What the on-set photo paired with this quote should show. */
  photo: string;
}

/**
 * PLACEHOLDER testimonials. Alex is collecting real ones from people he works
 * with; each gets a photo of him working on that job.
 */
export const quotes: readonly Quote[] = [
  {
    quote:
      'Placeholder testimonial. Something about Alex being calm, fast and the person everyone wants at lunch.',
    name: 'Collaborator Name',
    role: 'Director',
    accent: 'cyan',
    photo: 'Alex on set — boom up',
  },
  {
    quote: 'Placeholder testimonial about clean tracks and zero ADR.',
    name: 'Collaborator Name',
    role: 'Producer',
    accent: 'orange',
    photo: 'Alex at the cart, mixing',
  },
  {
    quote: 'Placeholder testimonial from crew.',
    name: 'Collaborator Name',
    role: '1st AD',
    accent: 'violet',
    photo: 'Alex wiring talent',
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
  /** A line under the list, for groups that are a service as much as a kit. */
  note?: string;
}

/** Alex's own kit list. Model names are his; the plain-English lines are ours. */
export const gear: readonly GearGroup[] = [
  {
    group: 'Recorders & mixers',
    plainGroup: 'The mixer',
    items: [
      {
        name: 'Sound Devices 688',
        category: 'Main mixer · 12 inputs',
        plain: 'The main rig. Every mic on its own track, so editors can fix anything later.',
      },
      {
        name: 'Zoom F8n Pro',
        category: 'Mixer · 8 inputs',
        plain: 'The second rig, for smaller setups and second units.',
      },
      {
        name: 'Zoom F6',
        category: 'Mixer · 6 inputs',
        plain: 'The compact one, with an X/Y stereo pair for ambience.',
      },
    ],
  },
  {
    group: 'Boom',
    plainGroup: 'The mic on an (expensive) stick',
    items: [
      {
        name: 'Schoeps CMIT 5',
        category: 'Shotgun · blue',
        plain: 'The good one. Natural, clean dialogue.',
      },
      {
        name: 'Rode NTG3B',
        category: 'Shotgun',
        plain: 'Rugged and weatherproof, for when the shoot goes outside.',
      },
      {
        name: 'Sennheiser MKH 416',
        category: 'Shotgun',
        plain: "The industry standard you've heard in a thousand movies.",
      },
      {
        name: 'Ambient Recording QP5150 QuickPole',
        category: 'Largest pole · carbon fiber',
        plain: 'Five sections, 5.1′ to 20.9′. Reaches over anything.',
      },
      {
        name: 'K-Tek KE-79CC Traveler',
        category: 'Smallest pole · aluminum',
        plain: 'Internal XLR cable, for tight rooms and fast moves.',
      },
    ],
  },
  {
    group: 'Wireless',
    plainGroup: 'The mics on actors',
    items: [
      {
        name: 'Lectrosonics transmitters',
        category: 'Transmitter',
        count: 6,
        plain: 'Hidden mics on up to six actors at once.',
      },
      {
        name: 'Lectrosonics VRField',
        category: 'Receiver',
        plain: 'Takes in all six at the cart.',
      },
      {
        name: 'Sanken COS-11',
        category: 'Lav mic',
        count: 6,
        plain: 'The tiny mic tucked into wardrobe.',
      },
    ],
  },
  {
    group: 'Timecode',
    plainGroup: 'Sync it up',
    items: [
      {
        name: 'Betso timecode box',
        category: 'Sync',
        count: 4,
        plain: 'Keeps picture and sound perfectly lined up.',
      },
      {
        name: 'Betso timecode slate',
        category: 'Clapper board',
        plain: 'The clapper, paired with the boxes so every take is marked.',
      },
      {
        name: 'Denecke JB-1',
        category: 'Backup sync box',
        plain: 'The backup, because timecode never fails until it does.',
      },
    ],
  },
  {
    group: 'IFB',
    plainGroup: 'Who hears what',
    items: [
      {
        name: 'Sennheiser G4',
        category: 'IFB / camera hop',
        count: 2,
        plain:
          'Cabled for a hop-on system, so director and camera hear what I hear on run-and-gun shoots.',
      },
    ],
  },
  {
    group: 'Podcast',
    plainGroup: 'Podcast setup',
    items: [
      {
        name: 'Shure SM7B',
        category: 'Podcast mic',
        count: 2,
        plain: 'The broadcast voice mic. Warm, close and forgiving.',
      },
      {
        name: 'Snakes, XLRs and clean cable runs',
        category: 'Wiring',
        plain: 'Cabling that looks as professional as your talk sounds.',
      },
    ],
    note: "Setting up a podcast or talk space? Ask me and we'll work out the best system for your room.",
  },
];

export const heroFacts: readonly (readonly [string, string])[] = [
  ['Experience', '7 years'],
  ['On set', 'Mix, boom and wire'],
  ['Off set', 'Post-production sound'],
];

export interface Service {
  slug: string;
  label: string;
}

/** Alex's list. He does not rent out equipment, so there is no rental option. */
export const services: readonly Service[] = [
  { slug: 'mixer', label: 'Production mixer' },
  { slug: 'post', label: 'Post sound' },
  { slug: 'consultant', label: 'Consultant' },
  { slug: 'other', label: 'Other' },
];

/** The booking form's "Project type" choices (not the Work page's filters). */
export const bookingTypes: readonly string[] = [
  'Commercial',
  'Feature',
  'Short film',
  'Web series',
  'TV series',
  'Documentary',
  'Music video',
  'Podcast',
  'Other',
];

export const teamSizes: readonly string[] = [
  'One-man band (just me)',
  'Two-person team (mixer + boom op, or mixer + utility)',
  'Full team (mixer, boom op, utility)',
  'Not sure yet',
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
  href: string;
}

export const socials: readonly SocialEntry[] = [
  {
    label: 'Instagram',
    handle: contact.instagram,
    icon: 'instagram',
    accent: 'pink',
    href: contact.instagramHref,
  },
  {
    label: 'IMDb',
    handle: 'Alex Ferre (IV) — full credits',
    icon: 'clapperboard',
    accent: 'gold',
    href: 'https://www.imdb.com/name/nm11750936/',
  },
  {
    label: 'Shugah Munny',
    handle: 'My disco-funk band · official site',
    icon: 'music',
    accent: 'violet',
    href: 'https://www.shugahmunny.com',
  },
  {
    label: 'Shugah Munny on Spotify',
    handle: 'Give us a listen',
    icon: 'audio-lines',
    accent: 'cyan',
    href: 'https://open.spotify.com/artist/20s37SZhadtpiPuB2GpkfF',
  },
  {
    label: 'Email',
    handle: contact.email,
    icon: 'mail',
    accent: 'orange',
    href: `mailto:${contact.email}`,
  },
];
