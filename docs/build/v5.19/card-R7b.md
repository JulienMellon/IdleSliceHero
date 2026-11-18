# Card R7b: a city is its pack (art and UI side) (v5.19, lanes S and U; this card's Files override OWNERS)

**Goal:** everything Boston draws lives in `src/components/cities/boston/`. Shared art and UI files read a city's art from one registry, `src/components/cities/index.ts`, and name no Boston id. The pack guard's `ALLOW` list (card R7a) goes to zero. **Pixel-identical.**

**Run after R7a.** It reads R7a's `teaserFor`, and it empties R7a's guard list.

## Files
- Own:
  - `src/components/cities/**` (R6 created `index.ts`, `boston/backdrops.tsx` and `boston/portraits.tsx`; this card adds `boston/shop.ts` and `boston/map.ts`);
  - `src/components/scene/identity.ts`, `scene/background.tsx`, `cutscene/backdrop-art.ts` (Boston's blocks out; registry reads in);
  - `src/components/franchise/map-art.ts`, `src/components/city-map.tsx`;
  - `src/components/endgame/boston-sheet.tsx` (renamed `next-city-sheet.tsx` with `git mv`), `src/components/title-card.tsx` (the `SoonCard`), `src/components/slots.tsx` (that one entry);
  - the `soon.boston.*` keys in the home copy table (deleted once nothing reads them);
  - the shims `src/components/backdrop.tsx` and `src/components/portrait.tsx`, and every import line that names them, in `src/**` and `scripts/**`;
  - `src/engine/__tests__/pack-ids-guard.test.ts` (the `ALLOW` list only).

## Steps
- [x] **1. Shop looks and sky.**
  - Move these into `cities/boston/shop.ts`:
    - Boston's `Object.assign(LOOKS, {...})` block in `identity.ts`;
    - its sky and ground entries and the Boston skyline in `background.tsx`;
    - `BOSTON_LOOKS` (the cut-scene palette) from `backdrop-art.ts`.
  - The shared files read the registry, so the city's look falls back to the home neighbourhood at the same build position (`sceneHood`), as today.
  - `scene.test.ts` still checks Boston's awnings against its pack colours.
- [x] **2. Map art.** `map-art.ts` `BOSTON_ART` moves to `cities/boston/map.ts`, and `ARTS` comes from the registry. The `OPEN_LOT` constant in `city-map.tsx` loses its `BOSTON` alias. **Keep the `testID` `city-boston`**: fixtures press it.
- [x] **3. The next-city card.**
  - `next-city-sheet.tsx` shows the next pack's teaser (`teaserFor`, card R7a) on the `SoonCard`. The card draws the skyline that the next city's art registers (Boston's D460 skyline moves to `cities/boston/`). With no next pack, the card doesn't show.
  - Keep `SEEN_KEY` byte-identical (`'slice-empire/boston-seen'`: it is a device key), the slot id `'boston-card'` and the `testID`s.
  - Then delete the `soon.boston.*` keys.
- [x] **4. Shims gone.** Every importer of `components/backdrop` and `components/portrait` now imports `components/cutscene/backdrops` and `components/portrait/`. Delete the two shim files; `npx tsc --noEmit` proves nothing names them. Change import lines only. Card R2b, in a later version, does the same for `engine/game`.
- [x] **5. Guard.** The pack guard's `ALLOW` list is empty and the test passes. The home-ids guard's list still holds only art modules (R1's rule).
- [x] **6. Contract.** Add the art folder's files and the registry line to `src/content/cities/README.md` (R7a wrote it), checked against what you built.

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npm test` (full).

## Fixtures
Run `--only 106_t2,56_u1,140_v2,82_s2b,90_t1b,19_story_props` and compare with the baseline (`python3 scripts/review_shots.py dev v5.19-base | tail -3`). **0 changed** is the gate, except the overlays card R1L moved in home Industrial and Waterfront, which its report names.

## Report
Standard format, plus the line count of each file in `src/components/cities/boston/`, and the number of files whose imports changed.
