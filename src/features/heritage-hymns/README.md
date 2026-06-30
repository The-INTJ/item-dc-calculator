# Heritage Hymns Demo

This feature owns the sendable `/heritage-hymns` prototype.

## Boundaries

- Client-only demo experience.
- Prototype catalog data only.
- No Firebase, API routes, auth, cart, checkout, or persistence.
- Keep this feature isolated from the contest app and the frozen DC calculator.

## Behavior

- The catalog contains exactly 573 prototype hymn entries: a handcrafted set of traditional
  hymnal-style records plus generated filler records.
- The bare `/heritage-hymns` route renders the Home tab; other prototype tabs use
  the `tab` query parameter.
- Search scans and highlights rendered hymn data including number, title, first line, chorus first
  line, tune name, contributors, era, meter, and theme.
- Dynamic search suggestions can be hidden without disabling result filtering or highlighting.
- Search suggestions use typography-coded rows without visible field labels.
- Filter selections are OR within a category and AND across categories.
- Theme parent rows toggle their child themes as a group; only child themes are filter values.
- Sort options are title, hymn number, era, and tune.
- Hymn results default to a white card style and can switch back to the original editorial list
  style.
- The white card style is borderless, subtly lifted, and uses middle-aligned metadata labels on
  desktop with stacked labels on mobile.
- Prototype-only search/layout toggles live in a separate controls strip above the search bar.
- Hymn records carry placeholder rights metadata for independent words/music public-domain badges.
- Optional MIDI, congregation-recording, and PDF material flags are modeled but absent from the
  day-one catalog.

## Prototype Tabs

- `/heritage-hymns`: Home
- `/heritage-hymns?tab=hymns`: search and refine experience
- `/heritage-hymns?tab=hymnals`: hymnal orders placeholder
- `/heritage-hymns?tab=about`: supplied company/about copy
- `/heritage-hymns?tab=connect`: connection placeholder
- `/heritage-hymns?tab=donate`: support copy with a mock Donate button and "Working on it!" modal
- `/heritage-hymns?tab=for-jack`: implementation notes for Jack

## Design Notes

The visual system follows the supplied Heritage Hymns brief: ivory paper, black ink,
restrained plum accents, Cardo for hymn-specific content, and Inter for interface
controls. Result records should feel editorial and collected, not like product tiles
or database rows.
