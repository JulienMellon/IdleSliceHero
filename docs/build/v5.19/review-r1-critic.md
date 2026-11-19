VERDICT: NOT SATISFIED
SUMMARY: The R1L option C fix lands. The wrench sits on the drawn oven in both mirrored Industrial frames, and the Waterfront rack has moved off the dough baker onto the counter side of the mirrored room. No bugs or majors. The gate still fails on four open visual minors, one of them new (a hard-edged pale box in the night sky, which I saw while checking the tint).

Scope: bug-fix review of the shots R1L moved (145, 86, 86b, 76), each compared with `prev/`. The 00, 24, 104 and 105 changes are seam noise and were skipped. Full-size shots opened: 145 and 76 (to place the wrench and rack against the oven and counter), and 85 (`same`, opened only to confirm that the night tint follows the mirrored room). `report.json`: `errors: []`.

BLOCKERS:
- none

BUGS:
- none

Bug-fix check (option C, `scene/shop-layout.ts`):
- **Wrench, 86 and 86b (Industrial, mirrored, footprint 2).** Before, it was at x≈180 pt, over the menu board's right edge. Now it is at x≈212, centred on the stacked oven column (x 190–235). The jam pill and the "Head Baker fixing… 22s" pill are centred under it and sit inside the viewport. Fixed.
- **Wrench, 145 (Industrial, footprint 4, scrolled wide room).** Before, it was at x≈330, over the second oven's dome and next to the Prep scroll button. Now it is at x≈283 (full-size 565), on the leftmost oven column (full-size 520–610). It keeps about 37 pt clear of the Prep chevron. This is the case the card names, and it is fixed.
- **Rack, 76 (Waterfront, mirrored).** Before, the warming rack was drawn at x≈255–285 on the unmirrored plan, over the dough-tossing baker and the prep table. Now it stands at x≈108–138 (full-size 215–275), against the back wall between the door pillar and the cashier. That is the reflection of "right of the counter, left of the door jamb" in `rackBox`. The baker and the prep table are fully visible again. Fixed.
- **Night tint (85, `same`).** It reads `shopLayout(...).room`. The warm cut-out spans the mirrored room's walls (full-size x≈50–735), so it fits the room that is drawn. See D518 for a separate look issue.
- **Game Day seats and critic stand.** Both use `shopLayout(...).room`. Their hoods (Suburbs, Uptown) use the standard plan, and their shots are pixel-identical to the baseline, which is the expected result. Only home `waterfront` and `industrial` carry `plan: 'mirrored'` (`content/cities/home/data.ts:67, 94`).

VISUAL DESIGN:
- D518 [minor] [85] Night shift: the warm `house` cut-out is a plain rectangle that reaches about 25 pt above the roof peak and about 8 pt past each wall. It leaves a hard-edged, untinted pale box in the navy sky (top edge at y≈240 pt). *Alto's Odyssey* never shows the seam of its time-of-day wash. Fix: cut out the roof and wall silhouette (the same path the storefront draws), or feather the cut-out's edge with a 12 pt radial or linear fade to the tint colour.
- D514 [minor] carried (146 is `same`).
- D481 [minor] carried (MegaSlice store is still on the asphalt in 76).
- D505 [minor] carried (81 is `same`).

DESIGN NOTES:
- D493 [minor] carried.
- D495 [minor] carried.

FUN AND RETENTION:
- No change this round. The build changes no behaviour (a refactor plus an overlay placement fix). D493 and D495 still hold for the first session: the first 20 s end at $0, and session 1 meets every layer at once. *Monopoly GO!* gets its first reward on screen within seconds; the fix is D495's first goal under $50.

FIXED SINCE LAST REVIEW: D512 (145: the jam pill now ends about 15 pt inside the right edge and no longer reaches x 393; `pillBox` clamps it to the visible span)
STILL OPEN FROM LAST REVIEW: D514, D481, D493, D495, D505

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| D518 | minor | U | 85 / shifts/night-tint | Warm cut-out is a hard rectangle above the roof; follow the roof silhouette or feather its edge 12 pt |
| D514 | minor | S | 146 / cold line | Guest half hidden behind the report strip, no cold visual; lift queue, frost tint while cold |
| D481 | minor | S | 13, 76, 05 / layers/rival | MegaSlice store sits on the asphalt, 45 pt; put it on the far kerb at about 60%, shutters visible |
| D493 | minor | E | 05 / layers pacing | Session 1 meets every layer at once; open the rival after Suburbs 2 stars |
| D495 | minor | E | 04, 148 / tuning | First 20 s ends at $0, first goal $400; first goal under $50, pops on first serves |
| D505 | minor | U | 81 / banner vs recipe card | Dale banner covers recipe card title; queue the banner after the card or move it below the goal strip |

Next IDs: G112, D519
