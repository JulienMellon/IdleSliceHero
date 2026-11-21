# v5.21-r2 critic review

VERDICT: NOT SATISFIED
SUMMARY: The five r1 bugs are fixed in the pixels and in code, and the bar now picks the actionable hire before the long serve count. The bar still never shows a purchase (no cost, no cash fill, no "where"), the Story rows give "Go" only on the hire row I could see, and nothing celebrates a finished task. Three majors stay open, so the gate is not met.

report.json: errors [], no page errors, no failed interactions.
Opened (review set, half size): 178, 175, 178d, 179b, 179d, 178c, 21, 148, 116, 106-task-swap, 164, 176, 168, 169. No full-size shots opened.

## Focus: can a first-timer tell what to do and what it unlocks?
- Bar, step 1-3 (179d, 164): "Ch 1 · Serve 4 pies in Downtown 3/4" with a brown fill is clear. Nonna's line under it ("Save $12 for a faster oven") tells the player what to buy; the bar does not.
- Bar, "Hire Marco, head prep cook" (148, 168, 169): it names the person but not the price or where he is sold. In 168 the drawer row says $400 with $0 in hand, and the bar shows no "$0 / $400" and no cash fill. A player cannot tell from the bar whether the goal is near. D532 is still open.
- Story tab (175, 176, 178d): the chapter title, the story line, three task rows with ticks, and "New scene · 💎 5" read well. The reward row says a gem number but not what the chapter unlocks (D538). The "Go" button on the hire row (175) is a real improvement. The serve and rate rows have no Go, which is fine; build, win and bid rows are not in this set, so I could not check them.
- Bar vs list agree in 175, 176 and 178d (Hire Lucia when serve is 212/424; Serve when hire and rate are done; Hold 6/min when the others are done). D533 fixed.
- Chapter 1 (179b): Chapter 1 now shows its own rows and "Next: Chapter 2 · 💎 5" under them. The Nonna toast "This list tells you what comes next" sits below. This works as a hook. The pointing hand covers part of the "Chapter 2" label on the reward row (minor, tutorial only).

## FIXED since r1
- G113 chapter gems are paid: `CHAPTER_DIAMONDS` and the pay-on-scene path exist in `engine/chapters.ts`. Not visible in a shot (the gem counter in 175/176 reads 0 before any beat has played), so code-verified only.
- G114: 179b shows the teaser row "Next: Chapter 2 · 💎 5" for the free chapter.
- G115: migration change is in code; no shot exercises it. Treated as fixed.
- G116: Boston bar reads "Story 18/32" (116).
- G117: no mid-word clipping on 21 ("Ch 12 · Win"), 106 ("Ch 8 · Beat MegaSlice"), 178 ("Ch 2 · Serve 424 pies in Downtown 0/424").
- D533: nextTask returns the first non-serve open task (code and 175/178d).

## BUGS
none new.

## VISUAL DESIGN
- D532 [major] still open. 148, 168, 169, 05: a hire or build goal shows only the words. Fix: show "$12 / $400" in the amount slot and fill the bar by cash / price; keep the chevron on every state (it is there on all bars now).
- D541 [major] still open. 169 (Marco done) and 175/176 (ticks appear silently): no "task done" toast, no tick pop, no chime, no "Chapter N complete" ribbon. Grep finds no chapter-complete UI in `src/`. Fix: a 1.2 s ribbon under the bar, tick scale 0 to 1.2 to 1, 3 coin bursts toward the gem chip.
- D536 [major, narrowed] 175 has "Go" on the hire row only. Confirm build, win and bid rows each get a 44 pt Go that opens the drawer card, map or challenge, with a fixture that shows one.
- D534 [minor] 178c: "Ch 3 · Next scene in 1:29" is correct now (countdown in the amount slot). Closed.
- D535 [minor] still open: the clapper and gem on the reward row are emoji-style glyphs (175, 176), and the lock glyph repeats on the Daily/Weekly tabs and on the locked chips (178, 178d).
- D537 [minor] still open: 175 "33/min · holding 1 s" fills 10% of the bar although 33 is above the target of 6; the ring should read "6/6 · holding".
- D538 [minor] still open: 175 reward row does not name the gameplay unlock.
- D540 [minor] still open: Suburbs chip reads "2K pies to go" while a chapter gates it (175, 178).
- D535b [minor, new, shot 179b] the tutorial hand covers the "Chapter 2" label in the reward row. Offset the hand 24 pt right and below.
- D481, D519 carried (shots not in this set as changed; no new look).

## DESIGN NOTES
- D539 [minor] still open: self-ticking report rows are not hidden in this set.
- D530 [minor] still open: no graduation ribbon after step 15 (169). May ride on D541.
- D493, D495 parked by Julien (168 still shows Hire Marco $400 at $0 cash).

## FUN AND RETENTION
- [major] No reward beat when a task or chapter finishes (D541). Balatro and Monopoly GO! pay out every small goal with a pop and a sound. Fix as above.
- [minor] Return reason is good: 178c shows a countdown on the bar with a badge on the Story button (Monument Valley-style restraint, AFK Journey-style next chapter). The "Next scene in 1:29" is a specific reason to wait.
- [minor] First 60 s hook: Nonna's "I keep a list" spotlight on the bar (148) is a clear first goal; the first reward (5 gems) is shown on the row but not yet paid until the takeover. Say "paid at the takeover" or show it greyed.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| D532 | major | U | 148, 168, 169 / game-ui goal bar | Hire/build show "$12 / $400" with cash fill; chevron on every state |
| D536 | major | U | 175 / rewards-ui Story rows | Confirm 44 pt "Go" on build/win/bid rows opening drawer card, map or challenge; add fixture |
| D541 | major | U | 169, 175 / game-ui, rewards-ui | Task-done toast with tick pop and chime; "Chapter N complete" ribbon |
| D535 | minor | U | 175, 177 / rewards-ui | SVG clapper/gem, "Coming up" card under reward row, one lock glyph on tabs |
| D537 | minor | U | 175 / rewards-model | Rate rows show live rate with hold ring, "6/6 · holding" when over target |
| D538 | minor | U | 175 / rewards-model | Reward row names the gameplay unlock, e.g. "Daily tasks open" on Ch 4 |
| D539 | minor | E | chapters.ts REPORT_READER | Hide self-ticking report rows until v5.22's reader exists |
| D540 | minor | U | 178 / index.tsx chips | Suburbs chip reads "Opens after Ch 4" while a chapter gates it |
| D542 | minor | U | 179b / coach hand | Tutorial hand covers the "Chapter 2" label on the reward row; offset it |
| D530 | minor | E | 169 / engine/tutorial.ts | Graduation ribbon plus Nonna's gift; may ride on D541's chapter ribbon |
| D481 | minor | S | 76, 13, 156 / street rival band | Shop is a 40 pt corner sprite cut by the screen bottom; draw at about 60 pt with shutters |
| D519 | minor | S | 79, 13 / wide shop overflow | Suburbs and flagship cutaways clip at screen edges; scale to about 0.9x or centre with 12 pt margin |
| D493 | minor | E | 05 / layers pacing | Parked by Julien. Session 1 meets every layer at once; open the rival after Suburbs 2 stars |
| D495 | minor | E | 04, 148 / tuning | Parked by Julien. Step 14 asks $400 at about $0.6/s; 20 s now ends at $12 |

Next IDs: G118, D543
