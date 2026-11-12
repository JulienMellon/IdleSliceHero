# Card S2b — scene and HUD: University, Industrial, Uptown (v5.16, lanes S and U)

**Goal:** the player can see and work each of card E2b's three layers. Everything is added through `src/components/slots.tsx`. Strings come from `docs/story/COPY-v5.16.md` section 1 by key.

**Read first:** `docs/API.md` (the views in `features/layers/university-menu.ts`, `industrial-shifts.ts`, `uptown-stars.ts`); `src/components/slots.tsx`; `src/components/endgame/` for the banner and chip components from v5.15: reuse them.

## Files
- Own: `src/components/layers/university/**`, `industrial/**`, `uptown/**` (new; pure `*-model.ts` files with tests), `scripts/fixtures/82_s2b.py`.
- Shared, append-only: `src/components/slots.tsx`, `src/store/game-store.ts` (actions only: set menu mix, fix jam, buy Ingredients tier).
- Read-only helpers you may call: `src/components/scene/**`. If you need a change there, list it under `Needs:`.
- Do not touch: `src/engine/**`, `src/app/**`, `src/components/layers/suburbs|waterfront|rival/**` (card S2a).

## Steps
- [ ] **1. University.** A menu sheet: three recipes with their price and time effects and a three-way mix control built from taps only (no sliders or drags: plus and minus buttons in 10% steps). A zones strip: Dorms, Library, Stadium with distance, share, lock state, and the trip time for the current vehicle; drones show "ignores distance". A small drone flight over the scene once drones are owned.
- [ ] **2. Industrial.** A shift clock chip showing the current shift and the time to the next; the night shift tints the scene and shows "×2". An oven jam: smoke on one oven and a wrench button at 44 pt on it; "Head Baker fixing… {n}s" when the head is hired; a `jam` and a `jamfixed` pulse for the audio lane.
- [ ] **3. Uptown.** The star rating on the storefront sign and the HUD. A stars sheet: the three inputs (oven grade, decor, Ingredients) with what the next point costs, and the pay rule (below 3 stars half pay; 5 stars double). An Ingredients drawer card. The critic: a figure who walks in, a target chip, and a pass or fail moment with the copy lines.
- [ ] **4. Info sheets.** One per layer from its HUD chip.
- [ ] **5. Carried.** Rows with owner S or U that name these neighbourhoods in the carried-notes file from your spawn prompt.

## Fixtures (`scripts/fixtures/82_s2b.py`, shots 82–89)
82 menu sheet at 50/30/20; 83 zones strip with Stadium locked; 84 zones with drones; 85 night shift; 86 jammed oven with the wrench; 87 Uptown at 2 stars with the half-pay tag; 88 stars sheet at 4 stars; 89 critic pass moment. Seeded saves, plausible numbers.

## Rules
As card S2a: budgets for overlaps, the whole crowd suite, 44 pt targets, primitive props, tap-only controls.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `python3 -m py_compile scripts/fixtures/82_s2b.py`.
