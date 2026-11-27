# v5.24-r2 critique (medium re-check)

VERDICT: NOT SATISFIED
SUMMARY: The blockers from r1 are gone: Featured only sells Downtown pieces, the scooter clears the status strip, and the pack counts differ. Eleven minors are still open, which is over the three-minor gate, and the chime, the marble and the flourish still do not read at phone size.

report.json: loaded true, errors [], no failed interactions.

Shots opened (half size review set): 227, 227b, 227c, 231, 195, 206b, 208b, 222, 223, 224, 225, 226, 228, 229, 230. Cropped from full size: 231, 223, 230, 229, 224, 228, 225 (2x crops for detail).

## Check first
- D574 FIXED. 227 Featured shows only Downtown pieces (front 400, awning 150, menu 60, apron 60), tagged "Rosa's classic · shows in Downtown". The other tabs list University and Industrial sets only under their own hood headings. The only prices are 60, 150 and 400. "This week's picks" has no timer or "limited" word.
- D582 FIXED (Featured tiles say where they show). D583 FIXED (227b half set "2/4 pieces", 227c all owned "4/4 pieces" plus the Nonna and Deb lines).
- D581 PARTLY FIXED. The checked and striped aprons now read at 1x (225 red check on every cook, 226 blue stripes). The wind and brick chimes are still not readable. In 229 the chime hides behind the OPEN plate and the lintel, and the "x26" pop sits over it. I could not find a wind chime in any shot. Carried into D579.
- D578 FIXED. 223 has a red counter front with a checker lip, and the soda cup and napkins read.
- D577 STILL OPEN. In 230 the Uptown front still reads as white clapboard, with no veins at 1x. No shot scrolls the Shop to the Uptown thumbnail, so I could not check the thumbnail veins.
- C202 FIXED. In 231 the Rosa bubble and confetti show on return from the Shop. It is still small (D585).
- G123 FIXED. 206b/208b now show Box 8, Crate 20, Cart 29 looks. D584 FIXED (the Cart is now a gold mine cart with heaped gems).
- D575 FIXED. The scooter is whole above the strip in 228, 229 and 231. D576 FIXED. 224 has a wooden anchor sign with cream text.

## Focus answers
- Each set reads as its neighbourhood: yes (teal diner, blue dockside, brick, purple dorm, black and white marble). The marble is the weakest, because the front reads as white siding.
- Covers: no look covers a station, a head, a badge or the WELCOME mat. The manager and flourish bubble still covers the menu board (D580): 224 hides most of the menu, 228 hides the whole lower half.
- Prices on the tab: only 60, 150 and 400. Nothing is presented as limited.

## New
None. 227's four featured tiles each show the full "shows in" line, so no gap there.

FIXED SINCE LAST REVIEW: G123, D574, D575, D576, D578, D581, D582, D583, D584, C202
STILL OPEN FROM LAST REVIEW: D577, D579, D580, D585, D586, D571, D519, D572, D573, D564, D570 (D493 and D495 parked)

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| D577 | minor | S | 230 / facade-marble | Reads as white clapboard at 1x; gray veins per panel, gold cornice pinstripe; shoot the Uptown thumbnail |
| D579 | minor | S | 229, 224 / chimeRect | Chime hidden behind OPEN plate and lintel; hang it where it clears the plate, 1.3x, show the wind chime in a shot |
| D580 | minor | S | 228, 224, 231 / storefront bubble y | Manager and flourish bubble covers the menu board; drop the bubble 30 pt |
| D585 | minor | S | 231 / set-flourish.ts | Flourish small, no payoff; ribbon, coins, set crest on the sign |
| D586 | minor | U | 227b / tab strip | Half set invisible outside the tab; "2/4" chip on the hood tab |
| D571 | minor | S | 214 / scene/walkout.ts spotOf | Customer still on the mat; re-shoot at the turn pause, measure against the drawn mat, add "cross" mood |
| D519 | minor | U | 211, 213, 25-look-suburbs / scroll-cues.tsx | Wide shops cut at the edge with no cue; 24 pt chevron and edge fade |
| D572 | minor | S | 211, 05 / rival-scene.tsx | The van drives behind its sign and reads "MEGASLICE" twice; keep the van out of that segment |
| D573 | minor | U | 187, 214 / report-model.ts | Strip reads "Missed 0/min · Tips up" during a walk-out; count walk-outs as missed |
| D564 | minor | E | 64b / engine/format.ts | "$1.04Qa" unreadable; words past T |
| D570 | minor | N | 206 / store-model.ts productChips | Paid Starter value claim; use "Double income for a full day". needs-owner |
| D493 | parked | E | 05 / layers pacing | Parked by Julien. Open the rival after Suburbs 2 stars |
| D495 | parked | E | 04, 148 / tuning | Parked by Julien. Step 14 asks $400 at about $0.6/s |

Next IDs: G124, D587
