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

## Current state — v5.2, round 50: ❌ NOT SATISFIED. The loop is STOPPED (Julien, 2026-10-30).
Rounds 45–50 covered the playtest-2 rework (`docs/PLAN-v4.7-playtest2.md`): a discrete prep → bake → serve line, station heads + GM, cash on departure with coins, event-driven crew, neighbourhood identity (PASSED in round 48), Nonna's tutorial and the title card. Each round fixed most notes; round 50 still has one [major].

**Open (round 50 on v5.2, plus carried notes)**

| ID | Type | Note | Proposed fix | v5.3 WIP |
| --- | --- | --- | --- | --- |
| D377 | major | The waiting walk-in's head is hidden behind the doorway's PIZZERIA plank | Move the walk-in's order spot clear of the lintel; add a budget that no standing head rect meets the doorway-sign rect (lintel P(0,0,122)→P(0,0,108) across door.x0−8..R−8) | **Done, committed as v5.3 WIP:** drivers now pick up at the counter's right end (by the door), walk-ins order at the left end (`counter.x0 + 4`, 60) via the dining aisle; all 213 tests pass. Sign budget **not yet added**; not yet checked in pixels |
| G83 | bug | Tutorial wait steps 2 and 4 show no hand | Show the hand (or a pulsing ring) on the station being waited on | — |
| D378 | minor | Tutorial scrim too light | 60% scrim extended over the sidewalk row, 4 pt glow on the cut-out | — |
| D379 | minor | Pops too wide | Cap at 80 pt with 11 pt text, or place above-left of the cap | — |
| D363 | minor | Bike rack tangle | Bikes 22 pt apart, visible hoops | — |
| D380 | minor | Title card: Nonna off-centre | Centre Nonna under the subtitle, waving hand | — |
| D381 | minor | "+50% faster" flash collides with the tutorial hand | Offset the flash or hide the hand while it plays | — |
| D354 | minor | Diners without chairs | Draw a chair under every seated diner | — |
| D382, D383, D359 | note | Small polish notes (round-50 text was not logged verbatim; D359 is in the round-47 archive table) | Re-read on the next critic run | — |
| D304, D305, D297, Pier 9 chip | carried | Older carried minors | See archive | — |
