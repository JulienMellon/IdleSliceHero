# Critic Log

The visual **critic** (`.claude/agents/critic.md`) reviews each build's iPhone-size screenshots against App Store screenshots of the top idle games. The build team then ships a new version that addresses every note.

- **SATISFIED** requires 0 bugs, 0 [major] notes and ≤ 3 [minor] notes. A build that fails to load, or has a blocking bug, can never pass.
- **Screenshots:** `screenshots/<version>/` (393×852 @2×). Regenerate with `npx expo export --platform web && python3 scripts/screenshots.py <version>`. `report.json` must show `"errors": []`.
- **Full history:** rounds 1–50 (v0.1 → v5.2) are kept verbatim in [`docs/logs/CRITICLOG-archive.md`](docs/logs/CRITICLOG-archive.md). This file holds only the current state.
- **Owner's standing direction** (the storefront cutaway, sidewalk buttons, tap-only drawer, a WELCOME mat, visible decor tiers, the visual-polish and character bar) lives in the critic brief and holds in every build.

**Next IDs:** bugs **G84**, design notes **D384**.

---

## Lessons from rounds 15–50 (read before fixing crowd/geometry notes)
- **Overlap fixes kept moving the overlap instead of removing it** (rounds 30–34: the counter lane moved onto the bakers, the outside pause moved onto the mat, the back row moved onto the bakers' feet). Fix crowd notes in `scene/cast.ts`, `scene/timelines.ts` or `scene/layout.ts`. Then prove the fix with a budget in `scene/__tests__/crowd.test.ts` before taking screenshots, and make sure the test could actually fail on the old code.
- **Verify in pixels.** The critic marks a fix open if the screenshot doesn't show it, whatever this log says.
- **Don't remove owner-required elements** while fixing something else. The WELCOME mat was removed once by mistake (G54).
- **Moving one figure moves the overlap onto another** (rounds 47–50, the walk-in vs. driver at the counter): run the whole crowd suite after every route/spot change, not only the budget you are fixing.

## Current state — v5.5, round 53: ✅ SATISFIED (0 bugs, 0 major, 1 minor). Rewards feature passes.
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
