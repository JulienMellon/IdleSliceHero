# Card CITY — one city pack (v5.19, lanes T, S and U; parameter CITY)

Your spawn prompt gives `CITY=chicago`, `new-york` or `los-angeles`.

**Goal:** `src/content/cities/<CITY>/` exists, passes the city schema test, and plays from its opening to its last scene.

**Script:** `docs/story/<CITY>-SCRIPT.md` (copy its text exactly). **Worked example:** `src/content/cities/boston/index.ts` and one of its neighbourhood files; do what it does. **Schema:** `docs/API.md`.

If you run out of room, report PARTIAL with the steps left.

## Files
- Own: `src/content/cities/<CITY>/**`, new characters in `src/components/portrait.tsx`, new backdrops in `src/components/cutscene/backdrop-art.ts` and `src/components/backdrop.tsx`, `scripts/fixtures/<NN>_<CITY>.py` (chicago 118–127, new-york 128–137, los-angeles 138–149).
- Shared, append-only: `src/content/cities/index.ts`.
- Two other programmers may be adding their cities to `portrait.tsx` and the backdrop files at the same time. Re-read immediately before each edit; add your entries in one block per file, marked with a comment naming the city; change nothing that exists.
- Do not touch: `src/engine/**`. Leave the pack's `fit` as card E4 set it; if E4 hasn't yet, copy Boston's and say so.

## Steps
- [ ] **1. Data:** neighbourhoods in unlock order, perks, layer kinds, lieutenant, recipe cards, head names and barks, layer copy.
- [ ] **2. Scenes:** main beats, interludes, returning-character scenes, the opening. `npx jest src/content/__tests__/city-schema.test.ts` must pass for your city.
- [ ] **3. Portraits:** six characters and the lieutenant, as variants of existing busts where they fit.
- [ ] **4. Backdrops:** one exterior and one interior per neighbourhood: palette, skyline, one signature object. Caption zone clear.
- [ ] **5. Layer dressing:** one re-dressed overlay element per layer, no new logic.
- [ ] **6. `los-angeles` only:** the showdown scenes and the ending, wired to card E4's `showdownView` (see `docs/API.md`); a five-round challenge strip built from the rival challenge chip; and the `crown-empire` cosmetic as one entry in `src/components/scene/cosmetics.ts` (a small gold crown on the storefront sign).

## Fixtures
City screen at the start; one cut-scene panel per neighbourhood; the lieutenant; one shop with its layer running. Los Angeles adds: a showdown round and the ending's last panel.

## Checks
`npx tsc --noEmit`; `npx jest src/content src/components`; `python3 -m py_compile scripts/fixtures/*_<CITY>.py`.
