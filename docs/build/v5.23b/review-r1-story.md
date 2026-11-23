# v5.23b-r1 story review (low effort)

Scope: `docs/story/COPY-v5.23b.md` (9 rows), checked against `src/`. I read the copy, `downtown.ts`, `north-end.ts` and grepped for each key. I did not open shots. No cut-scene beat changed, so there are no hook notes.

VERDICT: NOT SATISFIED
SUMMARY: The v5.23b copy is clean and in voice. Nonna says "cara" everywhere now, and every length count checks out (52, 90, 40, 12, 21, 42, 54, 10). Five minors are still open, which is over the three-minor limit. Nothing is major.

HOOKS:
- none. No scene changed. D556 "Not one missed, cara. Like the old days." is a payoff line, not a scene ending.

STORY & PACING:
- S67 [minor] Still open. `north-end.ts:16` boston-0 p1 still uses `panel('shop', ...)`. The caption says "Port Marinara. Every Rosa's has a manager now", so the backdrop should be `downtown`. Change `'shop'` to `'downtown'` on that panel.

PLAYER COMMUNICATION:
- S105 [minor] New. `tutorial.report.3` "Dashed line, cara: my customers. Served never goes past my shortest bar. The rest, I miss." (90 chars) is two sentences longer than the 3-second rule allows. The player also now sees a row called "Hungry crowd" (S98) that is not the dashed line, and Nonna calls the dashed line "my customers". Suggested line: "Dashed line, cara: my customers. Served stops at my shortest bar. The rest, I miss." (82 chars). Keep "stops", the wording from the protected r3 line. Check that the "Hungry crowd" row does not read as the dashed line in the sheet.
- S89 [minor] Carried. Goal bar and task list can name different tasks (r3 shot 175). `goal-model.test.ts:254` still expects the bar "Ch 2 · Hire Lucia". Pick list order or mark the bar's task in the list.
- S97 [minor] Carried. No review fixture shows a symptom bark, manager line or Ox line.
- S48 [minor] Carried (Julien's call). "Game Day" vs the Playoff Rush: one name per feature.

VOICE & COMEDY:
- D545 `Take my keys, cara. Make this place smell like home.` Good. It is Nonna's own warm closing promise, and it echoes the "keys are yours" beat in downtown-1 p2. It is in `src` as `chapter.downtown-1.teaser`, a different key name from the COPY row's `story.ch1.line`. That is harmless, and the code comment explains it.
- S95 `hook.giftLine` and `voice.home.offers.1` now read "cara". "Two minutes. Fast hands!" is a clean Nonna bark.
- S71 "Fine. First you bake. I show you how. Watch, then tap!" It answers the player's "App? Marketing?" with a flat "Fine." and is correct for the tutorial. The next line, "Then hire workers", is still fine.

PROTECT:
- D556 "Not one missed, cara. Like the old days." It pays off the "The rest, I miss." setup.
- D545 "Make this place smell like home."
- `tutorial.report.3` "The rest, I miss."
- `store.starter.nonna` "I pack it myself. Like a lunch, cara."
- downtown-1 p3 "In my day, the pizza WAS the marketing."

FIXED SINCE LAST REVIEW: S71, S87, S95, S98, D545.
STILL OPEN FROM LAST REVIEW: S48, S67, S89, S97.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer or explain it in the info sheet; Julien's call. Carried |
| S67 | minor | T | cities/boston/scenes/north-end.ts:16 boston-0 p1 | Backdrop still `shop`; change to `downtown` |
| S89 | minor | U | components/goal-model.ts nextTask, shot 175 | Bar says "Hire Lucia" while list leads with "Serve 424 pies"; follow list order or mark the pick |
| S97 | minor | E | scripts/review fixtures | No shot shows a symptom bark, manager line or Ox line; add one fixture each |
| S105 | minor | T | copy/home/tutorial.ts `tutorial.report.3` | Trim to "Dashed line, cara: my customers. Served stops at my shortest bar. The rest, I miss."; check against "Hungry crowd" row |

Next IDs: S106
