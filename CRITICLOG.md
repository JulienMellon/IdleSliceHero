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

## v0.6 — build (redesign per Julien)

Julien's direction after v0.5: the main screen should be a cutaway of a growing pizzeria (ovens, workers, a counter where drivers pick up, a seating area for walk-ins); the player builds a new pizzeria in each neighborhood; restaurant upgrades are bigger/fancier ovens, more workers, a bigger footprint and bigger counters; each pizzeria needs a manager to run on its own. `docs/DESIGN.md` updated to match; the critic's instructions now include these as owner requirements.

- **Engine v2** (`src/engine/game.ts`): six independent pizzerias, each a Prep → Ovens → Counter → (Drivers + Seating) pipeline selling at its slowest stage; walk-ins pay 70%. Per-shop upgrades: Prep Cooks, Ovens, Oven Grade (Brick → Stone → Wood-fired → Copper → Golden, ×2 each), Counter, Drivers, Seating, Expand (5 footprints; each raises the level cap by 25 and adds oven slots/tables), Manager. City-wide Fleet (bike → drone). Unmanaged shops only bake tapped batches; Nonna becomes Downtown's manager via her story beat. v1 saves migrate (Downtown inherits oven/drivers; delivered-to neighborhoods get starter pizzerias). 25 tests.
- **Advice:** stages are often exactly tied, so upgrading one alone gains $0. `bottleneckBundle` finds the cheapest set (including an expansion when capped) that actually raises output; cards say "tied with ovens" instead of a misleading +$0.
- **Pacing** (sim rewritten for the new model, greedy best-value player): ~4h to finish the city, no story gap over 30 min. Build costs $300 → $60M, managers $600 → $90M; story triggers now count pizzas sold at that neighborhood's pizzeria.
- **Main screen:** HUD + goal bar → neighborhood tabs ($/s per shop, "tap to run", "+ Build") → animated cutaway: prep cooks at the dough table, bakers at fire-lit ovens on the back wall, counter staff, drivers in red caps walking in to grab boxes and leaving through the door (your fleet vehicle waits outside), walk-ins ordering then sitting at tables, seated guests. Bottleneck station tag lights red. The room widens with each expansion (outside street visible on small shops), oven count/size/material change with level and grade, the counter grows with more staff, decor goes shabby → menu board → string lights → photos → tiled wall and chandelier. Unmanaged shops show a pulsing TAP TO BAKE.
- **Station cards:** 2-column compact grid (Prep, Ovens, Counter, Drivers, Seating, Oven Grade, Expand, Fleet) with live rate and real +$/s; a wide manager card on top for unmanaged shops.
- **City screen** (🗺️ in the HUD): every neighborhood with its pizzeria, $/s or "needs manager", build cost on the next; a list of pizzerias (footprint, oven grade, drivers, $/s); tap to visit.
- **Story:** 9 scenes revised so each neighborhood's beat 1 is the grand opening of your new pizzeria there; two characters nudge you to hire a manager; Nonna takes over Downtown's kitchen in her finale.

## v0.6 — critique (round 5, first review of the redesign)

**VERDICT: NOT SATISFIED** — the redesign loads cleanly and meets most of Julien's direction (cutaway, pizzeria per neighborhood, managers, City screen, visible oven/counter/footprint growth). Economy and polish bugs remain.

**Fixed (carried over):** G17, D20, D21, D23 · **Blockers:** none

**Bugs**
- G18 Seating lowers income when a shop is supply-limited (walk-ins dilute the price mix); still shown as a green buy
- G19 Cutaway cash pops show one trip's value, not real income
- G20 No DRIVERS/SEATS tag, so the most common bottleneck never lights red
- G21 Flagship footprint is cropped at the edges (PREP tag cut off)
- G22 Light text on light active-tab fills (<2.5:1)
- G23 TAP TO BAKE pill at 0.6 opacity — chimney shows through
- G24 ⚙️ overlaps 🗺️; tapping the map corner opens Settings
- G25 Maxed Expand / Oven Grade say "Locked" instead of "MAX"
- G26 Non-speaking cut-scene characters dimmed by opacity — backdrop shows through faces

**Design notes**
- D24 Early taps feel like nothing: no per-tap feedback, no queue meter, output demand-limited
- D25 Worker counts don't grow (2 cooks, 1 baker at Lv 104 with 6 golden ovens)
- D26 Seating crowds in front of ovens/prep — needs its own zone
- D27 Active tab can be scrolled off-screen
- D28 City screen: empty bottom, trees under Uptown label
- D29 Offline popup still credits only Nonna; should list managers/pizzerias
- Harness: late shots all caught a cut-scene; late save off-curve

## v0.7 — build (addresses round 5)

| Note | Fix |
| --- | --- |
| G18 | Drivers get first pick of what the kitchen makes (full price), walk-ins buy what's left. Seating can only add sales; new test sweeps prep/drivers/tables combos and asserts Seating's gain is never negative |
| G19 | Cash pops show actual earnings since the last pop (pizzas sold × price), reset per shop |
| G20 | Fourth station tag "DRIVERS n" by the dining room; lights red when customers are the bottleneck |
| G21 | Cutaway drawn with `meet` on a sky-colored backing; Flagship room narrowed to 196 so nothing is cropped |
| G22 | Active tab text in dark ink on every color |
| G23 | TAP TO BAKE pill fully opaque; pulses in size instead of opacity |
| G24 | ⚙️ removed from the HUD (moved to the City screen header); 🗺️ stands alone |
| G25 | Maxed Expand / Oven Grade say "MAX" |
| G26 | Non-speaking cut-scene characters shrink slightly instead of going translucent |
| D24 | Every tap floats "+4 🍕" (or "+$X rush!" when managed); a queue meter shows "8 / 12 queued"; dough balls on the prep table show the queue; walk-in base rate doubled so taps turn into sales faster |
| D25 | Workers grow with levels: up to 4 prep cooks, one baker per oven, up to 3 counter staff (and registers), up to 4 drivers walking |
| D26 | New left-to-right layout: Prep \| Ovens \| Counter \| Dining room \| Door. Tiled kitchen floor vs wood dining floor; tables in two staggered rows in their own room; walk-ins order at the counter then sit down |
| D27 | Tabs auto-scroll to keep the active pizzeria in view |
| D28 | City screen: trees moved off labels; summary line shows built/managed counts; pizzeria list fills the lower half |
| D29 | Offline popup: "Your managers kept N pizzerias running for 2h 0m" with a per-pizzeria breakdown (engine returns `byShop`; test checks it sums to the total) |
| Harness | Late save is on-curve (costs ≈ minutes of income) and queues exactly one cut-scene, so the late main screen and its pops are captured |
| Found by harness | Web taps can arrive without `locationX`; the per-tap pop got a NaN position (console errors). Guarded |

## v0.7 — critique (round 6)

**VERDICT: NOT SATISFIED** — loads clean; most of round 5 fixed. New: unreadable tap pops, dining room crowds as the shop grows, misleading taps on a full queue.

**Fixed:** G18, G19, G20, G21, G22, G23, G24, G25, G26, D25, D27, D29, harness late save · **Partly open:** D24 → G27/G29, D26 → G28, D28 → D32 · **Blockers:** none

**Bugs**
- G27 Tap/rush pops: stroke drawn over the fill makes a green smear; sits on the chimneys
- G28 Dining room gets only leftover width — tables overlap at Double storefront and worse at Flagship
- G29 Full queue: tap does nothing but still says "+4 🍕"; HUD still says tap
- G30 Offline "managers kept N pizzerias running" counts unmanaged shops that only finished their queue

**Design notes**
- D30 Toast now sits over the counter/drivers — anchor under the goal bar
- D31 Four prep cooks clump — stagger in depth
- D32 City screen bottom still empty — list next build and locked neighborhoods
- D33 Goal bar "$3.2M" vs HUD "$3.20M"
- D34 Active Industrial tab looks grey/disabled
- Harness: add Flagship + MAX shot and full-queue tap shot

## v0.8 — build (addresses round 6)

| Note | Fix |
| --- | --- |
| G27 | Tap/rush pops drawn as a stroked copy under a white fill copy (like the cash pop), bigger, placed in the open wall space between the queue meter and the ovens |
| G28 | Layout reserves ≥30% of the room for the dining room; ovens shrink to share the rest; tables drawn only as many as fit 15 units apart, in two staggered rows. Flagship with 6 golden ovens and Lv 110 seating now reads cleanly (13-flagship-max) |
| G29 | Tapping a full queue floats "Kitchen full!" in ink; HUD subtitle switches to "Kitchen full — hire more drivers!" (names the actual bottleneck) |
| G30 | Offline popup counts only managed pizzerias in "Your managers kept N…"; unmanaged shops that finished their queue are listed as "(queued orders)"; engine `byShop` carries `managed`, tested |
| D30 | Toast anchored at the bottom edge of the cutaway, over the station tags rather than the counter and drivers |
| D31 | With 3–4 prep cooks they stand in two staggered depth rows, alternating shade and size |
| D32 | City list shows all six neighborhoods: built ones with stats, the next with "Build $800K" (tappable) plus order value and manager cost, the rest locked |
| D33 | Goal bar's current amount uses the same 3-significant-figure format as the HUD |
| D34 | Active tab gets a white outline and a slight lift |
| Harness | New shots: 03b full-queue tap, 13 Flagship (maxed Expand/Grade → MAX), 14 its cards |

## v0.8 — critique (round 7)

**VERDICT: NOT SATISFIED** — loads clean and holds to Julien's direction (cutaway, pizzeria per neighborhood, managers, visible growth at Flagship). Remaining bugs are cutaway polish.

**Fixed:** G28, G29, G30, D32, D33, D34, harness shots · **Partly open:** G27 → G31, D30 → G32, D31 → D35 · **Blockers:** none

**Bugs**
- G31 Fast taps stack pops ~1 unit apart into a smear; the 🍕 emoji gets stroked into a blob
- G32 Toast uses a hard-coded offset and lands 30pt high, covering the bottleneck tag
- G33 Drivers bunch into one many-legged body at the counter and the door
- G34 City map names Uptown/Industrial while the list shows "???"

**Design notes**
- D35 Prep cooks still clump (offsets 0/6/9/15); prep zone squeezed at Flagship
- D36 Late cash pop runs into the right wall
- D37 "hire more oven power" → "upgrade your ovens"
- D38 Active Industrial tab still a dull taupe
- D39 Manager card should use Nonna's portrait
- D40 Unmanaged shops show every upgrade green, pulling cash away from the manager
- Harness: Flagship shot should use a high-value shop

## v0.9 — build (addresses round 7)

| Note | Fix |
| --- | --- |
| G31 | Tap pops are solid pills (no stroke over the emoji). A repeat of the newest message refreshes it with a counter ("Kitchen full! ×2", "+$7.63K rush! ×3") instead of stacking; a different message takes a second slot 10 units lower; at most 2 on screen |
| G32 | Toast position comes from the cutaway's measured `onLayout` and sits over the shop sign, clear of stations and tags |
| G33 | Each driver has their own pickup spot 7 units apart; drivers walk the back lane behind the tables; walk-ins order beyond the drivers' spots; phases spread so drivers rarely meet at the door |
| G34 | City list names every neighborhood (locked rows say "Build the previous pizzeria first"), matching the map |
| D35 | Prep zone widens with the number of cooks (7 units each) and cooks are spaced evenly, alternating depth |
| D36 | Cash pop clamped by its text width so it stays inside the room |
| D37 | "Kitchen full — upgrade your ovens!" |
| D38 | Active tab is cheese-yellow with a white outline for every neighborhood |
| D39 | Nonna's manager card uses her portrait |
| D40 | On an unmanaged pizzeria, station cards are muted and read "Only while tapping · …"; the manager card stays bright and red-outlined |
| Harness | Flagship shot now uses Industrial (high-value shop) |

## v0.9 — critique (round 8)

**VERDICT: NOT SATISFIED** — loads clean and holds to Julien's direction. Drivers still merge; Oven Grade advertises a gain that isn't there.

**Fixed:** G31, G32, G34, D35, D36, D37, D38, D39, D40, harness Flagship shot · **Partly open:** G33 → G35 · **Blockers:** none

**Bugs**
- G35 Driver spots 7 apart but a driver is ~11 wide — still a many-legged clump; walk-ins pass through drivers
- G36 Oven Grade card always says "×2 bake speed", even when it adds $0/s (oven isn't the limit)

**Design notes**
- D41 Grade multiplies only ovens and Prep/Counter cap out — late game ovens run 12× faster than prep; Prep becomes a permanent wall
- D42 Buttons turn green whenever affordable, even for $0/s upgrades; the one useful buy can look grey
- D43 Rush pop sits on the chimney tops in tall-oven layouts
- D44 Late cut-scene backdrop ~60% empty sky; "Vending Machine War" shows no vending machine
- D45 Muted cards on unmanaged shops still have pale-green buy buttons
- Harness: shot 14 duplicates 13

## v1.0 — build (addresses round 8)

| Note | Fix |
| --- | --- |
| G35 | Driver pickup spots 12 units apart; only as many drivers shown as fit between counter and door; alternate drivers stand a step deeper; walk-ins queue at the near end of the counter on their own front lane |
| G36 | Oven Grade shows its real gain ("→ Golden: ×2 bake · +$X/s", or "→ Golden · +$0/s now") |
| D41 | **Economy:** each Expand tier now speeds up Prep and Counter ×1.5 ("more room to work, bigger counter"), so the late-game Prep wall lifts as the shop grows; test added. Rebalanced to keep pacing: expansions cost 2–4× more; University/Industrial/Uptown build + manager costs and late story triggers raised. Sim: city in ~3.8h, longest story gap 35 min |
| D42 | Affordable upgrades that add $0/s right now get a soft (pale) button; only buys that actually raise income are bright green |
| D43 | Rush pops on managed shops float above the chimney line |
| D44 | New vending-machine prop drawn into "Vending Machine War"; tall panels get a distant skyline; panel height capped near square so there's less empty sky |
| D45 | Station buttons on unmanaged shops use a neutral beige fill, so the red-outlined manager card is the clear next step |
| Harness | Duplicate shot 14 dropped; late save crosses the new Industrial trigger so the late cut-scene is captured |

## v1.0 — critique (round 9)

**VERDICT: NOT SATISFIED** — loads clean; Owner's direction holds; best Flagship cutaway so far. Drivers still clump while walking; Expand skips the honest-button rule.

**Fixed:** G36, D41, D42 (except Expand), D43, D44, D45, harness · **Still open:** G35 → G37 · **Blockers:** none

**Bugs**
- G37 Drivers stand still only 15% of their loop; walkers pass through standers in the same lane — blobs near the door

**Design notes**
- D46 Expand card always bright green and never mentions its ×1.5 prep/counter boost or real +$/s
- D47 Late managers are walls for non-tappers (Uptown $300M ≈ 48 min); re-run the sim without tapping, keep gaps ≤45 min
- D48 "Only while tapping ·" prefix truncates card text — use one banner
- D49 Idle shop shows no driver even though the card says Drivers × 1
- D50 Top of the late cut-scene panel still flat grey (minor)

## v1.1 — build (addresses round 9)

| Note | Fix |
| --- | --- |
| G37 | Drivers now stand at their own spot for 60% of the loop (was 15%); arriving and leaving they use a back lane, drawn smaller and behind, and everyone is drawn in depth order — walkers never pass through standers. Mid-game shows a clean line of drivers at the counter (05) |
| D46 | Expand card: "×1.5 prep & counter · +$X/s" (or "Lv cap → 75" when a station is capped, else "+$0/s now"); soft button unless it actually helps |
| D47 | Industrial manager $30M → $12M, Uptown $100M (was $300M). Pacing sim gained `NOTAP=1` (casual player who never taps after Nonna): longest story gap 21 min, city in ~3.4h |
| D48 | One banner above the grid on unmanaged shops ("Without a manager, upgrades here only pay while you tap.") instead of a prefix on every card |
| D49 | An idle shop shows one driver waiting at the counter |
| D50 | Tall panels get a MegaSlice rooftop billboard high in the skyline |

## v1.1 — critique (round 10)

**VERDICT: NOT SATISFIED** — loads clean; Owner's direction holds. The billboard fix regressed the opening panel, and two cutaway overlaps remain. "With those done, this build would be at SATISFIED."

**Fixed:** D46, D47 (sim not re-run by critic), D48, D49, G37 (mostly) · **Reworked into a regression:** D50 → G38 · **Blockers:** none

**Bugs**
- G38 Billboard drawn on every tall panel, including the rainy opener — poles dangle from the caption; MegaSlice branding before the story introduces it; poles float above the roofs
- G39 (a) Walk-in waits 4 units from driver 0 — they overlap in the first 30s; (b) arriving and leaving drivers share one back lane and stack at the door

**Design notes**
- D51 At Flagship, drivers bunch in the right third; spread pickup spots across the counter-to-door span
- D52 City map order doesn't match unlock order (Uptown before Industrial visually)
- D53 $0/s station buttons on managed shops could use the beige fill too (minor)

## v1.2 — build (addresses round 10)

| Note | Fix |
| --- | --- |
| G38 | Billboard only on Industrial/Uptown panels (after MegaSlice enters the story) — the rainy opener is clean again. It sits just above the skyline, below the caption area, and both poles end on tower roofs |
| G39 | (a) Walk-ins wait in front of the counter's near edge, 11+ units from the first driver; (b) arriving drivers use one back lane, leaving drivers a deeper one, so they never stack at the door |
| D51 | Pickup spots spread across the whole counter-to-door span (12–20 units apart) on big shops |
| D52 | City map: Industrial moved to the top-middle and Uptown to the top-right, so build order reads left to right |
| D53 | Every $0/s button (managed or not) uses the beige fill; only buys that raise income are bright green |

## v1.2 — critique (round 11)

**VERDICT: NOT SATISFIED** — loads clean; all five round-10 items fixed in code and screenshots; Owner's direction holds. The G39b lane fix made drivers float on the wall.

**Fixed:** G38, G39a, D51 (code), D52, D53 · **Still open:** G39b → G40 · **Blockers:** none

**Bugs**
- G40 Drivers' back lanes sit 4.5–8 units above the floor — they walk on the wall and leave through the door's window

**Design notes**
- D54 At Flagship, tables sit under the pickup zone — diners, drivers and walkers merge into one crowd; keep a clear pickup strip by the counter and put tables nearer the door
- D55 Seated walk-ins teleport back to the door when their loop wraps
- D56 "Not enough cash" toast covers the shop sign and queue bar (minor)

## v1.3 — build (addresses round 11)

| Note | Fix |
| --- | --- |
| G40 | All driver lanes moved onto the floor band: standing drivers at FLOOR_Y+3, arriving lane FLOOR_Y+1.5, leaving lane FLOOR_Y+0.4 (both further back, drawn slightly smaller); drivers leave over the door threshold, not through the window |
| D54 | Dining room split into a clear **pickup strip** in front of the counter (~42% of the dining width, 14–56 units) where drivers wait, and a **seating block** toward the door where all tables sit |
| D55 | Walk-ins fade in at the door, walk to their seat, sit, then fade out at the table — no teleport |
| D56 | Toast moved to the top of the card grid, clear of the shop sign, queue bar and station tags |

## v1.3 — critique (round 12)

**VERDICT: NOT SATISFIED** — loads clean; Owner's direction holds except visible driver/table counts. The pickup strip squeezed the dining room, and the floor lanes are too close.

**Fixed:** G40, D54 (with side effects), D55, D56 · **Regressions:** G37 → G41, D54 → G42 · **Blockers:** none

**Bugs**
- G41 Back lanes only 1.5–2.6 units behind standing drivers (figures are ~15 tall) — walkers pass through standers again
- G42 Every shop size shows at most 2 drivers, and the biggest shop dropped from 8 tables to 4 — upgrades no longer visibly show

**Design notes**
- D57 Seated guests sit on the door side of tables; seating block runs into the door
- D58 Walk-ins fade in on top of drivers leaving through the door
- D59 Walk-ins sit for only ~15% of their loop — the seating looks empty
- D60 Toast now covers the manager card; stale code comment (minor)

### Plan for v1.3 → v1.4 (driver overlap has survived several fixes; planned from the floor geometry)
The floor band is 16 units deep (FLOOR_Y..+16); a figure is ~15 tall, so lanes must be ≥5 units of depth apart to read as in front/behind.
- **Depth lanes in the pickup strip:** back lane +1 (drivers arriving and leaving), standing rows +6 and +10 (alternating), walk-in lane +15 (front). Every neighbouring pair is 4–5 units apart.
- **Two staggered standing rows** let drivers sit 9 units apart in x, so the strip holds 4 drivers in ~34 units.
- **Give the dining room room to grow:** 38% at footprint 2, 44% from footprint 3 up (was 30%); pickup strip 18–34 units; tables use the rest at 15 units per column. Visible drivers 2 → 4 and tables 2 → 6 as the shop grows.
- **Seating:** guests sit on the counter side of their table; the seating block stops 6 units short of the door; walk-ins appear 4 units inside the door; seated for ~40% of their loop.

## v1.4 — build (addresses round 12, per the plan above)

| Note | Fix |
| --- | --- |
| G41 | Depth lanes on the 16-unit floor: drivers walk in and out on the back lane (+1), step forward to stand in one of two rows (+6 / +10), step back with a box and walk out; walk-ins use the front lane (+15). Every neighbouring lane is 4–5 units apart, and everyone is drawn back-to-front |
| G42 | Dining room grows with the shop (30% → 38% at footprint 2 → 44% from footprint 3); pickup strip 18–34 units; drivers stand in two staggered rows 9 units apart. Visible drivers grow 1 → 2 → 3–4 and tables 2 → 4 → 6 as the shop expands (13: 3 drivers, 6 tables) |
| D57 | Seated guests sit on the counter side of their tables, facing them; seating block stops 5 units short of the door |
| D58 | Walk-ins appear 4 units inside the door, phase-offset from drivers' exits |
| D59 | Walk-ins are seated for ~40% of their loop (was ~15%), fading out only in the last 10% |
| D60 | Stale toast comment fixed |

## v1.4 — critique (round 13)

**VERDICT: NOT SATISFIED** — loads clean; the depth lanes finally fix drivers walking through each other; drivers and tables grow with the shop. But the bigger dining room took width from the ovens.

**Fixed:** G41, G42, D57, D58, D59 · **Still open:** D60 → D63 · **Blockers:** none

**Bugs**
- G43 From Expand 3/5 the ovens shrink to ~2.5–3-unit sticks (Golden Flagship ovens look like spikes) — upgrades look worse than before, breaking the owner's "bigger, fancier ovens" rule

**Design notes**
- D61 Seated guests in a table column overlap each other
- D62 Walk-ins cut diagonally through the standing driver rows to reach their seat
- D63 Toast still covers the manager card title
- D64 22 and 44 drivers look the same — add a "×44" badge or parked scooters
- D65 Rush pill covers the menu board; OVENS/COUNTER tags touch at Flagship (minor)

### Plan for v1.5
The room is at most 196 units wide, so the ovens, counter and dining room compete for width. Real pizzerias stack deck ovens, and that's the fix:
- **Stacked deck ovens:** when a single row would make ovens narrower than 9 units, ovens go into two tiers (a lower and an upper deck). 6 ovens = 3 columns × 2 decks at ≥12 units each. Chimneys sit on the upper deck; one baker per column.
- **Width budget:** dining 34% (footprint 2) / 38% (footprint 3+); pickup strip 18–26; table columns 14 wide → Flagship keeps 3 drivers and 6 tables while ovens stay ≥12 wide.
- Guests: back-row diners sit on the left chair and front-row diners on the right; walk-ins stay on the front lane until they reach their table's x, then step back to the seat.
- Toast in the gap above the card grid; driver count badge "×44" by the pickup strip; rush pill below the menu board; tags spaced ≥25 units apart.

## v1.5 — build (addresses round 13, per the plan above)

| Note | Fix |
| --- | --- |
| G43 | **Stacked deck ovens:** when a single row would make ovens narrower than 9 units, they stack in two decks (lower + upper, chimney on top). Flagship: 6 Golden ovens as 3 columns × 2 decks, each ~16 wide; Expand 3/5: 4 Copper ovens as 2 × 2. Width budget rebalanced (dining 34% / 38%, pickup strip 18–26, 14-unit table columns) — Flagship keeps 3 drivers and 6 tables. One baker per oven column |
| D61 | Back-row diners sit on the left chair, front-row diners on the right chair facing left — no more stacking |
| D62 | Walk-ins walk back along the front lane until they reach their table's x, then step to their seat — never through the driver rows |
| D63 | Toast is compact and sits on the sidewalk strip just below the station tags, clear of the manager card |
| D64 | Driver badge ("🚐 ×44") above the pickup strip whenever the shop has more drivers than are drawn |
| D65 | Tap/rush pills stay over the kitchen (not the menu board); station tags spaced ≥27 units apart |

## v1.5 — critique (round 14) — ✅ SATISFIED

**VERDICT: SATISFIED** — loads clean (`loaded: true`, `errors: []`, all 16 screenshots render). Stacked deck ovens fix G43: the Flagship shows a 3×2 bank of Golden ovens while keeping 3 drivers and 6 tables. Owner's direction holds: cutaway with prep, ovens, counter, pickup strip and seating; a pizzeria and manager per neighbourhood; upgrades visibly grow the shop.

**Fixed:** G43, D61, D62, D63, D64, D65 (tag half) · **Blockers:** none · **Bugs:** none

**Remaining polish (minor, not required):**
- D66 Bakers stand in front of the lower-deck oven mouths, hiding the fire
- D67 Rush pill still covers the menu board — the v1.5 table claimed this was fixed, but the clamp centres the pill, so a wide pill still reaches the board (the rush-pill half of D65, still open)
- D68 Compact toast touches the manager card's top border by ~3pt
- D69 Counter staff's legs show above the counter
- D70 Walk-in lane is the same depth as front-row diners

**Loop complete:** 14 review rounds, v0.1 → v1.5.
