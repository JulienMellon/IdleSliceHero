# v5.21-r3 critique

report.json: errors empty. Shots opened (all half size from the review set): 180, 180b, 178e, 178f, 178g, 178h, 178h2, 178i, 175, 175b, 175c, 179b, 179e, 32, 53, 54, 51 plus prev/32.
Open shots not re-checked: 175d, 178j, 175b-d beyond what is above (the Go rows read the same in 175b/175c).

VERDICT: NOT SATISFIED

## BLOCKERS
none.

## BUGS
- G118 [51, 53, 54, 32 / game-ui `hud` zIndex 2] The HUD now sits above sheets and scrims. In 53 and 54 the "Welcome back!" title of the night-oven sheet is cut off under the red header (only the bottom half of the letters shows). In 32 and 51 the header stays bright while the scene and chips row are dimmed (prev/32 had the header dimmed). Taps on the header probably get past the scrim too: the r3 commit lifted only the coach overlay (`coachLayer` zIndex 3, index.tsx:578). Expected: every full-screen sheet (gift calendar, night oven, offline, streak save) rides above the HUD, or the HUD drops back under them. Give the ribbon its own layer instead of raising the whole HUD.

## VISUAL DESIGN
- D543 [major] = G118 seen from the player's side: a clipped, half-hidden title on the first "return" sheet (53, 54), the shot that sells the comeback gift. Same fix.
- D544 [minor] 178f: the "Chapter 3 complete" ribbon sits over the shop-chip row and hides the "1.27K pies to go" chip for its whole life. Fine as a 1.2 s toast; make sure it fades by 1.5 s. 178e also has the tick badge crowding the "Ch 2" label ("Ch" then a gap).
- D545 [minor] 179b: Chapter 1 "The Keys" has no story line or portrait under its title (175, 175b, 175c all have one). Add Nonna's line for consistency.
- D542 [minor] still open: 179b, the hand still sits on the "Chapter 2" label in the reward row.
- D535 [minor] still open: 175 clapper is still an emoji-style glyph, and the lock glyph still repeats on tabs and chips.
- D537 [minor] still open: 175 "33/min · holding 1 s" fills about 10% of the bar above a target of 6.
- D538 [minor, narrowed] "Coming up · Chapter 3 · Corporate Crust" now sits under the reward row (175, 175b), but the row still does not name the gameplay unlock.
- D540 [minor] still open: 175, 179b show "2K pies to go" on the Suburbs chip while a chapter gates it. Compare 178h, where the chip correctly says "Build $270K".
- D481, D519 carried (shots 76, 13 are `noted`, no new look).

## DESIGN NOTES
- D546 [minor] 180 and 180b: the lock line names the wrong chapter for the player. University reads "Finish Chapter 10 first" while the bar and the Story tab it opens show Chapter 8 (Beat MegaSlice). The fixture state is contrived (Waterfront is built early), but the line should name the chapter the player is on, or say "Finish Chapters 8-10 first". The tap-to-Story works: 180b opens the list with Go on the first row.
- D547 [minor] 178i: Go on "Beat MegaSlice in Suburbs" lands on the shop with no pointer to the rival challenge. A glow on the rival band would finish the job.
- D539, D530 carried. D530 is largely met by 179e "Chapter 1 complete" plus Marco's line. Treated as fixed.
- D493, D495 parked by Julien.

## Focus: what to do next and what it unlocks
- Yes for the bar. 178g reads "Ch 2 · Hire Lucia, head baker  $12 / $800", and 178h reads "Ch 5 · Build Suburbs  $270K / $270K" with the lot chip turned green: the bar names the person or the shop, the price and the progress. Build rows (175b, 178h) have a Go that opens the city, where Suburbs shows "Build $270K" (178h2).
- The Story tab always names what to buy or beat, and the "Coming up · Chapter N · title" line gives the next chapter. It still does not say what the chapter unlocks (D538) beyond 5 gems.
- E1b lock: the map row says "Finish Chapter 10 first" with a lock glyph, and a tap opens the Story tab. A first-timer can see why. D546 is the chapter-number wording.

## FUN AND RETENTION
- [minor] D541 closed: 178e (task toast "Hire Lucia, head baker" with a tick on the bar) and 178f/179e ("Chapter N complete" ribbon) now pay off each goal. Balatro-style pop and chime cannot be judged from a still. Add the tick scale-pop if absent.
- [minor] Return moment (53 and 54) is a gift-sized number (+$8.43M, coins over the oven), but the clipped title (G118) undercuts it. Fix G118 first.
- [minor] First 60 s: 148/168 show a priced first goal ("$12 / $800") and Nonna's list spotlight (179b). Good hook.

## FIXED SINCE LAST REVIEW
D532 (178g, 178h: "$12 / $800" in the amount slot with cash fill), D536 (Go on build, win and bid rows, 175b, 175c, 178h, 178i), D541 (178e toast, 178f ribbon, 179e ribbon), D530 (179e), D534 (closed in r2).

## STILL OPEN FROM LAST REVIEW
D535, D537, D538, D539, D540, D542, D481, D519, D493, D495.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| G118 | bug | U | 51, 53, 54, 32 / game-ui hud zIndex 2, index.tsx | HUD covers sheet titles and escapes the scrim; put sheets above the HUD or give the ribbon its own layer |
| D543 | major | U | 53, 54 / night-oven "Welcome back" sheet | Title clipped under the HUD; same fix as G118 |
| D546 | minor | E | 180, 180b / chapter.buildLocked | Lock line names Chapter 10 while the Story tab shows Chapter 8; name the current chapter |
| D547 | minor | U | 178i / Go on win row | Glow the rival challenge band after Go on a "Beat" row |
| D544 | minor | U | 178e, 178f / goal ribbon | Ribbon hides the shop chips; keep it under 1.5 s; tick badge crowds "Ch 2" |
| D545 | minor | T | 179b / Chapter 1 card | Add Nonna's story line and portrait under "The Keys" |
| D542 | minor | U | 179b / coach hand | Tutorial hand covers the "Chapter 2" label; offset it 24 pt |
| D535 | minor | U | 175 / rewards-ui | SVG clapper/gem, one lock glyph on tabs |
| D537 | minor | U | 175 / rewards-model | Rate rows show "6/6 · holding" with a full ring when over target |
| D538 | minor | U | 175 / rewards-model | Reward row names the gameplay unlock, e.g. "Daily tasks open" |
| D539 | minor | E | chapters.ts REPORT_READER | Hide self-ticking report rows until the reader exists |
| D540 | minor | U | 175, 179b / index.tsx chips | Suburbs chip reads "Opens after Ch 4" while a chapter gates it |
| D481 | minor | S | 76, 13, 156 / street rival band | Draw the shop at about 60 pt with shutters |
| D519 | minor | S | 79, 13 / wide shop overflow | Scale wide cutaways to about 0.9x or add 12 pt margins |
| D493 | minor | E | 05 / layers pacing | Parked by Julien. Open the rival after Suburbs 2 stars |
| D495 | minor | E | 04, 148 / tuning | Parked by Julien. Step 14 asks $400 at about $0.6/s |

Next IDs: G119, D548
