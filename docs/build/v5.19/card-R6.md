# Card R6: cut-scene art by city (v5.19, lanes S and T; this card's Files override OWNERS)

(Updated 2026-11-18 by the plan check: Boston's portraits register per city, for card CITY.)

**Goal:** `backdrop.tsx` (1,808 lines) and `portrait.tsx` (834) split so that a new city's art is one new file plus one registry line. Card CITY then adds Chicago, New York and Los Angeles without editing shared art. **Pixel-identical.**

**Why:** `docs/PLAN-refactor.md`, phase P6 (the first two bullets).

## Files
- Own: `src/components/backdrop.tsx`, which becomes the folder `src/components/cutscene/backdrops/`, and `src/components/portrait.tsx`, which becomes the folder `src/components/portrait/`. Keep one re-export file at each old path until card R2b's sweep, so no importer changes in this card.
- Read-only: `src/components/cutscene/backdrop-art.ts`, `figure-art.ts`, `staging.ts`, `src/components/scene/looks.ts`.

## Steps
- [ ] **1. Backdrops.** Split `backdrop.tsx` into these files under `cutscene/backdrops/`:
  - `index.tsx`: the `Backdrop` component, `SCENES` and `SCENE_ZOOM`.
  - `shared.tsx`: `INK`, `SKY`, `GLOW`, `Ground`, `Billboard`, clouds, `FAR_CITY`.
  - `shop.tsx`: `ShopScene`, `ShopWindow`, `ShopObject`, `UniLights`.
  - `home.tsx`: Downtown, Suburbs, Waterfront, University, Industrial, Uptown, HQ and Rain.
  - `boston.tsx`: `BostonScene`, `BostonWindow`, `BostonObject`, `BostonSignature` and their geometry constants.
  - `props.tsx`: `SoldSign`, `VendingMachine`, `OrderSlip`, `NameTag`, `PhoneFootage`, `IconProp` and the `BackdropProp` type.

  Registration: each city file exports a `Partial<Record<BackdropId, SceneFn>>` and its window/object lookups, and `index.tsx` merges them. Move code verbatim; rename nothing, and change no number.
- [ ] **2. Portraits.** Split `portrait.tsx` into these files under `portrait/`:
  - `look.ts`: `Look`, `LOOKS`, `AGED`, `lookFor`, `DISPLAY_NAMES`, `managerLook`.
  - `hair.tsx`, `hats.tsx` (`Hat`, `Glasses`, `Mustache`, …) and `face.tsx`.
  - `bust.tsx` (`Bust`, `BustGear`) and `stage.tsx` (`Stage`, `ArmWear`, `HeldClipboard`, `HeldCard`).
  - `outfits/index.tsx` (`Outfit`: the home characters' cases and the merge), and `outfits/boston.tsx`.
  - `index.tsx` (`Portrait`).

  **Per-city registration** (so card CITY adds a city as one new file plus one registry line). `outfits/boston.tsx` holds everything that is Boston's:
  - `BOSTON_OUTFIT`;
  - Boston's `LOOKS` and `DISPLAY_NAMES` entries;
  - its `AGED` row;
  - its characters' `Outfit` cases, as a `Partial<Record<CharacterId, OutfitFn>>`.

  It exports these as one `CityPortraits` object. `look.ts` and `outfits/index.tsx` merge every registered city's object over the home tables. Today the Boston entries sit inline in `LOOKS`, `DISPLAY_NAMES`, `AGED` and the `Outfit` switch (`case 'father-dom'` …); they move. Keep the same output: a test asserts that `lookFor` and `DISPLAY_NAMES` return the same values for every `CharacterId` before and after.
- [ ] **3. Same output.** For each `BackdropId` × prop × hood combination the tests already cover, and each `CharacterId` × mood, the rendered element tree must be unchanged. Use the existing cutscene tests; if none covers the `.tsx` output, rely on the fixtures below.

## Fixtures
Run `--only 19_story_props,90_t1b,106_t2,06_scrapbook_offline` and compare with the same fixtures in the v5.19 baseline (`python3 scripts/review_shots.py dev v5.19-base | tail -3`). **0 changed** is the gate.

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npx jest src/components`.

## Report
Standard format, plus the line count of each new file (none over 450) and the review_shots result.
