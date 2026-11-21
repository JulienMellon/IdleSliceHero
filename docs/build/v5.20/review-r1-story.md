# v5.20 story review, round 1 (low effort)

Scope: `docs/story/COPY-v5.20.md` (card W1) against `docs/build/v5.20/card-W1.md`, the new tutorial shots 160-169 in `screenshots/v5.20/review/`, and Nonna's voice in `downtown.ts` and `CAST.md`. Nothing was edited except this file.

VERDICT: NOT SATISFIED
SUMMARY: Nonna sounds like herself, every line gives one instruction and none is over 70 characters (the longest are `tutorial.alt.13` at 65 and `tutorial.13` at 64 with "Marco" filled in). The one real risk is `tutorial.8`: it promises "a better oven" as the next task, but the goal bar under it reads "Downtown: hire Marco (prep)", so when steps 7-8 ship in v5.21 Nonna and the bar will point at two different things.

Length check (with `{marco}` = Marco, `{cost}` = $12): 1: 47 · 2: 63 · 3: 44 · 4: 60 · 5: 53 · 6: 56 · 7: 48 · 8: 64 · 9: 57 · 10: 53 · 11: 55 · 12: 50 · 13: 64 · 14: 38 · 15: 59 · alt.9: 61 · alt.13: 65. All are under 70. The protected labels ("prep table", "oven", "counter", "Ovens", "All") are used exactly as shown, and no line says "bottleneck".

Accepted deviation, no ID: the card asks for a "second oven" and says that "two ovens bake two at once" (steps 9-11). The build instead shows one oven that goes to Lv 2 (shots 165, 166 and 168: "Ovens Lv 2"). The copy matches the build ("upgrade the oven"), which is the right call. The card text is out of date, not the copy.

HOOKS:
- n/a (tutorial lines, no scene endings in scope).

STORY & PACING:
- S71 [minor] The opening cut-scene (`downtown-1` p3) says "Tap the kitchen, one batch each tap. Tap, tap, tap!", and seconds later `tutorial.1` says "Tap the prep table". Both teach the first tap with different words. → p3: "Fine. First you bake. I show you how. Watch, then tap!" (54). This hands the teaching to the coach lines and keeps the "Tap, tap, tap" energy in `tutorial.1`.

PLAYER COMMUNICATION:
- S68 [major] `tutorial.8` "This list tells you what comes next. First on it: a better oven." In shots 164-166 the goal bar reads "Downtown: hire Marco (prep) $4 / $400" during the oven steps, so the list Nonna just opened shows Marco first, not the oven. → "This list says what comes next. Marco is on it, but first: the oven." (68). Alternatively, owner E can make the goal bar show the oven upgrade during steps 9-10 and keep the current line.
- S69 [minor] Shot 165 (step 10): the goal bar shows a green "▶ … tap!" pill pointing at hiring Marco while the spotlight and Nonna say "Tap Ovens". That gives the player two calls to action on one screen. → Keep the goal bar's "tap!" pill quiet while a coach step is lit.
- S70 [minor] `tutorial.12` "Tap All. Every upgrade in the shop lives in there." Here "shop" can be read as the Store, and the next step points at a hire, not an upgrade. → "Tap All. Every upgrade and every hire lives in there." (53)
- S72 [minor] Shot 168 (step 13): the drawer header reads "Bottleneck: drivers & seats" and the Drivers card has a BOTTLENECK tag, right under Nonna's first drawer line. The card keeps the word out of her mouth, but the UI still says it to a first-session player. → During the tutorial, hide the header line or say "Slowest: drivers & seats".

VOICE & COMEDY:
- No notes. The Italian sprinkles (cara mia, Bella, Ecco, Bravo, Ay!) are spread one per line at most and not on every line, which matches the brief. "Flour and all" calls back to Marco's CAST note ("flour everywhere").

PROTECT:
- `tutorial.14` "Keep baking. Marco won't hire himself." The free-play nudge is a joke and an instruction at once.
- `tutorial.6` "… Is how we eat." This is Nonna's syntax, the same register as "Fifty years I run this shop."
- `tutorial.5` "Hot pizza waits for nobody. Tap the counter to serve!"
- `tutorial.alt.9` "Ay! You spent the oven money." This scolds without punishing.

FIXED SINCE LAST REVIEW: n/a (S48 and S67 were not in scope this round)
STILL OPEN FROM LAST REVIEW: S48, S67 (carried, not re-checked)

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer ("Mudhens Night") or explain it in the info sheet; Julien's call. Carried |
| S67 | minor | T | cities/boston/scenes/north-end.ts boston-0 p1 | Backdrop `shop` vs script `downtown`; use `downtown` or update the script to `shop`. Carried |
| S68 | major | T | COPY-v5.20.md tutorial.8 / shots 164-166 | Line promises the oven next while the goal bar shows "hire Marco"; use "This list says what comes next. Marco is on it, but first: the oven." |
| S69 | minor | U | shot 165 / game-ui.tsx goal bar | Keep the goal bar's green "tap!" pill quiet while a coach step is lit; it competes with "Tap Ovens" |
| S70 | minor | T | COPY-v5.20.md tutorial.12 | "Tap All. Every upgrade and every hire lives in there." ("shop" reads as the Store; step 13 is a hire) |
| S71 | minor | T | downtown.ts downtown-1 p3 | "Tap the kitchen" clashes with tutorial.1 "Tap the prep table"; use "Fine. First you bake. I show you how. Watch, then tap!" |
| S72 | minor | U | shot 168 / heads drawer header | "Bottleneck: drivers & seats" and the BOTTLENECK tag show during step 13; hide them in the tutorial or say "Slowest: drivers & seats" |

Next IDs: S73
