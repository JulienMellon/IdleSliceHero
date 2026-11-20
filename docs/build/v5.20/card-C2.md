# Card C2 — the scene's coach targets (v5.20, lane S)

**Goal:** the shop drawing reports its stations, their dials and the oven pair to the coach registry in screen points, so the overlay can light a station **together with its dial**. The scrim that lives inside the SVG today goes.

**Why (Julien, 2026-11-20):** "There is a finger pointing at the dials but they are grayed out like the rest of the restaurant." The cut-out today is `spotlightCutout(stationRect)`; the dials are `StationBadge`s on the badge rail (`badgeRowY`), outside it.

**Read first:** `src/components/coach/targets.ts` (card C1); the spotlight block of `src/components/storefront.tsx` (search `D367`), `badgeXs`, `badgeRowY`, `BADGE_R`, `stationRects` in `src/components/scene/stations.ts`; `sceneToScreen` in the scene folder (v5.18) for the scroll offset.

## Files
- Own: `src/components/storefront.tsx`, `src/components/scene/**`, the `<Storefront … />` call site in `src/app/index.tsx` (its spotlight arguments only), one new fixture file `scripts/fixtures/<next free number>_c2.py`.
- Do not touch: `src/components/coach/**` (C1; ask its owner through `Needs:`), `src/engine/**`.

## Steps
- [x] **1. Rects in screen points.** One pure helper `coachRects(lay, fit, scrollX, origin)` → `{ 'station:prep'|'station:oven'|'station:counter': Rect, 'dial:prep'|'dial:oven'|'dial:counter': Rect, 'ovens:all': Rect }`. Dials are the badge circles (`BADGE_R` + 4 pt). `ovens:all` is the union of every oven slot drawn. Use the same scene-to-screen mapping as the other overlays, so the scrolling shop (v5.18) is right.
- [x] **2. Register them** for the shop on screen only, after layout and whenever the footprint, oven count, scroll position or screen size changes (not per frame).
- [x] **3. Delete the in-SVG scrim**, its glow, the breathing ring and the hand (the overlay draws them now), and the `spotlight` / `spotlightWait` props and their `index.tsx` call site's arguments. Keep `tutorialHand` and `spotlightCutout` if card C1's model imports them; otherwise move them to C1 through `Needs:`.
- [x] **4. Test.** For a 1-oven and a 2-oven Downtown at 393 wide and at the widest footprint with scroll: each dial's rect lies inside the screen, and the union of `station:oven` and `dial:oven` contains both.
- [x] **5. Fixture.** `<n>_c2.py`: today's steps 2 and 4 (wait steps): the dial must be inside the lit area. `expect()` reads the overlay's cut-out from the DOM.

## Rules
Overlap fixes in the pure modules with a budget test; run the crowd suite. Don't remove the WELCOME mat.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `npm run format:check`.

## Report
Standard format.
