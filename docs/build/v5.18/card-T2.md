# Card T2 — the Boston pack (v5.18, lanes T, S and U)

**Goal:** Boston exists as `src/content/cities/boston/`, passes the city schema test, and can be played from the franchise moment to its last scene.

**Script:** `docs/story/BOSTON-SCRIPT.md` (copy its text exactly; it has been reviewed). **Schema:** `docs/API.md` (`src/content/cities/types.ts`) and the home pack as the worked example: read `src/content/cities/home/index.ts` and one neighbourhood's scene file, not all six.

This is a large card. Work in the order below and tick each step; if you run out of room, report PARTIAL with the steps left, and the orchestrator will continue you or start a second programmer on the same card.

## Files
- Own: `src/content/cities/boston/**`, `src/components/portrait.tsx` (new characters only), `src/components/cutscene/backdrop-art.ts` and `src/components/backdrop.tsx` (new backdrops only), `src/components/city-map.tsx`, `src/app/city.tsx`, `src/components/franchise/**` (new: confirm sheet, the franchise moment, the city picker), `scripts/fixtures/106_t2.py`.
- Shared, append-only: `src/content/cities/index.ts`, `src/components/slots.tsx`.
- Do not touch: `src/engine/**` (card E3 owns the numbers: leave the pack's `fit` as a copy of the home city's and say so).

## Steps
- [ ] **1. Data:** the pack's neighbourhoods, perks (one per character, each applying only to its own shop, sized like the home city's), the layer kind per neighbourhood from the table on card W3, the lieutenant, the recipe cards, head names and barks.
- [ ] **2. Scenes:** the 24 main beats and the interludes, with triggers on the home city's pattern (unlock, level, deliveries, challenge, after). `npx jest src/content/__tests__/city-schema.test.ts` must pass for `boston`.
- [ ] **3. Portraits:** the six characters and Trish Vance, as variants of existing busts where a build and hairline fit, new shapes only where they don't. Priya and Nonna get one changed detail each to show time has passed.
- [ ] **4. Backdrops:** one exterior and one shop interior per neighbourhood, by palette, skyline and one signature object each (North End: church steeple; Southie: bar sign; Back Bay: brownstones; Fenway: light towers; Cambridge: lab windows; Dorchester: triple-deckers). Keep the 61 pt caption zone clear.
- [ ] **5. Screens:** the franchise offer on the "Coming soon: Boston" card (which now opens the confirm sheet: what you keep, what you give up, the multiplier, two confirmations); the franchise moment; the City screen for the current city, with a way to read earlier cities' Scrapbooks.
- [ ] **6. Layer dressing:** each Boston layer uses its neighbourhood's copy and one re-dressed overlay element (a "local" badge for Southie's stars, a pantry shelf for Dorchester's rack, and so on). No new layer logic.

## Fixtures (`scripts/fixtures/106_t2.py`, shots 106–117)
106 franchise confirm sheet; 107 the franchise moment; 108 Boston's City screen at the start; 109–114 one cut-scene panel per neighbourhood, each showing its character and backdrop; 115 Trish Vance at HQ; 116 a Boston shop with its layer running; 117 an earlier city's Scrapbook opened from Boston.

## Checks
`npx tsc --noEmit`; `npx jest src/content src/components`; `python3 -m py_compile scripts/fixtures/106_t2.py`.
