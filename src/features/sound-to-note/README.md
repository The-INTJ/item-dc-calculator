# Sound To Note — website mock

A click-through of the planned resume and booking site for **Alex Ferré**, a
production audio mixer in Atlanta, GA. **Sound To Note** is his business name.
It implements the website UI kit from the Sound To Note design system in Claude
Design (project `280aec11-…`), using the design's tokens, components and copy.

**One route, `/sound-to-note`, with `?page=` selecting the body**: home, work,
gear, about, links, contact. As with the Moriah previews, the nav navigates for
real: the URL, tab title and back button all change. Every other state is in
the URL too:

| Param | Effect |
| --- | --- |
| `?page=work&type=series` | Work filtered to one project type (chips are links) |
| `?page=contact&service=post,consultant` | Booking form with those services pre-checked |

An unknown `?page=` falls back to home. The whole mock is `noindex`.

## What is real and what is a placeholder

- **Real, from Alex's brief:** his name, the brand, email, location, "7 years"
  and the trombone. The voice (first person, plain English, dry stickers) is
  the design system's.
- **Real, from Alex's notes (Oct 2026):** the home intro, the whole gear list,
  the About copy, his Instagram, IMDb and Shugah Munny links, the service list
  (production mixer, post sound, consultant, other: **no equipment rental**)
  and the booking questions (dates first, project type, sound team, rate).
  He asked for **no phone number anywhere**; email and Instagram only.
- **Placeholders, carried over from the design:** every project credit
  ("Project Title One") and every testimonial. Alex is collecting real quotes;
  on the About page each one sits on a photo of him working that job.
- **No photos yet**, so every image is the design's striped `PhotoFrame`
  with a label saying what belongs there.

## How it works

- `content.ts` holds every string and list. `routes.ts` holds the page keys
  and the parsers for `?page`, `&type` and `&service`.
- `styles/site.module.scss` holds the design tokens, scoped to the `.site`
  wrapper so they never leak into the rest of the app. Light mode is
  `.site[data-theme='light']`.
- **Theme:** `data-theme` is never a React prop. An inline boot script in
  `SiteShell` applies the stored choice before paint, and `ThemeToggle`
  flips it and saves it to `localStorage`. The sun/moon swap is pure CSS.
- **Fonts:** Archivo (on the `wdth` axis at 125%, standing in for the logo's
  unidentified wordmark), Instrument Sans and JetBrains Mono, all through
  `next/font/google` in `fonts.ts`.
- **Icons:** Lucide via a CSS mask from unpkg, as the design system does.
  Lucide is a substitute, since the brief shipped no icon set. The mobile
  menu's menu/X glyphs are inline so the X never shows blank on first open.
- **Booking** has no backend. Submitting validates the required fields, opens
  the visitor's mail app with a prefilled email to Alex, then shows a "check
  your email app" state.
- "Behind the scenes" stories are native `<details>`, so they work without JS.
