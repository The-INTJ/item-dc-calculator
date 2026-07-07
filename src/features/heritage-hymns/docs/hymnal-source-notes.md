# Heritage Hymns Hymnal Source Notes

This document records source material parsed from the supplied hymnal PDFs and
public copy documents. It is a reference for future page/content work.

## Source Use Rules

The material here has two different uses:

- Public source copy: text that can appear on the site when mapped directly into
  an appropriate page.
- Internal context: design, provenance, and book-production notes that help
  implementation decisions but should not be surfaced as website copy.

When adding public text, prefer importing from source files or existing content
modules rather than retyping from this summary.

## Brand And Book System

Title/brand strings appearing in source material:

- `HERITAGE HYMNS`
- `Treasures New & Old`

The subtitle comes from Matthew 13:52 and is central to the project: preserving
old and new treasures together, not choosing novelty over heritage or heritage
over faithful recent work.

The cover source indicates gray/graphite features intended for debossing. The
design brief ties the fleuron/ivy ornament to cover, spine, title page, and
Scripture-reference bullets.

Open item:

- One supplied title-page PDF appeared blank through attachment extraction.
  A Drive title page duplicate contained `HERITAGE HYMNS` and
  `TREASURES NEW & OLD`. Confirm with Jack/Melissa before treating the blank
  source as intentional.

## About Page Source

Primary source: `About Heritage Hymnal Company.pdf`.

Approved public concepts and sections:

- About Heritage Hymnal Company.
- Preserving a Legacy of Praise.
- Founded in 2026.
- Cultivating and sharing the treasury of congregational song entrusted to
  Christ's church.
- Hymns as living testimonies of biblical truth shaped by generations.
- A desire to place old and new treasures into the hands of churches, families,
  and individual believers.
- A hymnal that unites doctrinal depth with heartfelt devotion.
- Mission: preserve a legacy of praise through hymnals encouraging
  congregational singing rooted in Scripture, enriched by historic witness, and
  marked by reverence, joy, and theological fidelity.
- Treasures New & Old as the organizing conviction.
- Matthew 13:52 as the Scriptural anchor.
- The church need not choose between cherished hymns of the past and faithful
  songs of the present.

Guiding convictions:

- Scriptural Grounding.
- Congregational Focus.
- Thoughtful Curation.
- Historic Witness.
- Beautiful Craftsmanship.

Closing emphasis:

- The goal is not preservation on a shelf only, but hymns sung by families,
  churches, weary saints, and a new generation.
- The final idea is a legacy of praise.

Implementation note:

- The current `src/features/heritage-hymns/lib/content.ts` module holds the
  guiding convictions used by the UI. Keep it aligned with the approved source.

## Donate Page Source

Primary source: `Donate Content.docx`.

Approved public sections:

- Support the Work.
- Help Sustain This Ministry of Song.
- Hymnal preparation/publication involves planning, design, engraving,
  licensing, production, and distribution.
- Heritage Hymnal Company is a non-profit ministry grateful for churches and
  individuals who value faithful congregational singing.
- A tax-deductible gift may help offset production/licensing expenses, make
  hymnals available to churches and individuals with limited means, and support
  continued publication of faithful hymnals.
- Thank-you/partnership language.
- Psalm 102:18 as the closing Scriptural anchor.

Do not render:

- `[Form and Donate button probably go here.]`

Implementation note:

- Jack did not want recurring donations presumed. A future donation integration
  should make one-time giving the safe default unless he explicitly decides
  otherwise.

## Preface Source

Primary source: `Preface.pdf`.

Key content:

- Christians love to sing because truth received in the heart finds expression
  in praise.
- Throughout church history, believers have answered God's mercies with psalms,
  hymns, and spiritual songs.
- When the gathered church sings, it confesses, remembers, and proclaims truth.
- Present congregational singing joins a long company of saints who loved the
  same Savior, trusted the same promises, and rejoiced in the same gospel.
- Hymns instruct the mind, warm the affections, and strengthen the congregation.
- Heritage Hymns is offered under the subtitle Treasures New & Old, evoking
  Matthew 13:52.
- The aim is neither novelty nor nostalgia, but a rich store of congregational
  song in which ancient truths are freshly loved and sung.
- The hymnal should serve churches, families, and individual believers as a
  faithful companion in praise, preserving heritage, embracing present gifts,
  and directing singers to Christ.

Potential future use:

- About page extension.
- Hymnal page "inside the book" section.
- Homepage sample-page/peek-inside section.

Do not paraphrase this into new public prose without approval. Use source text
or approved excerpts.

## Acknowledgements Source

Primary source: `Acknowledgements.pdf`.

The acknowledgements thank God, songwriters, composers, copyright holders, and
the people whose work contributed to the project.

Board members listed:

- Jeremiah Bass.
- Jack Chandler, Jr.
- Timothy C. Guess.
- Jeremy D. Hunt.
- John Pyles.
- Michael A. Stewart.

Contributors listed:

- Rodney L. Chandler, Business Consultant.
- William R. Gatewood, Jr., Music Consultant.
- Dan Kreider / Hymnworks, Copyright Consultant & Liaison.
- Bryce H. Lowrance, Hymn Engraver, Music & Layout Consultant.
- Laura M. Pitney, Design Consultant.
- Peggy L. Stewart, Music & Design Consultant.
- Tori J. Stewart, Music Consultant.
- Greg A. Trupiano / Edge Book Printing Solutions, Inc., Print Consultant.

Implementation note:

- This is real source material but not currently mapped into public UI. Do not
  add a public credits/bios section unless requested.

## Sample Section Divider Source

Primary source: `Sample Section Divider.pdf`.

Section title:

- Redemption.

Parsed content describes Redemption as:

- The pinnacle of God's eternal design and work.
- Salvation from wrath, law, and death.
- The Lamb of God taking away the sin of the world.
- Christ's perfect obedience and sacrificial death.
- The "great exchange" of sin and righteousness.
- The old, old story of Jesus and His love.
- The finished work by which believers are forgiven and made new.

Scripture references in the divider:

- Colossians 1:13-14.
- Titus 3:4-7.
- 2 Corinthians 5:21.

Potential future use:

- If section pages or theme detail pages are built, the divider gives a model
  for section introductions and Scripture treatment.
- It should not be used as generic homepage copy unless Jack approves that
  reuse.

## Sample Hymn Spread Source

Primary source:
`Sample Hymn Spread (Color Applied during printing process).pdf`.

Parsed hymn/page details:

- Section: Call to Worship.
- Hymn 20: Come, People of the Risen King.
- Tune: Church of Christ Rejoice.
- Words & Music: Keith Getty, Kristyn Getty, Stuart Townend.
- Year: 2007.
- Meter: `8 7 8 7 9 7 8 6 with refrain`.
- Copyright line references Thankyou Music Ltd. and permission.

The facing page includes the chorus text for "Come, People of the Risen King"
and the beginning of:

- Opening Prayer, hymn/page 21.
- Tune: Costilla.
- Words & Music: C. E. Couchman.
- Year: 1985.
- Meter: `6 6 10`.

Implementation note:

- This confirms the site card data model's attention to section/theme, title,
  number, tune, words/music attribution, year/era, meter, first line, and chorus.
- Do not expose copyrighted lyric text beyond what is licensed/approved for the
  website.

## Home Page Notes Source

Primary source: `Home Page Notes.pdf`.

Home should feel like opening the hymnal and encountering a title page. The page
should be quiet, reverent, uncluttered, heritage-oriented, classical,
typographically driven, spacious, and timeless.

Image direction:

- Hero image: people in pews holding hymnals, with focus on hands/hymnals more
  than faces.
- Closing image: old wooden church interior, such as Cades Cove, communicating
  heritage and inheritance.

Later clarification:

- Jack questioned whether a middle section of sample hymn cards felt like fluff.
- He suggested a peek inside the hymnal or sample pages as a more natural home
  section, potentially connected to a future purchase path.

Implementation note:

- The current Home page should stay extremely disciplined with sourced text.
- Future sample-page presentation should use actual hymnal pages or approved
  content, not invented descriptions.

## Website/Admin And Quote Context

The WordPress admin email and external quote are operational/business context,
not local implementation source.

Capture only these facts in repo planning:

- The public domain `heritagehymnal.org` exists.
- The current site/host has WordPress context.
- A vendor quote considered broader scope: seven pages, commerce, donation
  platform, Gmail/social setup, analytics/SEO, hosting, and maintenance.
- Future production planning may need domain/hosting and commerce decisions.

Do not commit credentials or use them for this local route work.
