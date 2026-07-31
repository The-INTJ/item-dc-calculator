/* ---------------- derivability ---------------- */

import type { DerivabilityNote } from '../../analysis-types';

export const ENGINE_DERIVABILITY_NOTES: DerivabilityNote[] = [
  {
    aspect: 'chord_path',
    status: 'computed',
    note: 'Chord choices are computed from note membership, directed progression weights, and cadence tables.',
  },
  {
    aspect: 'voicing',
    status: 'computed',
    note: 'Voiced under hymnal ranges, spacing, and doubling; smoothness and voice-leading weighed by the style pack.',
  },
  {
    aspect: 'ranking',
    status: 'computed',
    note: 'Ordered by separate dimensions (intent match, melodic fit, voice-leading ease) weighted by the style pack — never one score.',
  },
  {
    aspect: 'interpretation',
    status: 'computed',
    note: 'Passing tones, neighbor tones, and suspensions classified by rule; unclear readings say so.',
  },
  {
    aspect: 'effects',
    status: 'needs_data',
    note: 'Feel and effect labels are curated content; nothing to compute here.',
  },
];

export const ENGINE_SKETCH_DERIVABILITY_NOTES: DerivabilityNote[] = [
  {
    aspect: 'chord_path',
    status: 'needs_math',
    note: 'The ? spans have no chord in the style vocabulary containing every sounding note. Naming a full sonority is always math; a wider vocabulary would fill these.',
  },
  {
    aspect: 'voicing',
    status: 'needs_data',
    note: 'Blank lanes are left empty on purpose: filling them musically around pinned notes needs the wider vocabulary first.',
  },
  {
    aspect: 'ranking',
    status: 'computed',
    note: 'Resolvable spans are ranked normally; holes carry a fixed honesty cost.',
  },
  {
    aspect: 'interpretation',
    status: 'computed',
    note: 'Classified where a chord exists; ? spans have no chord to measure against.',
  },
  {
    aspect: 'effects',
    status: 'needs_data',
    note: 'Feel and effect labels are curated content; nothing to compute here.',
  },
];
