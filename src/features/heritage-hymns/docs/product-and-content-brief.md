# Heritage Hymns Product And Content Brief

This document translates the client emails, Drive docs, parsed attachments, and
call notes into durable implementation guidance for the `/heritage-hymns`
feature.

## Product North Star

Heritage Hymns is a curated treasury of sacred song. The experience should feel
reverent, warm, scholarly, carefully tended, and quietly confident. Users should
feel invited into a well-kept collection, not sent to query a database or shop a
generic product catalog.

The search experience is the central product experience. Informational pages
support it, but the site is primarily about helping visitors discover, refine,
explore, and appreciate hymns.

## Audience And Emotional Target

Primary visitors are likely churches, families, pastors, musicians, and
individual believers who care about congregational singing. The interface should
respect their attention and make the collection feel trustworthy.

Desired feel:

- Reverent without being austere.
- Scholarly without feeling academic.
- Elegant without ornamentation.
- Traditional without appearing old-fashioned.
- Warm and inviting rather than institutional.
- Unhurried, restrained, simple, and beautiful.

Avoid:

- Commercial energy.
- Trendy effects.
- Busy controls.
- Cleverness for its own sake.
- Dense spreadsheet or database presentation.
- Decorative flourishes that do not carry meaning.

## Detail Sensitivity

Jack is highly detail oriented. Treat every visible element as something he may
read as intentional. This has practical consequences:

- Do not leave placeholder copy in public views.
- Do not show dev/prototype toggles, disabled mock flows, or explanatory
  scaffolding.
- Do not add unsourced connective copy to make a page feel complete.
- Prefer empty space over invented prose.
- If a page lacks approved copy, render only sourced headings or keep the page
  intentionally sparse.

## Visual System

The visual direction should extend the hymnal, not mimic a generic SaaS design.
That said, the implementation should steer away from dated 1990s web instincts
and toward a modern, restrained, MUI-informed UI treatment.

### Color

Hymnal color cues:

- Page ground: off-white/light ivory, closer to flour than heavy cream.
- Primary ink: black.
- Accent ink: plum.
- Cover: graphite/charcoal.

Site guidance:

- Plum is the primary accent for active states, small details, numbers, links,
  and meaningful emphasis.
- Plum must not dominate.
- Cream/ivory should remain readable with adequate contrast.
- Multiple shades of the core palette are fine; multiple unrelated accent
  colors are not.
- Soft gradients were in prototypes but should only survive if they disappear
  into the background. Avoid anything that reads as gimmick.

### Ornament

The fleuron/ivy ornament is part of the hymnal identity. It appears in the book
system on the cover, spine, title page, and Scripture references. The site can
use it as a brand/title-page signal, but it should feel like an anchor, not a
gaudy decorative stamp.

Current local assets live under `public/heritage-hymns/ornaments/`.

### Cards And Shadows

The current decision is to keep a card presentation. Jack originally worried
cards could feel cliched or commercial, but later feedback made room for a
tasteful card treatment.

Card requirements:

- Warm 1px border.
- Max 8px radius.
- Subtle layered vertical shadow inspired by modern MUI cards.
- No radial corner shadows.
- No dramatic glow.
- No dashboard/widget energy.
- Cards should support contemplation and hierarchy, not feel like commerce
  tiles.

### Pills

Pills are acceptable when they clarify hymn metadata and conserve space. They
should be small, quiet, editorial, and restrained.

Use pills for:

- Theme, era, tune, meter, or similar metadata where the chip form helps scan.
- Material availability indicators when real assets exist.

Avoid:

- Noisy selected-filter capsule trails.
- Commercial/tag-cloud energy.
- Oversized rounded labels.

## Typography

The type system has a deliberate relationship to the book:

- EB Garamond: brand/title-page moments only.
- Cardo: hymnal-specific content, especially hymn records and values.
- Inter: interface text, filters, buttons, labels, controls, forms, and utility.

Jack's metaphor for Inter is a librarian: it guides the user to the hymnal
content and then steps out of focus. Preserve that relationship.

Implementation notes:

- Do not use EB Garamond throughout normal content.
- Avoid Cardo bold for hymn titles/numbers. The hymnal uses normal Cardo with
  size/color contrast instead.
- Hymn labels should generally be Inter/all caps.
- Hymn values should generally be Cardo.

## Navigation

Public navigation should remain minimal:

- Hymns
- Hymnals
- About
- Connect
- Donate

`For Jack` is not public navigation.

Donate should appear as restrained plum text, not as a loud button. Header icons
from the prototypes were placeholders and should not be added without a real
purpose. A search icon would duplicate Hymns; account/cart icons require future
business decisions about order tracking, subscriptions, cookies, and security.

## Page Guidance

### Home

Home should feel like opening the hymnal. The first impression should be
classical, spacious, typographically driven, reverent, and uncluttered.

Approved current home text is limited to the sourced strings used by the parity
plan:

- `HERITAGE HYMNS`
- `Treasures New & Old`
- The approved descriptive line from source docs.
- `Explore the Hymns`
- The Matthew 13:52 closing language.

Current approved imagery:

- Hero: `Singing in the Pews.jpg`, rendered locally as
  `public/heritage-hymns/images/singing-in-the-pews.jpg`.
- Closing/heritage section: one of the Cades Cove church images.

Future home direction from Jack:

- The sample-card middle section may feel like fluff if it simply demonstrates
  site behavior.
- A peek inside the hymnal or sample pages may better communicate the book and
  may become the natural place for a future purchase button.
- If sample pages are introduced, use actual hymnal source material rather than
  invented explanation.

### Hymns

Hymns is the main search/refine experience. See
`search-and-card-ux.md` for detailed behavior.

### Hymnals

Hymnals is expected to become the order/purchase path, but the current local
feature has no approved body copy and no commerce architecture. Until those are
scoped, render sourced heading-level content only.

Do not invent:

- Product descriptions.
- Purchase instructions.
- Shipping notes.
- Availability claims.
- Pricing.
- Calls to action beyond approved text.

### About

About has approved source copy from `About Heritage Hymnal Company.pdf`. It
establishes the company, mission, Treasures New & Old theme, commitments, and
legacy of praise.

Do not add unsourced bios, staff notes, extra transitions, or invented section
copy. If board/contributor bios are requested later, source them separately.

### Connect

Connect is intended to house social follow/unfollow, blog/email subscription,
and contact-related features. The current repo has no approved public copy or
backend for those flows.

Render only sourced heading-level content until a future task provides:

- Social links.
- Email/news subscription mechanism.
- Blog/feed decision.
- Contact form or email destination.
- Privacy/subscription language.

### Donate

Donate has approved source copy from `Donate Content.docx`.

Implementation constraints:

- Do not show the bracketed form-placement note as public copy.
- Do not presume recurring donations.
- Do not imply tax handling details beyond the approved source language.
- Payment processing is not implemented in this local route.

### For Jack

`for-jack` can remain reachable only if needed for internal review, but it must
not appear in public navigation. Treat it as non-public/internal surface.

## Approved Assets

Local public assets for this feature live only under `public/heritage-hymns/`.

Images:

- `images/singing-in-the-pews.jpg`
- `images/cades-cove-church.jpg`
- `images/cades-cove-church-alt.jpg`

Ornaments:

- `ornaments/ivy-vine.svg`
- `ornaments/ivy-3-leaf.svg`
- `ornaments/ivy-4-leaf.svg`

Fonts:

- `fonts/eb-garamond-08-italic.ttf`
- `fonts/eb-garamond-12-italic.ttf`
- `fonts/eb-garamond-smallcaps-08-regular.ttf`

Cardo and Inter are loaded through the Heritage route layout.

## Content Discipline Checklist

Before adding or changing visible public text, confirm:

- Which source document or hymnal field supplies the text?
- Is the text exact, or has the client explicitly approved the adaptation?
- Is the text public-facing source material, not merely internal design notes?
- Would Jack understand this as final intentional copy?
- Is empty space better than unsourced prose here?

If the answer is unclear, do not add the text.

## Implementation Boundaries

Do not change these areas for Heritage work unless explicitly requested:

- `src/features/dc-calculator/`
- `app/(dc-calculator)/`
- Contest feature behavior
- Contest API handlers
- Firebase/auth/data providers

Do not infer full production-site architecture from the external quote or
WordPress thread. Those are future planning inputs, not current local route
requirements.
