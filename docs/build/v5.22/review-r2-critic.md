VERDICT: SATISFIED
SUMMARY: The r2 build fixes the Shop Report model bug (G119) and makes the kitchen state visible on the floor (piles, phone and z bubbles, seated scooter drivers). report.json is clean (no errors). What remains is minor polish. Reviewed at half size, plus full-size crops of 186, 188 and 191 for the character and pile detail.

## Verdicts asked for
- **G119 FIXED.** 182, 183 and 184 now show a stacked Customers bar that ends at the dashed "Customers N/min" line. In 183 the Customers bar is short (33/min), the dashed line sits at its end, and the header line reads "Drivers 15/min · Seats 18/min". The Drivers bar no longer has to overshoot. It is honest and readable.
- **D548 FIXED (downgraded to carried minor D557).** In 186 (short ovens) the dough stack sits on its stand and flour sacks spill on the floor beside the prep table. In 188 (short counter) the boxes pile up on the counter. Both show the state at phone size. The dough stack in 186 still matches balanced 191, so "none when balanced" was not done.
- **D549 FIXED.** 186 shows the counter staff with phone and "z" bubbles. The angry walk-out bubble is above the door. The drivers sit seated on scooters by the door with "8 drivers waiting". The state reads without the report. I did not see an elbow lean or sweat bead, which is fine.
- **G118 FIXED.** In 07 and in 183 and 182 the HUD sits under the scrim, "Welcome back!" is fully visible, and the progress bar is clear.
- **D543 FIXED.** Same shots as G118. The popup clears the HUD with no overlap.
- **D556 STILL OPEN [minor].** In 184 and 191 the strip reads "Served 105/min · Missed 0/min · Tips up", with no flash, coin burst or Nonna line when Missed reaches 0. `src/components/report/report-strip.tsx` has no animation or sound code. A static pass only shows plain text.

## Bugs
None new.

## Visual design
- D557 [minor, carried from the D548 split, shot 186 vs 191] The dough stack on the stand is identical when balanced and when short. Hide it or shrink it to 2 discs when balanced.
- D551, D552, D553 are carried from the earlier round. They still show in the changed shots (the red "you run it" chip is still visible in the 183 HUD and 191). The sidewalk labels in 189 and 191 now fit (U4 label fit visible), so I consider the clip part of D551 resolved.
- No new [major] notes.

## Design notes
- D550 and D554 carried. 183's report strip "Served 33/min · Missed 0/min · Tips up" now carries "Tips up" (D554 is half done, since the cold line remains to check). I left it open.

## Fun and retention
- (1) Hook and first reward: unchanged from r1. No note.
- (2) Tap feel: "Tap to rush!" bubble is visible in 191. No note.
- (3)(4) Return: 07 is a clean gift moment with the oven bar. No note.
- (5) Goal: the chapter ribbon is always visible ("Ch 8 · Beat MegaSlice in Suburbs"). No note.
- D556 [minor] Missed 0 payoff, as above. *Monopoly GO!* celebrates every zero-fail tick with a burst and sound.

FIXED SINCE LAST REVIEW: G119, D548, D549, G118, D543
STILL OPEN FROM LAST REVIEW: D556, D550, D551, D552, D553, D554, D555, D547, D544, D545, D542, D535, D537, D538, D540, D481, D519, D493, D495

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| D557 | minor | S | 186 vs 191 / pile-art.tsx | Dough stack on stand identical when balanced; hide or shrink to 2 discs when balanced |
| D550 | minor | U | 16 / drawer Expand | Amber Expand is the loudest button and points at drivers; draw it basil like other buys |
| D551 | minor | U | 189, 13, 178f / sidewalk cards | One capacity format, abbreviate both sides, never drop the current value; raise line 2 pt |
| D552 | minor | S | 137, 143 / walkout, waiting | Walk-out hidden behind strip; idle drivers merge with walk-in queue |
| D553 | minor | U | 180, chips | "no manager" / "you run it" in red plus gold halo; ink text, no halo |
| D554 | minor | U | 133, 130 / report-strip | Cold line invisible on strip; append "Word's spreading" |
| D555 | minor | T | 194 / tutorial.report.3 | Add the reading rule: Served can't pass the shortest bar |
| D556 | minor | U | 181, 184 / report-strip.tsx | Missed reaching 0 has no payoff; basil flash, coin burst, Nonna line |
| D547 | minor | U | 178i / Go on win row | Glow the rival challenge band after Go on a "Beat" row |
| D544 | minor | U | 178e, 178f / goal ribbon | Ribbon hides the shop chips; keep it under 1.5 s; tick badge crowds "Ch 2" |
| D545 | minor | T | 179b / Chapter 1 card | Add Nonna's story line and portrait under "The Keys" |
| D542 | minor | U | 179b / coach hand | Tutorial hand covers the "Chapter 2" label; offset it 24 pt |
| D535 | minor | U | 175 / rewards-ui | SVG clapper/gem, one lock glyph on tabs |
| D537 | minor | U | 175 / rewards-model | Rate rows show "6/6 · holding" with a full ring when over target |
| D538 | minor | U | 175 / rewards-model | Reward row names the gameplay unlock, e.g. "Daily tasks open" |
| D540 | minor | U | 175, 179b / index.tsx chips | Suburbs chip reads "Opens after Ch 4" while a chapter gates it |
| D481 | minor | S | 76, 13, 156 / street rival band | Draw the shop at about 60 pt with shutters |
| D519 | minor | S | 79, 13 / wide shop overflow | Scale wide cutaways to about 0.9x or add 12 pt margins |
| D493 | minor | E | 05 / layers pacing | Parked by Julien. Open the rival after Suburbs 2 stars |
| D495 | minor | E | 04, 148 / tuning | Parked by Julien. Step 14 asks $400 at about $0.6/s |

Next IDs: G120, D558
