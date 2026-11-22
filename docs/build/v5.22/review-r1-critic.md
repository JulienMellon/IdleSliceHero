# v5.22 r1 — critic (full)

Review set: 155 changed/new shots, all opened at half size. Full-size crops I opened: 186, 187, 188, 191 (kitchen and pile area), 189 (sidewalk), 137 (front of shop and sidewalk), 143 (kitchen and queue), and the station badges of 130, 135, 186, 187 and 191.
Report: `loaded: true`, no errors, cash $12 after play.

```
VERDICT: NOT SATISFIED
SUMMARY: The pointers are gone (no Bottleneck header, no Buy both, no lamps, no tomato tint), the bars are all basil and the stacking fix holds, so G118 and D543 are closed. But the scene does not show the limit: at phone size a short-ovens kitchen looks the same as a balanced one, and the report's Drivers bar falls short of the customers line in every shop, even the balanced one.
BLOCKERS:
- none
BUGS:
- G119 [182, 183, 184 / report-model.ts, service.ts reportView] The Drivers bar is drawn against the "Customers" line, but customers means deliveries plus walk-ins (game.ts demandRate), so drivers can never reach the line. In 184 "balanced" (Missed 0, Tips up) Drivers 60/min still stops well short of 105. In 183, Drivers 15/min sits under 33 with Missed 0. A player reading "the bar that stops short is the limit" buys drivers forever. → Drop the Drivers bar and draw the Customers row as one stacked bar (deliveries then walk-in seats), whose end is the dashed line. Then only kitchen bars can stop short of it.
VISUAL DESIGN:
- D548 [major] [186 vs 191, 187, 188 / pile-art.tsx, piles.ts] The piles don't read at phone size. The dough stack on the pass is about 16x20 pt and shows 4 discs in balanced 191 against 5 in short-ovens 186: same stand, same spot, same size. In 187 the boxes hide between the cashier and the register; in 188 there is no box pile you can see. The old static prep table (prev 133) showed more dough than the new "pile-up". → Start piles at 1.5 batches so a balanced shop shows none. Draw items at 1.6x. Past 3 items, spill onto the floor (trays leaning on the oven, boxes stacked against the counter front, two bag rows on the shelf). Add a 1.5 s "wobble" on the top item.
- D549 [major] [186, 187, 188, 191 / poses.ts, people.tsx] Poses and idle drivers don't read. The cashier in 186 (supposedly idle) and the cooks in 188 (supposedly swamped) look the same as in balanced 191. A 1-2 degree lean, a yawn mouth on a 3 pt face, and sweat drops are invisible at 1 px = 1 pt. In 187 (short on drivers) there is no driver anywhere in the shop. → Idle: an elbow on the counter, head tilted 12 degrees, and a "z" or phone glyph bubble 14 pt high that stays up the whole time the worker is idle. Swamped: double arm speed and a 10 pt sweat bead beside the head. Idle drivers: always draw them seated on their scooters by the door. *Overcooked*'s stacked dirty plates and its "!" over a burning pan show this better: the problem is visible from across the room.
- D550 [minor] [16 / drawer Drivers card] The amber "Expand · $500" is the loudest button in the drawer, and it points at drivers while prep and ovens (189/min) are the limit. → Draw Expand in the same basil as the other buy buttons, keeping the word "Expand".
- D551 [minor] [189, 178f, 13, 79, 178i / sidewalk cards] The capacity line has three formats: "446 → 486", "63/m → 84", and "→ 116K", where the current value is dropped. Its baseline also touches the button's bottom lip. → Use one format, "446→486" without units. Abbreviate both sides (5.8K→6.2K) rather than dropping one. Raise the line 2 pt.
- D552 [minor] [137, 143 / walkout.ts, waiting.ts] In 137 the walk-out with the frown bubble stands behind the report strip, and only his head shows. In 143 the "50 drivers waiting" line merges with the walk-in queue into one row of people. → Walk the walk-out along the floor above the strip's top edge. Park idle drivers by the door, apart from the order line.
- D553 [minor] [180, every HUD chip row] "no manager" (City list) and "you run it" (chips) are still tomato red, and Waterfront has a gold halo on the map. That is a red word pointing at a purchase. → Ink text, with the halo only on the shop being visited.
DESIGN NOTES:
- D554 [minor] [133, 130 / report-strip.tsx stripKind] The cold line (-10%) and the tip (+10%) are now invisible outside the sheet. In 133 the shop loses 10% and the strip still reads only "Served 126/min · Missed 123/min". `stripKind` is computed but never drawn. → Add a neutral suffix: "· Tips up" or "· Word's spreading".
- D555 [minor] [192-194 / tutorial.report.*] The three steps name the strip, one bar and the line, but never the one inference that matters: "Served can't go past the shortest bar." → Add it to step 3's line. It is a reading rule, not a purchase.
FUN AND RETENTION:
- D556 [minor] [181, 191 / report-strip] Finding and fixing a limit has no payoff. When Missed drops to 0 nothing happens: the strip just changes a number. *Balatro* makes every threshold crossed a little explosion. → When Missed reaches 0 for 10 s, flash the strip basil, add a coin burst and a Nonna line ("Not one missed, cara"). This is the reward for doing the player's job.
- (1) First 60 s: unchanged. Chapter 1 still names its buys, and the hook and first reward hold. No note.
- (2) Something to tap: yes, the sidewalk is always live. But the feel of finding the limit depends on D548/D549. Without them the player reads numbers, not a shop. *Mini Metro*'s overfull stations show the same diagnosis by picture alone.
- (3)(4) Return: 07, 53 and 54 now sit cleanly above the HUD, with the oven fill bar as the reason to come back. That is a gift moment comparable to *AFK Journey*'s chest. No note.
- (5) Goal: the chapter ribbon is always visible. No note.
FIXED SINCE LAST REVIEW: G118, D543, D546, D539
STILL OPEN FROM LAST REVIEW: D547, D544, D545, D542, D535, D537, D538, D540, D481, D519, D493, D495
```

## Focus answers
- **From the scene alone in 10 s:** no. In 186 the only clues are "3 drivers waiting" (a downstream symptom) and one walk-out. The dough pile looks the same as in balanced 191 (D548, D549). The fastest working read is a number match: the sidewalk card whose current value equals "Served" (ovens 126 = Served 126). Nothing teaches that match.
- **From the report alone:** yes for a kitchen limit: the Ovens bar stops short of the dashed line (182). But it is wrong for demand: the Drivers bar is always short (G119).
- **"Buy this" left:** the drawer's amber Expand (D550), and the red "no manager" / "you run it" labels (D553). The report itself is clean: one basil colour, Missed in ink.
- **Piles and poses at phone size:** they don't read (D548, D549).
- **G118 / D543:** fixed. In 51, 53, 54, 07 and 32 the HUD sits under the scrim and "Welcome back!" is fully visible.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| G119 | bug | U | 182-184 / report-model.ts | Drivers bar can never reach the customers line; replace it with a stacked Customers bar (deliveries + seats) ending at the line |
| D548 | major | S | 186 vs 191 / pile-art.tsx, piles.ts | Piles invisible; none when balanced, items 1.6x, spill onto floor past 3, wobble on top item |
| D549 | major | S | 186-188 / poses.ts | Idle and swamped poses unreadable; elbow lean + persistent z/phone bubble, sweat bead, drivers seated on scooters by door |
| D550 | minor | U | 16 / drawer Expand | Amber Expand is the loudest button and points at drivers; draw it basil like other buys |
| D551 | minor | U | 189, 13, 178f / sidewalk cards | One capacity format, abbreviate both sides, never drop the current value; raise line 2 pt |
| D552 | minor | S | 137, 143 / walkout, waiting | Walk-out hidden behind strip; idle drivers merge with walk-in queue |
| D553 | minor | U | 180, chips | "no manager" / "you run it" in red plus gold halo; ink text, no halo |
| D554 | minor | U | 133, 130 / report-strip | Cold line and tips invisible on strip; append "Tips up" / "Word's spreading" |
| D555 | minor | T | 194 / tutorial.report.3 | Add the reading rule: Served can't pass the shortest bar |
| D556 | minor | U | 181 / report-strip | Missed reaching 0 has no payoff; basil flash, coin burst, Nonna line |
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

Next IDs: G120, D557
