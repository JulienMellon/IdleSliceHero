# Review v5.20-r2 (critic, medium re-check)

VERDICT: NOT SATISFIED (gate only: no majors or bugs left, but four visual minors are open, limit three)
SUMMARY: The tutorial now lights one thing per step with the rest gray, the dial's ring and count pill sit inside the cut-out, and the card never covers its target. Majors D520-D522 are closed. The hand and card placement polish plus two old shop-art minors keep the minor count above the gate.

report.json: loaded true, errors [] (no blockers, no bugs). Opened half-size review shots only (153, 161, 162, 163, 164, 165, 166, 167, 168, 169); no full-size shot opened.

## Focus checks
- One lit thing per step: step 1 prep table only (153); step 2 prep table plus its dial, joined by a dotted gold leader (161); step 4 oven plus its dial (162); step 6 cash only (163); step 10 Ovens button only (165); step 11 oven plus dial (166); step 12 All only (167); step 13 Marco's row only (168); step 15 prep table plus dial (169). Everything else is gray. Pairing a station with its own dial is the lesson, so it counts as one thing.
- Dial dials inside the lit area: yes. Ring, number pill and (step 15) the head chip are all inside the hole (G112, D524 fixed).
- Card never covers target: true on every shot. It sits at the bottom, or at the top for the cash step.
- Script for a first-time idle player: clear. "The dial is the timer. The number? How many pies are inside." "Full means ready." "Every pizza you sell becomes money." "Ecco, you have enough. Tap Ovens to make the oven faster." "Tap All. Every upgrade in the shop lives in there." Short, concrete, one idea each. Step 1 wraps "cara / mia" onto a second line with one orphan word (cosmetic).
- Step 11 (Julien's decision on D521/D522): the oven shows a gold "Lv 2" plaque with a green "+50%" chip and Nonna says "Feel that heat? The oven bakes faster now. Watch the dial." The gain is visible. The drawer no longer says "no gain now" (168: Ovens Lv 2 "1.0/s", plain cost). Ovens step stays.

## BUGS
none

## VISUAL DESIGN
- D531 [minor] 161, 162, 166: the pointing hand sits on the dial's count pill and half covers the number Nonna names ("4", "0"). Draw the hand beside the dial (right of the pill, 8 pt clear), never over a digit. Folded with D525 as one rule: the hand never covers a number or another control.
- D525 [minor] 167: the hand sits on the Drivers "$7" cost while the target is All. Put the hand above All, or left of it clear of Drivers. 166 and 169 now fine.
- D526 [minor] 165: the card covers the dining room and floor (y 610-670) when the street band below the buttons is free. Dock it at the street band when it fits.
- Step 11 (166): the cook's head is clipped by the bottom edge of the oven hole. Extend the hole 10 pt down to include the cook. [minor, rolled into D531's pass]
- D481, D519 [minor] unchanged (shots 76, 79, 13 are carried, not re-judged).

## DESIGN NOTES
- D528 [minor] 161 and 162 and 166: the goal bar still reads "hire Marco (prep) $0/$400" while Nonna teaches the dial and the oven. Show her current goal in the bar for steps 1-11.
- D530 [minor] 169: graduation is still a bare line. No ribbon or gift.
- D493, D495: parked by Julien.

## FUN AND RETENTION
- First 60 s [minor]: step 9 (164) is good. It says "Save $12 for a faster oven" while the Ovens button shows "need $8", so the next goal is clear. Still, the first 20 s ends at $0 (D495, parked).
- Step 15 now closes on a 4 s look and a goal of "hire Lucia (ovens) $800" in the bar, so a reason to come back is visible. Monopoly GO! would pay a gift at this moment (D530).

## Status of open IDs
- G112 fixed (161, 162, 169: the dial and its count pill are inside the cut-out).
- D520 fixed: step 15 has no hand and the dial is lit; hand placement is now D531.
- D521 closed per Julien: label gone, step 11 shows the gain.
- D522 fixed: Lv 2 plaque, +50% chip and the dial are lit in 166. Flash itself not checked in a still.
- D523 fixed (dial "ready" hand gone in 153, 161, 162; it still shows on the free step 164, which is right).
- D524 fixed (dotted leaders in 161, 162, 166, 169).
- D527 fixed in code (storefront.tsx 538 gates barks on hintsAllowed).
- D529 fixed (LOOK_MS 4000).
- Still open: D525, D526, D528, D530, D531 (new), D481, D519, D493, D495.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| D531 | minor | U | 161, 162, 166 / coach/overlay-model.ts | Hand beside the dial pill, never over a digit; extend step-11 oven hole to include the cook's head |
| D525 | minor | U | 167 / coach/overlay-model.ts | Narrow targets: hand above, never over another control (Drivers "$7" under the hand for All) |
| D526 | minor | U | 165 / coach/overlay-model.ts | Dock the card at the street band when it fits, not over the dining room |
| D528 | minor | U | 161, 162, 166 / goal-model | During steps 1-11 the goal bar shows Nonna's goal, not "hire Marco $400" |
| D530 | minor | E | 169 / engine/tutorial.ts | Tutorial graduation: "Chapter 1 done" ribbon plus Nonna's golden pizza gift |
| D481 | minor | S | 76, 13, 156 / street rival band | Shop is a 40 pt corner sprite cut by the screen bottom; draw at about 60 pt with shutters |
| D519 | minor | S | 79, 13 / wide shop overflow | Suburbs and flagship cutaways clip at screen edges; scale to about 0.9x or centre with 12 pt margin |
| D493 | minor | E | 05 / layers pacing | Parked by Julien. Session 1 meets every layer at once; open the rival after Suburbs 2 stars |
| D495 | minor | E | 04, 148 / tuning | Parked by Julien. First 20 s ends at $0; step 14 asks $400 at about $0.6/s; first goal under $50 |

Next IDs: G113, D532
