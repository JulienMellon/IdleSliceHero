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

## v2.5 — critique (round 20) — ❌ NOT SATISFIED

**VERDICT: NOT SATISFIED** — loads clean; most round-19 fixes show in the pixels (door leaf, no fading, WELCOME mat, BOTTLENECK chip, cut-scene panel, A-frame sign). The kitchen crew still reads as near-identical figures, the per-worker traits are too small to see on a phone, the starting dining set looks unfinished, and an empty glass column sits beside the focal point.

**Fixed:** G53–G57, D127, D129, D130, D132, D133, D135, D136, D137 · **Still open:** D125 (→ D139), D126 (→ D138), D128 (→ D142), D131 (→ D140), D134 (→ D147)

**Bugs**
- G58 Late game, the goal bar shows a full "Story 20/24" with no trophy while big in-shop buys are affordable

**Visual design**
- D138 [major] Kitchen crew still near-twins: bakers share everything and their peels cross; cooks' pins run through neighbours and toques touch → no paired flip, per-baker action and dot colour, hair below the bandana; cooks ≥30 apart, 14-wide pins, alternating actions (rolling / tossing / ladling)
- D139 [major] Worker traits invisible at phone size → thicker glasses, bigger moustache, bigger freckles, hair under every hat
- D140 [major] Tier-0 dining set reads as a stool + capsule → back rising from the seat's rear edge, wood colours, ink outline
- D141 [major] The entrance column is a blank glass slab → shorter glass, brick above with a round PIZZA blade sign, gold arched decal, bigger display stand with two pizzas
- D142–D149 [minor] Marble still pale; WELCOME mat reads as a plank; walking drivers stack exactly; ghosted MEGASLICE billboard; tins appear to sit on the PIZZA sign (02); tab sliver remains, fade too faint; Big Sal's sideburns read as headphones; cash pop far from the door

**Design notes**
- D150 At most two walk-ins animate; other diners never leave · D151 Late game runs out of goals (see G58)

## v2.6 — build (addresses round 20)

| Note | Fix |
| --- | --- |
| G58 / D151 | When nothing city-wide is left, the goal bar shows the best Expand / Grade / Decor buy in the current shop (by gain per $). The story fallback fills to seen/24, and the trophy sits above the fill |
| D138 | Bakers: no paired flip (peels stay on the outer side); each one has a job (a pizza on the peel, an empty peel, or sliding one in at a tilt) and its own bandana dot colour (red / green / blue), with a low bun showing under the bandana. Cooks: at most 3, ~35 apart, 14-wide pins, and alternating jobs (rolling, tossing dough at head height, ladling sauce) |
| D139 | Glasses 1.1 stroke with tinted lenses; moustache 1.6× with a 0.9 outline; freckles r 0.7; a fringe of hair shows under every cap and toque |
| D140 | Chairs: the backrest rises from the seat's rear edge on two posts with a top rail and slat; four legs; tier-0 chairs are wood #C89B6D / #8E5A3C with a 1.2 outline |
| D141 | Entrance: the glass stops at ~window height (z 196). Above it: brick with a lintel, a round attic window, and a round PIZZA blade sign on an iron bracket. Gold arched ROSA'S · EST. 1974 decal mid-glass; a two-tier stand with two pizzas behind the glass; transom reads PIZZERIA |
| D142 | Marble tiles #E8DFD2 / #CFC3B2, veins 1.4 with a white companion line, and a brass inlay along the front sill |
| D143 | WELCOME mat lies flat: a perspective trapezoid with an inner border and fringe ticks |
| D144 | Drivers get their own sidewalk lane (`(i % 3) * 6` depth) and a seeded phase jitter, so walkers no longer stack |
| D145 | MEGASLICE billboard drawn outside the skyline's alpha group: full-strength #7B2CBF board, #FFC531 text with an ink stroke and a highlight |
| D146 | Nonna's tins sit on a bracketed shelf under the photo, clear of the PIZZA sign |
| D147 | Tab snap offsets end exactly at the gap (x − 6), so no sliver of the previous tab; 30pt fades with a stronger stop |
| D148 | Big Sal's sideburns are tapered shapes in his hair colour |
| D149 | Cash pop rises from beside the entrance header (door x, z FRONT_TOP − 62) |
| D150 | Up to 4 walk-ins animate per shop, phased evenly; the fixed diners re-roll their look every ~14 s |

Typecheck clean, 30 tests pass, `report.json` errors: [].

## v2.6 — critique (round 21) — ❌ NOT SATISFIED

**VERDICT: NOT SATISFIED** — loads clean; most round-20 fixes show in the pixels (cook spacing and jobs, readable traits, wood chairs, entrance brickwork, flat mat, billboard, late-game goals). Still failing the stricter bar: the door lintel slices walkers, drivers stack at the counter, bakers are a fused row in identical uniforms, the 4-table dining room is mostly empty, and Prep is a bare box.

**Fixed:** G58, D151, D139, D140, D141, D143, D145, D146, D149, D150 (regression → D154), D144 · **Still open:** D138 (bakers → D153), D142 (→ D157), D147 (→ G60), D148 (→ D162)

**Bugs**
- G59 Walkers just inside the door pass behind the lintel and PIZZERIA band (headless figures)
- G60 Tab fade has no height (renders as a wedge); the end-of-list scroll clamp leaves a sliver

**Visual design**
- D152 [major] Drivers stack at pickup (17-unit spots, ~22-wide bodies) → 26 spacing, half-spot row offset, cap to what fits
- D153 [major] Bakers a fused row in one shirt → ≥36 apart or staggered in depth, three shirt colours, peels angled apart
- D154 [major] Dining room reads empty (every table animated, no fixed diners) → animate ceil(tables/2), fixed diners elsewhere
- D155 [major] Prep is a plain box at every level → steel-topped wooden bench with legs, plank front, undershelf of flour sacks; tools appear at Lv 25 / 50
- D156 [major] Clone diners (near-duplicate shirt colours) → distinct palette, concurrent guests never share a shirt
- D157–D163 [minor] Marble veins read as noodles; entrance glass clutter; blade sign hangs inside the room; front-left chair clipped by the pilaster; right floor plant sits in the door jamb; cut-scene kerb, Big Sal's sideburns, smoke seam; the rush tap needs a coin burst + oven pulse

**Design notes**
- D164 "Kitchen full — hire more drivers!" when drivers are unaffordable → "save $X" · D165 Seating level barely changes how full the room looks

## v2.7 — build (addresses round 21)

| Note | Fix |
| --- | --- |
| G59 | Door opening raised: lintel at z 108–122 and the leaf 104 tall, so a figure just inside the door fits under it |
| G60 | Tab fades are full height (`height="100%"` + stretched viewBox); snap offsets are limited to what the strip can reach, and the active-tab scroll picks the last reachable tab edge, so the end clamp leaves no sliver |
| D152 | Pickup spots 26 apart, second row offset half a spot (13) and 22 nearer the street; visible waiting drivers capped at what fits |
| D153 | Bakers alternate depth by 12 and wear three shirt colours (#B23A48 / #7E3A8E / #2E6E8E); peels tilt back toward their own baker |
| D154 / D165 | Walk-ins animate at ceil(tables / 2) (max 4); the other tables keep fixed diners, filled at 40% + Seating level / 40 (full by ~Lv 24) |
| D155 | Prep is a steel-topped wooden bench: a #AEB4BB/#DDE2E7 steel top with a white lip, a #9A6A44 plank skirt, four legs, and an undershelf of two FLOUR sacks. A rolling pin appears at Prep Lv 25 and a sauce pot at Lv 50 |
| D156 | Guest palette has no near-duplicates (#3D9970, #E07A5F replace two); walk-ins and fixed diners take shirts by offset from a per-shop base, so concurrent people never match |
| D157 | Marble veins are short two-segment strokes (#A79E92, 0.6 opacity) scattered per tile; white companion line dropped |
| D158 | Display stand drawn over the glass at 0.85; EST line removed; one glint; decal raised clear of the stand |
| D159 | PIZZA blade sign hangs off the right pilaster over the sidewalk (flat on the brick header on the widest shop, where there's no room) |
| D160 | Tables start at L + 32, clear of the left pilaster |
| D161 | Right floor plant moved to the back-right corner, out of the door path |
| D162 | Opening cut-scene: wet sidewalk + #3A3550 kerb under the shop. Big Sal's sideburns are outlined #4A3A33 wedges joined to a moustache of the same colour. Industrial smoke is one path with one fill |
| D163 | Rush tap: the oven bank pulses (0.15 s) and throws 6 coins that arc out and fall, drawn above everyone |
| D164 | A full kitchen whose bottleneck upgrade is unaffordable says "Kitchen full — save $X for more drivers" |

Typecheck clean, 30 tests pass, `report.json` errors: [].

## v2.7 — critique (round 22) — ❌ NOT SATISFIED

**VERDICT: NOT SATISFIED** — loads clean; the doorway, tab fade, rush coins, entrance glass, blade sign and dining fill all show in the pixels. Still failing on people: bakers, walk-ins and drivers pile up at the counter's left corner, the bakers are still a fused row, and the kitchen and dining room run together.

**Fixed:** G59, G60, D152, D154, D158, D159, D160, D162, D163, D164, D165 · **Still open:** D153 (→ D167), D155 (→ D169), D156 (→ D172), D157 (→ D170), D161 (→ D171) · **Bugs:** none

**Visual design**
- D166 [major] People pile up at the counter's left corner → order point at the counter's front-right with a queue toward the door; first pickup spot ≥30 right of the last baker
- D167 [major] Bakers still fused → centred in front of the oven columns, alternating depth
- D168 [major] No gap between kitchen and dining → back table row at depth 40, a floor strip in front of the bench
- D169–D176 [minor] Flour sacks invisible; marble still pale; hood duct cuts the mural, the right fern sits behind the cash pop, the ferns look like combs, the right plant is hidden by the entrance glass; two near-identical orange shirts and one tee shape; drivers' faces behind the OPEN sign; the first baker identical in every shop; cooks 2 and 3 still touch; upgrade cards aligned inconsistently

**Design notes**
- D177 The opening shop looks sparse → a fixed diner from Seating Lv 1 · D178 Cash pop hides decor → move it left over the awning

## v2.8 — build (addresses round 22)

| Note | Fix |
| --- | --- |
| D166 | Walk-ins order at the counter's front-right (`counter.x1 − 14`, depth 34), with a second queuing toward the door; pickup spots stay on the counter's left two-thirds (≤ `counter.x1 − 30`), well right of the bakers; walk-ins go straight from the door to the order point |
| D167 | Bakers are centred across the oven bank (one per ~40 units, max 3) at alternating depth 72 / 60, never clamped against the counter |
| D168 | Dining rows at depth 6 / 40, leaving a clear aisle before the prep bench (front at 66); a soft floor strip at depth 58–60 marks where the kitchen floor starts |
| D169 | Flour sacks are #E3C89A with a #B48E5E shadow side and a contact shadow |
| D170 | Marble #E2D6C4 / #C9BBA6 with one #8F8577 vein (opacity 1) on most tiles |
| D171 | Mural spans z 154–204, clear of the hood duct and the awning; hanging ferns are filled teardrop fronds (#4FA048 / #3F8A3E); the right floor plant sits beside the counter end, left of the entrance glass |
| D172 | #5C6BC0 replaces #E07A5F (no orange pair); guests wear a plain tee, a striped tee, or a hoodie with hood, pocket and drawstrings |
| D173 | OPEN sign moved to the door leaf's top pane, above walkers' faces |
| D174 | Baker shirt, dot colour and job start from a per-shop index, so the first baker differs between shops |
| D175 | Cooks ~41 apart (prep bench 30 + 24 per cook) |
| D176 | Upgrade cards top-aligned (normal and wide) |
| D177 | At least one diner is always seated and eating, including on the first screen; fixed diners take the left chair of any table, walk-ins the right |
| D178 | Cash pop shifted 30 left, over the awning, clear of the attic window and fern |

Typecheck clean, 30 tests pass, `report.json` errors: [].

## v2.8 — critique (round 23) — ❌ NOT SATISFIED

**VERDICT: NOT SATISFIED** — loads clean; most round-22 fixes show (bakers spaced and staggered, cooks spaced, hoodies and stripes, OPEN sign raised, darker marble, cash pop moved). Still failing on people placement: walk-ins order behind the open door leaf, drivers still overlap at pickup, the first-screen diner is clipped by the left pilaster, and late-game tables are one copied "solo diner + empty chair" layout.

**Fixed:** D167, D170, D172, D173, D175, D176, D178, D171 (partly) · **Still open:** D166 (→ G61, D179), D168 (→ D183), D169 (→ D185), D171 duct (→ D182), D174 (→ D184), D177 (→ D180)

**Bugs**
- G61 Order spots at `counter.x1 − 14 / +18` fall under the open door leaf, which slices the ordering walk-in

**Visual design**
- D179 [major] Counter front still a pile-up (drivers overlap; driver + walk-in on top of each other in the doorway) → one row of drivers unless a 2nd row is ≥30 offset; separate door lanes
- D180 [major] The first screen's only diner is half-hidden by the left pilaster; floor ~60% empty → tables start at L + 44; at Seating Lv 1 the table sits mid-floor
- D181 [major] Late-game dining stamped (every table "diner left, empty chair right") → second fixed diner in the right chair from fill ≥ 0.6; three seated poses (slice to mouth, cup, leaning back)
- D182–D185 [minor] Mural covers the hood duct; kitchen/dining strip invisible and back-row heads under the bench → back row at 34 + stronger strip; first baker still the same in Downtown and Waterfront; flour sacks still unreadable

**Design notes**
- D186 Opening cut-scene: dead black band under the card when there's no dialog · D187 Workers limited to 3 hair styles and identical uniforms

## v2.9 — build (addresses round 23)

| Note | Fix |
| --- | --- |
| G61 | Walk-ins order at `counter.x1 − 18` (depth 48) with the next one queuing behind at depth 32, clear of the door leaf (which starts at `counter.x1 − 10`) |
| D179 | Pickup spots are one row on the counter's left, ≥28 apart, ending 46 before the counter's right end. Drivers take turns at them (up to 3 per spot, 2 + footprint total) with a short wait window, so two never stand on one spot. Drivers use the right half of the doorway, walk-ins the left |
| D180 | Tables start at L + 44, clear of the pilaster; a lone starter table sits mid-floor at depth 20, so its diner is fully visible |
| D181 | Fixed diners get one of four seated poses (eating, a slice raised to the mouth while chewing, a steaming mug, leaning back with an arm over the chair). From fill ≥ 0.6, about two-thirds of the tables no walk-in is heading for seat a companion opposite, flipped to face the table |
| D182 | Mural ends 22 units left of the hood duct (and at most 60% of the wall) |
| D183 | Back table row at depth 34; the kitchen floor edge is a 3-unit #000 0.14 band with a white 0.3 highlight line |
| D184 | First baker's shirt, dot and job come from the neighbourhood index, and baker seeds include it, so Downtown and Waterfront differ |
| D185 | Flour sacks ×1.4 at the bench's open ends (12% / 88%) |
| D186 | Narration-only cut-scene panels show the caption as a storybook card under the art instead of over it, so there's no dead band |
| D187 | Workers keep any back hairstyle under their hats (bob, bun, curls, ponytail); cashier caps take a per-neighbourhood colour |

Typecheck clean, 30 tests pass, `report.json` errors: [].

## v2.9 — critique (round 24) — ❌ NOT SATISFIED

**VERDICT: NOT SATISFIED** — loads clean; G61, D180, D182, D184, D186 and D187 show in the pixels. People still pile up: late-game companions stack behind the next row's diners, and drivers and walk-ins still overlap in the doorway.

**Fixed:** G61, D180, D182, D183, D184, D186, D187, D179 (pickup half) · **Still open:** D179 door lanes (→ D189, G62), D181 (→ D188), D185 (→ D193)

**Bugs**
- G62 The walk-in lane (`door.cx − 6`) lets the left brick jamb slice entering guests

**Visual design**
- D188 [major] Late-game diners stacked (companions 4 units from back-row diners; shoulders touching in a row; empty floor to the right) → 78-unit pitch, 39 row offset, front row runs further right, skip companions with a seat closer than 30
- D189 [major] Doorway pile-up (lanes only 12 apart) → hold walk-ins or widen the door with lanes ±11
- D190–D195 [minor] Bare back wall behind the painting; cut-scene 08 cast too small and 02 props cut by the edges; sidewalk drivers clump at the right edge; flour sacks still unreadable; starter interiors are clones across neighbourhoods; a baker's peel pokes a driver's head

**Design notes**
- D196 Worker count stops growing after Prep ~Lv 31 → visible tiers (mixer, golden toque) · D197 Seating card has dead space above its button · D198 "tap to run" tab label reads like a button

## v2.10 — build (addresses round 24)

| Note | Fix |
| --- | --- |
| G62 / D189 | Entrance widened to 46 with a shallower leaf swing; walk-ins use the left lane (`door.x0 + 13`, clear of the jamb), drivers the right (`door.x1 − 11`), 22 apart. Walk-ins now order at the counter's right **end** (beside it, depth 76, a second one queuing at 56) — out of both the door lanes and the pickup line — and walk round the counter end to their table |
| D188 | Tables on a 78-unit pitch with chairs at ±19.5 and the back row a quarter-pitch over, so every seat interleaves ~19.5 from its neighbours (no stacked heads). The front row runs on toward the counter, filling the empty right side. Companions are skipped wherever any other seat is within 18 at a similar depth |
| D190 | Pantry shelf kept under the painting; a 24-unit wainscot shading gradient along the back wall's base |
| D191 | Cut-scene cast ~20% larger (two-person panels at 49% of the width each, inside the frame); the MEGASLICE billboard sits 40 lower behind them; Nonna's PIZZA board, photo and shelf inset from the cropped edges |
| D192 | Departing drivers walk off on staggered lanes (x +18 per lane) and fade out past the right screen edge |
| D193 | Bench undershelf sacks removed (unreadable there); the flour lives on the pantry shelf in every shop |
| D194 | Bare (tier-0) back walls get one neighbourhood prop: an I ♥ PORT M. skyline poster (Downtown), a family photo (Suburbs), a life ring and rope (Waterfront), a U.P.M. pennant (University), a SAFETY 1ST sign (Industrial), a wine rack (Uptown) |
| D195 | Bakers clamp to `counter.x0 − 26`, so peels stay clear of the first pickup spot |
| D196 | Visible staff tiers past the 3-cook cap: a dough mixer appears on the bench at Prep Lv 75, and cooks earn a gold toque band at Lv 100 |
| D197 | Upgrade cards distribute their content, so buttons bottom-align across a row |
| D198 | Unmanaged tab reads "you run it" |
| (08 smoke) | Smoke is an opaque single fill (no see-through tower edges) |

Typecheck clean, 30 tests pass, `report.json` errors: [].

## v2.10 — critique (round 25) — ❌ NOT SATISFIED

**VERDICT: NOT SATISFIED** — loads clean; most round-24 fixes show (separate door lanes, pantry flour, mixer, bottom-aligned cards, "you run it"). But the new walk-in order spot hides customers behind the front wall, the OPEN plate reads "OPE" on every shot, and the Uptown dining room is still a pile of heads.

**Fixed:** G62, D189, D190, D191, D192, D193, D195, D196, D197, D198, D188 (partly) · **Still open:** D188 (→ D199), D194 (→ D200)

**Bugs**
- G63 The order spot at the counter's right end sits inside the doorway column, behind the lintel/window; the driver `via` point falls behind the door leaf
- G64 The OPEN plate is half under the left jamb ("OPE")

**Visual design**
- D199 [major] Uptown dining still a pile of heads; floor to the right empty → front row runs to `counter.x1 − 30`, back row at depth 40
- D200–D204 [minor] Neighbourhood props hidden behind the queue/TAP pills; big floor plant grows out of a cook's toque, small fern clutters chairs; Suburbs menu board clipped by the brick header; left tab fade over the selected tab at scroll 0; seated crowds repeat shirts and hair

**Design notes**
- D205 Arrivals cut across the A-frame and van → arrive at depth −52 · D206 Seating card dead band → "next: +1 table" hint

## v2.11 — build (addresses round 25)

| Note | Fix |
| --- | --- |
| G63 | The door leaf is folded flat against the right wall (a plane at `door.x1 − 1.5`, depth 1–30), so it can't hide anyone. Walk-ins order in front of the counter's right third (`counter.x1 − 20`, depth 50) with the next one queuing at 34, clear of the doorway column. Drivers' and walk-ins' inside waypoints sit at `door.x0 + 6`, depth 24–26 |
| G64 | The OPEN plate hangs from the lintel on two cords, centred in the doorway above head height |
| D199 | Front row of tables runs to `counter.x1 − 30` and fills first; back row at depth 40 (34-unit gap) takes only what's left |
| D200 | Neighbourhood props sit on the left of the back wall (L + 22, z 168), clear of the queue/TAP pills; the SAFETY 1ST plate is 34 wide |
| D201 | Big floor plant in the front-left corner (L + 10, depth 2); small fern beside the bench end (L + 8, depth 54) |
| D202 | Menu board shifted 24 left, clear of the brick header |
| D203 | Tab fades only show on a side that can still scroll (left hidden at offset 0) |
| D204 | Seated people draw shirts and hair colours sequentially by seat (8 shirts, 6 hair colours), so neighbours never match |
| D205 | Arriving walk-ins use the sidewalk lane at depth −52, in front of the A-frame and the van; −44 stays for departures |
| D206 | Seating card adds "next level: +1 table" / "+1 table at Lv N" / "dining room full" |

Typecheck clean, 30 tests pass, `report.json` errors: [].

## v2.11 — critique (round 26) — ❌ NOT SATISFIED

**VERDICT: NOT SATISFIED** — loads clean; most round-25 fixes show (folded door leaf, full OPEN plate, props moved, arrivals in front of the sign/van, Seating hint). But the seat colour fix doesn't work, the Uptown counter front is still a pile-up, and two regressions appeared.

**Fixed:** G63, G64, D200, D202 (→ regression G65), D203, D205, D206, D201 (→ D209) · **Still open:** D199 (→ D207), D204 (→ G67, D208)

**Bugs**
- G65 The oven hood covers the menu board's lower-left corner ("/eggie")
- G66 Drivers and walk-ins share one inside waypoint behind the left jamb (lanes merge, the jamb slices people)
- G67 Seat colours step by 2, so only 4 shirts / 3 hair colours appear; walk-ins can repeat them (twin diners)

**Visual design**
- D207 [major] Uptown counter front still a pile-up; the floor in front of the baker is bare → back row ends at `counter.x0 − 40`; order spot at `counter.x1 − 4`, depth 58, the queue steps right
- D208 [major] Cloned crowds: most diners wear the same striped shirt → stripes ≤1 in 3; add solid tees, collared shirts, cardigans, overalls
- D209–D213 [minor] Tier-3 big plant covers the front-left diner; starter shop looks bare (empty bench, hidden cook, empty floor); cut-scene PIZZA board cut by Nonna's bun; Industrial interior washed out; "I ♥ PORT M" text hits the frame

**Design notes**
- D214 On an unmanaged shop the goal bar should be that shop's manager · D215 "Not enough cash" toast should name the item

## v2.12 — build (addresses round 26)

| Note | Fix |
| --- | --- |
| G65 | Menu board's left edge is clamped to the oven bank's right edge + 6, so the hood never covers it |
| G66 | Each door lane has its own inside waypoint: walk-ins `[door.x0 + 16, 34]`, drivers `[door.x1 − 14, 34]` — both clear of the left jamb |
| G67 | Seat i takes shirt `base + i` and hair `base + i`; its companion +4 / +3. A walk-in's colours are picked to avoid every diner and companion at its table and the two beside it |
| D207 | Back row ends 40 + SEAT before the counter; walk-ins order at `counter.x1 − 4`, depth 58, with the next one queuing 14 to the right (not stacked in front) |
| D208 | Six guest outfits drawn per seed (plain tee, striped tee, hoodie, collared shirt with buttons, open cardigan over a light shirt with buttons, denim overalls with brass clips), so stripes appear on about 1 in 6 |
| D209 | Tier-3 big plant moved back beside the bench end (L + 8, depth 58); the small fern takes the front-left corner |
| D210 | Starter shop: the bench always shows at least 2 dough balls and the rolling pin; a lone cook stands further forward (depth 88); the starter table sits on a round woven rug |
| D211 | Cut-scene PIZZA board narrowed (86–168) with smaller lettering, clear of Nonna's bun |
| D212 | Industrial: back wall #D9D3C8, a riveted #9AA1A8 steel wainscot with a rail, darker #CFC6B8 concrete floor |
| D213 | "I ♥ PORT M." at 3.8, inset from the frame |
| D214 | On an unmanaged shop the goal bar shows that shop's manager first |
| D215 | A failed buy names the item and its cost ("Drivers: need $10") |

Typecheck clean, 30 tests pass, `report.json` errors: [].

## v2.12 — critique (round 27) — ❌ NOT SATISFIED (no [major] notes)

**VERDICT: NOT SATISFIED** — loads clean; most round-26 fixes show (menu clear of the hood, Uptown order spot and queue, varied outfits, cut-scene board, poster text, goal bar, named toast). No [major] visual notes remain, but the menu fix pushes the Suburbs board under the brick pier, people are still cut by the door jamb, and the plant move just shifted the overlap.

**Fixed:** G65 (→ G68), G67, D207, D208, D211, D213, D214, D215 · **Still open:** G66 (→ G69), D209 (→ D217), D210 (→ D216), D212 (→ D219)

**Bugs**
- G68 Menu board's right edge runs under the brick pier (Suburbs) — only the left side is clamped
- G69 Door jamb still slices people crossing its screen strip at depth 8–34 (open since G63)

**Visual design (all [minor])**
- D216 Starter shop still bare (cook only a head, empty floor, Waterfront a copy of Downtown)
- D217 Plants sit on diners (front-left fern, tier-3 plant)
- D218 OPEN plate at driver-cap height
- D219 Industrial still washed out
- D220 The "toss" cook reads as a hand to the forehead; dough invisible against the toque
- D221 Arrival lane passes over the potted tree and under the Prep card
- D222 Stand mixer reads as a red "E"

**Design notes**
- D223 Offline lines and total round differently · D224 Unmanaged shops hide the station buttons behind All

## v2.13 — build (addresses round 27)

| Note | Fix |
| --- | --- |
| G68 | Menu board clamped on both sides (hood + 6 ≤ left, right ≤ brick pier − 6); it scales down to 40–56 wide when the gap is tight |
| G69 | The doorway's inside edge is a slim 3-unit wooden post instead of an 8-unit brick jamb (a low brick plinth stays at its foot). Walkers stay in their door column until depth 44 (new waypoints `[door.x0 + 16, 44]` for walk-ins, `[door.x1 − 14, 44]` for drivers) before turning toward the counter |
| D216 | Starter: the lone cook stands beside the bench's left end (fully visible, depth 74); a window ledge with two red stools by the door; a floor prop per neighbourhood (Downtown newspapers, Suburbs umbrella stand, Waterfront crate + rope coil, University books, Industrial toolbox, Uptown coat stand) |
| D217 | Front-left fern at L + 4, scaled 0.8, with the front row shifted 10 right while it's there; the tier-3 plant is a trailing wall planter on the left side wall, clear of every diner |
| D218 | OPEN plate mounted on the lintel face, above everyone's head |
| D219 | Industrial wall #C4BCAE; dashed #E8B23A hazard stripe on top of the riveted steel wainscot |
| D220 | Toss: hand raised to hy − 14, dough #F0C98A with a #C98A4B rim, two motion arcs |
| D221 | Arrival lane at depth −46, clear of the potted tree and the button row |
| D222 | Stand mixer: #E8E2D8 bowl with a highlight, head lifted 3 |
| D223 | Offline total is the sum of the shown (rounded) per-shop lines |
| D224 | Unmanaged shops keep a slim Prep / Ovens / Counter / Drivers chip strip above the hire button |

Typecheck clean, 30 tests pass, `report.json` errors: [].

## v2.13 — critique (round 28) — ❌ NOT SATISFIED (no [major] notes)

**VERDICT: NOT SATISFIED** — loads clean; most round-27 fixes show (menu between hood and pier, nobody sliced at the door, OPEN plate clears heads, offline total adds up, unmanaged chip strip). But the build log's "window ledge" is only two stools on bare floor, and the run of [minor] polish notes is too long for the stricter bar.

**Fixed:** G68, G69, D217, D218, D219, D220, D221, D223, D224 · **Still open:** D216 (→ G70, D225), D222 (→ D226)

**Bugs**
- G70 `Ledge` draws no ledge, just two stools mid-floor

**Visual design (all [minor])**
- D225 Starter's bottom-right floor still empty; Waterfront still a copy of Downtown; floor props too small to read
- D226 Stand mixer still a red hook; its bowl vanishes; it sits in front of the toss cook
- D227 Walk-in queue stacks in one depth column
- D228 Every table has its diner on the left and an empty chair on the right
- D229 Toss arm is a straight stick (no elbow)
- D230 The unmanaged chip strip cuts the A-frame and potted tree
- D231 Industrial hazard stripe reads as a dotted line
- D232 Mat text hidden by walkers; the walk-in lane crosses the parked van
- D233 Cut-scenes 01/08 ~40% empty sky; 02 menu board overlaps the photo

**Design notes**
- D234 Seating card wraps to three lines · D235 Drawer buttons mix filled and outlined styles · D236 City-map tree on the Suburbs label

## v2.14 — build (addresses round 28)

| Note | Fix |
| --- | --- |
| G70 / D225 | Starter shops get a real window bar: a wooden bar with a light edge, on two legs, along the inside of the front sill between the counter and the door, with two red-topped stools tucked behind it (seats show above the bar). Floor props are drawn 1.4× larger. The Waterfront starter swaps the square back window for a brass porthole (sea view, rivets) with a fishing net and float draped beside it |
| D226 | Stand mixer is a solid filled #D9443A body with a #F26B5E highlight, a steel #AEB6BE bowl with a #7C858E rim and highlight; moved to 72% along the bench, clear of the toss cook |
| D227 | The walk-in queue fans out diagonally toward the door (+8 x, −10 depth per slot) |
| D228 | Each table's regular sits on alternating sides (left on even tables, right on odd); the walk-in takes the opposite chair. From Seating Lv 13 every other free table seats a pair facing each other |
| D229 | The toss arm bends at the elbow (two segments); the dough disc tilts 15° along the motion arcs |
| D230 | On unmanaged shops the A-frame and potted tree step back toward the shop, clear of the chip strip |
| D231 | Industrial hazard band: a 5-unit band of alternating #1F1A17 / #E8B23A chevrons with an #8C8478 edge |
| D232 | WELCOME lettering skewed and flattened onto the mat's floor plane; parked vehicle moved to depth −30 |
| D233 | Cut-scene art caps the sky at 100 units (stronger fill-zoom), so 01/08 lose the empty sky band; Nonna's menu board moved 24 left of the photo, the PIZZA board inset 12 |
| D234 | Seating card shows one status ("Dining room full · N walk-ins/s", or "rate · next level: +1 table") |
| D235 | Every affordable drawer button is filled green; the bottleneck is marked only by the red card border and BOTTLENECK chip |
| D236 | City-map trees kept ≥ 8 units clear of every label card |

Typecheck clean, 30 tests pass, `report.json` errors: [].

## v2.14 — critique (round 29) — ❌ NOT SATISFIED (no bugs, no [major] notes)

**VERDICT: NOT SATISFIED** — loads clean; the starter window bar, alternating seats, fanned-out queue, hazard tape, consistent drawer buttons and Seating card all show in the pixels. No [major] notes, but seven [minor] ones (over the limit of three), mostly crowding and overlaps as shops fill up.

**Fixed:** G70, D225, D226, D227, D228, D229, D231, D232, D233, D234, D235, D236 · **Still open:** D230 (→ D240)

**Visual design (all [minor])**
- D237 Walk-ins and drivers still overlap in the doorway; drivers on the mat hide WELCOME
- D238 Flagship middle floor: a baker's peel crosses the counter driver; a back-row diner overlaps the baker's legs
- D239 Back-row diners' heads poke into the prep bench frame
- D240 Unmanaged sidewalk: the tree covers the crate prop and pier; the scooter's wheel is under the chip strip
- D241 Uptown interior is a copy of Industrial with a pink wall
- D242 Waterfront fishing net doesn't read; a leftover wall crack sits beside the porthole
- D243 Mid-tier shops' bottom-right floor still empty

**Design notes**
- D244 Fleet card's lock text doesn't name the next vehicle · D245 Cut-scene 01 still ~30% sky

## v2.15 — build (addresses round 29)

| Note | Fix |
| --- | --- |
| D237 | Drivers use a lane hugging the right side of the doorway (`door.x1 − 6`) with their inside waypoint at `x1 − 8`; walk-ins stay at `door.x0 + 16` — 24 apart |
| D238 | The baker nearest the counter holds a 70% peel, clear of the driver at the first pickup spot |
| D239 | The back table row starts right of the prep bench (`prep.x1 + 12 + SEAT`), so back-row heads never poke into it |
| D240 | Unmanaged shops: the potted tree steps out past the left pilaster (`L − 18`) and the parked vehicle stays off the kerb while the chip strip is up |
| D241 | Uptown gets its own interior: a burgundy #7B1E3A wainscot with panel mouldings and a gold #D4A84A cap, a brass picture rail, and an arched back window (gold frame, sunset skyline view) |
| D242 | Waterfront net: a #B48E5E diamond mesh (0.8 stroke) draped from a peg with a soft fill and outline, beside the porthole on the open wall, with an 8-unit red/white float outlined in ink; the leftover crack is gone from the Waterfront |
| D243 | The window bar and stools appear in any shop whose front row of tables leaves room before the door (not just the starter) |
| D244 | Fleet card: "→ Drones · unlocks in Priya's story" |
| D245 | Opening cut-scene: Rosa's rainy front zoomed 1.15× from the kerb |

Typecheck clean, 30 tests pass, `report.json` errors: [].

## v2.15 — critique (round 30) — ❌ NOT SATISFIED (no [major] notes)

**VERDICT: NOT SATISFIED** — loads clean; Uptown has its own interior, the bar and stools fill the mid-tier floor, the unmanaged sidewalk is clear, the Fleet card names Drones, the door lanes are separated. The characters are no longer the weak spot; what's left is crowding when the shop is full, plus one regression.

**Fixed:** D237, D239, D240, D241 (→ G71), D243, D244 · **Still open:** D238 (→ D247), D242 (→ D246), D245 (→ D252)

**Bugs**
- G71 Uptown's arched window covers the menu board's bottom row

**Visual design (all [minor])**
- D246 Waterfront net reads as a rope ladder → gathered triangle, sagging hem, varied mesh, cork floats
- D247 Flagship centre clump: peel still touches the driver's cap; back-row diner touches a baker's feet
- D248 Drivers cut by the right screen edge; the box crosses the right pier → carry centred, fade earlier
- D249 Walk-ins cut through chairs on their way to a seat → aisle waypoint
- D250 Front-left fern reads as a fragment
- D251 Uptown wainscot mouldings have no contrast; the picture rail is hidden behind the awning
- D252 Cut-scene 01: still ~30% flat sky; stray edge posts above the roofline

**Design notes**
- D253 Drawer cards repeat the shared bottleneck reason · D254 Starter: walk-in crosses behind the driver

## v3.0 — build (addresses round 30 + code review round 1)

v3.0 is the first build that also passed through the `codecritic`, so the scene was restructured: `storefront.tsx` (2,527 lines) is now `src/components/scene/*` and has a geometry test suite.

| Note | Fix |
| --- | --- |
| G71 | Uptown's arched back window sits 20 units lower, so the arch clears the menu board |
| D246 | Waterfront net is gathered on a peg and fans to a ~25-unit sagging hem: six strands, uneven cross-knots, two #D9A35B cork floats |
| D247 | The counter-side baker always holds the peel upright (70%); the back table row moved 8 forward (y 40→32) and starts 8 further left |
| D248 | A walking driver holds the box centred in both hands; the edge fade starts 20 units before the screen edge |
| D249/D254 | Walk-ins route through an aisle behind their table (`table.y + 14`) and turn into the chair; they leave the same way |
| D250 | The front-left fern is dropped once the front table row reaches `L + 30` |
| D251 | Uptown mouldings get a #9A3452 highlight on their top and left edges; the picture rail is lowered to height 150, under the awning line |
| D252 | Cut-scene 01: a pale #E8E4FF moon (r22) and lit skyline windows (#F6C35A at 0.5); the cropped edge buildings that showed as posts are replaced by two neighbours flanking Rosa's |
| D253 | The drawer header shows "Bottleneck: …" once; the cards no longer each repeat "waiting on …" |
| (C7) | Note for D240: on unmanaged shops the parked vehicle is not drawn at all (it doesn't move) |

Found by the new tests: in a starter room with 3 cooks and 2 counter staff, the ovens overlapped the counter. The prep bench now caps itself so the oven bank always keeps 36 units.

Typecheck clean, 44 tests pass (14 new scene tests), `report.json` errors: [].

## v3.0 — critique (round 31) — ❌ NOT SATISFIED (no bugs, no [major] notes, 7 [minor])

**VERDICT: NOT SATISFIED.** v3.0 loads clean and the scene refactor shows no visible regressions. Most of the round-30 notes are fixed. Seven [minor] notes remain (the limit is ≤3), and four of them carry over from round 30.

**Fixed:** G71, D246, D247, D248, D249, D253 · **Still open:** D250 (→ D256), D251 (→ D259), D252 (→ D257), D254 (→ D255)

**Visual design (all [minor])**
- D255 Starter: the walk-in's aisle (y 34) crosses the driver's pickup spot and covers him. Route starter walk-ins behind the pickup line, or keep the path clear of `spots[0].x ± 14`.
- D256 The front-left fern sliver persists because the drop rule never fires (`t0 = L + 54` when plants ≥ 1). Drop the fern whenever there is a front row.
- D257 Cut-scene 01 has three problems:
  - The moon is clipped. Move it to (248, −26).
  - The windows look muddy tan. Use #FFD27A at 0.9 with a halo.
  - The neighbours still read as slivers. Show at least 45pt of each, with a lit window and a cornice.
- D258 Flagship: the back-row table and chair pile onto the heads of the front-row diners. Move the back row to y 38 when the front row is full, or drop the chair that sits behind a head.
- D259 Uptown mouldings are still faint and the picture rail is not visible. Use a #B04A68 highlight and a #5A1228 shadow, and draw the rail as a 2-unit #D4A84A line with a #8A6A2A underside at 150.
- D260 People standing on the doormat hide its lettering. Move the mat 10 units toward the curb, or put the wording on its outer half.
- D261 People are clipped at both screen edges. Add a left-edge fade for arriving walk-ins, and start the right-edge fade at 30 units.

**Design notes**
- D262 The header names "drivers & seats", but only Drivers is tagged. Tag Seating too, or name a single bottleneck.
- D263 Affordable green buttons appear next to "+$0/s now". Soften those buttons, or reword the line.

## v3.1 — build (addresses round 31)

| Note | Fix |
| --- | --- |
| D255 | Walk-ins walk to their seat (and back) along a lane in front of the counter (y 57), behind the drivers' pickup line (y 46), and only step forward once they're left of the pickup spots. A new test checks every layout so no walk-in passes in front of a pickup spot |
| D256 | The corner fern only stands in a starter room, before there's a front row of tables |
| D257 | Cut-scene 01 changes: <ul><li>The moon (r22, plus a soft halo) moves to (248, −26), inside the frame.</li><li>Windows are #FFD27A at 0.9, each with a 0.25 halo.</li><li>The neighbours are 60-wide towers that rise behind Rosa's roofline, with cornices, so a good width of each shows.</li></ul> |
| D258 | The back table row moves to y 36 |
| D259 | Uptown panels get a #B04A68 highlight (top and left) and a #5A1228 shadow (bottom and right). The picture rail is a 2-unit #D4A84A band with a #8A6A2A underside at height 150 |
| D260 | People pause outside at y −30, past the mat. The mat now sits from −8 to −22 with WELCOME on its curb half |
| D261 | Figures fade over 30 units at both screen edges; arriving walk-ins now fade in on the left |
| D262 | The Seating card is tagged BOTTLENECK alongside Drivers when the shared stage is "drivers & seats" |
| D263 | Affordable buttons that add $0/s now use the soft tone (the `useless` prop was declared but never used) |

Typecheck clean, 50 tests pass, `report.json` errors: [].

## v3.1 — critique (round 32) — ❌ NOT SATISFIED (no bugs, no [major] notes, 7 [minor])

**VERDICT: NOT SATISFIED.** v3.1 loads clean and the caching left no visible artefacts. The counter lane moved the walk-in overlap instead of removing it. The Flagship back row and the Uptown rail still look unchanged.

**Fixed:** D256, D257, D260, D261, D262, D263 · **Still open:** D255 (→ D264), D258 (→ D266), D259 (→ D267)

**Visual design (all [minor])**
- D264: the y 57 lane crosses the baker, and the pickup driver covers walk-ins as they order. Use a y 52 lane, or have walk-ins wait at `counter.x1 + 10` until the spot is clear.
- D265: walk-ins and drivers stack at the −30 outside pause. Offset the guest pause 14 left, or stagger it by index.
- D266: the Flagship back row still sits on the front-row heads. Move it to y 42, or drop the back-row seats that sit within 10 of a front-row head.
- D267: the Uptown rail and panels are still flat. Use a 3-unit rail with a #FFE08A top highlight and raise the highlight opacity.
- D268: cars in the two street lanes overlap. Move lane 1 down 8, or shrink the vehicles by 10%.
- D269: the Flagship shows a blue-barrel sliver and an edge-cut tree. Hide the barrel when `L < 30`, and pin the pot at x ≥ 6.
- D270: drawer lines wrap badly ("now" orphaned, "9.3 / walk-ins/s"). Use non-breaking spaces, or shorten the lines.

**Design notes**
- D271: a need-cash toast stays up after the player can afford the upgrade.
- D272: soft $0/s buttons need a small "no gain now" label.

## v3.2 — build (addresses round 32)

| Note | Fix |
| --- | --- |
| D264 | The walk-in counter lane moves to y 52 (in front of the bakers' line, behind the pickup spots). Walk-ins now turn toward the tables right at the counter's end (`counter.x0 − 4`), not past the bakers |
| D265 | Walk-ins walk the sidewalk on the curb side (y −52); drivers keep −30…−42, so the two don't stack |
| D266 | The back table row moves to y 42 |
| D267 | The Uptown rail is now 3 units of #D4A84A with an #8A6A2A edge and a #FFE08A top highlight. Panel highlights and shadows are 1.6 wide at 0.9 opacity |
| D268 | The second street lane moves 8 down (CURB_Y + 70) |
| D269 | Backdrop edge props (the Industrial crates) are left out when the room fills the frame (`L < 30`). The potted tree is kept ≥ 20 units inside the left edge |
| D270 | "+$0/s now" and "N walk‑ins/s" use non-breaking spaces and hyphens. The Grade line is "→ Copper ×2" |
| D271 | A "need $X" toast clears itself on the tick when cash reaches X |
| D272 | Soft $0/s buttons say "no gain now" under the price |

Typecheck clean, 49 tests pass, `report.json` errors: [].

## v3.2 — critique (round 33) — ❌ NOT SATISFIED (no bugs, no [major] notes, 8 [minor])

**VERDICT: NOT SATISFIED.** v3.2 loads clean. The new figure layering holds: there are no misaligned heads, hats, limbs or props. Six of the round-32 notes are fixed. The crowd-overlap fixes keep moving the overlap somewhere else instead of removing it.

**Fixed:** D265, D268, D269, D270, D271, D272 · **Still open:** D264 (→ D274), D266 (→ D275), D267 (→ D277), D260 regressed (→ D276)

**Visual design (all [minor])**
- D273: the peel "slide" swings toward the counter and into the pickup driver's cap. Rotate it back toward the oven.
- D274: walk-ins still cut diagonally across the bakers. Stay on the counter lane until left of the bakers.
- D275: the back-row diner stacks above a front-row diner. Shift the back row half a pitch so seats interleave.
- D276: people pausing outside cover WELCOME. Move the pause sideways off the mat.
- D277: the Uptown rail is still a hairline hidden behind the wall art. Make the cap 5 units, and move the rail to 132 so it runs unbroken.
- D278: Industrial barrels still show as edge slivers at the default footprint. Drop edge props that are less than 60% visible.
- D279: curb-side walk-ins' feet touch the Prep card. Leave a 4pt gap and give them a contact shadow.
- D280: drawer lines end in a dangling "·". Put the break at the separator.

**Design notes**
- D281: the "need $X" toast and the bottleneck hint disagree. When the tapped card isn't the bottleneck, point to the bottleneck.

## v3.3 — build (addresses round 33)

The crowd is now built by a pure `buildCast()` (scene/cast.ts). `crowd.test.ts` simulates 40 s of busy shops at every footprint and checks four things in screen space:
- walkers cover the kitchen crew in < 6% of frames
- nobody stands still on the doormat
- people standing still never cover each other
- passing traffic overlaps in < 15% of frames

Overlaps no longer get pushed from one place to another.

| Note | Fix |
| --- | --- |
| D273 | The baker's "slide" peel tips back toward the oven (−48°) instead of out toward the counter |
| D274 | Walk-ins turn toward the tables at the counter's end (before the bakers) and walk the dining aisle between the two rows (y 24). On tables walk-ins use, they take the right-hand chair (the regular sits left), so they never pass their own table |
| D275 | The back row's seats fall midway between the front row's (b0 snapped to `t0 + SEAT + n·2·SEAT`) |
| D276 | Outside, walk-ins pause left of the door and drivers right of it, so nobody stands on WELCOME (tested) |
| D277 | The Uptown cap gets a 1.2 #FFE08A top line; the picture rail moves to height 132, below the wall art |
| D278 | Backdrop edge props (the Industrial barrels at x 30 and 352) are drawn only where they show whole beside the shop's walls |
| D279 | The curb-side walk-in line moves to y −48 |
| D280 | Drawer details join " ·" to the next word with a non-breaking space, so a line never ends in "·" |
| D281 | When the tapped station isn't the bottleneck, the need-cash toast adds "· Drivers is the bottleneck" |

Typecheck clean, 54 tests pass, `report.json` errors: [].

## v3.3 — critique (round 34) — ❌ NOT SATISFIED (1 bug, no [major], 4 [minor])

**Fixed:** D273, D275, D276, D277, D278, D280, D281 · **Still open:** D274 (→ G72), D279 (→ D285)

**Bugs**
- G72 `timelines.ts`: `turnX = Math.min(seat[0], counter.x0)` is always the seat x. Walk-ins stay on the y 52 lane in front of the bakers. Fix: `Math.max(...)` (turn at the counter's end). Tighten the crowd test to 0 frames of a walker covering a baker's torso.

**Visual design (all [minor])**
- D282 The guest pause (d0 − 6) covers the parked van (d0 − 30). Move the van to d0 − 70, or pin it left of the pause, and add props to the stand-still test.
- D283 Back-row diners' heads cover the bakers' feet. Raise the bakers by 6 at footprints that have a back row, or fix the draw order.
- D284 A leaving driver fades to a half-transparent ghost at the right edge. Keep o = 1 until x passes SCENE_W + 10, or fade over the last 8 units only.
- D285 Curb-side walkers' feet sit about 2pt above the Prep card. Use GUEST_WALK_Y −44, and give walkers a contact shadow.

**Design notes**
- D286 The Ovens tag opens the drawer focused on a "no gain now" card while Prep is the bottleneck. Highlight the bottleneck instead.
- D287 The bottleneck hint flips between two tied stations. Lock it for 3 s, or use a fixed tie-break order.

---

## Rounds 34–36 (v3.3 → v3.5), archived verbatim from CRITICLOG.md

### Current state — v3.3, round 34: ❌ NOT SATISFIED (1 bug, 0 [major], 4 [minor])

v3.3 loads clean. Seven of the round-33 notes are confirmed fixed: D273 (peel), D275 (interleaved back row), D276 (nobody on WELCOME), D277 (Uptown rail), D278 (no barrel slivers), D280 (drawer "·"), D281 (bottleneck toast).

**Open: fix these in v3.4**

| ID | Type | Note | Proposed fix |
| --- | --- | --- | --- |
| G72 | bug | `timelines.ts` `guestPose`: `turnX = Math.min(seat[0], lay.counter.x0)` is always the seat's x, so walk-ins stay on the y 52 lane in front of the bakers (y 60/72) across the oven zone | `Math.max(seat[0], lay.counter.x0)`: leave the lane at the counter's end and walk the y 24 aisle. Tighten `crowd.test.ts` to **0** frames where a walker covers a baker's torso (the < 6% budget let this through) |
| D282 | minor | Flagship: the guest pause (`door.lanes.guestPauseX = d0 − 6`) stands in front of the parked van (`lay.scooter.x = d0 − 30`, ~45 wide) | Move the van to about `d0 − 70`, or pin it left of `guestPauseX − 30`; include props in the stand-still overlap test |
| D283 | minor | Flagship: back-row diners' heads (y 42) cover the bakers' shins and feet | Raise the bakers 6 (y 66/78) at footprints with a back row, or draw bakers after back-row diners where their x ranges overlap |
| D284 | minor | A leaving driver fades to a half-transparent "ghost" at the right edge (x ≈ 375) | Keep `o = 1` until the figure is past `SCENE_W + 10`, or fade only over the last 8 units (`edgeFade` in `cast.ts`) |
| D285 | minor | Curb-side walk-ins' feet sit about 2pt above the Prep card, with no visible contact shadow (carried over from D279) | `GUEST_WALK_Y = −44`; give walking guests a 10×3 `#000` 0.18 shadow |
| D286 | note | Tapping the Ovens tag opens the drawer on a "no gain now" Ovens card while Prep is the BOTTLENECK | When the tagged station isn't the bottleneck, highlight the bottleneck card (or pulse both) |
| D287 | note | The first-minute hint flips between "more ovens" and "more drivers" when the two are tied | Lock the bottleneck for ~3 s, or use a fixed tie-break order (same as D281) |

### v3.4 — build (addresses round 34 and the one-time playtest; tap-target resize is planned for v3.6)

| Note | Fix |
| --- | --- |
| G72 | `timelines.ts` `guestPose`: `turnX = Math.max(seat[0], lay.counter.x0)`. Walk-ins leave the counter lane at the counter's end and use the aisle. `crowd.test.ts` now allows **0** frames of a walker covering a baker's torso; the new test fails on v3.3. |
| D282 | The parked vehicle moved to `d0 − 60` and the chalkboard to `d0 − 115`; geometry test checks the clearance to `guestPauseX`. |
| D283 | Bakers behind a back-row diner stand 17 deeper (`BACKROW_BAKER_SHIFT`); a crowd test checks heads never cover a baker's shins or feet. |
| D284 | `edgeFade` holds opacity 1 until a figure is 14 past the edge, then fades over 8. |
| D285 | `GUEST_WALK_Y = −44`. |
| D286, D287 | The drawer shows "Upgrade prep + ovens · $X (one alone adds $0/s)" when stations are tied, so the tied cards are explained. |
| Playtest 1 | Cut-scene taps are ignored for 450 ms after each line and 700 ms after a scene opens; a new scene waits 1.5 s after the last kitchen tap. |
| Playtest 3 | The heading reads "Industrial · Part 4" until the last panel, then shows the title. |
| Playtest 4–8 | No BOTTLENECK badge on the manager card; Settings shows `APP_VERSION`; rates use `rate()`; goal bar uses `goalAmount()` ("$1.50K / $1.50K"); Drivers capped at `levelCap`; the Build toast names the cost and shows on the City screen; the offline popup says when earnings are capped. |
| Playtest, frugal path | Suburbs is locked until downtown-4 plays and shows "Nonna takes over in N more pizzas" on the Downtown manager card. |
| Playtest, story | The speech tail is hidden on "You" lines; the MegaSlice HQ logo moved off Victor's head; "Ten thousand pies" → "A hundred thousand"; "…on a bike. Lately, a drone."; "2 AM" → "finals week"; `sold-sign` and `recipe-card` props are drawn. |

### v3.5 — build (round 35 notes from the v3.4 review)

| Note | Fix |
| --- | --- |
| D288, D289, D292 | Not changed. A walk-in passing in front of the chalkboard or planter is correct depth ordering (the walk lane sits closer to the viewer); the dining row density is carried. |
| D290 | The cut-scene heading reads "Waterfront · Act 3" instead of "Part 3", so it can't be mistaken for the panel number. |
| D291 | The tapped-tag highlight only shows on a bottleneck card, so the drawer never has two competing highlights. |
| D293 | New shot `16-tied-bundle-drawer`: both tied cards are red and the banner reads "Upgrade prep + ovens · $35 (one alone adds $0/s)". |
| D295 | New shot `17-suburbs-locked`: tapping Suburbs on the City map shows "Nonna takes over in 110 more pizzas". |
| D296 | New shots `18-sold-sign-scene` and `19-recipe-card-scene`; both props sit inside the cropped frame (x 99–301) clear of the speaker's head. |
| Offline cap | New shot `20-offline-capped` shows "Earnings are capped at 4h 0m (you were away 9h 1m)". |
| D294, D297 | Not changed (notes). |

### v3.6 — build (round 36 notes from the v3.5 review)

| Note | Fix |
| --- | --- |
| G73 | The recipe card is 46 wide at x 246–292 (rotated −6°), inside the cropped frame (x 99–301) with a margin on the right; it sits behind Nonna's shoulder. |
| G74 | A save already past the Drivers cap quotes its own level in the lock text ("Expand to go past Lv 30"); a test covers it. |
| D298 | The sold sign is on a post planted in the dock plank at the left (base plate at the plank), above the cap and clear of it. |
| D299 | Caption boxes are 0.94 opaque with a soft drop shadow, so art behind them reads as intentionally overlaid. |
| D300 | The cap note reads "Capped at 4h 0m (away 9h 1m)" with non-breaking spaces inside each duration. |
| D301 | Not changed: curb walkers are drawn at 1.2× against 1.1× for floor diners (perspective only); the ratio in the screenshot comes from seated diners being drawn shorter. |
| D302, D303 | Carried (early-shop dead sky; back-row density). |
| D304, D305 | Notes, not changed. |

---

## Round 37 (v3.6) and the v3.7 build table, archived verbatim from CRITICLOG.md

### Current state — v3.6, round 37: ✅ SATISFIED (0 bugs, 0 [major], 3 [minor])

v3.6 loads clean (`errors: []`, `loaded: true`) and the critic opened every shot. G73 (recipe card clipped), G74 (Drivers lock copy), D298 (sold sign on the cap), D299 (captions over art) and D300 (cap note wrap) are confirmed fixed; D301 was accepted as perspective. Rounds 35–36 (v3.4, v3.5) were NOT SATISFIED and are archived with their build tables.

**Open (none blocks satisfaction)**

| ID | Type | Note | Proposed fix |
| --- | --- | --- | --- |
| D302 | minor | Early shops (03, 03b) leave ~190pt of empty sky above the roof | A few background buildings, a billboard or a bird line at y 340–500 |
| D303 | minor | Back-row diners at Industrial and Uptown sit shoulder to shoulder; heads overlap (carried from D292) | Space the back row 6–8pt wider or alternate heights |
| D306 | minor | The three Industrial chefs share one white uniform and hat, differing only in hair and skin | A different hat, a neckerchief colour or a different prop for one chef |
| D304 | note | The tied-station banner reads as a label, not a button | Make it a tappable "buy both" button |
| D305 | note | Suburbs reads as a live "Build $300" on the City map and list while locked | Padlock and "Nonna takes over in N" on the row, dim the pin |
| D294 | note | A "no gain now" button still has a green price | Grey the price text |
| D297 | note | Goal-bar fill runs through the label on an unmanaged shop | Darker label over the fill |
| — | note | The Suburbs-locked toast covers the University lock on the City map | Sit it lower, under the map |
| — | planned | Tap targets below 44px (chips 22px, compact buy buttons 29px) | The v3.8 resize, after the v3.7 story pacing build |

### v3.7 — build (planned feature: story pacing and neighbourhood perks; open minors carried)

| Change | What to look for |
| --- | --- |
| Story pacing | After a launch or return one waiting story beat plays at once; after that a beat waits for 90 s of play since the last one ended (tutorial included). A finale waits 300 s after its beat 3 (Downtown 120 s). Scenes the player causes (a new pizzeria, the Pier 9 bid) still play at once. downtown-3 now triggers at 45 pizzas. |
| Perks | Each finale shows a closing card "★ COACH DALE’S PERK ★ …" (new shot `22-dale-perk-card`). Perks apply only to their own pizzeria: Dale (Suburbs) walk-ins pay 85%, Marisol (Waterfront) +10% prices, Priya (University) driver upgrades −10%, Big Sal (Industrial) +25% offline earnings, Genevieve (Uptown) 6% per decor tier. The drawer shows the perk as a banner, and the decor header shows 6% in Uptown once earned. |
| Pier 9 bid | Once "For Sale" has played and Waterfront has sold 50,000 pizzas, the goal bar leads with "Bid on Pier 9 to save Marisol’s dock · $2.00M" (new shot `21-pier9-bid-goal`). Winning it plays "Dock Saved". |
| Pacing sim (greedy buyer, one sitting) | Nonna takes over at 5.0 min (was 1.4), Suburbs opens at 5.0 (was 2.0), the bid is won at 35.9 min, University opens at 70.4 (was 66.1), the city completes at 227 min (was 221). Longest scene gap 34.5 min, the University dead zone (deferred). |
| D302, D303, D306 | Carried, not changed. |

---

## Rounds 38–43 (v3.7 → v4.2) and build tables v3.8–v4.3, archived from CRITICLOG.md

### Rounds 39–43 verdicts (summarised; the build tables below record what each round's notes were and how they were fixed)
- **Round 39 (v3.8): NOT SATISFIED.** D309 the taller row hid the far traffic lane; D310 manager button contrast; D311 manager gain dropped; D312 chip hit margins overlapping; D308 follow-up (Uptown decor header).
- **Round 40 (v3.9): NOT SATISFIED.** D313 no-gain buttons looked the same as buyable ones; D314 station icons lost; D315 unmanaged shop's second design language and the A-board on the sill; D316 bottleneck red on a greyed button; D317 drawer copy wraps; D318 note (tied stations invisible on the sidewalk).
- **Round 41 (v4.0): NOT SATISFIED.** D319 drawer kept the green no-gain button; D320 "NO GAIN" replaced station names; D321 crowded Waterfront wall (net over menu, lopsided ovens); D322–D324 notes.
- **Round 42 (v4.1): NOT SATISFIED.** G75 locked upgrades drawn as no-gain; D325 strike-through vanished on round digits; D326 the bottleneck to save for didn't stand out; D327 "COUNTER" touched the edges; D328 a walk-in's head into a baker's feet (Suburbs, shot 05); D329 Expand/Fleet "+$0/s now".
- **Round 43 (v4.2): NOT SATISFIED.** D330 pink dashed outline around the green saving face; D331 two drivers stacked in Uptown's door (shot 14); D302/D306/D328 carried; D332–D335 notes.

### Current state — v3.7, round 38: ✅ SATISFIED (0 bugs, 0 [major], 3 [minor])

v3.7 (story pacing, neighbourhood perks, the Pier 9 bid) loads clean and the critic opened all 27 shots with no regressions. The perk card (22) and the bid goal (21) were checked in pixels.

**Open (none blocks satisfaction)**

| ID | Type | Note | Proposed fix |
| --- | --- | --- | --- |
| D302 | minor | Early shops leave ~190pt of plain sky above the roof | A back row of low buildings or a billboard at y 340–500, fill #9FB4CC |
| D303 | minor | Back-row diners at Industrial and Uptown touch heads | Space back-row seats 6–8pt wider, or drop every other diner 4pt |
| D306 | minor | The three Industrial chefs wear the same jacket and toque | A red neckerchief (#E5483A) or a skull cap on one |
| D307 | note | Dale's perk text can read as a loss | "Suburbs walk-ins pay more: 85% of full price (was 70%)", green up-arrow |
| D308 | note | No shot shows the drawer perk banner or Uptown's 6% decor header | Add a Suburbs drawer shot after Dale's finale |
| — | note | Building University while saving for the $2.0M bid drops the bid progress without warning | A one-line hint on the University chip ("Pier 9 bid in progress") |
| D304 | note | The tied-station banner looks like a label | Make it a tappable "buy both" button |
| D305 | note | Suburbs shows a live "Build $300" while locked | Padlock and countdown on the row and tile |
| D294 | note | "No gain now" buttons keep green price text | Grey the price |
| D297 | note | Goal-bar fill runs through the label on an unmanaged shop | Darker label over the fill |
| — | note | The Suburbs-locked toast covers the University and Industrial lock tiles | Sit it under the map |
| — | planned | Tap targets below 44pt | v3.8 |

### v3.8 — build (tap targets; round-38 notes)

| Note | Change |
| --- | --- |
| Tap targets (planned) | `components/tap-targets.ts` holds the sizes; a test asserts every control reaches 44 pt with its hit margin. Sidewalk buy buttons are drawn at 44 pt. Each station card's label strip is 18 pt with a 26 pt hit margin above only, and 4 pt of dead space above the buy button. Unmanaged-shop chips are 26 pt with 9 pt margins (font 12, was 10.5). The drawer's Close button is 30 pt with 7 pt margins. The row is ~14 pt taller and sits ~14 pt lower (its foot just past the kerb), so its top is where it was and the curb walk-ins still clear it; it now covers the top edge of the street. |
| Unmanaged shop | The manager card is one 44 pt button reading "Hire a Waterfront manager · $30K", so the taller controls don't cover the WELCOME mat (05b). |
| D307 | Dale's perk reads "Suburbs walk-ins pay more: 85% of full price (was 70%)". |
| D308 | New shot `23-perk-banner-drawer`: the Suburbs drawer after Dale's finale shows the perk banner. |
| C39 (code) | A short iOS interruption no longer plays the next story beat early. |
| D302, D303, D306 | Carried. |

### v3.9 — build (round-39 notes from the v3.8 review, and the codecritic's C44–C46)

| Note | Change |
| --- | --- |
| Tap targets, redone | v3.8's hit margins don't work on a real iPhone (a touch outside a parent's bounds never reaches the child, and web ignores hitSlop, so the screenshots couldn't show it). Every sidewalk control is now **drawn** at 44 pt: each station is one button with its name above the price (the label strip is gone, **All** opens the drawer), chips are 44 pt, the manager button is 44 pt. Close is 36 pt with a 4 pt margin inside the header's padding. |
| D309 | The station cards are 55 pt (v3.7: 62 pt), so the row sits above the kerb again (`SIDEWALK_ROW.raiseManaged = 13`): the kerb and both traffic lanes show (13). An unmanaged shop's column (chips 44 + manager 44) sits at `raiseIdle = 2`, clear of the WELCOME mat (05b). |
| D310, D311 | The manager button reads "HIRE A MANAGER · +$22/s" over the price; greyed-out button text is #665A4F (~4:1, was ~2:1). |
| D312 | No chip hit margins any more. |
| D308 | Shot 15a shows the Uptown decor header "+6%" with Genevieve's perk (14/15 now seed that perk). Shot 15 is now the All drawer (station tags are gone). |
| D302, D303, D306 | Carried. |

### v4.0 — build (round-40 notes from the v3.9 review)

| Note | Change |
| --- | --- |
| D313 | One "no gain" look everywhere on the sidewalk: a flat #EFE6D8 face, #CFC3B2 rim and #8A7B6C text reading "NO GAIN" next to the station icon. Green now only ever means "this adds income" (03, 05, 05b). |
| D314 | Station icons are back, 13 pt, left of the station name (05, 09, 14). |
| D315 | An unmanaged shop's chips are the same buttons as the managed cards (icon, name over price, level badge), unframed to fit; All sits beside the manager button only (44 pt, not stretched); the A-board moves 10 right and shrinks to 85% (05b). |
| D316 | A bottleneck you can't afford yet has a soft dashed #F2B8B0 outline and a dark badge; it turns solid red when affordable (03, 03b). |
| D317 | "Expand to hire past 30" for Drivers; "Lv" and its number never split across lines. |
| D302, D303, D306 | Carried. |

### v4.1 — build (round-41 notes from the v4.0 review)

| Note | Change |
| --- | --- |
| D319 | The drawer's no-gain buttons use the same flat muted look as the sidewalk ("no gain now" over a struck price); green appears only on buys that add income (05a, 15, 16, 23). |
| D320 | Sidewalk buttons keep the station name; a no-gain price is struck through instead (03, 04, 05, 21). |
| D321 | Waterfront: the third oven sits centred over both columns (any incomplete top row of stacked decks is centred); the porthole is 6 lower and clears the menu; the fishing net hangs under the porthole, clear of the menu and the counter staff (21). |
| D324 | Station cards drop "+$0/s now" when the button already says "no gain now". |
| D302, D303, D306 | Carried. |
| Screenshots | One run of shot 22 (perk card) timed out waiting for the cut-scene; a re-run passed. Watch for flakiness. |

### v4.2 — build (round-42 notes from the v4.1 review)

| Note | Change |
| --- | --- |
| G75 | A locked or maxed upgrade is never "no gain": it shows "Locked" or "MAX" in the normal grey (16 Drivers). One rule, `buttonTone`, now drives the sidewalk and the drawer (cards and Fleet). |
| D325 | No-gain prices get a drawn 2 pt bar at 52% height, −6°, instead of a font line-through ($65 is struck in 05, 05a). |
| D326 | The bottleneck you're saving for has a pale basil face (#DDEFD9), #2E7D3E text and a cash-progress line along its foot (03 Drivers). |
| D327 | Sidewalk icons 11 pt and letter spacing 0.1, so "COUNTER" has side room. |
| D329 | Expand and Fleet drop "+$0/s now" too. |
| D302, D306, D328 | Carried. |

### v4.3 — build (round-43 notes from the v4.2 review)

| Note | Change |
| --- | --- |
| D330 | The bottleneck being saved for has a basil dashed outline (#2E7D3E at 60%) matching its pale basil face; no more pink with green (03). Solid red stays for an affordable bottleneck. |
| D306 | Cooks differ by position in the kitchen: the first keeps the toque and a red neckerchief, the second wears a grey skull cap and a mustard neckerchief, the third a basil neckerchief (09, 13). |
| Code-review fixes seen on screen | Decor cards in an unmanaged shop no longer show a green button (C63); chips on an unmanaged shop no longer get the "saving for" face (C64). |
| D302, D328, D331 | Carried. |

---

# Rounds 44–50 and builds v4.7–v5.2 (playtest 2), archived 2026-10-30

## Current state — v4.3, round 44: ❌ NOT SATISFIED (0 bugs, 1 [major], 2 [minor]). The loop is paused here (Julien, 2026-10-30).

v4.3 loads clean (`errors: []`, `loaded: true`); the critic checked all 29 shots. D330 (basil saving outline), D306 (distinct cooks: grey skull cap on cook two), D328 (walk-in under the baker's feet) and D331 (drivers stacked in the door) are confirmed fixed in the pixels.

**Caution on D336:** v4.3 changed no crowd or route code (only a cook `variant` prop in `scene/cast.ts`). Crowd overlaps depend on the frame each screenshot lands on, so D328/D331 "fixed" and D336 "regressed" are likely the same intermittent counter/door crowding caught on different frames. Treat it with the crowd-overlap lesson: reproduce it in `scene/__tests__/crowd.test.ts` (a driver/walk-in budget at the counter) and make the test fail before fixing it.

**Open**

| ID | Type | Note | Proposed fix |
| --- | --- | --- | --- |
| D336 | major | Walk-ins and the pickup driver share one spot at the counter: in 03b (opening minute) a walk-in is drawn over most of the driver at the register; in 11/12 a walk-in's head sticks up behind the driver's cap (one figure, two heads); in 14 two walk-ins overlap at the driver's shoulder | Give walk-ins their own order point ~34 pt left of the driver pickup (the register's left end), or queue them ~26 pt apart, never on the driver's spot; add a crowd-test budget for driver/walk-in overlap at the counter that fails on v4.3 first |
| D302 | minor | Early shops (03, 05b, 21) leave plain sky above the roof | A back row of low #9FB4CC buildings or a billboard at y 340–500 (Waterfront: a far pier/lighthouse; Suburbs: a water tower and rooftops) |
| D337 | minor | The cooks' neckerchiefs (red, mustard, basil) are ~2 pt wide and don't show at phone size; only the skull cap tells cook two apart | Widen each kerchief to a 6×4 pt triangle under the chin with a 1 pt outline (`scene/people.tsx`, `COOK_KERCHIEF`) |
| D304 | note | The tied-station banner "Upgrade prep + ovens · $35" reads as a label (16) | Make it a green, tappable "Buy both · $35" button |
| D305 | note | Suburbs shows a live "Build $300" on the City map and list while locked; the Nonna countdown toast covers the top lock tiles (17) | Padlock and the countdown on the row and pin; the toast under the map |
| — | note | During the Pier 9 bid, the University chip is solid green "Build $1.2M" (21) | A one-line "Pier 9 bid in progress" hint on the chip |
| D297 | note | Goal-bar fill runs through the label on an unmanaged shop ("ma\|nager") | Darker label over the fill |

---

## v4.7 — build (playtest 2, step 1 of 6: the engine). Plan: `docs/PLAN-v4.7-playtest2.md`
Owner's playtest notes P1–P8 (2026-10-30) plus his decisions (station heads, GM ×2, 3 taps with no tap-ahead, cash only when pizza leaves, neighbourhood identity). Audio builds v4.4–v4.6 changed no visuals.

| Change | Where | Shots |
| --- | --- | --- |
| Kitchen line: prep → oven → counter jobs with real durations; cash is paid only when a departure reaches the door (driver, 1.2 s) or the register (walk-in, 0.5 s) | `engine/pipeline.ts`, `game.ts` | 04, 09 |
| Station heads (Head Prep Cook / Baker / Cashier, named per neighbourhood) automate one station each; the General Manager needs all three, gives ×2 income and offline earnings; Nonna brings Downtown's heads | `tuning.ts` HEADS, `game.ts` | 05b, 05a |
| Goal bar and the idle shop's sidewalk button name the next hire ("Hire Finn, Waterfront's Head Prep Cook") | `app/index.tsx`, `sidewalk-row.tsx` | 05b |
| HUD subtitle names the next station ("Tap to bake · 4 prepped"); interim: a tap on the shop runs the next station; "TAP TO PREP!"; "N pies in the kitchen" | `storefront.tsx`, `index.tsx` | 03, 04, 05b |
| Whole pizza numbers ("Nonna takes over in 71 more pizzas", never 70.0002) | `format.ts` `pizzas`/`pizzasLeft` | 05a |
| Batch +2 pies every 20 prep levels; later neighbourhoods' build and upgrade prices ×1.5 to absorb the GM's ×2 (completion 183 min, longest story gap 23.7 min, was 227 / 34.5) | `tuning.ts` | — |

Station badges, hit-tested taps and per-departure pops are v4.8; event-driven people v4.9; neighbourhood identity v5.0.

## Round 45 (v4.7): ❌ NOT SATISFIED — bugs G76–G78, notes D338–D343. Next IDs: **G79, D344**.
| ID | Type | Note | v4.8 |
| --- | --- | --- | --- |
| G76 | bug | "TAP TO PREP!" pill reappears between steps and contradicts the HUD | pill removed; station badges + hand |
| G77 | bug | Oven lit while only prep runs | lit only while a job bakes (GM shops: while running) |
| G78 | bug | Rush tap pulses the HUD cash though it pays nothing | removed |
| D338 | major | Next-hire goal clipped ("…Head Prep C…$6.00K") | "Waterfront: hire Finn (prep)" |
| D339 | minor | Refused-tap pill far from the kitchen, no reason | toast carries the line's reason ("Dough's still being prepped", "Serving · 2.6 s") |
| D340 | note | No timer during a 17 s bake | ring timers |
| D341 | note | Goal bar and sidewalk both "Hire Finn", neither says what he does | sidewalk "HIRE FINN · RUNS PREP FOR YOU"; goal bar moves on in that shop |
| D342 | note | No shot of the head cards | `05b2-heads-drawer` (+ 05b3 prep ring, 05b4 refused tap) |
| D343 | note | "$3.0" cash | whole dollars under $1K (HUD and goal amount) |
| D336, D302, D337, D304, D305, D297, Pier 9 chip | open | unchanged | D336 → v4.9, D337 → v5.0 |

## v4.8 — build (playtest 2, step 2: stations UI)
| Change | Where | Shots |
| --- | --- | --- |
| Hit-tested station taps (counter → prep → oven, front-most first; ≥ 44 pt); tap position from page coordinates (web `locationX` was relative to the SVG child, so every tap hit the oven) | `scene/stations.ts`, `storefront.tsx` | 03b, 04, 05b3, 05b4 |
| Badge row under the name plank: 24 pt ring timer (basil, tomato on the bottleneck), pies count pill, pulsing hand on the station to tap, head initial chip when a head runs it; rush = ring jump | `scene/kitchen-hud.tsx` | 04, 05b, 09–12 |
| "+$X" / "×338 · +$213K" pop rides counter → door with each driver departure (walk-ins: over the register), turns into a coin that lands on the HUD cash when the cash lands; ≤ 2 pops, ≤ 3 coins | `kitchen-hud.tsx` | 10, 11 |
| Head hire bubble ("Finn: I got the dough, boss!"); `docs/story/CAST.md` | `storefront.tsx` | — |
| Old tap UI removed (queued pill, TAP TO PREP, tap pills, rush coins) | `storefront.tsx` | all |

## Round 46 (v4.8): ❌ NOT SATISFIED — G79, G80, D344–D351. Next IDs: **G81, D352**.
| ID | Type | Note | v4.9 |
| --- | --- | --- | --- |
| G79 | bug | Hand points at a badge that isn't a tap target; a miss does nothing | a ≥ 44 pt circle round each badge taps its station; a miss bounces the hand 1.4× and outlines the station 0.3 s |
| G80 | bug | Only one of two tied stations is red | every tied station is tomato (`tiedStages`) |
| D344 | major | Coin stops at the scene top, 290 pt short of the cash | coins fly in a screen overlay (native driver) from the carrier to the HUD cash, 18 pt with a #8A5A00 rim, 4-dot sparkle on landing |
| D345 | major | Heads have no faces | `HeadFace` bust per head with a role hat (cook cap, red bandana, green visor; GM tie) on the drawer cards and as a mini face on the badge |
| D346 | minor | Badge row pasted on the awning | the row hangs on a 30 pt #4A2A1A rail at 85%; 12 pt pie icon |
| D347 | minor | Pop covers faces / OPEN | 40 above the carrier's head, drifts up 10, fades over its last 0.2 s |
| D348 | minor | Refusal toast far away, seconds not always shown | refusal pill under the tapped station's badge; every busy refusal carries the time left |
| D349 | minor | No hire-bubble shot | `05b5-hire-bubble` |
| D350 | note | Count pill means different things | idle prep shows "×4" (next batch) |
| D351 | note | Struck "$90" reads as unaffordable | **declined**: the struck no-gain price is the D313/D325 rule (green always means "adds income"); kept |

## v4.9 — build (playtest 2, step 3: people + round-46 fixes)
| Change | Where | Shots |
| --- | --- | --- |
| **D336**: drivers and walk-ins follow departures (`scene/crew.ts`): one driver per pickup spot, out the door with each order along a lane in front of the register, back again; one walk-in waits at the register for a walk-in sale, eats, leaves (or gives up after 8 s); none when walk-ins buy nothing. Constant walking speed on every leg (P6). Crowd budget at the counter (walk-in vs driver, stacked drivers ≤ 15%, steady/sparse/burst cadences) failed on 541 frames with the old exit route; passes now | `crew.ts`, `cast.ts`, `crowd.test.ts` | 03b, 04, 09–12 |
| Round-46 fixes above; automated jobs last ~2.4 s (was 1.6) so each stack leaving reads | `kitchen-hud.tsx`, `coin-layer.tsx`, `head-face.tsx`, `stations.ts` | 05b2, 05b5, 10, 11 |

## Round 47 (v4.9): ❌ NOT SATISFIED — G81, D352–D360. D336 FIXED. Next IDs: **G82, D361**.
| ID | Type | Note | v5.0 |
| --- | --- | --- | --- |
| G81 | bug | A sale paid with nobody carrying it (pop over the register) | the engine now has carriers: boxed pies wait for the driver (lap 4.4 s) or the walk-in at the register (next one 4.2 s after a hand-over); each trip takes everything boxed. The scene runs on the same timings (trips start at the engine's dispatch time). Test: every departure in flight has a visible carrier, all footprints, three rate profiles |
| D352 | major | Walk-ins cut in half by the taller sidewalk row (no-manager shops) | walkers use a lane just outside the door there; crowd budget: no mover's feet in the row's band |
| D347 | major | Fallback pops over the cashiers | no fallbacks left in normal play (G81) |
| D353 | major | Flagship: driver among the front tables, a diner over his legs | driver exits along depth 40 (behind front diners' heads), steps forward to the doorway lane before the walk-in; the walk-in waits beside the counter's end (depth 60); budget: a seated diner never covers > 15% of a standing driver (30% walking past) |
| D354 | minor | Diners share tables / no chair | open |
| D355 | minor | GM mini face ×3 | one GM chip at the rail's left end |
| D356 | minor | Idle-shop sidewalk props on the sill | no-manager shops keep the sidewalk clear except the mat |
| D357 | minor | Hire burst shows through buttons | open (burst is inside the button; to check in pixels) |
| D358 | minor | Orphan words in head cards | "Runs the counter for you" |
| D359 | note | Struck price unexplained on the sidewalk | open |
| D360 | note | Tied subtitle | "Bottleneck: prep + ovens" |
| D337 | minor | Cook kerchiefs too small | 13×8.5 triangle with knot ends |

## v5.0 — build (playtest 2, step 4: neighbourhood identity + round-47 fixes)
Owner request (2026-10-30): each neighbourhood's pizzeria a little more different. `scene/identity.ts` (critic's proposal, red kept as piping):
| Shop | Facade (pilasters, entrance, sill) | Awning | Wall band | Tier-0 floor | Sidewalk |
| --- | --- | --- | --- | --- | --- |
| Downtown | red brick | scalloped red/cream | subway tile | cream | newspaper box |
| Suburbs | white clapboard | straight red/mint | beadboard | light oak | picket fence |
| Waterfront | blue planks + rope trim | scalloped navy/cream, red piping | shiplap | teak | bollard + rope |
| University | collegiate brick + limestone quoins | straight purple/gold, red piping | dark panelling | parquet tone | bike rack |
| Industrial | corrugated steel | box orange/charcoal, red piping | ductwork at the ceiling | concrete | barrel + cone |
| Uptown | green tile + brass caps | dome burgundy/cream, gold piping | (burgundy wainscot, kept) | marble | topiary + rope post |
Shots: `25-look-suburbs`, `25-look-university`, `25-look-downtown`, plus 05b (Waterfront), 09 (Industrial), 14 (Uptown).

## Round 48 (v5.0): ❌ NOT SATISFIED — identity PASS; D361–D365. Next IDs: **G82, D366**.
| ID | Type | Note | v5.1 |
| --- | --- | --- | --- |
| D361 | major | Pops almost never on screen (~0.65 s of a 4.4 s lap) | driver walks counter → door in 2.0 s with the pop over his head (coin at the door), lap 5.0 s; walk-in hand-over 1.0 s; shots 10/11 wait for a pop |
| D362 | minor | Same room everywhere | each back window has its own view (Downtown skyline, Suburbs rooftops, University spire, Industrial smokestack; Waterfront porthole, Uptown arch kept) |
| D363 | minor | Sidewalk props look like fragments | 9-picket fence on two rails with a shrub; dark rack with two bikes; two brass rope posts |
| D364 | minor | Industrial grey on grey | warm haze sky #F2C99B→#C9D3DC, steel #5E6670, hills #B7B0A0 |
| D365 | minor | City pins ignore identity | pins use each shop's facade and awning colours |
| D357 | minor | Hire burst through the buttons | no burst on the compact sidewalk buttons |
| D302 | minor | Waterfront sky empty | far headland + lighthouse + gulls |
| D354 | minor | Diners share tables | open |
| D304, D305, D359, D297, Pier 9 chip | notes | | open |

## v5.1 — build (playtest 2, steps 5 + 6: animation, tutorial, splash)
| Change | Where | Shots |
| --- | --- | --- |
| P3: a finished bake says "ding!" and the pies slide onto the pass; the oven mouth glows brighter while a pie bakes | `storefront.tsx`, `props.tsx` | 10, 12 |
| P5: "+50% faster" rises from a station's badge when an upgrade speeds it up ("+1 driver" at the door) | `storefront.tsx` | 04 (if a buy lands in frame) |
| P6: 1.0 s walk cycle stepped by time (8 poses) | `cast.ts` | — |
| P2: Nonna's guided tutorial (`engine/tutorial.ts`): prep → oven → watch (first batch ×2.5 speed) → counter → "money in the register" (cash halo) → again → Ovens button (gold frame) → "hire Marco" (goal-bar halo); story waits during steps 1–5; existing players skip it | `tutorial.ts`, `coach-card.tsx`, `index.tsx`, `game-ui.tsx`, `sidewalk-row.tsx` | 03, 03b, 04 |
| P1: logo (crowned slice) → `icon.png` / `splash-icon.png` (`scripts/render-logo.ts`); title card (logo drops in over turning rays, name, Nonna waves; 2.0 s first launch of the day, 1.2 s after; tap skips); scenes and the offline popup wait for it | `logo-art.ts`, `logo.tsx`, `title-card.tsx`, `_layout.tsx` | 00 |

## Round 49 (v5.1): ❌ NOT SATISFIED — G82, D366–D376. Next IDs: **G83, D377**.
| ID | Type | Note | v5.2 |
| --- | --- | --- | --- |
| G82 | bug | "Tap the oven" while dough still prepping | new step 2 "Rolling the dough… watch the ring fill up"; the oven step shows only once dough is ready (TUTORIAL_DONE 10) |
| D366 | major | Coach card covers the seating | docked over the street band, 64 pt, 44 pt portrait |
| D367 | major | Tutorial target not spotlit | 60% #2A1408 scrim with a rounded cut-out round the station, pulsing #FFD54A outline, a hand on the station |
| D368 | major | Pops on the cashiers' faces | pops ride beside the carrier's head (left, at head height); budget: no pop rect over a staff face |
| D369 | major | Title card composition | rays centred on the logo with a radial fade, logo 250 (art ~150 pt), block raised, Nonna in a cream ring, "Tap to start" #FFF4DC pulsing |
| D370 | major | Walk-in over the driver at the door | walk-in waits at counter end + 26 (past the post, clear of the driver's column); budget: waiting walk-in vs driver anywhere ≤ 15% |
| D371 | minor | "ding!" covers an oven | to the right of the oven bank, tail pointing at it, 11 pt |
| D363 | minor | Bike rack tangle | two bikes in profile on a #3A3A44 hoop rack |
| D372 | minor | Post cuts the waiting walk-in | see D370 |
| D373 | minor | Flat icon | radial #F25A3F→#C8321F, cheese gradient, jewels +15% |
| D374 | note | "Tap Ovens" after the cash went elsewhere | falls back to "save up" while cash < cost |
| D375 | note | Subtitle repeats the card | hidden while the card is up |
| D376 | note | No shot of the flash | `05b6-upgrade-flash` |
| D354, D304, D305, D359, D297, Pier 9 chip | | | open |

## v5.2 — build (round-49 fixes)
Shots: 00 (title), 03 (spotlit prep), 03b, 04, 05b6 ("+50% faster"), 10–12 (pops beside heads).

---

## Archived state — v5.2, round 50: ❌ NOT SATISFIED. The loop is STOPPED (Julien, 2026-10-30).
Rounds 45–50 covered the playtest-2 rework (`docs/PLAN-v4.7-playtest2.md`): a discrete prep → bake → serve line, station heads + GM, cash on departure with coins, event-driven crew, neighbourhood identity (PASSED in round 48), Nonna's tutorial and the title card. Each round fixed most notes; round 50 still has one [major].

**Open (round 50 on v5.2, plus carried notes)**

| ID | Type | Note | Proposed fix | v5.3 WIP |
| --- | --- | --- | --- | --- |
| D377 | major | The waiting walk-in's head is hidden behind the doorway's PIZZERIA plank | Move the walk-in's order spot clear of the lintel; add a budget that no standing head rect meets the doorway-sign rect (lintel P(0,0,122)→P(0,0,108) across door.x0−8..R−8) | **Done, committed as v5.3 WIP:** drivers now pick up at the counter's right end (by the door), walk-ins order at the left end (`counter.x0 + 4`, 60) via the dining aisle; all 213 tests pass. Sign budget **not yet added**; not yet checked in pixels |
| G83 | bug | Tutorial wait steps 2 and 4 show no hand | Show the hand (or a pulsing ring) on the station being waited on | — |
| D378 | minor | Tutorial scrim too light | 60% scrim extended over the sidewalk row, 4 pt glow on the cut-out | — |
| D379 | minor | Pops too wide | Cap at 80 pt with 11 pt text, or place above-left of the cap | — |
| D363 | minor | Bike rack tangle | Bikes 22 pt apart, visible hoops | — |
| D380 | minor | Title card: Nonna off-centre | Centre Nonna under the subtitle, waving hand | — |
| D381 | minor | "+50% faster" flash collides with the tutorial hand | Offset the flash or hide the hand while it plays | — |
| D354 | minor | Diners without chairs | Draw a chair under every seated diner | — |
| D382, D383, D359 | note | Small polish notes (round-50 text was not logged verbatim; D359 is in the round-47 archive table) | Re-read on the next critic run | — |
| D304, D305, D297, Pier 9 chip | carried | Older carried minors | See archive | — |

---

## Archived state — v5.3, round 51: ❌ NOT SATISFIED (minors only; critic holds the first-screen rule). Loop RESUMED by Julien 2026-10-30 night.
Fixed in v5.3: D377, G83, D378, D379, D380, D381. Retired: D382, D383 (text never logged; every changed shot re-reviewed).

| ID | Severity | Where / shot | Note | Concrete fix |
|---|---|---|---|---|
| D354 | minor | Rug table, Downtown + Waterfront (03, 03b, 04, 05b–05b6) | The lone rug-table diner sits on the left of the round table with no chair under them, while the table's only chair stands empty on the right. The chair test passes, but the chair is on the wrong side. | Chair on the seat the diner uses, drawn behind the body (back rail ~6 pt above the shoulders); remove the empty right chair or seat a second diner. |
| D384 | minor | Tutorial steps 1, 2, 4 (03, 03b, 04) | The tutorial hand sits at the bottom edge of the prep cut-out and covers the rug-table diner's head. | Hand at the cut-out's right edge pointing left (hx = x1 + 6, hy = middle), or inside over the dough; no head rect may meet the hand. |
| D363 | minor | Sidewalk bike rack (25-look-university; Downtown bike in 03) | Two bikes drawn on top of each other; neither silhouette reads. | Bikes 22 pt apart on a #5A5A5A hoop rack (2 pt), one shadow each, or a single bike. |
| D359 | note | Sidewalk cards (03, 04, 05b–05b6, 09–14) | Struck-through prices are unexplained. | Muted price + "need $X" or a lock glyph; strikes only for real discounts. |
| D297 | note | Goal bar on an unmanaged shop (05b–05b6) | The fill ends mid-label, same dark text over two backgrounds. | Draw the label twice, clipped: dark over cream, white over the fill. |
| D304 | note | Tied-station banner (16) | "Upgrade prep + ovens · $35" reads as a label, not a button. | Green "Buy both · $35" button in the Hire button's style. |
| D305 | note | City map/list while Suburbs is locked (17) | Live "Build $300" while locked; the Nonna toast covers the lock tiles. | Padlock + "Nonna takes over in N", pin at 50%, toast under the map. |
| Pier 9 chip | note | University chip during the bid (21) | "Build $1.8M" with no warning that it drops the bid's progress. | "Pier 9 bid in progress" hint under the chip's price. |

**Next IDs:** G84, D385.

---

## Archived state — v5.4, round 52: ❌ NOT SATISFIED (2 bugs in the new rewards UI). Fix round v5.5 in progress.
Fixed in v5.4: D354, D384. New feature reviewed: daily/weekly tasks + gift calendar (`docs/PLAN-v5.4-rewards.md`); defaults D2–D10 look right on screen.

| ID | Severity | Where / shot | Note | Concrete fix |
|---|---|---|---|---|
| G84 | bug | HUD subtitle + shop chips (29, 30–31b) | During a 2× boost the HUD shows "$179/sec · 2× 10m" and the chips the unboosted rate, but `lineTick` applies `boostMult`. Starting a booster looks like it does nothing. | Show the boosted rate ("$358/sec · 2× 10m" in #2E7D3E). |
| G85 | bug | Weekly chest (31b) | The chest offers a cosmetic already in the Collection and then pays nothing; from week 5 every chest is empty. | First unowned cosmetic, else a fallback (30 💎 + 2 h income), labelled. |
| D385 | minor | Tasks drawer (30–31b) | Unfinished tasks show a struck-through "Claim", read as cancelled. | Muted #E2D9CE pill with a lock or "9 / 20", or no button. |
| D386 | minor | Gift calendar (32, 33) | Milestone tiles not larger; labels "30m $", "2× 1d", "Skin", "Visit" cryptic; today's prize small and grey. | 18 pt icon per tile; milestones 2 pt #F5B700 border, 22 pt icon, ribbon; header prize 16 pt bold. |
| D387 | minor | Booster strip (30–31b) | Running chip looks like the tappable stock chips; diamond count red. | Running chip filled #3E9B4F "ON · 10 m left" + draining ring; "Start 2× 15m"; count in ink. |
| D388 | minor | Streak-save modal (33) | "Start over" is green though it resets the streak; repair text wraps badly. | Muted text button under Later; "Missed a day! Keep your streak for 20 💎 (day 7: 50 💎)." |
| D363 | minor | Bike rack (25-look-university) | The two bikes still overlap; 22 pt is less than a bike's length; no hoop reads. | ≥ 44 pt apart on visible #5A5A5A hoops, or one bike. |
| D389 | note | Tasks fixtures (30, 31) | Hard-coded "Earn $5K"/"Earn $60K" targets next to $162K/$1.29M rewards. | Build the shot's sets with the generator's numbers. |
| D359, D297, D304, D305, Pier 9 chip | note | carried | Texts in the round-51 archive section. | — |

**Next IDs:** G86, D390.

---

## Archived state — v5.5, round 53: ✅ SATISFIED (0 bugs, 0 major, 1 minor). Rewards feature passes.
Fixed in v5.5: G84, G85, D385, D386, D387, D388, D363, D389. Next build v5.6 = the cut-scene upscale (owner request) + rewards follow-ups; it gets a fresh review.

| ID | Severity | Where / shot | Note | Concrete fix |
|---|---|---|---|---|
| D390 | minor | Booster strip in the Tasks drawer (30, 30b, 31, 31b) | The third booster chip is cut hard at the right screen edge, so it looks broken, not scrollable. | 24 pt fade to #FFF5E6 on the right edge, or a 16 pt right inset. |
| — | note | Weekly tasks (31) | One weekly task pays +8 💎, the rest +7; reads as an error. | Even split or show the total. |
| D359 | note | Sidewalk cards (03, 04, 05b–05b6, 09–14, 29) | Struck-through prices are unexplained. | Muted price + "need $X" or a lock glyph. |
| D297 | note | Goal bar (05b–05b6, 32, 33) | Fill ends mid-label; one text colour over two backgrounds. | Label drawn twice, clipped. |
| D304 | note | Tied-station banner (16) | Reads as a label, not a button. | Green "Buy both · $35" button. |
| D305 | note | City map while Suburbs is locked (17) | "Build $300" live while locked; toast covers lock tiles. | Padlock + countdown, pin 50%, toast under the map. |
| Pier 9 chip | note | University chip during the bid (21) | No warning that building drops the bid's progress. | "Pier 9 bid in progress" hint. |

**Next IDs:** G86, D391.

---

## v5.6, round 54: ❌ NOT SATISFIED (2 major on the new cut-scene art). Loop STOPPED for handoff (Julien, 2026-10-30 23:00).
v5.6 = owner-requested cut-scene upscale (waist-up figures, layered backdrops). Clear step up; owner checks (clipping, crossing hands) fail. Fixed: D390, weekly-diamond note. Unchanged shots 00/03/06: busts still read.

| ID | Severity | Where / shot | Note | Concrete fix |
|---|---|---|---|---|
| D391 | major | Cut-scenes 02, 08, 18, 19 | Signs clipped: "PIZZA" sign behind the EST. 1974 frame (02/19); two-line caption covers the PIZZA sign and frame (19); MEGASLICE billboard and steam cut by the frame top (08); PIER 9 plaque runs off the right edge (18). | Frame to x ≥ 0.62 or sign 0.8×; billboard down 24 pt; plaque inset 12 pt; keep the top 60 pt free of signs for two-line captions. |
| D392 | major | Cut-scenes 02, 08, 18 | Hands: Nonna and Marisol share the same clasped "#" lump (clones); Sal's pointing finger jabs the suit man's elbow; the suit man's box mittens have detached ring cuffs. | Interlaced-finger clasp (3 arcs, no hash); a distinct worried gesture for Marisol; arms ≥ 8 pt clear of other figures; open palms with 4 fingers, flush cuffs. |
| D393 | minor | 08, 18 | Pale translucent streak across Sal's and Marisol's faces; `LIGHT_SHADE` overhangs the head (arc to x≈93 on a 36–84 head). | Clip shade/rim to the head ellipse; hair strands off the face. |
| D394 | minor | 02, 18, 19 | String-light bulbs half cut at the frame edges under the caption (02/19); sun behind the caption (18); Rosa's happy pose arms straight down, recipe card floats over the oven (19). | Bulbs 10 pt in; sun lowered; Rosa holds the card at chest height. |
| D395 | minor | 22, 01 | Tree trunk grows out of Dale's cap; win face open-eyed (22). Moon halo over the right tower (01). | Tree to x≈0.25 or Dale to 0.6; closed-eye happy face; moon in the far layer. |
| D396 | minor | 02, 19 | Chalkboard crams "$3 · $4 · $4" on one line. | One right-aligned price per line. |
| D359, D297, D304, D305, Pier 9 chip | note | carried | Texts in the round-53 archive section. | — |

**Next IDs:** G86, D397.
