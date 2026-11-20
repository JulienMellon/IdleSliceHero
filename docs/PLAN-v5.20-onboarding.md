# Plan v5.20–v5.24 — teaching the game, reading the shop, the store

**Approved by Julien, 2026-11-20** (all defaults below). Source: his playtest notes of 2026-11-20 and two planning rounds that day. The build cards are in `docs/build/v5.20/` … `docs/build/v5.24/`; where a card differs from this outline, the card is right. Prices and store wording: `docs/PRICING-STRATEGY.md`.

## Julien's notes (2026-11-20)
1. The tutorial's gray mask leaves the progress dials gray; nothing explains them.
2. "Tap Ovens to bake faster" with a yellow card doesn't focus attention. One method: gray everything but the target.
3. The store report appears only after Downtown, with no tutorial.
4. Stop labelling the bottleneck. **"I don't want to direct the player to 'buy this' with red highlights. Communicate the state of the business in multiple ways so finding the bottleneck and upgrading is the player's job."**
5. The goal bar doesn't read as a goal. Tapping it should open a task list; the first list is part of the tutorial.
6. What gates the next story scene is unclear. The core story needs clear goals, shown by the task list.
7. The Starter Pack seems to vanish after "Not now". Introduce the Store there, with the pack in it.
8. Don't sell packs as "worth $X". Price every store item with pricing psychology in mind (→ `PRICING-STRATEGY.md`). Timed income boosts may be sold.

## Causes found in the code (main @ c98565c)
- The spotlight scrim is drawn inside `storefront.tsx`'s SVG and its cut-out covers the station only; the dials sit on the badge rail outside it.
- Three highlight styles in nine steps: the scene scrim, `cardCoach` yellow on the sidewalk card, the HUD `halo`.
- `reportActive()` needs the shop to run itself **and** `bonusUnlocked` (Nonna's takeover, 2,217 pizzas).
- Pointers still on after the tutorial: drawer "Bottleneck: …", "Buy both", tomato tied-station badges (G80), station names on the idle-drivers pill, red "Slammed" lamps, the "+$/min" preview on every card.
- The goal bar is `pickGoal()`, a best-buy suggestion that re-ranks with income and buys on tap.
- Story beats are gated by hidden pizza counts and play-time timers.
- The Store is reached only by the diamond chip, which appears at the takeover; the Starter sheet fires 30 s after the tutorial.

## The versions
| Version | What the player gets |
|---|---|
| **v5.20** | One spotlight for everything: a full-screen gray scrim with one cut-out, over any element (scene station + its dial, sidewalk card, drawer card, HUD). Chapter 1 rewritten: the dials explained, the second oven, the upgrade drawer, Marco. |
| **v5.21** | The goal bar is the current chapter's next task; tapping it opens the task list (Story tab first, then Daily / Weekly). Every main story beat is unlocked by its chapter's 2–4 visible tasks. The tutorial gains its two task-list steps. |
| **v5.22** | The shop shows its own state six ways (piles, workers, customers, sound, symptom lines from the cast, a report with same-coloured capacity bars against a demand line). Upgrade cards show capacity, not "+$/min". Every bottleneck pointer goes. The report is live from a shop's first head hire and has a 3-step tutorial that explains how to read it and stops there. |
| **v5.23** | The Store from the end of Chapter 1, introduced by Nonna with the Starter Pack inside it (no pop-up, no countdown). New pack contents and card wording. First buy of each diamond pack pays double. Diamond boosters (Rush Hour / Dinner Service / Big Night) in one paid-boost slot. |
| **v5.24** | The looks catalog grows to about 30 items in three price tiers with a set per neighbourhood and a weekly Featured row; the $19.99 pack. |

## Decisions (Julien, 2026-11-20; DECISIONS.md #35–#46)
1. Goal-bar tap always opens the task list; no buying from the bar.
2. Main beats are gated only by chapter tasks; interludes stay timed.
3. Remove "Buy both", tomato badges, station names on the drivers pill, red lamp chips, the drawer's "Bottleneck" header (reverses 2026-11-13's "keep Buy both").
4. Upgrade cards show capacity (pizzas/min), not "+$/min".
5. The spotlight swallows taps outside its cut-out during tap steps.
6. The report is live from a shop's first head hire.
7. Chapter tasks are outcomes (serve N, serve N a minute, hire, miss no orders), never "buy X". Chapter 1 is the only place the game names a purchase.
8. Prices, contents, diamond boosters and wording as in `PRICING-STRATEGY.md`.
9. Diamonds buy looks **and** timed boosters (was looks only).
10. No time-limited paid offers; no "worth $X".
