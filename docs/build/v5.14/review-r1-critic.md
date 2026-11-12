# v5.14 — critic review r1 (round 62)

```
VERDICT: NOT SATISFIED
SUMMARY: v5.14 lands most of round 61. The golden-pizza and order fixes read clearly, G93/G94 are gone, and the night oven, welcome-back gift and teaser give a returning player something to do in under 30 s. Two new clipping bugs ship with the new features: the first-gift label flies off-screen or sits on the shop sign, and the night-oven chip shrinks the goal bar until the goal, and the ready state's "tap!", are cut off. Also the gift's hero oven looks more like a camera than a pizza oven.
BLOCKERS:
- none (report.json: loaded true, errors [])
BUGS:
- G95 [47a, 47b, 05, 12, 13, 14, 43–46; 29, 50, 05b6 / floating-bonus.tsx] "A gift, caro. Tap it!" hangs from the flying box with no clamp. It is cut at the screen edge for much of the flight ("A gift, caro. T", "o it!"), and the LUCKY tag is cut at the left in 47b. When the lane is low it covers the shop sign and station chips (29, 50), and in 05b6 it stacks on the refused-tap toast → clamp the tag/label x to [8, W−8−labelW] separately from the box, and keep the label inside the sky band above the roof sign
- G96 [41, 21, 09, 12, 13, 14, every home shot / game-ui.tsx Hud] The new 🌙 chip took ~70 pt from the goal bar. Goals are truncated ("hire Finn (pr…", "Expand Uptown · Restau…"). In the ready state the text is hard-clipped mid-glyph ("(pre", "save Marisc") and "— tap!" never shows → put the chip on the cash row (left of the gift), or let the amount wrap under the label; never drop "tap!"
VISUAL DESIGN:
- D447 [major] 52, 53, 54, 07, 20 — the welcome-back oven is the hero object of the return moment, but it is a flat rounded rectangle with a round porthole and a top stub, so it reads as a camera or lunchbox. It doesn't match the dome brick oven in the shop scene. 50%, 80% and full look the same (only the porthole tint shifts). The open interior is one flat yellow disk that looks like a cookie. About 70 pt of empty space sits above the button before opening. AFK Journey's chest glows, shakes and leaks light before you tap it. Fix: redraw it as the scene's dome oven on a brick base. Put a radial heat glow behind the door (#FFB300, opacity 0.15 → 0.6 by fill step), add 2–3 chimney smoke wisps and a 2° shake when full. On open, add 8 light rays, a stack of 3 pizza boxes and 10 coins. Fill the empty slot before opening with the news line ("Suburbs sold 12,400 pies…").
- D450 [minor] 45, 46 — the patio "N waiting" pill is drawn under the umbrella canopy ("iting"). It stacks under the "4 drivers idle" hint pill, and 8 diners crowd two tables → draw the pill above the umbrellas, or move it to the sill, and keep it 6 pt clear of the hint pill
- D451 [minor] 47c — the full-width "LUCKY SLICE ×4!" band sits right over the cooks, so the new cheer pose can't be seen → move the band to the sky above the roof (y ≈ 200–250), or make it 40% shorter and put it over the floor below the cooks
- D449 [minor] 51 — night-oven sheet: the title is just "🌙 4 h" with no Nonna. The unaffordable "$328K" is basil green, and the emoji moon (HUD chip, sheet, drawer card) will render as a glossy Apple emoji next to flat SVG icons → title "Nonna's night oven" with her 32 pt portrait, price in ink #3B1F14 or grey when you can't afford it, and an SVG crescent icon
DESIGN NOTES:
- D448 [minor] 54, 20 — "Upgrade it to hold 8 h" is red text you can't tap. Red reads as an error, and the line goes nowhere → make it a small cheese-tone button that opens the night-oven sheet after Collect
- D452 [minor] 30 — the daily task still says "Collect your offline earnings" → "Open Nonna's night oven" to match the new idea
- D427 [minor] by plan v5.15 — endgame goal
FUN AND RETENTION:
- D447 [major] (above) — return moment: the flow is now a gift (door, count-up, coins, 53), but the art doesn't deliver the "gift" feeling. Monopoly GO! buries the screen in coins. Here 53 shows two coins.
- G96 [bug] (above) — new goal always visible: the goal is the line that most needs to be read, and the new chip now cuts it off. In the ready state the call to action "tap!" disappears.
- D453 [minor] 55b, all home shots — session-end reason: the teaser ring and the line "2,997 more Suburbs pies" (55) are specific and good. But the 🌙 chip reads "4 h" all session and doesn't count anything. Monopoly GO! always shows a ticking timer. Fix: the chip's subtitle on return reads "full in 4 h". Also pulse the scrapbook ring when it is within one 5% step of full.
- [ok] First 60 s: Nonna's first gift arrives 2 s after the unlock and is labelled (but see G95). Each tap feels good: "+$49.1K / +3 min of sales" plus the banner (47c). Something to do within 30 s of returning: gift, tasks, calendar, teaser.
FIXED SINCE LAST REVIEW: G93, G94, D436, D437, D441, D444, D424, D425 (gift flow; art carried as D447), D438, D439, D440, D430 (drivers; patio clump carried in D450), D428, D432, D442, D443, D445, D446, D422, D434
STILL OPEN FROM LAST REVIEW: D427 (by plan)
```

Opened at full size: 47a, 47b (gift and LUCKY clipping), 52/53/54 (oven art), 55b, 41, 42 (HUD goal bar), 46 (patio), 47 (fence). Code checked: `floating-bonus.tsx` (label anchored to the box, no clamp), `game-ui.tsx` Hud/OfflinePopup, `offline-model.ts`, `night-oven.ts`, `bonus.ts`.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| G95 | bug | U | 47a, 47b, 29, 50, 43–46 / floating-bonus.tsx | Clamp gift label and LUCKY tag x on-screen, separately from the box; keep the label above the roof sign |
| G96 | bug | U | 41, 21, 14 / game-ui.tsx Hud | Night-oven chip truncates goal; ready "— tap!" lost; move chip to cash row or wrap amount |
| D447 | major | U | 52–54, 07, 20 / game-ui.tsx OvenArt | Dome oven matching scene; heat glow by fill; smoke; shake when full; rays, boxes, 10 coins on open; news line pre-open |
| D450 | minor | S | 45, 46 | Waiting pill above umbrellas, 6 pt clear of hint pill; fewer patio diners |
| D451 | minor | U | 47c | Lucky banner to sky band so the cooks' cheer shows |
| D449 | minor | U | 51 | Sheet title "Nonna's night oven" + portrait; unaffordable price in ink; SVG moon, not emoji |
| D448 | minor | U | 54, 20 | Upgrade line as cheese button opening the night-oven sheet, not red text |
| D452 | minor | E | 30 | Task text "Open Nonna's night oven" |
| D453 | minor | U | 55b | Chip "full in 4 h" on return; pulse scrapbook ring near full |
| D427 | minor | E | by plan v5.15 | Endgame goal |

Next IDs: G97, D454
