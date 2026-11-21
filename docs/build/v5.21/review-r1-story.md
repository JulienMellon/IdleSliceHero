# v5.21 story review, round 1 (medium)

Scope: `docs/story/COPY-v5.21.md` (titles, teasers, task labels, goal-bar lines), checked against the 24 scenes in `src/content/cities/home/scenes/*.ts`, `docs/build/v5.21/chapters.md` (sim minutes) and the review shots 21, 78, 79, 164-168, 175, 176, 179b, 179c. Nothing else was edited.

VERDICT: NOT SATISFIED
SUMMARY: The teasers do what the card asks: 22 of 24 name a character and a situation, tease the scene without giving it away, and none gives away the Sal/Rosa or Smith/Todd reveals. The biggest risk sits around the copy, not in it: Marisol still tells the player to bid from the goal bar, which v5.21 took away, and the first Story card the player ever sees (tutorial step 8) recaps a scene they have already watched and offers it as a "New scene".

HOOKS: (teasers that must carry the long waits, ranked by wait)
- S83 [minor] `chapter.uptown-4.teaser` "Genevieve's review is out, and all of Port Marinara is reading it." This teaser is on screen for about 32 hours of play (2,518 to 4,438 min), the longest wait in the city, and uptown-3b then says "The night before the review." → "Genevieve's review drops tomorrow. Victor bet a yacht on it." (60 characters. It calls back the bribe and leaves "rental" as the payoff.)
- S84 [minor] `chapter.university-1.teaser` "Finals week. A student named Priya is counting her change." It carries the 560-minute gap after waterfront-4, which ends on Victor's "I'll buy their brains instead." Tie it to that threat. → "Finals week. Victor wants brains. Priya just wants a cheap slice." (65)
- S85 [minor] `chapter.done` "Every chapter done. The city is yours." This closes the loop at the point where players are most likely to stop. → "Every chapter done. Victor is waiting in Boston." (48)

STORY & PACING:
- S78 [minor] Waterfront chapter 4 opens when waterfront-3 plays (217 min), but the auction only opens with waterfront-3b at 50,000 Waterfront pies. Until then the bar asks for "Win the auction for the dock", which the player can't act on, and no task tracks the 50,000. → Add task 1 "Serve 50,000 pies in Waterfront" before the bid.
- S86 [minor] Shots 164-168 (steps 9-13) show "Ch 2 · Serve 424 pies in Downtown" even though Chapter 1's "Hire Marco, head prep cook" (shot 179c) isn't done, and step 13 is that very hire. → Keep Ch 1 current until Marco is hired, or confirm the fixture skips it.

PLAYER COMMUNICATION:
- S74 [major] `waterfront-3b` p4, Marisol: "Tap the bid on your goal bar when the cash is in." Card U1 took the bid out of the bar, and a tap there now opens the task list (shot 21). The bid lives in the Waterfront drawer (shot 78). → "Bid from your Waterfront shop when the cash is in. All hands!"
- S75 [major] Chapter 1 card (shots 179b, 179c, tutorial step 8): the reward row reads "New scene · 💎 5", but downtown-1 already played at launch. Step 8's bubble says "This list tells you what comes next." → For Ch 1, show "Next: Chapter 2 · 💎 5".
- S76 [minor] `chapter.downtown-1.teaser` "Rain, one oven, zero customers. Nonna Rosa has had enough." This sums up a scene the player has just watched. It is the first teaser anyone sees, so it should point forward. → "The keys are yours. Nonna Rosa wants to see what you do with them." (66)
- S77 [minor] `task.waterfront-4.1` "Win the auction for the dock" gets cut off in shot 21 ("Ch 12 · Win the auction for t"), and "dock" doesn't match the banner and the bid card, which both say "Pier 9". → "Win the Pier 9 auction" (22)
- S79 [minor] `task.*.win` / `task.kind.win` "Beat the rival in {shop}". The short form shows only "Ch 8 · Beat the rival" (shots 78, 79), and "rival" is jargon. The rival is always MegaSlice. → "Beat MegaSlice in {shop}" (short form "Beat MegaSlice")
- S80 [minor] `task.*.rate` "Serve {target}/min in {shop}". The task counts only if the rate is held for 30 s, and the label doesn't say so. Shot 176 shows "Serve 6/min ... 0/6". → "Hold {target}/min in {shop}" (28 at most)

VOICE & COMEDY:
- S81 [minor] `chapter.uptown-2.teaser` "Genevieve is back. Purely for research, she insists." This copies the scene's first caption word for word, so panel 1 lands as a rerun. → "Genevieve gave you one star. She just ordered again." (52). `suburbs-3` comes close to the same problem ("...noticed." vs "Someone has noticed."), but it can stay.
- S82 [minor] `chapter.industrial-3.teaser` "Something new turned up in the break rooms. Big Sal is not happy." Sal is never happy, so the line tells the player nothing. → "Something new in the break rooms. Sal hates it more than Thursdays." (67, a callback to industrial-1 and industrial-4)

PROTECT:
- `downtown-2.teaser` "Nonna Rosa hears a sound the shop has not made in years." It pays off on "I thought it was broken since 1997."
- `industrial-4.teaser` "Big Sal has something to say. He hates saying things."
- `university-2.teaser` "Priya said she was writing it down. She meant it."
- `waterfront-2.teaser` "Captain Marisol has a story she won't tell."
- `downtown-3.teaser` "...Smiling." The punchline is the last word.
- The chapter titles hide the scene titles that would spoil: "The Foreman" (not "Brother Sal"), "Grand Opening" (not "One Star"), "Priya's Answer" (not "Drone Launch"), "The Championship" (not "Mudhens Rise").

FIXED SINCE LAST REVIEW: S73. The bar now shows the chapter task, not "Story 1/40". The new ordering issue is S86.
STILL OPEN FROM LAST REVIEW: S70 (`tutorial.12` unchanged), S71 (`downtown.ts:45` "Tap the kitchen" unchanged), S48 and S67 (carried, not re-checked).

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer or explain it in the info sheet; Julien's call. Carried |
| S67 | minor | T | cities/boston/scenes/north-end.ts boston-0 p1 | Backdrop `shop` vs script `downtown`; use `downtown` or update the script. Carried |
| S70 | minor | T | copy/home/tutorial.ts tutorial.12, shot 167 | "Tap All. Every upgrade and every hire lives in there." |
| S71 | minor | T | cities/home/scenes/downtown.ts:45 downtown-1 p3 | "Fine. First you bake. I show you how. Watch, then tap!" |
| S74 | major | T | cities/home/scenes/waterfront.ts:196 waterfront-3b p4 | Bid left the goal bar in v5.21: "Bid from your Waterfront shop when the cash is in. All hands!" |
| S75 | major | U | rewards-ui.tsx Ch 1 card, shots 179b/179c | Ch 1's scene already played; reward row "Next: Chapter 2 · 💎 5", not "New scene · 💎 5" |
| S76 | minor | T | COPY-v5.21 chapter.downtown-1.teaser | Points back, not forward: "The keys are yours. Nonna Rosa wants to see what you do with them." |
| S77 | minor | T | COPY-v5.21 task.waterfront-4.1, shot 21 | Truncated and "dock" vs "Pier 9": "Win the Pier 9 auction" |
| S78 | minor | E | content/cities/home/chapters.ts waterfront-4 | Bid task shows before the auction opens; add "Serve 50,000 pies in Waterfront" as task 1 |
| S79 | minor | T | COPY-v5.21 task.*.win, task.kind.win, shots 78/79 | "Beat MegaSlice in {shop}" (short form "Beat MegaSlice"), not "Beat the rival" |
| S80 | minor | T | COPY-v5.21 task.*.rate, shot 176 | Rate must be held 30 s: "Hold {target}/min in {shop}" |
| S81 | minor | T | COPY-v5.21 chapter.uptown-2.teaser | Copies the scene's caption; "Genevieve gave you one star. She just ordered again." |
| S82 | minor | T | COPY-v5.21 chapter.industrial-3.teaser | "Something new in the break rooms. Sal hates it more than Thursdays." |
| S83 | minor | T | COPY-v5.21 chapter.uptown-4.teaser | 32 h wait, contradicts 3b: "Genevieve's review drops tomorrow. Victor bet a yacht on it." |
| S84 | minor | T | COPY-v5.21 chapter.university-1.teaser | 560 min wait: "Finals week. Victor wants brains. Priya just wants a cheap slice." |
| S85 | minor | T | COPY-v5.21 chapter.done | Pull forward: "Every chapter done. Victor is waiting in Boston." |
| S86 | minor | E | chapters / tutorial, shots 164-168 | Bar shows Ch 2 at steps 9-13 while Ch 1 "Hire Marco" is undone; keep Ch 1 current or confirm fixture |

Next IDs: S87
