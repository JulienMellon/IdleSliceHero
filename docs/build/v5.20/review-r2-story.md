# v5.20 story review, round 2 (medium re-check)

Scope: `docs/story/COPY-v5.20.md`, the tutorial shots 160-169 in `screenshots/v5.20-r2/review/` and the previous-round shots in `prev/`. Nothing was edited except this file.

VERDICT: NOT SATISFIED
SUMMARY: The r1 major (S68) and two UI minors (S69, S72) are fixed, and the tutorial copy is in Nonna's voice with one instruction per line and nothing over 70 characters. The verdict stays NOT SATISFIED only on the count rule: four minors are still open (S48, S67, S70, S71), and S70 and S71 are one-line copy edits.

Checks:
- Lengths: the only line that changed is `tutorial.8` ("This list tells you what comes next. Check it any time, cara.", 61 characters). The longest line is still `tutorial.alt.13` at 65, so nothing is over 70.
- One instruction per line: every line gives one. `tutorial.8` now gives only "check it any time", which is right for a step that points at the list.
- Voice: no drift. One Italian word per line at most, no "bottleneck" in Nonna's mouth.

FIXED SINCE LAST REVIEW:
- S68 [was major]: `tutorial.8` no longer promises "a better oven". It matches the goal bar ("Downtown: hire Marco (prep)") in shots 164-166. Fixed.
- S69 [was minor]: shot 165 (step 10) has no green "tap!" pill on the goal bar. The only call to action is "Tap Ovens". Fixed.
- S72 [was minor]: shot 168 (step 13) has no "Bottleneck: drivers & seats" header and no BOTTLENECK tag, unlike `prev/168`. The only text in view is Nonna's line and the Marco row. Fixed.

STILL OPEN:
- S70 [minor] `tutorial.12` (shot 167) still says "Tap All. Every upgrade in the shop lives in there." "Shop" can be read as the Store, and the next step is a hire. → "Tap All. Every upgrade and every hire lives in there." (53 characters)
- S71 [minor] `src/content/cities/home/scenes/downtown.ts:45` (downtown-1 p3) still says "Fine. First you bake. Tap the kitchen, one batch each tap. Tap, tap, tap!" Seconds later `tutorial.1` says "Tap the prep table". → "Fine. First you bake. I show you how. Watch, then tap!" (54 characters)
- S48, S67: carried, not re-checked.

NEW:
- No new notes that need an ID. For the writer's information only, the "lit target" column in the copy table says "both ovens" for `tutorial.11`, but shot 166 shows one oven at Lv 2. This is the doc being out of date, the same accepted deviation as r1. The line itself ("Feel that heat? The oven bakes faster now.") is correct.

PROTECT:
- `tutorial.14` "Keep baking. Marco won't hire himself."
- `tutorial.6` "Look! Every pizza you sell becomes money. Is how we eat."
- `tutorial.alt.9` "Ay! You spent the oven money."
- `tutorial.15` "See? Marco rolls on his own now. You bake and serve. Bravo!" (a clear payoff for the hire step)

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer ("Mudhens Night") or explain it in the info sheet; Julien's call. Carried |
| S67 | minor | T | cities/boston/scenes/north-end.ts boston-0 p1 | Backdrop `shop` vs script `downtown`; use `downtown` or update the script to `shop`. Carried |
| S70 | minor | T | COPY-v5.20.md tutorial.12 / shot 167 | "Tap All. Every upgrade and every hire lives in there." ("shop" reads as the Store; step 13 is a hire) |
| S71 | minor | T | cities/home/scenes/downtown.ts:45 downtown-1 p3 | "Tap the kitchen" clashes with tutorial.1 "Tap the prep table"; use "Fine. First you bake. I show you how. Watch, then tap!" |

Next IDs: S73
