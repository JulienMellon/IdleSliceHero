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

## Current state — v5.6, round 54: ❌ NOT SATISFIED (2 major on the new cut-scene art). Loop STOPPED for handoff (Julien, 2026-10-30 23:00).
v5.6 = owner-requested cut-scene upscale (waist-up figures, layered backdrops). Clear step up; owner checks (clipping, crossing hands) fail. Fixed: D390, weekly-diamond note. Unchanged shots 00/03/06: busts still read.

| ID | Severity | Where / shot | Note | Concrete fix |
|---|---|---|---|---|
| D391 | major | Cut-scenes 02, 08, 18, 19 | Signs clipped: "PIZZA" sign behind the EST. 1974 frame (02/19); two-line caption covers the PIZZA sign and frame (19); MEGASLICE billboard and steam cut by the frame top (08); PIER 9 plaque runs off the right edge (18). | Frame to x ≥ 0.62 or sign 0.8×; billboard down 24 pt; plaque inset 12 pt; keep the top 60 pt free of signs for two-line captions. |
| D392 | major | Cut-scenes 02, 08, 18 | Hands: Nonna and Marisol share the same clasped "#" lump (clones); Sal's pointing finger jabs the suit man's elbow; the suit man's box mittens have detached ring cuffs. | Interlaced-finger clasp (3 arcs, no hash); a distinct worried gesture for Marisol; arms ≥ 8 pt clear of other figures; open palms with 4 fingers, flush cuffs. |
| D393 | minor | 08, 18 | Pale translucent streak across Sal's and Marisol's faces; `LIGHT_SHADE` overhangs the head (arc to x≈93 on a 36–84 head). | Clip shade/rim to the head ellipse; hair strands off the face. |
| D394 | minor | 02, 18, 19 | String-light bulbs half cut at the frame edges under the caption (02/19); sun behind the caption (18); Rosa's happy pose arms straight down, recipe card floats over the oven (19). | Bulbs 10 pt in; sun lowered; Rosa holds the card at chest height. |
| D395 | minor | 22, 01 | Tree trunk grows out of Dale's cap; win face open-eyed (22). Moon halo over the right tower (01). | Tree to x≈0.25 or Dale to 0.6; closed-eye happy face; moon in the far layer. |
| D396 | minor | 02, 19 | Chalkboard crams "$3 · $4 · $4" on one line. | One right-aligned price per line. |
| D359, D297, D304, D305, Pier 9 chip | note | carried | Texts in the round-53 archive section. | — |

**Next IDs:** G86, D397.
