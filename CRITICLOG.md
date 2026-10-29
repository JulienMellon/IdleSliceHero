# Critic Log

The visual **critic** (`.claude/agents/critic.md`) reviews each build's iPhone-size screenshots against App Store screenshots of the top idle games. The build team then ships a new version that addresses every note.

- **SATISFIED** requires 0 bugs, 0 [major] notes and ≤ 3 [minor] notes. A build that fails to load, or has a blocking bug, can never pass.
- **Screenshots:** `screenshots/<version>/` (393×852 @2×). Regenerate with `npx expo export --platform web && python3 scripts/screenshots.py <version>`. `report.json` must show `"errors": []`.
- **Full history:** rounds 1–34 (v0.1 → v3.3) are kept verbatim in [`docs/logs/CRITICLOG-archive.md`](docs/logs/CRITICLOG-archive.md). This file holds only the current state.
- **Owner's standing direction** (the storefront cutaway, sidewalk buttons, tap-only drawer, a WELCOME mat, visible decor tiers, the visual-polish and character bar) lives in the critic brief and holds in every build.

**Next IDs:** bugs **G73**, design notes **D288**.

---

## Lessons from rounds 15–34 (read before fixing crowd/geometry notes)
- **Overlap fixes kept moving the overlap instead of removing it** (rounds 30–34: the counter lane moved onto the bakers, the outside pause moved onto the mat, the back row moved onto the bakers' feet). Fix crowd notes in `scene/cast.ts`, `scene/timelines.ts` or `scene/layout.ts`. Then prove the fix with a budget in `scene/__tests__/crowd.test.ts` before taking screenshots, and make sure the test could actually fail on the old code.
- **Verify in pixels.** The critic marks a fix open if the screenshot doesn't show it, whatever this log says.
- **Don't remove owner-required elements** while fixing something else. The WELCOME mat was removed once by mistake (G54).

## Current state — v3.3, round 34: ❌ NOT SATISFIED (1 bug, 0 [major], 4 [minor])

v3.3 loads clean. Seven of the round-33 notes are confirmed fixed: D273 (peel), D275 (interleaved back row), D276 (nobody on WELCOME), D277 (Uptown rail), D278 (no barrel slivers), D280 (drawer "·"), D281 (bottleneck toast).

**Open: fix these in v3.4**

| ID | Type | Note | Proposed fix |
| --- | --- | --- | --- |
| G72 | bug | `timelines.ts` `guestPose`: `turnX = Math.min(seat[0], lay.counter.x0)` is always the seat's x, so walk-ins stay on the y 52 lane in front of the bakers (y 60/72) across the oven zone | `Math.max(seat[0], lay.counter.x0)`: leave the lane at the counter's end and walk the y 24 aisle. Tighten `crowd.test.ts` to **0** frames where a walker covers a baker's torso (the < 6% budget let this through) |
| D282 | minor | Flagship: the guest pause (`door.lanes.guestPauseX = d0 − 6`) stands in front of the parked van (`lay.scooter.x = d0 − 30`, ~45 wide) | Move the van to about `d0 − 70`, or pin it left of `guestPauseX − 30`; include props in the stand-still overlap test |
| D283 | minor | Flagship: back-row diners' heads (y 42) cover the bakers' shins and feet | Raise the bakers 6 (y 66/78) at footprints with a back row, or draw bakers after back-row diners where their x ranges overlap |
| D284 | minor | A leaving driver fades to a half-transparent "ghost" at the right edge (x ≈ 375) | Keep `o = 1` until the figure is past `SCENE_W + 10`, or fade only over the last 8 units (`edgeFade` in `cast.ts`) |
| D285 | minor | Curb-side walk-ins' feet sit about 2pt above the Prep card, with no visible contact shadow (carried over from D279) | `GUEST_WALK_Y = −44`; give walking guests a 10×3 `#000` 0.18 shadow |
| D286 | note | Tapping the Ovens tag opens the drawer on a "no gain now" Ovens card while Prep is the BOTTLENECK | When the tagged station isn't the bottleneck, highlight the bottleneck card (or pulse both) |
| D287 | note | The first-minute hint flips between "more ovens" and "more drivers" when the two are tied | Lock the bottleneck for ~3 s, or use a fixed tie-break order (same as D281) |
