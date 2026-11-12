# Card T1b — Todd's looks and props, Scrapbook, hint, cut-scene backdrops (v5.16, lane T)

**Goal:** everything card T1a added is drawn, and cut-scenes set in a shop show that neighbourhood's own interior.

**Spec:** `docs/specs/PLAN-v4.4-todd-interludes.md`, sections 5, 6 and 8. **Copy:** `docs/story/COPY-v5.16.md` section 5 (visitor lines).

## Files
- Own: `src/components/portrait.tsx`, `src/components/backdrop.tsx`, `src/components/cutscene/**`, `src/components/cutscene-player.tsx`, `src/app/scrapbook.tsx`, `src/components/goal-model.ts` (the `Story n/N` count only), `scripts/fixtures/90_t1b.py`.
- Shared, append-only: `src/components/slots.tsx` (the wait-hint banner as a `DRAWER_CARDS` entry), `src/content/rewards.ts` (visitor lines only).
- Do not touch: `src/engine/**`, `src/content/scenes/**`.

## Steps
- [ ] **1. Three looks** (spec section 6): `mr-smith`, `todd-coat`, `slicey`, all variants of the `megaslice-rep` bust. The mustache must read as drawn on at phone size.
- [ ] **2. Three props** (spec section 6): `order-slip`, `name-tag` with `propText`, `phone-footage`. `propText` must fit: add a pure fit function and test it against every `propText` in the scenes.
- [ ] **3. Scrapbook** (spec section 5): scenes in story order per neighbourhood, interlude tiles labelled "Interlude", the header count from `HOME_SCENES.length`. Keep the v5.14 teaser line and the v5.15 Recipes section.
- [ ] **4. Wait hint** (spec section 5): `storyWaitHint` as a one-line banner in the waiting neighbourhood's drawer, in the Nonna-countdown style.
- [ ] **5. Shop backdrops per neighbourhood.** Today every shop-interior panel uses Rosa's Downtown interior. In `cutscene/backdrop-art.ts`, give each of the other five shops its own interior by palette, window view and one signature object (Suburbs: team pennants; Waterfront: porthole and nets; University: corkboard and string lights off the caption zone; Industrial: steel shelving; Uptown: marble and brass). Pick the interior from the scene's neighbourhood. Keep signs and billboards out of the 61 pt caption zone and keep 8 pt hand clearance (test T76 must still pass).
- [ ] **6. Later-cycle visitors.** Add Big Sal's and Genevieve's in-shop lines from the copy file next to Nonna's, keyed by cycle.
- [ ] **7. Carried.** Rows with owner T in the carried-notes file from your spawn prompt.

## Fixtures (`scripts/fixtures/90_t1b.py`, shots 90–97)
90 mr-smith (`downtown-1` P1); 91 name-tag (`suburbs-3b` P3); 92 order-slip (`downtown-5` P4); 93 phone-footage (`university-3c` P2); 94 slicey (`uptown-2b` P2); 95 Scrapbook with interlude tiles; 96 the Uptown wait hint; 97 a Waterfront shop-interior panel with its own backdrop.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `python3 -m py_compile scripts/fixtures/90_t1b.py`.
