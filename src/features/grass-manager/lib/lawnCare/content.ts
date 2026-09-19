import type { GrassType } from '../types';

export const GRASS_LABELS: Record<GrassType, string> = {
  'mixed-unsure': 'Mixed / not sure', 'tall-fescue': 'Tall fescue',
  'kentucky-bluegrass': 'Kentucky bluegrass', 'perennial-ryegrass': 'Perennial ryegrass',
  bermuda: 'Bermuda', zoysia: 'Zoysia', 'st-augustine': 'St. Augustine', centipede: 'Centipede',
};

export const SOURCES = {
  weeds: 'https://extension.umd.edu/resource/herbicide-options-managing-common-lawn-weeds-maryland',
  crabgrass: 'https://extension.psu.edu/lawn-and-turfgrass-weeds-smooth-crabgrass-and-large-crabgrass',
  nutsedge: 'https://ipm.ucanr.edu/home-and-landscape/nutsedge/',
  calendar: 'https://extension.umd.edu/resource/lawn-maintenance-calendar',
};

export interface WeedRule {
  name: string; aliases: string[]; manual: string; chemical: string; timing: string; source: string;
}

export const WEED_RULES: WeedRule[] = [
  {
    name: 'Dandelion', aliases: ['dandelion', 'dandelions'],
    manual: 'Dig out the taproot after rain; best for scattered plants before seed heads form.',
    chemical: 'For recurring patches, a lawn-safe selective broadleaf treatment can reach roots that pulling leaves behind.',
    timing: 'Fall while actively growing is usually the best treatment window.', source: SOURCES.weeds,
  },
  {
    name: 'Clover', aliases: ['clover', 'white clover'],
    manual: 'Keep it if acceptable, or lift small patches including rooted stems when soil is moist.',
    chemical: 'Persistent patches may need a clover-labeled selective broadleaf treatment.',
    timing: 'Treat active growth; fall is generally more effective than hot, dry summer weather.', source: SOURCES.weeds,
  },
  {
    name: 'Crabgrass', aliases: ['crabgrass', 'crab grass', 'large crabgrass', 'smooth crabgrass'],
    manual: 'Pull small clumps before they seed. Mature late-season plants are often better removed than sprayed.',
    chemical: 'A crabgrass-labeled post-emergent works best on young plants; ordinary broadleaf spray will not do.',
    timing: 'Prevent next spring before soil holds around 55°F for several days; air temperature is not soil temperature.', source: SOURCES.crabgrass,
  },
  {
    name: 'Nutsedge', aliases: ['nutsedge', 'nutgrass', 'yellow nutsedge', 'purple nutsedge', 'nut sedge'],
    manual: 'Remove young shoots repeatedly before five leaves; one pull leaves underground tubers. Fix wet spots.',
    chemical: 'Recurring patches need a sedge-specific product labeled for your grass, not ordinary broadleaf spray.',
    timing: 'Target young, actively growing shoots; repeated control is usually needed.', source: SOURCES.nutsedge,
  },
  {
    name: 'Ground ivy', aliases: ['ground ivy', 'creeping charlie'],
    manual: 'Lift small mats and all rooted runners; return for regrowth.',
    chemical: 'For established mats, choose a selective product that specifically lists ground ivy.',
    timing: 'Fall active growth is the usual treatment window; correct the thin, shady lawn too.', source: SOURCES.weeds,
  },
  {
    name: 'Plantain', aliases: ['plantain', 'broadleaf plantain', 'buckhorn plantain'],
    manual: 'Dig out the crown and roots after rain; scattered plants are manageable by hand.',
    chemical: 'Persistent patches respond to a plantain-labeled selective broadleaf treatment.',
    timing: 'Treat active growth, preferably in fall; address compacted soil during lawn repair.', source: SOURCES.weeds,
  },
  {
    name: 'Chickweed', aliases: ['chickweed', 'common chickweed'],
    manual: 'Pull shallow-rooted mats before seed sets. Small patches rarely justify spraying.',
    chemical: 'For large patches, check a chickweed-labeled selective broadleaf product.',
    timing: 'Target young growth in fall or early spring before flowering.', source: SOURCES.weeds,
  },
  {
    name: 'Spurge', aliases: ['spurge', 'spotted spurge', 'prostrate spurge'],
    manual: 'Wear gloves and lift young plants with the root before they seed.',
    chemical: 'Extensive young patches may justify a spurge-labeled selective treatment.',
    timing: 'Control young summer growth; prevention must precede germination.', source: SOURCES.weeds,
  },
];
