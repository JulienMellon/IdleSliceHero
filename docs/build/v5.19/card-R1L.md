# Card R1L: layers by kind, one shop layout (v5.19, lanes U and S; this card's Files override OWNERS)

**Goal:** the layer code names layer kinds, not home neighbourhoods, and every overlay stands on the same room the storefront draws.

**Why:** `docs/PLAN-refactor.md`: P1's "Layers by kind" and "One shop layout" bullets, and the section "The layout fix, explained".

## Files
- Own:
  - `src/content/layers.ts`, `src/content/shop-layout.ts`, `src/content/cities/types.ts` (one new optional field).
  - `src/engine/features/layers/**`, renamed by kind.
  - `src/components/layers/**`, with folders renamed by kind.
  - `src/components/scene/layout-space.ts` and a new `src/components/scene/shop-layout.ts`.
  - `src/components/storefront.tsx`, layout lines only (the `ovenCount` … `roomLay` and `lay` block, and the wrench `avoid` block).
- Shared, append-only: `src/engine/features/index.ts` (import paths), `src/components/slots.tsx` (import paths).
- Read-only: `src/components/scene/layout.ts`.

## Steps
- [ ] **1. Hood fields out.** Remove `hood` from `GAME_DAY`, `BOATS` and the other layer tables in `content/layers.ts`. Every reader uses `layerHood(cityOf(g), kind)`; `gameDayChipShown` and `harbourChip` take the hood from their caller, with no default. `jamShare` loses its `HOME_CITY` default. `LAYER_KEYS` **values** do not change (they are save keys).
- [ ] **2. Rename by kind.** Use `git mv`, so history follows the files.
  - Feature files: `suburbs-gameday.ts` becomes `game-day.ts`, `waterfront-boats.ts` becomes `boats.ts`, `university-menu.ts` becomes `menu.ts`, `industrial-shifts.ts` becomes `shifts.ts`, and `uptown-stars.ts` becomes `stars.ts`.
  - Component folders: `suburbs/` becomes `game-day/`, `waterfront/` becomes `boats/`, `university/` becomes `menu/`, `industrial/` becomes `shifts/`, and `uptown/` becomes `stars/`.
  - Exported names that carry a home hood (`suburbsGameDay`, `waterfrontBoats`, …) are renamed by kind as well. User-facing strings don't change.
- [ ] **3. One shop layout. Do this step only if VERSION.md Defaults names Julien's pick; otherwise skip it and report `Needs: layout pick`.**
  - **Option C (the plan's recommendation):**
    - Add `plan?: 'standard' | 'mirrored'` to `NeighborhoodDef`, set to `'mirrored'` on home `waterfront` and `industrial` only. `isMirrored(id)` reads the def.
    - Add `scene/shop-layout.ts` `shopLayout(id, shop, city)`. It derives `ovenCount`, `cookCount`, `staffCount`, `tablesShown`, `driverSlots` and `plants` from `city.fit` (moved from `storefront.tsx:193-198`), calls `layout(…, mirrored)` and returns `{ room, draw }` (`draw = toDrawSpace(room)`). It is cached by key.
    - The storefront uses it.
    - `components/layers/shop-layout.ts` is deleted. Its 5 callers (jam-overlay, night-tint, critic-scene, gameday-scene, harbour-scene), and the storefront's wrench `avoid` block, call `shopLayout` and use the space their drawing expects. Night-tint's own `isMirrored(shopId)` patch goes.
  - **Option B:** `layoutOfShop(id, shop)` reads `isMirrored(id)`, uses `cityOf` for the footprints, and returns the same draw space as the storefront. Mirroring stays keyed by id.
- [ ] **4. Guard.** Shrink the `home-ids-guard` `ALLOW` list for every file this card cleaned.

## Tests that must exist
- Each layer runs in the R0 test city, on the hood `layerHood` gives it.
- With step 3: in a mirrored shop, `ovenSpot(shopLayout(...).draw)` lies inside the oven the storefront draws (`lay.ovens`), for every footprint 0–4. Use Industrial's footprint 4 for the shot-145 case (wrench x330 against oven x256).

## Fixtures
Step 3 changes the overlays in home Industrial and Waterfront, which is intended. Run `--only 140_v2,82_s2b,74_s2a`, check that the wrench and the rack sit on the drawn oven and rack, and open at most three shots.

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npx jest src/engine src/components`.

## Report
Standard format, plus the step 3 status (done with option X, or skipped) and the shots whose overlays moved.
