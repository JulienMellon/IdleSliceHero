# Critic Log

The visual **critic** (`.claude/agents/critic.md`) reviews each build's iPhone-size screenshots against App Store screenshots of the top idle games. The build team then ships a new version that addresses every note.

- **SATISFIED** requires 0 bugs, 0 [major] notes and ≤ 3 [minor] notes. A build that fails to load, or has a blocking bug, can never pass.
- **Screenshots:** `screenshots/<version>/` (393×852 @2×). Regenerate with `npx expo export --platform web && python3 scripts/screenshots.py <version>`. `report.json` must show `"errors": []`.
- **Full history:** rounds 1–43 (v0.1 → v4.2) are kept verbatim in [`docs/logs/CRITICLOG-archive.md`](docs/logs/CRITICLOG-archive.md). This file holds only the current state.
- **Owner's standing direction** (the storefront cutaway, sidewalk buttons, tap-only drawer, a WELCOME mat, visible decor tiers, the visual-polish and character bar) lives in the critic brief and holds in every build.

**Next IDs:** bugs **G76**, design notes **D338**.

---

## Lessons from rounds 15–34 (read before fixing crowd/geometry notes)
- **Overlap fixes kept moving the overlap instead of removing it** (rounds 30–34: the counter lane moved onto the bakers, the outside pause moved onto the mat, the back row moved onto the bakers' feet). Fix crowd notes in `scene/cast.ts`, `scene/timelines.ts` or `scene/layout.ts`. Then prove the fix with a budget in `scene/__tests__/crowd.test.ts` before taking screenshots, and make sure the test could actually fail on the old code.
- **Verify in pixels.** The critic marks a fix open if the screenshot doesn't show it, whatever this log says.
- **Don't remove owner-required elements** while fixing something else. The WELCOME mat was removed once by mistake (G54).

## Current state — v4.3, round 44: ❌ NOT SATISFIED (0 bugs, 1 [major], 2 [minor]). The loop is paused here (Julien, 2026-10-30).

v4.3 loads clean (`errors: []`, `loaded: true`); the critic checked all 29 shots. D330 (basil saving outline), D306 (distinct cooks: grey skull cap on cook two), D328 (walk-in under the baker's feet) and D331 (drivers stacked in the door) are confirmed fixed in the pixels.

**Caution on D336:** v4.3 changed no crowd or route code (only a cook `variant` prop in `scene/cast.ts`). Crowd overlaps depend on the frame each screenshot lands on, so D328/D331 "fixed" and D336 "regressed" are likely the same intermittent counter/door crowding caught on different frames. Treat it with the crowd-overlap lesson: reproduce it in `scene/__tests__/crowd.test.ts` (a driver/walk-in budget at the counter) and make the test fail before fixing it.

**Open**

| ID | Type | Note | Proposed fix |
| --- | --- | --- | --- |
| D336 | major | Walk-ins and the pickup driver share one spot at the counter: in 03b (opening minute) a walk-in is drawn over most of the driver at the register; in 11/12 a walk-in's head sticks up behind the driver's cap (one figure, two heads); in 14 two walk-ins overlap at the driver's shoulder | Give walk-ins their own order point ~34 pt left of the driver pickup (the register's left end), or queue them ~26 pt apart, never on the driver's spot; add a crowd-test budget for driver/walk-in overlap at the counter that fails on v4.3 first |
| D302 | minor | Early shops (03, 05b, 21) leave plain sky above the roof | A back row of low #9FB4CC buildings or a billboard at y 340–500 (Waterfront: a far pier/lighthouse; Suburbs: a water tower and rooftops) |
| D337 | minor | The cooks' neckerchiefs (red, mustard, basil) are ~2 pt wide and don't show at phone size; only the skull cap tells cook two apart | Widen each kerchief to a 6×4 pt triangle under the chin with a 1 pt outline (`scene/people.tsx`, `COOK_KERCHIEF`) |
| D304 | note | The tied-station banner "Upgrade prep + ovens · $35" reads as a label (16) | Make it a green, tappable "Buy both · $35" button |
| D305 | note | Suburbs shows a live "Build $300" on the City map and list while locked; the Nonna countdown toast covers the top lock tiles (17) | Padlock and the countdown on the row and pin; the toast under the map |
| — | note | During the Pier 9 bid, the University chip is solid green "Build $1.2M" (21) | A one-line "Pier 9 bid in progress" hint on the chip |
| D297 | note | Goal-bar fill runs through the label on an unmanaged shop ("ma\|nager") | Darker label over the fill |
