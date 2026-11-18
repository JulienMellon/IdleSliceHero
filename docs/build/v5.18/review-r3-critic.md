VERDICT: NOT SATISFIED
SUMMARY: Three r2 notes are fixed in pixels (franchise layout, North End cloud, rush-queue drivers). Six minors remain open, two of them (D493, D495) hit a player in the first session, so the gate of three minors is not met.

Shots opened: review set only (107, 109, 113, 143, 145, 146 and prev/107). No full-size shots needed.

BLOCKERS:
- none (report.json loaded:false and no layout.json are expected for the --only 106_t2/140_v2 run; errors is empty)

BUGS:
- none

VISUAL DESIGN:
- D512 [minor] 145: the jam bubble "Oven jammed! Tap the wrench" still ends at x 393, flush with the screen edge and the bubble tail is cut off. Clamp bubbles inside the viewport with a 12 pt margin.
- D514 [minor] 146: the guest at the door is still half hidden behind the report strip, and nothing shows the "cold" state apart from the strip text. Lift the queue above the strip and add a pale blue frost tint to the queue while cold.
- D481 [minor, carried] MegaSlice store sits on the asphalt (not in this review set).
- D506 [fixed] 107: the block is now centred, with the star, 10, recipe card and Boston card in the middle of the frame. Flat red remains top and bottom but reads as a deliberate title card.
- D510 [fixed] 109: clouds are now clean circle unions, with no rectangle and no stray dot (113 sky hidden behind the building, fine).
- D513 [fixed] 143: queue drivers now vary in cap colour (red, blue, teal), skin and hair. Mild repetition of the pizza-logo uniform is fine.

DESIGN NOTES:
- D493 [minor, carried] Session 1 meets every layer at once; open the rival after Suburbs 2 stars.
- D495 [minor, carried] First 20 s ends at $0 with a first goal of $400. The goal should be under $50, with pops on the first serves.
- D505 [minor, carried] The Dale banner covers the recipe-card title (81, not in this review set).

FUN AND RETENTION:
- D495 [major-leaning, carried as minor by owner triage] The first 60 seconds still lack a fast first reward. Balatro and Monopoly GO! pay out within the first few taps. Make the first goal about $40 and fire a pop and chime on the first three serves.
- 143/145/146: the gift crate ("A gift, caro. Tap it!") and the Captain Marisol offer give clear return hooks. The goal strip is always visible.

FIXED SINCE LAST REVIEW: D506, D510, D513
STILL OPEN FROM LAST REVIEW: D512, D514, D481, D493, D495, D505

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| D512 | minor | S | 145 / scene bubbles | Jam bubble still touches x 393 and tail is cut; clamp bubbles inside the viewport, 12 pt margin |
| D514 | minor | S | 146 / cold line | Guest half hidden behind the report strip, no cold visual; lift queue, frost tint while cold |
| D481 | minor | S | 13, 76, 05 / layers/rival | MegaSlice store sits on the asphalt, 45 pt; put it on the far kerb at about 60%, shutters visible |
| D493 | minor | E | 05 / layers pacing | Session 1 meets every layer at once; open the rival after Suburbs 2 stars |
| D495 | minor | E | 04, 148 / tuning | First 20 s ends at $0, first goal $400; first goal under $50, pops on first serves |
| D505 | minor | U | 81 / banner vs recipe card | Dale banner covers recipe card title; queue the banner after the card or move it below the goal strip |

Next IDs: G112, D518
