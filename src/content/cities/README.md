# City packs

A city is its pack: everything that is Boston's lives in `src/content/cities/boston/` (and its art in `src/components/cities/boston/`). Core content and
the engine name no pack but home. A new city is one folder plus the registry lines below; nothing in core is edited.

## What a pack folder holds (`src/content/cities/<id>/`)
- `index.ts`: exports the `CityDef` (`<ID>_CITY`): neighbourhoods, scenes, perks, layers, heads, managers, lieutenant, bid, teaser, copy, fit.
- `data.ts`: the six neighbourhoods (names, colours, map positions, prices from `fit.ts`), perks, heads, managers, layers.
- `fit.ts`: the numbers. `cityNumbers(cityIndex('<id>'))` from `content/franchise.ts` scales the home prices; the pack's `<ID>_FIT` is oven grades,
  footprints, fleet, first-shop heads and the takeover scene. The scaling rule stays in franchise.ts; a pack owns only its result.
- `cast.ts`: the characters the pack adds (`as const`, imports nothing). Its scenes may also use the home cast, the returning characters.
- `copy.ts`: the pack's words that are not scenes, including `copy` (overrides keyed by the HOME keys, `t(key, vars, cityId)`) and its `teaser`
  (what the city before it says about it; `teaserFor(game)` returns the next city's).
- `scenes/`: one file per neighbourhood and an `index.ts`. Four main beats each (ids `<hood>-1` to `<hood>-4`), interludes as needed, bubbles of 90 characters or fewer.
- `__tests__/`: the pack's own checks (story size and order, numbers from the fit, copy tables).

A pack never imports `content/copy` (no cycle) and never changes a shared library.

## What its art folder holds (`src/components/cities/<id>/`)
Backdrops, portraits and looks for its characters, and its sheets. Core art files read cities only through `components/cities/index.ts`.

## The registry lines a new city adds
1. `src/content/cities/index.ts`: import the pack and add it to `CITIES`.
2. `src/content/cast.ts`: one import and one line in `CHARACTER_IDS` (this is the only place a character id is added).
3. `src/components/cities/index.ts`: one entry in `CITIES` for the art.
4. `src/content/franchise.ts`: the id in `CITY_ORDER`. **The pack `id` must be its `CITY_ORDER` entry** (`cityIndex`, `nextCity` and `teaserFor` read it).

## Rules the tests hold a pack to
- Each layer kind (`gameDay`, `boats`, `menu`, `shifts`, `stars`) is used on exactly one neighbourhood; the first neighbourhood plays none.
- Copy overrides are keyed by the home keys and keep the home line's `{placeholders}`.
- Shared libraries a pack may use but not change: `PROP_IDS` (props), the busts and portrait parts, the layer kinds.
- Neighbourhood ids are unique across cities and none is a home id.
- Core names no pack: outside its own folders no source file may use a pack's id, display name or `BOSTON_`-style identifier.

## The tests that gate a pack
- `src/content/__tests__/city-schema.test.ts`: `problemsOf(city)` must return `[]` (ids, cast, beats, speakers, bubbles, fit, bid, teaser, cycles); a
  fresh test pack (`__fixtures__/test-city.ts`, registered only inside the test) plays from its opening to its last finale.
- `src/engine/__tests__/pack-ids-guard.test.ts`: no pack is named outside its folders (its `ALLOW` list shrinks as the art moves into pack folders).
- `src/engine/__tests__/home-ids-guard.test.ts`: the engine, the store and the components name no home id.
- `src/engine/__tests__/test-city-smoke.test.ts`: the engine reads the city's fit, never the home tables.
- `src/content/cities/<id>/__tests__/`: the pack's own tests; `economy.test.ts` and `number-ceiling.test.ts` pin the prices.
