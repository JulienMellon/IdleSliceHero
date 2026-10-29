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

## v2.0 — WIP handoff (storefront redesign, not yet critiqued)

**Status:** code is in place and typechecks/exports (`npx expo export --platform web` → `dist`). The new storefront has **not** passed the critic. Nothing is committed yet (working tree has the v2.0 changes, `shop-cutaway.tsx` deleted, `storefront.tsx` new). The repo stop-hook asks for commit + push; do that once the first screenshot pass is clean.

**What v2.0 adds (owner direction, rounds after v1.5):**
- Pizzeria takes most of the screen; menus are pulled into a tap-only drawer (`All` button). No gestures other than taps.
- One-point perspective storefront (`storefront.tsx`): back wall, side walls, floor by flooring tier, front wall with brick sill, awning, open door with OPEN sign and WELCOME mat, planters.
- Sidewalk in front of the shop carrying the Prep / Ovens / Counter / Drivers buttons plus `All`.
- Street with lanes and traffic (MEGASLICE van, taxi, car) below the sidewalk; clouds drift and trees sit at the sides of the background.
- Visible cash register on each counter, staff at stations, drivers walk in via the door, walk-ins enter, order, and sit.
- Decor upgrades (5 kinds × 3 tiers, +4% prices per tier per shop, costs 150 / 8K / 400K ×cost multiplier): plants, flooring, tables, wall decor, signage (rooftop giant pizza at tier 3). Stored as `shop.decor` (save migrates to 0 defaults).
- Engine: 30 tests passing. Pacing sim with decor prices at 150/8K/400K gives city completion ≈3.7h and a longest story gap ≈37 min.

**Screenshots of this pass** (`screenshots/v2.0/`):
- Mid-game, offline popup covering the scene: `screenshots/v2.0/05-mid-game.png`
- Late game, offline popup covering the scene: `screenshots/v2.0/09-late-game.png`
- Opening / new game / flagship shots also in `screenshots/v2.0/`

**Problems seen in this pass (to fix before the critic runs):**
1. **Harness blocked by the offline popup.** Every later interaction (tags, `open-upgrades`, tab navigation, scrapbook, late oven tap) failed because the OfflinePopup stayed over the scene. Fix the harness to dismiss it (find the Collect/dismiss testID in `game-ui.tsx` `OfflinePopup`), or seed a save with `lastSeen` close to now.
2. **Invisible station tags intercept taps on the shop.** `storefront.tsx` line ~1133 renders `tag-<station>` Pressables over the scene at `fit.oy + (y-16)*fit.s`. Playwright shows `tag-drivers` intercepting clicks aimed at the shop (`data-testid="shop"`), and a `+$17M` pop intercepting too. Make tags small, make pops `pointerEvents="none"`, and keep only the tag itself tappable.
3. **Sidewalk button price pills overflow their cards.** In `09-late-game.png` the Drivers `$15.1K` pill runs past the card's right border, and the Prep/Ovens/Counter pills sit off-centre against the card edge. Fit the pill inside `BuyButton compact` (`game-ui.tsx`) with the card width.
4. **Decor and registers not verified yet.** The shots above are mostly low-tier decor. Need a fully decorated Flagship and an Uptown shot to confirm tier-3 signage, marble tables, mural walls, and register visibility.
5. **Pop/toast overlap with the door.** Cash pop sits over the door in the late shot; check it stays readable.

**Next steps (fresh session):**
1. Fix the harness (offline popup dismissal) and the tag/pop hit areas (item 2) and the pill overflow (item 3).
2. Run `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 scripts/screenshots.py v2.0`; confirm `errors: []`. Check `05a-upgrades-sheet` and `05a2-decor-section` exist.
3. Inspect the storefront at phone width: pizzeria dominates (≥ half the scene height), door reachable, sidewalk row clear of the street, decor tiers and registers visible.
4. Commit and push (git identity and attribution per the session instructions), log the v2.0 build entry here, and display it in chat.
5. Launch the `critic` agent on v2.0 as round 15 (new IDs start at **G44** and **D71**). Update `.claude/agents/critic.md` "Owner's direction" with the new requirements (perspective storefront, sidewalk button row, street/traffic, clouds/trees, front door, tap-only drawer, decor, cash register). Loop log → fix → bump version → re-review until SATISFIED.

**Open minor items carried from round 14:** D66 bakers hide lower oven fires, D67 rush pill covers menu board, D68 toast touches manager card border, D69 counter staff legs show above counter, D70 walk-in lane depth. Several may be superseded by the new scene; re-check each.

## v2.0 — build (pre-critic fixes)
Harness dismisses the offline popup and taps the back wall clear of the station tags; compact buy pills drop `minWidth: 88` so prices fit the sidewalk cards; MEGASLICE van lettering no longer mirrored when driving left; new shots 14-uptown-decorated and 15-tag-ovens-drawer. Critic brief gains the v2.0 owner direction and a **Visual design focus** section (owner's priority from round 15 on: polish the overall design and visual appeal; [major] visual notes block SATISFIED).

## v2.0 — critique (round 15) — ❌ NOT SATISFIED

**VERDICT: NOT SATISFIED** — loads clean (`errors: []`); the storefront meets the owner's direction (sidewalk buttons, tap-only drawer, street traffic, register, door path, decor up to the rooftop pizza). But the shop is undersized against a big empty sky, the box doesn't read as a storefront, the lighting is flat, the ovens are bullet-shaped, and the neighbourhoods look alike.

**Fixed:** D66, D67, D68, D70, WIP handoff items 1–3 · **Still open:** D69 (now D78) · **Blockers:** none

**Bugs**
- G44 The invisible `tag-ovens` hit box covers the lower part of the TAP TO BAKE pill, so tapping it opens the drawer instead of baking
- G45 Tier-2 framed photos are drawn over the tier-3 mural (`walls >= 2` should be `=== 2`)
- G46 The parked scooter/van sits under the sidewalk button row

**Visual design**
- D71 [major] Shop too small for the screen; ~137pt of empty sky → SC ~0.98, lift TY, sky band ≤60pt
- D72 [major] No front wall: door and awning float on the floor edge, raw side-wall edges → brick pilasters, fascia, full-width scalloped awning, wall caps
- D73 [major] Flat lighting → side/back wall gradients, ambient-occlusion bands at the seams
- D74 [major] Ovens look like missiles/torpedoes → domed brick ovens on a plinth, ember mouth; steel grade as a box deck oven
- D75 [major] Neighbourhoods look alike → per-neighbourhood sky, raised skyline, Waterfront water band and piers, Industrial smokestacks and fence
- D76 [major] City screen looks unfinished → road grid, mini storefront lots, fenced construction sites, shadows
- D77 [major] Labels and pills sit over the action → tag rail along the front sill, feedback pills in the sky band
- D78–D85 [minor] Cashier hidden behind the register; tier-3 top band cluttered; emoji icons clash with the SVG style; locked pill contrast; diners overlap; small cut-scene panel; street under the home indicator; 8pt queue text

**Design notes**
- D86 Oven Grade/Expand show "+$0/s now" · D87 focused card same red as the bottleneck card · D88 "Oven Grade" title truncated · D89 add an "×48" ovens badge

## v2.1 — build (addresses round 15)

| Note | Fix |
| --- | --- |
| D71 | Scene scale 0.86 → 0.98 and lifted; the shop fills ~94% of the width at Flagship. The sky band above the back wall is ~95 units and carries the feedback pills; base room widths raised (270 → 377) |
| D72 | Real street face: brick pilasters at both front corners up to a 340-unit front top, a dark fascia beam across the top carrying the sign plate, a full-width 12-scallop red/cream awning, and #5E3A26 wall caps along the cut tops. The door's separate canopy is gone; the door frame gets a header |
| D73 | Gradient side walls (left −0.26→−0.10, right −0.04→−0.18) and back wall (−0.10 top → +0.06 bottom); ambient-occlusion bands along every wall/floor seam; shadow band and crown rail under the back-wall top |
| D74 | Ovens redrawn: single-deck ovens are domes on a brick plinth with an arched mouth, a brick ring, a keystone and an ember gradient. Stacked decks and the Stone grade are box deck ovens with a glowing window door, handle bar, status lamp and legs. Wood-fired adds a log pile; Copper/Golden get rivet bands; Golden gets a sparkle |
| D75 | Per-neighbourhood sky (userSpace gradient), ground and skyline, raised so it shows beside and above the shop: windowed towers Downtown and Uptown (Uptown at sunset with lit windows), houses in Suburbs, sea, sailboat, piers and palms on a sandy Waterfront, a lavender University, and a haze sky, smokestacks, chain-link fences and drums in Industrial |
| D76 | City map: avenues and cross streets with dashed lines, built lots as mini Rosa's storefronts (awning, window, door), locked lots as fenced sites with a crane, drop shadows on lots and labels, lollipop trees. The map is re-spaced so the lots clear the roads; the gear is cream |
| D77 / G44 | In-scene station tags removed. Each sidewalk card's head is now the tap target (opens the drawer on that station, `tag-<station>`), with the level as a corner badge (red on the bottleneck). Queue bar and TAP TO BAKE sit under the awning; tap pills and the cash pop sit in the sky band |
| G45 | Framed photos only at walls tier 2 (`=== 2`) |
| G46 | Delivery vehicle parked on the sidewalk left of the door, clear of the button row |
| D78 | Counter lowered (52 → 38) with a trim panel; one register offset to the side so the cashier's face shows |
| D79 | Ferns hang from the fascia at 7%/93%; string lights only when signage < 2; back-corner plant at (L+14, 100); centre tree removed; the rooftop pizza sits on the fascia with a glow ring and highlight |
| D80 | Sidewalk cards use SVG chef-hat / flame / register / driver icons. The parked vehicle is drawn in SVG (bike, scooter with pizza box, car, van, drone); the ×N badge is text only |
| D81 | Locked price pills #E2D9CE with #8A7B6E text |
| D82 | Table pitch 60, back row offset 20 |
| D83 | Cut-scene panel up to 62% of the screen height (cap 1.3× width) |
| D84 | Street lanes raised (lanes at +38 / +66) clear of the home indicator |
| D85 | Queue text 10pt in a taller bar |
| D86 | Grade/Expand read "pays once <bottleneck> catch up" instead of "+$0/s now" |
| D87 | A card opened from the sidewalk gets a cheese-yellow focus ring, distinct from the red bottleneck |
| D88 | "Oven Grade" → "Grade" (no truncation) |
| D89 | Superseded: levels now show on the sidewalk badges |

Typecheck clean, 30 engine tests pass, `report.json` errors: [].

## v2.1 — critique (round 16) — ❌ NOT SATISFIED

**VERDICT: NOT SATISFIED** — a big visual step up: the shop fills the screen and reads as a street front, the ovens are proper domes and decks, and the City map looks finished. But the door is broken, the player's van carries the rival's MEGASLICE logo, and the Flagship spills off the screen.

**Fixed:** D71–D74, D76–D79, D81, D83, D85–D89, G44–G46 · **Still open:** D75 (→ D92/D93), D80 (→ D100), D82, D84 (→ D101) · **Blockers:** none

**Bugs**
- G47 Parked van tier reuses the purple MEGASLICE van → red ROSA'S van
- G48 Door leaf swings out through the right pilaster (OPEN reads "EN"); Flagship (R=385) runs off-screen → hinge inward, cap the widest footprint at ~360
- G49 Grade/Expand drawer detail truncated with "…"
- G50 A new tap pill with different text spawns behind the live one

**Design notes**
- D90 [major] The door reads as a freestanding frame; walkers pass its post → set it in the front plane with a brick jamb and glazed leaf
- D91–D101 [minor] Drop the in-scene ×N badge; peach dusk clouds in Uptown; stronger Suburbs (gables, picket fence, mailbox); a single hood over stacked deck ovens instead of birdhouse caps; a shelf with flour sacks and tins on the bare back wall; fern/plant pots fully on one side of the sill; wider lane spacing; walk-ins in front of the parked vehicle; inset the mural from the ferns; SVG icons in the drawer; street clear of the home indicator

## v2.2 — build (addresses round 16)

| Note | Fix |
| --- | --- |
| G47 | `Car` takes a `label`; the parked van tier is a red ROSA'S van (MEGASLICE stays on the rival's street traffic) |
| G48 / D90 | Entrance rebuilt in the front plane: brick jambs either side of the door, a brick lintel, wood frame posts, a glazed door leaf swung ~60° **into** the room (OPEN sign on its glass), and a see-through shop window with mullion and reflections above the entrance up to the fascia. Widest footprint capped at 358 so the Flagship's pilasters, awning ends and planter stay on screen |
| G49 | Drawer card details allow 3 lines; Grade/Expand copy shortened ("→ Wood-fired ×2 · waits on drivers & seats") |
| G50 | A new tap pill replaces the live one instead of stacking behind it |
| D91 | In-scene ×N driver badge removed (shown on the sidewalk Drivers card) |
| D92 | Uptown clouds are peach (#F6C6A8) with lavender undersides |
| D93 | Suburbs: taller houses whose gables rise above the awning line, chimneys, 4-pane windows, white picket fences in both yards, and a blue mailbox |
| D94 | Box deck ovens lose their per-oven caps; one stainless hood spans the bank with a flue up to the crown rail |
| D95 | Pantry shelf on the upper-left back wall (two FLOUR sacks + three tins) until the mural replaces it |
| D96 | Potted plants sit fully inside (y 16) or fully on the sidewalk (y −20), never on the sill |
| D97 / D101 | Traffic scaled 0.86 on lanes 32 apart (+30 / +62), clear of the home indicator |
| D98 | Walk-ins walk the sidewalk at y −44, in front of the parked vehicle |
| D99 | Mural inset 26 from the left wall; ferns at 4% / 96% |
| D100 | Drawer icons are SVG: chef hat, flame, register, driver, chair, sparkle, brick-expand, scooter, manager, and five decor icons |
| D82 | Dining rows at depth 12 / 44 (32 apart) so back-row diners clear the front-row chairs |

## v2.2 — critique (round 17) — ✅ SATISFIED

**VERDICT: SATISFIED** — loads clean (`loaded: true`, `errors: []`); every round-16 fix verified in the screenshots and code. The door sits in a brick bay and swings inward with a readable OPEN sign, the player's van is ROSA'S, and the widest shop stays on screen.

**Fixed:** G47–G50, D90–D95, D97–D101, D82 · **Still open:** D96 (partly → D106) · **Blockers:** none · **Bugs:** none

**Remaining polish (minor, not required):**
- D102 Emoji still mixed with the SVG style (HUD 📖/🗺️, 🔒 tabs, offline-popup row, 🏆, BuyButton burst, 🍕 tap pill — colour emoji in SVG text may render blank on iOS) → SVG book, map, padlock, trophy and slice icons
- D103 The "affordable but adds nothing now" pill looks almost the same as a locked one → white pill with INK text and a basil border; grey only for can't-afford
- D104 The oven-hood flue cuts through the tier-3 mural
- D105 The glass above the entrance reads as a thin pole → tint, wood frame and transom; move the back-wall window left
- D106 The sidewalk fern's leaves rise over the front-row diners
- D107 The cash pop loses contrast on a busy sky → basilDark pill
- D108 The late cut-scene panel is ~55% empty sky
- D109 City-map cranes touch the header → top padding
- D110 Pantry shelf shows only one bracket

**Loop complete (visual-polish pass):** rounds 15–17, v2.0 → v2.2.

## Round 18 setup — owner direction
Julien: make the **on-screen characters look more polished**; have the critic be **even more critical** of the visual design; fold every open CRITICLOG note into the next build. Critic brief gains a "Stricter bar + character focus" section (characters are a primary review area; clones, stiff primitive bodies, or unreadable faces are [major]; SATISFIED now also requires ≤3 [minor] visual notes).

## v2.3 — build (character redesign + every open note, D102–D110)

| Note | Fix |
| --- | --- |
| Characters (owner) | `Person` redrawn as polished chibi figures. Big round head with an ear, shadow crescent and highlight; oval eyes with catchlights, brows, a nose dot, a smile, and blush. Two outlined arms with hands; outlined legs with shoes and a walk cycle (alternating stride, foot lift, body bob); a shaped torso with a shadow side and highlight; a seated pose with thighs, shins and shoes. Each role reads at a glance: **cooks** wear white double-breasted jackets, red neckerchiefs and puffy toques; **bakers** wear burgundy shirts, leather aprons and polka-dot bandanas and hold a wooden pizza peel; **counter staff** wear green polos with a white collar, a name badge and a yellow cap; **drivers** wear blue zip jackets with a Rosa's patch and a red cap. Guests get seeded variety: 5 skin tones, 6 hair colours, 6 hair styles (short, bob, bun, curls, ponytail, bald + beard), glasses, body width, 8 shirt colours and 5 trouser colours. Same 1.1 ink outline and upper-left light as the furniture |
| D102 | Remaining emoji replaced with SVG: storybook and folded-map HUD buttons, padlock (tabs + City list), trophy (goal bar), scooter + whoosh + slice (offline popup), star/coin/slice (BuyButton burst), and a slice glyph in the "+4" tap pill |
| D103 | "Affordable but adds nothing now" pill is white with a 1.5px basil border and ink text; grey is only for can't-afford |
| D104 | With the tier-3 mural the hood flue stops just above the hood under a vent cap |
| D105 | The window above the entrance is tinted #CFE8F5, framed in door-post wood with a mullion and a transom bar at the lintel; the back-wall window moves left, clear of the frame |
| D106 | Sidewalk fern pot drawn at normal size, so its leaves no longer rise over the diners |
| D107 | Cash pop on a basilDark pill with a white rim |
| D108 | Cut-scene art caps the sky at 120 units and scales up to fill the frame (`slice`); cast portraits ~15% larger |
| D109 | City map gets 14pt of top padding, so the cranes clear the header |
| D110 | Pantry shelf brackets at 8% and 50% of the shelf, both visible |

Typecheck clean, 30 tests pass, `report.json` errors: [].

## v2.3 — critique (round 18, stricter bar) — ❌ NOT SATISFIED

**VERDICT: NOT SATISFIED** — loads clean. Most of the round-17 polish shows in the pixels, but up close the new characters fall short: cooks and cashiers show up as rows of overlapping heads, every shop has the same crowd, everyone faces right, walk-ins sit with their backs to their tables, and drivers stand inside the door leaf.

**Fixed:** D102, D103, D104, D107, D108, D109, D110 · **Still open:** D105 (window glass still invisible; transom bar reads as a crate), D106 (sidewalk fern leaves still cover a diner)

**Bugs**
- G51 Seated walk-ins at `table.x + 17` face away from their table
- G52 With 3+ counter staff the pickup spots reach the door leaf, which slices through a driver

**Visual design**
- D111 [major] Cooks and counter staff are floating heads in fused rows → lower prep table, show torsos with dough/rolling pins, space staff ≥26
- D112 [major] The same people in every shop (seeds are slot-index only) → seed by shop, re-roll walk-ins each loop, hair and body variety for workers
- D113 [major] Every figure faces +x with the same smile → front-facing variant, cooks face their table, open mouth while ordering, blinks
- D114 [major] Diners don't sit in chairs and back-row diners overlap front-row → chair back / person / seat + table layering, rows ≥40 apart
- D115 [major] Cut-scene portraits use a different, flatter style; Nonna's shop wall is bare → reuse the head treatment, dress the wall
- D116–D122 [minor] Bare menu board; baker bandana reads as a driver cap; walk-ins fade in through the topiary and hide the WELCOME mat; cash pop fades too early; cut-scene cloud seams; footprint-0 crack reads as a glitch; tab strip cuts tabs mid-word

**Design notes**
- D123 Decor header copy is ambiguous · D124 Dead `OvenCard` still holds emoji

## v2.4 — build (addresses round 18)

| Note | Fix |
| --- | --- |
| G51 | Walk-ins sit on the right-hand chair and are flipped to face the table; their eating arm reaches the plate |
| G52 | Pickup spots stop 30 units before the door leaf; extra drivers queue a row closer to the street |
| D111 | Prep table lowered (44 → 28) and widened (17 per cook), so cooks show to the waist. Cooks face front and roll dough with two-handed rolling pins. At most 2 counter staff, spaced 28 apart on a wider counter |
| D112 | Character seeds mix a per-shop hash, so each pizzeria has its own crew and diners; walk-ins re-roll a new look on every visit. Workers keep bob/ponytail back-hair under their hats and come in two body widths |
| D113 | Front-facing variant (centred eyes and nose, ears on both sides, a forward cap brim) for cooks and counter staff. Everyone blinks every ~3.7 s at a per-person offset; walk-ins talk with an open mouth while ordering; diners chew with an open smile |
| D114 | Tables are drawn in layers: chair (outer back rest + seat + legs) → diner → table top. Rows 42 apart (depth 8 / 50), back row offset 30 |
| D115 | Portraits share the in-scene head treatment: shadow crescent, head highlight, eye catchlights, always-on blush, nose shading, shirt shading; outlines 2.4 → 1.8. Nonna's shop wall moves into the visible band (string lights, EST. 1974 photo, menu board with header and prices, shelf of tins); the PIZZA sign and oven are pulled in from the cropped edges |
| D116 | Menu board: green chalkboard in a wood frame with a cheese-yellow MENU header and three rows (slice icon, name, price) |
| D117 | Baker bandana is cream with red polka dots and a visible knot |
| D118 | Walk-ins enter from off-screen at full opacity (no ghost fade by the topiary); the doormat is replaced by a sidewalk A-frame "PIZZA BY THE SLICE" chalkboard that nobody stands on |
| D119 | Cash pop stays fully opaque while rising 20 units, fading only in its last ~150 ms |
| D120 | Cut-scene clouds and smoke use solid fills with group opacity, so overlaps show no seams |
| D121 | Footprint-0 wall: a branching crack plus a chipped patch showing bricks |
| D122 | Tab strip has edge fades on both sides |
| D123 | "Decor · each tier: +4% pizza price in this shop" |
| D124 | Dead `OvenCard` deleted |
| D105 | Shop-window glass uses a #CFE8F5 gradient (0.6 → 0.25); the transom is a thin 2.4 wood bar |
| D106 | Sidewalk fern pot removed; the inside potted plant sits between the dining rows |

Typecheck clean, 30 tests pass, `report.json` errors: [].

## v2.4 — critique (round 19) — ❌ NOT SATISFIED

**VERDICT: NOT SATISFIED** — loads clean. The portraits, menu board, chairs and Nonna's wall are real improvements, but the door leaf still cuts through walkers, the owner's doormat was removed, and the late-game kitchen still shows look-alike workers in fused rows (partly a hashing flaw in `lookFor`).

**Fixed:** G51, D113, D114, D115, D116, D117, D119, D120, D121, D123, D124, D106 · **Still open:** G52 (→ G53), D111 (→ D126), D112 (→ G57/D125), D118 (→ G54/G55), D105 (→ D132), D122 (→ D134)

**Bugs**
- G53 The door leaf is part of `FrontWall` (sort y 0) but reaches 22 units into the room, so walkers pass behind opaque glass and get sliced
- G54 The WELCOME mat is gone, but the owner's direction requires it
- G55 Characters dissolve in place (seated guests fade on their chair; drivers fade in and out by the door)
- G56 The rightmost baker stands inside the counter box
- G57 `lookFor` uses mod-5/mod-6 hashes, so cashiers are twins and front-row diners share hair

**Visual design**
- D125 [major] Workers still look alike → after G57, one trait per worker (glasses, moustache, freckles, tuft, height); second cashier in a visor + green apron
- D126 [major] Kitchen rows still fuse → cooks staggered by depth 8, smaller toques, ≤3 cooks below footprint 3, bakers spaced by column
- D127 [major] The A-frame sign covers the front-left table; the sill cuts table legs → move the sign, front row to depth 14
- D128 [major] The maxed marble floor reads as blank off-white with pencil marks (worse than checkerboard) → two-tone tiles, grout, real veins, brass border, sheen
- D129–D135 [minor] One smile for everyone; flipped figures mirror their lighting; tier-0 chairs read as sticks; entrance glass still invisible; chipped patch peeks over TAP TO BAKE; tab strip shows slivers, fade invisible; cut-scenes leave ~25% black and the opening storefront is flat

**Design notes**
- D136 Bottleneck stat lines in red read as errors → ink text + BOTTLENECK chip · D137 Goal bar and button both say "Hire a Waterfront manager"

## v2.5 — build (addresses round 19)

| Note | Fix |
| --- | --- |
| G53 | The door leaf is its own depth-sorted item (depth 11) with see-through glass (rgba 0.45) and a glint; drivers and guests route via (door.x0+4, 30), past the leaf tip |
| G54 | WELCOME mat restored flat at the threshold, under the walkers |
| G55 | Nobody fades. Drivers walk in from up the street, pick up, and hurry off-screen with the box (payout as they leave the door). Walk-ins eat, stand up, walk back out the door and off down the street |
| G56 | Bakers clamp to `counter.x0 − 12`, never inside the counter |
| G57 | `lookFor` hashes each field independently (mulberry32), so skin, hair colour, style, trait, width, height and clothes no longer repeat in lockstep |
| D125 | Every worker gets a trait (glasses, moustache, freckles, or a hair tuft out of the cap) and ±2 height; the second cashier wears a green visor and a #2E7D4A apron |
| D126 | Cooks staggered by depth 8, smaller toques (crown ~13 wide), at most 3 cooks below footprint 3; bakers clamp clear of the counter |
| D127 | A-frame sign moved to the sidewalk between the planter and the van (door.x0 − 75, depth −34); front table row at depth 14, clear of the sill |
| D128 | Marble: two-tone #F4EFE8/#E2D9CC tiles with #C8BEB0 grout, #A79E92 veins (1.1, 0.8 opacity) with branch veins, a diagonal white sheen and a brass #C9A04A border along the back and side walls |
| D129 | Expressions: focused cooks (flat mouth, angled brows) while rolling; diners alternate chewing (puffed cheeks), "^^" happy eyes and a smile; departing drivers show an "o" mouth; ordering walk-ins talk |
| D130 | Torso and head shading are counter-mirrored on flipped figures, so light always comes from the upper left |
| D131 | Chairs: a 7.5×15 rounded back with a slat, a shade strip and a highlight, a seat with a highlight, and 3.4-long legs; tier-0 colours #E9DCC8 / #B79C7A |
| D132 | Shop-window glass #A9D4EC (0.6 → 0.4) with two glints; gold ROSA'S lettering on a dark transom band; a pizza-on-a-cake-stand display behind the glass |
| D133 | Chipped-brick patch moved to L+60, clear of the TAP TO BAKE pill |
| D134 | Tabs record their offsets: the strip scrolls to and snaps on tab edges (no slivers); 24pt fades on both edges with a stronger stop |
| D135 | Cut-scene panel up to 66% of the screen height; the opening storefront gets brick courses, a shadow side, a highlight, an awning shadow, a framed window with mullions and glints, a sill and a panelled door with a brass knob; skyline towers use a solid fill + group opacity (no seams) |
| D136 | Bottleneck cards show a red BOTTLENECK chip; the stat line stays ink |
| D137 | On an unmanaged shop the goal bar skips "Hire a manager here" (the sidewalk button offers it) and shows the next goal |

Typecheck clean, 30 tests pass, `report.json` errors: [].
