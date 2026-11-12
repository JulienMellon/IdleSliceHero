# v5.14-r3 — critic review r3 (round 64)

```
VERDICT: NOT SATISFIED
SUMMARY: r3 fixes G95 in the common case: the gift now stays in the sky band above the roof sign (29, 05b6, 47a), and its label steps aside for the refused-tap toast (05b6). The welcome-back card no longer has the 70 pt hole. Three things are still wrong. While an order or perk card is up, the gift still lands on the roof sign (50). The patio pill (D450) has not changed by a single pixel. The oven halo and the coin burst from the oven mouth (D454) don't show in the shots.
BLOCKERS:
- none (report.json: loaded true, errors [], cash_after_play $6)
BUGS:
- G95 [50 / engine/bonus.ts laneY, floating-bonus.tsx] Narrowed to the card-up case. With Coach Dale's +$81.9K card showing, bonusTop = ORDER_VIEW.top + height + 6 already sits below the sky band's bottom. laneY then returns `lo` (hi − lo < 0 → lane step 0), so the band is ignored. In 50 the label "A gift, caro. Tap it!" sits on the roof glass at y≈274. The box covers "Suburbs" on the roof sign, and the 0/5 pips sit on the station chips. It is no better than r2 (prev/50) → when lo > hi, clamp to hi and drop giftRoom (put the label beside the box), or hold the gift until the card is gone, the way bonusBlocked holds it for drawers.
VISUAL DESIGN:
- D450 [minor] 45, 46 (full-size crops opened) — not fixed. The r3 "budget" commit touched only STATE.md and a crowd test, and the pixels match r2. The umbrella tip still cuts the "3"/"4" of "N waiting". That pill now overlaps the bottom of the "N drivers idle · buy Ovens" pill by about 4 pt. Four diners still crowd each umbrella table in 46 → draw the waiting pill on the layer above the umbrellas, 6 pt below the hint pill, or on the sill to its right. Cap the patio at 2 diners per table.
- D454 [minor] 52, 53 (52 full-size crop opened) — narrowed. The gap is fixed: the card is anchored at the top and the button sits right under the news line (52, 07, 20). The halo is not fixed. At 80% (52) the oven shows no glow at all. The heat circle (r 46+34k at MOUTH_C) seems to be drawn behind the dome body and door, so raising its opacity floor to 0.3 changed nothing. The burst is not fixed either. 53 still shows only 2 coins, 2 slices and 2 stars, sitting on "Collect" (a star cuts the "C"). The 10 coins that game-ui.tsx emits from the mouth aren't visible, probably because the coin layer draws under the modal. Fix: draw the halo in front of the dome as an additive ring around the door arch, or as a glow on the door at 0.3–1.0. Lift the coin layer above the gift overlay so the arc from the oven mouth shows. Keep the stars clear of the button label.
- D455 [minor] 52, 53, 20 — the news line wraps a single word: "Downtown sold 169,351 pies while you were / out". In 07 the shorter number fits on one line → shorten it to "Downtown sold 169,351 pies while you were away" in a 2-line box with balanced breaks, or reduce the font by 1 pt for 6+ digit counts.
DESIGN NOTES:
- D427 [minor] by plan v5.15 — endgame goal.
FUN AND RETENTION:
- [minor] G95 (above): the first gift is the first-minute hook. A special order is when a player is most engaged, and that is exactly when the gift lands on the shop's name. Monopoly GO! queues its prompts and never stacks two in one lane. Hold the gift until the card closes, or give it the clamped sky lane.
- [minor] D454: the return moment still lacks loot spilling out. In AFK Journey's chest, the rewards burst out of the object you opened. Here the oven opens, but nothing comes out of it on screen (53). The count-up, the door swing and the boxes inside do read as a gift.
- [ok] First 60 s, tap feel and goal visibility: unchanged and good. "▶ … tap!" shows on the ready goal (13, 45). Every goal string fits beside the crescent chip (21, 47a). The ladder and milestone shots are unchanged in substance.
- [ok] Reason to come back: the night oven, "Upgrade it to hold 8 h" (20), and the scrapbook "Next: Dale's story continues after 7,069 more Suburbs pies" (06) each give a specific, countable goal.
FIXED SINCE LAST REVIEW: n/a (G95 narrowed further; D454 gap part fixed)
STILL OPEN FROM LAST REVIEW: G95 (card-up case), D450, D454 (halo and burst), D427 (by plan)
```

Opened at full size (crops): 45 and 46 (patio pill), and 52 (oven halo). Code checked: `engine/bonus.ts` laneY and skyBottom, `floating-bonus.tsx` (toastUp and the lane), `app/index.tsx` bonusTop, `game-ui.tsx` OvenArt halo and emitCoin in commit cdf7698, and `content/hooks.ts` GIFT.coins = 10.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| G95 | bug | U | 50 / bonus.ts laneY, floating-bonus.tsx | Card up: lo > hi drops gift onto roof sign; clamp to hi without giftRoom, or hold gift until card closes |
| D450 | minor | S | 45, 46 | Waiting pill above umbrellas, 6 pt below hint pill; max 2 diners per patio table |
| D454 | minor | U | 52, 53 / game-ui.tsx OvenArt | Halo hidden behind dome: draw in front around door; coin layer above gift overlay; stars off "Collect" |
| D455 | minor | U | 52, 53, 20 / game-ui.tsx | News line orphans "out": say "away", balance the two lines, or shrink 1 pt |
| D427 | minor | E | by plan v5.15 | Endgame goal |

Next IDs: G97, D456
