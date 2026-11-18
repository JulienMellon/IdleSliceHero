# Card CITY — one city pack (v5.19, lanes T, S and U; parameter CITY)

Your spawn prompt gives `CITY=chicago`, `new-york` or `los-angeles`.

**Goal:** `src/content/cities/<CITY>/` exists, passes the city schema test, and plays from its opening to its last scene.

**Script:** `docs/story/<CITY>-SCRIPT.md` (copy its text exactly). **Worked example:** `src/content/cities/boston/index.ts` and one of its neighbourhood files; do what it does. **Schema:** `docs/API.md`.

If you run out of room, report PARTIAL with the steps left.

## Files
(Rewritten 2026-11-18 for the refactor cards R1, R5c and R6, which land before this card runs.)
- Own:
  - `src/content/cities/<CITY>/**`, including the pack's voice fields: `barks`, `headBarks`, `orderCast`, `nightOvenLines` and `founder` (card R1 added them to `CityDef`).
  - `src/content/copy/<CITY>.ts`, the city's copy overrides (card R5c's system; Boston's `src/content/copy/boston.ts` is the example).
  - New `src/components/cutscene/backdrops/<CITY>.tsx`, the city's backdrops (card R6's split; `boston.tsx` is the example), with any new shape helpers in `src/components/cutscene/backdrop-art.ts`.
  - New `src/components/portrait/outfits/<CITY>.ts`, plus the city's `AGED` and look entries.
  - `scripts/fixtures/<NN>_<CITY>.py`: chicago 160–169, new-york 170–179, los-angeles 180–191. The old ranges 118–149 clash with existing shots 130–152 (`130_p1`, `140_v2`, `148_u4`).
- Shared, append-only: `src/content/cities/index.ts`, the registry line in `src/components/cutscene/backdrops/index.tsx`, `src/components/portrait/outfits/index.tsx`, `src/content/copy/index.ts`. Re-read each immediately before editing; add one line for your city; change nothing that exists.
- Do not touch: `src/engine/**`. Leave the pack's `fit` as card E4 set it; if E4 hasn't yet, copy Boston's and say so.
- If a refactor card has not landed (the shared files above don't exist), stop and report `Needs: R1/R5c/R6 first`.

## Steps
- [ ] **1. Data:** neighbourhoods in unlock order (with `plan: 'mirrored'` only where the script gives a reason, as home's dock and harbour do), perks, layer kinds, lieutenant, recipe cards, head names and barks, founder, and the layer copy as overrides in `src/content/copy/<CITY>.ts`.
- [ ] **2. Scenes:** main beats, interludes, returning-character scenes, the opening. `npx jest src/content/__tests__/city-schema.test.ts` must pass for your city.
- [ ] **3. Portraits:** six characters and the lieutenant, as variants of existing busts where they fit.
- [ ] **4. Backdrops:** one exterior and one interior per neighbourhood: palette, skyline, one signature object. Caption zone clear.
- [ ] **5. Layer dressing:** one re-dressed overlay element per layer, no new logic.
- [ ] **6. `los-angeles` only:** the showdown scenes and the ending, wired to card E4's `showdownView` (see `docs/API.md`); a five-round challenge strip built from the rival challenge chip; and the `crown-empire` cosmetic as one entry in `src/components/scene/cosmetics.ts` (a small gold crown on the storefront sign).

## Fixtures
City screen at the start; one cut-scene panel per neighbourhood; the lieutenant; one shop with its layer running. Los Angeles adds: a showdown round and the ending's last panel.

## Checks
`npx tsc --noEmit`; `npx jest src/content src/components`; `python3 -m py_compile scripts/fixtures/*_<CITY>.py`.
