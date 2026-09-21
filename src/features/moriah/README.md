# Moriah Primitive Baptist Church — Design Preview

A design preview of a refreshed moriahpbc.org, built to show the church
(Rodney Chandler, a deacon) what a modern version of their site could be.
Routes: `/moriah`, `/moriah/news`, `/moriah/directory`. All `noindex`.

## The copy rule — read this first

**Nothing on these pages is invented prose about Moriah, and no other
church's content or member data appears anywhere.** The audience is a pastor,
who will read invented copy as a claim about his congregation.

Every string in `content.ts` is one of three things, and each is marked:

| Marker | Meaning |
| --- | --- |
| `MORIAH` | Verbatim (or condensed) from moriahpbc.org. |
| `LABEL` | A short UI label we wrote — button text, a column heading. Never a claim about the church. |
| `EXAMPLE` | A structurally obvious stand-in, shown behind a visible on-page notice. |

If you add a string, mark it. Do not write new prose about Moriah.

### What is real

- The **thirteen Articles of Faith**, with their scripture references —
  verbatim from `MoriahArtofFaith.htm`.
- **Elder Bryson's own words** — the hero headline, the vision band, the
  pastor section, the pull quote — verbatim from `Pastor.htm`.
- The **full contact list** (pastor, six deacons, clerk), the church address,
  the pastor's address and phone — verbatim from `Contacts.htm`.
- The **sermon library entries**. These are not recordings: each one is built
  from an Article of Faith or a line of the pastor's page, using their own
  title phrase, their own scripture reference, and their own text as the
  summary. They carry **no dates and no preacher names** because the church
  publishes none, which is why the library sorts by title rather than date.
  The section says so on the page.

### What is an example, and says so on the page

- **Service times** render as `—`. Moriah publishes none anywhere. Filling
  these in is the first question to ask the church.
- **Calendar events** are generic (`Sunday Worship`, `Homecoming`) with `—`
  for times. No real dates are claimed.
- **Announcements** state facts about material the church already publishes
  (the bicentennial book, the Articles, the archive) and link to it.
- **Directory**: names and roles come from the published contact page, and
  Elder Bryson's phone and address are his real published ones. Cheryl Bryson
  is named on `Pastor.htm`. Every other number is a reserved `555-01xx`
  placeholder tagged as such in the UI, and **no household relationships are
  asserted beyond the Brysons**.

### What was deliberately removed

An earlier draft populated the lists from campcreek.church. That is all gone:
no Camp Creek sermons, news, events, service times, worship copy, or member
names — including the CCC pastor and anyone in his family. Do not reintroduce
any of it, and do not pull from `glow-ccc`'s member-only content
(`lib/content/fellowship.ts`, prayer lists) for any demo.

## Where things live

- `content.ts` — every string and every list, each marked with its source.
- `sermon-search.ts` — filter, book facet, highlight. Pure. No date sort,
  because the entries carry no dates.
- `calendar-grid.ts` — month-grid math, event bucketing, upcoming list. Pure.
  Dates are `YYYY-MM-DD` parsed at local noon; parsing them as bare ISO would
  render a day early west of Greenwich.
- `components/` — sections top to bottom. `MoriahDemo`, `MoriahNews` and
  `MoriahDirectory` are the three page shells. The only client components are
  `SermonLibrary`, `ChurchCalendar` and `DirectoryCards`.
- `components/MoriahDemo.module.scss` — scoped styles. The custom properties
  on `.page` are the design tokens. Retheme = edit that block only.
- `app/(moriah)/` — route group: fonts + metadata + the three routes.
- `public/moriah/church-aerial.jpg` — the church's own drone photo from the
  old site, resized 4000×3000 → 2200×1650 (5.1 MB → 0.6 MB).

## Directory interaction

Each household is a card; each member row expands in place. The expanded row
holds its own independent targets — a `tel:` link for the phone and a button
that opens the spouse's row and scrolls their card into view — so nothing is
nested inside another interactive element. Spouse links resolve across
households via an id map, not by surname.

## Design direction

The palette is **derived from the current site** rather than replacing it, so
the refresh reads as the same church:

- `--mo-rust` `#993300` is the old site's `<body link>` color, used verbatim,
  as the primary interactive color.
- `--mo-amber` descends from its `<body alink>` `#ff9900`, darkened to pass
  contrast as text; the full-strength original survives on the calendar's
  "today" ring, where it is only a border.
- `--mo-wood` comes from the mean of the tiled wood-grain background image
  (`#1d1d1d` — that texture is near-neutral charcoal, not brown). It grounds
  the pastor band and the footer, with display type reversed out of it, which
  is how the old site used it.
- `--mo-stone` warms the old `<body bgcolor>` `#cccccc` toward the paper.

Sampling the drone photo agreed with this: it averages warm olive (`#3a4029`)
and khaki (`#544c2c`), so the whole palette stays earthy. Type is Fraunces
(display) + Inter (body), both already vendored in this repo.

## Constraints

- Self-contained and disposable: no imports from other features, no MUI, no
  global styles beyond what the route-group layout loads. Deleting this
  directory, `app/(moriah)/`, and `public/moriah/` removes it without trace.
- The host app's `body` styles are fully overridden by the `.page` wrapper.
