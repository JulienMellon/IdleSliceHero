# Card K1 — the city as data (v5.18, lane E)

**Goal:** everything that is specific to the home city moves into `src/content/cities/home/`, and the engine reads "the current city" from the save instead of from module-level constants. After this card a second city is a second folder. **Nothing the player sees or earns may change:** the orchestrator will reject the card if a screenshot or the golden hash differs.

**Read first:** `docs/API.md`. Then find the constants that assume one city: `grep -n "NEIGHBORHOODS\|SHOP_IDS\|HOME_SCENES\|PERKS\|PIER9" -r src --include=*.ts --include=*.tsx | grep -v __tests__ | cut -c1-120`.

## Files
- Own: `src/content/cities/**` (new), `src/content/tuning.ts`, `src/content/types.ts`, `src/content/scenes/**` (moved, not edited), `src/engine/**`, `src/store/game-store.ts`, `scripts/pacing-fit.ts`, `scripts/pacing-sim.ts`, `scripts/api-digest.ts` (add `src/content/cities`).
- In `src/components/**` and `src/app/**`: only the import lines and call sites that must change to compile. No layout, text or art changes.

## Steps
- [ ] **1. The schema.** `src/content/cities/types.ts`: `CityDef { id; name; neighbourhoods: NeighborhoodDef[]; scenes: Scene[]; perks; layers: Record<neighbourhoodId, LayerKind | null>; lieutenant; bid?: …; theme: audio key; fit: the fitted tuning set for this city }`. Neighbourhood ids become `string` checked against the current city, not a closed union, wherever that is needed to compile.
- [ ] **2. The home city pack.** `src/content/cities/home/index.ts` exports a `CityDef` built from today's constants, scenes, perks, the Pier 9 bid and the layer assignments from v5.16. `src/content/cities/index.ts` exports `CITIES` and `cityOf(g)`.
- [ ] **3. The engine reads the city.** `GameState` gains `city: string` (default `'home'`; old saves migrate to it). Every engine function that used a home-city constant takes it from `cityOf(g)`. Keep thin re-exports of the old names for the home city only where removing them would touch more than 20 call sites, and list them in the report.
- [ ] **4. Feature modules.** The six layer modules key off the layer kind assigned in the city pack, not a hard-coded neighbourhood id.
- [ ] **5. Schema test.** `src/content/__tests__/city-schema.test.ts`, run for every entry in `CITIES`: six neighbourhoods; four main beats each; every speaker, character and prop id exists; every `requires` and `after` id exists with no cycles; every bubble ≤ 90 chars; every layer kind is known; the fit has every required key. v5.19's three cities are gated mostly by this test, so make its failure messages name the city, the scene and the field.
- [ ] **6. Prove nothing changed.** `golden.test.ts` and `scenes-golden.test.ts` pass with their recorded hashes untouched. The full suite passes.

## Checks
`npx tsc --noEmit`; `npx jest` (the full suite: this card touches everything); `npx tsx scripts/pacing-sim.ts | tail -12`; `npx tsx scripts/api-digest.ts`.

## Report
Standard format, plus the list of kept re-exports and the sim's day table (it must equal the previous version's).
