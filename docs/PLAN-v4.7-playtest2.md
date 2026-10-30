# Plan — Playtest 2 (Julien, 2026-10-30) → builds v4.7+

Status: **locked** after one review by `critic` and `codecritic` (both PROCEED WITH CHANGES; their changes are folded in below) and the owner's answers. Build/review loop per HANDOFF.md until critic SATISFIED and codecritic APPROVED on the same build. The Todd interludes plan moves after this work and takes save v5.

## 0. Owner decisions (2026-10-30)
- **Process:** a shop makes pizza in **three taps**: prep bench → oven (visible timer) → counter. **No tap-ahead**: a station accepts a tap only when it can start. "It is meant to be a chore until a manager is hired."
- **Station heads (new):** each shop can hire a **Head Prep Cook** (automates prep, 20% of the shop's manager price), a **Head Baker** (oven, 30%), a **Head Cashier** (counter, 50%). The **General Manager** (100%, today's manager) needs all three heads, gives the **neighbourhood boost ×2 income** in that shop, and keeps it earning while away. Downtown heads cost **$25 / $60 / $120**; **Nonna is Downtown's GM**: when her story triggers she brings any missing heads.
- **Heads are supporting characters** in the story cast (named, drawn, with a voice) — §11.
- **Batches:** each prep level is a small speed boost (as today); every **20 prep levels** (20/40/60/80/100) the tap batch grows **+2 pies** (4 → 6 → … → 14). The Prep card shows "Bigger batch at Lv 20". **Nonna stays at 150 pies.**
- **Cash:** paid **only when pizza leaves**: a driver walking out the door, or a walk-in handed their pie at the register. "+$X" over that person, a coin to the HUD.
- **Other shops** pay per departure too, **quietly** (no tab chips).
- **Splash:** native splash + a 2 s animated title card (tap skips).
- **Neighbourhoods look more different** (owner request to the critic): distinct facades and awnings, **red kept as awning piping only** in the four non-red neighbourhoods — §10.

## 1. Playtest notes → fixes
| # | Note | Fix | Build |
| --- | --- | --- | --- |
| P1 | Startup splash | Logo (icon = slice + crown only, no text), splash bg = HUD red, title card | v5.2 |
| P2 | Fuller Nonna tutorial | Coach marks with Nonna's card and a hand on the exact target | v5.2 |
| P3 | Baking is instant | Stage machine with real durations, ring timers, baker/oven animation | v4.7 / v4.8 / v5.1 |
| P4 | Pizza as a process | Three tappable stations; heads automate them | v4.7 / v4.8 |
| P5 | Show upgrade effect and pace | Badge row with ring timers, bottleneck ring, "+50% faster" flash, "4 pies · 2.6 s" labels | v4.8 / v5.1 |
| P6 | Choppy walking | Constant-speed routes + a 1.0 s walk cycle at 15 fps; 30 fps only if a device check still needs it | v4.9 / v5.1 |
| P7 | "70.0002 pizzas" | Integer `sold`, `pizzas()` / `pizzasLeft()` formatters, a string test | v4.7 |
| P8 | Cash without pizzas leaving | Departures pay on the doorstep; scene animates carriers and pops | v4.7 / v4.8 / v4.9 |
| — | Neighbourhoods feel alike | Facades, awnings, wall bands, signature props, uniform accents | v5.0 |

## 2. Engine: the line (`src/engine/pipeline.ts`, pure)
- **State per shop (saved, v4):** `prep | oven | counter: {n, left, total} | null`, `prepped`, `baked`, `departures[] ≤ 6` (`{id, kind, n, cash, left}`), `walkInDebt`, `nextId`. Departure ids keep increasing across loads (never reset), so the scene's "highest id seen" can't miss pops.
- **Event stepping** inside `advanceLine(line, dt, rates, automation)`: steps from one job end / door arrival to the next, so leftover time carries over and results don't depend on tick size (the draft already does this). Mutate one working copy per advance (M39).
- **Automation per station:** `automation = {prep, oven, counter}` booleans from the heads (GM implies all). An automated station starts whenever a full batch is available and its output holds < 2 downstream batches (back-pressure counted in batches). A manual station starts only from a tap.
- **Taps:** `tapStation(line, st, rates)`; a refused tap returns a reason (`Oven busy · 2.1 s`, `Nothing prepped yet`). The oven takes **all prepped pies** (≤ bench 12+); the counter serves all baked pies. A manual station refuses taps when automated by a head ("Head Baker's on it").
- **Batch:** manual prep batch = `4 + 2 × floor(prep / 20)`; automated batch = `max(that, ceil(shopRate × 1.6))`.
- **Pricing (codecritic #6):** `cash = n × valuePerPizza(id, shop, vehicle)` for every departure, so revenue = `shopRevenue` by construction. The Bresenham split only picks which figure is drawn (driver or walk-in).
- **Departures:** driver `left = 1.2 s` (the scene's out-walk runs exactly this long); walk-in `left = 0` (pays at the register). Over 6 merge into the newest.
- **Rush tap (GM shops):** −0.25 s on every running job; pays nothing itself.
- **`playTick`** runs `advanceLine` for every built shop. **Offline** (`offlineTick`, closed form): a GM shop earns `shopRate × seconds` floored + in-flight carriers; a shop without a GM finishes only what's on its line (`min(piesInFlight, rate × seconds)`), even with heads. `load()` settles the line (pays carriers, counts in-flight pies) so nothing is lost or paid twice. **GM boost ×2** applies to `shopRevenue` (so offline, goals and gains see it).
- **Integer pizzas:** `sold` is an integer; v3 saves floor it.
- **Store:** keeps `tickAt` (wall ms, not saved) so the scene interpolates `left − (now − tickAt)` and freezes at 0 (never runs past the engine). `tapStation` updates `lastKitchenTap`.

## 3. Heads and the GM (engine + UI)
- `Shop.heads: {prep, oven, counter}` booleans; `managed` stays as "has GM" (save field kept). Costs: `HEAD_SHARE = {prep: 0.2, oven: 0.3, counter: 0.5}` × `managerCost`; Downtown `HEAD_COST_DOWNTOWN = {25, 60, 120}`. GM `upgradeLock`: "Hire all three heads first". Nonna's `auto-bake` reward sets all heads + GM.
- Migration: v3 managed shops → all heads + GM; v3 unmanaged → none.
- UI: drawer cards for the three heads (portrait + name + what they automate) and the GM card. The sidewalk row on a shop without a GM shows the next head to hire as its first button. Goal bar candidates include heads.
- Pacing sim: models taps (a tapping player in the newest shop), heads and GM; asserts Nonna at 150 pies in 4–6 min, ≤ 120 kitchen taps before Nonna, completion within ±10% of today (227 min) — retune head shares or the ×2 if not.

## 4. Whole pizza numbers
`pizzas(n)` (floor) and `pizzasLeft(n)` (ceil) with K/M above 1,000; every player-facing builder uses them; a test feeds fractional states to every builder and rejects `\d\.\d{3,}`.

## 5. What the scene shows (v4.8)
- **Remove the old tap UI:** the "0 / 12 queued" pill, "TAP TO BAKE!", "Kitchen full" tap pill; the HUD subtitle names the next station ("Tap the oven · 4 prepped").
- **Badge row** (critic spec): one badge per station on one back-wall band at y ≈ 372 pt (scene units via `P()`), centred on each station's x. 24 pt ring, 3 pt stroke, basil #4CAF50 fill (tomato #E5483A on the bottleneck), track #E9DCC3, cream #FFF8EA disc, 1.5 pt #4A2A1A outline. Batch count in an 11 pt pill under the ring (K-formatted). Ready-to-tap (manual): scale 1.0→1.12 at 1.2 Hz with a 14 pt hand. A head's portrait chip replaces the hand when the station is automated. A crowd-test budget: badge rects never hit heads, the shelf, the menu or the sign. Progress snapped to 1/24 and `Badge` memoised on `(step, n, tone)` (M36).
- **Departure pop:** 12 pt Fredoka white on #2E8B3E, 8 pt radius, 18 pt tall, 6 pt above the carrier, riding with them; ≤ 2 pops visible (extra cash merges into the newest number). Coin 14 pt #F6C343 with #B8860B rim, door → HUD cash in 0.55 s, ≤ 3 in flight, HUD cash bumps 1.08×. Walk-in pops over the register. Pops are keyed on departure id; each mount records the highest id seen (no burst after a pause or remount). Nothing stays mounted at opacity 0 (M38).
- **Hit-testing** (`scene/hit.ts`): station rects → on-screen polygons via `P()`; front-most wins (counter over oven); 44 pt minimum tested as rect × `fit.s`.
- **Rush:** a 0.2 s ring jump on every running badge.
- Dough and pass counts are passed to memoised `PrepBench` / a new `Pass` part, not through `furnitureDeps` (M35).

## 6. Event-driven people (v4.9)
- Failing D336 budget first (walk-ins vs the pickup driver at the counter), then the routes.
- Drivers wait at pickup spots; a driver departure sends the front driver counter → door → street along `COUNTER_LANE_Y`; a replacement arrives later. Walk-ins order at their own register spot ~34 pt left of the pickup and hold at `guestPauseX` outside if it's taken; **no walk-in loop while the walk-in share ≈ 0**, and a guest leaves after a maximum wait (codecritic #4). Crowd tests for sparse and burst departures.
- `alongTimed(path, seconds)`: constant speed `WALK_PT_S`; the out-walk's implied speed stays within 0.8–1.25× across all footprints; consecutive-frame speed ratio ≤ 1.15.

## 7. Animation polish (v5.1)
- Baker loads the peel, the oven mouth glows during a job, the pie slides onto the pass; cook speed follows prep progress.
- "+50% faster" in 13 pt basil rising 24 pt over 0.8 s from the badge row; "+1 driver" from the door.
- Walk cycle: **1.0 s cycle, 8 poses** (each pose held 2 frames at 15 fps). Allocation budget ≤ 800/frame on the sorted layer (hoist `walkStep`, reuse `items`, sort in place) measured before any 30 fps decision; if 30 fps ships, the whole sorted layer moves to it on one shared clock.

## 8. Tutorial (v5.2)
- `tutorial.ts` (pure), `tutorialStep` saved. Steps: 1 prep → 2 oven → 3 watch the timer (first bake ≤ 3 s) → 4 counter (success line: "Again! Prep, bake, serve.") → 5 halo on the HUD cash ("Every pizza out the door is money in the register!") → 6 at $ Ovens price: hand on the sidewalk Ovens button → 7 "See? The timer's shorter now." → 8 at $25: "Hire Marco, my head prep cook" (the first head) → done when Nonna takes over.
- Card 361×84 pt, cream #FFF4DC, 2 pt #5A2E1A outline, 16 pt radius, 56 pt Nonna portrait, 15 pt text; docks above the sidewalk row for scene targets and flips to the sky band for sidewalk/HUD targets. Taps off target do nothing in steps 1–4. `pickScene` waits during steps 1–5. v3 saves mid-Downtown (no GM) get the short version (1, 2, 4).

## 9. Splash and title card (v5.2)
- `components/logo.tsx` (SVG): slice + pepperoni crown + "SLICE EMPIRE" wordmark. Icon = slice + crown on HUD red (no text). Rendered to PNG by a script. Splash bg = HUD red exactly.
- `title-card.tsx`: 2.0 s on the first launch of the day, 1.2 s otherwise; logo drops in, pizza spins, Nonna waves; tap skips; hides the native splash in `onLayout`; `SceneOverlay`, the offline popup and `queueScene` wait until it's done.

## 10. Neighbourhood identity (v5.0, critic proposal accepted)
Shared rules: the "Rosa's · Name" plank, the ROSA'S case, OPEN sign, WELCOME mat, PIZZA blade sign, van and driver uniform stay identical; red #D9443A is the first stripe or the piping of every awning; INK outlines 1.1 / 0.9 pt; light from the upper left; tier-0 floors only (tiers 1–3 stay universal); signature props drawn at every decor tier; **layout geometry unchanged**; a crowd test that every new prop misses every route and seat rect.

| | Facade + awning | Wall + floor (tier 0) | Signature props | Staff accent | Sidewalk |
| --- | --- | --- | --- | --- | --- |
| Downtown | red brick #B85C38, scalloped red/cream | subway-tile band z 0–40 | "Est. 1962" Nonna photo, flag bunting | red kerchief | newspaper box #3F7FB0 |
| Suburbs | white clapboard #F7F3EA, straight red/mint awning | beadboard wainscot, light oak #E8CFA6 | crayon drawings, gumball machine | mint apron | picket stub + bicycle |
| Waterfront | blue planks #5E8FA8 + rope trim, navy/white scallop, red piping | shiplap #D6EEF8, teak deck | ship's wheel, lobster-trap shelf | navy cap, striped apron | bollard + rope |
| University | brick #9C3B2E + limestone quoins, purple/gold, red piping | wood panelling, herringbone | "π = pizza" board, bookshelf | gold kerchief | bike rack + "GO U.P.M.!" |
| Industrial | corrugated steel, flat orange/charcoal box awning, red piping | ductwork | time clock, flour pallet | hard-hat cap, hi-vis | barrel + cone |
| Uptown | green tile + brass caps, burgundy dome + gold, red piping | black/white marble | chandelier, brass coat stand | burgundy apron | topiaries + rope posts |

The screenshot script adds a Suburbs and a University interior shot.

## 11. The heads as cast (v4.8 names/portraits; story beats later)
Each head gets a name, a look (portrait variant) and a one-line hire bubble; `docs/story/CAST.md` lists them for the storyline (beats come with the Todd/interludes work, reviewed by the storycritic).
| Shop | Head Prep Cook | Head Baker | Head Cashier |
| --- | --- | --- | --- |
| Downtown | Marco | Lucia | Benny |
| Suburbs | Patty | Hank | Kayla |
| Waterfront | Finn | Gus | Coral |
| University | Raj | Mei | Tyler |
| Industrial | Stan | Ox | Rita |
| Uptown | Pierre | Margot | Sterling |

## 12. Build order (each step is one version, then critic + codecritic)
1. **v4.7 engine:** pipeline, departures, integer pizzas, heads + GM boost, batches, save v4, offline, store (`tickAt`), pacing sim. Interim scene: a tap on the shop taps `nextTap(line)`; the queued pill reads the line. Codecritic also reviews the backlog d25b801..HEAD.
2. **v4.8 stations UI:** hit-tested station taps, badge row, departure pops and coin with interpolation, old tap UI removed, head/GM cards + hire bubbles, CAST.md.
3. **v4.9 people:** D336 test first, event-driven drivers and walk-ins, `alongTimed`.
4. **v5.0 neighbourhoods:** §10.
5. **v5.1 animation:** §7.
6. **v5.2 tutorial + splash:** §8, §9; storycritic + audiocritic at low effort at the end.
