# Card U8 — Story tab, coach and goal-bar minors (v5.23b, lane U)

**Goal:** close the carried U rows on the Story tab, the coach hand, the goal bar and ribbon, and the shop chips, and land W6's Chapter 1 and tutorial lines. These are cheap rows (copy, icons, offsets, one format). Most of them have been open since v5.21.

**Read first:** `docs/build/v5.23b/VERSION.md`; the U rows of `CARRY` that concern your files; W6's `docs/story/COPY-v5.23b.md`; `src/components/rewards-ui.tsx`, `rewards-model.ts`, `src/components/coach/overlay-model.ts`, `overlay.tsx`, the goal bar and ribbon in `src/components/game-ui.tsx`, the chips block of `src/app/index.tsx`, `src/components/icons.tsx`, and `src/engine/chapters.ts` (read-only: what a chapter unlocks).

## Files
- Own: `src/components/rewards-ui.tsx`, `rewards-model.ts`, `src/components/coach/**`, the goal bar and goal ribbon in `game-ui.tsx`, the shop-chip block of `src/app/index.tsx`, `src/components/icons.tsx` (adding icons only), `src/content/copy/home/tutorial.ts` (`tutorial.report.3`) and the file that holds the chapter story lines (`story.ch1.line`; find it with `grep -rn "Corporate Crust" src/content`), the rival band's glow hook in `src/components/layers/rival/**` (D547 only; coordinate with S6's file through `WAVE-NOTES.md`), their tests, and fixture `scripts/fixtures/<next free number>_u8.py`.
- Fixtures that check what you change: `grep -rln "tutorial.report\|Dashed line\|Chapter 1\|holding" scripts/fixtures src` (`192_e4.py` expects "Dashed line, cara").
- Do not touch: the sidewalk, drawer, tabs, City or `report/**` (U7); `scene/**` (S6, Q8); `src/engine/**`.

## Steps
- [ ] **1. Story tab.**
  - D535: the clapper and gem on the reward row are SVG, and the tabs and locked chips use one lock glyph.
  - D537: a rate row over its target reads "6/6 · holding" with a full ring.
  - D538: the reward row names the gameplay unlock ("Daily tasks open" on Chapter 4), read from `chapters.ts`.
  - D545: the Chapter 1 card gets W6's `story.ch1.line` and Nonna's portrait, like Chapters 2 to 4.
- [ ] **2. Coach.** D542: the tutorial hand is offset 24 pt right and below, so it never covers the "Chapter 2" label. Use the same rule as D525/D531: the hand never covers a number, a label or another control. Add a test over every coach step's target.
- [ ] **3. Goal bar.** D544: the "Chapter N complete" ribbon is gone by 1.5 s, and the tick badge doesn't crowd "Ch N". Check this against the freeze-clock fixture.
- [ ] **4. Chips.** D540: the Suburbs chip reads "Opens after Ch 4" while a chapter gates it.
- [ ] **5. D547.** Tapping Go on a "Beat …" row lands on the shop with the rival challenge band glowing for 2 s.
- [ ] **6. D555.** Land W6's `tutorial.report.3`. If its opening changed, update `192_e4.py`'s expected text.
- [ ] **7. Any other U or E row in `CARRY` in these files.** Fix it, or say why not.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `npm run format:check`; the fixture (`--only <your fixture>,192_e4`).

## Report
Standard format. For each row you mark fixed, give the shot that shows it and what changed in its pixels.
