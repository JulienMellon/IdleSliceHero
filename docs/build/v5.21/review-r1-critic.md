VERDICT: NOT SATISFIED
SUMMARY: The chapter bar and the Story tab give a first-time player a goal at all times, and the teasers make the next scene wanted. But the bar usually shows the slow passive count rather than the next action. No task says where to act or what it costs. The 5 💎 the tab promises are never paid, and an updating save or Boston shows the wrong goal.

Shots opened full size: 21-pier9-bid-goal.png (bar clip). Prev compared for 09, 38, 116, 148.

BLOCKERS:
- none (report: loaded, errors [], cash_after_play $12)

BUGS:
- G113 [175, 176, 179b / engine] The Story tab's reward row promises "🎬 New scene · 💎 5", but `CHAPTER_DIAMONDS` is only used in the label. No engine or store code pays it, and none banks it before the takeover → pay 5 💎 when a chapter's beat plays (banked until rewards unlock), as VERSION.md "Defaults" says.
- G114 [179b, 179c / rewards-model storyView] The free Chapter 1 shows the teaser for the opening scene the player has already watched ("Rain, one oven…"), plus "New scene · 💎 5", though the free chapter gates no beat and pays nothing → for a `free` chapter, show "Learn the ropes" and no reward row, or a reward row that names Chapter 2.
- G115 [153–169 / chapters.ts migrateChapters] A v7 save marks the free Chapter 1 done whenever downtown-1 is seen, and downtown-1 is seen at step 1. A player who updates mid-tutorial is shown "Ch 2 · Serve 424 pies" while Nonna says "tap the prep table", and in the drawer while she is hiring Marco (168) → only mark it done when `tutorial` is finished.
- G116 [116 / index.tsx storyGoal] Boston has no chapters, so the bar shows "Story 42/40" (a full bar, over its total) where v5.20 showed a real goal → count the active city's scenes against its own total, or fall back to that city's buy goal.
- G117 [21 / goal-model chapterGoal] "Ch 12 · Win the auction for t" is cut mid-letter. For a yes/no task, `short` and `tiny` are the full label → give yes/no tasks a short form ("Ch 12 · Win the auction") and never clip inside a word.

VISUAL DESIGN:
- D532 [major] [148, 04, 05, 09, 13, 21, 74] A yes/no task makes the bar a blank cream pill: no fill, no amount, nothing that says it can be tapped. In the first minute (148) "Ch 1 · Hire Marco, head prep cook" lost v5.20's "$0 / $400", so a player with $12 cannot see how far away the hire is. Fix: for hire and build tasks, keep the outcome label and show the money as the amount, "$12 / $400", with the fill as cash/cost. Add a 12 pt cream "›" chevron at the right edge of every bar state.
- D534 [minor] [178c] "Ch 3 · Next scene in 1:29" with "Ready" at the right contradicts itself. Show the clock in the amount slot with a 14 pt SVG clapper, and only say "Ready" at 0:00.
- D535 [minor] [175, 176, 177, 179c] The reward row uses emoji 🎬💎 while the header gem is SVG. About 110 pt of empty cream sits under the reward row. The locked Daily tab is a 20 pt padlock in an empty sheet, and its tab draws the lock in a white disc while Weekly's is bare. Fix: use SVG clapper and gem icons, put a greyed "Coming up: Chapter 3 · Corporate Crust" card under the reward row, and draw the same lock glyph on both tabs.

DESIGN NOTES:
- D533 [major] [178, 178b, 38, 156, 153–169] To the focus question, "what do I do next?": `nextTask` takes the first undone task, and task 1 is always the slowest gate. So the bar shows "Serve 424 pies 0/424" while "Hire Lucia" (the thing the player can act on) is hidden. In 38 a player with $5.00K sees "Serve 2.22K pies" where v5.20 said "Hire Marco · tap!". Fix: the bar shows the first undone hire, build, win, bid or rate task before any `serve` gate.
- D536 [major] [175, 178d, 179b] To the focus question, "does a task say what to buy?": no. Story rows have no action. "Hire Lucia, head baker" gives neither price nor place, and "Serve 6/min" does not say which station limits it. In Eatventure a task's "Go" button jumps to the station. Fix: a 44 pt "Go" on undone hire, build, win and bid rows. It closes the sheet, then opens the drawer scrolled to and lit on the head card, the city map's build pin, or the challenge. Rate rows wait for v5.22's pointer.
- D537 [minor] [176, 178d] A rate row shows the best value held for 30 s ("0/6"), even while the shop is selling above the target, and never says "for 30 s". Fix: show the live rate with a hold ring, "34/min · holding 12 s".
- D538 [minor] [175, 178d] The reward row never names the gameplay unlock. Chapter 4 is Nonna's takeover, which opens Daily and Weekly, but the row says "New scene". Fix: add the unlock when a beat carries one, "🎬 New scene · Daily tasks open · 💎 5".
- D539 [minor] [chapters.ts REPORT_READER] "Read the Downtown shop report" ticks itself, so a done task appears that the player never did. Fix: hide `report` rows until v5.22 has the reader.
- D540 [minor] [178, 178b] The bar's "Serve 424 pies" sits right above the Suburbs chip's "2.22K pies to go". Two pie goals with different targets compete. Fix: the chip reads "Opens after Ch 4" while a chapter gates it.

FUN AND RETENTION:
- D541 [major] Finishing a story task is now the core loop, and its whole payoff is a 500 ms bar flash (`GOAL_FLASH_MS`), with no sound, no tick pop and no toast. Monopoly GO slams a sticker and plays a chime at every milestone. Fix: when a task completes, show a 1.2 s toast under the bar ("✓ Hire Lucia"), with the tick scaling 0→1.2→1, a chime, and the Story row's tick drawn as a stroke. When a chapter completes, show a "Chapter 2 complete" ribbon before the scene (this absorbs D530).
- [minor] First 60 s: good. "Serve 1 pie" and "Serve 4 pies" tick within seconds, and step 7 ("I keep a list… Tap it") puts the list in the player's hands. It is diluted by D533 and D532 at the $400 step.
- [minor] Reason to come back: the teasers ("A man in a shiny suit walks into Nonna Rosa's shop. Smiling.") are real cliffhangers, in the storybook spirit of AFK Journey. The countdown bar is a reason to wait. The return moment itself (07) is unchanged.
- Always a new goal visible: yes, everywhere except Boston (G116).

FIXED SINCE LAST REVIEW: n/a
STILL OPEN FROM LAST REVIEW: D530 (169: still no graduation moment; merged into D541's chapter ribbon), D481, D519 (13: the Industrial tables are still cut at the right edge), D493 (parked), D495 (parked; 20 s now ends at $12 and the first goal is "Serve 1 pie", but step 14 still asks $400)

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| G113 | bug | E | 175 / chapters, story | Pay the chapter's 5 💎 when its beat plays (banked before takeover); today nothing pays it |
| G114 | bug | U | 179b / rewards-model storyView | Free Chapter 1: no seen-scene teaser, no "New scene · 💎 5" row |
| G115 | bug | E | 153–169 / chapters.ts migrateChapters | Mark the free chapter done on migration only when the tutorial is finished |
| G116 | bug | U | 116 / index.tsx storyGoal | Boston shows "Story 42/40"; count the active city's scenes, or show its buy goal |
| G117 | bug | U | 21 / goal-model chapterGoal | Yes/no task labels clip mid-letter; give them a short form, never cut inside a word |
| D532 | major | U | 148, 05, 21 / game-ui goal bar | Hire/build show "$12 / $400" with cash fill; chevron on every bar state |
| D533 | major | E | 178, 38 / chapters.ts nextTask | Bar shows the first undone hire/build/win/bid/rate before the serve gate |
| D536 | major | U | 175, 178d / rewards-ui Story rows | 44 pt "Go" on hire/build/win/bid rows that opens the drawer card, map or challenge |
| D541 | major | U | 178, 169 / game-ui, rewards-ui | Task-done toast with tick pop and chime; "Chapter N complete" ribbon |
| D534 | minor | U | 178c / goal-model | Countdown in the amount slot; "Ready" only at 0:00 |
| D535 | minor | U | 175, 177 / rewards-ui | SVG clapper/gem, "Coming up" card under reward row, one lock glyph on tabs |
| D537 | minor | U | 176 / rewards-model | Rate rows show live rate with hold ring, "34/min · holding 12 s" |
| D538 | minor | U | 175 / rewards-model | Reward row names the gameplay unlock, e.g. "Daily tasks open" on Ch 4 |
| D539 | minor | E | chapters.ts REPORT_READER | Hide self-ticking report rows until v5.22's reader exists |
| D540 | minor | U | 178 / index.tsx chips | Suburbs chip reads "Opens after Ch 4" while a chapter gates it |
| D530 | minor | E | 169 / engine/tutorial.ts | Graduation ribbon plus Nonna's gift; may ride on D541's chapter ribbon |
| D481 | minor | S | 76, 13, 156 / street rival band | Shop is a 40 pt corner sprite cut by the screen bottom; draw at about 60 pt with shutters |
| D519 | minor | S | 79, 13 / wide shop overflow | Suburbs and flagship cutaways clip at screen edges; scale to about 0.9x or centre with 12 pt margin |
| D493 | minor | E | 05 / layers pacing | Parked by Julien. Session 1 meets every layer at once; open the rival after Suburbs 2 stars |
| D495 | minor | E | 04, 148 / tuning | Parked by Julien. Step 14 asks $400 at about $0.6/s; 20 s now ends at $12 |

Next IDs: G118, D542
