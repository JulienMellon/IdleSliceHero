VERDICT: SATISFIED
SUMMARY: r2 closes D518 (feathered tint) and, in the pixels, D514 and D505. The rival shop now sits on a pavement band but is still a small corner sprite, and wide shops (Suburbs, Industrial flagship) overflow the screen edges. Report is clean (`loaded: true`, no errors).

Opened (full size): 76, 85 (pixel-sampled the tint edge), 79. Half size: 13, 81, 146, prev/85, prev/79. Boston shots 108 to 117 are `same`, so there is nothing new to judge for the bug-override removal. Carry any earlier Boston notes forward unchanged.

BLOCKERS: none
BUGS: none

VISUAL DESIGN:
- D518 FIXED (85). Pixel samples show the warm cut-out now ramps from (129,136,149) to (222,209,189) over about 10 pt at the sides and 12 pt at the top. The hard edge is gone. It still reads as a pale box above the roof, but that is now a glow, not a rectangle.
- D514 FIXED (146). The guest sits fully visible above the report strip. The strip says "Cold service, cold pizza! -10% until we fix it. Bake!" and the Ovens button is green and pulsing. No frost tint, but the cold state is clear without one.
- D505 FIXED (81). The "NEW RECIPE: The Right Net" card title is fully visible and no Dale banner covers it.
- D481 [minor] PARTLY FIXED (76, 13). MegaSlice is off the asphalt and on a new pavement band, but the band is cut by the screen bottom. The shop is about 70 x 40 pt in the bottom-left corner, with no shutters or sign detail, and it is absent from the 79 view because the camera is panned. Fix: draw the shop at about 55 to 60 pt on the band, keep it inside the safe area, and add visible shutters.
- D519 [minor] NEW, carried: it was on screen before and nobody logged it (79, 13). Big-footprint shops overflow the screen: the Suburbs left edge cuts the prep table and the "103" pill, and the Industrial flagship cuts its right-hand tables and ovens. Gestures are tap-only, so the player cannot see the whole shop. Fix: scale the cutaway to fit 393 pt wide at max footprint (about 0.9x), or centre it with a 12 pt margin.

DESIGN NOTES:
- D493 CARRIED (parked by Julien, economy refit): session 1 meets every layer at once.
- D495 CARRIED (parked by Julien, economy refit): first 20 s ends at $0 (04, 148) and the first goal is $400.

FUN AND RETENTION:
- [minor] The "A gift, caro. Tap it!" gift box and its 0/5 pips are always on screen in the home shots. That is a good always-tappable hook, like Monopoly GO!'s ever-present sticker or gift pickups. Nothing new this round and no regression.
- [minor] Night shift (85) shows a "Night x2 4:57" timer, a gift box and a "Hire Finn" goal at once. The return reasons are clear. Balatro would punch the x2 with a pulse. The x2 badge on the sign is already good.

FIXED SINCE LAST REVIEW: D518, D514, D505
STILL OPEN FROM LAST REVIEW: D481 (reduced scope), D493 (parked), D495 (parked)

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| D481 | minor | S | 76, 13 / street rival band | Pavement band is right, but the shop is a 40 pt corner sprite cut by the screen bottom; draw at about 60 pt with shutters |
| D519 | minor | S | 79, 13 / wide shop overflow | Suburbs and flagship cutaways clip at screen edges with no pan; scale to about 0.9x or centre with a 12 pt margin |
| D493 | minor | E | 05 / layers pacing | Parked by Julien. Session 1 meets every layer at once; open the rival after Suburbs 2 stars |
| D495 | minor | E | 04, 148 / tuning | Parked by Julien. First 20 s ends at $0, first goal $400; first goal under $50, pops on first serves |

Next IDs: G112, D520
