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

## Current state — v5.3, round 51: ❌ NOT SATISFIED (minors only; critic holds the first-screen rule). Loop RESUMED by Julien 2026-10-30 night.
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
