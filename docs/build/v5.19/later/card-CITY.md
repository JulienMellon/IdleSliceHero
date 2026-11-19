# Card CITY — one city pack (v5.19, lanes T, S and U; parameter CITY)

Your spawn prompt gives `CITY=chicago`, `new-york` or `los-angeles`. VERSION.md's city table gives the rest:

| CITY | Script | Folder | `CityDef.id` | Fixtures |
| --- | --- | --- | --- | --- |
| chicago | `docs/story/CHICAGO-SCRIPT.md` | `chicago` | `chicago` | 160–169 |
| new-york | `docs/story/NEW-YORK-SCRIPT.md` | `new-york` | `newyork` | 170–179 |
| los-angeles | `docs/story/LOS-ANGELES-SCRIPT.md` | `los-angeles` | `la` | 180–191 |

The `id` must be the city's entry in `CITY_ORDER` (`src/content/franchise.ts`). The franchise moves to the next id in that list, so a pack with any other id is never reached.

**Goal:** `src/content/cities/<folder>/` exists, passes the city schema test, and plays from its opening to its last scene.

**Script:** copy its text exactly. **Worked example:** `src/content/cities/boston/` (`index.ts`, `data.ts`, `copy.ts`, one neighbourhood's scenes); do what it does. **Schema:** `docs/API.md`.

If you run out of room, report PARTIAL with the steps left.

## The code as the refactor left it (cards R1, R1L, R2, R5c, R6 have landed)
- **`CityDef`** has the per-city voice fields `barks`, `headBarks`, `orderCast`, `nightOvenLines` and `founder: { id, name }` (R1). `NeighborhoodDef` has `plan?: 'standard' | 'mirrored'` (R1L). Read their shapes in `src/content/cities/types.ts`, and the home values in `src/content/cities/home/`.
- **Layers are named by kind** (R1L): `gameDay`, `boats`, `menu`, `shifts`, `stars`, in `features/layers/<kind>.ts` (`game-day.ts`, `boats.ts`, …) and the component folders `components/layers/game-day/`, `boats/`, `menu/`, `shifts/` and `stars/`. A city plays each kind on exactly one neighbourhood.
- **Copy** is one system (R5c). A city's lines are an override table keyed by the **home** keys (`layer.suburbs.gameday.banner`, `upgrade.waterfront.rack.tier.1`, `rival.open`…). The keys keep their home names; Boston's `src/content/copy/boston.ts` is the example.
- **Art** is split by city (R6): `components/cutscene/backdrops/<city>.tsx` and `components/portrait/outfits/<city>.tsx`, each registered with one line.
- **Import the real modules**, not the shims: `components/cutscene/backdrops`, `components/portrait/`, and `engine/state`, `economy`, `story` and so on. Card R2b deletes `backdrop.tsx`, `portrait.tsx` and `engine/game.ts` after the three CITY cards.

## Files
- Own:
  - `src/content/cities/<folder>/**`: `index.ts`, `data.ts`, `copy.ts` (the script's keyed tables, as Boston's), and the scenes.
  - New `src/content/cities/<folder>/fit.ts`, in Boston's pattern (`BOSTON_FIT` in `boston/data.ts`), from `cityNumbers(cityIndex('<id>'))`. Don't tune numbers: card E4f owns this file afterwards and refits it.
  - `src/content/copy/<id>.ts`, the city's copy overrides.
  - New `src/components/cutscene/backdrops/<folder>.tsx`, the city's backdrops (`boston.tsx` is the example), with any new shape helpers in `src/components/cutscene/backdrop-art.ts`.
  - New `src/components/portrait/outfits/<folder>.tsx`: the city's looks, display names, aged entries and outfit drawings, registered the way R6 registers Boston's.
  - `scripts/fixtures/<NN>_<folder>.py`, in the range above. The old ranges 118–149 clash with existing shots 130–152 (`130_p1`, `140_v2`, `148_u4`).
- Shared, append-only. Re-read each file immediately before editing it, add your city's lines, and change nothing that exists:
  - `src/content/cities/index.ts` (`CITIES`);
  - `src/content/types.ts` (`CHARACTER_IDS` and, for the script's new props, `PROP_IDS`);
  - the registry lines in `src/components/cutscene/backdrops/index.tsx`, `src/components/portrait/outfits/index.tsx` and `src/content/copy/index.ts`;
  - for new props, their drawing in `src/components/cutscene/backdrops/props.tsx` (as `IconProp`, with the id in `ICON_PROP_IDS`);
  - `src/components/scene/identity.ts` and `src/components/scene/background.tsx`: one block for the city's shop looks and its sky, as Boston's (D508).
  - `los-angeles` only: see step 6.
- Do not touch: `src/engine/**`, `src/store/**`, `src/content/franchise.ts`.
- If a refactor card has not landed (the shared files above don't exist), stop and report `Needs: R1/R1L/R5c/R6 first`.

## Steps
- [ ] **1. Data:**
  - neighbourhoods in unlock order (ids from the script), with `plan: 'mirrored'` only on the script's `### Shop plan` mirrored shops;
  - perks;
  - layers (one neighbourhood per kind, `null` on the first);
  - the lieutenant;
  - heads and managers (`### General Managers`);
  - recipe cards;
  - `barks` (five per head, keyed by trigger);
  - `orderCast` (`### Special orders`);
  - `nightOvenLines` (`### Night oven`);
  - `founder` (`### Founder`), with `fit.takeover.sceneId` set to that scene;
  - the layer copy and the rival card as overrides in `src/content/copy/<id>.ts`, under the script's home keys;
  - `theme: 'city_theme'` until card A3 sets the city's own.
- [ ] **2. Scenes:** main beats, interludes, returning-character scenes, the opening. `npx jest src/content/__tests__/city-schema.test.ts` must pass for your city.
- [ ] **3. Portraits:** the new characters and the lieutenant, as variants of existing busts where they fit.
- [ ] **4. Backdrops:** one exterior and one interior per neighbourhood: palette, skyline, one signature object. Keep the caption zone clear. The shop looks and sky in `identity.ts`/`background.tsx` use the same palette, so the shop and its story share a sky.
- [ ] **5. Layer dressing:** one re-dressed overlay element per layer, data only (the overlay reads the city, as the harbour scene does for Boston's pantry shelf). No new logic. If an overlay has no city hook, report it under `Needs:` instead of adding one.
- [ ] **6. `los-angeles` only:**
  - the showdown scenes and the ending, on card E4's `showdown` trigger (`{ kind: 'showdown', round }`, rounds 1–5, then 6 for the ending; see `docs/API.md`);
  - a five-round challenge strip built from the rival challenge chip, in a new file `src/components/layers/showdown-strip.tsx` that reads `showdownView(g, gameNow())` and calls the store's `startShowdownRound` (now in `src/store/slices/layers.ts`);
  - its one mount line in `src/components/layers/layer-stack.tsx` (shared, append-only);
  - the `crown-empire` cosmetic as one entry in `src/components/scene/cosmetics.ts` (a small gold crown on the storefront sign; shared, append-only).

## Fixtures
City screen at the start; one cut-scene panel per neighbourhood; the lieutenant; one shop with its layer running (a mirrored one, if the city has one). Los Angeles adds a showdown round and the ending's last panel.

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npx jest src/content src/components`; `python3 -m py_compile scripts/fixtures/*_<folder>.py`.
