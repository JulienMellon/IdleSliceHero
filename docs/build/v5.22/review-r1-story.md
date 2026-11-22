# v5.22 story review, round 1 (medium)

Scope: `docs/story/COPY-v5.22.md` (symptom barks, manager lines, report words, report tutorial, chapter task, carried fixes), the report and tutorial shots 130-137 and 181-194, plus 178j for S87. Report: `screenshots/v5.22/report.json` (no errors).

VERDICT: NOT SATISFIED
SUMMARY: The symptom barks are the best batch of crew lines so far: each one names a station and a visible pile or idle state, stays in its character's voice, and the funny word usually lands last. The main risk is that the Shop Report teaches "bar against the dashed line", but the Drivers row breaks that rule in every shot, and the tutorial never says what a bar that stops short of the line means.

HOOKS:
- none. No scene or teaser changed in this build. The report tutorial runs during Chapter 3 and adds a task ("Read the Downtown shop report", shot 194), which gives the early chapter one more short, finishable goal.

STORY & PACING:
- No scene changes. The carried fixes in COPY §6 (D545, S70, S71, S87, S67) are written but not in code yet: `tutorial.ts:17` and `downtown.ts:45` still have the old lines, `task.kind.bid.short` doesn't exist (shot 178j still reads "Ch 12 · Win the"), and `north-end.ts:16` still says `'shop'`. The copy itself is correct. These notes stay open until the lines land.
- D545 `chapter.downtown-1.line` "You have the keys, cara. Make Downtown smell like Rosa's again." [ok]: it is in voice and sets up `boston-0` "Last time, I gave you the keys to a shop."

PLAYER COMMUNICATION:
- S90 [major] The Drivers row contradicts what the report teaches. Shot 183: Customers 33/min, Drivers 15/min (well short of the dashed line), yet "Missed 0/min · Service 100%". Shot 182: Drivers 150/min is also below the line at 168, but the whole 42 missed comes from the Ovens. `tutorial.report.3` teaches the player to compare each bar with the line, so the first time Drivers sits below it and nothing is missed, the player stops trusting the sheet. → Measure Drivers against delivery demand only: draw its own tick on that row, or scale the row to the delivery share, so that every bar stopping short of the line means missed customers.
- S91 [minor] The tutorial names the parts but never says what they mean together. `tutorial.report.3` "And the dashed line? How many customers want a pizza, every minute." The player learns the strip, one bar and the line, but not "short of the line = missed". This can stay a symptom and still not prescribe. → `tutorial.report.3`: "The dashed line is my customers. A bar stops short? Those, I miss."
- S92 [minor] Shot 194: step 3 highlights the "Customers 168/min" label, not the dashed line the bubble asks about. → Make the highlight include the dashed line down the bars (`report:demand` target), or point the hand at the line.
- S93 [minor] Shot 185: "You" sits in the empty Ovens bar beside "0/min". Read together, they say "you = 0". → `report.you`: "You tap", or show the tap rate when the player bakes.
- S88, S89, S48 carried (see table). Shot 194 shows the bar going to "Serve 941 pies" once the report task is done, which fits S89's rule, but the 175d case isn't in this build's review shots.
- S97 [minor] None of the 36 new barks or 12 manager lines appears in any shot (186-191 show the states with no bubble). That leaves fit, wrapping and the Ox stage-direction style unchecked. → Add one fixture shot each for a pile bark, an idle bark, a manager line and an Ox line.

VOICE & COMEDY:
- S94 [minor] Three oven-idle lines are the same sentence: Hank "A hot fire, nothing in it. Sad, sport.", Gus "Hot oven, nothing in it. Dead calm.", Mei "Oven's at temp. Empty. Control group." → Gus: "Oven's hot, hold's empty. Dead calm." Hank: "Fire's lit, nothing on it. Sad cookout, sport."
- S95 [minor] Nonna Rosa's address to the player isn't consistent. The gift bubble (shots 131, 181, 182; `hooks.ts:72`) says "A gift, caro. Tap it!" and `voice.ts:136` says "{n} pies, caro." The report tutorial, right below on the same screen, says "cara". → Pick one form for every line: "A gift, cara. Tap it!" and "{n} pies, cara."
- S96 [minor] Three lines are weak or misread:
  - `manager.downtown.line` "A line at my door! Like the old days!" sounds like good news, but it is a shortfall symptom. → "A line at my door! Like the old days. They waited then, too."
  - `bark.industrial.prep.idle` Stan "Hands idle. Break's still at the bell." doesn't parse. → "Hands idle. Not break yet. Bell says so."
  - `manager.university.line` Noor "Queue out the door. My favorite kind." leaves "kind" of what unclear. → "Queue out the door. First in, still waiting."
- Ox speaks only in stage directions ("(Ox stares into the empty oven. Sighs.)"), which is a good running bit, as long as the bubble shows it in italics or a different style (see S97).

PROTECT:
- Gus "Pies on the counter, listing to port."
- Marco "Hands free! I floured myself. For fun."
- Margot "Empty oven. I almost miss croissants."
- Raj "Free cycles. Optimizing my nap."
- Pierre "Nothing to roll. At last, time to sulk."
- Deb "Drivers just sitting. I'll remember."
- Sterling "Empty counter. I'm polishing the bell."
- Earlier protects: `downtown-2.teaser`, `industrial-4.teaser`, `chapter.done` "Every chapter done. Victor is waiting in Boston."

FIXED SINCE LAST REVIEW: n/a (S70, S71, S87 and S67 have copy in COPY-v5.22 §6 but nothing in code).
STILL OPEN FROM LAST REVIEW: S48, S67, S70, S71, S87, S88, S89.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer or explain it in the info sheet; Julien's call. Carried |
| S67 | minor | T | cities/boston/scenes/north-end.ts:16 boston-0 p1 | Backdrop still `shop`; land COPY §6 `downtown` |
| S70 | minor | T | copy/home/tutorial.ts:17 tutorial.12 | Land COPY §6: "Tap All. Every upgrade and every hire lives in there." |
| S71 | minor | T | cities/home/scenes/downtown.ts:45 | Land COPY §6: "Fine. First you bake. I show you how. Watch, then tap!" |
| S87 | minor | T | copy/home/chapters.ts, shot 178j "Ch 12 · Win the" | Land COPY §6 `task.kind.bid.short`: "Win Pier 9" |
| S88 | minor | U | goal bar, shot 179d | "Ch 1 · Serve" is dark text on the brown fill; use light text or a label chip |
| S89 | minor | E | goal-model.ts nextTask, shot 175d | Bar must show the first unfinished task in list order |
| S90 | major | E | report-model / Shop Report, shots 182, 183 | Drivers bar below the customers line yet Missed 0; measure Drivers against delivery demand only |
| S91 | minor | T | copy/home/tutorial.ts tutorial.report.3 | "The dashed line is my customers. A bar stops short? Those, I miss." |
| S92 | minor | U | Shop Report tutorial step 3, shot 194 | Highlight covers the label only; include the dashed line itself |
| S93 | minor | T | copy/home/report.ts report.you, shot 185 | "You" beside 0/min reads as "you = 0"; use "You tap" |
| S94 | minor | T | COPY §1 oven.idle Hank/Gus/Mei | Same sentence three times; Gus "Oven's hot, hold's empty. Dead calm." Hank "Fire's lit, nothing on it. Sad cookout, sport." |
| S95 | minor | T | hooks.ts:72 giftLine, voice.ts:136 | Nonna says "caro" there, "cara" elsewhere; use "cara" everywhere |
| S96 | minor | T | COPY §1-2 manager.downtown.line, Stan prep.idle, manager.university.line | Rewrites in review file: Nonna "They waited then, too."; Stan "Not break yet. Bell says so."; Noor "First in, still waiting." |
| S97 | minor | E | scripts/review fixtures | No shot shows a symptom bark, manager line or Ox line; add one fixture each |

Next IDs: S98
