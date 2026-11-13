# Card U4 — a calmer first minute, one sky event at a time, rewards that look claimable (v5.17, lane U)

**Goal:** three places where the screen says too much or says the wrong thing: the first 20 seconds, the strip above the shop, and the daily tasks.

**Why (screenshot review of v5.15-r3 against Idle Miner Tycoon, AdVenture Capitalist and Egg, Inc., 2026-11-13):**
- Shot 04, twenty seconds in: the goal bar, four padlocked tabs, three hint bubbles, four buy buttons and Nonna's tip are all on screen at once.
- Shots 47, 56 and 59: the order offer, the MegaSlice banner, the golden pizza, its bubble and the roof sign share one strip. In 47 the golden box is cut off by the left edge.
- Shot 30: every unfinished daily task ends in a padlock, so the list reads as locked, not as things to do. In shot 32 the day-30 prize is labelled only "Visit".

**Read first:** `docs/API.md`. Then `src/engine/tutorial.ts`, `src/components/endgame/stack-model.ts` and its test, `src/components/rewards-model.ts`, and `scripts/fixtures/README.md`.

## Files
- Own: `src/components/endgame/banner-stack.tsx`, `stack-model.ts` and its test, `src/components/floating-bonus.tsx`, `src/components/order-chip.tsx`, `src/components/endgame/attack-banner.tsx`, `src/components/rewards-model.ts` and its test, `scripts/fixtures/148_u4.py` (new).
- The parts named in the steps, nothing else, in: `src/app/index.tsx` (what is shown while `coachStep(game)` is set), `src/engine/tutorial.ts`, `src/components/shop-ui.tsx` (`ShopTabs`), `src/components/storefront.tsx` (badges and pills only), `src/components/sidewalk-row.tsx`, `src/components/rewards-ui.tsx` (the task row and the gift calendar's last cell), `src/content/rewards.ts` (the day-30 prize's name).
- Do not touch: `src/engine/**` other than `tutorial.ts`, `src/components/scene/**`, `src/services/**`, `src/components/store/**`, `src/app/settings.tsx`, `src/app/shop.tsx`. No numbers that change income or rewards.

**You run after cards U3 and L1.** U3 added ad buttons to the task rows and the gift; L1 changed how `src/app/index.tsx` reads the store. Re-read each shared file immediately before you edit it and keep their work.

## Steps
- [ ] **1. One instruction at a time.** While the tutorial is on, the screen shows the coach's current step and nothing that competes with it: no "drivers idle" pill, no "Still baking" hint, no second or third hint bubble. Put the rule in one pure function (in `tutorial.ts` or a model beside it) that takes the game and returns which hints may show; the components ask it. Test: at every tutorial step the function allows at most one hint. The test must fail on today's code.
- [ ] **2. No padlocked tabs before they mean something.** `ShopTabs` hides the tabs of neighbourhoods that cannot be built yet until the first head is hired; after that it behaves as now. The active shop's tab stays. Test on the model or the props, not on pixels.
- [ ] **3. One sky event at a time.** The order offer, the attack banner, the event banner, the golden pizza and its bubble share the strip above the shop. Extend `stack-model.ts` (it already has `holdsBonus`) into one queue with a fixed priority: a running order's chip, then the attack banner, then an order offer, then the event banner, then the golden pizza. Only the first shows; the others wait and lose no time they are owed (an offer's 45-second wait and a golden pizza's lifetime start when they become visible). Test: for every pair of these five, the model returns one visible item. It must fail on today's overlap.
- [ ] **4. The golden box stays on screen.** Clamp its position so the box and its bubble are fully inside the safe width at 375 pt and 393 pt. Test the clamp in the model.
- [ ] **5. Tasks show progress, not a padlock.** An unfinished daily or weekly task shows its progress ("3 / 5") where the padlock pill is today, with the same size and the label "In progress, 3 of 5". A finished task keeps its Claim button. Chests keep their locked look. `rewards-model.ts` returns the text; test it.
- [ ] **6. The day-30 prize is named and is the largest cell.** The gift calendar's last cell shows the prize's name from `src/content/rewards.ts` and what it is, not "Visit", and is drawn as the most prominent cell. If the content has no name for it, add one field and list the string under `Needs:` for the writer; use a plain placeholder meanwhile.
- [ ] **7. Carried.** Rows with owner U in the carried-notes file from your spawn prompt, where they concern the files above.

## Fixtures (`scripts/fixtures/148_u4.py`, shots 148–152)
148 a fresh save twenty seconds in (the same moment as shot 04); 149 an order offer and a golden pizza due together: one shows; 150 an attack banner with a golden pizza waiting; 151 the daily tasks with one finished and two in progress; 152 the gift calendar on day 29. Move time with `advance()` and call `expect()` before each shot. Existing shots 03, 04, 30 to 32, 47, 56 and 59 will change; say so in your report.

## Rules
- A control is drawn at 44 pt or more, or at 40 pt or more with a `hitSlop` proven in `src/components/__tests__/tap-targets.test.ts`; never under 40 pt. Text is 10 pt or more. `python3 scripts/layout_check.py dev` must print `0 new`.
- Every control you add or change has an `accessibilityRole` and a label (card L1's grep test must stay green).
- Primitive props on memoised parts. No re-render per tick.
- Hiding a hint must not hide a way to act: every purchase that was possible before is still one tap away.

## Checks
`npx tsc --noEmit`; `npx jest src/components src/engine/__tests__/tutorial*`; `python3 -m py_compile scripts/fixtures/148_u4.py`; then export, run `python3 scripts/screenshots.py dev --only 148_u4`, open at most three shots at half size, and run `python3 scripts/layout_check.py dev`.
