# Card W4 — Store words (v5.23, lane T, writer)

**Goal:** everything the Store, its cards and the boosters say, in the game's voice, with value stated in game units only.

**Read first:** `docs/PRICING-STRATEGY.md` (§3–§5, the wording rules); `docs/build/v5.23/VERSION.md`; today's store copy in `src/components/store/store-model.ts` (`PRODUCTS`) and `copy-text.ts`; Nonna's voice (`docs/story/CAST.md`).

## Output
`docs/story/COPY-v5.23.md`, tables with keys:
1. **Store intro** (Nonna, ≤ 70 characters): `tutorial.16` (lighting the Store chip: a welcome gift for a new owner), `tutorial.17` (inside the Store, the Starter card lit). Never a price, never "deal".
2. **Starter card:** `store.starter.title`, `store.starter.nonna` (her line on the card), chip subs `store.chip.diamonds` ("Enough for {n} shop looks"), `store.chip.awning` ("Only in this pack"), `store.chip.boost` ("≈ {cash} at your shop's pace"), `store.starter.rate` ("Most diamonds per dollar in the store").
3. **Diamond packs:** names (Pinch, Box, Crate), `store.bonus` ("+{n} bonus"), `store.best` ("Best rate"), `store.firstbuy` ("First buy: 2×"), `store.looks` ("Enough for {n} looks").
4. **Plus:** `store.plus.title`, `store.plus.ads` ("You took {n} ad rewards this week. With Plus, they're one tap."), `store.plus.once` ("Pay once. Yours forever.").
5. **Boosters:** names and one-line descriptions for Rush Hour (1 h), Dinner Service (4 h), Big Night (12 h); `booster.pace` ("≈ {cash} at your shop's pace"); `booster.running` ("{name} running · {time} left"); `booster.full` (refused: the slot already has 24 h).
6. **Reminders:** `store.dot.label` (accessibility label for the dot), `store.nudge` (Nonna, the first time an unaffordable look is opened; mentions the Store, not a price).

## Rules
Banned: worth, value, save, deal, sale, limited, only today, hurry, last chance, any dollar amount (the store supplies prices). "Only in this pack" is allowed (it is true).

## Report
Standard format with counts.
