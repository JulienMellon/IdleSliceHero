# v5.15-r3 — critic review r3 (round 67, medium re-check)

```
VERDICT: NOT SATISFIED
SUMMARY: The space and text fixes hold. Cash, rate, sidewalk prices, the EXPAND bundle and the short mastery label all fit on every late screen. The gift no longer covers the attack banner, and the challenge win finally shows on screen with Dale's +$75.7T toast and a centre recipe card. No bugs or majors are left, but six visual minors remain (more than the three allowed): the stacked vans at the bigger footprints, Nonna's time tag over a cashier's face, the umbrella pill, a goal line that clips its payoff, a scrapbook orphan word and the empty booster shelf.
BLOCKERS:
- none (report.json: loaded true, errors [], cash_after_play $6)
BUGS:
- none
VISUAL DESIGN:
- D471 [minor] 13, 41, 56, 59, 61, 62, 62b (opened 62b full size) — Narrowed. Industrial in 36 now parks its two vans apart. At the Flagship/Suburbs footprint the ladder falls back to the old 24-unit shift, so "ROSA'S ROSA'S" still overlaps into one long van. In 70 the two red cars touch nose to tail → where 52 doesn't fit, park the second vehicle on the far side of the A-frame, or draw only one.
- D475 [minor] 72 (full size) — Nonna now reads as herself: a red cardigan, a purple shawl and 1.1× scale (D474 fixed). But her bare "6d 4h" tag sits left of her head, over the left cashier's face, so it reads as the cashier's timer. The grey-haired walk-in in blue overalls still stands right beside her → centre the tag on Nonna's head and make it "Nonna · 6d 4h", keep it off the cashiers' faces, and keep grey-haired walk-ins off the cameo spot's neighbours.
- D450 [minor] 46 — Still open. "4 waiting" sits on the left umbrella's canopy, and the poles still cross the diners → draw the poles behind the diners and move the pill onto the sill.
- D477 [minor] 05b2 — New. With the drawer open, the goal reads "Upgrade fleet to Cars · +$83…". The "/s" of the payoff is cut, and in r2 the same goal fit → give this goal a short form too ("Cars · +$83/s"), as G98 did for mastery.
- D476 [minor] 06 — New. The scrapbook teaser now wraps to two lines with "pies" alone on the second ("…7,072 more Suburbs / pies"). In 55 the same line just fits on one; it is right at the 365 pt edge, so it will always wrap on an SE → shorter copy: "Next: Dale, in 7,072 Suburbs pies", or fit the text to its width the way the HUD's rate line now is.
- D462 [minor] 64b (same, carried) — "2× 1h0m" → "2× income · 1 h", and empty-shelf art below the list.
DESIGN NOTES:
- D465 [minor] 62 — Still "Rush: 30m left" on 2 lines before the rush has started. event-chip.tsx is unchanged → "Rush in 30m", on 1 line.
FUN AND RETENTION:
- D478 [minor] 61, 41 — The win now lands: the card flips open at the centre, Dale's toast shows "+$75.7T · +15 diamonds", and the coins and cheer are emitted (recipe-reveal.tsx). But the 220 pt card sits right over the kitchen, so the cheering cooks it triggers are hidden behind it. Monopoly GO! puts the reward card above the board, and the board celebrates around it → anchor the card in the sky band (top ≈ 200 pt) so the kitchen and the cheer stay visible under it.
- [ok] First 60 s: the coach card points at the prep table (03, 04), and the dashed Ovens card says what it needs. There is always something to tap: green cards, the gift, rush and the ×1/MAX chip. Reasons to come back: the attack's "2d 21h left", ★10/18 → Flagship: Waterfront, the gift's 0/5, and the Friday Night Rush timer. The return still pays out of the oven with a count-up and coins (07, 53).
FIXED SINCE LAST REVIEW: G95, G98, G101, G102, G103, D469, D459, D470, D472, D474
STILL OPEN FROM LAST REVIEW: D471 (narrowed), D450, D462, D465
```

Opened at full size: 62b (the dusk tint and the overlapping vans) and 72 (Nonna, her tag and the cashier). Code checked: the ca8455a diffs of `recipe-reveal.tsx` (flip, coins, cheer), `banner-state.ts` (the gift waits while the banner is open), `fit-model.ts` and `game-ui.tsx` (the cash, rate and price fitting), `goal-model.ts` (the short goal line), `layout.ts` and `ladder.ts` (secondVehicleShift and its fallback to 24), `cameo.ts` and `people.tsx` (the shawl and the scale), `event-props.tsx` (the dusk opacities) and `scrapbook.tsx`.

Verified in the pixels: 65 shows "$8.42T" and "$42.1B/s citywide" whole. In 14, 36, 67, 68 and 13 the prices are whole, and in 65 and 70 "EXPAND · Double" fits. 59 has no gift over the banner, and 62 shows "★10/18 · Flagship: Waterfront" beside the event chip. 61 shows the won state. 70 shows the bark "Nobody touches the oven door but me!". 69's plate reads "MASTER" whole, and 62b's sky is lavender dusk.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| D471 | minor | S | 13, 41, 56, 59, 61, 62, 70 / ladder.ts | Flagship fallback still overlaps vans; second vehicle beyond the A-frame, or draw one only |
| D475 | minor | S | 72 / scene/cameo.ts | Tag "6d 4h" covers cashier's face; centre on Nonna, "Nonna · 6d 4h"; grey walk-ins away |
| D450 | minor | S | 46 | Waiting pill on umbrella; poles cross diners; poles behind diners, pill onto sill |
| D477 | minor | U | 05b2 / goal-model.ts | "Upgrade fleet to Cars · +$83…" clips payoff; short form "Cars · +$83/s" |
| D476 | minor | U | 06 / app/scrapbook.tsx | Teaser wraps, orphan "pies"; shorter copy or fit text to width |
| D462 | minor | U | 64b / app/shop.tsx | "2× 1h0m" → "2× income · 1 h"; empty-shelf art below list |
| D465 | minor | U | 62 / event-chip.tsx | Pre-event chip says "30m left" on 2 lines; "Rush in 30m", one line |
| D478 | minor | U | 61, 41 / endgame/recipe-reveal.tsx | Reveal card hides the cheering kitchen; anchor card in the sky band, top ≈ 200 pt |

Next IDs: G104, D479
