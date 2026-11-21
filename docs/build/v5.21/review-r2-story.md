# v5.21 story review, round 2 (medium re-check)

Scope: `docs/story/COPY-v5.21.md`, `src/content/copy/home/chapters.ts`, `waterfront.ts:196`, `tutorial.ts`, `downtown.ts:45`, `src/content/cities/home/chapters.ts`, and shots 21, 167, 168, 179b, 179d.

VERDICT: NOT SATISFIED
SUMMARY: Both majors are fixed (the bid line now points to the Waterfront shop, and the Chapter 1 card says "Next: Chapter 2 · 5 gems"). All 24 teasers now name a character and a situation and tease without spoiling. The verdict stays NOT SATISFIED only because open minors exceed the allowed three: S70, S71, S78, two carried (S48, S67) and two new ones (S87, S88).

HOOKS:
- none new. S83, S84, S85 are fixed in copy:
  - uptown-4 teaser "Genevieve's review drops tomorrow. Victor bet a yacht on it." (the yacht is set up in uptown-2 and uptown-3 and the "rental" reveal is untouched).
  - university-1 teaser "Finals week. Victor wants brains. Priya just wants a cheap slice." (callback to waterfront-4).
  - `chapter.done` "Every chapter done. Victor is waiting in Boston."
- Teaser spoiler check: no teaser gives away Sal/Rosa, Smith/Todd, the yacht rental or the Llamas twist. `uptown-3` ("Victor Crust invites Genevieve to the top floor of MegaSlice HQ.") restates the title "An Invitation", but it spoils nothing, so it is left alone.

STORY & PACING:
- S78 [minor, still open] `chapters.ts:40` `chapter('waterfront-4', [bid, hire])`. The bid task shows before the auction opens, with no task for the 50,000 pies. → Add task 1 "Serve 50,000 pies in Waterfront".

PLAYER COMMUNICATION:
- S87 [minor, new] Shot 21: the goal bar reads "Ch 12 · Win", the short form of "Win the Pier 9 auction". "Win" alone doesn't say what to win. → The short form for bid tasks is "Pier 9 auction" (key `task.kind.bid.short`).
- S88 [minor, new] Shot 179d: the dark "Ch 1 · Serve" text sits half on the brown progress fill, and its contrast is poor. The "Next: Chap..." text on shot 179b is covered by the tutorial hand, which is probably a fixture issue only. → Use light text on the fill, or draw the fill behind a cream label chip.
- S70 [minor, still open, partly addressed] `tutorial.12` now reads "Tap All. Every upgrade in the shop lives in there." The next step (13) sends the player to the same drawer to hire Marco, and the line doesn't mention hires. → "Tap All. Every upgrade and every hire lives in there."
- S71 [minor, still open] `downtown.ts:45` Nonna Rosa: "Fine. First you bake. Tap the kitchen, one batch each tap. Tap, tap, tap!" Step 1 of the tutorial has the player tap the prep table, not "the kitchen". → "Fine. First you bake. I show you how. Watch, then tap!"

VOICE & COMEDY:
- No new notes. Titles and teasers are in voice (Nonna wry, Sal grumpy, Priya earnest).

PROTECT:
- `downtown-2.teaser` "Nonna Rosa hears a sound the shop has not made in years."
- `industrial-4.teaser` "Big Sal has something to say. He hates saying things."
- `industrial-3.teaser` "Big Sal hates it more than Thursdays." (now paid off by industrial-1 "Then I hate Thursdays.")
- `university-2.teaser` "Priya said she was writing it down. She meant it."
- `downtown-3.teaser` "...Smiling." The punchline is the last word.
- `waterfront-3b` p4: "Bid from your Waterfront shop when the cash is in. All hands!"
- Chapter titles that hide the scene titles that would spoil: "The Foreman", "Grand Opening", "Priya's Answer", "The Championship".

FIXED SINCE LAST REVIEW: S74, S75, S76, S77, S79, S80, S81, S82, S83, S84, S85, S86 (the bar now stays on "Ch 1 · Hire Marco" in shots 167 and 168).
STILL OPEN FROM LAST REVIEW: S48, S67 (carried), S70 (partial), S71, S78.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer or explain it in the info sheet; Julien's call. Carried |
| S67 | minor | T | cities/boston/scenes/north-end.ts boston-0 p1 | Backdrop `shop` vs script `downtown`; use `downtown` or update the script. Carried |
| S70 | minor | T | copy/home/tutorial.ts tutorial.12, shot 167 | "Tap All. Every upgrade and every hire lives in there." |
| S71 | minor | T | cities/home/scenes/downtown.ts:45 downtown-1 p3 | "Fine. First you bake. I show you how. Watch, then tap!" |
| S78 | minor | E | content/cities/home/chapters.ts:40 waterfront-4 | Bid task shows before the auction opens; add "Serve 50,000 pies in Waterfront" as task 1 |
| S87 | minor | U | goal bar short label, shot 21 "Ch 12 · Win" | Short form for the bid task: "Pier 9 auction", not "Win" |
| S88 | minor | U | goal bar, shot 179d | "Ch 1 · Serve" is dark text on the brown fill, low contrast; use light text or a label chip |

Next IDs: S89
