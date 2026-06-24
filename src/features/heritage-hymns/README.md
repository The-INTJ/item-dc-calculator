# Heritage Hymns Demo

This feature owns the sendable `/heritage-hymns` prototype.

## Boundaries

- Client-only demo experience.
- Dummy catalog data only.
- No Firebase, API routes, auth, cart, checkout, or persistence.
- Keep this feature isolated from the contest app and the frozen DC calculator.

## Behavior

- The catalog contains exactly 573 generated hymn entries.
- The bare `/heritage-hymns` route renders the Home tab; other prototype tabs use
  the `tab` query parameter.
- Search scans hymn number, title, first line, chorus first line, tune name, and contributors.
- Filter selections are OR within a category and AND across categories.
- Sort options are title, hymn number, era, and tune.

## Prototype Tabs

- `/heritage-hymns`: Home
- `/heritage-hymns?tab=hymns`: search and refine experience
- `/heritage-hymns?tab=hymnals`: hymnal orders placeholder
- `/heritage-hymns?tab=about`: supplied company/about copy
- `/heritage-hymns?tab=connect`: connection placeholder
- `/heritage-hymns?tab=donate`: donation placeholder
- `/heritage-hymns?tab=for-jack`: implementation notes for Jack

## Design Notes

The visual system follows the supplied Heritage Hymns brief: ivory paper, black ink,
restrained plum accents, Cardo for hymn-specific content, and Inter for interface
controls. Result records should feel editorial and collected, not like product tiles
or database rows.
