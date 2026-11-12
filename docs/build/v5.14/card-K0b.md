# Card K0b — UI seams (v5.14, lanes U and S)

**Goal:** after this card, a new feature adds its chip, banner, sheet, drawer card or shop-scene overlay by appending one entry to a registry, and adds its screenshots as its own file. `app/index.tsx` (437 lines), `game-ui.tsx` (515), `scene/room.tsx` (1,037) and `scripts/screenshots.py` (33 KB) stop being files every card has to read and edit. **No pixel may change:** the orchestrator will reject this card if any screenshot differs.

## Files
- Own: `src/components/slots.tsx` (new), `src/app/index.tsx`, `src/components/game-ui.tsx`, `src/components/scene/room.tsx`, `src/components/scene/facade.tsx` (new), `src/components/drawer-model.ts` (new) and its test, `scripts/screenshots.py`, `scripts/shots_lib.py` (new), `scripts/fixtures/` (new).
- Do not touch: `src/engine/**`, `src/content/**`, `src/store/**` (card K0a is editing them now).

## Steps
- [x] **1. Slots.** `src/components/slots.tsx` exports five arrays, all empty for now: `HUD_CHIPS`, `BANNERS`, `SHEETS`, `DRAWER_CARDS`, `SCENE_OVERLAYS`. An entry is `{ id: string; order: number; Component: React.ComponentType<SlotProps> }`.
  - `SlotProps` for the first four: none. Each component reads what it needs from the store with primitive selectors and returns `null` when it has nothing to show.
  - `SCENE_OVERLAYS` components get `{ shopId, width, height }` and draw inside the shop scene, above the floor and furniture, below the HUD.
  - Mount points: the HUD chip row, the banner lane and the sheet host in `app/index.tsx`; the city-wide card list in the drawer; the overlay layer in `scene/room.tsx`. An empty array renders nothing and adds no wrapper view that changes layout.
  - Rules from past rounds apply: memoised parts take primitive props; 44 pt tap targets; no re-render on every tick.
- [x] **2. Worked example.** Move the night-oven HUD chip that card R3 added into `HUD_CHIPS`, so the pattern is proven by one real entry. Pixels unchanged.
- [ ] **3. Fixtures split.** Move the helpers (`shop`, `shot`, `seeded_page`, `skip_title`, `settle`, `tap_shop`, `tap_station`, `tid`, …) into `scripts/shots_lib.py`. `screenshots.py` keeps the existing shots with the same names and order, then imports every `scripts/fixtures/*.py` in sorted order and calls its `run(ctx)`. Add `scripts/fixtures/README.md` (≤ 12 lines) showing one minimal fixture file. File naming: `NN_card.py`, where NN is the first shot number the card owns.
- [x] **4. A22 / M50 (open codecritic medium).** `scene/room.tsx` is over 1,000 lines with a large facade node count. Move the facade into `scene/facade.tsx` as a memoised component on primitive props.
- [x] **5. A17 / M32 (open codecritic medium).** The drawer in `app/index.tsx` builds its card model inline and re-simulates gains per tick. Move it to a pure `drawerCards(input)` in `drawer-model.ts` with one typed input object, derive the memo deps from that object, and test it.

Steps 4 and 5 are worth doing only if they keep every screenshot identical. If one of them can't, revert that step and report it as not done.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `python3 -m py_compile scripts/screenshots.py scripts/shots_lib.py`.

## Report
Standard format. List the five slot names and each mount point's file and line.
