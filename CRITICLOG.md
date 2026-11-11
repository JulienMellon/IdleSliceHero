# Critic Log

The visual **critic** (`.claude/agents/critic.md`) reviews each build's iPhone-size screenshots against App Store screenshots of the top idle games. The build team then ships a new version that addresses every note.

- **SATISFIED** requires 0 bugs, 0 [major] notes and ≤ 3 [minor] notes. A build that fails to load, or has a blocking bug, can never pass.
- **Screenshots:** `screenshots/<version>/` (393×852 @2×). Regenerate with `npx expo export --platform web && python3 scripts/screenshots.py <version>`. `report.json` must show `"errors": []`.
- **Full history:** rounds 1–50 (v0.1 → v5.2) are kept verbatim in [`docs/logs/CRITICLOG-archive.md`](docs/logs/CRITICLOG-archive.md). This file holds only the current state.
- **Owner's standing direction** (the storefront cutaway, sidewalk buttons, tap-only drawer, a WELCOME mat, visible decor tiers, the visual-polish and character bar) lives in the critic brief and holds in every build.

**Next IDs:** bugs **G88**, design notes **D414**.

---

## Lessons from rounds 15–50 (read before fixing crowd/geometry notes)
- **Overlap fixes kept moving the overlap instead of removing it** (rounds 30–34: the counter lane moved onto the bakers, the outside pause moved onto the mat, the back row moved onto the bakers' feet). Fix crowd notes in `scene/cast.ts`, `scene/timelines.ts` or `scene/layout.ts`. Then prove the fix with a budget in `scene/__tests__/crowd.test.ts` before taking screenshots, and make sure the test could actually fail on the old code.
- **Verify in pixels.** The critic marks a fix open if the screenshot doesn't show it, whatever this log says.
- **Don't remove owner-required elements** while fixing something else. The WELCOME mat was removed once by mistake (G54).
- **Moving one figure moves the overlap onto another** (rounds 47–50, the walk-in vs. driver at the counter): run the whole crowd suite after every route/spot change, not only the budget you are fixing.

## Current state — v5.13, round 61: ❌ NOT SATISFIED (2 bugs, 4 major + 2 by plan, 9 minor)
v5.13 = golden pizza + special orders, economy refit (4 h cap, costMult = order value), round-60 fixes. Fixed in pixels: G91, G92, D417 (ladder now reads as better at every step; lost mixer/bins/2nd vehicle not missed), D433, D435, D419, D429, D431, D423, D426. Being fixed in v5.14.

| ID | Severity | Where / shot | Note | Concrete fix |
|---|---|---|---|---|
| G93 | bug | 47c | Lucky pop clipped: "LUCKY SLICE ×4!" cut by the tab strip, "+$22.2K" loses its "+" at the left edge (floating-bonus.tsx: `left: pop.x - 90, top: pop.y - 24`, no clamp) | Clamp left to [8, width − 188]; drop the pop below the box in the top lane |
| G94 | bug | 05c | Refused-tap toast "Ovens: need $20K" carries onto the City screen over "$190/sec" | Clear the toast on screen change or anchor it to the shop scene |
| D436 | major | 50 | Order success: glow washes out portrait and "+$37K"; no coin burst; the shop doesn't react | Glow behind content / border only; "+$37K" 20 pt #2E7D32; 5 `emitCoin` + `emitPayout`; portrait bounce 1 → 1.15 |
| D437 | major | 47, 47b | Golden pizza is a 30 pt pale box on a pale sky; lucky barely differs | 1.3×, #F6C343 → #FFB300 gradient, 10 pt glow, 3 sparkles; lucky 1.6×, rotating rays, "LUCKY" tag |
| D441 | major | 48 | Offer chip shows no reward and no expiry | "+$37K" under Accept (`chipView.reward` exists); draining bar on the chip's bottom edge |
| D444 | major | 47c | The lucky slice (the one jackpot) pays with 3 coins and a clipped label | Full-width "LUCKY SLICE ×4!" banner at scene centre 1.2 s, 10 coins, cash kick, cooks cheer |
| D424, D425 | major | by plan v5.14 | No session-end reason to return / away meter; return popup is a receipt (20 says "Capped at 4h 0m") | Away meter, gift-like chest popup, teaser |
| D438 | minor | 47 | Pips unexplained, 6 pt | 8 pt slice icons or "4/5" label |
| D439 | minor | 14, 34, 35, 41 | "+$" pop stacked on the waiting pill covers faces | Pill to the sill under the counter, or fade it while a pop is up |
| D440 | minor | 42 | Milestone badge hides two chips and the awning corner; Marco's bubble pokes through the left wall | Badge 20 pt down-right; clamp the bubble |
| D430 | minor | 40, 41, 43, 46 | Drivers overlap ~30%, feet on the sill; five diners clump over the table | Spacing; cap diners |
| D428 | minor | 45, 46 | No deck/step/rail visible at the Corner shop | Show the deck there or move fixtures |
| D432 | minor | 47, 07, 41 | Fence still reads as an orphan segment | Remove it or attach it to a yard |
| D442 | minor | 49 | Active chip never says how to win | "tap to rush!" when behind pace |
| D443 | minor | hooks.ts | Marisol's thanks "Well done, Captain" uses her own title | "Well done, sailor." |
| D445 | minor | 04 | Neither hook exists in the first 60 s | Nonna sends one scripted golden pizza as the tutorial's last step |
| D446 | minor | 47 | Normal pizza = 45 s of income: worth it, not exciting | "+45 s" on the pop or a visible goal-bar jump |
| D427 | minor | by plan v5.15 | Endgame goal | — |
| D434, D422 | note | 37, 05c, 13, 34, 49 | Tap spree accepted; fixtures with impossible states | Regenerate fixtures from the sim |

**Next IDs:** G95, D447.
