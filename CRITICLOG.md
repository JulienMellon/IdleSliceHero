# Critic Log

The visual **critic** (`.claude/agents/critic.md`) reviews each build's iPhone-size screenshots against App Store screenshots of the top idle games. The build team then ships a new version that addresses every note.

- **SATISFIED** requires 0 bugs, 0 [major] notes and ≤ 3 [minor] notes. A build that fails to load, or has a blocking bug, can never pass.
- **Screenshots:** `screenshots/<version>/` (393×852 @2×). Regenerate with `npx expo export --platform web && python3 scripts/screenshots.py <version>`. `report.json` must show `"errors": []`.
- **Full history:** rounds 1–50 (v0.1 → v5.2) are kept verbatim in [`docs/logs/CRITICLOG-archive.md`](docs/logs/CRITICLOG-archive.md). This file holds only the current state.
- **Owner's standing direction** (the storefront cutaway, sidewalk buttons, tap-only drawer, a WELCOME mat, visible decor tiers, the visual-polish and character bar) lives in the critic brief and holds in every build.

**Next IDs:** bugs **G86**, design notes **D402**.

---

## Lessons from rounds 15–50 (read before fixing crowd/geometry notes)
- **Overlap fixes kept moving the overlap instead of removing it** (rounds 30–34: the counter lane moved onto the bakers, the outside pause moved onto the mat, the back row moved onto the bakers' feet). Fix crowd notes in `scene/cast.ts`, `scene/timelines.ts` or `scene/layout.ts`. Then prove the fix with a budget in `scene/__tests__/crowd.test.ts` before taking screenshots, and make sure the test could actually fail on the old code.
- **Verify in pixels.** The critic marks a fix open if the screenshot doesn't show it, whatever this log says.
- **Don't remove owner-required elements** while fixing something else. The WELCOME mat was removed once by mistake (G54).
- **Moving one figure moves the overlap onto another** (rounds 47–50, the walk-in vs. driver at the counter): run the whole crowd suite after every route/spot change, not only the budget you are fixing.

## Current state — v5.7, round 55: ❌ NOT SATISFIED (0 bugs, 0 major, 11 minor)
v5.7 = cut-scene fix round. Fixed: D391, D392, D393, D395, D396. Other changed shots are timing noise; no regressions from the shared figure art (00, 03, 05b2, 05b5, 06). Codecritic skipped this build (owner rule, see CODELOG).

| ID | Severity | Where / shot | Note | Concrete fix |
|---|---|---|---|---|
| D397 | minor | Cut-scenes 02, 18, 19 | Caption bar is see-through (`cutscene-player.tsx:214` `opacity: 0.94` on the view): wire and bulbs show through, text at 94% | Drop the view opacity; solid `C.cheese` background |
| D398 | minor | 22 | Oak shading circles spill outside the canopy into the sky (~160,95 and 110,215 pt); canopy hides the left roof/chimney; crowds the caption | Clip shading to the canopy path, canopy −15%, 20 pt left so the roof ridge shows |
| D399 | minor | 08 | MEGASLICE billboard sits straight on the red "MEGA" sign with no support; two stacked brand signs; left stack's steam hidden | Drop the "MEGA" header, or billboard on two #3a2a20 posts on the roof, below the frame top |
| D400 | minor | 02, 18, 19 | Hands still one motif (round blob + 3 arcs): Nonna's clasp and Marisol's fist read as bread rolls; Rosa holds the card from below with two mitts; card keeps its pushpin | Thumbs as separate lobes over the card edge; remove the red pin dot |
| D401 | minor | 18 | Marisol's hair a flat white sheet with no ink outline, cap to shoulders (reads as a veil) | 2.5 pt ink outline, #d9d4cc shadow side, 2–3 strand lines, or a low bun |
| D394 | minor | 02, 19 | (bulbs only) bulbs half-hidden under the caption's bottom edge | String at y ≥ caption bottom + 6 pt, or none on captioned beats |
| D359 | minor | 03, 05b5, 21 (sidewalk cards) | Struck-through prices unexplained | Muted price + "need $X" or a lock glyph; strikes only for real discounts |
| D297 | minor | 05b2, 33 | Goal-bar label one dark colour over fill and cream ("Upg\|rade") | Darker/contrasting label over the fill (two-tone clip) |
| D304 | minor | 16 | Tied-station banner "Upgrade prep + ovens · $35" reads as a label | Green, tappable "Buy both · $35" button |
| D305 | minor | 17 | Suburbs shows a live "Build $300" on the City map/list while locked; Nonna countdown toast covers the top lock tiles | Padlock + countdown on the row and pin; toast under the map |
| Pier 9 chip | minor | 21 | "+ University Build $1.8M" gives no warning that building drops the bid's progress | "Pier 9 bid in progress" hint under the chip's price |

**Next IDs:** G86, D402.
