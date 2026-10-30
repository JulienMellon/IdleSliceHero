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

## v3.8 — build (tap targets; round-38 notes)

| Note | Change |
| --- | --- |
| Tap targets (planned) | `components/tap-targets.ts` holds the sizes; a test asserts every control reaches 44 pt with its hit margin. Sidewalk buy buttons are drawn at 44 pt. Each station card's label strip is 18 pt with a 26 pt hit margin above only, and 4 pt of dead space above the buy button. Unmanaged-shop chips are 26 pt with 9 pt margins (font 12, was 10.5). The drawer's Close button is 30 pt with 7 pt margins. The row is ~14 pt taller and sits ~14 pt lower (its foot just past the kerb), so its top is where it was and the curb walk-ins still clear it; it now covers the top edge of the street. |
| Unmanaged shop | The manager card is one 44 pt button reading "Hire a Waterfront manager · $30K", so the taller controls don't cover the WELCOME mat (05b). |
| D307 | Dale's perk reads "Suburbs walk-ins pay more: 85% of full price (was 70%)". |
| D308 | New shot `23-perk-banner-drawer`: the Suburbs drawer after Dale's finale shows the perk banner. |
| C39 (code) | A short iOS interruption no longer plays the next story beat early. |
| D302, D303, D306 | Carried. |

## v3.9 — build (round-39 notes from the v3.8 review, and the codecritic's C44–C46)

| Note | Change |
| --- | --- |
| Tap targets, redone | v3.8's hit margins don't work on a real iPhone (a touch outside a parent's bounds never reaches the child, and web ignores hitSlop, so the screenshots couldn't show it). Every sidewalk control is now **drawn** at 44 pt: each station is one button with its name above the price (the label strip is gone, **All** opens the drawer), chips are 44 pt, the manager button is 44 pt. Close is 36 pt with a 4 pt margin inside the header's padding. |
| D309 | The station cards are 55 pt (v3.7: 62 pt), so the row sits above the kerb again (`SIDEWALK_ROW.raiseManaged = 13`): the kerb and both traffic lanes show (13). An unmanaged shop's column (chips 44 + manager 44) sits at `raiseIdle = 2`, clear of the WELCOME mat (05b). |
| D310, D311 | The manager button reads "HIRE A MANAGER · +$22/s" over the price; greyed-out button text is #665A4F (~4:1, was ~2:1). |
| D312 | No chip hit margins any more. |
| D308 | Shot 15a shows the Uptown decor header "+6%" with Genevieve's perk (14/15 now seed that perk). Shot 15 is now the All drawer (station tags are gone). |
| D302, D303, D306 | Carried. |

## v4.0 — build (round-40 notes from the v3.9 review)

| Note | Change |
| --- | --- |
| D313 | One "no gain" look everywhere on the sidewalk: a flat #EFE6D8 face, #CFC3B2 rim and #8A7B6C text reading "NO GAIN" next to the station icon. Green now only ever means "this adds income" (03, 05, 05b). |
| D314 | Station icons are back, 13 pt, left of the station name (05, 09, 14). |
| D315 | An unmanaged shop's chips are the same buttons as the managed cards (icon, name over price, level badge), unframed to fit; All sits beside the manager button only (44 pt, not stretched); the A-board moves 10 right and shrinks to 85% (05b). |
| D316 | A bottleneck you can't afford yet has a soft dashed #F2B8B0 outline and a dark badge; it turns solid red when affordable (03, 03b). |
| D317 | "Expand to hire past 30" for Drivers; "Lv" and its number never split across lines. |
| D302, D303, D306 | Carried. |

## v4.1 — build (round-41 notes from the v4.0 review)

| Note | Change |
| --- | --- |
| D319 | The drawer's no-gain buttons use the same flat muted look as the sidewalk ("no gain now" over a struck price); green appears only on buys that add income (05a, 15, 16, 23). |
| D320 | Sidewalk buttons keep the station name; a no-gain price is struck through instead (03, 04, 05, 21). |
| D321 | Waterfront: the third oven sits centred over both columns (any incomplete top row of stacked decks is centred); the porthole is 6 lower and clears the menu; the fishing net hangs under the porthole, clear of the menu and the counter staff (21). |
| D324 | Station cards drop "+$0/s now" when the button already says "no gain now". |
| D302, D303, D306 | Carried. |
| Screenshots | One run of shot 22 (perk card) timed out waiting for the cut-scene; a re-run passed. Watch for flakiness. |
