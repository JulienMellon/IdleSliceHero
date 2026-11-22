# v5.22 story review, round 2 (medium re-check)

Scope: r1 open IDs re-checked against `screenshots/v5.22-r2/review/` (shots 181-185, 192-194, 137, 70, 178k, 179d) and the current source (`voice.ts`, `tutorial.ts`, `downtown.ts`, `north-end.ts`, `chapters.ts`, `hooks.ts`). No scene or teaser changed, so there are no hook notes.

VERDICT: NOT SATISFIED
SUMMARY: The Shop Report now follows the rule it teaches. The Drivers row is gone, a Customers row sits under the dashed line, and every bar that stops short of the line matches a Missed count above zero. The verdict stays NOT SATISFIED only because of the count of open minors (ten, against a limit of three); none of them is major, and four are carried copy fixes that are written but not in code.

HOOKS:
- none. No scene changed.

S90 VERDICT: RESOLVED.
- Shot 182: Ovens 126/min is the only bar short of the line at 168, and Missed is 42/min (168 - 126). Prep 446 and Counter 545 are above the line.
- Shot 183: every bar is above the line at 33, and Missed is 0.
- Shot 184: every bar is above the line at 105, and Missed is 0 with "Tips up".
- Shot 185: Ovens is at 0 (the "You tap" chip), the bar is short, and Missed is 168.
- The line "Drivers 150/min · Seats 18/min" now sums to the Customers figure (150 + 18 = 168; 15 + 18 = 33; 60 + 45 = 105). The contradiction the player could see in r1 no longer appears in any shot.
- Caveat: the fixture named `183-report-short-drivers` has no drivers shortfall (Missed 0), so no shot shows what the sheet does when deliveries are the bottleneck. This is a fixture gap, not a copy problem (see S98).

STORY & PACING:
- S67, S70, S71 and S87 are still not in code. `north-end.ts:16` still has `'shop'`; `tutorial.ts:17` is still "Tap All. Every upgrade in the shop lives in there."; `downtown.ts:45` is still "Fine. First you bake. Tap the kitchen, one batch each tap. Tap, tap, tap!"; `chapters.ts:122` has `task.kind.bid` and no `.bid.short`. The COPY §6 lines are correct, so these only need landing.
- D545 `chapter.downtown-1.line` is also not in `chapters.ts` (only title and teaser exist for downtown-1). It stays in COPY §6 until landed.

PLAYER COMMUNICATION:
- S91 [minor] `tutorial.report.3` "Dashed line, cara: my customers. Past my shortest bar? Those, I miss." now says what the line means (an improvement). But "past my shortest bar" is a hard read: the line sits past the bar, not the other way round. → "Dashed line, cara: my customers. A bar stops short of it? Those, I miss."
- S98 [minor] The word "Customers" now appears twice on the sheet: the header "Customers 168/min" (the dashed-line legend) and the bottom row "Customers 168/min" (shots 182-185). The row's bar ends at the dashed line, so it repeats the line. → Name the row for what it is: `report.demand` row label "Hungry crowd", or drop the row's number. Also add a fixture where deliveries are the bottleneck, so the sheet's drivers case is seen.
- S92 is resolved. Shot 194 highlights the whole chart, dashed line included, while Nonna says "Dashed line". Shot 193 highlights the Ovens row for "This bar is my ovens".
- S93 is resolved. Shot 185 shows a "You tap" chip beside 0/min, which no longer reads as "you = 0".
- S88 is resolved as far as the shots show: in 179d and 178k the "Ch 1 · Serve" label is light on the brown fill and readable. Re-open it if the label is dark on a device.
- S89 cannot be checked. 175d is "same" and is not in the review set; carried.
- S97 [minor] Still no shot shows a symptom bark, manager line or Ox line. Shot 70 shows a pre-existing bark ("Dough's flying! Duck, everybody!"); 137 shows none. → Add one fixture each for a pile bark, an idle bark, a manager line and Ox.

VOICE & COMEDY:
- S94 is resolved: Gus is "Oven's hot, hold's empty. Dead calm." (`voice.ts:77`). Hank is "Fire's lit, nothing on it. Sad, sport." Mei's "Holding at temp. No samples. Tragic." is different enough. The three no longer repeat one sentence.
- S96 is resolved: `voice.ts:121` has "Hands idle. Not break yet. Bell says so."; `voice.ts:171` has "Line at my door. They waited then, too."; `voice.ts:183` has "Queue's long. First in, still waiting."
- S95 [minor] still open. Nonna says "caro" at `hooks.ts:72` ("A gift, caro. Tap it!", visible in shots 182-185) and `voice.ts:201` ("{n} pies, caro."), but "cara" in every report tutorial line. → "A gift, cara. Tap it!" and "{n} pies, cara."

PROTECT:
- Gus "Pies on the counter, listing to port."
- Marco "Hands free! I floured myself. For fun."
- Margot "Empty oven. I almost miss croissants."
- Raj "Free cycles. Optimizing my nap."
- Pierre "Nothing to roll. At last, time to sulk."
- Deb "Drivers just sitting. I'll remember."
- Nonna "Line at my door. They waited then, too." (the sting is the last four words)
- `report.missed.zero` "Nobody walks out hungry. Bellissimo!"
- Earlier protects: `downtown-2.teaser`, `industrial-4.teaser`, `chapter.done` "Every chapter done. Victor is waiting in Boston."

FIXED SINCE LAST REVIEW: S90, S92, S93, S94, S96, S88 (visual check).
STILL OPEN FROM LAST REVIEW: S48, S67, S70, S71, S87, S89, S91 (reworded, still unclear), S95, S97. New: S98.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer or explain it in the info sheet; Julien's call. Carried |
| S67 | minor | T | cities/boston/scenes/north-end.ts:16 boston-0 p1 | Backdrop still `shop`; land COPY §6 `downtown` |
| S70 | minor | T | copy/home/tutorial.ts:17 tutorial.12 | Land COPY §6: "Tap All. Every upgrade and every hire lives in there." |
| S71 | minor | T | cities/home/scenes/downtown.ts:45 | Land COPY §6: "Fine. First you bake. I show you how. Watch, then tap!" |
| S87 | minor | T | copy/home/chapters.ts:122, shot 178j | Add `task.kind.bid.short` "Win Pier 9"; use it on the goal bar |
| S89 | minor | E | goal-model.ts nextTask, shot 175d | Bar must show the first unfinished task in list order; 175d not in r2 review set |
| S91 | minor | T | copy/home/tutorial.ts:24 tutorial.report.3 | "Dashed line, cara: my customers. A bar stops short of it? Those, I miss." |
| S95 | minor | T | hooks.ts:72 giftLine, voice.ts:201 | Nonna says "caro" there, "cara" elsewhere; use "cara" everywhere |
| S97 | minor | E | scripts/review fixtures | No shot shows a symptom bark, manager line or Ox line; add one fixture each |
| S98 | minor | T | copy/home/report.ts report.demand, shots 182-185 | "Customers" is both legend and bottom row; rename row "Hungry crowd"; add drivers-bottleneck fixture |

Next IDs: S99
