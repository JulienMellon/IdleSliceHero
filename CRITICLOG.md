# Critic Log

The visual **critic** (`.claude/agents/critic.md`) reviews each build's iPhone-size screenshots against App Store screenshots of the top idle games. The build team then ships a new version that addresses every note.

- **SATISFIED** requires 0 bugs, 0 [major] notes and ≤ 3 [minor] notes. A build that fails to load, or has a blocking bug, can never pass.
- **Screenshots:** `screenshots/<version>/` (393×852 @2×). Regenerate with `npx expo export --platform web && python3 scripts/screenshots.py <version>`. `report.json` must show `"errors": []`.
- **Full history:** rounds 1–36 (v0.1 → v3.5) are kept verbatim in [`docs/logs/CRITICLOG-archive.md`](docs/logs/CRITICLOG-archive.md). This file holds only the current state.
- **Owner's standing direction** (the storefront cutaway, sidewalk buttons, tap-only drawer, a WELCOME mat, visible decor tiers, the visual-polish and character bar) lives in the critic brief and holds in every build.

**Next IDs:** bugs **G75**, design notes **D307**.

---

## Lessons from rounds 15–34 (read before fixing crowd/geometry notes)
- **Overlap fixes kept moving the overlap instead of removing it** (rounds 30–34: the counter lane moved onto the bakers, the outside pause moved onto the mat, the back row moved onto the bakers' feet). Fix crowd notes in `scene/cast.ts`, `scene/timelines.ts` or `scene/layout.ts`. Then prove the fix with a budget in `scene/__tests__/crowd.test.ts` before taking screenshots, and make sure the test could actually fail on the old code.
- **Verify in pixels.** The critic marks a fix open if the screenshot doesn't show it, whatever this log says.
- **Don't remove owner-required elements** while fixing something else. The WELCOME mat was removed once by mistake (G54).

## Current state — v3.6, round 37: ✅ SATISFIED (0 bugs, 0 [major], 3 [minor])

v3.6 loads clean (`errors: []`, `loaded: true`) and the critic opened every shot. G73 (recipe card clipped), G74 (Drivers lock copy), D298 (sold sign on the cap), D299 (captions over art) and D300 (cap note wrap) are confirmed fixed; D301 was accepted as perspective. Rounds 35–36 (v3.4, v3.5) were NOT SATISFIED and are archived with their build tables.

**Open (none blocks satisfaction)**

| ID | Type | Note | Proposed fix |
| --- | --- | --- | --- |
| D302 | minor | Early shops (03, 03b) leave ~190pt of empty sky above the roof | A few background buildings, a billboard or a bird line at y 340–500 |
| D303 | minor | Back-row diners at Industrial and Uptown sit shoulder to shoulder; heads overlap (carried from D292) | Space the back row 6–8pt wider or alternate heights |
| D306 | minor | The three Industrial chefs share one white uniform and hat, differing only in hair and skin | A different hat, a neckerchief colour or a different prop for one chef |
| D304 | note | The tied-station banner reads as a label, not a button | Make it a tappable "buy both" button |
| D305 | note | Suburbs reads as a live "Build $300" on the City map and list while locked | Padlock and "Nonna takes over in N" on the row, dim the pin |
| D294 | note | A "no gain now" button still has a green price | Grey the price text |
| D297 | note | Goal-bar fill runs through the label on an unmanaged shop | Darker label over the fill |
| — | note | The Suburbs-locked toast covers the University lock on the City map | Sit it lower, under the map |
| — | planned | Tap targets below 44px (chips 22px, compact buy buttons 29px) | The v3.8 resize, after the v3.7 story pacing build |

## v3.7 — build (planned feature: story pacing and neighbourhood perks; open minors carried)

| Change | What to look for |
| --- | --- |
| Story pacing | After a launch or return one waiting story beat plays at once; after that a beat waits for 90 s of play since the last one ended (tutorial included). A finale waits 300 s after its beat 3 (Downtown 120 s). Scenes the player causes (a new pizzeria, the Pier 9 bid) still play at once. downtown-3 now triggers at 45 pizzas. |
| Perks | Each finale shows a closing card "★ COACH DALE’S PERK ★ …" (new shot `22-dale-perk-card`). Perks apply only to their own pizzeria: Dale (Suburbs) walk-ins pay 85%, Marisol (Waterfront) +10% prices, Priya (University) driver upgrades −10%, Big Sal (Industrial) +25% offline earnings, Genevieve (Uptown) 6% per decor tier. The drawer shows the perk as a banner, and the decor header shows 6% in Uptown once earned. |
| Pier 9 bid | Once "For Sale" has played and Waterfront has sold 50,000 pizzas, the goal bar leads with "Bid on Pier 9 to save Marisol’s dock · $2.00M" (new shot `21-pier9-bid-goal`). Winning it plays "Dock Saved". |
| Pacing sim (greedy buyer, one sitting) | Nonna takes over at 5.0 min (was 1.4), Suburbs opens at 5.0 (was 2.0), the bid is won at 35.9 min, University opens at 70.4 (was 66.1), the city completes at 227 min (was 221). Longest scene gap 34.5 min, the University dead zone (deferred). |
| D302, D303, D306 | Carried, not changed. |
