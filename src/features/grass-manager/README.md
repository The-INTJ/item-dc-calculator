# Grass Manager

Desktop-first, local-first lawn care at `/grass-manager`. The default screen is a five-day watering outlook beside a saved lawn/weed guide, with a compact four-area yard beneath. Mobile stacks the same readable information.

## State and scopes

- Top care actions always use `segmentId: "whole-yard"`, even when an area is selected. Area actions use only that area's ID.
- Profile, observations, and up to 200 care events stay in this browser. No yard or care data is sent to the tips service.
- The v1 storage key is retained. Version 2 moves legacy `right-side-hill` logs to `left-side-hill`, and `left-side` logs to `right-side`. Old treeline events remain readable in history but are not assigned to the back lawn. Migration runs once.
- Area selection is not restored on reload. New profiles contain no invented weed IDs or grass/sun/condition observations.
- Saving the profile changes only its editable fields, so it cannot overwrite a location chosen while the form was open.

## Deterministic watering

`lib/watering/` is pure and tested with fixed dates. Open-Meteo supplies WMO conditions, Fahrenheit, mph, inches, sun times, hourly rain, and recent model history. Dates/times use the yard timezone.

These are conservative **product heuristics**, not measured soil moisture or universal agronomic requirements:

- Freeze/snow or active rain: skip routine irrigation.
- Recent fertilizer/herbicide (under two calendar days): check product-specific water-in/rainfast directions. A treated area is surfaced in the whole-yard recommendation.
- New seed or dormant lawn: leave the ordinary deep-soak schedule and show the appropriate moisture check.
- Next 24h: defer for at least 0.15 in. forecast rain with at least 60% hourly rain probability. Unknown timing stays uncertain; high probability without useful volume does not count as irrigation.
- Logged watering within two days, or at least 0.25 in. of recent estimated rain: defer and verify soil. Recent rain covers the prior two days plus elapsed hours today.
- Wind at least 15 mph: wait for calmer conditions.
- Drying checks start at 3 days for highs at least 86°F, 6 below 65°F, otherwise 4; add a day for shade and for cool, low-sunshine conditions. These only trigger a **water if soil is dry** suggestion, never automatic irrigation.
- No logged watering? Require enough dry model history before suggesting watering. Even then, verify dry soil 3–4 in. down or persistent footprints.
- After the morning window, use the next day's sunrise. Future columns assume **no further irrigation** and that forecast rain arrives. They are conditional outlooks, not a schedule to water every day.
- The UI never invents sprinkler runtimes. Optional catch-cup calibration converts a ½-in. trial application to minutes; slopes need shorter cycles and runoff checks.

Forecasts refresh every 30 minutes and on returning to the tab. Failed/location-changed requests clear old guidance; a two-hour-old snapshot requests a refresh. History is modeled rainfall, not a backyard rain gauge. Local watering restrictions and product labels always take precedence.

## Weed and seasonal guidance

Scattered weeds favor hand removal. Recurring patches can suggest a weed-specific selective treatment only when the grass is identified and seeding is not planned/in progress. Unknown weeds stay unidentified. The date/hemisphere gives a temperate seasonal planning cue; tropical and unknown locations avoid that calendar. Exact application windows still depend on active growth, local soil conditions, and the label.

Source guidance is linked from each weed's disclosure:

- [UMD herbicide guidance](https://extension.umd.edu/resource/herbicide-options-managing-common-lawn-weeds-maryland): identification, selective products, active growth, and seeding conflicts.
- [Penn State crabgrass guidance](https://extension.psu.edu/lawn-and-turfgrass-weeds-smooth-crabgrass-and-large-crabgrass): pre-emergence timing uses soil temperature, not forecast air temperature.
- [UC IPM nutsedge](https://ipm.ucanr.edu/home-and-landscape/nutsedge/): young-shoot removal, persistent tubers, and sedge-specific control.
- [UMN watering guidance](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/water-wisely-start-in-your-own-backyard): morning watering, rainfall, and site differences.
- [UMD lawn calendar](https://extension.umd.edu/resource/lawn-maintenance-calendar): seasonal repair planning.

## Authored tip cards

The protected API is unchanged: `GET /api/grass-manager/tips`, `POST /api/grass-manager/tips`, and `PATCH /api/grass-manager/tips/:id`. Writes use an approved Firebase identity or the server-configured `x-grass-manager-key`. Never ship that key in client code.

POST accepts `title`, `summary`, `body`, `category`, `tags`, optional `id` and `source`. PATCH revises an existing card. An API write supplies `updatedAt`; only the latest updated card is displayed, collapsed, below the yard. Unmodified generic starter cards remain available through GET but stay out of the default screen.

## Checks

`npm run lint`, `npm run type-check`, `npm test`, `npm run docs:validate`, and `npx playwright test e2e/specs/grass-manager.spec.ts --project=chromium`. The browser spec exercises real public weather, profile persistence, whole/area scopes, and 4K/mobile layout; no internal app data is mocked.
