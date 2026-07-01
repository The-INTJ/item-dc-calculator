# Heritage Hymns

This feature owns the local `/heritage-hymns` Next.js experience.

## Boundaries

- Client-only Heritage Hymns surface.
- Local 573-entry hymnal catalog/search data.
- No WordPress inspection, migration, configuration, or planning.
- No Firebase, API routes, auth, cart, checkout, or persistence.
- Keep this feature isolated from the contest app and the frozen DC calculator.
- Visible content should come from Jack's emails, Drive docs, approved assets, or hymnal data.

## Assets

- Public Heritage assets live under `public/heritage-hymns/`.
- Photos are rendered with `next/image`.
- Drive ivy SVG ornaments are used for brand/title decoration.
- EB Garamond files are loaded from `public/heritage-hymns/fonts/` for brand and title-page moments.
- Cardo remains the hymn-record typeface; Inter remains the interface typeface.

## Behavior

- The catalog contains exactly 573 local hymn entries.
- The bare `/heritage-hymns` route renders Home.
- Public navigation links are Hymns, Hymnals, About, Connect, and Donate.
- `for-jack` is not a public tab; unknown tab values normalize to Home.
- Search scans and highlights rendered hymn data including number, title, first line, chorus first
  line, tune name, contributors, era, meter, and theme.
- Search results update immediately in the browser without a suggestions dropdown.
- Filter selections are OR within a category and AND across categories.
- Theme parent rows toggle their child themes as a group; only child themes are filter values.
- Sort options are title, hymn number, era, and tune.
- Results render as editorial cards with a warm border, subtle layered vertical shadow, and a
  maximum 8px corner radius.
- Hymn cards always render separate Words, Music, First Line, and Chorus rows.
- When Words and Music contributors match, Music repeats in a quieter style.
- Static pages only render sourced copy. Hymnals and Connect currently render headings only.

## Routes

- `/heritage-hymns`: Home
- `/heritage-hymns?tab=hymns`: search and refine experience
- `/heritage-hymns?tab=hymnals`: Hymnals heading
- `/heritage-hymns?tab=about`: supplied company/about copy
- `/heritage-hymns?tab=connect`: Connect heading
- `/heritage-hymns?tab=donate`: supplied support copy
