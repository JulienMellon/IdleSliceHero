# Critic Log

The visual **critic** (`.claude/agents/critic.md`) reviews each build's iPhone-size screenshots against App Store screenshots of the top idle games. The build team then ships a new version that addresses every note.

- **SATISFIED** requires 0 bugs, 0 [major] notes and ≤ 3 [minor] notes. A build that fails to load, or has a blocking bug, can never pass.
- **Screenshots:** `screenshots/<version>/` (393×852 @2×). Regenerate with `npx expo export --platform web && python3 scripts/screenshots.py <version>`. `report.json` must show `"errors": []`.
- **Full history:** rounds 1–50 (v0.1 → v5.2) are kept verbatim in [`docs/logs/CRITICLOG-archive.md`](docs/logs/CRITICLOG-archive.md). This file holds only the current state.
- **Owner's standing direction** (the storefront cutaway, sidewalk buttons, tap-only drawer, a WELCOME mat, visible decor tiers, the visual-polish and character bar) lives in the critic brief and holds in every build.

**Next IDs:** bugs **G88**, design notes **D414**.

---

## Lessons from rounds 15–50 (read before fixing crowd/geometry notes)
- **Overlap fixes kept moving the overlap instead of removing it** (rounds 30–34: the counter lane moved onto the bakers, the outside pause moved onto the mat, the back row moved onto the bakers' feet). Fix crowd notes in `scene/cast.ts`, `scene/timelines.ts` or `scene/layout.ts`. Then prove the fix with a budget in `scene/__tests__/crowd.test.ts` before taking screenshots, and make sure the test could actually fail on the old code.
- **Verify in pixels.** The critic marks a fix open if the screenshot doesn't show it, whatever this log says.
- **Don't remove owner-required elements** while fixing something else. The WELCOME mat was removed once by mistake (G54).
- **Moving one figure moves the overlap onto another** (rounds 47–50, the walk-in vs. driver at the counter): run the whole crowd suite after every route/spot change, not only the budget you are fixing.

## Current state — v5.11, round 59: ❌ NOT SATISFIED (3 bugs, 7 major, 5 minor, 2 notes)
First round under the award-winning-games standard (critic brief, 2026-11-11) with the new FUN AND RETENTION section. All eleven round-58 notes (G86, G87, D405–D413) are fixed in pixels; `report.json` clean. Nothing below is built yet.

| ID | Severity | Where / shot | Note | Concrete fix |
|---|---|---|---|---|
| G88 | bug | 04, 12 | Goal-bar label breaks at the fill edge ("ire Marco"; "$15|.4M" in two colours) | Snap the cream/ink seam to a word boundary; never split the amount |
| G89 | bug | 35 | Single-cap amber button reads "DRIVERS MAX / Expan…" | "Expand $500" at 13 pt, or move MAX to the badge |
| G90 | bug | 36, 44, 40 | Driver-queue figures don't track the count (×29 → 1, ×9 → 3, ×37 → 2) | figures = min(4, ceil(n/10)), stable per shop |
| D414 | major | 46, 43 | The diner queue stands on the patio, the planter, the mailbox and the car; umbrellas straddle the wall pillar | Single file along the door lane (x ≥ 200), max 4 + "+N"; patio fully outside or inside the wall line; crowd budget |
| D415 | major | 42 | Milestone moment is a 40 pt disc; confetti covers "Lv 25"; pills stack over the hood and HUD | 72 pt gold badge centred on the station, confetti behind text, chips dimmed 1.2 s, line under the badge |
| D416 | major | 39, 43, 44, 46 | Driver queue = three identical moustached figures overlapping by half | Varied driver cast, 22 pt spacing, staggered depth, one on a phone |
| D417 | major | 39 → 44 → 40 | The oven ladder doesn't read as better (Lv 40 = dark capsules, no fire) | Fire window on every tier, total width grows each step, brass trim + taller hood at 25/50 |
| D423 | major | retention | No goal after the story (sim: 7 sessions, 1 day); a day-2 player has nothing new in 30 s | Longer economy / gated scenes, then endless "Nonna's orders" with a visible bar |
| D424 | major | 09, 13, 20 | Session end shows no timer, filling bar or chest; the offline cap is invisible until hit | HUD "Away oven" meter ("full in 3 h 12 m"); "Next scene at $X" teaser |
| D425 | major | 12 | With a GM, the only tap is rush, which often says "need drivers" | Floating tip jar / pizza box every 45–90 s (30–60 s of income); special orders with a 60 s timer |
| D418 | minor | 05b6 | The "Lv 2" chip rises over the Ovens count chip | Start at the furniture, stop below the chip row |
| D419 | minor | 37, 05b | Station cards fade to ~60% under the stacked hire row though buyable | Full opacity, 4 pt shorter |
| D420 | minor | 42, 39 | "×11 waiting" pill 3 pt from the screen edge | 12 pt margin |
| D426 | minor | 07, 20 | The return popup is a static table and a button | Count-up over 0.8 s, coin burst, van unloading, one line of news |
| D427 | minor | 03, 04 | First 60 s: only $5 and no celebration before the $25 hire | First oven buy by 15 s with the confetti badge; a Lv 10 milestone |
| D421 | note | 44 | "×N waiting" doesn't say what waits or what to buy | "29 drivers idle · buy Ovens", tappable to the bottleneck |
| D422 | note | 39–46 | Fixtures show the goal bar "tap!" at $6.00K with $625K cash | Confirm the ready goal is claimed in live play |

**Next IDs:** G91, D428.
