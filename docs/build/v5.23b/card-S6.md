# Card S6 — the scene's carried notes (v5.23b, lane S)

**Goal:** close the scene rows the critic has carried longest. The rival store is drawn whole, wide shops fit the screen, the sidewalk people stay apart, and a balanced shop shows no pile.

**Read first:** `docs/build/v5.23b/VERSION.md` (Defaults: rival store, wide shops); the S rows of `CARRY` (`sed -n '/^## Open notes/,$p' <CARRY>`); `src/components/scene/viewport.ts`, `scroll.ts`, `layout-space.ts`; `src/components/layers/rival/rival-scene.tsx`; `src/components/scene/walkout.ts`, `waiting.ts`, `strip-clear.ts`; `src/components/scene/piles.ts`, `pile-art.tsx`. Lessons: the crowd-overlap rules at the top of `CRITICLOG.md`.

## Files
- Own: `src/components/scene/viewport.ts`, `scroll.ts`, `layout-space.ts`, `walkout.ts`, `waiting.ts`, `piles.ts`, `pile-art.tsx`, `src/components/layers/rival/rival-scene.tsx` (S rows only, by Julien's routing of D481), `storefront.tsx` only where these call into it, and their tests: `scene/__tests__/wide.test.ts`, `viewport.test.ts`, `crowd.test.ts`, `piles.test.ts`, `strip-clear.test.ts`.
- Fixture: `scripts/fixtures/<next free number>_s6.py`, with shots of the rival band (Suburbs and Waterfront), the widest footprint in Suburbs and Industrial, a short-drivers shop with a walk-out, and a balanced shop next to a short-ovens shop.
- Before you rename anything: `grep -rln "<name>" src scripts/fixtures`, and list the hits you changed.
- Do not touch: `src/components/report/**`, `sidewalk-*`, `drawer-*` (U7), `coach/**` (U8), `src/content/tuning.ts`.

## Steps
- [x] **1. D481 rival store.** Draw it whole inside the safe area at about 60 pt wide on the far-kerb band, with the sign and shutters readable (shutters down while the rival is beaten). It must not be cut by the screen bottom or the home indicator in shots 13, 76 and 156, and not missing in 79 when the camera is panned. Add a test that the store's rect lies inside the viewport for every hood that has the rival band.
- [~] **2. D519 wide shops.** At the widest footprint, fit the cutaway to 393 pt with a 12 pt margin on each side. Scale down (not below 0.88×) before falling back to scroll. Test: for every hood × footprint, the room's x-extent lies inside [12, 381] pt at scroll 0, or the scroll cue shows.
- [x] **3. D552.** The walk-out walks the floor above the report strip's top edge (`floorYFor(stripTop(...))`), so his body shows. Idle drivers park by the door, apart from the walk-in order line. Add crowd budgets for both, and confirm they fail on today's code before you fix it.
- [x] **4. D557.** A balanced shop shows no dough stack, or 2 discs at most. Piles start at 1.5 batches, per the D548 note. Test: a balanced shop's pile count is 0 or 2 or fewer, and a short-ovens shop's is above 3.
- [x] **5. Any other S row in `CARRY`.** Fix it, or say why not.
- [ ] **6. Whole suites.** Run the full crowd suite after every route or spot change, not only the budget you are fixing (CRITICLOG lesson 4).

## Checks
`npx tsc --noEmit`; `npx jest src/components/scene src/components/layers`; `npm run format:check`; the fixture (`--only <your fixture>`).

## Report
Standard format. For each row you mark fixed, give the shot (`screenshots/dev/<name>.png`) that shows the fix and one line on what changed in its pixels.
