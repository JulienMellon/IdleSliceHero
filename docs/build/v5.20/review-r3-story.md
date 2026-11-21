# v5.20 story review, round 3 (medium re-check)

Scope: `docs/story/COPY-v5.20.md`, `src/content/copy/home/tutorial.ts`, `src/content/cities/home/scenes/downtown.ts` and the changed tutorial shots in `screenshots/v5.20-r3/review/` (160-169). Nothing was edited except this file.

VERDICT: NOT SATISFIED
SUMMARY: The copy is unchanged since r2, so it is still in Nonna's voice, one instruction per line, with nothing over 65 characters. S70 and S71 are both still open as one-line edits, and one new minor (S73) is a goal-bar label that disagrees with the tutorial. Five minors are open, over the limit of three.

Checks:
- Lengths: no tutorial line changed. The longest is `tutorial.alt.13` at 65 characters, so nothing is over 70.
- One instruction per line: unchanged and correct.
- Voice: no drift. At most one Italian word per line, no jargon.
- `tutorial.ts` still matches the COPY doc line for line, including `tutorial.12`.

STILL OPEN:
- S70 [minor] `tutorial.12` (shot 167) still reads "Tap All. Every upgrade in the shop lives in there." The goal bar in the same shot says "hire Marco", and the next step is a hire, so "shop" misleads. → "Tap All. Every upgrade and every hire lives in there." (53 characters)
- S71 [minor] `downtown.ts:45` (downtown-1 p3) still says "Fine. First you bake. Tap the kitchen, one batch each tap. Tap, tap, tap!" and `tutorial.1` then says "Tap the prep table". → "Fine. First you bake. I show you how. Watch, then tap!" (54 characters)
- S48, S67: carried, not re-checked.

NEW:
- S73 [minor] Shots 164, 165 and 166 (steps 9 to 11) now show the goal bar as "Story 1/40" with a trophy. In r2 the same steps showed "Downtown: hire Marco (prep)". Step 12 (shot 167) shows "Downtown: hire Marco (prep) $0/$400" again. Step 8 says the list "tells you what comes next", so a bar that says "Story 1/40" at steps 9 to 11 does not match it. → Show the hire-Marco goal from step 9 on, or make step 9 say "Keep baking. Save {cost} for a faster oven. Marco comes next." Owner U for the goal choice. If "Story 1/40" is the intended opener, say so and close this note.
- For the writer's information only: the "lit target" column for `tutorial.11` still says "both ovens", but shot 166 shows one oven at Lv 2 (+50%). The line itself ("Feel that heat? The oven bakes faster now. Watch the dial.") is correct.

PROTECT:
- `tutorial.14` "Keep baking. {marco} won't hire himself."
- `tutorial.6` "Look! Every pizza you sell becomes money. Is how we eat."
- `tutorial.alt.9` "Ay! You spent the oven money. Save {cost} again for the upgrade."
- `tutorial.15` "See? {marco} rolls on his own now. You bake and serve. Bravo!"

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer ("Mudhens Night") or explain it in the info sheet; Julien's call. Carried |
| S67 | minor | T | cities/boston/scenes/north-end.ts boston-0 p1 | Backdrop `shop` vs script `downtown`; use `downtown` or update the script to `shop`. Carried |
| S70 | minor | T | COPY-v5.20.md / copy/home/tutorial.ts tutorial.12, shot 167 | "Tap All. Every upgrade and every hire lives in there." ("shop" reads as the Store) |
| S71 | minor | T | cities/home/scenes/downtown.ts:45 downtown-1 p3 | "Tap the kitchen" clashes with tutorial.1 "Tap the prep table"; use "Fine. First you bake. I show you how. Watch, then tap!" |
| S73 | minor | U | goal bar, shots 164-166 | Bar reads "Story 1/40" at steps 9-11, "hire Marco" at step 12; show hire Marco from step 9 or confirm the opener |

Next IDs: S74
