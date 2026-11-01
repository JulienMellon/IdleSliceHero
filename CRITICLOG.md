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

## Current state — v5.10, round 58: ❌ NOT SATISFIED (2 bugs, 4 major, 3 minor, 2 notes)
The v5.10 step acts on the v5.9 playthrough review (`docs/PLAN-v5.10-playthrough.md`). Fixed: D404, plus B1 (37), the B2 goal bar (38), B4 (34/35) and the story typography, all checked in pixels. Being fixed in v5.11.

| ID | Severity | Where / shot | Note | Concrete fix |
|---|---|---|---|---|
| G86 | bug | 12, 09–13 | "Tap to rush!" on every GM shop even when demand limits; taps give "+0%" | Hint only with ≥ 10% headroom; "RUSH ×N · need drivers" at 0 |
| G87 | bug | 38 | The locked Suburbs tab looks buildable ("+ Suburbs · Build $450") | Dashed locked style with the Nonna countdown wording |
| D405 | major | 35 | The floating Buy-both pill covers the WELCOME mat and sidewalk props | Merge the tied cards into one wide card in the row |
| D406 | major | 36, 12, all GM shops | The rush pill is effectively always shown and covers the MENU board | 3 s per visit, then every 60 s; under the oven chip, ≤ 120 pt, clamped off the menu |
| D407 | major | 34 | Four identical EXPAND cards; station names lost | One wide "EXPAND to <footprint>" card when ≥ 2 are capped; amber Expand button when one is |
| D408 | major | 37 | A sidewalk walk-in cut off at the chest by the stacked hire row | Keep sidewalk figures above the tallest row |
| D409 | minor | 05b, 14, 15 | HUD subtitle cut off with an ellipsis | "$1.27M/s citywide"; a shorter tap prompt |
| D410 | minor | 34, 10, 11 | The walk-in pop covers a face | Anchor it to the register, ~28 pt higher |
| D411 | minor | 07, 37 | "..." instead of "…" in the UI | "…" everywhere |
| D412 | note | 35 | "one alone adds $0/s" hides the payoff | "Tied: buy both · $35 · +$X/s" |
| D413 | note | 16 vs 35 | The drawer says Locked where the sidewalk sells EXPAND | Drawer card buys Expand |

**Next IDs:** G88, D414.
