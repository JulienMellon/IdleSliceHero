# Critic Log

The visual **critic** (`.claude/agents/critic.md`) reviews each build's iPhone-size screenshots against App Store screenshots of the top idle games. The build team then ships a new version that addresses every note.

- **SATISFIED** requires 0 bugs, 0 [major] notes and ≤ 3 [minor] notes. A build that fails to load, or has a blocking bug, can never pass.
- **Screenshots:** `screenshots/<version>/` (393×852 @2×). Regenerate with `npx expo export --platform web && python3 scripts/screenshots.py <version>`. `report.json` must show `"errors": []`.
- **Full history:** rounds 1–43 (v0.1 → v4.2) are kept verbatim in [`docs/logs/CRITICLOG-archive.md`](docs/logs/CRITICLOG-archive.md). This file holds only the current state.
- **Owner's standing direction** (the storefront cutaway, sidewalk buttons, tap-only drawer, a WELCOME mat, visible decor tiers, the visual-polish and character bar) lives in the critic brief and holds in every build.

**Next IDs:** bugs **G76**, design notes **D338**.

---

## Lessons from rounds 15–34 (read before fixing crowd/geometry notes)
- **Overlap fixes kept moving the overlap instead of removing it** (rounds 30–34: the counter lane moved onto the bakers, the outside pause moved onto the mat, the back row moved onto the bakers' feet). Fix crowd notes in `scene/cast.ts`, `scene/timelines.ts` or `scene/layout.ts`. Then prove the fix with a budget in `scene/__tests__/crowd.test.ts` before taking screenshots, and make sure the test could actually fail on the old code.
- **Verify in pixels.** The critic marks a fix open if the screenshot doesn't show it, whatever this log says.
- **Don't remove owner-required elements** while fixing something else. The WELCOME mat was removed once by mistake (G54).

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
