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

## v3.4 — build (addresses round 34 and the one-time playtest; tap-target resize is planned for v3.6)

| Note | Fix |
| --- | --- |
| G72 | `timelines.ts` `guestPose`: `turnX = Math.max(seat[0], lay.counter.x0)`. Walk-ins leave the counter lane at the counter's end and use the aisle. `crowd.test.ts` now allows **0** frames of a walker covering a baker's torso; the new test fails on v3.3. |
| D282 | The parked vehicle moved to `d0 − 60` and the chalkboard to `d0 − 115`; geometry test checks the clearance to `guestPauseX`. |
| D283 | Bakers behind a back-row diner stand 17 deeper (`BACKROW_BAKER_SHIFT`); a crowd test checks heads never cover a baker's shins or feet. |
| D284 | `edgeFade` holds opacity 1 until a figure is 14 past the edge, then fades over 8. |
| D285 | `GUEST_WALK_Y = −44`. |
| D286, D287 | The drawer shows "Upgrade prep + ovens · $X (one alone adds $0/s)" when stations are tied, so the tied cards are explained. |
| Playtest 1 | Cut-scene taps are ignored for 450 ms after each line and 700 ms after a scene opens; a new scene waits 1.5 s after the last kitchen tap. |
| Playtest 3 | The heading reads "Industrial · Part 4" until the last panel, then shows the title. |
| Playtest 4–8 | No BOTTLENECK badge on the manager card; Settings shows `APP_VERSION`; rates use `rate()`; goal bar uses `goalAmount()` ("$1.50K / $1.50K"); Drivers capped at `levelCap`; the Build toast names the cost and shows on the City screen; the offline popup says when earnings are capped. |
| Playtest, frugal path | Suburbs is locked until downtown-4 plays and shows "Nonna takes over in N more pizzas" on the Downtown manager card. |
| Playtest, story | The speech tail is hidden on "You" lines; the MegaSlice HQ logo moved off Victor's head; "Ten thousand pies" → "A hundred thousand"; "…on a bike. Lately, a drone."; "2 AM" → "finals week"; `sold-sign` and `recipe-card` props are drawn. |

## v3.5 — build (round 35 notes from the v3.4 review)

| Note | Fix |
| --- | --- |
| D288, D289, D292 | Not changed. A walk-in passing in front of the chalkboard or planter is correct depth ordering (the walk lane sits closer to the viewer); the dining row density is carried. |
| D290 | The cut-scene heading reads "Waterfront · Act 3" instead of "Part 3", so it can't be mistaken for the panel number. |
| D291 | The tapped-tag highlight only shows on a bottleneck card, so the drawer never has two competing highlights. |
| D293 | New shot `16-tied-bundle-drawer`: both tied cards are red and the banner reads "Upgrade prep + ovens · $35 (one alone adds $0/s)". |
| D295 | New shot `17-suburbs-locked`: tapping Suburbs on the City map shows "Nonna takes over in 110 more pizzas". |
| D296 | New shots `18-sold-sign-scene` and `19-recipe-card-scene`; both props sit inside the cropped frame (x 99–301) clear of the speaker's head. |
| Offline cap | New shot `20-offline-capped` shows "Earnings are capped at 4h 0m (you were away 9h 1m)". |
| D294, D297 | Not changed (notes). |
