# Critic Log

The visual **critic** (`.claude/agents/critic.md`) reviews each build's iPhone-size screenshots against App Store screenshots of the top idle games. The build team then ships a new version that addresses every note.

- **SATISFIED** requires 0 bugs, 0 [major] notes and ≤ 3 [minor] notes. A build that fails to load, or has a blocking bug, can never pass.
- **Screenshots:** `screenshots/<version>/` (393×852 @2×). Regenerate with `npx expo export --platform web && python3 scripts/screenshots.py <version>`. `report.json` must show `"errors": []`.
- **Full history:** rounds 1–50 (v0.1 → v5.2) are kept verbatim in [`docs/logs/CRITICLOG-archive.md`](docs/logs/CRITICLOG-archive.md). This file holds only the current state.
- **Owner's standing direction** (the storefront cutaway, sidewalk buttons, tap-only drawer, a WELCOME mat, visible decor tiers, the visual-polish and character bar) lives in the critic brief and holds in every build.

**Next IDs:** bugs **G86**, design notes **D404**.

---

## Lessons from rounds 15–50 (read before fixing crowd/geometry notes)
- **Overlap fixes kept moving the overlap instead of removing it** (rounds 30–34: the counter lane moved onto the bakers, the outside pause moved onto the mat, the back row moved onto the bakers' feet). Fix crowd notes in `scene/cast.ts`, `scene/timelines.ts` or `scene/layout.ts`. Then prove the fix with a budget in `scene/__tests__/crowd.test.ts` before taking screenshots, and make sure the test could actually fail on the old code.
- **Verify in pixels.** The critic marks a fix open if the screenshot doesn't show it, whatever this log says.
- **Don't remove owner-required elements** while fixing something else. The WELCOME mat was removed once by mistake (G54).
- **Moving one figure moves the overlap onto another** (rounds 47–50, the walk-in vs. driver at the counter): run the whole crowd suite after every route/spot change, not only the budget you are fixing.

## Current state — v5.8, round 56: ❌ NOT SATISFIED (0 bugs, 0 major, 3 minor; D402 is visible in the first minute)
Fixed: D397, D398 (accepted with the SE/wide-web treetop overlap), D399, D400, D401, D394, D359 (follow-up D402), D297 (caramel fill accepted unless Julien wants yellow back), D304, D305. Codecritic skipped this build (owner rule); it reviews 0d6d3a4..HEAD on v5.9.

| ID | Severity | Where / shot | Note | Concrete fix |
|---|---|---|---|---|
| D402 | minor | 03, 13 sidewalk cards | Unaffordable cards replace the station name with "need $X": a new player sees four cards told apart only by a 10 pt icon; at $0 the shortfall equals the price ("need $6" over "$6") while the tutorial says "tap the prep table" | Keep the name on the top line; "need $X" as a 9 pt muted line under the price only when cash > 0; otherwise no need line |
| D403 | minor | 02 | Nonna's clasp: two tall pointed upright thumb lobes read as a "V" sign or tongs | Thumbs ~60% height, rounded tips, one crossed over the other |
| Pier 9 chip | minor | 21 | "Pier 9 savings" reads like a discount or reward, not a warning | Wording that reads as a cost (e.g. "uses Pier 9 bid cash") in #b3261e |

**Next IDs:** G86, D404.
