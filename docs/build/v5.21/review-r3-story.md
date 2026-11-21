# v5.21 story review, round 3 (medium re-check)

Scope: `docs/story/COPY-v5.21.md` (new: `chapter.buildLocked`), `copy/home/chapters.ts`, `cities/home/chapters.ts`, `tutorial.ts`, `downtown.ts:45`, and shots 175d, 178e, 178f, 178k, 179d, 179e, 180, 180b.

VERDICT: NOT SATISFIED
SUMMARY: The new "Finish Chapter {n} first" lock text is clear and in tone, and S78 is fixed: the Pier 9 bar now lists "Serve 50K pies in Waterfront" first. The verdict stays NOT SATISFIED because five minors are open (S48, S67, S70, S71, S87), and S87 is now worse: the goal bar reads "Ch 12 · Win the", a sentence cut off mid-phrase.

HOOKS:
- none. The 24 teasers are unchanged and still tease without spoiling. In shot 180b, "Coming up · Chapter 9 · Old Salt" shows the next chapter's title, which is safe.

STORY & PACING:
- S78 [fixed] `cities/home/chapters.ts:41` is now `waterfront-4 [serve, bid, hire]`, and shot 175d shows "Serve 50K pies in Waterfront" as task 1.
- S89 [minor, new] Shot 175d: the Story list says task 1 (Serve 50K, 901/50K) is unfinished, yet the goal bar shows the bid task ("Ch 12 · Win the"). The `chapterGoal` doc comment promises "the bar and the list never disagree". If this is a fixture quirk, ignore it. If `nextTask` really skips an unfinished serve task, the bar sends the player to an auction that hasn't opened. → Check that `nextTask` returns the first unfinished task in list order.

PLAYER COMMUNICATION:
- `chapter.buildLocked` "Finish Chapter {n} first" [ok]: shot 180 shows "University · Chapter 10" on the map and "Finish Chapter 10 first" in the row, and 180b shows the "+ University Chapter 10" chip. It is short, jargon-free and says what to do next. The next row down, "Build the previous pizzeria first", is a different kind of lock and reads fine beside it.
- S87 [minor, still open, worse] Shot 175d: "Ch 12 · Win the". `shortTask` strips "Pier 9 auction" along with the shop name. The engine already reads `task.kind.<kind>.short` (goal-model.ts:273) and only `win.short` exists, so no copy fix has landed. → Add `'task.kind.bid.short': 'Pier 9 auction'` to `copy/home/chapters.ts` and to COPY-v5.21.md section 3. It is a copy line, so the owner is T, not U.
- S88 [minor, still open] Shot 179d (unchanged): "Ch 1 · Serve" is dark text on the brown fill and hard to read. → Light text on the fill, or a cream label chip.
- S70 [minor, still open] `tutorial.12` is still "Tap All. Every upgrade in the shop lives in there." Step 13 then sends the player to hire Marco from the same drawer. → "Tap All. Every upgrade and every hire lives in there."
- S71 [minor, still open] `downtown.ts:45` is still "Fine. First you bake. Tap the kitchen, one batch each tap. Tap, tap, tap!" The tutorial's step 1 taps the prep table, not "the kitchen". → "Fine. First you bake. I show you how. Watch, then tap!"

VOICE & COMEDY:
- No new notes. The 179e Nonna line "See? Marco rolls on his own now. You bake and serve. Bravo!" is in voice.

PROTECT:
- `downtown-2.teaser` "Nonna Rosa hears a sound the shop has not made in years."
- `industrial-4.teaser` "Big Sal has something to say. He hates saying things."
- `industrial-3.teaser` "Big Sal hates it more than Thursdays."
- `university-2.teaser` "Priya said she was writing it down. She meant it."
- `downtown-3.teaser` "...Smiling." The punchline is the last word.
- `waterfront-3b` p4 "Bid from your Waterfront shop when the cash is in. All hands!"
- Chapter titles that hide the scene titles that would spoil: "The Foreman", "Grand Opening", "Priya's Answer", "The Championship".
- `chapter.done` "Every chapter done. Victor is waiting in Boston."

FIXED SINCE LAST REVIEW: S78.
STILL OPEN FROM LAST REVIEW: S48, S67 (carried), S70, S71, S87 (worse), S88.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer or explain it in the info sheet; Julien's call. Carried |
| S67 | minor | T | cities/boston/scenes/north-end.ts boston-0 p1 | Backdrop `shop` vs script `downtown`; use `downtown` or update the script. Carried |
| S70 | minor | T | copy/home/tutorial.ts tutorial.12 | "Tap All. Every upgrade and every hire lives in there." |
| S71 | minor | T | cities/home/scenes/downtown.ts:45 downtown-1 p3 | "Fine. First you bake. I show you how. Watch, then tap!" |
| S87 | minor | T | copy/home/chapters.ts, shot 175d "Ch 12 · Win the" | Add `task.kind.bid.short`: "Pier 9 auction"; bar currently ends mid-phrase |
| S88 | minor | U | goal bar, shot 179d | "Ch 1 · Serve" is dark text on the brown fill; use light text or a label chip |
| S89 | minor | E | goal-model.ts nextTask, shot 175d | Bar shows the bid task while list task 1 (serve 50K) is unfinished; return first unfinished task |

Next IDs: S90
