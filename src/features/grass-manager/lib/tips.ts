import type { TipCard } from './types';

/** Durable starter cards. Persisted AI-written cards can override these by id. */
export const GRASS_TIP_CARDS: TipCard[] = [
  {
    id: 'donor-patch',
    title: 'Turn the good grass into a donor patch',
    summary: 'Your best grass is evidence. Protect it, measure it, and expand from it in small tests.',
    body: 'Mark a 3 × 3 ft square in the healthiest patch. Photograph the blades and soil, then use that square as your baseline. Once the target area has good soil contact and consistent moisture, move plugs, runners, or matching seed outward one small square at a time. Do not strip the donor patch bare; healthy expansion beats a dramatic one-day repair.',
    category: 'grow',
    tags: ['strong grass', 'expansion', 'donor patch'],
  },
  {
    id: 'movable-sprinkler',
    title: 'Make one sprinkler act like a system',
    summary: 'Measure coverage instead of guessing, then work the yard in a repeatable route.',
    body: 'Put straight-sided cans or tuna cans in each zone, run the sprinkler for 10 minutes, and compare the depth. Start with the sunny front square, then the side strips, then the back lawn. Move the sprinkler only after the planned pass is complete and overlap the edges. On the hill, use shorter cycles with a soak-in pause so the water stays in the root zone.',
    category: 'water',
    tags: ['sprinkler', 'catch cups', 'hill'],
  },
  {
    id: 'shade-is-a-zone',
    title: 'Shade is a separate lawn climate',
    summary: 'Treeline shade changes grass choice, root competition, and how quickly the soil dries.',
    body: 'Do not compare the treeline edge with the sunny front square as if they were the same lawn. Check the shade zone at midday, look for tree-root competition, and favor shade-tolerant grass or a deliberate bed edge. More fertilizer will not create missing sunlight, and extra water can make a weak shade zone disease-prone.',
    category: 'sun',
    tags: ['treeline', 'shade', 'roots'],
  },
  {
    id: 'weeds-before-spray',
    title: 'Name the weed before reaching for chemicals',
    summary: 'A weak lawn invites weeds; a mystery spray can make both problems harder.',
    body: 'Log the weed type, take a close-up photo, and read the label for your grass species before applying anything. Avoid spraying drought-stressed or freshly seeded grass. Treat one small test area first, record the date and product, and respect the label interval before repeating. Thickening the lawn and correcting bare soil is part of the weed plan.',
    category: 'weeds',
    tags: ['identification', 'herbicide', 'test plot'],
  },
  {
    id: 'fertilizer-is-not-rescue',
    title: 'Fertilizer is not a rescue button',
    summary: 'If growth is stalled, check soil, light, compaction, and water distribution first.',
    body: 'Before adding another application, ask which constraint is actually limiting growth. A soil test can reveal pH or nutrient issues, while a screwdriver test reveals compaction. Apply only the product and rate the label supports for the grass type and season. Excess nitrogen can make weeds and disease more vigorous while the roots remain shallow.',
    category: 'soil',
    tags: ['soil test', 'fertilizer', 'compaction'],
  },
  {
    id: 'sunny-front-test',
    title: 'Use the front square as your experiment plot',
    summary: 'A small visible zone lets you learn what works before spending energy on the whole wraparound yard.',
    body: 'Measure the front square, remove obvious debris, loosen compacted soil, and choose one repair approach. Keep the seed, water, mowing, and weed-control routine consistent for three weeks. Photograph it from the same angle. If the small plot improves, repeat the recipe in the next zone; if it fails, you have contained the lesson.',
    category: 'grow',
    tags: ['experiment', 'front yard', 'measure'],
  },
  {
    id: 'morning-water',
    title: 'Use the morning window',
    summary: 'Deep, measured watering before the heat builds is usually kinder to the lawn than a late-night splash.',
    body: 'Aim for the morning window after sunrise and before the day heats up. Avoid leaving foliage wet overnight when you can. Pause when water starts to run off, especially on a slope, and let it soak in before the next pass. The manager uses the forecast, sunset, slope, and last watering log to make this timing concrete.',
    category: 'water',
    tags: ['sunrise', 'sunset', 'timing'],
  },
];

export function mergeTipCards(overrides: TipCard[]): TipCard[] {
  const merged = new Map(GRASS_TIP_CARDS.map((card) => [card.id, card]));
  overrides.forEach((card) => merged.set(card.id, { ...merged.get(card.id), ...card }));
  return [...merged.values()].filter((card) => card.title && card.summary && card.body);
}
