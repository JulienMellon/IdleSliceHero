# v5.16 story review, round 3 (medium re-check)

VERDICT: SATISFIED
SUMMARY: Every open ID from r2 is closed in source, including the one major (S47). The story still pulls forward, and the Todd-script rewrites are in. One new minor: the Suburbs layer keeps the name "Game Day" next to the renamed "Mudhens Playoff Rush", so two Sunday-football things share a word.

HOOKS: no new notes. The beat-4 closers from r2 (Dale on Todd, Big Sal on the mustache kid, Priya's tabs) are unchanged and still pull forward.

STORY & PACING:
- S47 fixed. downtown.ts:156 reads "Two thousand deliveries. Before lunch. Downtown smells like Rosa's again." (trigger 2217). Julien's decision applied. This also closes S38.
- downtown-2 "Four hundred" against 424 is fine.
- D493 carried as is, per Julien. No note.

PLAYER COMMUNICATION:
- S23 fixed. copy.ts:49 "MegaSlice attacks this week! Out-sell them to win."
- S24 fixed. copy.ts:62 ends "Now I sit down. On the bus. To Boston."
- S33 fixed. offline-model.ts:32 ships "No manager, so your head cooks kept the shop at half speed." and the row note reads " (half speed)". Shot 07 is a managed shop, so the line is not visible there. It is covered by the offline-model test.
- S44 mostly fixed. The rush is "Mudhens Playoff Rush!" and its chip "Playoffs in {time}". See S48 for what is left.
- S22 fixed. events.ts:25 offers an event only once its opener's shop is built.
- S21 fixed. recipes-model.ts shows name "???" and an empty line for locked cards, so the Pier 9 and review twists stay hidden.
- S48 [minor] layer-copy.ts:6-8 still says "Game Day! Fill every seat!" and the chip "Game Day {time}". The Playoff Rush (Sunday 13:00) is a different feature with a different name, and a player will see both in the Suburbs. → Keep one word per feature. Rename the layer "Mudhens Night" (banner "Mudhens Night! Fill every seat!", chip "Mudhens {time}"), or leave it and say so in the layer's info sheet. The layer is built on the "after each Mudhens game" story, so "Game Day" may be intended. Julien's call.

VOICE & COMEDY:
- Noor (shot 138): "Hi. I've timed your line since the day you opened. Don't worry. It's anonymous." The line is dry and in voice, and it keeps the stopwatch gag. Nothing to change.
- No other voice or comedy changes this round.

PROTECT:
- Victor's misnaming run, ending "You said it right. Took you seven tries."
- The "TODD · ROSA'S" name-tag ladder.
- "Your mustache kid came by. Says he's off to Uptown. Wouldn't say as what."
- "I brought a list. It has tabs."
- "Now I sit down. On the bus. To Boston."
- Noor: "Don't worry. It's anonymous."

FIXED SINCE LAST REVIEW: S21, S22, S23, S24, S33, S38, S44 (main part), S47.
STILL OPEN FROM LAST REVIEW: none (S48 is new).

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer ("Mudhens Night") or explain it in the info sheet; Julien's call |

Next IDs: S49
