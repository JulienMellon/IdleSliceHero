# Critic Log

The visual **critic** (`.claude/agents/critic.md`) reviews each build's iPhone-size screenshots against App Store screenshots of the top idle games. The build team then ships a new version that addresses every note.

- **SATISFIED** requires 0 bugs, 0 [major] notes and ≤ 3 [minor] notes. A build that fails to load, or has a blocking bug, can never pass.
- **Screenshots:** `screenshots/<version>/` (393×852 @2×). Regenerate with `npx expo export --platform web && python3 scripts/screenshots.py <version>`. `report.json` must show `"errors": []`.
- **Full history:** rounds 1–37 (v0.1 → v3.6) are kept verbatim in [`docs/logs/CRITICLOG-archive.md`](docs/logs/CRITICLOG-archive.md). This file holds only the current state.
- **Owner's standing direction** (the storefront cutaway, sidewalk buttons, tap-only drawer, a WELCOME mat, visible decor tiers, the visual-polish and character bar) lives in the critic brief and holds in every build.

**Next IDs:** bugs **G75**, design notes **D309**.

---

## Lessons from rounds 15–34 (read before fixing crowd/geometry notes)
- **Overlap fixes kept moving the overlap instead of removing it** (rounds 30–34: the counter lane moved onto the bakers, the outside pause moved onto the mat, the back row moved onto the bakers' feet). Fix crowd notes in `scene/cast.ts`, `scene/timelines.ts` or `scene/layout.ts`. Then prove the fix with a budget in `scene/__tests__/crowd.test.ts` before taking screenshots, and make sure the test could actually fail on the old code.
- **Verify in pixels.** The critic marks a fix open if the screenshot doesn't show it, whatever this log says.
- **Don't remove owner-required elements** while fixing something else. The WELCOME mat was removed once by mistake (G54).

## Current state — v3.7, round 38: ✅ SATISFIED (0 bugs, 0 [major], 3 [minor])

v3.7 (story pacing, neighbourhood perks, the Pier 9 bid) loads clean and the critic opened all 27 shots with no regressions. The perk card (22) and the bid goal (21) were checked in pixels.

**Open (none blocks satisfaction)**

| ID | Type | Note | Proposed fix |
| --- | --- | --- | --- |
| D302 | minor | Early shops leave ~190pt of plain sky above the roof | A back row of low buildings or a billboard at y 340–500, fill #9FB4CC |
| D303 | minor | Back-row diners at Industrial and Uptown touch heads | Space back-row seats 6–8pt wider, or drop every other diner 4pt |
| D306 | minor | The three Industrial chefs wear the same jacket and toque | A red neckerchief (#E5483A) or a skull cap on one |
| D307 | note | Dale's perk text can read as a loss | "Suburbs walk-ins pay more: 85% of full price (was 70%)", green up-arrow |
| D308 | note | No shot shows the drawer perk banner or Uptown's 6% decor header | Add a Suburbs drawer shot after Dale's finale |
| — | note | Building University while saving for the $2.0M bid drops the bid progress without warning | A one-line hint on the University chip ("Pier 9 bid in progress") |
| D304 | note | The tied-station banner looks like a label | Make it a tappable "buy both" button |
| D305 | note | Suburbs shows a live "Build $300" while locked | Padlock and countdown on the row and tile |
| D294 | note | "No gain now" buttons keep green price text | Grey the price |
| D297 | note | Goal-bar fill runs through the label on an unmanaged shop | Darker label over the fill |
| — | note | The Suburbs-locked toast covers the University and Industrial lock tiles | Sit it under the map |
| — | planned | Tap targets below 44pt | v3.8 |
