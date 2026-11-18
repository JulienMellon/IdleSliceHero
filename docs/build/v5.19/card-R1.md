# Card R1: the city-generic engine (v5.19, lane E; this card's Files override OWNERS)

**Goal:** nothing outside a city pack reads the home city's tables or ids, so Chicago, New York and Los Angeles (cards E4 and CITY) can't inherit home numbers by accident. Behaviour-preserving for home and Boston.

**Why:** `docs/PLAN-refactor.md`, phase P1 (the first six bullets; the layer and layout bullets are card R1L).

## Files
- Own: `src/engine/**` (not `features/layers/**`, which is R1L), `src/content/tuning.ts`, `src/content/cities/index.ts`, `src/content/cities/types.ts`, `src/content/cities/home/**`, `src/content/cities/boston/**` (data moves only), `src/content/heads.ts`, `src/content/hooks.ts`, `src/store/game-store.ts`, and the call sites of the removed re-exports. Today those are: `src/app/index.tsx`, `src/app/city.tsx`, `src/components/drawer-model.ts`, `shop-ui.tsx`, `sidewalk-model.ts`, `sidewalk-row.tsx`, `storefront.tsx` (imports and the `downtown:` flag only), `cutscene-player.tsx`, `content/franchise.ts`, `content/types.ts`, `components/layers/uptown/stars-model.ts`, `components/layers/waterfront/boats-model.ts`, `components/endgame/recipes-model.ts`, `components/scene/layout.ts`, `scene/props.tsx`, `scene/defs.tsx` and `scene/cosmetics.ts`. Get the list with `grep -rln "OVEN_GRADES\|FOOTPRINTS\|VEHICLES\|NEIGHBORHOODS\|PERKS\|PIER9_BID\|CITY_NAME\|\bHEADS\b\|MANAGERS" src --include=*.ts --include=*.tsx`.
- Shared: `src/engine/__tests__/home-ids-guard.test.ts` (shrink its `ALLOW` list) and `src/engine/__tests__/test-city-smoke.test.ts` (flip `it.failing` to `it`).
- Do not touch: `src/components/layers/shop-layout.ts`, `content/shop-layout.ts`, `content/layers.ts` (R1L).

## Steps
- [ ] **1. Rates from the fit.** `ovenRate`, `tripSeconds`, `tripCapacity`, `deliveryRate`, `tablesShown`, `patioTables`, `queueSizes`, `demandRate`, `shopRate`, `pieSplit` and `walkInFraction` take the `CityFit`. The signature is your choice, but keep it consistent: a trailing `fit: CityFit = cityOfHood(id).fit` where an id is in hand, otherwise a required argument. Callers pass `cityOf(s).fit`. The R0 test-city assertions now pass as `it`.
- [ ] **2. Lookup (U24, C147).** One lazily built `Map<NeighborhoodId, { city: CityDef; def: NeighborhoodDef }>` over `CITIES` in `content/cities/index.ts`. `cityOfHood` and `def` read it, so `def` is O(1) and stays total (it throws on an unknown id). Add `findHood(id): NeighborhoodDef | undefined` for `cutscene-input.ts:25` and `game.ts` `capital`, and drop their `as {name}|undefined` casts. Drop the `HOME_CITY` default arguments in `features/mastery.ts:48,53`; for `jamShare`, leave a note in your report for R1L, which owns that file.
- [ ] **3. Remove the home re-exports from `tuning.ts`:** `OVEN_GRADES`, `FOOTPRINTS`, `VEHICLES`, `NEIGHBORHOODS`, `HEADS`, `MANAGERS`, `PERKS`, `PIER9_BID`, `CITY_NAME`, `HEAD_COST_DOWNTOWN` and `NONNA_TAKEOVER`. Each call site reads `cityOf(game)` (or `city.fit`) instead. A site with no game in hand (a pure art module) gets the city passed in. If that would mean editing a `.tsx` that only paints, say so in the report rather than threading props through five layers. Tests and scripts import from `content/cities/home` directly.
- [ ] **4. Generic names.**
  - `nonnaPizzasLeft` becomes `founderPizzasLeft`.
  - Delete the `nonnaCountdownText` alias.
  - Export `founderName`.
  - `pier9Available`/`pier9Price`/`bidPier9` become `bidAvailable`/`bidPrice`/`placeBid`, along with the store action and every caller.
  - `STORY_PACING.downtownBeat4GapSeconds` becomes `firstHoodBeat4GapSeconds`.
  - Save keys and saved strings do not change.
- [ ] **5. Home-id checks become data:**
  - `sidewalk-model.ts:340` `id !== 'downtown'` becomes `id !== firstHood(city)` (the caller passes the city).
  - `storefront.tsx:375` `downtown: id === 'downtown'` becomes `id === firstHood(city)`.
  - `audio/director.ts:199` `'waterfront'`: report only (lane A, card A3 takes it).
- [ ] **6. Per-city voice into `CityDef`:** add optional `barks`, `headBarks`, `orderCast`, `nightOvenLines` and `founder: { id, name }` fields. Move the home values from `content/heads.ts` and `content/hooks.ts` into `cities/home/`. Readers use `cityOf(g).barks ?? {}`. Boston gets **no** new lines in this card. Its heads stay silent until the CITY or T2 follow-up writes them. Just make the code ready (STATE: "engine heads.ts barkText/nextBark read home BARKS").
- [ ] **7. Guard.** Shrink the `home-ids-guard` `ALLOW` list. Every entry left must be an art module (`scene/**`, `backdrop.tsx`, `cutscene/**`), each with a reason.

## Tests that must exist
- The R0 test city passes.
- `findHood` returns undefined for an unknown id.
- `def` throws on one.
- A save from v5.18 (home and Boston) migrates to an identical state.
- `scenes-golden` and all pacing tests pass unchanged.

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npm test` (full; the counts must match the run before, plus your new tests).

## Report
Standard format, plus the `ALLOW` count before and after, and the list of art modules left.
