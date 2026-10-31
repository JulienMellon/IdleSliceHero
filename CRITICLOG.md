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

## Current state — v5.4, round 52: ❌ NOT SATISFIED (2 bugs in the new rewards UI). Fix round v5.5 in progress.
Fixed in v5.4: D354, D384. New feature reviewed: daily/weekly tasks + gift calendar (`docs/PLAN-v5.4-rewards.md`); defaults D2–D10 look right on screen.

| ID | Severity | Where / shot | Note | Concrete fix |
|---|---|---|---|---|
| G84 | bug | HUD subtitle + shop chips (29, 30–31b) | During a 2× boost the HUD shows "$179/sec · 2× 10m" and the chips the unboosted rate, but `lineTick` applies `boostMult`. Starting a booster looks like it does nothing. | Show the boosted rate ("$358/sec · 2× 10m" in #2E7D3E). |
| G85 | bug | Weekly chest (31b) | The chest offers a cosmetic already in the Collection and then pays nothing; from week 5 every chest is empty. | First unowned cosmetic, else a fallback (30 💎 + 2 h income), labelled. |
| D385 | minor | Tasks drawer (30–31b) | Unfinished tasks show a struck-through "Claim", read as cancelled. | Muted #E2D9CE pill with a lock or "9 / 20", or no button. |
| D386 | minor | Gift calendar (32, 33) | Milestone tiles not larger; labels "30m $", "2× 1d", "Skin", "Visit" cryptic; today's prize small and grey. | 18 pt icon per tile; milestones 2 pt #F5B700 border, 22 pt icon, ribbon; header prize 16 pt bold. |
| D387 | minor | Booster strip (30–31b) | Running chip looks like the tappable stock chips; diamond count red. | Running chip filled #3E9B4F "ON · 10 m left" + draining ring; "Start 2× 15m"; count in ink. |
| D388 | minor | Streak-save modal (33) | "Start over" is green though it resets the streak; repair text wraps badly. | Muted text button under Later; "Missed a day! Keep your streak for 20 💎 (day 7: 50 💎)." |
| D363 | minor | Bike rack (25-look-university) | The two bikes still overlap; 22 pt is less than a bike's length; no hoop reads. | ≥ 44 pt apart on visible #5A5A5A hoops, or one bike. |
| D389 | note | Tasks fixtures (30, 31) | Hard-coded "Earn $5K"/"Earn $60K" targets next to $162K/$1.29M rewards. | Build the shot's sets with the generator's numbers. |
| D359, D297, D304, D305, Pier 9 chip | note | carried | Texts in the round-51 archive section. | — |

**Next IDs:** G86, D390.
