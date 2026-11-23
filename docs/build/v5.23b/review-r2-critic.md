VERDICT: SATISFIED
SUMMARY: report.json is clean (loaded true, errors [], cash $12). The rival store now sits on the kerb with a side face and plinth, and the 221b moment shows coins and the flash. Three minor visual notes remain (D571, D519, D572), all late-game or rare-state polish.

Review set: 64 changed, 9 noted, 172 same. Opened full size: 211 (crop of the rival band) and 214 (crop of the door). Compared against prev: 211, 05. Also viewed 221b, 137, 69.

BLOCKERS:
- none
BUGS:
- none
VISUAL DESIGN:
- D571 [minor, carried] [214, pixel-identical to r1] The walk-out customer still stands on the WELCOME mat and covers "OME", and he smiles. The code now has DOOR_SPOT_GAP and a protected test for a 6 pt gap (walkout.ts, protected.test.ts), but the pixels did not change, so the fix is not visible. Either the fixture frame is taken at another point of the walk, or the gap is measured against the wrong rect. → Re-shoot 214 at the turn pause. If he is still on the mat, measure the gap against the drawn mat, not matRect. Show a "cross" mood while he stands.
- D519 [minor, carried] [211, 213, 25-look-suburbs; same shots] Wide shops are still cut at the screen edge (tables, diners) with no scroll cue. → 24 pt chevron tab with a 0.6-opacity fade on the cut edge.
- D572 [minor, improved] [211, 05, 79; 211 crop opened] The rival store is now on the near kerb, below the lane, with a darker right face, a plinth and a shadow. That part is fixed. The purple MEGASLICE van still drives behind the store's sign and roof in the same frame, so the word reads twice ("MEGASLICE" on the sign and on the van roof, 211, 05). → Keep the van out of the lane segment above the store while the store is up, or draw the store 8 pt lower.
DESIGN NOTES:
- D573 [minor, carried] [187, 214 same] Strip says "Missed 0/min · Tips up" while a customer walks out. → Count walk-outs as missed, or drop "Tips up" while a walk-out plays.
- D564 [minor, carried, E] [64b same] "$1.04Qa" unreadable.
- D570 [minor, carried, N] [206 same] The paid Starter still makes a value claim. needs-owner.
FUN AND RETENTION:
- [minor] Beating the rival removes the store completely (carried from r1; 178i, 220d changed only in the Suburbs frame). Monopoly GO! leaves the trophy on the board. → Keep a shuttered store with a "CLOSED · Rosa's won" card for the session.
- [minor] 221b is now shot mid-moment: the gold gift, coins and sparkles show over the shop and the line "Not one missed, cara. Like the old days." sits in the strip. Balatro would still make the "perfect" moment louder than a strip line. → Raise the line as a 1.2 s banner over the shop before docking it into the strip.
- Return and next goal are unchanged and healthy (07, 05). D493 and D495 are parked and not raised.
FIXED SINCE LAST REVIEW: D556 (221b shows coins, flash and sparkles mid-moment; the cashier cheer is not visible, folded into the banner note above)
STILL OPEN FROM LAST REVIEW: D571, D519, D572 (reduced), D573, D564, D570; parked D493, D495

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| D571 | minor | S | 214 / scene/walkout.ts spotOf | Pixels unchanged: customer still on the mat; re-shoot at the turn pause, measure against the drawn mat, add "cross" mood |
| D519 | minor | U | 211, 213, 25-look-suburbs / scroll-cues.tsx | Wide shops cut at the edge with no cue; 24 pt chevron and edge fade |
| D572 | minor | S | 211, 05 / rival-scene.tsx | Store is on the kerb now; the van still drives behind its sign and reads "MEGASLICE" twice; keep the van out of that segment |
| D573 | minor | U | 187, 214 / report-model.ts | Strip reads "Missed 0/min · Tips up" during a walk-out; count walk-outs as missed |
| D564 | minor | E | 64b / engine/format.ts | "$1.04Qa" unreadable; words past T |
| D570 | minor | N | 206 / store-model.ts productChips | Paid Starter value claim; use "Double income for a full day". needs-owner |
| D493 | parked | E | 05 / layers pacing | Parked by Julien. Open the rival after Suburbs 2 stars |
| D495 | parked | E | 04, 148 / tuning | Parked by Julien. Step 14 asks $400 at about $0.6/s |

Next IDs: G123, D574
