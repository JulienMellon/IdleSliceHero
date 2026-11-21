# Review v5.20-r3 (critic, medium re-check)

VERDICT: SATISFIED
SUMMARY: Every tutorial step lights one thing (or a station with its own dial) and grays the rest, the dial Nonna names is always inside the cut-out, and the card never covers its target. The r2 hand and card placement notes (D525, D526, D531) and the goal-bar note (D528) are fixed, which leaves two visual minors, both old shop-art notes.

report.json: loaded true, errors [] (no blockers, no bugs). Opened half-size review shots only (153, 155, 161, 162, 164, 165, 166, 167, 169); no full-size shot opened. 76, 79, 13 and 156 are `noted` with unchanged pixels and carried, not re-judged.

## Focus checks
- One lit thing per step: 153 prep table only; 161 prep table plus its dial (dotted gold leader); 162 oven plus its dial; 165 and 155 Ovens button only; 166 oven (Lv 2, +50%) plus dial; 167 All only; 169 prep table plus dial and head chip. Everything else is gray.
- Dials Nonna names are inside the lit area: yes (161, 162, 166, 169). The count pill digit ("4") is clear in 161 and 162. The hand now sits up and left of the pill (D531 fixed).
- Card covers its target: never. It docks in the street band at the bottom on every shot, so the dining room is free in 165 (D526 fixed).
- 167: the hand is above All, clear of the Drivers "$7" (D525 fixed). In 165 and 155 the hand overlaps the lower border of the Ovens button, but not its "$12" cost. Acceptable.
- Script for someone who has never played an idle game: clear. "First, the dough. Tap the prep table." "See the dial? It fills while the dough rolls. Full means ready." "The dial is the timer. The number? How many pies are inside." "Ecco, you have enough. Tap Ovens to make the oven faster." "Tap All. Every upgrade in the shop lives in there." Short, concrete, one idea each. Step 1 still wraps "cara / mia" onto a second line (cosmetic only).
- D528: the bar shows "Story 1/40" for steps 1-11 (153 to 166). It no longer shows a purchase that competes with Nonna. The "hire Marco" goal returns at step 12 (167), as intended (code comment in src/app/index.tsx 363).
- Step 11 (166): the cook's head and hat are now visible inside the hole. The earlier clip is gone.

## BUGS
none

## VISUAL DESIGN
- D481 [minor] carried (76, 13, 156): rival shop is a 40 pt corner sprite cut by the screen bottom.
- D519 [minor] carried (79, 13): wide shop cutaways clip at the screen edges.
- Nothing new on the changed shots (03, 03b, 04, 148, 158-160, 164; settings, rewards and task shots show only small diffs).

## DESIGN NOTES
- D530 [minor] 169: graduation is still a bare line ("Bravo!"). No ribbon or gift.
- D493, D495: parked by Julien.

## FUN AND RETENTION
- First 60 s [minor]: step 9 (164) says "Save $12 for a faster oven" while Ovens shows "need $8", so the next goal is clear. The first 20 s still ends near $0 (D495, parked).
- Return moment [minor]: 169 ends on "hire Lucia (ovens) $0/$800" in the bar plus locked chips, so a goal is visible. Monopoly GO! would pay a gift at this beat (D530).

## Status of open IDs
- Fixed: D531, D525, D526, D528.
- Still open: D530, D481, D519, D493, D495.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| D530 | minor | E | 169 / engine/tutorial.ts | Tutorial graduation: "Chapter 1 done" ribbon plus Nonna's golden pizza gift |
| D481 | minor | S | 76, 13, 156 / street rival band | Shop is a 40 pt corner sprite cut by the screen bottom; draw at about 60 pt with shutters |
| D519 | minor | S | 79, 13 / wide shop overflow | Suburbs and flagship cutaways clip at screen edges; scale to about 0.9x or centre with 12 pt margin |
| D493 | minor | E | 05 / layers pacing | Parked by Julien. Session 1 meets every layer at once; open the rival after Suburbs 2 stars |
| D495 | minor | E | 04, 148 / tuning | Parked by Julien. First 20 s ends at $0; step 14 asks $400 at about $0.6/s; first goal under $50 |

Next IDs: G113, D532
