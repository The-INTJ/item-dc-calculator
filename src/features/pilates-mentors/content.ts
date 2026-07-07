/**
 * All copy for the Pilates Mentors design preview.
 *
 * Every string is sourced from pilatesmentors.com (verbatim or lightly
 * condensed) or from the approved design direction. Testimonials are verbatim
 * quotes from the live site's carousel, attributed by role only — the source
 * carousel does not pair names with quotes, so we never guess.
 */

export const pmUrls = {
  home: 'https://pilatesmentors.com/',
  pricing: 'https://pilatesmentors.com/pricing',
  onDemand: 'https://pilatesmentors.com/on-demand',
  account: 'https://pilatesmentors.com/account',
  hubEducation: 'https://pilatesmentors.com/hub-education',
  hubTeaching: 'https://pilatesmentors.com/hub-teaching',
  hubSkillDevelopment: 'https://pilatesmentors.com/hub-instructor-skill-development',
  instagram: 'https://www.instagram.com/thepilatesmentors/',
  facebook: 'https://www.facebook.com/profile.php?id=61573452716281',
  email: 'mailto:education@pilatesmentors.com',
} as const;

export const nav = [
  { label: 'Method', href: '#method' },
  { label: 'Mentors', href: '#mentors' },
  { label: 'Membership', href: '#membership' },
  { label: 'Stories', href: '#stories' },
  { label: 'Pricing', href: '#pricing' },
] as const;

export const hero = {
  eyebrow: 'STOTT PILATES® Lead Instructor Trainers',
  headline: 'Become the instructor clients trust.',
  sub: 'Mentorship, real-world teaching skills, and 500+ expert videos to help you teach with confidence, clarity, and impact.',
  primaryCta: 'Start your free trial',
  secondaryCta: 'Explore the on-demand library',
  trustLine: '7-day free trial · Cancel anytime',
  image: {
    src: '/pilates-mentors/kvp_1041.jpg',
    alt: 'A Pilates Mentors instructor giving a hands-on reformer correction while she and her client laugh together',
  },
} as const;

export const gap = {
  eyebrow: 'Why Pilates Mentors',
  headline: 'Teaching clients is very different from teaching fellow students.',
  body: 'Certification gives you the method. We bridge the gap between training and real-world application — the tools and mentorship to confidently teach real bodies of all abilities, from your first client to your thousandth.',
  image: {
    src: '/pilates-mentors/kvp_0787.jpg',
    alt: 'An instructor coaching a mat class, guiding a student’s spinal articulation with her hands',
  },
} as const;

export const method = {
  eyebrow: 'The method',
  headline: 'Assess. Cue. Program.',
  pillars: [
    {
      title: 'Assess',
      body: 'Read any body that walks in. Master postural assessment and movement testing, then turn what you find into personal progressions.',
    },
    {
      title: 'Cue',
      body: 'Develop verbal, tactile, and visual cueing that transforms a client’s movement — and keeps every session safe and effective.',
    },
    {
      title: 'Program',
      body: 'Structure classes with confidence, with ready-to-use sequences designed for different levels and goals.',
    },
  ],
} as const;

export const mentors = {
  eyebrow: 'Your mentors',
  headline: 'Created and led by STOTT PILATES® Lead Instructor Trainers.',
  people: [
    {
      name: 'Sarah',
      role: 'Co-founder · Lead Instructor Trainer',
      line: 'Two decades of Pilates expertise across six continents, specializing in injuries, special populations, and innovative movement.',
      image: { src: '/pilates-mentors/sarah.png', alt: 'Portrait of Sarah, co-founder of Pilates Mentors' },
    },
    {
      name: 'Elizebeth Ellison',
      role: 'Co-founder · Lead Instructor Trainer',
      line: 'Two decades transforming lives through intelligent, adaptable movement — taught with expertise, humor, and heart.',
      image: { src: '/pilates-mentors/elizabeth.png', alt: 'Portrait of Elizebeth Ellison, co-founder of Pilates Mentors' },
    },
  ],
  stats: [
    { value: '40+', label: 'years combined teaching' },
    { value: '1,000+', label: 'students mentored' },
    { value: '500+', label: 'expert videos' },
  ],
} as const;

export const hubs = {
  eyebrow: 'Inside the membership',
  headline: 'One path. Three hubs.',
  items: [
    {
      number: '01',
      title: 'Education Hub',
      outcome: 'Foundations',
      body: 'Injuries, conditions, anatomy, and inclusive exercise strategies — guided by physiotherapists, kinesiologists, physicians, and chiropractors.',
      href: pmUrls.hubEducation,
    },
    {
      number: '02',
      title: 'Teaching Hub',
      outcome: 'Craft',
      body: 'Cueing, correcting, and programming techniques, organized by body region and postural imbalance.',
      href: pmUrls.hubTeaching,
    },
    {
      number: '03',
      title: 'Instructor Skill Development Hub',
      outcome: 'Mastery',
      body: 'Static and dynamic postural analysis, movement testing, and the confidence to program for any client.',
      href: pmUrls.hubSkillDevelopment,
    },
  ],
} as const;

export const testimonials = {
  eyebrow: 'What instructors say',
  headline: 'Mentorship that changes how you teach.',
  quotes: [
    {
      quote:
        'I successfully completed my written exam and did very well — I got a 96! Sarah played such an integral part in my learning and helped me so much during and after my course.',
      attribution: 'Certification graduate',
    },
    {
      quote:
        'Learning from Elizebeth was incredible and has already improved my teaching, sequencing, and cueing. Her course was the best I’ve taken for fitness and yoga teachers.',
      attribution: 'Fitness & yoga teacher',
    },
    {
      quote:
        'Elizebeth Ellison is the best master trainer I’ve worked with in my 28 years — transforming my teaching by deepening my understanding of movement.',
      attribution: 'Instructor, 28 years in practice',
    },
    {
      quote:
        'Thanks to Elizebeth and Pilates, I feel stronger and more capable at 54 than I did at 34 — competing and playing sports multiple times a week without pain.',
      attribution: 'Longtime client',
    },
  ],
} as const;

export const pricing = {
  eyebrow: 'Membership',
  headline: 'Everything you need to teach better than yesterday.',
  planName: 'Master Membership',
  price: '$23.80',
  priceUnit: '/month',
  priceNote: 'Founder’s annual rate · monthly plan from $28/month',
  features: [
    'Full access to all three hubs and 500+ expert videos',
    'New teaching and education content added regularly',
    '30% off the Deep Dive PDF resource library',
    'Posture-focus and special-populations training',
  ],
  cta: 'Start your free trial',
  finePrint: '7-day free trial · Cancel anytime · Founding-member rates through 08/31/26',
} as const;

export const finalCta = {
  headline: 'Teach better than yesterday.',
  cta: 'Start your free trial',
  secondary: 'Browse the on-demand library',
} as const;

export const footer = {
  email: 'education@pilatesmentors.com',
  note: 'Design preview built for Pilates Mentors. Photography and words are from pilatesmentors.com; this page is not the live site.',
  copyright: '© 2026 Pilates Mentors. All rights reserved.',
} as const;
