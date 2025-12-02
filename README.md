# Item DC Calculator (Next.js)

A Next.js app router project that hosts the D&D item DC calculator UI. The calculator is rendered as a client component and persists data in `localStorage`, mirroring the original SPA behavior.

## Getting started
- Install dependencies: `npm install`
- Run the dev server: `npm run dev`
- Lint: `npm run lint`
- Build for production: `npm run build` then `npm start`

## Project layout
- `app/` — Next.js entry points. `page.tsx` renders the calculator; `layout.tsx` loads global SCSS once for the whole app.
- `src/` — Calculator components, styles, and utility logic preserved from the Vite project.
- `public/` — Static assets served by Next.js.

### Adding new pages
Create a new route folder in `app/` (e.g., `app/my-idea/page.tsx`) and compose components from `src/` or new ones. Mark client components with `'use client'` when they need hooks or browser APIs.

### Migration shortcuts to revisit
- Global styles are imported centrally in `app/globals.scss` rather than converted to CSS Modules. If you want tighter style scoping, migrate these to modules incrementally.
- The calculator runs fully on the client to keep `localStorage` access simple. Server Components/SSG can be introduced later once persistence is abstracted from browser APIs.
