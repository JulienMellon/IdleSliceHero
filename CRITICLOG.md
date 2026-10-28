# Critic Log

Each loop: the **critic** reviews the build's iPhone-size screenshots against App Store screenshots of popular iOS idle games, then the build team ships a new version addressing every note. The loop ends when the critic is satisfied (a build that fails to load or has a blocking bug can never pass).

- Screenshots: `screenshots/<version>/` (regenerate with `npx expo export --platform web && python3 scripts/screenshots.py <version>`)
- Reference set (local only, not committed): Idle Miner Tycoon, AdVenture Capitalist, Eatventure, Pizza Ready!, Idle Lumber Empire, Idle Bank Tycoon, Idle Pizza Restaurant Tycoon
- Critic definition: `.claude/agents/critic.md`

---

## v0.1 — build (2026-10-28)

First playable, matching the design doc's v0.1 scope with placeholder art.

- Expo SDK 58 (pinned 58.0.20), TypeScript, Expo Router, Zustand, AsyncStorage, react-native-svg, Fredoka font
- Engine (`src/engine/game.ts`): bake → shelf → drivers rotate through unlocked neighborhoods → cash; 18 unit tests
- 3 upgrades (oven speed, drivers, vehicle tiers bike → drone), 6 neighborhoods, ×2 milestones at 25/50/100
- Offline earnings, 4-hour cap, "While you were away" popup; saves on purchase, every 30s, and on background
- Cut-scene player (auto-advance, tap, skip, reward card) + Scrapbook replay; all 24 home-city scenes written
- Placeholder art: SVG character portraits (8 characters × 5 moods), 8 scene backdrops, SVG city map with animated drivers

**Decisions made (proposed; change any of them):**
- Home city: fictional **Port Marinara**
- Before managers exist, the oven needs a tap per batch until Nonna's recipe scene (Downtown beat 4, ~2 min in); then it bakes automatically, which is what makes idle/offline earnings work in v0.1
- Starting numbers in `src/content/tuning.ts`, checked with `scripts/pacing-sim.ts`: a greedy player finishes the city in ~8 hours of active play (first 8 scenes in ~10 minutes)
- Scene triggers: beat 1 on unlock, beats 2–4 on pizzas delivered to that neighborhood

## v0.1 — critique (round 1)

**VERDICT: NOT SATISFIED** — loads with no errors and the core loop works end to end; the map crops labels, cut-scene backdrops lose most of their art, and the first minute points the player the wrong way.

**Blockers:** none

**Bugs**
- G1 City map uses `slice`, cropping Uptown under the HUD and Waterfront's label under the sheet
- G2 Shop roof cuts through the "Downtown" label; parked scooters sit on it
- G3 Cut-scene backdrops are 2:1 art in a near-square frame — only the middle ~53% shows
- G4 HUD says "keep tapping!" while drivers are the bottleneck and the shelf is full
- G5 "Not enough cash" toast covers the Drivers row
- G6 HUD bleeds through the 0.94-opacity cut-scene overlay; cash collides with scene titles
- G7 Offline cash is already in the HUD before Collect is pressed; Collect does nothing
- G8 Costs show trailing ".0" ("$60.0K")

**Design notes**
- D1 No payoff in the first minute — every button stays gray for 20s+; make the first purchase land in ~10s
- D2 No always-visible next-goal progress bar (vs Idle Pizza Restaurant Tycoon, Idle Bank Tycoon)
- D3 Vehicle row is below the fold in every shot; oven card too tall
- D4 Too little feedback: tiny overlapping "+$" pops; no cash flash or purchase burst
- D5 Whole screen + SVG re-renders ~30×/sec — battery/frame risk on older iPhones
- D6 "*bite*" caption is weak as a hero line
- D7 Scrapbook badge hard-coded off
- D8 "Baking automatically · tap to rush" wraps to two lines

## v0.2 — build (addresses round 1)

| Note | Fix |
| --- | --- |
| G1 | Map redrawn for a 100×76 viewBox fitted with `meet`; every node sits inside the box and clear of the sheet |
| G2 | New layout: Downtown moved beside the shop; parked drivers line up to the shop's right, off all labels |
| G3 | Backdrops recomposed as 4:3 (extra sky with clouds / shop wall) in a 4:3 frame — no cropping |
| G4 | HUD hint follows the bottleneck: "Shelf full — hire a driver!", "Hire a driver…", or "Tap the oven…" |
| G5 | Toast moved to just under the HUD, auto-clears after 1.8s |
| G6 | Cut-scene backdrop is fully opaque; frame + bubble vertically centered |
| G7 | Offline cash is held until Collect, then counts up in the HUD (and is still saved if the app closes first) |
| G8 | Trailing zeros dropped ("$60K", "$9.5M"); test added |
| D1 | First driver costs $8 (was $20): first purchase ~10s in; unit test guards ≤15s; pacing sim still ~8h per city |
| D2 | Always-visible goal bar under the cash: next neighborhood, or the vehicle it needs, or story progress; tap to buy when full |
| D3 | Oven card ~40% shorter; "Open neighborhood" row folded into the goal bar — all three upgrades fit above the fold |
| D4 | Bigger outlined "+$" pops, one per neighborhood; cash pulses on payouts; purchase burst (✨💰🍕) + success/error haptics, shake on "can't afford" |
| D5 | Sim tick 10→5 Hz; map runs its own 16 fps clock so only the SVG redraws; screen-level 50 ms timer removed |
| D6 | "*bite*" caption rewritten as narration + stronger line |
| D7 | Scrapbook badge counts scenes seen since the Scrapbook was last opened |
| D8 | Oven status shortened to "Auto-baking · tap to rush" (single line) |

## v0.2 — critique (round 2)

**VERDICT: NOT SATISFIED** — loads clean; most of round 1 fixed. New small bugs; G4, D4, D5 only partly fixed.

**Fixed:** G1, G2, G3, G5, G6, G7, G8, D1, D2, D3, D6, D7, D8 · **Partly open:** G4 → G10, D4 → D9, D5 → D10

**Blockers:** none

**Bugs**
- G9 Speech-bubble tail fixed at 18% — points at empty space when one character is centered
- G10 "Tap the oven to bake!" shown while drivers are the bottleneck but unaffordable (first ~10s)
- G11 "+$" pops drawn inside each driver group, so later drivers cover them
- G12 Starting a batch with the shelf at 9–11 throws away up to 3 pizzas
- G13 Old saves without `scrapbookViewed` show a badge counting every scene ever seen

**Design notes**
- D9 Cash never actually pulses on payouts (count-up threshold never hit in normal play)
- D10 Whole screen re-renders 5×/s and the full SVG ~21×/s including static layers; map clock runs under cut-scenes
- D11 White goal-bar text unreadable on the yellow fill
- D12 Late-game goal "Finish the story" isn't actionable; Drones purchase not surfaced
- D13 Cut-scene panel uses only ~32% of screen height
- D14 Opening art (sunny skyline, no sign) contradicts "Rain. One flickering sign"
- D15 HUD cash jitters in width from dropped trailing zeros
- D16 Locked Suburbs/Waterfront label borders tucked ~2pt under the sheet

## v0.3 — build (addresses round 2)

| Note | Fix |
| --- | --- |
| G9 | Speech tail centered when one character is on screen; hidden for empty panels |
| G10 | Hint follows the real bottleneck: "Saving for a driver: $5 / $8", "Shelf full — saving…", "Hire a driver…" |
| G11 | All "+$" pops drawn in their own layer above every driver; clamped so Uptown's pop stays on screen |
| G12 | No pizza is ever thrown away: overflow waits in the oven (`ovenHeld`) and drops onto the shelf as space frees; a batch can start whenever the shelf has room; 2 tests |
| G13 | Saves without `scrapbookViewed` count every already-seen scene as viewed; test |
| D9 | Each delivery landing on the map emits a payout event; the HUD cash gives a small kick on every one |
| D10 | Static map layers (ground, roads, neighborhoods, shop) in a memoized layer; only drivers/pops/pulse animate; map clock pauses under cut-scenes and popups |
| D11 | Goal bar: dark ink on a light track with yellow fill; white-on-green only when ready to tap |
| D12 | Late goals are actionable: next vehicle (e.g. "Upgrade to Drones $2.7M / $3M"), then "Deliver to Uptown for the next story 7K / 20K 🍕" |
| D13 | Cut-scene panel ~55% of screen height; backdrops grow their sky to fit any frame (no cropping); bigger portraits |
| D14 | New rainy-dusk opening backdrop with Rosa's storefront and a half-dark flickering neon sign; shop interior gained string lights and an "EST. 1974" photo |
| D15 | HUD cash always shows 3 significant figures ("$3.90K") so it doesn't change width |
| D16 | Suburbs/Waterfront moved up 2 units; locked labels clear the sheet |

## v0.3 — critique (round 3)

**VERDICT: NOT SATISFIED** — loads clean; every round-2 item fixed, no regressions. New late-game economy bug: oven output is capped by the tick rate.

**Fixed:** G9, G10, G11, G12, G13, D9, D10, D11, D12, D13, D14, D15, D16 · **Blockers:** none

**Bugs**
- G14 Oven can add at most one shelf (12 pizzas) per 0.2s tick → real output capped at 60/sec; oven upgrades past Lv 50 wasted; HUD shows $10.5K/sec vs ~$6.5K/sec actual; offline pays more than online
- G15 Same bug leaves the late-game oven card at "0/12 · TAP TO BAKE!" with auto-bake on
- G16 Uptown road runs through its label (vans cover it); Uptown pop clamped onto the building

**Design notes**
- D17 Drones row reads like a downgrade ("10 pizzas/trip" vs Van's 14); show net gain (+37%)
- D18 Downtown's pop rises into the University label
- D19 Drivers icon is a cook, not a delivery driver

## v0.4 — build (addresses round 3)

| Note | Fix |
| --- | --- |
| G14 | When batches are faster than a tick, baking and delivering run as continuous flows — no per-tick shelf cap. New tests check real tick throughput against `earningsPerSecond` at Oven Lv 72 (±2%) and at Lv 1–150. HUD $/sec, online and offline earnings now agree |
| G14 (knock-on) | The old tuning was unknowingly balanced around the cap, so with it gone the city finished in ~2h. Retuned: University $200K, Industrial $1.2M, Uptown $10M, Car $80K, Van $600K, Drone $25M; late scene triggers raised (University 6K/25K/60K, Industrial 20K/60K/150K, Uptown 40K/120K/300K). Pacing sim now reads triggers from the scene data: ~6.3h active play for the city; first 12 scenes in ~18 min, late scenes 15–70 min apart |
| G15 | Oven never shows "TAP TO BAKE" or pulses once auto-bake is on |
| G16 | Neighborhood name tags moved to a layer above the drivers; Uptown's pop floats below it in open space |
| D17 | Vehicle row shows the net gain: "+37% deliveries per driver" |
| D18 | Each neighborhood's pop has its own open spot beside it (no two collide) and rises less |
| D19 | New custom SVG icon for Drivers: courier in a red cap holding a pizza box |

## v0.4 — critique (round 4)

**VERDICT: NOT SATISFIED** — loads clean; all round-3 items fixed, no regressions. One small bug; the retune makes the goal bar point at the weaker upgrade.

**Fixed:** G14, G15, G16, D17, D18, D19 · **Blockers:** none

**Bugs**
- G17 In late game (continuous oven), "tap to rush" does nothing but still says it does and still bounces

**Design notes**
- D20 Goal bar says "Open University $200K" when Cars ($80K) is the better buy (+110% vs +62%)
- D21 Drones row/goal promise "+37% deliveries" while the oven is the limit — real gain $0/sec
- D22 Uptown pop rises into the Uptown label; late pops (6–7 chars) may clip buildings
- D23 Longest late-game gap ~70 min; keep under ~40
- Harness: late save no longer triggers a late cut-scene; late save prices outdated

## v0.5 — build (addresses round 4; checkpoint, not reviewed)

G17 rush-order taps pay 0.25s of earnings on a fast oven · D20/D21 goal bar and rows driven by real cash/sec-per-dollar (`gainOf`, `bestBigPurchase`), "+$0/sec now · oven is the limit" when true · D22 smaller late pops, Uptown pop clear of its label · D23 longest gap ≤40 min (Uptown $5M; ~4.7h active play) · harness late save updated, extra late shots.

**Loop paused:** Julien asked for a redesign of the main screen (pizzeria cutaway with ovens, workers and a pickup counter) and of the core loop (build a new pizzeria in each neighborhood instead of adding delivery territory). v0.5 was not sent to the critic; the loop resumes on the redesigned build.
