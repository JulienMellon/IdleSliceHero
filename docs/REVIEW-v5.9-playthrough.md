# Playthrough Review: Slice Empire v5.9 (2026-10-31)

Full play-through and end-to-end review requested by Julien. It covers pacing, difficulty, the story text, whether there is always something to tap, upgrade feedback, how play changes across neighbourhoods, and fun. Proposals marked **[D#]** are defaults for Julien to correct.

## How I played
- **A real play from a fresh install.** I used the v5.9 web build (commit 2e7c137) in headless Chromium at iPhone size, with a fake clock. A bot played the way an attentive player would: it followed Nonna's coach, tapped the station the HUD named, pressed lit sidewalk buttons and the goal bar, and opened the drawer for "Buy both". This covered about 17 game minutes, from the tutorial into Waterfront, and every cut-scene panel was screenshotted. A second run tapped constantly (every 0.5 s).
- **The whole city in the engine.** I ran the pacing-sim's greedy player through all 24 scenes. I added a log of how long the player waits between purchases, saves dumped at every scene, and a "check-in" player who plays a few minutes, leaves, and collects offline earnings.
- **Late game on screen.** I loaded the sim's saves into the web build to screenshot the main screen and the drawer at University, Industrial, Uptown and the end of the game. I also rendered Downtown at six upgrade stages to see what changes visually.
- **All 24 scenes, line by line,** checked for clarity, grammar and punctuation.
- **Not covered:** touch feel, audio, performance on a real phone, the reward screens beyond a glance.

## The ten things that matter most
1. **The whole city takes about 3 hours of play, or about 1 day for a casual player.** A player who checks in for 5 minutes every 4 hours finishes all 24 scenes in **7 sessions (1.0 day)**. Checking in every 8 hours takes 2 days. Shorter offline earnings barely help: a 1 h cap at 50% only stretches it to 1.5 days. The economy itself is short.
2. **Hiring the manager disappears at the moment it matters (bug).** Once a shop has all three heads, the General Manager hire (×2 income, and the only way a shop earns while you're away) shows only in the "All" drawer. The goal bar hides it while you're on that shop, and the sidewalk hire button goes away. In the real play, Waterfront ran without a manager from 8.6 to 16.9 min while the player held $36K–$515K (the manager costs $30K).
3. **Long stretches with nothing lit to press.** In the real play, from 9.5 to 16.9 min the player had cash and nothing green to tap. The sidewalk showed **MAX MAX MAX** (prep, ovens and counter capped at Lv 25), but they aren't maxed. Expand ($7.5K) would raise the cap, and it lives only in the drawer. The goal bar pointed at University's $1.8M.
4. **Rush tapping is the best "something to tap" mechanic, and it's invisible.** Tapping a shop that has a manager speeds up its kitchen. At 2 taps/s it sells **+44%**, at 4 taps/s **+85%** (measured on Waterfront, University and Uptown saves). Nothing on screen says so, and every tap also holds back the story (item 6).
5. **Three systems stop mattering early:**
   - **Seating / walk-ins** are 0% of sales from about 15 min on, because drivers take every pie first. This also makes Dale's perk ("walk-ins pay 85%") worth $0.
   - **Fleet** upgrades add $0 from Waterfront on: drivers already carry 1.6–5.9× what the kitchen makes.
   - **Drones**, the payoff of Priya's whole arc, add **$0** and the sim never buys them. Genevieve's front-page line "Lately, a drone." is false for most players.
6. **Constant tapping can stop the story.** Refused taps (e.g. on a station a head runs) still reset the 1.5 s scene gate. The bot that tapped every 0.5 s saw no scene after the opening for 14 minutes. Nonna never took over, Suburbs stayed locked, and cash piled up to $7.7K.
7. **The goal bar lies once (bug).** It shows "▶ Build a pizzeria in Suburbs — tap!" while Suburbs is locked behind Nonna's takeover. The tap does nothing.
8. **Every neighbourhood plays the same.** Each shop is the previous one scaled up: price ×3.2, costs ×3, the same five upgrade tracks, the same three heads. The manual "chore" phase in a new shop lasts **0.3–1.4 minutes** (Uptown 3.6) before all three heads are hired, because heads are cheap compared with the cash you bring.
9. **Upgrades are plentiful, but few of them show.** There are about 650 purchases per shop, but almost all are +1 on one of five tracks. Most level-ups change nothing on screen: cooks stop being added at Lv 31, cashiers at Lv 16, and ovens at Lv 9 in the first shop size. Golden ovens and the Flagship are **never reached** before the story ends.
10. **The story reads well, but it is cut off from the game.** The scenes are short, funny and clear. But Nonna's tutorial line describes the old mechanic, MegaSlice's threats never touch the gameplay, the station heads never appear in the story, and the ending promises Boston with nothing behind it.

## 1. Pacing and difficulty
**A greedy player playing straight through (sim, v5.9 tuning):**

| Neighbourhood | Phase length | Purchases | Waits ≥ 60 s | Longest wait |
| --- | --- | --- | --- | --- |
| Downtown | 5.0 min | 43 | 1.6 min | 98 s |
| Suburbs | 8.9 min | 272 | 0 | 25 s |
| Waterfront | 38.2 min | 462 | 14.0 min | 163 s |
| University | 29.4 min | 291 | 15.3 min | 205 s |
| Industrial | 39.0 min | 296 | 24.5 min | 645 s |
| Uptown | 64.4 min | 282 | 43.2 min | 215 s |

- **The curve shape is right:** easy, then slower, with Uptown about 2/3 waiting. **The total is far too short for an idle game.** The first 10 scenes play in the first 17 minutes.
- **Offline earnings are not the main lever.** Here is the check-in player (5 min sessions every 4 h) under different offline rules:

  | Offline rule | Days to finish the city |
  | --- | --- |
  | 4 h cap, full rate (today) | 1.0 |
  | 2 h cap, 50% rate | 1.2 |
  | 1 h cap, 50% rate | 1.5 |

  Growth compounds, so the economy finishes in a handful of sessions whatever the offline rule.
- **Naive retuning makes a wall.** Cutting later order values (e.g. 3/9/24/60/150/360) stretches play to 631 min, but 441 of those minutes sit in Industrial, because its $30M build cost doesn't move. Retuning has to re-derive build costs and order values together, against a target.
- **[D1] Target: City 1 in ~5 days for a player who checks in 4×/day.** Unlocks on roughly day 0 (Downtown, Suburbs), day 1 (Waterfront), day 2 (University), day 3 (Industrial), day 4 (Uptown), with the finale around day 5. Offline: 2 h cap at full rate, with upgrades that raise the cap (2 → 4 → 8 h). That gives returning a goal rather than just a cap. The new mechanics in §6 add play time without pure waiting. I'd retune with the sim's check-in mode against that target after §6's first mechanic exists, because mechanics change income.

## 2. "Always somewhere to tap"
What the real play looked like, minute by minute:
- **0–2.7 min:** busy and good. The tutorial runs prep → oven → counter, and Marco, Lucia and Benny are hired by ~2.7 min.
- **2.7–9.5 min:** mostly buttons. The Suburbs and Waterfront chores last about a minute each before heads are bought.
- **9.5–16.9 min:** nothing lit, as in item 3.
- **The sim agrees:** the median gap between purchases is 0–2 s, but only because the greedy player buys the "Buy both" bundles and expansions from the drawer. A player who taps only what is lit on the main screen waits much longer.

**Fixes (cheap, in the current UI):**
- Show **Expand** on the sidewalk in place of a capped station, e.g. "EXPAND · $7.5K · Lv cap 50". Never show MAX while an expansion exists.
- Put **"Buy both"** on the sidewalk when stations are tied (today it's drawer-only), so tied stations don't make every button grey.
- **Fix the hidden manager hire (bug B1)** so the GM stays offered on the sidewalk until it's hired.
- **Make rush visible:** a "Tap to rush!" hint on shops with a manager, a combo meter, and a "+40%" readout. Stop counting rush and refused taps against the story gate (B3).

## 3. Upgrades and visual feedback
**What changes on screen today (Downtown at six stages):**
- **Visible changes:** oven count and material (5 grades), floor, signage (up to the rooftop pizza), plants, wall decor, shop width (5 footprints), more cooks (up to 3) and cashiers (up to 2), tables, and the parked vehicle.
- **The problem is cadence.** Prep shows something new at Lv 16, 25, 31, 50 and 100 (5 times in 125 levels). Counter changes twice. Drivers never change: ×90 drivers looks like ×1, because only 2–4 parking spots exist. Seating stops at the footprint's table limit.

**Proposal [D2]: a visible step every 10 levels per station.**

| Station | Lv 10 | 20 | 30 | 40 | 60 | 80 | 100 | 120 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Prep | 2nd rolling pin | flour sacks stack | 3rd cook (exists ~31) | dough sheeter | stand mixer | topping rail, 6 bins | gold hats (exists) | conveyor |
| Counter | box stack | 2nd cashier (exists 16) | pizza warmer shelf | ticket rail | order screen | 2nd register | neon ORDER HERE | conveyor pass |
| Drivers | dispatch board, one pin per driver | uniform jackets | 2nd parking row | branded vehicle wrap | radio headsets | "DRIVER OF THE MONTH" photo | gold helmets | — |

- **Per-buy feedback:** the station bounces 0.6 s, a "Lv 26" chip rises, and the badge ring visibly speeds up. Today there's the "+50% faster" flash and the button burst.
- **Milestones (Lv 25/50/100, output ×2)** get a 1.5 s moment: a new item walks or slides in, confetti in the shop colour, and a one-line bubble from that station's head ("Marco: Double batch, capo!").
- **The top tiers need to be reachable.** Golden ovens ($12M × shop multiplier) and the Flagship are never bought before the finale. Either lower them, or make them the post-story goals with a big visual payoff (§7).

**"Not enough upgrades?"** The count is fine (≈650 per shop). The *kinds* are too few, and two of the five tracks are dead after 15 minutes. The fix is variety (§6) and making seating and fleet matter again:
- **[D3] Walk-ins become their own demand stream.** They add sales on top of drivers, capped by seats, so Seating, Dale's perk and the dining room all count.
- **[D4] Fleet speed matters through distance** (University zones, §6), which gives drones a job.

## 4. Story and cut-scenes
**Overall:** the scenes are easy to follow and the jokes land (the Lobster Escape, "Sleep, year zero", pineapple). Most bubbles are under 90 characters with 2–3 per panel, and the four-beat shape per character is clear.

**What to fix:**

| Scene · panel | Now | Proposed |
| --- | --- | --- |
| downtown-1 P4 | "Fine. First you bake. Tap the kitchen, one batch each tap. Tap, tap, tap!" (the old mechanic) | "Fine. First you bake. Prep, oven, counter. Tap, tap, tap!" |
| downtown-1 P4 | "Then hire workers. Drivers to deliver, more cooks for the kitchen. Capisce?" | "Then hire help. Marco, Lucia, Benny: good kids. Capisce?" (brings the heads into the story) |
| downtown-4 P1 | "150 deliveries." (numeral opens the sentence) | "A hundred and fifty deliveries." |
| suburbs-2 P1, P3; suburbs-4 P2 | "6-0", "6-1", "2-2" (hyphens) | "6–0", "6–1", "2–2" (en dashes) |
| suburbs-2 P3 | "We lost 6-1 but that is the BEST loss…" | "We lost 6–1, but that's the BEST loss…" |
| university-4 P1 | "Also you gave me a slice when I had only buttons." | "Also, you gave me a slice when all I had was buttons." |
| industrial-4 P4 | "Industrial's yours. And so's my Thursday." (unclear) | "Industrial's yours. Heck, I might even like Thursdays now." |
| uptown-1 P2 | "*one dainty bite*" inside a speech bubble | Move to a caption: "She takes one dainty bite." |
| uptown-4 P1 | "…It is on a bike. Lately, a drone." | Keep only if drones become worth buying (D4); otherwise "…It is on a bike." |
| uptown-4 P3–P4 | Boston, "Next stop: the whole country", then nothing | Add a "Franchise to Boston: coming soon" end card, or hold the line until prestige ships |
| All scenes | Straight quotes and "..." (20×); the UI uses ’ and … | Use curly quotes and … everywhere |
| UI, drawer | "Hire a Uptown manager", "Hire a Industrial manager" | "Hire an Uptown manager": pick a/an, or use "Hire the Uptown manager" |

**Story design notes:**
- **The "shop" backdrop is always Rosa's Downtown interior** (brick oven, EST. 1974), even for Marisol's "your first customer" in Waterfront. Give each neighbourhood's shop panels its v5.0 interior.
- **Nonna's voice drifts** between "Is small. Is a start." and fluent English within one scene. Keep one light, consistent accent. Optional, but it reads better.
- **MegaSlice never touches the game.** Beat 3 is a threat with no consequence. Making it play (§6, "Rival opens") gives every finale a win.
- **The heads are named and drawn but silent.** Give each one line in their shop's beat 2 or 3. That costs no new art.
- **Perk value:** Dale's perk is worth $0 (walk-ins) and Priya's is ≈$0 (driver discount, drivers already oversupplied). The fixes in D3/D4 rescue both. Otherwise swap in perks that bite, e.g. Dale "Suburbs prep +25%".

## 5. Bugs found
| ID | What | Where |
| --- | --- | --- |
| B1 | The GM hire is hidden from the goal bar and the sidewalk once the three heads are hired, while you view that shop | `app/index.tsx` (`idleShopHere` filter), `sidewalk-row.tsx` (`idleShop = !runsItself`) |
| B2 | The goal bar shows "Build Suburbs — tap!" while it is locked behind Nonna, and the tap does nothing | `app/index.tsx`: the build candidate ignores `buildLock` |
| B3 | Refused and automated-station taps reset the story gate; constant tapping blocks all scenes, including Nonna's takeover | `store/game-store.ts` `tapStation` sets `lastKitchenTap` on refusal; `tapShop` (rush) too |
| B4 | The sidewalk says "MAX" at the Lv 25/50… cap while Expand exists (drawer only) | `sidewalk-model.ts` (`lock ? 'MAX'`) |
| B5 | "Hire a Uptown/Industrial manager" | `app/index.tsx:325` |

## 6. A new layer per neighbourhood
Each layer uses a system that already exists (seating, fleet, decor, oven grades, the MegaSlice beat) and adds one new thing to watch. Numbers are starting points to correct.

| Neighbourhood | Layer | How it plays | What it fixes |
| --- | --- | --- | --- |
| **Downtown** | The line (exists) + **visible rush** | Tap a shop with a manager to rush, with a combo meter at 2+ taps/s; rush doesn't block scenes | Gives every shop something to tap |
| **Suburbs** | **Game Day** (Dale) | After each Mudhens game (every ~8 min of play) a 45 s rush of families: walk-in demand ×6, but only into free seats. A "Game Day" banner and a whistle | Seating and Dale's perk matter (needs D3) |
| **Waterfront** | **Boats and the warming rack** (Marisol) | A boat docks every ~3 min (visible in the harbour): 30 s of ×3 demand. New upgrade, the warming rack (20/40/80/160 pies), stockpiles between boats. The Pier 9 bid becomes a live auction: MegaSlice raises $100K every 2 min while it's open | Planning for bursts; the bid gets tension |
| **University** | **Menu and campus zones** (Priya's app) | Three recipes: Cheese (×1.0), Pepperoni (×1.4 price, +30% prep), Garlic Knots (×0.6 price, ½ bake time). Pick the mix. Three zones (Dorms, Library, Stadium) at distances 1/2/3; deliveries take longer to far zones, so the fleet matters; drones ignore distance | Fleet and drones matter (D4); a first real choice |
| **Industrial** | **Shifts and breakdowns** (Big Sal) | Demand follows three shifts on a 20-min cycle; night shift pays ×2 (Big Sal's offline perk fits). Every ~5 min one oven jams: tap Ox's wrench to fix it, or the Head Baker fixes it in 30 s | A recurring reason to tap and a reason to return |
| **Uptown** | **Stars** (Genevieve) | Uptown pays by star rating (1–5): oven grade + decor tiers + a new **Ingredients** track (Store-brand → Imported → Farm → Truffle). Below 3★ pays 50%; 5★ pays ×2. A critic visit every ~15 min checks it: hit the target for a bonus and a star on the sign | Decor and grades matter; a visible quality goal |
| **Every neighbourhood, beat 3** | **The rival opens** | When beat 3 plays, a MegaSlice shop opens across the street and takes 20% of that shop's sales. Beat 4's trigger becomes a 5-min challenge ("Outsell the Grand Opening: 2,000 pies in 5 minutes"); winning closes the rival | The story touches the game; finales feel won |

## 7. More fun
1. **Floating bonuses:** a golden pizza drifts across the sky every ~2 min; tap it for 2 minutes of income. REWARDS D8 dropped "tap 3 floating bonuses" because none existed.
2. **Special orders from the cast:** 2–3 cards at a time, e.g. Dale: "40 pies for the team in 2 min" → 10 min of income + 5 diamonds. They come from characters you've met, so the story keeps showing up between scenes.
3. **Head personalities:** heads react in bubbles (milestones, rush combos, jams) and level up with their station. Pick a "Head of the Week" for the daily tasks.
4. **Recipe cards to collect:** 24 cards dropped by milestones and finales, kept in the Scrapbook; each gives +1% in one shop.
5. **Shop mastery stars:** three per shop (all heads, Flagship, Golden ovens). Stars unlock the cosmetics REWARDS already plans.
6. **Post-story goals until franchising ships:** a "Coming soon: Boston" card, then Victor's weekly counter-attack event (MegaSlice targets one shop; defend it with a rush challenge).

## 8. Suggested order of work
1. **Polish build:** B1–B5 plus the story text table (small; the codecritic skip rule applies).
2. **Economy:** walk-ins as their own demand (D3); Expand and "Buy both" on the sidewalk; visible rush.
3. **Visual ladder (D2)** and milestone moments.
4. **One neighbourhood layer per build:** Suburbs Game Day first, then Waterfront, University (with D4), Industrial, Uptown, then the beat-3 rival.
5. **Retune length** to D1 with the sim's check-in mode.

## Decisions for Julien (defaults; correct any)
- **D1:** City 1 takes ~5 days at 4 check-ins/day; 2 h offline cap with upgrades to 4/8 h.
- **D2:** A visible change every 10 levels per station, plus milestone moments.
- **D3:** Walk-ins become their own demand stream, capped by seats.
- **D4:** Fleet matters through University's zones, and drones skip distance.
- **D5:** Rush is shown on screen and stops holding back the story.
- **D6:** The first neighbourhood layer is Suburbs Game Day.

## Confidence and what to re-verify first
- **Solid (measured in the sim or read from code):** the 1.0-day finish for a 5 min / 4 h check-in player, walk-ins at 0% and fleet/drone gain of $0, the rush numbers (+44% at 2 taps/s, +85% at 4), the Industrial build-cost wall when order values are cut, the sidewalk showing MAX at the level cap while Expand exists, and the story text findings.
- **Inferred, check before fixing:**
  - **B1 timing:** the Waterfront no-manager window (8.6 to 16.9 min) comes from the bot's purchase log, not from reading game state. Confirm in the UI that the manager hire is absent from the sidewalk and goal bar once all three heads are hired.
  - **B3:** the stuck run (no scene for 14 min while tapping every 0.5 s) is a likely cause, not an isolated one. Rerun with `lastKitchenTap` not set on refused/rush taps and see whether scenes resume.
  - **B2** was seen once in the bot's goal text; confirm that the tap does nothing while Suburbs is locked.
  - **Drones:** they add $0 because drivers already outrun the kitchen, not because drones are weak. D4 (distance zones) is the proposed fix.
- **Not covered:** touch feel, audio, performance on a real phone, the reward screens beyond a glance.

## Tools (in `scripts/review/`)
Run from the repo root. Saves are written to `saves/` (git-ignore it or delete after use).
- `npx tsx scripts/review/sim2.ts continuous`: per-neighbourhood purchase cadence, and dumps a save at every scene to `saves/at-<scene>.json` plus `saves/end.json`. `npx tsx scripts/review/sim2.ts checkin` is the check-in player; env `CAP` (offline cap s), `EFF` (offline rate), `OV` / `BC` (comma lists of six order values / build costs) override tuning.
- `facts.ts` (walk-in share, driver oversupply, fleet gain) and `rush.ts` (sales by taps/s) read those saves, so run `sim2.ts continuous` first.
- `play.py`: UI-driven play from a fresh install with a fake clock; screenshots each cut-scene panel. `visual.py <neighbourhood>`: one shop at six upgrade stages. `seeded.py <save names>`: main screen and drawer from a dumped save. The last two need `dist/`.
