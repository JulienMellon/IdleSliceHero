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

## Current state — v5.12, round 60: ❌ NOT SATISFIED (2 bugs, 2 major + 4 retention majors open by plan, 6 minor)
v5.12 = economy retune to ~5 days + round-59 fixes. Fixed in pixels: G88, G89, G90, D414, D415, D416, D418, D420, D421. Being fixed in v5.13.

| ID | Severity | Where / shot | Note | Concrete fix |
|---|---|---|---|---|
| G91 | bug | 34, 35, 36, 41, 42, 14 | The "+$" pop covers the end of the waiting pill ("buy F") | Add the pop rect to `clearPillX`'s avoid (ladder.ts:352) or spawn the pop 22 pt above the pill |
| G92 | bug | 07 | "Capped at 2h 0m (away 2h 0m)" on an uncapped return (game.ts:884) | Show only when away exceeds the cap by ≥ 60 s |
| D417 | major | 39/44/42/40 | Ovens get narrower as they level (50 → 32 → 50 → 32 pt); the Lv 3 brick dome is still the best-looking oven | Fixed 52 pt oven bay per footprint, bench grows leftward; `MIN_OVEN_W` 30 → 44; brick arch/dome on the top deck at every tier |
| D433 | major | 20 | 2 h offline cap < the 4 h check-in the economy targets: every return says "Capped" | Cap ≥ check-in interval (4 h, extendable) and refit; show a full meter instead of "Capped" |
| D423–D426 | major | retention | Open by plan (v5.13–v5.15): mid-session taps, session-end reason to return, gift-like return, floating bonus / special orders | See HANDOFF plan |
| D434 | note | 05b, 21, 14 | Level prices tiny vs build costs (Waterfront build $200M, Lv 1 $330); Uptown reversed (goal "$20.7B / $400T") | Refit with costMult in proportion to order value; split far goals into steps |
| D435 | note | 37 | PREP $3.55K next to HIRE A MANAGER $100M; goal bar at 0% | Show "about 3 h at current rate" or an intermediate goal |
| D419 | minor | 37, 05b | Affordable Waterfront cards still washed out | 2 pt #3B1F14 outline, full-opacity label |
| D428 | minor | 41, 13, 14 | Patio inside the wall reads as an indoor table | Plank deck, step-down, low rail; fixtures 45/46 at footprint 2 |
| D429 | minor | 42 | Milestone: no confetti in frame, badge hides the cook, pill under the badge | Hide the pill 1.5 s, badge 30 pt above the hat, capture at 0.4 s |
| D430 | minor | 40 | Queue drivers overlap ~40%, feet on the sill | 26 pt spacing, ±3 pt height, feet 6 pt inside |
| D431 | minor | 43, 46 | Diner queue + driver + seated diner clump | Drivers door side (x ≥ 250), diners left |
| D432 | minor | 41, 07, 20, 34 | Orphan picket fence; scooter clips the sandwich board | Remove / separate |
| D422 | note | 41, 38, 05b | Fixtures show impossible states | Regenerate fixtures from the pacing sim |
| D427 | minor | 13 | Endgame goal only says "hire Pierre" | v5.15 |

**Next IDs:** G93, D436.
