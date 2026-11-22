VERDICT: NOT SATISFIED
SUMMARY: D569 and D567 are fixed in pixels; the report is clean (loaded, no errors, no failed interactions). The Starter still carries the "≈ $58.5M at your shop's pace" value claim (D570, needs-owner), and 20 older minors are carried, so the gate stays closed.

Opened (half size): 206, 206b, 207, 208, 208b, 81 (+ prev of 206b, 81), 104. No full-size shots opened.

## Focus questions
- Every price the store's own string? Yes. $2.99, $4.99, $0.99, $4.99, $9.99 all come from `prices?.[id]`; loading says "Loading…", failure says "Price unavailable" (store-model.ts productRows). No placeholder price.
- "worth", "value", "save", struck-through price, countdown, "limited"? None on any card in 206, 206b, 207, 208, 208b. The only near-miss is the Starter's boost chip "≈ $58.5M at your shop's pace" (D570, still open).
- "Best rate" true by diamonds per dollar? Yes, and now worded to be true. 206b: Crate first buy pays 2,400 for $9.99 = 240/$, Box 1,000/$4.99 = 200/$, Pinch 160/$0.99 = 162/$, so "Best diamond-pack rate" on the Crate is right. 208b (firsts used): Crate 1,200/$9.99 = 120/$, below the Starter's 400/$2.99 = 134/$, so the Starter says "Most diamonds per dollar in the store" and no pack carries a tag. The two claims can no longer contradict (D569 fixed). Both come from the store's own numbers (`amounts`), and the claim goes null when any price is missing.
- "Not now" as big as Buy? Yes. Same full-width, same height, outlined white button directly under the green $2.99 (206, 208).
- Find the pack again after "Not now"? "Not now" closes the Shop (`onClose`). The Store tab still lists the Starter until it is bought (`productRows` only hides it when owned), and r2 confirmed the Store chip and tab nudge as the one-tap way back. Not re-shot this round (no new shot of the chip). Fine.

## BUGS
- none

## VISUAL DESIGN
- D570 [minor, still open, needs-owner] 206 / store-model.ts productChips, copy `store.chip.boost`: "≈ $58.5M at your shop's pace" is a value claim and an estimate. Replace with `store.chip.boost.plain` text ("Double income for a full day"), or keep it only if the owner accepts a projected figure. The "2× · 24 h" title already says it all.
- D569 fixed: Crate tag reads "Best diamond-pack rate", and Starter and pack tags are mutually exclusive in code.
- D567 fixed: 81 now shows the shop after the Act 4 beat (recipe card "The Right Net" over the Suburbs shop), not the cut-scene.
- Changed shots 00, 04, 09, 10, 11, 12, 24, 25-*, 104, 105 differ by under 0.4 percent from prev (animation phase noise); no new defect seen in 104. Not individually re-judged.

## DESIGN NOTES
- Carried, unchanged: D564, D557, D550, D551, D552, D553, D554, D556, D547, D544, D545, D542, D535, D537, D538, D540, D481, D519 (all on `same` or `noted` shots; not re-checked). D562 toast overlap carried. D493 and D495 are parked by Julien.

## FUN AND RETENTION
- [minor] The Store reads honestly and warmly (Nonna's quote, "pays double: N" lines). Monopoly GO! shouts its value stack more; this restraint suits the brief. Nothing new this round.
- [minor] 81 shows a "New recipe" card and a "A gift, caro. Tap it!" prompt stacked at the top of the shop: a clear return hook. Carried: D493, D495.

FIXED SINCE LAST REVIEW: D569, D567
STILL OPEN FROM LAST REVIEW: D570, D562, D564, D557, D550, D551, D552, D553, D554, D556, D547, D544, D545, D542, D535, D537, D538, D540, D481, D519, D493, D495

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| D570 | minor | N | 206 / store-model.ts productChips | Paid Starter shows "≈ $58.5M at your pace", a value claim; use "Double income for a full day". needs-owner |
| D562 | minor | U | 178e / toast | Toast overlaps the tab row; keep it clear of the tabs |
| D564 | minor | E | 64b / engine/format.ts | "$1.04Qa" unreadable; words past T |
| D557 | minor | S | 186 vs 191 / pile-art.tsx | Dough stack on stand identical when balanced; hide or shrink to 2 discs when balanced |
| D550 | minor | U | 16 / drawer Expand | Amber Expand is the loudest button and points at drivers; draw it basil like other buys |
| D551 | minor | U | 189, 13, 178f / sidewalk cards | One capacity format, abbreviate both sides, never drop the current value; raise line 2 pt |
| D552 | minor | S | 137, 143 / walkout, waiting | Walk-out hidden behind strip; idle drivers merge with walk-in queue |
| D553 | minor | U | 180, chips | "no manager" / "you run it" in red plus gold halo; ink text, no halo |
| D554 | minor | U | 133, 130 / report-strip | Cold line invisible on strip; append "Word's spreading" |
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

Next IDs: G123, D571
