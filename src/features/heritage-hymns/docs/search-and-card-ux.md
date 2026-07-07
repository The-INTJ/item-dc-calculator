# Heritage Hymns Search And Card UX

This document captures the search, refine, and hymn-card requirements from the
client notes and follow-up emails.

## Experience Goal

The Hymns tab should help visitors discover and shape the collection. It should
not feel like querying a database.

The collection is small enough to load locally: exactly 573 hymn entries. The
initial view should show the full list, and search/filter changes should update
the list immediately in the browser.

## Search Bar

The Hymns page should begin with a sticky search/refine bar close to the header.
Do not place large marketing or instructional text above it.

Exact search placeholder:

```text
Number, title, first line, chorus, tune name, or contributor
```

Search scans:

- Hymn number.
- Title.
- First line.
- Chorus first line.
- Tune name.
- Contributors.
- Era.
- Meter.
- Theme.

Matched rendered text should be highlighted where practical, especially when a
search term matches a contributor, title, first line, tune, or number.

Do not add:

- Search submit button.
- Apply filters button.
- Suggestions dropdown unless separately approved.
- Database/query language.
- Prototype explainer copy.

## Result Count And Sort

The result count belongs in the search bar area and should update immediately.
The initial count should be 573 hymns.

Sorting should be understated. Current sort options:

- Title.
- Number.
- Era.
- Tune.

Sort direction should be a compact icon/button control. Avoid noisy capsules.

## Refine Sidebar

The filter panel should be called Refine in its header. The external button may
still say Filters because users recognize that term.

Desktop behavior:

- Refine sidebar open by default.
- It can be toggled closed.
- It should feel pinned and stable.

Mobile behavior:

- Refine opens as a drawer.
- Search/results remain the primary surface.

Refine panel behavior:

- No per-option match counts.
- Category-level badges/counts may indicate selected filters.
- Selected options use restrained plum/check/weight treatment.
- Unselected options are quiet and black/neutral.
- Avoid radio buttons.
- Avoid selected-filter capsule trails above results.
- Clear All is small and secondary.

## Filter Categories

Current categories:

- Theme.
- Contributors.
- Era.
- Meter.

Future likely category:

- Scripture References.

Contributor options come from any author, editor, translator, composer,
arranger, or harmonizer represented in the Words/Music attributions. Sort by
last name where the catalog provides a sort name.

Era generally follows the hymn text date because visitors usually mean the words
when asking when a hymn was written. Deeper date complexity can appear in future
drilldown, not in the first-level filter.

Meter should use a manageable set of standard metrical names plus catch-all
groups. Avoid making visitors scan a long algebra-like list of numeric meters.

## Filter Logic

Implementation logic:

- OR within a category.
- AND across categories.

User-facing mental model:

- Visitors are shaping the collection, not building Boolean queries.

Do not expose Boolean terminology in the UI.

## Theme Structure

Theme order follows hymnal order, not alphabetic order.

Parent themes with children are not selectable as direct filter values. They
toggle their child themes as a group:

- If all children are off, selecting the parent turns all children on.
- If any child is on, selecting the parent turns the group off.
- Children remain individually toggleable.

Canonical theme structure from the design brief:

```text
Call to Worship
Adoration & Praise
God's Perfections
  God's Eternity
  God's Immutability
  God's Independence
  God's Omnipresence
  God's Omniscience
  God's Sovereignty
  God's Faithfulness
  God's Forgiveness
  God's Goodness
  God's Grace
  God's Holiness
  God's Justice
  God's Love
  God's Lovingkindness
  God's Mercy
  God's Patience
  God's Righteousness
  God's Truthfulness
God's Word
The Holy Trinity
God the Father
God the Son
  The Person of Christ
  The Incarnation
  The Savior's Sacrifice
  The Risen Lord
  Christ's Return
  The Reigning King
God the Holy Spirit
Creation
Providence
Redemption
The Christian Life
  Conversion & Calling
  Prayer
  Faith & Dependence
  Assurance & Security
  Devotion to Christ
  Gratitude & Thanksgiving
  Hope & Heaven
The Church
  The Bride of Christ
  Christian Mission
  Christian Community
  Baptism
  The Lord's Supper
  Revival
Benediction
Evening Meditations
```

In code, preserve parent/child depth rather than flattening all themes into
visually identical choices.

## Result Presentation

Use stacked editorial cards for results. The cards should be device-neutral and
work across desktop and mobile.

The card should feel like a hymn record, not a product tile.

Card shell:

- Warm 1px border.
- Subtle layered vertical shadow.
- Max 8px radius.
- No radial/corner shadows.
- No dramatic glow.

Data hierarchy:

1. Hymn number.
2. Hymn title.
3. Primary theme and available materials.
4. Words/Music attributions.
5. First Line/Chorus.
6. Era/Tune/Meter detail rail.

Data should become quieter and smaller as the card descends, without implying
that lower content is unimportant.

## Hymn Number And Title

Hymn number:

- Cardo.
- Plum.
- Slightly larger than the title, following hymnal logic.
- Avoid Cardo bold.

Title:

- Cardo.
- Black/primary ink.
- Normal weight.
- Wrap cleanly with hanging/intentional alignment where possible.

Theme:

- Can be a quiet pill if it helps scan.
- Should not overpower the number/title.

## Attribution Rows

Always show separate rows:

- WORDS
- MUSIC

Do not collapse identical attributions into "Words & Music" in the current
card. Jack clarified after discussion that repeating the Music row gives better
stability and communicates the data more clearly.

If Words and Music are identical:

- Repeat the Music value.
- Render the repeated Music value in a quieter style.
- Do not use "same as above."
- Do not use a modern/minimal icon in place of repeated text.

Labels:

- Inter.
- All caps.
- Utility/interface voice.

Values:

- Cardo.
- Hymnal voice.

Public domain badges:

- Words and Music may be public domain independently.
- Badges should stay quiet and attached to the relevant row.

Additional contributor roles:

- Editors, translators, arrangers, and harmonizers may appear as additional
  attribution data where the catalog exposes them.
- Keep the hierarchy clear. Do not bury Words/Music under miscellaneous credit
  labels.

## First Line And Chorus

Always show:

- FIRST LINE
- CHORUS

When a hymn has no chorus, the Chorus row should remain present with an
intentional empty value. The absence of a chorus is information, and the stable
row structure matters on desktop.

Styling:

- First Line and Chorus should share a visual pair treatment.
- Chorus may use italic Cardo when present.
- No underscores or placeholder dashes unless explicitly approved.

## Detail Rail

The lower card rail may use quiet pills for:

- Era.
- Tune name.
- Meter.

These pills are acceptable because they clarify metadata and conserve space.
Keep them restrained and editorial.

## Material Links

Future materials may include:

- MIDI learning recording.
- Congregation recording.
- Public-domain PDF.

Material icons should appear only when real material exists. When present, they
should always follow a stable order. Day-one data may legitimately have zero
available material links.

## Empty Results

If search/filter choices yield no results, public copy must still follow the
content discipline rule. A simple Clear All action is acceptable when filters
are active. Do not invent friendly explanatory prose unless approved.

## Accessibility And Responsiveness

Preserve:

- Real form labels or accessible hidden labels.
- Keyboard-operable filters and sort controls.
- Visible focus states that fit the restrained style.
- Text wrapping in card rows without overlap.
- Stable card dimensions and spacing as data changes.
- Mobile drawer behavior for Refine.

The desktop preference for label alignment is strong, but mobile may need a more
practical stacked layout if the data would otherwise cramp or overlap.

## Regression Tests To Keep

Tests should protect:

- Public nav excludes `For Jack`.
- Exact search placeholder.
- 573-entry initial count.
- Instant local search behavior.
- Removed prototype/list-card toggle controls.
- OR-within/AND-across filter behavior.
- Parent theme group toggling.
- Words and Music rows are separate.
- Duplicate Music row uses quieter styling.
- Chorus row renders even when empty.
- Placeholder/prototype copy does not appear in public UI.
