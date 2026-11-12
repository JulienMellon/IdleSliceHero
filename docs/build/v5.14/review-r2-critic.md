# v5.14-r2 — critic review r2 (round 63)

```
VERDICT: NOT SATISFIED
SUMMARY: r2 fixes most of round 62. The goal bar fits beside the night-oven chip and keeps "tap!", the welcome-back oven is now the scene's brick dome with heat, smoke, rays and boxes, and the night-oven sheet, the upgrade button and the task text are all right. One bug is left: the flying gift is clamped to the screen edge, but its label and box still pile onto the refused-tap toast, the roof sign and the station chips. The patio pill still collides with the umbrellas and the hint pill.
BLOCKERS:
- none (report.json: loaded true, errors [], cash_after_play $5)
BUGS:
- G95 [05b6, 50, 29 / floating-bonus.tsx] Narrowed. The x clamp works: 47a shows "A gift, caro. Tap it!" in full at the right edge, and 47b shows LUCKY at x≈8. The vertical overlap is still there. In 05b6 the refused toast "Ovens: need $20K" is drawn over the label ("…, caro. Tap it!"). In 50 the label sits on the top edge of the "Rosa's · Suburbs" sign, and the box with its 0/5 pips covers the sign and the first two station chips. 29 is the same, about 10 pt lower → keep the gift lane at y ≤ sign top − 8 (the sky band). Hide or offset the label for the 1.2 s the refused toast is up.
VISUAL DESIGN:
- D450 [minor] 45, 46 (full size opened) — the patio "N waiting" pill is still drawn under the umbrella tip: the canopy point cuts through "4" and "3". Its top edge also touches the "N drivers idle · buy Ovens" pill (0 pt gap). 46 still seats 8 diners around two umbrella tables, faces overlapping → draw the pill on the layer above the umbrellas, 6 pt below the hint pill, or on the sill to its right. Cap the patio at 2 diners per table.
- D454 [minor] 52, 07, 53 — the return popup before the oven opens still has ~70 pt of empty cream between the news line and "Open the oven". At 80% (52) the heat halo is barely visible against the cream (the 54 full state reads fine). On open (53), only 2 coins and 2 slices show over the button. In AFK Journey's return chest, loot spills over the frame. → close the gap (move the button up, or put the "Suburbs sold…" line for each shop in that slot). Raise the halo opacity floor to 0.3 at 50%. Give the burst 8–10 visible coins arcing up from the oven mouth, not from the button.
DESIGN NOTES:
- D427 [minor] by plan v5.15 — endgame goal.
FUN AND RETENTION:
- [ok] Return moment (52–54, 07, 20): it now reads as a gift. A dome oven that smokes and glows with the fill, "Open the oven", the door swings, rays and boxes show, the total counts up and coins fly to cash. A cheese-tone "Upgrade it to hold 8 h" button stands in for the red text. The polish left is D454.
- [ok] Goal always visible (41, 21, 14, 05b6, 13): every goal string fits beside the crescent chip, and the ready state shows "▶ … tap!" (41, 13, 43). G96 is fixed.
- [ok] Session-end reason: the sheet says "Leave now and it's full in 4 h", and the scrapbook ring pulses near full (game-ui.tsx, ring `pulse`). The HUD chip still only says "4 h". That is acceptable because the oven is empty on return.
- [minor] G95 (above): the first gift is the first-minute hook. When the label lands under a refused-tap toast, a new player sees "need $20K" instead of "Tap it!". Monopoly GO! never stacks two prompts. Give the gift label priority, or the free lane.
- [ok] First 60 s, tap feel and a goal to chase: unchanged and good. LUCKY SLICE ×4 now sits in the sky band (47c), so the cooks' cheer shows.
FIXED SINCE LAST REVIEW: G96, D447, D451, D449, D448, D452, D453
STILL OPEN FROM LAST REVIEW: G95 (narrowed to vertical overlap), D450, D427 (by plan)
```

Opened at full size: 46 and 45 (patio pill crops). Code checked: `game-ui.tsx` OvenArt/OvenDoor/shake/coins (D447) and the scrapbook ring pulse (D453), and `night-oven.ts` leaveLine.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| G95 | bug | U | 05b6, 50, 29 / floating-bonus.tsx | Keep gift lane in sky band above roof sign; don't stack label under refused-tap toast |
| D450 | minor | S | 45, 46 | Waiting pill above umbrellas, 6 pt below hint pill; max 2 diners per patio table |
| D454 | minor | U | 52, 07, 53 / game-ui.tsx OvenArt | Close 70 pt gap before open; halo opacity floor 0.3; 8–10 coins burst from oven mouth |
| D427 | minor | E | by plan v5.15 | Endgame goal |

Next IDs: G97, D455
