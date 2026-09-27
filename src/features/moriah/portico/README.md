# Moriah — the Portico preview (`/moriah-2`)

A second, bespoke direction for moriahpbc.org. Where `/moriah` is a clean
modern church site, the Portico builds every page out of **Moriah's own
front**, as it stands in the church's photograph:

| On the building | On the site |
| --- | --- |
| The porch gable: double rake, dark roof sliver, clapboard, round louvered vent | The header. The vent is the home link; its louvers part and glow on hover. Inner pages set their title in the tympanum. |
| The beam under the gable | The frieze carries the name in raised letters; the architrave below carries the nav and sticks to the top of the window. |
| Two **square** columns with capped tops and plinth bases | Stand along both sides of every page, pure CSS (sticky inside `<main>`), and come to rest on the porch floor at the foot of the page. |
| White six-panel double doors in a white casing | The home page's entrance, and the only button shape on the site (a raised door panel). |
| Red running-bond brick, lit windows, the carriage lantern, the steps and iron rails | The porch wall on the home page, the brick bands between rooms, the footer's footing and steps. |
| The church's trees at dusk | The header backdrop — cut from their own photograph and blurred. |

## The idea the home page acts out

Elder Bryson's page says: *"I pray that, by the Grace of God, Moriah's light
will compel those in darkness to come in and find rest for their souls, in
the finished work of Christ."* The home page is that sentence, staged: the
porch at dusk, then — as the reader scrolls — the doors swing open, light
falls down the steps, the view walks up and through the doorway, the light
fills the screen, and that sentence is what is written in it. Clicking the
door makes the same walk on its own. Everything after the doors is "inside",
set on that light.

## The copy rule — stricter than v1

Read `../README.md` first; everything there applies. On top of it:

- **Nav labels are the live site's own**: Pastor, Our Faith, Sermons,
  Calendar, Contact, Directions, and "200 Years of Blessing". The page set
  follows the live site's structure, so v1's invented pages (blog, give,
  directory, news) are not here.
- **No invented events.** The live `Calendar.htm` lists none, so the Portico
  calendar carries none — only today's pane is lit, and a notice says why.
  (Even "Sunday Worship" every week would be a claim: many Primitive Baptist
  churches meet on set Sundays of the month.)
- **No written section labels** like v1's "Singing together". Every heading
  on the Portico is one of the church's own ("The Ministry", "The Vision",
  "The Message", "My Fathers in the Ministry", "Articles of Faith",
  "Contact Us", "Church Address").
- The pastor's page is reproduced **whole**, in its own order, including
  "My Fathers in the Ministry" with the photograph it says is "pictured below".
- **One word changed**: the site reads "The 'bookends' of our doctrine *our*
  simple". We print "are". Revert in `content.ts` if the church prefers.

Strings live in `content.ts` (this folder) and `../content.ts` (shared with
v1), each marked `MORIAH`, `LABEL` or `NOTICE`.

## Where things live

- `routes.ts` — the page keys, `?page=` parsing, titles, and the nav.
- `pediment-geometry.ts` — the gable drawn from one pitch (26°, the photo's)
  and band offsets; `Gable.tsx` renders it.
- `threshold-phases.ts` — pure: scroll progress → door, walk, light, words.
  Tested in `threshold-phases.test.ts`.
- `threshold-driver.ts` — the browser side: one rAF-throttled scroll handler
  writing three custom properties and one transform. No React.
- `use-threshold-scroll.ts` — wires the driver to the home page's elements.
- `components/` — one component per architectural piece, each with its own
  SCSS module. `Portico.module.scss` holds every token; `_type.scss` holds
  the inscription and display type mixins and the scroll-tied reveal.
- `public/moriah/portico/` — `brick.svg` (a generated seamless running-bond
  tile), `grain.svg`, and `trees.jpg` (the top of the church photo, blurred).
- `public/moriah/pastor-and-wife.jpg`, `fathers-in-the-ministry.jpg` — the
  two photographs from `Pastor.htm`.

## Motion and reverence

- Everything eases out over 0.9–1.5s. Nothing bounces, springs or loops.
- The door's scroll angle (`--open`) and its hover (`--ajar`, a registered
  `@property` so it can transition) add, so hovering eases the doors ajar
  without fighting the scroll.
- Rooms rise into place tied to scroll, not time, and finish within 260px
  of entering, so a tall room is never half-faded while being read.
- **`prefers-reduced-motion: reduce`**: no pinning, no walk, no reveals. The
  door stands slightly open with its light on the steps, and the prayer sits
  beneath it on the page.

## Layout notes

- Horizontal centring inside the porch scene uses `calc()` on `left`, never
  `translate` — the walk measures the doorway with `offsetLeft/Top`, which
  ignore transforms.
- The door sizes itself to the first screen under the gable
  (`--header-h` estimates the gable's height from its fixed pitch) and, on a
  narrow porch, small enough to keep the lantern and rails in view.
- Full-page screenshots misrepresent this page (the viewport grows, and every
  `dvh` with it). Capture at real scroll positions instead.
