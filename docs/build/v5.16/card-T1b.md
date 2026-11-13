# Card T1b — Todd's looks and props, the managers' faces, Scrapbook, hint, cut-scene backdrops (v5.16, lane T)

**Goal:** everything card T1a added is drawn, and cut-scenes set in a shop show that neighbourhood's own interior.

**Spec:** `docs/specs/PLAN-v4.4-todd-interludes.md`, sections 5, 6 and 8. **Copy:** `docs/story/COPY-v5.16.md` section 5 (visitor lines) and section 6 (each manager's look line and Scrapbook tile title).

## Files
- Own: `src/components/portrait.tsx`, `src/components/backdrop.tsx`, `src/components/cutscene/**`, `src/components/cutscene-player.tsx`, `src/app/scrapbook.tsx`, `src/components/goal-model.ts` (the `Story n/N` count only), `scripts/fixtures/90_t1b.py` (shots 138–139 go in the same file).
- Shared, append-only: `src/components/slots.tsx` (the wait-hint banner as a `DRAWER_CARDS` entry), `src/content/rewards.ts` (visitor lines only).
- For step 1b only: the two places that name a manager's face `<shop>-gm` (`grep -rn "\-gm" src/components --include=*.ts --include=*.tsx | grep -v __tests__`: `storefront.tsx` and `drawer-model.ts`), and `src/components/scene/looks.ts` / `head-face.tsx` for the five fixed looks. Change nothing else in those files.
- Do not touch: `src/engine/**`, `src/content/scenes/**`.

## Steps
- [ ] **1. Three looks** (spec section 6): `mr-smith`, `todd-coat`, `slicey`, all variants of the `megaslice-rep` bust. The mustache must read as drawn on at phone size.
- [ ] **1b. The five managers** (added 2026-11-13). Portraits for `deb`, `skip`, `noor`, `dee`, `anton` from their look lines, each readable apart from the others and from the six leads at phone size. In the shop, the manager's badge and face use the manager's id from `MANAGERS` (`src/content/tuning.ts`) instead of the generated `<shop>-gm` face, with a fixed look that matches the portrait (same hair, same signature item). Nonna is unchanged.
- [ ] **2. Three props** (spec section 6): `order-slip`, `name-tag` with `propText`, `phone-footage`. `propText` must fit: add a pure fit function and test it against every `propText` in the scenes.
- [ ] **3. Scrapbook** (spec section 5): scenes in story order per neighbourhood, interlude tiles labelled "Interlude", hire-scene tiles titled from copy section 6, the header count from `HOME_SCENES.length` (40). Keep the v5.14 teaser line and the v5.15 Recipes section.
- [ ] **4. Wait hint** (spec section 5): `storyWaitHint` as a one-line banner in the waiting neighbourhood's drawer, in the Nonna-countdown style.
- [ ] **5. Shop backdrops per neighbourhood.** Today every shop-interior panel uses Rosa's Downtown interior. In `cutscene/backdrop-art.ts`, give each of the other five shops its own interior by palette, window view and one signature object (Suburbs: team pennants; Waterfront: porthole and nets; University: corkboard and string lights off the caption zone; Industrial: steel shelving; Uptown: marble and brass). Pick the interior from the scene's neighbourhood. Keep signs and billboards out of the 61 pt caption zone and keep 8 pt hand clearance (test T76 must still pass).
- [ ] **6. Later-cycle visitors.** Add Big Sal's and Genevieve's in-shop lines from the copy file next to Nonna's, keyed by cycle.
- [ ] **7. Carried.** Rows with owner T in the carried-notes file from your spawn prompt.

## Fixtures (`scripts/fixtures/90_t1b.py`, shots 90–97, then 138–139)
90 mr-smith (`downtown-1` P1); 91 name-tag (`suburbs-3b` P3); 92 order-slip (`downtown-5` P4); 93 phone-footage (`university-3c` P2); 94 slicey (`uptown-2b` P2); 95 Scrapbook with interlude tiles; 96 the Uptown wait hint; 97 a Waterfront shop-interior panel with its own backdrop.; 138 a hire scene (`university-hire` P2, Noor); 139 the Waterfront shop with Skip's badge and face, next to his portrait in the drawer's manager row.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `python3 -m py_compile scripts/fixtures/90_t1b.py`.
