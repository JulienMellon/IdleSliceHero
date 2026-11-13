# v5.17 handoff: performance audit (partial) and three UI cards

Written 2026-11-13 against `main` at `ca5300c`. Julien chose **v5.17** for the three UI cards below. The performance audit was stopped before the device-side measurement, so it feeds card L1 item 4 ("Performance and battery"). Nothing in `src/` was changed. A copy lives in the Pizza Game project as `claude/HANDOFF-perf-audit-and-v5.16-cards.md`.

## 1. Performance audit

### Measured (Node, late-game save: flagship Industrial, 6 shops, van fleet)
`npx tsx` on a throwaway script covering `src/engine` and the UI model functions only. These are server CPU numbers, not a phone, and they exclude React and SVG.

| Work | Cost | Rate |
| --- | --- | --- |
| `G.playTick` | 40 µs | every 200 ms |
| `bonusTick` + `orderTick` + `pickScene` + `tutorialAdvance` | ~6 µs | every 200 ms |
| `refreshRewards` | 4 µs | once a second |
| Home-screen derivations (goal loop, `rewardsHud`, teaser, `tiedBundle`, `earningsPerSecond`, `stationViews` + `sidewalkSlots`) | ~56 µs total | every render, so every 200 ms |
| `JSON.stringify(game)` | 20 µs, 6.4 KB | every 30 s and after every purchase |

**The engine and the models are not the problem.** About 100 µs per 200 ms tick is under 0.1% of a core. Don't optimise `src/engine/` or the `*-model.ts` files for speed.

### Not measured
- Storefront frame time on a phone or in Chrome's profiler.
- React commit time per 200 ms tick on the home screen.
- SVG node count per frame at the flagship tier.
- Startup: audio preload, JS parse time, memory.

### Where the cost most likely is (read from code; unverified)
1. **`Storefront` redraws the whole scene at 15 fps.** `useClock(15, paused)` calls `setT` every ~67 ms (`src/components/scene/clock.ts`). Each frame in `storefront.tsx` rebuilds and sorts the `items` array, runs `buildCast`, `stepCrew`, `placePops` and `badgeModels`, and returns one large `<Svg>`. The component opts out of React Compiler (`'use no memo'`). Static layers are memoised; the sort, cast and `Person` elements are new every frame. At flagship tier this is the largest per-frame tree in the app. `scripts/shots_lib.py` already notes that about 50 live pages animating at once stalled the late screenshots.
2. **`GameScreen` re-renders every 200 ms.** It subscribes to the whole `s.game` (`src/app/index.tsx`) and `tick` replaces `game` each time, so the goal bar, HUD, `SidewalkRow` (takes `game` as a prop) and `ShopTabs` re-render. The derivations are cheap; the cost is the React tree. `Storefront` is memoised and not affected.
3. **Saves are frequent.** `commit` calls `save()` after every purchase; orders and some rewards also save; `save` calls `set({game})`, one extra home-screen render each. Cheap today; a ×10/MAX spree could stack them.
4. **Audio ramp timer.** `src/audio/director.ts` line 47 starts `setInterval(stepRamps, 30)` (33 Hz). Not checked whether it stops when no ramp is active. Look first; it is the cheapest possible win if it runs forever.
5. **Size.** Web bundle: `entry` 1.1 MB, `index` 392 KB, `__common` 380 KB, `_layout` 176 KB. Audio 14 MB (at its cap). Images 1 MB.

### Order of work (fold into L1 item 4)
1. **Measure first.** Chrome Performance trace or React Profiler on the `13-flagship-max` seed (`scripts/screenshots.py`, the `flag` save) for 20 s: record Storefront commit ms and frames over 16 ms. Repeat on a real iPhone (Xcode Instruments or the Expo perf monitor); web numbers won't match.
2. Check item 4 (the 30 ms timer) in the same pass.
3. If Storefront commits are slow: lower the clock rate when nothing moves fast, stop the clock while any sheet, banner or order chip covers the scene (drawers, tasks and gift already pause it), and memoise `Person` elements by pose.
4. If `GameScreen` commits are slow: select only what it needs from the store, or split the HUD, goal bar and sidewalk row into components that subscribe to their own slices.
5. Pin each fix with a test that fails on the old code (see Lessons learned in `HANDOFF.md`). Don't touch pacing numbers; the economy is a fitted set.

## 2. Screenshot review (v5.15-r3, 18 of 79 shots)

Judged against award-winning idle games (AFK Journey, Idle Miner Tycoon, AdVenture Capitalist, Egg, Inc.). Screenshots can't show frame rate, motion or sound. Already at the bar: the whole loop is on one screen, and the shop visibly grows from a bare room to a flagship.

| # | Finding | Evidence |
| --- | --- | --- |
| 1 | First 20 seconds are crowded | Shot 04: goal bar, four padlocked tabs, three hint bubbles, four buy buttons and Nonna's tip at once |
| 2 | Sky strip collisions | Shots 47, 56, 59: order offer, MegaSlice banner, golden pizza, its bubble and the roof sign share one strip; the golden box clips the left edge in 47 |
| 3 | Rewards read as locked | Shot 30: every daily task has a padlock button; the day-30 prize is labelled only "Visit" (shot 32) |
| 4 | Late shops look alike | Industrial and the Suburbs flagship share one layout |
| 5 | Story ends on "Coming soon: Boston" | Shot 58; no reset loop at launch |
| 6 | Tiny text | "need $1", "no gain now", level badges look under 10 pt |

Findings 4 and 5 overlap the v5.16 layers and the v5.18/endgame work; 6 is not carded.

### Card outlines for v5.17 (not yet in the repo's card format)
Files are where to start; grep to confirm before scoping. Suggested owner letter U, one programmer, after wave 2 so the HUD and Settings changes from U3 have landed.

- **U4-a First-session focus.** During the tutorial show one instruction at a time. Hide padlocked tabs and the "drivers idle" and "Still baking" hints until the first hire. Files: `src/app/index.tsx` (`coachStep` gating), `src/engine/tutorial.ts`, `ShopTabs`, `storefront.tsx` (badges and pills), `sidewalk-row.tsx`. Check: tutorial tests; shots 03–04 retaken.
- **U4-b One sky event at a time.** Queue the order chip, attack banner, golden pizza and its bubble so only one shows; keep the golden box fully on screen. Files: `src/components/endgame/banner-stack.tsx`, `stack-model.ts` (`holdsBonus`), `floating-bonus.tsx`, `order-chip.tsx`, `endgame/attack-banner.tsx`. Check: a model test that fails on the old overlap; shots 47, 56, 59 retaken.
- **U4-c Rewards that look claimable.** Replace the padlock on daily tasks with progress or "Go"; make the day-30 prize the most prominent cell and name it. Files: `rewards-ui.tsx`, `rewards-model.ts`, `src/content/rewards.ts`. Check: model tests; shots 30–32 retaken.

IDs are placeholders; rename to the next free U ID when writing the cards. Two programmers at a time (usage limits, per `HANDOFF.md`).
