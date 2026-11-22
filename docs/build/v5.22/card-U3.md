# Card U3 — the report, redrawn (v5.22, lane U)

**Goal:** the shop report shows one bar per station and one for drivers, all the same colour, each as long as the pizzas a minute it can handle, with one dashed line across them at customers a minute. "Served 41/min · Missed 7/min". No lamps, no red, no station named as the limit. The strip above the sidewalk shows only the served/missed line.

**Read first:** `src/components/report/**` (all of it), `src/engine/features/service.ts` (E3's new view), `docs/story/COPY-v5.22.md`.

## Files
- Own: `src/components/report/**`, `src/content/copy/home/` (a new `report.ts` table merged in `copy/index.ts`, from W3), one fixture `scripts/fixtures/<next free number>_u3.py`.
- Do not touch: `src/engine/**`, the sidewalk and drawer (U4).

## Steps
- [x] **1. Model** (`report-model.ts`): bar rows from `capacity`, the line from `wanted`, scaled so the longest of bars and line fills the width; "You" on a hand-tapped station's bar; remove `LAMP_COLOR`, `LAMP_INK`, `lampWord`, `stripKind`'s kitchen/quiet cases and the manager-voiced strip lines that name a station. The tipping and cold states keep a neutral word ("Tips up" / "Line's gone cold") without colour coding stations.
- [x] **2. Sheet:** title, bars (basil, 14 pt tall, value at the end "18/min"), the dashed ink line labelled "Customers 24/min", the served/missed line, the service score. One extra row for walk-ins vs deliveries if it fits without scrolling at 375 × 667; otherwise drop it.
- [x] **3. Strip:** `report.strip`; tapping it opens the sheet (as today) and calls E3's `reportOpened` action.
- [x] **4. Coach targets** for card E4: `report:strip`, `report:bar:ovens` (register every bar as `report:bar:<station>`), `report:demand`, `report:close`.
- [x] **5. Tests and fixture:** a shop short on ovens, one short on drivers, one balanced, one hand-tapped station.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `npm run format:check`.

## Report
Standard format.
