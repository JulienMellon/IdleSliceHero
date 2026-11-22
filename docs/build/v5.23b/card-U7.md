# Card U7 — shop-surface minors and one colour rule (v5.23b, lane U)

**Goal:** close the carried U rows on the sidewalk, drawer, shop tabs, City screen and report strip. Then add a test so a buy button can't take a colour outside `buttonTone` again. The critic log shows each new button surface breaking the "green means it adds income" rule (D42, D53, D263, D313, D319, G75, D550, D553).

**Read first:** `docs/build/v5.23b/VERSION.md` (Defaults: tone, Missed-zero payoff); the U rows of `CARRY` that concern your files; `src/components/sidewalk-model.ts` (`buttonTone`, `cardLook`), `sidewalk-row.tsx`, `drawer-model.ts`, `shop-ui.tsx` (tabs, `BuyButton`), `src/app/city.tsx`, `src/components/city-map.tsx`, `src/components/report/report-strip.tsx`, `report-model.ts`, the coin layer's `emitCoin`; W6's `docs/story/COPY-v5.23b.md` (`report.missedZero`). Example of a source-scanning test: `src/components/__tests__/a11y-source.test.ts`.

## Files
- Own: `src/components/sidewalk-model.ts`, `sidewalk-row.tsx`, `drawer-model.ts`, `shop-ui.tsx`, `src/app/city.tsx`, `src/components/city-map.tsx`, `src/components/report/**`, `src/content/copy/home/report.ts` (the `report.missedZero` line from W6), their tests, the new `src/components/__tests__/button-tone-source.test.ts`, and fixture `scripts/fixtures/<next free number>_u7.py`.
- Fixtures that check what you rename: `grep -rln "<name>" src scripts/fixtures` (`189_u4.py` and `181_u3.py` likely).
- Do not touch: `rewards-ui`, `rewards-model`, `coach/**`, `game-ui.tsx`, `app/index.tsx` (U8); `scene/**` (S6, Q8).

## Steps
- [x] **1. D550.** The drawer's Expand buy is basil like every other buy and keeps the word "Expand". The comment in `drawer-model.ts` says this may already be done. Check shot 16; if it's done, record it and move on.
- [x] **2. D551.** One capacity format on every card: `446→486`, both sides abbreviated (`5.8K→6.2K`). The current value is never dropped, and the line sits 2 pt higher, clear of the button's lip. Test every format the model can produce.
- [x] **3. D553.** "no manager" (City list) and "you run it" (the shop tabs in `shop-ui.tsx`) are in ink, not tomato. The gold map halo shows only on the shop being visited.
- [x] **4. D554.** The strip carries a neutral suffix for the cold line ("· Word's spreading" or W6's wording) as it already does for "· Tips up". Draw `stripKind` everywhere it's computed.
- [x] **5. D556.** The Missed-zero payoff, as in VERSION.md Defaults: once per shop per session, read from the existing `missedZero` / `missedZeroShown` flags, using W6's line.
- [x] **6. The colour-rule test.** `button-tone-source.test.ts` scans `src/components/**` and `src/app/**` for a buy button's background or border taking a palette colour (`C.basil*`, `C.tomato*`, an amber hex) anywhere other than `buttonTone`, `cardLook` and `BuyButton`. It has an allowlist with a reason for each entry. Confirm it fails on a deliberate amber Expand before you finish.
- [x] **7. Any other U row in `CARRY` in these files.** Fix it, or say why not.

## Checks
`npx tsc --noEmit`; `npx jest src/components src/app`; `npm run format:check`; the fixture (`--only <your fixture>`).

## Report
Standard format. For each row you mark fixed, give the shot that shows it and what changed in its pixels. Also list every allowlist entry in the new test.
