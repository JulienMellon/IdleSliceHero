# Card U5 — tap targets and text size, to the rule (v5.16, lane U)

**Goal:** every control has a 44 pt touch area that is either drawn or proven by a test, no text is under 10 pt, and the layout allowlist is empty except for Close.

**Why (measured on v5.15, `docs/PLAN-loop-improvements.md`):** fix round r3 of v5.15 shrank the HUD's round buttons from 44 to 40 pt and the ×1 chip to 36 pt, because critic notes G101 and G102 suggested it. The `hitSlop` values added with them are not covered by a test. A DOM probe over all 92 shots also found three 39 pt tall buttons, a 22 pt tall Back link, a 30 pt tall goal bar, and about 30 strings under 10 pt. `docs/build/v5.17/HANDOFF-perf-and-ui.md` noted the small text by eye (its finding 6).

**Julien's decisions (2026-11-13, DECISIONS #29 to #31):**
- **The five round HUD buttons stay 40 pt drawn.** The rule becomes: a control is drawn at 44 pt or more in both directions, **or** at 40 pt or more with a `hitSlop` that a test proves reaches 44 pt inside space its parent owns. Never under 40 pt drawn.
- **Every other control under 44 pt is fixed to that rule.** No exceptions except Close.
- **Text is 10 pt or more.**

**Read first:** `scripts/layout_allow.json` (your to-do list: every entry with `"card": "U5"`; it was written by the loop update, card Q3) and `scripts/fixtures/README.md` (how to run one fixture). Then `src/components/tap-targets.ts` and its test, and `src/components/endgame/fit-model.ts` (`HUD_ICON`, `cashWidth`).

## Files
- Own: `src/components/tap-targets.ts`, `src/components/__tests__/tap-targets.test.ts`, `src/components/endgame/fit-model.ts` and its test, `src/components/endgame/diamond-chip.tsx`, `scripts/layout_allow.json`.
- Sizes, slops and font sizes only, nothing else, in: `src/components/game-ui.tsx`, `src/components/sidewalk-row.tsx`, `src/components/sidewalk-model.ts`, `src/components/rewards-ui.tsx`, `src/components/cutscene-player.tsx`, `src/components/shop-ui.tsx`, `src/app/shop.tsx`, `src/app/settings.tsx`, `src/app/city.tsx`, `src/app/scrapbook.tsx`, and whichever component draws a text finding in the allowlist (name each in your report).
- Do not touch: `src/engine/**`, `src/components/scene/**`, `src/content/**`. No copy changes: if a string cannot fit at 10 pt, list it under `Needs:` with the room it has.

**You run last in this version,** after P1 (sidewalk row), S2a and S2b (HUD chips) and T1b (Scrapbook, cut-scene player) have landed. Re-read each file immediately before you edit it and keep your change to the numbers.

## Steps
- [ ] **1. The rule, in one place.** Rewrite the header comment of `tap-targets.ts` to state the rule above. Add `MIN_DRAWN = 40` and `MIN_HIT = 44`, and a helper that says whether a control passes given its drawn size, its slop and the room its parent owns.
- [ ] **2. Prove the HUD buttons.** Model the top row in `tap-targets.ts` from the same constants the StyleSheet uses (`HUD_ICON`, `HUD_GAP`, `HUD_PAD`, the row's height). Tests: each of the five buttons reaches 44 pt in both directions inside the row; two neighbours' slops do not overlap by more than the gap allows (today the middle buttons have a slop of 4 on each side of a 6 pt gap; make the numbers honest); the same on a 375 pt wide screen. Then give the five HUD entries in `layout_allow.json` a `"proof"` naming the test and set their `"card"` to `null`.
- [ ] **3. The ×1 / ×10 / MAX chip** (`buy-amount`, 36 × 55). Bring it to the rule: either 40 pt wide with a proven slop, or 44 pt. Take the width from the row's gaps before the cards; the card prices must still fit (they clipped once: G102). Keep `fitFont` on the prices.
- [ ] **4. The 39 pt buttons** (`collect-offline`, `gift-claim-btn`, `gift-repair`, `buy-night-oven-sheet`): draw them at 44 pt.
- [ ] **5. Back, Settings and Skip** (`back` 70 × 22 on four screens, `open-settings` 70 × 29, `skip-scene` 74 × 31): 44 pt tall, drawn, with the label where it is now. `skip-scene` already has a slop of 12; if you keep a slop instead, prove it.
- [ ] **6. The goal bar** (`goal`, 30 pt tall). If it is tappable, give it a 44 pt touch area by a proven slop into the HUD's own padding; don't make the bar taller. If it is not meant to be tapped, remove the button role.
- [ ] **7. Text to 10 pt.** For every `text` entry in the allowlist: raise it to 10 pt. Where a label has no room at 10 pt (the station labels "DRIVERS" and "COUNTER" at 8.5 pt, "BOTTLENECK", the "need $…" line at 9 pt and 7.5 pt on the flagship), make room in the layout first, and shrink-to-fit with a floor of 10. Change every `fitFont(…, min)` whose floor is under 10.
- [ ] **8. Empty the allowlist.** Delete each entry you fixed. What remains: the HUD entries with their proof, any other control you kept at 40 to 43 pt with its proof, and Close. `python3 scripts/layout_check.py <label>` prints `0 new` and `0 stale`.
- [ ] **9. Carried.** D477 (the goal "Upgrade fleet to Cars · +$83…" clips in shot 05b2: short form "Cars · +$83/s") and the rows with owner U in the carried-notes file named in your spawn prompt, where they concern the files above.

## Rules
- A critic note's suggested size does not outrank this rule. If a fix would need a control under 40 pt or text under 10 pt, stop and put it under `Needs:`.
- The cash is the most important number on the screen (G101). Nothing here may make it clip or shrink sooner than it does today: `cashWidth` at 393 pt with five buttons stays 139 pt or more.
- Primitive props on memoised parts. No re-render per tick.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; then, as the spawn prompt says, export and run the fixtures that show what you changed (`scripts/fixtures/README.md` lists them), open three shots, and run `python3 scripts/layout_check.py dev`: `new` must be 0. After a partial run it lists the shots you did not take as `stale`; ignore that, the orchestrator's full verify checks it. Report the allowlist's entry count before and after.
