# Card P1 — the shop report: live performance, and upgrades you choose (v5.16, lanes E and U)

**Goal:** the player can see how the shop is doing in pizza-shop terms, what it is losing and why, and picks the fix. The game stops pointing at the one card to buy.

**Why (Julien, playtest 3):** "I want gameplay to feel more like running a pizza shop... introducing a live shop-performance indicator. Let's allow the player to feel like they are thinking about what to upgrade rather than just buying the cheapest upgrade and waiting."

**Read first:** `docs/API.md` (`stageRates`, `demandRate`, `featureMults`, `shopEarnings`, `upgradeGain`, `runsItself`, `bonusUnlocked`, and `features/heads.ts`); `src/components/slots.tsx`; `src/components/sidewalk-model.ts`; `src/components/drawer-model.ts`. **Copy:** `docs/story/COPY-v5.16.md` section 7, by key. **Manager names:** `MANAGERS` in `src/content/tuning.ts` (card E0).

## Files
- Own: `src/engine/features/service.ts` and its test; `src/content/service.ts` (new: every number below); `src/components/report/**` (new: a pure `report-model.ts` with tests, the strip, the sheet); `src/components/sidewalk-model.ts`, `sidewalk-row.tsx`, `drawer-model.ts` and their tests; `scripts/fixtures/130_p1.py`.
- Shared, append-only: the feature registry (where `FEATURES` is listed), `src/components/slots.tsx`, `src/content/heads.ts` (step 6 only).
- One mount point in `src/app/index.tsx`: where the strip sits. No other change there.
- Do not touch: `src/engine/game.ts`, `src/components/scene/**`, `src/components/layers/**`.

**Running beside you:** card E2a adds layer features and appends to the same registry. Re-read the registry immediately before editing it.

## Julien's decisions (2026-11-13)
Service has consequences. The red "buy this" frame goes after the tutorial; **"Buy both" stays**.

## Steps
- [ ] **1. The service feature** (`features/service.ts`, pure views plus one small piece of state per shop). For a shop that runs itself, after the tutorial:
  - `wanted` = the demand rate with every other feature's demand multipliers, **before** this feature's own effect. `kitchen` = the slowest of prep, ovens and counter. `sold` = the smaller of the two. `service` = `sold / wanted` (1 when nothing is wanted).
  - Station load = `sold` ÷ that station's rate. Lamp: **Slammed** at 95% or more, **Busy** from 60%, **Idle** below.
  - Floor lamp from `wanted / kitchen`: **Line out the door** at 1.05 or more, **Steady** from 0.6, **Quiet** below.
  - `lostPerMinute` = (`wanted` − `sold`) × the shop's value per pizza × 60.
  - `reportView(g, id, now)` returns those, the quantities per minute, and `state: 'inactive' | 'tipping' | 'normal' | 'cold'`. Quantise loads and service to 5% steps.
- [ ] **2. Stakes**, through the `shopValueMult` hook.
  - **Tips:** service at 90% or more makes the shop's pizzas worth × 1.1. This is a pure function of the shop's rates, so `upgradeGain` sees it and a card can show the tip its upgrade would earn.
  - **Cold line:** service under 60% for 60 seconds of play in a row makes them worth × 0.9 until service is back to 60%. Julien picked "walk-ins thin out"; thinning demand changes nothing while the kitchen is the limit, so the cost is on value and the thinning is the picture: `reportView` gives `queueShare: 0.5` while cold, for the scene to draw a shorter line later.
  - Service is measured against demand before the penalty, so it cannot recover by itself. A 45-second Game Day or a 30-second boat cannot trip it. Away time: no tip, no penalty, and the timer starts again on return.
  - State per shop `{ below: number; cold: boolean }`; old saves migrate to zero. Do not call anything from the hook that reads value multipliers (no loop).
  - Emit `service-up` and `service-down` on the `pulse-bus` when tipping starts and when the line goes cold.
- [ ] **3. The strip.** One row, 44 pt, directly above the sidewalk row, mounted through a new `SHOP_REPORT` slot. It must not take more than 44 pt from the shop scene on an iPhone SE; if the kitchen pill already sits there, the strip replaces it and the pill's rush text becomes one of its states. Left: four lamps (prep, ovens, counter, floor) as coloured dots with a one-word label under the worst one. Right: one line from the copy, by state:
  - kitchen is the limit: served, wanted and the money walking out per minute;
  - floor is Quiet: what the kitchen could make against the orders coming in;
  - tipping: the tip;
  - cold: the penalty and what ends it.
  With a manager hired, the line is the manager's: their face badge, and the `report.<manager id>.*` copy. Without one, the neutral copy. Inactive shops (still tapped by hand, or in the tutorial) show nothing new.
- [ ] **4. The sheet.** Tapping the strip opens a sheet through `SHEETS`: each station's rate per minute and load, the floor, service with the tip and cold thresholds and the cold timer, and three short "ways to fix it" rows that name real purchases: faster stations, more customers (seating, drivers, fleet), pricier pizzas (oven grade, decor).
- [ ] **5. Cards say what they do; the game stops choosing.**
  - Every station, grade, expand, seating, driver and decor card gets an effect line from `upgradeGain`: the gain per minute and the payback time (`cost ÷ gain`, with `duration`), or the no-gain line naming the Slammed station. Heads and the manager state what they do instead of a number.
  - After the tutorial (`bonusUnlocked`), `frame` is always null and the bottleneck card loses its tomato fill. `tone: 'nogain'` stays. During the tutorial nothing changes.
  - "Buy both" stays as it is.
  - The drawer's "Bottleneck: ..." line becomes the report's line.
  - A test for each rule that fails on the old code.
- [ ] **6. Heads speak up before there is a manager.** Add the `slammed` trigger to `BarkTrigger`, after `attack` in `priority`, with the 18 lines from the copy. A head asks when their station's lamp has been Slammed for 20 seconds and the shop has no manager. Use the existing ask and memory rules; add no new timing code.
- [ ] **7. Carried.** Rows with owner U in the carried-notes file from your spawn prompt that concern the sidewalk row or the drawer.

## Fixtures (`scripts/fixtures/130_p1.py`, shots 130–137)
130 a manager's shop humming: tip on, the manager's line; 131 ovens Slammed, money walking out; 132 floor Quiet; 133 cold line after a minute under 60%; 134 the sheet open; 135 sidewalk cards after the tutorial: effect lines, no frame, "Buy both" present; 136 a tutorial shop that still shows the frame; 137 a heads-only shop with a head's `slammed` bubble. Seeded saves, plausible numbers.

## Rules
44 pt targets. Primitive props; nothing repaints on every tick. All text from the copy file by key and fitted: add a fit test for the strip's line at the SE width with the longest manager line.

## Checks
`npx tsc --noEmit`; `npx jest src/engine src/components`; `python3 -m py_compile scripts/fixtures/130_p1.py`.

## Report
Standard format, plus one line: the tip and cold multipliers, and whether the strip replaced the kitchen pill.
