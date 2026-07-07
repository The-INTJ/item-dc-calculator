# Pilates Mentors — Design Preview

This feature owns the `/pilates-mentors` route: a static, zero-client-JS design
preview of the redesigned pilatesmentors.com homepage, built to collect client
feedback before the real rebuild starts (see `E:\Coding\MesaYoga` →
`docs/PLAN.md`, Milestone 0).

## What it is

- One server-rendered page implementing the approved design direction:
  editorial serif/sans (Fraunces + Inter), warm earth palette with a single
  clay accent, one-idea-per-band section rhythm, one CTA label sitewide.
- All copy and photography come from the live pilatesmentors.com (verbatim or
  lightly condensed). Testimonials are verbatim and attributed by role only —
  the source carousel doesn't pair names with quotes, so we don't guess.
- Every CTA links to the real live site so reviewers can click through.
- The route is `noindex` — it's a preview, not a public page.

## Where things live

- `content.ts` — every string on the page, typed constants.
- `components/PilatesMentorsDemo.tsx` — the page, sections top to bottom.
- `components/PilatesMentorsDemo.module.scss` — scoped styles. The custom
  properties on `.page` are the design tokens; they mirror the Tailwind v4
  `@theme` values planned for the production rebuild. Retheme = edit that
  block only.
- `app/(pilates-mentors)/` — route group: fonts + metadata + the route.
- `public/pilates-mentors/` — photography downloaded from static.showit.co.

## Constraints

- Self-contained and disposable: no imports from other features, no MUI, no
  global styles beyond what the route-group layout loads. Deleting this
  directory plus the route group and public assets removes the experience
  without trace.
- The host app's `body` styles (contest theme) are fully overridden by the
  `.page` wrapper — don't rely on anything global.
