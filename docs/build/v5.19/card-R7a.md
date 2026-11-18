# Card R7a: a city is its pack (content and engine side) (v5.19, lanes E and T; this card's Files override OWNERS)

**Goal:** everything that is Boston's lives in `src/content/cities/boston/`. Core content and engine files name no Boston id, name or number. A new city is one pack folder plus registry lines, and a test proves a fresh pack plays without core edits. **Behaviour-preserving:** same words, same numbers, same saves.

**Run after R1, R1L and R5c.** It builds on R1's per-city `CityDef` fields, R1L's `plan`, and R5c's per-pack `copy` overrides.

## What still ties Boston to core today (found at the 2026-11-18 plan check)
- `src/content/types.ts` `CHARACTER_IDS` lists Boston's seven characters inline.
- `src/content/franchise.ts` holds `BOSTON_NUMBERS`, and Boston's `data.ts` reads its prices from there.
- The "Coming soon: Boston" lines are `soon.boston.*` keys in the home copy (`endgame/copy.ts`, moved by R5c). They are the next city's teaser, so they belong to that city's pack.
- `src/audio/director.ts` plays the bid stinger in `'waterfront'` (about line 215; `'triumph_waterfront'` at about line 131). It should use the city's bid neighbourhood. Card R1 reported this and left it.
- No test checks that a pack is self-contained.

## Files
- Own:
  - new `src/content/cast.ts`, and each pack's `cast.ts` (new `src/content/cities/home/cast.ts` and `boston/cast.ts`);
  - `src/content/types.ts` (`CHARACTER_IDS` re-exported from `cast.ts`; nothing else);
  - `src/content/franchise.ts` (`BOSTON_NUMBERS` removed);
  - `src/content/cities/boston/**`, `src/content/cities/home/**`, `src/content/cities/types.ts` (one field), `src/content/cities/index.ts`;
  - new `src/content/cities/README.md`;
  - `src/content/__tests__/city-schema.test.ts` (the test-city case);
  - new `src/engine/__tests__/pack-ids-guard.test.ts`;
  - `src/audio/director.ts`: the two `'waterfront'` lines only. Lane A is informed; the music round is not running.
- Read-only: `src/content/cities/__fixtures__/test-city.ts` (R0), `src/engine/__tests__/home-ids-guard.test.ts` (the pattern).

## Steps
- [ ] **1. Cast per pack.**
  - Each pack has a `cast.ts` that imports nothing and exports its ids `as const`: home's sixteen, and Boston's seven.
  - `src/content/cast.ts` concatenates them (one line per city) and exports `CHARACTER_IDS` and `CharacterId`. `content/types.ts` re-exports both, so no importer changes.
  - `CityDef` gets `cast: readonly CharacterId[]`. The schema test checks that every scene's cast and the lieutenant are in the city's cast or the home cast. The home cast is the returning characters.
  - The array order must stay the same as today's `CHARACTER_IDS`: a test compares the two lists.
- [ ] **2. Numbers in the pack.** `content/franchise.ts` keeps the scaling rule (`cityNumbers`, `PRICE_FIT`, `CITY_ORDER`). `BOSTON_NUMBERS` moves to `boston/fit.ts` as `cityNumbers(cityIndex('boston'))`, beside `BOSTON_FIT` (moved out of `data.ts`). The prices must stay identical: `economy.test.ts` and `number-ceiling.test.ts` pass unchanged.
- [ ] **3. The teaser in the pack.**
  - `CityDef` gets `teaser?: { title: string; lines: [string, string]; signoff: string; from: string }`: what the city before this one says about it.
  - Boston's comes from the `soon.boston.*` lines, word for word.
  - Add `teaserFor(g)`, which returns the next city's teaser, or null (next city by `CITY_ORDER`, through `cityOf`). Card R7b's sheet reads it.
  - Leave the `soon.boston.*` keys in the home table until R7b has switched its reader. R7b deletes them.
- [ ] **4. Audio bid line.**
  - `'waterfront'` in the bid stinger becomes `soundOf(cityOf(game).bid?.hood ?? <the home bid hood>)`.
  - `triumph_waterfront` keeps its cue name, but is chosen through the same lookup.
  - Same sound at home; Boston has no bid.
- [ ] **5. Pack guard.** `pack-ids-guard.test.ts` uses the rule of the home-ids guard. It walks `src/**` outside `src/content/cities/<id>/` and `src/components/cities/<id>/` (R6's art folder), and fails on any id, display name or `BOSTON_`-style identifier of a pack that isn't home. Leave an explicit `ALLOW` list, each entry with a reason, for the art files R7b moves:
  - `scene/identity.ts`, `scene/background.tsx`, `cutscene/backdrop-art.ts`;
  - `franchise/map-art.ts`, `city-map.tsx`;
  - `endgame/boston-sheet.tsx`, `title-card.tsx`, `slots.tsx`.
  Comments don't count.
- [ ] **6. A fresh pack plays.**
  - Promote R0's test city to a full pack: a `cast`, a `teaser`, `copy` overrides, one scene per beat.
  - `problemsOf(testCity)` from the schema test returns `[]`.
  - The smoke test plays it from its opening to its last finale.
  - Register it only inside the test. It is never in `CITIES`.
- [ ] **7. The pack contract.** `src/content/cities/README.md`, under 80 lines:
  - what a pack folder holds (`index.ts`, `data.ts`, `fit.ts`, `cast.ts`, `copy.ts`, `scenes/`);
  - what its art folder holds (`src/components/cities/<id>/`, after R6 and R7b);
  - the registry lines a new city adds (`cities/index.ts`, `content/cast.ts`, `components/cities/index.ts`, `CITY_ORDER`), and that the pack `id` must be its `CITY_ORDER` entry;
  - each layer kind used on exactly one neighbourhood;
  - copy overrides keyed by the home keys;
  - the shared libraries a pack may use but not change: `PROP_IDS`, busts, layer kinds;
  - the tests that gate a pack.

## Tests that must exist
The cast order test, the test-city schema and play tests, the pack guard, and a v5.18 Boston save that loads to an identical state.

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npm test` (full; the counts must match the run before, plus your new tests).

## Fixtures
Run `--only 106_t2,56_u1` and compare with the baseline (`python3 scripts/review_shots.py dev v5.19-base | tail -3`). **0 changed** is the gate.

## Report
Standard format, plus the guard's `ALLOW` count and the README's path.
