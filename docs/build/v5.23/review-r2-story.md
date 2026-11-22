# v5.23-r2 story review, round 2 (medium re-check)

Scope: `docs/story/COPY-v5.23.md` against the r2 review shots 175d, 195-197, 206, 206b, 207, 208, 208b, 210, 64b. No cut-scene changed, so there are no hook notes. I grepped `src/` to check whether the carried COPY §7 fixes landed.

VERDICT: NOT SATISFIED
SUMMARY: The Store's money copy is now honest. Pinch shows "First buy pays double: 160 diamonds", and the Starter's "Most diamonds per dollar" line only appears once the first-buy bonuses are spent, when it is true. The booster shelf is clean. The verdict stays NOT SATISFIED because none of the eight carried COPY §7 fixes has landed in `src/` (they are minors), and there is one new minor, a "Best rate" clash.

HOOKS:
- none. No scene changed.

STORY & PACING:
- S67 [minor] Still open. `north-end.ts:16` boston-0 p1 is still `panel('shop', ...)` with "Port Marinara." Land the `downtown` backdrop.
- S71 [minor] Still open. `downtown.ts:45` still reads "Fine. First you bake. Tap the kitchen, one batch each tap. Tap, tap, tap!" Land "Fine. First you bake. I show you how. Watch, then tap!"
- D545 [minor] Still open. `chapter.downtown-1.line` is not in `chapters.ts`.

PLAYER COMMUNICATION:
- S99 [was major] FIXED. Shot 206b: "80 / First buy pays double: 160 diamonds", Box "400 +100 bonus / ... 1,000 diamonds", Crate "800 +400 bonus / ... 2,400 diamonds". The sums are right. In shot 206 the Starter card no longer shows the "Most diamonds per dollar" claim. In shot 208 (first buys used) it appears, and it is true then (about 134 per dollar against Crate's 120).
- S100 [minor] FIXED. Shot 64b shows "Yours / Buy" with no empty-shelf text.
- S101 [minor] FIXED. Shots 196 and 197 show "Rush Hour running · 58 m left" and "Big Night running · 12 h 58 m left".
- S102 [minor] FIXED. The descriptions are now flavor lines only, and the tag carries "2× · 1 h".
- S103 [minor] Still open, reworded but not fixed. Shot 207 reads "Every ad reward at one tap, no ad." and then "You watched 5 ads this week. With Plus: same rewards, no ads." The second line repeats the first. Use "You watched 5 ads this week. Plus skips all 5."
- S104 [minor] New. Shot 208/208b: after the first buys are spent, the Starter card says "Most diamonds per dollar in the store" while the Crate below it still carries a "Best rate" badge. Two "best" claims on one screen. Change `store.best` to "Best pack rate", or show the Starter claim as "Better rate than any pack".
- S98 [minor] Still open. `report.customers.row` "Hungry crowd" is not in `src/`.
- S95 [minor] Still open. `hooks.ts:72` "A gift, caro. Tap it!" and `voice.ts:201` "{n} pies, caro." Both still say "caro". Nonna says "cara" everywhere else.
- S87 [minor] Still open, and visible. Shot 175d shows the goal bar as "Ch 12 · Win the" cut off. `task.kind.bid.short` "Win Pier 9" is not in `chapters.ts`.
- S89 [minor] Still open, and visible in shot 175d. The task list's first unfinished task is "Serve 50K pies in Waterfront", but the bar shows "Win the ..." (the bid). The bar must follow list order. I changed the owner to U, because `src/components/goal-model.ts` is a top-level component file.
- S97 [minor] Still open. There is no new bark, manager or Ox fixture in the review set.
- S48 [minor] Still open (Julien's call).
- The looks counts are consistent. `looksFor` floors the diamonds against the 150 price and caps at the looks left, so Crate's "6 looks" is honest.

VOICE & COMEDY:
- `store.nudge` "In my day, we waited. Today? The Store." (shot 195) is still optional: "In my day, we saved. Today? The Store." The setup is a player with 0 diamonds.
- The Starter card in shots 206 and 210 says its contents three times: the blurb ("400 diamonds, 2× income for 24 hours and the Founder awning") and then the three chips. This is the only repetition in the card. Optional: cut the blurb to Nonna's line plus the chips.

PROTECT:
- `store.starter.nonna` "I pack it myself. Like a lunch, cara."
- `tutorial.17` "Store in the phone! Modern ideas." (shot 210, in voice)
- `booster.dinner.desc` "Every table full, every candle lit." and `booster.bignight.desc` "The ovens sing till morning."
- Pinch / Box / Crate of Diamonds.
- `store.once` "Pay once. Yours forever."
- `booster.full` "Ay, the slot holds 24 h. Nothing spent." (shot 197). The "Nothing spent" reassurance is the right thing to say there.
- `tutorial.report.3` "Served stops at my shortest bar. The rest, I miss."

FIXED SINCE LAST REVIEW: S99, S100, S101, S102.
STILL OPEN FROM LAST REVIEW: S48, S67, S71, S87, S89, S95, S97, S98, S103, D545.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer or explain it in the info sheet; Julien's call. Carried |
| S67 | minor | T | cities/boston/scenes/north-end.ts:16 boston-0 p1 | Backdrop still `shop`; land COPY §7 `downtown` |
| S71 | minor | T | cities/home/scenes/downtown.ts:45 | Land COPY §7: "Fine. First you bake. I show you how. Watch, then tap!" |
| S87 | minor | T | copy/home/chapters.ts:122, shot 175d | Add `task.kind.bid.short` "Win Pier 9"; use it on the goal bar (now cut off as "Win the") |
| S89 | minor | U | components/goal-model.ts nextTask, shot 175d | Bar shows the bid while the list's first unfinished task is "Serve 50K pies"; follow list order |
| S95 | minor | T | hooks.ts:72 giftLine, voice.ts:201 | Nonna says "caro" there, "cara" elsewhere; land COPY §7 |
| S97 | minor | E | scripts/review fixtures | No shot shows a symptom bark, manager line or Ox line; add one fixture each |
| S98 | minor | T | copy/home/report.ts, shot 194 | Land `report.customers.row` "Hungry crowd"; add drivers-bottleneck fixture |
| D545 | minor | T | copy/home/chapters.ts downtown-1 | Add `chapter.downtown-1.line` from COPY §7 |
| S103 | minor | T | copy/home/store.ts `store.plus.ads`, shot 207 | "You watched 5 ads this week. Plus skips all 5." (current text repeats "no ad") |
| S104 | minor | T | copy/home/store.ts `store.best` + `store.starter.rate`, shots 208, 208b | Two "best" claims on one screen; rename badge to "Best pack rate" |

Next IDs: S105
