# Heritage Hymns Context And Sources

This document records the client context behind the local `/heritage-hymns`
experience. It is implementation documentation for this repository, not public
website copy.

## Source Hierarchy

Use these sources in this order when making product decisions:

1. Jack Chandler's direct emails and attached source documents.
2. Google Drive documents that duplicate or supersede the email attachments.
3. The local 573-entry hymnal catalog already in this repo.
4. Explicit follow-up decisions from calls or user notes in this thread.

Visible public UI copy has a stricter rule: it must come from approved public
copy documents or hymnal data. Do not turn these internal notes into public
phrases, captions, connective paragraphs, empty-state copy, prototype labels, or
marketing copy.

## Current Repo Scope

The implementation target is the standalone Next.js route at `/heritage-hymns`.
It is client-only, catalog-only, and isolated from the contest app and the
legacy DC calculator.

WordPress, domain hosting, shopping carts, account profiles, Stripe,
ShipStation, GiveButter, Google Analytics, social media setup, and email-brand
configuration appear in the broader business context, but they are not part of
the current repo implementation unless a future task explicitly scopes them.

## Source Timeline

### 2026-06-10: Hymnal Page Samples

Jack originally sent sample hymnal pages on June 10, later forwarded again in
the "Heritage Hymns" thread. The email included book-facing PDFs:

- Cover: `Cover (Gray features to be debossed).pdf`
- Inside title: `Title Page (Inside).pdf`
- Title page duplicate in Drive: `00 - Title Page.pdf`
- Preface: `Preface.pdf`
- Acknowledgements: `Acknowledgements.pdf`
- Section divider: `Sample Section Divider.pdf`
- Hymn spread: `Sample Hymn Spread (Color Applied during printing process).pdf`

Implementation meaning:

- The website should feel like an extension of the hymnal, not a separate
  product site with a disconnected style system.
- The cover/title/fleuron vocabulary matters: graphite/charcoal cover,
  debossed ornament, scaled title-page ornament, and restrained plum accents.
- The sample hymn pages show Cardo as the hymnal content voice and plum/cyan
  accent placement. Jack later noted the cyan is not final and should become
  the official plum or a selected blue.

### 2026-06-22: Prototype Springboards

Jack sent two PowerPoint prototypes described as springboards for discussion:

- A card metaphor prototype for search results.
- A flatter editorial presentation prototype.

He emphasized that the prototypes should communicate mood and direction more
than lock every detail. The current user direction after the follow-up call is
more concrete: keep the card look, but modernize the shadow treatment and avoid
the radial corner shadows.

Implementation meaning:

- Treat prototype specifics as design evidence, not final authority.
- Treat call decisions and later written clarifications as higher precedence
  where they differ from the earliest prototype.
- Jack is detail oriented and may read any visible screen as an intended
  deliverable. Avoid visible placeholder copy, "prototype" explanations, or
  invented filler.

### 2026-06-24: Design Brief, Home Notes, About Copy

Jack sent revised notes and public/about content:

- `HeritageHymnal Prototype Notes.pdf` / Drive duplicate
  `HeritageHymnal Prorotype Notes.docx`
- `Home Page Notes.pdf`
- `About Heritage Hymnal Company.pdf`

The design brief is the primary source for visual system, navigation,
search/refine philosophy, typography, theme structure, and card-vs-flat
thinking. The Home Page Notes define the home-page feel and imagery. The About
document supplies approved public copy for the About page.

Implementation meaning:

- Use the design brief as product/design context.
- Use the About document as public copy source.
- Do not use the design brief's internal explanation as public page copy.

### 2026-06-24: Working Prototype Sent

Drew sent Jack a working prototype link and clarified that only search was
prototyped. Header links did not work yet.

Implementation meaning:

- Any old "prototype" controls or explanations in the public UI should be
  removed.
- The public route should behave like an actual local experience, even if
  future commerce/content pages are intentionally sparse.

### 2026-06-26: Jack's Detailed Critique

Jack responded with a detailed critique of the working prototype.

Key implementation decisions from this critique:

- The colors were directionally right: plum, ivory/cream, graphite/charcoal.
  Cream contrast and readability still need careful review.
- The top marketing text on the search page should be removed. The search page
  should begin with the sticky search/refine bar near the header so more hymns
  are visible.
- The search page should not feel like a database query page.
- The Refine panel should avoid per-option match counts.
- Selected filter options should read as selected through checkmark/color/weight,
  not radio buttons.
- Parent theme rows with children should not themselves be selectable; they
  toggle their child themes as a group.
- The result count belongs in the search bar area, not as a large "Full
  Collection" header.
- The card/flat question remained open then, but Jack was persuadable about
  cards when handled quietly.
- Card content should have a clear hierarchy, with hymn number/title/theme first
  and detail rows stepping down in weight.
- Search sorting should be a quiet picklist with direction control, not noisy
  capsules.

Later call/user direction supersedes the earliest no-shadow instinct: preserve
the card presentation, but replace radial/corner shadows with a modern
MUI-informed layered vertical shadow, a warm 1px border, and max 8px radius.

### 2026-06-29: Donate Copy

Jack sent `Donate Content.docx`.

Implementation meaning:

- The Donate page has approved source copy.
- The bracketed note about where a form/button probably goes is an authoring
  note, not public copy.
- Jack specifically did not want recurring donations presumed.

### 2026-06-30 To 2026-07-03: Cards And Images

In the "Cards and more" thread, Jack supplied licensed site images and clarified
card/data behavior. The user also supplied the three image files locally, so the
OneDrive image link does not need to be visited.

Approved local image assets:

- `public/heritage-hymns/images/singing-in-the-pews.jpg`
- `public/heritage-hymns/images/cades-cove-church.jpg`
- `public/heritage-hymns/images/cades-cove-church-alt.jpg`

Key card decisions:

- Data should get quieter and smaller as the user moves down the card.
- Data pairs should share color/size: Words/Music, First Line/Chorus.
- Labels should use the interface voice, generally Inter and all caps.
- Values should use the hymnal voice, Cardo.
- Keep separate Words and Music rows.
- When Words and Music are identical, repeat Music in a quieter style rather
  than collapsing it or using "same as above."
- Always show the Chorus row. When absent, the blank row is intentional
  information, especially for desktop card stability.
- Pills are acceptable if tasteful, quiet, and clarifying. Avoid noisy selected
  filter capsule clutter.

Home-page follow-up:

- Jack worried the middle sample-card section might feel like fluff.
- He suggested showing a peek inside the hymnal or sample pages as a more
  natural home-page section, possibly where a purchase button belongs later.
- Melissa liked using the Design Brief sensibility on the homepage to give
  visitors a taste of the project.

### 2026-07-01: Website Admin Context

Jack forwarded WordPress admin context for the existing `heritagehymnal.org`
site and noted that the current registered-agent hosting is WordPress-oriented.
He invited recommendations about domain transfer or hosting changes if the
current platform is not functional or responsive enough.

Implementation meaning:

- Do not store credentials in the repo.
- Do not inspect, migrate, or plan against WordPress for the current task.
- Capture this only as external operational context: the public domain exists,
  the current host may be limited, and a future deployment plan may need to
  revisit hosting.

### 2026-07-02: External Website Quote

Drive contains `Heritage Hymnal Website Quote 070226.pdf`, an external vendor
quote for a broader public website. The quote mentions a seven-page responsive
site, e-commerce, 573-hymn search, GiveButter donation integration, Gmail and
social media setup, Google Analytics/SEO, hosting, and maintenance.

Implementation meaning:

- This establishes broader business expectations, not current repo scope.
- The local Next implementation currently covers the Heritage Hymns experience
  and 573-entry search, not full e-commerce or donor platform integration.
- If future work adds commerce/donation integrations, it should be scoped as a
  new architecture task rather than inferred from the local prototype.

## Non-Negotiable Content Rule

Jack distinguishes poorly between "this is a prototype" and "this is what the
developer thinks I want." Therefore, public UI must not contain invented text.

Allowed public text sources:

- Approved About page copy.
- Approved Donate page copy.
- Approved Home copy from Home notes and user parity plan.
- Hymnal data in the 573-entry catalog.
- Hymnal book source material only when explicitly mapped into a page.

Disallowed public text:

- Placeholder paragraphs.
- "Working on it" copy.
- Prototype disclaimers.
- Decorative captions.
- Connecting phrases invented to make a page feel fuller.
- Empty-state prose that is not sourced.

Internal docs may summarize email context, as this document does.

## Open Decisions

- Final official plum value and whether any final blue joins it.
- Final branding art/fleuron sizing and exact title-page ornament treatment.
- Whether the inside title page is intentionally blank in one supplied PDF.
- Whether sample hymnal spreads become public homepage content.
- Whether the future public site needs account/order tracking.
- Whether cart/checkout uses cookies and whether cookie notices are needed.
- Whether donation processing uses GiveButter or another platform.
- Whether commerce uses Stripe, ShipStation, or a different path.
- Whether the production domain stays on WordPress hosting or moves elsewhere.
